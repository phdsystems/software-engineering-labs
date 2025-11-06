# SOLID Principles Deep Dive

**Purpose:** Comprehensive guide to SOLID principles - the foundation of object-oriented design
**Note:** All principles are language-agnostic; examples in Python, Java, TypeScript, Go, and Rust
**Organization:** PHD Systems & PHD Labs
**Version:** 1.0
**Date:** 2025-10-20

---

## TL;DR

**SOLID is an acronym for five fundamental object-oriented design principles** that make code maintainable, testable, and flexible. **S**ingle Responsibility → Each class does one thing. **O**pen/Closed → Extend behavior without modifying existing code. **L**iskov Substitution → Subclasses must honor parent contracts. **I**nterface Segregation → Many small interfaces > one large interface. **D**ependency Inversion → Depend on abstractions, not concrete implementations. **Key insight**: SOLID principles work together - they're not isolated rules. **When to apply**: Always (these are fundamental), but don't over-engineer simple code. **Result**: Code that's easy to test, extend, and maintain. **These principles enable Clean Architecture, Hexagonal Architecture, and other modern patterns**.

---

## Table of Contents

- [Overview](#overview)
- [Why SOLID Matters](#why-solid-matters)
- [1. Single Responsibility Principle (SRP)](#1-single-responsibility-principle-srp)
  - [Definition and Core Concept](#definition-and-core-concept)
  - [Multi-Language Examples](#multi-language-examples-srp)
  - [Common Violations](#common-violations-srp)
  - [When to Apply](#when-to-apply-srp)
- [2. Open/Closed Principle (OCP)](#2-openclosed-principle-ocp)
  - [Definition and Core Concept](#definition-and-core-concept-ocp)
  - [Multi-Language Examples](#multi-language-examples-ocp)
  - [Common Violations](#common-violations-ocp)
  - [Design Patterns That Support OCP](#design-patterns-that-support-ocp)
- [3. Liskov Substitution Principle (LSP)](#3-liskov-substitution-principle-lsp)
  - [Definition and Core Concept](#definition-and-core-concept-lsp)
  - [Multi-Language Examples](#multi-language-examples-lsp)
  - [Common Violations](#common-violations-lsp)
  - [Testing for LSP Compliance](#testing-for-lsp-compliance)
- [4. Interface Segregation Principle (ISP)](#4-interface-segregation-principle-isp)
  - [Definition and Core Concept](#definition-and-core-concept-isp)
  - [Multi-Language Examples](#multi-language-examples-isp)
  - [Common Violations](#common-violations-isp)
  - [When to Segregate Interfaces](#when-to-segregate-interfaces)
- [5. Dependency Inversion Principle (DIP)](#5-dependency-inversion-principle-dip)
  - [Definition and Core Concept](#definition-and-core-concept-dip)
  - [Multi-Language Examples](#multi-language-examples-dip)
  - [Common Violations](#common-violations-dip)
  - [DIP Enables Clean Architecture](#dip-enables-clean-architecture)
- [How SOLID Principles Work Together](#how-solid-principles-work-together)
- [SOLID and Architecture Patterns](#solid-and-architecture-patterns)
- [Common Mistakes](#common-mistakes)
- [Best Practices](#best-practices)
- [References and Resources](#references-and-resources)

---

## Overview

SOLID is an acronym coined by Robert C. Martin (Uncle Bob) representing five fundamental principles of object-oriented programming:

| Letter | Principle | Core Concept |
|--------|-----------|--------------|
| **S** | Single Responsibility | A class should have one reason to change |
| **O** | Open/Closed | Open for extension, closed for modification |
| **L** | Liskov Substitution | Subclasses must be substitutable for their base classes |
| **I** | Interface Segregation | Many specific interfaces > one general interface |
| **D** | Dependency Inversion | Depend on abstractions, not concretions |

**These principles are language-agnostic** - they apply to any object-oriented or functional language with modules/classes.

---

## Why SOLID Matters

### Without SOLID:
- ❌ Changes break unrelated functionality
- ❌ Code is hard to test (tight coupling)
- ❌ Extending functionality requires modifying existing code
- ❌ Classes are large and do many things
- ❌ High coupling between modules

### With SOLID:
- ✅ Changes are isolated and safe
- ✅ Code is testable (loose coupling)
- ✅ Extend functionality without modifying existing code
- ✅ Classes are small and focused
- ✅ Low coupling, high cohesion

### Impact on Architecture:

SOLID principles are the foundation for:
- **Clean Architecture** - Dependency Inversion enables domain independence
- **Hexagonal Architecture** - Interface Segregation and DIP enable ports/adapters
- **Microservices** - Single Responsibility at service level
- **Testability** - Dependency Inversion enables mocking

---

## 1. Single Responsibility Principle (SRP)

### Definition and Core Concept

> **A class should have only one reason to change.**

**What it really means:**
- Each class should have one, and only one, responsibility
- One responsibility = one reason to change
- High cohesion within a class
- Low coupling between classes

**Identifying responsibilities:**
- Can you describe the class's purpose in a single sentence without using "and" or "or"?
- Would different stakeholders request changes to this class?
- Could you extract cohesive subsets of methods into separate classes?

### Multi-Language Examples (SRP)

#### Violation Example (Python)

```python
# ❌ BAD: User class has multiple responsibilities
class User:
    def __init__(self, name: str, email: str):
        self.name = name
        self.email = email

    # Responsibility 1: User data/behavior
    def get_full_name(self) -> str:
        return f"{self.name}"

    # Responsibility 2: Database operations
    def save_to_database(self):
        import sqlite3
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (name, email) VALUES (?, ?)",
            (self.name, self.email)
        )
        conn.commit()
        conn.close()

    # Responsibility 3: Email operations
    def send_welcome_email(self):
        import smtplib
        server = smtplib.SMTP('smtp.gmail.com', 587)
        message = f"Welcome {self.name}!"
        server.sendmail("noreply@app.com", self.email, message)
        server.quit()

    # Responsibility 4: Report generation
    def generate_user_report(self) -> str:
        return f"User Report\n" \
               f"Name: {self.name}\n" \
               f"Email: {self.email}\n"

    # Responsibility 5: Validation
    def validate_email(self) -> bool:
        return '@' in self.email and '.' in self.email.split('@')[1]

# Problems:
# - Changes to database logic require modifying User class
# - Changes to email service require modifying User class
# - Changes to report format require modifying User class
# - Hard to test in isolation
# - Violates "one reason to change"
```

#### Fixed Example (Python)

```python
# ✅ GOOD: Separated responsibilities

# Responsibility 1: User data/behavior (domain model)
from dataclasses import dataclass

@dataclass
class User:
    name: str
    email: str

    def get_full_name(self) -> str:
        return f"{self.name}"

# Responsibility 2: Database operations
class UserRepository:
    def __init__(self, connection_string: str):
        self.connection_string = connection_string

    def save(self, user: User) -> None:
        import sqlite3
        conn = sqlite3.connect(self.connection_string)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (name, email) VALUES (?, ?)",
            (user.name, user.email)
        )
        conn.commit()
        conn.close()

    def find_by_email(self, email: str) -> User | None:
        # Database query logic
        pass

# Responsibility 3: Email operations
class EmailService:
    def __init__(self, smtp_host: str, smtp_port: int):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port

    def send_welcome(self, user: User) -> None:
        import smtplib
        server = smtplib.SMTP(self.smtp_host, self.smtp_port)
        message = f"Welcome {user.name}!"
        server.sendmail("noreply@app.com", user.email, message)
        server.quit()

# Responsibility 4: Report generation
class UserReportGenerator:
    def generate(self, user: User) -> str:
        return f"User Report\n" \
               f"Name: {user.name}\n" \
               f"Email: {user.email}\n"

# Responsibility 5: Validation
class UserValidator:
    def validate_email(self, email: str) -> bool:
        return '@' in email and '.' in email.split('@')[1]

    def validate_name(self, name: str) -> bool:
        return len(name) >= 2

# Benefits:
# ✅ Each class has one reason to change
# ✅ Easy to test in isolation
# ✅ Can swap implementations (e.g., PostgresUserRepository)
# ✅ Clear responsibilities
```

#### Java Example

```java
// ✅ GOOD: Single Responsibility in Java

// Domain model - only user data and behavior
public class User {
    private final String name;
    private final String email;

    public User(String name, String email) {
        this.name = name;
        this.email = email;
    }

    public String getName() { return name; }
    public String getEmail() { return email; }

    public String getFullName() {
        return name;
    }
}

// Database responsibility
public class UserRepository {
    private final DataSource dataSource;

    public UserRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public void save(User user) {
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                 "INSERT INTO users (name, email) VALUES (?, ?)")) {

            stmt.setString(1, user.getName());
            stmt.setString(2, user.getEmail());
            stmt.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to save user", e);
        }
    }

    public Optional<User> findByEmail(String email) {
        // Query implementation
        return Optional.empty();
    }
}

// Email responsibility
public class EmailService {
    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendWelcome(User user) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(user.getEmail());
        message.setSubject("Welcome!");
        message.setText("Welcome " + user.getName() + "!");
        mailSender.send(message);
    }
}

// Validation responsibility
public class UserValidator {
    public void validate(User user) {
        validateEmail(user.getEmail());
        validateName(user.getName());
    }

    private void validateEmail(String email) {
        if (email == null || !email.contains("@")) {
            throw new IllegalArgumentException("Invalid email");
        }
    }

    private void validateName(String name) {
        if (name == null || name.length() < 2) {
            throw new IllegalArgumentException("Name must be at least 2 characters");
        }
    }
}
```

#### TypeScript Example

```typescript
// ✅ GOOD: Single Responsibility in TypeScript

// Domain model
interface User {
    name: string;
    email: string;
}

// Database responsibility
interface UserRepository {
    save(user: User): Promise<void>;
    findByEmail(email: string): Promise<User | null>;
}

class PostgresUserRepository implements UserRepository {
    constructor(private connectionString: string) {}

    async save(user: User): Promise<void> {
        // PostgreSQL logic
        const client = await this.getClient();
        await client.query(
            'INSERT INTO users (name, email) VALUES ($1, $2)',
            [user.name, user.email]
        );
    }

    async findByEmail(email: string): Promise<User | null> {
        // Query implementation
        return null;
    }

    private async getClient() {
        // Connection logic
        return {} as any;
    }
}

// Email responsibility
interface EmailService {
    sendWelcome(user: User): Promise<void>;
}

class SMTPEmailService implements EmailService {
    constructor(
        private host: string,
        private port: number
    ) {}

    async sendWelcome(user: User): Promise<void> {
        // SMTP logic
        console.log(`Sending welcome email to ${user.email}`);
    }
}

// Validation responsibility
class UserValidator {
    validate(user: User): void {
        this.validateEmail(user.email);
        this.validateName(user.name);
    }

    private validateEmail(email: string): void {
        if (!email.includes('@')) {
            throw new Error('Invalid email');
        }
    }

    private validateName(name: string): void {
        if (name.length < 2) {
            throw new Error('Name must be at least 2 characters');
        }
    }
}
```

#### Go Example

```go
// ✅ GOOD: Single Responsibility in Go

package user

// Domain model
type User struct {
    Name  string
    Email string
}

func (u *User) GetFullName() string {
    return u.Name
}

// Database responsibility
type Repository interface {
    Save(user *User) error
    FindByEmail(email string) (*User, error)
}

type PostgresRepository struct {
    connString string
}

func NewPostgresRepository(connString string) *PostgresRepository {
    return &PostgresRepository{connString: connString}
}

func (r *PostgresRepository) Save(user *User) error {
    // PostgreSQL logic
    // db.Exec("INSERT INTO users (name, email) VALUES ($1, $2)", user.Name, user.Email)
    return nil
}

func (r *PostgresRepository) FindByEmail(email string) (*User, error) {
    // Query implementation
    return nil, nil
}

// Email responsibility
type EmailService interface {
    SendWelcome(user *User) error
}

type SMTPEmailService struct {
    host string
    port int
}

func NewSMTPEmailService(host string, port int) *SMTPEmailService {
    return &SMTPEmailService{host: host, port: port}
}

func (s *SMTPEmailService) SendWelcome(user *User) error {
    // SMTP logic
    fmt.Printf("Sending welcome email to %s\n", user.Email)
    return nil
}

// Validation responsibility
type Validator struct{}

func (v *Validator) Validate(user *User) error {
    if err := v.validateEmail(user.Email); err != nil {
        return err
    }
    return v.validateName(user.Name)
}

func (v *Validator) validateEmail(email string) error {
    if !strings.Contains(email, "@") {
        return errors.New("invalid email")
    }
    return nil
}

func (v *Validator) validateName(name string) error {
    if len(name) < 2 {
        return errors.New("name must be at least 2 characters")
    }
    return nil
}
```

#### Rust Example

```rust
// ✅ GOOD: Single Responsibility in Rust

// Domain model
#[derive(Clone, Debug)]
pub struct User {
    pub name: String,
    pub email: String,
}

impl User {
    pub fn new(name: String, email: String) -> Self {
        Self { name, email }
    }

    pub fn get_full_name(&self) -> &str {
        &self.name
    }
}

// Database responsibility
pub trait UserRepository {
    fn save(&self, user: &User) -> Result<(), Box<dyn std::error::Error>>;
    fn find_by_email(&self, email: &str) -> Result<Option<User>, Box<dyn std::error::Error>>;
}

pub struct PostgresUserRepository {
    connection_string: String,
}

impl PostgresUserRepository {
    pub fn new(connection_string: String) -> Self {
        Self { connection_string }
    }
}

impl UserRepository for PostgresUserRepository {
    fn save(&self, user: &User) -> Result<(), Box<dyn std::error::Error>> {
        // PostgreSQL logic
        println!("Saving user: {:?}", user);
        Ok(())
    }

    fn find_by_email(&self, email: &str) -> Result<Option<User>, Box<dyn std::error::Error>> {
        // Query implementation
        Ok(None)
    }
}

// Email responsibility
pub trait EmailService {
    fn send_welcome(&self, user: &User) -> Result<(), Box<dyn std::error::Error>>;
}

pub struct SMTPEmailService {
    host: String,
    port: u16,
}

impl SMTPEmailService {
    pub fn new(host: String, port: u16) -> Self {
        Self { host, port }
    }
}

impl EmailService for SMTPEmailService {
    fn send_welcome(&self, user: &User) -> Result<(), Box<dyn std::error::Error>> {
        println!("Sending welcome email to {}", user.email);
        Ok(())
    }
}

// Validation responsibility
pub struct UserValidator;

impl UserValidator {
    pub fn validate(&self, user: &User) -> Result<(), String> {
        self.validate_email(&user.email)?;
        self.validate_name(&user.name)?;
        Ok(())
    }

    fn validate_email(&self, email: &str) -> Result<(), String> {
        if !email.contains('@') {
            return Err("Invalid email".to_string());
        }
        Ok(())
    }

    fn validate_name(&self, name: &str) -> Result<(), String> {
        if name.len() < 2 {
            return Err("Name must be at least 2 characters".to_string());
        }
        Ok(())
    }
}
```

### Common Violations (SRP)

1. **God Class** - One class doing everything
2. **Mixed Concerns** - Business logic + database + presentation
3. **Utility Classes** - Classes with unrelated static methods
4. **Manager Classes** - Classes that orchestrate but also implement logic

### When to Apply (SRP)

✅ **Apply when:**
- Writing new classes
- A class has multiple reasons to change
- You can't describe a class in one sentence
- Testing requires mocking many dependencies

❌ **Don't over-apply:**
- Don't create a class for every single method
- Small projects might not need this level of separation
- Balance with pragmatism

---

## 2. Open/Closed Principle (OCP)

### Definition and Core Concept (OCP)

> **Software entities should be open for extension, but closed for modification.**

**What it really means:**
- Add new functionality without changing existing code
- Use abstraction (interfaces, abstract classes) to enable extension
- Existing code is "closed" - you don't modify it
- New code "extends" behavior through polymorphism

**Why it matters:**
- Prevents breaking existing functionality
- Reduces regression risk
- Enables plugin architectures
- Promotes loose coupling

### Multi-Language Examples (OCP)

#### Violation Example (Python)

```python
# ❌ BAD: Must modify class to add new discount types
class DiscountCalculator:
    def calculate(self, order_type: str, amount: float) -> float:
        if order_type == "regular":
            return amount * 0.95  # 5% discount
        elif order_type == "premium":
            return amount * 0.90  # 10% discount
        elif order_type == "vip":
            return amount * 0.85  # 15% discount
        # Must modify this method to add "corporate", "student", etc.
        return amount

# Problems:
# - Adding new discount types requires modifying existing code
# - Risk of breaking existing discount calculations
# - Violates OCP
```

#### Fixed Example (Python)

```python
# ✅ GOOD: Open for extension, closed for modification
from abc import ABC, abstractmethod

class DiscountStrategy(ABC):
    @abstractmethod
    def calculate(self, amount: float) -> float:
        pass

class RegularDiscount(DiscountStrategy):
    def calculate(self, amount: float) -> float:
        return amount * 0.95  # 5% discount

class PremiumDiscount(DiscountStrategy):
    def calculate(self, amount: float) -> float:
        return amount * 0.90  # 10% discount

class VIPDiscount(DiscountStrategy):
    def calculate(self, amount: float) -> float:
        return amount * 0.85  # 15% discount

# Add new discount types without modifying existing code
class CorporateDiscount(DiscountStrategy):
    def calculate(self, amount: float) -> float:
        return amount * 0.80  # 20% discount

class StudentDiscount(DiscountStrategy):
    def calculate(self, amount: float) -> float:
        return amount * 0.88  # 12% discount

class Order:
    def __init__(self, discount_strategy: DiscountStrategy):
        self.discount_strategy = discount_strategy

    def calculate_total(self, amount: float) -> float:
        return self.discount_strategy.calculate(amount)

# Usage
regular_order = Order(RegularDiscount())
print(regular_order.calculate_total(100))  # 95.0

vip_order = Order(VIPDiscount())
print(vip_order.calculate_total(100))  # 85.0

# Easy to add new strategies
corporate_order = Order(CorporateDiscount())
print(corporate_order.calculate_total(100))  # 80.0

# Benefits:
# ✅ Existing code (Order, RegularDiscount, etc.) never changes
# ✅ Add new discounts by creating new classes
# ✅ No risk of breaking existing discounts
# ✅ Testable in isolation
```

#### Java Example (with Factory Pattern)

```java
// ✅ GOOD: OCP with Factory Pattern

// Abstract base
interface PaymentProcessor {
    void process(double amount);
}

// Existing implementations (closed for modification)
class CreditCardProcessor implements PaymentProcessor {
    @Override
    public void process(double amount) {
        System.out.println("Processing $" + amount + " via credit card");
    }
}

class PayPalProcessor implements PaymentProcessor {
    @Override
    public void process(double amount) {
        System.out.println("Processing $" + amount + " via PayPal");
    }
}

// Add new payment methods without modifying existing code
class CryptoProcessor implements PaymentProcessor {
    @Override
    public void process(double amount) {
        System.out.println("Processing $" + amount + " via cryptocurrency");
    }
}

class BankTransferProcessor implements PaymentProcessor {
    @Override
    public void process(double amount) {
        System.out.println("Processing $" + amount + " via bank transfer");
    }
}

// Factory (also follows OCP)
class PaymentProcessorFactory {
    public PaymentProcessor create(String type) {
        return switch (type) {
            case "credit_card" -> new CreditCardProcessor();
            case "paypal" -> new PayPalProcessor();
            case "crypto" -> new CryptoProcessor();
            case "bank_transfer" -> new BankTransferProcessor();
            default -> throw new IllegalArgumentException("Unknown payment type");
        };
    }
}

// Client code
class PaymentService {
    private final PaymentProcessor processor;

    public PaymentService(PaymentProcessor processor) {
        this.processor = processor;
    }

    public void pay(double amount) {
        processor.process(amount);
    }
}
```

#### TypeScript Example (with Configuration)

```typescript
// ✅ GOOD: OCP with plugin-style architecture

interface Logger {
    log(message: string): void;
}

// Built-in loggers (closed for modification)
class ConsoleLogger implements Logger {
    log(message: string): void {
        console.log(`[Console] ${message}`);
    }
}

class FileLogger implements Logger {
    constructor(private filename: string) {}

    log(message: string): void {
        // Write to file
        console.log(`[File:${this.filename}] ${message}`);
    }
}

// Users can add their own loggers without modifying existing code
class DatabaseLogger implements Logger {
    constructor(private connectionString: string) {}

    log(message: string): void {
        // Write to database
        console.log(`[Database] ${message}`);
    }
}

class CloudLogger implements Logger {
    constructor(private apiKey: string) {}

    log(message: string): void {
        // Send to cloud service
        console.log(`[Cloud] ${message}`);
    }
}

// Application uses any logger without knowing implementation
class Application {
    constructor(private logger: Logger) {}

    run(): void {
        this.logger.log('Application started');
        // Do work...
        this.logger.log('Application finished');
    }
}

// Configuration determines which logger to use
const config = {
    logger: 'database',  // Can be changed without code modification
    databaseConnection: 'postgresql://...'
};

const logger: Logger = (() => {
    switch (config.logger) {
        case 'console': return new ConsoleLogger();
        case 'file': return new FileLogger('app.log');
        case 'database': return new DatabaseLogger(config.databaseConnection);
        case 'cloud': return new CloudLogger('api-key-123');
        default: return new ConsoleLogger();
    }
})();

const app = new Application(logger);
app.run();
```

### Common Violations (OCP)

1. **Switch/If statements on type** - Adding cases when new types are added
2. **Type checking** - Using `instanceof`, `typeof`, or type fields to determine behavior
3. **Modifying existing classes** - Changing class internals to add functionality

### Design Patterns That Support OCP

- **Strategy Pattern** - Encapsulate algorithms
- **Template Method** - Define algorithm skeleton, let subclasses override steps
- **Decorator Pattern** - Add behavior without modifying original class
- **Observer Pattern** - Extend by adding observers
- **Factory Pattern** - Create objects without specifying exact class

---

## 3. Liskov Substitution Principle (LSP)

### Definition and Core Concept (LSP)

> **Objects of a superclass should be replaceable with objects of its subclasses without breaking the application.**

**What it really means:**
- Subclasses must honor the parent's contract
- Clients using the base type should work correctly with any derived type
- Don't strengthen preconditions or weaken postconditions
- Subtypes must preserve invariants

**Contract rules:**
- ✅ Subclass can weaken preconditions (accept more)
- ❌ Subclass cannot strengthen preconditions (accept less)
- ✅ Subclass can strengthen postconditions (guarantee more)
- ❌ Subclass cannot weaken postconditions (guarantee less)

### Multi-Language Examples (LSP)

#### Classic Violation: Square/Rectangle Problem

```python
# ❌ BAD: Square violates LSP when inheriting from Rectangle

class Rectangle:
    def __init__(self, width: int, height: int):
        self._width = width
        self._height = height

    def set_width(self, width: int):
        self._width = width

    def set_height(self, height: int):
        self._height = height

    def area(self) -> int:
        return self._width * self._height

class Square(Rectangle):
    def set_width(self, width: int):
        # ❌ Violates LSP - changes both dimensions unexpectedly
        self._width = width
        self._height = width

    def set_height(self, height: int):
        # ❌ Violates LSP - changes both dimensions unexpectedly
        self._width = height
        self._height = height

# Test that works for Rectangle but fails for Square
def test_rectangle(rect: Rectangle):
    rect.set_width(5)
    rect.set_height(4)
    assert rect.area() == 20, f"Expected 20, got {rect.area()}"

test_rectangle(Rectangle(0, 0))  # ✅ Passes
test_rectangle(Square(0, 0))     # ❌ Fails! (returns 16, not 20)

# Problem: Square cannot be substituted for Rectangle
```

#### Fixed Example (Python)

```python
# ✅ GOOD: Proper abstraction that doesn't violate LSP

from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> int:
        pass

class Rectangle(Shape):
    def __init__(self, width: int, height: int):
        self._width = width
        self._height = height

    def set_width(self, width: int):
        self._width = width

    def set_height(self, height: int):
        self._height = height

    def area(self) -> int:
        return self._width * self._height

class Square(Shape):
    def __init__(self, side: int):
        self._side = side

    def set_side(self, side: int):
        self._side = side

    def area(self) -> int:
        return self._side * self._side

# Now test works for all shapes
def test_shape_area(shape: Shape, expected: int):
    assert shape.area() == expected

test_shape_area(Rectangle(5, 4), 20)  # ✅ Works
test_shape_area(Square(5), 25)        # ✅ Works

# Both are shapes, but they're not substitutable - that's OK!
# LSP applies to substitutable types, not all inheritance
```

#### Real-World Example: Bird Hierarchy (Java)

```java
// ❌ BAD: Penguin violates LSP

class Bird {
    public void fly() {
        System.out.println("Flying in the sky");
    }
}

class Sparrow extends Bird {
    // Inherits fly() - works correctly
}

class Penguin extends Bird {
    @Override
    public void fly() {
        throw new UnsupportedOperationException("Penguins can't fly!");
    }
    // ❌ Violates LSP - breaks client code expecting all Birds to fly
}

// Client code that breaks
void makeBirdFly(Bird bird) {
    bird.fly();  // Works for Sparrow, throws exception for Penguin!
}

// ✅ GOOD: Proper abstraction

interface Bird {
    void eat();
    void layEggs();
}

interface FlyingBird extends Bird {
    void fly();
}

interface SwimmingBird extends Bird {
    void swim();
}

class Sparrow implements FlyingBird {
    @Override
    public void eat() {
        System.out.println("Eating seeds");
    }

    @Override
    public void layEggs() {
        System.out.println("Laying eggs");
    }

    @Override
    public void fly() {
        System.out.println("Flying in the sky");
    }
}

class Penguin implements SwimmingBird {
    @Override
    public void eat() {
        System.out.println("Eating fish");
    }

    @Override
    public void layEggs() {
        System.out.println("Laying eggs");
    }

    @Override
    public void swim() {
        System.out.println("Swimming in water");
    }
}

// Client code is now explicit
void makeFlyingBirdFly(FlyingBird bird) {
    bird.fly();  // Only accepts birds that can fly
}

void makeBirdEat(Bird bird) {
    bird.eat();  // All birds can eat
}
```

### Common Violations (LSP)

1. **Throwing exceptions in overridden methods** - Base doesn't throw, derived does
2. **Strengthening preconditions** - Derived class requires more than base
3. **Weakening postconditions** - Derived class guarantees less than base
4. **Breaking invariants** - Derived class violates base class constraints

### Testing for LSP Compliance

```typescript
// Test that checks LSP compliance

interface Stack<T> {
    push(item: T): void;
    pop(): T;
    isEmpty(): boolean;
}

// Base implementation
class ArrayStack<T> implements Stack<T> {
    private items: T[] = [];

    push(item: T): void {
        this.items.push(item);
    }

    pop(): T {
        if (this.isEmpty()) {
            throw new Error('Stack is empty');
        }
        return this.items.pop()!;
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }
}

// ❌ BAD: Derived class violates LSP
class BoundedStack<T> extends ArrayStack<T> {
    constructor(private maxSize: number) {
        super();
    }

    override push(item: T): void {
        if (this.size() >= this.maxSize) {
            throw new Error('Stack is full');  // ❌ Strengthens precondition!
        }
        super.push(item);
    }

    private size(): number {
        return 0;  // Simplified
    }
}

// Test that verifies LSP
function testStack(stack: Stack<number>) {
    stack.push(1);
    stack.push(2);
    stack.push(3);  // Works for ArrayStack, fails for BoundedStack(2)!
}

testStack(new ArrayStack());     // ✅ Works
testStack(new BoundedStack(2));  // ❌ Throws exception - violates LSP

// ✅ GOOD: Different interface for bounded behavior
interface BoundedStackInterface<T> extends Stack<T> {
    isFull(): boolean;
    getCapacity(): number;
}

class GoodBoundedStack<T> implements BoundedStackInterface<T> {
    private items: T[] = [];

    constructor(private maxSize: number) {}

    push(item: T): void {
        if (this.isFull()) {
            throw new Error('Stack is full');
        }
        this.items.push(item);
    }

    pop(): T {
        if (this.isEmpty()) {
            throw new Error('Stack is empty');
        }
        return this.items.pop()!;
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }

    isFull(): boolean {
        return this.items.length >= this.maxSize;
    }

    getCapacity(): number {
        return this.maxSize;
    }
}

// Now clients can check before pushing
function testBoundedStack(stack: BoundedStackInterface<number>) {
    if (!stack.isFull()) {
        stack.push(1);
    }
    if (!stack.isFull()) {
        stack.push(2);
    }
    if (!stack.isFull()) {
        stack.push(3);
    }
}
```

---

## 4. Interface Segregation Principle (ISP)

### Definition and Core Concept (ISP)

> **No client should be forced to depend on methods it does not use.**

**What it really means:**
- Many small, specific interfaces > one large, general interface
- Clients should only know about methods they actually use
- Prevents "fat interfaces" with unrelated methods
- Promotes focused, cohesive interfaces

**Signs of ISP violation:**
- Implementing interface methods with empty bodies or exceptions
- Clients that only use a small subset of an interface
- Interfaces with many unrelated methods

### Multi-Language Examples (ISP)

#### Violation Example (Go)

```go
// ❌ BAD: Fat interface forces implementations to have unused methods

type Worker interface {
    Work()
    Eat()
    Sleep()
    TakeSalary()
}

type Human struct {
    name string
}

func (h *Human) Work() {
    fmt.Println("Human working")
}

func (h *Human) Eat() {
    fmt.Println("Human eating")
}

func (h *Human) Sleep() {
    fmt.Println("Human sleeping")
}

func (h *Human) TakeSalary() {
    fmt.Println("Human taking salary")
}

type Robot struct {
    model string
}

func (r *Robot) Work() {
    fmt.Println("Robot working")
}

// ❌ Forced to implement methods Robot doesn't need
func (r *Robot) Eat() {
    // Robots don't eat - empty implementation
}

func (r *Robot) Sleep() {
    // Robots don't sleep - empty implementation
}

func (r *Robot) TakeSalary() {
    // Robots don't get paid - empty implementation
}

// Problems:
// - Robot forced to implement Eat, Sleep, TakeSalary
// - Violates ISP - clients depend on methods they don't use
// - Confusing API - what does Robot.Eat() mean?
```

#### Fixed Example (Go)

```go
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

type Salaried interface {
    TakeSalary()
}

// Robot only implements what it needs
type Robot struct {
    model string
}

func (r *Robot) Work() {
    fmt.Println("Robot working")
}

// Robot only implements Workable - clean and focused

// Human implements everything
type Human struct {
    name string
}

func (h *Human) Work() {
    fmt.Println("Human working")
}

func (h *Human) Eat() {
    fmt.Println("Human eating")
}

func (h *Human) Sleep() {
    fmt.Println("Human sleeping")
}

func (h *Human) TakeSalary() {
    fmt.Println("Human taking salary")
}

// Functions accept specific interfaces they need
func ManageWorkers(workers []Workable) {
    for _, w := range workers {
        w.Work()  // Only uses Work() - doesn't care about Eat/Sleep
    }
}

func FeedEmployees(employees []Eatable) {
    for _, e := range employees {
        e.Eat()  // Only uses Eat()
    }
}

// Usage
func main() {
    robot := &Robot{model: "R2D2"}
    human := &Human{name: "Alice"}

    // Both can work
    ManageWorkers([]Workable{robot, human})

    // Only humans eat
    FeedEmployees([]Eatable{human})
}
```

#### Real-World Example: Document Processing (Rust)

```rust
// ❌ BAD: Fat interface

trait Document {
    fn open(&self);
    fn print(&self);
    fn fax(&self);
    fn scan(&self);
}

struct TextDocument;

impl Document for TextDocument {
    fn open(&self) {
        println!("Opening text document");
    }

    fn print(&self) {
        println!("Printing text document");
    }

    // ❌ Text documents can't be faxed or scanned directly
    fn fax(&self) {
        panic!("Cannot fax text document");
    }

    fn scan(&self) {
        panic!("Cannot scan text document");
    }
}

// ✅ GOOD: Segregated interfaces

trait Openable {
    fn open(&self);
}

trait Printable {
    fn print(&self);
}

trait Faxable {
    fn fax(&self);
}

trait Scannable {
    fn scan(&self);
}

struct TextDocument;

// Only implement relevant interfaces
impl Openable for TextDocument {
    fn open(&self) {
        println!("Opening text document");
    }
}

impl Printable for TextDocument {
    fn print(&self) {
        println!("Printing text document");
    }
}
// TextDocument doesn't implement Faxable or Scannable

struct ScannedPDF {
    path: String,
}

impl Openable for ScannedPDF {
    fn open(&self) {
        println!("Opening PDF: {}", self.path);
    }
}

impl Printable for ScannedPDF {
    fn print(&self) {
        println!("Printing PDF: {}", self.path);
    }
}

impl Faxable for ScannedPDF {
    fn fax(&self) {
        println!("Faxing PDF: {}", self.path);
    }
}

// Functions accept only what they need
fn print_document<T: Printable>(doc: &T) {
    doc.print();
}

fn fax_document<T: Faxable>(doc: &T) {
    doc.fax();
}
```

### Common Violations (ISP)

1. **Empty method implementations** - Implementing interface with no-ops
2. **Throwing UnsupportedOperationException** - Implementing but refusing to work
3. **God interfaces** - Interfaces with many unrelated methods
4. **One-size-fits-all** - Single interface for many different use cases

### When to Segregate Interfaces

✅ **Segregate when:**
- Different clients need different method subsets
- Implementations leave methods empty
- Interface has multiple cohesive groups of methods

❌ **Don't over-segregate:**
- Don't create one interface per method (unless truly needed)
- Balance with simplicity
- Consider if methods are truly unrelated

---

## 5. Dependency Inversion Principle (DIP)

### Definition and Core Concept (DIP)

> **High-level modules should not depend on low-level modules. Both should depend on abstractions.**
> **Abstractions should not depend on details. Details should depend on abstractions.**

**What it really means:**
- Depend on interfaces/abstractions, not concrete implementations
- High-level policy should not depend on low-level details
- Invert the direction of dependencies
- Enables testability, flexibility, and modularity

**Dependency flow:**
- ❌ Without DIP: High-level → Low-level (tight coupling)
- ✅ With DIP: High-level → Abstraction ← Low-level (both depend on abstraction)

### Multi-Language Examples (DIP)

#### Violation Example (Python)

```python
# ❌ BAD: High-level UserService depends on low-level MySQLDatabase

class MySQLDatabase:
    def __init__(self, connection_string: str):
        self.connection_string = connection_string

    def save_user(self, name: str, email: str):
        print(f"Saving to MySQL: {name}, {email}")
        # MySQL-specific logic

class UserService:
    def __init__(self):
        # ❌ Direct dependency on concrete MySQL implementation
        self.database = MySQLDatabase("mysql://localhost/mydb")

    def register_user(self, name: str, email: str):
        # Business logic
        print(f"Registering user: {name}")
        # ❌ Tightly coupled to MySQL
        self.database.save_user(name, email)

# Problems:
# - Cannot test UserService without MySQL
# - Cannot switch to PostgreSQL without modifying UserService
# - High-level business logic depends on low-level database details
# - Violates DIP
```

#### Fixed Example (Python)

```python
# ✅ GOOD: Both depend on abstraction

from abc import ABC, abstractmethod
from typing import Protocol

# Abstraction (can use ABC or Protocol)
class UserRepository(Protocol):
    def save(self, name: str, email: str) -> None:
        ...

# Low-level implementations depend on abstraction
class MySQLUserRepository:
    def __init__(self, connection_string: str):
        self.connection_string = connection_string

    def save(self, name: str, email: str) -> None:
        print(f"Saving to MySQL: {name}, {email}")
        # MySQL-specific logic

class PostgreSQLUserRepository:
    def __init__(self, connection_string: str):
        self.connection_string = connection_string

    def save(self, name: str, email: str) -> None:
        print(f"Saving to PostgreSQL: {name}, {email}")
        # PostgreSQL-specific logic

# High-level module depends on abstraction
class UserService:
    def __init__(self, repository: UserRepository):
        # ✅ Depends on abstraction, not concrete implementation
        self.repository = repository

    def register_user(self, name: str, email: str):
        # Business logic
        print(f"Registering user: {name}")
        # ✅ Works with any UserRepository implementation
        self.repository.save(name, email)

# Dependency injection (composition root)
mysql_repo = MySQLUserRepository("mysql://localhost/mydb")
service = UserService(mysql_repo)
service.register_user("Alice", "alice@example.com")

# Easy to switch implementations
postgres_repo = PostgreSQLUserRepository("postgresql://localhost/mydb")
service = UserService(postgres_repo)
service.register_user("Bob", "bob@example.com")

# Easy to test with mocks
class MockUserRepository:
    def __init__(self):
        self.saved_users = []

    def save(self, name: str, email: str) -> None:
        self.saved_users.append((name, email))

mock_repo = MockUserRepository()
service = UserService(mock_repo)
service.register_user("Charlie", "charlie@example.com")
assert len(mock_repo.saved_users) == 1

# Benefits:
# ✅ UserService testable in isolation
# ✅ Easy to switch database implementations
# ✅ High-level business logic independent of low-level details
# ✅ Follows DIP
```

#### Java Example with Spring Framework

```java
// ✅ GOOD: DIP with Spring Dependency Injection

// Abstraction (interface)
public interface EmailService {
    void send(String to, String subject, String body);
}

// Low-level implementations
@Service("smtpEmail")
public class SMTPEmailService implements EmailService {
    @Override
    public void send(String to, String subject, String body) {
        System.out.println("Sending via SMTP: " + to);
        // SMTP logic
    }
}

@Service("sendgridEmail")
public class SendGridEmailService implements EmailService {
    @Override
    public void send(String to, String subject, String body) {
        System.out.println("Sending via SendGrid: " + to);
        // SendGrid API logic
    }
}

// High-level module depends on abstraction
@Service
public class NotificationService {
    private final EmailService emailService;

    // ✅ Dependency injection via constructor
    @Autowired
    public NotificationService(@Qualifier("smtpEmail") EmailService emailService) {
        this.emailService = emailService;
    }

    public void notifyUser(String email, String message) {
        // Business logic
        emailService.send(email, "Notification", message);
    }
}

// Configuration determines which implementation
@Configuration
public class AppConfig {
    @Bean
    public EmailService emailService() {
        // Can switch based on environment, config, etc.
        boolean useSendGrid = System.getenv("USE_SENDGRID") != null;
        return useSendGrid ? new SendGridEmailService() : new SMTPEmailService();
    }
}
```

#### TypeScript Example with Constructor Injection

```typescript
// ✅ GOOD: DIP in TypeScript

// Abstraction
interface PaymentGateway {
    charge(amount: number, token: string): Promise<string>;
}

// Low-level implementations
class StripeGateway implements PaymentGateway {
    async charge(amount: number, token: string): Promise<string> {
        console.log(`Charging $${amount} via Stripe`);
        // Stripe API call
        return "stripe_charge_id_123";
    }
}

class PayPalGateway implements PaymentGateway {
    async charge(amount: number, token: string): Promise<string> {
        console.log(`Charging $${amount} via PayPal`);
        // PayPal API call
        return "paypal_transaction_456";
    }
}

// High-level module
class OrderService {
    constructor(private paymentGateway: PaymentGateway) {}

    async checkout(items: any[], paymentToken: string): Promise<void> {
        // Business logic
        const total = items.reduce((sum, item) => sum + item.price, 0);

        // ✅ Depends on abstraction
        const chargeId = await this.paymentGateway.charge(total, paymentToken);
        console.log(`Order completed with charge ID: ${chargeId}`);
    }
}

// Dependency injection
const stripeGateway = new StripeGateway();
const orderService = new OrderService(stripeGateway);

await orderService.checkout(
    [{ name: "Product 1", price: 50 }],
    "tok_visa"
);

// Easy to test
class MockPaymentGateway implements PaymentGateway {
    async charge(amount: number, token: string): Promise<string> {
        return "mock_charge_id";
    }
}

const mockGateway = new MockPaymentGateway();
const testOrderService = new OrderService(mockGateway);
```

### Common Violations (DIP)

1. **Direct instantiation** - Creating concrete dependencies with `new`
2. **Static method calls** - Depending on static utility methods
3. **Global state** - Accessing singletons or global variables
4. **Concrete types in signatures** - Method parameters are concrete classes

### DIP Enables Clean Architecture

DIP is the key principle that enables Clean Architecture:

```
┌─────────────────────────────────────────┐
│         High-Level Policy (Domain)       │
│         ↓ depends on ↓                   │
│         Abstraction (Interface)          │
│         ↑ implements ↑                   │
│    Low-Level Details (Infrastructure)    │
└─────────────────────────────────────────┘
```

**Without DIP:**
- Domain depends on database, web framework, external APIs
- Cannot test domain in isolation
- Cannot swap infrastructure

**With DIP:**
- Domain defines interfaces it needs
- Infrastructure implements those interfaces
- Domain is independent and testable

See: [Architecture Patterns Guide](../../3-design/architecture-pattern/deep-dive-clean-architecture.md) for full examples.

---

## How SOLID Principles Work Together

SOLID principles are not isolated - they reinforce each other:

### Example: E-Commerce Order Processing

```python
# All SOLID principles in action

from abc import ABC, abstractmethod
from typing import List, Protocol
from dataclasses import dataclass

# Domain Model (SRP - just data and domain logic)
@dataclass
class Order:
    id: str
    items: List['OrderItem']
    customer_id: str

    def total(self) -> float:
        return sum(item.price * item.quantity for item in self.items)

@dataclass
class OrderItem:
    product_id: str
    quantity: int
    price: float

# SRP: Each service has one responsibility
# DIP: Services depend on abstractions (Protocol)

class OrderRepository(Protocol):
    """Abstraction for order persistence (DIP)"""
    def save(self, order: Order) -> None: ...
    def find_by_id(self, order_id: str) -> Order: ...

class PaymentGateway(Protocol):
    """Abstraction for payment processing (DIP)"""
    def charge(self, amount: float, customer_id: str) -> str: ...

class NotificationService(Protocol):
    """Abstraction for notifications (DIP)"""
    def send(self, customer_id: str, message: str) -> None: ...

# OCP: Can add new discount strategies without modifying existing code
class DiscountStrategy(ABC):
    @abstractmethod
    def calculate_discount(self, order: Order) -> float:
        pass

class NoDiscount(DiscountStrategy):
    def calculate_discount(self, order: Order) -> float:
        return 0

class PercentageDiscount(DiscountStrategy):
    def __init__(self, percentage: float):
        self.percentage = percentage

    def calculate_discount(self, order: Order) -> float:
        return order.total() * (self.percentage / 100)

# ISP: Specific interfaces for different needs
class EmailNotificationService:
    """Implements only NotificationService (ISP)"""
    def send(self, customer_id: str, message: str) -> None:
        print(f"Sending email to customer {customer_id}: {message}")

class SMSNotificationService:
    """Implements only NotificationService (ISP)"""
    def send(self, customer_id: str, message: str) -> None:
        print(f"Sending SMS to customer {customer_id}: {message}")

# High-level business logic (SRP, DIP)
class OrderService:
    """
    SRP: Handles order processing only
    DIP: Depends on abstractions
    OCP: Can extend with new discount strategies
    """
    def __init__(
        self,
        repository: OrderRepository,
        payment: PaymentGateway,
        notification: NotificationService,
        discount: DiscountStrategy
    ):
        self.repository = repository
        self.payment = payment
        self.notification = notification
        self.discount = discount

    def process_order(self, order: Order) -> None:
        # Apply discount (OCP - strategy pattern)
        discount_amount = self.discount.calculate_discount(order)
        final_amount = order.total() - discount_amount

        # Process payment (DIP - depends on abstraction)
        charge_id = self.payment.charge(final_amount, order.customer_id)

        # Save order (DIP - depends on abstraction)
        self.repository.save(order)

        # Notify customer (DIP, ISP - small interface)
        self.notification.send(
            order.customer_id,
            f"Order {order.id} processed. Charge ID: {charge_id}"
        )

# LSP: Concrete implementations honor contracts
class PostgresOrderRepository:
    """LSP: Can substitute for OrderRepository"""
    def save(self, order: Order) -> None:
        print(f"Saving order {order.id} to PostgreSQL")

    def find_by_id(self, order_id: str) -> Order:
        print(f"Finding order {order_id} in PostgreSQL")
        return Order(order_id, [], "customer_123")

class StripePaymentGateway:
    """LSP: Can substitute for PaymentGateway"""
    def charge(self, amount: float, customer_id: str) -> str:
        print(f"Charging ${amount} to customer {customer_id} via Stripe")
        return "stripe_charge_123"

# Usage
order = Order(
    id="order_001",
    items=[
        OrderItem("product_1", 2, 25.0),
        OrderItem("product_2", 1, 50.0)
    ],
    customer_id="customer_123"
)

# Dependency injection (DIP)
service = OrderService(
    repository=PostgresOrderRepository(),
    payment=StripePaymentGateway(),
    notification=EmailNotificationService(),
    discount=PercentageDiscount(10)
)

service.process_order(order)

# Benefits:
# ✅ SRP: Each class has one responsibility
# ✅ OCP: Can add new discounts without modifying OrderService
# ✅ LSP: All implementations are substitutable
# ✅ ISP: Small, focused interfaces
# ✅ DIP: Business logic independent of infrastructure
# ✅ Easy to test (inject mocks)
# ✅ Easy to extend (add new implementations)
```

---

## SOLID and Architecture Patterns

SOLID principles enable modern architecture patterns:

| Architecture | SOLID Principles Used | How |
|--------------|----------------------|-----|
| **Clean Architecture** | DIP, SRP, OCP | Domain layer depends on abstractions; infrastructure implements them |
| **Hexagonal Architecture** | DIP, ISP, SRP | Ports (interfaces) define boundaries; adapters implement them |
| **Microservices** | SRP, OCP, ISP | Each service has single responsibility; services communicate via contracts |
| **Event-Driven** | OCP, DIP, ISP | Extend by adding event handlers; depend on event abstractions |
| **CQRS** | SRP, ISP | Separate read/write responsibilities; different interfaces |

**See:** [Architecture Patterns Guide](../../3-design/architecture-pattern/overview.md) for detailed examples.

---

## Common Mistakes

### 1. Over-Application
- Creating interfaces for everything
- Premature abstraction
- Over-engineering simple code

**Fix:** Apply pragmatically based on actual needs

### 2. Misunderstanding LSP
- Thinking all subclasses must be substitutable
- Forcing inheritance where composition fits better

**Fix:** Use composition over inheritance; only inherit when true substitutability exists

### 3. Confusing DIP with DI
- Dependency Inversion (principle) ≠ Dependency Injection (technique)
- DIP is about direction of dependencies
- DI is one way to achieve DIP

### 4. Ignoring Context
- Applying SOLID to trivial code
- Using SOLID in performance-critical sections

**Fix:** Balance principles with pragmatism

---

## Best Practices

### 1. Start Simple
- Don't apply all SOLID principles immediately
- Refactor toward SOLID as complexity grows
- Let pain points guide you

### 2. Focus on SRP and DIP First
- **SRP** → Makes code understandable
- **DIP** → Makes code testable
- Other principles follow naturally

### 3. Use Code Reviews
- Check for SOLID violations during reviews
- Ask: "Does this class have one responsibility?"
- Ask: "Are we depending on abstractions?"

### 4. Write Tests
- SOLID principles make code testable
- If testing is hard, SOLID violations likely exist
- Let test difficulty guide refactoring

### 5. Know When to Break Rules
- Performance requirements may justify violations
- Simple code may not need full SOLID
- Pragmatism > dogmatism

---

## References and Resources

### Books

1. **"Clean Architecture"** by Robert C. Martin
   - Comprehensive SOLID coverage
   - How principles enable architecture
   - https://www.amazon.com/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164

2. **"Agile Software Development, Principles, Patterns, and Practices"** by Robert C. Martin
   - Original SOLID principles publication
   - Detailed explanations and examples
   - https://www.amazon.com/Software-Development-Principles-Patterns-Practices/dp/0135974445

3. **"Design Patterns"** by Gang of Four
   - Design patterns that support SOLID
   - Foundation for OOP principles
   - https://www.amazon.com/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612

### Online Resources

1. **SOLID Principles Overview:**
   - https://www.digitalocean.com/community/conceptual_articles/s-o-l-i-d-the-first-five-principles-of-object-oriented-design
   - https://stackify.com/solid-design-principles/

2. **Individual Principles:**
   - SRP: https://blog.cleancoder.com/uncle-bob/2014/05/08/SingleReponsibilityPrinciple.html
   - OCP: https://blog.cleancoder.com/uncle-bob/2014/05/12/TheOpenClosedPrinciple.html
   - LSP: https://blog.cleancoder.com/uncle-bob/2020/10/18/Solid-Relevance.html
   - ISP: https://www.baeldung.com/java-interface-segregation
   - DIP: https://martinfowler.com/articles/dipInTheWild.html

3. **Videos:**
   - Uncle Bob SOLID Principles: https://www.youtube.com/watch?v=zHiWqnTWsn4
   - SOLID Principles Explained: https://www.youtube.com/watch?v=XzdhzyAukMM

### Related Guides

- **[Design Principles Overview](overview.md)** - All core principles
- **[DRY Principle Deep Dive](dry-principle.md)** - Don't Repeat Yourself
- **[Separation of Concerns Deep Dive](separation-of-concerns.md)** - Module boundaries
- **[Architecture Patterns Guide](../../3-design/architecture-pattern/overview.md)** - How principles enable patterns

---

*Last Updated: 2025-10-20*
