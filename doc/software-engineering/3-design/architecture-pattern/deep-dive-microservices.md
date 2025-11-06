# Microservices Architecture - Deep Dive

**Purpose:** Comprehensive guide to microservices architecture pattern, implementation strategies, and best practices
**Organization:** PHD Systems & PHD Labs
**Version:** 1.0
**Date:** 2025-10-20
**Parent Guide:** [Architecture Patterns Guide](overview.md)

---

## TL;DR

**Microservices architecture decomposes applications into small, independent services** that own their data, communicate via APIs, and can be deployed independently. **Use when:** you have 20+ developers, need independent scaling per service, or have polyglot technology requirements. **Avoid when:** team <10 developers, unclear domain boundaries, or starting a new project (use Modular Monolith first). **Key principles:** Database per service, independent deployment, bounded contexts, decentralized governance. **Critical challenges:** Distributed data management, network reliability, observability complexity. **Migration path:** Start with Modular Monolith → Extract one service → Gradually decompose → Add service mesh and observability.

---

## Table of Contents

- [Overview](#overview)
- [Core Principles](#core-principles)
- [When to Use Microservices](#when-to-use-microservices)
- [Service Decomposition Strategies](#service-decomposition-strategies)
- [Communication Patterns](#communication-patterns)
- [Data Management](#data-management)
- [Service Discovery](#service-discovery)
- [API Gateway Pattern](#api-gateway-pattern)
- [Observability and Monitoring](#observability-and-monitoring)
- [Testing Strategies](#testing-strategies)
- [Deployment Patterns](#deployment-patterns)
- [Security](#security)
- [Common Anti-Patterns](#common-anti-patterns)
- [Migration from Monolith](#migration-from-monolith)
- [Real-World Case Studies](#real-world-case-studies)
- [References](#references)

---

## Overview

**Microservices architecture** is an architectural style that structures an application as a collection of loosely coupled, independently deployable services. Each service:

- **Owns its domain** - Implements a specific business capability
- **Has its own database** - No shared databases between services
- **Communicates via APIs** - REST, gRPC, message queues
- **Can be deployed independently** - No coordinated deployments required
- **Is owned by a small team** - 2-pizza team rule (Amazon)

### Historical Context

- **2011:** Netflix begins microservices migration
- **2014:** Martin Fowler publishes "Microservices" article
- **2015:** Kubernetes 1.0 released (enabling container orchestration)
- **2016-Present:** Industry-wide adoption (Uber, Amazon, Spotify, etc.)

---

## Core Principles

### 1. Single Responsibility Principle

**Each service does ONE thing well.**

```
❌ Bad: UserOrderPaymentService (does too much)
✅ Good: UserService, OrderService, PaymentService (each focused)
```

### 2. Database Per Service

**Each service owns its data. No shared databases.**

```
User Service → User Database (PostgreSQL)
Order Service → Order Database (MongoDB)
Payment Service → Payment Database (PostgreSQL)
```

**Why?**
- Independent scaling of data storage
- Technology flexibility (polyglot persistence)
- Clear service boundaries
- Prevents tight coupling

### 3. Decentralized Governance

**Teams own their services end-to-end.**

- Technology choice (language, framework, database)
- Deployment schedule
- API design
- Performance targets

### 4. Design for Failure

**Assume services will fail. Build resilience.**

- Circuit breakers (prevent cascade failures)
- Retries with exponential backoff
- Timeouts
- Bulkheads (isolate failures)
- Fallback responses

### 5. Evolutionary Design

**Services evolve independently.**

- Backward-compatible API changes
- Service versioning (v1, v2)
- Gradual rollouts (canary deployments)
- Feature flags

---

## When to Use Microservices

### ✅ Use Microservices When:

1. **Large team (20+ developers)**
   - Multiple teams need to work independently
   - Conway's Law: System mirrors org structure

2. **Independent scaling requirements**
   - Payment service needs 10x more capacity than user service
   - Different services have different load patterns

3. **Polyglot technology needs**
   - AI/ML service in Python
   - High-performance API in Go
   - Legacy integration in Java

4. **Frequent, independent deployments**
   - Need to deploy user service without touching order service
   - Continuous deployment per team

5. **Clear domain boundaries**
   - Bounded contexts from Domain-Driven Design
   - E-commerce: users, products, orders, payments

### ❌ Avoid Microservices When:

1. **Small team (<10 developers)**
   - Operational overhead exceeds benefits
   - Use Modular Monolith instead

2. **Unclear domain boundaries**
   - Services constantly need to talk to each other
   - Tight coupling defeats the purpose

3. **Starting new project**
   - Premature optimization
   - Start with Monolith, extract services later (Monolith First pattern)

4. **Limited DevOps maturity**
   - No CI/CD pipeline
   - No container orchestration (Kubernetes)
   - No centralized logging/monitoring

---

## Service Decomposition Strategies

### Strategy 1: Decompose by Business Capability

**Organize services around business functions.**

**E-commerce example:**
```
User Management Service    → User registration, authentication, profiles
Product Catalog Service    → Product listings, search, recommendations
Order Processing Service   → Cart, checkout, order tracking
Payment Service            → Payment processing, refunds
Inventory Service          → Stock management, warehouse operations
Notification Service       → Email, SMS, push notifications
```

**Benefits:**
- Aligns with business organization
- Clear ownership
- Stable boundaries (business capabilities change slowly)

---

### Strategy 2: Decompose by Subdomain (DDD)

**Use Domain-Driven Design bounded contexts.**

**Banking example:**
```
Core Banking Context       → Accounts, transactions, balances
Lending Context            → Loans, mortgages, credit scoring
Fraud Detection Context    → Transaction monitoring, risk assessment
Customer Context           → Customer profiles, KYC, preferences
```

**Benefits:**
- Leverages DDD ubiquitous language
- Natural boundaries based on domain modeling
- Prevents coupling between unrelated domains

---

### Strategy 3: Decompose by Volatility

**Separate frequently changing code from stable code.**

```
High Volatility:
- Recommendation Engine Service (ML models change weekly)
- Pricing Service (dynamic pricing algorithms)

Low Volatility:
- User Authentication Service (stable requirements)
- Audit Log Service (compliance-driven, rarely changes)
```

**Benefits:**
- Deploy frequently changing services without touching stable ones
- Reduce risk (stable services aren't impacted by experiments)

---

### Strategy 4: Strangler Fig Pattern

**Gradually extract services from monolith.**

```
Step 1: Identify service boundary (e.g., Payment module)
Step 2: Create new Payment Service
Step 3: Route payment requests to new service
Step 4: Deprecate old payment code in monolith
Step 5: Repeat for next service
```

**Benefits:**
- Low-risk incremental migration
- Monolith and microservices coexist
- Rollback possible at any step

---

## Communication Patterns

### 1. Synchronous Communication

#### REST APIs (HTTP/JSON)

**When to use:**
- Request-response pattern
- Simple CRUD operations
- Public APIs (widely supported)

**Example:**
```http
GET /api/users/123
Host: user-service.example.com
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "123",
  "name": "Alice",
  "email": "alice@example.com"
}
```

**Pros:**
- Simple, well-understood
- Great tooling (Postman, Swagger)
- Human-readable

**Cons:**
- Text-based (larger payloads)
- Slower than binary protocols
- Tight coupling (caller waits for response)

---

#### gRPC (HTTP/2 + Protocol Buffers)

**When to use:**
- Internal service-to-service communication
- Performance-critical APIs
- Strongly-typed contracts

**Example:**
```protobuf
// user.proto
service UserService {
  rpc GetUser (GetUserRequest) returns (User);
}

message GetUserRequest {
  string user_id = 1;
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
}
```

**Pros:**
- Fast (binary protocol, HTTP/2)
- Strongly typed (Protocol Buffers)
- Bi-directional streaming

**Cons:**
- Less human-readable
- Requires code generation
- Not browser-friendly (needs gRPC-Web)

---

### 2. Asynchronous Communication

#### Message Queues (RabbitMQ, AWS SQS)

**When to use:**
- Background processing
- Decoupling services
- Load leveling

**Example:**
```
Order Service → Publishes "OrderCreated" → Queue → Payment Service consumes
```

**Pros:**
- Loose coupling
- Resilient (queue buffers messages)
- Natural load leveling

**Cons:**
- Eventual consistency
- Debugging harder (asynchronous flow)
- Duplicate message handling required

---

#### Event Streaming (Apache Kafka)

**When to use:**
- Event sourcing
- Real-time analytics
- High-throughput messaging

**Example:**
```python
# Producer (Order Service)
producer.send('order-events', {
    'event_type': 'OrderCreated',
    'order_id': '12345',
    'customer_id': '67890',
    'timestamp': '2025-10-20T12:00:00Z'
})

# Consumer (Payment Service)
for message in consumer:
    if message.value['event_type'] == 'OrderCreated':
        process_payment(message.value['order_id'])
```

**Pros:**
- High throughput (millions of events/sec)
- Event replay (rebuild state from events)
- Multiple consumers per topic

**Cons:**
- Complex operational overhead
- Ordering guarantees within partition only
- Eventual consistency

---

## Data Management

### Database Per Service Pattern

**Each service owns its database. No direct database access between services.**

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  User Service   │       │  Order Service  │       │ Payment Service │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ PostgreSQL      │       │ MongoDB         │       │ PostgreSQL      │
└─────────────────┘       └─────────────────┘       └─────────────────┘
        ↑                         ↑                         ↑
        └─── REST API ────────────┴──── Message Queue ─────┘
```

**Benefits:**
- Independent scaling
- Technology flexibility (polyglot persistence)
- Clear boundaries

**Challenges:**
- Distributed transactions (use Saga pattern)
- Data consistency (eventual consistency)
- Joins across services (denormalization or API composition)

---

### Saga Pattern (Distributed Transactions)

**Problem:** No distributed ACID transactions across services.

**Solution:** Saga pattern - sequence of local transactions with compensating actions.

#### Choreography-Based Saga

**Services react to events:**

```
1. Order Service → CreateOrder → Emits "OrderCreated" event
2. Payment Service listens → ProcessPayment → Emits "PaymentCompleted" or "PaymentFailed"
3. Inventory Service listens to "PaymentCompleted" → ReserveInventory → Emits "InventoryReserved"
4. Order Service listens → CompleteOrder

If PaymentFailed:
  Order Service → CancelOrder (compensating action)
```

**Pros:**
- Simple, no orchestrator
- Loose coupling

**Cons:**
- Hard to understand flow (distributed logic)
- Circular dependencies possible

---

#### Orchestration-Based Saga

**Central orchestrator coordinates:**

```
Order Saga Orchestrator:
1. CreateOrder in Order Service
2. ProcessPayment in Payment Service
   - If fails → CancelOrder (compensate)
3. ReserveInventory in Inventory Service
   - If fails → RefundPayment (compensate) → CancelOrder
4. CompleteOrder in Order Service
```

**Pros:**
- Centralized logic (easier to understand)
- No circular dependencies

**Cons:**
- Orchestrator is single point of failure
- Tighter coupling (orchestrator knows all services)

---

## Service Discovery

**Problem:** Services need to find each other dynamically (IPs change in cloud environments).

### Client-Side Discovery (Netflix Eureka)

```
1. Services register with Eureka Server (name + IP + port)
2. Client queries Eureka: "Where is Order Service?"
3. Eureka returns: [order-service-1: 10.0.1.5:8080, order-service-2: 10.0.1.6:8080]
4. Client load balances and calls service directly
```

**Pros:**
- Client controls load balancing
- No extra network hop

**Cons:**
- Service discovery logic in every client
- Language-specific clients

---

### Server-Side Discovery (Kubernetes Service)

```
1. Services register with Kubernetes
2. Client calls: http://order-service:8080
3. Kubernetes Service load balances to available pods
4. Transparent to client
```

**Pros:**
- Language-agnostic
- Client simplicity (just use service name)

**Cons:**
- Extra network hop (through load balancer)
- Kubernetes-specific

---

## API Gateway Pattern

**Problem:** Clients need to call many microservices (N network calls, authentication duplicated, different protocols).

**Solution:** API Gateway - single entry point for all clients.

```
Mobile App ──┐
Web App ─────┤
IoT Device ──┤──→ API Gateway ──→ User Service
             │                 ├──→ Order Service
             │                 ├──→ Payment Service
             │                 └──→ Product Service
```

**API Gateway responsibilities:**
- **Routing** - Route requests to appropriate services
- **Authentication** - Centralized auth (JWT validation)
- **Rate limiting** - Throttle requests per client
- **Response aggregation** - Combine multiple service calls into one
- **Protocol translation** - REST → gRPC, HTTP → WebSocket

**Popular gateways:**
- Kong
- AWS API Gateway
- Azure API Management
- NGINX
- Envoy

---

## Observability and Monitoring

### The Three Pillars

#### 1. Logs

**Structured logging with correlation IDs.**

```json
{
  "timestamp": "2025-10-20T12:00:00Z",
  "level": "INFO",
  "service": "order-service",
  "trace_id": "abc123",
  "span_id": "def456",
  "message": "Order created",
  "order_id": "12345"
}
```

**Stack:** ELK (Elasticsearch, Logstash, Kibana) or Loki + Grafana

---

#### 2. Metrics

**Service health indicators.**

**RED metrics:**
- **Rate** - Requests per second
- **Errors** - Error rate (%)
- **Duration** - Response time (p50, p95, p99)

**USE metrics:**
- **Utilization** - CPU, memory usage
- **Saturation** - Queue depth
- **Errors** - Error count

**Stack:** Prometheus + Grafana

---

#### 3. Distributed Tracing

**Track requests across services.**

```
API Gateway [100ms] ──→ User Service [50ms]
                    └──→ Order Service [200ms] ──→ Payment Service [150ms]
                                               └──→ Inventory Service [100ms]

Total: 100ms (parallel execution)
```

**Stack:** Jaeger, Zipkin, AWS X-Ray, OpenTelemetry

**Critical for:**
- Performance debugging
- Understanding service dependencies
- Root cause analysis

---

## Testing Strategies

### Test Pyramid for Microservices

```
         /\
        /  \  E2E Tests (5%)
       /────\
      /      \ Integration Tests (15%)
     /────────\
    /          \ Unit Tests (80%)
   /────────────\
```

### 1. Unit Tests (80%)

**Test individual functions/classes.**

```python
def test_create_order():
    order_service = OrderService()
    order = order_service.create_order(user_id="123", items=[...])
    assert order.status == "pending"
    assert order.user_id == "123"
```

**Fast, isolated, no dependencies.**

---

### 2. Integration Tests (15%)

**Test service with real dependencies (database, message broker).**

```python
def test_order_service_with_database():
    # Use test database
    order_service = OrderService(db=test_db)
    order = order_service.create_order(...)

    # Verify saved to database
    saved_order = test_db.orders.find(order.id)
    assert saved_order is not None
```

**Use:** Docker Compose to spin up dependencies.

---

### 3. Contract Tests (Critical for Microservices!)

**Test service APIs don't break consumers.**

**Pact example:**
```python
# Consumer (Order Service) defines contract
pact.given('User 123 exists') \
    .upon_receiving('Request for user 123') \
    .with_request('GET', '/users/123') \
    .will_respond_with(200, body={'id': '123', 'name': 'Alice'})

# Provider (User Service) verifies it meets contract
verify_pact(UserService, pact_file)
```

**Prevents breaking changes!**

---

### 4. End-to-End Tests (5%)

**Test entire system flow.**

```python
# User places order → Payment processed → Inventory reserved
def test_complete_order_flow():
    # Create user
    user = create_user(name="Alice")

    # Place order
    order = place_order(user_id=user.id, items=[...])

    # Verify order completed
    assert order.status == "completed"

    # Verify inventory updated
    inventory = get_inventory(item_id="product-1")
    assert inventory.available == original - 1
```

**Slow, brittle, expensive. Use sparingly.**

---

## Deployment Patterns

### 1. Blue-Green Deployment

**Run two identical environments (Blue = current, Green = new).**

```
1. Blue environment serves all traffic
2. Deploy new version to Green environment
3. Test Green thoroughly
4. Switch traffic: Blue → Green (instant cutover)
5. Keep Blue as rollback option
```

**Pros:**
- Instant rollback
- Zero downtime

**Cons:**
- Expensive (2x resources)
- Database migrations tricky

---

### 2. Canary Deployment

**Gradually roll out to small percentage of users.**

```
1. Deploy new version to 5% of servers
2. Monitor metrics (errors, latency)
3. If good → 25% → 50% → 100%
4. If bad → Rollback to 0%
```

**Pros:**
- Low risk (impacts few users if broken)
- Gradual validation

**Cons:**
- Slower rollout
- Requires monitoring

---

### 3. Rolling Deployment

**Update instances one-by-one.**

```
Kubernetes Rolling Update:
1. Update Pod 1 → Wait for health check → Success
2. Update Pod 2 → Wait → Success
3. Update Pod 3 → Wait → Success
```

**Pros:**
- No extra resources needed
- Built into Kubernetes

**Cons:**
- Mixed versions during rollout
- Slower than blue-green

---

## Security

### 1. API Gateway Authentication

**Centralized auth at gateway.**

```
Client → API Gateway (validates JWT) → Services (no auth needed)
```

**Benefits:**
- Single auth point
- Services trust gateway

---

### 2. Service-to-Service Authentication

**Mutual TLS (mTLS) - Services authenticate each other.**

```
Order Service ←→ (mTLS) ←→ Payment Service
(Both verify each other's certificates)
```

**Implemented by:** Service mesh (Istio, Linkerd)

---

### 3. Secret Management

**Never hardcode secrets in code!**

**Use:** HashiCorp Vault, AWS Secrets Manager, Kubernetes Secrets

```python
# ❌ Bad
DATABASE_URL = "postgresql://user:password123@db:5432"

# ✅ Good
DATABASE_URL = get_secret("database_url")
```

---

## Common Anti-Patterns

### 1. Distributed Monolith ❌

**Microservices that must be deployed together.**

**Symptoms:**
- Service A depends on Service B's database
- Services share code (common library with business logic)
- Synchronized deployments

**Fix:** Enforce database per service, extract shared logic carefully.

---

### 2. Chatty Services ❌

**Services make too many synchronous calls to each other.**

```
Order Service → User Service → Profile Service → Preference Service
(4 network calls for one order!)
```

**Fix:**
- Denormalize data (cache user info in Order Service)
- Use async events
- API composition at gateway

---

### 3. Shared Database ❌

**Multiple services accessing same database.**

**Problems:**
- Tight coupling
- Can't scale independently
- Schema changes impact all services

**Fix:** Database per service + events for sync.

---

## Migration from Monolith

### Strangler Fig Pattern (Step-by-Step)

#### Step 1: Identify Service Boundary

**Choose low-risk, high-value service:**
- Well-defined boundary
- Few dependencies
- High change frequency (gets most benefit)

**Example:** Extract Payment Service first.

---

#### Step 2: Create New Service

**Build Payment Service:**
```
payment-service/
├── src/
│   ├── api/           # REST endpoints
│   ├── domain/        # Business logic
│   └── infrastructure/# Database, external integrations
├── Dockerfile
└── k8s/               # Kubernetes manifests
```

---

#### Step 3: Add Proxy/Routing

**Route payment requests to new service:**

```
API Gateway:
  if (request.path.startsWith('/payments')) {
    route to Payment Service
  } else {
    route to Monolith
  }
```

---

#### Step 4: Migrate Data

**Options:**
1. **Read from monolith DB, write to both** (transition period)
2. **Data sync job** (CDC - Change Data Capture)
3. **Event-based sync**

---

#### Step 5: Deprecate Monolith Code

**Remove payment code from monolith.**
- Delete payment module
- Remove database tables (after verification)

---

#### Step 6: Repeat

**Extract next service (Order Service, User Service, etc.).**

---

## Real-World Case Studies

### Netflix

**Scale:** 1000+ microservices, billions of requests/day

**Key Lessons:**
- Embrace failure (Chaos Monkey)
- Eventual consistency everywhere
- Client-side load balancing (Eureka, Ribbon)
- Circuit breakers (Hystrix)

**Tech Stack:** Java (Spring Boot), Cassandra, Kafka

---

### Uber

**Scale:** 2,200+ microservices

**Key Lessons:**
- Domain-driven decomposition
- Schemaless APIs initially (caused chaos!)
- Moved to Protocol Buffers (strict schemas)
- Invested heavily in observability (Jaeger)

**Tech Stack:** Go, Python, Java, PostgreSQL, Kafka

---

### Amazon

**Scale:** Unknown (thousands of services)

**Key Lessons:**
- Two-pizza teams (max 10 people per service)
- "You build it, you run it" (DevOps culture)
- Service-level SLAs (99.99% uptime)

**Tech Stack:** Java, C++, internal frameworks

---

## References

### Books

- Newman, Sam. *Building Microservices, 2nd Edition*. O'Reilly, 2021.
- Richardson, Chris. *Microservices Patterns*. Manning, 2018.
- Wolff, Eberhard. *Microservices: Flexible Software Architecture*. Addison-Wesley, 2016.

### Articles

- Fowler, Martin. "Microservices" (2014) - https://martinfowler.com/articles/microservices.html
- Richardson, Chris. "Pattern: Microservice Architecture" - https://microservices.io/patterns/microservices.html

### Online Resources

- microservices.io - Chris Richardson's pattern catalog
- Netflix Tech Blog - https://netflixtechblog.com/
- Uber Engineering Blog - https://eng.uber.com/

---

**Document Type:** Deep-Dive Guide
**Last Updated:** 2025-10-20
**Version:** 1.0
**Parent:** [Architecture Patterns Guide](overview.md)
