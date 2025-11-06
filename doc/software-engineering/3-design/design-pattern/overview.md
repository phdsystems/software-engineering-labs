# Design Patterns Guide

**Purpose:** Comprehensive guide to Gang of Four and modern software design patterns
**Note:** All patterns are language-agnostic with examples in Python, Java, Kotlin, Groovy, TypeScript, Go, and Rust
**Organization:** PHD Systems & PHD Labs
**Version:** 1.0
**Date:** 2025-10-20

**Quick Links:**
- 🏗️ **[Creational Patterns](creational-pattern.md)** - Object creation mechanisms
- 🔗 **[Structural Patterns](structural-pattern.md)** - Object composition and relationships
- 🎭 **[Behavioral Patterns](behavioral-pattern.md)** - Object interaction and responsibility
- 📚 **[Architecture Patterns](../architecture-pattern/overview.md)** - High-level system organization
- 📖 **[Examples Index](../../4-development/example/examples-overview.md)** - Complete language implementations

---

## TL;DR

**Design patterns are reusable solutions to common software problems**. **Gang of Four (GoF)** defined 23 classic patterns in 1994 → Still relevant today with modern additions. **Three categories**: **Creational** (object creation), **Structural** (object composition), **Behavioral** (object interaction). **Modern essentials**: Dependency Injection, Repository, Saga (not in original GoF). **Golden rule**: Patterns solve problems, don't create them → Use when needed, not because they exist. **Start simple**: Factory > Abstract Factory, Strategy > State, Decorator > Complex inheritance. **Avoid over-engineering**: YAGNI (You Aren't Gonna Need It) applies to patterns too. See [Quick Reference](#quick-reference-pattern-catalog) for fast pattern selection.

---

## Table of Contents

- [Overview](#overview)
- [Pattern Categories](#pattern-categories)
- [Quick Reference: Pattern Catalog](#quick-reference-pattern-catalog)
- [Pattern Selection Guide](#pattern-selection-guide)
- [Design Patterns Deep Dive](#design-patterns-deep-dive)
  - [Creational Patterns](#creational-patterns)
  - [Structural Patterns](#structural-patterns)
  - [Behavioral Patterns](#behavioral-patterns)
  - [Modern Patterns](#modern-patterns)
- [Pattern Relationships and Combinations](#pattern-relationships-and-combinations)
- [SOLID Principles and Patterns](#solid-principles-and-patterns)
- [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
- [Pattern Evolution: Classic vs Modern](#pattern-evolution-classic-vs-modern)
- [When NOT to Use Patterns](#when-not-to-use-patterns)
- [References](#references)

---

## Overview

Design patterns are **proven, reusable solutions to common software design problems**. They provide a shared vocabulary for developers and encapsulate best practices learned over decades.

### History

- **1994**: Gang of Four (Gamma, Helm, Johnson, Vlissides) published "Design Patterns: Elements of Reusable Object-Oriented Software"
- **23 classic patterns** organized into three categories
- **Foundation**: Based on work by Christopher Alexander (architecture patterns)
- **Evolution**: New patterns emerged (Repository, Dependency Injection, Saga)
- **Modern context**: Patterns adapted for cloud, microservices, reactive systems

### Why Design Patterns Matter

1. **Proven Solutions**: Battle-tested approaches to recurring problems
2. **Shared Vocabulary**: "Use a Factory" communicates intent clearly
3. **Maintainability**: Well-known patterns are easier to understand and modify
4. **Flexibility**: Patterns promote loose coupling and extensibility
5. **Best Practices**: Encapsulate expert knowledge

### Pattern Structure (Gang of Four Format)

Each pattern is described using:

1. **Pattern Name**: A descriptive, memorable name
2. **Problem**: The design problem the pattern addresses
3. **Solution**: How the pattern solves the problem
4. **Consequences**: Trade-offs and results of using the pattern
5. **Implementation**: Code examples and variations
6. **Related Patterns**: Connections to other patterns

---

## Pattern Categories

### Creational Patterns (5 GoF + Modern)

**Focus:** Object creation mechanisms

- **Factory Method**: Define interface for creating objects, let subclasses decide which class to instantiate
- **Abstract Factory**: Create families of related objects without specifying concrete classes
- **Builder**: Construct complex objects step by step
- **Singleton**: Ensure a class has only one instance (use sparingly!)
- **Prototype**: Create new objects by copying existing ones
- **Dependency Injection** (Modern): Provide dependencies from outside rather than creating them internally

**See:** [Creational Patterns Deep Dive](creational-pattern.md)

### Structural Patterns (7 GoF + Modern)

**Focus:** Object composition and relationships

- **Adapter**: Convert one interface to another expected by clients
- **Bridge**: Separate abstraction from implementation
- **Composite**: Compose objects into tree structures
- **Decorator**: Add responsibilities to objects dynamically
- **Facade**: Provide simplified interface to complex subsystems
- **Flyweight**: Share common state among many objects to reduce memory
- **Proxy**: Provide surrogate or placeholder for another object
- **Repository** (Modern): Mediate between domain and data mapping layers

**See:** [Structural Patterns Deep Dive](structural-pattern.md)

### Behavioral Patterns (11 GoF + Modern)

**Focus:** Object interaction and responsibility distribution

- **Chain of Responsibility**: Pass requests along a chain of handlers
- **Command**: Encapsulate requests as objects
- **Iterator**: Access elements of collection sequentially
- **Mediator**: Define object that encapsulates how objects interact
- **Memento**: Capture and restore object's internal state
- **Observer**: Define one-to-many dependency between objects
- **State**: Alter object's behavior when internal state changes
- **Strategy**: Define family of algorithms, make them interchangeable
- **Template Method**: Define algorithm skeleton, let subclasses override steps
- **Visitor**: Define new operations without changing classes they operate on
- **Interpreter**: Define grammar representation and interpreter
- **Saga** (Modern): Manage distributed transactions across microservices

**See:** [Behavioral Patterns Deep Dive](behavioral-pattern.md)

---

## Quick Reference: Pattern Catalog

### By Use Case

| Problem | Pattern | Category | Complexity |
|---------|---------|----------|------------|
| Need different object creation strategies | Factory Method | Creational | ⭐⭐ |
| Create families of related objects | Abstract Factory | Creational | ⭐⭐⭐ |
| Build complex objects step-by-step | Builder | Creational | ⭐⭐ |
| Ensure single instance | Singleton | Creational | ⭐ |
| Clone existing objects | Prototype | Creational | ⭐⭐ |
| Inject dependencies externally | Dependency Injection | Creational | ⭐⭐ |
| Adapt incompatible interfaces | Adapter | Structural | ⭐⭐ |
| Separate abstraction from implementation | Bridge | Structural | ⭐⭐⭐ |
| Tree structures with uniform treatment | Composite | Structural | ⭐⭐⭐ |
| Add behavior without subclassing | Decorator | Structural | ⭐⭐ |
| Simplify complex subsystem | Facade | Structural | ⭐ |
| Share objects to reduce memory | Flyweight | Structural | ⭐⭐⭐⭐ |
| Control access to objects | Proxy | Structural | ⭐⭐ |
| Abstract data access layer | Repository | Structural | ⭐⭐ |
| Sequential request handling | Chain of Responsibility | Behavioral | ⭐⭐⭐ |
| Encapsulate requests as objects | Command | Behavioral | ⭐⭐ |
| Iterate over collections | Iterator | Behavioral | ⭐⭐ |
| Centralize complex communications | Mediator | Behavioral | ⭐⭐⭐ |
| Capture and restore state | Memento | Behavioral | ⭐⭐ |
| Notify multiple objects of changes | Observer | Behavioral | ⭐⭐ |
| Change behavior based on state | State | Behavioral | ⭐⭐⭐ |
| Swap algorithms at runtime | Strategy | Behavioral | ⭐⭐ |
| Define algorithm skeleton | Template Method | Behavioral | ⭐⭐ |
| Add operations without changing classes | Visitor | Behavioral | ⭐⭐⭐⭐ |
| Distributed transaction management | Saga | Behavioral | ⭐⭐⭐⭐ |

**Complexity Legend:**
- ⭐ Simple (easy to understand and implement)
- ⭐⭐ Moderate (requires some design experience)
- ⭐⭐⭐ Complex (significant design considerations)
- ⭐⭐⭐⭐ Advanced (expert-level, use with caution)

### Most Commonly Used Patterns (Modern Development)

**Top 10 Essential Patterns:**

1. **Dependency Injection** - Foundation of modern frameworks (Spring, .NET Core, NestJS)
2. **Repository** - Data access abstraction (used in almost every app)
3. **Factory Method** - Flexible object creation
4. **Strategy** - Pluggable algorithms and business rules
5. **Decorator** - Adding behavior dynamically (middleware, logging, caching)
6. **Observer** - Event-driven systems, reactive programming
7. **Adapter** - Integrating third-party libraries and legacy systems
8. **Facade** - Simplifying complex APIs
9. **Builder** - Fluent interfaces, immutable objects
10. **Command** - Undo/redo, async operations, CQRS

**Modern Additions:**
- **Saga** - Distributed transactions in microservices
- **Circuit Breaker** - Fault tolerance in distributed systems
- **Retry/Bulkhead** - Resilience patterns

---

## Pattern Selection Guide

### Decision Tree

```
┌─────────────────────────────────────┐
│ What problem are you solving?      │
└─────────────┬───────────────────────┘
              │
              ├─► Object Creation
              │   ├─► Simple factory logic? → Factory Method
              │   ├─► Families of objects? → Abstract Factory
              │   ├─► Complex construction? → Builder
              │   ├─► Need dependencies injected? → Dependency Injection
              │   └─► Clone existing objects? → Prototype
              │
              ├─► Object Composition/Structure
              │   ├─► Incompatible interfaces? → Adapter
              │   ├─► Add behavior without subclass? → Decorator
              │   ├─► Simplify complex subsystem? → Facade
              │   ├─► Control access? → Proxy
              │   ├─► Tree structures? → Composite
              │   └─► Abstract data access? → Repository
              │
              └─► Object Interaction/Behavior
                  ├─► Swap algorithms? → Strategy
                  ├─► Notify multiple observers? → Observer
                  ├─► Encapsulate requests? → Command
                  ├─► State-dependent behavior? → State
                  ├─► Sequential handlers? → Chain of Responsibility
                  ├─► Algorithm skeleton? → Template Method
                  └─► Distributed transactions? → Saga
```

### By Problem Domain

| Domain | Recommended Patterns |
|--------|---------------------|
| **Dependency Management** | Dependency Injection, Factory Method, Service Locator (anti-pattern) |
| **Data Access** | Repository, DAO, Unit of Work, Active Record |
| **API Design** | Facade, Adapter, Proxy, Builder (fluent API) |
| **Business Rules** | Strategy, Command, Chain of Responsibility |
| **Event Handling** | Observer, Mediator, Event Aggregator |
| **State Management** | State, Memento, Command (undo/redo) |
| **UI Layer** | MVC, MVP, MVVM, Observer (data binding) |
| **Distributed Systems** | Saga, Circuit Breaker, Retry, Bulkhead |
| **Testing** | Dependency Injection, Factory, Builder (test data) |
| **Performance** | Proxy (lazy loading), Flyweight (object pooling) |

---

## Design Patterns Deep Dive

### Creational Patterns

Focus on **how objects are created**. Goal: Make system independent of how objects are created, composed, and represented.

**When to use:**
- Creation logic is complex
- Need to hide creation details
- Want to decouple client from concrete classes
- Need to control object lifecycle

**Common scenarios:**
- Dependency injection frameworks
- Factory classes for polymorphic creation
- Builder APIs for complex object graphs
- Configuration management

**See full guide:** [Creational Patterns](creational-pattern.md)

#### Quick Examples

**Factory Method (Python):**
```python
# Factory Method - Define interface for creation, let subclasses decide
from abc import ABC, abstractmethod

class PaymentProcessor(ABC):
    @abstractmethod
    def create_payment(self, amount: float):
        pass

class StripeProcessor(PaymentProcessor):
    def create_payment(self, amount: float):
        return StripePayment(amount)

class PayPalProcessor(PaymentProcessor):
    def create_payment(self, amount: float):
        return PayPalPayment(amount)

# Client code works with interface, not concrete classes
processor = get_processor(config.payment_method)
payment = processor.create_payment(100.0)
```

**Builder (Java):**
```java
// Builder - Construct complex objects step by step
public class User {
    private String username;
    private String email;
    private String firstName;
    private String lastName;

    public static class Builder {
        private String username;
        private String email;
        private String firstName;
        private String lastName;

        public Builder username(String username) {
            this.username = username;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder firstName(String firstName) {
            this.firstName = firstName;
            return this;
        }

        public Builder lastName(String lastName) {
            this.lastName = lastName;
            return this;
        }

        public User build() {
            return new User(this);
        }
    }

    private User(Builder builder) {
        this.username = builder.username;
        this.email = builder.email;
        this.firstName = builder.firstName;
        this.lastName = builder.lastName;
    }
}

// Usage - Fluent, readable construction
User user = new User.Builder()
    .username("jdoe")
    .email("john@example.com")
    .firstName("John")
    .lastName("Doe")
    .build();
```

**Dependency Injection (TypeScript):**
```typescript
// Dependency Injection - Provide dependencies from outside
interface IEmailService {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}

interface IUserRepository {
  findById(id: string): Promise<User>;
  save(user: User): Promise<void>;
}

class UserService {
  constructor(
    private emailService: IEmailService,
    private userRepository: IUserRepository
  ) {}

  async registerUser(userData: CreateUserDto): Promise<User> {
    const user = new User(userData);
    await this.userRepository.save(user);
    await this.emailService.sendEmail(
      user.email,
      "Welcome!",
      "Thanks for registering"
    );
    return user;
  }
}

// Dependencies injected by framework (NestJS, Angular, etc.)
const userService = new UserService(
  new SendGridEmailService(),
  new PostgresUserRepository()
);
```

---

### Structural Patterns

Focus on **how objects are composed** to form larger structures. Goal: Keep structures flexible and efficient.

**When to use:**
- Need to adapt interfaces
- Want to add behavior without inheritance
- Need to simplify complex systems
- Want to control access to objects

**Common scenarios:**
- Legacy system integration (Adapter)
- Cross-cutting concerns (Decorator)
- API simplification (Facade)
- Data access abstraction (Repository)

**See full guide:** [Structural Patterns](structural-pattern.md)

#### Quick Examples

**Adapter (Go):**
```go
// Adapter - Convert one interface to another
// Legacy system with old interface
type LegacyPrinter struct{}

func (p *LegacyPrinter) PrintOldFormat(text string) {
    fmt.Println("[OLD]", text)
}

// New interface expected by client
type ModernPrinter interface {
    Print(text string)
}

// Adapter - makes legacy printer work with new interface
type PrinterAdapter struct {
    legacy *LegacyPrinter
}

func (a *PrinterAdapter) Print(text string) {
    a.legacy.PrintOldFormat(text)
}

// Client code uses modern interface
func printDocument(printer ModernPrinter, text string) {
    printer.Print(text)
}

// Usage - legacy printer adapted to new interface
legacy := &LegacyPrinter{}
adapter := &PrinterAdapter{legacy: legacy}
printDocument(adapter, "Hello World")
```

**Decorator (Kotlin):**
```kotlin
// Decorator - Add behavior dynamically without subclassing
interface Coffee {
    fun cost(): Double
    fun description(): String
}

class SimpleCoffee : Coffee {
    override fun cost() = 2.0
    override fun description() = "Simple coffee"
}

// Base decorator
abstract class CoffeeDecorator(private val coffee: Coffee) : Coffee {
    override fun cost() = coffee.cost()
    override fun description() = coffee.description()
}

// Concrete decorators
class Milk(coffee: Coffee) : CoffeeDecorator(coffee) {
    override fun cost() = super.cost() + 0.5
    override fun description() = "${super.description()}, milk"
}

class Sugar(coffee: Coffee) : CoffeeDecorator(coffee) {
    override fun cost() = super.cost() + 0.2
    override fun description() = "${super.description()}, sugar"
}

// Usage - dynamically add behavior
val coffee = SimpleCoffee()
val coffeeWithMilk = Milk(coffee)
val coffeeWithMilkAndSugar = Sugar(coffeeWithMilk)

println(coffeeWithMilkAndSugar.description()) // "Simple coffee, milk, sugar"
println(coffeeWithMilkAndSugar.cost()) // 2.7
```

**Repository (Rust):**
```rust
// Repository - Mediate between domain and data layers
use async_trait::async_trait;

#[async_trait]
pub trait UserRepository {
    async fn find_by_id(&self, id: &str) -> Result<Option<User>, Error>;
    async fn find_by_email(&self, email: &str) -> Result<Option<User>, Error>;
    async fn save(&self, user: &User) -> Result<(), Error>;
    async fn delete(&self, id: &str) -> Result<(), Error>;
}

// Concrete implementation using PostgreSQL
pub struct PostgresUserRepository {
    pool: PgPool,
}

#[async_trait]
impl UserRepository for PostgresUserRepository {
    async fn find_by_id(&self, id: &str) -> Result<Option<User>, Error> {
        sqlx::query_as!(
            User,
            "SELECT * FROM users WHERE id = $1",
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(Into::into)
    }

    async fn save(&self, user: &User) -> Result<(), Error> {
        sqlx::query!(
            "INSERT INTO users (id, email, name) VALUES ($1, $2, $3)
             ON CONFLICT (id) DO UPDATE SET email = $2, name = $3",
            user.id, user.email, user.name
        )
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    // ... other methods
}

// Domain layer works with abstraction, not concrete database
async fn create_user(repo: &dyn UserRepository, email: &str) -> Result<User, Error> {
    let user = User::new(email);
    repo.save(&user).await?;
    Ok(user)
}
```

---

### Behavioral Patterns

Focus on **how objects interact** and distribute responsibility. Goal: Flexible communication between objects.

**When to use:**
- Need to vary algorithms
- Want to notify multiple objects of changes
- Need to encapsulate requests
- Want state-dependent behavior

**Common scenarios:**
- Event systems (Observer)
- Business rule engines (Strategy, Chain of Responsibility)
- Undo/redo functionality (Command, Memento)
- Workflow engines (State)

**See full guide:** [Behavioral Patterns](behavioral-pattern.md)

#### Quick Examples

**Strategy (Groovy):**
```groovy
// Strategy - Define family of algorithms, make them interchangeable
interface PricingStrategy {
    BigDecimal calculatePrice(BigDecimal basePrice)
}

class RegularPricing implements PricingStrategy {
    BigDecimal calculatePrice(BigDecimal basePrice) {
        return basePrice
    }
}

class BlackFridayPricing implements PricingStrategy {
    BigDecimal calculatePrice(BigDecimal basePrice) {
        return basePrice * 0.5 // 50% off
    }
}

class LoyaltyPricing implements PricingStrategy {
    BigDecimal calculatePrice(BigDecimal basePrice) {
        return basePrice * 0.9 // 10% off
    }
}

class ShoppingCart {
    PricingStrategy strategy
    List<Item> items = []

    void setPricingStrategy(PricingStrategy strategy) {
        this.strategy = strategy
    }

    BigDecimal calculateTotal() {
        def baseTotal = items.sum { it.price }
        return strategy.calculatePrice(baseTotal)
    }
}

// Usage - swap strategies at runtime
def cart = new ShoppingCart()
cart.items = [new Item(price: 100), new Item(price: 50)]

cart.setPricingStrategy(new RegularPricing())
println cart.calculateTotal() // 150

cart.setPricingStrategy(new BlackFridayPricing())
println cart.calculateTotal() // 75

cart.setPricingStrategy(new LoyaltyPricing())
println cart.calculateTotal() // 135
```

**Observer (Python - Async):**
```python
# Observer - Notify multiple objects of state changes
from typing import List, Callable
import asyncio

class Observable:
    def __init__(self):
        self._observers: List[Callable] = []

    def subscribe(self, observer: Callable):
        self._observers.append(observer)

    def unsubscribe(self, observer: Callable):
        self._observers.remove(observer)

    async def notify(self, data):
        await asyncio.gather(
            *[observer(data) for observer in self._observers]
        )

class StockTicker(Observable):
    def __init__(self, symbol: str):
        super().__init__()
        self.symbol = symbol
        self.price = 0.0

    async def update_price(self, new_price: float):
        self.price = new_price
        await self.notify({
            'symbol': self.symbol,
            'price': new_price
        })

# Observers
async def email_notifier(data):
    print(f"📧 Email: {data['symbol']} is now ${data['price']}")

async def sms_notifier(data):
    print(f"📱 SMS: {data['symbol']} price alert: ${data['price']}")

async def logger(data):
    print(f"📝 Log: {data['symbol']}: ${data['price']}")

# Usage
async def main():
    ticker = StockTicker("AAPL")
    ticker.subscribe(email_notifier)
    ticker.subscribe(sms_notifier)
    ticker.subscribe(logger)

    await ticker.update_price(150.25)
    # All three observers notified simultaneously

asyncio.run(main())
```

**Command (Java - CQRS):**
```java
// Command - Encapsulate requests as objects
public interface Command<T> {
    T execute();
}

public class CreateUserCommand implements Command<User> {
    private final String username;
    private final String email;
    private final UserRepository repository;

    public CreateUserCommand(String username, String email, UserRepository repository) {
        this.username = username;
        this.email = email;
        this.repository = repository;
    }

    @Override
    public User execute() {
        User user = new User(username, email);
        repository.save(user);
        return user;
    }
}

public class CommandBus {
    private final Map<Class<? extends Command>, CommandHandler> handlers = new HashMap<>();

    public <T> void register(Class<? extends Command<T>> commandClass, CommandHandler<T> handler) {
        handlers.put(commandClass, handler);
    }

    public <T> T dispatch(Command<T> command) {
        CommandHandler<T> handler = handlers.get(command.getClass());
        if (handler == null) {
            throw new IllegalArgumentException("No handler for " + command.getClass());
        }
        return handler.handle(command);
    }
}

// Usage - decouple request from execution
CommandBus bus = new CommandBus();
bus.register(CreateUserCommand.class, new CreateUserCommandHandler());

CreateUserCommand command = new CreateUserCommand("jdoe", "john@example.com", userRepo);
User user = bus.dispatch(command);
```

---

### Modern Patterns

Patterns that emerged after the Gang of Four book (1994) to address modern software challenges.

#### Dependency Injection

**Problem:** Classes create their own dependencies → tight coupling, hard to test
**Solution:** Inject dependencies from outside → loose coupling, easy to test

**Benefits:**
- ✅ Testability (mock dependencies)
- ✅ Flexibility (swap implementations)
- ✅ Separation of concerns
- ✅ Foundation of IoC containers

**See:** [Creational Patterns - Dependency Injection](creational-pattern.md#dependency-injection)

#### Repository Pattern

**Problem:** Data access logic scattered throughout application → hard to change databases
**Solution:** Centralize data access in repository interface → domain independent of data source

**Benefits:**
- ✅ Testability (mock data access)
- ✅ Centralized data access logic
- ✅ Easy to swap data sources
- ✅ Domain-driven design friendly

**See:** [Structural Patterns - Repository](structural-pattern.md#repository-pattern)

#### Saga Pattern

**Problem:** Distributed transactions across microservices → no ACID guarantees
**Solution:** Choreographed or orchestrated sequence of local transactions with compensating actions

**Benefits:**
- ✅ Eventual consistency
- ✅ Fault tolerance
- ✅ No distributed locks
- ✅ Rollback via compensation

**See:** [Behavioral Patterns - Saga](behavioral-pattern.md#saga-pattern)

---

## Pattern Relationships and Combinations

### Common Pattern Combinations

Patterns often work together to solve complex problems:

| Combination | Purpose | Example |
|-------------|---------|---------|
| **Factory + Singleton** | Single factory instance | Logger factory |
| **Strategy + Factory** | Create strategies dynamically | Payment processor factory |
| **Decorator + Factory** | Create decorated objects | HTTP middleware factory |
| **Repository + Unit of Work** | Transactional data access | Database transaction management |
| **Command + Memento** | Undo/redo functionality | Text editor operations |
| **Observer + Mediator** | Event aggregation | UI event bus |
| **Adapter + Facade** | Legacy system integration | Wrap and simplify old API |
| **Proxy + Decorator** | Lazy loading with caching | ORM lazy loading |
| **Builder + Prototype** | Clone with modifications | Document templates |
| **Chain of Responsibility + Command** | Request pipeline | HTTP middleware pipeline |

### Pattern Hierarchies

Some patterns are variations or extensions of others:

```
Factory
├─► Simple Factory (not a GoF pattern, but common)
├─► Factory Method (GoF)
└─► Abstract Factory (GoF)

Proxy
├─► Virtual Proxy (lazy loading)
├─► Protection Proxy (access control)
├─► Remote Proxy (distributed objects)
└─► Smart Proxy (reference counting, logging)

Decorator
├─► Simple Decorator (single responsibility)
└─► Chain of Decorators (multiple behaviors)

Observer
├─► Push Model (subject sends data)
├─► Pull Model (observers query subject)
└─► Event Aggregator (centralized events)
```

### Integration with Architecture Patterns

Design patterns support architecture patterns:

| Architecture Pattern | Supporting Design Patterns |
|---------------------|---------------------------|
| **Layered Architecture** | Repository, Facade, Adapter |
| **Hexagonal Architecture** | Adapter, Repository, Dependency Injection |
| **Clean Architecture** | Dependency Injection, Repository, Factory, Strategy |
| **Microservices** | Saga, Circuit Breaker, Adapter, Facade |
| **Event-Driven** | Observer, Mediator, Command |
| **CQRS** | Command, Repository, Factory |
| **MVC/MVP/MVVM** | Observer, Strategy, Command |

---

## SOLID Principles and Patterns

Design patterns implement SOLID principles:

### Single Responsibility Principle (SRP)

**"A class should have one reason to change"**

**Supporting Patterns:**
- **Decorator**: Each decorator has single responsibility
- **Strategy**: Each strategy has single algorithm
- **Command**: Each command has single operation
- **Repository**: Only responsible for data access

**Example:**
```python
# Bad - multiple responsibilities
class User:
    def __init__(self, username, email):
        self.username = username
        self.email = email

    def save_to_database(self):
        # Persistence responsibility
        pass

    def send_welcome_email(self):
        # Email responsibility
        pass

# Good - single responsibilities with patterns
class User:
    def __init__(self, username, email):
        self.username = username
        self.email = email

class UserRepository:  # Repository pattern - data access only
    def save(self, user: User):
        pass

class EmailService:  # Single responsibility - email only
    def send_welcome_email(self, user: User):
        pass
```

### Open/Closed Principle (OCP)

**"Open for extension, closed for modification"**

**Supporting Patterns:**
- **Strategy**: Add new strategies without modifying context
- **Decorator**: Add new decorators without modifying original
- **Factory**: Add new products without modifying factory interface
- **Template Method**: Override steps without modifying template

**Example:**
```typescript
// Bad - need to modify class to add new behavior
class PaymentProcessor {
  processPayment(type: string, amount: number) {
    if (type === 'credit') {
      // process credit card
    } else if (type === 'paypal') {
      // process PayPal
    }
    // Need to modify this method for new payment types!
  }
}

// Good - Strategy pattern, open for extension
interface PaymentStrategy {
  process(amount: number): Promise<void>;
}

class CreditCardStrategy implements PaymentStrategy {
  async process(amount: number) {
    // process credit card
  }
}

class PayPalStrategy implements PaymentStrategy {
  async process(amount: number) {
    // process PayPal
  }
}

// Can add new strategies without modifying existing code
class BitcoinStrategy implements PaymentStrategy {
  async process(amount: number) {
    // process Bitcoin
  }
}

class PaymentProcessor {
  constructor(private strategy: PaymentStrategy) {}

  async process(amount: number) {
    await this.strategy.process(amount);
  }
}
```

### Liskov Substitution Principle (LSP)

**"Derived classes must be substitutable for base classes"**

**Supporting Patterns:**
- **Factory Method**: Products substitutable via common interface
- **Strategy**: Strategies interchangeable via common interface
- **Template Method**: Subclasses substitutable for template
- **Proxy**: Proxy substitutable for real subject

### Interface Segregation Principle (ISP)

**"Clients should not depend on interfaces they don't use"**

**Supporting Patterns:**
- **Adapter**: Adapt only needed interface methods
- **Facade**: Provide specific interface for specific clients
- **Proxy**: Implement only necessary interface methods

### Dependency Inversion Principle (DIP)

**"Depend on abstractions, not concretions"**

**Supporting Patterns:**
- **Dependency Injection**: Core implementation of DIP
- **Factory**: Return abstractions, not concrete classes
- **Repository**: Domain depends on repository interface
- **Strategy**: Context depends on strategy interface

**Example:**
```java
// Bad - depends on concrete class
public class UserService {
    private MySQLUserRepository repository = new MySQLUserRepository();

    public User getUser(String id) {
        return repository.findById(id);
    }
}

// Good - depends on abstraction (Dependency Injection + Repository)
public class UserService {
    private final UserRepository repository;

    // Dependency injected via constructor
    public UserService(UserRepository repository) {
        this.repository = repository;
    }

    public User getUser(String id) {
        return repository.findById(id);
    }
}

// Can swap implementations easily
UserService service = new UserService(new PostgresUserRepository());
// or
UserService service = new UserService(new MongoUserRepository());
// or for testing
UserService service = new UserService(new InMemoryUserRepository());
```

---

## Anti-Patterns to Avoid

### Pattern-Related Anti-Patterns

**1. Golden Hammer**
- **Problem**: Using same pattern for every problem
- **Example**: Using Singleton for everything
- **Solution**: Choose pattern based on actual problem

**2. Overgeneralization**
- **Problem**: Creating abstractions before needed
- **Example**: Abstract Factory when Simple Factory suffices
- **Solution**: Start simple, refactor when complexity emerges

**3. Singleton Abuse**
- **Problem**: Global state, hard to test, hidden dependencies
- **Example**: Everything as singleton
- **Solution**: Use Dependency Injection instead

**4. God Object**
- **Problem**: One class does everything
- **Example**: Manager/Controller that handles all business logic
- **Solution**: Use Strategy, Command, or other behavioral patterns

**5. Big Ball of Mud**
- **Problem**: No discernible architecture
- **Example**: Spaghetti code with no pattern usage
- **Solution**: Apply patterns incrementally to clarify structure

**6. Accidental Complexity**
- **Problem**: Patterns added for "future flexibility"
- **Example**: Abstract Factory for 2 concrete classes
- **Solution**: YAGNI - You Aren't Gonna Need It

### When Patterns Become Anti-Patterns

| Pattern | Anti-Pattern Usage | Better Approach |
|---------|-------------------|-----------------|
| **Singleton** | Global state, hidden dependencies | Dependency Injection |
| **Abstract Factory** | Only 1-2 product families | Factory Method or Simple Factory |
| **Visitor** | Stable class hierarchy | Just add methods to classes |
| **Flyweight** | Premature optimization | Measure first, optimize if needed |
| **Chain of Responsibility** | Too many handlers, unclear flow | Explicit conditional logic |
| **Mediator** | Becomes God Object | Direct communication or Observer |

### Red Flags

**Signs you're misusing patterns:**

- ❌ Pattern doesn't solve actual problem
- ❌ Code harder to understand than before
- ❌ More classes but same functionality
- ❌ "We might need this flexibility later"
- ❌ Can't explain why pattern is needed
- ❌ Pattern used because "it's best practice"
- ❌ Multiple patterns for simple problem

**Healthy pattern usage:**

- ✅ Solves actual, current problem
- ✅ Makes code clearer and more maintainable
- ✅ Enables current requirements
- ✅ Team understands why pattern used
- ✅ Can remove pattern if not needed
- ✅ Pattern choice justified by trade-offs

---

## Pattern Evolution: Classic vs Modern

### Classic GoF (1994) vs Modern Usage

| Pattern | GoF Context | Modern Context | Status |
|---------|-------------|----------------|--------|
| **Singleton** | Global point of access | Dependency injection preferred | ⚠️ Use sparingly |
| **Factory Method** | Polymorphic creation | Still essential | ✅ Core pattern |
| **Abstract Factory** | Product families | Still relevant, less common | ✅ Situational |
| **Builder** | Complex construction | Fluent APIs, immutability | ✅ Very popular |
| **Prototype** | Clone objects | Less common, language-dependent | ⚠️ Niche |
| **Adapter** | Interface compatibility | API integration, legacy systems | ✅ Essential |
| **Decorator** | Dynamic behavior | Middleware, AOP, cross-cutting | ✅ Very popular |
| **Facade** | Simplify subsystems | API gateways, service layers | ✅ Essential |
| **Proxy** | Surrogate objects | ORMs, RPC, lazy loading | ✅ Core pattern |
| **Observer** | Event notification | Reactive programming, pub/sub | ✅ Essential |
| **Strategy** | Swappable algorithms | Business rules, DI | ✅ Very popular |
| **Command** | Request as object | CQRS, undo/redo, async | ✅ Very popular |
| **Template Method** | Algorithm skeleton | Less common (prefer composition) | ⚠️ Declining |
| **Visitor** | Operations on structures | Complex, rarely needed | ⚠️ Niche |

### Modern Pattern Additions

**Not in original GoF, but now essential:**

1. **Dependency Injection** - Foundation of modern frameworks
2. **Repository** - Data access abstraction
3. **Saga** - Distributed transaction management
4. **Circuit Breaker** - Fault tolerance
5. **Retry/Bulkhead** - Resilience patterns
6. **Event Sourcing** - Audit trail and state reconstruction
7. **CQRS** - Command-query separation at architectural level

### Language-Specific Evolution

**Python:**
- Decorators built into language (`@decorator`)
- Context managers (`with` statement) - Resource management pattern
- Generators/Iterators (`yield`) - Iterator pattern built-in

**JavaScript/TypeScript:**
- Promises/Async-Await - Observer pattern evolution
- Higher-order functions - Strategy pattern simplified
- Middleware pattern - Chain of Responsibility + Decorator

**Java:**
- Streams API - Iterator + Template Method
- Annotations - Decorator pattern
- Spring Framework - Dependency Injection container

**Go:**
- Interfaces - Adapter, Strategy patterns
- Goroutines/Channels - Concurrent Observer
- Functional options - Builder pattern alternative

**Rust:**
- Traits - Strategy, Adapter patterns
- Type system - Factory patterns via traits
- Ownership model - Resource management patterns built-in

---

## When NOT to Use Patterns

### YAGNI Principle

**"You Aren't Gonna Need It"**

Don't add patterns "just in case":

```python
# Bad - over-engineered for simple need
class UserRepositoryInterface(ABC):
    @abstractmethod
    def find(self, id: str) -> User:
        pass

class UserRepositoryFactory:
    @staticmethod
    def create(db_type: str) -> UserRepositoryInterface:
        if db_type == "postgres":
            return PostgresUserRepository()
        else:
            raise ValueError("Unknown DB type")

class UserService:
    def __init__(self, repo_factory: UserRepositoryFactory):
        self.repo = repo_factory.create("postgres")

    def get_user(self, id: str) -> User:
        return self.repo.find(id)

# Good - simple and direct
class UserService:
    def __init__(self):
        self.db = Database()

    def get_user(self, id: str) -> User:
        return self.db.query("SELECT * FROM users WHERE id = ?", id)

# Add patterns when you need to swap databases or test with mocks
```

### Simplicity First

**Start simple, refactor to patterns when needed:**

1. **Start**: Direct implementation, no patterns
2. **Pain Point**: Recognize specific problem (hard to test, hard to change)
3. **Identify Pattern**: Choose pattern addressing that problem
4. **Refactor**: Apply pattern incrementally
5. **Validate**: Ensure pattern actually helps

### When Simple Code Wins

**Don't use patterns when:**

- ❌ Only one implementation exists (no need for abstraction)
- ❌ Requirements unlikely to change
- ❌ Code is throwaway/prototype
- ❌ Team unfamiliar with pattern (training overhead)
- ❌ Pattern adds complexity without benefit
- ❌ Simpler solution exists

**Do use patterns when:**

- ✅ Multiple implementations needed
- ✅ Frequent changes expected
- ✅ Testing requires mocking
- ✅ Team familiar with pattern
- ✅ Pattern clarifies intent
- ✅ Flexibility worth the complexity

### Premature Abstraction

**Worse than premature optimization:**

```java
// Bad - abstract before understanding requirements
public interface PaymentProcessor {
    PaymentResult process(PaymentRequest request);
}

public class PaymentProcessorFactory {
    public static PaymentProcessor create(PaymentType type) {
        // Only one type supported!
        return new CreditCardProcessor();
    }
}

// Good - direct implementation, refactor when second type appears
public class PaymentService {
    public PaymentResult processCreditCard(CreditCardInfo card, BigDecimal amount) {
        // Direct implementation
    }
}

// Refactor to pattern when adding PayPal support
```

---

## References

### Primary Sources

1. **Gang of Four (Original)**
   - Gamma, E., Helm, R., Johnson, R., Vlissides, J. (1994). *Design Patterns: Elements of Reusable Object-Oriented Software*. Addison-Wesley.
   - ISBN: 978-0201633610
   - The foundational text defining 23 classic patterns

2. **Martin Fowler**
   - Fowler, M. (2002). *Patterns of Enterprise Application Architecture*. Addison-Wesley.
   - ISBN: 978-0321127420
   - Repository, Unit of Work, Service Layer patterns
   - Website: https://martinfowler.com/eaaCatalog/

3. **Robert C. Martin (Uncle Bob)**
   - Martin, R. C. (2017). *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall.
   - ISBN: 978-0134494166
   - SOLID principles, dependency rule

4. **Eric Evans**
   - Evans, E. (2003). *Domain-Driven Design: Tackling Complexity in the Heart of Software*. Addison-Wesley.
   - ISBN: 978-0321125217
   - Repository, Aggregate, Factory patterns in DDD context

### Modern Pattern Resources

5. **Microservices Patterns**
   - Richardson, C. (2018). *Microservices Patterns: With Examples in Java*. Manning.
   - ISBN: 978-1617294549
   - Saga, Circuit Breaker, API Gateway patterns
   - Website: https://microservices.io/patterns/

6. **Cloud Patterns**
   - Microsoft Azure Architecture Center
   - https://learn.microsoft.com/en-us/azure/architecture/patterns/
   - Cloud-native patterns: Circuit Breaker, Retry, Bulkhead, CQRS

7. **Reactive Programming**
   - https://reactivex.io/
   - Observer pattern evolution for async/reactive systems

### Online Resources

8. **Refactoring Guru**
   - https://refactoring.guru/design-patterns
   - Excellent visual explanations of all GoF patterns
   - Multiple language examples

9. **Source Making**
   - https://sourcemaking.com/design_patterns
   - Pattern catalog with UML diagrams

10. **Patterns.dev**
    - https://www.patterns.dev/
    - Modern web patterns (React, JavaScript, performance)

### Language-Specific Resources

11. **Python Patterns**
    - https://python-patterns.guide/
    - Pythonic implementations of classic patterns

12. **Java Design Patterns**
    - https://java-design-patterns.com/
    - Open-source Java pattern implementations

13. **TypeScript Patterns**
    - https://github.com/torokmark/design_patterns_in_typescript
    - Type-safe pattern implementations

### Academic Papers

14. **Pattern Languages of Program Design** (Series)
    - Coplien, J. O., & Schmidt, D. C. (Eds.). (1995-2012). *Pattern Languages of Program Design* (Vols. 1-5). Addison-Wesley.
    - Academic perspective on patterns

### Anti-Patterns

15. **AntiPatterns**
    - Brown, W. J., et al. (1998). *AntiPatterns: Refactoring Software, Architectures, and Projects in Crisis*. Wiley.
    - ISBN: 978-0471197133
    - What NOT to do

---

**Last Updated:** 2025-10-20
**Version:** 1.0
