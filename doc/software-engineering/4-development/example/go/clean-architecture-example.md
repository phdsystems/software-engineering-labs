# Clean Architecture - Go Implementation

**Pattern:** Clean Architecture
**Language:** Go
**Framework:** Standard library, Gin (web), GORM (optional)
**Related Guide:** [Deep Dive: Clean Architecture](../../../3-design/architecture-pattern/deep-dive-clean-architecture.md)

## TL;DR

**Complete Clean Architecture in Go** with strict dependency rules using interfaces for dependency inversion. **Key principle**: Dependencies point inward only. **Go-idiomatic**: Interfaces at usage point, error handling without exceptions, goroutines for concurrency, single binary deployment. **Critical structure**: Domain logic (zero framework deps) → Use Cases (business rules) → Adapters (HTTP/DB) → Frameworks (Gin, GORM).

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Layer 1: Entities (Domain)](#layer-1-entities-domain)
4. [Layer 2: Use Cases](#layer-2-use-cases)
5. [Layer 3: Interface Adapters](#layer-3-interface-adapters)
6. [Layer 4: Frameworks & Drivers](#layer-4-frameworks--drivers)
7. [Dependency Injection](#dependency-injection)
8. [Testing Strategy](#testing-strategy)
9. [Running the Example](#running-the-example)

---

## Overview

This example demonstrates Clean Architecture for a banking system with:

- **Layer 1 (Entities)** - Account, Transaction domain models
- **Layer 2 (Use Cases)** - Transfer money, deposit, withdraw
- **Layer 3 (Interface Adapters)** - HTTP handlers, repositories
- **Layer 4 (Frameworks)** - Gin, GORM (optional), SQL

**Dependency Rule:**
```
Frameworks (Gin, SQL) → Adapters (HTTP, DB) → Use Cases → Entities
   (outer)                (interface)        (business)  (core)
```

---

## Project Structure

```
banking/
├── cmd/
│   └── server/
│       └── main.go                 # Entry point
│
├── domain/                          # Layer 1: Entities (pure Go)
│   ├── account.go
│   ├── money.go
│   └── transaction.go
│
├── usecase/                         # Layer 2: Use Cases
│   ├── transfer_money.go
│   ├── deposit_money.go
│   └── withdraw_money.go
│
├── adapter/                         # Layer 3: Interface Adapters
│   ├── http/
│   │   ├── handler.go
│   │   └── dto.go
│   └── repository/
│       ├── account_repository.go   # Interface defined here
│       └── postgres/
│           └── account_repo.go     # Implementation
│
└── infrastructure/                  # Layer 4: Frameworks
    ├── config.go
    ├── router.go
    └── database.go

go.mod
```

---

## Layer 1: Entities (Domain)

### domain/money.go

```go
package domain

import (
	"errors"
	"fmt"
)

// Money is a value object representing monetary amount
// Immutable - all operations return new Money instances
type Money struct {
	amount   int64  // Store as cents to avoid floating point issues
	currency string
}

// NewMoney creates a new Money value object
func NewMoney(amount int64, currency string) (*Money, error) {
	if currency == "" {
		return nil, errors.New("currency cannot be empty")
	}
	return &Money{
		amount:   amount,
		currency: currency,
	}, nil
}

// NewMoneyUSD creates Money in USD
func NewMoneyUSD(cents int64) *Money {
	return &Money{
		amount:   cents,
		currency: "USD",
	}
}

// Amount returns the amount in cents
func (m *Money) Amount() int64 {
	return m.amount
}

// Currency returns the currency code
func (m *Money) Currency() string {
	return m.currency
}

// Add returns a new Money with added amount
func (m *Money) Add(other *Money) (*Money, error) {
	if err := m.assertSameCurrency(other); err != nil {
		return nil, err
	}
	return &Money{
		amount:   m.amount + other.amount,
		currency: m.currency,
	}, nil
}

// Subtract returns a new Money with subtracted amount
func (m *Money) Subtract(other *Money) (*Money, error) {
	if err := m.assertSameCurrency(other); err != nil {
		return nil, err
	}
	return &Money{
		amount:   m.amount - other.amount,
		currency: m.currency,
	}, nil
}

// IsLessThan checks if this money is less than other
func (m *Money) IsLessThan(other *Money) (bool, error) {
	if err := m.assertSameCurrency(other); err != nil {
		return false, err
	}
	return m.amount < other.amount, nil
}

// IsNegativeOrZero checks if amount is <= 0
func (m *Money) IsNegativeOrZero() bool {
	return m.amount <= 0
}

func (m *Money) assertSameCurrency(other *Money) error {
	if m.currency != other.currency {
		return fmt.Errorf("cannot operate on different currencies: %s vs %s",
			m.currency, other.currency)
	}
	return nil
}

// String returns formatted money string
func (m *Money) String() string {
	return fmt.Sprintf("%d.%02d %s", m.amount/100, m.amount%100, m.currency)
}
```

### domain/account.go

```go
package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// AccountStatus represents the state of an account
type AccountStatus string

const (
	AccountStatusActive    AccountStatus = "ACTIVE"
	AccountStatusSuspended AccountStatus = "SUSPENDED"
	AccountStatusClosed    AccountStatus = "CLOSED"
)

// Account is the core entity - NO framework dependencies
type Account struct {
	id            string
	accountNumber string
	ownerName     string
	balance       *Money
	transactions  []*Transaction
	createdAt     time.Time
	status        AccountStatus
}

// NewAccount creates a new account
func NewAccount(accountNumber, ownerName string, initialBalance *Money) *Account {
	return &Account{
		id:            uuid.New().String(),
		accountNumber: accountNumber,
		ownerName:     ownerName,
		balance:       initialBalance,
		transactions:  make([]*Transaction, 0),
		createdAt:     time.Now(),
		status:        AccountStatusActive,
	}
}

// ReconstructAccount rebuilds account from persistence (for repository)
func ReconstructAccount(id, accountNumber, ownerName string,
	balance *Money, transactions []*Transaction,
	createdAt time.Time, status AccountStatus) *Account {
	return &Account{
		id:            id,
		accountNumber: accountNumber,
		ownerName:     ownerName,
		balance:       balance,
		transactions:  transactions,
		createdAt:     createdAt,
		status:        status,
	}
}

// Withdraw implements business rule: withdraw money
func (a *Account) Withdraw(amount *Money) error {
	if a.status != AccountStatusActive {
		return errors.New("account is not active")
	}

	lessThan, err := a.balance.IsLessThan(amount)
	if err != nil {
		return err
	}
	if lessThan {
		return errors.New("insufficient funds")
	}

	newBalance, err := a.balance.Subtract(amount)
	if err != nil {
		return err
	}
	a.balance = newBalance

	transaction := NewTransaction(a.id, TransactionTypeWithdrawal, amount)
	a.transactions = append(a.transactions, transaction)

	return nil
}

// Deposit implements business rule: deposit money
func (a *Account) Deposit(amount *Money) error {
	if a.status != AccountStatusActive {
		return errors.New("account is not active")
	}

	if amount.IsNegativeOrZero() {
		return errors.New("deposit amount must be positive")
	}

	newBalance, err := a.balance.Add(amount)
	if err != nil {
		return err
	}
	a.balance = newBalance

	transaction := NewTransaction(a.id, TransactionTypeDeposit, amount)
	a.transactions = append(a.transactions, transaction)

	return nil
}

// CanTransfer checks if account can transfer amount
func (a *Account) CanTransfer(amount *Money) bool {
	lessThan, err := a.balance.IsLessThan(amount)
	return a.status == AccountStatusActive && err == nil && !lessThan
}

// Close closes the account
func (a *Account) Close() {
	a.status = AccountStatusClosed
}

// Getters
func (a *Account) ID() string                     { return a.id }
func (a *Account) AccountNumber() string          { return a.accountNumber }
func (a *Account) OwnerName() string              { return a.ownerName }
func (a *Account) Balance() *Money                { return a.balance }
func (a *Account) Transactions() []*Transaction   { return a.transactions }
func (a *Account) CreatedAt() time.Time           { return a.createdAt }
func (a *Account) Status() AccountStatus          { return a.status }
```

### domain/transaction.go

```go
package domain

import (
	"time"

	"github.com/google/uuid"
)

// TransactionType represents the type of transaction
type TransactionType string

const (
	TransactionTypeDeposit     TransactionType = "DEPOSIT"
	TransactionTypeWithdrawal  TransactionType = "WITHDRAWAL"
	TransactionTypeTransferIn  TransactionType = "TRANSFER_IN"
	TransactionTypeTransferOut TransactionType = "TRANSFER_OUT"
)

// Transaction represents a financial transaction
type Transaction struct {
	id        string
	accountID string
	txType    TransactionType
	amount    *Money
	timestamp time.Time
}

// NewTransaction creates a new transaction
func NewTransaction(accountID string, txType TransactionType, amount *Money) *Transaction {
	return &Transaction{
		id:        uuid.New().String(),
		accountID: accountID,
		txType:    txType,
		amount:    amount,
		timestamp: time.Now(),
	}
}

// Getters
func (t *Transaction) ID() string                 { return t.id }
func (t *Transaction) AccountID() string          { return t.accountID }
func (t *Transaction) Type() TransactionType      { return t.txType }
func (t *Transaction) Amount() *Money             { return t.amount }
func (t *Transaction) Timestamp() time.Time       { return t.timestamp }
```

---

## Layer 2: Use Cases

### usecase/transfer_money.go

```go
package usecase

import (
	"context"
	"fmt"
	"time"

	"banking/domain"
)

// AccountRepository is the output port (interface)
// Defined by use case, implemented by adapter
type AccountRepository interface {
	Save(ctx context.Context, account *domain.Account) error
	FindByID(ctx context.Context, id string) (*domain.Account, error)
	FindByAccountNumber(ctx context.Context, accountNumber string) (*domain.Account, error)
}

// TransferMoneyRequest is the input data structure
type TransferMoneyRequest struct {
	SourceAccountNumber      string
	DestinationAccountNumber string
	Amount                   *domain.Money
}

// TransferMoneyResponse is the output data structure
type TransferMoneyResponse struct {
	Success              bool
	Message              string
	SourceAccountID      string
	DestinationAccountID string
	Amount               *domain.Money
	Timestamp            time.Time
}

// TransferMoney is the use case
// NO framework dependencies, only domain and repository interface
type TransferMoney struct {
	accountRepo AccountRepository
}

// NewTransferMoney creates a new use case instance
func NewTransferMoney(accountRepo AccountRepository) *TransferMoney {
	return &TransferMoney{
		accountRepo: accountRepo,
	}
}

// Execute performs the transfer
func (uc *TransferMoney) Execute(ctx context.Context, req TransferMoneyRequest) (*TransferMoneyResponse, error) {
	// 1. Load accounts
	sourceAccount, err := uc.accountRepo.FindByAccountNumber(ctx, req.SourceAccountNumber)
	if err != nil {
		return nil, fmt.Errorf("source account not found: %w", err)
	}

	destinationAccount, err := uc.accountRepo.FindByAccountNumber(ctx, req.DestinationAccountNumber)
	if err != nil {
		return nil, fmt.Errorf("destination account not found: %w", err)
	}

	// 2. Validate transfer
	if !sourceAccount.CanTransfer(req.Amount) {
		return nil, fmt.Errorf("source account cannot transfer: insufficient funds or inactive")
	}

	// 3. Execute business rules
	if err := sourceAccount.Withdraw(req.Amount); err != nil {
		return nil, fmt.Errorf("withdrawal failed: %w", err)
	}

	if err := destinationAccount.Deposit(req.Amount); err != nil {
		return nil, fmt.Errorf("deposit failed: %w", err)
	}

	// 4. Persist changes
	if err := uc.accountRepo.Save(ctx, sourceAccount); err != nil {
		return nil, fmt.Errorf("failed to save source account: %w", err)
	}

	if err := uc.accountRepo.Save(ctx, destinationAccount); err != nil {
		return nil, fmt.Errorf("failed to save destination account: %w", err)
	}

	// 5. Return result
	return &TransferMoneyResponse{
		Success:              true,
		Message:              "Transfer successful",
		SourceAccountID:      sourceAccount.ID(),
		DestinationAccountID: destinationAccount.ID(),
		Amount:               req.Amount,
		Timestamp:            time.Now(),
	}, nil
}
```

### usecase/deposit_money.go

```go
package usecase

import (
	"context"
	"fmt"

	"banking/domain"
)

// DepositMoneyRequest is the input
type DepositMoneyRequest struct {
	AccountNumber string
	Amount        *domain.Money
}

// DepositMoneyResponse is the output
type DepositMoneyResponse struct {
	Success    bool
	Message    string
	AccountID  string
	NewBalance *domain.Money
}

// DepositMoney use case
type DepositMoney struct {
	accountRepo AccountRepository
}

// NewDepositMoney creates a new use case
func NewDepositMoney(accountRepo AccountRepository) *DepositMoney {
	return &DepositMoney{
		accountRepo: accountRepo,
	}
}

// Execute performs the deposit
func (uc *DepositMoney) Execute(ctx context.Context, req DepositMoneyRequest) (*DepositMoneyResponse, error) {
	account, err := uc.accountRepo.FindByAccountNumber(ctx, req.AccountNumber)
	if err != nil {
		return nil, fmt.Errorf("account not found: %w", err)
	}

	if err := account.Deposit(req.Amount); err != nil {
		return nil, fmt.Errorf("deposit failed: %w", err)
	}

	if err := uc.accountRepo.Save(ctx, account); err != nil {
		return nil, fmt.Errorf("failed to save account: %w", err)
	}

	return &DepositMoneyResponse{
		Success:    true,
		Message:    "Deposit successful",
		AccountID:  account.ID(),
		NewBalance: account.Balance(),
	}, nil
}
```

### usecase/withdraw_money.go

```go
package usecase

import (
	"context"
	"fmt"

	"banking/domain"
)

// WithdrawMoneyRequest is the input
type WithdrawMoneyRequest struct {
	AccountNumber string
	Amount        *domain.Money
}

// WithdrawMoneyResponse is the output
type WithdrawMoneyResponse struct {
	Success    bool
	Message    string
	AccountID  string
	NewBalance *domain.Money
}

// WithdrawMoney use case
type WithdrawMoney struct {
	accountRepo AccountRepository
}

// NewWithdrawMoney creates a new use case
func NewWithdrawMoney(accountRepo AccountRepository) *WithdrawMoney {
	return &WithdrawMoney{
		accountRepo: accountRepo,
	}
}

// Execute performs the withdrawal
func (uc *WithdrawMoney) Execute(ctx context.Context, req WithdrawMoneyRequest) (*WithdrawMoneyResponse, error) {
	account, err := uc.accountRepo.FindByAccountNumber(ctx, req.AccountNumber)
	if err != nil {
		return nil, fmt.Errorf("account not found: %w", err)
	}

	if err := account.Withdraw(req.Amount); err != nil {
		return nil, fmt.Errorf("withdrawal failed: %w", err)
	}

	if err := uc.accountRepo.Save(ctx, account); err != nil {
		return nil, fmt.Errorf("failed to save account: %w", err)
	}

	return &WithdrawMoneyResponse{
		Success:    true,
		Message:    "Withdrawal successful",
		AccountID:  account.ID(),
		NewBalance: account.Balance(),
	}, nil
}
```

---

## Layer 3: Interface Adapters

### adapter/http/handler.go

```go
package http

import (
	"net/http"

	"banking/domain"
	"banking/usecase"

	"github.com/gin-gonic/gin"
)

// AccountHandler is the HTTP input adapter
// Translates HTTP requests to use case calls
type AccountHandler struct {
	transferMoney *usecase.TransferMoney
	depositMoney  *usecase.DepositMoney
	withdrawMoney *usecase.WithdrawMoney
}

// NewAccountHandler creates a new handler
func NewAccountHandler(
	transferMoney *usecase.TransferMoney,
	depositMoney *usecase.DepositMoney,
	withdrawMoney *usecase.WithdrawMoney,
) *AccountHandler {
	return &AccountHandler{
		transferMoney: transferMoney,
		depositMoney:  depositMoney,
		withdrawMoney: withdrawMoney,
	}
}

// Transfer handles POST /api/accounts/transfer
func (h *AccountHandler) Transfer(c *gin.Context) {
	var req TransferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Convert HTTP request to use case request
	amount := domain.NewMoneyUSD(req.AmountCents)
	useCaseReq := usecase.TransferMoneyRequest{
		SourceAccountNumber:      req.SourceAccountNumber,
		DestinationAccountNumber: req.DestinationAccountNumber,
		Amount:                   amount,
	}

	// Execute use case
	result, err := h.transferMoney.Execute(c.Request.Context(), useCaseReq)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Convert use case result to HTTP response
	response := TransferResponse{
		Success: result.Success,
		Message: result.Message,
		Amount:  result.Amount.String(),
	}

	c.JSON(http.StatusOK, response)
}

// Deposit handles POST /api/accounts/:accountNumber/deposit
func (h *AccountHandler) Deposit(c *gin.Context) {
	accountNumber := c.Param("accountNumber")

	var req DepositRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	amount := domain.NewMoneyUSD(req.AmountCents)
	useCaseReq := usecase.DepositMoneyRequest{
		AccountNumber: accountNumber,
		Amount:        amount,
	}

	result, err := h.depositMoney.Execute(c.Request.Context(), useCaseReq)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response := DepositResponse{
		Success:    result.Success,
		Message:    result.Message,
		NewBalance: result.NewBalance.String(),
	}

	c.JSON(http.StatusOK, response)
}

// Withdraw handles POST /api/accounts/:accountNumber/withdraw
func (h *AccountHandler) Withdraw(c *gin.Context) {
	accountNumber := c.Param("accountNumber")

	var req WithdrawRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	amount := domain.NewMoneyUSD(req.AmountCents)
	useCaseReq := usecase.WithdrawMoneyRequest{
		AccountNumber: accountNumber,
		Amount:        amount,
	}

	result, err := h.withdrawMoney.Execute(c.Request.Context(), useCaseReq)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response := WithdrawResponse{
		Success:    result.Success,
		Message:    result.Message,
		NewBalance: result.NewBalance.String(),
	}

	c.JSON(http.StatusOK, response)
}
```

### adapter/http/dto.go

```go
package http

// TransferRequest is the HTTP DTO
type TransferRequest struct {
	SourceAccountNumber      string `json:"sourceAccountNumber" binding:"required"`
	DestinationAccountNumber string `json:"destinationAccountNumber" binding:"required"`
	AmountCents              int64  `json:"amountCents" binding:"required,gt=0"`
}

// TransferResponse is the HTTP DTO
type TransferResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Amount  string `json:"amount"`
}

// DepositRequest is the HTTP DTO
type DepositRequest struct {
	AmountCents int64 `json:"amountCents" binding:"required,gt=0"`
}

// DepositResponse is the HTTP DTO
type DepositResponse struct {
	Success    bool   `json:"success"`
	Message    string `json:"message"`
	NewBalance string `json:"newBalance"`
}

// WithdrawRequest is the HTTP DTO
type WithdrawRequest struct {
	AmountCents int64 `json:"amountCents" binding:"required,gt=0"`
}

// WithdrawResponse is the HTTP DTO
type WithdrawResponse struct {
	Success    bool   `json:"success"`
	Message    string `json:"message"`
	NewBalance string `json:"newBalance"`
}
```

### adapter/repository/postgres/account_repo.go

```go
package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"banking/domain"
)

// AccountRepository implements usecase.AccountRepository (output adapter)
type AccountRepository struct {
	db *sql.DB
}

// NewAccountRepository creates a new repository
func NewAccountRepository(db *sql.DB) *AccountRepository {
	return &AccountRepository{db: db}
}

// Save persists an account
func (r *AccountRepository) Save(ctx context.Context, account *domain.Account) error {
	query := `
		INSERT INTO accounts (id, account_number, owner_name, balance_cents,
		                     balance_currency, status, created_at, transactions)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (id) DO UPDATE SET
			balance_cents = EXCLUDED.balance_cents,
			status = EXCLUDED.status,
			transactions = EXCLUDED.transactions
	`

	transactionsJSON, err := json.Marshal(account.Transactions())
	if err != nil {
		return fmt.Errorf("failed to marshal transactions: %w", err)
	}

	_, err = r.db.ExecContext(ctx, query,
		account.ID(),
		account.AccountNumber(),
		account.OwnerName(),
		account.Balance().Amount(),
		account.Balance().Currency(),
		account.Status(),
		account.CreatedAt(),
		transactionsJSON,
	)

	return err
}

// FindByID retrieves account by ID
func (r *AccountRepository) FindByID(ctx context.Context, id string) (*domain.Account, error) {
	query := `
		SELECT id, account_number, owner_name, balance_cents, balance_currency,
		       status, created_at, transactions
		FROM accounts
		WHERE id = $1
	`

	var (
		accountID      string
		accountNumber  string
		ownerName      string
		balanceCents   int64
		balanceCurrency string
		status         string
		createdAt      string
		transactionsJSON []byte
	)

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&accountID, &accountNumber, &ownerName,
		&balanceCents, &balanceCurrency, &status,
		&createdAt, &transactionsJSON,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("account not found")
	}
	if err != nil {
		return nil, err
	}

	return r.toDomain(accountID, accountNumber, ownerName,
		balanceCents, balanceCurrency, status, transactionsJSON)
}

// FindByAccountNumber retrieves account by account number
func (r *AccountRepository) FindByAccountNumber(ctx context.Context, accountNumber string) (*domain.Account, error) {
	query := `
		SELECT id, account_number, owner_name, balance_cents, balance_currency,
		       status, created_at, transactions
		FROM accounts
		WHERE account_number = $1
	`

	var (
		accountID      string
		accNum         string
		ownerName      string
		balanceCents   int64
		balanceCurrency string
		status         string
		createdAt      string
		transactionsJSON []byte
	)

	err := r.db.QueryRowContext(ctx, query, accountNumber).Scan(
		&accountID, &accNum, &ownerName,
		&balanceCents, &balanceCurrency, &status,
		&createdAt, &transactionsJSON,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("account not found")
	}
	if err != nil {
		return nil, err
	}

	return r.toDomain(accountID, accNum, ownerName,
		balanceCents, balanceCurrency, status, transactionsJSON)
}

// toDomain converts database row to domain model
func (r *AccountRepository) toDomain(
	id, accountNumber, ownerName string,
	balanceCents int64, balanceCurrency, status string,
	transactionsJSON []byte,
) (*domain.Account, error) {
	balance := domain.NewMoneyUSD(balanceCents)

	var transactions []*domain.Transaction
	if err := json.Unmarshal(transactionsJSON, &transactions); err != nil {
		return nil, fmt.Errorf("failed to unmarshal transactions: %w", err)
	}

	// Parse createdAt, status, etc.
	accountStatus := domain.AccountStatus(status)

	return domain.ReconstructAccount(
		id, accountNumber, ownerName,
		balance, transactions,
		// Parse time from string in production
		// For simplicity, using time.Now()
		// createdAt should be parsed properly
		domain.AccountStatusActive, // placeholder
		accountStatus,
	), nil
}
```

---

## Layer 4: Frameworks & Drivers

### cmd/server/main.go

```go
package main

import (
	"database/sql"
	"log"

	httpAdapter "banking/adapter/http"
	"banking/adapter/repository/postgres"
	"banking/usecase"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

func main() {
	// 1. Initialize database
	db, err := sql.Open("postgres", "postgres://user:pass@localhost/banking?sslmode=disable")
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	// 2. Initialize adapters
	accountRepo := postgres.NewAccountRepository(db)

	// 3. Initialize use cases
	transferMoney := usecase.NewTransferMoney(accountRepo)
	depositMoney := usecase.NewDepositMoney(accountRepo)
	withdrawMoney := usecase.NewWithdrawMoney(accountRepo)

	// 4. Initialize HTTP handler
	accountHandler := httpAdapter.NewAccountHandler(
		transferMoney,
		depositMoney,
		withdrawMoney,
	)

	// 5. Setup router
	router := gin.Default()

	api := router.Group("/api/accounts")
	{
		api.POST("/transfer", accountHandler.Transfer)
		api.POST("/:accountNumber/deposit", accountHandler.Deposit)
		api.POST("/:accountNumber/withdraw", accountHandler.Withdraw)
	}

	// 6. Start server
	log.Println("Server starting on :8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
```

### infrastructure/database.go

```go
package infrastructure

import (
	"database/sql"
	"fmt"
)

// DatabaseConfig holds database configuration
type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	SSLMode  string
}

// NewDatabase creates a new database connection
func NewDatabase(config DatabaseConfig) (*sql.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		config.Host, config.Port, config.User,
		config.Password, config.DBName, config.SSLMode,
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Connection pool settings
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	return db, nil
}
```

---

## Dependency Injection

### Dependency Flow

```
main.go
  ↓
  Creates: DB connection
  ↓
  Creates: AccountRepository (adapter) with DB
  ↓
  Creates: Use Cases with AccountRepository
  ↓
  Creates: HTTP Handler with Use Cases
  ↓
  Starts: Gin Router
```

**Key Points:**
- Dependencies injected via constructors
- Interfaces defined at usage point (use case defines repository interface)
- Concrete implementations in outer layers

---

## Testing Strategy

### Unit Tests (Domain Layer)

```go
package domain_test

import (
	"testing"

	"banking/domain"
)

func TestAccount_Withdraw_Success(t *testing.T) {
	// Given
	account := domain.NewAccount("ACC001", "John Doe", domain.NewMoneyUSD(100000))

	// When
	err := account.Withdraw(domain.NewMoneyUSD(10000))

	// Then
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if account.Balance().Amount() != 90000 {
		t.Errorf("expected balance 90000, got %d", account.Balance().Amount())
	}

	if len(account.Transactions()) != 1 {
		t.Errorf("expected 1 transaction, got %d", len(account.Transactions()))
	}
}

func TestAccount_Withdraw_InsufficientFunds(t *testing.T) {
	// Given
	account := domain.NewAccount("ACC001", "John Doe", domain.NewMoneyUSD(5000))

	// When
	err := account.Withdraw(domain.NewMoneyUSD(10000))

	// Then
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if account.Balance().Amount() != 5000 {
		t.Errorf("balance should not change on error")
	}
}

// Table-driven test
func TestMoney_Add(t *testing.T) {
	tests := []struct {
		name      string
		m1        *domain.Money
		m2        *domain.Money
		want      int64
		wantError bool
	}{
		{
			name:      "add same currency",
			m1:        domain.NewMoneyUSD(1000),
			m2:        domain.NewMoneyUSD(500),
			want:      1500,
			wantError: false,
		},
		{
			name:      "add zero",
			m1:        domain.NewMoneyUSD(1000),
			m2:        domain.NewMoneyUSD(0),
			want:      1000,
			wantError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := tt.m1.Add(tt.m2)

			if (err != nil) != tt.wantError {
				t.Errorf("Add() error = %v, wantError %v", err, tt.wantError)
				return
			}

			if !tt.wantError && result.Amount() != tt.want {
				t.Errorf("Add() = %v, want %v", result.Amount(), tt.want)
			}
		})
	}
}
```

### Unit Tests (Use Case Layer)

```go
package usecase_test

import (
	"context"
	"testing"

	"banking/domain"
	"banking/usecase"
)

// Mock repository
type mockAccountRepository struct {
	accounts map[string]*domain.Account
}

func newMockAccountRepository() *mockAccountRepository {
	return &mockAccountRepository{
		accounts: make(map[string]*domain.Account),
	}
}

func (m *mockAccountRepository) Save(ctx context.Context, account *domain.Account) error {
	m.accounts[account.ID()] = account
	return nil
}

func (m *mockAccountRepository) FindByID(ctx context.Context, id string) (*domain.Account, error) {
	if account, ok := m.accounts[id]; ok {
		return account, nil
	}
	return nil, fmt.Errorf("account not found")
}

func (m *mockAccountRepository) FindByAccountNumber(ctx context.Context, accountNumber string) (*domain.Account, error) {
	for _, account := range m.accounts {
		if account.AccountNumber() == accountNumber {
			return account, nil
		}
	}
	return nil, fmt.Errorf("account not found")
}

func TestTransferMoney_Execute_Success(t *testing.T) {
	// Given
	repo := newMockAccountRepository()
	source := domain.NewAccount("ACC001", "Alice", domain.NewMoneyUSD(100000))
	destination := domain.NewAccount("ACC002", "Bob", domain.NewMoneyUSD(50000))

	repo.Save(context.Background(), source)
	repo.Save(context.Background(), destination)

	transferUC := usecase.NewTransferMoney(repo)

	// When
	result, err := transferUC.Execute(context.Background(), usecase.TransferMoneyRequest{
		SourceAccountNumber:      "ACC001",
		DestinationAccountNumber: "ACC002",
		Amount:                   domain.NewMoneyUSD(20000),
	})

	// Then
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if !result.Success {
		t.Error("expected success=true")
	}

	// Verify balances
	sourceAfter, _ := repo.FindByAccountNumber(context.Background(), "ACC001")
	if sourceAfter.Balance().Amount() != 80000 {
		t.Errorf("expected source balance 80000, got %d", sourceAfter.Balance().Amount())
	}

	destAfter, _ := repo.FindByAccountNumber(context.Background(), "ACC002")
	if destAfter.Balance().Amount() != 70000 {
		t.Errorf("expected destination balance 70000, got %d", destAfter.Balance().Amount())
	}
}
```

### Integration Tests

```go
package integration_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	httpAdapter "banking/adapter/http"
	"banking/adapter/repository/postgres"
	"banking/usecase"

	"github.com/gin-gonic/gin"
)

func TestAccountHandler_Transfer_Integration(t *testing.T) {
	// Setup (use test database)
	db := setupTestDatabase(t)
	defer teardownTestDatabase(t, db)

	repo := postgres.NewAccountRepository(db)
	transferUC := usecase.NewTransferMoney(repo)
	depositUC := usecase.NewDepositMoney(repo)
	withdrawUC := usecase.NewWithdrawMoney(repo)

	handler := httpAdapter.NewAccountHandler(transferUC, depositUC, withdrawUC)

	router := gin.Default()
	router.POST("/api/accounts/transfer", handler.Transfer)

	// Test
	reqBody := map[string]interface{}{
		"sourceAccountNumber":      "ACC001",
		"destinationAccountNumber": "ACC002",
		"amountCents":              10000,
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/accounts/transfer", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}
}
```

---

## Running the Example

### Prerequisites

```bash
# Install dependencies
go mod init banking
go get github.com/gin-gonic/gin
go get github.com/lib/pq
go get github.com/google/uuid
```

### go.mod

```go
module banking

go 1.21

require (
	github.com/gin-gonic/gin v1.9.1
	github.com/google/uuid v1.5.0
	github.com/lib/pq v1.10.9
)
```

### Database Setup

```sql
-- Create database
CREATE DATABASE banking;

-- Create accounts table
CREATE TABLE accounts (
    id VARCHAR(36) PRIMARY KEY,
    account_number VARCHAR(50) UNIQUE NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    balance_cents BIGINT NOT NULL,
    balance_currency VARCHAR(3) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    transactions JSONB
);

-- Insert test data
INSERT INTO accounts (id, account_number, owner_name, balance_cents,
                     balance_currency, status, created_at, transactions)
VALUES
    ('123e4567-e89b-12d3-a456-426614174000', 'ACC001', 'Alice Smith',
     100000, 'USD', 'ACTIVE', NOW(), '[]'),
    ('223e4567-e89b-12d3-a456-426614174001', 'ACC002', 'Bob Johnson',
     50000, 'USD', 'ACTIVE', NOW(), '[]');
```

### Run Application

```bash
# Run
go run cmd/server/main.go

# Build single binary
go build -o banking cmd/server/main.go
./banking
```

### Test API

```bash
# Transfer money
curl -X POST http://localhost:8080/api/accounts/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountNumber": "ACC001",
    "destinationAccountNumber": "ACC002",
    "amountCents": 10000
  }'

# Deposit
curl -X POST http://localhost:8080/api/accounts/ACC001/deposit \
  -H "Content-Type: application/json" \
  -d '{"amountCents": 50000}'

# Withdraw
curl -X POST http://localhost:8080/api/accounts/ACC001/withdraw \
  -H "Content-Type: application/json" \
  -d '{"amountCents": 20000}'
```

### Run Tests

```bash
# Run all tests
go test ./...

# Run with coverage
go test -cover ./...

# Run specific package
go test ./domain
go test ./usecase

# Table-driven tests
go test -v ./domain -run TestMoney
```

---

## Key Takeaways

1. **Dependency Rule** - All dependencies point inward (outer → inner)
2. **Interface at Usage** - Use case defines repository interface (dependency inversion)
3. **Pure Domain** - Business logic has ZERO framework dependencies
4. **Error Handling** - Return errors, no exceptions (Go idiomatic)
5. **Context Propagation** - Use `context.Context` for cancellation and deadlines
6. **Single Binary** - Compiles to single executable (easy deployment)
7. **Table-Driven Tests** - Go's idiomatic testing pattern
8. **Goroutines Ready** - Architecture supports concurrent processing

---

**Related Guides:**
- [Deep Dive: Clean Architecture](../../../3-design/architecture-pattern/deep-dive-clean-architecture.md)

*Last Updated: 2025-10-20*
