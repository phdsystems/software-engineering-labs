# Architecture Pattern Examples

**Purpose:** Language-specific implementations of architecture patterns
**Parent Guide:** [Architecture Patterns Guide](../../3-design/architecture-pattern/overview.md)

---

## Overview

This directory contains complete, production-ready implementations of architecture patterns in multiple programming languages. Each example demonstrates best practices, testing strategies, and real-world usage patterns.

---

## Quick Navigation

| Pattern | Python | Java | Kotlin | Groovy | TypeScript | Go | Rust |
|---------|--------|------|--------|--------|-----------|-----|------|
| **Project Setup** | [✅ Guide](python/project-setup.md) | [✅ Guide](java/project-setup.md) | [✅ Guide](kotlin/project-setup.md) | [✅ Guide](groovy/project-setup.md) | [✅ Guide](typescript/project-setup.md) | [✅ Guide](go/project-setup.md) | [✅ Guide](rust/project-setup.md) |
| **Simple Modular** | [✅ ML Example](python/simple-modular-ml-example.md) | 📋 Planned | 📋 Planned | 📋 Planned | 📋 Planned | 📋 Planned | 📋 Planned |
| **Hexagonal Architecture** | [✅ Banking](python/hexagonal-banking-example.md) | [✅ Banking](java/clean-architecture-example.md) | 📋 Planned | 📋 Planned | 📋 Planned | 📋 Planned | 📋 Planned |
| **Clean Architecture** | [✅ Banking](python/clean-architecture-banking-example.md) | [✅ Banking](java/clean-architecture-example.md) | [✅ Banking](kotlin/clean-architecture-example.md) | [✅ Banking](groovy/clean-architecture-example.md) | 📋 Planned | [✅ Banking](go/clean-architecture-example.md) | [✅ Banking](rust/clean-architecture-example.md) |
| **Microservices** | [✅ FastAPI](python/microservices-example.md) | [✅ E-commerce](java/microservices-example.md) | [✅ E-commerce](kotlin/microservices-example.md) | [✅ E-commerce](groovy/microservices-example.md) | 📋 Planned | [✅ gRPC](go/microservices-example.md) | [✅ gRPC](rust/microservices-example.md) |
| **Event-Driven** | [✅ Kafka](python/event-driven-example.md) | [✅ E-commerce](java/event-driven-example.md) | [✅ Kafka](kotlin/event-driven-example.md) | [✅ Kafka](groovy/event-driven-example.md) | 📋 Planned | [✅ NATS](go/event-driven-example.md) | [✅ NATS](rust/event-driven-example.md) |
| **Serverless** | [✅ AWS Lambda](python/serverless-example.md) | [✅ AWS/Azure/GCP](java/serverless-example.md) | [✅ AWS Lambda](kotlin/serverless-example.md) | [✅ AWS Lambda](groovy/serverless-example.md) | 📋 Planned | [✅ AWS Lambda](go/serverless-example.md) | [✅ AWS Lambda](rust/serverless-example.md) |
| **CQRS** | 📋 Planned | [✅ Orders](java/cqrs-example.md) | 📋 Planned | 📋 Planned | 📋 Planned | 📋 Planned | 📋 Planned |
| **Event Sourcing** | 📋 Planned | [✅ Banking](java/event-sourcing-example.md) | 📋 Planned | 📋 Planned | 📋 Planned | 📋 Planned | 📋 Planned |

---

## By Language

### 🐍 Python Examples

**Setup Guide:**
- [Python Project Setup](python/project-setup.md) - Poetry, virtual environments, project structure

**Pattern Implementations:**
- [Simple Modular ML Example](python/simple-modular-ml-example.md) - ML model training system
- [Hexagonal Banking Example](python/hexagonal-banking-example.md) - Ports & Adapters pattern
- [Clean Architecture Banking Example](python/clean-architecture-banking-example.md) - 4-layer architecture
- [Microservices](python/microservices-example.md) - FastAPI services with Consul, RabbitMQ, Saga pattern
- [Event-Driven](python/event-driven-example.md) - Kafka events with async/await, Outbox pattern, Pydantic
- [Serverless](python/serverless-example.md) - AWS Lambda with fast cold starts (100-300ms), boto3

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, pytest, asyncio

---

### ☕ Java Examples

**Setup Guide:**
- [Java Project Setup](java/project-setup.md) - Maven, Spring Boot, project structure

**Pattern Implementations:**
- [Microservices Example](java/microservices-example.md) - Spring Cloud, Eureka, Kafka, Saga
- [Clean Architecture Example](java/clean-architecture-example.md) - Banking with dependency inversion
- [CQRS Example](java/cqrs-example.md) - Command/Query separation with Axon
- [Event Sourcing Example](java/event-sourcing-example.md) - Event store with Axon Framework
- [Event-Driven Example](java/event-driven-example.md) - Kafka producers/consumers, DLQ
- [Serverless Example](java/serverless-example.md) - AWS Lambda, Azure Functions, GCP

**Tech Stack:** Spring Boot 3.x, Spring Cloud, Axon Framework, Apache Kafka

---

### 🎯 Kotlin Examples

**Setup Guide:**
- [Kotlin Project Setup](kotlin/project-setup.md) - Gradle Kotlin DSL, Spring Boot with Kotlin, coroutines

**Pattern Implementations:**
- [Clean Architecture](kotlin/clean-architecture-example.md) - Banking with data classes, null safety
- [Microservices](kotlin/microservices-example.md) - Spring Cloud, Eureka, Kafka with coroutines
- [Event-Driven](kotlin/event-driven-example.md) - Kafka events with sealed classes and Flow
- [Serverless](kotlin/serverless-example.md) - AWS Lambda with GraalVM native image

**Tech Stack:** Kotlin 1.9+, Spring Boot 3.x, Coroutines, JUnit 5, MockK

**Key Features:**
- Null safety by default
- Extension functions
- Data classes
- Coroutines for async programming
- 100% Java interoperability

---

### 🎸 Groovy Examples

**Setup Guide:**
- [Groovy Project Setup](groovy/project-setup.md) - Gradle, Spring Boot with Groovy, Spock testing

**Pattern Implementations:**
- [Clean Architecture](groovy/clean-architecture-example.md) - Banking with traits and AST transformations
- [Microservices](groovy/microservices-example.md) - Spring Cloud with Groovy DSL configuration
- [Event-Driven](groovy/event-driven-example.md) - Kafka with closures and @Canonical events
- [Serverless](groovy/serverless-example.md) - AWS Lambda with @CompileStatic optimization

**Tech Stack:** Groovy 4.x, Spring Boot 3.x, Spock Framework, Grails (optional)

**Key Features:**
- Dynamic typing with optional static typing
- Closures and functional programming
- AST transformations (@Canonical, @Immutable)
- Powerful DSL capabilities
- Spock testing framework

---

### 📘 TypeScript Examples

**Setup Guide:**
- [TypeScript Project Setup](typescript/project-setup.md) - npm/yarn, Express.js, NestJS, tsconfig

**Pattern Implementations:**
- 📋 Planned - Clean Architecture, Microservices, CQRS (coming soon)

**Tech Stack:** TypeScript 5.x, Node.js, Express.js / NestJS, Jest

**Key Features:**
- Static type safety
- Interfaces and generics
- Modern JavaScript features (ES2022+)
- Decorators with NestJS
- 100% JavaScript interoperability

---

### 🔷 Go Examples

**Setup Guide:**
- [Go Project Setup](go/project-setup.md) - Go modules, Gin, Echo, project layout

**Pattern Implementations:**
- [Clean Architecture](go/clean-architecture-example.md) - Banking with interfaces and dependency inversion
- [Microservices](go/microservices-example.md) - gRPC services with Consul and NATS
- [Event-Driven](go/event-driven-example.md) - NATS messaging with goroutines and channels
- [Serverless](go/serverless-example.md) - AWS Lambda with fast cold starts (~100ms)

**Tech Stack:** Go 1.21+, Gin / Echo / Chi, standard library

**Key Features:**
- Fast compilation
- Built-in concurrency (goroutines)
- Single binary deployment
- Excellent standard library
- Simple language design

---

### 🦀 Rust Examples

**Setup Guide:**
- [Rust Project Setup](rust/project-setup.md) - Cargo, Actix-web, Axum, async patterns

**Pattern Implementations:**
- [Clean Architecture](rust/clean-architecture-example.md) - Banking with traits and Result types
- [Microservices](rust/microservices-example.md) - Axum REST + Tonic gRPC with NATS
- [Event-Driven](rust/event-driven-example.md) - NATS events with async/await and Tokio
- [Serverless](rust/serverless-example.md) - AWS Lambda with cargo-lambda and size optimization

**Tech Stack:** Rust 1.75+, Actix-web / Axum, Tokio async runtime

**Key Features:**
- Memory safety without GC
- Zero-cost abstractions
- Fearless concurrency
- Ownership system
- No null or undefined (Option/Result types)

---

## By Pattern Category

### Monolithic Patterns

| Pattern | Description | Examples |
|---------|-------------|----------|
| **Simple Modular** | Function-based modules | [Python ML](python/simple-modular-ml-example.md) |
| **Hexagonal Architecture** | Ports & Adapters | [Python Banking](python/hexagonal-banking-example.md), [Java Banking](java/clean-architecture-example.md) |
| **Clean Architecture** | 4-layer with dependency rule | [Python Banking](python/clean-architecture-banking-example.md), [Java Banking](java/clean-architecture-example.md) |

### Distributed System Patterns

| Pattern | Description | Examples |
|---------|-------------|----------|
| **Microservices** | Independent services | [Java E-commerce](java/microservices-example.md) |
| **Event-Driven** | Async messaging | [Java E-commerce](java/event-driven-example.md) |
| **Serverless** | FaaS functions | [Java Multi-cloud](java/serverless-example.md) |

### Data Management Patterns

| Pattern | Description | Examples |
|---------|-------------|----------|
| **CQRS** | Command/Query separation | [Java Orders](java/cqrs-example.md) |
| **Event Sourcing** | Event-based state | [Java Banking](java/event-sourcing-example.md) |

---

## What Each Example Includes

Every implementation example provides:

✅ **Complete working code** - Not snippets, but full implementations
✅ **Project structure** - Directory layout and organization
✅ **Dependencies** - Package manifests (requirements.txt, pom.xml)
✅ **Configuration** - Application config files
✅ **Domain models** - Entities, value objects, aggregates
✅ **Business logic** - Services, use cases, command/query handlers
✅ **Persistence** - Database repositories and adapters
✅ **API layer** - REST endpoints (where applicable)
✅ **Testing** - Unit tests, integration tests
✅ **Deployment** - Docker, cloud deployment instructions
✅ **Best practices** - Error handling, validation, logging

---

## How to Use These Examples

### 1. **Learn the Pattern**
Start with the main [Architecture Patterns Guide](../../3-design/architecture-pattern/overview.md) to understand:
- When to use each pattern
- Pros and cons
- Real-world use cases

### 2. **Choose Your Language**
Select your preferred language from the table above

### 3. **Study the Implementation**
Each example includes:
- Complete code walkthrough
- Explanation of key concepts
- Testing strategies
- Deployment instructions

### 4. **Adapt to Your Project**
Use the examples as templates:
- Copy the structure
- Adapt domain models to your use case
- Keep the architectural principles
- Modify tech stack as needed

---

## Contributing

Want to contribute an example in a new language or pattern?

1. Follow the existing structure and naming conventions
2. Include all sections: setup, implementation, testing, deployment
3. Provide complete, working code
4. Add navigation links back to this index
5. Update the quick navigation table above

---

## Related Resources

- **Main Guide:** [Architecture Patterns Guide](../../3-design/architecture-pattern/overview.md)
- **Deep Dives:** [Pattern Deep-Dive Guides](../../3-design/architecture-pattern/)
- **Language Setup Guides:**
  - [Python Project Setup](python/project-setup.md)
  - [Java Project Setup](java/project-setup.md)
  - [Kotlin Project Setup](kotlin/project-setup.md)
  - [Groovy Project Setup](groovy/project-setup.md)
  - [TypeScript Project Setup](typescript/project-setup.md)
  - [Go Project Setup](go/project-setup.md)
  - [Rust Project Setup](rust/project-setup.md)

---

*Last Updated: 2025-10-20*
