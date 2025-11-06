# Clean Architecture - Deep Dive

**Purpose:** Comprehensive guide to Clean Architecture pattern, implementation strategies, and best practices
**Organization:** PHD Systems & PHD Labs
**Version:** 1.0
**Date:** 2025-10-20
**Parent Guide:** [Architecture Patterns Guide](overview.md)

---

## TL;DR

**Clean Architecture enforces strict dependency inversion: all dependencies point inward toward business rules**. Four concentric layers: Entities (innermost), Use Cases, Interface Adapters, Frameworks & Drivers (outermost). **Use when:** large enterprise systems (20+ developers), long-lived projects (10+ years), maximum testability and flexibility required. **Avoid when:** small-to-medium projects (use Hexagonal), fast iteration needed, or team unfamiliar with pattern. **Key principle:** The Dependency Rule - source code dependencies must point only inward. **Benefits:** Framework independence, testability, flexibility. **Challenges:** High initial complexity, significant boilerplate, steep learning curve.

---

## Table of Contents

- [Overview](#overview)
- [The Dependency Rule](#the-dependency-rule)
- [The Four Layers](#the-four-layers)
- [Entities Layer](#entities-layer)
- [Use Cases Layer](#use-cases-layer)
- [Interface Adapters Layer](#interface-adapters-layer)
- [Frameworks & Drivers Layer](#frameworks--drivers-layer)
- [Dependency Inversion in Practice](#dependency-inversion-in-practice)
- [Data Flow](#data-flow)
- [Testing Strategy](#testing-strategy)
- [Implementation Guidelines](#implementation-guidelines)
- [Common Pitfalls](#common-pitfalls)
- [Real-World Examples](#real-world-examples)
- [References](#references)

---

## Overview

Clean Architecture, defined by Robert C. Martin (Uncle Bob), organizes code to achieve:

1. **Independence of Frameworks** - Business logic doesn't depend on frameworks
2. **Testability** - Business logic can be tested without UI, DB, or external services
3. **Independence of UI** - UI can change without changing business logic
4. **Independence of Database** - Switch from PostgreSQL to MongoDB without touching business logic
5. **Independence of External Services** - Business logic doesn't know about external APIs

### The Circle Diagram

```
┌──────────────────────────────────────┐
│  Frameworks & Drivers (Layer 4)      │  ← Outermost
│  ┌────────────────────────────────┐  │
│  │  Interface Adapters (Layer 3) │  │
│  │  ┌──────────────────────────┐ │  │
│  │  │  Use Cases (Layer 2)     │ │  │
│  │  │  ┌────────────────────┐  │ │  │
│  │  │  │ Entities (Layer 1) │  │ │  │  ← Innermost
│  │  │  │                    │  │ │  │
│  │  │  │ Business Rules     │  │ │  │
│  │  │  └────────────────────┘  │ │  │
│  │  │  Application Logic      │ │  │
│  │  └──────────────────────────┘ │  │
│  │  Controllers, Presenters       │  │
│  └────────────────────────────────┘  │
│  Web, DB, Devices                    │
└──────────────────────────────────────┘

Dependencies point INWARD only →→→
```

---

## The Dependency Rule

**CRITICAL PRINCIPLE:** Source code dependencies must point only inward, toward higher-level policies.

```
Frameworks & Drivers  →  Interface Adapters  →  Use Cases  →  Entities
   (knows about)            (knows about)       (knows about)   (knows nothing)
```

**What this means:**
- Entities know nothing about use cases, adapters, or frameworks
- Use cases know about entities, but not about adapters or frameworks
- Interface adapters know about use cases, but not about frameworks
- Frameworks know about everything (outer layer)

**Code example:**

```python
# ✅ GOOD: Use Case depends on Entity (inward)
class CreateOrderUseCase:
    def execute(self, request):
        order = Order(request.customer_id, request.items)  # Entity
        return order

# ❌ BAD: Entity depends on framework (outward)
class Order:
    def __init__(self):
        self.db = PostgreSQLConnection()  # Framework dependency!
```

---

## The Four Layers

### Layer 1: Entities (Enterprise Business Rules)

**Innermost layer. Core business logic.**

**Characteristics:**
- No dependencies on anything
- Pure business logic
- Can be used across multiple applications
- Changes least frequently

**Example:**

```python
# entities/order.py
class Order:
    def __init__(self, order_id, customer_id):
        self.order_id = order_id
        self.customer_id = customer_id
        self.items = []
        self.status = OrderStatus.PENDING
        self.total = Decimal(0)

    def add_item(self, product_id, quantity, price):
        """Business rule: Items can only be added to pending orders."""
        if self.status != OrderStatus.PENDING:
            raise InvalidOperationError("Cannot add items to non-pending order")

        item = OrderItem(product_id, quantity, price)
        self.items.append(item)
        self.total += quantity * price

    def confirm(self):
        """Business rule: Order must have items to be confirmed."""
        if not self.items:
            raise ValidationError("Order must have at least one item")

        if self.total < Decimal(10):
            raise ValidationError("Minimum order amount is $10")

        self.status = OrderStatus.CONFIRMED
```

---

### Layer 2: Use Cases (Application Business Rules)

**Application-specific business rules. Orchestrates flow.**

**Characteristics:**
- Depends only on Entities
- Defines interfaces (ports) for external dependencies
- Contains application-specific workflows
- Changes when application behavior changes

**Example:**

```python
# use_cases/create_order.py
class CreateOrderUseCase:
    def __init__(self, order_repository: OrderRepositoryPort,
                 notification_service: NotificationServicePort):
        self.order_repository = order_repository
        self.notification_service = notification_service

    def execute(self, request: CreateOrderRequest) -> CreateOrderResponse:
        # 1. Create entity
        order = Order(request.order_id, request.customer_id)

        for item in request.items:
            order.add_item(item.product_id, item.quantity, item.price)

        # 2. Confirm order (business rule in entity)
        order.confirm()

        # 3. Save via repository (port)
        self.order_repository.save(order)

        # 4. Send notification (port)
        self.notification_service.send_order_confirmation(order.order_id)

        # 5. Return response
        return CreateOrderResponse(order_id=order.order_id, total=order.total)


# use_cases/ports/order_repository.py
class OrderRepositoryPort(ABC):
    """Port (interface) defined by use case."""
    @abstractmethod
    def save(self, order: Order) -> None:
        pass

    @abstractmethod
    def get_by_id(self, order_id: str) -> Order:
        pass
```

---

### Layer 3: Interface Adapters (Controllers, Presenters, Gateways)

**Converts data between use cases and external interfaces.**

**Characteristics:**
- Depends on Use Cases
- Implements ports defined by use cases
- Adapts between internal and external formats
- Controllers (input), Presenters (output), Gateways (infrastructure)

**Example - Controller (Input Adapter):**

```python
# interface_adapters/controllers/order_controller.py
class OrderController:
    def __init__(self, create_order_use_case: CreateOrderUseCase):
        self.create_order_use_case = create_order_use_case

    def create_order(self, http_request):
        """Convert HTTP request to use case request."""
        # 1. Extract data from HTTP
        data = http_request.json()

        # 2. Create use case request
        use_case_request = CreateOrderRequest(
            order_id=str(uuid.uuid4()),
            customer_id=data['customer_id'],
            items=[
                OrderItemRequest(
                    product_id=item['product_id'],
                    quantity=item['quantity'],
                    price=Decimal(item['price'])
                )
                for item in data['items']
            ]
        )

        # 3. Execute use case
        try:
            response = self.create_order_use_case.execute(use_case_request)

            # 4. Convert to HTTP response
            return {
                'status': 'success',
                'order_id': response.order_id,
                'total': float(response.total)
            }, 201

        except ValidationError as e:
            return {'status': 'error', 'message': str(e)}, 400
```

**Example - Gateway (Output Adapter):**

```python
# interface_adapters/gateways/postgres_order_repository.py
class PostgresOrderRepository(OrderRepositoryPort):
    """Implements port defined by use case."""

    def __init__(self, db_connection):
        self.db = db_connection

    def save(self, order: Order) -> None:
        """Convert entity to database format and save."""
        self.db.execute("""
            INSERT INTO orders (order_id, customer_id, status, total)
            VALUES (%s, %s, %s, %s)
        """, order.order_id, order.customer_id, order.status.value, order.total)

        for item in order.items:
            self.db.execute("""
                INSERT INTO order_items (order_id, product_id, quantity, price)
                VALUES (%s, %s, %s, %s)
            """, order.order_id, item.product_id, item.quantity, item.price)

    def get_by_id(self, order_id: str) -> Order:
        """Load from database and convert to entity."""
        row = self.db.query_one("SELECT * FROM orders WHERE order_id = %s", order_id)
        order = Order(row['order_id'], row['customer_id'])
        order.status = OrderStatus(row['status'])
        order.total = row['total']

        items = self.db.query("SELECT * FROM order_items WHERE order_id = %s", order_id)
        for item in items:
            order.items.append(OrderItem(
                item['product_id'],
                item['quantity'],
                item['price']
            ))

        return order
```

---

### Layer 4: Frameworks & Drivers (External Interfaces)

**Outermost layer. Frameworks and tools.**

**Characteristics:**
- Depends on all inner layers
- Web frameworks (FastAPI, Flask, Django)
- Database connections
- External service clients
- Glue code

**Example:**

```python
# frameworks_drivers/web/app.py
from fastapi import FastAPI
from interface_adapters.controllers.order_controller import OrderController
from use_cases.create_order import CreateOrderUseCase
from interface_adapters.gateways.postgres_order_repository import PostgresOrderRepository
from frameworks_drivers.database.postgres_connection import get_db_connection

# Setup dependencies (Dependency Injection)
def setup_dependencies():
    db_connection = get_db_connection()
    order_repository = PostgresOrderRepository(db_connection)
    create_order_use_case = CreateOrderUseCase(order_repository, notification_service)
    order_controller = OrderController(create_order_use_case)
    return order_controller

# FastAPI app
app = FastAPI()
order_controller = setup_dependencies()

@app.post("/orders")
def create_order_endpoint(request: dict):
    """Framework-specific route. Delegates to controller."""
    return order_controller.create_order(request)
```

---

## Dependency Inversion in Practice

### The Problem

**Without dependency inversion:**

```python
# ❌ BAD: Use Case depends on concrete implementation
class CreateOrderUseCase:
    def __init__(self):
        self.order_repository = PostgresOrderRepository()  # Concrete class!

    def execute(self, request):
        order = Order(...)
        self.order_repository.save(order)  # Tied to PostgreSQL!
```

**Problems:**
- Can't test without PostgreSQL
- Can't switch to MongoDB
- Use Case knows about infrastructure

---

### The Solution

**With dependency inversion (Dependency Inversion Principle):**

```python
# ✅ GOOD: Use Case depends on interface (port)
class CreateOrderUseCase:
    def __init__(self, order_repository: OrderRepositoryPort):  # Interface!
        self.order_repository = order_repository

    def execute(self, request):
        order = Order(...)
        self.order_repository.save(order)  # Uses interface, not implementation


# Port (interface) defined by Use Case
class OrderRepositoryPort(ABC):
    @abstractmethod
    def save(self, order: Order) -> None:
        pass


# Adapter (implementation) in outer layer
class PostgresOrderRepository(OrderRepositoryPort):
    def save(self, order: Order) -> None:
        # PostgreSQL-specific code here
        pass
```

**Benefits:**
- Use Case doesn't know about PostgreSQL
- Can easily test with mock repository
- Can switch to MongoDB by changing only the adapter

---

## Data Flow

### Request Flow (Inbound)

```
1. HTTP Request (Framework)
   ↓
2. Controller (Interface Adapter)
   - Converts HTTP to Use Case Request
   ↓
3. Use Case
   - Creates/Updates Entity
   - Calls Port (interface)
   ↓
4. Gateway (Interface Adapter)
   - Implements Port
   - Saves to Database
```

**Example:**

```
POST /orders {"customer_id": "123", "items": [...]}
   ↓
OrderController.create_order(http_request)
   ↓ Creates CreateOrderRequest
CreateOrderUseCase.execute(request)
   ↓ Creates Order entity
   ↓ Calls order_repository.save(order)
PostgresOrderRepository.save(order)
   ↓ Inserts into PostgreSQL
```

---

### Response Flow (Outbound)

```
1. Use Case returns Use Case Response
   ↓
2. Controller (Interface Adapter)
   - Converts Use Case Response to HTTP Response
   ↓
3. HTTP Response (Framework)
```

---

## Testing Strategy

### Layer 1: Entities (Pure Unit Tests)

```python
def test_order_confirm_validates_items():
    # No mocks needed! No dependencies!
    order = Order("ord_123", "cust_456")

    # Business rule: Can't confirm without items
    with pytest.raises(ValidationError):
        order.confirm()

    # Add item and confirm
    order.add_item("prod_1", 2, Decimal("10.00"))
    order.confirm()  # Success

    assert order.status == OrderStatus.CONFIRMED
```

**No mocks, no database, instant tests!**

---

### Layer 2: Use Cases (Mock Ports)

```python
def test_create_order_use_case():
    # Mock ports (interfaces)
    mock_repo = Mock(spec=OrderRepositoryPort)
    mock_notification = Mock(spec=NotificationServicePort)

    use_case = CreateOrderUseCase(mock_repo, mock_notification)

    # Execute
    request = CreateOrderRequest(
        order_id="ord_123",
        customer_id="cust_456",
        items=[OrderItemRequest("prod_1", 2, Decimal("10.00"))]
    )

    response = use_case.execute(request)

    # Verify
    assert response.order_id == "ord_123"
    assert response.total == Decimal("20.00")
    mock_repo.save.assert_called_once()
    mock_notification.send_order_confirmation.assert_called_once()
```

**No database, no HTTP, fast tests!**

---

### Layer 3: Gateways (Integration Tests)

```python
def test_postgres_order_repository():
    # Use test database
    test_db = create_test_database()
    repo = PostgresOrderRepository(test_db)

    # Create and save order
    order = Order("ord_123", "cust_456")
    order.add_item("prod_1", 2, Decimal("10.00"))
    order.confirm()

    repo.save(order)

    # Load and verify
    loaded_order = repo.get_by_id("ord_123")
    assert loaded_order.order_id == "ord_123"
    assert loaded_order.total == Decimal("20.00")
```

**Tests with real database, slower but verifies persistence.**

---

### Layer 4: Frameworks (End-to-End Tests)

```python
def test_create_order_endpoint():
    # Full stack test
    client = TestClient(app)

    response = client.post("/orders", json={
        "customer_id": "cust_456",
        "items": [{"product_id": "prod_1", "quantity": 2, "price": 10.00}]
    })

    assert response.status_code == 201
    assert response.json()['status'] == 'success'
    assert response.json()['total'] == 20.00

    # Verify in database
    order_id = response.json()['order_id']
    order = db.query_one("SELECT * FROM orders WHERE order_id = %s", order_id)
    assert order is not None
```

---

## Implementation Guidelines

### Directory Structure

```
src/
├── entities/                  # Layer 1
│   ├── order.py
│   └── customer.py
│
├── use_cases/                 # Layer 2
│   ├── create_order.py
│   ├── cancel_order.py
│   └── ports/
│       ├── order_repository.py
│       └── notification_service.py
│
├── interface_adapters/        # Layer 3
│   ├── controllers/
│   │   └── order_controller.py
│   ├── presenters/
│   │   └── order_presenter.py
│   └── gateways/
│       ├── postgres_order_repository.py
│       └── email_notification_service.py
│
└── frameworks_drivers/        # Layer 4
    ├── web/
    │   ├── app.py
    │   └── routes.py
    ├── database/
    │   └── postgres_connection.py
    └── cli/
        └── commands.py
```

---

### Dependency Injection

**Wire dependencies in outermost layer:**

```python
# frameworks_drivers/web/dependency_injection.py
def create_create_order_use_case():
    # Layer 4 → Layer 3 → Layer 2
    db = get_database_connection()
    order_repository = PostgresOrderRepository(db)
    notification_service = EmailNotificationService()
    return CreateOrderUseCase(order_repository, notification_service)

def create_order_controller():
    use_case = create_create_order_use_case()
    return OrderController(use_case)
```

---

## Common Pitfalls

### 1. Breaking the Dependency Rule ❌

```python
# ❌ BAD: Entity depends on framework
class Order:
    def save(self):
        db = PostgreSQLConnection()  # Framework dependency!
        db.save(self)
```

**Fix:** Entities should have NO dependencies.

---

### 2. Leaking Implementation Details ❌

```python
# ❌ BAD: Use Case returns database model
class CreateOrderUseCase:
    def execute(self, request):
        db_model = self.db.insert(...)
        return db_model  # Database model leaked!
```

**Fix:** Return use case response (DTO).

---

### 3. Too Many Layers for Simple Apps ❌

**Problem:** Small app with 10 files for one feature.

**Fix:** Clean Architecture is for large, long-lived systems. Use Hexagonal for medium, Simple Modular for small.

---

## Real-World Examples

### Netflix (Microservices with Clean Architecture)

- Each microservice uses Clean Architecture internally
- Entities: domain models (subscriptions, viewing history)
- Use Cases: business logic per service
- Adapters: REST APIs, database gateways

---

### Banking Systems

- Entities: Account, Transaction (core business rules)
- Use Cases: TransferFunds, OpenAccount
- Adapters: REST API, database, external payment gateways
- Frameworks: Spring Boot, PostgreSQL

---

## References

### Books

- Martin, Robert C. *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall, 2017.
- Martin, Robert C. "The Clean Architecture" (blog, 2012) - https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html

### Implementations

- **Python:** https://github.com/Enforcer/clean-architecture
- **.NET:** https://github.com/ardalis/CleanArchitecture
- **Java:** https://github.com/mattia-battiston/clean-architecture-example

---

**Document Type:** Deep-Dive Guide
**Last Updated:** 2025-10-20
**Version:** 1.0
**Parent:** [Architecture Patterns Guide](overview.md)
