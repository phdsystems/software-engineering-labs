# DRY Principle (Don't Repeat Yourself) Deep Dive

**Purpose:** Comprehensive guide to the DRY principle - reducing duplication for maintainable code
**Note:** All concepts are language-agnostic; examples in Python, Java, TypeScript, Go, and Rust
**Organization:** PHD Systems & PHD Labs
**Version:** 1.0
**Date:** 2025-10-20

---

## TL;DR

**DRY (Don't Repeat Yourself) means every piece of knowledge should have a single representation in your system**. **Not just code** → Also applies to logic, data, configuration, and documentation. **The real goal** → Eliminate duplication of knowledge, not necessarily code similarity. **When to apply** → After seeing duplication 2-3 times (Rule of Three). **When NOT to apply** → Tests (clarity > DRY), coincidental similarity (different concepts that look alike), performance-critical paths. **How to achieve** → Extract functions, create abstractions, use configuration, leverage inheritance/composition. **Common trap** → Premature abstraction ("over-DRYing") is worse than duplication. **Golden rule** → Prefer duplication over the wrong abstraction. **Result** → Changes in one place, reduced bugs, easier maintenance.

---

## Table of Contents

- [Overview](#overview)
- [What Is Duplication?](#what-is-duplication)
  - [Types of Duplication](#types-of-duplication)
  - [Knowledge vs Code Duplication](#knowledge-vs-code-duplication)
- [Why DRY Matters](#why-dry-matters)
- [How to Eliminate Duplication](#how-to-eliminate-duplication)
  - [1. Extract Functions/Methods](#1-extract-functionsmethods)
  - [2. Create Classes/Modules](#2-create-classesmodules)
  - [3. Use Configuration](#3-use-configuration)
  - [4. Leverage Inheritance/Composition](#4-leverage-inheritancecomposition)
  - [5. Metaprogramming and Code Generation](#5-metaprogramming-and-code-generation)
- [When Duplication Is Acceptable](#when-duplication-is-acceptable)
- [The Rule of Three](#the-rule-of-three)
- [Over-DRYing: When DRY Goes Wrong](#over-drying-when-dry-goes-wrong)
- [Multi-Language Examples](#multi-language-examples)
- [DRY in Different Contexts](#dry-in-different-contexts)
- [Best Practices](#best-practices)
- [Common Mistakes](#common-mistakes)
- [References and Resources](#references-and-resources)

---

## Overview

**DRY (Don't Repeat Yourself)** was coined by Andy Hunt and Dave Thomas in "The Pragmatic Programmer":

> **"Every piece of knowledge must have a single, unambiguous, authoritative representation within a system."**

**Core concept:**
- Knowledge includes: business logic, algorithms, data schemas, configuration
- Single representation means: one place to change when knowledge evolves
- Duplication creates maintenance burden: changes must be synchronized

**DRY is NOT:**
- ❌ About eliminating all code similarity
- ❌ About creating abstractions immediately
- ❌ About never writing similar code

**DRY IS:**
- ✅ About representing knowledge once
- ✅ About making changes in one place
- ✅ About reducing maintenance burden

---

## What Is Duplication?

### Types of Duplication

#### 1. Code Duplication (Most Obvious)

Identical or nearly identical code in multiple places:

```python
# ❌ Code duplication
def calculate_circle_area(radius):
    return 3.14159 * radius * radius

def calculate_circle_circumference(radius):
    return 2 * 3.14159 * radius

def calculate_cylinder_volume(radius, height):
    return 3.14159 * radius * radius * height

# ✅ DRY version
PI = 3.14159

def calculate_circle_area(radius):
    return PI * radius * radius

def calculate_circle_circumference(radius):
    return 2 * PI * radius

def calculate_cylinder_volume(radius, height):
    return calculate_circle_area(radius) * height
```

#### 2. Logic Duplication (Same Algorithm, Different Code)

Same business logic implemented differently:

```java
// ❌ Logic duplication
class OrderValidator {
    public boolean isValidForShipping(Order order) {
        return order.getTotal() > 0 &&
               order.getItems().size() > 0 &&
               order.getCustomer() != null;
    }

    public boolean canProcessPayment(Order order) {
        // Same logic, different implementation
        if (order.getTotal() <= 0) return false;
        if (order.getItems().isEmpty()) return false;
        if (order.getCustomer() == null) return false;
        return true;
    }
}

// ✅ DRY version
class OrderValidator {
    public boolean isValid(Order order) {
        return order.getTotal() > 0 &&
               order.getItems().size() > 0 &&
               order.getCustomer() != null;
    }

    public boolean isValidForShipping(Order order) {
        return isValid(order);
    }

    public boolean canProcessPayment(Order order) {
        return isValid(order);
    }
}
```

#### 3. Data Duplication (Same Information, Multiple Locations)

Storing the same information in multiple places:

```typescript
// ❌ Data duplication
interface User {
    id: string;
    name: string;
    email: string;
    // Stored values
    age: number;
    isAdult: boolean;  // ❌ Derived from age
}

// Problem: age and isAdult can become inconsistent

// ✅ DRY version
interface User {
    id: string;
    name: string;
    email: string;
    age: number;
}

// Compute derived values
function isAdult(user: User): boolean {
    return user.age >= 18;
}

// Or use getter if OOP
class User {
    constructor(
        public id: string,
        public name: string,
        public email: string,
        public age: number
    ) {}

    get isAdult(): boolean {
        return this.age >= 18;
    }
}
```

#### 4. Configuration Duplication

Same configuration values in multiple files:

```yaml
# ❌ Configuration duplication

# api-service.yml
database:
  host: prod-db.example.com
  port: 5432
  pool_size: 20

# worker-service.yml
database:
  host: prod-db.example.com  # Duplicated!
  port: 5432                 # Duplicated!
  pool_size: 20              # Duplicated!

# ✅ DRY version (shared config)

# shared-config.yml
database:
  host: prod-db.example.com
  port: 5432
  pool_size: 20

# api-service.yml
import: shared-config.yml

# worker-service.yml
import: shared-config.yml
```

#### 5. Documentation Duplication

Same information in code comments and documentation:

```python
# ❌ Documentation duplication

def calculate_discount(price: float, discount_percentage: float) -> float:
    """
    Calculate discount amount.

    Args:
        price: Original price
        discount_percentage: Discount percentage (0-100)

    Returns:
        Discounted price
    """
    # Apply discount percentage to price  ❌ Duplicates docstring
    return price * (1 - discount_percentage / 100)

# ✅ DRY version (self-documenting code)

def calculate_discount(price: float, discount_percentage: float) -> float:
    """
    Calculate discount amount.

    Args:
        price: Original price
        discount_percentage: Discount percentage (0-100)

    Returns:
        Discounted price
    """
    discount_multiplier = 1 - discount_percentage / 100
    return price * discount_multiplier
```

### Knowledge vs Code Duplication

**Key insight:** DRY is about knowledge duplication, not code duplication.

**Example of acceptable code similarity:**

```python
# ✅ Similar code, but DIFFERENT knowledge - NOT duplication

def validate_age(age: int) -> bool:
    """Validate human age (0-150)"""
    return 0 < age < 150

def validate_quantity(qty: int) -> bool:
    """Validate order quantity (0-150)"""
    return 0 < qty < 150

# These look identical, but represent DIFFERENT business rules:
# - Max age might change (e.g., 120)
# - Max quantity might change (e.g., 1000)
# They SHOULD be separate because they represent different concepts
```

**Example of knowledge duplication:**

```python
# ❌ Different code, but SAME knowledge - IS duplication

def calculate_order_tax(amount: float) -> float:
    return amount * 0.08  # 8% tax

def display_tax_info():
    print("Current tax rate: 8%")  # Same knowledge!

# ✅ DRY version
TAX_RATE = 0.08

def calculate_order_tax(amount: float) -> float:
    return amount * TAX_RATE

def display_tax_info():
    print(f"Current tax rate: {TAX_RATE * 100}%")
```

---

## Why DRY Matters

### Without DRY:

1. **Maintenance Burden**
   - Change logic in one place → must find and update all duplicates
   - Easy to miss instances → bugs

2. **Bug Multiplication**
   - Fix bug in one place → bug remains in duplicates
   - Inconsistent behavior across system

3. **Cognitive Load**
   - Developers must remember all duplication locations
   - Hard to understand which copy is "authoritative"

4. **Increased Risk**
   - Changes become risky
   - Testing burden multiplies
   - Refactoring is dangerous

### With DRY:

1. **Single Point of Change**
   - Update logic once
   - Changes propagate automatically

2. **Consistent Behavior**
   - One implementation = one behavior
   - No inconsistencies

3. **Easier Understanding**
   - Clear source of truth
   - Less code to read

4. **Reduced Risk**
   - Changes are localized
   - Testing is simpler
   - Refactoring is safer

**Example impact:**

```python
# ❌ Without DRY: Must change in 5 places
# Calculate shipping cost in:
# - OrderService.calculate_total()
# - CheckoutController.preview_order()
# - InvoiceGenerator.generate()
# - ReportService.sales_report()
# - AdminPanel.bulk_update_orders()

# ✅ With DRY: Change in 1 place
class ShippingCalculator:
    def calculate(self, order: Order) -> float:
        # Single implementation
        pass

# All other code calls ShippingCalculator.calculate()
```

---

## How to Eliminate Duplication

### 1. Extract Functions/Methods

**When:** Small duplicated code blocks

**Python example:**

```python
# ❌ Before
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

# ✅ After
def validate_payment_amount(amount: float) -> None:
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

### 2. Create Classes/Modules

**When:** Related duplicated logic

**Java example:**

```java
// ❌ Before: Duplicated validation everywhere
class UserController {
    public void createUser(String email) {
        if (!email.contains("@") || !email.contains(".")) {
            throw new IllegalArgumentException("Invalid email");
        }
        // Create user...
    }
}

class RegistrationService {
    public void register(String email) {
        if (!email.contains("@") || !email.contains(".")) {
            throw new IllegalArgumentException("Invalid email");
        }
        // Register...
    }
}

// ✅ After: Extract to dedicated class
class EmailValidator {
    public void validate(String email) {
        if (email == null || !email.contains("@") || !email.contains(".")) {
            throw new IllegalArgumentException("Invalid email");
        }
    }
}

class UserController {
    private final EmailValidator emailValidator;

    public UserController(EmailValidator emailValidator) {
        this.emailValidator = emailValidator;
    }

    public void createUser(String email) {
        emailValidator.validate(email);
        // Create user...
    }
}

class RegistrationService {
    private final EmailValidator emailValidator;

    public RegistrationService(EmailValidator emailValidator) {
        this.emailValidator = emailValidator;
    }

    public void register(String email) {
        emailValidator.validate(email);
        // Register...
    }
}
```

### 3. Use Configuration

**When:** Duplicated constants or settings

**Go example:**

```go
// ❌ Before: Magic numbers everywhere
func calculateDiscount(orderType string, amount float64) float64 {
    switch orderType {
    case "regular":
        return amount * 0.95  // 5% discount
    case "premium":
        return amount * 0.90  // 10% discount
    case "vip":
        return amount * 0.85  // 15% discount
    default:
        return amount
    }
}

func displayDiscountInfo(orderType string) string {
    switch orderType {
    case "regular":
        return "You save 5%"   // Duplicated knowledge!
    case "premium":
        return "You save 10%"  // Duplicated knowledge!
    case "vip":
        return "You save 15%"  // Duplicated knowledge!
    default:
        return "No discount"
    }
}

// ✅ After: Configuration-driven
type DiscountConfig struct {
    Regular float64
    Premium float64
    VIP     float64
}

var discounts = DiscountConfig{
    Regular: 0.05,
    Premium: 0.10,
    VIP:     0.15,
}

func calculateDiscount(orderType string, amount float64) float64 {
    var discountRate float64
    switch orderType {
    case "regular":
        discountRate = discounts.Regular
    case "premium":
        discountRate = discounts.Premium
    case "vip":
        discountRate = discounts.VIP
    default:
        discountRate = 0
    }
    return amount * (1 - discountRate)
}

func displayDiscountInfo(orderType string) string {
    var discountRate float64
    switch orderType {
    case "regular":
        discountRate = discounts.Regular
    case "premium":
        discountRate = discounts.Premium
    case "vip":
        discountRate = discounts.VIP
    default:
        return "No discount"
    }
    return fmt.Sprintf("You save %.0f%%", discountRate*100)
}
```

### 4. Leverage Inheritance/Composition

**When:** Duplicated behavior across related types

**TypeScript example:**

```typescript
// ❌ Before: Duplicated methods
class BlogPost {
    title: string;
    content: string;
    createdAt: Date;

    formatDate(): string {
        return this.createdAt.toLocaleDateString();
    }

    isRecent(): boolean {
        const daysSinceCreation = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceCreation < 7;
    }
}

class Comment {
    text: string;
    createdAt: Date;

    formatDate(): string {
        return this.createdAt.toLocaleDateString();  // Duplicated!
    }

    isRecent(): boolean {
        const daysSinceCreation = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceCreation < 7;  // Duplicated!
    }
}

// ✅ After: Composition (preferred over inheritance)
class DateHelper {
    static format(date: Date): string {
        return date.toLocaleDateString();
    }

    static isRecent(date: Date, days: number = 7): boolean {
        const daysSince = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince < days;
    }
}

class BlogPost {
    title: string;
    content: string;
    createdAt: Date;

    formatDate(): string {
        return DateHelper.format(this.createdAt);
    }

    isRecent(): boolean {
        return DateHelper.isRecent(this.createdAt);
    }
}

class Comment {
    text: string;
    createdAt: Date;

    formatDate(): string {
        return DateHelper.format(this.createdAt);
    }

    isRecent(): boolean {
        return DateHelper.isRecent(this.createdAt);
    }
}
```

### 5. Metaprogramming and Code Generation

**When:** Repetitive boilerplate code

**Rust example with macros:**

```rust
// ❌ Before: Repetitive builder pattern code
struct User {
    name: String,
    email: String,
    age: u32,
}

impl User {
    fn new() -> UserBuilder {
        UserBuilder::default()
    }
}

#[derive(Default)]
struct UserBuilder {
    name: Option<String>,
    email: Option<String>,
    age: Option<u32>,
}

impl UserBuilder {
    fn name(mut self, name: String) -> Self {
        self.name = Some(name);
        self
    }

    fn email(mut self, email: String) -> Self {
        self.email = Some(email);
        self
    }

    fn age(mut self, age: u32) -> Self {
        self.age = Some(age);
        self
    }

    fn build(self) -> User {
        User {
            name: self.name.unwrap(),
            email: self.email.unwrap(),
            age: self.age.unwrap(),
        }
    }
}

// ✅ After: Use derive macro (if using typed-builder crate)
use typed_builder::TypedBuilder;

#[derive(TypedBuilder)]
struct User {
    name: String,
    email: String,
    age: u32,
}

// Usage (same as before, but no boilerplate!)
let user = User::builder()
    .name("Alice".to_string())
    .email("alice@example.com".to_string())
    .age(30)
    .build();
```

---

## When Duplication Is Acceptable

### 1. Tests

**Duplication in tests is often clearer than complex test helpers.**

```python
# ✅ GOOD: Duplicated test setup for clarity
def test_user_creation_with_valid_data():
    # Setup
    user = User(name="Alice", email="alice@example.com", age=30)

    # Test
    assert user.name == "Alice"
    assert user.email == "alice@example.com"
    assert user.age == 30

def test_user_creation_with_different_data():
    # Setup (duplicated from above - that's OK!)
    user = User(name="Bob", email="bob@example.com", age=25)

    # Test
    assert user.name == "Bob"
    assert user.email == "bob@example.com"
    assert user.age == 25

# Each test is independent and clear
# Shared test helpers can make tests harder to understand
```

**When to extract test helpers:**
- ✅ Complex setup logic (database seeding, API mocking)
- ✅ Reusable assertions
- ❌ Simple object creation (prefer duplication for clarity)

### 2. Configuration Files

**Environment-specific configs naturally differ:**

```yaml
# development.yml
database:
  host: localhost
  port: 5432
  pool_size: 5

# production.yml
database:
  host: prod-db.example.com  # Different from dev
  port: 5432                 # Same as dev
  pool_size: 100             # Different from dev

# This is NOT duplication - these are different configurations
# Use inheritance/includes for truly shared values
```

### 3. Coincidental Duplication

**Code that looks similar but represents different concepts:**

```java
// ✅ GOOD: Keep separate - different business concepts

class PasswordValidator {
    public boolean isValid(String password) {
        // Password must be 8-50 characters
        return password.length() >= 8 && password.length() <= 50;
    }
}

class UsernameValidator {
    public boolean isValid(String username) {
        // Username must be 3-20 characters
        return username.length() >= 3 && username.length() <= 20;
    }
}

// DON'T combine these into:
// class StringValidator {
//     public boolean isValid(String str, int min, int max) { ... }
// }
//
// Why? Password and username length rules are DIFFERENT KNOWLEDGE
// They might evolve independently (e.g., passwords require 12+ chars)
```

### 4. Performance-Critical Code

**Sometimes duplication improves performance:**

```python
# ✅ Acceptable duplication for performance

def process_small_array(arr):
    # Optimized for small arrays
    result = []
    for item in arr:
        result.append(item * 2)
    return result

def process_large_array(arr):
    # Optimized for large arrays (numpy)
    import numpy as np
    return np.array(arr) * 2

# Could be DRY with:
# def process_array(arr):
#     if len(arr) < 100:
#         return [item * 2 for item in arr]
#     else:
#         import numpy as np
#         return np.array(arr) * 2
#
# But separate functions may be clearer for different use cases
```

### 5. Temporary Duplication During Refactoring

**It's OK to have duplication while refactoring:**

```typescript
// Step 1: Duplicate code to create new implementation
function calculateShippingOld(order: Order): number {
    // Old logic (keeping for now)
    return order.weight * 0.5;
}

function calculateShippingNew(order: Order): number {
    // New logic (testing in parallel)
    return order.weight * 0.5 + order.distance * 0.1;
}

// Step 2: Use feature flag to test new version
function calculateShipping(order: Order): number {
    if (useNewShippingCalculation) {
        return calculateShippingNew(order);
    }
    return calculateShippingOld(order);
}

// Step 3: Once validated, remove old version
function calculateShipping(order: Order): number {
    return order.weight * 0.5 + order.distance * 0.1;
}
```

---

## The Rule of Three

**Don't abstract until you see duplication three times.**

### Why Three?

1. **One instance:** No duplication
2. **Two instances:** Might be coincidental
3. **Three instances:** Pattern confirmed → abstract

**Example:**

```python
# First time: Write code
def send_welcome_email(user):
    subject = "Welcome!"
    body = f"Hello {user.name}, welcome to our platform!"
    send_email(user.email, subject, body)

# Second time: Copy-paste is OK (for now)
def send_password_reset_email(user):
    subject = "Password Reset"
    body = f"Hello {user.name}, click here to reset your password."
    send_email(user.email, subject, body)

# Third time: Now abstract!
def send_password_reset_email(user):
    subject = "Password Reset"
    body = f"Hello {user.name}, click here to reset your password."
    send_email(user.email, subject, body)

def send_order_confirmation_email(user, order):
    subject = "Order Confirmation"
    body = f"Hello {user.name}, your order {order.id} is confirmed."
    send_email(user.email, subject, body)

# ✅ Now extract common pattern
def send_user_email(user, subject, body_template, **kwargs):
    body = body_template.format(name=user.name, **kwargs)
    send_email(user.email, subject, body)

def send_welcome_email(user):
    send_user_email(user, "Welcome!", "Hello {name}, welcome to our platform!")

def send_password_reset_email(user):
    send_user_email(user, "Password Reset", "Hello {name}, click here to reset your password.")

def send_order_confirmation_email(user, order):
    send_user_email(user, "Order Confirmation", "Hello {name}, your order {order_id} is confirmed.", order_id=order.id)
```

---

## Over-DRYing: When DRY Goes Wrong

### Premature Abstraction

**Problem:** Creating abstractions before patterns are clear

```typescript
// ❌ BAD: Over-abstracted too early

// You have two functions:
function calculateUserDiscount(user: User): number {
    return user.totalPurchases > 1000 ? 0.1 : 0;
}

function calculateProductDiscount(product: Product): number {
    return product.onSale ? 0.2 : 0;
}

// You create a "generic" discount calculator:
type DiscountStrategy<T> = (item: T, rules: DiscountRule<T>[]) => number;

interface DiscountRule<T> {
    condition: (item: T) => boolean;
    discount: number;
}

class DiscountCalculator<T> {
    constructor(private rules: DiscountRule<T>[]) {}

    calculate(item: T): number {
        for (const rule of this.rules) {
            if (rule.condition(item)) {
                return rule.discount;
            }
        }
        return 0;
    }
}

// Now simple discount calculations require complex setup!
const userCalculator = new DiscountCalculator<User>([
    { condition: (u) => u.totalPurchases > 1000, discount: 0.1 }
]);

// ✅ BETTER: Keep it simple until you need complexity
function calculateUserDiscount(user: User): number {
    return user.totalPurchases > 1000 ? 0.1 : 0;
}

function calculateProductDiscount(product: Product): number {
    return product.onSale ? 0.2 : 0;
}

// Abstract ONLY when you have 3+ similar patterns
```

### Wrong Abstraction

> **"Duplication is far cheaper than the wrong abstraction."** - Sandi Metz

**Problem:** Forcing unrelated things into the same abstraction

```python
# ❌ BAD: Wrong abstraction

def process_item(item, item_type):
    """Generic processor for users, products, and orders"""
    if item_type == "user":
        # Validate user
        if not item.get("email"):
            raise ValueError("Email required")
        # Save user
        save_to_users_table(item)
    elif item_type == "product":
        # Validate product
        if not item.get("price"):
            raise ValueError("Price required")
        # Save product
        save_to_products_table(item)
        # Update inventory
        update_inventory(item)
    elif item_type == "order":
        # Validate order
        if not item.get("items"):
            raise ValueError("Items required")
        # Process payment
        process_payment(item)
        # Save order
        save_to_orders_table(item)
        # Send notification
        send_order_email(item)

# This is a God function - does too much, hard to understand

# ✅ BETTER: Separate functions for separate concerns

def process_user(user):
    if not user.get("email"):
        raise ValueError("Email required")
    save_to_users_table(user)

def process_product(product):
    if not product.get("price"):
        raise ValueError("Price required")
    save_to_products_table(product)
    update_inventory(product)

def process_order(order):
    if not order.get("items"):
        raise ValueError("Items required")
    process_payment(order)
    save_to_orders_table(order)
    send_order_email(order)

# Clear, focused, maintainable
```

### Over-Parameterization

**Problem:** Adding parameters to make function "more flexible"

```java
// ❌ BAD: Over-parameterized

public String formatMessage(
    String template,
    String prefix,
    String suffix,
    boolean uppercase,
    boolean addTimestamp,
    String timestampFormat,
    boolean addSender,
    String senderName,
    boolean wrapInBrackets
) {
    String result = template;

    if (uppercase) {
        result = result.toUpperCase();
    }

    if (addSender) {
        result = senderName + ": " + result;
    }

    if (prefix != null) {
        result = prefix + result;
    }

    if (suffix != null) {
        result = result + suffix;
    }

    if (addTimestamp) {
        SimpleDateFormat sdf = new SimpleDateFormat(timestampFormat);
        result = "[" + sdf.format(new Date()) + "] " + result;
    }

    if (wrapInBrackets) {
        result = "<<" + result + ">>";
    }

    return result;
}

// Usage is a nightmare:
formatMessage("Hello", null, null, false, true, "HH:mm:ss", false, null, false);

// ✅ BETTER: Builder pattern or separate functions

class MessageFormatter {
    private String message;
    private boolean uppercase = false;
    private String timestamp = null;

    public MessageFormatter(String message) {
        this.message = message;
    }

    public MessageFormatter uppercase() {
        this.uppercase = true;
        return this;
    }

    public MessageFormatter withTimestamp(String format) {
        this.timestamp = format;
        return this;
    }

    public String build() {
        String result = message;

        if (uppercase) {
            result = result.toUpperCase();
        }

        if (timestamp != null) {
            SimpleDateFormat sdf = new SimpleDateFormat(timestamp);
            result = "[" + sdf.format(new Date()) + "] " + result;
        }

        return result;
    }
}

// Usage is clear:
new MessageFormatter("Hello")
    .withTimestamp("HH:mm:ss")
    .build();
```

---

## Multi-Language Examples

### Validation Logic Duplication

**Python:**

```python
# ❌ Duplication
def create_user(name, email):
    if not name or len(name) < 2:
        raise ValueError("Invalid name")
    if not email or "@" not in email:
        raise ValueError("Invalid email")
    # Save user...

def update_user(user_id, name, email):
    if not name or len(name) < 2:
        raise ValueError("Invalid name")
    if not email or "@" not in email:
        raise ValueError("Invalid email")
    # Update user...

# ✅ DRY
def validate_user_data(name, email):
    if not name or len(name) < 2:
        raise ValueError("Invalid name")
    if not email or "@" not in email:
        raise ValueError("Invalid email")

def create_user(name, email):
    validate_user_data(name, email)
    # Save user...

def update_user(user_id, name, email):
    validate_user_data(name, email)
    # Update user...
```

**Java:**

```java
// ❌ Duplication
class UserService {
    public void createUser(String name, String email) {
        if (name == null || name.length() < 2) {
            throw new IllegalArgumentException("Invalid name");
        }
        if (email == null || !email.contains("@")) {
            throw new IllegalArgumentException("Invalid email");
        }
        // Save user...
    }

    public void updateUser(Long userId, String name, String email) {
        if (name == null || name.length() < 2) {
            throw new IllegalArgumentException("Invalid name");
        }
        if (email == null || !email.contains("@")) {
            throw new IllegalArgumentException("Invalid email");
        }
        // Update user...
    }
}

// ✅ DRY
class UserValidator {
    public void validate(String name, String email) {
        if (name == null || name.length() < 2) {
            throw new IllegalArgumentException("Invalid name");
        }
        if (email == null || !email.contains("@")) {
            throw new IllegalArgumentException("Invalid email");
        }
    }
}

class UserService {
    private final UserValidator validator;

    public UserService(UserValidator validator) {
        this.validator = validator;
    }

    public void createUser(String name, String email) {
        validator.validate(name, email);
        // Save user...
    }

    public void updateUser(Long userId, String name, String email) {
        validator.validate(name, email);
        // Update user...
    }
}
```

---

## DRY in Different Contexts

### DRY in Databases

**Schema duplication:**

```sql
-- ❌ BAD: Storing computed values
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    subtotal DECIMAL(10, 2),
    tax DECIMAL(10, 2),
    total DECIMAL(10, 2)  -- ❌ Computed from subtotal + tax
);

-- ✅ GOOD: Use computed columns or views
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    subtotal DECIMAL(10, 2),
    tax DECIMAL(10, 2),
    -- total is computed when queried
);

CREATE VIEW orders_with_total AS
SELECT
    id,
    subtotal,
    tax,
    (subtotal + tax) AS total
FROM orders;
```

### DRY in APIs

**Endpoint duplication:**

```typescript
// ❌ BAD: Duplicated response formatting
app.get('/api/users/:id', (req, res) => {
    const user = getUserById(req.params.id);
    res.json({
        success: true,
        data: user,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/products/:id', (req, res) => {
    const product = getProductById(req.params.id);
    res.json({
        success: true,
        data: product,
        timestamp: new Date().toISOString()  // Duplicated format
    });
});

// ✅ GOOD: Extract response formatter
function successResponse(data: any) {
    return {
        success: true,
        data,
        timestamp: new Date().toISOString()
    };
}

app.get('/api/users/:id', (req, res) => {
    const user = getUserById(req.params.id);
    res.json(successResponse(user));
});

app.get('/api/products/:id', (req, res) => {
    const product = getProductById(req.params.id);
    res.json(successResponse(product));
});
```

### DRY in UI Components

**React example:**

```typescript
// ❌ BAD: Duplicated button styling
function SaveButton() {
    return (
        <button style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px'
        }}>
            Save
        </button>
    );
}

function DeleteButton() {
    return (
        <button style={{
            backgroundColor: '#dc3545',
            color: 'white',
            padding: '10px 20px',  // Duplicated!
            border: 'none',        // Duplicated!
            borderRadius: '4px'    // Duplicated!
        }}>
            Delete
        </button>
    );
}

// ✅ GOOD: Reusable component
interface ButtonProps {
    variant: 'primary' | 'danger';
    children: React.ReactNode;
    onClick?: () => void;
}

function Button({ variant, children, onClick }: ButtonProps) {
    const baseStyle = {
        color: 'white',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '4px'
    };

    const variantStyles = {
        primary: { backgroundColor: '#007bff' },
        danger: { backgroundColor: '#dc3545' }
    };

    return (
        <button
            style={{ ...baseStyle, ...variantStyles[variant] }}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

// Usage
<Button variant="primary">Save</Button>
<Button variant="danger">Delete</Button>
```

---

## Best Practices

### 1. Wait for Patterns to Emerge
- ✅ Don't abstract on first duplication
- ✅ Use Rule of Three (wait for 3 instances)
- ✅ Let real needs drive abstraction

### 2. Prefer Duplication Over Wrong Abstraction
- ✅ "Duplication is cheaper than the wrong abstraction" - Sandi Metz
- ✅ Easy to eliminate duplication later
- ✅ Hard to fix wrong abstraction

### 3. DRY Is About Knowledge, Not Code
- ✅ Focus on eliminating knowledge duplication
- ✅ Accept coincidental code similarity
- ✅ Keep different concepts separate even if code looks similar

### 4. Balance DRY with Other Principles
- ✅ DRY + KISS = Simple, non-repetitive code
- ✅ DRY + SOLID = Well-structured abstractions
- ✅ Don't sacrifice clarity for DRY

### 5. Tests Can Be WET (Write Everything Twice)
- ✅ Duplication in tests aids clarity
- ✅ Each test should be independently understandable
- ✅ Extract helpers only for complex setup

---

## Common Mistakes

### 1. Abstracting Too Early
**Problem:** Creating abstractions before patterns are clear

**Fix:** Wait for duplication to appear 3 times

### 2. Forgetting About Tests
**Problem:** DRYing tests makes them hard to understand

**Fix:** Accept duplication in tests for clarity

### 3. Missing Knowledge Duplication
**Problem:** Focusing only on code duplication

**Fix:** Look for duplicated business logic, data, config

### 4. Creating God Functions
**Problem:** Combining unrelated logic to eliminate duplication

**Fix:** Keep unrelated concerns separate

---

## References and Resources

### Books

1. **"The Pragmatic Programmer"** by Andy Hunt and Dave Thomas
   - Original DRY principle source
   - https://www.amazon.com/Pragmatic-Programmer-journey-mastery-Anniversary/dp/0135957052

2. **"Refactoring"** by Martin Fowler
   - How to eliminate duplication through refactoring
   - https://www.amazon.com/Refactoring-Improving-Existing-Addison-Wesley-Signature/dp/0134757599

3. **"Clean Code"** by Robert C. Martin
   - DRY in context of clean coding practices
   - https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882

### Articles

1. **"The Wrong Abstraction"** by Sandi Metz
   - Why duplication is better than wrong abstraction
   - https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction

2. **"AHA Programming"** by Kent C. Dodds
   - Avoid Hasty Abstractions
   - https://kentcdodds.com/blog/aha-programming

3. **"Rule of Three"** - Martin Fowler
   - When to refactor duplication
   - https://martinfowler.com/bliki/RuleOfThree.html

### Related Guides

- **[Design Principles Overview](overview.md)** - All core principles
- **[SOLID Principles Deep Dive](solid-principle.md)** - SOLID in detail
- **[Separation of Concerns Deep Dive](separation-of-concerns.md)** - Module boundaries

---

*Last Updated: 2025-10-20*
