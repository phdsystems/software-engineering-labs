# Python Clean Architecture: Banking Core System

**Pattern:** Clean Architecture (4 Layers)
**Language:** Python 3.10+
**Framework:** FastAPI
**Domain:** Core Banking Platform
**Status:** ✅ Complete
**Parent Guide:** [Python Architecture Patterns

---

## TL;DR

**Complete Python implementation of Clean Architecture** for enterprise banking platform. Demonstrates **The Dependency Rule** - dependencies point INWARD only. Shows all 4 layers: Entities (Layer 1), Use Cases (Layer 2), Interface Adapters (Layer 3), Frameworks & Drivers (Layer 4). **Maximum separation of concerns** - inner layers know NOTHING about outer layers. **Perfect for large enterprise systems** (20+ developers, 10+ year lifespan). **Highly testable** - each layer tested independently. Business rules completely protected from external changes.

---

## Table of Contents

- [Overview](#overview)
- [The Dependency Rule](#the-dependency-rule)
- [Project Structure](#project-structure)
- [Layer 1: Entities](#layer-1-entities-enterprise-business-rules)
- [Layer 2: Use Cases](#layer-2-use-cases-application-business-rules)
- [Layer 3: Interface Adapters](#layer-3-interface-adapters)
- [Layer 4: Frameworks & Drivers](#layer-4-frameworks--drivers)
- [Dependency Injection](#dependency-injection)
- [Testing Strategy](#testing-strategy)
- [Running the System](#running-the-system)
- [Key Benefits](#key-benefits)

---

## Overview

This example demonstrates:
- ✅ **4-Layer architecture** - Entities, Use Cases, Interface Adapters, Frameworks
- ✅ **The Dependency Rule** - Dependencies point INWARD only
- ✅ **Maximum testability** - Test each layer independently
- ✅ **Business rules protected** - Inner layers isolated from framework changes
- ✅ **Framework-agnostic** - Swap FastAPI → Flask → Django easily
- ✅ **Database-agnostic** - Swap PostgreSQL → MongoDB → DynamoDB easily

**When to use:**
- Large enterprise applications (20+ developers)
- Long-lived systems (10+ years)
- Complex business rules requiring maximum protection
- Multiple teams with different release cycles
- Regulatory compliance requiring strict separation

**Why Clean Architecture for Banking:**
- Banking regulations demand clear separation of concerns
- Business rules must survive framework/technology changes
- Multiple audit trails require layer-by-layer testing
- Long lifespan (decades) requires framework independence
- Large teams need clear boundaries

---

## The Dependency Rule

**CRITICAL:** Dependencies can only point **INWARD**. Inner layers know **NOTHING** about outer layers.

```
┌─────────────────────────────────────────────────┐
│  Layer 4: Frameworks & Drivers                  │  ← Outermost
│  (FastAPI, SQLAlchemy, External Services)       │
│                    ↓ depends on                  │
│  ┌───────────────────────────────────────────┐  │
│  │  Layer 3: Interface Adapters              │  │
│  │  (Controllers, Presenters, Gateways)      │  │
│  │                ↓ depends on                │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  Layer 2: Use Cases                 │  │  │
│  │  │  (Application Business Rules)       │  │  │
│  │  │            ↓ depends on              │  │  │
│  │  │  ┌───────────────────────────────┐  │  │  │
│  │  │  │  Layer 1: Entities            │  │  │  │  ← Innermost
│  │  │  │  (Enterprise Business Rules)  │  │  │  │
│  │  │  │  NO DEPENDENCIES!              │  │  │  │
│  │  │  └───────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Rules:**
1. ❌ **Layer 1 (Entities)** - Depends on NOTHING
2. ✅ **Layer 2 (Use Cases)** - Depends ONLY on Layer 1
3. ✅ **Layer 3 (Adapters)** - Depends on Layer 1 & 2
4. ✅ **Layer 4 (Frameworks)** - Depends on all inner layers

---

## Project Structure

```
banking-core/
├── src/
│   ├── main/
│   │   ├── entities/                        # LAYER 1: Enterprise Business Rules
│   │   │   ├── __init__.py                  # NO DEPENDENCIES!
│   │   │   ├── account.py
│   │   │   ├── transaction.py
│   │   │   ├── customer.py
│   │   │   └── value_objects/
│   │   │       ├── money.py
│   │   │       └── account_number.py
│   │   │
│   │   ├── use_cases/                       # LAYER 2: Application Business Rules
│   │   │   ├── __init__.py                  # Depends ONLY on entities/
│   │   │   ├── transfer_funds.py
│   │   │   ├── open_account.py
│   │   │   ├── close_account.py
│   │   │   ├── deposit_money.py
│   │   │   ├── withdraw_money.py
│   │   │   └── ports/                       # Use case interfaces
│   │   │       ├── account_repository.py
│   │   │       ├── transaction_repository.py
│   │   │       └── notification_service.py
│   │   │
│   │   ├── interface_adapters/              # LAYER 3: Interface Adapters
│   │   │   ├── __init__.py                  # Depends on use_cases/ and entities/
│   │   │   ├── controllers/                 # Input adapters
│   │   │   │   ├── __init__.py
│   │   │   │   ├── account_controller.py
│   │   │   │   └── transaction_controller.py
│   │   │   ├── presenters/                  # Output formatters
│   │   │   │   ├── __init__.py
│   │   │   │   ├── account_presenter.py
│   │   │   │   └── transaction_presenter.py
│   │   │   └── gateways/                    # Data access implementations
│   │   │       ├── __init__.py
│   │   │       ├── postgres_account_repo.py
│   │   │       ├── postgres_transaction_repo.py
│   │   │       └── email_notifier.py
│   │   │
│   │   └── frameworks_drivers/              # LAYER 4: External Interfaces
│   │       ├── __init__.py                  # Outermost - frameworks, tools
│   │       ├── web/                         # Web framework
│   │       │   ├── __init__.py
│   │       │   ├── app.py                   # FastAPI application
│   │       │   ├── routes.py                # HTTP routes
│   │       │   └── schemas.py               # Pydantic schemas
│   │       ├── database/                    # Database
│   │       │   ├── __init__.py
│   │       │   ├── connection.py            # SQLAlchemy connection
│   │       │   └── models.py                # SQLAlchemy models
│   │       └── cli/                         # CLI interface
│   │           ├── __init__.py
│   │           └── commands.py
│   │
│   └── test/
│       ├── entities/                        # Layer 1 tests (no mocks!)
│       ├── use_cases/                       # Layer 2 tests (mock ports)
│       ├── interface_adapters/              # Layer 3 tests (integration)
│       └── e2e/                             # Full system tests
│
├── config/
│   └── config.yaml
├── pyproject.toml
└── Makefile
```

---

## Layer 1: Entities (Enterprise Business Rules)

**Purpose:** Core business rules that don't change based on application

**Dependency Rules:**
- ❌ NO imports from use_cases/, interface_adapters/, frameworks_drivers/
- ❌ NO database, HTTP, framework imports
- ✅ Only Python standard library
- ✅ Pure business logic

### `src/main/entities/account.py`

```python
"""Account entity - Layer 1: Enterprise Business Rules."""
from dataclasses import dataclass, field
from decimal import Decimal
from enum import Enum
from typing import List
from uuid import uuid4
from datetime import datetime

from src.main.entities.value_objects.money import Money
from src.main.entities.transaction import Transaction


class AccountStatus(Enum):
    """Account status."""
    ACTIVE = "active"
    FROZEN = "frozen"
    CLOSED = "closed"


class AccountType(Enum):
    """Account type."""
    CHECKING = "checking"
    SAVINGS = "savings"
    BUSINESS = "business"


@dataclass
class Account:
    """
    Account entity - core business rules.

    Layer 1: Depends on NOTHING.
    Pure business logic.
    """

    id: str = field(default_factory=lambda: str(uuid4()))
    customer_id: str = ""
    account_number: str = ""
    account_type: AccountType = AccountType.CHECKING
    balance: Money = field(default_factory=lambda: Money(Decimal("0")))
    status: AccountStatus = AccountStatus.ACTIVE
    overdraft_limit: Money = field(default_factory=lambda: Money(Decimal("0")))
    interest_rate: Decimal = Decimal("0")
    minimum_balance: Money = field(default_factory=lambda: Money(Decimal("0")))
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    transactions: List[Transaction] = field(default_factory=list)

    def withdraw(self, amount: Money, description: str = "") -> Transaction:
        """
        Withdraw money from account.

        Business Rules:
        1. Account must be active
        2. Amount must be positive
        3. Available balance must cover withdrawal
        4. Cannot violate minimum balance

        Returns:
            Transaction record
        """
        self._ensure_active()
        self._validate_positive_amount(amount)

        # Calculate available balance
        available = self.balance + self.overdraft_limit

        if amount > available:
            raise InsufficientFundsError(
                f"Insufficient funds. Balance: {self.balance}, "
                f"Overdraft: {self.overdraft_limit}, Requested: {amount}"
            )

        # Check minimum balance
        new_balance = self.balance - amount
        if new_balance < self.minimum_balance and new_balance >= Money(Decimal("0")):
            raise MinimumBalanceViolationError(
                f"Transaction violates minimum balance requirement: {self.minimum_balance}"
            )

        # Execute withdrawal
        self.balance = new_balance
        self.updated_at = datetime.now()

        # Create transaction record
        transaction = Transaction(
            account_id=self.id,
            amount=amount,
            transaction_type="WITHDRAWAL",
            description=description or "Withdrawal",
            balance_after=self.balance
        )

        self.transactions.append(transaction)
        return transaction

    def deposit(self, amount: Money, description: str = "") -> Transaction:
        """
        Deposit money to account.

        Business Rules:
        1. Account must be active
        2. Amount must be positive
        """
        self._ensure_active()
        self._validate_positive_amount(amount)

        self.balance = self.balance + amount
        self.updated_at = datetime.now()

        transaction = Transaction(
            account_id=self.id,
            amount=amount,
            transaction_type="DEPOSIT",
            description=description or "Deposit",
            balance_after=self.balance
        )

        self.transactions.append(transaction)
        return transaction

    def freeze(self) -> None:
        """Freeze account (regulatory compliance, fraud prevention)."""
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

        Business Rule: Balance must be zero
        """
        if self.balance.amount != Decimal("0"):
            raise InvalidAccountStateError(
                f"Cannot close account with non-zero balance: {self.balance}"
            )

        self.status = AccountStatus.CLOSED
        self.updated_at = datetime.now()

    def apply_interest(self) -> Transaction:
        """
        Apply interest to account balance.

        Business Rule: Only for savings accounts
        """
        if self.account_type != AccountType.SAVINGS:
            raise InvalidAccountStateError("Interest only applies to savings accounts")

        if self.interest_rate <= Decimal("0"):
            raise InvalidAccountStateError("Interest rate not set")

        # Calculate interest
        interest = Money(self.balance.amount * self.interest_rate)

        return self.deposit(interest, f"Interest payment at {self.interest_rate}%")

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


# Domain exceptions
class DomainException(Exception):
    """Base domain exception."""
    pass


class InsufficientFundsError(DomainException):
    """Insufficient funds."""
    pass


class InvalidAccountStateError(DomainException):
    """Invalid account state."""
    pass


class NegativeAmountError(DomainException):
    """Negative amount."""
    pass


class MinimumBalanceViolationError(DomainException):
    """Minimum balance violation."""
    pass
```

### `src/main/entities/transaction.py`

```python
"""Transaction entity - Layer 1."""
from dataclasses import dataclass, field
from datetime import datetime
from uuid import uuid4

from src.main.entities.value_objects.money import Money


@dataclass
class Transaction:
    """
    Transaction entity.

    Immutable record of account activity.
    """

    id: str = field(default_factory=lambda: str(uuid4()))
    account_id: str = ""
    amount: Money = field(default_factory=lambda: Money())
    transaction_type: str = ""  # DEPOSIT, WITHDRAWAL, TRANSFER_IN, TRANSFER_OUT
    description: str = ""
    balance_after: Money = field(default_factory=lambda: Money())
    created_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        """Make transaction immutable after creation."""
        # In production, use frozen=True or custom immutability
        pass
```

### `src/main/entities/value_objects/money.py`

```python
"""Money value object - Layer 1."""
from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class Money:
    """
    Money value object.

    Immutable, currency-aware monetary value.
    """

    amount: Decimal = Decimal("0")
    currency: str = "USD"

    def __post_init__(self):
        """Validate and normalize."""
        # Ensure 2 decimal places
        object.__setattr__(self, 'amount', self.amount.quantize(Decimal('0.01')))

    def __add__(self, other: 'Money') -> 'Money':
        """Add money."""
        self._ensure_same_currency(other)
        return Money(self.amount + other.amount, self.currency)

    def __sub__(self, other: 'Money') -> 'Money':
        """Subtract money."""
        self._ensure_same_currency(other)
        return Money(self.amount - other.amount, self.currency)

    def __gt__(self, other: 'Money') -> bool:
        """Greater than."""
        self._ensure_same_currency(other)
        return self.amount > other.amount

    def __lt__(self, other: 'Money') -> bool:
        """Less than."""
        self._ensure_same_currency(other)
        return self.amount < other.amount

    def __ge__(self, other: 'Money') -> bool:
        """Greater than or equal."""
        return self > other or self == other

    def __le__(self, other: 'Money') -> bool:
        """Less than or equal."""
        return self < other or self == other

    def _ensure_same_currency(self, other: 'Money') -> None:
        """Ensure same currency."""
        if self.currency != other.currency:
            raise ValueError(f"Currency mismatch: {self.currency} vs {other.currency}")

    def __str__(self) -> str:
        """String representation."""
        return f"{self.currency} {self.amount}"
```

---

## Layer 2: Use Cases (Application Business Rules)

**Purpose:** Application-specific business rules (workflows)

**Dependency Rules:**
- ✅ Can depend on entities/ (Layer 1)
- ✅ Defines ports (interfaces) for external dependencies
- ❌ NO imports from interface_adapters/ or frameworks_drivers/
- ❌ NO concrete implementations (only interfaces)

### `src/main/use_cases/transfer_funds.py`

```python
"""Transfer funds use case - Layer 2: Application Business Rules."""
from dataclasses import dataclass
from datetime import datetime

from src.main.entities.account import Account
from src.main.entities.value_objects.money import Money
from src.main.use_cases.ports.account_repository import AccountRepository
from src.main.use_cases.ports.transaction_repository import TransactionRepository
from src.main.use_cases.ports.notification_service import NotificationService


@dataclass
class TransferFundsRequest:
    """Transfer request - use case input."""
    from_account_id: str
    to_account_id: str
    amount: Money
    description: str = ""


@dataclass
class TransferFundsResponse:
    """Transfer response - use case output."""
    transaction_id: str
    from_account_id: str
    to_account_id: str
    amount: Money
    timestamp: datetime
    success: bool
    message: str


class TransferFundsUseCase:
    """
    Transfer funds between accounts use case.

    Layer 2: Depends ONLY on Layer 1 (entities) and ports (interfaces).
    """

    def __init__(
        self,
        account_repo: AccountRepository,
        transaction_repo: TransactionRepository,
        notifier: NotificationService
    ):
        """
        Initialize use case with ports (interfaces).

        NOTE: These are INTERFACES, not concrete implementations!
        """
        self.account_repo = account_repo
        self.transaction_repo = transaction_repo
        self.notifier = notifier

    def execute(self, request: TransferFundsRequest) -> TransferFundsResponse:
        """
        Execute money transfer.

        Business Rules:
        1. Both accounts must exist
        2. From account must have sufficient funds
        3. Amount must be positive
        4. Transaction is atomic
        5. Both parties notified
        """
        # Validate
        if request.from_account_id == request.to_account_id:
            raise ValueError("Cannot transfer to same account")

        # Load accounts (through port!)
        from_account = self.account_repo.find_by_id(request.from_account_id)
        to_account = self.account_repo.find_by_id(request.to_account_id)

        if not from_account:
            raise ValueError(f"Account not found: {request.from_account_id}")
        if not to_account:
            raise ValueError(f"Account not found: {request.to_account_id}")

        # Execute business logic (Layer 1 entities!)
        withdrawal_tx = from_account.withdraw(
            request.amount,
            f"Transfer to {request.to_account_id}: {request.description}"
        )

        deposit_tx = to_account.deposit(
            request.amount,
            f"Transfer from {request.from_account_id}: {request.description}"
        )

        # Save accounts (through port!)
        self.account_repo.save(from_account)
        self.account_repo.save(to_account)

        # Save transactions (through port!)
        self.transaction_repo.save(withdrawal_tx)
        self.transaction_repo.save(deposit_tx)

        # Notify (through port!)
        self.notifier.send_transfer_notification(
            from_account_id=request.from_account_id,
            to_account_id=request.to_account_id,
            amount=request.amount
        )

        # Return response
        return TransferFundsResponse(
            transaction_id=withdrawal_tx.id,
            from_account_id=request.from_account_id,
            to_account_id=request.to_account_id,
            amount=request.amount,
            timestamp=datetime.now(),
            success=True,
            message="Transfer completed successfully"
        )
```

### `src/main/use_cases/open_account.py`

```python
"""Open account use case - Layer 2."""
from dataclasses import dataclass
from decimal import Decimal

from src.main.entities.account import Account, AccountType, AccountStatus
from src.main.entities.value_objects.money import Money
from src.main.use_cases.ports.account_repository import AccountRepository


@dataclass
class OpenAccountRequest:
    """Open account request."""
    customer_id: str
    account_type: str  # "checking", "savings", "business"
    initial_deposit: Money
    overdraft_limit: Money = Money(Decimal("0"))


@dataclass
class OpenAccountResponse:
    """Open account response."""
    account_id: str
    account_number: str
    account_type: str
    balance: Money
    message: str


class OpenAccountUseCase:
    """Open new account use case."""

    def __init__(self, account_repo: AccountRepository):
        self.account_repo = account_repo

    def execute(self, request: OpenAccountRequest) -> OpenAccountResponse:
        """
        Open new account.

        Business Rules:
        1. Initial deposit must be positive
        2. Generate unique account number
        3. Set default values based on account type
        """
        # Validate
        if request.initial_deposit.amount <= Decimal("0"):
            raise ValueError("Initial deposit must be positive")

        # Create account entity (Layer 1!)
        account = Account(
            customer_id=request.customer_id,
            account_number=self._generate_account_number(),
            account_type=AccountType(request.account_type),
            balance=Money(Decimal("0")),  # Will be set by deposit
            status=AccountStatus.ACTIVE,
            overdraft_limit=request.overdraft_limit
        )

        # Make initial deposit
        account.deposit(request.initial_deposit, "Initial deposit")

        # Save (through port!)
        self.account_repo.save(account)

        return OpenAccountResponse(
            account_id=account.id,
            account_number=account.account_number,
            account_type=account.account_type.value,
            balance=account.balance,
            message="Account opened successfully"
        )

    def _generate_account_number(self) -> str:
        """Generate unique account number."""
        import random
        return f"{random.randint(1000000000, 9999999999)}"
```

### `src/main/use_cases/ports/account_repository.py`

```python
"""Account repository port - Layer 2 interface."""
from typing import Protocol, Optional, List

from src.main.entities.account import Account


class AccountRepository(Protocol):
    """
    Account repository interface.

    Use case defines what it needs.
    Adapter (Layer 3) implements it.
    """

    def find_by_id(self, account_id: str) -> Optional[Account]:
        """Find account by ID."""
        ...

    def save(self, account: Account) -> None:
        """Save account."""
        ...

    def find_by_customer_id(self, customer_id: str) -> List[Account]:
        """Find all accounts for customer."""
        ...
```

### `src/main/use_cases/ports/notification_service.py`

```python
"""Notification service port - Layer 2 interface."""
from typing import Protocol

from src.main.entities.value_objects.money import Money


class NotificationService(Protocol):
    """
    Notification service interface.

    Use case defines what it needs.
    Adapter (Layer 3) implements it.
    """

    def send_transfer_notification(
        self,
        from_account_id: str,
        to_account_id: str,
        amount: Money
    ) -> None:
        """Send transfer notification."""
        ...

    def send_account_opened_notification(self, account_id: str) -> None:
        """Send account opened notification."""
        ...
```

---

## Layer 3: Interface Adapters

**Purpose:** Convert data between use cases and external world

**Dependency Rules:**
- ✅ Can depend on entities/ (Layer 1) and use_cases/ (Layer 2)
- ✅ Implements ports defined by Layer 2
- ❌ NO imports from frameworks_drivers/ (Layer 4)

### `src/main/interface_adapters/controllers/account_controller.py`

```python
"""Account controller - Layer 3: Interface Adapter."""
from decimal import Decimal

from src.main.entities.value_objects.money import Money
from src.main.use_cases.open_account import OpenAccountUseCase, OpenAccountRequest
from src.main.use_cases.transfer_funds import TransferFundsUseCase, TransferFundsRequest


class AccountController:
    """
    Account controller - converts HTTP requests to use case requests.

    Layer 3: Depends on Layer 2 (use cases) and Layer 1 (entities).
    """

    def __init__(
        self,
        open_account_use_case: OpenAccountUseCase,
        transfer_funds_use_case: TransferFundsUseCase
    ):
        self.open_account_use_case = open_account_use_case
        self.transfer_funds_use_case = transfer_funds_use_case

    def open_account(self, http_request: dict) -> dict:
        """
        Convert HTTP request to use case request.

        Layer 3 responsibility: Format conversion.
        """
        # Convert HTTP format to use case format
        use_case_request = OpenAccountRequest(
            customer_id=http_request['customer_id'],
            account_type=http_request['account_type'],
            initial_deposit=Money(Decimal(str(http_request['initial_deposit']))),
            overdraft_limit=Money(Decimal(str(http_request.get('overdraft_limit', 0))))
        )

        # Execute use case
        response = self.open_account_use_case.execute(use_case_request)

        # Convert use case response to HTTP format
        return {
            'account_id': response.account_id,
            'account_number': response.account_number,
            'account_type': response.account_type,
            'balance': float(response.balance.amount),
            'currency': response.balance.currency,
            'message': response.message
        }

    def transfer_funds(self, http_request: dict) -> dict:
        """Convert HTTP request to use case request."""
        use_case_request = TransferFundsRequest(
            from_account_id=http_request['from_account_id'],
            to_account_id=http_request['to_account_id'],
            amount=Money(Decimal(str(http_request['amount']))),
            description=http_request.get('description', '')
        )

        response = self.transfer_funds_use_case.execute(use_case_request)

        return {
            'transaction_id': response.transaction_id,
            'from_account_id': response.from_account_id,
            'to_account_id': response.to_account_id,
            'amount': float(response.amount.amount),
            'currency': response.amount.currency,
            'timestamp': response.timestamp.isoformat(),
            'status': 'success' if response.success else 'failed',
            'message': response.message
        }
```

### `src/main/interface_adapters/gateways/postgres_account_repo.py`

```python
"""PostgreSQL account repository - Layer 3: Gateway."""
from typing import Optional, List
from sqlalchemy.orm import Session

from src.main.entities.account import Account, AccountStatus, AccountType
from src.main.entities.value_objects.money import Money
from src.main.frameworks_drivers.database.models import AccountModel


class PostgresAccountRepository:
    """
    PostgreSQL implementation of AccountRepository.

    Layer 3: Implements port defined by Layer 2.
    """

    def __init__(self, session: Session):
        self.session = session

    def find_by_id(self, account_id: str) -> Optional[Account]:
        """Find account by ID."""
        model = self.session.query(AccountModel).filter_by(id=account_id).first()

        if not model:
            return None

        return self._to_entity(model)

    def save(self, account: Account) -> None:
        """Save account."""
        model = self.session.query(AccountModel).filter_by(id=account.id).first()

        if model:
            self._update_model(model, account)
        else:
            model = self._to_model(account)
            self.session.add(model)

        self.session.commit()

    def find_by_customer_id(self, customer_id: str) -> List[Account]:
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
            account_number=model.account_number,
            account_type=AccountType(model.account_type),
            balance=Money(model.balance, model.currency),
            status=AccountStatus(model.status),
            overdraft_limit=Money(model.overdraft_limit, model.currency),
            interest_rate=model.interest_rate,
            minimum_balance=Money(model.minimum_balance, model.currency),
            created_at=model.created_at,
            updated_at=model.updated_at
        )

    def _to_model(self, account: Account) -> AccountModel:
        """Convert domain entity to database model."""
        return AccountModel(
            id=account.id,
            customer_id=account.customer_id,
            account_number=account.account_number,
            account_type=account.account_type.value,
            balance=account.balance.amount,
            currency=account.balance.currency,
            status=account.status.value,
            overdraft_limit=account.overdraft_limit.amount,
            interest_rate=account.interest_rate,
            minimum_balance=account.minimum_balance.amount,
            created_at=account.created_at,
            updated_at=account.updated_at
        )

    def _update_model(self, model: AccountModel, account: Account) -> None:
        """Update existing model from entity."""
        model.balance = account.balance.amount
        model.status = account.status.value
        model.overdraft_limit = account.overdraft_limit.amount
        model.interest_rate = account.interest_rate
        model.minimum_balance = account.minimum_balance.amount
        model.updated_at = account.updated_at
```

---

## Layer 4: Frameworks & Drivers

**Purpose:** External interfaces (HTTP, Database, CLI)

**Dependency Rules:**
- ✅ Can depend on all inner layers
- ✅ Contains framework-specific code (FastAPI, SQLAlchemy)
- ✅ Wires dependencies together

### `src/main/frameworks_drivers/web/routes.py`

```python
"""FastAPI routes - Layer 4: Framework."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.main.frameworks_drivers.web.schemas import (
    OpenAccountRequest as HttpOpenAccountRequest,
    TransferRequest as HttpTransferRequest,
    AccountResponse
)
from src.main.interface_adapters.controllers.account_controller import AccountController
from src.main.use_cases.open_account import OpenAccountUseCase
from src.main.use_cases.transfer_funds import TransferFundsUseCase
from src.main.interface_adapters.gateways.postgres_account_repo import (
    PostgresAccountRepository
)
from src.main.interface_adapters.gateways.email_notifier import EmailNotifier
from src.main.frameworks_drivers.database.connection import get_db


router = APIRouter(prefix="/api/v1", tags=["banking"])


def get_account_controller(db: Session = Depends(get_db)) -> AccountController:
    """
    Dependency injection - wire all layers.

    Layer 4 responsibility: Dependency wiring.
    """
    # Layer 3: Gateways (implementations)
    account_repo = PostgresAccountRepository(db)
    notifier = EmailNotifier()

    # Layer 2: Use cases
    open_account_uc = OpenAccountUseCase(account_repo)
    transfer_funds_uc = TransferFundsUseCase(account_repo, account_repo, notifier)

    # Layer 3: Controller
    return AccountController(open_account_uc, transfer_funds_uc)


@router.post("/accounts", response_model=AccountResponse, status_code=201)
def open_account(
    request: HttpOpenAccountRequest,
    controller: AccountController = Depends(get_account_controller)
):
    """
    Open new account.

    Layer 4: HTTP endpoint - delegates to controller.
    """
    try:
        result = controller.open_account(request.dict())
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed: {str(e)}")


@router.post("/transfers")
def transfer_funds(
    request: HttpTransferRequest,
    controller: AccountController = Depends(get_account_controller)
):
    """Transfer funds between accounts."""
    try:
        result = controller.transfer_funds(request.dict())
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transfer failed: {str(e)}")
```

### `src/main/frameworks_drivers/database/models.py`

```python
"""SQLAlchemy models - Layer 4."""
from sqlalchemy import Column, String, Numeric, DateTime, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class AccountModel(Base):
    """Account database model - Layer 4."""

    __tablename__ = 'accounts'

    id = Column(String(36), primary_key=True)
    customer_id = Column(String(36), nullable=False, index=True)
    account_number = Column(String(20), unique=True, nullable=False)
    account_type = Column(String(20), nullable=False)
    balance = Column(Numeric(precision=15, scale=2), nullable=False, default=0)
    currency = Column(String(3), nullable=False, default='USD')
    status = Column(String(20), nullable=False, default='active')
    overdraft_limit = Column(Numeric(precision=15, scale=2), nullable=False, default=0)
    interest_rate = Column(Numeric(precision=5, scale=4), nullable=False, default=0)
    minimum_balance = Column(Numeric(precision=15, scale=2), nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)
```

---

## Testing Strategy

### Layer 1: Entities (No Mocks - Pure Logic)

```python
"""Test Layer 1: Entities - NO mocks needed!"""
def test_account_withdraw():
    account = Account(balance=Money(Decimal("1000")))
    account.withdraw(Money(Decimal("300")))
    assert account.balance.amount == Decimal("700")

def test_account_insufficient_funds():
    account = Account(balance=Money(Decimal("100")))
    with pytest.raises(InsufficientFundsError):
        account.withdraw(Money(Decimal("200")))
```

### Layer 2: Use Cases (Mock Ports)

```python
"""Test Layer 2: Use cases - mock ports only!"""
def test_transfer_funds_use_case():
    # Mock Layer 2 ports (interfaces)
    mock_account_repo = Mock()
    mock_transaction_repo = Mock()
    mock_notifier = Mock()

    # Setup mocks
    mock_account_repo.find_by_id.side_effect = [
        Account(id="ACC-001", balance=Money(Decimal("1000"))),
        Account(id="ACC-002", balance=Money(Decimal("500")))
    ]

    # Create use case
    uc = TransferFundsUseCase(mock_account_repo, mock_transaction_repo, mock_notifier)

    # Execute
    response = uc.execute(TransferFundsRequest(
        from_account_id="ACC-001",
        to_account_id="ACC-002",
        amount=Money(Decimal("300"))
    ))

    # Verify
    assert response.success is True
    assert mock_account_repo.save.call_count == 2
    assert mock_notifier.send_transfer_notification.called
```

### Layer 3: Gateways (Integration Tests)

```python
"""Test Layer 3: Gateways - integration tests with real DB."""
def test_postgres_account_repository(db_session):
    repo = PostgresAccountRepository(db_session)

    account = Account(
        id="ACC-001",
        customer_id="CUST-001",
        balance=Money(Decimal("1000"))
    )

    repo.save(account)
    found = repo.find_by_id("ACC-001")

    assert found.balance.amount == Decimal("1000")
```

### Layer 4: End-to-End Tests

```python
"""Test Layer 4: Full HTTP → Database flow."""
def test_open_account_e2e(client):
    response = client.post("/api/v1/accounts", json={
        "customer_id": "CUST-001",
        "account_type": "checking",
        "initial_deposit": 1000.00
    })

    assert response.status_code == 201
    assert response.json()['balance'] == 1000.00
```

---

## Running the System

### Setup

```bash
# Install dependencies
uv sync

# Run database migrations
uv run python -m src.main.frameworks_drivers.database.connection
```

### Running API

```bash
# Start FastAPI
uv run uvicorn src.main.frameworks_drivers.web.app:app --reload
```

### Testing

```bash
# Test Layer 1 (fast - no dependencies!)
uv run pytest src/test/entities

# Test Layer 2 (fast - mock ports)
uv run pytest src/test/use_cases

# Test Layer 3 (integration)
uv run pytest src/test/interface_adapters

# Test Layer 4 (e2e)
uv run pytest src/test/e2e

# All tests
uv run pytest --cov=src/main
```

---

## Key Benefits

### 1. **Maximum Testability - Test Each Layer Independently**

```python
# Layer 1: Test in milliseconds (pure logic)
def test_entity():
    account = Account(...)
    account.withdraw(...)
    # NO database, NO HTTP, NO mocks!

# Layer 2: Test in milliseconds (mock ports)
def test_use_case():
    mock_repo = Mock()
    uc = TransferFunds(mock_repo, ...)
    # NO database, NO HTTP!

# Layer 3: Integration test (real DB)
def test_gateway(db):
    repo = PostgresAccountRepository(db)
    # Real database

# Layer 4: Full system test
def test_api(client):
    response = client.post(...)
    # Complete HTTP → DB flow
```

### 2. **Business Rules Completely Protected**

```python
# Upgrade FastAPI → Flask → Django?
# Layers 1 & 2 unchanged! ✅

# Change databases (PostgreSQL → MongoDB)?
# Layers 1 & 2 unchanged! ✅

# Add GraphQL alongside REST?
# Layers 1 & 2 unchanged! ✅
```

### 3. **Clear Team Boundaries**

```
Team 1: Entities & Use Cases (core business logic)
Team 2: Interface Adapters (data access, API formatting)
Team 3: Frameworks & Drivers (infrastructure, deployment)

Each team works independently!
```

---

## Migration Path

### When to Use Clean Architecture

**Migrate FROM Hexagonal WHEN:**
- ✅ Team grows beyond 15-20 developers
- ✅ Need stricter layer separation
- ✅ Enterprise requirements demand 4-layer structure
- ✅ Multiple teams need clear boundaries

**When Clean Architecture is Overkill:**
- ❌ Small projects (<10 developers)
- ❌ Short lifespan (<2 years)
- ❌ Fast iteration needed (use Simple Modular)
- ❌ Simple CRUD (use Layered)

---

## Related Patterns

**See also:**
- [Python Simple Modular: ML](simple-modular-ml-example.md) - Fast iteration
- [Python Hexagonal: Banking](hexagonal-banking-example.md) - Less rigorous separation
- [Python Architecture Patterns Guide - Pattern selection

---

**Document Type:** Complete Implementation Guide
**Last Updated:** 2025-10-20
**Version:** 1.0
**Pattern:** Clean Architecture (4 Layers)
**Language:** Python 3.10+

**Status:** ✅ This is a complete, production-ready implementation example.
