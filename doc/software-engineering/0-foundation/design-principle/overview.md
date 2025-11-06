# Design Principles Guide

**Purpose:** Comprehensive guide to software design principles for building maintainable, scalable systems
**Note:** All principles are language-agnostic; examples are available in multiple languages
**Organization:** PHD Systems & PHD Labs
**Version:** 1.0
**Date:** 2025-10-20

**Quick Links:**
- 📖 **[SOLID Principles Deep Dive](solid-principle.md)** - Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion
- 🔁 **[DRY Principle Deep Dive](dry-principle.md)** - Don't Repeat Yourself, abstraction strategies
- 🎯 **[Separation of Concerns Deep Dive](separation-of-concerns.md)** - Module boundaries, layering, cross-cutting concerns
- 🏗️ **[Architecture Patterns](../../3-design/architecture-pattern/overview.md)** - How principles enable architecture patterns

---

## TL;DR

**Core design principles that make code maintainable, testable, and flexible**. **SOLID principles** → Foundation for clean architecture (5 rules about classes/modules). **DRY** → Don't repeat yourself, but know when duplication is acceptable. **KISS** → Keep it simple, solve today's problems. **YAGNI** → You Aren't Gonna Need It, don't build for future maybes. **Separation of Concerns** → Each module does one thing well. **Key insight**: These principles work together - SOLID enables good architecture, DRY reduces maintenance burden, KISS + YAGNI prevent over-engineering, SoC keeps code organized. **Apply incrementally** → Start with basics (functions, classes), graduate to architecture patterns. **All principles are language-agnostic** → Work in Python, Java, TypeScript, Go, Rust, etc.

---

## Table of Contents

- [Overview](#overview)
- [Quick Reference](#quick-reference)
- [Core Design Principles](#core-design-principles)
  - [1. SOLID Principles](#1-solid-principles)
  - [2. DRY (Don't Repeat Yourself)](#2-dry-dont-repeat-yourself)
  - [3. KISS (Keep It Simple, Stupid)](#3-kiss-keep-it-simple-stupid)
  - [4. YAGNI (You Aren't Gonna Need It)](#4-yagni-you-arent-gonna-need-it)
  - [5. Separation of Concerns](#5-separation-of-concerns)
  - [6. Composition Over Inheritance](#6-composition-over-inheritance)
  - [7. Dependency Inversion](#7-dependency-inversion)
  - [8. Single Source of Truth](#8-single-source-of-truth)
- [When to Apply Each Principle](#when-to-apply-each-principle)
- [Common Violations and Fixes](#common-violations-and-fixes)
- [How Principles Enable Architecture Patterns](#how-principles-enable-architecture-patterns)
- [Multi-Language Examples](#multi-language-examples)
- [Best Practices](#best-practices)
- [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
- [References and Resources](#references-and-resources)

---

## Overview

**Design principles are NOT rules to follow blindly** - they're guidelines for:
- Writing maintainable code that others can understand
- Building flexible systems that accommodate change
- Creating testable components that can be verified
- Organizing code to minimize coupling and maximize cohesion
- Preventing common design mistakes that lead to technical debt

**Key insight:** Principles work together as a system - SOLID provides structure, DRY reduces duplication, KISS prevents complexity, YAGNI avoids waste, and Separation of Concerns organizes everything.

---

## Quick Reference

| Principle | What It Means | When to Apply | Common Mistake |
|-----------|---------------|---------------|----------------|
| **SOLID** | 5 principles for classes/modules | Always (fundamental) | Applying too rigidly |
| **DRY** | Don't duplicate logic | When you see actual duplication | Over-abstracting too early |
| **KISS** | Keep solutions simple | Always (default approach) | Adding unnecessary complexity |
| **YAGNI** | Build only what's needed now | Before adding features | Building for hypothetical futures |
| **SoC** | Separate unrelated concerns | When organizing modules | Mixing business logic with infrastructure |
| **Composition** | Favor object composition | When extending behavior | Deep inheritance hierarchies |
| **DI** | Depend on abstractions | At module boundaries | Depending on concrete implementations |
| **SSOT** | One source of truth per fact | For configuration, schemas | Duplicating data/configuration |

---

## Core Design Principles

### 1. SOLID Principles

**[See detailed guide →](solid-principle.md)**

**SOLID** is an acronym for five fundamental principles of object-oriented design:

#### S - Single Responsibility Principle (SRP)

**Definition:** A class should have only one reason to change.

**What it means:**
- Each class/module should do ONE thing well
- One responsibility = one reason to change
- High cohesion within, low coupling between

**Example (violation in Python):**
```python
# ❌ BAD: Multiple responsibilities
class User:
    def __init__(self, name, email):
        self.name = name
        self.email = email

    def save_to_database(self):
        # Database logic
        pass

    def send_welcome_email(self):
        # Email logic
        pass

    def generate_report(self):
        # Reporting logic
        pass
```

**Fixed version:**
```python
# ✅ GOOD: Single responsibility per class
class User:
    def __init__(self, name, email):
        self.name = name
        self.email = email

class UserRepository:
    def save(self, user: User):
        # Database logic
        pass

class EmailService:
    def send_welcome(self, user: User):
        # Email logic
        pass

class UserReportGenerator:
    def generate(self, user: User):
        # Reporting logic
        pass
```

#### O - Open/Closed Principle (OCP)

**Definition:** Software entities should be open for extension but closed for modification.

**What it means:**
- Add new functionality without changing existing code
- Use abstraction and polymorphism
- Prevents breaking existing behavior

**Example (Java):**
```java
// ❌ BAD: Must modify class to add new shapes
class AreaCalculator {
    public double calculate(Object shape) {
        if (shape instanceof Circle) {
            Circle circle = (Circle) shape;
            return Math.PI * circle.radius * circle.radius;
        } else if (shape instanceof Rectangle) {
            Rectangle rect = (Rectangle) shape;
            return rect.width * rect.height;
        }
        // Must modify this method to add Triangle, Square, etc.
        return 0;
    }
}

// ✅ GOOD: Extend by adding new implementations
interface Shape {
    double area();
}

class Circle implements Shape {
    private double radius;

    public Circle(double radius) {
        this.radius = radius;
    }

    @Override
    public double area() {
        return Math.PI * radius * radius;
    }
}

class Rectangle implements Shape {
    private double width, height;

    public Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }

    @Override
    public double area() {
        return width * height;
    }
}

// Add new shapes without modifying existing code
class Triangle implements Shape {
    private double base, height;

    public Triangle(double base, double height) {
        this.base = base;
        this.height = height;
    }

    @Override
    public double area() {
        return 0.5 * base * height;
    }
}

class AreaCalculator {
    public double calculate(Shape shape) {
        return shape.area(); // Works for all current and future shapes
    }
}
```

#### L - Liskov Substitution Principle (LSP)

**Definition:** Objects of a superclass should be replaceable with objects of its subclasses without breaking the application.

**What it means:**
- Subclasses must honor the parent's contract
- Don't strengthen preconditions or weaken postconditions
- Substitutability ensures polymorphism works correctly

**Example (TypeScript):**
```typescript
// ❌ BAD: Violates LSP - Square breaks Rectangle's behavior
class Rectangle {
    constructor(protected width: number, protected height: number) {}

    setWidth(width: number): void {
        this.width = width;
    }

    setHeight(height: number): void {
        this.height = height;
    }

    area(): number {
        return this.width * this.height;
    }
}

class Square extends Rectangle {
    setWidth(width: number): void {
        this.width = width;
        this.height = width; // ❌ Changes behavior - unexpected side effect
    }

    setHeight(height: number): void {
        this.width = height;
        this.height = height; // ❌ Changes behavior - unexpected side effect
    }
}

// This breaks when using Square as Rectangle
function testRectangle(rect: Rectangle) {
    rect.setWidth(5);
    rect.setHeight(4);
    console.log(rect.area()); // Expects 20, gets 16 with Square!
}

// ✅ GOOD: Proper abstraction
interface Shape {
    area(): number;
}

class Rectangle implements Shape {
    constructor(private width: number, private height: number) {}

    area(): number {
        return this.width * this.height;
    }
}

class Square implements Shape {
    constructor(private side: number) {}

    area(): number {
        return this.side * this.side;
    }
}
```

#### I - Interface Segregation Principle (ISP)

**Definition:** No client should be forced to depend on methods it does not use.

**What it means:**
- Many small, specific interfaces > one large, general interface
- Clients should only know about methods they use
- Prevents "fat interfaces" with unused methods

**Example (Go):**
```go
// ❌ BAD: Fat interface forces implementations to have unused methods
type Worker interface {
    Work()
    Eat()
    Sleep()
}

type Robot struct{}

func (r Robot) Work() {
    fmt.Println("Robot working")
}

func (r Robot) Eat() {
    // ❌ Robots don't eat - forced to implement unused method
}

func (r Robot) Sleep() {
    // ❌ Robots don't sleep - forced to implement unused method
}

// ✅ GOOD: Segregated interfaces
type Workable interface {
    Work()
}

type Eatable interface {
    Eat()
}

type Sleepable interface {
    Sleep()
}

type Robot struct{}

func (r Robot) Work() {
    fmt.Println("Robot working")
}
// Robot only implements Workable - no unused methods

type Human struct{}

func (h Human) Work() {
    fmt.Println("Human working")
}

func (h Human) Eat() {
    fmt.Println("Human eating")
}

func (h Human) Sleep() {
    fmt.Println("Human sleeping")
}
// Human implements all three - by choice
```

#### D - Dependency Inversion Principle (DIP)

**Definition:** High-level modules should not depend on low-level modules. Both should depend on abstractions.

**What it means:**
- Depend on interfaces/abstractions, not concrete implementations
- Invert the direction of dependencies
- Enables testability and flexibility

**Example (Rust):**
```rust
// ❌ BAD: High-level depends on low-level concrete types
struct MySQLDatabase {
    // MySQL specific implementation
}

impl MySQLDatabase {
    fn save(&self, data: &str) {
        println!("Saving to MySQL: {}", data);
    }
}

struct UserService {
    database: MySQLDatabase, // ❌ Depends on concrete implementation
}

impl UserService {
    fn create_user(&self, name: &str) {
        self.database.save(name); // Tightly coupled to MySQL
    }
}

// ✅ GOOD: Both depend on abstraction
trait Database {
    fn save(&self, data: &str);
}

struct MySQLDatabase;

impl Database for MySQLDatabase {
    fn save(&self, data: &str) {
        println!("Saving to MySQL: {}", data);
    }
}

struct PostgresDatabase;

impl Database for PostgresDatabase {
    fn save(&self, data: &str) {
        println!("Saving to Postgres: {}", data);
    }
}

struct UserService<D: Database> {
    database: D, // ✅ Depends on abstraction
}

impl<D: Database> UserService<D> {
    fn create_user(&self, name: &str) {
        self.database.save(name); // Works with any Database implementation
    }
}

// Easy to test with mock
struct MockDatabase;

impl Database for MockDatabase {
    fn save(&self, data: &str) {
        println!("Mock save: {}", data);
    }
}
```

**Why SOLID matters:**
- **S** → Makes code easier to understand and maintain
- **O** → Makes code extensible without breaking existing functionality
- **L** → Makes polymorphism work correctly and safely
- **I** → Makes interfaces focused and clients decoupled
- **D** → Makes code testable and flexible

---

### 2. DRY (Don't Repeat Yourself)

**[See detailed guide →](dry-principle.md)**

**Definition:** Every piece of knowledge should have a single, unambiguous representation in the system.

**What it means:**
- Avoid duplicating logic, data, or configuration
- Abstract common patterns into reusable components
- BUT: Don't abstract prematurely or over-DRY

**Types of duplication:**
1. **Code duplication** - Same logic in multiple places
2. **Logic duplication** - Same algorithm implemented differently
3. **Data duplication** - Same information stored multiple ways
4. **Configuration duplication** - Same settings in multiple files

**Example (Python):**
```python
# ❌ BAD: Duplicated validation logic
def create_user(name, email):
    if not name or len(name) < 2:
        raise ValueError("Name must be at least 2 characters")
    if not email or '@' not in email:
        raise ValueError("Invalid email")
    # Save user...

def update_user(user_id, name, email):
    if not name or len(name) < 2:
        raise ValueError("Name must be at least 2 characters")  # Duplicated!
    if not email or '@' not in email:
        raise ValueError("Invalid email")  # Duplicated!
    # Update user...

# ✅ GOOD: Extract common logic
def validate_user_data(name, email):
    if not name or len(name) < 2:
        raise ValueError("Name must be at least 2 characters")
    if not email or '@' not in email:
        raise ValueError("Invalid email")

def create_user(name, email):
    validate_user_data(name, email)
    # Save user...

def update_user(user_id, name, email):
    validate_user_data(name, email)
    # Update user...
```

**When duplication is acceptable:**
- **Tests** - Duplicating test setup is often clearer than complex helpers
- **Configuration** - Dev/staging/prod configs naturally differ
- **Coincidental duplication** - Code that looks similar but represents different concepts
- **Performance** - Sometimes duplication improves performance (after measurement!)

**Rule of Three:** Wait until you see duplication three times before abstracting.

---

### 3. KISS (Keep It Simple, Stupid)

**Definition:** Most systems work best if they are kept simple rather than made complex.

**What it means:**
- Choose the simplest solution that solves the problem
- Avoid unnecessary complexity
- Don't use advanced patterns when simple code works

**Example (Java):**
```java
// ❌ BAD: Over-engineered for a simple task
interface PaymentStrategy {
    void pay(double amount);
}

class CreditCardStrategy implements PaymentStrategy {
    public void pay(double amount) {
        System.out.println("Paid " + amount + " with credit card");
    }
}

class PayPalStrategy implements PaymentStrategy {
    public void pay(double amount) {
        System.out.println("Paid " + amount + " with PayPal");
    }
}

class PaymentContext {
    private PaymentStrategy strategy;

    public void setStrategy(PaymentStrategy strategy) {
        this.strategy = strategy;
    }

    public void executePayment(double amount) {
        strategy.pay(amount);
    }
}

// Usage
PaymentContext context = new PaymentContext();
context.setStrategy(new CreditCardStrategy());
context.executePayment(100.0);

// ✅ GOOD: Simple and direct (when you only need two payment types)
enum PaymentMethod { CREDIT_CARD, PAYPAL }

class PaymentService {
    public void pay(PaymentMethod method, double amount) {
        switch (method) {
            case CREDIT_CARD:
                System.out.println("Paid " + amount + " with credit card");
                break;
            case PAYPAL:
                System.out.println("Paid " + amount + " with PayPal");
                break;
        }
    }
}

// Usage
PaymentService service = new PaymentService();
service.pay(PaymentMethod.CREDIT_CARD, 100.0);
```

**When complexity is justified:**
- ✅ Proven need (not hypothetical)
- ✅ Significant benefit (performance, maintainability, extensibility)
- ✅ Well-documented why simpler approaches don't work

---

### 4. YAGNI (You Aren't Gonna Need It)

**Definition:** Don't implement features until they are actually needed.

**What it means:**
- Build for today's requirements, not tomorrow's maybes
- Avoid speculative generality
- Refactor when needs become clear

**Example (TypeScript):**
```typescript
// ❌ BAD: Building for hypothetical future
class UserService {
    // Current requirement: Store users in memory
    // But we're "future-proofing" for databases, APIs, caching...

    private storage: Storage;
    private cache: Cache;
    private eventBus: EventBus;
    private metrics: Metrics;

    constructor(
        storage: Storage,
        cache: Cache,
        eventBus: EventBus,
        metrics: Metrics
    ) {
        this.storage = storage;
        this.cache = cache;
        this.eventBus = eventBus;
        this.metrics = metrics;
    }

    async createUser(data: UserData): Promise<User> {
        this.metrics.increment('user.create.attempt');

        // Check cache
        const cached = await this.cache.get(data.email);
        if (cached) {
            this.metrics.increment('user.create.cache_hit');
            return cached;
        }

        // Create user
        const user = await this.storage.save(data);

        // Update cache
        await this.cache.set(data.email, user);

        // Publish event
        await this.eventBus.publish('user.created', user);

        this.metrics.increment('user.create.success');
        return user;
    }
}

// ✅ GOOD: Build only what's needed now
class UserService {
    private users: Map<string, User> = new Map();

    createUser(data: UserData): User {
        const user: User = {
            id: crypto.randomUUID(),
            ...data
        };
        this.users.set(user.id, user);
        return user;
    }
}

// When you ACTUALLY need database persistence, THEN add it
// When you ACTUALLY need caching, THEN add it
// When you ACTUALLY need events, THEN add it
```

**YAGNI doesn't mean:**
- ❌ Write bad code that's hard to change
- ❌ Ignore obvious extension points
- ❌ Skip basic error handling

**YAGNI does mean:**
- ✅ Wait for real requirements before adding complexity
- ✅ Refactor when needs emerge
- ✅ Trust your ability to change code later

---

### 5. Separation of Concerns

**[See detailed guide →](separation-of-concerns.md)**

**Definition:** Separate a program into distinct sections, each addressing a separate concern.

**What it means:**
- Each module/layer handles one aspect of functionality
- Business logic separate from infrastructure
- Presentation separate from data access

**Example (Python with FastAPI):**
```python
# ❌ BAD: Everything mixed together
from fastapi import FastAPI
import psycopg2

app = FastAPI()

@app.post("/users")
def create_user(name: str, email: str):
    # Validation mixed with business logic mixed with data access
    if not name or len(name) < 2:
        return {"error": "Invalid name"}

    if not email or '@' not in email:
        return {"error": "Invalid email"}

    # Business logic
    user_id = generate_user_id()
    created_at = datetime.now()

    # Direct database access in endpoint
    conn = psycopg2.connect("postgresql://...")
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO users (id, name, email, created_at) VALUES (%s, %s, %s, %s)",
        (user_id, name, email, created_at)
    )
    conn.commit()
    conn.close()

    # Return presentation format
    return {
        "id": user_id,
        "name": name,
        "email": email,
        "created_at": created_at.isoformat()
    }

# ✅ GOOD: Separated concerns
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Protocol

# Presentation layer (API)
app = FastAPI()

class CreateUserRequest(BaseModel):
    name: str
    email: EmailStr

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: str

@app.post("/users", response_model=UserResponse)
def create_user(request: CreateUserRequest):
    try:
        user = user_service.create(request.name, request.email)
        return UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            created_at=user.created_at.isoformat()
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Domain layer (business logic)
from dataclasses import dataclass
from datetime import datetime

@dataclass
class User:
    id: str
    name: str
    email: str
    created_at: datetime

class UserService:
    def __init__(self, repository: 'UserRepository'):
        self.repository = repository

    def create(self, name: str, email: str) -> User:
        # Business logic only
        self._validate_name(name)
        self._validate_email(email)

        user = User(
            id=self._generate_id(),
            name=name,
            email=email,
            created_at=datetime.now()
        )

        return self.repository.save(user)

    def _validate_name(self, name: str):
        if not name or len(name) < 2:
            raise ValueError("Name must be at least 2 characters")

    def _validate_email(self, email: str):
        if not email or '@' not in email:
            raise ValueError("Invalid email")

    def _generate_id(self) -> str:
        import uuid
        return str(uuid.uuid4())

# Data access layer (infrastructure)
class UserRepository(Protocol):
    def save(self, user: User) -> User: ...

class PostgresUserRepository:
    def __init__(self, connection_string: str):
        self.connection_string = connection_string

    def save(self, user: User) -> User:
        import psycopg2
        conn = psycopg2.connect(self.connection_string)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (id, name, email, created_at) VALUES (%s, %s, %s, %s)",
            (user.id, user.name, user.email, user.created_at)
        )
        conn.commit()
        conn.close()
        return user

# Dependency injection (composition root)
repository = PostgresUserRepository("postgresql://...")
user_service = UserService(repository)
```

**Benefits:**
- ✅ Each layer can be tested independently
- ✅ Easy to swap implementations (e.g., Postgres → MongoDB)
- ✅ Business logic free of infrastructure details
- ✅ Clear responsibilities and boundaries

---

### 6. Composition Over Inheritance

**Definition:** Favor object composition over class inheritance to achieve code reuse.

**What it means:**
- Build complex objects by combining simple ones
- Avoid deep inheritance hierarchies
- Use "has-a" relationships instead of "is-a"

**Example (Kotlin):**
```kotlin
// ❌ BAD: Deep inheritance hierarchy
open class Animal {
    open fun move() = println("Moving")
}

open class Mammal : Animal() {
    fun feedMilk() = println("Feeding milk")
}

open class Dog : Mammal() {
    fun bark() = println("Barking")
}

class ServiceDog : Dog() {
    fun assist() = println("Assisting")
}

// Problems:
// - Tight coupling to parent classes
// - Hard to reuse assist() without inheriting bark(), feedMilk(), move()
// - Can't compose behaviors dynamically

// ✅ GOOD: Composition with interfaces
interface Movable {
    fun move()
}

interface Vocal {
    fun makeSound()
}

interface Assistive {
    fun assist()
}

class WalkingBehavior : Movable {
    override fun move() = println("Walking")
}

class BarkingBehavior : Vocal {
    override fun makeSound() = println("Barking")
}

class AssistiveBehavior : Assistive {
    override fun assist() = println("Assisting")
}

// Compose behaviors as needed
class ServiceDog(
    private val movable: Movable,
    private val vocal: Vocal,
    private val assistive: Assistive
) : Movable by movable,
    Vocal by vocal,
    Assistive by assistive

// Usage
val serviceDog = ServiceDog(
    WalkingBehavior(),
    BarkingBehavior(),
    AssistiveBehavior()
)

serviceDog.move()       // Walking
serviceDog.makeSound()  // Barking
serviceDog.assist()     // Assisting

// Easy to create variations
class Robot(
    movable: Movable,
    assistive: Assistive
) : Movable by movable,
    Assistive by assistive

val robot = Robot(
    WalkingBehavior(),
    AssistiveBehavior()
)
// Robot can move and assist, but doesn't bark
```

**When inheritance is appropriate:**
- ✅ True "is-a" relationships (Car is a Vehicle)
- ✅ Shallow hierarchies (1-2 levels)
- ✅ Liskov Substitution Principle holds

---

### 7. Dependency Inversion

See **[SOLID Principles - Dependency Inversion](#d---dependency-inversion-principle-dip)** above.

**Quick summary:**
- High-level modules shouldn't depend on low-level modules
- Both should depend on abstractions (interfaces/protocols)
- Enables testability, flexibility, and modularity

---

### 8. Single Source of Truth (SSOT)

**Definition:** Each piece of data should have one authoritative source.

**What it means:**
- Don't duplicate data or configuration
- Derive computed values instead of storing them
- One place to update when data changes

**Example (configuration):**
```yaml
# ❌ BAD: Duplicated configuration
# config/development.yml
database:
  host: localhost
  port: 5432
  name: myapp_dev

# config/test.yml
database:
  host: localhost
  port: 5432  # Duplicated!
  name: myapp_test

# config/production.yml
database:
  host: prod-db.example.com
  port: 5432  # Duplicated!
  name: myapp_prod

# ✅ GOOD: Single source of truth with environment-specific overrides
# config/default.yml
database:
  host: localhost
  port: 5432  # Single source - only override if different
  name: myapp_${ENV}

# config/production.yml (only override what's different)
database:
  host: prod-db.example.com
```

**Example (computed values in Python):**
```python
# ❌ BAD: Storing computed values
class Order:
    def __init__(self, items):
        self.items = items
        self.total = sum(item.price for item in items)  # Stored value
        self.tax = self.total * 0.1  # Stored value
        self.grand_total = self.total + self.tax  # Stored value

    # If items change, total/tax/grand_total are stale!

# ✅ GOOD: Compute on demand
class Order:
    def __init__(self, items):
        self.items = items  # Single source of truth

    @property
    def total(self):
        return sum(item.price for item in self.items)

    @property
    def tax(self):
        return self.total * 0.1

    @property
    def grand_total(self):
        return self.total + self.tax

    # Always correct, even if items change
```

---

## When to Apply Each Principle

| Principle | Stage | Signal to Apply | Cost of Ignoring |
|-----------|-------|-----------------|------------------|
| **SOLID** | Always | Writing classes/modules | Hard to test, change, extend |
| **DRY** | After 2-3 duplications | Seeing same logic repeated | Maintenance burden, bug multiplication |
| **KISS** | Always (default) | Considering complex solution | Over-engineering, hard to understand |
| **YAGNI** | Always (default) | "We might need..." | Wasted effort, unnecessary complexity |
| **SoC** | Module boundaries | Business logic mixed with infrastructure | Tight coupling, hard to test/reuse |
| **Composition** | Designing object relationships | Deep inheritance (3+ levels) | Inflexible, hard to reuse behaviors |
| **DI** | Module boundaries | Hard to test due to concrete deps | Tight coupling, hard to test/mock |
| **SSOT** | Data/config design | Same data in multiple places | Inconsistency, sync issues |

---

## Common Violations and Fixes

### Violation 1: God Class (Multiple Responsibilities)

**Problem:** One class doing too much

```java
// ❌ BAD
class UserManager {
    public void createUser(String name, String email) { ... }
    public void saveToDatabase(User user) { ... }
    public void sendEmail(User user) { ... }
    public String generateReport(List<User> users) { ... }
    public void validateEmail(String email) { ... }
    public void hashPassword(String password) { ... }
}
```

**Fix:** Apply SRP - separate concerns

```java
// ✅ GOOD
class UserService {
    private final UserRepository repository;
    private final EmailService emailService;
    private final UserValidator validator;

    public void createUser(String name, String email) {
        validator.validateEmail(email);
        User user = new User(name, email);
        repository.save(user);
        emailService.sendWelcome(user);
    }
}

class UserRepository {
    public void save(User user) { ... }
}

class EmailService {
    public void sendWelcome(User user) { ... }
}

class UserValidator {
    public void validateEmail(String email) { ... }
}
```

---

### Violation 2: Copy-Paste Code (DRY Violation)

**Problem:** Same logic duplicated everywhere

```python
# ❌ BAD
def process_payment_card(amount, card_number):
    if amount <= 0:
        raise ValueError("Amount must be positive")
    if not card_number:
        raise ValueError("Card number required")
    # Process card...

def process_payment_paypal(amount, paypal_email):
    if amount <= 0:
        raise ValueError("Amount must be positive")  # Duplicated!
    if not paypal_email:
        raise ValueError("Email required")
    # Process PayPal...
```

**Fix:** Extract common logic

```python
# ✅ GOOD
def validate_payment_amount(amount):
    if amount <= 0:
        raise ValueError("Amount must be positive")

def process_payment_card(amount, card_number):
    validate_payment_amount(amount)
    if not card_number:
        raise ValueError("Card number required")
    # Process card...

def process_payment_paypal(amount, paypal_email):
    validate_payment_amount(amount)
    if not paypal_email:
        raise ValueError("Email required")
    # Process PayPal...
```

---

### Violation 3: Tight Coupling (DIP Violation)

**Problem:** Depending on concrete implementations

```typescript
// ❌ BAD
class EmailNotification {
    send(message: string): void {
        console.log(`Sending email: ${message}`);
    }
}

class UserService {
    private notification = new EmailNotification(); // Tight coupling!

    createUser(name: string): void {
        // Create user...
        this.notification.send(`Welcome ${name}`);
    }
}
```

**Fix:** Depend on abstraction

```typescript
// ✅ GOOD
interface Notification {
    send(message: string): void;
}

class EmailNotification implements Notification {
    send(message: string): void {
        console.log(`Sending email: ${message}`);
    }
}

class SMSNotification implements Notification {
    send(message: string): void {
        console.log(`Sending SMS: ${message}`);
    }
}

class UserService {
    constructor(private notification: Notification) {} // Dependency injection

    createUser(name: string): void {
        // Create user...
        this.notification.send(`Welcome ${name}`);
    }
}

// Easy to switch or test
const service1 = new UserService(new EmailNotification());
const service2 = new UserService(new SMSNotification());
```

---

### Violation 4: Over-Engineering (KISS/YAGNI Violation)

**Problem:** Building complex abstractions for simple needs

```java
// ❌ BAD: Over-engineered for simple config
interface ConfigSource {
    String get(String key);
}

interface ConfigCache {
    void put(String key, String value);
    String get(String key);
}

interface ConfigValidator {
    boolean validate(String key, String value);
}

class ConfigManager {
    private ConfigSource source;
    private ConfigCache cache;
    private ConfigValidator validator;
    private List<ConfigListener> listeners;

    // 200 lines of complex logic for getting config values...
}
```

**Fix:** Start simple

```java
// ✅ GOOD: Simple and sufficient
class Config {
    private Map<String, String> values = new HashMap<>();

    public String get(String key) {
        return values.get(key);
    }

    public void set(String key, String value) {
        values.put(key, value);
    }
}

// Add complexity ONLY when needed
```

---

## How Principles Enable Architecture Patterns

Design principles are the foundation for architecture patterns:

| Architecture Pattern | Key Principles Used |
|---------------------|---------------------|
| **Clean Architecture** | SOLID (especially DIP), Separation of Concerns |
| **Hexagonal Architecture** | DIP, Separation of Concerns, SOLID |
| **Microservices** | SRP (service level), Separation of Concerns, SSOT |
| **Event-Driven** | OCP (extend via events), DIP, Loose Coupling |
| **CQRS** | SRP (separate read/write), Separation of Concerns |
| **Layered Architecture** | Separation of Concerns, DIP |

**See:** [Architecture Patterns Guide](../../3-design/architecture-pattern/overview.md) for how these principles scale to system design.

---

## Multi-Language Examples

All principles are language-agnostic. Here's a single principle (SRP) across languages:

### Single Responsibility - User Management

**Python:**
```python
class User:
    def __init__(self, name: str, email: str):
        self.name = name
        self.email = email

class UserRepository:
    def save(self, user: User) -> None:
        pass  # Database logic

class EmailService:
    def send_welcome(self, user: User) -> None:
        pass  # Email logic
```

**Java:**
```java
public class User {
    private String name;
    private String email;

    public User(String name, String email) {
        this.name = name;
        this.email = email;
    }
}

public class UserRepository {
    public void save(User user) {
        // Database logic
    }
}

public class EmailService {
    public void sendWelcome(User user) {
        // Email logic
    }
}
```

**Go:**
```go
type User struct {
    Name  string
    Email string
}

type UserRepository struct {}

func (r *UserRepository) Save(user User) error {
    // Database logic
    return nil
}

type EmailService struct {}

func (s *EmailService) SendWelcome(user User) error {
    // Email logic
    return nil
}
```

**Rust:**
```rust
struct User {
    name: String,
    email: String,
}

struct UserRepository;

impl UserRepository {
    fn save(&self, user: &User) -> Result<(), Error> {
        // Database logic
        Ok(())
    }
}

struct EmailService;

impl EmailService {
    fn send_welcome(&self, user: &User) -> Result<(), Error> {
        // Email logic
        Ok(())
    }
}
```

**Same principle, different syntax** - the concept is universal.

---

## Best Practices

### 1. Start Simple, Evolve as Needed

- ✅ Begin with straightforward code
- ✅ Apply principles when pain emerges
- ✅ Refactor gradually, not all at once

### 2. Principles Work Together

- ✅ SOLID provides structure
- ✅ DRY reduces duplication
- ✅ KISS keeps solutions simple
- ✅ YAGNI prevents waste
- ✅ Apply as a system, not in isolation

### 3. Know When to Break Rules

Principles are guidelines, not laws:
- ✅ Performance requirements may justify duplication
- ✅ Simple projects may not need full SOLID
- ✅ Tests often duplicate setup code (and that's OK)
- ✅ Pragmatism > dogmatism

### 4. Use Principles for Code Review

Ask during reviews:
- "Does this class have a single responsibility?"
- "Are we duplicating logic that should be shared?"
- "Is this solution simpler than alternatives?"
- "Will we actually need this feature?"
- "Are concerns properly separated?"

### 5. Document Architectural Decisions

When applying (or breaking) principles:
- ✅ Document why in comments or ADRs
- ✅ Explain tradeoffs
- ✅ Make decisions explicit

---

## Anti-Patterns to Avoid

### 1. Premature Abstraction

**Problem:** Creating abstractions before patterns emerge

```python
# ❌ BAD: Too abstract too soon
class DataProcessor:
    def process(self, data: Data) -> ProcessedData:
        pass  # No clear pattern yet

class ConcreteProcessorFactory:
    def create(self, type: str) -> DataProcessor:
        pass  # Building factory before knowing needs
```

**Better:** Start concrete, abstract when duplication emerges

### 2. Cargo Cult Programming

**Problem:** Applying patterns because "that's what you do"

```java
// ❌ BAD: Using Singleton everywhere "because patterns"
class ConfigManager {
    private static ConfigManager instance;

    private ConfigManager() {}

    public static ConfigManager getInstance() {
        if (instance == null) {
            instance = new ConfigManager();
        }
        return instance;
    }
}

// ✅ GOOD: Simple static class if you need one instance
class Config {
    private static final Map<String, String> values = new HashMap<>();

    public static String get(String key) {
        return values.get(key);
    }
}
```

### 3. Over-Application of DRY

**Problem:** Abstracting coincidental duplication

```typescript
// ❌ BAD: These are different concepts that happen to look similar
function validateAge(age: number): boolean {
    return age > 0 && age < 150;
}

function validateQuantity(qty: number): boolean {
    return qty > 0 && qty < 150;  // Same logic, different meaning!
}

// Don't merge these - they represent different business rules
// that might diverge (e.g., max age vs max quantity)
```

### 4. Violating LSP with Inheritance

**Problem:** Breaking parent contracts in subclasses

```python
# ❌ BAD: Bird violates flying assumption
class Bird:
    def fly(self):
        return "Flying"

class Penguin(Bird):
    def fly(self):
        raise Exception("Can't fly!")  # Breaks contract
```

**Fix:** Use composition or proper abstraction

---

## References and Resources

### Books

1. **"Clean Code"** by Robert C. Martin
   - Comprehensive coverage of SOLID, DRY, and code quality
   - Language-agnostic principles with Java examples

2. **"Design Patterns: Elements of Reusable Object-Oriented Software"** by Gang of Four
   - Original design patterns book
   - Foundation for modern software design

3. **"The Pragmatic Programmer"** by David Thomas and Andrew Hunt
   - DRY principle origin
   - Practical software craftsmanship

4. **"Refactoring"** by Martin Fowler
   - How to apply principles through refactoring
   - Catalog of code improvements

### Online Resources

1. **SOLID Principles:**
   - https://www.digitalocean.com/community/conceptual_articles/s-o-l-i-d-the-first-five-principles-of-object-oriented-design
   - https://stackify.com/solid-design-principles/

2. **DRY Principle:**
   - https://en.wikipedia.org/wiki/Don%27t_repeat_yourself
   - https://thevaluable.dev/dry-principle-cost-benefit-example/

3. **KISS Principle:**
   - https://en.wikipedia.org/wiki/KISS_principle
   - https://www.interaction-design.org/literature/article/kiss-keep-it-simple-stupid-a-design-principle

4. **YAGNI:**
   - https://martinfowler.com/bliki/Yagni.html
   - https://en.wikipedia.org/wiki/You_aren%27t_gonna_need_it

5. **Composition Over Inheritance:**
   - https://en.wikipedia.org/wiki/Composition_over_inheritance
   - https://www.thoughtworks.com/insights/blog/composition-vs-inheritance-how-choose

### Related Guides

- **[SOLID Principles Deep Dive](solid-principle.md)** - Comprehensive SOLID coverage
- **[DRY Principle Deep Dive](dry-principle.md)** - Don't Repeat Yourself in detail
- **[Separation of Concerns Deep Dive](separation-of-concerns.md)** - Module boundaries and layering
- **[Architecture Patterns Guide](../../3-design/architecture-pattern/overview.md)** - How principles enable patterns

---

*Last Updated: 2025-10-20*
