# Microservices Architecture - Rust Implementation

**Pattern:** Microservices Architecture
**Language:** Rust
**Framework:** Axum, Tokio, Tonic (gRPC)
**Related Guide:** [Deep Dive: Microservices](../../../3-design/architecture-pattern/deep-dive-microservices.md)

## TL;DR

**Complete microservices implementation** with Rust showing service decomposition, REST/gRPC communication, async messaging with Kafka, service discovery with Consul, and distributed tracing. **Key components**: Independent services → async HTTP/gRPC → message broker (Kafka/NATS) → distributed transactions with Saga pattern → observability with tracing.

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Service Implementation](#service-implementation)
4. [Service Discovery (Consul)](#service-discovery-consul)
5. [Inter-Service Communication](#inter-service-communication)
6. [Message Broker (NATS/Kafka)](#message-broker-natskafka)
7. [Saga Pattern Implementation](#saga-pattern-implementation)
8. [Configuration](#configuration)
9. [Running the Example](#running-the-example)

---

## Overview

This example demonstrates a complete e-commerce microservices system with:

- **Order Service** - Manages orders (Axum REST API)
- **Payment Service** - Processes payments (gRPC)
- **Inventory Service** - Manages stock (Axum REST API)
- **Notification Service** - Sends notifications (async message consumer)
- **API Gateway** - Single entry point (Axum with reverse proxy)
- **Message Broker** - NATS for events
- **Saga Orchestrator** - Distributed transaction coordination

**Architecture:**
```
Client → API Gateway (Axum)
              ↓
   ┌──────────┼──────────┐
   ↓          ↓          ↓
Order      Payment   Inventory
Service    Service   Service
(REST)     (gRPC)    (REST)
   ↓          ↓          ↓
     NATS Event Bus
           ↓
   Notification Service
```

---

## Project Structure

```
microservices-demo/
├── Cargo.toml (workspace)
├── api-gateway/
│   ├── Cargo.toml
│   └── src/
│       └── main.rs
├── order-service/
│   ├── Cargo.toml
│   └── src/
│       ├── main.rs
│       ├── models.rs
│       └── handlers.rs
├── payment-service/
│   ├── Cargo.toml
│   ├── build.rs
│   ├── proto/payment.proto
│   └── src/
│       ├── main.rs
│       └── service.rs
├── inventory-service/
│   ├── Cargo.toml
│   └── src/
│       ├── main.rs
│       └── handlers.rs
├── notification-service/
│   ├── Cargo.toml
│   └── src/
│       └── main.rs
└── saga-orchestrator/
    ├── Cargo.toml
    └── src/
        └── main.rs
```

---

## Service Implementation

### Workspace Cargo.toml

```toml
[workspace]
members = [
    "api-gateway",
    "order-service",
    "payment-service",
    "inventory-service",
    "notification-service",
    "saga-orchestrator",
]

[workspace.dependencies]
axum = "0.7"
tokio = { version = "1.35", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tower = "0.4"
tower-http = { version = "0.5", features = ["trace", "cors"] }
tracing = "0.1"
tracing-subscriber = "0.3"
uuid = { version = "1.6", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
async-nats = "0.33"
tonic = "0.11"
prost = "0.12"
reqwest = { version = "0.11", features = ["json"] }
```

### 1. Order Service

**order-service/Cargo.toml:**
```toml
[package]
name = "order-service"
version = "0.1.0"
edition = "2021"

[dependencies]
axum.workspace = true
tokio.workspace = true
serde.workspace = true
serde_json.workspace = true
tower.workspace = true
tower-http.workspace = true
tracing.workspace = true
tracing-subscriber.workspace = true
uuid.workspace = true
chrono.workspace = true
async-nats.workspace = true
```

**order-service/src/models.rs:**
```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Order {
    pub id: String,
    pub customer_id: String,
    pub product_id: String,
    pub quantity: u32,
    pub amount: f64,
    pub status: OrderStatus,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum OrderStatus {
    Pending,
    Confirmed,
    PaymentProcessing,
    Completed,
    Cancelled,
    Failed,
}

impl Order {
    pub fn new(customer_id: String, product_id: String, quantity: u32, amount: f64) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            customer_id,
            product_id,
            quantity,
            amount,
            status: OrderStatus::Pending,
            created_at: Utc::now(),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateOrderRequest {
    pub customer_id: String,
    pub product_id: String,
    pub quantity: u32,
    pub amount: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrderEvent {
    pub order_id: String,
    pub customer_id: String,
    pub product_id: String,
    pub quantity: u32,
    pub amount: f64,
    pub event_type: String,
}
```

**order-service/src/handlers.rs:**
```rust
use crate::models::{CreateOrderRequest, Order, OrderEvent, OrderStatus};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

pub type OrderStore = Arc<RwLock<HashMap<String, Order>>>;

pub async fn create_order(
    State(store): State<OrderStore>,
    State(nats_client): State<async_nats::Client>,
    Json(request): Json<CreateOrderRequest>,
) -> impl IntoResponse {
    // Create order
    let order = Order::new(
        request.customer_id.clone(),
        request.product_id.clone(),
        request.quantity,
        request.amount,
    );

    let order_id = order.id.clone();

    // Store order
    {
        let mut orders = store.write().await;
        orders.insert(order_id.clone(), order.clone());
    }

    // Publish event
    let event = OrderEvent {
        order_id: order_id.clone(),
        customer_id: request.customer_id,
        product_id: request.product_id,
        quantity: request.quantity,
        amount: request.amount,
        event_type: "OrderCreated".to_string(),
    };

    if let Ok(payload) = serde_json::to_vec(&event) {
        let _ = nats_client.publish("orders.created", payload.into()).await;
    }

    tracing::info!("Created order: {}", order_id);

    (StatusCode::CREATED, Json(order))
}

pub async fn get_order(
    State(store): State<OrderStore>,
    Path(order_id): Path<String>,
) -> impl IntoResponse {
    let orders = store.read().await;

    match orders.get(&order_id) {
        Some(order) => (StatusCode::OK, Json(order.clone())).into_response(),
        None => (StatusCode::NOT_FOUND, "Order not found").into_response(),
    }
}

pub async fn update_order_status(
    State(store): State<OrderStore>,
    Path(order_id): Path<String>,
    Json(status): Json<OrderStatus>,
) -> impl IntoResponse {
    let mut orders = store.write().await;

    match orders.get_mut(&order_id) {
        Some(order) => {
            order.status = status;
            (StatusCode::OK, Json(order.clone())).into_response()
        }
        None => (StatusCode::NOT_FOUND, "Order not found").into_response(),
    }
}
```

**order-service/src/main.rs:**
```rust
mod handlers;
mod models;

use axum::{routing::get, routing::post, Router};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tower_http::trace::TraceLayer;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    // Shared state
    let store = Arc::new(RwLock::new(HashMap::new()));

    // NATS connection
    let nats_client = async_nats::connect("nats://localhost:4222")
        .await
        .expect("Failed to connect to NATS");

    // Build router
    let app = Router::new()
        .route("/orders", post(handlers::create_order))
        .route("/orders/:order_id", get(handlers::get_order))
        .route("/orders/:order_id/status", post(handlers::update_order_status))
        .with_state(store)
        .with_state(nats_client)
        .layer(TraceLayer::new_for_http());

    let listener = tokio::net::TcpListener::bind("127.0.0.1:8081")
        .await
        .unwrap();

    tracing::info!("Order Service listening on http://127.0.0.1:8081");

    axum::serve(listener, app).await.unwrap();
}
```

---

### 2. Payment Service (gRPC)

**payment-service/proto/payment.proto:**
```protobuf
syntax = "proto3";

package payment;

service PaymentService {
  rpc ProcessPayment (PaymentRequest) returns (PaymentResponse);
  rpc GetPayment (GetPaymentRequest) returns (Payment);
}

message PaymentRequest {
  string order_id = 1;
  string customer_id = 2;
  double amount = 3;
}

message PaymentResponse {
  string payment_id = 1;
  bool success = 2;
  string message = 3;
}

message GetPaymentRequest {
  string payment_id = 1;
}

message Payment {
  string id = 1;
  string order_id = 2;
  string customer_id = 3;
  double amount = 4;
  string status = 5;
}
```

**payment-service/build.rs:**
```rust
fn main() {
    tonic_build::compile_protos("proto/payment.proto")
        .unwrap_or_else(|e| panic!("Failed to compile protos {:?}", e));
}
```

**payment-service/Cargo.toml:**
```toml
[package]
name = "payment-service"
version = "0.1.0"
edition = "2021"

[dependencies]
tokio.workspace = true
tonic.workspace = true
prost.workspace = true
uuid.workspace = true
tracing.workspace = true
tracing-subscriber.workspace = true
async-nats.workspace = true
serde.workspace = true
serde_json.workspace = true

[build-dependencies]
tonic-build = "0.11"
```

**payment-service/src/service.rs:**
```rust
use tonic::{Request, Response, Status};
use uuid::Uuid;

pub mod payment {
    tonic::include_proto!("payment");
}

use payment::{
    payment_service_server::PaymentService, GetPaymentRequest, Payment, PaymentRequest,
    PaymentResponse,
};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct PaymentServiceImpl {
    payments: Arc<RwLock<HashMap<String, Payment>>>,
    nats_client: async_nats::Client,
}

impl PaymentServiceImpl {
    pub fn new(nats_client: async_nats::Client) -> Self {
        Self {
            payments: Arc::new(RwLock::new(HashMap::new())),
            nats_client,
        }
    }
}

#[tonic::async_trait]
impl PaymentService for PaymentServiceImpl {
    async fn process_payment(
        &self,
        request: Request<PaymentRequest>,
    ) -> Result<Response<PaymentResponse>, Status> {
        let req = request.into_inner();

        tracing::info!("Processing payment for order: {}", req.order_id);

        // Simulate payment processing (90% success rate)
        let success = rand::random::<f32>() < 0.9;

        let payment_id = Uuid::new_v4().to_string();

        let payment = Payment {
            id: payment_id.clone(),
            order_id: req.order_id.clone(),
            customer_id: req.customer_id,
            amount: req.amount,
            status: if success { "SUCCESS" } else { "FAILED" }.to_string(),
        };

        // Store payment
        {
            let mut payments = self.payments.write().await;
            payments.insert(payment_id.clone(), payment);
        }

        // Publish event
        let event_type = if success {
            "PaymentSuccess"
        } else {
            "PaymentFailed"
        };

        let event = serde_json::json!({
            "order_id": req.order_id,
            "payment_id": payment_id,
            "success": success,
            "amount": req.amount,
        });

        if let Ok(payload) = serde_json::to_vec(&event) {
            let subject = if success {
                "payments.success"
            } else {
                "payments.failed"
            };
            let _ = self.nats_client.publish(subject, payload.into()).await;
        }

        let response = PaymentResponse {
            payment_id,
            success,
            message: if success {
                "Payment processed successfully".to_string()
            } else {
                "Payment failed".to_string()
            },
        };

        Ok(Response::new(response))
    }

    async fn get_payment(
        &self,
        request: Request<GetPaymentRequest>,
    ) -> Result<Response<Payment>, Status> {
        let req = request.into_inner();
        let payments = self.payments.read().await;

        match payments.get(&req.payment_id) {
            Some(payment) => Ok(Response::new(payment.clone())),
            None => Err(Status::not_found("Payment not found")),
        }
    }
}
```

**payment-service/src/main.rs:**
```rust
mod service;

use service::payment::payment_service_server::PaymentServiceServer;
use service::PaymentServiceImpl;
use tonic::transport::Server;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    // NATS connection
    let nats_client = async_nats::connect("nats://localhost:4222").await?;

    let payment_service = PaymentServiceImpl::new(nats_client);

    let addr = "127.0.0.1:8082".parse()?;

    tracing::info!("Payment Service (gRPC) listening on {}", addr);

    Server::builder()
        .add_service(PaymentServiceServer::new(payment_service))
        .serve(addr)
        .await?;

    Ok(())
}
```

---

### 3. Inventory Service

**inventory-service/src/main.rs:**
```rust
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tower_http::trace::TraceLayer;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Inventory {
    product_id: String,
    product_name: String,
    available_quantity: u32,
    reserved_quantity: u32,
}

type InventoryStore = Arc<RwLock<HashMap<String, Inventory>>>;

async fn reserve_inventory(
    State(store): State<InventoryStore>,
    Path(product_id): Path<String>,
    Json(quantity): Json<u32>,
) -> impl IntoResponse {
    let mut inventories = store.write().await;

    match inventories.get_mut(&product_id) {
        Some(inventory) if inventory.available_quantity >= quantity => {
            inventory.available_quantity -= quantity;
            inventory.reserved_quantity += quantity;
            (StatusCode::OK, Json(inventory.clone())).into_response()
        }
        Some(_) => (StatusCode::BAD_REQUEST, "Insufficient inventory").into_response(),
        None => (StatusCode::NOT_FOUND, "Product not found").into_response(),
    }
}

async fn get_inventory(
    State(store): State<InventoryStore>,
    Path(product_id): Path<String>,
) -> impl IntoResponse {
    let inventories = store.read().await;

    match inventories.get(&product_id) {
        Some(inventory) => (StatusCode::OK, Json(inventory.clone())).into_response(),
        None => (StatusCode::NOT_FOUND, "Product not found").into_response(),
    }
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    // Seed data
    let mut initial_inventory = HashMap::new();
    initial_inventory.insert(
        "PROD001".to_string(),
        Inventory {
            product_id: "PROD001".to_string(),
            product_name: "Widget".to_string(),
            available_quantity: 100,
            reserved_quantity: 0,
        },
    );

    let store = Arc::new(RwLock::new(initial_inventory));

    let app = Router::new()
        .route("/inventory/:product_id", get(get_inventory))
        .route(
            "/inventory/:product_id/reserve",
            post(reserve_inventory),
        )
        .with_state(store)
        .layer(TraceLayer::new_for_http());

    let listener = tokio::net::TcpListener::bind("127.0.0.1:8083")
        .await
        .unwrap();

    tracing::info!("Inventory Service listening on http://127.0.0.1:8083");

    axum::serve(listener, app).await.unwrap();
}
```

---

## Service Discovery (Consul)

### Service Registration

```rust
use serde_json::json;

async fn register_with_consul(
    service_name: &str,
    service_id: &str,
    port: u16,
) -> Result<(), Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();

    let registration = json!({
        "ID": service_id,
        "Name": service_name,
        "Port": port,
        "Check": {
            "HTTP": format!("http://localhost:{}/health", port),
            "Interval": "10s"
        }
    });

    client
        .put("http://localhost:8500/v1/agent/service/register")
        .json(&registration)
        .send()
        .await?;

    tracing::info!("Registered {} with Consul", service_name);

    Ok(())
}

// In main.rs
#[tokio::main]
async fn main() {
    // ... setup code ...

    register_with_consul("order-service", "order-1", 8081)
        .await
        .expect("Failed to register with Consul");

    // ... start server ...
}
```

---

## Inter-Service Communication

### REST Client

```rust
use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
struct ReserveInventoryRequest {
    quantity: u32,
}

async fn reserve_inventory_in_service(
    product_id: &str,
    quantity: u32,
) -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();

    let response = client
        .post(&format!(
            "http://localhost:8083/inventory/{}/reserve",
            product_id
        ))
        .json(&quantity)
        .send()
        .await?;

    if response.status().is_success() {
        Ok(())
    } else {
        Err("Failed to reserve inventory".into())
    }
}
```

### gRPC Client

```rust
use tonic::transport::Channel;
use payment::payment_service_client::PaymentServiceClient;
use payment::PaymentRequest;

pub mod payment {
    tonic::include_proto!("payment");
}

async fn call_payment_service(
    order_id: String,
    customer_id: String,
    amount: f64,
) -> Result<String, Box<dyn std::error::Error>> {
    let mut client = PaymentServiceClient::connect("http://localhost:8082").await?;

    let request = tonic::Request::new(PaymentRequest {
        order_id,
        customer_id,
        amount,
    });

    let response = client.process_payment(request).await?;
    let payment_response = response.into_inner();

    if payment_response.success {
        Ok(payment_response.payment_id)
    } else {
        Err("Payment failed".into())
    }
}
```

---

## Message Broker (NATS/Kafka)

### NATS Producer

```rust
use async_nats::Client;
use serde_json::json;

async fn publish_event(
    nats_client: &Client,
    subject: &str,
    event: serde_json::Value,
) -> Result<(), Box<dyn std::error::Error>> {
    let payload = serde_json::to_vec(&event)?;
    nats_client.publish(subject, payload.into()).await?;
    Ok(())
}
```

### NATS Consumer

```rust
use async_nats::{Client, Subscriber};
use futures::StreamExt;

async fn subscribe_to_events(
    nats_client: &Client,
    subject: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let mut subscriber: Subscriber = nats_client.subscribe(subject).await?;

    while let Some(message) = subscriber.next().await {
        if let Ok(event) = serde_json::from_slice::<serde_json::Value>(&message.payload) {
            tracing::info!("Received event: {:?}", event);

            // Process event
            process_event(event).await;
        }
    }

    Ok(())
}

async fn process_event(event: serde_json::Value) {
    // Handle event based on type
    if let Some(event_type) = event.get("event_type").and_then(|v| v.as_str()) {
        match event_type {
            "OrderCreated" => handle_order_created(event).await,
            "PaymentSuccess" => handle_payment_success(event).await,
            _ => tracing::warn!("Unknown event type: {}", event_type),
        }
    }
}

async fn handle_order_created(event: serde_json::Value) {
    tracing::info!("Handling OrderCreated: {:?}", event);
    // Send notification, process payment, etc.
}

async fn handle_payment_success(event: serde_json::Value) {
    tracing::info!("Handling PaymentSuccess: {:?}", event);
    // Reserve inventory, send confirmation, etc.
}
```

---

## Saga Pattern Implementation

### Saga Orchestrator

**saga-orchestrator/src/main.rs:**
```rust
use async_nats::Client;
use futures::StreamExt;
use serde_json::json;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone)]
enum SagaStep {
    OrderCreated,
    PaymentCompleted,
    PaymentFailed,
    InventoryReserved,
    InventoryFailed,
    Completed,
    Compensated,
}

#[derive(Debug, Clone)]
struct SagaState {
    order_id: String,
    step: SagaStep,
}

type SagaStore = Arc<RwLock<HashMap<String, SagaState>>>;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let nats_client = async_nats::connect("nats://localhost:4222").await?;
    let saga_store: SagaStore = Arc::new(RwLock::new(HashMap::new()));

    // Subscribe to events
    let mut order_created = nats_client.subscribe("orders.created").await?;
    let mut payment_success = nats_client.subscribe("payments.success").await?;
    let mut payment_failed = nats_client.subscribe("payments.failed").await?;

    tokio::spawn({
        let saga_store = saga_store.clone();
        async move {
            while let Some(message) = order_created.next().await {
                if let Ok(event) = serde_json::from_slice::<serde_json::Value>(&message.payload) {
                    handle_order_created(saga_store.clone(), event).await;
                }
            }
        }
    });

    tokio::spawn({
        let saga_store = saga_store.clone();
        let nats_client = nats_client.clone();
        async move {
            while let Some(message) = payment_success.next().await {
                if let Ok(event) = serde_json::from_slice::<serde_json::Value>(&message.payload) {
                    handle_payment_success(saga_store.clone(), nats_client.clone(), event).await;
                }
            }
        }
    });

    tokio::spawn({
        let saga_store = saga_store.clone();
        let nats_client = nats_client.clone();
        async move {
            while let Some(message) = payment_failed.next().await {
                if let Ok(event) = serde_json::from_slice::<serde_json::Value>(&message.payload) {
                    handle_payment_failed(saga_store.clone(), nats_client.clone(), event).await;
                }
            }
        }
    });

    tracing::info!("Saga Orchestrator running");

    tokio::signal::ctrl_c().await?;

    Ok(())
}

async fn handle_order_created(saga_store: SagaStore, event: serde_json::Value) {
    if let Some(order_id) = event.get("order_id").and_then(|v| v.as_str()) {
        let state = SagaState {
            order_id: order_id.to_string(),
            step: SagaStep::OrderCreated,
        };

        saga_store.write().await.insert(order_id.to_string(), state);

        tracing::info!("Saga started for order: {}", order_id);
    }
}

async fn handle_payment_success(
    saga_store: SagaStore,
    nats_client: Client,
    event: serde_json::Value,
) {
    if let Some(order_id) = event.get("order_id").and_then(|v| v.as_str()) {
        if let Some(state) = saga_store.write().await.get_mut(order_id) {
            state.step = SagaStep::PaymentCompleted;
            tracing::info!("Payment succeeded for order: {}", order_id);

            // Trigger inventory reservation (automatic via event)
        }
    }
}

async fn handle_payment_failed(
    saga_store: SagaStore,
    nats_client: Client,
    event: serde_json::Value,
) {
    if let Some(order_id) = event.get("order_id").and_then(|v| v.as_str()) {
        if let Some(state) = saga_store.write().await.get_mut(order_id) {
            state.step = SagaStep::PaymentFailed;
            compensate_order(&nats_client, order_id).await;
        }
    }
}

async fn compensate_order(nats_client: &Client, order_id: &str) {
    tracing::warn!("Compensating order: {}", order_id);

    let event = json!({
        "order_id": order_id,
        "event_type": "OrderCancelled",
    });

    if let Ok(payload) = serde_json::to_vec(&event) {
        let _ = nats_client.publish("orders.cancelled", payload.into()).await;
    }
}
```

---

## Configuration

### Environment Variables

```bash
# .env
ORDER_SERVICE_PORT=8081
PAYMENT_SERVICE_PORT=8082
INVENTORY_SERVICE_PORT=8083
NATS_URL=nats://localhost:4222
CONSUL_URL=http://localhost:8500
```

---

## Running the Example

### Prerequisites

```bash
# Start NATS
docker run -p 4222:4222 -p 8222:8222 nats:latest

# Start Consul (optional)
docker run -p 8500:8500 consul:latest agent -dev -ui -client=0.0.0.0
```

### Start Services

```bash
# Terminal 1: Order Service
cd order-service
cargo run

# Terminal 2: Payment Service
cd payment-service
cargo run

# Terminal 3: Inventory Service
cd inventory-service
cargo run

# Terminal 4: Saga Orchestrator
cd saga-orchestrator
cargo run
```

### Test

```bash
# Create order
curl -X POST http://localhost:8081/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUST001",
    "product_id": "PROD001",
    "quantity": 2,
    "amount": 99.99
  }'

# Get order
curl http://localhost:8081/orders/ORDER_ID
```

---

## Key Takeaways

1. **Service Independence** - Each service has its own database and lifecycle
2. **Async Communication** - NATS enables event-driven, non-blocking communication
3. **gRPC for Sync** - Tonic provides type-safe, efficient RPC
4. **Type Safety** - Rust's type system prevents many runtime errors
5. **Zero-Cost Abstractions** - High performance with minimal overhead
6. **Saga Pattern** - Distributed transactions with compensation
7. **Observability** - Tracing for debugging distributed systems

---

**Related Guides:**
- [Deep Dive: Microservices Architecture](../../../3-design/architecture-pattern/deep-dive-microservices.md)
- [Deep Dive: Event-Driven Architecture](../../../3-design/architecture-pattern/deep-dive-event-driven.md)
- [Rust Project Setup Guide](./project-setup.md)

*Last Updated: 2025-10-20*
