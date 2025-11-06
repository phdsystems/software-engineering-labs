# Event Sourcing - Deep Dive

**Purpose:** Comprehensive guide to Event Sourcing pattern, implementation strategies, and best practices
**Organization:** PHD Systems & PHD Labs
**Version:** 1.0
**Date:** 2025-10-20
**Parent Guide:** [Architecture Patterns Guide](overview.md)

---

## TL;DR

**Event Sourcing stores all state changes as immutable events instead of current state**. Rebuild current state by replaying events. **Use when:** you need complete audit trail (finance, healthcare), time-travel capabilities, or event-driven systems. **Avoid when:** simple CRUD apps, no audit requirements, or team unfamiliar with pattern. **Key benefits:** Complete history, temporal queries, event replay, natural audit trail. **Critical challenges:** Event schema evolution, query performance (need CQRS), storage growth. **Core principle:** Events are immutable facts about the past. **Combine with CQRS** for optimized read models.

---

## Table of Contents

- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [When to Use Event Sourcing](#when-to-use-event-sourcing)
- [Event Store Design](#event-store-design)
- [Aggregates and Event Streams](#aggregates-and-event-streams)
- [Event Schema Design](#event-schema-design)
- [Snapshots for Performance](#snapshots-for-performance)
- [Querying Event-Sourced Systems](#querying-event-sourced-systems)
- [Event Versioning and Evolution](#event-versioning-and-evolution)
- [Combining with CQRS](#combining-with-cqrs)
- [Implementation Patterns](#implementation-patterns)
- [Testing Event-Sourced Systems](#testing-event-sourced-systems)
- [Common Pitfalls](#common-pitfalls)
- [Real-World Case Studies](#real-world-case-studies)
- [References](#references)

---

## Overview

**Event Sourcing** fundamentally changes how we think about storing data:

**Traditional approach:**
```
Current State: Account balance = $1000
(History lost - we don't know how we got here)
```

**Event Sourcing approach:**
```
Event Store:
1. AccountCreatedEvent {accountId: 123, initialBalance: 0}
2. DepositedEvent {amount: 1000, timestamp: T1}
3. WithdrewEvent {amount: 100, timestamp: T2}
4. DepositedEvent {amount: 100, timestamp: T3}

Current Balance = 0 + 1000 - 100 + 100 = $1000
(Complete history preserved!)
```

### Key Principles

1. **Events are immutable** - Never updated or deleted
2. **Events are facts** - Past tense: "OrderCreated", "PaymentProcessed"
3. **Current state is derived** - Replay events to rebuild state
4. **Append-only storage** - Events only added, never modified

---

## Core Concepts

### Event

**An immutable record of something that happened.**

```json
{
  "eventId": "evt_123",
  "eventType": "AccountDebited",
  "aggregateId": "acc_456",
  "aggregateType": "BankAccount",
  "timestamp": "2025-10-20T12:00:00Z",
  "version": 5,
  "data": {
    "amount": 100.00,
    "currency": "USD",
    "reason": "ATM withdrawal"
  },
  "metadata": {
    "userId": "user_789",
    "ipAddress": "192.168.1.1"
  }
}
```

**Key attributes:**
- `eventId` - Unique identifier
- `eventType` - What happened (past tense)
- `aggregateId` - Which entity this event belongs to
- `version` - Event sequence number for this aggregate
- `data` - Event-specific data
- `metadata` - Contextual information (user, IP, etc.)

---

### Event Stream

**Ordered sequence of events for a single aggregate.**

```
Account Stream (acc_456):
[v1] AccountCreatedEvent
[v2] DepositedEvent (amount: 1000)
[v3] WithdrewEvent (amount: 100)
[v4] DepositedEvent (amount: 50)
[v5] WithdrewEvent (amount: 100)

Current balance = 1000 - 100 + 50 - 100 = $850
```

---

### Aggregate

**Entity that emits events and enforces business rules.**

```python
class BankAccount:
    def __init__(self, account_id):
        self.account_id = account_id
        self.balance = 0
        self.version = 0
        self.uncommitted_events = []

    # Command handler (business logic)
    def withdraw(self, amount):
        if amount > self.balance:
            raise InsufficientFundsError()

        # Emit event
        event = WithdrewEvent(amount=amount)
        self.apply_event(event)
        self.uncommitted_events.append(event)

    # Event handler (state update)
    def apply_event(self, event):
        if isinstance(event, AccountCreatedEvent):
            self.balance = 0
        elif isinstance(event, DepositedEvent):
            self.balance += event.amount
        elif isinstance(event, WithdrewEvent):
            self.balance -= event.amount

        self.version += 1

    # Rebuild from events
    @classmethod
    def from_events(cls, events):
        account = cls(events[0].aggregate_id)
        for event in events:
            account.apply_event(event)
        return account
```

---

## When to Use Event Sourcing

### ✅ Use Event Sourcing When:

**1. Complete Audit Trail Required**
- Financial systems (banking, trading)
- Healthcare (patient records)
- Compliance (GDPR, SOX, HIPAA)

**Example:** Banking system must explain how account balance changed from $1000 to $850.

---

**2. Temporal Queries Needed**
- "What was the balance at 2pm yesterday?"
- "Show me all transactions in December 2024"
- "Replay events to debug production issue"

---

**3. Event-Driven Architecture**
- Already using events for communication
- Event sourcing is natural fit
- Events already flowing through system

---

**4. Complex Business Workflows**
- Need to track state transitions
- Audit who did what and when
- Compliance requires event logs

---

### ❌ Avoid Event Sourcing When:

**1. Simple CRUD Applications**
- User profiles, product catalogs
- Current state is sufficient
- No audit requirements

---

**2. Reporting/Analytics Primary Use Case**
- Event sourcing makes queries harder
- Use traditional database + CDC (Change Data Capture)

---

**3. Team Unfamiliar with Pattern**
- Steep learning curve
- Easy to get wrong
- High maintenance cost

---

**4. Performance-Critical Reads**
- Rebuilding state from events is slow
- Must use CQRS + projections (adds complexity)

---

## Event Store Design

### Append-Only Log

**Events stored in order, never modified.**

```sql
CREATE TABLE events (
    event_id UUID PRIMARY KEY,
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(255) NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    version INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    data JSONB NOT NULL,
    metadata JSONB,

    UNIQUE (aggregate_id, version)  -- Prevent duplicate versions
);

CREATE INDEX idx_aggregate_stream ON events (aggregate_id, version);
```

---

### Event Store Interface

```python
class EventStore:
    def append_events(self, aggregate_id, expected_version, events):
        """
        Append events to stream.
        expected_version: optimistic concurrency control
        """
        # Check version matches (prevent concurrent writes)
        current_version = self.get_current_version(aggregate_id)
        if current_version != expected_version:
            raise ConcurrencyError()

        # Append events
        for event in events:
            self.save_event(event)

    def get_events(self, aggregate_id, from_version=0):
        """Load events for aggregate from specific version."""
        return self.db.query(
            "SELECT * FROM events WHERE aggregate_id = ? AND version >= ? ORDER BY version",
            aggregate_id, from_version
        )

    def get_all_events(self, from_timestamp=None):
        """Get all events (for projections)."""
        query = "SELECT * FROM events ORDER BY timestamp"
        if from_timestamp:
            query += " WHERE timestamp >= ?"
            return self.db.query(query, from_timestamp)
        return self.db.query(query)
```

---

## Aggregates and Event Streams

### Command Flow

```
1. Load aggregate from events
2. Execute command (business logic)
3. Emit events
4. Persist events to event store
5. Publish events to message broker (optional)
```

**Example:**

```python
# 1. Load aggregate
events = event_store.get_events(aggregate_id="acc_456")
account = BankAccount.from_events(events)

# 2. Execute command
try:
    account.withdraw(amount=100)
except InsufficientFundsError:
    return "Error: Insufficient funds"

# 3. Get uncommitted events
new_events = account.uncommitted_events

# 4. Persist events
event_store.append_events(
    aggregate_id=account.account_id,
    expected_version=account.version - len(new_events),
    events=new_events
)

# 5. Publish events (for projections)
for event in new_events:
    message_broker.publish(event)
```

---

### Optimistic Concurrency Control

**Problem:** Two concurrent withdrawals on same account.

```
Thread 1: Load events (balance=$1000, version=5)
Thread 2: Load events (balance=$1000, version=5)

Thread 1: Withdraw $600 → WithdrewEvent (version=6)
Thread 2: Withdraw $600 → WithdrewEvent (version=6)

Result: Both succeed, balance = -$200 (WRONG!)
```

**Solution:** Use expected version.

```python
# Thread 1
event_store.append_events(
    aggregate_id="acc_456",
    expected_version=5,  # Expects version 5
    events=[WithdrewEvent(...)]
)
# Success → version becomes 6

# Thread 2
event_store.append_events(
    aggregate_id="acc_456",
    expected_version=5,  # Expects version 5 (but it's 6 now!)
    events=[WithdrewEvent(...)]
)
# Raises ConcurrencyError → retry
```

---

## Event Schema Design

### Event Naming

**Use past tense (events are facts).**

```
✅ Good:
- OrderCreatedEvent
- PaymentProcessedEvent
- InventoryReservedEvent

❌ Bad:
- CreateOrderEvent (sounds like command)
- ProcessPayment (not past tense)
```

---

### Event Data

**Include all data needed to rebuild state.**

```json
// ✅ Good
{
  "eventType": "OrderCreatedEvent",
  "data": {
    "orderId": "ord_123",
    "customerId": "cust_456",
    "items": [
      {"productId": "prod_789", "quantity": 2, "price": 29.99}
    ],
    "totalAmount": 59.98,
    "currency": "USD",
    "shippingAddress": {...}
  }
}

// ❌ Bad (missing data)
{
  "eventType": "OrderCreatedEvent",
  "data": {
    "orderId": "ord_123"
    // Missing items, amount, etc.
  }
}
```

---

### Event Metadata

**Store contextual information.**

```json
{
  "metadata": {
    "userId": "user_123",
    "timestamp": "2025-10-20T12:00:00Z",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "correlationId": "req_456",  // For distributed tracing
    "causationId": "evt_789"      // Which event caused this event
  }
}
```

---

## Snapshots for Performance

### Problem

**Replaying 1 million events to rebuild state is slow.**

```python
# Load account with 1M events
events = event_store.get_events("acc_456")  # Loads 1M events!
account = BankAccount.from_events(events)   # Replays all 1M
```

---

### Solution: Snapshots

**Periodically save current state.**

```
Snapshot at version 1000:
{
  "aggregateId": "acc_456",
  "version": 1000,
  "snapshot": {
    "balance": 5000.00,
    "accountType": "savings",
    "isActive": true
  }
}

Now only replay events from version 1001+
```

**Implementation:**

```python
class EventStore:
    def load_aggregate(self, aggregate_id):
        # Try to load snapshot
        snapshot = self.get_snapshot(aggregate_id)

        if snapshot:
            account = BankAccount.from_snapshot(snapshot)
            from_version = snapshot.version + 1
        else:
            account = BankAccount(aggregate_id)
            from_version = 0

        # Load events after snapshot
        events = self.get_events(aggregate_id, from_version)
        for event in events:
            account.apply_event(event)

        return account

    def save_snapshot(self, aggregate_id, version, state):
        """Save snapshot every N events (e.g., every 100)."""
        self.db.execute(
            "INSERT INTO snapshots (aggregate_id, version, state) VALUES (?, ?, ?)",
            aggregate_id, version, json.dumps(state)
        )
```

**When to snapshot:**
- Every N events (e.g., 100 or 1000)
- Periodically (daily snapshot jobs)
- On-demand (when loading aggregate)

---

## Querying Event-Sourced Systems

### Problem

**Events are write-optimized, not read-optimized.**

```sql
-- "Get all orders for customer 123" is HARD
-- Must replay all OrderCreatedEvent events and filter by customerId
```

---

### Solution: CQRS + Projections

**Build read models from events.**

```
Event Store (Write Side)         Projection (Read Side)
    ↓                                   ↓
OrderCreatedEvent             → CustomerOrdersView
    ↓                             ┌────────────────┐
Event Handler listens           │ customer_id: 123│
    ↓                             │ orders: [...]   │
Updates read model              └────────────────┘
```

**Example:**

```python
# Event handler (projection)
@event_handler("OrderCreatedEvent")
def handle_order_created(event):
    # Update read model
    db.execute(
        "INSERT INTO customer_orders (customer_id, order_id, total) VALUES (?, ?, ?)",
        event.data.customer_id,
        event.data.order_id,
        event.data.total_amount
    )

# Query (fast!)
def get_customer_orders(customer_id):
    return db.query(
        "SELECT * FROM customer_orders WHERE customer_id = ?",
        customer_id
    )
```

**See:** [Deep Dive: CQRS](deep-dive-cqrs.md) for details.

---

## Event Versioning and Evolution

### Problem

**Events are immutable, but requirements change.**

```python
# Version 1 (2024)
OrderCreatedEvent {
  "orderId": "ord_123",
  "totalAmount": 100.00
}

# Version 2 (2025) - need currency field!
OrderCreatedEvent {
  "orderId": "ord_123",
  "totalAmount": 100.00,
  "currency": "USD"  // New field
}

# What about old events without currency?
```

---

### Solution 1: Upcasting

**Convert old events to new schema on read.**

```python
class EventUpcaster:
    def upcast(self, event):
        if event.type == "OrderCreatedEvent":
            if event.version == 1:
                # V1 → V2: Add default currency
                event.data['currency'] = 'USD'  # Default
                event.version = 2

        return event

# When loading events
events = event_store.get_events(aggregate_id)
upcaster = EventUpcaster()
events = [upcaster.upcast(e) for e in events]
account = BankAccount.from_events(events)
```

---

### Solution 2: Multiple Event Versions

**Keep separate event classes for each version.**

```python
class OrderCreatedEventV1:
    def __init__(self, order_id, total_amount):
        self.order_id = order_id
        self.total_amount = total_amount

class OrderCreatedEventV2:
    def __init__(self, order_id, total_amount, currency):
        self.order_id = order_id
        self.total_amount = total_amount
        self.currency = currency

# Event handler supports both
def apply_event(self, event):
    if isinstance(event, OrderCreatedEventV1):
        self.total = event.total_amount
        self.currency = "USD"  # Default
    elif isinstance(event, OrderCreatedEventV2):
        self.total = event.total_amount
        self.currency = event.currency
```

---

### Solution 3: Weak Schema

**Store events as JSON with optional fields.**

```python
# Event store
{
  "eventType": "OrderCreatedEvent",
  "data": {
    "orderId": "ord_123",
    "totalAmount": 100.00,
    "currency": "USD"  // Optional (missing in V1)
  }
}

# Application
def apply_order_created(event):
    self.total = event.data.get('totalAmount')
    self.currency = event.data.get('currency', 'USD')  // Default if missing
```

---

## Combining with CQRS

**Event Sourcing + CQRS = Perfect match.**

```
Write Side (Commands)           Read Side (Queries)
        ↓                               ↓
   Aggregate                       Read Model
        ↓                               ↓
  Emit Events                    Optimized for queries
        ↓                               ↑
   Event Store  ────────────────────────┘
                    (Events update projections)
```

**Benefits:**
- Write side: Event sourcing (complete audit)
- Read side: Denormalized views (fast queries)
- Eventual consistency (acceptable in most cases)

**Example:**

```python
# Write side
class OrderAggregate:
    def create_order(self, items):
        event = OrderCreatedEvent(items=items)
        self.apply_event(event)
        self.uncommitted_events.append(event)

# Read side (projection)
@event_handler("OrderCreatedEvent")
def handle_order_created(event):
    # Update denormalized view
    db.execute("""
        INSERT INTO order_summary
        (order_id, customer_id, customer_name, total, status)
        VALUES (?, ?, ?, ?, ?)
    """, event.order_id, event.customer_id,
         get_customer_name(event.customer_id),  # Denormalized!
         event.total, "pending")

# Query (single table, fast!)
orders = db.query("SELECT * FROM order_summary WHERE customer_id = ?", customer_id)
```

---

## Implementation Patterns

### Repository Pattern

```python
class AggregateRepository:
    def __init__(self, event_store):
        self.event_store = event_store

    def get(self, aggregate_id):
        """Load aggregate from events."""
        events = self.event_store.get_events(aggregate_id)
        if not events:
            raise AggregateNotFoundError()

        aggregate = BankAccount.from_events(events)
        return aggregate

    def save(self, aggregate):
        """Persist uncommitted events."""
        self.event_store.append_events(
            aggregate.aggregate_id,
            aggregate.version - len(aggregate.uncommitted_events),
            aggregate.uncommitted_events
        )
        aggregate.uncommitted_events.clear()
```

---

### Event Bus Integration

```python
class EventStore:
    def __init__(self, db, event_bus):
        self.db = db
        self.event_bus = event_bus

    def append_events(self, aggregate_id, expected_version, events):
        # Persist to database
        for event in events:
            self.save_event(event)

        # Publish to event bus (for projections)
        for event in events:
            self.event_bus.publish(event)
```

---

## Testing Event-Sourced Systems

### Given-When-Then Pattern

```python
def test_withdraw_with_sufficient_funds():
    # Given (events that happened)
    given = [
        AccountCreatedEvent(account_id="acc_123"),
        DepositedEvent(account_id="acc_123", amount=1000)
    ]

    account = BankAccount.from_events(given)

    # When (command executed)
    account.withdraw(100)

    # Then (expected events)
    assert len(account.uncommitted_events) == 1
    assert isinstance(account.uncommitted_events[0], WithdrewEvent)
    assert account.uncommitted_events[0].amount == 100
    assert account.balance == 900


def test_withdraw_with_insufficient_funds():
    # Given
    given = [
        AccountCreatedEvent(account_id="acc_123"),
        DepositedEvent(account_id="acc_123", amount=50)
    ]

    account = BankAccount.from_events(given)

    # When / Then
    with pytest.raises(InsufficientFundsError):
        account.withdraw(100)

    assert len(account.uncommitted_events) == 0  # No events emitted
```

---

## Common Pitfalls

### 1. Missing Data in Events ❌

```python
# ❌ Bad: Missing quantity
ProductAddedToCartEvent {
  "productId": "prod_123"
  // Missing quantity, price
}

# Later: Can't calculate cart total (data lost!)
```

**Fix:** Include all necessary data.

```python
# ✅ Good
ProductAddedToCartEvent {
  "productId": "prod_123",
  "quantity": 2,
  "priceAtTimeOfAdd": 29.99,  // Price might change later!
  "currency": "USD"
}
```

---

### 2. Using Events for Queries ❌

```python
# ❌ Bad: Query event store directly
def get_customer_orders(customer_id):
    all_events = event_store.get_all_events()
    order_events = [e for e in all_events if e.type == "OrderCreatedEvent"
                    and e.data.customer_id == customer_id]
    # Slow! Scans all events.
```

**Fix:** Use CQRS projections.

---

### 3. Forgetting Event Versioning ❌

**Problem:** Add field to event, old events break.

**Fix:** Plan for versioning from day 1 (upcasting, multiple versions, or weak schema).

---

### 4. Not Using Snapshots ❌

**Problem:** 1 million events → 10 seconds to load aggregate.

**Fix:** Add snapshots every N events.

---

## Real-World Case Studies

### LMAX Exchange (High-Frequency Trading)

**Scale:** 6 million orders/second

**Event sourcing benefits:**
- Complete audit trail (financial regulations)
- Event replay for debugging
- Temporal queries (market analysis)

**Tech:** Custom event store (in-memory)

---

### Prooph (Event Sourcing Framework - PHP)

**Used by:** E-commerce, logistics companies

**Benefits:**
- Audit trail for compliance
- Event-driven microservices
- Complex business workflows

**Tech:** MySQL/PostgreSQL event store

---

## References

### Books

- Vernon, Vaughn. *Implementing Domain-Driven Design*. Addison-Wesley, 2013.
  - Chapter 7: Event Sourcing
- Young, Greg. "CQRS Documents" (2010) - https://cqrs.files.wordpress.com/2010/11/cqrs_documents.pdf

### Articles

- Fowler, Martin. "Event Sourcing" (2005) - https://martinfowler.com/eaaDev/EventSourcing.html
- Stopford, Ben. *Designing Event-Driven Systems*. O'Reilly, 2018.

### Event Store Databases

- **EventStoreDB** - https://www.eventstore.com/
- **Axon Server** - https://www.axoniq.io/
- **Marten** (PostgreSQL) - https://martendb.io/

---

**Document Type:** Deep-Dive Guide
**Last Updated:** 2025-10-20
**Version:** 1.0
**Parent:** [Architecture Patterns Guide](overview.md)
