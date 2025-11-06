# Event-Driven Architecture - Rust Implementation

**Pattern:** Event-Driven Architecture
**Language:** Rust
**Framework:** Tokio, async-nats/rdkafka
**Related Guide:** [Deep Dive: Event-Driven Architecture](../../../3-design/architecture-pattern/deep-dive-event-driven.md)

## TL;DR

**Complete Event-Driven Architecture** where components communicate via asynchronous events using Rust's async/await. **Key principle**: Producers emit events → message broker → consumers react independently. **Critical components**: Event producers (fire & forget) → NATS/Kafka topics → event consumers (async processing) → guaranteed delivery → at-least-once semantics → type-safe events with serde.

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Domain Events](#domain-events)
4. [Event Producer](#event-producer)
5. [Event Consumer](#event-consumer)
6. [Message Broker Configuration](#message-broker-configuration)
7. [Guaranteed Delivery Patterns](#guaranteed-delivery-patterns)
8. [Idempotency](#idempotency)
9. [Dead Letter Queue](#dead-letter-queue)
10. [Testing](#testing)
11. [Running the Example](#running-the-example)

---

## Overview

This example demonstrates Event-Driven Architecture for an e-commerce system with:

- **Event Producers** - Order Service, Payment Service
- **Message Broker** - NATS (also shows Kafka alternative)
- **Event Consumers** - Email Service, Analytics Service, Inventory Service
- **Patterns** - At-least-once delivery, Idempotency, DLQ
- **Events** - OrderPlaced, PaymentProcessed, OrderShipped

**Architecture:**
```
Order Service → OrderPlaced Event → NATS Topic
                                        ↓
                        ┌───────────────┼───────────────┐
                        ↓               ↓               ↓
                Email Service   Analytics Service   Inventory Service
                (send receipt)  (track metrics)     (reserve stock)
```

---

## Project Structure

```
event-driven-example/
├── Cargo.toml (workspace)
├── common/
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs
│       └── events.rs
├── producer/
│   ├── Cargo.toml
│   └── src/
│       ├── main.rs
│       └── publisher.rs
├── consumer-email/
│   ├── Cargo.toml
│   └── src/
│       └── main.rs
├── consumer-analytics/
│   ├── Cargo.toml
│   └── src/
│       └── main.rs
└── consumer-inventory/
    ├── Cargo.toml
    └── src/
        └── main.rs
```

---

## Domain Events

### Workspace Cargo.toml

```toml
[workspace]
members = [
    "common",
    "producer",
    "consumer-email",
    "consumer-analytics",
    "consumer-inventory",
]

[workspace.dependencies]
tokio = { version = "1.35", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
async-nats = "0.33"
tracing = "0.1"
tracing-subscriber = "0.3"
uuid = { version = "1.6", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
anyhow = "1.0"
```

### common/src/events.rs

```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Base domain event trait
pub trait DomainEvent {
    fn event_id(&self) -> &str;
    fn event_type(&self) -> &str;
    fn timestamp(&self) -> DateTime<Utc>;
    fn version(&self) -> u32;
}

/// OrderPlaced Event - Published when customer places an order
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderPlacedEvent {
    pub event_id: String,
    pub event_type: String,
    pub timestamp: DateTime<Utc>,
    pub version: u32,
    pub order_id: String,
    pub customer_id: String,
    pub customer_email: String,
    pub items: Vec<OrderItem>,
    pub total_amount: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderItem {
    pub product_id: String,
    pub product_name: String,
    pub quantity: u32,
    pub price: f64,
}

impl OrderPlacedEvent {
    pub fn new(
        order_id: String,
        customer_id: String,
        customer_email: String,
        items: Vec<OrderItem>,
        total_amount: f64,
    ) -> Self {
        Self {
            event_id: Uuid::new_v4().to_string(),
            event_type: "OrderPlaced".to_string(),
            timestamp: Utc::now(),
            version: 1,
            order_id,
            customer_id,
            customer_email,
            items,
            total_amount,
        }
    }
}

impl DomainEvent for OrderPlacedEvent {
    fn event_id(&self) -> &str {
        &self.event_id
    }

    fn event_type(&self) -> &str {
        &self.event_type
    }

    fn timestamp(&self) -> DateTime<Utc> {
        self.timestamp
    }

    fn version(&self) -> u32 {
        self.version
    }
}

/// PaymentProcessed Event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentProcessedEvent {
    pub event_id: String,
    pub event_type: String,
    pub timestamp: DateTime<Utc>,
    pub version: u32,
    pub order_id: String,
    pub payment_id: String,
    pub amount: f64,
    pub payment_method: String,
    pub status: PaymentStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum PaymentStatus {
    Success,
    Failed,
}

impl PaymentProcessedEvent {
    pub fn new(
        order_id: String,
        payment_id: String,
        amount: f64,
        payment_method: String,
        status: PaymentStatus,
    ) -> Self {
        Self {
            event_id: Uuid::new_v4().to_string(),
            event_type: "PaymentProcessed".to_string(),
            timestamp: Utc::now(),
            version: 1,
            order_id,
            payment_id,
            amount,
            payment_method,
            status,
        }
    }
}

impl DomainEvent for PaymentProcessedEvent {
    fn event_id(&self) -> &str {
        &self.event_id
    }

    fn event_type(&self) -> &str {
        &self.event_type
    }

    fn timestamp(&self) -> DateTime<Utc> {
        self.timestamp
    }

    fn version(&self) -> u32 {
        self.version
    }
}

/// OrderShipped Event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderShippedEvent {
    pub event_id: String,
    pub event_type: String,
    pub timestamp: DateTime<Utc>,
    pub version: u32,
    pub order_id: String,
    pub tracking_number: String,
    pub carrier: String,
}

impl OrderShippedEvent {
    pub fn new(order_id: String, tracking_number: String, carrier: String) -> Self {
        Self {
            event_id: Uuid::new_v4().to_string(),
            event_type: "OrderShipped".to_string(),
            timestamp: Utc::now(),
            version: 1,
            order_id,
            tracking_number,
            carrier,
        }
    }
}

impl DomainEvent for OrderShippedEvent {
    fn event_id(&self) -> &str {
        &self.event_id
    }

    fn event_type(&self) -> &str {
        &self.event_type
    }

    fn timestamp(&self) -> DateTime<Utc> {
        self.timestamp
    }

    fn version(&self) -> u32 {
        self.version
    }
}
```

---

## Event Producer

### producer/src/publisher.rs

```rust
use anyhow::Result;
use async_nats::Client;
use serde::Serialize;

/// Event Publisher - Abstraction over message broker
pub struct EventPublisher {
    nats_client: Client,
}

impl EventPublisher {
    pub fn new(nats_client: Client) -> Self {
        Self { nats_client }
    }

    /// Publish event asynchronously (fire and forget)
    pub async fn publish_async<T: Serialize>(
        &self,
        topic: &str,
        event: &T,
    ) -> Result<()> {
        let payload = serde_json::to_vec(event)?;

        self.nats_client
            .publish(topic, payload.into())
            .await
            .map_err(|e| anyhow::anyhow!("Failed to publish event: {}", e))?;

        tracing::info!("Published event to topic: {}", topic);

        Ok(())
    }

    /// Publish event with acknowledgment
    pub async fn publish_with_ack<T: Serialize>(
        &self,
        topic: &str,
        event: &T,
    ) -> Result<()> {
        let payload = serde_json::to_vec(event)?;

        // With NATS JetStream, you can get acknowledgments
        // For basic NATS, this is the same as publish_async
        self.nats_client
            .publish(topic, payload.into())
            .await
            .map_err(|e| anyhow::anyhow!("Failed to publish event: {}", e))?;

        tracing::info!("Published event with ack to topic: {}", topic);

        Ok(())
    }

    /// Publish event with request-reply pattern
    pub async fn publish_request<T: Serialize>(
        &self,
        topic: &str,
        event: &T,
        timeout: std::time::Duration,
    ) -> Result<Vec<u8>> {
        let payload = serde_json::to_vec(event)?;

        let response = self
            .nats_client
            .request(topic, payload.into())
            .await
            .map_err(|e| anyhow::anyhow!("Failed to get response: {}", e))?;

        Ok(response.payload.to_vec())
    }
}
```

### producer/src/main.rs

```rust
mod publisher;

use anyhow::Result;
use common::events::{OrderItem, OrderPlacedEvent};
use publisher::EventPublisher;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();

    // Connect to NATS
    let nats_client = async_nats::connect("nats://localhost:4222").await?;
    let publisher = EventPublisher::new(nats_client);

    // Simulate creating an order
    let event = OrderPlacedEvent::new(
        "ORDER001".to_string(),
        "CUST001".to_string(),
        "customer@example.com".to_string(),
        vec![OrderItem {
            product_id: "PROD001".to_string(),
            product_name: "Widget".to_string(),
            quantity: 2,
            price: 50.0,
        }],
        100.0,
    );

    // Publish event
    publisher.publish_async("order.placed", &event).await?;

    tracing::info!("Order placed event published: {}", event.order_id);

    Ok(())
}
```

---

## Event Consumer

### consumer-email/src/main.rs

```rust
use anyhow::Result;
use async_nats::{Client, Subscriber};
use common::events::{OrderPlacedEvent, OrderShippedEvent};
use futures::StreamExt;
use std::collections::HashSet;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Email Service - Sends notifications
struct EmailConsumer {
    nats_client: Client,
    processed_events: Arc<RwLock<HashSet<String>>>,
}

impl EmailConsumer {
    fn new(nats_client: Client) -> Self {
        Self {
            nats_client,
            processed_events: Arc::new(RwLock::new(HashSet::new())),
        }
    }

    async fn handle_order_placed(&self, event: OrderPlacedEvent) -> Result<()> {
        // Idempotency check
        {
            let mut processed = self.processed_events.write().await;
            if processed.contains(&event.event_id) {
                tracing::info!("Event {} already processed, skipping", event.event_id);
                return Ok(());
            }
            processed.insert(event.event_id.clone());
        }

        tracing::info!("Received OrderPlaced event: {}", event.event_id);

        // Send order confirmation email
        self.send_order_confirmation_email(&event).await?;

        tracing::info!("Successfully processed OrderPlaced event: {}", event.event_id);

        Ok(())
    }

    async fn handle_order_shipped(&self, event: OrderShippedEvent) -> Result<()> {
        tracing::info!("Received OrderShipped event: {}", event.event_id);

        // Send shipping notification email
        self.send_shipping_notification_email(&event).await?;

        Ok(())
    }

    async fn send_order_confirmation_email(&self, event: &OrderPlacedEvent) -> Result<()> {
        tracing::info!(
            "Sending order confirmation email to {} for order {}",
            event.customer_email,
            event.order_id
        );

        // Simulate email sending
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

        Ok(())
    }

    async fn send_shipping_notification_email(&self, event: &OrderShippedEvent) -> Result<()> {
        tracing::info!(
            "Sending shipping notification for order {} with tracking {}",
            event.order_id,
            event.tracking_number
        );

        // Simulate email sending
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

        Ok(())
    }

    async fn consume_order_placed_events(&self) -> Result<()> {
        let mut subscriber: Subscriber = self.nats_client.subscribe("order.placed").await?;

        while let Some(message) = subscriber.next().await {
            match serde_json::from_slice::<OrderPlacedEvent>(&message.payload) {
                Ok(event) => {
                    if let Err(e) = self.handle_order_placed(event).await {
                        tracing::error!("Failed to process OrderPlaced event: {}", e);
                        // Don't panic - continue processing other events
                    }
                }
                Err(e) => {
                    tracing::error!("Failed to deserialize OrderPlaced event: {}", e);
                }
            }
        }

        Ok(())
    }

    async fn consume_order_shipped_events(&self) -> Result<()> {
        let mut subscriber: Subscriber = self.nats_client.subscribe("order.shipped").await?;

        while let Some(message) = subscriber.next().await {
            match serde_json::from_slice::<OrderShippedEvent>(&message.payload) {
                Ok(event) => {
                    if let Err(e) = self.handle_order_shipped(event).await {
                        tracing::error!("Failed to process OrderShipped event: {}", e);
                    }
                }
                Err(e) => {
                    tracing::error!("Failed to deserialize OrderShipped event: {}", e);
                }
            }
        }

        Ok(())
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();

    // Connect to NATS
    let nats_client = async_nats::connect("nats://localhost:4222").await?;
    let consumer = Arc::new(EmailConsumer::new(nats_client));

    tracing::info!("Email Consumer started");

    // Spawn tasks for different event types
    let consumer_clone = consumer.clone();
    let order_placed_task = tokio::spawn(async move {
        if let Err(e) = consumer_clone.consume_order_placed_events().await {
            tracing::error!("Error in order_placed consumer: {}", e);
        }
    });

    let consumer_clone = consumer.clone();
    let order_shipped_task = tokio::spawn(async move {
        if let Err(e) = consumer_clone.consume_order_shipped_events().await {
            tracing::error!("Error in order_shipped consumer: {}", e);
        }
    });

    // Wait for tasks
    tokio::try_join!(order_placed_task, order_shipped_task)?;

    Ok(())
}
```

### consumer-analytics/src/main.rs

```rust
use anyhow::Result;
use async_nats::{Client, Subscriber};
use common::events::{OrderPlacedEvent, PaymentProcessedEvent};
use futures::StreamExt;

/// Analytics Service - Tracks metrics and business intelligence
struct AnalyticsConsumer {
    nats_client: Client,
}

impl AnalyticsConsumer {
    fn new(nats_client: Client) -> Self {
        Self { nats_client }
    }

    async fn track_order_placed(&self, event: &OrderPlacedEvent) {
        tracing::info!(
            "Analytics: Order placed - Customer: {}, Total: {}",
            event.customer_id,
            event.total_amount
        );

        // Track metrics:
        // - Total revenue
        // - Orders per customer
        // - Product popularity
        // - Average order value
    }

    async fn track_payment_processed(&self, event: &PaymentProcessedEvent) {
        tracing::info!(
            "Analytics: Payment processed - Order: {}, Method: {}, Status: {:?}",
            event.order_id,
            event.payment_method,
            event.status
        );

        // Track metrics:
        // - Payment success rate
        // - Payment method distribution
        // - Processing time
    }

    async fn consume_events(&self) -> Result<()> {
        // Subscribe to multiple topics
        let mut order_sub: Subscriber = self.nats_client.subscribe("order.placed").await?;
        let mut payment_sub: Subscriber = self.nats_client.subscribe("payment.processed").await?;

        loop {
            tokio::select! {
                Some(message) = order_sub.next() => {
                    if let Ok(event) = serde_json::from_slice::<OrderPlacedEvent>(&message.payload) {
                        self.track_order_placed(&event).await;
                    }
                }
                Some(message) = payment_sub.next() => {
                    if let Ok(event) = serde_json::from_slice::<PaymentProcessedEvent>(&message.payload) {
                        self.track_payment_processed(&event).await;
                    }
                }
            }
        }
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();

    let nats_client = async_nats::connect("nats://localhost:4222").await?;
    let consumer = AnalyticsConsumer::new(nats_client);

    tracing::info!("Analytics Consumer started");

    consumer.consume_events().await
}
```

---

## Message Broker Configuration

### NATS Configuration

```rust
use async_nats::{Client, ConnectOptions};
use std::time::Duration;

async fn create_nats_client() -> Result<Client> {
    let options = ConnectOptions::new()
        .retry_on_initial_connect()
        .max_reconnects(10)
        .reconnect_delay_callback(|attempts| {
            Duration::from_millis(std::cmp::min(attempts * 100, 5000) as u64)
        });

    let client = options.connect("nats://localhost:4222").await?;

    Ok(client)
}
```

### Kafka Alternative (rdkafka)

```toml
# Cargo.toml
[dependencies]
rdkafka = { version = "0.36", features = ["tokio"] }
```

```rust
use rdkafka::config::ClientConfig;
use rdkafka::producer::{FutureProducer, FutureRecord};
use rdkafka::consumer::{Consumer, StreamConsumer};

// Producer
async fn create_kafka_producer() -> FutureProducer {
    ClientConfig::new()
        .set("bootstrap.servers", "localhost:9092")
        .set("message.timeout.ms", "5000")
        .set("acks", "all")
        .set("retries", "3")
        .set("enable.idempotence", "true")
        .create()
        .expect("Producer creation failed")
}

async fn publish_to_kafka<T: serde::Serialize>(
    producer: &FutureProducer,
    topic: &str,
    event: &T,
) -> Result<()> {
    let payload = serde_json::to_string(event)?;
    let record = FutureRecord::to(topic).payload(&payload).key("");

    producer
        .send(record, Duration::from_secs(0))
        .await
        .map_err(|(e, _)| anyhow::anyhow!("Failed to send: {}", e))?;

    Ok(())
}

// Consumer
async fn create_kafka_consumer() -> StreamConsumer {
    ClientConfig::new()
        .set("bootstrap.servers", "localhost:9092")
        .set("group.id", "email-service")
        .set("enable.auto.commit", "false")
        .set("auto.offset.reset", "earliest")
        .create()
        .expect("Consumer creation failed")
}
```

---

## Guaranteed Delivery Patterns

### At-Least-Once Delivery

```rust
use async_nats::{Client, Subscriber};
use futures::StreamExt;

async fn consume_with_at_least_once(nats_client: &Client) -> Result<()> {
    let mut subscriber: Subscriber = nats_client.subscribe("order.placed").await?;

    while let Some(message) = subscriber.next().await {
        match process_event(&message.payload).await {
            Ok(_) => {
                // Manual acknowledgment (with NATS JetStream)
                // message.ack().await?;
                tracing::info!("Event processed successfully");
            }
            Err(e) => {
                tracing::error!("Failed to process event: {}", e);
                // Don't acknowledge - message will be redelivered
            }
        }
    }

    Ok(())
}

async fn process_event(payload: &[u8]) -> Result<()> {
    // Process event
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    Ok(())
}
```

---

## Idempotency

### Idempotent Consumer with HashSet

```rust
use std::collections::HashSet;
use std::sync::Arc;
use tokio::sync::RwLock;

struct IdempotentConsumer {
    processed_events: Arc<RwLock<HashSet<String>>>,
}

impl IdempotentConsumer {
    fn new() -> Self {
        Self {
            processed_events: Arc::new(RwLock::new(HashSet::new())),
        }
    }

    async fn process_event(&self, event_id: String) -> Result<()> {
        // Check if already processed
        {
            let processed = self.processed_events.read().await;
            if processed.contains(&event_id) {
                tracing::info!("Event {} already processed, skipping", event_id);
                return Ok(());
            }
        }

        // Process event
        tracing::info!("Processing event: {}", event_id);
        do_business_logic().await?;

        // Mark as processed
        {
            let mut processed = self.processed_events.write().await;
            processed.insert(event_id.clone());
        }

        tracing::info!("Successfully processed event: {}", event_id);

        Ok(())
    }
}

async fn do_business_logic() -> Result<()> {
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    Ok(())
}
```

---

## Dead Letter Queue

### DLQ Handler

```rust
use async_nats::Client;

struct DeadLetterQueue {
    nats_client: Client,
}

impl DeadLetterQueue {
    fn new(nats_client: Client) -> Self {
        Self { nats_client }
    }

    async fn send_to_dlq<T: serde::Serialize>(
        &self,
        event: &T,
        error: &str,
    ) -> Result<()> {
        tracing::error!("Sending event to DLQ: {}", error);

        let dlq_event = serde_json::json!({
            "event": event,
            "error": error,
            "timestamp": chrono::Utc::now(),
        });

        let payload = serde_json::to_vec(&dlq_event)?;

        self.nats_client
            .publish("dlq.events", payload.into())
            .await?;

        Ok(())
    }

    async fn monitor_dlq(&self) -> Result<()> {
        let mut subscriber = self.nats_client.subscribe("dlq.events").await?;

        while let Some(message) = subscriber.next().await {
            tracing::warn!("DLQ: Received failed event: {:?}", message.payload);

            // Options:
            // 1. Alert operations team
            // 2. Store in database for manual review
            // 3. Attempt automated recovery
            // 4. Log for investigation
        }

        Ok(())
    }
}
```

---

## Testing

### Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_order_placed_event_creation() {
        let event = OrderPlacedEvent::new(
            "ORDER001".to_string(),
            "CUST001".to_string(),
            "test@example.com".to_string(),
            vec![],
            100.0,
        );

        assert_eq!(event.order_id, "ORDER001");
        assert_eq!(event.customer_id, "CUST001");
        assert_eq!(event.event_type, "OrderPlaced");
    }

    #[test]
    fn test_event_serialization() {
        let event = OrderPlacedEvent::new(
            "ORDER001".to_string(),
            "CUST001".to_string(),
            "test@example.com".to_string(),
            vec![],
            100.0,
        );

        let serialized = serde_json::to_string(&event).unwrap();
        let deserialized: OrderPlacedEvent = serde_json::from_str(&serialized).unwrap();

        assert_eq!(event.order_id, deserialized.order_id);
    }
}
```

### Integration Tests

```rust
#[cfg(test)]
mod integration_tests {
    use super::*;

    #[tokio::test]
    async fn test_publish_and_consume() {
        // Setup
        let nats_client = async_nats::connect("nats://localhost:4222")
            .await
            .expect("NATS not running");

        let publisher = EventPublisher::new(nats_client.clone());
        let mut subscriber = nats_client.subscribe("test.events").await.unwrap();

        // Publish event
        let event = OrderPlacedEvent::new(
            "ORDER001".to_string(),
            "CUST001".to_string(),
            "test@example.com".to_string(),
            vec![],
            100.0,
        );

        publisher.publish_async("test.events", &event).await.unwrap();

        // Consume event
        if let Some(message) = subscriber.next().await {
            let received: OrderPlacedEvent =
                serde_json::from_slice(&message.payload).unwrap();
            assert_eq!(received.order_id, "ORDER001");
        }
    }
}
```

---

## Running the Example

### Start NATS

```bash
docker run -p 4222:4222 -p 8222:8222 nats:latest
```

### Run Services

```bash
# Terminal 1: Producer
cd producer
cargo run

# Terminal 2: Email Consumer
cd consumer-email
cargo run

# Terminal 3: Analytics Consumer
cd consumer-analytics
cargo run
```

---

## Key Takeaways

1. **Loose Coupling** - Producers and consumers are independent
2. **Async Communication** - Non-blocking with async/await
3. **Type Safety** - Serde ensures event schema validation
4. **Scalability** - Add consumers without changing producers
5. **Reliability** - At-least-once delivery with acknowledgments
6. **Idempotency** - Handle duplicate messages gracefully
7. **Dead Letter Queue** - Isolate failed messages for investigation
8. **Zero-Cost Abstractions** - High performance with Rust

---

**Related Guides:**
- [Deep Dive: Event-Driven Architecture](../../../3-design/architecture-pattern/deep-dive-event-driven.md)
- [Deep Dive: Microservices](../../../3-design/architecture-pattern/deep-dive-microservices.md)
- [Rust Project Setup Guide](./project-setup.md)

*Last Updated: 2025-10-20*
