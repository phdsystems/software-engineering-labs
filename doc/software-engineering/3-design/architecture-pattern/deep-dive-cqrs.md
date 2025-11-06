# CQRS (Command Query Responsibility Segregation) - Deep Dive

**Purpose:** Comprehensive guide to CQRS pattern, implementation strategies, and best practices
**Organization:** PHD Systems & PHD Labs
**Version:** 1.0
**Date:** 2025-10-20
**Parent Guide:** [Architecture Patterns Guide](overview.md)

---

## TL;DR

**CQRS separates write operations (commands) from read operations (queries) using different models optimized for each**. Write side uses normalized domain model for consistency; read side uses denormalized views for performance. **Use when:** high read/write ratio disparity (1000:1), complex read queries needing denormalization, or different scaling requirements. **Avoid when:** simple CRUD apps, balanced read/write loads, or immediate consistency required. **Key benefits:** Independent scaling, optimized models, flexibility in storage. **Critical challenges:** Eventual consistency, increased complexity, data synchronization. **Perfect match with Event Sourcing** for complete audit trail + optimized queries.

---

## Table of Contents

- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [When to Use CQRS](#when-to-use-cqrs)
- [Command Side (Write Model)](#command-side-write-model)
- [Query Side (Read Model)](#query-side-read-model)
- [Synchronization Patterns](#synchronization-patterns)
- [Consistency Models](#consistency-models)
- [Implementation Patterns](#implementation-patterns)
- [CQRS + Event Sourcing](#cqrs--event-sourcing)
- [Testing CQRS Systems](#testing-cqrs-systems)
- [Common Pitfalls](#common-pitfalls)
- [Real-World Case Studies](#real-world-case-studies)
- [References](#references)

---

## Overview

**Traditional architecture:** Single model for reads and writes.

```
User Request → Controller → Domain Model → Database
                                ↑ ↓
                       (Same model for read and write)
```

**CQRS architecture:** Separate models for reads and writes.

```
Write Request → Command Handler → Write Model → Write Database
                                      ↓
                                 Events/Sync
                                      ↓
Read Request → Query Handler → Read Model ← Read Database
```

### Why CQRS?

**Problem with single model:**
- Optimized for neither reads nor writes
- Complex queries impact write performance
- Single database can't scale independently
- One size fits all (doesn't fit well)

**CQRS solution:**
- Write model: Normalized, ACID transactions, business rules
- Read model: Denormalized, fast queries, eventual consistency

---

## Core Concepts

### Commands

**Intent to change state (imperative).**

```python
class CreateOrderCommand:
    def __init__(self, order_id, customer_id, items):
        self.order_id = order_id
        self.customer_id = customer_id
        self.items = items

class CancelOrderCommand:
    def __init__(self, order_id, reason):
        self.order_id = order_id
        self.reason = reason
```

**Characteristics:**
- Named in imperative mood ("CreateOrder", "CancelOrder")
- Carry data needed for operation
- Can be validated before execution
- Can fail (business rule violations)

---

### Queries

**Request for data (interrogative).**

```python
class GetOrderDetailsQuery:
    def __init__(self, order_id):
        self.order_id = order_id

class ListCustomerOrdersQuery:
    def __init__(self, customer_id, page=1, page_size=20):
        self.customer_id = customer_id
        self.page = page
        self.page_size = page_size
```

**Characteristics:**
- Named as questions ("GetOrderDetails", "ListCustomerOrders")
- Don't modify state (read-only)
- Always succeed (might return empty results)
- Can be cached

---

### Command Handler

**Executes commands, enforces business rules.**

```python
class CreateOrderCommandHandler:
    def __init__(self, order_repository):
        self.order_repository = order_repository

    def handle(self, command: CreateOrderCommand):
        # Validate
        if not command.items:
            raise ValidationError("Order must have items")

        # Create aggregate
        order = Order.create(
            order_id=command.order_id,
            customer_id=command.customer_id,
            items=command.items
        )

        # Persist
        self.order_repository.save(order)

        return order.id
```

---

### Query Handler

**Fetches data from read model.**

```python
class GetOrderDetailsQueryHandler:
    def __init__(self, read_db):
        self.read_db = read_db

    def handle(self, query: GetOrderDetailsQuery):
        # Fetch from denormalized view
        return self.read_db.query("""
            SELECT
                o.order_id,
                o.customer_name,  -- Denormalized!
                o.total_amount,
                o.status,
                json_agg(oi.*) as items
            FROM order_view o
            JOIN order_items_view oi ON o.order_id = oi.order_id
            WHERE o.order_id = ?
            GROUP BY o.order_id
        """, query.order_id)
```

---

## When to Use CQRS

### ✅ Use CQRS When:

**1. High Read/Write Ratio**

```
E-commerce site:
- Writes: 100 orders/minute
- Reads: 100,000 product views/minute
Ratio: 1:1000
```

**CQRS benefit:** Scale read side independently (10x read replicas, 1x write primary).

---

**2. Complex Read Queries**

```sql
-- Traditional (slow joins)
SELECT o.*, c.name, c.email, p.name as product_name, ...
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE c.id = ?

-- CQRS read model (single table, fast!)
SELECT * FROM customer_orders_view WHERE customer_id = ?
```

---

**3. Different Scaling Requirements**

- Write side: Strong consistency, ACID transactions (PostgreSQL)
- Read side: Eventual consistency, high throughput (MongoDB, Redis)

---

**4. Multiple Read Models**

```
Single Write Model → Multiple Read Models:
- SQL view for reporting
- Elasticsearch for search
- Redis for real-time dashboard
- Graph DB for recommendations
```

---

### ❌ Avoid CQRS When:

**1. Simple CRUD Applications**

```python
# User profile management
# Read: GET /users/123
# Write: PUT /users/123

# Single model is fine!
```

---

**2. Balanced Read/Write Workload**

```
Chat application:
- Reads: 1000/sec
- Writes: 1000/sec
Ratio: 1:1 (not worth CQRS complexity)
```

---

**3. Immediate Consistency Required**

```
Banking transfer:
User clicks "Transfer $1000"
User immediately views balance
→ Must see new balance instantly (strong consistency needed)
```

---

## Command Side (Write Model)

### Normalized Domain Model

**Optimized for consistency and business rules.**

```python
# Order aggregate (write model)
class Order:
    def __init__(self, order_id, customer_id):
        self.order_id = order_id
        self.customer_id = customer_id
        self.items = []
        self.status = "pending"
        self.total = Decimal(0)

    def add_item(self, product_id, quantity, price):
        # Business rule: Can't add items to confirmed order
        if self.status != "pending":
            raise InvalidOperationError("Order already confirmed")

        item = OrderItem(product_id, quantity, price)
        self.items.append(item)
        self.total += quantity * price

    def confirm(self):
        # Business rule: Must have items
        if not self.items:
            raise ValidationError("Order must have items")

        self.status = "confirmed"
```

**Database schema (normalized):**

```sql
CREATE TABLE orders (
    order_id UUID PRIMARY KEY,
    customer_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE order_items (
    item_id UUID PRIMARY KEY,
    order_id UUID REFERENCES orders(order_id),
    product_id UUID NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL
);
```

---

### Command Processing

```python
class OrderCommandService:
    def __init__(self, order_repository, event_publisher):
        self.order_repository = order_repository
        self.event_publisher = event_publisher

    def create_order(self, command: CreateOrderCommand):
        # Create aggregate
        order = Order(command.order_id, command.customer_id)

        for item in command.items:
            order.add_item(item.product_id, item.quantity, item.price)

        # Save to write database
        self.order_repository.save(order)

        # Publish event (for read side)
        self.event_publisher.publish(OrderCreatedEvent(
            order_id=order.order_id,
            customer_id=order.customer_id,
            items=order.items,
            total=order.total
        ))

        return order.order_id
```

---

## Query Side (Read Model)

### Denormalized View

**Optimized for fast queries.**

```sql
-- Read model (denormalized, single table)
CREATE TABLE order_summary_view (
    order_id UUID PRIMARY KEY,
    customer_id UUID NOT NULL,
    customer_name VARCHAR(255) NOT NULL,  -- Denormalized!
    customer_email VARCHAR(255) NOT NULL, -- Denormalized!
    total_amount DECIMAL(10,2) NOT NULL,
    item_count INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    items JSONB NOT NULL  -- All items in one field!
);

CREATE INDEX idx_customer_orders ON order_summary_view(customer_id);
CREATE INDEX idx_order_status ON order_summary_view(status);
```

---

### Query Processing

```python
class OrderQueryService:
    def __init__(self, read_db):
        self.read_db = read_db

    def get_customer_orders(self, customer_id, page=1, page_size=20):
        offset = (page - 1) * page_size

        # Single table query (fast!)
        return self.read_db.query("""
            SELECT
                order_id,
                customer_name,
                total_amount,
                item_count,
                status,
                created_at
            FROM order_summary_view
            WHERE customer_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """, customer_id, page_size, offset)

    def get_order_details(self, order_id):
        # Single row, all data (no joins!)
        return self.read_db.query_one("""
            SELECT * FROM order_summary_view WHERE order_id = ?
        """, order_id)
```

---

## Synchronization Patterns

### Pattern 1: Event-Based Synchronization

**Write side publishes events → Read side listens.**

```python
# Write side: Publish event
@command_handler
def handle_create_order(command):
    order = create_order(command)
    event_bus.publish(OrderCreatedEvent(
        order_id=order.id,
        customer_id=order.customer_id,
        items=order.items,
        total=order.total
    ))

# Read side: Listen to events
@event_listener("OrderCreatedEvent")
def handle_order_created(event):
    # Get customer info (denormalize)
    customer = customer_service.get_customer(event.customer_id)

    # Update read model
    read_db.execute("""
        INSERT INTO order_summary_view
        (order_id, customer_id, customer_name, customer_email, total_amount, item_count, status, items)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, event.order_id, event.customer_id, customer.name, customer.email,
         event.total, len(event.items), "pending", json.dumps(event.items))
```

**Pros:**
- Loose coupling
- Async (doesn't block writes)
- Multiple read models can listen

**Cons:**
- Eventual consistency
- Events can be lost (need retry)

---

### Pattern 2: Database Triggers

**Write database triggers update read database.**

```sql
-- Write database trigger
CREATE TRIGGER order_created_trigger
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
    -- Update read database (via dblink or message queue)
    CALL update_read_model(NEW.order_id);
END;
```

**Pros:**
- Automatic synchronization
- No application code

**Cons:**
- Tight coupling (databases must be reachable)
- Complex trigger logic
- Hard to debug

---

### Pattern 3: Change Data Capture (CDC)

**Capture database changes → Stream to read side.**

```
Write DB (PostgreSQL)
    ↓
Debezium (CDC)
    ↓
Kafka Stream
    ↓
Read Model Builder
    ↓
Read DB (MongoDB/Elasticsearch)
```

**Pros:**
- Automatic (no application code)
- Reliable (Kafka guarantees)
- Low latency (<1 second)

**Cons:**
- Infrastructure complexity
- Requires CDC-capable database

---

## Consistency Models

### Strong Consistency

**Read always reflects latest write.**

```
User: Create order
Server: Order created (write DB)
Server: Update read model (synchronous)
User: View orders → Sees new order immediately
```

**Implementation:** Synchronous update of read model.

```python
def create_order(command):
    # Write to write DB
    order_id = write_db.insert_order(command)

    # Update read DB (synchronous!)
    read_db.insert_order_summary(order_id, ...)

    return order_id
```

**Pros:** No confusion for users
**Cons:** Slower writes, tight coupling

---

### Eventual Consistency

**Read eventually reflects write (delay acceptable).**

```
User: Create order
Server: Order created (write DB)
Server: Publish event (async)
        ↓
Read model updated (1-2 seconds later)
User: View orders → Might not see new order yet
```

**Implementation:** Async event-based sync.

**Pros:** Fast writes, loose coupling
**Cons:** User confusion ("Where's my order?")

---

### Handling Eventual Consistency UI

**Show user feedback while syncing.**

```javascript
// User creates order
const response = await createOrder(orderData);

// Show optimistic UI
showBanner("Order created! Processing...");

// Poll until visible in read model
while (!isOrderVisible(response.order_id)) {
    await sleep(500);
}

showBanner("Order ready!");
```

---

## Implementation Patterns

### Mediator Pattern (Clean Architecture)

```python
class Mediator:
    def __init__(self):
        self.handlers = {}

    def register_handler(self, message_type, handler):
        self.handlers[message_type] = handler

    def send(self, message):
        handler_type = type(message)
        handler = self.handlers.get(handler_type)
        if not handler:
            raise HandlerNotFoundError()

        return handler.handle(message)


# Register handlers
mediator = Mediator()
mediator.register_handler(CreateOrderCommand, CreateOrderCommandHandler())
mediator.register_handler(GetOrderDetailsQuery, GetOrderDetailsQueryHandler())

# Use
order_id = mediator.send(CreateOrderCommand(...))
order = mediator.send(GetOrderDetailsQuery(order_id))
```

---

### Repository Pattern

```python
# Write repository (command side)
class OrderWriteRepository:
    def save(self, order: Order):
        self.write_db.execute("""
            INSERT INTO orders (order_id, customer_id, status, total)
            VALUES (?, ?, ?, ?)
        """, order.order_id, order.customer_id, order.status, order.total)

        for item in order.items:
            self.write_db.execute("""
                INSERT INTO order_items (item_id, order_id, product_id, quantity, price)
                VALUES (?, ?, ?, ?, ?)
            """, item.item_id, order.order_id, item.product_id, item.quantity, item.price)


# Read repository (query side)
class OrderReadRepository:
    def get_customer_orders(self, customer_id):
        return self.read_db.query("""
            SELECT * FROM order_summary_view WHERE customer_id = ?
        """, customer_id)
```

---

## CQRS + Event Sourcing

**Perfect combination!**

```
Command → Aggregate → Emit Event → Event Store (Write Side)
                                        ↓
                                   Event Stream
                                        ↓
                             Projection (Read Side)
                                        ↓
                                Read Model (Queries)
```

**Benefits:**
- Complete audit trail (Event Sourcing)
- Fast queries (CQRS read models)
- Temporal queries (replay events)
- Multiple projections from same events

**Example:**

```python
# Command side (Event Sourcing)
class OrderAggregate:
    def create_order(self, command):
        event = OrderCreatedEvent(...)
        self.apply_event(event)
        self.uncommitted_events.append(event)

# Event handler (CQRS projection)
@event_listener("OrderCreatedEvent")
def build_order_summary(event):
    customer = get_customer(event.customer_id)
    read_db.execute("""
        INSERT INTO order_summary_view
        (order_id, customer_name, total, items)
        VALUES (?, ?, ?, ?)
    """, event.order_id, customer.name, event.total, json.dumps(event.items))
```

**See:** [Deep Dive: Event Sourcing](deep-dive-event-sourcing.md)

---

## Testing CQRS Systems

### Testing Command Handlers

```python
def test_create_order_command():
    # Arrange
    repo = InMemoryOrderRepository()
    handler = CreateOrderCommandHandler(repo)

    command = CreateOrderCommand(
        order_id="ord_123",
        customer_id="cust_456",
        items=[{"product_id": "prod_789", "quantity": 2, "price": 29.99}]
    )

    # Act
    order_id = handler.handle(command)

    # Assert
    order = repo.get(order_id)
    assert order.order_id == "ord_123"
    assert order.customer_id == "cust_456"
    assert len(order.items) == 1
    assert order.total == 59.98
```

---

### Testing Query Handlers

```python
def test_get_customer_orders_query():
    # Arrange
    read_db = TestDatabase()
    read_db.seed_order_summary({
        "order_id": "ord_123",
        "customer_id": "cust_456",
        "customer_name": "Alice",
        "total": 100.00
    })

    handler = GetCustomerOrdersQueryHandler(read_db)

    query = ListCustomerOrdersQuery(customer_id="cust_456")

    # Act
    orders = handler.handle(query)

    # Assert
    assert len(orders) == 1
    assert orders[0].order_id == "ord_123"
```

---

### Testing Eventual Consistency

```python
def test_order_visible_after_sync():
    # Create order (write side)
    order_id = create_order(CreateOrderCommand(...))

    # Wait for projection
    wait_for_projection(timeout=5)

    # Query (read side)
    order = get_order_details(order_id)

    assert order is not None
```

---

## Common Pitfalls

### 1. Synchronous Sync (Defeats Purpose) ❌

```python
# ❌ Bad: Synchronous sync (slow writes)
def create_order(command):
    order = save_to_write_db(command)
    update_read_db(order)  # Blocks write!
    return order.id
```

**Fix:** Async event-based sync.

---

### 2. Not Handling Eventual Consistency ❌

```python
# User flow:
# 1. Create order
# 2. Redirect to orders page
# 3. Order not visible yet! (Confused user)
```

**Fix:** Show "Processing..." feedback or poll until visible.

---

### 3. Over-Complicating Simple Queries ❌

```python
# ❌ Bad: CQRS for everything
GetUserName(user_id)  # Separate read model? Overkill!
```

**Fix:** CQRS for complex queries only. Simple queries can use write model directly.

---

### 4. Forgetting to Update Read Models ❌

```python
# Added new field to Order aggregate
# Forgot to update read model projection
# Read model shows old data!
```

**Fix:** Versioned projections, rebuilding capability.

---

## Real-World Case Studies

### Azure Service Bus

**Use case:** Message broker

**CQRS approach:**
- Write side: Commands to send messages (optimized for writes)
- Read side: Denormalized views for monitoring dashboards

**Benefits:** High write throughput + fast dashboard queries

---

### E-commerce Platform

**Use case:** Product catalog + orders

**CQRS approach:**
- Write side: Normalized orders (PostgreSQL)
- Read side: Elasticsearch for product search, Redis for real-time inventory

**Benefits:**
- 1000:1 read/write ratio handled easily
- Search optimized (Elasticsearch)
- Real-time inventory (Redis)

---

## References

### Books

- Young, Greg. "CQRS Documents" (2010) - https://cqrs.files.wordpress.com/2010/11/cqrs_documents.pdf
- Vernon, Vaughn. *Implementing Domain-Driven Design*. Addison-Wesley, 2013.

### Articles

- Fowler, Martin. "CQRS" (2011) - https://martinfowler.com/bliki/CQRS.html
- Richardson, Chris. "Pattern: Command Query Responsibility Segregation (CQRS)" - https://microservices.io/patterns/data/cqrs.html

### Frameworks

- **MediatR** (.NET) - https://github.com/jbogard/MediatR
- **Axon Framework** (Java) - https://axoniq.io/
- **NestJS CQRS** (TypeScript) - https://docs.nestjs.com/recipes/cqrs

---

**Document Type:** Deep-Dive Guide
**Last Updated:** 2025-10-20
**Version:** 1.0
**Parent:** [Architecture Patterns Guide](overview.md)
