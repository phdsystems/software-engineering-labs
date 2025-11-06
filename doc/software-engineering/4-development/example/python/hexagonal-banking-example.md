# Python Hexagonal Architecture: Banking System

**Pattern:** Hexagonal Architecture (Ports & Adapters)
**Language:** Python 3.10+
**Framework:** FastAPI
**Domain:** Banking & Financial Services
**Status:** ✅ Complete
**Parent Guide:** [Python Architecture Patterns

---

## TL;DR

**Complete Python implementation of Hexagonal Architecture** for banking domain with complex business rules. Demonstrates **domain at the center** isolated via ports (interfaces) and adapters (implementations). Domain has **ZERO dependencies** on external frameworks. Shows how to swap implementations (PostgreSQL → MongoDB, REST → GraphQL) without touching domain code. **Perfect for domain-rich applications** with valuable business logic. **Highly testable** - domain tests run without database or HTTP.

---

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Architecture Layers](#architecture-layers)
  - [Domain Layer](#domain-layer)
  - [Ports Layer](#ports-layer)
  - [Adapters Layer](#adapters-layer)
- [Implementation](#implementation)
- [Dependency Injection](#dependency-injection)
- [Testing Strategy](#testing-strategy)
- [Running the System](#running-the-system)
- [Deployment](#deployment)
- [Key Benefits](#key-benefits)

---

## Overview

This example demonstrates:
- ✅ **Domain-centric design** - Business logic at the center
- ✅ **Zero external dependencies in domain** - Pure Python
- ✅ **Ports (interfaces)** - Domain defines what it needs
- ✅ **Adapters (implementations)** - Technology-specific code
- ✅ **Swap implementations easily** - PostgreSQL → MongoDB with no domain changes
- ✅ **High testability** - Test domain without infrastructure

**When to use:**
- Domain-rich applications (banking, insurance, healthcare)
- Complex business rules that are valuable
- Need high testability (mock all external dependencies)
- Long-lived projects requiring flexibility
- Multiple interfaces (REST API, GraphQL, CLI, message queue)

**Why Hexagonal for Banking:**
- Banking has complex domain logic (overdraft protection, transaction rules)
- Business rules must be protected from framework changes
- Need to test business logic without database
- Regulatory requirements demand clear domain isolation
- Multiple integration points (APIs, batch processing, reports)

---

## Project Structure

```
banking-system/
├── src/
│   ├── main/
│   │   ├── domain/                          # ⬢ CENTER: Pure business logic
│   │   │   ├── __init__.py
│   │   │   ├── entities/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── account.py               # Account entity
│   │   │   │   ├── transaction.py           # Transaction entity
│   │   │   │   └── customer.py              # Customer entity
│   │   │   ├── value_objects/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── money.py                 # Money value object
│   │   │   │   └── account_number.py        # Account number VO
│   │   │   ├── services/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── transfer_service.py      # Money transfer logic
│   │   │   │   └── account_service.py       # Account operations
│   │   │   └── exceptions.py                # Domain exceptions
│   │   │
│   │   ├── ports/                           # 🔌 INTERFACES: Contracts
│   │   │   ├── __init__.py
│   │   │   ├── inbound/                     # How outside world calls us
│   │   │   │   ├── __init__.py
│   │   │   │   ├── transfer_use_case.py
│   │   │   │   └── account_use_case.py
│   │   │   └── outbound/                    # How we call outside world
│   │   │       ├── __init__.py
│   │   │       ├── account_repository.py    # Storage interface
│   │   │       ├── transaction_repository.py
│   │   │       └── notification_service.py  # External service interface
│   │   │
│   │   └── adapters/                        # 🔧 IMPLEMENTATIONS: Tech-specific
│   │       ├── __init__.py
│   │       ├── inbound/                     # Driving adapters
│   │       │   ├── __init__.py
│   │       │   ├── api/                     # REST API adapter
│   │       │   │   ├── __init__.py
│   │       │   │   ├── app.py               # FastAPI application
│   │       │   │   ├── routes.py            # HTTP routes
│   │       │   │   └── schemas.py           # Pydantic schemas
│   │       │   └── cli/                     # CLI adapter (optional)
│   │       │       ├── __init__.py
│   │       │       └── commands.py
│   │       │
│   │       └── outbound/                    # Driven adapters
│   │           ├── __init__.py
│   │           ├── persistence/             # Database adapters
│   │           │   ├── __init__.py
│   │           │   ├── postgres/            # PostgreSQL implementation
│   │           │   │   ├── __init__.py
│   │           │   │   ├── account_repo.py
│   │           │   │   ├── transaction_repo.py
│   │           │   │   └── models.py        # SQLAlchemy models
│   │           │   └── mongodb/             # MongoDB implementation (swap!)
│   │           │       ├── __init__.py
│   │           │       └── account_repo.py
│   │           └── notifications/           # External service adapters
│   │               ├── __init__.py
│   │               └── email_notifier.py
│   │
│   └── test/
│       ├── domain/                          # Domain tests (no mocks!)
│       │   ├── entities/
│       │   │   └── test_account.py
│       │   └── services/
│       │       └── test_transfer_service.py
│       ├── adapters/                        # Integration tests
│       │   └── outbound/
│       │       └── persistence/
│       │           └── test_postgres_repo.py
│       └── e2e/                             # End-to-end tests
│           └── test_api.py
│
├── config/
│   └── config.yaml
├── pyproject.toml
├── uv.lock
└── Makefile
```

---

## Architecture Layers

### Domain Layer (Core - No Dependencies)

**Purpose:** Pure business logic - the heart of the application

**Rules:**
- ❌ NO imports from `adapters/` or `ports/`
- ❌ NO database, HTTP, or framework imports
- ✅ Only Python standard library + domain code
- ✅ Entities, value objects, domain services

**Example:**
```python
# ✅ GOOD: Pure domain
from decimal import Decimal
from dataclasses import dataclass

@dataclass
class Account:
    balance: Decimal

    def withdraw(self, amount: Decimal):
        if amount > self.balance:
            raise InsufficientFundsError()

# ❌ BAD: Domain depending on infrastructure
from sqlalchemy import Column, Integer  # ← WRONG!
from fastapi import HTTPException       # ← WRONG!
```

---

### Ports Layer (Interfaces)

**Purpose:** Define contracts between domain and external world

**Inbound Ports:**
- How the outside world calls domain (use cases)
- Domain services implement these

**Outbound Ports:**
- How domain calls external services
- Adapters implement these

**Example:**
```python
# Inbound port: Outside world → Domain
class TransferUseCase(Protocol):
    def execute(self, request: TransferRequest) -> TransferResponse:
        ...

# Outbound port: Domain → Outside world
class AccountRepository(Protocol):
    def find_by_id(self, account_id: str) -> Account:
        ...
    def save(self, account: Account) -> None:
        ...
```

---

### Adapters Layer (Implementations)

**Purpose:** Technology-specific implementations

**Inbound Adapters (Driving):**
- REST API (FastAPI)
- GraphQL
- CLI
- Message queue consumers

**Outbound Adapters (Driven):**
- PostgreSQL repository
- MongoDB repository
- Email notification service
- Payment gateway client

**Key Insight:** Swap adapters without touching domain!

---

## Implementation

### Domain Layer

#### `src/main/domain/entities/account.py`

```python
"""Account entity - core business logic."""
from dataclasses import dataclass, field
from decimal import Decimal
from enum import Enum
from typing import List
from uuid import uuid4
from datetime import datetime

from src.main.domain.value_objects.money import Money
from src.main.domain.exceptions import (
    InsufficientFundsError,
    InvalidAccountStateError,
    NegativeAmountError
)


class AccountStatus(Enum):
    """Account status enumeration."""
    ACTIVE = "active"
    FROZEN = "frozen"
    CLOSED = "closed"


@dataclass
class Account:
    """
    Account aggregate root.

    Business Rules:
    - Cannot withdraw more than balance
    - Cannot operate on frozen/closed accounts
    - Overdraft protection (optional)
    - Minimum balance requirements
    """

    id: str = field(default_factory=lambda: str(uuid4()))
    customer_id: str = ""
    balance: Money = field(default_factory=lambda: Money(Decimal("0")))
    status: AccountStatus = AccountStatus.ACTIVE
    overdraft_limit: Money = field(default_factory=lambda: Money(Decimal("0")))
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

    def withdraw(self, amount: Money) -> None:
        """
        Withdraw money from account.

        Business Rules:
        1. Account must be active
        2. Amount must be positive
        3. Available balance (balance + overdraft) must cover withdrawal

        Args:
            amount: Amount to withdraw

        Raises:
            InvalidAccountStateError: If account not active
            NegativeAmountError: If amount <= 0
            InsufficientFundsError: If insufficient funds
        """
        self._ensure_active()
        self._validate_positive_amount(amount)

        available_balance = self.balance + self.overdraft_limit

        if amount > available_balance:
            raise InsufficientFundsError(
                f"Insufficient funds. Balance: {self.balance}, "
                f"Overdraft: {self.overdraft_limit}, Requested: {amount}"
            )

        self.balance = self.balance - amount
        self.updated_at = datetime.now()

    def deposit(self, amount: Money) -> None:
        """
        Deposit money to account.

        Business Rules:
        1. Account must be active
        2. Amount must be positive

        Args:
            amount: Amount to deposit

        Raises:
            InvalidAccountStateError: If account not active
            NegativeAmountError: If amount <= 0
        """
        self._ensure_active()
        self._validate_positive_amount(amount)

        self.balance = self.balance + amount
        self.updated_at = datetime.now()

    def freeze(self) -> None:
        """
        Freeze account (regulatory compliance, fraud prevention).

        Business Rule: Cannot freeze already closed account
        """
        if self.status == AccountStatus.CLOSED:
            raise InvalidAccountStateError("Cannot freeze closed account")

        self.status = AccountStatus.FROZEN
        self.updated_at = datetime.now()

    def unfreeze(self) -> None:
        """Unfreeze account."""
        if self.status == AccountStatus.FROZEN:
            self.status = AccountStatus.ACTIVE
            self.updated_at = datetime.now()

    def close(self) -> None:
        """
        Close account.

        Business Rule: Account balance must be zero
        """
        if self.balance.amount != Decimal("0"):
            raise InvalidAccountStateError(
                f"Cannot close account with non-zero balance: {self.balance}"
            )

        self.status = AccountStatus.CLOSED
        self.updated_at = datetime.now()

    def _ensure_active(self) -> None:
        """Ensure account is active."""
        if self.status != AccountStatus.ACTIVE:
            raise InvalidAccountStateError(
                f"Account is {self.status.value}. Operation not allowed."
            )

    def _validate_positive_amount(self, amount: Money) -> None:
        """Validate amount is positive."""
        if amount.amount <= Decimal("0"):
            raise NegativeAmountError("Amount must be positive")
```

#### `src/main/domain/value_objects/money.py`

```python
"""Money value object - immutable representation of currency."""
from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class Money:
    """
    Money value object.

    Immutable, always has 2 decimal places.
    Business logic: All monetary calculations in domain.
    """

    amount: Decimal
    currency: str = "USD"

    def __post_init__(self):
        """Validate and normalize amount."""
        # Ensure 2 decimal places
        object.__setattr__(self, 'amount', self.amount.quantize(Decimal('0.01')))

        if self.amount < 0:
            raise ValueError("Money amount cannot be negative")

    def __add__(self, other: 'Money') -> 'Money':
        """Add two money objects."""
        self._ensure_same_currency(other)
        return Money(self.amount + other.amount, self.currency)

    def __sub__(self, other: 'Money') -> 'Money':
        """Subtract two money objects."""
        self._ensure_same_currency(other)
        return Money(self.amount - other.amount, self.currency)

    def __gt__(self, other: 'Money') -> bool:
        """Greater than comparison."""
        self._ensure_same_currency(other)
        return self.amount > other.amount

    def __lt__(self, other: 'Money') -> bool:
        """Less than comparison."""
        self._ensure_same_currency(other)
        return self.amount < other.amount

    def __ge__(self, other: 'Money') -> bool:
        """Greater than or equal comparison."""
        return self > other or self == other

    def __le__(self, other: 'Money') -> bool:
        """Less than or equal comparison."""
        return self < other or self == other

    def _ensure_same_currency(self, other: 'Money') -> None:
        """Ensure both money objects have same currency."""
        if self.currency != other.currency:
            raise ValueError(
                f"Cannot operate on different currencies: {self.currency} vs {other.currency}"
            )

    def __str__(self) -> str:
        """String representation."""
        return f"{self.currency} {self.amount}"
```

#### `src/main/domain/services/transfer_service.py`

```python
"""Transfer service - orchestrates money transfers."""
from decimal import Decimal
from dataclasses import dataclass
from datetime import datetime

from src.main.domain.entities.account import Account
from src.main.domain.value_objects.money import Money
from src.main.domain.exceptions import TransferError


@dataclass
class TransferResult:
    """Result of a money transfer."""
    transaction_id: str
    from_account_id: str
    to_account_id: str
    amount: Money
    timestamp: datetime
    success: bool


class TransferService:
    """
    Domain service for money transfers.

    NOTE: This depends on ports (interfaces), NOT adapters!
    Domain service orchestrates business logic using repository ports.
    """

    def __init__(self, account_repository):
        """
        Initialize transfer service.

        Args:
            account_repository: AccountRepository port (interface)
        """
        # Depends on PORT (interface), not concrete implementation!
        self.account_repository = account_repository

    def transfer(
        self,
        from_account_id: str,
        to_account_id: str,
        amount: Money
    ) -> TransferResult:
        """
        Transfer money between accounts.

        Business Rules:
        1. Both accounts must exist
        2. From account must have sufficient funds
        3. Amount must be positive
        4. Transaction is atomic (both succeed or both fail)

        Args:
            from_account_id: Source account ID
            to_account_id: Destination account ID
            amount: Amount to transfer

        Returns:
            TransferResult

        Raises:
            TransferError: If transfer fails
        """
        # Validate accounts are different
        if from_account_id == to_account_id:
            raise TransferError("Cannot transfer to same account")

        # Load accounts (through port!)
        from_account = self.account_repository.find_by_id(from_account_id)
        to_account = self.account_repository.find_by_id(to_account_id)

        if not from_account:
            raise TransferError(f"Account not found: {from_account_id}")
        if not to_account:
            raise TransferError(f"Account not found: {to_account_id}")

        # Execute business logic (domain entities)
        try:
            from_account.withdraw(amount)
            to_account.deposit(amount)
        except Exception as e:
            # Rollback if either fails
            raise TransferError(f"Transfer failed: {str(e)}") from e

        # Save both accounts (through port!)
        self.account_repository.save(from_account)
        self.account_repository.save(to_account)

        # Record transfer result
        return TransferResult(
            transaction_id=f"TXN-{from_account_id}-{to_account_id}",
            from_account_id=from_account_id,
            to_account_id=to_account_id,
            amount=amount,
            timestamp=datetime.now(),
            success=True
        )
```

#### `src/main/domain/exceptions.py`

```python
"""Domain exceptions."""


class DomainException(Exception):
    """Base exception for domain errors."""
    pass


class InsufficientFundsError(DomainException):
    """Raised when account has insufficient funds."""
    pass


class InvalidAccountStateError(DomainException):
    """Raised when operation invalid for account state."""
    pass


class NegativeAmountError(DomainException):
    """Raised when amount is negative."""
    pass


class TransferError(DomainException):
    """Raised when transfer fails."""
    pass


class AccountNotFoundError(DomainException):
    """Raised when account not found."""
    pass
```

---

### Ports Layer

#### `src/main/ports/outbound/account_repository.py`

```python
"""Account repository port - domain defines what it needs."""
from typing import Protocol, Optional
from src.main.domain.entities.account import Account


class AccountRepository(Protocol):
    """
    Repository port for accounts.

    Domain defines this interface.
    Adapters implement it.

    NOTE: This is a Protocol (interface), not an implementation!
    """

    def find_by_id(self, account_id: str) -> Optional[Account]:
        """
        Find account by ID.

        Args:
            account_id: Account identifier

        Returns:
            Account if found, None otherwise
        """
        ...

    def save(self, account: Account) -> None:
        """
        Save account.

        Args:
            account: Account to save
        """
        ...

    def find_by_customer_id(self, customer_id: str) -> list[Account]:
        """
        Find all accounts for a customer.

        Args:
            customer_id: Customer identifier

        Returns:
            List of accounts
        """
        ...
```

---

### Adapters Layer

#### `src/main/adapters/outbound/persistence/postgres/account_repo.py`

```python
"""PostgreSQL implementation of account repository."""
from typing import Optional
from sqlalchemy.orm import Session

from src.main.domain.entities.account import Account, AccountStatus
from src.main.domain.value_objects.money import Money
from src.main.domain.exceptions import AccountNotFoundError
from src.main.adapters.outbound.persistence.postgres.models import AccountModel


class PostgresAccountRepository:
    """
    PostgreSQL implementation of AccountRepository port.

    This is an ADAPTER - technology-specific implementation.
    """

    def __init__(self, session: Session):
        """Initialize with database session."""
        self.session = session

    def find_by_id(self, account_id: str) -> Optional[Account]:
        """Find account by ID."""
        model = self.session.query(AccountModel).filter_by(id=account_id).first()

        if not model:
            return None

        # Convert SQLAlchemy model to domain entity
        return self._to_entity(model)

    def save(self, account: Account) -> None:
        """Save account to database."""
        # Check if exists
        model = self.session.query(AccountModel).filter_by(id=account.id).first()

        if model:
            # Update existing
            self._update_model(model, account)
        else:
            # Create new
            model = self._to_model(account)
            self.session.add(model)

        self.session.commit()

    def find_by_customer_id(self, customer_id: str) -> list[Account]:
        """Find all accounts for customer."""
        models = self.session.query(AccountModel).filter_by(
            customer_id=customer_id
        ).all()

        return [self._to_entity(model) for model in models]

    def _to_entity(self, model: AccountModel) -> Account:
        """Convert database model to domain entity."""
        return Account(
            id=model.id,
            customer_id=model.customer_id,
            balance=Money(model.balance, model.currency),
            status=AccountStatus(model.status),
            overdraft_limit=Money(model.overdraft_limit, model.currency),
            created_at=model.created_at,
            updated_at=model.updated_at
        )

    def _to_model(self, account: Account) -> AccountModel:
        """Convert domain entity to database model."""
        return AccountModel(
            id=account.id,
            customer_id=account.customer_id,
            balance=account.balance.amount,
            currency=account.balance.currency,
            status=account.status.value,
            overdraft_limit=account.overdraft_limit.amount,
            created_at=account.created_at,
            updated_at=account.updated_at
        )

    def _update_model(self, model: AccountModel, account: Account) -> None:
        """Update existing model from entity."""
        model.balance = account.balance.amount
        model.currency = account.balance.currency
        model.status = account.status.value
        model.overdraft_limit = account.overdraft_limit.amount
        model.updated_at = account.updated_at
```

#### `src/main/adapters/outbound/persistence/postgres/models.py`

```python
"""SQLAlchemy database models."""
from sqlalchemy import Column, String, Numeric, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class AccountModel(Base):
    """Account database model (SQLAlchemy)."""

    __tablename__ = 'accounts'

    id = Column(String(36), primary_key=True)
    customer_id = Column(String(36), nullable=False, index=True)
    balance = Column(Numeric(precision=15, scale=2), nullable=False, default=0)
    currency = Column(String(3), nullable=False, default='USD')
    status = Column(String(20), nullable=False, default='active')
    overdraft_limit = Column(Numeric(precision=15, scale=2), nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)
```

#### `src/main/adapters/inbound/api/routes.py`

```python
"""FastAPI routes - REST API adapter."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from decimal import Decimal

from src.main.adapters.inbound.api.schemas import (
    TransferRequest,
    TransferResponse,
    AccountResponse,
    CreateAccountRequest
)
from src.main.domain.services.transfer_service import TransferService
from src.main.domain.entities.account import Account, AccountStatus
from src.main.domain.value_objects.money import Money
from src.main.domain.exceptions import (
    InsufficientFundsError,
    TransferError,
    AccountNotFoundError
)
from src.main.adapters.outbound.persistence.postgres.account_repo import (
    PostgresAccountRepository
)
from src.main.adapters.outbound.persistence.postgres.database import get_db


router = APIRouter(prefix="/api/v1", tags=["banking"])


def get_account_repository(db: Session = Depends(get_db)) -> PostgresAccountRepository:
    """Dependency injection: Get account repository."""
    return PostgresAccountRepository(db)


@router.post("/transfer", response_model=TransferResponse)
def transfer_money(
    request: TransferRequest,
    repo: PostgresAccountRepository = Depends(get_account_repository)
):
    """
    Transfer money between accounts.

    This is an INBOUND ADAPTER - converts HTTP requests to domain calls.
    """
    try:
        # Create domain service (inject repository port)
        transfer_service = TransferService(account_repository=repo)

        # Convert API request to domain types
        amount = Money(Decimal(str(request.amount)), request.currency)

        # Execute domain logic
        result = transfer_service.transfer(
            from_account_id=request.from_account_id,
            to_account_id=request.to_account_id,
            amount=amount
        )

        # Convert domain result to API response
        return TransferResponse(
            transaction_id=result.transaction_id,
            from_account_id=result.from_account_id,
            to_account_id=result.to_account_id,
            amount=float(result.amount.amount),
            currency=result.amount.currency,
            timestamp=result.timestamp,
            status="success"
        )

    except InsufficientFundsError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except TransferError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transfer failed: {str(e)}")


@router.get("/accounts/{account_id}", response_model=AccountResponse)
def get_account(
    account_id: str,
    repo: PostgresAccountRepository = Depends(get_account_repository)
):
    """Get account details."""
    account = repo.find_by_id(account_id)

    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    return AccountResponse(
        id=account.id,
        customer_id=account.customer_id,
        balance=float(account.balance.amount),
        currency=account.balance.currency,
        status=account.status.value,
        created_at=account.created_at,
        updated_at=account.updated_at
    )


@router.post("/accounts", response_model=AccountResponse, status_code=201)
def create_account(
    request: CreateAccountRequest,
    repo: PostgresAccountRepository = Depends(get_account_repository)
):
    """Create new account."""
    # Create domain entity
    account = Account(
        customer_id=request.customer_id,
        balance=Money(Decimal("0")),
        status=AccountStatus.ACTIVE,
        overdraft_limit=Money(Decimal(str(request.overdraft_limit or 0)))
    )

    # Save through repository port
    repo.save(account)

    return AccountResponse(
        id=account.id,
        customer_id=account.customer_id,
        balance=float(account.balance.amount),
        currency=account.balance.currency,
        status=account.status.value,
        created_at=account.created_at,
        updated_at=account.updated_at
    )
```

#### `src/main/adapters/inbound/api/schemas.py`

```python
"""Pydantic schemas for API requests/responses."""
from pydantic import BaseModel, Field
from datetime import datetime


class TransferRequest(BaseModel):
    """Transfer request schema."""
    from_account_id: str = Field(..., description="Source account ID")
    to_account_id: str = Field(..., description="Destination account ID")
    amount: float = Field(..., gt=0, description="Amount to transfer")
    currency: str = Field(default="USD", description="Currency code")


class TransferResponse(BaseModel):
    """Transfer response schema."""
    transaction_id: str
    from_account_id: str
    to_account_id: str
    amount: float
    currency: str
    timestamp: datetime
    status: str


class AccountResponse(BaseModel):
    """Account response schema."""
    id: str
    customer_id: str
    balance: float
    currency: str
    status: str
    created_at: datetime
    updated_at: datetime


class CreateAccountRequest(BaseModel):
    """Create account request."""
    customer_id: str = Field(..., description="Customer ID")
    overdraft_limit: float = Field(default=0, ge=0, description="Overdraft limit")
```

---

## Dependency Injection

**Key Insight:** Wire dependencies at application startup

#### `src/main/adapters/inbound/api/app.py`

```python
"""FastAPI application - dependency injection wiring."""
from fastapi import FastAPI
from src.main.adapters.inbound.api.routes import router
from src.main.adapters.outbound.persistence.postgres.database import engine, Base

# Create FastAPI app
app = FastAPI(
    title="Banking API",
    description="Hexagonal Architecture Banking System",
    version="1.0.0"
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Include routers
app.include_router(router)


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "banking-api"}
```

---

## Testing Strategy

### Domain Tests (No Mocks - Pure Logic)

#### `src/test/domain/entities/test_account.py`

```python
"""Test account entity - NO database, NO external dependencies!"""
import pytest
from decimal import Decimal

from src.main.domain.entities.account import Account, AccountStatus
from src.main.domain.value_objects.money import Money
from src.main.domain.exceptions import (
    InsufficientFundsError,
    InvalidAccountStateError,
    NegativeAmountError
)


def test_account_withdraw_success():
    """Test successful withdrawal."""
    account = Account(
        customer_id="CUST-001",
        balance=Money(Decimal("1000.00"))
    )

    account.withdraw(Money(Decimal("300.00")))

    assert account.balance.amount == Decimal("700.00")


def test_account_withdraw_insufficient_funds():
    """Test withdrawal with insufficient funds."""
    account = Account(
        customer_id="CUST-001",
        balance=Money(Decimal("100.00"))
    )

    with pytest.raises(InsufficientFundsError):
        account.withdraw(Money(Decimal("200.00")))


def test_account_withdraw_with_overdraft():
    """Test withdrawal using overdraft."""
    account = Account(
        customer_id="CUST-001",
        balance=Money(Decimal("100.00")),
        overdraft_limit=Money(Decimal("500.00"))
    )

    # Can withdraw up to 600 (100 + 500 overdraft)
    account.withdraw(Money(Decimal("400.00")))

    assert account.balance.amount == Decimal("-300.00")


def test_account_deposit():
    """Test deposit."""
    account = Account(
        customer_id="CUST-001",
        balance=Money(Decimal("100.00"))
    )

    account.deposit(Money(Decimal("50.00")))

    assert account.balance.amount == Decimal("150.00")


def test_account_freeze():
    """Test freezing account."""
    account = Account(customer_id="CUST-001")

    account.freeze()

    assert account.status == AccountStatus.FROZEN


def test_frozen_account_cannot_withdraw():
    """Test frozen account cannot withdraw."""
    account = Account(
        customer_id="CUST-001",
        balance=Money(Decimal("1000.00"))
    )
    account.freeze()

    with pytest.raises(InvalidAccountStateError):
        account.withdraw(Money(Decimal("100.00")))


def test_cannot_close_account_with_balance():
    """Test cannot close account with non-zero balance."""
    account = Account(
        customer_id="CUST-001",
        balance=Money(Decimal("100.00"))
    )

    with pytest.raises(InvalidAccountStateError):
        account.close()
```

### Service Tests (Mock Ports)

#### `src/test/domain/services/test_transfer_service.py`

```python
"""Test transfer service - mock repository port."""
import pytest
from unittest.mock import Mock
from decimal import Decimal

from src.main.domain.services.transfer_service import TransferService
from src.main.domain.entities.account import Account
from src.main.domain.value_objects.money import Money
from src.main.domain.exceptions import TransferError


def test_transfer_success():
    """Test successful transfer - NO database!"""
    # Mock repository (port)
    mock_repo = Mock()
    mock_repo.find_by_id.side_effect = [
        Account(id="ACC-001", customer_id="CUST-001", balance=Money(Decimal("1000.00"))),
        Account(id="ACC-002", customer_id="CUST-002", balance=Money(Decimal("500.00")))
    ]

    # Create service with mocked repository
    service = TransferService(account_repository=mock_repo)

    # Execute transfer
    result = service.transfer(
        from_account_id="ACC-001",
        to_account_id="ACC-002",
        amount=Money(Decimal("300.00"))
    )

    # Verify
    assert result.success is True
    assert result.amount.amount == Decimal("300.00")
    assert mock_repo.save.call_count == 2  # Both accounts saved


def test_transfer_insufficient_funds():
    """Test transfer with insufficient funds."""
    mock_repo = Mock()
    mock_repo.find_by_id.side_effect = [
        Account(id="ACC-001", customer_id="CUST-001", balance=Money(Decimal("100.00"))),
        Account(id="ACC-002", customer_id="CUST-002", balance=Money(Decimal("500.00")))
    ]

    service = TransferService(account_repository=mock_repo)

    with pytest.raises(TransferError):
        service.transfer(
            from_account_id="ACC-001",
            to_account_id="ACC-002",
            amount=Money(Decimal("300.00"))
        )


def test_transfer_same_account():
    """Test cannot transfer to same account."""
    mock_repo = Mock()
    service = TransferService(account_repository=mock_repo)

    with pytest.raises(TransferError, match="Cannot transfer to same account"):
        service.transfer(
            from_account_id="ACC-001",
            to_account_id="ACC-001",
            amount=Money(Decimal("100.00"))
        )
```

### Integration Tests (Real Database)

#### `src/test/adapters/outbound/persistence/test_postgres_repo.py`

```python
"""Test PostgreSQL repository - integration test with real database."""
import pytest
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.main.domain.entities.account import Account, AccountStatus
from src.main.domain.value_objects.money import Money
from src.main.adapters.outbound.persistence.postgres.account_repo import (
    PostgresAccountRepository
)
from src.main.adapters.outbound.persistence.postgres.models import Base


@pytest.fixture
def db_session():
    """Create test database session."""
    engine = create_engine('sqlite:///:memory:')  # In-memory database for tests
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_save_and_find_account(db_session):
    """Test saving and finding account."""
    repo = PostgresAccountRepository(db_session)

    # Create account
    account = Account(
        id="ACC-001",
        customer_id="CUST-001",
        balance=Money(Decimal("1000.00")),
        status=AccountStatus.ACTIVE
    )

    # Save
    repo.save(account)

    # Find
    found = repo.find_by_id("ACC-001")

    assert found is not None
    assert found.id == "ACC-001"
    assert found.balance.amount == Decimal("1000.00")


def test_update_account(db_session):
    """Test updating existing account."""
    repo = PostgresAccountRepository(db_session)

    # Create and save
    account = Account(
        id="ACC-001",
        customer_id="CUST-001",
        balance=Money(Decimal("1000.00"))
    )
    repo.save(account)

    # Modify
    account.withdraw(Money(Decimal("300.00")))
    repo.save(account)

    # Verify
    found = repo.find_by_id("ACC-001")
    assert found.balance.amount == Decimal("700.00")
```

---

## Running the System

### Setup

```bash
# Install dependencies
uv sync

# Run database migrations (create tables)
uv run python -m src.main.adapters.outbound.persistence.postgres.database
```

### Running API

```bash
# Start FastAPI server
uv run uvicorn src.main.adapters.inbound.api.app:app --reload --port 8000
```

### Testing

```bash
# Run all tests
uv run pytest

# Run only domain tests (fast, no database)
uv run pytest src/test/domain

# Run with coverage
uv run pytest --cov=src/main --cov-report=html
```

### API Examples

```bash
# Health check
curl http://localhost:8000/health

# Create account
curl -X POST http://localhost:8000/api/v1/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUST-001",
    "overdraft_limit": 500
  }'

# Get account
curl http://localhost:8000/api/v1/accounts/ACC-001

# Transfer money
curl -X POST http://localhost:8000/api/v1/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "from_account_id": "ACC-001",
    "to_account_id": "ACC-002",
    "amount": 300.00,
    "currency": "USD"
  }'
```

---

## Deployment

### Docker

```dockerfile
# Dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install UV
RUN pip install uv

# Copy files
COPY pyproject.toml uv.lock ./
COPY src/ ./src/
COPY config/ ./config/

# Install dependencies
RUN uv sync --frozen

# Expose port
EXPOSE 8000

# Run API
CMD ["uv", "run", "uvicorn", "src.main.adapters.inbound.api.app:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Key Benefits

### 1. **Swap Implementations Without Touching Domain**

**Example: PostgreSQL → MongoDB**

```python
# Create MongoDB adapter (implements same AccountRepository port)
class MongoDBAccountRepository:
    def find_by_id(self, account_id: str) -> Account:
        # MongoDB-specific code
        ...

    def save(self, account: Account) -> None:
        # MongoDB-specific code
        ...

# Swap in dependency injection:
# OLD: repo = PostgresAccountRepository(session)
# NEW: repo = MongoDBAccountRepository(client)

# Domain code unchanged! ✅
```

### 2. **Test Domain Without Infrastructure**

```python
# Test business logic in milliseconds, not seconds
def test_withdrawal():
    account = Account(balance=Money(Decimal("1000")))
    account.withdraw(Money(Decimal("300")))
    assert account.balance.amount == Decimal("700")

# NO database setup
# NO HTTP server
# NO external dependencies
# Just pure logic ✅
```

### 3. **Multiple Interfaces Trivially**

```python
# REST API adapter (existing)
@router.post("/transfer")
def transfer_money(...):
    service = TransferService(repo)
    ...

# GraphQL adapter (new - same domain!)
@strawberry.mutation
def transfer_money(...) -> TransferResponse:
    service = TransferService(repo)  # Same service!
    ...

# CLI adapter (new - same domain!)
@click.command()
def transfer(...):
    service = TransferService(repo)  # Same service!
    ...
```

### 4. **Domain Protected from Framework Changes**

```python
# Upgrade FastAPI → Flask → Django?
# Domain stays the same! ✅

# Change databases?
# Domain stays the same! ✅

# Add message queue?
# Domain stays the same! ✅
```

---

## Migration Path

### When to Use Hexagonal

**Migrate FROM Simple Modular WHEN:**
- ✅ Business logic becomes valuable (worth protecting)
- ✅ Need to swap implementations (PostgreSQL → MongoDB)
- ✅ Testing becomes difficult (too coupled to database)
- ✅ Multiple interfaces needed (API + CLI + batch)

**Migrate TO Clean Architecture WHEN:**
- ✅ Team grows beyond 15-20 developers
- ✅ Need even stricter layer separation
- ✅ Enterprise requirements demand 4-layer structure

---

## Related Patterns

**See also:**
- [Python Simple Modular: ML](simple-modular-ml-example.md) - Simpler pattern for fast iteration
- [Python Clean Architecture: Banking](clean-architecture-banking-example.md) - More rigorous separation
- [Python Architecture Patterns Guide - Pattern selection

---

**Document Type:** Complete Implementation Guide
**Last Updated:** 2025-10-20
**Version:** 1.0
**Pattern:** Hexagonal Architecture (Ports & Adapters)
**Language:** Python 3.10+

**Status:** ✅ This is a complete, production-ready implementation example.
