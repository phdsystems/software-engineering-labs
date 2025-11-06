# Clean Architecture - Kotlin Implementation

**Pattern:** Clean Architecture
**Language:** Kotlin
**Framework:** Spring Boot 3.x with Kotlin (outer layer only)
**Related Guide:** [Deep Dive: Clean Architecture](../../../3-design/architecture-pattern/deep-dive-clean-architecture.md)

## TL;DR

**Complete Clean Architecture implementation in Kotlin** with strict dependency rules showing all four layers: Entities → Use Cases → Interface Adapters → Frameworks. **Key advantage**: Kotlin's null safety, data classes, and sealed classes make domain modeling cleaner and safer. **Dependencies point inward only**. Domain has zero framework dependencies.

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Layer 1: Entities (Enterprise Business Rules)](#layer-1-entities-enterprise-business-rules)
4. [Layer 2: Use Cases (Application Business Rules)](#layer-2-use-cases-application-business-rules)
5. [Layer 3: Interface Adapters](#layer-3-interface-adapters)
6. [Layer 4: Frameworks & Drivers](#layer-4-frameworks--drivers)
7. [Testing Strategy](#testing-strategy)
8. [Running the Example](#running-the-example)

---

## Overview

This example demonstrates Clean Architecture for a banking system with:

- **Layer 1 (Entities)** - Account, Transaction domain models (data classes)
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
└── src/main/kotlin/com/example/banking/
    ├── domain/                          # Layer 1: Entities
    │   ├── Account.kt
    │   ├── Transaction.kt
    │   ├── Money.kt
    │   └── AccountStatus.kt
    │
    ├── usecase/                         # Layer 2: Use Cases
    │   ├── TransferMoney.kt
    │   ├── DepositMoney.kt
    │   ├── WithdrawMoney.kt
    │   ├── port/
    │   │   ├── AccountRepository.kt     # Output port (interface)
    │   │   └── TransactionRepository.kt
    │   └── exception/
    │       └── InsufficientFundsException.kt
    │
    ├── adapter/                         # Layer 3: Interface Adapters
    │   ├── web/                         # Input adapters
    │   │   ├── AccountController.kt
    │   │   ├── TransferRequest.kt
    │   │   └── AccountResponse.kt
    │   ├── persistence/                 # Output adapters
    │   │   ├── JpaAccountRepository.kt
    │   │   ├── AccountEntity.kt
    │   │   └── AccountMapper.kt
    │   └── presenter/
    │       └── AccountPresenter.kt
    │
    └── infrastructure/                  # Layer 4: Frameworks
        ├── BankingApplication.kt
        ├── config/
        │   └── UseCaseConfig.kt
        └── persistence/
            └── SpringDataAccountRepository.kt
```

---

## Layer 1: Entities (Enterprise Business Rules)

### Money.kt (Value Object)

```kotlin
package com.example.banking.domain

import java.math.BigDecimal

/**
 * Value object representing money - immutable
 */
data class Money(val amount: BigDecimal, val currency: String = "USD") {

    init {
        require(amount >= BigDecimal.ZERO) { "Amount cannot be negative" }
        require(currency.length == 3) { "Currency code must be 3 characters" }
    }

    operator fun plus(other: Money): Money {
        requireSameCurrency(other)
        return Money(amount + other.amount, currency)
    }

    operator fun minus(other: Money): Money {
        requireSameCurrency(other)
        return Money(amount - other.amount, currency)
    }

    operator fun compareTo(other: Money): Int {
        requireSameCurrency(other)
        return amount.compareTo(other.amount)
    }

    fun isLessThan(other: Money): Boolean = this < other
    fun isGreaterThan(other: Money): Boolean = this > other

    private fun requireSameCurrency(other: Money) {
        require(currency == other.currency) {
            "Cannot operate on different currencies: $currency vs ${other.currency}"
        }
    }

    companion object {
        val ZERO = Money(BigDecimal.ZERO)

        fun of(amount: String, currency: String = "USD") = Money(BigDecimal(amount), currency)
        fun of(amount: Double, currency: String = "USD") = Money(BigDecimal.valueOf(amount), currency)
    }
}
```

### AccountStatus.kt

```kotlin
package com.example.banking.domain

enum class AccountStatus {
    ACTIVE,
    FROZEN,
    CLOSED
}
```

### Transaction.kt

```kotlin
package com.example.banking.domain

import java.time.LocalDateTime
import java.util.UUID

data class Transaction(
    val id: String = UUID.randomUUID().toString(),
    val accountId: String,
    val type: TransactionType,
    val amount: Money,
    val timestamp: LocalDateTime = LocalDateTime.now(),
    val description: String? = null
)

enum class TransactionType {
    DEPOSIT,
    WITHDRAWAL,
    TRANSFER_IN,
    TRANSFER_OUT
}
```

### Account.kt

```kotlin
package com.example.banking.domain

import java.time.LocalDateTime
import java.util.UUID

/**
 * Core business entity - NO framework dependencies
 * Uses Kotlin's null safety and immutability
 */
class Account(
    val id: String = UUID.randomUUID().toString(),
    val accountNumber: String,
    val ownerName: String,
    private var _balance: Money,
    private val _transactions: MutableList<Transaction> = mutableListOf(),
    val createdAt: LocalDateTime = LocalDateTime.now(),
    var status: AccountStatus = AccountStatus.ACTIVE
) {
    // Expose immutable views
    val balance: Money get() = _balance
    val transactions: List<Transaction> get() = _transactions.toList()

    // Business rule: Withdraw money
    fun withdraw(amount: Money) {
        require(status == AccountStatus.ACTIVE) { "Account is not active" }
        require(!balance.isLessThan(amount)) {
            "Insufficient funds. Available: $balance, Required: $amount"
        }

        _balance -= amount
        _transactions.add(Transaction(
            accountId = id,
            type = TransactionType.WITHDRAWAL,
            amount = amount,
            description = "Withdrawal"
        ))
    }

    // Business rule: Deposit money
    fun deposit(amount: Money) {
        require(status == AccountStatus.ACTIVE) { "Account is not active" }
        require(amount > Money.ZERO) { "Deposit amount must be positive" }

        _balance += amount
        _transactions.add(Transaction(
            accountId = id,
            type = TransactionType.DEPOSIT,
            amount = amount,
            description = "Deposit"
        ))
    }

    // Business rule: Transfer out
    fun transferOut(amount: Money, toAccountId: String) {
        require(status == AccountStatus.ACTIVE) { "Account is not active" }
        require(!balance.isLessThan(amount)) {
            "Insufficient funds for transfer. Available: $balance, Required: $amount"
        }

        _balance -= amount
        _transactions.add(Transaction(
            accountId = id,
            type = TransactionType.TRANSFER_OUT,
            amount = amount,
            description = "Transfer to $toAccountId"
        ))
    }

    // Business rule: Receive transfer
    fun receiveTransfer(amount: Money, fromAccountId: String) {
        require(status == AccountStatus.ACTIVE) { "Account is not active" }

        _balance += amount
        _transactions.add(Transaction(
            accountId = id,
            type = TransactionType.TRANSFER_IN,
            amount = amount,
            description = "Transfer from $fromAccountId"
        ))
    }

    fun freeze() {
        status = AccountStatus.FROZEN
    }

    fun activate() {
        status = AccountStatus.ACTIVE
    }
}
```

---

## Layer 2: Use Cases (Application Business Rules)

### port/AccountRepository.kt

```kotlin
package com.example.banking.usecase.port

import com.example.banking.domain.Account

/**
 * Output port - interface owned by use case layer
 * Implementation details are in adapter layer
 */
interface AccountRepository {
    fun save(account: Account): Account
    fun findById(id: String): Account?
    fun findByAccountNumber(accountNumber: String): Account?
    fun findAll(): List<Account>
    fun delete(id: String)
}
```

### TransferMoney.kt

```kotlin
package com.example.banking.usecase

import com.example.banking.domain.Money
import com.example.banking.usecase.port.AccountRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * Use Case: Transfer money between accounts
 * Orchestrates business rules, no framework logic
 */
@Service
class TransferMoney(
    private val accountRepository: AccountRepository
) {
    @Transactional
    fun execute(fromAccountId: String, toAccountId: String, amount: Money): TransferResult {
        // Find accounts
        val fromAccount = accountRepository.findById(fromAccountId)
            ?: throw AccountNotFoundException("Source account not found: $fromAccountId")

        val toAccount = accountRepository.findById(toAccountId)
            ?: throw AccountNotFoundException("Destination account not found: $toAccountId")

        // Execute business rules (domain logic)
        fromAccount.transferOut(amount, toAccountId)
        toAccount.receiveTransfer(amount, fromAccountId)

        // Persist changes
        accountRepository.save(fromAccount)
        accountRepository.save(toAccount)

        return TransferResult(
            fromAccountId = fromAccount.id,
            toAccountId = toAccount.id,
            amount = amount,
            newFromBalance = fromAccount.balance,
            newToBalance = toAccount.balance
        )
    }
}

data class TransferResult(
    val fromAccountId: String,
    val toAccountId: String,
    val amount: Money,
    val newFromBalance: Money,
    val newToBalance: Money
)

class AccountNotFoundException(message: String) : RuntimeException(message)
```

### DepositMoney.kt

```kotlin
package com.example.banking.usecase

import com.example.banking.domain.Money
import com.example.banking.usecase.port.AccountRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class DepositMoney(
    private val accountRepository: AccountRepository
) {
    @Transactional
    fun execute(accountId: String, amount: Money): DepositResult {
        val account = accountRepository.findById(accountId)
            ?: throw AccountNotFoundException("Account not found: $accountId")

        account.deposit(amount)
        accountRepository.save(account)

        return DepositResult(
            accountId = account.id,
            amount = amount,
            newBalance = account.balance
        )
    }
}

data class DepositResult(
    val accountId: String,
    val amount: Money,
    val newBalance: Money
)
```

### WithdrawMoney.kt

```kotlin
package com.example.banking.usecase

import com.example.banking.domain.Money
import com.example.banking.usecase.port.AccountRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class WithdrawMoney(
    private val accountRepository: AccountRepository
) {
    @Transactional
    fun execute(accountId: String, amount: Money): WithdrawalResult {
        val account = accountRepository.findById(accountId)
            ?: throw AccountNotFoundException("Account not found: $accountId")

        account.withdraw(amount)
        accountRepository.save(account)

        return WithdrawalResult(
            accountId = account.id,
            amount = amount,
            newBalance = account.balance
        )
    }
}

data class WithdrawalResult(
    val accountId: String,
    val amount: Money,
    val newBalance: Money
)
```

---

## Layer 3: Interface Adapters

### web/AccountController.kt

```kotlin
package com.example.banking.adapter.web

import com.example.banking.domain.Money
import com.example.banking.usecase.*
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/accounts")
class AccountController(
    private val transferMoney: TransferMoney,
    private val depositMoney: DepositMoney,
    private val withdrawMoney: WithdrawMoney
) {
    @PostMapping("/{accountId}/deposit")
    fun deposit(
        @PathVariable accountId: String,
        @RequestBody request: MoneyRequest
    ): ResponseEntity<DepositResponse> {
        val result = depositMoney.execute(
            accountId = accountId,
            amount = Money.of(request.amount, request.currency)
        )

        return ResponseEntity.ok(DepositResponse(
            accountId = result.accountId,
            depositedAmount = result.amount.amount.toString(),
            newBalance = result.newBalance.amount.toString(),
            currency = result.newBalance.currency
        ))
    }

    @PostMapping("/{accountId}/withdraw")
    fun withdraw(
        @PathVariable accountId: String,
        @RequestBody request: MoneyRequest
    ): ResponseEntity<WithdrawalResponse> {
        val result = withdrawMoney.execute(
            accountId = accountId,
            amount = Money.of(request.amount, request.currency)
        )

        return ResponseEntity.ok(WithdrawalResponse(
            accountId = result.accountId,
            withdrawnAmount = result.amount.amount.toString(),
            newBalance = result.newBalance.amount.toString(),
            currency = result.newBalance.currency
        ))
    }

    @PostMapping("/transfer")
    fun transfer(@RequestBody request: TransferRequest): ResponseEntity<TransferResponse> {
        val result = transferMoney.execute(
            fromAccountId = request.fromAccountId,
            toAccountId = request.toAccountId,
            amount = Money.of(request.amount, request.currency)
        )

        return ResponseEntity.ok(TransferResponse(
            fromAccountId = result.fromAccountId,
            toAccountId = result.toAccountId,
            amount = result.amount.amount.toString(),
            currency = result.amount.currency,
            newFromBalance = result.newFromBalance.amount.toString(),
            newToBalance = result.newToBalance.amount.toString()
        ))
    }

    @ExceptionHandler(AccountNotFoundException::class)
    fun handleAccountNotFound(ex: AccountNotFoundException): ResponseEntity<ErrorResponse> {
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(ErrorResponse(ex.message ?: "Account not found"))
    }

    @ExceptionHandler(IllegalArgumentException::class, IllegalStateException::class)
    fun handleValidationError(ex: Exception): ResponseEntity<ErrorResponse> {
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse(ex.message ?: "Invalid request"))
    }
}

// DTOs (Data Transfer Objects)
data class MoneyRequest(
    val amount: String,
    val currency: String = "USD"
)

data class TransferRequest(
    val fromAccountId: String,
    val toAccountId: String,
    val amount: String,
    val currency: String = "USD"
)

data class DepositResponse(
    val accountId: String,
    val depositedAmount: String,
    val newBalance: String,
    val currency: String
)

data class WithdrawalResponse(
    val accountId: String,
    val withdrawnAmount: String,
    val newBalance: String,
    val currency: String
)

data class TransferResponse(
    val fromAccountId: String,
    val toAccountId: String,
    val amount: String,
    val currency: String,
    val newFromBalance: String,
    val newToBalance: String
)

data class ErrorResponse(val error: String)
```

### persistence/JpaAccountRepository.kt

```kotlin
package com.example.banking.adapter.persistence

import com.example.banking.domain.Account
import com.example.banking.usecase.port.AccountRepository
import org.springframework.stereotype.Repository

/**
 * Adapter implementing the output port
 * Translates between domain models and persistence models
 */
@Repository
class JpaAccountRepository(
    private val springDataRepository: SpringDataAccountRepository,
    private val accountMapper: AccountMapper
) : AccountRepository {

    override fun save(account: Account): Account {
        val entity = accountMapper.toEntity(account)
        val saved = springDataRepository.save(entity)
        return accountMapper.toDomain(saved)
    }

    override fun findById(id: String): Account? {
        return springDataRepository.findById(id)
            .map { accountMapper.toDomain(it) }
            .orElse(null)
    }

    override fun findByAccountNumber(accountNumber: String): Account? {
        return springDataRepository.findByAccountNumber(accountNumber)
            ?.let { accountMapper.toDomain(it) }
    }

    override fun findAll(): List<Account> {
        return springDataRepository.findAll()
            .map { accountMapper.toDomain(it) }
    }

    override fun delete(id: String) {
        springDataRepository.deleteById(id)
    }
}
```

### persistence/AccountEntity.kt

```kotlin
package com.example.banking.adapter.persistence

import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * JPA entity - framework-specific persistence model
 * Separated from domain model
 */
@Entity
@Table(name = "accounts")
data class AccountEntity(
    @Id
    val id: String,

    @Column(unique = true, nullable = false)
    val accountNumber: String,

    @Column(nullable = false)
    val ownerName: String,

    @Column(nullable = false)
    val balanceAmount: BigDecimal,

    @Column(nullable = false)
    val balanceCurrency: String,

    @Column(nullable = false)
    val createdAt: LocalDateTime,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val status: String
) {
    constructor() : this("", "", "", BigDecimal.ZERO, "USD", LocalDateTime.now(), "ACTIVE")
}
```

### persistence/AccountMapper.kt

```kotlin
package com.example.banking.adapter.persistence

import com.example.banking.domain.Account
import com.example.banking.domain.AccountStatus
import com.example.banking.domain.Money
import org.springframework.stereotype.Component

/**
 * Maps between domain models and persistence models
 */
@Component
class AccountMapper {

    fun toDomain(entity: AccountEntity): Account {
        return Account(
            id = entity.id,
            accountNumber = entity.accountNumber,
            ownerName = entity.ownerName,
            _balance = Money(entity.balanceAmount, entity.balanceCurrency),
            createdAt = entity.createdAt,
            status = AccountStatus.valueOf(entity.status)
        )
    }

    fun toEntity(domain: Account): AccountEntity {
        return AccountEntity(
            id = domain.id,
            accountNumber = domain.accountNumber,
            ownerName = domain.ownerName,
            balanceAmount = domain.balance.amount,
            balanceCurrency = domain.balance.currency,
            createdAt = domain.createdAt,
            status = domain.status.name
        )
    }
}
```

---

## Layer 4: Frameworks & Drivers

### BankingApplication.kt

```kotlin
package com.example.banking.infrastructure

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication(scanBasePackages = ["com.example.banking"])
class BankingApplication

fun main(args: Array<String>) {
    runApplication<BankingApplication>(*args)
}
```

### config/UseCaseConfig.kt

```kotlin
package com.example.banking.infrastructure.config

import com.example.banking.usecase.*
import com.example.banking.usecase.port.AccountRepository
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

/**
 * Dependency injection configuration
 * Wires together the clean architecture layers
 */
@Configuration
class UseCaseConfig {

    @Bean
    fun transferMoney(accountRepository: AccountRepository) =
        TransferMoney(accountRepository)

    @Bean
    fun depositMoney(accountRepository: AccountRepository) =
        DepositMoney(accountRepository)

    @Bean
    fun withdrawMoney(accountRepository: AccountRepository) =
        WithdrawMoney(accountRepository)
}
```

### persistence/SpringDataAccountRepository.kt

```kotlin
package com.example.banking.adapter.persistence

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface SpringDataAccountRepository : JpaRepository<AccountEntity, String> {
    fun findByAccountNumber(accountNumber: String): AccountEntity?
}
```

---

## Testing Strategy

### Unit Test (Domain Layer)

```kotlin
package com.example.banking.domain

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class AccountTest {

    @Test
    fun `should deposit money successfully`() {
        val account = Account(
            accountNumber = "123456",
            ownerName = "John Doe",
            _balance = Money.of("1000.00")
        )

        account.deposit(Money.of("500.00"))

        assertEquals(Money.of("1500.00"), account.balance)
        assertEquals(1, account.transactions.size)
        assertEquals(TransactionType.DEPOSIT, account.transactions[0].type)
    }

    @Test
    fun `should withdraw money when sufficient funds`() {
        val account = Account(
            accountNumber = "123456",
            ownerName = "John Doe",
            _balance = Money.of("1000.00")
        )

        account.withdraw(Money.of("300.00"))

        assertEquals(Money.of("700.00"), account.balance)
        assertEquals(TransactionType.WITHDRAWAL, account.transactions[0].type)
    }

    @Test
    fun `should throw exception when withdrawing more than balance`() {
        val account = Account(
            accountNumber = "123456",
            ownerName = "John Doe",
            _balance = Money.of("500.00")
        )

        assertThrows<IllegalArgumentException> {
            account.withdraw(Money.of("600.00"))
        }
    }
}
```

### Integration Test (Use Case Layer)

```kotlin
package com.example.banking.usecase

import com.example.banking.domain.Account
import com.example.banking.domain.Money
import com.example.banking.usecase.port.AccountRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class TransferMoneyTest {

    private val accountRepository: AccountRepository = mockk()
    private val transferMoney = TransferMoney(accountRepository)

    @Test
    fun `should transfer money between accounts`() {
        val fromAccount = Account(
            accountNumber = "111111",
            ownerName = "Alice",
            _balance = Money.of("1000.00")
        )

        val toAccount = Account(
            accountNumber = "222222",
            ownerName = "Bob",
            _balance = Money.of("500.00")
        )

        every { accountRepository.findById(fromAccount.id) } returns fromAccount
        every { accountRepository.findById(toAccount.id) } returns toAccount
        every { accountRepository.save(any()) } returnsArgument 0

        val result = transferMoney.execute(
            fromAccountId = fromAccount.id,
            toAccountId = toAccount.id,
            amount = Money.of("200.00")
        )

        assertEquals(Money.of("200.00"), result.amount)
        verify(exactly = 2) { accountRepository.save(any()) }
    }
}
```

---

## Running the Example

### Build Configuration (build.gradle.kts)

```kotlin
plugins {
    kotlin("jvm") version "1.9.20"
    kotlin("plugin.spring") version "1.9.20"
    kotlin("plugin.jpa") version "1.9.20"
    id("org.springframework.boot") version "3.2.0"
    id("io.spring.dependency-management") version "1.1.4"
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")

    runtimeOnly("com.h2database:h2")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.mockk:mockk:1.13.8")
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
```

### Run Commands

```bash
# Build
./gradlew build

# Run
./gradlew bootRun

# Test
./gradlew test
```

### API Examples

```bash
# Deposit money
curl -X POST http://localhost:8080/api/accounts/123/deposit \
  -H "Content-Type: application/json" \
  -d '{"amount": "500.00", "currency": "USD"}'

# Withdraw money
curl -X POST http://localhost:8080/api/accounts/123/withdraw \
  -H "Content-Type: application/json" \
  -d '{"amount": "200.00", "currency": "USD"}'

# Transfer money
curl -X POST http://localhost:8080/api/accounts/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "fromAccountId": "123",
    "toAccountId": "456",
    "amount": "300.00",
    "currency": "USD"
  }'
```

---

## Key Kotlin Advantages

✅ **Null Safety** - No NullPointerExceptions in domain logic
✅ **Data Classes** - Automatic equals/hashCode/toString for value objects
✅ **Operator Overloading** - Natural Money arithmetic (`balance - amount`)
✅ **Smart Casts** - Type-safe after null checks
✅ **Extension Functions** - Add functionality without inheritance
✅ **Sealed Classes** - Type-safe result handling
✅ **Immutability** - `val` by default, encouraging pure functions

---

*Last Updated: 2025-10-20*
