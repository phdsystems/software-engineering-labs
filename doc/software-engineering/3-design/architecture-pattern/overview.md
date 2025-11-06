# Architecture Patterns Guide

**Purpose:** Comprehensive architecture pattern selection and implementation guide for software projects
**Note:** All patterns are language-agnostic; examples are available in multiple languages
**Organization:** PHD Systems & PHD Labs
**Version:** 2.0
**Date:** 2025-10-20

**Quick Links:**
- 🎓 **[Learning Path](../../0-foundation/learning-path.md)** - Complete journey from principles to production
- 📐 **[Design Principles](../../0-foundation/design-principle/overview.md)** - SOLID, DRY, KISS, YAGNI (Foundation)
- 🎨 **[Design Patterns](../design-pattern/overview.md)** - Gang of Four + Modern patterns (Tactical)
- 📚 **[Complete Examples Index](../../4-development/example/examples-overview.md)** - All language implementations with navigation
- 🐍 **[Python Examples](../../4-development/example/examples-overview.md#python-examples-7-files)** - FastAPI, SQLAlchemy implementations
- ☕ **[Java Examples](../../4-development/example/examples-overview.md#java-examples-7-files)** - Spring Boot, Axon Framework implementations
- 🎯 **[Kotlin Examples](../../4-development/example/examples-overview.md#kotlin-examples-5-files)** - Kotlin with Spring Boot, Coroutines
- 🎸 **[Groovy Examples](../../4-development/example/examples-overview.md#groovy-examples-5-files)** - Groovy with Spring Boot, Spock testing
- 📘 **[TypeScript Examples](../../4-development/example/examples-overview.md#typescript-examples-1-file)** - Express.js, NestJS, type-safe implementations
- 🔷 **[Go Examples](../../4-development/example/examples-overview.md#go-examples-5-files)** - Gin, Echo, native concurrency
- 🦀 **[Rust Examples](../../4-development/example/examples-overview.md#rust-examples-5-files)** - Actix-web, Axum, memory-safe implementations
- 📖 **[Deep Dive Guides](./)** - Detailed pattern explanations

---

## TL;DR

**Comprehensive guide covering 13+ architecture patterns for modern software development**. All patterns are **language-agnostic** and work in any language (Python, Java, C#, Go, TypeScript, etc.). **Monolithic patterns**: Start with **Simple Modular** for MVPs → Graduate to **Modular Monolith** (5+ devs) → Use **Hexagonal/Clean** for complex domains. **Distributed patterns**: Use **Microservices** for independent scaling, **Event-Driven** for real-time systems, **CQRS + Event Sourcing** for audit/compliance. **Specialized patterns**: **Serverless** for sporadic workloads, **MVC/MVVM** for UI layers, **Pipe-and-Filter** for data pipelines. **Golden rule**: Start simple, evolve as needed. Pick the simplest pattern solving your current problems, not future hypotheticals. See [Pattern Selection Decision Tree](#pattern-selection-decision-tree) for guidance.

---

## Table of Contents

- [Overview](#overview)
- [Pattern Selection Decision Tree](#pattern-selection-decision-tree)
- [Architecture Patterns](#architecture-patterns)
  - **Monolithic Patterns**
    - [1. Simple Modular](#1-simple-modular-recommended-starting-point)
    - [2. Layered Architecture](#2-layered-architecture)
    - [3. Modular Monolith](#3-modular-monolith)
    - [4. Hexagonal Architecture (Ports & Adapters)](#4-hexagonal-architecture-ports--adapters)
    - [5. Clean Architecture](#5-clean-architecture)
  - **Distributed System Patterns**
    - [6. Microservices Architecture](#6-microservices-architecture)
    - [7. Event-Driven Architecture](#7-event-driven-architecture)
    - [8. Serverless Architecture](#8-serverless-architecture)
  - **Data Management Patterns**
    - [9. CQRS (Command Query Responsibility Segregation)](#9-cqrs-command-query-responsibility-segregation)
    - [10. Event Sourcing](#10-event-sourcing)
  - **Presentation Layer Patterns**
    - [11. MVC, MVP, MVVM](#11-mvc-mvp-mvvm)
  - **Data Processing Patterns**
    - [12. Pipe-and-Filter Architecture](#12-pipe-and-filter-architecture)
    - [13. Broker Architecture](#13-broker-architecture)
- [Pattern Comparison](#pattern-comparison)
- [Migration Paths](#migration-paths)
- [Real-World Examples](#real-world-examples)
- [Anti-Patterns](#anti-patterns)
- [Best Practices](#best-practices)
- [Language Portability](#language-portability)
- [References and Resources](#references-and-resources)

---

## Overview

**Architecture patterns are NOT about file structure** - they're about:
- How components depend on each other
- Where business logic lives
- How you isolate external dependencies
- How you organize code for maintainability and testability

### Prerequisites: Build Your Foundation First

Before diving into architecture patterns, ensure you understand the fundamentals:

**Level 0: Design Principles** (2-3 hours)
- 📐 **[Design Principles Guide](../../0-foundation/design-principle/overview.md)** - SOLID, DRY, KISS, YAGNI, Separation of Concerns
- 📚 **[SOLID Deep Dive](../../0-foundation/design-principle/solid-principle.md)** - The foundation for Clean Architecture
- 🎯 **Why?** Architecture patterns apply these principles at a system level

**Level 1: Design Patterns** (4-6 hours)
- 🎨 **[Design Patterns Guide](../design-pattern/overview.md)** - Gang of Four + Modern patterns
- 🏗️ **[Creational Patterns](../design-pattern/creational-pattern.md)** - Factory, Builder, Dependency Injection
- 🔧 **[Structural Patterns](../design-pattern/structural-pattern.md)** - Repository, Adapter, Decorator
- 🔄 **[Behavioral Patterns](../design-pattern/behavioral-pattern.md)** - Strategy, Observer, Saga
- 🎯 **Why?** Architecture patterns compose these smaller patterns into larger structures

**Already know these?** Continue below. **New to software engineering?** Start with the **[Learning Path](../../0-foundation/learning-path.md)** for the complete journey.

---

### Important: Patterns Are Language-Agnostic

**CRITICAL:** All architecture patterns in this guide are **language-agnostic concepts** that apply to:
- ✅ Python
- ✅ Java / Kotlin / Groovy
- ✅ TypeScript / JavaScript
- ✅ Go
- ✅ Rust
- ✅ Any object-oriented or functional language

The patterns themselves are universal software architecture principles with language-specific implementations available in the [examples/](../../4-development/example/) directory.

**Historical context:**
- Hexagonal Architecture: Originated in 2005 (language-agnostic)
- Clean Architecture: Defined for all languages (Robert C. Martin, 2012)
- Domain-Driven Design: Language-agnostic (Eric Evans, 2003)
- Microservices: Language-agnostic distributed systems pattern
- Event-Driven: Language-agnostic messaging pattern

**What's universal (works in any language):**
- Dependency rules (e.g., "dependencies point inward")
- Module boundaries (e.g., "domain has no external dependencies")
- Pattern principles (e.g., "Ports & Adapters", "Dependency Inversion")
- When to use each pattern (team size, complexity)
- Architecture decision criteria

**What's language-specific:**
- Code examples (syntax varies by language)
- File structure (language conventions)
- Tooling (build systems, package managers, testing frameworks)
- Dependency injection mechanisms

---

### Language-Specific Project Structure Examples

**Patterns apply consistently across languages, but project structure varies:**

**Python:**
```
your-project/
├── src/
│   ├── main/        # ← Architecture patterns go here
│   └── test/
├── pyproject.toml
└── Makefile
```

**Java:**
```
your-project/
├── src/
│   ├── main/java/   # ← Architecture patterns go here
│   └── test/java/
├── pom.xml
└── Makefile
```

**C#:**
```
your-project/
├── src/             # ← Architecture patterns go here
├── tests/
├── YourProject.sln
└── YourProject.csproj
```

**Go:**
```
your-project/
├── internal/        # ← Architecture patterns go here
├── pkg/
├── cmd/
└── go.mod
```

**TypeScript:**
```
your-project/
├── src/             # ← Architecture patterns go here
├── tests/
├── package.json
└── tsconfig.json
```

**All examples show where architecture patterns fit within each language's conventions.**

---

## Pattern Selection Decision Tree

```
Start Here: What are you building?
│
├─ MONOLITHIC APPLICATIONS (Single Deployment)
│  │
│  ├─ MVP / Proof of Concept / Small Project (<5 modules)?
│  │  └─ Use: Simple Modular ✅
│  │     Example: {data, models, api, utils}
│  │
│  ├─ Traditional CRUD app (database → service → API)?
│  │  └─ Use: Layered Architecture ✅
│  │     Example: {presentation, application, domain, infrastructure}
│  │
│  ├─ Growing application with multiple teams (5-20 developers)?
│  │  ├─ Clear module boundaries (e.g., users, orders, billing)?
│  │  │  └─ Use: Modular Monolith ✅
│  │  │     Example: {user_module, order_module, billing_module}
│  │  │
│  │  └─ Complex domain logic with many business rules?
│  │     └─ Use: Hexagonal Architecture ✅
│  │        Example: {domain, ports, adapters}
│  │
│  └─ Large enterprise system (20+ developers, complex rules)?
│     └─ Use: Clean Architecture ✅
│        Example: {entities, use_cases, interface_adapters, frameworks_drivers}
│
├─ DISTRIBUTED SYSTEMS (Multiple Deployments)
│  │
│  ├─ Need independent service scaling and deployment?
│  │  └─ Use: Microservices Architecture ✅
│  │     Example: user-service, order-service, payment-service (independent deployments)
│  │
│  ├─ Real-time / Event-driven requirements (async communication)?
│  │  └─ Use: Event-Driven Architecture ✅
│  │     Example: Events → Message Broker → Event Handlers
│  │
│  └─ Sporadic workloads / Pay-per-use cost model?
│     └─ Use: Serverless Architecture ✅
│        Example: AWS Lambda, Azure Functions, Google Cloud Functions
│
├─ DATA MANAGEMENT PATTERNS (Often combined with above)
│  │
│  ├─ Need separate read/write models for performance?
│  │  └─ Use: CQRS ✅
│  │     Example: Write Model (commands) | Read Model (queries)
│  │
│  └─ Need complete audit trail / time-travel capabilities?
│     └─ Use: Event Sourcing ✅
│        Example: Store all state changes as immutable events
│
├─ PRESENTATION LAYER (UI/Frontend)
│  │
│  ├─ Web application with user interface?
│  │  └─ Use: MVC, MVP, or MVVM ✅
│  │     MVC: Traditional server-side rendering
│  │     MVP: Desktop/mobile apps with testable presenters
│  │     MVVM: Modern frameworks (React, Vue, Angular)
│  │
│  └─ API-only backend (no UI)?
│     └─ Use patterns above + RESTful or GraphQL API design
│
└─ DATA PROCESSING PIPELINES
   │
   ├─ Sequential data transformations?
   │  └─ Use: Pipe-and-Filter Architecture ✅
   │     Example: Input → Filter1 → Filter2 → Filter3 → Output
   │
   └─ Distributed message routing between components?
      └─ Use: Broker Architecture ✅
         Example: Components → Broker (routes messages) → Components
```

**Golden Rules:**
1. **Start simple:** Begin with Simple Modular for monoliths, MVC for UIs
2. **Graduate when needed:** Add complexity only when you feel pain
3. **Combine patterns:** Microservices can use Hexagonal internally, CQRS works with Event Sourcing
4. **Consider team size:** Simpler patterns for smaller teams (<5 devs)

---

## Architecture Patterns

### 1. Simple Modular (Recommended Starting Point)

**Philosophy:** Organize by **functional areas** (what the code does), not layers.

#### When to Use

✅ **Best for:**
- MVPs and proof-of-concepts
- Small-to-medium projects (1-10 modules)
- Data pipelines and ML projects
- Projects with 1-5 developers
- Fast iteration and experimentation

❌ **Avoid when:**
- Multiple teams working on same codebase (use Modular Monolith)
- Complex business rules requiring strict boundaries (use Hexagonal)

#### Structure (Language-Agnostic)

```
{project-root}/
├── data/              # Data ingestion and processing
│   ├── ingestion      # Data fetching module
│   ├── validation     # Data quality checks
│   └── preprocessing  # Data transformation
│
├── models/            # Model implementations
│   ├── classifier     # Classification models
│   └── regressor      # Regression models
│
├── api/               # API endpoints
│   ├── routes         # Route definitions
│   └── schemas        # Request/response schemas
│
├── training/          # Training logic
│   └── trainer        # Training orchestration
│
└── utils/             # Shared utilities
    ├── config         # Configuration loader
    └── logging        # Logging setup
```

**Note:** File extensions and package files (like `__init__.py`) are language-specific. See language-specific implementations below for actual file structures.

#### Characteristics

| Aspect | Implementation |
|--------|----------------|
| **Organization** | Functional modules (data, models, api) |
| **Dependencies** | Modules can import each other (with discipline) |
| **Business Logic** | Lives in module-specific files |
| **External Dependencies** | Direct imports where needed |
| **Testing** | Test per module, mocks for external deps |
| **Complexity** | Low - Easy to understand |

#### Conceptual Example: ML Forecasting System

**Core Components:**

1. **Data Module**
   - Fetches time series data from external sources
   - Validates data quality
   - Preprocesses for model input

2. **Models Module**
   - Time series forecasting model implementation
   - Model loading and inference
   - Prediction logic

3. **API Module**
   - HTTP endpoints for predictions
   - Request/response handling
   - Model orchestration

**Language-Specific Implementations:**

| Language | Framework | Status | Link |
|----------|-----------|--------|------|
| 🐍 **Python** | FastAPI + PyTorch | ✅ Complete | **[View Guide](../../4-development/example/python/simple-modular-ml-example.md)** |
| ☕ **Java** | Spring Boot + DL4J | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |
| 💎 **C#** | ASP.NET Core + ML.NET | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |
| 🔷 **TypeScript** | NestJS + TensorFlow.js | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |

#### Pros & Cons

**Pros:**
- ✅ Simple and intuitive
- ✅ Fast to set up
- ✅ Easy to understand for new developers
- ✅ Minimal boilerplate
- ✅ Perfect for MVPs

**Cons:**
- ❌ Can become messy with circular dependencies
- ❌ No strict boundaries (requires discipline)
- ❌ Harder to scale to large teams
- ❌ Modules can become tightly coupled

#### Migration Path

**When to migrate:**
- Team grows beyond 5 developers
- Circular dependencies become problematic
- Need independent module ownership

**Migrate to:** Modular Monolith (add module boundaries) or Hexagonal (add ports/adapters)

---

### 2. Layered Architecture

**Philosophy:** Organize by **technical layers** (presentation, business, data).

#### When to Use

✅ **Best for:**
- Traditional web applications (CRUD)
- Applications with clear layer separation
- Teams familiar with layered architecture
- Django/Flask applications

❌ **Avoid when:**
- Complex domain logic (use Hexagonal)
- Need for independent modules (use Modular Monolith)

#### Structure

```
src/main/
├── presentation/        # API layer (controllers, views)
│   ├── __init__.py
│   ├── api/
│   │   ├── routes.py
│   │   └── schemas.py
│   └── cli/
│       └── commands.py
│
├── application/         # Service layer (use cases)
│   ├── __init__.py
│   ├── user_service.py
│   └── order_service.py
│
├── domain/              # Business logic layer (entities, domain services)
│   ├── __init__.py
│   ├── entities/
│   │   ├── user.py
│   │   └── order.py
│   └── services/
│       └── pricing_service.py
│
└── infrastructure/      # Data access layer (repositories, external services)
    ├── __init__.py
    ├── database/
    │   ├── repositories.py
    │   └── models.py
    └── external/
        └── payment_gateway.py
```

#### Dependency Rules

```
Presentation
    ↓ depends on
Application
    ↓ depends on
Domain
    ↑ depends on
Infrastructure
```

**Rule:** Each layer only depends on the layer directly below it.

#### Conceptual Example: E-commerce Application

**Core Components:**

1. **Domain Layer (Entities)**
   - Order entity with business rules (e.g., apply discount)
   - Pure business logic, no infrastructure dependencies
   - Domain services for complex operations

2. **Application Layer (Services)**
   - OrderService orchestrates use cases
   - Depends on domain entities and infrastructure repositories
   - Coordinates workflow (create order, save to DB)

3. **Presentation Layer (API)**
   - HTTP endpoints for order management
   - Calls application services
   - Handles request/response formatting

**Flow:**
```
HTTP Request → Presentation (API route)
            → Application (OrderService)
            → Domain (Order entity)
            → Infrastructure (OrderRepository)
            → Database
```

**Language-Specific Implementations:**

| Language | Framework | Status | Link |
|----------|-----------|--------|------|
| 🐍 **Python** | FastAPI + SQLAlchemy | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |
| ☕ **Java** | Spring Boot + JPA | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |
| 💎 **C#** | ASP.NET Core + EF Core | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |
| 🔷 **TypeScript** | NestJS + TypeORM | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |

#### Pros & Cons

**Pros:**
- ✅ Well-understood pattern
- ✅ Clear separation of concerns
- ✅ Easy to explain to new developers
- ✅ Works well for CRUD applications

**Cons:**
- ❌ Can lead to anemic domain models
- ❌ Business logic often leaks into application layer
- ❌ Horizontal slicing (hard to change features)
- ❌ Tight coupling between layers

---

### 3. Modular Monolith

**Philosophy:** Organize by **business modules** with strict boundaries, but deploy as one application.

#### When to Use

✅ **Best for:**
- Growing applications (5-20 developers)
- Multiple teams working on different features
- Clear business domain boundaries (e.g., users, orders, billing)
- Need independent module evolution
- Eventual microservices migration

❌ **Avoid when:**
- Small project (<5 developers) - Simple Modular is better
- No clear domain boundaries yet

#### Structure

```
src/main/
├── user_management/         # Module 1: Complete vertical slice
│   ├── __init__.py
│   ├── api/                 # Module's API layer
│   │   ├── routes.py
│   │   └── schemas.py
│   ├── domain/              # Module's domain logic
│   │   ├── user.py
│   │   └── user_service.py
│   ├── infrastructure/      # Module's data access
│   │   └── user_repository.py
│   └── tests/               # Module's tests
│       └── test_user_service.py
│
├── order_processing/        # Module 2: Independent module
│   ├── api/
│   ├── domain/
│   ├── infrastructure/
│   └── tests/
│
├── billing/                 # Module 3: Independent module
│   ├── api/
│   ├── domain/
│   ├── infrastructure/
│   └── tests/
│
└── shared/                  # Shared kernel (minimal)
    ├── domain/
    │   └── value_objects.py
    └── infrastructure/
        └── database.py
```

#### Module Communication Rules

**CRITICAL:** Modules communicate through **defined interfaces** only.

```python
# ✅ GOOD: Module communication through interface
# src/main/order_processing/domain/order_service.py
from src.main.user_management.api.user_api import UserAPI  # Public API

class OrderService:
    def create_order(self, user_id: str):
        user = UserAPI.get_user(user_id)  # Through public interface
        return Order(user_id=user.id)

# ❌ BAD: Direct access to internal module details
from src.main.user_management.infrastructure.user_repository import UserRepository

class OrderService:
    def create_order(self, user_id: str):
        repo = UserRepository()  # Direct coupling to internals!
        user = repo.find(user_id)
```

#### Module Contract

Each module exposes:
1. **Public API** (`api/` folder) - How other modules interact
2. **Events** (optional) - Async communication
3. **Shared Types** (minimal) - Common value objects

#### Conceptual Example: E-commerce Modular Monolith

**Core Concept:**

Each module is a complete vertical slice with its own API, domain, and infrastructure. Modules communicate only through public APIs.

**User Management Module:**
- Public API: UserAPI (how other modules access users)
- Domain: User entity, UserService
- Infrastructure: UserRepository (database access)
- Other modules call UserAPI.get_user(), never access internal components

**Order Processing Module:**
- Public API: OrderAPI
- Domain: Order entity, OrderService
- Infrastructure: OrderRepository
- Calls User module through UserAPI (not UserRepository directly!)

**Key Principle:**
```
Order Module → UserAPI (✅ public interface)
           ❌ → UserRepository (internal implementation)
```

**Language-Specific Implementations:**

| Language | Framework | Status | Link |
|----------|-----------|--------|------|
| 🐍 **Python** | FastAPI + Modules | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |
| ☕ **Java** | Spring Boot + Modules | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |
| 💎 **C#** | ASP.NET Core + Modules | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |
| 🔷 **TypeScript** | NestJS + Modules | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |

#### Pros & Cons

**Pros:**
- ✅ Scales to large teams (each owns modules)
- ✅ Clear boundaries prevent coupling
- ✅ Easy to extract to microservices later
- ✅ Modules can evolve independently
- ✅ Still deployed as single application (simple)

**Cons:**
- ❌ Requires discipline to maintain boundaries
- ❌ More boilerplate than Simple Modular
- ❌ Need tooling to enforce module boundaries
- ❌ Can be over-engineering for small projects

---

### 4. Hexagonal Architecture (Ports & Adapters)

**Philosophy:** **Domain logic at center**, isolated from external concerns via ports (interfaces) and adapters (implementations).

#### When to Use

✅ **Best for:**
- Domain-rich applications (complex business rules)
- Need for high testability (mock all external deps)
- Applications with multiple interfaces (API, CLI, message queue)
- Long-lived projects requiring flexibility

❌ **Avoid when:**
- Simple CRUD (use Layered)
- Small projects (use Simple Modular)
- Minimal business logic

#### Structure

```
src/main/
├── domain/                  # Core - Business logic (no external deps!)
│   ├── __init__.py
│   ├── entities/
│   │   ├── user.py
│   │   └── order.py
│   ├── services/
│   │   └── order_service.py
│   └── value_objects/
│       └── money.py
│
├── ports/                   # Interfaces (contracts)
│   ├── __init__.py
│   ├── inbound/             # How outside world calls us
│   │   └── order_use_case.py
│   └── outbound/            # How we call outside world
│       ├── order_repository.py
│       └── payment_gateway.py
│
└── adapters/                # Implementations of ports
    ├── __init__.py
    ├── inbound/             # Driving adapters (API, CLI)
    │   ├── api/
    │   │   ├── routes.py
    │   │   └── schemas.py
    │   └── cli/
    │       └── commands.py
    └── outbound/            # Driven adapters (DB, external services)
        ├── database/
        │   ├── postgres_order_repo.py
        │   └── models.py
        └── external/
            └── stripe_payment_gateway.py
```

#### Dependency Rules

```
        Adapters (Inbound)
               ↓ depends on
            Ports (Inbound)
               ↓ depends on
            Domain (Core)
               ↑ depends on
            Ports (Outbound)
               ↑ implemented by
        Adapters (Outbound)
```

**CRITICAL:** Domain has **ZERO dependencies** on external world. All external access through ports (interfaces).

#### Conceptual Example: Banking Application

**Architecture Layers:**

1. **Domain (Core)**
   - Account entity with withdraw() business rule
   - TransferService orchestrates money transfers
   - NO external dependencies (no database, no framework imports)
   - Depends ONLY on ports (interfaces)

2. **Ports (Interfaces)**
   - Outbound: AccountRepository interface (domain defines what it needs)
   - Domain depends on this interface, not concrete implementation
   - "Domain tells the infrastructure what it needs"

3. **Adapters (Implementations)**
   - Outbound: PostgresAccountRepository implements AccountRepository
   - Inbound: REST API adapter calls TransferService
   - Database-specific code lives here, NOT in domain

**Key Architecture Flow:**
```
HTTP Request (Inbound Adapter)
    ↓
TransferService (Domain)
    ↓ depends on
AccountRepository (Port/Interface)
    ↑ implemented by
PostgresAccountRepository (Outbound Adapter)
    ↓
PostgreSQL Database
```

**Critical Insight:**
- Domain defines AccountRepository **interface** (what it needs)
- Adapter implements AccountRepository **concretely** (how to do it)
- Domain knows nothing about PostgreSQL, MongoDB, or any specific database
- Easy to swap: PostgreSQL → MongoDB by changing adapter only

**Testing Benefit:**
```
Unit Test → Mock AccountRepository → Test TransferService
         (No database, no external dependencies!)
```

**Language-Specific Implementations:**

| Language | Framework | Database | Status | Link |
|----------|-----------|----------|--------|------|
| 🐍 **Python** | FastAPI | PostgreSQL | ✅ Complete | **[View Guide](../../4-development/example/python/hexagonal-banking-example.md)** |
| ☕ **Java** | Spring Boot | PostgreSQL | ✅ Complete | **[View Guide](../../4-development/example/java/clean-architecture-example.md)** |
| 💎 **C#** | ASP.NET Core | SQL Server | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |
| 🔷 **TypeScript** | NestJS | PostgreSQL | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |

#### Testing Benefits

**Pure Domain Testing (No Database Required):**

**Concept:**
- Mock the AccountRepository interface (port)
- Test TransferService with mock repository
- No database setup, no external dependencies
- Tests run in milliseconds, not seconds

**Test Structure:**
1. Create mock repository (port)
2. Configure mock to return test accounts
3. Call TransferService.transfer()
4. Verify business logic executed correctly
5. Verify repository save was called

**Benefit:**
```
Traditional Test: Start DB → Seed data → Test → Cleanup (5 seconds)
Hexagonal Test:   Mock port → Test → Done (50 milliseconds)
```

**See language-specific implementation guides for complete test examples.**

#### Pros & Cons

**Pros:**
- ✅ Domain logic completely isolated (testable without DB/API)
- ✅ Easy to swap implementations (Postgres → MongoDB, REST → GraphQL)
- ✅ Business logic is clear and protected
- ✅ Multiple interfaces trivial (API + CLI + Message Queue)

**Cons:**
- ❌ More boilerplate (ports + adapters)
- ❌ Steeper learning curve
- ❌ Can feel like over-engineering for simple apps
- ❌ Need discipline to maintain boundaries

---

### 5. Clean Architecture

**Philosophy:** **Dependency Inversion** - Dependencies point **inward** toward business rules. Most rigorous separation of concerns.

**📘 [Deep Dive: Clean Architecture →](deep-dive-clean-architecture.md)**
*Comprehensive guide covering The Dependency Rule, four-layer architecture (Entities, Use Cases, Interface Adapters, Frameworks & Drivers), dependency inversion in practice, data flow, testing strategy by layer, and implementation guidelines.*

#### When to Use

✅ **Best for:**
- Large enterprise applications (20+ developers)
- Long-lived projects (10+ years)
- Complex business rules requiring strict protection
- Multiple teams with different release cycles

❌ **Avoid when:**
- Small-to-medium projects (use Hexagonal)
- Fast iteration needed (too much structure)
- Team unfamiliar with Clean Architecture

#### Structure (4 Layers)

```
src/main/
├── entities/                    # Layer 1: Enterprise Business Rules
│   ├── __init__.py              # Innermost - NO dependencies
│   ├── user.py
│   └── order.py
│
├── use_cases/                   # Layer 2: Application Business Rules
│   ├── __init__.py              # Depends ONLY on entities
│   ├── create_order.py
│   ├── cancel_order.py
│   └── ports/                   # Use case interfaces
│       ├── order_repository.py
│       └── notification_service.py
│
├── interface_adapters/          # Layer 3: Adapters
│   ├── __init__.py              # Depends on use_cases
│   ├── controllers/             # Input adapters
│   │   ├── order_controller.py
│   │   └── user_controller.py
│   ├── presenters/              # Output formatters
│   │   └── order_presenter.py
│   └── gateways/                # Data access implementations
│       ├── postgres_order_repo.py
│       └── email_notification.py
│
└── frameworks_drivers/          # Layer 4: External Interfaces
    ├── __init__.py              # Outermost - frameworks, tools
    ├── web/                     # Web framework (FastAPI, Flask)
    │   ├── app.py
    │   └── routes.py
    ├── database/                # Database (SQLAlchemy, etc.)
    │   ├── connection.py
    │   └── models.py
    └── cli/                     # CLI framework
        └── commands.py
```

#### Dependency Rules (The Dependency Rule)

```
    Frameworks/Drivers (Layer 4)
            ↓ depends on
    Interface Adapters (Layer 3)
            ↓ depends on
    Use Cases (Layer 2)
            ↓ depends on
    Entities (Layer 1)
```

**CRITICAL RULE:** Dependencies can only point **INWARD**. Inner layers know **NOTHING** about outer layers.

#### Conceptual Example: Order Processing System

**4-Layer Architecture:**

**Layer 1: Entities (Enterprise Business Rules)**
- Order entity with core business rules
- confirm(): Can only confirm pending orders
- cancel(): Cannot cancel confirmed orders
- NO dependencies (innermost layer)
- Pure domain logic

**Layer 2: Use Cases (Application Business Rules)**
- CreateOrderUseCase orchestrates order creation workflow
- Depends ONLY on entities and use case ports (interfaces)
- Defines what it needs via ports (OrderRepository, NotificationService)
- Contains application-specific business rules

**Layer 3: Interface Adapters**
- Controllers: Convert HTTP requests to use case requests
- Gateways: Implement repository ports (e.g., PostgresOrderRepository)
- Presenters: Format use case responses for HTTP
- Adapts between use cases and external interfaces

**Layer 4: Frameworks & Drivers**
- Web framework routes (FastAPI, Flask, etc.)
- Database connections (SQLAlchemy, psycopg2, etc.)
- External service clients
- Dependency injection wiring

**Dependency Flow (CRITICAL):**
```
Layer 4 (Frameworks) depends on →
Layer 3 (Interface Adapters) depends on →
Layer 2 (Use Cases) depends on →
Layer 1 (Entities) depends on → NOTHING

Dependencies point INWARD only!
```

**Example Flow: Create Order**
```
1. HTTP POST /orders (Layer 4: Web framework)
   ↓
2. OrderController.create_order() (Layer 3: Controller)
   ↓ converts HTTP request to use case request
3. CreateOrderUseCase.execute() (Layer 2: Use case)
   ↓ creates Order entity
4. Order (Layer 1: Entity validates business rules)
   ↑
5. OrderRepository.save() (Layer 2: Port/interface)
   ↑ implemented by
6. PostgresOrderRepository.save() (Layer 3: Gateway)
   ↓
7. PostgreSQL Database (Layer 4: External)
```

**Testing at Each Layer:**

**Layer 1 (Entities):**
- Test Order.confirm() with no mocks
- Pure logic, instant tests

**Layer 2 (Use Cases):**
- Mock OrderRepository and NotificationService (ports)
- Test CreateOrderUseCase.execute()
- No database, no HTTP

**Layer 3 (Gateways):**
- Integration tests with real database
- Test PostgresOrderRepository

**Layer 4 (Web):**
- End-to-end tests
- Full HTTP → Database flow

**Language-Specific Implementations:**

| Language | Framework | Database | Status | Link |
|----------|-----------|----------|--------|------|
| 🐍 **Python** | FastAPI | PostgreSQL | ✅ Complete | **[View Guide](../../4-development/example/python/clean-architecture-banking-example.md)** |
| ☕ **Java** | Spring Boot | PostgreSQL | ✅ Complete | **[View Guide](../../4-development/example/java/clean-architecture-example.md)** |
| 💎 **C#** | ASP.NET Core | SQL Server | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |
| 🔷 **TypeScript** | NestJS | PostgreSQL | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |

#### Testing Strategy by Layer

**Layer 1: Entities (Unit Tests - No Mocks)**

**What to test:**
- Pure business logic methods (confirm, cancel)
- Business rule validation
- Domain exceptions

**How:**
- Create entity instances directly
- Call methods
- Assert state changes
- NO mocks needed (no dependencies!)

**Speed:** Milliseconds per test

---

**Layer 2: Use Cases (Unit Tests - Mock Ports)**

**What to test:**
- Use case orchestration logic
- Workflow execution
- Port interactions

**How:**
- Mock all ports (repositories, services)
- Inject mocks into use case
- Execute use case
- Verify port methods called correctly

**Speed:** Fast (no database or HTTP)

---

**Layer 3: Gateways (Integration Tests - Real Infrastructure)**

**What to test:**
- Repository implementations
- Database queries
- External service integrations

**How:**
- Use test database
- Create gateway instance
- Perform operations
- Verify data persisted

**Speed:** Slower (real database)

---

**Layer 4: Frameworks (End-to-End Tests)**

**What to test:**
- Full HTTP → Database flow
- Dependency injection wiring
- Framework integration

**How:**
- Start test server
- Make HTTP requests
- Verify responses and DB state

**Speed:** Slowest (full stack)

---

**See language-specific implementation guides for complete test code examples.**

#### Pros & Cons

**Pros:**
- ✅ Maximum testability (each layer tested independently)
- ✅ Business rules completely protected from external changes
- ✅ Framework-agnostic (swap FastAPI → Flask easily)
- ✅ Database-agnostic (swap Postgres → MongoDB easily)
- ✅ Scales to very large teams

**Cons:**
- ❌ High initial complexity
- ❌ Significant boilerplate
- ❌ Steep learning curve
- ❌ Can feel like over-engineering for medium projects
- ❌ Requires strong team discipline

---

## Distributed System Patterns

### 6. Microservices Architecture

**Philosophy:** Decompose application into **small, independent services** that can be deployed, scaled, and maintained separately.

**📘 [Deep Dive: Microservices Architecture →](deep-dive-microservices.md)**
*Comprehensive guide covering service decomposition, communication patterns, data management, Saga pattern, API Gateway, observability, testing strategies, deployment patterns, and migration from monolith.*

#### When to Use

✅ **Best for:**
- Large applications requiring independent scaling (100+ developers)
- Services with different technology requirements
- Need for independent deployment cycles per team
- Different scaling requirements per component
- Long-lived systems evolving independently

❌ **Avoid when:**
- Small team (<10 developers) - overhead too high
- Unclear domain boundaries
- Tight coupling between components
- Starting new project (use Modular Monolith first)

#### Structure

**Each microservice is independently deployable:**

```
organization/
├── user-service/              # Independent service
│   ├── src/
│   │   └── main/
│   │       ├── api/           # REST/GraphQL endpoints
│   │       ├── domain/        # Business logic
│   │       └── infrastructure/# Database, messaging
│   ├── Dockerfile
│   └── k8s/                   # Kubernetes manifests
│
├── order-service/             # Independent service
│   ├── src/
│   │   └── main/
│   │       ├── api/
│   │       ├── domain/
│   │       └── infrastructure/
│   ├── Dockerfile
│   └── k8s/
│
└── payment-service/           # Independent service
    ├── src/
    ├── Dockerfile
    └── k8s/
```

#### Service Communication

**Synchronous (Request-Response):**
- REST APIs (HTTP/JSON)
- gRPC (HTTP/2 + Protocol Buffers)
- GraphQL

**Asynchronous (Event-Driven):**
- Message queues (RabbitMQ, Apache Kafka)
- Event streaming
- Pub/Sub patterns

#### Characteristics

| Aspect | Implementation |
|--------|----------------|
| **Deployment** | Each service deployed independently |
| **Database** | Database per service (no shared databases) |
| **Communication** | REST, gRPC, message queues |
| **Scaling** | Independent scaling per service |
| **Technology** | Polyglot (different languages/frameworks per service) |
| **Complexity** | Very High - distributed systems challenges |

#### Conceptual Example: E-commerce Platform

**Service Decomposition:**

**User Service:**
- Handles authentication, user profiles
- Independent database (PostgreSQL)
- Exposes REST API
- Deployed independently

**Order Service:**
- Manages orders and order lifecycle
- Independent database (MongoDB)
- Listens to payment events
- Calls inventory service via REST

**Payment Service:**
- Processes payments
- Independent database (PostgreSQL)
- Publishes payment events to message broker
- Integrates with external payment gateways

**Service Interaction Flow:**
```
User places order:
1. User Service validates authentication
2. Order Service creates order (calls Inventory Service)
3. Order Service publishes "OrderCreated" event
4. Payment Service listens, processes payment
5. Payment Service publishes "PaymentCompleted" event
6. Order Service listens, confirms order
```

**Language-Specific Implementations:**

| Language | Framework | Status | Link |
|----------|-----------|--------|------|
| 🐍 **Python** | FastAPI + Kafka | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |
| ☕ **Java** | Spring Boot + Kafka | ✅ Complete | **[View Guide](../../4-development/example/java/microservices-example.md)** |
| 💎 **C#** | ASP.NET Core + RabbitMQ | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |
| 🔷 **TypeScript** | NestJS + Kafka | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |

#### Pros & Cons

**Pros:**
- ✅ Independent deployment and scaling
- ✅ Technology heterogeneity (best tool per service)
- ✅ Fault isolation (one service failure doesn't crash all)
- ✅ Team autonomy (teams own services)
- ✅ Independent evolution of services

**Cons:**
- ❌ Very high operational complexity
- ❌ Distributed systems challenges (network latency, failures)
- ❌ Data consistency challenges (eventual consistency)
- ❌ Testing complexity (integration tests across services)
- ❌ Requires DevOps maturity (CI/CD, monitoring, logging)
- ❌ Increased infrastructure costs

#### Migration Path

**From Modular Monolith → Microservices:**
1. Start with Modular Monolith (clear module boundaries)
2. Extract one module as standalone service
3. Implement service communication (REST/messaging)
4. Gradually extract other modules
5. Implement service mesh, API gateway, observability

**See:** [Migration Paths](#migration-paths) section for detailed steps.

---

### 7. Event-Driven Architecture

**Philosophy:** Components communicate through **asynchronous events** rather than direct calls. Producers emit events; consumers react to them.

**📘 [Deep Dive: Event-Driven Architecture →](deep-dive-event-driven.md)**
*Comprehensive guide covering event patterns, message brokers, guaranteed delivery, exactly-once processing, event schema evolution, and real-world case studies from Netflix, Uber, and Airbnb.*

#### When to Use

✅ **Best for:**
- Real-time data processing systems
- Systems requiring high scalability
- Loose coupling between components
- Async workflows (order processing, notifications)
- IoT and streaming data applications

❌ **Avoid when:**
- Simple request-response workflows
- Immediate consistency required
- Team unfamiliar with async programming
- Debugging complexity not acceptable

#### Structure

```
application/
├── producers/                 # Event producers
│   ├── order_service.py       # Emits "OrderCreated" events
│   └── payment_service.py     # Emits "PaymentProcessed" events
│
├── events/                    # Event definitions
│   ├── order_events.py
│   └── payment_events.py
│
├── consumers/                 # Event consumers
│   ├── notification_handler.py  # Listens to events
│   ├── inventory_handler.py
│   └── analytics_handler.py
│
└── infrastructure/
    └── event_bus.py           # Message broker (Kafka, RabbitMQ)
```

#### Event Flow

```
Producer                Event Bus               Consumer
   │                       │                       │
   │─────Publish Event────>│                       │
   │   (OrderCreated)      │                       │
   │                       │────Subscribe Events───>│
   │                       │                       │
   │                       │───Deliver Event──────>│
   │                       │                       │
   │                       │<──Acknowledge─────────│
```

#### Characteristics

| Aspect | Implementation |
|--------|----------------|
| **Coupling** | Loose - producers don't know consumers |
| **Communication** | Asynchronous via message broker |
| **Scalability** | High - consumers can scale independently |
| **Consistency** | Eventual consistency |
| **Debugging** | Harder - distributed tracing required |

#### Conceptual Example: Order Processing System

**Event Flow:**

1. **User places order** → OrderService emits `OrderCreated` event
2. **InventoryService** listens → Reserves inventory → Emits `InventoryReserved` event
3. **PaymentService** listens → Processes payment → Emits `PaymentCompleted` event
4. **NotificationService** listens → Sends confirmation email
5. **AnalyticsService** listens → Updates dashboards

**Key Principles:**
- Producers don't know consumers exist (loose coupling)
- Multiple consumers can react to same event
- Events are immutable (never modified after creation)
- Consumers can be added without changing producers

**Language-Specific Implementations:**

| Language | Framework | Message Broker | Status | Link |
|----------|-----------|----------------|--------|------|
| 🐍 **Python** | FastAPI | Apache Kafka | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |
| ☕ **Java** | Spring Boot | Apache Kafka | ✅ Complete | **[View Guide](../../4-development/example/java/event-driven-example.md)** |
| 💎 **C#** | ASP.NET Core | RabbitMQ | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |
| 🔷 **TypeScript** | NestJS | RabbitMQ | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |

#### Pros & Cons

**Pros:**
- ✅ Loose coupling (producers/consumers independent)
- ✅ High scalability (async processing)
- ✅ Resilience (consumers can retry on failure)
- ✅ Easy to add new consumers (no producer changes)
- ✅ Real-time data processing

**Cons:**
- ❌ Eventual consistency (not immediate)
- ❌ Debugging difficulty (distributed traces needed)
- ❌ Message ordering challenges
- ❌ Duplicate message handling required
- ❌ Requires message broker infrastructure

---

### 8. Serverless Architecture

**Philosophy:** Execute code in **stateless compute containers** triggered by events. Infrastructure managed by cloud provider.

**📘 [Deep Dive: Serverless Architecture →](deep-dive-serverless.md)**
*Comprehensive guide covering FaaS platforms (AWS Lambda, Azure Functions), cold starts optimization, function design patterns, state management, cost optimization, and real-world case studies from Coca-Cola and Netflix.*

#### When to Use

✅ **Best for:**
- Sporadic or unpredictable workloads
- Event-driven processing (file uploads, webhooks)
- Rapid prototyping and MVPs
- Cost optimization (pay-per-use)
- Auto-scaling requirements

❌ **Avoid when:**
- Long-running processes (>15 minutes)
- Predictable high-volume traffic (traditional servers cheaper)
- Low-latency requirements (cold start issues)
- Need for stateful connections

#### Structure

**Function-based architecture:**

```
serverless-app/
├── functions/                 # Individual functions
│   ├── create_user/
│   │   ├── handler.py         # Lambda/Function handler
│   │   └── requirements.txt
│   ├── process_order/
│   │   └── handler.py
│   └── send_notification/
│       └── handler.py
│
├── events/                    # Event definitions
│   └── triggers.yml           # API Gateway, S3, SQS triggers
│
└── infrastructure/
    ├── serverless.yml         # Serverless Framework config
    └── terraform/             # Infrastructure as Code
```

#### Trigger Types

**Common triggers:**
- **HTTP Requests** (API Gateway → Function)
- **File uploads** (S3 → Function)
- **Database changes** (DynamoDB Streams → Function)
- **Scheduled events** (CloudWatch Events → Function)
- **Message queues** (SQS → Function)

#### Characteristics

| Aspect | Implementation |
|--------|----------------|
| **Infrastructure** | Fully managed by cloud provider |
| **Scaling** | Automatic (0 to thousands of instances) |
| **Pricing** | Pay-per-execution + duration |
| **State** | Stateless (use external storage) |
| **Execution Time** | Limited (AWS Lambda: 15 min max) |

#### Conceptual Example: Image Processing Service

**Architecture:**

1. **User uploads image** → S3 bucket
2. **S3 triggers Lambda function** → Image processing
3. **Lambda resizes images** (thumbnail, medium, large)
4. **Lambda stores results** → S3 bucket
5. **Lambda updates metadata** → DynamoDB

**Benefits:**
- No server management
- Auto-scales with uploads
- Pay only when processing images
- Zero cost when idle

**Language-Specific Implementations:**

| Language | Platform | Status | Link |
|----------|----------|--------|------|
| 🐍 **Python** | AWS Lambda | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |
| ☕ **Java** | AWS Lambda | ✅ Complete | **[View Guide](../../4-development/example/java/serverless-example.md)** |
| 💎 **C#** | Azure Functions | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |
| 🔷 **TypeScript** | AWS Lambda | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |
| 🦀 **Go** | AWS Lambda | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |

#### Pros & Cons

**Pros:**
- ✅ Zero infrastructure management
- ✅ Automatic scaling (0 to ∞)
- ✅ Pay-per-use pricing (cost-efficient for sporadic loads)
- ✅ Rapid development and deployment
- ✅ Built-in high availability

**Cons:**
- ❌ Cold start latency (first invocation slow)
- ❌ Execution time limits (15 min AWS Lambda)
- ❌ Vendor lock-in (cloud provider-specific)
- ❌ Limited control over runtime environment
- ❌ Debugging difficulty (distributed, ephemeral)
- ❌ Can be expensive for high-volume consistent traffic

---

## Data Management Patterns

### 9. CQRS (Command Query Responsibility Segregation)

**Philosophy:** Separate **write operations (commands)** from **read operations (queries)** using different models optimized for each.

**📘 [Deep Dive: CQRS →](deep-dive-cqrs.md)**
*Comprehensive guide covering command vs. query models, write side (normalized domain model), read side (denormalized views), synchronization patterns (events, CDC, triggers), consistency models (strong vs. eventual), combining with Event Sourcing, and testing strategies.*

#### When to Use

✅ **Best for:**
- High read/write ratio disparity (e.g., 1000:1 reads to writes)
- Complex read queries requiring denormalization
- Different scaling requirements for reads vs writes
- Performance optimization requirements
- Audit and compliance needs (separate command logging)

❌ **Avoid when:**
- Simple CRUD applications (overkill)
- Balanced read/write workloads
- Team unfamiliar with pattern (steep learning curve)
- Immediate consistency required across all views

#### Structure

```
application/
├── commands/                  # Write side (Command Model)
│   ├── create_order_command.py
│   ├── update_order_command.py
│   └── handlers/
│       └── order_command_handler.py
│
├── queries/                   # Read side (Query Model)
│   ├── get_order_query.py
│   ├── list_orders_query.py
│   └── handlers/
│       └── order_query_handler.py
│
├── domain/                    # Write model (normalized)
│   └── order.py
│
├── read_models/               # Read model (denormalized)
│   └── order_view.py
│
└── projections/               # Sync write to read models
    └── order_projection.py
```

#### CQRS Flow

```
Command Side (Write):           Query Side (Read):
User → CreateOrderCommand       User → GetOrderQuery
    ↓                               ↓
CommandHandler                  QueryHandler
    ↓                               ↓
Domain Model (Order)            Read Model (OrderView)
    ↓                               ↓
Write Database                  Read Database
    │                               ↑
    └───Projection/Event────────────┘
         (Eventual Consistency)
```

#### Characteristics

| Aspect | Command Side (Write) | Query Side (Read) |
|--------|---------------------|-------------------|
| **Model** | Normalized domain model | Denormalized view models |
| **Database** | Relational (ACID) | NoSQL, caching, optimized |
| **Purpose** | Business logic, validation | Optimized queries |
| **Consistency** | Strong consistency | Eventual consistency |

#### Conceptual Example: E-commerce Order System

**Command Side (Write):**
- `CreateOrderCommand` → Validates business rules → Saves to PostgreSQL
- Normalized tables (orders, order_items, customers)
- Strong consistency (ACID transactions)

**Query Side (Read):**
- `GetOrderDetailsQuery` → Reads from denormalized MongoDB view
- Single document with all order data (no joins)
- Optimized for fast reads

**Synchronization:**
- Command handler emits events → Projection listens → Updates read model
- Eventual consistency (slight delay acceptable)

**Language-Specific Implementations:**

| Language | Framework | Status | Link |
|----------|-----------|--------|------|
| 🐍 **Python** | FastAPI + SQLAlchemy | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |
| ☕ **Java** | Spring Boot + Axon | ✅ Complete | **[View Guide](../../4-development/example/java/cqrs-example.md)** |
| 💎 **C#** | ASP.NET Core + MediatR | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |
| 🔷 **TypeScript** | NestJS + CQRS | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |

#### Pros & Cons

**Pros:**
- ✅ Optimized read and write models independently
- ✅ High scalability (scale reads/writes separately)
- ✅ Flexibility in data storage (SQL for writes, NoSQL for reads)
- ✅ Clear separation of concerns
- ✅ Performance gains for read-heavy systems

**Cons:**
- ❌ Increased complexity (two models to maintain)
- ❌ Eventual consistency (reads may be stale)
- ❌ More infrastructure (separate databases)
- ❌ Synchronization overhead (projections)
- ❌ Steep learning curve

---

### 10. Event Sourcing

**Philosophy:** Store **all state changes as immutable events** instead of current state. Reconstruct current state by replaying events.

**📘 [Deep Dive: Event Sourcing →](deep-dive-event-sourcing.md)**
*Comprehensive guide covering event store design, aggregates and event streams, event schema design, snapshots for performance, event versioning and evolution, combining with CQRS, implementation patterns, and testing event-sourced systems.*

#### When to Use

✅ **Best for:**
- Need complete audit trail (compliance, finance)
- Time-travel capabilities (view state at any point)
- Complex business workflows requiring history
- Event-driven systems
- Undo/redo functionality

❌ **Avoid when:**
- Simple CRUD applications
- No audit requirements
- Queries on historical data not needed
- Team unfamiliar with pattern

#### Structure

```
application/
├── events/                    # Event definitions
│   ├── order_created_event.py
│   ├── order_updated_event.py
│   └── order_canceled_event.py
│
├── event_store/               # Immutable event storage
│   └── event_store.py         # Append-only event log
│
├── aggregates/                # Domain aggregates
│   └── order_aggregate.py     # Rebuilds state from events
│
├── projections/               # Build read models from events
│   └── order_projection.py
│
└── snapshots/                 # Performance optimization
    └── order_snapshot.py      # Periodic state snapshots
```

#### Event Sourcing Flow

```
Traditional:                Event Sourcing:
User creates order         User creates order
   ↓                          ↓
Save: {                    Append event: OrderCreatedEvent
  id: 1,                      {id: 1, customer: "Alice", total: 100}
  customer: "Alice",           ↓
  total: 100                Event Store (append-only)
}                              ↓
Database (UPDATE)          Rebuild current state:
                           Replay all events → Current Order state
```

#### Characteristics

| Aspect | Implementation |
|--------|----------------|
| **Storage** | Append-only event log (immutable) |
| **State** | Derived by replaying events |
| **Queries** | Build projections from events |
| **Audit** | Complete history built-in |
| **Complexity** | High (event versioning, replay logic) |

#### Conceptual Example: Banking Account

**Traditional Approach:**
```
Account: {balance: $1000}
Withdraw $100 → UPDATE account SET balance = 900
(History lost!)
```

**Event Sourcing Approach:**
```
Event Store (Append-only):
1. AccountCreatedEvent {accountId: 123, balance: 0}
2. DepositedEvent {amount: 1000}
3. WithdrewEvent {amount: 100}

Current Balance = Sum of all events = $900
History = Complete audit trail
Time-travel = Replay events up to any timestamp
```

**Benefits:**
- Complete audit trail (compliance)
- Reconstruct balance at any point in time
- Undo transactions (compensating events)
- Debug by replaying events

**Language-Specific Implementations:**

| Language | Framework | Event Store | Status | Link |
|----------|-----------|-------------|--------|------|
| 🐍 **Python** | FastAPI | EventStoreDB | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |
| ☕ **Java** | Spring Boot | Axon Server | ✅ Complete | **[View Guide](../../4-development/example/java/event-sourcing-example.md)** |
| 💎 **C#** | ASP.NET Core | EventStoreDB | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |
| 🔷 **TypeScript** | NestJS | EventStoreDB | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |

#### Pros & Cons

**Pros:**
- ✅ Complete audit trail (every change recorded)
- ✅ Time-travel (view state at any point)
- ✅ Event replay for debugging
- ✅ Natural fit for event-driven systems
- ✅ Built-in history for compliance

**Cons:**
- ❌ High complexity (event versioning, migrations)
- ❌ Query performance (rebuild state from events)
- ❌ Storage growth (all events kept forever)
- ❌ Event schema evolution challenges
- ❌ Steep learning curve

#### Combining CQRS + Event Sourcing

**Common pattern: Use together for maximum benefit**

```
Command → Aggregate → Emit Event → Event Store
                                        ↓
                                   Projection
                                        ↓
                                  Read Model (CQRS Query Side)
```

**Benefits:**
- Write side uses Event Sourcing (complete audit)
- Read side uses CQRS (optimized queries)
- Best of both worlds

---

## Presentation Layer Patterns

### 11. MVC, MVP, MVVM

**Philosophy:** Separate **presentation logic** from **business logic** and **data** for UI applications.

#### Pattern Comparison

| Pattern | Model | View | Third Component | Data Flow |
|---------|-------|------|----------------|-----------|
| **MVC** | Data + Business Logic | UI | **Controller** (handles input) | View → Controller → Model → View |
| **MVP** | Data + Business Logic | UI (Passive) | **Presenter** (logic) | View → Presenter → Model → Presenter → View |
| **MVVM** | Data + Business Logic | UI | **ViewModel** (binding) | View ↔ ViewModel (two-way binding) ↔ Model |

---

#### MVC (Model-View-Controller)

**Philosophy:** Controller handles user input, updates Model, View displays Model.

**When to Use:**
✅ Traditional web applications (server-side rendering)
✅ Frameworks like Django, Ruby on Rails, ASP.NET MVC
✅ Clear separation of routing and presentation

**Structure:**
```
app/
├── models/              # Data + business logic
│   └── user.py
├── views/               # Templates (UI)
│   └── user_list.html
└── controllers/         # Handle requests
    └── user_controller.py
```

**Flow:**
```
User Request → Controller → Model (fetch data)
                  ↓
              View (render HTML with data)
                  ↓
            HTTP Response
```

**Example:**
```python
# Controller
def get_users(request):
    users = UserModel.get_all()  # Model
    return render('user_list.html', {'users': users})  # View
```

---

#### MVP (Model-View-Presenter)

**Philosophy:** Presenter contains presentation logic, View is passive (dumb UI).

**When to Use:**
✅ Desktop applications (WinForms, WPF)
✅ Android applications (traditional)
✅ Testable UI logic (mock View interface)

**Structure:**
```
app/
├── models/              # Data + business logic
│   └── user.py
├── views/               # Passive UI (interface)
│   └── user_view.py
└── presenters/          # Presentation logic
    └── user_presenter.py
```

**Flow:**
```
User Action → View (IView interface)
                ↓
            Presenter (contains logic)
                ↓
            Model (fetch/update data)
                ↓
            Presenter → View.display(data)
```

**Example:**
```python
# View Interface (passive)
class IUserView:
    def display_users(self, users): pass

# Presenter (logic)
class UserPresenter:
    def __init__(self, view: IUserView, model: UserModel):
        self.view = view
        self.model = model

    def load_users(self):
        users = self.model.get_all()
        self.view.display_users(users)
```

---

#### MVVM (Model-View-ViewModel)

**Philosophy:** ViewModel exposes data and commands, View binds to ViewModel (two-way data binding).

**When to Use:**
✅ Modern web frameworks (React, Vue, Angular)
✅ WPF, Xamarin
✅ Two-way data binding required
✅ Declarative UI updates

**Structure:**
```
app/
├── models/              # Data + business logic
│   └── user.py
├── views/               # UI (binds to ViewModel)
│   └── UserList.jsx
└── viewmodels/          # Presentation state + commands
    └── user_viewmodel.py
```

**Flow:**
```
View ↔ ViewModel (two-way binding) ↔ Model

User types in input → ViewModel updates → View auto-updates
ViewModel changes → View reflects changes automatically
```

**Example (React + MobX):**
```typescript
// ViewModel
class UserViewModel {
    @observable users = [];

    async loadUsers() {
        this.users = await UserModel.getAll();
    }
}

// View (binds to ViewModel)
const UserList = observer(({ viewModel }) => (
    <div>
        {viewModel.users.map(user => <div>{user.name}</div>)}
    </div>
));
```

---

#### Language-Specific Implementations

| Language | MVC | MVP | MVVM |
|----------|-----|-----|------|
| 🐍 **Python** | Django, Flask | PyQt5 | - |
| ☕ **Java** | Spring MVC | Android (traditional) | JavaFX |
| 💎 **C#** | ASP.NET MVC | WinForms | WPF, Xamarin |
| 🔷 **TypeScript** | Express | Angular | React + MobX, Vue |

---

#### Pros & Cons

**MVC:**
- ✅ Well-understood, simple
- ✅ Works great for server-side rendering
- ❌ View and Controller can become coupled
- ❌ Testing Controller requires View

**MVP:**
- ✅ Testable (mock IView interface)
- ✅ Clear separation (passive View)
- ❌ More boilerplate (interface definitions)
- ❌ Presenter can become large

**MVVM:**
- ✅ Two-way data binding (less code)
- ✅ Declarative UI updates
- ✅ Excellent for reactive frameworks
- ❌ Debugging binding issues difficult
- ❌ Requires framework support

---

## Data Processing Patterns

### 12. Pipe-and-Filter Architecture

**Philosophy:** Process data through a **sequence of independent processing steps (filters)** connected by **pipes (data channels)**.

#### When to Use

✅ **Best for:**
- Data transformation pipelines (ETL)
- Stream processing (log processing, analytics)
- Compiler design (lexer → parser → code generator)
- Image/video processing
- Unix-style command-line tools

❌ **Avoid when:**
- Interactive applications requiring low latency
- Complex control flow (loops, conditionals)
- Shared state between filters required

#### Structure

```
pipeline/
├── filters/                   # Independent processing units
│   ├── validate_filter.py     # Filter 1: Data validation
│   ├── transform_filter.py    # Filter 2: Data transformation
│   ├── enrich_filter.py       # Filter 3: Data enrichment
│   └── aggregate_filter.py    # Filter 4: Aggregation
│
├── pipes/                     # Data channels
│   └── data_pipe.py
│
└── pipeline.py                # Pipeline orchestration
```

#### Pipeline Flow

```
Input Data
    ↓ (Pipe)
Filter 1: Validate
    ↓ (Pipe)
Filter 2: Transform
    ↓ (Pipe)
Filter 3: Enrich
    ↓ (Pipe)
Filter 4: Aggregate
    ↓ (Pipe)
Output Data
```

#### Characteristics

| Aspect | Implementation |
|--------|----------------|
| **Filters** | Independent, reusable, single responsibility |
| **Pipes** | Data channels connecting filters |
| **Data Flow** | Unidirectional (input → output) |
| **Concurrency** | Filters can run in parallel |
| **Composability** | Filters can be rearranged, added, removed |

#### Conceptual Example: Log Processing Pipeline

**Pipeline:**

1. **Read Filter:** Read log files from disk
2. **Parse Filter:** Parse log lines into structured data
3. **Filter Filter:** Keep only ERROR level logs
4. **Enrich Filter:** Add geolocation data
5. **Aggregate Filter:** Count errors by service
6. **Write Filter:** Write to database

**Unix Pipe Example:**
```bash
cat logs.txt | grep "ERROR" | awk '{print $1}' | sort | uniq -c
```

**Each command is a filter, `|` is a pipe!**

**Language-Specific Implementations:**

| Language | Framework | Status | Link |
|----------|-----------|--------|------|
| 🐍 **Python** | Apache Airflow, Luigi | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |
| ☕ **Java** | Apache Camel, Spring Integration | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |
| 💎 **C#** | TPL Dataflow | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |
| 🔷 **TypeScript** | RxJS (reactive pipelines) | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |

#### Pros & Cons

**Pros:**
- ✅ Simple, intuitive (linear data flow)
- ✅ Reusable filters (composability)
- ✅ Easy parallelization (filters independent)
- ✅ Easy to test (unit test each filter)
- ✅ Easy to extend (add filters)

**Cons:**
- ❌ Not suitable for interactive systems
- ❌ Complex control flow difficult
- ❌ Error handling across filters challenging
- ❌ Shared state between filters difficult

---

### 13. Broker Architecture

**Philosophy:** **Centralized broker** routes messages between **distributed components** that don't know about each other.

#### When to Use

✅ **Best for:**
- Distributed systems with many components
- Components need to discover services dynamically
- Decoupled communication required
- Message routing, transformation, aggregation

❌ **Avoid when:**
- Simple point-to-point communication sufficient
- Low latency critical (broker adds overhead)
- Single point of failure unacceptable

#### Structure

```
distributed-system/
├── components/                # Independent components
│   ├── service_a.py
│   ├── service_b.py
│   └── service_c.py
│
├── broker/                    # Central message broker
│   ├── message_router.py      # Routes messages
│   ├── message_queue.py       # Queues messages
│   └── discovery_service.py   # Service registry
│
└── messages/                  # Message definitions
    └── message_types.py
```

#### Broker Flow

```
Component A                Broker                 Component B
    │                        │                        │
    │────Request Message────>│                        │
    │                        │                        │
    │                        │─────Route Message─────>│
    │                        │                        │
    │                        │<────Response───────────│
    │                        │                        │
    │<───Response Message────│                        │
```

#### Characteristics

| Aspect | Implementation |
|--------|----------------|
| **Communication** | Indirect via broker |
| **Coupling** | Loose (components don't know each other) |
| **Discovery** | Dynamic (broker maintains registry) |
| **Routing** | Content-based, topic-based, or queue-based |
| **Scalability** | Horizontal (add more brokers) |

#### Conceptual Example: Microservices Communication

**Components:**
- User Service
- Order Service
- Payment Service
- Notification Service

**Broker (RabbitMQ):**
- Receives messages from all services
- Routes to appropriate queues/topics
- Services subscribe to relevant topics

**Message Flow:**
```
Order Service → Broker ("order.created" topic)
                   ↓
    ┌──────────────┴──────────────┐
    ↓                              ↓
Payment Service          Notification Service
(subscribed to order.*)  (subscribed to order.*)
```

**Benefits:**
- Services don't know about each other (loose coupling)
- Easy to add new services (subscribe to topics)
- Broker handles routing complexity

**Common Brokers:**
- RabbitMQ (AMQP)
- Apache Kafka (streaming)
- Redis Pub/Sub
- AWS SQS/SNS
- Azure Service Bus

**Language-Specific Implementations:**

| Language | Broker | Status | Link |
|----------|--------|--------|------|
| 🐍 **Python** | RabbitMQ (pika) | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |
| ☕ **Java** | Apache Kafka | ✅ See Event-Driven | **[View Guide](../../4-development/example/java/event-driven-example.md)** |
| 💎 **C#** | Azure Service Bus | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |
| 🔷 **TypeScript** | RabbitMQ (amqplib) | 📋 Planned | [Request](https://github.com/phdsystems/templates/issues/new) |

#### Pros & Cons

**Pros:**
- ✅ Loose coupling (components independent)
- ✅ Dynamic discovery (components don't hardcode endpoints)
- ✅ Message transformation and routing
- ✅ Load balancing and failover
- ✅ Easy to scale (add consumers)

**Cons:**
- ❌ Single point of failure (broker down = system down)
- ❌ Performance bottleneck (all messages through broker)
- ❌ Added complexity (broker infrastructure)
- ❌ Network latency (extra hop)
- ❌ Debugging harder (indirect communication)

---

## Pattern Comparison

### Monolithic Patterns

| Pattern | Complexity | Team Size | When to Use | Example Projects |
|---------|-----------|-----------|-------------|------------------|
| **Simple Modular** | Low | 1-5 | MVPs, small projects, fast iteration | Data pipelines, ML systems, APIs |
| **Layered** | Low-Medium | 2-10 | Traditional CRUD apps | Django apps, REST APIs |
| **Modular Monolith** | Medium | 5-20 | Growing apps, multiple teams | E-commerce, SaaS platforms |
| **Hexagonal** | Medium-High | 3-15 | Domain-rich apps, high testability | Banking, Insurance |
| **Clean** | High | 10-50+ | Enterprise, long-lived systems | Large ERP, Core banking |

### Distributed System Patterns

| Pattern | Complexity | Team Size | When to Use | Example Projects |
|---------|-----------|-----------|-------------|------------------|
| **Microservices** | Very High | 20-100+ | Independent service scaling | Netflix, Amazon, Uber |
| **Event-Driven** | High | 10-50+ | Real-time processing, loose coupling | IoT platforms, Streaming analytics |
| **Serverless** | Medium | 1-20 | Sporadic workloads, pay-per-use | Image processing, Webhooks, APIs |

### Data Management Patterns

| Pattern | Complexity | Team Size | When to Use | Example Projects |
|---------|-----------|-----------|-------------|------------------|
| **CQRS** | High | 5-30 | High read/write disparity | E-commerce, Reporting systems |
| **Event Sourcing** | Very High | 5-30 | Complete audit trail, compliance | Banking, Financial systems |

### Presentation Layer Patterns

| Pattern | Complexity | Team Size | When to Use | Example Projects |
|---------|-----------|-----------|-------------|------------------|
| **MVC** | Low | 1-10 | Server-side rendering | Django, Rails, ASP.NET apps |
| **MVP** | Medium | 2-10 | Testable UI logic | Desktop apps, Android |
| **MVVM** | Medium | 2-20 | Two-way binding, reactive UIs | React, Vue, Angular, WPF |

### Data Processing Patterns

| Pattern | Complexity | Team Size | When to Use | Example Projects |
|---------|-----------|-----------|-------------|------------------|
| **Pipe-and-Filter** | Low-Medium | 1-10 | Data transformation pipelines | ETL, Log processing, Compilers |
| **Broker** | Medium-High | 5-30 | Distributed component communication | Microservices, Enterprise integration |

---

### Detailed Comparison (Monolithic Patterns)

| Aspect | Simple Modular | Layered | Modular Monolith | Hexagonal | Clean |
|--------|---------------|---------|------------------|-----------|-------|
| **Learning Curve** | Easy | Easy | Medium | Hard | Very Hard |
| **Boilerplate** | Minimal | Low | Medium | High | Very High |
| **Testability** | Good | Medium | Good | Excellent | Excellent |
| **Flexibility** | Medium | Low | High | Very High | Maximum |
| **Coupling** | Medium | High | Low | Very Low | Minimum |
| **Setup Time** | Minutes | Hours | Days | Days | Weeks |
| **Refactoring Cost** | Low | High | Low | Very Low | Very Low |
| **Framework Independence** | No | No | Partial | Yes | Yes |

### Detailed Comparison (Distributed Patterns)

| Aspect | Microservices | Event-Driven | Serverless | CQRS | Event Sourcing |
|--------|--------------|--------------|------------|------|----------------|
| **Learning Curve** | Very Hard | Hard | Medium | Hard | Very Hard |
| **Boilerplate** | Very High | High | Medium | High | Very High |
| **Testability** | Hard (integration) | Medium | Hard (distributed) | Good | Good |
| **Flexibility** | Maximum | Very High | High | Very High | Very High |
| **Coupling** | Very Low | Very Low | Low | Low | Very Low |
| **Setup Time** | Weeks-Months | Days-Weeks | Hours-Days | Days-Weeks | Weeks |
| **Operational Complexity** | Very High | High | Low (managed) | High | Very High |
| **Scalability** | Excellent | Excellent | Excellent | Excellent | Good |

---

## Migration Paths

### Evolution Strategy: Start Simple, Graduate as Needed

```
Simple Modular
    ↓ (Team grows to 5-10)
Modular Monolith
    ↓ (Complex domain logic emerges)
Hexagonal Architecture
    ↓ (Extreme enterprise requirements)
Clean Architecture
```

### Migration 1: Simple Modular → Modular Monolith

**When:** Team grows beyond 5 developers, need module ownership

**Steps:**
1. Identify module boundaries (user, order, billing)
2. Create module folders with internal structure
3. Create public APIs for each module
4. Refactor cross-module imports to use public APIs
5. Add tests at module boundaries

**Example:**
```bash
# Before (Simple Modular)
src/main/
├── data/
├── models/
└── api/

# After (Modular Monolith)
src/main/
├── user_module/
│   ├── api/          # Public interface
│   ├── domain/       # Internal logic
│   └── infrastructure/
├── order_module/
└── shared/
```

### Migration 2: Modular Monolith → Hexagonal

**When:** Need stricter domain protection, multiple interfaces

**Steps:**
1. Extract domain logic to `domain/` folder
2. Define ports (interfaces) for external dependencies
3. Create adapters implementing ports
4. Wire adapters through dependency injection

**Example:**
```bash
# Before (Modular Monolith)
src/main/user_module/
├── api/
├── domain/
└── infrastructure/

# After (Hexagonal)
src/main/
├── domain/        # Pure business logic
├── ports/         # Interfaces
│   ├── inbound/
│   └── outbound/
└── adapters/      # Implementations
    ├── inbound/
    └── outbound/
```

### Migration 3: Hexagonal → Clean Architecture

**When:** Enterprise requirements, extreme separation

**Steps:**
1. Split domain into entities and use cases
2. Create use case ports (interfaces)
3. Move controllers to interface adapters
4. Move frameworks to outermost layer
5. Enforce dependency rule

**Example:**
```bash
# Before (Hexagonal)
src/main/
├── domain/
├── ports/
└── adapters/

# After (Clean)
src/main/
├── entities/
├── use_cases/
├── interface_adapters/
└── frameworks_drivers/
```

---

## Real-World Examples

### Example 1: ML Forecasting System - Simple Modular

**Type:** Machine learning time series forecasting
**Team Size:** 1-3 developers
**Pattern:** Simple Modular

```
src/main/
├── data/              # Data pipeline
├── features/          # Feature engineering
├── models/            # ML model implementations
├── training/          # Training framework
├── evaluation/        # Model evaluation
├── api/               # API endpoints
└── utils/             # Shared utilities
```

**Why Simple Modular:**
- Small team (1-3 developers)
- Clear functional boundaries
- Fast iteration needed
- Experiment-driven development

### Example 2: E-commerce Platform - Modular Monolith

**Type:** Online retail platform
**Team Size:** 15 developers (3 teams)
**Pattern:** Modular Monolith

```
src/main/
├── user_management/       # Team 1
│   ├── api/
│   ├── domain/
│   └── infrastructure/
├── product_catalog/       # Team 2
│   ├── api/
│   ├── domain/
│   └── infrastructure/
├── order_processing/      # Team 3
│   ├── api/
│   ├── domain/
│   └── infrastructure/
├── payment/               # Team 3
└── shared/
    └── domain/
```

**Why Modular Monolith:**
- Multiple teams need independence
- Clear business module boundaries
- Single deployment preferred
- Potential microservices later

### Example 3: Banking Core System - Clean Architecture

**Type:** Core banking platform
**Team Size:** 50+ developers
**Pattern:** Clean Architecture

```
src/main/
├── entities/              # Core business entities
│   ├── account.py
│   ├── transaction.py
│   └── customer.py
├── use_cases/             # Business use cases
│   ├── transfer_funds.py
│   ├── open_account.py
│   └── ports/
├── interface_adapters/    # Adapters layer
│   ├── controllers/
│   ├── presenters/
│   └── gateways/
└── frameworks_drivers/    # External interfaces
    ├── web/
    ├── database/
    └── messaging/
```

**Why Clean Architecture:**
- Large team (50+ developers)
- Complex regulatory requirements
- Long-lived system (10+ years)
- Maximum protection of business rules
- Multiple external systems

---

## Anti-Patterns

### ❌ Anti-Pattern 1: Premature Architecture

**Problem:** Using Clean Architecture for a 3-file MVP

```python
# DON'T: Clean Architecture for simple script
src/main/
├── entities/
│   └── data_point.py
├── use_cases/
│   ├── fetch_data.py
│   └── ports/
│       └── data_repository.py
├── interface_adapters/
│   └── gateways/
│       └── csv_data_repo.py
└── frameworks_drivers/
    └── cli/
        └── app.py

# DO: Simple module for simple task
src/main/
└── fetch_data.py  # One file is enough!
```

**Fix:** Start simple. Add architecture when pain emerges.

### ❌ Anti-Pattern 2: Layered Monolith

**Problem:** Layers become highly coupled, just with extra folders

```python
# BAD: Tight coupling across layers
# src/main/application/user_service.py
from src.main.infrastructure.database.models import UserModel  # Coupled to DB model!

class UserService:
    def get_user(self, id: str):
        return UserModel.query.filter_by(id=id).first()  # DB logic in service!
```

**Fix:** Use Hexagonal - define interfaces, inject implementations.

### ❌ Anti-Pattern 3: Anemic Domain Model

**Problem:** Domain entities are just data containers, all logic in services

```python
# BAD: Anemic domain
class Order:
    id: str
    total: Decimal
    # No methods, just data

class OrderService:
    def confirm_order(self, order: Order):
        order.status = "confirmed"  # Business logic in service!
```

**Fix:** Rich domain model - logic lives in entities.

```python
# GOOD: Rich domain model
class Order:
    id: str
    total: Decimal

    def confirm(self):  # Business logic in entity
        if self.status != "pending":
            raise InvalidStateError()
        self.status = "confirmed"
```

### ❌ Anti-Pattern 4: Over-Modularization

**Problem:** Creating modules for everything, even shared utilities

```python
# DON'T: Excessive modules
src/main/
├── logging_module/
│   └── api/
│       └── logger_api.py
├── config_module/
│   └── api/
│       └── config_api.py
└── validation_module/
    └── api/
        └── validator_api.py

# DO: Shared utilities
src/main/
├── user_module/
├── order_module/
└── shared/           # Utilities here
    ├── logging.py
    ├── config.py
    └── validation.py
```

**Fix:** Only create modules for business domains, not technical concerns.

---

## Best Practices

### 1. Start Simple, Evolve

**Don't design for future scale - design for current needs.**

```python
# Start here (Simple Modular)
src/main/{data, models, api}

# Evolve when pain emerges:
# - Team grows? → Modular Monolith
# - Complex domain? → Hexagonal
# - Enterprise scale? → Clean
```

### 2. Choose Based on Team Size

| Team Size | Recommended Pattern |
|-----------|-------------------|
| 1-5 | Simple Modular |
| 5-10 | Modular Monolith OR Hexagonal |
| 10-20 | Modular Monolith OR Hexagonal |
| 20+ | Clean Architecture |

### 3. Test at the Right Level

```python
# Simple Modular: Test modules
def test_data_ingestion():
    data = ingest("source.csv")
    assert len(data) > 0

# Hexagonal: Test domain without adapters
def test_transfer_service():
    mock_repo = Mock()  # Mock adapter
    service = TransferService(mock_repo)
    service.transfer(...)

# Clean: Test each layer independently
def test_entity():
    order = Order(...)
    order.confirm()

def test_use_case():
    mock_port = Mock()
    use_case = CreateOrder(mock_port)
    use_case.execute(...)
```

### 4. Document Architecture Decisions

**Use ADRs (Architecture Decision Records):**

```markdown
# ADR 001: Use Simple Modular Architecture

## Status
Accepted

## Context
- MVP stage with 2 developers
- Need fast iteration
- Unclear domain boundaries

## Decision
Use Simple Modular architecture (functional modules)

## Consequences
- Fast to develop
- May need refactoring if team grows
- Will migrate to Modular Monolith at 5+ developers
```

### 5. Enforce Boundaries with Tooling

**For Modular Monolith:**
```bash
# Use import-linter to enforce module boundaries
pip install import-linter

# .import-linter.toml
[importlinter]
root_package = "src.main"

[[contracts]]
name = "Modules cannot access each other's internals"
type = "forbidden"
source_modules = ["src.main.user_management"]
forbidden_modules = ["src.main.order_processing.domain"]
```

### 6. Use Dependency Injection

**For Hexagonal and Clean:**
```python
# FastAPI example
from fastapi import Depends

def get_order_repo() -> OrderRepository:
    return PostgresOrderRepository()

def get_order_service(repo: OrderRepository = Depends(get_order_repo)):
    return OrderService(repo)

@app.post("/orders")
def create_order(service: OrderService = Depends(get_order_service)):
    return service.create_order(...)
```

---

## Summary

**Architecture Pattern Selection:**

1. **Simple Modular** (90% of projects)
   - Start here for MVPs, small projects, fast iteration
   - Example: Data pipelines, ML systems, APIs

2. **Layered** (Traditional apps)
   - Use for CRUD applications with clear layers
   - Example: Django REST APIs

3. **Modular Monolith** (Growing teams)
   - Use when team grows to 5-20 developers
   - Example: E-commerce platforms, SaaS

4. **Hexagonal** (Domain-rich)
   - Use when domain logic is complex and valuable
   - Example: Banking, insurance

5. **Clean Architecture** (Enterprise)
   - Use for large teams (20+) and long-lived systems
   - Example: Core banking, ERP

**Golden Rules:**
- ✅ Start with Simple Modular
- ✅ Migrate only when you feel pain
- ✅ Choose based on team size and domain complexity
- ✅ All patterns work with `src/main/` + `src/test/` structure
- ✅ Document decisions (ADRs)
- ✅ Enforce boundaries with tooling
- ✅ Test at appropriate levels

**Remember:** Architecture is a **journey**, not a destination. The best architecture is the simplest one that solves your current problems.

---

## Language Portability

**Architecture patterns are universal** - this guide's Python implementation can be translated to any language:

### Same Patterns, Different Languages

| Pattern | Python (this guide) | Java | C# | Go | TypeScript |
|---------|-------------------|------|----|----|------------|
| **Simple Modular** | `src/main/{data,models,api}` | `src/main/java/{data,models,api}` | `src/{Data,Models,Api}` | `internal/{data,models,api}` | `src/{data,models,api}` |
| **Hexagonal** | `src/main/{domain,ports,adapters}` | `src/main/java/{domain,ports,adapters}` | `src/{Domain,Ports,Adapters}` | `internal/{domain,ports,adapters}` | `src/{domain,ports,adapters}` |
| **Clean** | `src/main/{entities,use_cases}` | `src/main/java/{entities,useCases}` | `src/{Entities,UseCases}` | `internal/{entities,usecases}` | `src/{entities,useCases}` |

**Key Points:**
- ✅ **Dependency rules** are identical across languages
- ✅ **Module boundaries** apply to all languages
- ✅ **Pattern principles** are language-independent
- ✅ **When to use each pattern** is the same
- ⚠️ **Syntax differs** (Python vs Java vs Go)
- ⚠️ **File structure conventions** vary by ecosystem
- ⚠️ **Package managers** are language-specific (UV for Python, Maven for Java, NuGet for C#)

**Example: Hexagonal Pattern in Multiple Languages**

**Python (this guide):**
```python
# src/main/domain/entities/account.py
class Account:
    def withdraw(self, amount: Decimal) -> None:
        if amount > self.balance:
            raise InsufficientFundsError()
```

**Java:**
```java
// src/main/java/domain/entities/Account.java
public class Account {
    public void withdraw(BigDecimal amount) {
        if (amount.compareTo(balance) > 0) {
            throw new InsufficientFundsException();
        }
    }
}
```

**Go:**
```go
// internal/domain/entities/account.go
type Account struct {
    balance decimal.Decimal
}

func (a *Account) Withdraw(amount decimal.Decimal) error {
    if amount.GreaterThan(a.balance) {
        return ErrInsufficientFunds
    }
}
```

**TypeScript:**
```typescript
// src/domain/entities/Account.ts
class Account {
    withdraw(amount: Decimal): void {
        if (amount > this.balance) {
            throw new InsufficientFundsError();
        }
    }
}
```

**The pattern is identical - only syntax differs!**

**To use this guide for other languages:**
1. ✅ Read pattern descriptions (language-agnostic)
2. ✅ Understand dependency rules (universal)
3. ✅ Apply decision trees (work for all languages)
4. ⚠️ Translate Python code examples to your language
5. ⚠️ Adapt file structure to your ecosystem conventions

---

## References and Resources

### Books

**Clean Architecture:**
- Martin, Robert C. *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall, 2017.
  - Chapters 19-23: Architecture patterns, dependency rule
  - Official source for Clean Architecture pattern

**Hexagonal Architecture:**
- Cockburn, Alistair. *Hexagonal Architecture* (original article, 2005)
  - Available: https://alistair.cockburn.us/hexagonal-architecture/
  - Foundational paper on Ports & Adapters pattern

**Domain-Driven Design:**
- Evans, Eric. *Domain-Driven Design: Tackling Complexity in the Heart of Software*. Addison-Wesley, 2003.
  - Foundation for domain-centric architectures
  - Influences Hexagonal and Clean patterns

- Vernon, Vaughn. *Implementing Domain-Driven Design*. Addison-Wesley, 2013.
  - Practical DDD implementation
  - Hexagonal architecture examples

**Modular Monolith:**
- Fowler, Martin. "MonolithFirst" (article, 2015)
  - Available: https://martinfowler.com/bliki/MonolithFirst.html
  - Arguments for starting with monoliths

- Kamil Grzybek. *Modular Monolith with DDD* (GitHub repository)
  - Available: https://github.com/kgrzybek/modular-monolith-with-ddd
  - .NET implementation, patterns apply to Python

**Architecture Patterns:**
- Richards, Mark and Ford, Neal. *Fundamentals of Software Architecture*. O'Reilly, 2020.
  - Chapter 10: Layered Architecture
  - Chapter 13: Modular Monoliths
  - Chapter 17: Microservices Architecture
  - Chapter 18: Event-Driven Architecture
  - Comprehensive pattern comparison

- Buschmann, Frank et al. *Pattern-Oriented Software Architecture, Volume 1*. Wiley, 1996.
  - Classic layered architecture patterns
  - Pipe-and-Filter pattern
  - Broker pattern
  - Foundation for many modern patterns

**Microservices:**
- Newman, Sam. *Building Microservices, 2nd Edition*. O'Reilly, 2021.
  - Comprehensive guide to microservices architecture
  - Service decomposition strategies
  - Communication patterns (REST, gRPC, messaging)
  - When to use microservices vs monoliths

- Richardson, Chris. *Microservices Patterns*. Manning, 2018.
  - Decomposition patterns
  - Data management patterns (Saga, CQRS, Event Sourcing)
  - Communication patterns
  - Available: https://microservices.io/patterns/

**Event-Driven Architecture:**
- Stopford, Ben. *Designing Event-Driven Systems*. O'Reilly, 2018.
  - Available: https://www.confluent.io/designing-event-driven-systems/
  - Event streaming patterns
  - Apache Kafka-based architectures
  - Event sourcing and CQRS

- Hohpe, Gregor and Woolf, Bobby. *Enterprise Integration Patterns*. Addison-Wesley, 2003.
  - Message-based communication patterns
  - Event-driven messaging
  - Broker and routing patterns
  - Available: https://www.enterpriseintegrationpatterns.com/

**CQRS and Event Sourcing:**
- Young, Greg. "CQRS Documents" (2010)
  - Available: https://cqrs.files.wordpress.com/2010/11/cqrs_documents.pdf
  - Original CQRS pattern documentation
  - Event sourcing fundamentals

- Vernon, Vaughn. *Implementing Domain-Driven Design*. Addison-Wesley, 2013.
  - Chapter 7: Event Sourcing
  - CQRS implementation patterns
  - Integration with DDD

**Serverless:**
- Sbarski, Peter and Kroonenburg, Sam. *Serverless Architectures on AWS*. Manning, 2017.
  - AWS Lambda patterns
  - Event-driven serverless
  - Best practices and anti-patterns

- Roberts, Mike. "Serverless Architectures" (Martin Fowler blog, 2018)
  - Available: https://martinfowler.com/articles/serverless.html
  - When to use serverless
  - Trade-offs and considerations

**Presentation Layer Patterns (MVC, MVP, MVVM):**
- Fowler, Martin. "GUI Architectures" (2006)
  - Available: https://martinfowler.com/eaaDev/uiArchs.html
  - Comprehensive comparison of MVC, MVP, MVVM
  - Historical context and evolution

- Smith, Josh. "WPF Apps With The Model-View-ViewModel Design Pattern" (MSDN Magazine, 2009)
  - MVVM pattern for WPF
  - Applies to modern UI frameworks (React, Vue, Angular)

### Articles and Papers

**Clean Architecture:**
- Martin, Robert C. "The Clean Architecture" (blog post, 2012)
  - Available: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
  - Original article introducing the pattern

**Hexagonal Architecture:**
- Cockburn, Alistair. "Hexagonal Architecture" (2005, updated 2024)
  - Available: https://alistair.cockburn.us/hexagonal-architecture/
  - Definitive source on Ports & Adapters

**Modular Monolith:**
- Fowler, Martin. "Monolith First" (2015)
  - Available: https://martinfowler.com/bliki/MonolithFirst.html

- Newman, Sam. "When To Use Microservices (And When Not To!)" (O'Reilly, 2020)
  - Arguments for modular monoliths over microservices

**Microservices:**
- Richardson, Chris. "Pattern: Microservice Architecture" (microservices.io)
  - Available: https://microservices.io/patterns/microservices.html
  - Comprehensive microservices pattern catalog

- Fowler, Martin. "Microservices" (2014)
  - Available: https://martinfowler.com/articles/microservices.html
  - Foundational article on microservices architecture

**Event-Driven Architecture:**
- Hohpe, Gregor. "Your Coffee Shop Doesn't Use Two-Phase Commit" (2005)
  - Classic article on event-driven vs. transaction-based systems
  - Real-world metaphor for async communication

- Fowler, Martin. "Event Sourcing" (2005)
  - Available: https://martinfowler.com/eaaDev/EventSourcing.html
  - Event sourcing pattern fundamentals

**CQRS:**
- Fowler, Martin. "CQRS" (2011)
  - Available: https://martinfowler.com/bliki/CQRS.html
  - When to use CQRS and trade-offs

- Young, Greg. "CQRS and Event Sourcing" (2010)
  - Original documentation from CQRS inventor
  - Combining CQRS with Event Sourcing

**Serverless:**
- Sbarski, Peter. "What is Serverless Architecture?" (A Cloud Guru, 2017)
  - Serverless fundamentals
  - AWS Lambda use cases

- Paul Johnston. "Serverless Best Practices" (2016)
  - Available: https://medium.com/@PaulDJohnston/serverless-best-practices-b3c97d551535
  - Common serverless patterns and anti-patterns

**Architecture Decision Records (ADRs):**
- Nygard, Michael. "Documenting Architecture Decisions" (2011)
  - Available: https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
  - Original ADR format

### Language-Specific Implementation Resources

**Python:**
- Percival, Harry and Gregory, Bob. *Architecture Patterns with Python*. O'Reilly, 2020.
  - Available: https://www.cosmicpython.com/
  - Python implementations of DDD, Hexagonal, Repository patterns
  - Excellent Python-specific examples

- "Structuring Your Project" - The Hitchhiker's Guide to Python
  - Available: https://docs.python-guide.org/writing/structure/
  - Best practices for Python project layout

- "Packaging Python Projects" - Python Packaging Authority
  - Available: https://packaging.python.org/tutorials/packaging-projects/
  - Official Python packaging guide

**Java:**
- Spring Framework Documentation - Spring Boot Architecture
  - Available: https://spring.io/guides/
  - Microservices, REST, Event-Driven patterns in Java

- Kamil Grzybek. *Modular Monolith with DDD* (GitHub)
  - Available: https://github.com/kgrzybek/modular-monolith-with-ddd
  - .NET implementation (patterns apply to Java)

**C#/.NET:**
- Microsoft. ".NET Application Architecture Guides"
  - Available: https://dotnet.microsoft.com/learn/dotnet/architecture-guides
  - Microservices, CQRS, Clean Architecture in .NET

- Smith, Steve. "Clean Architecture with ASP.NET Core"
  - Available: https://github.com/ardalis/CleanArchitecture
  - .NET Core implementation template

**TypeScript/JavaScript:**
- "Node.js Best Practices" (GitHub)
  - Available: https://github.com/goldbergyoni/nodebestpractices
  - Architecture patterns for Node.js applications

- NestJS Documentation
  - Available: https://docs.nestjs.com/
  - Microservices, CQRS, Event-Driven in TypeScript

### Tools and Frameworks

**Dependency Injection (Python):**
- `dependency-injector` - Python dependency injection framework
  - Available: https://python-dependency-injector.ets-labs.org/
  - Useful for Hexagonal and Clean architectures

**Module Boundary Enforcement:**
- `import-linter` - Enforce import boundaries
  - Available: https://github.com/seddonym/import-linter
  - Critical for Modular Monolith pattern

**Architecture Testing:**
- `pytest-archon` - Architecture testing for Python
  - Available: https://github.com/jwbargsten/pytest-archon
  - Test architecture constraints

### Online Courses and Tutorials

**Clean Architecture:**
- "Clean Architecture with Python" - ArjanCodes (YouTube)
  - Practical Python implementation examples

**Hexagonal Architecture:**
- "Hexagonal Architecture in Python" - Cosmic Python workshop
  - Available: https://www.cosmicpython.com/

**Domain-Driven Design:**
- "Domain-Driven Design Distilled" - Vaughn Vernon (O'Reilly course)
  - Condensed DDD principles

### Community Resources

**GitHub Examples:**
- Cosmic Python (Architecture Patterns with Python)
  - Repository: https://github.com/cosmicpython/code
  - Python implementations of various patterns

- Clean Architecture Python Example
  - Repository: https://github.com/Enforcer/clean-architecture
  - Complete Python Clean Architecture example

**Python Architecture Discussions:**
- Python subreddit: r/Python - Architecture discussions
- Real Python: Architecture articles and tutorials
- PyCon talks on architecture (YouTube)

### Standards and Specifications

**Python Project Standards:**
- PEP 621: Storing project metadata in pyproject.toml
  - https://peps.python.org/pep-0621/

- PEP 518: Specifying Build System Requirements
  - https://peps.python.org/pep-0518/

**Architecture Patterns:**
- C4 Model for Software Architecture
  - https://c4model.com/
  - Visualization standard for architecture diagrams

### PHD Systems & PHD Labs Internal

**Related Templates:**
- [Python Project Setup Guide](../../4-development/example/python/project-setup.md) - Companion guide
- Example projects available internally demonstrating each pattern

**Internal Standards:**
- CLAUDE.md - Global engineering standards
- SDLC Documentation Template - Project documentation structure

### Additional Reading

**Evolutionary Architecture:**
- Ford, Neal et al. *Building Evolutionary Architectures*. O'Reilly, 2017.
  - How to evolve architecture over time
  - Migration strategies between patterns

**Microservices (Context):**
- Newman, Sam. *Building Microservices, 2nd Edition*. O'Reilly, 2021.
  - When to graduate from Modular Monolith to microservices
  - Module boundary design

**Software Craftsmanship:**
- Martin, Robert C. *Clean Code: A Handbook of Agile Software Craftsmanship*. Prentice Hall, 2008.
  - Code-level practices that support good architecture

### Key Takeaways from References

**From Clean Architecture (Martin):**
- The Dependency Rule: Dependencies point inward
- Screaming Architecture: Architecture should reveal intent
- Framework independence: Business logic isolated from frameworks

**From Hexagonal Architecture (Cockburn):**
- Ports: Application-defined interfaces
- Adapters: Technology-specific implementations
- Symmetry: All external access through ports (UI, DB, etc.)

**From DDD (Evans):**
- Ubiquitous Language: Domain terminology in code
- Bounded Contexts: Clear module boundaries
- Aggregate Roots: Transaction boundaries

**From Architecture Patterns with Python (Percival & Gregory):**
- Repository Pattern: Abstract data access
- Unit of Work: Transaction management
- Service Layer: Orchestrate use cases
- Adapters: Decouple from external dependencies

**From Modular Monolith (Grzybek):**
- Module independence: Each module is mini-application
- Public APIs: Explicit module contracts
- Event-driven communication: Decouple modules
- Eventual extraction: Design for future microservices

---

**Document Type:** Architecture Guide (Language-Agnostic)
**Last Updated:** 2025-10-20
**Version:** 2.0
**Language-Specific Examples:** See [examples/](../../4-development/example/) directory

**Note:** This guide synthesizes patterns from multiple authoritative sources. All architectural patterns are language-agnostic and should be adapted to your specific context, team needs, and technology stack.
