# Creational Design Patterns

**Purpose:** Object creation mechanisms that increase flexibility and reuse
**Focus:** Decouple object creation from usage
**Organization:** PHD Systems & PHD Labs
**Version:** 1.0
**Date:** 2025-10-20

---

## TL;DR

**Creational patterns control how objects are created**. **Goal**: Make systems independent of how objects are created, composed, and represented. **Five GoF patterns**: Factory Method (flexible creation), Abstract Factory (product families), Builder (step-by-step construction), Singleton (single instance), Prototype (cloning). **Modern essential**: Dependency Injection (external dependency provision). **When to use**: Complex creation logic, need to hide creation details, want flexibility to swap implementations, testing requires mocks. **Golden rule**: Start with simplest creation (new/constructor) → Add Factory when variations needed → Add Builder for complex objects → Use DI for dependencies. **Avoid**: Singleton (use DI instead), premature abstraction, over-engineering simple creation.

---

## Table of Contents

- [Overview](#overview)
- [Factory Patterns](#factory-patterns)
  - [Simple Factory (Not GoF)](#simple-factory-not-gof)
  - [Factory Method](#factory-method)
  - [Abstract Factory](#abstract-factory)
- [Builder Pattern](#builder-pattern)
- [Singleton Pattern](#singleton-pattern)
- [Prototype Pattern](#prototype-pattern)
- [Dependency Injection (Modern)](#dependency-injection-modern)
- [Pattern Comparison](#pattern-comparison)
- [Common Mistakes](#common-mistakes)
- [References](#references)

---

## Overview

**Creational design patterns** abstract the instantiation process. They help make a system independent of how its objects are created, composed, and represented.

### Why Creational Patterns?

**Problems they solve:**
1. **Hard-coded dependencies** - `new ConcreteClass()` creates tight coupling
2. **Complex object construction** - Objects need many steps to create
3. **Need for variations** - Different object configurations
4. **Testing difficulties** - Can't mock concrete classes
5. **Scattered creation logic** - Object creation duplicated everywhere

**Benefits:**
- ✅ Flexibility - Easy to change object creation
- ✅ Testability - Mock and stub objects easily
- ✅ Maintainability - Centralized creation logic
- ✅ Extensibility - Add new types without changing existing code
- ✅ Encapsulation - Hide creation complexity

### When to Use Creational Patterns

| Scenario | Pattern |
|----------|---------|
| Need different creation strategies | Factory Method |
| Create families of related objects | Abstract Factory |
| Construct complex objects step-by-step | Builder |
| Manage dependencies externally | Dependency Injection |
| Need exactly one instance | Singleton (use sparingly!) |
| Clone existing objects efficiently | Prototype |

---

## Factory Patterns

Factory patterns provide interface for creating objects while hiding the actual creation logic.

### Simple Factory (Not GoF)

**Not an official Gang of Four pattern**, but extremely common and useful.

#### Problem

Direct object creation with `new` creates tight coupling:

```python
# Client code tightly coupled to concrete classes
if payment_type == "credit":
    processor = CreditCardProcessor()
elif payment_type == "paypal":
    processor = PayPalProcessor()
elif payment_type == "crypto":
    processor = CryptoProcessor()
```

#### Solution

Encapsulate creation logic in a factory class:

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ uses
       ▼
┌─────────────────┐
│     Factory     │
│ + create(type)  │
└──────┬──────────┘
       │ creates
       ▼
┌─────────────────┐
│    Product      │ (interface)
└─────────────────┘
       △
       │ implements
       │
  ┌────┴────┬────────┐
  │         │        │
ConcreteA ConcreteB ConcreteC
```

#### Implementation

**Python Example:**

```python
from abc import ABC, abstractmethod
from typing import Dict

# Product interface
class PaymentProcessor(ABC):
    @abstractmethod
    def process(self, amount: float) -> dict:
        pass

# Concrete products
class CreditCardProcessor(PaymentProcessor):
    def process(self, amount: float) -> dict:
        return {"method": "credit_card", "amount": amount, "status": "success"}

class PayPalProcessor(PaymentProcessor):
    def process(self, amount: float) -> dict:
        return {"method": "paypal", "amount": amount, "status": "success"}

class CryptoProcessor(PaymentProcessor):
    def process(self, amount: float) -> dict:
        return {"method": "crypto", "amount": amount, "status": "success"}

# Simple Factory
class PaymentProcessorFactory:
    _processors: Dict[str, type] = {
        "credit": CreditCardProcessor,
        "paypal": PayPalProcessor,
        "crypto": CryptoProcessor,
    }

    @classmethod
    def create(cls, payment_type: str) -> PaymentProcessor:
        processor_class = cls._processors.get(payment_type)
        if processor_class is None:
            raise ValueError(f"Unknown payment type: {payment_type}")
        return processor_class()

# Client code - decoupled from concrete classes
processor = PaymentProcessorFactory.create("credit")
result = processor.process(100.0)
```

**Java Example:**

```java
// Product interface
public interface Database {
    void connect();
    void query(String sql);
}

// Concrete products
public class PostgresDatabase implements Database {
    @Override
    public void connect() {
        System.out.println("Connecting to PostgreSQL");
    }

    @Override
    public void query(String sql) {
        System.out.println("Executing PostgreSQL query: " + sql);
    }
}

public class MySQLDatabase implements Database {
    @Override
    public void connect() {
        System.out.println("Connecting to MySQL");
    }

    @Override
    public void query(String sql) {
        System.out.println("Executing MySQL query: " + sql);
    }
}

// Simple Factory
public class DatabaseFactory {
    public static Database create(String type) {
        return switch (type.toLowerCase()) {
            case "postgres" -> new PostgresDatabase();
            case "mysql" -> new MySQLDatabase();
            default -> throw new IllegalArgumentException("Unknown database type: " + type);
        };
    }
}

// Client code
Database db = DatabaseFactory.create("postgres");
db.connect();
db.query("SELECT * FROM users");
```

**TypeScript Example:**

```typescript
// Product interface
interface Logger {
  log(message: string): void;
  error(message: string): void;
}

// Concrete products
class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }

  error(message: string): void {
    console.error(`[ERROR] ${message}`);
  }
}

class FileLogger implements Logger {
  constructor(private filename: string) {}

  log(message: string): void {
    // Write to file
    console.log(`Writing to ${this.filename}: [LOG] ${message}`);
  }

  error(message: string): void {
    console.log(`Writing to ${this.filename}: [ERROR] ${message}`);
  }
}

class CloudLogger implements Logger {
  log(message: string): void {
    console.log(`Sending to cloud: [LOG] ${message}`);
  }

  error(message: string): void {
    console.log(`Sending to cloud: [ERROR] ${message}`);
  }
}

// Simple Factory
class LoggerFactory {
  static create(type: string): Logger {
    switch (type) {
      case 'console':
        return new ConsoleLogger();
      case 'file':
        return new FileLogger('app.log');
      case 'cloud':
        return new CloudLogger();
      default:
        throw new Error(`Unknown logger type: ${type}`);
    }
  }
}

// Client code
const logger = LoggerFactory.create(process.env.LOGGER_TYPE || 'console');
logger.log('Application started');
```

#### When to Use

✅ **Use Simple Factory when:**
- Need to encapsulate object creation
- Creation logic is simple (no complex hierarchies)
- Want to centralize creation in one place
- Don't need extensibility via subclassing

❌ **Don't use when:**
- Need to extend via subclassing (use Factory Method)
- Have families of related products (use Abstract Factory)
- Factory becomes too complex (consider Strategy or Command)

---

### Factory Method

**Official Gang of Four pattern**. Define an interface for creating objects, but let subclasses decide which class to instantiate.

#### Problem

Framework needs to create objects but doesn't know exact types:

```python
# Framework code can't know all document types
class Application:
    def create_document(self):
        doc = Document()  # What type?
        return doc
```

#### Solution

Define creation method in base class, override in subclasses:

```
┌──────────────────┐
│    Creator       │ (abstract)
│ + factoryMethod()│ ◄─── Defines interface for creation
│ + operation()    │
└──────┬───────────┘
       │ creates
       ▼
┌──────────────────┐
│    Product       │ (interface)
└──────────────────┘
       △
       │
  ┌────┴────┐
  │         │
ProductA  ProductB

       △
       │ subclasses override
       │
┌──────┴───────────┐
│  ConcreteCreatorA│
│ + factoryMethod()│ ──► returns ProductA
└──────────────────┘

┌──────────────────┐
│  ConcreteCreatorB│
│ + factoryMethod()│ ──► returns ProductB
└──────────────────┘
```

#### Implementation

**Python Example:**

```python
from abc import ABC, abstractmethod

# Product interface
class Document(ABC):
    @abstractmethod
    def save(self) -> None:
        pass

    @abstractmethod
    def open(self) -> None:
        pass

# Concrete products
class PDFDocument(Document):
    def save(self) -> None:
        print("Saving PDF document")

    def open(self) -> None:
        print("Opening PDF document")

class WordDocument(Document):
    def save(self) -> None:
        print("Saving Word document")

    def open(self) -> None:
        print("Opening Word document")

# Creator (abstract)
class Application(ABC):
    @abstractmethod
    def create_document(self) -> Document:
        """Factory method - subclasses override this"""
        pass

    def new_document(self) -> Document:
        """Template method using factory method"""
        doc = self.create_document()
        doc.open()
        return doc

# Concrete creators
class PDFApplication(Application):
    def create_document(self) -> Document:
        return PDFDocument()

class WordApplication(Application):
    def create_document(self) -> Document:
        return WordDocument()

# Client code
def open_app(app_type: str) -> Application:
    if app_type == "pdf":
        return PDFApplication()
    elif app_type == "word":
        return WordApplication()
    else:
        raise ValueError(f"Unknown app type: {app_type}")

# Usage
app = open_app("pdf")
doc = app.new_document()  # Creates and opens PDF document
```

**Java Example:**

```java
// Product interface
public interface Vehicle {
    void drive();
    void refuel();
}

// Concrete products
public class Car implements Vehicle {
    @Override
    public void drive() {
        System.out.println("Driving car on road");
    }

    @Override
    public void refuel() {
        System.out.println("Refueling with gasoline");
    }
}

public class Boat implements Vehicle {
    @Override
    public void drive() {
        System.out.println("Sailing boat on water");
    }

    @Override
    public void refuel() {
        System.out.println("Refueling with diesel");
    }
}

// Creator (abstract)
public abstract class VehicleFactory {
    // Factory method
    protected abstract Vehicle createVehicle();

    // Template method using factory method
    public Vehicle orderVehicle() {
        Vehicle vehicle = createVehicle();
        System.out.println("Preparing vehicle for delivery");
        vehicle.refuel();
        return vehicle;
    }
}

// Concrete creators
public class CarFactory extends VehicleFactory {
    @Override
    protected Vehicle createVehicle() {
        return new Car();
    }
}

public class BoatFactory extends VehicleFactory {
    @Override
    protected Vehicle createVehicle() {
        return new Boat();
    }
}

// Client code
public class Client {
    public static void main(String[] args) {
        VehicleFactory factory = new CarFactory();
        Vehicle vehicle = factory.orderVehicle();
        vehicle.drive();
    }
}
```

**Go Example:**

```go
package main

import "fmt"

// Product interface
type Notification interface {
    Send(message string) error
}

// Concrete products
type EmailNotification struct{}

func (e *EmailNotification) Send(message string) error {
    fmt.Printf("Sending email: %s\n", message)
    return nil
}

type SMSNotification struct{}

func (s *SMSNotification) Send(message string) error {
    fmt.Printf("Sending SMS: %s\n", message)
    return nil
}

type PushNotification struct{}

func (p *PushNotification) Send(message string) error {
    fmt.Printf("Sending push notification: %s\n", message)
    return nil
}

// Creator interface
type NotificationService interface {
    CreateNotification() Notification
    Notify(message string) error
}

// Base creator implementation
type BaseNotificationService struct {
    NotificationService
}

func (b *BaseNotificationService) Notify(message string) error {
    notification := b.CreateNotification()
    return notification.Send(message)
}

// Concrete creators
type EmailService struct {
    BaseNotificationService
}

func (e *EmailService) CreateNotification() Notification {
    return &EmailNotification{}
}

type SMSService struct {
    BaseNotificationService
}

func (s *SMSService) CreateNotification() Notification {
    return &SMSNotification{}
}

// Usage
func main() {
    var service NotificationService

    service = &EmailService{}
    service.Notify("Hello via Email")

    service = &SMSService{}
    service.Notify("Hello via SMS")
}
```

#### When to Use

✅ **Use Factory Method when:**
- Class can't anticipate the type of objects to create
- Want subclasses to specify objects to create
- Need to delegate responsibility to helper subclasses
- Have complex creation logic that varies

❌ **Don't use when:**
- Simple object creation (use constructor or Simple Factory)
- Don't need subclassing extensibility
- Creation logic doesn't vary

---

### Abstract Factory

**Gang of Four pattern**. Provide interface for creating families of related or dependent objects without specifying their concrete classes.

#### Problem

Need to create multiple related objects that must work together:

```python
# Products must be compatible
button = WindowsButton()  # Windows style
checkbox = MacCheckbox()   # Mac style - incompatible!
```

#### Solution

Factory creates entire families of related objects:

```
┌──────────────────┐
│  AbstractFactory │
│ + createProductA()│
│ + createProductB()│
└──────┬───────────┘
       △
       │
  ┌────┴─────┐
  │          │
Factory1  Factory2
  │          │
  ├──► ProductA1   ProductA2 ◄──┤
  └──► ProductB1   ProductB2 ◄──┘
       (compatible family)
```

#### Implementation

**Python Example:**

```python
from abc import ABC, abstractmethod

# Abstract products
class Button(ABC):
    @abstractmethod
    def render(self) -> str:
        pass

class Checkbox(ABC):
    @abstractmethod
    def render(self) -> str:
        pass

# Concrete products - Windows family
class WindowsButton(Button):
    def render(self) -> str:
        return "[Windows Button]"

class WindowsCheckbox(Checkbox):
    def render(self) -> str:
        return "[Windows Checkbox]"

# Concrete products - Mac family
class MacButton(Button):
    def render(self) -> str:
        return "[Mac Button]"

class MacCheckbox(Checkbox):
    def render(self) -> str:
        return "[Mac Checkbox]"

# Abstract factory
class GUIFactory(ABC):
    @abstractmethod
    def create_button(self) -> Button:
        pass

    @abstractmethod
    def create_checkbox(self) -> Checkbox:
        pass

# Concrete factories
class WindowsFactory(GUIFactory):
    def create_button(self) -> Button:
        return WindowsButton()

    def create_checkbox(self) -> Checkbox:
        return WindowsCheckbox()

class MacFactory(GUIFactory):
    def create_button(self) -> Button:
        return MacButton()

    def create_checkbox(self) -> Checkbox:
        return MacCheckbox()

# Client code
class Application:
    def __init__(self, factory: GUIFactory):
        self.factory = factory

    def create_ui(self) -> str:
        button = self.factory.create_button()
        checkbox = self.factory.create_checkbox()
        return f"UI: {button.render()} {checkbox.render()}"

# Usage - entire family is consistent
import platform

if platform.system() == "Windows":
    factory = WindowsFactory()
else:
    factory = MacFactory()

app = Application(factory)
print(app.create_ui())
```

**Java Example:**

```java
// Abstract products
public interface Database {
    void connect();
}

public interface Cache {
    void set(String key, String value);
    String get(String key);
}

// Concrete products - AWS family
public class AWSDatabase implements Database {
    @Override
    public void connect() {
        System.out.println("Connecting to AWS RDS");
    }
}

public class AWSCache implements Cache {
    @Override
    public void set(String key, String value) {
        System.out.println("Setting in AWS ElastiCache: " + key);
    }

    @Override
    public String get(String key) {
        System.out.println("Getting from AWS ElastiCache: " + key);
        return "value";
    }
}

// Concrete products - Azure family
public class AzureDatabase implements Database {
    @Override
    public void connect() {
        System.out.println("Connecting to Azure SQL");
    }
}

public class AzureCache implements Cache {
    @Override
    public void set(String key, String value) {
        System.out.println("Setting in Azure Redis: " + key);
    }

    @Override
    public String get(String key) {
        System.out.println("Getting from Azure Redis: " + key);
        return "value";
    }
}

// Abstract factory
public interface CloudFactory {
    Database createDatabase();
    Cache createCache();
}

// Concrete factories
public class AWSFactory implements CloudFactory {
    @Override
    public Database createDatabase() {
        return new AWSDatabase();
    }

    @Override
    public Cache createCache() {
        return new AWSCache();
    }
}

public class AzureFactory implements CloudFactory {
    @Override
    public Database createDatabase() {
        return new AzureDatabase();
    }

    @Override
    public Cache createCache() {
        return new AzureCache();
    }
}

// Client
public class CloudApplication {
    private Database database;
    private Cache cache;

    public CloudApplication(CloudFactory factory) {
        this.database = factory.createDatabase();
        this.cache = factory.createCache();
    }

    public void run() {
        database.connect();
        cache.set("key", "value");
    }
}

// Usage
public class Main {
    public static void main(String[] args) {
        CloudFactory factory = new AWSFactory();
        CloudApplication app = new CloudApplication(factory);
        app.run();
    }
}
```

**Kotlin Example:**

```kotlin
// Abstract products
interface Transport {
    fun deliver(destination: String)
}

interface Warehouse {
    fun store(item: String)
}

// Concrete products - Air logistics
class Airplane : Transport {
    override fun deliver(destination: String) {
        println("Delivering by air to $destination")
    }
}

class AirportWarehouse : Warehouse {
    override fun store(item: String) {
        println("Storing $item in airport warehouse")
    }
}

// Concrete products - Sea logistics
class Ship : Transport {
    override fun deliver(destination: String) {
        println("Delivering by sea to $destination")
    }
}

class PortWarehouse : Warehouse {
    override fun store(item: String) {
        println("Storing $item in port warehouse")
    }
}

// Abstract factory
interface LogisticsFactory {
    fun createTransport(): Transport
    fun createWarehouse(): Warehouse
}

// Concrete factories
class AirLogistics : LogisticsFactory {
    override fun createTransport(): Transport = Airplane()
    override fun createWarehouse(): Warehouse = AirportWarehouse()
}

class SeaLogistics : LogisticsFactory {
    override fun createTransport(): Transport = Ship()
    override fun createWarehouse(): Warehouse = PortWarehouse()
}

// Client
class LogisticsCompany(private val factory: LogisticsFactory) {
    private val transport = factory.createTransport()
    private val warehouse = factory.createWarehouse()

    fun processOrder(item: String, destination: String) {
        warehouse.store(item)
        transport.deliver(destination)
    }
}

// Usage
fun main() {
    val factory: LogisticsFactory = when (System.getenv("LOGISTICS_TYPE")) {
        "air" -> AirLogistics()
        else -> SeaLogistics()
    }

    val company = LogisticsCompany(factory)
    company.processOrder("Package", "New York")
}
```

#### When to Use

✅ **Use Abstract Factory when:**
- System should work with multiple families of products
- Products in a family must be used together
- Want to reveal interfaces, not implementations
- Need to enforce family consistency

❌ **Don't use when:**
- Only single product family exists (use Simple Factory)
- Products don't need to work together
- Adds unnecessary complexity

---

## Builder Pattern

**Gang of Four pattern**. Separate construction of complex object from its representation, allowing same construction process to create different representations.

### Problem

Complex objects require many steps and parameters to construct:

```java
// Constructor with many parameters - hard to read and error-prone
User user = new User(
    "johndoe",
    "john@example.com",
    "John",
    "Doe",
    25,
    "123 Main St",
    "555-1234",
    "active",
    true,
    false
);
// What does each parameter mean?
```

### Solution

Build object step by step using fluent interface:

```
┌──────────────┐
│   Director   │
└──────┬───────┘
       │ uses
       ▼
┌──────────────┐
│   Builder    │ (interface)
│ + buildPartA()│
│ + buildPartB()│
│ + getResult() │
└──────────────┘
       △
       │ implements
       │
┌──────┴───────────┐
│ ConcreteBuilder  │
│ + buildPartA()   │
│ + buildPartB()   │ ──► builds ──► Product
│ + getResult()    │
└──────────────────┘
```

### Implementation

**Java Example (Classic Builder):**

```java
// Product
public class User {
    // Required parameters
    private final String username;
    private final String email;

    // Optional parameters
    private final String firstName;
    private final String lastName;
    private final int age;
    private final String address;
    private final String phone;
    private final boolean emailVerified;
    private final boolean active;

    // Private constructor - only Builder can create User
    private User(Builder builder) {
        this.username = builder.username;
        this.email = builder.email;
        this.firstName = builder.firstName;
        this.lastName = builder.lastName;
        this.age = builder.age;
        this.address = builder.address;
        this.phone = builder.phone;
        this.emailVerified = builder.emailVerified;
        this.active = builder.active;

        // Validation
        if (username == null || username.isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (email == null || !email.contains("@")) {
            throw new IllegalArgumentException("Valid email is required");
        }
    }

    // Builder class
    public static class Builder {
        // Required parameters
        private final String username;
        private final String email;

        // Optional parameters - initialized to default values
        private String firstName = "";
        private String lastName = "";
        private int age = 0;
        private String address = "";
        private String phone = "";
        private boolean emailVerified = false;
        private boolean active = true;

        // Constructor with required parameters
        public Builder(String username, String email) {
            this.username = username;
            this.email = email;
        }

        // Fluent methods for optional parameters
        public Builder firstName(String firstName) {
            this.firstName = firstName;
            return this;
        }

        public Builder lastName(String lastName) {
            this.lastName = lastName;
            return this;
        }

        public Builder age(int age) {
            this.age = age;
            return this;
        }

        public Builder address(String address) {
            this.address = address;
            return this;
        }

        public Builder phone(String phone) {
            this.phone = phone;
            return this;
        }

        public Builder emailVerified(boolean emailVerified) {
            this.emailVerified = emailVerified;
            return this;
        }

        public Builder active(boolean active) {
            this.active = active;
            return this;
        }

        // Build method
        public User build() {
            return new User(this);
        }
    }

    // Getters
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    // ... other getters
}

// Usage - clear and readable
User user = new User.Builder("johndoe", "john@example.com")
    .firstName("John")
    .lastName("Doe")
    .age(25)
    .address("123 Main St")
    .emailVerified(true)
    .build();
```

**Python Example (Fluent Builder):**

```python
from typing import Optional
from datetime import datetime

class QueryBuilder:
    """SQL query builder with fluent interface"""

    def __init__(self, table: str):
        self._table = table
        self._select_fields: list[str] = ["*"]
        self._where_clauses: list[str] = []
        self._joins: list[str] = []
        self._order_by: Optional[str] = None
        self._limit: Optional[int] = None
        self._offset: Optional[int] = None

    def select(self, *fields: str) -> "QueryBuilder":
        """Select specific fields"""
        self._select_fields = list(fields)
        return self

    def where(self, condition: str) -> "QueryBuilder":
        """Add WHERE clause"""
        self._where_clauses.append(condition)
        return self

    def join(self, table: str, condition: str) -> "QueryBuilder":
        """Add JOIN clause"""
        self._joins.append(f"JOIN {table} ON {condition}")
        return self

    def order_by(self, field: str, direction: str = "ASC") -> "QueryBuilder":
        """Add ORDER BY clause"""
        self._order_by = f"{field} {direction}"
        return self

    def limit(self, limit: int) -> "QueryBuilder":
        """Add LIMIT clause"""
        self._limit = limit
        return self

    def offset(self, offset: int) -> "QueryBuilder":
        """Add OFFSET clause"""
        self._offset = offset
        return self

    def build(self) -> str:
        """Build final SQL query"""
        query_parts = [
            f"SELECT {', '.join(self._select_fields)}",
            f"FROM {self._table}"
        ]

        if self._joins:
            query_parts.extend(self._joins)

        if self._where_clauses:
            query_parts.append(f"WHERE {' AND '.join(self._where_clauses)}")

        if self._order_by:
            query_parts.append(f"ORDER BY {self._order_by}")

        if self._limit:
            query_parts.append(f"LIMIT {self._limit}")

        if self._offset:
            query_parts.append(f"OFFSET {self._offset}")

        return " ".join(query_parts)

# Usage - readable query construction
query = (QueryBuilder("users")
    .select("id", "username", "email")
    .join("profiles", "users.id = profiles.user_id")
    .where("users.active = true")
    .where("users.created_at > '2024-01-01'")
    .order_by("username", "ASC")
    .limit(10)
    .offset(20)
    .build())

print(query)
# SELECT id, username, email FROM users
# JOIN profiles ON users.id = profiles.user_id
# WHERE users.active = true AND users.created_at > '2024-01-01'
# ORDER BY username ASC LIMIT 10 OFFSET 20
```

**TypeScript Example (Immutable Builder):**

```typescript
// Product interface
interface HttpRequest {
  readonly url: string;
  readonly method: string;
  readonly headers: Record<string, string>;
  readonly body?: any;
  readonly timeout: number;
  readonly retries: number;
}

// Builder with immutable modifications
class HttpRequestBuilder {
  private readonly config: Partial<HttpRequest>;

  constructor(url: string) {
    this.config = {
      url,
      method: 'GET',
      headers: {},
      timeout: 5000,
      retries: 0,
    };
  }

  method(method: string): HttpRequestBuilder {
    return new HttpRequestBuilder(this.config.url!)
      .withConfig({ ...this.config, method });
  }

  header(key: string, value: string): HttpRequestBuilder {
    const headers = { ...this.config.headers, [key]: value };
    return new HttpRequestBuilder(this.config.url!)
      .withConfig({ ...this.config, headers });
  }

  headers(headers: Record<string, string>): HttpRequestBuilder {
    return new HttpRequestBuilder(this.config.url!)
      .withConfig({ ...this.config, headers: { ...this.config.headers, ...headers } });
  }

  body(body: any): HttpRequestBuilder {
    return new HttpRequestBuilder(this.config.url!)
      .withConfig({ ...this.config, body });
  }

  timeout(timeout: number): HttpRequestBuilder {
    return new HttpRequestBuilder(this.config.url!)
      .withConfig({ ...this.config, timeout });
  }

  retries(retries: number): HttpRequestBuilder {
    return new HttpRequestBuilder(this.config.url!)
      .withConfig({ ...this.config, retries });
  }

  private withConfig(config: Partial<HttpRequest>): HttpRequestBuilder {
    const builder = new HttpRequestBuilder(config.url!);
    (builder as any).config = config;
    return builder;
  }

  build(): HttpRequest {
    if (!this.config.url) {
      throw new Error('URL is required');
    }
    return this.config as HttpRequest;
  }
}

// Usage - immutable, functional style
const request = new HttpRequestBuilder('https://api.example.com/users')
  .method('POST')
  .headers({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123',
  })
  .body({ name: 'John Doe', email: 'john@example.com' })
  .timeout(10000)
  .retries(3)
  .build();

console.log(request);
```

**Rust Example (Type-State Builder):**

```rust
// Type-state pattern - enforce required fields at compile time
use std::marker::PhantomData;

// Type states
struct Incomplete;
struct Complete;

// Product
pub struct DatabaseConfig {
    host: String,
    port: u16,
    database: String,
    username: String,
    password: String,
    max_connections: u32,
    timeout_seconds: u64,
}

// Builder with type state
pub struct DatabaseConfigBuilder<State> {
    host: Option<String>,
    port: Option<u16>,
    database: Option<String>,
    username: Option<String>,
    password: Option<String>,
    max_connections: u32,
    timeout_seconds: u64,
    _state: PhantomData<State>,
}

impl DatabaseConfigBuilder<Incomplete> {
    pub fn new() -> Self {
        Self {
            host: None,
            port: None,
            database: None,
            username: None,
            password: None,
            max_connections: 10,
            timeout_seconds: 30,
            _state: PhantomData,
        }
    }

    pub fn host(mut self, host: impl Into<String>) -> Self {
        self.host = Some(host.into());
        self
    }

    pub fn port(mut self, port: u16) -> Self {
        self.port = Some(port);
        self
    }

    pub fn database(mut self, database: impl Into<String>) -> Self {
        self.database = Some(database.into());
        self
    }

    pub fn username(mut self, username: impl Into<String>) -> Self {
        self.username = Some(username.into());
        self
    }

    pub fn password(mut self, password: impl Into<String>) -> Self {
        self.password = Some(password.into());
        self
    }

    pub fn max_connections(mut self, max_connections: u32) -> Self {
        self.max_connections = max_connections;
        self
    }

    pub fn timeout_seconds(mut self, timeout_seconds: u64) -> Self {
        self.timeout_seconds = timeout_seconds;
        self
    }

    // Transition to Complete state - only possible when all required fields set
    pub fn build(self) -> Result<DatabaseConfig, String> {
        Ok(DatabaseConfig {
            host: self.host.ok_or("Host is required")?,
            port: self.port.ok_or("Port is required")?,
            database: self.database.ok_or("Database is required")?,
            username: self.username.ok_or("Username is required")?,
            password: self.password.ok_or("Password is required")?,
            max_connections: self.max_connections,
            timeout_seconds: self.timeout_seconds,
        })
    }
}

// Usage - compile-time safety
fn main() {
    let config = DatabaseConfigBuilder::new()
        .host("localhost")
        .port(5432)
        .database("mydb")
        .username("admin")
        .password("secret")
        .max_connections(20)
        .build()
        .expect("Failed to build config");

    // This won't compile - missing required fields:
    // let bad_config = DatabaseConfigBuilder::new().build();
}
```

**Go Example (Functional Options):**

```go
package main

import (
    "fmt"
    "time"
)

// Product
type Server struct {
    host            string
    port            int
    timeout         time.Duration
    maxConnections  int
    enableLogging   bool
    enableMetrics   bool
}

// Option function type
type ServerOption func(*Server)

// Default configuration
func NewServer(host string, port int, options ...ServerOption) *Server {
    server := &Server{
        host:            host,
        port:            port,
        timeout:         30 * time.Second,
        maxConnections:  100,
        enableLogging:   false,
        enableMetrics:   false,
    }

    // Apply options
    for _, option := range options {
        option(server)
    }

    return server
}

// Option functions
func WithTimeout(timeout time.Duration) ServerOption {
    return func(s *Server) {
        s.timeout = timeout
    }
}

func WithMaxConnections(max int) ServerOption {
    return func(s *Server) {
        s.maxConnections = max
    }
}

func WithLogging() ServerOption {
    return func(s *Server) {
        s.enableLogging = true
    }
}

func WithMetrics() ServerOption {
    return func(s *Server) {
        s.enableMetrics = true
    }
}

// Usage - clean and flexible
func main() {
    // Minimal configuration
    server1 := NewServer("localhost", 8080)

    // Custom configuration
    server2 := NewServer("localhost", 8080,
        WithTimeout(60*time.Second),
        WithMaxConnections(200),
        WithLogging(),
        WithMetrics(),
    )

    fmt.Printf("Server 1: %+v\n", server1)
    fmt.printf("Server 2: %+v\n", server2)
}
```

### When to Use

✅ **Use Builder when:**
- Object has many parameters (>4-5)
- Many optional parameters
- Need immutable objects
- Construction process is complex
- Want fluent, readable API

❌ **Don't use when:**
- Object is simple (few required parameters)
- All parameters are required
- Adds unnecessary complexity

### Builder vs Constructor

| Constructor | Builder |
|-------------|---------|
| Good for 1-3 required params | Good for many optional params |
| Type-safe at compile time | Requires runtime validation |
| Can't chain calls | Fluent chaining |
| Mutable by default | Can enforce immutability |
| Simple to implement | More boilerplate code |

---

## Singleton Pattern

**Gang of Four pattern**. Ensure a class has only one instance and provide global access point to it.

### Problem

Need exactly one instance (database connection, logger, configuration):

```python
# Multiple instances created - wasteful and potentially buggy
db1 = Database()
db2 = Database()  # Different instance!
```

### Solution

Class controls its own instantiation:

```
┌──────────────────────┐
│     Singleton        │
│ - instance: Singleton│ (static)
│ + getInstance()      │ (static)
└──────────────────────┘
       │
       │ returns same instance
       ▼
  Single Instance
```

### Implementation

**Python Example (Thread-Safe):**

```python
import threading
from typing import Optional

class DatabaseConnection:
    """Thread-safe Singleton database connection"""

    _instance: Optional['DatabaseConnection'] = None
    _lock: threading.Lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                # Double-checked locking
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        """Initialize connection (called only once)"""
        self.connection = "Connected to database"
        print("Database connection initialized")

    def query(self, sql: str):
        return f"Executing: {sql}"

# Usage
db1 = DatabaseConnection()
db2 = DatabaseConnection()

print(db1 is db2)  # True - same instance
```

**Python Example (Module-Level Singleton):**

```python
# config.py - Pythonic singleton using module
class Config:
    def __init__(self):
        self.debug = False
        self.database_url = "postgresql://localhost/db"
        self.api_key = ""

    def load_from_env(self):
        import os
        self.debug = os.getenv("DEBUG", "false").lower() == "true"
        self.database_url = os.getenv("DATABASE_URL", self.database_url)
        self.api_key = os.getenv("API_KEY", "")

# Module-level instance
config = Config()
config.load_from_env()

# Usage in other modules
from config import config

if config.debug:
    print("Debug mode enabled")
```

**Java Example (Enum Singleton - Best Practice):**

```java
// Enum singleton - thread-safe, serialization-safe, reflection-safe
public enum DatabaseConnection {
    INSTANCE;

    private Connection connection;

    DatabaseConnection() {
        // Initialize connection
        try {
            connection = DriverManager.getConnection("jdbc:postgresql://localhost/db");
            System.out.println("Database connection initialized");
        } catch (SQLException e) {
            throw new RuntimeException("Failed to connect to database", e);
        }
    }

    public ResultSet query(String sql) throws SQLException {
        Statement stmt = connection.createStatement();
        return stmt.executeQuery(sql);
    }

    public void close() throws SQLException {
        if (connection != null && !connection.isClosed()) {
            connection.close();
        }
    }
}

// Usage
public class Application {
    public static void main(String[] args) throws SQLException {
        // Always same instance
        DatabaseConnection db = DatabaseConnection.INSTANCE;
        ResultSet results = db.query("SELECT * FROM users");
    }
}
```

**TypeScript Example (Modern Singleton):**

```typescript
class Logger {
  private static instance: Logger;
  private logs: string[] = [];

  // Private constructor prevents direct instantiation
  private constructor() {
    console.log('Logger initialized');
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public log(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.logs.push(logEntry);
    console.log(logEntry);
  }

  public getLogs(): string[] {
    return [...this.logs];
  }
}

// Usage
const logger1 = Logger.getInstance();
const logger2 = Logger.getInstance();

console.log(logger1 === logger2); // true

logger1.log('Application started');
logger2.log('Processing request'); // Same logger
```

**Go Example (sync.Once):**

```go
package main

import (
    "fmt"
    "sync"
)

type Database struct {
    connection string
}

var (
    instance *Database
    once     sync.Once
)

func GetInstance() *Database {
    once.Do(func() {
        fmt.Println("Initializing database connection")
        instance = &Database{
            connection: "Connected to PostgreSQL",
        }
    })
    return instance
}

func (db *Database) Query(sql string) string {
    return fmt.Sprintf("Executing: %s", sql)
}

// Usage
func main() {
    db1 := GetInstance()
    db2 := GetInstance()

    fmt.Println(db1 == db2) // true
    fmt.Println(db1.Query("SELECT * FROM users"))
}
```

### Problems with Singleton

**⚠️ CAUTION: Singleton is often considered an anti-pattern!**

**Issues:**
1. **Global state** - Hidden dependencies, hard to track
2. **Testing difficulties** - Can't easily mock or isolate
3. **Tight coupling** - Classes depend on concrete singleton
4. **Thread safety** - Requires careful implementation
5. **Serialization issues** - Can break singleton guarantee
6. **Violates Single Responsibility** - Controls instantiation + business logic

**Better alternatives:**

| Use Case | Better Pattern |
|----------|---------------|
| Shared configuration | Dependency Injection |
| Database connection | Connection pool via DI |
| Logger | DI with logger interface |
| Cache | DI with cache interface |

**When Singleton is acceptable:**
- ✅ Language runtime singletons (Python modules, Go packages)
- ✅ Stateless utilities (truly global, no mutable state)
- ✅ Resource managers (carefully designed)

**Prefer Dependency Injection:**

```python
# Bad - Singleton with global state
class Logger:
    _instance = None

    @staticmethod
    def get_instance():
        if Logger._instance is None:
            Logger._instance = Logger()
        return Logger._instance

    def log(self, message):
        print(message)

class UserService:
    def create_user(self, username):
        Logger.get_instance().log(f"Creating user: {username}")

# Good - Dependency Injection
class UserService:
    def __init__(self, logger: Logger):
        self.logger = logger

    def create_user(self, username):
        self.logger.log(f"Creating user: {username}")

# Inject dependency
logger = Logger()  # Single instance managed by DI container
user_service = UserService(logger)
```

---

## Prototype Pattern

**Gang of Four pattern**. Create new objects by copying existing objects (prototypes).

### Problem

Creating objects is expensive or complex:

```python
# Expensive to create from scratch each time
user = User()
user.load_from_database()
user.load_preferences()
user.load_history()
# Want copy with modifications, not full recreation
```

### Solution

Clone existing object and modify:

```
┌──────────────┐
│  Prototype   │
│ + clone()    │
└──────┬───────┘
       △
       │ implements
       │
┌──────┴──────────┐
│ ConcretePrototype│
│ + clone()        │ ──► returns copy of self
└─────────────────┘
```

### Implementation

**Python Example:**

```python
import copy
from dataclasses import dataclass, field
from typing import List

@dataclass
class Address:
    street: str
    city: str
    country: str

@dataclass
class User:
    username: str
    email: str
    address: Address
    preferences: dict = field(default_factory=dict)
    tags: List[str] = field(default_factory=list)

    def clone(self) -> 'User':
        """Deep copy of user"""
        return copy.deepcopy(self)

    def shallow_clone(self) -> 'User':
        """Shallow copy - shares references"""
        return copy.copy(self)

# Original user
original = User(
    username="johndoe",
    email="john@example.com",
    address=Address("123 Main St", "New York", "USA"),
    preferences={"theme": "dark", "language": "en"},
    tags=["admin", "verified"]
)

# Clone and modify
clone1 = original.clone()
clone1.username = "janedoe"
clone1.email = "jane@example.com"
clone1.address.city = "Los Angeles"  # Different city

# Original unchanged
print(f"Original city: {original.address.city}")  # New York
print(f"Clone city: {clone1.address.city}")       # Los Angeles
```

**Java Example (Cloneable):**

```java
public class DocumentPrototype implements Cloneable {
    private String title;
    private String content;
    private List<String> tags;
    private Map<String, String> metadata;

    public DocumentPrototype(String title) {
        this.title = title;
        this.content = "";
        this.tags = new ArrayList<>();
        this.metadata = new HashMap<>();
    }

    @Override
    public DocumentPrototype clone() {
        try {
            DocumentPrototype clone = (DocumentPrototype) super.clone();
            // Deep copy mutable fields
            clone.tags = new ArrayList<>(this.tags);
            clone.metadata = new HashMap<>(this.metadata);
            return clone;
        } catch (CloneNotSupportedException e) {
            throw new RuntimeException("Clone not supported", e);
        }
    }

    // Getters and setters
    public void setTitle(String title) { this.title = title; }
    public void setContent(String content) { this.content = content; }
    public void addTag(String tag) { this.tags.add(tag); }
    public void addMetadata(String key, String value) { this.metadata.put(key, value); }
}

// Usage
public class Main {
    public static void main(String[] args) {
        // Template document
        DocumentPrototype template = new DocumentPrototype("Template");
        template.addTag("official");
        template.addMetadata("author", "Admin");

        // Clone for new document
        DocumentPrototype doc1 = template.clone();
        doc1.setTitle("Report 2024");
        doc1.setContent("Annual report content...");

        // Template unchanged
        System.out.println(template.getTitle()); // "Template"
        System.out.println(doc1.getTitle());     // "Report 2024"
    }
}
```

**TypeScript Example:**

```typescript
interface Prototype<T> {
  clone(): T;
}

class GameCharacter implements Prototype<GameCharacter> {
  constructor(
    public name: string,
    public health: number,
    public mana: number,
    public equipment: string[],
    public skills: Map<string, number>
  ) {}

  clone(): GameCharacter {
    // Deep clone
    return new GameCharacter(
      this.name,
      this.health,
      this.mana,
      [...this.equipment],
      new Map(this.skills)
    );
  }

  equip(item: string): void {
    this.equipment.push(item);
  }

  learnSkill(skill: string, level: number): void {
    this.skills.set(skill, level);
  }
}

// Character templates
const warriorTemplate = new GameCharacter(
  'Warrior',
  100,
  20,
  ['Sword', 'Shield'],
  new Map([['Attack', 10], ['Defense', 8]])
);

const mageTemplate = new GameCharacter(
  'Mage',
  60,
  100,
  ['Staff', 'Robe'],
  new Map([['Fireball', 10], ['Heal', 5]])
);

// Create characters from templates
const player1 = warriorTemplate.clone();
player1.name = 'Conan';

const player2 = mageTemplate.clone();
player2.name = 'Gandalf';
player2.learnSkill('Lightning', 8);

console.log(player1); // Warrior Conan
console.log(player2); // Mage Gandalf
console.log(mageTemplate.skills.has('Lightning')); // false - template unchanged
```

**Rust Example:**

```rust
use std::collections::HashMap;

#[derive(Clone, Debug)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub ssl_enabled: bool,
    pub max_connections: u32,
    pub environment_vars: HashMap<String, String>,
}

impl ServerConfig {
    pub fn new(host: impl Into<String>, port: u16) -> Self {
        Self {
            host: host.into(),
            port,
            ssl_enabled: false,
            max_connections: 100,
            environment_vars: HashMap::new(),
        }
    }

    // Custom clone with modifications
    pub fn clone_with_port(&self, port: u16) -> Self {
        let mut clone = self.clone();
        clone.port = port;
        clone
    }
}

// Usage
fn main() {
    // Production template
    let prod_config = ServerConfig {
        host: "api.example.com".to_string(),
        port: 443,
        ssl_enabled: true,
        max_connections: 1000,
        environment_vars: HashMap::from([
            ("ENV".to_string(), "production".to_string()),
        ]),
    };

    // Clone for staging
    let mut staging_config = prod_config.clone();
    staging_config.host = "staging.example.com".to_string();
    staging_config.environment_vars.insert("ENV".to_string(), "staging".to_string());

    // Clone for local dev
    let dev_config = prod_config.clone_with_port(8080);

    println!("Prod: {:?}", prod_config);
    println!("Staging: {:?}", staging_config);
    println!("Dev: {:?}", dev_config);
}
```

### When to Use

✅ **Use Prototype when:**
- Object creation is expensive
- Want to avoid subclasses of object creator
- Runtime specification of objects to create
- Need to create many similar objects

❌ **Don't use when:**
- Simple object creation (use constructor)
- Deep cloning is complex or impossible
- Objects have many interdependencies

### Shallow vs Deep Copy

| Shallow Copy | Deep Copy |
|--------------|-----------|
| Copies references | Copies values recursively |
| Fast | Slower |
| Shares nested objects | Independent nested objects |
| Changes affect both | Changes independent |

**When to use each:**
- **Shallow**: Immutable nested objects, performance-critical
- **Deep**: Mutable nested objects, need full independence

---

## Dependency Injection (Modern)

**Not a Gang of Four pattern**, but essential in modern development. Provide dependencies from outside rather than creating them internally.

### Problem

Classes create their own dependencies → tight coupling, hard to test:

```python
# Bad - tight coupling
class UserService:
    def __init__(self):
        self.database = PostgresDatabase()  # Hard-coded!
        self.email = SendGridEmail()        # Hard-coded!
        self.cache = RedisCache()           # Hard-coded!

    def create_user(self, username, email):
        # Can't test without real database, email service, cache
        pass
```

### Solution

Inject dependencies from outside → loose coupling, easy to test:

```
┌──────────────┐
│   Client     │
└──────┬───────┘
       │ injects
       ▼
┌──────────────┐         ┌──────────────┐
│   Service    │◄────────│  Dependency  │ (interface)
│              │ depends  └──────────────┘
└──────────────┘               △
                               │ implements
                               │
                         ┌─────┴──────┐
                         │            │
                  Implementation1  Implementation2
```

### Implementation

**Python Example (Constructor Injection):**

```python
from abc import ABC, abstractmethod
from typing import Protocol

# Dependency interfaces (protocols)
class Database(Protocol):
    def save(self, data: dict) -> None: ...
    def find(self, id: str) -> dict: ...

class EmailService(Protocol):
    def send(self, to: str, subject: str, body: str) -> None: ...

class CacheService(Protocol):
    def get(self, key: str) -> any: ...
    def set(self, key: str, value: any) -> None: ...

# Concrete implementations
class PostgresDatabase:
    def save(self, data: dict) -> None:
        print(f"Saving to PostgreSQL: {data}")

    def find(self, id: str) -> dict:
        return {"id": id, "name": "John"}

class SendGridEmail:
    def send(self, to: str, subject: str, body: str) -> None:
        print(f"Sending email via SendGrid to {to}")

class RedisCache:
    def get(self, key: str) -> any:
        return None

    def set(self, key: str, value: any) -> None:
        print(f"Caching in Redis: {key}")

# Service with dependency injection
class UserService:
    def __init__(
        self,
        database: Database,
        email: EmailService,
        cache: CacheService
    ):
        self.database = database
        self.email = email
        self.cache = cache

    def create_user(self, username: str, email: str) -> dict:
        user = {"username": username, "email": email}

        # Use injected dependencies
        self.database.save(user)
        self.cache.set(f"user:{username}", user)
        self.email.send(email, "Welcome!", "Thanks for joining!")

        return user

# Production usage
user_service = UserService(
    database=PostgresDatabase(),
    email=SendGridEmail(),
    cache=RedisCache()
)

# Testing usage - inject mocks
class MockDatabase:
    def save(self, data: dict) -> None:
        pass
    def find(self, id: str) -> dict:
        return {"id": id, "test": True}

class MockEmail:
    def send(self, to: str, subject: str, body: str) -> None:
        pass

class MockCache:
    def get(self, key: str) -> any:
        return None
    def set(self, key: str, value: any) -> None:
        pass

test_service = UserService(
    database=MockDatabase(),
    email=MockEmail(),
    cache=MockCache()
)
```

**Java Example (Spring Framework):**

```java
// Dependency interfaces
public interface UserRepository {
    void save(User user);
    Optional<User> findById(String id);
}

public interface EmailService {
    void sendWelcomeEmail(User user);
}

// Concrete implementations
@Repository
public class JpaUserRepository implements UserRepository {
    @Autowired
    private EntityManager entityManager;

    @Override
    public void save(User user) {
        entityManager.persist(user);
    }

    @Override
    public Optional<User> findById(String id) {
        return Optional.ofNullable(entityManager.find(User.class, id));
    }
}

@Service
public class SendGridEmailService implements EmailService {
    @Value("${sendgrid.api.key}")
    private String apiKey;

    @Override
    public void sendWelcomeEmail(User user) {
        // Send email via SendGrid
        System.out.println("Sending welcome email to " + user.getEmail());
    }
}

// Service with dependency injection
@Service
public class UserService {
    private final UserRepository userRepository;
    private final EmailService emailService;

    // Constructor injection (recommended)
    @Autowired
    public UserService(
        UserRepository userRepository,
        EmailService emailService
    ) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    public User createUser(String username, String email) {
        User user = new User(username, email);
        userRepository.save(user);
        emailService.sendWelcomeEmail(user);
        return user;
    }
}

// Testing - inject mocks
@ExtendWith(MockitoExtension.class)
public class UserServiceTest {
    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private UserService userService;

    @Test
    public void testCreateUser() {
        User user = userService.createUser("johndoe", "john@example.com");

        verify(userRepository).save(any(User.class));
        verify(emailService).sendWelcomeEmail(any(User.class));
    }
}
```

**TypeScript Example (NestJS):**

```typescript
// Dependency interfaces
export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
}

export interface IEmailService {
  sendWelcomeEmail(user: User): Promise<void>;
}

// Concrete implementations
@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>
  ) {}

  async save(user: User): Promise<void> {
    await this.repository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }
}

@Injectable()
export class SendGridEmailService implements IEmailService {
  constructor(private readonly config: ConfigService) {}

  async sendWelcomeEmail(user: User): Promise<void> {
    const apiKey = this.config.get('SENDGRID_API_KEY');
    // Send email via SendGrid
    console.log(`Sending welcome email to ${user.email}`);
  }
}

// Service with dependency injection
@Injectable()
export class UserService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IEmailService')
    private readonly emailService: IEmailService
  ) {}

  async createUser(username: string, email: string): Promise<User> {
    const user = new User(username, email);
    await this.userRepository.save(user);
    await this.emailService.sendWelcomeEmail(user);
    return user;
  }
}

// Module configuration
@Module({
  providers: [
    UserService,
    {
      provide: 'IUserRepository',
      useClass: TypeOrmUserRepository,
    },
    {
      provide: 'IEmailService',
      useClass: SendGridEmailService,
    },
  ],
})
export class UserModule {}

// Testing - inject mocks
describe('UserService', () => {
  let service: UserService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockEmailService: jest.Mocked<IEmailService>;

  beforeEach(async () => {
    mockUserRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    };

    mockEmailService = {
      sendWelcomeEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: 'IUserRepository', useValue: mockUserRepository },
        { provide: 'IEmailService', useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should create user', async () => {
    await service.createUser('johndoe', 'john@example.com');

    expect(mockUserRepository.save).toHaveBeenCalled();
    expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalled();
  });
});
```

**Go Example (Manual DI):**

```go
package main

import "fmt"

// Dependency interfaces
type UserRepository interface {
    Save(user *User) error
    FindByID(id string) (*User, error)
}

type EmailService interface {
    SendWelcomeEmail(user *User) error
}

// User model
type User struct {
    ID       string
    Username string
    Email    string
}

// Concrete implementations
type PostgresUserRepository struct{}

func (r *PostgresUserRepository) Save(user *User) error {
    fmt.Printf("Saving user to PostgreSQL: %s\n", user.Username)
    return nil
}

func (r *PostgresUserRepository) FindByID(id string) (*User, error) {
    return &User{ID: id, Username: "john"}, nil
}

type SendGridEmailService struct {
    APIKey string
}

func (s *SendGridEmailService) SendWelcomeEmail(user *User) error {
    fmt.Printf("Sending welcome email to %s via SendGrid\n", user.Email)
    return nil
}

// Service with dependency injection
type UserService struct {
    repo  UserRepository
    email EmailService
}

func NewUserService(repo UserRepository, email EmailService) *UserService {
    return &UserService{
        repo:  repo,
        email: email,
    }
}

func (s *UserService) CreateUser(username, email string) (*User, error) {
    user := &User{
        ID:       "generated-id",
        Username: username,
        Email:    email,
    }

    if err := s.repo.Save(user); err != nil {
        return nil, err
    }

    if err := s.email.SendWelcomeEmail(user); err != nil {
        return nil, err
    }

    return user, nil
}

// Production usage
func main() {
    repo := &PostgresUserRepository{}
    email := &SendGridEmailService{APIKey: "sk_test_123"}

    service := NewUserService(repo, email)
    user, _ := service.CreateUser("johndoe", "john@example.com")

    fmt.Printf("Created user: %+v\n", user)
}

// Testing - inject mocks
type MockUserRepository struct{}

func (m *MockUserRepository) Save(user *User) error {
    return nil
}

func (m *MockUserRepository) FindByID(id string) (*User, error) {
    return &User{ID: id, Username: "test"}, nil
}

type MockEmailService struct{}

func (m *MockEmailService) SendWelcomeEmail(user *User) error {
    return nil
}

func TestUserService_CreateUser(t *testing.T) {
    repo := &MockUserRepository{}
    email := &MockEmailService{}
    service := NewUserService(repo, email)

    user, err := service.CreateUser("testuser", "test@example.com")

    if err != nil {
        t.Errorf("Expected no error, got %v", err)
    }

    if user.Username != "testuser" {
        t.Errorf("Expected username 'testuser', got %s", user.Username)
    }
}
```

### Types of Dependency Injection

| Type | Description | Example |
|------|-------------|---------|
| **Constructor** | Dependencies passed to constructor | `new Service(dep1, dep2)` |
| **Setter** | Dependencies set via setter methods | `service.setDatabase(db)` |
| **Interface** | Interface with inject method | `service.inject(dependencies)` |
| **Field** | Direct field injection | `@Autowired` in Java |

**Best practices:**
- ✅ **Prefer constructor injection** - Dependencies clear, immutable
- ⚠️ **Setter injection** - Optional dependencies only
- ❌ **Field injection** - Hard to test, unclear dependencies

### Inversion of Control (IoC) Containers

**IoC containers** manage dependency creation and injection:

| Framework | Language | Container |
|-----------|----------|-----------|
| Spring | Java | Spring ApplicationContext |
| .NET Core | C# | Built-in DI container |
| NestJS | TypeScript | Built-in DI container |
| Angular | TypeScript | Built-in DI container |
| FastAPI | Python | Depends() system |

### When to Use

✅ **Use Dependency Injection when:**
- Need to test with mocks
- Want to swap implementations
- Have complex dependencies
- Building enterprise applications
- Using modern frameworks (Spring, NestJS, .NET)

❌ **Don't use when:**
- Very simple scripts/utilities
- No need for testing
- Dependencies never change
- Adds unnecessary complexity

---

## Pattern Comparison

### Choosing the Right Creational Pattern

| Scenario | Best Pattern | Why |
|----------|--------------|-----|
| Simple object creation with variations | Factory Method | Clean abstraction, easy to extend |
| Families of related objects | Abstract Factory | Ensures compatibility |
| Complex construction process | Builder | Step-by-step, readable |
| Need single instance (rare!) | Singleton | Controlled instantiation |
| Expensive object creation | Prototype | Clone instead of create |
| Manage dependencies | Dependency Injection | Testability, flexibility |

### Pattern Combinations

**Common combinations:**

1. **Factory + Singleton**
   - Single factory instance creating objects
   - Example: Logger factory

2. **Builder + Prototype**
   - Clone template, modify with builder
   - Example: Document templates

3. **Factory + Dependency Injection**
   - Factory injected as dependency
   - Example: Strategy factory in service

4. **Abstract Factory + Singleton**
   - Single factory for product families
   - Example: GUI toolkit factory

---

## Common Mistakes

### 1. Singleton Abuse

**❌ Bad:**
```python
# Everything as singleton
database = DatabaseSingleton.get_instance()
cache = CacheSingleton.get_instance()
logger = LoggerSingleton.get_instance()
config = ConfigSingleton.get_instance()
```

**✅ Good:**
```python
# Dependency injection
class UserService:
    def __init__(self, database, cache, logger, config):
        self.database = database
        self.cache = cache
        self.logger = logger
        self.config = config
```

### 2. Premature Abstraction

**❌ Bad:**
```java
// Abstract Factory for 1 product family
public interface DatabaseFactory {
    Database createDatabase();
    Cache createCache();
}

public class PostgresFactory implements DatabaseFactory {
    // Only implementation!
}
```

**✅ Good:**
```java
// Simple direct creation until second implementation needed
public class DatabaseConnection {
    public static Connection create() {
        return DriverManager.getConnection("jdbc:postgresql://localhost/db");
    }
}
```

### 3. God Builder

**❌ Bad:**
```python
# Builder with too many responsibilities
user = (UserBuilder()
    .username("john")
    .email("john@example.com")
    .save_to_database()      # Should not be here!
    .send_welcome_email()    # Should not be here!
    .notify_admins()         # Should not be here!
    .build())
```

**✅ Good:**
```python
# Builder only builds, service handles operations
user = (UserBuilder()
    .username("john")
    .email("john@example.com")
    .build())

user_service.create_user(user)  # Service handles logic
```

### 4. Factory Explosion

**❌ Bad:**
```java
// Too many factory classes
UserFactory
AdminFactory
GuestFactory
ModeratorFactory
SuperAdminFactory
// Each with own class!
```

**✅ Good:**
```java
// Single factory with parameter
public class UserFactory {
    public static User create(UserType type) {
        return switch (type) {
            case ADMIN -> new AdminUser();
            case GUEST -> new GuestUser();
            case MODERATOR -> new ModeratorUser();
        };
    }
}
```

### 5. Shallow Copy Issues

**❌ Bad:**
```python
# Shallow copy - shared mutable state!
original = User(preferences={"theme": "dark"})
clone = copy.copy(original)
clone.preferences["theme"] = "light"  # Changes original too!
```

**✅ Good:**
```python
# Deep copy - independent state
clone = copy.deepcopy(original)
clone.preferences["theme"] = "light"  # Only changes clone
```

---

## References

### Primary Sources

1. **Gang of Four**
   - Gamma, E., Helm, R., Johnson, R., Vlissides, J. (1994). *Design Patterns: Elements of Reusable Object-Oriented Software*. Addison-Wesley.
   - Chapter 3: Creational Patterns

2. **Joshua Bloch**
   - Bloch, J. (2018). *Effective Java* (3rd ed.). Addison-Wesley.
   - Item 1: Consider static factory methods instead of constructors
   - Item 2: Consider a builder when faced with many constructor parameters
   - Item 3: Enforce the singleton property with a private constructor or an enum type

3. **Martin Fowler**
   - Fowler, M. (2004). *Inversion of Control Containers and the Dependency Injection pattern*.
   - https://martinfowler.com/articles/injection.html

4. **Robert C. Martin**
   - Martin, R. C. (2017). *Clean Architecture*. Prentice Hall.
   - Dependency Inversion Principle

### Framework Documentation

5. **Spring Framework (Java)**
   - https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-method.html
   - https://docs.spring.io/spring-framework/reference/core/beans/dependencies/constructor-injection.html

6. **NestJS (TypeScript)**
   - https://docs.nestjs.com/fundamentals/custom-providers
   - https://docs.nestjs.com/fundamentals/dependency-injection

7. **FastAPI (Python)**
   - https://fastapi.tiangolo.com/tutorial/dependencies/

### Modern Resources

8. **Refactoring Guru**
   - https://refactoring.guru/design-patterns/creational-patterns

9. **Python Design Patterns**
   - https://python-patterns.guide/gang-of-four/

10. **Rust Design Patterns**
    - https://rust-unofficial.github.io/patterns/patterns/creational/builder.html

---

**Last Updated:** 2025-10-20
**Version:** 1.0
