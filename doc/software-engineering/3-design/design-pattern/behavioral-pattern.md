# Behavioral Design Patterns

**Purpose:** Object interaction and responsibility distribution
**Focus:** How objects communicate and distribute responsibilities
**Organization:** PHD Systems & PHD Labs
**Version:** 1.0
**Date:** 2025-10-20

---

## TL;DR

**Behavioral patterns define how objects interact and distribute responsibilities**. **Eleven GoF patterns**: Strategy (swappable algorithms), Observer (event notification), Command (request as object), Template Method (algorithm skeleton), Chain of Responsibility (sequential handlers), State (state-dependent behavior), Iterator (sequential access), Mediator (centralized communication), Memento (state capture), Visitor (external operations), Interpreter (grammar evaluation). **Modern essential**: Saga (distributed transactions). **Most used**: Strategy, Observer, Command (CQRS foundation). **When to use**: Business rules (Strategy), events (Observer), undo/redo (Command + Memento), workflows (State), request pipelines (Chain of Responsibility). **Golden rule**: Favor composition over complex control flow → Use patterns to make interactions explicit. **Avoid**: Over-engineering simple conditionals, Visitor for unstable hierarchies.

---

## Table of Contents

- [Overview](#overview)
- [Strategy Pattern](#strategy-pattern)
- [Observer Pattern](#observer-pattern)
- [Command Pattern](#command-pattern)
- [State Pattern](#state-pattern)
- [Chain of Responsibility](#chain-of-responsibility)
- [Template Method](#template-method)
- [Iterator Pattern](#iterator-pattern)
- [Mediator Pattern](#mediator-pattern)
- [Memento Pattern](#memento-pattern)
- [Visitor Pattern](#visitor-pattern)
- [Interpreter Pattern](#interpreter-pattern)
- [Saga Pattern (Modern)](#saga-pattern-modern)
- [Pattern Comparison](#pattern-comparison)
- [Common Mistakes](#common-mistakes)
- [References](#references)

---

## Overview

**Behavioral design patterns** are concerned with algorithms and the assignment of responsibilities between objects. They characterize complex control flow that's difficult to follow at runtime.

### Why Behavioral Patterns?

**Problems they solve:**
1. **Rigid algorithms** - Hard-coded logic that can't vary
2. **Tight coupling** - Objects know too much about each other
3. **Complex conditionals** - Nested if/else or switch statements
4. **Inflexible workflows** - State machines embedded in methods
5. **Scattered responsibilities** - Logic duplicated across classes

**Benefits:**
- ✅ Flexibility - Easy to change behavior at runtime
- ✅ Extensibility - Add new behaviors without modifying existing code
- ✅ Reusability - Behaviors can be shared across objects
- ✅ Clarity - Makes interactions and responsibilities explicit
- ✅ Testability - Behaviors can be tested independently

### Pattern Categories

| Pattern | Purpose | Use Case |
|---------|---------|----------|
| **Strategy** | Swappable algorithms | Business rules, calculations |
| **Observer** | Event notification | UI updates, pub/sub systems |
| **Command** | Request as object | Undo/redo, CQRS, async operations |
| **State** | State-dependent behavior | Workflows, state machines |
| **Chain of Responsibility** | Sequential handlers | Request pipelines, middleware |
| **Template Method** | Algorithm skeleton | Framework hooks, inheritance-based reuse |
| **Iterator** | Sequential access | Collections, cursors |
| **Mediator** | Centralized communication | Complex object interactions |
| **Memento** | State capture | Undo/redo, snapshots |
| **Visitor** | External operations | AST traversal, reporting |
| **Interpreter** | Grammar evaluation | DSL, expression parsing |
| **Saga** | Distributed transactions | Microservices, eventual consistency |

---

## Strategy Pattern

**Gang of Four pattern**. Define family of algorithms, encapsulate each one, and make them interchangeable. Strategy lets algorithm vary independently from clients that use it.

### Problem

Hard-coded algorithms or complex conditionals:

```python
# Bad - algorithm hard-coded
class ShoppingCart:
    def calculate_total(self, items, customer_type):
        if customer_type == "regular":
            return sum(item.price for item in items)
        elif customer_type == "premium":
            return sum(item.price for item in items) * 0.9
        elif customer_type == "vip":
            return sum(item.price for item in items) * 0.8
        # Adding new customer type requires modifying this method!
```

### Solution

Encapsulate algorithms in separate strategy classes:

```
┌─────────────┐
│   Context   │
└──────┬──────┘
       │ uses
       ▼
┌─────────────────┐
│    Strategy     │ (interface)
│ + algorithm()   │
└─────────────────┘
       △
       │ implements
   ┌───┴───┬────────┬─────────┐
   │       │        │         │
StrategyA StrategyB StrategyC
```

### Implementation

**Python Example (Pricing Strategy):**

```python
from abc import ABC, abstractmethod
from typing import List
from dataclasses import dataclass

@dataclass
class Item:
    name: str
    price: float

# Strategy interface
class PricingStrategy(ABC):
    @abstractmethod
    def calculate_price(self, items: List[Item]) -> float:
        pass

# Concrete strategies
class RegularPricing(PricingStrategy):
    def calculate_price(self, items: List[Item]) -> float:
        return sum(item.price for item in items)

class PremiumPricing(PricingStrategy):
    def calculate_price(self, items: List[Item]) -> float:
        total = sum(item.price for item in items)
        return total * 0.9  # 10% discount

class VIPPricing(PricingStrategy):
    def calculate_price(self, items: List[Item]) -> float:
        total = sum(item.price for item in items)
        return total * 0.8  # 20% discount

class BlackFridayPricing(PricingStrategy):
    def calculate_price(self, items: List[Item]) -> float:
        total = sum(item.price for item in items)
        return total * 0.5  # 50% discount

# Context
class ShoppingCart:
    def __init__(self, strategy: PricingStrategy):
        self.strategy = strategy
        self.items: List[Item] = []

    def add_item(self, item: Item) -> None:
        self.items.append(item)

    def set_pricing_strategy(self, strategy: PricingStrategy) -> None:
        self.strategy = strategy

    def calculate_total(self) -> float:
        return self.strategy.calculate_price(self.items)

# Usage
cart = ShoppingCart(RegularPricing())
cart.add_item(Item("Laptop", 1000))
cart.add_item(Item("Mouse", 50))

print(f"Regular: ${cart.calculate_total()}")  # 1050

cart.set_pricing_strategy(VIPPricing())
print(f"VIP: ${cart.calculate_total()}")  # 840

cart.set_pricing_strategy(BlackFridayPricing())
print(f"Black Friday: ${cart.calculate_total()}")  # 525
```

**Java Example (Sorting Strategy):**

```java
// Strategy interface
public interface SortStrategy<T> {
    void sort(List<T> items, Comparator<T> comparator);
}

// Concrete strategies
public class QuickSort<T> implements SortStrategy<T> {
    @Override
    public void sort(List<T> items, Comparator<T> comparator) {
        System.out.println("Sorting with QuickSort");
        Collections.sort(items, comparator);
    }
}

public class MergeSort<T> implements SortStrategy<T> {
    @Override
    public void sort(List<T> items, Comparator<T> comparator) {
        System.out.println("Sorting with MergeSort");
        // Merge sort implementation
        Collections.sort(items, comparator);
    }
}

public class HeapSort<T> implements SortStrategy<T> {
    @Override
    public void sort(List<T> items, Comparator<T> comparator) {
        System.out.println("Sorting with HeapSort");
        // Heap sort implementation
        Collections.sort(items, comparator);
    }
}

// Context
public class DataProcessor<T> {
    private SortStrategy<T> sortStrategy;

    public DataProcessor(SortStrategy<T> sortStrategy) {
        this.sortStrategy = sortStrategy;
    }

    public void setSortStrategy(SortStrategy<T> sortStrategy) {
        this.sortStrategy = sortStrategy;
    }

    public void processData(List<T> data, Comparator<T> comparator) {
        System.out.println("Processing " + data.size() + " items");

        // Use strategy based on data size
        if (data.size() < 10) {
            setSortStrategy(new QuickSort<>());
        } else if (data.size() < 1000) {
            setSortStrategy(new MergeSort<>());
        } else {
            setSortStrategy(new HeapSort<>());
        }

        sortStrategy.sort(data, comparator);
        System.out.println("Data processed");
    }
}

// Usage
public class Main {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(5, 2, 8, 1, 9);
        DataProcessor<Integer> processor = new DataProcessor<>(new QuickSort<>());

        processor.processData(numbers, Integer::compareTo);
    }
}
```

**TypeScript Example (Payment Strategy):**

```typescript
// Strategy interface
interface PaymentStrategy {
  pay(amount: number): Promise<PaymentResult>;
  refund(transactionId: string, amount: number): Promise<void>;
}

// Concrete strategies
class CreditCardStrategy implements PaymentStrategy {
  constructor(
    private cardNumber: string,
    private cvv: string,
    private expiry: string
  ) {}

  async pay(amount: number): Promise<PaymentResult> {
    console.log(`Processing credit card payment: $${amount}`);
    // Stripe/payment gateway integration
    return {
      success: true,
      transactionId: `cc-${Date.now()}`,
      amount,
    };
  }

  async refund(transactionId: string, amount: number): Promise<void> {
    console.log(`Refunding credit card: $${amount}`);
  }
}

class PayPalStrategy implements PaymentStrategy {
  constructor(private email: string) {}

  async pay(amount: number): Promise<PaymentResult> {
    console.log(`Processing PayPal payment: $${amount}`);
    return {
      success: true,
      transactionId: `pp-${Date.now()}`,
      amount,
    };
  }

  async refund(transactionId: string, amount: number): Promise<void> {
    console.log(`Refunding PayPal: $${amount}`);
  }
}

class CryptoStrategy implements PaymentStrategy {
  constructor(private walletAddress: string) {}

  async pay(amount: number): Promise<PaymentResult> {
    console.log(`Processing crypto payment: $${amount}`);
    return {
      success: true,
      transactionId: `crypto-${Date.now()}`,
      amount,
    };
  }

  async refund(transactionId: string, amount: number): Promise<void> {
    console.log(`Refunding crypto: $${amount}`);
  }
}

// Context
class PaymentProcessor {
  constructor(private strategy: PaymentStrategy) {}

  setStrategy(strategy: PaymentStrategy): void {
    this.strategy = strategy;
  }

  async processPayment(amount: number): Promise<PaymentResult> {
    return this.strategy.pay(amount);
  }

  async processRefund(transactionId: string, amount: number): Promise<void> {
    return this.strategy.refund(transactionId, amount);
  }
}

// Usage
const processor = new PaymentProcessor(
  new CreditCardStrategy('1234-5678', '123', '12/25')
);

await processor.processPayment(100);

// Switch to PayPal
processor.setStrategy(new PayPalStrategy('user@example.com'));
await processor.processPayment(50);
```

**Go Example (Compression Strategy):**

```go
package main

import (
    "fmt"
    "strings"
)

// Strategy interface
type CompressionStrategy interface {
    Compress(data string) string
    Decompress(data string) string
}

// Concrete strategies
type ZipCompression struct{}

func (z *ZipCompression) Compress(data string) string {
    fmt.Println("Compressing with ZIP")
    return "ZIP(" + data + ")"
}

func (z *ZipCompression) Decompress(data string) string {
    fmt.Println("Decompressing ZIP")
    return strings.TrimPrefix(strings.TrimSuffix(data, ")"), "ZIP(")
}

type GzipCompression struct{}

func (g *GzipCompression) Compress(data string) string {
    fmt.Println("Compressing with GZIP")
    return "GZIP(" + data + ")"
}

func (g *GzipCompression) Decompress(data string) string {
    fmt.Println("Decompressing GZIP")
    return strings.TrimPrefix(strings.TrimSuffix(data, ")"), "GZIP(")
}

type BrotliCompression struct{}

func (b *BrotliCompression) Compress(data string) string {
    fmt.Println("Compressing with Brotli")
    return "BROTLI(" + data + ")"
}

func (b *BrotliCompression) Decompress(data string) string {
    fmt.Println("Decompressing Brotli")
    return strings.TrimPrefix(strings.TrimSuffix(data, ")"), "BROTLI(")
}

// Context
type FileStorage struct {
    strategy CompressionStrategy
}

func NewFileStorage(strategy CompressionStrategy) *FileStorage {
    return &FileStorage{strategy: strategy}
}

func (f *FileStorage) SetStrategy(strategy CompressionStrategy) {
    f.strategy = strategy
}

func (f *FileStorage) SaveFile(filename, content string) string {
    compressed := f.strategy.Compress(content)
    fmt.Printf("Saving %s: %s\n", filename, compressed)
    return compressed
}

func (f *FileStorage) LoadFile(filename, compressed string) string {
    content := f.strategy.Decompress(compressed)
    fmt.Printf("Loading %s: %s\n", filename, content)
    return content
}

// Usage
func main() {
    storage := NewFileStorage(&ZipCompression{})
    compressed := storage.SaveFile("data.txt", "Hello World")

    // Switch strategy
    storage.SetStrategy(&GzipCompression{})
    compressed = storage.SaveFile("data.txt", "Hello World")

    content := storage.LoadFile("data.txt", compressed)
    fmt.Println("Final content:", content)
}
```

### When to Use

✅ **Use Strategy when:**
- Multiple algorithms for same task
- Need to switch algorithms at runtime
- Want to hide algorithm implementation details
- Have many conditional statements selecting algorithm

❌ **Don't use when:**
- Only one algorithm
- Algorithms never change
- Simple if/else suffices

---

## Observer Pattern

**Gang of Four pattern**. Define one-to-many dependency between objects so when one object changes state, all its dependents are notified and updated automatically.

### Problem

Objects need to stay synchronized without tight coupling:

```python
# Bad - tight coupling
class Stock:
    def set_price(self, price):
        self.price = price
        display.update(price)  # Knows about display
        alert.send(price)      # Knows about alert
        logger.log(price)      # Knows about logger
        # Must modify Stock to add new observers!
```

### Solution

Observers subscribe to subject, get notified of changes:

```
┌──────────────┐
│   Subject    │
│ + attach()   │
│ + detach()   │
│ + notify()   │
└──────┬───────┘
       │ notifies
       ▼
┌──────────────┐
│   Observer   │ (interface)
│ + update()   │
└──────────────┘
       △
       │ implements
   ┌───┴───┬─────────┐
   │       │         │
ObsA     ObsB      ObsC
```

### Implementation

**Python Example (Async Observer):**

```python
from abc import ABC, abstractmethod
from typing import List
import asyncio

# Observer interface
class Observer(ABC):
    @abstractmethod
    async def update(self, subject: 'Subject') -> None:
        pass

# Subject (Observable)
class Subject:
    def __init__(self):
        self._observers: List[Observer] = []
        self._state = None

    def attach(self, observer: Observer) -> None:
        print(f"Attaching observer: {observer.__class__.__name__}")
        self._observers.append(observer)

    def detach(self, observer: Observer) -> None:
        self._observers.remove(observer)

    async def notify(self) -> None:
        print(f"Notifying {len(self._observers)} observers")
        await asyncio.gather(
            *[observer.update(self) for observer in self._observers]
        )

    @property
    def state(self):
        return self._state

    @state.setter
    def state(self, value):
        self._state = value
        asyncio.create_task(self.notify())

# Concrete observers
class DisplayObserver(Observer):
    async def update(self, subject: Subject) -> None:
        await asyncio.sleep(0.1)  # Simulate async work
        print(f"Display updated: {subject.state}")

class LoggerObserver(Observer):
    async def update(self, subject: Subject) -> None:
        await asyncio.sleep(0.05)
        print(f"Log: State changed to {subject.state}")

class EmailObserver(Observer):
    async def update(self, subject: Subject) -> None:
        await asyncio.sleep(0.2)
        print(f"Email sent: State is {subject.state}")

class AnalyticsObserver(Observer):
    async def update(self, subject: Subject) -> None:
        await asyncio.sleep(0.15)
        print(f"Analytics: Recorded state {subject.state}")

# Usage
async def main():
    subject = Subject()

    # Attach observers
    subject.attach(DisplayObserver())
    subject.attach(LoggerObserver())
    subject.attach(EmailObserver())
    subject.attach(AnalyticsObserver())

    # Change state - all observers notified
    subject.state = "Active"
    await asyncio.sleep(0.3)  # Wait for async notifications

    subject.state = "Inactive"
    await asyncio.sleep(0.3)

asyncio.run(main())
```

**Java Example (Property Change Listener):**

```java
import java.beans.PropertyChangeListener;
import java.beans.PropertyChangeSupport;

// Subject
public class Stock {
    private final PropertyChangeSupport support;
    private String symbol;
    private double price;

    public Stock(String symbol) {
        this.symbol = symbol;
        this.support = new PropertyChangeSupport(this);
    }

    public void addPropertyChangeListener(PropertyChangeListener listener) {
        support.addPropertyChangeListener(listener);
    }

    public void removePropertyChangeListener(PropertyChangeListener listener) {
        support.removePropertyChangeListener(listener);
    }

    public void setPrice(double newPrice) {
        double oldPrice = this.price;
        this.price = newPrice;
        support.firePropertyChange("price", oldPrice, newPrice);
    }

    public String getSymbol() {
        return symbol;
    }

    public double getPrice() {
        return price;
    }
}

// Observers
class PriceDisplay implements PropertyChangeListener {
    @Override
    public void propertyChange(PropertyChangeEvent evt) {
        Stock stock = (Stock) evt.getSource();
        System.out.printf("Display: %s price changed from $%.2f to $%.2f%n",
            stock.getSymbol(), evt.getOldValue(), evt.getNewValue());
    }
}

class PriceAlert implements PropertyChangeListener {
    private double threshold;

    public PriceAlert(double threshold) {
        this.threshold = threshold;
    }

    @Override
    public void propertyChange(PropertyChangeEvent evt) {
        double newPrice = (double) evt.getNewValue();
        if (newPrice > threshold) {
            Stock stock = (Stock) evt.getSource();
            System.out.printf("ALERT: %s exceeded $%.2f (now $%.2f)%n",
                stock.getSymbol(), threshold, newPrice);
        }
    }
}

class PriceLogger implements PropertyChangeListener {
    @Override
    public void propertyChange(PropertyChangeEvent evt) {
        Stock stock = (Stock) evt.getSource();
        System.out.printf("LOG: %s price update - $%.2f%n",
            stock.getSymbol(), evt.getNewValue());
    }
}

// Usage
public class Main {
    public static void main(String[] args) {
        Stock apple = new Stock("AAPL");

        apple.addPropertyChangeListener(new PriceDisplay());
        apple.addPropertyChangeListener(new PriceAlert(150.0));
        apple.addPropertyChangeListener(new PriceLogger());

        apple.setPrice(145.50);
        apple.setPrice(155.75); // Triggers alert
    }
}
```

**TypeScript Example (Event Emitter):**

```typescript
// Observer interface
interface EventListener<T> {
  (data: T): void;
}

// Subject (Event Emitter)
class EventEmitter<T> {
  private listeners: Map<string, EventListener<T>[]> = new Map();

  on(event: string, listener: EventListener<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off(event: string, listener: EventListener<T>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  emit(event: string, data: T): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((listener) => listener(data));
    }
  }

  once(event: string, listener: EventListener<T>): void {
    const onceListener: EventListener<T> = (data) => {
      listener(data);
      this.off(event, onceListener);
    };
    this.on(event, onceListener);
  }
}

// Example: Order processing system
interface OrderEvent {
  orderId: string;
  status: string;
  timestamp: Date;
}

class OrderService extends EventEmitter<OrderEvent> {
  processOrder(orderId: string): void {
    console.log(`Processing order ${orderId}`);

    // Emit events at different stages
    this.emit('order:created', {
      orderId,
      status: 'created',
      timestamp: new Date(),
    });

    setTimeout(() => {
      this.emit('order:processing', {
        orderId,
        status: 'processing',
        timestamp: new Date(),
      });
    }, 1000);

    setTimeout(() => {
      this.emit('order:completed', {
        orderId,
        status: 'completed',
        timestamp: new Date(),
      });
    }, 2000);
  }
}

// Usage
const orderService = new OrderService();

// Subscribe to events
orderService.on('order:created', (event) => {
  console.log(`📝 Order created: ${event.orderId}`);
});

orderService.on('order:processing', (event) => {
  console.log(`⚙️ Order processing: ${event.orderId}`);
});

orderService.on('order:completed', (event) => {
  console.log(`✅ Order completed: ${event.orderId}`);
  // Send confirmation email
  // Update inventory
  // Trigger shipping
});

// One-time listener
orderService.once('order:completed', (event) => {
  console.log(`🎉 First order completed: ${event.orderId}`);
});

orderService.processOrder('ORD-123');
```

**Rust Example (Channel-Based Observer):**

```rust
use std::sync::mpsc::{channel, Sender};

// Event types
#[derive(Clone, Debug)]
enum Event {
    UserLoggedIn { user_id: String },
    UserLoggedOut { user_id: String },
    DataUpdated { key: String, value: String },
}

// Observer trait
trait Observer: Send {
    fn notify(&self, event: Event);
}

// Concrete observers
struct LogObserver {
    tx: Sender<Event>,
}

impl Observer for LogObserver {
    fn notify(&self, event: Event) {
        self.tx.send(event).unwrap();
    }
}

// Subject
struct EventBus {
    observers: Vec<Box<dyn Observer>>,
}

impl EventBus {
    fn new() -> Self {
        Self {
            observers: Vec::new(),
        }
    }

    fn subscribe(&mut self, observer: Box<dyn Observer>) {
        self.observers.push(observer);
    }

    fn publish(&self, event: Event) {
        for observer in &self.observers {
            observer.notify(event.clone());
        }
    }
}

// Usage
fn main() {
    let (tx, rx) = channel();
    let mut bus = EventBus::new();

    // Add observer
    bus.subscribe(Box::new(LogObserver { tx: tx.clone() }));

    // Spawn logger thread
    std::thread::spawn(move || {
        while let Ok(event) = rx.recv() {
            println!("LOG: {:?}", event);
        }
    });

    // Publish events
    bus.publish(Event::UserLoggedIn {
        user_id: "user123".to_string(),
    });

    bus.publish(Event::DataUpdated {
        key: "config".to_string(),
        value: "enabled".to_string(),
    });

    std::thread::sleep(std::time::Duration::from_millis(100));
}
```

### When to Use

✅ **Use Observer when:**
- Changes to one object require changing others
- Don't know how many objects need to be updated
- Object should notify without knowing who they are
- Event-driven systems

❌ **Don't use when:**
- Direct method calls suffice
- Too many notifications cause performance issues
- Order of notifications matters (use Mediator)

---

## Command Pattern

**Gang of Four pattern**. Encapsulate request as object, letting you parameterize clients with different requests, queue or log requests, and support undoable operations.

### Problem

Need to parameterize objects with operations, queue operations, or implement undo/redo:

```python
# Bad - operations hard-coded
button.onClick = save_document()  # Can't undo, queue, or log
```

### Solution

Encapsulate operations as objects:

```
┌─────────────┐
│   Invoker   │
└──────┬──────┘
       │ has
       ▼
┌─────────────────┐
│    Command      │ (interface)
│ + execute()     │
│ + undo()        │
└─────────────────┘
       △
       │ implements
       │
┌──────┴───────────┐
│ ConcreteCommand  │
│ + execute()      │───► operates on ──►┌──────────────┐
│ + undo()         │                    │   Receiver   │
└──────────────────┘                    └──────────────┘
```

### Implementation

**Python Example (Text Editor with Undo/Redo):**

```python
from abc import ABC, abstractmethod
from typing import List

# Command interface
class Command(ABC):
    @abstractmethod
    def execute(self) -> None:
        pass

    @abstractmethod
    def undo(self) -> None:
        pass

# Receiver
class TextEditor:
    def __init__(self):
        self.content = ""

    def insert_text(self, text: str, position: int) -> None:
        self.content = self.content[:position] + text + self.content[position:]

    def delete_text(self, position: int, length: int) -> None:
        self.content = self.content[:position] + self.content[position + length:]

    def get_text(self) -> str:
        return self.content

# Concrete commands
class InsertCommand(Command):
    def __init__(self, editor: TextEditor, text: str, position: int):
        self.editor = editor
        self.text = text
        self.position = position

    def execute(self) -> None:
        self.editor.insert_text(self.text, self.position)

    def undo(self) -> None:
        self.editor.delete_text(self.position, len(self.text))

class DeleteCommand(Command):
    def __init__(self, editor: TextEditor, position: int, length: int):
        self.editor = editor
        self.position = position
        self.length = length
        self.deleted_text = ""

    def execute(self) -> None:
        self.deleted_text = self.editor.content[self.position:self.position + self.length]
        self.editor.delete_text(self.position, self.length)

    def undo(self) -> None:
        self.editor.insert_text(self.deleted_text, self.position)

# Invoker
class CommandManager:
    def __init__(self):
        self.history: List[Command] = []
        self.current = -1

    def execute(self, command: Command) -> None:
        # Remove any commands after current position
        self.history = self.history[:self.current + 1]

        command.execute()
        self.history.append(command)
        self.current += 1

    def undo(self) -> bool:
        if self.current < 0:
            return False

        command = self.history[self.current]
        command.undo()
        self.current -= 1
        return True

    def redo(self) -> bool:
        if self.current >= len(self.history) - 1:
            return False

        self.current += 1
        command = self.history[self.current]
        command.execute()
        return True

# Usage
editor = TextEditor()
manager = CommandManager()

# Execute commands
manager.execute(InsertCommand(editor, "Hello", 0))
print(f"After insert: '{editor.get_text()}'")  # "Hello"

manager.execute(InsertCommand(editor, " World", 5))
print(f"After insert: '{editor.get_text()}'")  # "Hello World"

manager.execute(DeleteCommand(editor, 5, 6))
print(f"After delete: '{editor.get_text()}'")  # "Hello"

# Undo
manager.undo()
print(f"After undo: '{editor.get_text()}'")  # "Hello World"

# Redo
manager.redo()
print(f"After redo: '{editor.get_text()}'")  # "Hello"
```

**Java Example (CQRS Commands):**

```java
// Command interface
public interface Command<T> {
    T execute();
}

// Commands
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

public class UpdateUserCommand implements Command<User> {
    private final String userId;
    private final String newEmail;
    private final UserRepository repository;

    public UpdateUserCommand(String userId, String newEmail, UserRepository repository) {
        this.userId = userId;
        this.newEmail = newEmail;
        this.repository = repository;
    }

    @Override
    public User execute() {
        User user = repository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));
        user.setEmail(newEmail);
        repository.save(user);
        return user;
    }
}

public class DeleteUserCommand implements Command<Void> {
    private final String userId;
    private final UserRepository repository;

    public DeleteUserCommand(String userId, UserRepository repository) {
        this.userId = userId;
        this.repository = repository;
    }

    @Override
    public Void execute() {
        repository.deleteById(userId);
        return null;
    }
}

// Command bus
public class CommandBus {
    private final Map<Class<? extends Command>, CommandHandler> handlers = new HashMap<>();

    public <T, C extends Command<T>> void register(Class<C> commandClass, CommandHandler<T, C> handler) {
        handlers.put(commandClass, handler);
    }

    public <T> T dispatch(Command<T> command) {
        CommandHandler<T, Command<T>> handler = handlers.get(command.getClass());
        if (handler == null) {
            throw new IllegalArgumentException("No handler for " + command.getClass());
        }
        return handler.handle(command);
    }
}

// Usage
public class Application {
    public static void main(String[] args) {
        UserRepository repo = new UserRepositoryImpl();
        CommandBus bus = new CommandBus();

        // Register handlers
        bus.register(CreateUserCommand.class, cmd -> cmd.execute());
        bus.register(UpdateUserCommand.class, cmd -> cmd.execute());
        bus.register(DeleteUserCommand.class, cmd -> cmd.execute());

        // Dispatch commands
        User user = bus.dispatch(new CreateUserCommand("johndoe", "john@example.com", repo));
        System.out.println("Created user: " + user.getId());

        bus.dispatch(new UpdateUserCommand(user.getId(), "newemail@example.com", repo));
        System.out.println("Updated user email");

        bus.dispatch(new DeleteUserCommand(user.getId(), repo));
        System.out.println("Deleted user");
    }
}
```

### When to Use

✅ **Use Command when:**
- Need to parameterize objects with operations
- Want to queue operations
- Need undo/redo functionality
- CQRS architecture
- Logging/auditing operations

❌ **Don't use when:**
- Simple method calls suffice
- No need for queuing/undo
- Adds unnecessary complexity

---

## State Pattern

**Gang of Four pattern**. Allow object to alter its behavior when its internal state changes. The object will appear to change its class.

### Problem

State-dependent behavior implemented with complex conditionals:

```python
# Bad - complex state logic
class Order:
    def cancel(self):
        if self.state == "pending":
            self.state = "cancelled"
        elif self.state == "processing":
            raise Exception("Cannot cancel processing order")
        elif self.state == "shipped":
            raise Exception("Cannot cancel shipped order")
        # Adding new states requires modifying all methods!
```

### Solution

Encapsulate state-specific behavior in separate state classes:

```
┌─────────────┐
│   Context   │
│ + request() │───► delegates ──►┌──────────────┐
└─────────────┘                  │    State     │ (interface)
       │                         │ + handle()   │
       │ changes                 └──────────────┘
       │                                △
       │                                │ implements
       │                         ┌──────┴──────┬─────────┐
       │                         │             │         │
       └───────────────────────►StateA      StateB   StateC
```

### Implementation

**Python Example (Order State Machine):**

```python
from abc import ABC, abstractmethod

# State interface
class OrderState(ABC):
    @abstractmethod
    def confirm(self, order: 'Order') -> None:
        pass

    @abstractmethod
    def cancel(self, order: 'Order') -> None:
        pass

    @abstractmethod
    def ship(self, order: 'Order') -> None:
        pass

    @abstractmethod
    def deliver(self, order: 'Order') -> None:
        pass

# Concrete states
class PendingState(OrderState):
    def confirm(self, order: 'Order') -> None:
        print("Confirming order")
        order.set_state(ProcessingState())

    def cancel(self, order: 'Order') -> None:
        print("Cancelling order")
        order.set_state(CancelledState())

    def ship(self, order: 'Order') -> None:
        raise ValueError("Cannot ship pending order")

    def deliver(self, order: 'Order') -> None:
        raise ValueError("Cannot deliver pending order")

class ProcessingState(OrderState):
    def confirm(self, order: 'Order') -> None:
        raise ValueError("Order already confirmed")

    def cancel(self, order: 'Order') -> None:
        print("Cannot cancel processing order")

    def ship(self, order: 'Order') -> None:
        print("Shipping order")
        order.set_state(ShippedState())

    def deliver(self, order: 'Order') -> None:
        raise ValueError("Cannot deliver unshipped order")

class ShippedState(OrderState):
    def confirm(self, order: 'Order') -> None:
        raise ValueError("Order already confirmed")

    def cancel(self, order: 'Order') -> None:
        raise ValueError("Cannot cancel shipped order")

    def ship(self, order: 'Order') -> None:
        raise ValueError("Order already shipped")

    def deliver(self, order: 'Order') -> None:
        print("Delivering order")
        order.set_state(DeliveredState())

class DeliveredState(OrderState):
    def confirm(self, order: 'Order') -> None:
        raise ValueError("Order already delivered")

    def cancel(self, order: 'Order') -> None:
        raise ValueError("Cannot cancel delivered order")

    def ship(self, order: 'Order') -> None:
        raise ValueError("Order already delivered")

    def deliver(self, order: 'Order') -> None:
        raise ValueError("Order already delivered")

class CancelledState(OrderState):
    def confirm(self, order: 'Order') -> None:
        raise ValueError("Cannot confirm cancelled order")

    def cancel(self, order: 'Order') -> None:
        raise ValueError("Order already cancelled")

    def ship(self, order: 'Order') -> None:
        raise ValueError("Cannot ship cancelled order")

    def deliver(self, order: 'Order') -> None:
        raise ValueError("Cannot deliver cancelled order")

# Context
class Order:
    def __init__(self, order_id: str):
        self.order_id = order_id
        self._state: OrderState = PendingState()

    def set_state(self, state: OrderState) -> None:
        print(f"State changed to: {state.__class__.__name__}")
        self._state = state

    def confirm(self) -> None:
        self._state.confirm(self)

    def cancel(self) -> None:
        self._state.cancel(self)

    def ship(self) -> None:
        self._state.ship(self)

    def deliver(self) -> None:
        self._state.deliver(self)

# Usage
order = Order("ORD-123")
order.confirm()   # PendingState -> ProcessingState
order.ship()      # ProcessingState -> ShippedState
order.deliver()   # ShippedState -> DeliveredState
# order.cancel() # Would raise ValueError
```

### When to Use

✅ **Use State when:**
- Object behavior depends on state
- Large conditional statements depend on state
- State transitions are well-defined

❌ **Don't use when:**
- Few states or simple transitions
- State logic is trivial

---

## Chain of Responsibility

**Gang of Four pattern**. Avoid coupling sender of request to receiver by giving more than one object chance to handle request. Chain receiving objects and pass request along chain until object handles it.

### Problem

Request handler depends on runtime conditions:

```python
# Bad - rigid request handling
def handle_request(request):
    if can_handle_level1(request):
        process_level1(request)
    elif can_handle_level2(request):
        process_level2(request)
    # Hard to add new handlers!
```

### Solution

Chain handlers, each decides whether to process or pass to next:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Handler1   │────►│  Handler2   │────►│  Handler3   │
│ + handle()  │next │ + handle()  │next │ + handle()  │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Implementation

**Python Example (HTTP Middleware):**

```python
from abc import ABC, abstractmethod
from typing import Optional, Dict

# Handler interface
class Middleware(ABC):
    def __init__(self):
        self._next: Optional[Middleware] = None

    def set_next(self, handler: 'Middleware') -> 'Middleware':
        self._next = handler
        return handler

    @abstractmethod
    def handle(self, request: Dict) -> Optional[Dict]:
        if self._next:
            return self._next.handle(request)
        return None

# Concrete handlers
class AuthenticationMiddleware(Middleware):
    def handle(self, request: Dict) -> Optional[Dict]:
        if "auth_token" not in request:
            return {"status": 401, "error": "Unauthorized"}

        print("✓ Authentication passed")
        return super().handle(request)

class RateLimitMiddleware(Middleware):
    def __init__(self, limit: int = 100):
        super().__init__()
        self.limit = limit
        self.requests = 0

    def handle(self, request: Dict) -> Optional[Dict]:
        self.requests += 1
        if self.requests > self.limit:
            return {"status": 429, "error": "Rate limit exceeded"}

        print(f"✓ Rate limit check ({self.requests}/{self.limit})")
        return super().handle(request)

class ValidationMiddleware(Middleware):
    def handle(self, request: Dict) -> Optional[Dict]:
        if "user_id" not in request:
            return {"status": 400, "error": "Missing user_id"}

        print("✓ Validation passed")
        return super().handle(request)

class LoggingMiddleware(Middleware):
    def handle(self, request: Dict) -> Optional[Dict]:
        print(f"📝 Logging request: {request}")
        result = super().handle(request)
        print(f"📝 Logging response: {result}")
        return result

# Final handler
class RequestHandler(Middleware):
    def handle(self, request: Dict) -> Optional[Dict]:
        print("✅ Processing request")
        return {"status": 200, "data": "Success"}

# Build chain
auth = AuthenticationMiddleware()
rate_limit = RateLimitMiddleware(limit=5)
validation = ValidationMiddleware()
logging = LoggingMiddleware()
handler = RequestHandler()

auth.set_next(rate_limit).set_next(validation).set_next(logging).set_next(handler)

# Process request
request = {
    "auth_token": "token123",
    "user_id": "user1",
    "action": "get_data"
}

response = auth.handle(request)
print(f"\nFinal response: {response}")
```

### When to Use

✅ **Use Chain of Responsibility when:**
- Multiple objects can handle request
- Don't know which object should handle
- Want to issue request without specifying receiver
- Middleware pipelines

❌ **Don't use when:**
- Single handler always processes
- Order doesn't matter (use Observer)

---

## Template Method

**Gang of Four pattern**. Define skeleton of algorithm in operation, deferring some steps to subclasses. Template Method lets subclasses redefine certain steps without changing algorithm structure.

### Problem

Similar algorithms with variations in steps:

```python
# Duplicated algorithm structure
def process_csv():
    open_file()
    parse_csv()
    validate_data()
    save_to_db()

def process_json():
    open_file()
    parse_json()  # Different!
    validate_data()
    save_to_db()
```

### Solution

Template method defines skeleton, subclasses implement steps:

```python
from abc import ABC, abstractmethod

class DataProcessor(ABC):
    # Template method
    def process(self, filename: str) -> None:
        self.open_file(filename)
        data = self.parse_data()
        self.validate(data)
        self.save(data)
        self.close_file()

    def open_file(self, filename: str) -> None:
        print(f"Opening file: {filename}")

    @abstractmethod
    def parse_data(self) -> dict:
        pass

    def validate(self, data: dict) -> None:
        print("Validating data")

    def save(self, data: dict) -> None:
        print("Saving data")

    def close_file(self) -> None:
        print("Closing file")

# Concrete implementations
class CSVProcessor(DataProcessor):
    def parse_data(self) -> dict:
        print("Parsing CSV")
        return {"format": "CSV"}

class JSONProcessor(DataProcessor):
    def parse_data(self) -> dict:
        print("Parsing JSON")
        return {"format": "JSON"}

# Usage
csv = CSVProcessor()
csv.process("data.csv")

json = JSONProcessor()
json.process("data.json")
```

### When to Use

✅ **Use Template Method when:**
- Multiple classes have similar algorithms
- Want to control extension points
- Framework hooks needed

❌ **Don't use when:**
- Prefer composition over inheritance
- No common algorithm structure

---

## Saga Pattern (Modern)

**Not a Gang of Four pattern**. Manage distributed transactions across microservices using sequence of local transactions with compensating actions.

### Problem

Distributed transactions across microservices fail without ACID guarantees:

```
Service A ✓ → Service B ✓ → Service C ✗
                              ↓
                         Inconsistent state!
```

### Solution

Saga coordinates compensating transactions on failure:

```python
from abc import ABC, abstractmethod
from typing import List, Dict

class SagaStep(ABC):
    @abstractmethod
    async def execute(self, context: Dict) -> Dict:
        """Execute forward action"""
        pass

    @abstractmethod
    async def compensate(self, context: Dict) -> None:
        """Execute compensating action (rollback)"""
        pass

# Concrete steps
class ReserveInventoryStep(SagaStep):
    async def execute(self, context: Dict) -> Dict:
        print(f"Reserving inventory for order {context['order_id']}")
        context['inventory_reserved'] = True
        return context

    async def compensate(self, context: Dict) -> None:
        print(f"Releasing inventory for order {context['order_id']}")

class ProcessPaymentStep(SagaStep):
    async def execute(self, context: Dict) -> Dict:
        print(f"Processing payment for order {context['order_id']}")
        context['payment_id'] = "payment-123"
        return context

    async def compensate(self, context: Dict) -> None:
        print(f"Refunding payment {context.get('payment_id')}")

class CreateShipmentStep(SagaStep):
    async def execute(self, context: Dict) -> Dict:
        print(f"Creating shipment for order {context['order_id']}")
        # Simulate failure
        raise Exception("Shipment service unavailable")

    async def compensate(self, context: Dict) -> None:
        print(f"Cancelling shipment for order {context['order_id']}")

# Saga orchestrator
class SagaOrchestrator:
    def __init__(self):
        self.steps: List[SagaStep] = []

    def add_step(self, step: SagaStep) -> 'SagaOrchestrator':
        self.steps.append(step)
        return self

    async def execute(self, context: Dict) -> Dict:
        executed_steps = []

        try:
            for step in self.steps:
                context = await step.execute(context)
                executed_steps.append(step)

            print("✅ Saga completed successfully")
            return context

        except Exception as e:
            print(f"❌ Saga failed: {e}")
            print("Rolling back...")

            # Compensate in reverse order
            for step in reversed(executed_steps):
                try:
                    await step.compensate(context)
                except Exception as comp_error:
                    print(f"⚠️ Compensation failed: {comp_error}")

            raise Exception("Saga failed and rolled back")

# Usage
import asyncio

async def main():
    saga = (SagaOrchestrator()
        .add_step(ReserveInventoryStep())
        .add_step(ProcessPaymentStep())
        .add_step(CreateShipmentStep()))

    try:
        await saga.execute({"order_id": "ORD-123"})
    except Exception as e:
        print(f"\nFinal result: {e}")

asyncio.run(main())
```

### When to Use

✅ **Use Saga when:**
- Distributed transactions across microservices
- Need eventual consistency
- No 2PC (two-phase commit) available

❌ **Don't use when:**
- Single database (use ACID transactions)
- Compensating logic too complex

---

## Pattern Comparison

| Pattern | Key Benefit | Complexity |
|---------|-------------|------------|
| **Strategy** | Swappable algorithms | ⭐⭐ |
| **Observer** | Event notification | ⭐⭐ |
| **Command** | Request as object | ⭐⭐ |
| **State** | State-dependent behavior | ⭐⭐⭐ |
| **Chain of Responsibility** | Sequential handlers | ⭐⭐⭐ |
| **Template Method** | Algorithm skeleton | ⭐⭐ |
| **Iterator** | Sequential access | ⭐⭐ |
| **Mediator** | Centralized interaction | ⭐⭐⭐ |
| **Memento** | State capture | ⭐⭐ |
| **Visitor** | External operations | ⭐⭐⭐⭐ |
| **Saga** | Distributed transactions | ⭐⭐⭐⭐ |

---

## Common Mistakes

### 1. Strategy vs State Confusion
- **Strategy**: Behavior chosen by client
- **State**: Behavior changes automatically with state

### 2. Too Many Observers
- Performance degradation with hundreds of observers
- Consider Event Aggregator pattern

### 3. Command Without Undo
- Command pattern overhead without undo benefit
- Use simple method calls instead

---

## References

1. Gang of Four - *Design Patterns* (1994)
2. Martin Fowler - *Refactoring* (1999)
3. Chris Richardson - *Microservices Patterns* (2018)

---

**Last Updated:** 2025-10-20
**Version:** 1.0
