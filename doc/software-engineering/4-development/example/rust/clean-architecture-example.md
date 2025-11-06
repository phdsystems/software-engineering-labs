# Clean Architecture - Rust Implementation

**Pattern:** Clean Architecture
**Language:** Rust
**Framework:** Axum (outer layer only)
**Related Guide:** [Deep Dive: Clean Architecture](../../../3-design/architecture-pattern/deep-dive-clean-architecture.md)

## TL;DR

**Complete Clean Architecture implementation** with strict dependency rules showing all four layers: Entities → Use Cases → Interface Adapters → Frameworks. **Key principle**: Dependencies point inward only. **Critical structure**: Domain logic has zero framework dependencies, traits define boundaries, Result types replace exceptions, ownership ensures memory safety, async/await with Tokio runtime.

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Layer 1: Entities (Enterprise Business Rules)](#layer-1-entities-enterprise-business-rules)
4. [Layer 2: Use Cases (Application Business Rules)](#layer-2-use-cases-application-business-rules)
5. [Layer 3: Interface Adapters](#layer-3-interface-adapters)
6. [Layer 4: Frameworks & Drivers](#layer-4-frameworks--drivers)
7. [Dependency Inversion with Traits](#dependency-inversion-with-traits)
8. [Testing Strategy](#testing-strategy)
9. [Running the Example](#running-the-example)

---

## Overview

This example demonstrates Clean Architecture for a banking system with:

- **Layer 1 (Entities)** - Account, Transaction domain models (pure Rust)
- **Layer 2 (Use Cases)** - Transfer money, deposit, withdraw (business logic)
- **Layer 3 (Interface Adapters)** - Controllers, repositories (trait implementations)
- **Layer 4 (Frameworks)** - Axum web framework, async runtime

**Dependency Rule:**
```
Frameworks & Drivers  →  Interface Adapters  →  Use Cases  →  Entities
   (outer)                  (adapter)          (business)    (core)
```

---

## Project Structure

```
clean-architecture-banking/
├── Cargo.toml
└── src/
    ├── main.rs                          # Layer 4: Application entry
    │
    ├── domain/                          # Layer 1: Entities
    │   ├── mod.rs
    │   ├── account.rs
    │   ├── transaction.rs
    │   └── money.rs
    │
    ├── usecase/                         # Layer 2: Use Cases
    │   ├── mod.rs
    │   ├── transfer_money.rs
    │   ├── deposit_money.rs
    │   ├── withdraw_money.rs
    │   └── ports/                       # Output ports (traits)
    │       ├── mod.rs
    │       └── account_repository.rs
    │
    ├── adapter/                         # Layer 3: Interface Adapters
    │   ├── mod.rs
    │   ├── web/
    │   │   ├── mod.rs
    │   │   ├── account_controller.rs
    │   │   └── dto.rs
    │   └── persistence/
    │       ├── mod.rs
    │       ├── in_memory_account_repository.rs
    │       └── mapper.rs
    │
    └── infrastructure/                  # Layer 4: Frameworks
        ├── mod.rs
        └── config.rs
```

---

## Layer 1: Entities (Enterprise Business Rules)

### Cargo.toml

```toml
[package]
name = "clean-architecture-banking"
version = "0.1.0"
edition = "2021"

[dependencies]
# Layer 4: Frameworks only
axum = "0.7"
tokio = { version = "1.35", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tower = "0.4"
tower-http = { version = "0.5", features = ["trace"] }
tracing = "0.1"
tracing-subscriber = "0.3"
uuid = { version = "1.6", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
async-trait = "0.1"

[dev-dependencies]
mockall = "0.12"
```

### domain/money.rs

```rust
use std::fmt;
use std::ops::{Add, Sub};

/// Value Object - Immutable money representation
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct Money {
    // Store as cents to avoid floating-point issues
    amount_cents: i64,
    currency: Currency,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum Currency {
    USD,
    EUR,
    GBP,
}

impl Money {
    pub fn new(amount_cents: i64, currency: Currency) -> Self {
        Self {
            amount_cents,
            currency,
        }
    }

    pub fn usd(dollars: i64, cents: i64) -> Self {
        Self::new(dollars * 100 + cents, Currency::USD)
    }

    pub fn zero(currency: Currency) -> Self {
        Self::new(0, currency)
    }

    pub fn amount_cents(&self) -> i64 {
        self.amount_cents
    }

    pub fn currency(&self) -> Currency {
        self.currency
    }

    pub fn is_negative_or_zero(&self) -> bool {
        self.amount_cents <= 0
    }

    fn assert_same_currency(&self, other: &Money) -> Result<(), MoneyError> {
        if self.currency != other.currency {
            Err(MoneyError::CurrencyMismatch {
                expected: self.currency,
                actual: other.currency,
            })
        } else {
            Ok(())
        }
    }
}

impl Add for Money {
    type Output = Result<Money, MoneyError>;

    fn add(self, other: Money) -> Self::Output {
        self.assert_same_currency(&other)?;
        Ok(Money::new(
            self.amount_cents + other.amount_cents,
            self.currency,
        ))
    }
}

impl Sub for Money {
    type Output = Result<Money, MoneyError>;

    fn sub(self, other: Money) -> Self::Output {
        self.assert_same_currency(&other)?;
        Ok(Money::new(
            self.amount_cents - other.amount_cents,
            self.currency,
        ))
    }
}

impl fmt::Display for Money {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let dollars = self.amount_cents / 100;
        let cents = self.amount_cents % 100;
        write!(f, "${}.{:02}", dollars, cents)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MoneyError {
    CurrencyMismatch { expected: Currency, actual: Currency },
}

impl fmt::Display for MoneyError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            MoneyError::CurrencyMismatch { expected, actual } => {
                write!(
                    f,
                    "Currency mismatch: expected {:?}, got {:?}",
                    expected, actual
                )
            }
        }
    }
}

impl std::error::Error for MoneyError {}
```

### domain/account.rs

```rust
use super::money::{Currency, Money};
use super::transaction::{Transaction, TransactionType};
use chrono::{DateTime, Utc};
use uuid::Uuid;

/// Core business entity - NO framework dependencies
#[derive(Debug, Clone)]
pub struct Account {
    id: String,
    account_number: String,
    owner_name: String,
    balance: Money,
    transactions: Vec<Transaction>,
    created_at: DateTime<Utc>,
    status: AccountStatus,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AccountStatus {
    Active,
    Suspended,
    Closed,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AccountError {
    InsufficientFunds { available: i64, required: i64 },
    AccountNotActive,
    InvalidAmount,
}

impl std::fmt::Display for AccountError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AccountError::InsufficientFunds { available, required } => {
                write!(
                    f,
                    "Insufficient funds: available ${}.{:02}, required ${}.{:02}",
                    available / 100,
                    available % 100,
                    required / 100,
                    required % 100
                )
            }
            AccountError::AccountNotActive => write!(f, "Account is not active"),
            AccountError::InvalidAmount => write!(f, "Amount must be positive"),
        }
    }
}

impl std::error::Error for AccountError {}

impl Account {
    pub fn new(account_number: String, owner_name: String, initial_balance: Money) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            account_number,
            owner_name,
            balance: initial_balance,
            transactions: Vec::new(),
            created_at: Utc::now(),
            status: AccountStatus::Active,
        }
    }

    // Reconstruction (for persistence layer)
    pub fn reconstruct(
        id: String,
        account_number: String,
        owner_name: String,
        balance: Money,
        transactions: Vec<Transaction>,
        created_at: DateTime<Utc>,
        status: AccountStatus,
    ) -> Self {
        Self {
            id,
            account_number,
            owner_name,
            balance,
            transactions,
            created_at,
            status,
        }
    }

    // Business rule: Withdraw money
    pub fn withdraw(&mut self, amount: Money) -> Result<(), AccountError> {
        if self.status != AccountStatus::Active {
            return Err(AccountError::AccountNotActive);
        }

        if amount.is_negative_or_zero() {
            return Err(AccountError::InvalidAmount);
        }

        if self.balance < amount {
            return Err(AccountError::InsufficientFunds {
                available: self.balance.amount_cents(),
                required: amount.amount_cents(),
            });
        }

        self.balance = (self.balance - amount).unwrap();

        let transaction = Transaction::new(
            self.id.clone(),
            TransactionType::Withdrawal,
            amount,
            Utc::now(),
        );
        self.transactions.push(transaction);

        Ok(())
    }

    // Business rule: Deposit money
    pub fn deposit(&mut self, amount: Money) -> Result<(), AccountError> {
        if self.status != AccountStatus::Active {
            return Err(AccountError::AccountNotActive);
        }

        if amount.is_negative_or_zero() {
            return Err(AccountError::InvalidAmount);
        }

        self.balance = (self.balance + amount).unwrap();

        let transaction = Transaction::new(
            self.id.clone(),
            TransactionType::Deposit,
            amount,
            Utc::now(),
        );
        self.transactions.push(transaction);

        Ok(())
    }

    // Business rule: Check if account can transfer
    pub fn can_transfer(&self, amount: Money) -> bool {
        self.status == AccountStatus::Active && self.balance >= amount
    }

    // Getters
    pub fn id(&self) -> &str {
        &self.id
    }

    pub fn account_number(&self) -> &str {
        &self.account_number
    }

    pub fn owner_name(&self) -> &str {
        &self.owner_name
    }

    pub fn balance(&self) -> Money {
        self.balance
    }

    pub fn transactions(&self) -> &[Transaction] {
        &self.transactions
    }

    pub fn created_at(&self) -> DateTime<Utc> {
        self.created_at
    }

    pub fn status(&self) -> AccountStatus {
        self.status
    }

    pub fn close(&mut self) {
        self.status = AccountStatus::Closed;
    }
}
```

### domain/transaction.rs

```rust
use super::money::Money;
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct Transaction {
    id: String,
    account_id: String,
    transaction_type: TransactionType,
    amount: Money,
    timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransactionType {
    Deposit,
    Withdrawal,
    TransferIn,
    TransferOut,
}

impl Transaction {
    pub fn new(
        account_id: String,
        transaction_type: TransactionType,
        amount: Money,
        timestamp: DateTime<Utc>,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            account_id,
            transaction_type,
            amount,
            timestamp,
        }
    }

    pub fn id(&self) -> &str {
        &self.id
    }

    pub fn account_id(&self) -> &str {
        &self.account_id
    }

    pub fn transaction_type(&self) -> TransactionType {
        self.transaction_type
    }

    pub fn amount(&self) -> Money {
        self.amount
    }

    pub fn timestamp(&self) -> DateTime<Utc> {
        self.timestamp
    }
}
```

---

## Layer 2: Use Cases (Application Business Rules)

### usecase/ports/account_repository.rs

```rust
use crate::domain::account::Account;
use async_trait::async_trait;

/// Output port - Interface defined by use case, implemented by adapter
#[async_trait]
pub trait AccountRepository: Send + Sync {
    async fn save(&self, account: Account) -> Result<Account, RepositoryError>;
    async fn find_by_id(&self, id: &str) -> Result<Option<Account>, RepositoryError>;
    async fn find_by_account_number(
        &self,
        account_number: &str,
    ) -> Result<Option<Account>, RepositoryError>;
    async fn delete(&self, id: &str) -> Result<(), RepositoryError>;
}

#[derive(Debug, Clone)]
pub enum RepositoryError {
    NotFound(String),
    StorageError(String),
}

impl std::fmt::Display for RepositoryError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RepositoryError::NotFound(id) => write!(f, "Account not found: {}", id),
            RepositoryError::StorageError(msg) => write!(f, "Storage error: {}", msg),
        }
    }
}

impl std::error::Error for RepositoryError {}
```

### usecase/transfer_money.rs

```rust
use crate::domain::money::Money;
use crate::usecase::ports::account_repository::{AccountRepository, RepositoryError};
use chrono::{DateTime, Utc};
use std::sync::Arc;

/// Use Case - Application business rules
/// NO framework dependencies, only domain and ports
pub struct TransferMoney {
    account_repository: Arc<dyn AccountRepository>,
}

impl TransferMoney {
    pub fn new(account_repository: Arc<dyn AccountRepository>) -> Self {
        Self { account_repository }
    }

    pub async fn execute(&self, request: TransferRequest) -> Result<TransferResult, TransferError> {
        // 1. Load accounts
        let mut source_account = self
            .account_repository
            .find_by_account_number(&request.source_account_number)
            .await?
            .ok_or_else(|| {
                TransferError::AccountNotFound(request.source_account_number.clone())
            })?;

        let mut destination_account = self
            .account_repository
            .find_by_account_number(&request.destination_account_number)
            .await?
            .ok_or_else(|| {
                TransferError::AccountNotFound(request.destination_account_number.clone())
            })?;

        // 2. Validate transfer
        if !source_account.can_transfer(request.amount) {
            return Err(TransferError::TransferFailed(
                "Source account cannot transfer: insufficient funds or inactive".to_string(),
            ));
        }

        // 3. Execute business rules
        source_account.withdraw(request.amount)?;
        destination_account.deposit(request.amount)?;

        // 4. Persist changes
        self.account_repository.save(source_account.clone()).await?;
        self.account_repository
            .save(destination_account.clone())
            .await?;

        // 5. Return result
        Ok(TransferResult {
            success: true,
            message: "Transfer successful".to_string(),
            source_account_id: source_account.id().to_string(),
            destination_account_id: destination_account.id().to_string(),
            amount: request.amount,
            timestamp: Utc::now(),
        })
    }
}

// Input data structure
#[derive(Debug, Clone)]
pub struct TransferRequest {
    pub source_account_number: String,
    pub destination_account_number: String,
    pub amount: Money,
}

// Output data structure
#[derive(Debug, Clone)]
pub struct TransferResult {
    pub success: bool,
    pub message: String,
    pub source_account_id: String,
    pub destination_account_id: String,
    pub amount: Money,
    pub timestamp: DateTime<Utc>,
}

// Use case errors
#[derive(Debug)]
pub enum TransferError {
    AccountNotFound(String),
    TransferFailed(String),
    RepositoryError(RepositoryError),
    DomainError(crate::domain::account::AccountError),
}

impl From<RepositoryError> for TransferError {
    fn from(err: RepositoryError) -> Self {
        TransferError::RepositoryError(err)
    }
}

impl From<crate::domain::account::AccountError> for TransferError {
    fn from(err: crate::domain::account::AccountError) -> Self {
        TransferError::DomainError(err)
    }
}

impl std::fmt::Display for TransferError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TransferError::AccountNotFound(acc) => write!(f, "Account not found: {}", acc),
            TransferError::TransferFailed(msg) => write!(f, "Transfer failed: {}", msg),
            TransferError::RepositoryError(err) => write!(f, "Repository error: {}", err),
            TransferError::DomainError(err) => write!(f, "Domain error: {}", err),
        }
    }
}

impl std::error::Error for TransferError {}
```

---

## Layer 3: Interface Adapters

### adapter/persistence/in_memory_account_repository.rs

```rust
use crate::domain::account::Account;
use crate::usecase::ports::account_repository::{AccountRepository, RepositoryError};
use async_trait::async_trait;
use std::collections::HashMap;
use tokio::sync::RwLock;

/// Output Adapter - Implements use case port
/// Translates between domain models and persistence models
pub struct InMemoryAccountRepository {
    accounts: RwLock<HashMap<String, Account>>,
}

impl InMemoryAccountRepository {
    pub fn new() -> Self {
        Self {
            accounts: RwLock::new(HashMap::new()),
        }
    }
}

#[async_trait]
impl AccountRepository for InMemoryAccountRepository {
    async fn save(&self, account: Account) -> Result<Account, RepositoryError> {
        let mut accounts = self.accounts.write().await;
        accounts.insert(account.id().to_string(), account.clone());
        Ok(account)
    }

    async fn find_by_id(&self, id: &str) -> Result<Option<Account>, RepositoryError> {
        let accounts = self.accounts.read().await;
        Ok(accounts.get(id).cloned())
    }

    async fn find_by_account_number(
        &self,
        account_number: &str,
    ) -> Result<Option<Account>, RepositoryError> {
        let accounts = self.accounts.read().await;
        Ok(accounts
            .values()
            .find(|acc| acc.account_number() == account_number)
            .cloned())
    }

    async fn delete(&self, id: &str) -> Result<(), RepositoryError> {
        let mut accounts = self.accounts.write().await;
        accounts.remove(id);
        Ok(())
    }
}
```

### adapter/web/account_controller.rs

```rust
use crate::adapter::web::dto::{DepositRequest, TransferRequest, TransferResponse};
use crate::domain::money::{Currency, Money};
use crate::usecase::transfer_money::TransferMoney;
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use std::sync::Arc;

/// Input Adapter - Translates HTTP requests to use case calls
pub async fn transfer_money(
    State(transfer_usecase): State<Arc<TransferMoney>>,
    Json(request): Json<TransferRequest>,
) -> impl IntoResponse {
    // Convert web request to use case request
    let amount = Money::usd(request.amount_dollars, request.amount_cents);

    let usecase_request = crate::usecase::transfer_money::TransferRequest {
        source_account_number: request.source_account_number,
        destination_account_number: request.destination_account_number,
        amount,
    };

    // Execute use case
    match transfer_usecase.execute(usecase_request).await {
        Ok(result) => {
            let response = TransferResponse {
                success: result.success,
                message: result.message,
                amount: format!("{}", result.amount),
            };
            (StatusCode::OK, Json(response)).into_response()
        }
        Err(e) => {
            let response = TransferResponse {
                success: false,
                message: e.to_string(),
                amount: String::new(),
            };
            (StatusCode::BAD_REQUEST, Json(response)).into_response()
        }
    }
}
```

### adapter/web/dto.rs

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct TransferRequest {
    pub source_account_number: String,
    pub destination_account_number: String,
    pub amount_dollars: i64,
    pub amount_cents: i64,
}

#[derive(Debug, Serialize)]
pub struct TransferResponse {
    pub success: bool,
    pub message: String,
    pub amount: String,
}

#[derive(Debug, Deserialize)]
pub struct DepositRequest {
    pub amount_dollars: i64,
    pub amount_cents: i64,
}
```

---

## Layer 4: Frameworks & Drivers

### main.rs

```rust
mod adapter;
mod domain;
mod infrastructure;
mod usecase;

use crate::adapter::persistence::in_memory_account_repository::InMemoryAccountRepository;
use crate::adapter::web::account_controller;
use crate::domain::account::Account;
use crate::domain::money::{Currency, Money};
use crate::usecase::ports::account_repository::AccountRepository;
use crate::usecase::transfer_money::TransferMoney;
use axum::{routing::post, Router};
use std::sync::Arc;
use tower_http::trace::TraceLayer;

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Layer 4: Setup dependencies
    let account_repository: Arc<dyn AccountRepository> =
        Arc::new(InMemoryAccountRepository::new());

    // Seed data
    seed_accounts(&account_repository).await;

    // Layer 2: Create use cases
    let transfer_usecase = Arc::new(TransferMoney::new(account_repository.clone()));

    // Layer 4: Build web application
    let app = Router::new()
        .route("/api/transfer", post(account_controller::transfer_money))
        .with_state(transfer_usecase)
        .layer(TraceLayer::new_for_http());

    // Start server
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000")
        .await
        .unwrap();

    println!("Server listening on http://127.0.0.1:3000");

    axum::serve(listener, app).await.unwrap();
}

async fn seed_accounts(repository: &Arc<dyn AccountRepository>) {
    let account1 = Account::new(
        "ACC001".to_string(),
        "Alice Smith".to_string(),
        Money::usd(1000, 0),
    );

    let account2 = Account::new(
        "ACC002".to_string(),
        "Bob Jones".to_string(),
        Money::usd(500, 0),
    );

    repository.save(account1).await.unwrap();
    repository.save(account2).await.unwrap();
}
```

---

## Dependency Inversion with Traits

**Flow Diagram:**

```
HTTP Request
    ↓
AccountController (adapter)
    ↓
TransferMoney (use case)
    ↓
AccountRepository (trait - defined by use case)
    ↑
InMemoryAccountRepository (adapter - implements trait)
    ↓
HashMap storage
```

**Key Insight:**
- Use case defines `AccountRepository` trait (port)
- Adapter implements the trait
- Dependency points inward: Adapter → Use Case (not Use Case → Adapter)

---

## Testing Strategy

### Unit Tests (Domain Layer)

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::money::{Currency, Money};

    #[test]
    fn should_withdraw_money_when_sufficient_funds() {
        let mut account = Account::new(
            "ACC001".to_string(),
            "John Doe".to_string(),
            Money::usd(1000, 0),
        );

        let result = account.withdraw(Money::usd(100, 0));

        assert!(result.is_ok());
        assert_eq!(account.balance(), Money::usd(900, 0));
        assert_eq!(account.transactions().len(), 1);
    }

    #[test]
    fn should_fail_when_insufficient_funds() {
        let mut account = Account::new(
            "ACC001".to_string(),
            "John Doe".to_string(),
            Money::usd(50, 0),
        );

        let result = account.withdraw(Money::usd(100, 0));

        assert!(result.is_err());
        matches!(result.unwrap_err(), AccountError::InsufficientFunds { .. });
    }

    #[test]
    fn should_deposit_money() {
        let mut account = Account::new(
            "ACC001".to_string(),
            "John Doe".to_string(),
            Money::usd(1000, 0),
        );

        let result = account.deposit(Money::usd(500, 0));

        assert!(result.is_ok());
        assert_eq!(account.balance(), Money::usd(1500, 0));
    }
}
```

### Integration Tests with Mockall

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use mockall::mock;
    use mockall::predicate::*;

    mock! {
        pub AccountRepo {}

        #[async_trait]
        impl AccountRepository for AccountRepo {
            async fn save(&self, account: Account) -> Result<Account, RepositoryError>;
            async fn find_by_id(&self, id: &str) -> Result<Option<Account>, RepositoryError>;
            async fn find_by_account_number(
                &self,
                account_number: &str,
            ) -> Result<Option<Account>, RepositoryError>;
            async fn delete(&self, id: &str) -> Result<(), RepositoryError>;
        }
    }

    #[tokio::test]
    async fn should_transfer_money_between_accounts() {
        // Given
        let source = Account::new(
            "ACC001".to_string(),
            "Alice".to_string(),
            Money::usd(1000, 0),
        );
        let dest = Account::new(
            "ACC002".to_string(),
            "Bob".to_string(),
            Money::usd(500, 0),
        );

        let mut mock_repo = MockAccountRepo::new();
        mock_repo
            .expect_find_by_account_number()
            .times(2)
            .returning(move |num| {
                Box::pin(async move {
                    if num == "ACC001" {
                        Ok(Some(source.clone()))
                    } else {
                        Ok(Some(dest.clone()))
                    }
                })
            });

        mock_repo
            .expect_save()
            .times(2)
            .returning(|acc| Box::pin(async move { Ok(acc) }));

        let usecase = TransferMoney::new(Arc::new(mock_repo));

        // When
        let request = TransferRequest {
            source_account_number: "ACC001".to_string(),
            destination_account_number: "ACC002".to_string(),
            amount: Money::usd(200, 0),
        };

        let result = usecase.execute(request).await;

        // Then
        assert!(result.is_ok());
        assert!(result.unwrap().success);
    }
}
```

---

## Running the Example

### Build and Run

```bash
# Build
cargo build

# Run tests
cargo test

# Run application
cargo run

# Test API
curl -X POST http://localhost:3000/api/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "source_account_number": "ACC001",
    "destination_account_number": "ACC002",
    "amount_dollars": 100,
    "amount_cents": 0
  }'
```

---

## Key Takeaways

1. **Dependency Rule** - All dependencies point inward toward domain
2. **Domain Independence** - Business logic has ZERO framework dependencies
3. **Traits for Abstraction** - Use cases define traits, adapters implement them
4. **Type Safety** - Rust's type system enforces boundaries at compile time
5. **Result Types** - No exceptions, explicit error handling with Result<T, E>
6. **Ownership** - Memory safety without garbage collection
7. **Async/Await** - Non-blocking I/O with Tokio runtime
8. **Zero-Cost Abstractions** - High-level code compiles to efficient machine code

---

**Related Guides:**
- [Deep Dive: Clean Architecture](../../../3-design/architecture-pattern/deep-dive-clean-architecture.md)
- [Rust Project Setup Guide](./project-setup.md)

*Last Updated: 2025-10-20*
