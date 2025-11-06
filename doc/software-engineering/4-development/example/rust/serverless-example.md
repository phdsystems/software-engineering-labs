# Serverless Architecture - Rust Implementation

**Pattern:** Serverless Architecture (FaaS)
**Language:** Rust
**Platform:** AWS Lambda (with cargo-lambda)
**Related Guide:** [Deep Dive: Serverless Architecture](../../../3-design/architecture-pattern/deep-dive-serverless.md)

## TL;DR

**Complete Serverless implementation** where Rust functions run in stateless containers triggered by events. **Key principle**: Write functions → compile to native binary → deploy to cloud → scale automatically → pay per execution. **Critical components**: Lambda handlers with lambda_runtime → event triggers (HTTP, S3, DynamoDB, SQS) → cold start optimization → type-safe events with serde → external state storage (DynamoDB/S3).

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [AWS Lambda Functions](#aws-lambda-functions)
4. [Event Triggers](#event-triggers)
5. [Cold Start Optimization](#cold-start-optimization)
6. [API Gateway Integration](#api-gateway-integration)
7. [State Management](#state-management)
8. [Testing](#testing)
9. [Deployment](#deployment)

---

## Overview

This example demonstrates Serverless Architecture with Rust on AWS Lambda:

- **HTTP API Handler** - REST API via API Gateway
- **S3 Event Handler** - Process file uploads (image resize)
- **DynamoDB Stream Handler** - React to table changes
- **SQS Queue Handler** - Process messages from queue
- **Patterns** - Cold start optimization, connection reuse, async processing

**Architecture:**
```
API Gateway → Lambda (HTTP)
                ↓
           DynamoDB

S3 Upload → Lambda (S3 trigger) → Process file → S3

DynamoDB Stream → Lambda (Stream) → Elasticsearch

SQS Queue → Lambda (SQS trigger) → Process message
```

---

## Project Structure

```
serverless-rust/
├── Cargo.toml (workspace)
├── http-handler/
│   ├── Cargo.toml
│   └── src/
│       └── main.rs
├── s3-handler/
│   ├── Cargo.toml
│   └── src/
│       └── main.rs
├── dynamodb-stream-handler/
│   ├── Cargo.toml
│   └── src/
│       └── main.rs
├── sqs-handler/
│   ├── Cargo.toml
│   └── src/
│       └── main.rs
└── common/
    ├── Cargo.toml
    └── src/
        ├── lib.rs
        └── models.rs
```

---

## AWS Lambda Functions

### Installation

```bash
# Install cargo-lambda
cargo install cargo-lambda

# Create new Lambda function
cargo lambda new my-function

# Build for Lambda (ARM64 or x86_64)
cargo lambda build --release --arm64

# Deploy function
cargo lambda deploy --iam-role arn:aws:iam::ACCOUNT:role/lambda-role
```

### Workspace Cargo.toml

```toml
[workspace]
members = [
    "http-handler",
    "s3-handler",
    "dynamodb-stream-handler",
    "sqs-handler",
    "common",
]

[workspace.dependencies]
lambda_runtime = "0.11"
lambda_http = "0.11"
tokio = { version = "1.35", features = ["macros"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tracing = "0.1"
tracing-subscriber = "0.3"
aws-sdk-dynamodb = "1.13"
aws-sdk-s3 = "1.13"
aws-config = "1.1"
anyhow = "1.0"
```

---

### 1. HTTP API Handler

**http-handler/Cargo.toml:**
```toml
[package]
name = "http-handler"
version = "0.1.0"
edition = "2021"

[dependencies]
lambda_http.workspace = true
lambda_runtime.workspace = true
tokio.workspace = true
serde.workspace = true
serde_json.workspace = true
tracing.workspace = true
tracing-subscriber.workspace = true
aws-sdk-dynamodb.workspace = true
aws-config.workspace = true
anyhow.workspace = true
uuid = { version = "1.6", features = ["v4"] }
```

**http-handler/src/main.rs:**
```rust
use aws_config::BehaviorVersion;
use aws_sdk_dynamodb::{types::AttributeValue, Client as DynamoDbClient};
use lambda_http::{run, service_fn, Body, Error, Request, Response};
use serde::{Deserialize, Serialize};
use std::env;
use tracing::info;
use uuid::Uuid;

/// Order request DTO
#[derive(Debug, Deserialize)]
struct CreateOrderRequest {
    customer_id: String,
    total_amount: f64,
}

/// Order response DTO
#[derive(Debug, Serialize)]
struct OrderResponse {
    order_id: String,
    customer_id: String,
    total_amount: f64,
    status: String,
}

/// Lambda function handler
async fn function_handler(
    event: Request,
    dynamodb_client: &DynamoDbClient,
) -> Result<Response<Body>, Error> {
    info!("Received request: {:?}", event.uri().path());

    match (event.method().as_str(), event.uri().path()) {
        ("POST", "/orders") => create_order(event, dynamodb_client).await,
        ("GET", path) if path.starts_with("/orders/") => {
            let order_id = path.trim_start_matches("/orders/");
            get_order(order_id, dynamodb_client).await
        }
        _ => Ok(Response::builder()
            .status(404)
            .body("Not Found".into())
            .unwrap()),
    }
}

/// Create order handler
async fn create_order(
    event: Request,
    dynamodb_client: &DynamoDbClient,
) -> Result<Response<Body>, Error> {
    // Parse request body
    let body = event.body();
    let request: CreateOrderRequest = serde_json::from_slice(body)?;

    // Generate order ID
    let order_id = Uuid::new_v4().to_string();

    // Get table name from environment
    let table_name = env::var("ORDERS_TABLE").unwrap_or_else(|_| "orders".to_string());

    // Save to DynamoDB
    dynamodb_client
        .put_item()
        .table_name(&table_name)
        .item("order_id", AttributeValue::S(order_id.clone()))
        .item("customer_id", AttributeValue::S(request.customer_id.clone()))
        .item(
            "total_amount",
            AttributeValue::N(request.total_amount.to_string()),
        )
        .item(
            "created_at",
            AttributeValue::N(chrono::Utc::now().timestamp().to_string()),
        )
        .send()
        .await?;

    info!("Created order: {}", order_id);

    // Build response
    let response = OrderResponse {
        order_id,
        customer_id: request.customer_id,
        total_amount: request.total_amount,
        status: "CREATED".to_string(),
    };

    let json = serde_json::to_string(&response)?;

    Ok(Response::builder()
        .status(201)
        .header("Content-Type", "application/json")
        .body(json.into())
        .unwrap())
}

/// Get order handler
async fn get_order(
    order_id: &str,
    dynamodb_client: &DynamoDbClient,
) -> Result<Response<Body>, Error> {
    let table_name = env::var("ORDERS_TABLE").unwrap_or_else(|_| "orders".to_string());

    let result = dynamodb_client
        .get_item()
        .table_name(&table_name)
        .key("order_id", AttributeValue::S(order_id.to_string()))
        .send()
        .await?;

    match result.item {
        Some(item) => {
            let order_id = item
                .get("order_id")
                .and_then(|v| v.as_s().ok())
                .unwrap_or_default();
            let customer_id = item
                .get("customer_id")
                .and_then(|v| v.as_s().ok())
                .unwrap_or_default();
            let total_amount = item
                .get("total_amount")
                .and_then(|v| v.as_n().ok())
                .and_then(|n| n.parse::<f64>().ok())
                .unwrap_or(0.0);

            let response = OrderResponse {
                order_id: order_id.to_string(),
                customer_id: customer_id.to_string(),
                total_amount,
                status: "RETRIEVED".to_string(),
            };

            let json = serde_json::to_string(&response)?;

            Ok(Response::builder()
                .status(200)
                .header("Content-Type", "application/json")
                .body(json.into())
                .unwrap())
        }
        None => Ok(Response::builder()
            .status(404)
            .body("Order not found".into())
            .unwrap()),
    }
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .without_time()
        .init();

    // Initialize AWS SDK (reused across invocations)
    let config = aws_config::load_defaults(BehaviorVersion::latest()).await;
    let dynamodb_client = DynamoDbClient::new(&config);

    run(service_fn(|event: Request| async {
        function_handler(event, &dynamodb_client).await
    }))
    .await
}
```

---

### 2. S3 Event Handler

**s3-handler/Cargo.toml:**
```toml
[package]
name = "s3-handler"
version = "0.1.0"
edition = "2021"

[dependencies]
lambda_runtime.workspace = true
tokio.workspace = true
serde.workspace = true
serde_json.workspace = true
tracing.workspace = true
tracing-subscriber.workspace = true
aws-sdk-s3.workspace = true
aws-config.workspace = true
aws-lambda-events = "0.15"
anyhow.workspace = true
image = "0.25"
bytes = "1.5"
```

**s3-handler/src/main.rs:**
```rust
use aws_config::BehaviorVersion;
use aws_lambda_events::event::s3::S3Event;
use aws_sdk_s3::Client as S3Client;
use bytes::Bytes;
use image::imageops::FilterType;
use lambda_runtime::{run, service_fn, Error, LambdaEvent};
use tracing::info;

/// S3 Event Handler - Triggered on file upload
/// Resizes images and saves thumbnails
async fn function_handler(
    event: LambdaEvent<S3Event>,
    s3_client: &S3Client,
) -> Result<String, Error> {
    let event = event.payload;

    info!("Received S3 event with {} records", event.records.len());

    for record in event.records {
        let bucket = record
            .s3
            .bucket
            .name
            .ok_or("Missing bucket name")?;
        let key = record
            .s3
            .object
            .key
            .ok_or("Missing object key")?;

        info!("Processing file: {}/{}", bucket, key);

        // Download image
        let object = s3_client
            .get_object()
            .bucket(&bucket)
            .key(&key)
            .send()
            .await?;

        let bytes = object.body.collect().await?.into_bytes();

        // Resize image
        let thumbnail_bytes = resize_image(bytes, 200, 200)?;

        // Upload thumbnail
        let thumbnail_key = format!("thumbnails/{}", key);
        s3_client
            .put_object()
            .bucket(&bucket)
            .key(&thumbnail_key)
            .body(thumbnail_bytes.into())
            .content_type("image/jpeg")
            .send()
            .await?;

        info!("Created thumbnail: {}", thumbnail_key);
    }

    Ok(format!("Successfully processed {} files", event.records.len()))
}

/// Resize image to thumbnail
fn resize_image(bytes: Bytes, width: u32, height: u32) -> Result<Vec<u8>, Error> {
    let img = image::load_from_memory(&bytes)?;
    let thumbnail = img.resize(width, height, FilterType::Lanczos3);

    let mut buffer = Vec::new();
    thumbnail.write_to(
        &mut std::io::Cursor::new(&mut buffer),
        image::ImageOutputFormat::Jpeg(90),
    )?;

    Ok(buffer)
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .without_time()
        .init();

    // Initialize AWS SDK
    let config = aws_config::load_defaults(BehaviorVersion::latest()).await;
    let s3_client = S3Client::new(&config);

    run(service_fn(|event: LambdaEvent<S3Event>| async {
        function_handler(event, &s3_client).await
    }))
    .await
}
```

---

### 3. DynamoDB Stream Handler

**dynamodb-stream-handler/src/main.rs:**
```rust
use aws_lambda_events::event::dynamodb::Event as DynamoDbEvent;
use lambda_runtime::{run, service_fn, Error, LambdaEvent};
use tracing::info;

/// DynamoDB Stream Handler - Triggered on table changes
/// Syncs data to Elasticsearch for search
async fn function_handler(event: LambdaEvent<DynamoDbEvent>) -> Result<String, Error> {
    let event = event.payload;

    info!(
        "Received DynamoDB stream event with {} records",
        event.records.len()
    );

    for record in event.records {
        let event_name = record.event_name.as_deref().unwrap_or("UNKNOWN");
        info!("Event: {}", event_name);

        match event_name {
            "INSERT" => handle_insert(record).await?,
            "MODIFY" => handle_modify(record).await?,
            "REMOVE" => handle_remove(record).await?,
            _ => info!("Unknown event type: {}", event_name),
        }
    }

    Ok(format!("Successfully processed {} records", event.records.len()))
}

async fn handle_insert(
    record: aws_lambda_events::event::dynamodb::EventRecord,
) -> Result<(), Error> {
    if let Some(new_image) = record.change.new_image {
        if let Some(order_id) = new_image.get("order_id").and_then(|v| v.s.as_ref()) {
            info!("Insert: {}", order_id);
            // Index in Elasticsearch
            index_in_elasticsearch(order_id, &new_image).await?;
        }
    }
    Ok(())
}

async fn handle_modify(
    record: aws_lambda_events::event::dynamodb::EventRecord,
) -> Result<(), Error> {
    if let Some(new_image) = record.change.new_image {
        if let Some(order_id) = new_image.get("order_id").and_then(|v| v.s.as_ref()) {
            info!("Modify: {}", order_id);
            // Update in Elasticsearch
            update_in_elasticsearch(order_id, &new_image).await?;
        }
    }
    Ok(())
}

async fn handle_remove(
    record: aws_lambda_events::event::dynamodb::EventRecord,
) -> Result<(), Error> {
    if let Some(old_image) = record.change.old_image {
        if let Some(order_id) = old_image.get("order_id").and_then(|v| v.s.as_ref()) {
            info!("Remove: {}", order_id);
            // Delete from Elasticsearch
            delete_from_elasticsearch(order_id).await?;
        }
    }
    Ok(())
}

async fn index_in_elasticsearch(
    order_id: &str,
    _data: &std::collections::HashMap<
        String,
        aws_lambda_events::event::dynamodb::AttributeValue,
    >,
) -> Result<(), Error> {
    info!("Indexing in Elasticsearch: {}", order_id);
    // TODO: Call Elasticsearch API
    Ok(())
}

async fn update_in_elasticsearch(
    order_id: &str,
    _data: &std::collections::HashMap<
        String,
        aws_lambda_events::event::dynamodb::AttributeValue,
    >,
) -> Result<(), Error> {
    info!("Updating in Elasticsearch: {}", order_id);
    Ok(())
}

async fn delete_from_elasticsearch(order_id: &str) -> Result<(), Error> {
    info!("Deleting from Elasticsearch: {}", order_id);
    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .without_time()
        .init();

    run(service_fn(function_handler)).await
}
```

---

### 4. SQS Queue Handler

**sqs-handler/src/main.rs:**
```rust
use aws_lambda_events::event::sqs::SqsEvent;
use lambda_runtime::{run, service_fn, Error, LambdaEvent};
use serde::{Deserialize, Serialize};
use tracing::info;

#[derive(Debug, Deserialize, Serialize)]
struct OrderMessage {
    order_id: String,
    customer_id: String,
    total_amount: f64,
}

/// SQS Queue Handler - Process messages from queue
async fn function_handler(event: LambdaEvent<SqsEvent>) -> Result<String, Error> {
    let event = event.payload;

    info!("Received SQS event with {} messages", event.records.len());

    for record in event.records {
        if let Some(body) = record.body {
            match serde_json::from_str::<OrderMessage>(&body) {
                Ok(message) => {
                    info!("Processing order: {}", message.order_id);
                    process_order(message).await?;
                }
                Err(e) => {
                    info!("Failed to parse message: {}", e);
                    // Send to DLQ or log for investigation
                }
            }
        }
    }

    Ok(format!("Successfully processed {} messages", event.records.len()))
}

async fn process_order(message: OrderMessage) -> Result<(), Error> {
    info!(
        "Processing order {} for customer {} with amount {}",
        message.order_id, message.customer_id, message.total_amount
    );

    // Business logic here
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .without_time()
        .init();

    run(service_fn(function_handler)).await
}
```

---

## Event Triggers

### AWS SAM Template

```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Globals:
  Function:
    Runtime: provided.al2023  # Custom runtime for Rust
    Architectures:
      - arm64
    Timeout: 30
    MemorySize: 512
    Environment:
      Variables:
        RUST_LOG: info

Resources:
  # HTTP API Function
  HttpApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: bootstrap  # Rust binary name
      CodeUri: ./http-handler/
      Events:
        CreateOrder:
          Type: Api
          Properties:
            Path: /orders
            Method: post
        GetOrder:
          Type: Api
          Properties:
            Path: /orders/{orderId}
            Method: get
      Environment:
        Variables:
          ORDERS_TABLE: !Ref OrdersTable
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref OrdersTable

  # S3 Trigger Function
  S3TriggerFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: bootstrap
      CodeUri: ./s3-handler/
      Events:
        S3Event:
          Type: S3
          Properties:
            Bucket: !Ref ImageBucket
            Events: s3:ObjectCreated:*
            Filter:
              S3Key:
                Rules:
                  - Name: prefix
                    Value: uploads/
                  - Name: suffix
                    Value: .jpg
      Policies:
        - S3CrudPolicy:
            BucketName: !Ref ImageBucket

  # DynamoDB Stream Function
  DynamoDBStreamFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: bootstrap
      CodeUri: ./dynamodb-stream-handler/
      Events:
        StreamEvent:
          Type: DynamoDB
          Properties:
            Stream: !GetAtt OrdersTable.StreamArn
            StartingPosition: TRIM_HORIZON
            BatchSize: 10

  # SQS Queue Function
  SqsQueueFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: bootstrap
      CodeUri: ./sqs-handler/
      Events:
        SqsEvent:
          Type: SQS
          Properties:
            Queue: !GetAtt OrderQueue.Arn
            BatchSize: 10

  # Resources
  OrdersTable:
    Type: AWS::DynamoDB::Table
    Properties:
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: order_id
          AttributeType: S
      KeySchema:
        - AttributeName: order_id
          KeyType: HASH
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES

  ImageBucket:
    Type: AWS::S3::Bucket

  OrderQueue:
    Type: AWS::SQS::Queue
    Properties:
      VisibilityTimeout: 90

Outputs:
  ApiUrl:
    Description: API Gateway endpoint URL
    Value: !Sub "https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/"
```

---

## Cold Start Optimization

### Techniques

```rust
use once_cell::sync::Lazy;
use std::sync::Arc;

// 1. Static initialization (reused across invocations)
static DYNAMODB_CLIENT: Lazy<Arc<DynamoDbClient>> = Lazy::new(|| {
    let rt = tokio::runtime::Runtime::new().unwrap();
    let config = rt.block_on(aws_config::load_defaults(BehaviorVersion::latest()));
    Arc::new(DynamoDbClient::new(&config))
});

// 2. Connection pooling
static HTTP_CLIENT: Lazy<reqwest::Client> = Lazy::new(|| {
    reqwest::Client::builder()
        .pool_max_idle_per_host(50)
        .build()
        .unwrap()
});

#[tokio::main]
async fn main() -> Result<(), Error> {
    // Initialize logging once
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

    // Reuse initialized clients
    let dynamodb_client = DYNAMODB_CLIENT.clone();

    run(service_fn(|event| async move {
        function_handler(event, &dynamodb_client).await
    }))
    .await
}
```

### Binary Size Optimization

```toml
# Cargo.toml
[profile.release]
opt-level = 'z'     # Optimize for size
lto = true          # Link-time optimization
codegen-units = 1   # Better optimization
strip = true        # Strip symbols
panic = 'abort'     # Smaller binary
```

---

## API Gateway Integration

### CORS Configuration

```rust
use lambda_http::{Response, Body};

fn build_response(status: u16, body: String) -> Response<Body> {
    Response::builder()
        .status(status)
        .header("Content-Type", "application/json")
        .header("Access-Control-Allow-Origin", "*")
        .header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
        .header("Access-Control-Allow-Headers", "Content-Type,Authorization")
        .body(body.into())
        .unwrap()
}
```

---

## State Management

### Using DynamoDB

```rust
use aws_sdk_dynamodb::{types::AttributeValue, Client as DynamoDbClient};

async fn save_data(
    dynamodb_client: &DynamoDbClient,
    table: &str,
    key: &str,
    value: &str,
) -> Result<(), Error> {
    dynamodb_client
        .put_item()
        .table_name(table)
        .item("id", AttributeValue::S(key.to_string()))
        .item("data", AttributeValue::S(value.to_string()))
        .item(
            "timestamp",
            AttributeValue::N(chrono::Utc::now().timestamp().to_string()),
        )
        .send()
        .await?;

    Ok(())
}

async fn get_data(
    dynamodb_client: &DynamoDbClient,
    table: &str,
    key: &str,
) -> Result<Option<String>, Error> {
    let result = dynamodb_client
        .get_item()
        .table_name(table)
        .key("id", AttributeValue::S(key.to_string()))
        .send()
        .await?;

    Ok(result
        .item
        .and_then(|item| item.get("data").and_then(|v| v.as_s().ok()))
        .map(|s| s.to_string()))
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
    fn test_resize_image() {
        let original = image::DynamicImage::new_rgb8(800, 600);
        let mut buffer = Vec::new();
        original
            .write_to(
                &mut std::io::Cursor::new(&mut buffer),
                image::ImageOutputFormat::Jpeg(90),
            )
            .unwrap();

        let result = resize_image(buffer.into(), 200, 200);
        assert!(result.is_ok());
    }
}
```

### Integration Tests

```rust
#[cfg(test)]
mod integration_tests {
    use super::*;
    use lambda_http::{Request, RequestExt};

    #[tokio::test]
    async fn test_create_order() {
        let request = Request::default();
        let body = r#"{"customer_id":"CUST001","total_amount":100.0}"#;
        // ... test implementation
    }
}
```

---

## Deployment

### Build and Deploy

```bash
# Build for ARM64 (cheaper and faster cold starts)
cargo lambda build --release --arm64

# Deploy single function
cargo lambda deploy http-handler \
  --iam-role arn:aws:iam::ACCOUNT:role/lambda-role

# Deploy with SAM
sam build
sam deploy --guided

# Deploy with AWS CDK (Rust)
cdk deploy
```

### Cargo Lambda Commands

```bash
# Create new function
cargo lambda new my-function

# Build
cargo lambda build --release

# Watch and rebuild on changes
cargo lambda watch

# Invoke locally
cargo lambda invoke http-handler --data-file events/create-order.json

# Deploy
cargo lambda deploy
```

---

## Key Takeaways

1. **Native Performance** - Rust compiles to native code (faster than interpreted languages)
2. **Small Binary Size** - Optimized Rust binaries are smaller than JVM/Node.js
3. **Fast Cold Starts** - Native binaries start faster (50-100ms vs 1-2s for Java)
4. **Memory Safety** - No runtime errors from null/undefined
5. **Type Safety** - Compile-time guarantees prevent many bugs
6. **Zero-Cost Abstractions** - High-level code without performance penalty
7. **Async/Await** - Built-in async runtime with Tokio
8. **AWS SDK** - First-class support for all AWS services

---

**Related Guides:**
- [Deep Dive: Serverless Architecture](../../../3-design/architecture-pattern/deep-dive-serverless.md)
- [Deep Dive: Event-Driven Architecture](../../../3-design/architecture-pattern/deep-dive-event-driven.md)
- [Rust Project Setup Guide](./project-setup.md)

*Last Updated: 2025-10-20*
