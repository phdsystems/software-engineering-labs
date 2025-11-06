# Event-Driven Architecture - Deep Dive

**Purpose:** Comprehensive guide to Event-Driven Architecture pattern, implementation strategies, and best practices
**Organization:** PHD Systems & PHD Labs
**Version:** 1.0
**Date:** 2025-10-20
**Parent Guide:** [Architecture Patterns Guide](overview.md)

---

## TL;DR

**Event-Driven Architecture (EDA) uses asynchronous events for component communication**. Producers emit events without knowing consumers; consumers react to events independently. **Use when:** real-time data processing, high scalability needs, loose coupling required, or IoT/streaming applications. **Avoid when:** simple request-response workflows, immediate consistency required, or team unfamiliar with async programming. **Key benefits:** Loose coupling, high scalability, resilience, easy to add consumers. **Critical challenges:** Eventual consistency, debugging complexity, message ordering, duplicate handling. **Core patterns:** Pub/Sub, Event Streaming, Event Notification, Event-Carried State Transfer.

---

## Table of Contents

- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Event-Driven Patterns](#event-driven-patterns)
- [Event Types](#event-types)
- [Message Brokers](#message-brokers)
- [Event Design Best Practices](#event-design-best-practices)
- [Guaranteed Delivery](#guaranteed-delivery)
- [Event Ordering](#event-ordering)
- [Exactly-Once Processing](#exactly-once-processing)
- [Dead Letter Queues](#dead-letter-queues)
- [Event Schema Evolution](#event-schema-evolution)
- [Monitoring and Observability](#monitoring-and-observability)
- [Testing Event-Driven Systems](#testing-event-driven-systems)
- [Common Pitfalls](#common-pitfalls)
- [Real-World Case Studies](#real-world-case-studies)
- [References](#references)

---

## Overview

**Event-Driven Architecture (EDA)** is an architectural pattern where components communicate by producing and consuming events asynchronously.

### Traditional vs. Event-Driven

**Traditional (Synchronous):**
```
Order Service → calls → Payment Service → waits for response
                      → calls → Inventory Service → waits for response
                      → calls → Notification Service → waits for response

Total time: Sum of all calls (blocking)
```

**Event-Driven (Asynchronous):**
```
Order Service → publishes "OrderCreated" event → Message Broker
                                                       ↓
                               ┌───────────────────────┼───────────────────────┐
                               ↓                       ↓                       ↓
                      Payment Service         Inventory Service      Notification Service
                      (listens & reacts)      (listens & reacts)    (listens & reacts)

Total time: Time to publish event (non-blocking, fast!)
Consumers process in parallel, asynchronously
```

---

## Core Concepts

### Event

**Immutable record of something that happened.**

```json
{
  "eventId": "evt_123",
  "eventType": "OrderCreated",
  "eventVersion": "1.0",
  "timestamp": "2025-10-20T12:00:00Z",
  "source": "order-service",
  "data": {
    "orderId": "ord_456",
    "customerId": "cust_789",
    "items": [
      {"productId": "prod_001", "quantity": 2, "price": 29.99}
    ],
    "totalAmount": 59.98
  },
  "metadata": {
    "correlationId": "req_123",
    "userId": "user_456"
  }
}
```

---

### Producer (Publisher)

**Component that emits events.**

```python
class OrderService:
    def __init__(self, event_bus):
        self.event_bus = event_bus

    def create_order(self, order_data):
        # Create order
        order = Order(order_data)
        order.save()

        # Publish event (fire and forget)
        event = OrderCreatedEvent(
            order_id=order.id,
            customer_id=order.customer_id,
            items=order.items,
            total=order.total
        )
        self.event_bus.publish("order.created", event)

        return order.id
```

**Key characteristics:**
- Fire and forget (doesn't wait for consumers)
- Doesn't know who consumes events
- Continues execution immediately

---

### Consumer (Subscriber)

**Component that listens to and reacts to events.**

```python
@event_listener("order.created")
class PaymentEventHandler:
    def handle(self, event: OrderCreatedEvent):
        """Process payment when order created."""
        try:
            payment = process_payment(
                customer_id=event.customer_id,
                amount=event.total
            )
            
            # Publish result
            self.event_bus.publish("payment.completed", PaymentCompletedEvent(
                order_id=event.order_id,
                payment_id=payment.id
            ))
        except PaymentFailedError as e:
            self.event_bus.publish("payment.failed", PaymentFailedEvent(
                order_id=event.order_id,
                reason=str(e)
            ))


@event_listener("order.created")
class InventoryEventHandler:
    def handle(self, event: OrderCreatedEvent):
        """Reserve inventory when order created."""
        for item in event.items:
            inventory.reserve(item.product_id, item.quantity)

        self.event_bus.publish("inventory.reserved", InventoryReservedEvent(
            order_id=event.order_id
        ))


@event_listener("order.created")
class NotificationEventHandler:
    def handle(self, event: OrderCreatedEvent):
        """Send confirmation email."""
        customer = get_customer(event.customer_id)
        send_email(
            to=customer.email,
            subject="Order Confirmation",
            body=f"Your order {event.order_id} has been received."
        )
```

**Key characteristics:**
- Listens to specific events
- Independent processing (doesn't block other consumers)
- Can fail without affecting other consumers

---

## Event-Driven Patterns

### 1. Event Notification

**Simple notification that something happened. Consumer fetches details.**

```python
# Producer: Minimal event (just notification)
event_bus.publish("user.registered", UserRegisteredEvent(user_id="user_123"))

# Consumer: Fetches details if needed
@event_listener("user.registered")
def send_welcome_email(event):
    user = user_service.get_user(event.user_id)  # Fetch details
    send_email(user.email, "Welcome!")
```

**Pros:**
- Small event payload
- Consumer controls what data to fetch

**Cons:**
- Extra network call to fetch data
- Source service must be available

---

### 2. Event-Carried State Transfer

**Event contains all data. Consumer doesn't need to call back.**

```python
# Producer: Complete data in event
event_bus.publish("user.registered", UserRegisteredEvent(
    user_id="user_123",
    email="alice@example.com",
    name="Alice",
    preferences={"newsletter": True}
))

# Consumer: All data in event (no extra call)
@event_listener("user.registered")
def send_welcome_email(event):
    send_email(event.email, f"Welcome {event.name}!")  # No fetch needed
```

**Pros:**
- No extra network calls
- Consumer independent (doesn't need source service)

**Cons:**
- Larger event payload
- Data duplication

---

### 3. Event Sourcing

**Store all state changes as events. Rebuild state by replaying.**

**See:** [Deep Dive: Event Sourcing](deep-dive-event-sourcing.md)

---

### 4. CQRS with Events

**Events sync write model to read models.**

**See:** [Deep Dive: CQRS](deep-dive-cqrs.md)

---

## Event Types

### Domain Events

**Business-significant events.**

```python
OrderCreatedEvent
PaymentCompletedEvent
InventoryReservedEvent
UserRegisteredEvent
```

**Characteristics:**
- Past tense (facts about what happened)
- Business domain language
- Long-lived (part of system contract)

---

### Integration Events

**Events for inter-service communication.**

```python
# Service A publishes
CustomerUpdatedEvent(customer_id, new_email)

# Service B listens
@event_listener("customer.updated")
def update_local_cache(event):
    local_cache.set(event.customer_id, event.new_email)
```

**Characteristics:**
- Cross-service boundary
- May include data denormalization
- Versioned (backward compatible)

---

### System Events

**Infrastructure/operational events.**

```python
ServiceStartedEvent
HealthCheckFailedEvent
CacheClearedEvent
```

**Characteristics:**
- Technical, not business domain
- For monitoring/operations
- May be ephemeral

---

## Message Brokers

### Apache Kafka

**Distributed event streaming platform.**

**When to use:**
- High throughput (millions of events/sec)
- Event replay needed (retain events)
- Stream processing (real-time analytics)

**Example:**

```python
from kafka import KafkaProducer, KafkaConsumer

# Producer
producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

producer.send('order-events', {
    'eventType': 'OrderCreated',
    'orderId': 'ord_123',
    'customerId': 'cust_456'
})


# Consumer
consumer = KafkaConsumer(
    'order-events',
    bootstrap_servers=['localhost:9092'],
    value_deserializer=lambda m: json.loads(m.decode('utf-8')),
    group_id='payment-service'
)

for message in consumer:
    event = message.value
    if event['eventType'] == 'OrderCreated':
        process_payment(event['orderId'])
```

**Pros:**
- Extremely high throughput
- Durable (events persisted to disk)
- Replay events (consumers can rewind)
- Partitioning for parallelism

**Cons:**
- Complex operational overhead
- Ordering per partition only
- Eventual consistency

---

### RabbitMQ

**Traditional message broker with queues.**

**When to use:**
- Traditional message queuing
- Priority queues
- Request-reply patterns
- Lower throughput (<100k msgs/sec)

**Example:**

```python
import pika

# Producer
connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

channel.queue_declare(queue='order-events')
channel.basic_publish(
    exchange='',
    routing_key='order-events',
    body=json.dumps({'eventType': 'OrderCreated', 'orderId': 'ord_123'})
)


# Consumer
def callback(ch, method, properties, body):
    event = json.loads(body)
    if event['eventType'] == 'OrderCreated':
        process_payment(event['orderId'])

channel.basic_consume(queue='order-events', on_message_callback=callback, auto_ack=True)
channel.start_consuming()
```

**Pros:**
- Mature, stable
- Flexible routing (exchanges, queues)
- Priority queues
- Dead letter queues

**Cons:**
- Lower throughput than Kafka
- No event replay by default
- More complex setup than cloud services

---

### AWS SNS + SQS

**Cloud-native pub/sub + queuing.**

**When to use:**
- AWS-native applications
- Serverless (Lambda triggers)
- Managed service (no ops)

**Example:**

```python
import boto3

# Producer (SNS)
sns = boto3.client('sns')
sns.publish(
    TopicArn='arn:aws:sns:us-east-1:123456789012:order-events',
    Message=json.dumps({'eventType': 'OrderCreated', 'orderId': 'ord_123'})
)


# Consumer (SQS)
sqs = boto3.client('sqs')
queue_url = 'https://sqs.us-east-1.amazonaws.com/123456789012/payment-queue'

while True:
    messages = sqs.receive_message(QueueUrl=queue_url, MaxNumberOfMessages=10)
    
    for message in messages.get('Messages', []):
        event = json.loads(message['Body'])
        process_payment(event['orderId'])
        
        # Delete message after processing
        sqs.delete_message(
            QueueUrl=queue_url,
            ReceiptHandle=message['ReceiptHandle']
        )
```

**Pros:**
- Fully managed (no ops)
- Auto-scaling
- Integration with Lambda (triggers)
- Low cost for moderate volume

**Cons:**
- AWS vendor lock-in
- Less flexible than Kafka
- Higher latency than self-hosted

---

## Event Design Best Practices

### 1. Use Past Tense

```python
✅ Good:
- OrderCreatedEvent
- PaymentProcessedEvent
- UserRegisteredEvent

❌ Bad:
- CreateOrderEvent (sounds like command)
- ProcessingPayment (present tense)
```

---

### 2. Include All Necessary Data

```json
✅ Good: Event-Carried State Transfer
{
  "eventType": "OrderCreated",
  "orderId": "ord_123",
  "customerId": "cust_456",
  "customerEmail": "alice@example.com",  // Denormalized
  "items": [...],
  "totalAmount": 100.00
}

❌ Bad: Minimal event (forces fetch)
{
  "eventType": "OrderCreated",
  "orderId": "ord_123"
  // Missing data → consumers must call order service
}
```

---

### 3. Include Metadata

```json
{
  "eventId": "evt_123",
  "eventType": "OrderCreated",
  "timestamp": "2025-10-20T12:00:00Z",
  "source": "order-service",
  "correlationId": "req_456",  // For distributed tracing
  "causationId": "evt_789",    // Which event caused this event
  "userId": "user_123",        // Audit trail
  "data": {...}
}
```

---

### 4. Version Events

```json
{
  "eventType": "OrderCreated",
  "eventVersion": "2.0",  // Version for schema evolution
  "data": {...}
}
```

---

## Guaranteed Delivery

### At-Least-Once Delivery

**Message delivered at least once (may be duplicated).**

**Implementation:**
- Producer retries on failure
- Consumer acknowledges after processing
- Message redelivered if no ack

**Challenge:** Handle duplicates.

```python
# Consumer must be idempotent
@event_listener("order.created")
def process_order(event):
    # Check if already processed
    if is_already_processed(event.order_id):
        return  # Skip duplicate

    # Process
    process_payment(event.order_id)

    # Mark as processed
    mark_processed(event.order_id)
```

---

### At-Most-Once Delivery

**Message delivered at most once (may be lost).**

**Implementation:**
- Producer sends once, doesn't retry
- Consumer acknowledges immediately (before processing)

**Use case:** Metrics, logging (acceptable to lose some)

---

### Exactly-Once Delivery

**Message delivered exactly once (no duplicates, no loss).**

**Implementation:**
- Transactional outbox pattern
- Idempotent consumer
- Deduplication

**See:** [Exactly-Once Processing](#exactly-once-processing)

---

## Event Ordering

### Problem

**Events may arrive out of order.**

```
Producer sends:
1. OrderCreated (t=1)
2. OrderUpdated (t=2)
3. OrderCancelled (t=3)

Consumer receives:
1. OrderCreated (t=1)
3. OrderCancelled (t=3)  ← Out of order!
2. OrderUpdated (t=2)
```

---

### Solution 1: Partitioning (Kafka)

**Events with same key go to same partition (ordered).**

```python
# Producer: Use order_id as key
producer.send(
    'order-events',
    key=order_id,  # Same order_id → same partition
    value=event
)

# Within a partition, events are ordered
```

---

### Solution 2: Sequence Numbers

**Include sequence number in event.**

```json
{
  "eventType": "OrderUpdated",
  "orderId": "ord_123",
  "sequenceNumber": 5,  // 5th event for this order
  "data": {...}
}
```

```python
# Consumer: Process only if sequence is next
@event_listener("order.updated")
def handle_order_updated(event):
    expected_seq = get_last_processed_sequence(event.order_id) + 1
    
    if event.sequence_number != expected_seq:
        # Out of order! Buffer and wait
        buffer_event(event)
        return
    
    process_event(event)
    set_last_processed_sequence(event.order_id, event.sequence_number)
```

---

## Exactly-Once Processing

### Transactional Outbox Pattern

**Problem:** Atomicity issue.

```python
# ❌ BAD: Not atomic
def create_order(order):
    db.save(order)  # Might succeed
    event_bus.publish(OrderCreatedEvent(...))  # Might fail
    # Result: Order saved, but event not published!
```

**Solution:** Transactional outbox.

```python
# ✅ GOOD: Atomic
def create_order(order):
    with db.transaction():
        db.save(order)
        
        # Save event to outbox table (same transaction!)
        db.insert_into_outbox({
            'event_type': 'OrderCreated',
            'payload': json.dumps(order.to_dict())
        })
    
    # Separate process polls outbox and publishes events
```

**Outbox publisher (background job):**

```python
def outbox_publisher():
    while True:
        events = db.query("SELECT * FROM outbox WHERE published = false LIMIT 100")
        
        for event in events:
            event_bus.publish(event.event_type, event.payload)
            db.execute("UPDATE outbox SET published = true WHERE id = ?", event.id)
        
        time.sleep(1)
```

---

### Idempotent Consumer

**Handle duplicates gracefully.**

```python
@event_listener("payment.completed")
def send_confirmation_email(event):
    # Check if already sent
    if email_sent_for_order(event.order_id):
        return  # Skip duplicate
    
    send_email(...)
    
    # Mark as sent
    mark_email_sent(event.order_id)
```

---

## Dead Letter Queues

**Queue for failed messages.**

```
Event → Consumer → Success → ACK
                 ↓
                Failure (after 3 retries)
                 ↓
            Dead Letter Queue
                 ↓
         Manual investigation/reprocessing
```

**Example (AWS SQS):**

```python
# Configure DLQ
sqs.set_queue_attributes(
    QueueUrl=queue_url,
    Attributes={
        'RedrivePolicy': json.dumps({
            'deadLetterTargetArn': dlq_arn,
            'maxReceiveCount': '3'  # Retry 3 times before DLQ
        })
    }
)


# Monitor DLQ
dlq_messages = sqs.receive_message(QueueUrl=dlq_url)
if dlq_messages:
    alert("Events in DLQ! Manual intervention needed")
```

---

## Event Schema Evolution

### Backward Compatible Changes

**Add optional fields (safe).**

```json
// V1
{
  "eventType": "OrderCreated",
  "orderId": "ord_123",
  "customerId": "cust_456"
}

// V2 (backward compatible)
{
  "eventType": "OrderCreated",
  "orderId": "ord_123",
  "customerId": "cust_456",
  "customerEmail": "alice@example.com"  // New optional field
}
```

**Old consumers ignore new field (works fine).**

---

### Breaking Changes

**Remove field or change type (incompatible).**

**Solution 1: New event type.**

```python
# V1
OrderCreatedEvent {...}

# V2 (new event type)
OrderCreatedEventV2 {...}

# Consumers listen to both during migration
@event_listener("order.created")
def handle_v1(event):
    ...

@event_listener("order.created.v2")
def handle_v2(event):
    ...
```

**Solution 2: Schema versioning.**

```json
{
  "eventType": "OrderCreated",
  "eventVersion": "2.0",  // Explicit version
  "data": {...}
}
```

---

## Monitoring and Observability

### Metrics

**Track:**
- Events published per second
- Events consumed per second
- Consumer lag (events waiting to be processed)
- Processing time per event
- Error rate

**Example (Prometheus):**

```python
from prometheus_client import Counter, Histogram

events_published = Counter('events_published_total', 'Total events published', ['event_type'])
event_processing_time = Histogram('event_processing_seconds', 'Event processing time', ['event_type'])

# Producer
events_published.labels(event_type='OrderCreated').inc()

# Consumer
with event_processing_time.labels(event_type='OrderCreated').time():
    process_event(event)
```

---

### Distributed Tracing

**Track events across services.**

```json
{
  "eventId": "evt_123",
  "eventType": "OrderCreated",
  "correlationId": "req_456",  // Same across all related events
  "causationId": "evt_789",     // Parent event ID
  "traceId": "trace_abc",       // OpenTelemetry trace ID
  "spanId": "span_def"
}
```

**Tools:** Jaeger, Zipkin, AWS X-Ray

---

## Testing Event-Driven Systems

### Unit Testing Event Handlers

```python
def test_payment_event_handler():
    # Mock dependencies
    mock_payment_service = Mock()
    handler = PaymentEventHandler(mock_payment_service)
    
    # Create event
    event = OrderCreatedEvent(
        order_id="ord_123",
        customer_id="cust_456",
        total=100.00
    )
    
    # Handle
    handler.handle(event)
    
    # Verify
    mock_payment_service.process_payment.assert_called_once_with(
        customer_id="cust_456",
        amount=100.00
    )
```

---

### Integration Testing with Test Broker

```python
def test_order_workflow():
    # Use in-memory broker for testing
    test_broker = InMemoryEventBus()
    
    # Wire up services
    order_service = OrderService(test_broker)
    payment_handler = PaymentEventHandler(test_broker)
    
    # Create order (publishes event)
    order_id = order_service.create_order(...)
    
    # Manually trigger event processing
    test_broker.process_pending_events()
    
    # Verify payment was processed
    payment = get_payment(order_id)
    assert payment is not None
```

---

### Contract Testing (Consumer-Driven Contracts)

```python
# Consumer defines expected event schema
@pact("order-service", "payment-service")
def payment_service_expects_order_created_event():
    return {
        "eventType": "OrderCreated",
        "orderId": "ord_123",
        "customerId": "cust_456",
        "totalAmount": 100.00
    }

# Producer verifies it meets contract
def test_producer_meets_contract():
    event = order_service.create_order_event(...)
    assert_matches_contract(event, payment_service_expects_order_created_event())
```

---

## Common Pitfalls

### 1. Event Storms ❌

**Problem:** One event triggers 100 more events (cascade).

**Fix:**
- Limit event chaining depth
- Use aggregation (batch events)
- Circuit breakers

---

### 2. Forgetting Idempotency ❌

**Problem:** Duplicate events cause duplicate processing (double charge).

**Fix:** Always make consumers idempotent.

---

### 3. Tight Coupling via Events ❌

**Problem:** Events contain too much source-specific data.

```json
❌ Bad:
{
  "eventType": "OrderCreated",
  "orderDbRow": {...}  // Internal database representation!
}
```

**Fix:** Use domain events (public contract).

---

### 4. Synchronous Event Handling ❌

**Problem:** Treating events like sync calls (waiting for result).

**Fix:** Embrace async (eventual consistency).

---

## Real-World Case Studies

### Netflix (Event-Driven Microservices)

**Scale:** Billions of events/day

**Use cases:**
- Video encoding pipeline (events trigger encoding jobs)
- Recommendations (user behavior events)
- Monitoring (system health events)

**Tech:** Apache Kafka, custom frameworks

---

### Uber (Event-Driven Dispatch)

**Scale:** 100M+ events/day

**Use cases:**
- Ride requests (trigger driver matching)
- Location updates (real-time tracking)
- Payment processing (async)

**Tech:** Apache Kafka, custom dispatch system

---

### Airbnb (Event-Driven Search)

**Use cases:**
- Listing updates (update search index)
- Booking events (update availability)
- Price changes (re-index)

**Tech:** Apache Kafka → Elasticsearch

---

## References

### Books

- Stopford, Ben. *Designing Event-Driven Systems*. O'Reilly, 2018.
  - Available: https://www.confluent.io/designing-event-driven-systems/
- Hohpe, Gregor and Woolf, Bobby. *Enterprise Integration Patterns*. Addison-Wesley, 2003.
  - https://www.enterpriseintegrationpatterns.com/

### Articles

- Fowler, Martin. "What do you mean by 'Event-Driven'?" (2017)
  - https://martinfowler.com/articles/201701-event-driven.html
- Richardson, Chris. "Event-Driven Architecture" - https://microservices.io/patterns/data/event-driven-architecture.html

### Tools

- **Apache Kafka** - https://kafka.apache.org/
- **RabbitMQ** - https://www.rabbitmq.com/
- **AWS EventBridge** - https://aws.amazon.com/eventbridge/
- **Google Cloud Pub/Sub** - https://cloud.google.com/pubsub

---

**Document Type:** Deep-Dive Guide
**Last Updated:** 2025-10-20
**Version:** 1.0
**Parent:** [Architecture Patterns Guide](overview.md)
