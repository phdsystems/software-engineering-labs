# Rust Project Setup Guide

**Purpose:** Standard Rust project setup for implementing architecture patterns
**Language:** Rust 1.75+ (2021 edition)
**Build Tool:** Cargo
**Framework:** Actix-web / Rocket / Axum
**Related:** [Architecture Patterns Guide](../examples-overview.md) | [Examples Index](../examples-overview.md)

---

## TL;DR

**Complete Rust project setup** with Cargo, web frameworks, and best practices. **Quick start**: Install Rust via rustup → Use cargo new → Add Actix/Axum → Follow project structure → Use traits for abstractions. **Key features**: Memory safety without GC, zero-cost abstractions, fearless concurrency, ownership system, pattern matching, no null/undefined (Option/Result types), blazing fast performance.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Why Rust?](#why-rust)
3. [Project Initialization](#project-initialization)
4. [Project Structure](#project-structure)
5. [Dependency Management](#dependency-management)
6. [Rust-Specific Features](#rust-specific-features)
7. [Web Framework Examples](#web-framework-examples)
8. [Testing with Rust](#testing-with-rust)
9. [Async/Await and Concurrency](#asyncawait-and-concurrency)
10. [Best Practices](#best-practices)

---

## Prerequisites

### Required Software

```bash
# Rust toolchain (rustc, cargo, rustup)
rustc --version
# rustc 1.75.0 (or later)

cargo --version
# cargo 1.75.0 (or later)
```

### Installation

**All Platforms (Recommended):**
```bash
# Install rustup (Rust toolchain installer)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Source cargo environment
source $HOME/.cargo/env

# Verify installation
rustc --version
cargo --version

# Update Rust (run periodically)
rustup update
```

**Ubuntu/Debian (alternative):**
```bash
sudo apt update
sudo apt install rustc cargo

# But rustup is recommended for latest versions
```

**macOS:**
```bash
brew install rust

# Or use rustup (recommended)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**Windows:**
```powershell
# Download and run rustup-init.exe from https://rustup.rs/
# Or use Chocolatey
choco install rust
```

---

## Why Rust?

### Key Advantages

✅ **Memory Safety** - No null pointers, no data races, no buffer overflows
✅ **Zero-Cost Abstractions** - High-level code with C-like performance
✅ **Ownership System** - Compile-time memory management (no GC pauses)
✅ **Fearless Concurrency** - Thread safety guaranteed at compile time
✅ **Pattern Matching** - Exhaustive, powerful control flow
✅ **No Undefined Behavior** - Compiler prevents most bugs
✅ **Modern Tooling** - Cargo (build + package manager + test runner)
✅ **Cross-Platform** - Compiles to native code for any platform
✅ **Type Safety** - Strong static typing with inference

**Code Example:**

**Rust:**
```rust
// No null pointers - use Option<T>
fn find_user(id: &str) -> Option<User> {
    // Returns Some(user) or None
}

// No exceptions - use Result<T, E>
fn create_user(name: &str, email: &str) -> Result<User, Error> {
    // Returns Ok(user) or Err(error)
}

// Pattern matching (exhaustive)
match find_user("123") {
    Some(user) => println!("Found: {}", user.name),
    None => println!("Not found"),
}

// Memory safety guaranteed at compile time
let s = String::from("hello");
let r = &s;  // Borrow, doesn't take ownership
println!("{}", r);
println!("{}", s);  // Still valid!
```

---

## Project Initialization

### Option 1: Basic Binary Project

```bash
# Create new binary project
cargo new my-rust-project
cd my-rust-project

# Project structure created:
# my-rust-project/
# ├── Cargo.toml
# ├── src/
# │   └── main.rs
# └── .gitignore

# Run the project
cargo run
```

### Option 2: Library Project

```bash
cargo new --lib my-rust-lib
cd my-rust-lib

# Creates src/lib.rs instead of src/main.rs
```

### Option 3: Web API with Actix-web

```bash
cargo new my-actix-api
cd my-actix-api

# Add dependencies to Cargo.toml
cat >> Cargo.toml << 'EOF'

[dependencies]
actix-web = "4.4"
tokio = { version = "1.35", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
EOF

# Run
cargo run
```

### Option 4: Web API with Axum

```bash
cargo new my-axum-api
cd my-axum-api

# Add dependencies
cat >> Cargo.toml << 'EOF'

[dependencies]
axum = "0.7"
tokio = { version = "1.35", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tower = "0.4"
EOF
```

---

## Project Structure

### Standard Rust Project Layout

```
my-rust-project/
├── Cargo.toml                          # Project manifest
├── Cargo.lock                          # Dependency lock file (gitignored for libs)
├── src/
│   ├── main.rs                         # Binary entry point
│   ├── lib.rs                          # Library root (if creating lib)
│   ├── domain/                         # Domain layer (modules)
│   │   ├── mod.rs                      # Module declaration
│   │   ├── user.rs                     # User entity
│   │   └── repository.rs               # Repository trait
│   ├── application/                    # Application layer
│   │   ├── mod.rs
│   │   └── use_cases/
│   │       ├── mod.rs
│   │       └── create_user.rs
│   ├── infrastructure/                 # Infrastructure layer
│   │   ├── mod.rs
│   │   ├── persistence/
│   │   │   ├── mod.rs
│   │   │   └── postgres_repository.rs
│   │   ├── http/
│   │   │   ├── mod.rs
│   │   │   ├── handlers/
│   │   │   │   ├── mod.rs
│   │   │   │   └── user_handler.rs
│   │   │   └── routes.rs
│   │   └── config/
│   │       ├── mod.rs
│   │       └── config.rs
│   └── shared/                         # Shared utilities
│       ├── mod.rs
│       ├── error.rs
│       └── logger.rs
├── tests/                              # Integration tests
│   └── integration_test.rs
├── benches/                            # Benchmarks
│   └── benchmark.rs
├── examples/                           # Example usage
│   └── example.rs
└── target/                             # Build output (gitignored)
```

---

## Dependency Management

### Cargo.toml

```toml
[package]
name = "my-rust-project"
version = "0.1.0"
edition = "2021"
authors = ["Your Name <you@example.com>"]
license = "MIT"
description = "A sample Rust project"

[dependencies]
# Web framework
actix-web = "4.4"

# Async runtime
tokio = { version = "1.35", features = ["full"] }

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Database
sqlx = { version = "0.7", features = ["runtime-tokio-native-tls", "postgres"] }

# Error handling
anyhow = "1.0"
thiserror = "1.0"

# Logging
tracing = "0.1"
tracing-subscriber = "0.3"

# Configuration
config = "0.13"
dotenv = "0.15"

# UUID
uuid = { version = "1.6", features = ["v4", "serde"] }

[dev-dependencies]
# Testing
mockall = "0.12"

[profile.release]
opt-level = 3
lto = true
codegen-units = 1
```

### Common Commands

```bash
# Build project
cargo build

# Build for production (optimized)
cargo build --release

# Run project
cargo run

# Run with release optimizations
cargo run --release

# Check code (faster than build)
cargo check

# Run tests
cargo test

# Run specific test
cargo test test_name

# Update dependencies
cargo update

# Add dependency
cargo add actix-web

# Remove dependency
cargo remove actix-web

# Format code
cargo fmt

# Lint code
cargo clippy

# Generate documentation
cargo doc --open
```

---

## Rust-Specific Features

### 1. Ownership and Borrowing

```rust
// Ownership: each value has one owner
let s1 = String::from("hello");
let s2 = s1;  // Ownership moved to s2
// println!("{}", s1);  // Error! s1 no longer valid

// Borrowing: reference without taking ownership
let s1 = String::from("hello");
let len = calculate_length(&s1);  // Borrow
println!("{} has length {}", s1, len);  // s1 still valid!

fn calculate_length(s: &String) -> usize {
    s.len()
}  // s goes out of scope, but doesn't drop the data (just a reference)

// Mutable borrowing
let mut s = String::from("hello");
change_string(&mut s);

fn change_string(s: &mut String) {
    s.push_str(", world");
}
```

### 2. Structs and Traits

```rust
// Domain entity
#[derive(Debug, Clone)]
pub struct User {
    pub id: String,
    pub name: String,
    pub email: String,
}

impl User {
    pub fn new(name: String, email: String) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            email,
        }
    }

    pub fn is_valid(&self) -> bool {
        !self.name.is_empty() && !self.email.is_empty()
    }
}

// Trait (similar to interfaces)
pub trait UserRepository {
    fn save(&self, user: &User) -> Result<User, Error>;
    fn find_by_id(&self, id: &str) -> Result<Option<User>, Error>;
    fn find_by_email(&self, email: &str) -> Result<Option<User>, Error>;
}

// Implement trait
pub struct PostgresUserRepository {
    pool: PgPool,
}

impl UserRepository for PostgresUserRepository {
    fn save(&self, user: &User) -> Result<User, Error> {
        // Implementation
        Ok(user.clone())
    }

    fn find_by_id(&self, id: &str) -> Result<Option<User>, Error> {
        // Implementation
        Ok(None)
    }

    fn find_by_email(&self, email: &str) -> Result<Option<User>, Error> {
        // Implementation
        Ok(None)
    }
}
```

### 3. Option and Result Types

```rust
// Option<T> - represents optional value (no null!)
fn find_user(id: &str) -> Option<User> {
    if id == "123" {
        Some(User::new("John".to_string(), "john@example.com".to_string()))
    } else {
        None
    }
}

// Pattern matching on Option
match find_user("123") {
    Some(user) => println!("Found: {}", user.name),
    None => println!("Not found"),
}

// Or use if let
if let Some(user) = find_user("123") {
    println!("Found: {}", user.name);
}

// Result<T, E> - for operations that can fail
fn create_user(name: &str, email: &str) -> Result<User, String> {
    if email.contains('@') {
        Ok(User::new(name.to_string(), email.to_string()))
    } else {
        Err("Invalid email".to_string())
    }
}

// Using Result with ? operator (early return on error)
fn save_user(name: &str, email: &str) -> Result<User, String> {
    let user = create_user(name, email)?;  // Returns error if Err
    // Save to database...
    Ok(user)
}
```

### 4. Error Handling with thiserror

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("User not found: {0}")]
    UserNotFound(String),

    #[error("User already exists: {0}")]
    UserAlreadyExists(String),

    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),

    #[error("Invalid input: {0}")]
    ValidationError(String),
}

// Usage
fn get_user(id: &str) -> Result<User, AppError> {
    if id.is_empty() {
        return Err(AppError::ValidationError("ID cannot be empty".to_string()));
    }

    // Find user...
    Err(AppError::UserNotFound(id.to_string()))
}
```

### 5. Pattern Matching

```rust
enum UserRole {
    Admin,
    User,
    Guest,
}

fn get_permissions(role: UserRole) -> Vec<&'static str> {
    match role {
        UserRole::Admin => vec!["read", "write", "delete"],
        UserRole::User => vec!["read", "write"],
        UserRole::Guest => vec!["read"],
    }
}

// Match with guards
fn can_delete(role: UserRole, is_owner: bool) -> bool {
    match (role, is_owner) {
        (UserRole::Admin, _) => true,
        (UserRole::User, true) => true,
        _ => false,
    }
}
```

---

## Web Framework Examples

### Actix-web

```rust
use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct CreateUserRequest {
    name: String,
    email: String,
}

#[derive(Serialize)]
struct UserResponse {
    id: String,
    name: String,
    email: String,
}

async fn create_user(req: web::Json<CreateUserRequest>) -> impl Responder {
    let user = UserResponse {
        id: uuid::Uuid::new_v4().to_string(),
        name: req.name.clone(),
        email: req.email.clone(),
    };

    HttpResponse::Created().json(user)
}

async fn get_user(path: web::Path<String>) -> impl Responder {
    let user_id = path.into_inner();

    let user = UserResponse {
        id: user_id,
        name: "John Doe".to_string(),
        email: "john@example.com".to_string(),
    };

    HttpResponse::Ok().json(user)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .route("/api/users", web::post().to(create_user))
            .route("/api/users/{id}", web::get().to(get_user))
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
```

### Axum Framework

```rust
use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Clone)]
struct AppState {
    // Shared application state
}

#[derive(Deserialize)]
struct CreateUserRequest {
    name: String,
    email: String,
}

#[derive(Serialize)]
struct UserResponse {
    id: String,
    name: String,
    email: String,
}

async fn create_user(
    State(_state): State<Arc<AppState>>,
    Json(req): Json<CreateUserRequest>,
) -> (StatusCode, Json<UserResponse>) {
    let user = UserResponse {
        id: uuid::Uuid::new_v4().to_string(),
        name: req.name,
        email: req.email,
    };

    (StatusCode::CREATED, Json(user))
}

async fn get_user(Path(user_id): Path<String>) -> Json<UserResponse> {
    Json(UserResponse {
        id: user_id,
        name: "John Doe".to_string(),
        email: "john@example.com".to_string(),
    })
}

#[tokio::main]
async fn main() {
    let state = Arc::new(AppState {});

    let app = Router::new()
        .route("/api/users", post(create_user))
        .route("/api/users/:id", get(get_user))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:8080")
        .await
        .unwrap();

    axum::serve(listener, app).await.unwrap();
}
```

---

## Testing with Rust

### Unit Test

```rust
// src/domain/user.rs
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_user() {
        let user = User::new("John Doe".to_string(), "john@example.com".to_string());

        assert!(!user.id.is_empty());
        assert_eq!(user.name, "John Doe");
        assert_eq!(user.email, "john@example.com");
    }

    #[test]
    fn test_is_valid() {
        let user = User::new("John".to_string(), "john@example.com".to_string());
        assert!(user.is_valid());

        let invalid_user = User {
            id: "123".to_string(),
            name: "".to_string(),
            email: "john@example.com".to_string(),
        };
        assert!(!invalid_user.is_valid());
    }

    #[test]
    #[should_panic(expected = "Invalid email")]
    fn test_invalid_email_panics() {
        create_user_or_panic("John", "invalid-email");
    }
}
```

### Mock with mockall

```rust
use mockall::{automock, predicate::*};

#[automock]
pub trait UserRepository {
    fn save(&self, user: &User) -> Result<User, Error>;
    fn find_by_id(&self, id: &str) -> Result<Option<User>, Error>;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_user_service() {
        let mut mock_repo = MockUserRepository::new();

        mock_repo
            .expect_find_by_email()
            .with(eq("john@example.com"))
            .returning(|_| Ok(None));

        mock_repo
            .expect_save()
            .withf(|user| user.email == "john@example.com")
            .returning(|user| Ok(user.clone()));

        let service = UserService::new(Box::new(mock_repo));
        let result = service.create_user("John", "john@example.com");

        assert!(result.is_ok());
    }
}
```

### Integration Test

```rust
// tests/integration_test.rs
use my_rust_project::*;

#[tokio::test]
async fn test_create_user_endpoint() {
    let app = create_app();

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/users")
                .header("content-type", "application/json")
                .body(Body::from(r#"{"name":"John","email":"john@example.com"}"#))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::CREATED);
}
```

---

## Async/Await and Concurrency

### Async Functions

```rust
use tokio;

async fn fetch_user(id: &str) -> Result<User, Error> {
    // Async operation
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

    Ok(User::new("John".to_string(), "john@example.com".to_string()))
}

#[tokio::main]
async fn main() {
    let user = fetch_user("123").await.unwrap();
    println!("User: {:?}", user);
}
```

### Concurrent Execution

```rust
use tokio;

async fn process_users(user_ids: Vec<String>) -> Vec<Result<User, Error>> {
    let tasks: Vec<_> = user_ids
        .into_iter()
        .map(|id| tokio::spawn(async move { fetch_user(&id).await }))
        .collect();

    let mut results = Vec::new();
    for task in tasks {
        results.push(task.await.unwrap());
    }

    results
}
```

---

## Best Practices

### 1. Use Traits for Abstractions

✅ **DO:**
```rust
pub trait UserRepository {
    fn save(&self, user: &User) -> Result<User, Error>;
}

pub struct UserService<R: UserRepository> {
    repo: R,
}
```

### 2. Prefer &str Over String for Parameters

✅ **DO:**
```rust
fn greet(name: &str) -> String {  // Accept &str
    format!("Hello, {}", name)
}
```

❌ **DON'T:**
```rust
fn greet(name: String) -> String {  // Forces ownership transfer
    format!("Hello, {}", name)
}
```

### 3. Use Result for Errors

✅ **DO:**
```rust
fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err("Division by zero".to_string())
    } else {
        Ok(a / b)
    }
}
```

### 4. Use derive Macros

✅ **DO:**
```rust
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub name: String,
}
```

### 5. Use Clippy for Linting

```bash
# Install clippy
rustup component add clippy

# Run clippy
cargo clippy

# Run with warnings as errors
cargo clippy -- -D warnings
```

---

## Quick Start Commands

```bash
# Create new project
cargo new myproject

# Build project
cargo build

# Build for release
cargo build --release

# Run project
cargo run

# Run tests
cargo test

# Check code (fast)
cargo check

# Format code
cargo fmt

# Lint code
cargo clippy

# Generate docs
cargo doc --open

# Update dependencies
cargo update

# Add dependency
cargo add actix-web
```

---

## Next Steps

1. ✅ **Choose your architecture pattern** → [Architecture Patterns Guide](../examples-overview.md)
2. ✅ **Study Rust examples** → [Rust Examples](../examples-overview.md#-rust-examples)
3. ✅ **Implement your project** using Rust's ownership and type system
4. ✅ **Follow Rust conventions** from this guide

---

## Related Resources

- **Main Guide:** [Architecture Patterns Guide](../examples-overview.md)
- **Examples Index:** [All Examples](../examples-overview.md)
- **Official Rust Book:** https://doc.rust-lang.org/book/
- **Rust by Example:** https://doc.rust-lang.org/rust-by-example/
- **Async Book:** https://rust-lang.github.io/async-book/

---

*Last Updated: 2025-10-20*
