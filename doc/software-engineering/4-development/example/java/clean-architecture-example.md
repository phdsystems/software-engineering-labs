# Clean Architecture - Java Implementation

**Pattern:** Clean Architecture
**Language:** Java
**Framework:** Spring Boot 3.x (outer layer only)
**Related Guide:** [Deep Dive: Clean Architecture](../../../3-design/architecture-pattern/deep-dive-clean-architecture.md)

## TL;DR

**Complete Clean Architecture implementation** with strict dependency rules showing all four layers: Entities → Use Cases → Interface Adapters → Frameworks. **Key principle**: Dependencies point inward only. **Critical structure**: Domain logic has zero framework dependencies, use cases orchestrate business rules, adapters translate between layers, frameworks are plugins.

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Layer 1: Entities (Enterprise Business Rules)](#layer-1-entities-enterprise-business-rules)
4. [Layer 2: Use Cases (Application Business Rules)](#layer-2-use-cases-application-business-rules)
5. [Layer 3: Interface Adapters](#layer-3-interface-adapters)
6. [Layer 4: Frameworks & Drivers](#layer-4-frameworks--drivers)
7. [Dependency Inversion in Practice](#dependency-inversion-in-practice)
8. [Testing Strategy](#testing-strategy)
9. [Running the Example](#running-the-example)

---

## Overview

This example demonstrates Clean Architecture for a banking system with:

- **Layer 1 (Entities)** - Account, Transaction domain models
- **Layer 2 (Use Cases)** - Transfer money, deposit, withdraw
- **Layer 3 (Interface Adapters)** - Controllers, repositories, presenters
- **Layer 4 (Frameworks)** - Spring Boot, JPA, REST

**Dependency Rule:**
```
Frameworks & Drivers  →  Interface Adapters  →  Use Cases  →  Entities
   (outer)                  (adapter)          (business)    (core)
```

---

## Project Structure

```
clean-architecture-banking/
└── src/main/java/com/example/banking/
    ├── domain/                          # Layer 1: Entities
    │   ├── Account.java
    │   ├── Transaction.java
    │   └── Money.java
    │
    ├── usecase/                         # Layer 2: Use Cases
    │   ├── TransferMoney.java
    │   ├── DepositMoney.java
    │   ├── WithdrawMoney.java
    │   ├── port/
    │   │   ├── AccountRepository.java   # Output port (interface)
    │   │   └── TransactionRepository.java
    │   └── exception/
    │       └── InsufficientFundsException.java
    │
    ├── adapter/                         # Layer 3: Interface Adapters
    │   ├── web/                         # Input adapters
    │   │   ├── AccountController.java
    │   │   ├── TransferRequest.java
    │   │   └── AccountResponse.java
    │   ├── persistence/                 # Output adapters
    │   │   ├── JpaAccountRepository.java
    │   │   ├── AccountEntity.java
    │   │   └── AccountMapper.java
    │   └── presenter/
    │       └── AccountPresenter.java
    │
    └── infrastructure/                  # Layer 4: Frameworks
        ├── BankingApplication.java
        ├── config/
        │   └── UseCaseConfig.java
        └── persistence/
            └── SpringDataAccountRepository.java
```

---

## Layer 1: Entities (Enterprise Business Rules)

### Account.java

```java
package com.example.banking.domain;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * Core business entity - NO framework dependencies
 */
public class Account {
    private final String id;
    private final String accountNumber;
    private final String ownerName;
    private Money balance;
    private final List<Transaction> transactions;
    private final LocalDateTime createdAt;
    private AccountStatus status;

    public Account(String accountNumber, String ownerName, Money initialBalance) {
        this.id = UUID.randomUUID().toString();
        this.accountNumber = accountNumber;
        this.ownerName = ownerName;
        this.balance = initialBalance;
        this.transactions = new ArrayList<>();
        this.createdAt = LocalDateTime.now();
        this.status = AccountStatus.ACTIVE;
    }

    // Reconstruction constructor (for persistence layer)
    public Account(String id, String accountNumber, String ownerName,
                   Money balance, List<Transaction> transactions,
                   LocalDateTime createdAt, AccountStatus status) {
        this.id = id;
        this.accountNumber = accountNumber;
        this.ownerName = ownerName;
        this.balance = balance;
        this.transactions = new ArrayList<>(transactions);
        this.createdAt = createdAt;
        this.status = status;
    }

    // Business rule: Withdraw money
    public void withdraw(Money amount) {
        if (status != AccountStatus.ACTIVE) {
            throw new IllegalStateException("Account is not active");
        }

        if (balance.isLessThan(amount)) {
            throw new InsufficientFundsException(
                "Insufficient funds. Available: " + balance + ", Required: " + amount
            );
        }

        this.balance = balance.subtract(amount);

        Transaction transaction = new Transaction(
            this.id,
            TransactionType.WITHDRAWAL,
            amount,
            LocalDateTime.now()
        );
        this.transactions.add(transaction);
    }

    // Business rule: Deposit money
    public void deposit(Money amount) {
        if (status != AccountStatus.ACTIVE) {
            throw new IllegalStateException("Account is not active");
        }

        if (amount.isNegativeOrZero()) {
            throw new IllegalArgumentException("Deposit amount must be positive");
        }

        this.balance = balance.add(amount);

        Transaction transaction = new Transaction(
            this.id,
            TransactionType.DEPOSIT,
            amount,
            LocalDateTime.now()
        );
        this.transactions.add(transaction);
    }

    // Business rule: Check if account can transfer
    public boolean canTransfer(Money amount) {
        return status == AccountStatus.ACTIVE && !balance.isLessThan(amount);
    }

    // Getters
    public String getId() { return id; }
    public String getAccountNumber() { return accountNumber; }
    public String getOwnerName() { return ownerName; }
    public Money getBalance() { return balance; }
    public List<Transaction> getTransactions() {
        return Collections.unmodifiableList(transactions);
    }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public AccountStatus getStatus() { return status; }

    public void close() {
        this.status = AccountStatus.CLOSED;
    }

    public enum AccountStatus {
        ACTIVE, SUSPENDED, CLOSED
    }

    // Exception (domain exception)
    public static class InsufficientFundsException extends RuntimeException {
        public InsufficientFundsException(String message) {
            super(message);
        }
    }
}
```

### Money.java (Value Object)

```java
package com.example.banking.domain;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Currency;
import java.util.Objects;

/**
 * Value Object - Immutable money representation
 */
public class Money {
    private final BigDecimal amount;
    private final Currency currency;

    public Money(BigDecimal amount, Currency currency) {
        if (amount == null || currency == null) {
            throw new IllegalArgumentException("Amount and currency cannot be null");
        }
        this.amount = amount.setScale(2, RoundingMode.HALF_UP);
        this.currency = currency;
    }

    public Money(String amount, String currencyCode) {
        this(new BigDecimal(amount), Currency.getInstance(currencyCode));
    }

    public static Money zero(Currency currency) {
        return new Money(BigDecimal.ZERO, currency);
    }

    public static Money usd(String amount) {
        return new Money(amount, "USD");
    }

    public Money add(Money other) {
        assertSameCurrency(other);
        return new Money(this.amount.add(other.amount), this.currency);
    }

    public Money subtract(Money other) {
        assertSameCurrency(other);
        return new Money(this.amount.subtract(other.amount), this.currency);
    }

    public boolean isLessThan(Money other) {
        assertSameCurrency(other);
        return this.amount.compareTo(other.amount) < 0;
    }

    public boolean isGreaterThan(Money other) {
        assertSameCurrency(other);
        return this.amount.compareTo(other.amount) > 0;
    }

    public boolean isNegativeOrZero() {
        return this.amount.compareTo(BigDecimal.ZERO) <= 0;
    }

    private void assertSameCurrency(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException(
                "Cannot operate on different currencies: " +
                this.currency + " vs " + other.currency
            );
        }
    }

    public BigDecimal getAmount() { return amount; }
    public Currency getCurrency() { return currency; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Money money = (Money) o;
        return amount.compareTo(money.amount) == 0 &&
               currency.equals(money.currency);
    }

    @Override
    public int hashCode() {
        return Objects.hash(amount, currency);
    }

    @Override
    public String toString() {
        return amount + " " + currency.getCurrencyCode();
    }
}
```

### Transaction.java

```java
package com.example.banking.domain;

import java.time.LocalDateTime;
import java.util.UUID;

public class Transaction {
    private final String id;
    private final String accountId;
    private final TransactionType type;
    private final Money amount;
    private final LocalDateTime timestamp;

    public Transaction(String accountId, TransactionType type,
                      Money amount, LocalDateTime timestamp) {
        this.id = UUID.randomUUID().toString();
        this.accountId = accountId;
        this.type = type;
        this.amount = amount;
        this.timestamp = timestamp;
    }

    // Getters
    public String getId() { return id; }
    public String getAccountId() { return accountId; }
    public TransactionType getType() { return type; }
    public Money getAmount() { return amount; }
    public LocalDateTime getTimestamp() { return timestamp; }
}

enum TransactionType {
    DEPOSIT, WITHDRAWAL, TRANSFER_IN, TRANSFER_OUT
}
```

---

## Layer 2: Use Cases (Application Business Rules)

### Port Interfaces (Output Boundaries)

```java
package com.example.banking.usecase.port;

import com.example.banking.domain.Account;

import java.util.Optional;

/**
 * Output port - Interface defined by use case, implemented by adapter
 */
public interface AccountRepository {
    Account save(Account account);
    Optional<Account> findById(String accountId);
    Optional<Account> findByAccountNumber(String accountNumber);
    void delete(String accountId);
}
```

### TransferMoney Use Case

```java
package com.example.banking.usecase;

import com.example.banking.domain.Account;
import com.example.banking.domain.Money;
import com.example.banking.domain.Transaction;
import com.example.banking.domain.TransactionType;
import com.example.banking.usecase.port.AccountRepository;

import java.time.LocalDateTime;

/**
 * Use Case - Application business rules
 * NO framework dependencies, only domain and ports
 */
public class TransferMoney {
    private final AccountRepository accountRepository;

    public TransferMoney(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public TransferResult execute(TransferRequest request) {
        // 1. Load accounts
        Account sourceAccount = accountRepository
            .findByAccountNumber(request.sourceAccountNumber())
            .orElseThrow(() -> new AccountNotFoundException(
                "Source account not found: " + request.sourceAccountNumber()
            ));

        Account destinationAccount = accountRepository
            .findByAccountNumber(request.destinationAccountNumber())
            .orElseThrow(() -> new AccountNotFoundException(
                "Destination account not found: " + request.destinationAccountNumber()
            ));

        // 2. Validate transfer
        if (!sourceAccount.canTransfer(request.amount())) {
            throw new TransferFailedException("Source account cannot transfer: insufficient funds or inactive");
        }

        // 3. Execute business rules
        sourceAccount.withdraw(request.amount());
        destinationAccount.deposit(request.amount());

        // 4. Persist changes
        accountRepository.save(sourceAccount);
        accountRepository.save(destinationAccount);

        // 5. Return result
        return new TransferResult(
            true,
            "Transfer successful",
            sourceAccount.getId(),
            destinationAccount.getId(),
            request.amount(),
            LocalDateTime.now()
        );
    }

    // Input data structure
    public record TransferRequest(
        String sourceAccountNumber,
        String destinationAccountNumber,
        Money amount
    ) {}

    // Output data structure
    public record TransferResult(
        boolean success,
        String message,
        String sourceAccountId,
        String destinationAccountId,
        Money amount,
        LocalDateTime timestamp
    ) {}

    // Use case exceptions
    public static class AccountNotFoundException extends RuntimeException {
        public AccountNotFoundException(String message) {
            super(message);
        }
    }

    public static class TransferFailedException extends RuntimeException {
        public TransferFailedException(String message) {
            super(message);
        }
    }
}
```

### DepositMoney Use Case

```java
package com.example.banking.usecase;

import com.example.banking.domain.Account;
import com.example.banking.domain.Money;
import com.example.banking.usecase.port.AccountRepository;

public class DepositMoney {
    private final AccountRepository accountRepository;

    public DepositMoney(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public DepositResult execute(DepositRequest request) {
        Account account = accountRepository
            .findByAccountNumber(request.accountNumber())
            .orElseThrow(() -> new AccountNotFoundException(
                "Account not found: " + request.accountNumber()
            ));

        account.deposit(request.amount());
        accountRepository.save(account);

        return new DepositResult(
            true,
            "Deposit successful",
            account.getId(),
            account.getBalance()
        );
    }

    public record DepositRequest(String accountNumber, Money amount) {}

    public record DepositResult(
        boolean success,
        String message,
        String accountId,
        Money newBalance
    ) {}

    public static class AccountNotFoundException extends RuntimeException {
        public AccountNotFoundException(String message) {
            super(message);
        }
    }
}
```

### WithdrawMoney Use Case

```java
package com.example.banking.usecase;

import com.example.banking.domain.Account;
import com.example.banking.domain.Money;
import com.example.banking.usecase.port.AccountRepository;

public class WithdrawMoney {
    private final AccountRepository accountRepository;

    public WithdrawMoney(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public WithdrawResult execute(WithdrawRequest request) {
        Account account = accountRepository
            .findByAccountNumber(request.accountNumber())
            .orElseThrow(() -> new AccountNotFoundException(
                "Account not found: " + request.accountNumber()
            ));

        account.withdraw(request.amount());
        accountRepository.save(account);

        return new WithdrawResult(
            true,
            "Withdrawal successful",
            account.getId(),
            account.getBalance()
        );
    }

    public record WithdrawRequest(String accountNumber, Money amount) {}

    public record WithdrawResult(
        boolean success,
        String message,
        String accountId,
        Money newBalance
    ) {}

    public static class AccountNotFoundException extends RuntimeException {
        public AccountNotFoundException(String message) {
            super(message);
        }
    }
}
```

---

## Layer 3: Interface Adapters

### Web Controller (Input Adapter)

```java
package com.example.banking.adapter.web;

import com.example.banking.domain.Money;
import com.example.banking.usecase.TransferMoney;
import com.example.banking.usecase.DepositMoney;
import com.example.banking.usecase.WithdrawMoney;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Input Adapter - Translates HTTP requests to use case calls
 * Depends on use cases (inner layer)
 */
@RestController
@RequestMapping("/api/accounts")
public class AccountController {
    private final TransferMoney transferMoney;
    private final DepositMoney depositMoney;
    private final WithdrawMoney withdrawMoney;

    public AccountController(TransferMoney transferMoney,
                           DepositMoney depositMoney,
                           WithdrawMoney withdrawMoney) {
        this.transferMoney = transferMoney;
        this.depositMoney = depositMoney;
        this.withdrawMoney = withdrawMoney;
    }

    @PostMapping("/transfer")
    public ResponseEntity<TransferResponse> transfer(@RequestBody TransferRequest request) {
        try {
            // Convert web request to use case request
            TransferMoney.TransferRequest useCaseRequest =
                new TransferMoney.TransferRequest(
                    request.sourceAccountNumber,
                    request.destinationAccountNumber,
                    Money.usd(request.amount)
                );

            // Execute use case
            TransferMoney.TransferResult result = transferMoney.execute(useCaseRequest);

            // Convert use case result to web response
            TransferResponse response = new TransferResponse(
                result.success(),
                result.message(),
                result.amount().toString()
            );

            return ResponseEntity.ok(response);

        } catch (TransferMoney.AccountNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new TransferResponse(false, e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new TransferResponse(false, e.getMessage(), null));
        }
    }

    @PostMapping("/{accountNumber}/deposit")
    public ResponseEntity<DepositResponse> deposit(
            @PathVariable String accountNumber,
            @RequestBody DepositRequest request) {

        DepositMoney.DepositRequest useCaseRequest =
            new DepositMoney.DepositRequest(accountNumber, Money.usd(request.amount));

        DepositMoney.DepositResult result = depositMoney.execute(useCaseRequest);

        return ResponseEntity.ok(new DepositResponse(
            result.success(),
            result.message(),
            result.newBalance().toString()
        ));
    }

    @PostMapping("/{accountNumber}/withdraw")
    public ResponseEntity<WithdrawResponse> withdraw(
            @PathVariable String accountNumber,
            @RequestBody WithdrawRequest request) {

        WithdrawMoney.WithdrawRequest useCaseRequest =
            new WithdrawMoney.WithdrawRequest(accountNumber, Money.usd(request.amount));

        WithdrawMoney.WithdrawResult result = withdrawMoney.execute(useCaseRequest);

        return ResponseEntity.ok(new WithdrawResponse(
            result.success(),
            result.message(),
            result.newBalance().toString()
        ));
    }
}

// Web DTOs (data transfer objects)
record TransferRequest(String sourceAccountNumber,
                      String destinationAccountNumber,
                      String amount) {}

record TransferResponse(boolean success, String message, String amount) {}

record DepositRequest(String amount) {}

record DepositResponse(boolean success, String message, String newBalance) {}

record WithdrawRequest(String amount) {}

record WithdrawResponse(boolean success, String message, String newBalance) {}
```

### Persistence Adapter (Output Adapter)

```java
package com.example.banking.adapter.persistence;

import com.example.banking.domain.Account;
import com.example.banking.domain.Money;
import com.example.banking.domain.Transaction;
import com.example.banking.usecase.port.AccountRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Output Adapter - Implements use case port
 * Translates between domain models and persistence models
 */
@Repository
public class JpaAccountRepositoryAdapter implements AccountRepository {
    private final SpringDataAccountRepository springDataRepository;

    public JpaAccountRepositoryAdapter(SpringDataAccountRepository springDataRepository) {
        this.springDataRepository = springDataRepository;
    }

    @Override
    public Account save(Account account) {
        AccountEntity entity = toEntity(account);
        AccountEntity saved = springDataRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<Account> findById(String accountId) {
        return springDataRepository.findById(accountId)
            .map(this::toDomain);
    }

    @Override
    public Optional<Account> findByAccountNumber(String accountNumber) {
        return springDataRepository.findByAccountNumber(accountNumber)
            .map(this::toDomain);
    }

    @Override
    public void delete(String accountId) {
        springDataRepository.deleteById(accountId);
    }

    // Mapping: Domain → Entity
    private AccountEntity toEntity(Account account) {
        AccountEntity entity = new AccountEntity();
        entity.setId(account.getId());
        entity.setAccountNumber(account.getAccountNumber());
        entity.setOwnerName(account.getOwnerName());
        entity.setBalanceAmount(account.getBalance().getAmount());
        entity.setBalanceCurrency(account.getBalance().getCurrency().getCurrencyCode());
        entity.setStatus(account.getStatus().name());
        entity.setCreatedAt(account.getCreatedAt());

        // Map transactions
        List<TransactionEntity> transactionEntities = account.getTransactions()
            .stream()
            .map(this::toTransactionEntity)
            .collect(Collectors.toList());
        entity.setTransactions(transactionEntities);

        return entity;
    }

    // Mapping: Entity → Domain
    private Account toDomain(AccountEntity entity) {
        Money balance = new Money(
            entity.getBalanceAmount(),
            java.util.Currency.getInstance(entity.getBalanceCurrency())
        );

        List<Transaction> transactions = entity.getTransactions()
            .stream()
            .map(this::toTransactionDomain)
            .collect(Collectors.toList());

        return new Account(
            entity.getId(),
            entity.getAccountNumber(),
            entity.getOwnerName(),
            balance,
            transactions,
            entity.getCreatedAt(),
            Account.AccountStatus.valueOf(entity.getStatus())
        );
    }

    private TransactionEntity toTransactionEntity(Transaction transaction) {
        TransactionEntity entity = new TransactionEntity();
        entity.setId(transaction.getId());
        entity.setAccountId(transaction.getAccountId());
        entity.setType(transaction.getType().name());
        entity.setAmount(transaction.getAmount().getAmount());
        entity.setCurrency(transaction.getAmount().getCurrency().getCurrencyCode());
        entity.setTimestamp(transaction.getTimestamp());
        return entity;
    }

    private Transaction toTransactionDomain(TransactionEntity entity) {
        Money amount = new Money(
            entity.getAmount(),
            java.util.Currency.getInstance(entity.getCurrency())
        );

        return new Transaction(
            entity.getAccountId(),
            com.example.banking.domain.TransactionType.valueOf(entity.getType()),
            amount,
            entity.getTimestamp()
        );
    }
}
```

### JPA Entities (Persistence Models)

```java
package com.example.banking.adapter.persistence;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA Entity - Persistence model (NOT domain model)
 */
@Entity
@Table(name = "accounts")
public class AccountEntity {
    @Id
    private String id;

    @Column(unique = true, nullable = false)
    private String accountNumber;

    private String ownerName;
    private BigDecimal balanceAmount;
    private String balanceCurrency;
    private String status;
    private LocalDateTime createdAt;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "account_id")
    private List<TransactionEntity> transactions = new ArrayList<>();

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }

    public BigDecimal getBalanceAmount() { return balanceAmount; }
    public void setBalanceAmount(BigDecimal balanceAmount) {
        this.balanceAmount = balanceAmount;
    }

    public String getBalanceCurrency() { return balanceCurrency; }
    public void setBalanceCurrency(String balanceCurrency) {
        this.balanceCurrency = balanceCurrency;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<TransactionEntity> getTransactions() { return transactions; }
    public void setTransactions(List<TransactionEntity> transactions) {
        this.transactions = transactions;
    }
}

@Entity
@Table(name = "transactions")
class TransactionEntity {
    @Id
    private String id;
    private String accountId;
    private String type;
    private BigDecimal amount;
    private String currency;
    private LocalDateTime timestamp;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAccountId() { return accountId; }
    public void setAccountId(String accountId) { this.accountId = accountId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
```

---

## Layer 4: Frameworks & Drivers

### Spring Boot Application

```java
package com.example.banking.infrastructure;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = "com.example.banking")
public class BankingApplication {
    public static void main(String[] args) {
        SpringApplication.run(BankingApplication.class, args);
    }
}
```

### Use Case Configuration

```java
package com.example.banking.infrastructure.config;

import com.example.banking.usecase.DepositMoney;
import com.example.banking.usecase.TransferMoney;
import com.example.banking.usecase.WithdrawMoney;
import com.example.banking.usecase.port.AccountRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Dependency injection configuration
 * Wires use cases with their dependencies
 */
@Configuration
public class UseCaseConfig {

    @Bean
    public TransferMoney transferMoney(AccountRepository accountRepository) {
        return new TransferMoney(accountRepository);
    }

    @Bean
    public DepositMoney depositMoney(AccountRepository accountRepository) {
        return new DepositMoney(accountRepository);
    }

    @Bean
    public WithdrawMoney withdrawMoney(AccountRepository accountRepository) {
        return new WithdrawMoney(accountRepository);
    }
}
```

### Spring Data Repository

```java
package com.example.banking.infrastructure.persistence;

import com.example.banking.adapter.persistence.AccountEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SpringDataAccountRepository extends JpaRepository<AccountEntity, String> {
    Optional<AccountEntity> findByAccountNumber(String accountNumber);
}
```

---

## Dependency Inversion in Practice

### Flow Diagram

```
HTTP Request
    ↓
AccountController (adapter)
    ↓
TransferMoney (use case)
    ↓
AccountRepository (port/interface - defined by use case)
    ↑
JpaAccountRepositoryAdapter (adapter - implements port)
    ↓
SpringDataAccountRepository (framework)
    ↓
Database
```

**Key Insight:**
- Use case defines `AccountRepository` interface (port)
- Adapter implements the interface
- Dependency points inward: Adapter → Use Case (not Use Case → Adapter)

---

## Testing Strategy

### Unit Tests (Domain Layer)

```java
package com.example.banking.domain;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class AccountTest {

    @Test
    void shouldWithdrawMoneyWhenSufficientFunds() {
        Account account = new Account("ACC001", "John Doe", Money.usd("1000"));

        account.withdraw(Money.usd("100"));

        assertEquals(Money.usd("900"), account.getBalance());
        assertEquals(1, account.getTransactions().size());
    }

    @Test
    void shouldThrowExceptionWhenInsufficientFunds() {
        Account account = new Account("ACC001", "John Doe", Money.usd("50"));

        assertThrows(Account.InsufficientFundsException.class, () -> {
            account.withdraw(Money.usd("100"));
        });
    }

    @Test
    void shouldDepositMoney() {
        Account account = new Account("ACC001", "John Doe", Money.usd("1000"));

        account.deposit(Money.usd("500"));

        assertEquals(Money.usd("1500"), account.getBalance());
    }
}
```

### Unit Tests (Use Case Layer)

```java
package com.example.banking.usecase;

import com.example.banking.domain.Account;
import com.example.banking.domain.Money;
import com.example.banking.usecase.port.AccountRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransferMoneyTest {

    @Mock
    private AccountRepository accountRepository;

    @InjectMocks
    private TransferMoney transferMoney;

    @Test
    void shouldTransferMoneyBetweenAccounts() {
        // Given
        Account source = new Account("ACC001", "Alice", Money.usd("1000"));
        Account destination = new Account("ACC002", "Bob", Money.usd("500"));

        when(accountRepository.findByAccountNumber("ACC001"))
            .thenReturn(Optional.of(source));
        when(accountRepository.findByAccountNumber("ACC002"))
            .thenReturn(Optional.of(destination));

        // When
        TransferMoney.TransferRequest request = new TransferMoney.TransferRequest(
            "ACC001", "ACC002", Money.usd("200")
        );
        TransferMoney.TransferResult result = transferMoney.execute(request);

        // Then
        assertTrue(result.success());
        assertEquals(Money.usd("800"), source.getBalance());
        assertEquals(Money.usd("700"), destination.getBalance());
        verify(accountRepository, times(2)).save(any(Account.class));
    }

    @Test
    void shouldFailWhenSourceAccountNotFound() {
        when(accountRepository.findByAccountNumber(any()))
            .thenReturn(Optional.empty());

        TransferMoney.TransferRequest request = new TransferMoney.TransferRequest(
            "ACC001", "ACC002", Money.usd("200")
        );

        assertThrows(TransferMoney.AccountNotFoundException.class, () -> {
            transferMoney.execute(request);
        });
    }
}
```

### Integration Tests (Adapter Layer)

```java
package com.example.banking.adapter.web;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AccountControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldTransferMoney() throws Exception {
        String requestBody = """
            {
                "sourceAccountNumber": "ACC001",
                "destinationAccountNumber": "ACC002",
                "amount": "100.00"
            }
            """;

        mockMvc.perform(post("/api/accounts/transfer")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }
}
```

---

## Running the Example

### Prerequisites

```xml
<!-- pom.xml -->
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>com.h2database</groupId>
        <artifactId>h2</artifactId>
    </dependency>
</dependencies>
```

### Application Configuration

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:h2:mem:bankingdb
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true
  h2:
    console:
      enabled: true
server:
  port: 8080
```

### Run the Application

```bash
mvn spring-boot:run
```

### Test the API

```bash
# Transfer money
curl -X POST http://localhost:8080/api/accounts/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountNumber": "ACC001",
    "destinationAccountNumber": "ACC002",
    "amount": "100.00"
  }'

# Deposit money
curl -X POST http://localhost:8080/api/accounts/ACC001/deposit \
  -H "Content-Type: application/json" \
  -d '{"amount": "500.00"}'

# Withdraw money
curl -X POST http://localhost:8080/api/accounts/ACC001/withdraw \
  -H "Content-Type: application/json" \
  -d '{"amount": "200.00"}'
```

---

## Key Takeaways

1. **Dependency Rule** - All dependencies point inward toward domain
2. **Domain Independence** - Business logic has ZERO framework dependencies
3. **Testability** - Domain and use cases can be tested without frameworks
4. **Port/Adapter Pattern** - Use cases define interfaces, adapters implement them
5. **Separation of Concerns** - Each layer has a single, well-defined responsibility
6. **Framework as Plugin** - Spring Boot is just an implementation detail
7. **Business Rules First** - Domain entities contain core business logic

---

**Related Guides:**
- [Deep Dive: Clean Architecture](../../../3-design/architecture-pattern/deep-dive-clean-architecture.md)

*Last Updated: 2025-10-20*
