# Clean Architecture - Groovy Implementation

**Pattern:** Clean Architecture
**Language:** Groovy
**Framework:** Spring Boot 3.x (outer layer only)
**Related Guide:** [Deep Dive: Clean Architecture](../../../3-design/architecture-pattern/deep-dive-clean-architecture.md)

## TL;DR

**Complete Clean Architecture implementation in Groovy** with strict dependency rules showing all four layers: Entities → Use Cases → Interface Adapters → Frameworks. **Key principle**: Dependencies point inward only. **Groovy advantages**: Concise syntax with closures and AST transformations → @Canonical for domain models → Traits for cross-cutting concerns → CompileStatic for performance-critical code → Spock for expressive testing.

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Layer 1: Entities (Enterprise Business Rules)](#layer-1-entities-enterprise-business-rules)
4. [Layer 2: Use Cases (Application Business Rules)](#layer-2-use-cases-application-business-rules)
5. [Layer 3: Interface Adapters](#layer-3-interface-adapters)
6. [Layer 4: Frameworks & Drivers](#layer-4-frameworks--drivers)
7. [Groovy-Specific Features](#groovy-specific-features)
8. [Testing Strategy with Spock](#testing-strategy-with-spock)
9. [Running the Example](#running-the-example)

---

## Overview

This example demonstrates Clean Architecture for a banking system using Groovy's strengths:

- **Layer 1 (Entities)** - Account, Transaction domain models with @Canonical
- **Layer 2 (Use Cases)** - Transfer money, deposit, withdraw with @CompileStatic
- **Layer 3 (Interface Adapters)** - Controllers, repositories with Groovy SQL
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
└── src/main/groovy/com/example/banking/
    ├── domain/                          # Layer 1: Entities
    │   ├── Account.groovy
    │   ├── Transaction.groovy
    │   ├── Money.groovy
    │   └── traits/
    │       └── Auditable.groovy
    │
    ├── usecase/                         # Layer 2: Use Cases
    │   ├── TransferMoney.groovy
    │   ├── DepositMoney.groovy
    │   ├── WithdrawMoney.groovy
    │   ├── port/
    │   │   ├── AccountRepository.groovy
    │   │   └── TransactionRepository.groovy
    │   └── exception/
    │       └── InsufficientFundsException.groovy
    │
    ├── adapter/                         # Layer 3: Interface Adapters
    │   ├── web/
    │   │   ├── AccountController.groovy
    │   │   ├── TransferRequest.groovy
    │   │   └── AccountResponse.groovy
    │   ├── persistence/
    │   │   ├── JpaAccountRepository.groovy
    │   │   ├── AccountEntity.groovy
    │   │   └── AccountMapper.groovy
    │   └── presenter/
    │       └── AccountPresenter.groovy
    │
    └── infrastructure/                  # Layer 4: Frameworks
        ├── BankingApplication.groovy
        ├── config/
        │   └── UseCaseConfig.groovy
        └── persistence/
            └── SpringDataAccountRepository.groovy
```

---

## Layer 1: Entities (Enterprise Business Rules)

### Account.groovy

```groovy
package com.example.banking.domain

import groovy.transform.Canonical
import groovy.transform.CompileStatic
import groovy.transform.builder.Builder
import com.example.banking.domain.traits.Auditable

import java.time.LocalDateTime

/**
 * Core business entity - NO framework dependencies
 * Uses @Canonical for automatic equals/hashCode/toString
 */
@CompileStatic
@Canonical
class Account implements Auditable {
    final String id
    final String accountNumber
    final String ownerName
    Money balance
    final List<Transaction> transactions = []
    final LocalDateTime createdAt
    AccountStatus status

    // Construction with builder pattern
    @Builder
    Account(String id, String accountNumber, String ownerName,
            Money balance, List<Transaction> transactions = [],
            LocalDateTime createdAt = LocalDateTime.now(),
            AccountStatus status = AccountStatus.ACTIVE) {
        this.id = id ?: UUID.randomUUID().toString()
        this.accountNumber = accountNumber
        this.ownerName = ownerName
        this.balance = balance
        this.transactions.addAll(transactions)
        this.createdAt = createdAt
        this.status = status
    }

    // Business rule: Withdraw money
    void withdraw(Money amount) {
        if (status != AccountStatus.ACTIVE) {
            throw new IllegalStateException("Account is not active")
        }

        if (balance < amount) {
            throw new InsufficientFundsException(
                "Insufficient funds. Available: ${balance}, Required: ${amount}"
            )
        }

        balance -= amount

        transactions << new Transaction(
            accountId: id,
            type: TransactionType.WITHDRAWAL,
            amount: amount,
            timestamp: LocalDateTime.now()
        )
    }

    // Business rule: Deposit money
    void deposit(Money amount) {
        if (status != AccountStatus.ACTIVE) {
            throw new IllegalStateException("Account is not active")
        }

        if (amount.isNegativeOrZero()) {
            throw new IllegalArgumentException("Deposit amount must be positive")
        }

        balance += amount

        transactions << new Transaction(
            accountId: id,
            type: TransactionType.DEPOSIT,
            amount: amount,
            timestamp: LocalDateTime.now()
        )
    }

    // Business rule: Check if account can transfer
    boolean canTransfer(Money amount) {
        status == AccountStatus.ACTIVE && balance >= amount
    }

    // Groovy-style getters (automatic)
    List<Transaction> getTransactions() {
        Collections.unmodifiableList(transactions)
    }

    void close() {
        this.status = AccountStatus.CLOSED
    }

    enum AccountStatus {
        ACTIVE, SUSPENDED, CLOSED
    }
}
```

### Money.groovy (Value Object)

```groovy
package com.example.banking.domain

import groovy.transform.Canonical
import groovy.transform.CompileStatic
import groovy.transform.Immutable

import java.math.RoundingMode

/**
 * Value Object - Immutable money representation
 * Uses @Immutable for automatic immutability
 */
@CompileStatic
@Immutable
class Money implements Comparable<Money> {
    BigDecimal amount
    Currency currency

    // Static factory methods
    static Money zero(Currency currency) {
        new Money(BigDecimal.ZERO, currency)
    }

    static Money usd(String amount) {
        new Money(new BigDecimal(amount), Currency.getInstance('USD'))
    }

    static Money usd(BigDecimal amount) {
        new Money(amount, Currency.getInstance('USD'))
    }

    // Operator overloading
    Money plus(Money other) {
        assertSameCurrency(other)
        new Money(this.amount + other.amount, this.currency)
    }

    Money minus(Money other) {
        assertSameCurrency(other)
        new Money(this.amount - other.amount, this.currency)
    }

    Money multiply(BigDecimal multiplier) {
        new Money(this.amount * multiplier, this.currency)
    }

    // Comparison operators
    @Override
    int compareTo(Money other) {
        assertSameCurrency(other)
        this.amount <=> other.amount
    }

    boolean isLessThan(Money other) {
        this < other
    }

    boolean isGreaterThan(Money other) {
        this > other
    }

    boolean isNegativeOrZero() {
        this.amount <= BigDecimal.ZERO
    }

    private void assertSameCurrency(Money other) {
        if (this.currency != other.currency) {
            throw new IllegalArgumentException(
                "Cannot operate on different currencies: ${this.currency} vs ${other.currency}"
            )
        }
    }

    @Override
    String toString() {
        "${amount.setScale(2, RoundingMode.HALF_UP)} ${currency.currencyCode}"
    }
}
```

### Transaction.groovy

```groovy
package com.example.banking.domain

import groovy.transform.Canonical
import groovy.transform.CompileStatic

import java.time.LocalDateTime

@CompileStatic
@Canonical
class Transaction {
    final String id = UUID.randomUUID().toString()
    final String accountId
    final TransactionType type
    final Money amount
    final LocalDateTime timestamp
}

@CompileStatic
enum TransactionType {
    DEPOSIT, WITHDRAWAL, TRANSFER_IN, TRANSFER_OUT
}
```

### Auditable.groovy (Trait)

```groovy
package com.example.banking.domain.traits

import groovy.transform.CompileStatic
import java.time.LocalDateTime

/**
 * Groovy Trait for cross-cutting audit concerns
 */
@CompileStatic
trait Auditable {
    LocalDateTime createdAt
    LocalDateTime updatedAt
    String createdBy
    String updatedBy

    void markCreated(String username) {
        this.createdAt = LocalDateTime.now()
        this.createdBy = username
    }

    void markUpdated(String username) {
        this.updatedAt = LocalDateTime.now()
        this.updatedBy = username
    }
}
```

### InsufficientFundsException.groovy

```groovy
package com.example.banking.usecase.exception

import groovy.transform.CompileStatic
import groovy.transform.InheritConstructors

@CompileStatic
@InheritConstructors
class InsufficientFundsException extends RuntimeException {
}
```

---

## Layer 2: Use Cases (Application Business Rules)

### Port Interfaces (Output Boundaries)

```groovy
package com.example.banking.usecase.port

import com.example.banking.domain.Account
import groovy.transform.CompileStatic

/**
 * Output port - Interface defined by use case, implemented by adapter
 */
@CompileStatic
interface AccountRepository {
    Account save(Account account)
    Optional<Account> findById(String accountId)
    Optional<Account> findByAccountNumber(String accountNumber)
    void delete(String accountId)
}
```

### TransferMoney.groovy Use Case

```groovy
package com.example.banking.usecase

import com.example.banking.domain.Account
import com.example.banking.domain.Money
import com.example.banking.usecase.port.AccountRepository
import groovy.transform.Canonical
import groovy.transform.CompileStatic

import java.time.LocalDateTime

/**
 * Use Case - Application business rules
 * NO framework dependencies, only domain and ports
 * Uses @CompileStatic for performance-critical code
 */
@CompileStatic
class TransferMoney {
    private final AccountRepository accountRepository

    TransferMoney(AccountRepository accountRepository) {
        this.accountRepository = accountRepository
    }

    TransferResult execute(TransferRequest request) {
        // 1. Load accounts
        Account sourceAccount = accountRepository
            .findByAccountNumber(request.sourceAccountNumber)
            .orElseThrow {
                new AccountNotFoundException(
                    "Source account not found: ${request.sourceAccountNumber}"
                )
            }

        Account destinationAccount = accountRepository
            .findByAccountNumber(request.destinationAccountNumber)
            .orElseThrow {
                new AccountNotFoundException(
                    "Destination account not found: ${request.destinationAccountNumber}"
                )
            }

        // 2. Validate transfer
        if (!sourceAccount.canTransfer(request.amount)) {
            throw new TransferFailedException(
                "Source account cannot transfer: insufficient funds or inactive"
            )
        }

        // 3. Execute business rules
        sourceAccount.withdraw(request.amount)
        destinationAccount.deposit(request.amount)

        // 4. Persist changes
        accountRepository.save(sourceAccount)
        accountRepository.save(destinationAccount)

        // 5. Return result
        new TransferResult(
            success: true,
            message: "Transfer successful",
            sourceAccountId: sourceAccount.id,
            destinationAccountId: destinationAccount.id,
            amount: request.amount,
            timestamp: LocalDateTime.now()
        )
    }

    // Input data structure
    @Canonical
    static class TransferRequest {
        String sourceAccountNumber
        String destinationAccountNumber
        Money amount
    }

    // Output data structure
    @Canonical
    static class TransferResult {
        boolean success
        String message
        String sourceAccountId
        String destinationAccountId
        Money amount
        LocalDateTime timestamp
    }

    // Use case exceptions
    static class AccountNotFoundException extends RuntimeException {
        AccountNotFoundException(String message) {
            super(message)
        }
    }

    static class TransferFailedException extends RuntimeException {
        TransferFailedException(String message) {
            super(message)
        }
    }
}
```

### DepositMoney.groovy Use Case

```groovy
package com.example.banking.usecase

import com.example.banking.domain.Account
import com.example.banking.domain.Money
import com.example.banking.usecase.port.AccountRepository
import groovy.transform.Canonical
import groovy.transform.CompileStatic

@CompileStatic
class DepositMoney {
    private final AccountRepository accountRepository

    DepositMoney(AccountRepository accountRepository) {
        this.accountRepository = accountRepository
    }

    DepositResult execute(DepositRequest request) {
        Account account = accountRepository
            .findByAccountNumber(request.accountNumber)
            .orElseThrow {
                new AccountNotFoundException(
                    "Account not found: ${request.accountNumber}"
                )
            }

        account.deposit(request.amount)
        accountRepository.save(account)

        new DepositResult(
            success: true,
            message: "Deposit successful",
            accountId: account.id,
            newBalance: account.balance
        )
    }

    @Canonical
    static class DepositRequest {
        String accountNumber
        Money amount
    }

    @Canonical
    static class DepositResult {
        boolean success
        String message
        String accountId
        Money newBalance
    }

    static class AccountNotFoundException extends RuntimeException {
        AccountNotFoundException(String message) {
            super(message)
        }
    }
}
```

### WithdrawMoney.groovy Use Case

```groovy
package com.example.banking.usecase

import com.example.banking.domain.Account
import com.example.banking.domain.Money
import com.example.banking.usecase.port.AccountRepository
import groovy.transform.Canonical
import groovy.transform.CompileStatic

@CompileStatic
class WithdrawMoney {
    private final AccountRepository accountRepository

    WithdrawMoney(AccountRepository accountRepository) {
        this.accountRepository = accountRepository
    }

    WithdrawResult execute(WithdrawRequest request) {
        Account account = accountRepository
            .findByAccountNumber(request.accountNumber)
            .orElseThrow {
                new AccountNotFoundException(
                    "Account not found: ${request.accountNumber}"
                )
            }

        account.withdraw(request.amount)
        accountRepository.save(account)

        new WithdrawResult(
            success: true,
            message: "Withdrawal successful",
            accountId: account.id,
            newBalance: account.balance
        )
    }

    @Canonical
    static class WithdrawRequest {
        String accountNumber
        Money amount
    }

    @Canonical
    static class WithdrawResult {
        boolean success
        String message
        String accountId
        Money newBalance
    }

    static class AccountNotFoundException extends RuntimeException {
        AccountNotFoundException(String message) {
            super(message)
        }
    }
}
```

---

## Layer 3: Interface Adapters

### Web Controller (Input Adapter)

```groovy
package com.example.banking.adapter.web

import com.example.banking.domain.Money
import com.example.banking.usecase.TransferMoney
import com.example.banking.usecase.DepositMoney
import com.example.banking.usecase.WithdrawMoney
import groovy.transform.CompileStatic
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

/**
 * Input Adapter - Translates HTTP requests to use case calls
 * Depends on use cases (inner layer)
 */
@CompileStatic
@RestController
@RequestMapping('/api/accounts')
class AccountController {
    private final TransferMoney transferMoney
    private final DepositMoney depositMoney
    private final WithdrawMoney withdrawMoney

    AccountController(TransferMoney transferMoney,
                     DepositMoney depositMoney,
                     WithdrawMoney withdrawMoney) {
        this.transferMoney = transferMoney
        this.depositMoney = depositMoney
        this.withdrawMoney = withdrawMoney
    }

    @PostMapping('/transfer')
    ResponseEntity<TransferResponse> transfer(@RequestBody TransferRequest request) {
        try {
            // Convert web request to use case request
            def useCaseRequest = new TransferMoney.TransferRequest(
                sourceAccountNumber: request.sourceAccountNumber,
                destinationAccountNumber: request.destinationAccountNumber,
                amount: Money.usd(request.amount)
            )

            // Execute use case
            def result = transferMoney.execute(useCaseRequest)

            // Convert use case result to web response
            def response = new TransferResponse(
                success: result.success,
                message: result.message,
                amount: result.amount.toString()
            )

            ResponseEntity.ok(response)

        } catch (TransferMoney.AccountNotFoundException e) {
            ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new TransferResponse(success: false, message: e.message))
        } catch (Exception e) {
            ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new TransferResponse(success: false, message: e.message))
        }
    }

    @PostMapping('/{accountNumber}/deposit')
    ResponseEntity<DepositResponse> deposit(
            @PathVariable String accountNumber,
            @RequestBody DepositRequest request) {

        def useCaseRequest = new DepositMoney.DepositRequest(
            accountNumber: accountNumber,
            amount: Money.usd(request.amount)
        )

        def result = depositMoney.execute(useCaseRequest)

        ResponseEntity.ok(new DepositResponse(
            success: result.success,
            message: result.message,
            newBalance: result.newBalance.toString()
        ))
    }

    @PostMapping('/{accountNumber}/withdraw')
    ResponseEntity<WithdrawResponse> withdraw(
            @PathVariable String accountNumber,
            @RequestBody WithdrawRequest request) {

        def useCaseRequest = new WithdrawMoney.WithdrawRequest(
            accountNumber: accountNumber,
            amount: Money.usd(request.amount)
        )

        def result = withdrawMoney.execute(useCaseRequest)

        ResponseEntity.ok(new WithdrawResponse(
            success: result.success,
            message: result.message,
            newBalance: result.newBalance.toString()
        ))
    }
}

// Web DTOs using Groovy's map constructor
class TransferRequest {
    String sourceAccountNumber
    String destinationAccountNumber
    String amount
}

class TransferResponse {
    boolean success
    String message
    String amount
}

class DepositRequest {
    String amount
}

class DepositResponse {
    boolean success
    String message
    String newBalance
}

class WithdrawRequest {
    String amount
}

class WithdrawResponse {
    boolean success
    String message
    String newBalance
}
```

### Persistence Adapter (Output Adapter)

```groovy
package com.example.banking.adapter.persistence

import com.example.banking.domain.Account
import com.example.banking.domain.Money
import com.example.banking.domain.Transaction
import com.example.banking.usecase.port.AccountRepository
import groovy.transform.CompileStatic
import org.springframework.stereotype.Repository

/**
 * Output Adapter - Implements use case port
 * Translates between domain models and persistence models
 */
@CompileStatic
@Repository
class JpaAccountRepositoryAdapter implements AccountRepository {
    private final SpringDataAccountRepository springDataRepository

    JpaAccountRepositoryAdapter(SpringDataAccountRepository springDataRepository) {
        this.springDataRepository = springDataRepository
    }

    @Override
    Account save(Account account) {
        AccountEntity entity = toEntity(account)
        AccountEntity saved = springDataRepository.save(entity)
        toDomain(saved)
    }

    @Override
    Optional<Account> findById(String accountId) {
        springDataRepository.findById(accountId)
            .map { toDomain(it) }
    }

    @Override
    Optional<Account> findByAccountNumber(String accountNumber) {
        springDataRepository.findByAccountNumber(accountNumber)
            .map { toDomain(it) }
    }

    @Override
    void delete(String accountId) {
        springDataRepository.deleteById(accountId)
    }

    // Mapping: Domain → Entity
    private AccountEntity toEntity(Account account) {
        new AccountEntity(
            id: account.id,
            accountNumber: account.accountNumber,
            ownerName: account.ownerName,
            balanceAmount: account.balance.amount,
            balanceCurrency: account.balance.currency.currencyCode,
            status: account.status.name(),
            createdAt: account.createdAt,
            transactions: account.transactions.collect { toTransactionEntity(it) }
        )
    }

    // Mapping: Entity → Domain
    private Account toDomain(AccountEntity entity) {
        Money balance = new Money(
            amount: entity.balanceAmount,
            currency: Currency.getInstance(entity.balanceCurrency)
        )

        List<Transaction> transactions = entity.transactions.collect {
            toTransactionDomain(it)
        }

        Account.builder()
            .id(entity.id)
            .accountNumber(entity.accountNumber)
            .ownerName(entity.ownerName)
            .balance(balance)
            .transactions(transactions)
            .createdAt(entity.createdAt)
            .status(Account.AccountStatus.valueOf(entity.status))
            .build()
    }

    private TransactionEntity toTransactionEntity(Transaction transaction) {
        new TransactionEntity(
            id: transaction.id,
            accountId: transaction.accountId,
            type: transaction.type.name(),
            amount: transaction.amount.amount,
            currency: transaction.amount.currency.currencyCode,
            timestamp: transaction.timestamp
        )
    }

    private Transaction toTransactionDomain(TransactionEntity entity) {
        Money amount = new Money(
            amount: entity.amount,
            currency: Currency.getInstance(entity.currency)
        )

        new Transaction(
            accountId: entity.accountId,
            type: TransactionType.valueOf(entity.type),
            amount: amount,
            timestamp: entity.timestamp
        )
    }
}
```

### JPA Entities (Persistence Models)

```groovy
package com.example.banking.adapter.persistence

import groovy.transform.CompileStatic
import jakarta.persistence.*

import java.time.LocalDateTime

/**
 * JPA Entity - Persistence model (NOT domain model)
 */
@CompileStatic
@Entity
@Table(name = 'accounts')
class AccountEntity {
    @Id
    String id

    @Column(unique = true, nullable = false)
    String accountNumber

    String ownerName
    BigDecimal balanceAmount
    String balanceCurrency
    String status
    LocalDateTime createdAt

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = 'account_id')
    List<TransactionEntity> transactions = []
}

@CompileStatic
@Entity
@Table(name = 'transactions')
class TransactionEntity {
    @Id
    String id

    String accountId
    String type
    BigDecimal amount
    String currency
    LocalDateTime timestamp
}
```

---

## Layer 4: Frameworks & Drivers

### Spring Boot Application

```groovy
package com.example.banking.infrastructure

import groovy.transform.CompileStatic
import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.context.annotation.ComponentScan

@CompileStatic
@SpringBootApplication
@ComponentScan(basePackages = ['com.example.banking'])
class BankingApplication {
    static void main(String[] args) {
        SpringApplication.run(BankingApplication, args)
    }
}
```

### Use Case Configuration

```groovy
package com.example.banking.infrastructure.config

import com.example.banking.usecase.DepositMoney
import com.example.banking.usecase.TransferMoney
import com.example.banking.usecase.WithdrawMoney
import com.example.banking.usecase.port.AccountRepository
import groovy.transform.CompileStatic
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

/**
 * Dependency injection configuration
 * Wires use cases with their dependencies
 */
@CompileStatic
@Configuration
class UseCaseConfig {

    @Bean
    TransferMoney transferMoney(AccountRepository accountRepository) {
        new TransferMoney(accountRepository)
    }

    @Bean
    DepositMoney depositMoney(AccountRepository accountRepository) {
        new DepositMoney(accountRepository)
    }

    @Bean
    WithdrawMoney withdrawMoney(AccountRepository accountRepository) {
        new WithdrawMoney(accountRepository)
    }
}
```

### Spring Data Repository

```groovy
package com.example.banking.infrastructure.persistence

import com.example.banking.adapter.persistence.AccountEntity
import groovy.transform.CompileStatic
import org.springframework.data.jpa.repository.JpaRepository

@CompileStatic
interface SpringDataAccountRepository extends JpaRepository<AccountEntity, String> {
    Optional<AccountEntity> findByAccountNumber(String accountNumber)
}
```

---

## Groovy-Specific Features

### 1. AST Transformations

**@Canonical** - Automatic equals, hashCode, toString:
```groovy
@Canonical
class Money {
    BigDecimal amount
    Currency currency
}
// Automatically generates equals(), hashCode(), toString()
```

**@Immutable** - Enforces immutability:
```groovy
@Immutable
class Money {
    BigDecimal amount
    Currency currency
}
// Fields are final, defensive copying, thread-safe
```

**@CompileStatic** - Static type checking:
```groovy
@CompileStatic
class TransferMoney {
    // Type-safe, compile-time checking, better performance
}
```

### 2. Operator Overloading

```groovy
Money balance = Money.usd('1000')
Money deposit = Money.usd('500')

// Natural arithmetic operators
Money newBalance = balance + deposit  // calls plus()
Money remaining = balance - deposit   // calls minus()

// Comparison operators
boolean canAfford = balance >= deposit  // calls compareTo()
```

### 3. Closures for Validation

```groovy
class Account {
    // Closure-based validation
    def validateTransfer = { Money amount ->
        status == AccountStatus.ACTIVE && balance >= amount
    }

    boolean canTransfer(Money amount) {
        validateTransfer(amount)
    }
}
```

### 4. Traits for Mixins

```groovy
trait Auditable {
    LocalDateTime createdAt
    LocalDateTime updatedAt

    void markCreated(String username) {
        this.createdAt = LocalDateTime.now()
        this.createdBy = username
    }
}

// Mix into any class
class Account implements Auditable {
    // Gets audit methods automatically
}
```

### 5. Elvis Operator

```groovy
// Safe null handling
String id = providedId ?: UUID.randomUUID().toString()

// Optional chaining
account?.balance?.amount
```

---

## Testing Strategy with Spock

### Domain Tests

```groovy
package com.example.banking.domain

import spock.lang.Specification
import spock.lang.Subject

class AccountSpec extends Specification {

    @Subject
    Account account

    def setup() {
        account = new Account(
            accountNumber: 'ACC001',
            ownerName: 'John Doe',
            balance: Money.usd('1000')
        )
    }

    def "should withdraw money when sufficient funds"() {
        when:
        account.withdraw(Money.usd('100'))

        then:
        account.balance == Money.usd('900')
        account.transactions.size() == 1
        account.transactions[0].type == TransactionType.WITHDRAWAL
    }

    def "should throw exception when insufficient funds"() {
        when:
        account.withdraw(Money.usd('1500'))

        then:
        thrown(InsufficientFundsException)
        account.balance == Money.usd('1000') // unchanged
    }

    def "should deposit money successfully"() {
        when:
        account.deposit(Money.usd('500'))

        then:
        account.balance == Money.usd('1500')
        account.transactions.size() == 1
    }

    def "withdrawing #amount from balance of #initial should result in #expected"() {
        given:
        account.balance = Money.usd(initial)

        when:
        account.withdraw(Money.usd(amount))

        then:
        account.balance == Money.usd(expected)

        where:
        initial | amount | expected
        '1000'  | '100'  | '900'
        '500'   | '500'  | '0'
        '750'   | '250'  | '500'
    }
}
```

### Use Case Tests with Mocks

```groovy
package com.example.banking.usecase

import com.example.banking.domain.Account
import com.example.banking.domain.Money
import com.example.banking.usecase.port.AccountRepository
import spock.lang.Specification
import spock.lang.Subject

class TransferMoneySpec extends Specification {

    AccountRepository accountRepository = Mock()

    @Subject
    TransferMoney transferMoney = new TransferMoney(accountRepository)

    def "should transfer money between accounts"() {
        given:
        def source = new Account(
            accountNumber: 'ACC001',
            ownerName: 'Alice',
            balance: Money.usd('1000')
        )
        def destination = new Account(
            accountNumber: 'ACC002',
            ownerName: 'Bob',
            balance: Money.usd('500')
        )

        accountRepository.findByAccountNumber('ACC001') >> Optional.of(source)
        accountRepository.findByAccountNumber('ACC002') >> Optional.of(destination)

        when:
        def request = new TransferMoney.TransferRequest(
            sourceAccountNumber: 'ACC001',
            destinationAccountNumber: 'ACC002',
            amount: Money.usd('200')
        )
        def result = transferMoney.execute(request)

        then:
        result.success
        source.balance == Money.usd('800')
        destination.balance == Money.usd('700')

        2 * accountRepository.save(_) // called twice
    }

    def "should fail when source account not found"() {
        given:
        accountRepository.findByAccountNumber(_) >> Optional.empty()

        when:
        def request = new TransferMoney.TransferRequest(
            sourceAccountNumber: 'ACC001',
            destinationAccountNumber: 'ACC002',
            amount: Money.usd('200')
        )
        transferMoney.execute(request)

        then:
        thrown(TransferMoney.AccountNotFoundException)
    }
}
```

### Integration Tests

```groovy
package com.example.banking.adapter.web

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import spock.lang.Specification

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

@SpringBootTest
@AutoConfigureMockMvc
class AccountControllerSpec extends Specification {

    @Autowired
    MockMvc mockMvc

    def "should transfer money via REST API"() {
        given:
        def requestBody = '''
            {
                "sourceAccountNumber": "ACC001",
                "destinationAccountNumber": "ACC002",
                "amount": "100.00"
            }
        '''

        expect:
        mockMvc.perform(
            post('/api/accounts/transfer')
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody)
        )
        .andExpect(status().isOk())
        .andExpect(jsonPath('$.success').value(true))
    }
}
```

---

## Running the Example

### build.gradle

```groovy
plugins {
    id 'groovy'
    id 'org.springframework.boot' version '3.2.0'
    id 'io.spring.dependency-management' version '1.1.4'
}

group = 'com.example'
version = '1.0.0'
sourceCompatibility = '17'

repositories {
    mavenCentral()
}

dependencies {
    // Groovy
    implementation 'org.apache.groovy:groovy:4.0.15'

    // Spring Boot
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'

    // Database
    runtimeOnly 'com.h2database:h2'

    // Testing
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.spockframework:spock-core:2.3-groovy-4.0'
    testImplementation 'org.spockframework:spock-spring:2.3-groovy-4.0'
}

test {
    useJUnitPlatform()
}
```

### application.yml

```yaml
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
./gradlew bootRun
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
3. **Groovy Strengths** - @Canonical, @Immutable, operator overloading, traits
4. **Testability with Spock** - Expressive tests with given/when/then
5. **AST Transformations** - Reduce boilerplate while maintaining clarity
6. **CompileStatic** - Type safety for performance-critical code
7. **Closures** - Flexible, readable business rules
8. **Traits** - Cross-cutting concerns via mixins

**Groovy vs Java Benefits:**
- **40-50% less code** with AST transformations
- **Natural operators** for domain objects (+ - < >)
- **Spock tests** are more readable than JUnit
- **Traits** for cross-cutting concerns vs interfaces
- **Optional typing** for rapid prototyping, @CompileStatic for production

---

**Related Guides:**
- [Deep Dive: Clean Architecture](../../../3-design/architecture-pattern/deep-dive-clean-architecture.md)
- [Groovy Setup Guide](../groovy/project-setup.md)

*Last Updated: 2025-10-20*
