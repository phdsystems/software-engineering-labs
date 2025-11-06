# Event-Driven Architecture - Python Implementation

**Pattern:** Event-Driven Architecture
**Language:** Python 3.11+
**Framework:** FastAPI, Apache Kafka (aiokafka), Pydantic
**Related Guide:** [Deep Dive: Event-Driven Architecture](../../../3-design/architecture-pattern/deep-dive-event-driven.md)

## TL;DR

**Complete Event-Driven Architecture** using Python's async/await with type hints throughout. **Key principle**: Async producers emit events → Kafka broker → async consumers react independently. **Critical components**: Pydantic event schemas (validation) → aiokafka (async I/O) → Redis idempotency → Outbox pattern (exactly-once) → Dead Letter Queue → pytest-asyncio testing. **Python advantages**: Native async/await → clean concurrent code, Pydantic → automatic validation & serialization, type hints → IDE support & fewer bugs.

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Domain Events (Pydantic)](#domain-events-pydantic)
4. [Event Producer (Async)](#event-producer-async)
5. [Event Consumer (Async)](#event-consumer-async)
6. [Message Broker Configuration (Kafka)](#message-broker-configuration-kafka)
7. [Guaranteed Delivery Patterns](#guaranteed-delivery-patterns)
8. [Exactly-Once Processing (Outbox Pattern)](#exactly-once-processing-outbox-pattern)
9. [Idempotency with Redis](#idempotency-with-redis)
10. [Dead Letter Queue](#dead-letter-queue)
11. [Event Store Implementation](#event-store-implementation)
12. [Event Replay Capability](#event-replay-capability)
13. [Event Schema Evolution](#event-schema-evolution)
14. [FastAPI Integration](#fastapi-integration)
15. [Testing (pytest-asyncio)](#testing-pytest-asyncio)
16. [Monitoring and Observability](#monitoring-and-observability)
17. [Running the Example](#running-the-example)

---

## Overview

This example demonstrates Event-Driven Architecture for an e-commerce system with:

- **Event Producers** - Order Service, Payment Service (async)
- **Message Broker** - Apache Kafka (via aiokafka)
- **Event Consumers** - Email Service, Analytics Service, Inventory Service (async)
- **Patterns** - At-least-once delivery, Idempotency (Redis), DLQ, Outbox
- **Events** - OrderCreated, PaymentProcessed, OrderShipped
- **Validation** - Pydantic models with automatic schema validation
- **Testing** - pytest-asyncio with fixtures

**Architecture:**
```
Order Service → OrderCreated Event → Kafka Topic
                                         ↓
                         ┌───────────────┼───────────────┐
                         ↓               ↓               ↓
                 Email Service   Analytics Service   Inventory Service
                 (send receipt)  (track metrics)     (reserve stock)
                 [async handler] [async handler]     [async handler]
```

**Python-Specific Advantages:**
- **Async/Await** - Native concurrency without callback hell
- **Pydantic** - Automatic validation, serialization, and schema generation
- **Type Hints** - IDE autocomplete, static analysis with mypy
- **Redis Integration** - Fast idempotency checking with async redis
- **Easy Testing** - pytest-asyncio for testing async code

---

## Project Structure

```
event-driven-example/
├── app/
│   ├── __init__.py
│   │
│   ├── events/
│   │   ├── __init__.py
│   │   ├── base.py                 # Base event model
│   │   ├── order_events.py         # OrderCreated, OrderShipped
│   │   ├── payment_events.py       # PaymentProcessed
│   │   └── schema_registry.py      # Event versioning
│   │
│   ├── producers/
│   │   ├── __init__.py
│   │   ├── base_producer.py        # Abstract producer
│   │   ├── kafka_producer.py       # Kafka implementation
│   │   └── order_producer.py       # Domain-specific producer
│   │
│   ├── consumers/
│   │   ├── __init__.py
│   │   ├── base_consumer.py        # Abstract consumer
│   │   ├── email_consumer.py       # Email notifications
│   │   ├── analytics_consumer.py   # Metrics tracking
│   │   └── inventory_consumer.py   # Stock reservation
│   │
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py             # Pydantic settings
│   │   └── kafka_config.py         # Kafka configuration
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── order_service.py
│   │   └── payment_service.py
│   │
│   ├── outbox/
│   │   ├── __init__.py
│   │   ├── models.py               # Outbox event model
│   │   ├── repository.py           # Database operations
│   │   └── relay.py                # Async relay worker
│   │
│   ├── dlq/
│   │   ├── __init__.py
│   │   ├── handler.py              # Dead letter handler
│   │   └── retry_policy.py         # Exponential backoff
│   │
│   ├── event_store/
│   │   ├── __init__.py
│   │   ├── store.py                # Event store implementation
│   │   └── replay.py               # Event replay logic
│   │
│   ├── idempotency/
│   │   ├── __init__.py
│   │   └── redis_store.py          # Redis-based tracking
│   │
│   └── api/
│       ├── __init__.py
│       └── routes.py               # FastAPI endpoints
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py                 # pytest fixtures
│   ├── test_producers.py
│   ├── test_consumers.py
│   └── test_integration.py
│
├── docker-compose.yml
├── pyproject.toml
├── requirements.txt
└── README.md
```

---

## Domain Events (Pydantic)

### Base Event Model

```python
# app/events/base.py
from abc import ABC, abstractmethod
from datetime import datetime
from typing import ClassVar
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class DomainEvent(BaseModel, ABC):
    """
    Base domain event with automatic validation via Pydantic.

    All events inherit from this base class and get:
    - Automatic JSON serialization/deserialization
    - Schema validation
    - Type checking
    - OpenAPI schema generation
    """
    event_id: UUID = Field(default_factory=uuid4)
    event_type: ClassVar[str]  # Set by subclasses
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: int = Field(default=1, ge=1)

    class Config:
        # Enable ORM mode for database models
        from_attributes = True
        # Use enum values for serialization
        use_enum_values = True
        # Generate JSON schema
        json_schema_extra = {
            "example": {
                "event_id": "123e4567-e89b-12d3-a456-426614174000",
                "timestamp": "2025-10-20T12:00:00Z",
                "version": 1
            }
        }

    def to_json(self) -> str:
        """Serialize to JSON string."""
        return self.model_dump_json()

    @classmethod
    def from_json(cls, json_str: str) -> "DomainEvent":
        """Deserialize from JSON string with validation."""
        return cls.model_validate_json(json_str)

    @abstractmethod
    def get_aggregate_id(self) -> str:
        """Return the aggregate ID for event ordering."""
        pass
```

### Order Events

```python
# app/events/order_events.py
from datetime import datetime
from decimal import Decimal
from typing import ClassVar
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, validator

from .base import DomainEvent


class OrderItem(BaseModel):
    """Individual order item with validation."""
    product_id: str = Field(..., min_length=1, max_length=100)
    product_name: str = Field(..., min_length=1, max_length=255)
    quantity: int = Field(..., gt=0, le=1000)
    price: Decimal = Field(..., gt=0, decimal_places=2)

    @validator('price')
    def validate_price(cls, v: Decimal) -> Decimal:
        """Ensure price is positive with max 2 decimal places."""
        if v <= 0:
            raise ValueError('Price must be positive')
        if v.as_tuple().exponent < -2:
            raise ValueError('Price can have at most 2 decimal places')
        return v


class OrderCreatedEvent(DomainEvent):
    """
    OrderCreated Event - Published when customer places an order.

    Pydantic automatically validates:
    - Email format (EmailStr)
    - Decimal precision
    - String lengths
    - List constraints
    """
    event_type: ClassVar[str] = "OrderCreated"

    order_id: str = Field(..., min_length=1, max_length=100)
    customer_id: str = Field(..., min_length=1, max_length=100)
    customer_email: EmailStr
    items: list[OrderItem] = Field(..., min_items=1)
    total_amount: Decimal = Field(..., gt=0, decimal_places=2)

    def get_aggregate_id(self) -> str:
        return self.order_id

    @validator('total_amount')
    def validate_total(cls, v: Decimal, values: dict) -> Decimal:
        """Validate total matches sum of items."""
        if 'items' in values:
            calculated_total = sum(
                item.price * item.quantity for item in values['items']
            )
            if abs(v - calculated_total) > Decimal('0.01'):
                raise ValueError(
                    f'Total {v} does not match items sum {calculated_total}'
                )
        return v


class OrderShippedEvent(DomainEvent):
    """OrderShipped Event - Published when order ships."""
    event_type: ClassVar[str] = "OrderShipped"

    order_id: str = Field(..., min_length=1, max_length=100)
    tracking_number: str = Field(..., min_length=1, max_length=100)
    carrier: str = Field(..., min_length=1, max_length=50)
    shipped_at: datetime = Field(default_factory=datetime.utcnow)

    def get_aggregate_id(self) -> str:
        return self.order_id
```

### Payment Events

```python
# app/events/payment_events.py
from decimal import Decimal
from enum import Enum
from typing import ClassVar

from pydantic import Field

from .base import DomainEvent


class PaymentStatus(str, Enum):
    """Payment status enumeration."""
    PENDING = "pending"
    APPROVED = "approved"
    DECLINED = "declined"
    REFUNDED = "refunded"


class PaymentMethod(str, Enum):
    """Payment method enumeration."""
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    PAYPAL = "paypal"
    BANK_TRANSFER = "bank_transfer"


class PaymentProcessedEvent(DomainEvent):
    """
    PaymentProcessed Event - Published when payment is processed.

    Uses Enums for type-safe status and method fields.
    """
    event_type: ClassVar[str] = "PaymentProcessed"

    order_id: str = Field(..., min_length=1, max_length=100)
    payment_id: str = Field(..., min_length=1, max_length=100)
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    payment_method: PaymentMethod
    status: PaymentStatus

    def get_aggregate_id(self) -> str:
        return self.order_id
```

---

## Event Producer (Async)

### Base Producer Interface

```python
# app/producers/base_producer.py
from abc import ABC, abstractmethod
from typing import Any

from app.events.base import DomainEvent


class EventProducer(ABC):
    """
    Abstract event producer interface.

    All producers (Kafka, RabbitMQ, etc.) implement this interface.
    """

    @abstractmethod
    async def publish(
        self,
        topic: str,
        event: DomainEvent,
        key: str | None = None
    ) -> None:
        """
        Publish event asynchronously.

        Args:
            topic: Topic/queue name
            event: Domain event to publish
            key: Optional partition key (for ordering)
        """
        pass

    @abstractmethod
    async def close(self) -> None:
        """Close producer and cleanup resources."""
        pass
```

### Kafka Event Producer

```python
# app/producers/kafka_producer.py
import asyncio
import logging
from typing import Any

from aiokafka import AIOKafkaProducer
from aiokafka.errors import KafkaError

from app.config.settings import get_settings
from app.events.base import DomainEvent
from .base_producer import EventProducer

logger = logging.getLogger(__name__)
settings = get_settings()


class KafkaEventProducer(EventProducer):
    """
    Kafka-based async event producer using aiokafka.

    Features:
    - Async/await for non-blocking I/O
    - Automatic retries with exponential backoff
    - Compression (snappy)
    - Idempotent producer (exactly-once semantics)
    """

    def __init__(self):
        self._producer: AIOKafkaProducer | None = None
        self._started = False

    async def start(self) -> None:
        """Initialize and start the Kafka producer."""
        if self._started:
            return

        self._producer = AIOKafkaProducer(
            bootstrap_servers=settings.kafka_bootstrap_servers,
            # Serialization
            key_serializer=lambda k: k.encode('utf-8') if k else None,
            value_serializer=lambda v: v.encode('utf-8'),
            # Reliability settings
            acks='all',  # Wait for all replicas
            retries=3,
            max_in_flight_requests_per_connection=1,  # Ordering guarantee
            enable_idempotence=True,  # Exactly-once
            # Performance settings
            compression_type='snappy',
            linger_ms=10,  # Batch messages for 10ms
            batch_size=16384,
        )

        await self._producer.start()
        self._started = True
        logger.info("Kafka producer started")

    async def publish(
        self,
        topic: str,
        event: DomainEvent,
        key: str | None = None
    ) -> None:
        """
        Publish event to Kafka topic.

        Args:
            topic: Kafka topic name
            event: Domain event (Pydantic model)
            key: Partition key (defaults to event_id)
        """
        if not self._started:
            await self.start()

        try:
            # Use aggregate_id as partition key for ordering
            partition_key = key or event.get_aggregate_id()

            # Serialize event to JSON
            event_json = event.to_json()

            # Send to Kafka
            metadata = await self._producer.send_and_wait(
                topic,
                value=event_json,
                key=partition_key
            )

            logger.info(
                f"Published {event.event_type} event {event.event_id} "
                f"to topic {topic} partition {metadata.partition} "
                f"offset {metadata.offset}"
            )

        except KafkaError as e:
            logger.error(
                f"Failed to publish event {event.event_id}: {e}",
                exc_info=True
            )
            raise

    async def close(self) -> None:
        """Stop and cleanup Kafka producer."""
        if self._producer and self._started:
            await self._producer.stop()
            self._started = False
            logger.info("Kafka producer stopped")
```

### Order Event Publisher

```python
# app/producers/order_producer.py
import logging

from app.events.order_events import OrderCreatedEvent, OrderShippedEvent
from .kafka_producer import KafkaEventProducer

logger = logging.getLogger(__name__)


class OrderEventPublisher:
    """
    Domain-specific event publisher for orders.

    Encapsulates topic names and business logic.
    """

    ORDER_TOPIC = "order-events"

    def __init__(self, producer: KafkaEventProducer):
        self.producer = producer

    async def publish_order_created(self, event: OrderCreatedEvent) -> None:
        """
        Publish OrderCreated event.

        Args:
            event: OrderCreated event with validated data
        """
        logger.info(f"Publishing OrderCreated for order {event.order_id}")
        await self.producer.publish(self.ORDER_TOPIC, event)

    async def publish_order_shipped(self, event: OrderShippedEvent) -> None:
        """
        Publish OrderShipped event.

        Args:
            event: OrderShipped event with validated data
        """
        logger.info(f"Publishing OrderShipped for order {event.order_id}")
        await self.producer.publish(self.ORDER_TOPIC, event)
```

---

## Event Consumer (Async)

### Base Consumer Interface

```python
# app/consumers/base_consumer.py
from abc import ABC, abstractmethod
import logging
from typing import Any

from app.events.base import DomainEvent

logger = logging.getLogger(__name__)


class EventConsumer(ABC):
    """
    Abstract event consumer interface.

    Consumers implement handle_event() to process specific event types.
    """

    @abstractmethod
    async def handle_event(self, event: DomainEvent) -> None:
        """
        Handle domain event.

        Args:
            event: Validated domain event

        Raises:
            Exception: Processing failed, will trigger retry/DLQ
        """
        pass

    async def on_error(self, event: DomainEvent, error: Exception) -> None:
        """
        Handle processing errors.

        Default behavior: log and re-raise.
        Override for custom error handling.
        """
        logger.error(
            f"Error processing event {event.event_id}: {error}",
            exc_info=True
        )
        raise
```

### Email Event Consumer

```python
# app/consumers/email_consumer.py
import asyncio
import logging

from app.events.order_events import OrderCreatedEvent, OrderShippedEvent
from app.idempotency.redis_store import IdempotencyStore
from .base_consumer import EventConsumer

logger = logging.getLogger(__name__)


class EmailEventConsumer(EventConsumer):
    """
    Email Service - Sends customer notifications.

    Features:
    - Async email sending (non-blocking)
    - Idempotency tracking with Redis
    - Handles OrderCreated and OrderShipped events
    """

    def __init__(self, idempotency_store: IdempotencyStore):
        self.idempotency_store = idempotency_store

    async def handle_event(self, event: OrderCreatedEvent | OrderShippedEvent) -> None:
        """Process order events and send emails."""

        # Check idempotency
        if await self.idempotency_store.is_processed(
            consumer_id="email-service",
            event_id=str(event.event_id)
        ):
            logger.info(f"Event {event.event_id} already processed, skipping")
            return

        # Handle based on event type
        if isinstance(event, OrderCreatedEvent):
            await self._send_order_confirmation(event)
        elif isinstance(event, OrderShippedEvent):
            await self._send_shipping_notification(event)

        # Mark as processed
        await self.idempotency_store.mark_processed(
            consumer_id="email-service",
            event_id=str(event.event_id),
            ttl_seconds=86400  # 24 hours
        )

    async def _send_order_confirmation(self, event: OrderCreatedEvent) -> None:
        """Send order confirmation email."""
        logger.info(
            f"Sending order confirmation to {event.customer_email} "
            f"for order {event.order_id}"
        )

        # Simulate async email service call
        # In production: use aiosmtplib, SendGrid, AWS SES, etc.
        await asyncio.sleep(0.1)

        logger.info(f"Order confirmation sent for {event.order_id}")

    async def _send_shipping_notification(self, event: OrderShippedEvent) -> None:
        """Send shipping notification email."""
        logger.info(
            f"Sending shipping notification for order {event.order_id} "
            f"with tracking {event.tracking_number}"
        )

        await asyncio.sleep(0.1)
        logger.info(f"Shipping notification sent for {event.order_id}")
```

### Analytics Event Consumer

```python
# app/consumers/analytics_consumer.py
import logging
from typing import Any

from app.events.order_events import OrderCreatedEvent
from app.events.payment_events import PaymentProcessedEvent
from .base_consumer import EventConsumer

logger = logging.getLogger(__name__)


class AnalyticsEventConsumer(EventConsumer):
    """
    Analytics Service - Tracks metrics and business intelligence.

    Processes multiple event types:
    - OrderCreated: Revenue tracking, customer behavior
    - PaymentProcessed: Payment success rates, methods
    """

    async def handle_event(
        self,
        event: OrderCreatedEvent | PaymentProcessedEvent
    ) -> None:
        """Process events for analytics."""

        # Type-safe dispatch using match statement (Python 3.10+)
        match event:
            case OrderCreatedEvent():
                await self._track_order_created(event)
            case PaymentProcessedEvent():
                await self._track_payment_processed(event)
            case _:
                logger.warning(f"Unknown event type: {type(event)}")

    async def _track_order_created(self, event: OrderCreatedEvent) -> None:
        """Track order metrics."""
        logger.info(
            f"Analytics: Order created - Customer: {event.customer_id}, "
            f"Total: ${event.total_amount}, Items: {len(event.items)}"
        )

        # In production:
        # - Send to data warehouse (Snowflake, BigQuery)
        # - Update real-time dashboards (Grafana, Tableau)
        # - Track customer lifetime value
        # - Product popularity metrics

        metrics = {
            'event_type': 'order_created',
            'customer_id': event.customer_id,
            'total_amount': float(event.total_amount),
            'item_count': len(event.items),
            'timestamp': event.timestamp.isoformat()
        }

        # Send to metrics backend (async)
        logger.debug(f"Metrics: {metrics}")

    async def _track_payment_processed(self, event: PaymentProcessedEvent) -> None:
        """Track payment metrics."""
        logger.info(
            f"Analytics: Payment processed - Order: {event.order_id}, "
            f"Method: {event.payment_method.value}, Status: {event.status.value}"
        )

        # Track:
        # - Payment success rate by method
        # - Decline reasons
        # - Processing time
        # - Geographic distribution
```

### Inventory Event Consumer (with Idempotency)

```python
# app/consumers/inventory_consumer.py
import logging

from app.events.order_events import OrderCreatedEvent
from app.idempotency.redis_store import IdempotencyStore
from .base_consumer import EventConsumer

logger = logging.getLogger(__name__)


class InventoryEventConsumer(EventConsumer):
    """
    Inventory Service - Reserves stock with idempotency.

    Critical: Must handle duplicate events gracefully.
    Uses Redis to track processed events.
    """

    def __init__(self, idempotency_store: IdempotencyStore):
        self.idempotency_store = idempotency_store

    async def handle_event(self, event: OrderCreatedEvent) -> None:
        """Reserve inventory for order items."""

        # Idempotency check - critical for inventory operations
        is_processed = await self.idempotency_store.is_processed(
            consumer_id="inventory-service",
            event_id=str(event.event_id)
        )

        if is_processed:
            logger.info(
                f"Event {event.event_id} already processed, "
                f"skipping inventory reservation"
            )
            return

        logger.info(f"Reserving inventory for order {event.order_id}")

        # Reserve stock for each item
        for item in event.items:
            await self._reserve_stock(
                product_id=item.product_id,
                quantity=item.quantity,
                order_id=event.order_id
            )

        # Mark as processed (atomic operation)
        await self.idempotency_store.mark_processed(
            consumer_id="inventory-service",
            event_id=str(event.event_id),
            ttl_seconds=86400  # 24 hours
        )

        logger.info(f"Inventory reserved for order {event.order_id}")

    async def _reserve_stock(
        self,
        product_id: str,
        quantity: int,
        order_id: str
    ) -> None:
        """
        Reserve stock in inventory database.

        In production:
        - Check available quantity
        - Create reservation record
        - Update inventory levels
        - Handle insufficient stock
        """
        logger.info(
            f"Reserving {quantity} units of product {product_id} "
            f"for order {order_id}"
        )

        # Database operation (e.g., using SQLAlchemy async)
        # await db.execute(
        #     update(Inventory)
        #     .where(Inventory.product_id == product_id)
        #     .values(reserved=Inventory.reserved + quantity)
        # )
```

---

## Message Broker Configuration (Kafka)

### Settings (Pydantic)

```python
# app/config/settings.py
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings with environment variable support.

    Pydantic automatically:
    - Loads from .env file
    - Validates types
    - Provides defaults
    """

    # Kafka
    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_consumer_group: str = "event-driven-app"
    kafka_auto_offset_reset: str = "earliest"
    kafka_max_poll_records: int = 100

    # Redis (for idempotency)
    redis_url: str = "redis://localhost:6379/0"
    redis_max_connections: int = 10

    # Database (for outbox pattern)
    database_url: str = "postgresql+asyncpg://user:pass@localhost/eventstore"

    # Application
    app_name: str = "Event-Driven App"
    log_level: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()
```

### Kafka Consumer Configuration

```python
# app/config/kafka_config.py
import logging
from typing import AsyncIterator, Type

from aiokafka import AIOKafkaConsumer
from aiokafka.errors import KafkaError

from app.config.settings import get_settings
from app.events.base import DomainEvent
from app.events.order_events import OrderCreatedEvent, OrderShippedEvent
from app.events.payment_events import PaymentProcessedEvent

logger = logging.getLogger(__name__)
settings = get_settings()


# Event type registry for deserialization
EVENT_REGISTRY: dict[str, Type[DomainEvent]] = {
    "OrderCreated": OrderCreatedEvent,
    "OrderShipped": OrderShippedEvent,
    "PaymentProcessed": PaymentProcessedEvent,
}


class KafkaConsumerManager:
    """
    Manages Kafka consumer lifecycle with async/await.

    Features:
    - Async message consumption
    - Automatic deserialization
    - Manual commit (at-least-once delivery)
    - Error handling with DLQ
    """

    def __init__(
        self,
        topics: list[str],
        group_id: str,
        enable_auto_commit: bool = False
    ):
        self.topics = topics
        self.group_id = group_id
        self.enable_auto_commit = enable_auto_commit
        self._consumer: AIOKafkaConsumer | None = None

    async def start(self) -> None:
        """Initialize and start Kafka consumer."""
        self._consumer = AIOKafkaConsumer(
            *self.topics,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            group_id=self.group_id,
            # Deserialization
            key_deserializer=lambda k: k.decode('utf-8') if k else None,
            value_deserializer=lambda v: v.decode('utf-8'),
            # Consumer settings
            auto_offset_reset=settings.kafka_auto_offset_reset,
            enable_auto_commit=self.enable_auto_commit,
            max_poll_records=settings.kafka_max_poll_records,
            # Session management
            session_timeout_ms=30000,
            heartbeat_interval_ms=10000,
        )

        await self._consumer.start()
        logger.info(
            f"Kafka consumer started - Group: {self.group_id}, "
            f"Topics: {self.topics}"
        )

    async def stop(self) -> None:
        """Stop and cleanup Kafka consumer."""
        if self._consumer:
            await self._consumer.stop()
            logger.info(f"Kafka consumer stopped - Group: {self.group_id}")

    async def consume_events(self) -> AsyncIterator[DomainEvent]:
        """
        Consume and deserialize events.

        Yields:
            Validated DomainEvent instances

        Usage:
            async for event in consumer.consume_events():
                await handle_event(event)
        """
        if not self._consumer:
            raise RuntimeError("Consumer not started")

        async for message in self._consumer:
            try:
                # Deserialize JSON to event object
                event_data = message.value
                event = self._deserialize_event(event_data)

                logger.debug(
                    f"Consumed {event.event_type} from partition "
                    f"{message.partition} offset {message.offset}"
                )

                yield event

            except Exception as e:
                logger.error(
                    f"Failed to deserialize message from offset "
                    f"{message.offset}: {e}",
                    exc_info=True
                )
                # Continue processing other messages
                continue

    def _deserialize_event(self, event_json: str) -> DomainEvent:
        """
        Deserialize JSON to typed event.

        Uses EVENT_REGISTRY to map event_type to Pydantic model.
        """
        import json

        # Parse JSON to get event_type
        event_dict = json.loads(event_json)
        event_type = event_dict.get('event_type')

        if not event_type:
            raise ValueError("Missing event_type in event data")

        # Look up event class
        event_class = EVENT_REGISTRY.get(event_type)
        if not event_class:
            raise ValueError(f"Unknown event type: {event_type}")

        # Deserialize and validate with Pydantic
        return event_class.model_validate_json(event_json)

    async def commit(self) -> None:
        """Manually commit offset (for at-least-once delivery)."""
        if self._consumer:
            await self._consumer.commit()
```

---

## Guaranteed Delivery Patterns

### At-Least-Once Delivery

```python
# Example consumer with manual commit
import logging

from app.config.kafka_config import KafkaConsumerManager
from app.consumers.email_consumer import EmailEventConsumer
from app.idempotency.redis_store import IdempotencyStore

logger = logging.getLogger(__name__)


async def run_email_consumer():
    """
    Email consumer with at-least-once delivery guarantee.

    Pattern:
    1. Consume message
    2. Process with idempotency check
    3. Commit offset only after success
    4. On failure, don't commit (message redelivered)
    """
    # Create consumer (auto_commit=False)
    consumer_manager = KafkaConsumerManager(
        topics=["order-events"],
        group_id="email-service",
        enable_auto_commit=False  # Manual commit for reliability
    )

    idempotency_store = IdempotencyStore()
    email_consumer = EmailEventConsumer(idempotency_store)

    await consumer_manager.start()
    await idempotency_store.connect()

    try:
        async for event in consumer_manager.consume_events():
            try:
                # Process event (with idempotency)
                await email_consumer.handle_event(event)

                # Commit only after successful processing
                await consumer_manager.commit()

                logger.info(f"Successfully processed event {event.event_id}")

            except Exception as e:
                logger.error(
                    f"Failed to process event {event.event_id}: {e}",
                    exc_info=True
                )
                # Don't commit - message will be redelivered
                # Idempotency ensures we don't duplicate work

    finally:
        await consumer_manager.stop()
        await idempotency_store.close()
```

---

## Exactly-Once Processing (Outbox Pattern)

### Outbox Event Model

```python
# app/outbox/models.py
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, String, Text
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class OutboxEvent(Base):
    """
    Outbox table for transactional event publishing.

    Pattern:
    1. Save business entity + outbox event in same transaction
    2. Background worker publishes events from outbox
    3. Mark as published
    4. Exactly-once semantics (database transaction + idempotent publish)
    """
    __tablename__ = "outbox_events"

    id = Column(String(36), primary_key=True)
    aggregate_id = Column(String(100), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)
    payload = Column(Text, nullable=False)  # JSON
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    published = Column(Boolean, nullable=False, default=False, index=True)
    published_at = Column(DateTime, nullable=True)
```

### Outbox Repository

```python
# app/outbox/repository.py
from datetime import datetime
from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import OutboxEvent


class OutboxRepository:
    """
    Async repository for outbox events.

    Uses SQLAlchemy async for non-blocking database operations.
    """

    def __init__(self, session: AsyncSession):
        self.session = session

    async def save(self, outbox_event: OutboxEvent) -> None:
        """Save outbox event (part of business transaction)."""
        self.session.add(outbox_event)
        await self.session.flush()

    async def get_unpublished(self, limit: int = 100) -> List[OutboxEvent]:
        """Get unpublished events for relay."""
        result = await self.session.execute(
            select(OutboxEvent)
            .where(OutboxEvent.published == False)
            .order_by(OutboxEvent.created_at)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def mark_published(self, event_id: str) -> None:
        """Mark event as published."""
        result = await self.session.execute(
            select(OutboxEvent).where(OutboxEvent.id == event_id)
        )
        event = result.scalar_one()
        event.published = True
        event.published_at = datetime.utcnow()
        await self.session.flush()
```

### Outbox Relay

```python
# app/outbox/relay.py
import asyncio
import logging
from typing import Type

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.config.settings import get_settings
from app.events.base import DomainEvent
from app.events.order_events import OrderCreatedEvent, OrderShippedEvent
from app.producers.kafka_producer import KafkaEventProducer
from .repository import OutboxRepository

logger = logging.getLogger(__name__)
settings = get_settings()


# Event class registry
EVENT_CLASSES: dict[str, Type[DomainEvent]] = {
    "OrderCreated": OrderCreatedEvent,
    "OrderShipped": OrderShippedEvent,
}


class OutboxRelay:
    """
    Background worker that publishes events from outbox to Kafka.

    Runs continuously:
    1. Poll outbox table for unpublished events
    2. Publish to Kafka
    3. Mark as published in transaction
    4. Exactly-once semantics via idempotent producer
    """

    def __init__(
        self,
        producer: KafkaEventProducer,
        poll_interval_seconds: int = 1
    ):
        self.producer = producer
        self.poll_interval = poll_interval_seconds
        self._running = False

        # Async database session
        engine = create_async_engine(settings.database_url)
        self.async_session_maker = sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )

    async def start(self) -> None:
        """Start relay worker."""
        self._running = True
        await self.producer.start()

        logger.info("Outbox relay started")

        while self._running:
            try:
                await self._relay_batch()
            except Exception as e:
                logger.error(f"Error in relay loop: {e}", exc_info=True)

            await asyncio.sleep(self.poll_interval)

    async def stop(self) -> None:
        """Stop relay worker."""
        self._running = False
        await self.producer.close()
        logger.info("Outbox relay stopped")

    async def _relay_batch(self) -> None:
        """Process one batch of unpublished events."""
        async with self.async_session_maker() as session:
            repository = OutboxRepository(session)

            # Get unpublished events
            events = await repository.get_unpublished(limit=100)

            if not events:
                return

            logger.info(f"Relaying {len(events)} outbox events")

            for outbox_event in events:
                try:
                    # Deserialize event
                    event_class = EVENT_CLASSES[outbox_event.event_type]
                    event = event_class.model_validate_json(
                        outbox_event.payload
                    )

                    # Publish to Kafka
                    await self.producer.publish(
                        topic="order-events",
                        event=event
                    )

                    # Mark as published (in same transaction)
                    await repository.mark_published(outbox_event.id)
                    await session.commit()

                    logger.info(f"Relayed outbox event {outbox_event.id}")

                except Exception as e:
                    logger.error(
                        f"Failed to relay outbox event {outbox_event.id}: {e}",
                        exc_info=True
                    )
                    await session.rollback()
```

---

## Idempotency with Redis

### Redis Idempotency Store

```python
# app/idempotency/redis_store.py
import logging
from typing import Optional

import redis.asyncio as redis

from app.config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class IdempotencyStore:
    """
    Redis-based idempotency tracking.

    Pattern:
    - Key: f"{consumer_id}:{event_id}"
    - Value: timestamp
    - TTL: Configurable (default 24 hours)

    Benefits:
    - Fast lookups (< 1ms)
    - Automatic expiration
    - Handles redeliveries gracefully
    """

    def __init__(self):
        self._redis: Optional[redis.Redis] = None

    async def connect(self) -> None:
        """Connect to Redis."""
        self._redis = redis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
            max_connections=settings.redis_max_connections
        )
        logger.info("Connected to Redis for idempotency tracking")

    async def close(self) -> None:
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()
            logger.info("Closed Redis connection")

    async def is_processed(
        self,
        consumer_id: str,
        event_id: str
    ) -> bool:
        """
        Check if event already processed by this consumer.

        Args:
            consumer_id: Unique consumer identifier
            event_id: Event UUID

        Returns:
            True if already processed, False otherwise
        """
        if not self._redis:
            raise RuntimeError("Redis not connected")

        key = self._make_key(consumer_id, event_id)
        exists = await self._redis.exists(key)
        return bool(exists)

    async def mark_processed(
        self,
        consumer_id: str,
        event_id: str,
        ttl_seconds: int = 86400  # 24 hours
    ) -> None:
        """
        Mark event as processed.

        Args:
            consumer_id: Unique consumer identifier
            event_id: Event UUID
            ttl_seconds: How long to remember (default 24h)
        """
        if not self._redis:
            raise RuntimeError("Redis not connected")

        key = self._make_key(consumer_id, event_id)

        # Set with expiration (atomic operation)
        await self._redis.setex(
            key,
            ttl_seconds,
            value="1"  # Just a marker
        )

        logger.debug(f"Marked event {event_id} as processed by {consumer_id}")

    def _make_key(self, consumer_id: str, event_id: str) -> str:
        """Generate Redis key."""
        return f"idempotency:{consumer_id}:{event_id}"
```

---

## Dead Letter Queue

### Dead Letter Handler

```python
# app/dlq/handler.py
import logging
from typing import Any

from app.config.kafka_config import KafkaConsumerManager
from app.events.base import DomainEvent
from app.producers.kafka_producer import KafkaEventProducer

logger = logging.getLogger(__name__)


class DeadLetterHandler:
    """
    Dead Letter Queue (DLQ) handler.

    When events fail processing after retries:
    1. Send to DLQ topic
    2. Log for investigation
    3. Alert operations team
    4. Optionally attempt recovery
    """

    DLQ_TOPIC = "dead-letter-queue"

    def __init__(self, producer: KafkaEventProducer):
        self.producer = producer

    async def send_to_dlq(
        self,
        event: DomainEvent,
        error: Exception,
        metadata: dict[str, Any] | None = None
    ) -> None:
        """
        Send failed event to DLQ.

        Args:
            event: Original event that failed
            error: Exception that occurred
            metadata: Additional context (retry count, etc.)
        """
        logger.error(
            f"Sending event {event.event_id} to DLQ due to: {error}",
            exc_info=True
        )

        # Enrich event with error metadata
        dlq_metadata = {
            "original_event_id": str(event.event_id),
            "event_type": event.event_type,
            "error_message": str(error),
            "error_type": type(error).__name__,
            **(metadata or {})
        }

        # Publish to DLQ topic
        await self.producer.publish(
            topic=self.DLQ_TOPIC,
            event=event,
            key=str(event.event_id)
        )

        logger.info(f"Event {event.event_id} sent to DLQ")

        # Alert operations (in production)
        # await self._send_alert(event, error, dlq_metadata)

    async def _send_alert(
        self,
        event: DomainEvent,
        error: Exception,
        metadata: dict[str, Any]
    ) -> None:
        """
        Send alert to operations team.

        Options:
        - PagerDuty
        - Slack webhook
        - Email
        - SMS
        """
        # TODO: Implement alerting
        pass


async def monitor_dlq():
    """
    Monitor DLQ for failed events.

    Actions:
    1. Log to centralized logging (ELK, Datadog)
    2. Store in database for manual review
    3. Attempt automated recovery
    4. Generate reports
    """
    consumer = KafkaConsumerManager(
        topics=["dead-letter-queue"],
        group_id="dlq-monitor"
    )

    await consumer.start()

    try:
        async for event in consumer.consume_events():
            logger.warning(
                f"DLQ: Received failed event {event.event_id} "
                f"of type {event.event_type}"
            )

            # Options:
            # 1. Store in database for manual review
            # 2. Attempt recovery (after fixing root cause)
            # 3. Generate incident report
            # 4. Update monitoring dashboards

            await consumer.commit()
    finally:
        await consumer.stop()
```

### Retry Policy

```python
# app/dlq/retry_policy.py
import asyncio
import logging
from typing import Callable, TypeVar

logger = logging.getLogger(__name__)

T = TypeVar('T')


async def exponential_backoff_retry(
    func: Callable[[], T],
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0
) -> T:
    """
    Retry with exponential backoff.

    Args:
        func: Async function to retry
        max_retries: Maximum retry attempts
        base_delay: Initial delay in seconds
        max_delay: Maximum delay in seconds
        exponential_base: Multiplier for each retry

    Returns:
        Result of successful function call

    Raises:
        Last exception if all retries fail
    """
    last_exception = None

    for attempt in range(max_retries + 1):
        try:
            return await func()
        except Exception as e:
            last_exception = e

            if attempt == max_retries:
                logger.error(f"All {max_retries} retries failed")
                raise

            # Calculate delay with exponential backoff
            delay = min(
                base_delay * (exponential_base ** attempt),
                max_delay
            )

            logger.warning(
                f"Attempt {attempt + 1}/{max_retries + 1} failed: {e}. "
                f"Retrying in {delay:.2f}s..."
            )

            await asyncio.sleep(delay)

    # Should never reach here, but for type safety
    raise last_exception
```

---

## Event Store Implementation

### Event Store

```python
# app/event_store/store.py
import logging
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from sqlalchemy import Column, DateTime, Integer, String, Text, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.ext.declarative import declarative_base

from app.events.base import DomainEvent

logger = logging.getLogger(__name__)
Base = declarative_base()


class StoredEvent(Base):
    """
    Event Store table - immutable log of all events.

    Benefits:
    - Complete audit trail
    - Event sourcing capability
    - Replay for debugging
    - Rebuild read models
    """
    __tablename__ = "event_store"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(36), unique=True, nullable=False, index=True)
    aggregate_id = Column(String(100), nullable=False, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    event_data = Column(Text, nullable=False)  # JSON
    version = Column(Integer, nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class EventStore:
    """
    Event Store for persisting all domain events.

    Append-only log with indexing for efficient queries.
    """

    def __init__(self, session: AsyncSession):
        self.session = session

    async def append(self, event: DomainEvent) -> None:
        """
        Append event to store (immutable).

        Args:
            event: Domain event to store
        """
        stored_event = StoredEvent(
            event_id=str(event.event_id),
            aggregate_id=event.get_aggregate_id(),
            event_type=event.event_type,
            event_data=event.to_json(),
            version=event.version,
            timestamp=event.timestamp
        )

        self.session.add(stored_event)
        await self.session.flush()

        logger.info(f"Stored event {event.event_id} in event store")

    async def get_by_aggregate(
        self,
        aggregate_id: str,
        from_version: int = 0
    ) -> List[StoredEvent]:
        """
        Get all events for an aggregate.

        Args:
            aggregate_id: Aggregate identifier (e.g., order_id)
            from_version: Only return events after this version

        Returns:
            Ordered list of events
        """
        result = await self.session.execute(
            select(StoredEvent)
            .where(StoredEvent.aggregate_id == aggregate_id)
            .where(StoredEvent.version > from_version)
            .order_by(StoredEvent.version)
        )
        return list(result.scalars().all())

    async def get_by_type(
        self,
        event_type: str,
        limit: int = 100
    ) -> List[StoredEvent]:
        """
        Get events by type.

        Args:
            event_type: Event type name
            limit: Maximum number of events

        Returns:
            List of events
        """
        result = await self.session.execute(
            select(StoredEvent)
            .where(StoredEvent.event_type == event_type)
            .order_by(StoredEvent.timestamp.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_time_range(
        self,
        start_time: datetime,
        end_time: datetime
    ) -> List[StoredEvent]:
        """Get events in time range."""
        result = await self.session.execute(
            select(StoredEvent)
            .where(StoredEvent.timestamp >= start_time)
            .where(StoredEvent.timestamp <= end_time)
            .order_by(StoredEvent.timestamp)
        )
        return list(result.scalars().all())
```

---

## Event Replay Capability

### Event Replay

```python
# app/event_store/replay.py
import asyncio
import logging
from datetime import datetime
from typing import List, Type

from app.config.kafka_config import EVENT_REGISTRY
from app.consumers.base_consumer import EventConsumer
from app.event_store.store import EventStore, StoredEvent
from app.events.base import DomainEvent

logger = logging.getLogger(__name__)


class EventReplay:
    """
    Event replay for rebuilding state or debugging.

    Use cases:
    1. Rebuild read models after corruption
    2. Debug production issues
    3. Create new projections
    4. Test new event handlers
    """

    def __init__(self, event_store: EventStore):
        self.event_store = event_store

    async def replay_aggregate(
        self,
        aggregate_id: str,
        consumer: EventConsumer,
        from_version: int = 0
    ) -> None:
        """
        Replay all events for an aggregate.

        Args:
            aggregate_id: Aggregate to replay
            consumer: Event handler
            from_version: Start from this version
        """
        logger.info(f"Replaying events for aggregate {aggregate_id}")

        stored_events = await self.event_store.get_by_aggregate(
            aggregate_id,
            from_version
        )

        for stored_event in stored_events:
            event = self._deserialize_event(stored_event)
            await consumer.handle_event(event)

        logger.info(
            f"Replayed {len(stored_events)} events for {aggregate_id}"
        )

    async def replay_time_range(
        self,
        start_time: datetime,
        end_time: datetime,
        consumer: EventConsumer
    ) -> None:
        """
        Replay events in time range.

        Useful for:
        - Debugging issues in specific time window
        - Rebuilding projections incrementally
        """
        logger.info(f"Replaying events from {start_time} to {end_time}")

        stored_events = await self.event_store.get_by_time_range(
            start_time,
            end_time
        )

        for stored_event in stored_events:
            event = self._deserialize_event(stored_event)
            await consumer.handle_event(event)

        logger.info(f"Replayed {len(stored_events)} events")

    async def replay_event_type(
        self,
        event_type: str,
        consumer: EventConsumer,
        limit: int = 1000
    ) -> None:
        """
        Replay specific event type.

        Useful for testing new handlers.
        """
        logger.info(f"Replaying {event_type} events")

        stored_events = await self.event_store.get_by_type(
            event_type,
            limit
        )

        for stored_event in stored_events:
            event = self._deserialize_event(stored_event)
            await consumer.handle_event(event)

        logger.info(f"Replayed {len(stored_events)} {event_type} events")

    def _deserialize_event(self, stored_event: StoredEvent) -> DomainEvent:
        """Deserialize stored event to domain event."""
        event_class = EVENT_REGISTRY[stored_event.event_type]
        return event_class.model_validate_json(stored_event.event_data)
```

---

## Event Schema Evolution

### Schema Versioning

```python
# app/events/schema_registry.py
import logging
from typing import Any, Type

from pydantic import BaseModel

from app.events.base import DomainEvent

logger = logging.getLogger(__name__)


class SchemaRegistry:
    """
    Manages event schema versions for backward compatibility.

    Pattern:
    - Version field in events
    - Upcasters transform old versions to new
    - Consumers always work with latest schema
    """

    def __init__(self):
        # Map: (event_type, version) -> event_class
        self._schemas: dict[tuple[str, int], Type[DomainEvent]] = {}

        # Map: (event_type, from_version, to_version) -> upcaster
        self._upcasters: dict[tuple[str, int, int], Any] = {}

    def register_schema(
        self,
        event_type: str,
        version: int,
        event_class: Type[DomainEvent]
    ) -> None:
        """Register event schema version."""
        key = (event_type, version)
        self._schemas[key] = event_class
        logger.info(f"Registered schema: {event_type} v{version}")

    def register_upcaster(
        self,
        event_type: str,
        from_version: int,
        to_version: int,
        upcaster: Any
    ) -> None:
        """
        Register schema upcaster.

        Args:
            event_type: Event type name
            from_version: Source version
            to_version: Target version
            upcaster: Function to transform event
        """
        key = (event_type, from_version, to_version)
        self._upcasters[key] = upcaster
        logger.info(
            f"Registered upcaster: {event_type} v{from_version} -> v{to_version}"
        )

    def deserialize(self, event_json: str, target_version: int | None = None) -> DomainEvent:
        """
        Deserialize event and upcast to target version.

        Args:
            event_json: JSON event data
            target_version: Target schema version (None = latest)

        Returns:
            Event with target schema version
        """
        import json

        # Parse to get event_type and version
        event_dict = json.loads(event_json)
        event_type = event_dict['event_type']
        current_version = event_dict['version']

        # Get schema for current version
        schema_key = (event_type, current_version)
        event_class = self._schemas.get(schema_key)

        if not event_class:
            raise ValueError(
                f"No schema registered for {event_type} v{current_version}"
            )

        # Deserialize to current version
        event = event_class.model_validate_json(event_json)

        # Upcast if needed
        if target_version and current_version < target_version:
            event = self._upcast(event, current_version, target_version)

        return event

    def _upcast(
        self,
        event: DomainEvent,
        from_version: int,
        to_version: int
    ) -> DomainEvent:
        """Upcast event through version chain."""
        current = event

        for version in range(from_version, to_version):
            upcaster_key = (current.event_type, version, version + 1)
            upcaster = self._upcasters.get(upcaster_key)

            if not upcaster:
                raise ValueError(
                    f"No upcaster for {current.event_type} "
                    f"v{version} -> v{version + 1}"
                )

            current = upcaster(current)

        return current


# Example: Order event schema evolution
# app/events/order_events_v2.py (hypothetical)

# Version 1: Original schema (from earlier)
# class OrderCreatedEvent(DomainEvent):
#     version = 1
#     order_id: str
#     customer_email: str
#     ...

# Version 2: Added customer_phone field
class OrderCreatedEventV2(DomainEvent):
    """OrderCreated v2 - Added phone number."""
    event_type: str = "OrderCreated"
    version: int = 2

    order_id: str
    customer_email: str
    customer_phone: str | None = None  # New field (optional for compatibility)
    # ... other fields


def upcast_order_created_v1_to_v2(event_v1: Any) -> OrderCreatedEventV2:
    """
    Upcast OrderCreated from v1 to v2.

    Adds default value for new customer_phone field.
    """
    return OrderCreatedEventV2(
        event_id=event_v1.event_id,
        timestamp=event_v1.timestamp,
        version=2,  # Update version
        order_id=event_v1.order_id,
        customer_email=event_v1.customer_email,
        customer_phone=None,  # Default for old events
        # ... copy other fields
    )


# Register schemas and upcasters
def setup_schema_registry() -> SchemaRegistry:
    """Configure schema registry with all versions."""
    registry = SchemaRegistry()

    # Register schemas
    # registry.register_schema("OrderCreated", 1, OrderCreatedEvent)
    registry.register_schema("OrderCreated", 2, OrderCreatedEventV2)

    # Register upcasters
    registry.register_upcaster(
        "OrderCreated",
        from_version=1,
        to_version=2,
        upcaster=upcast_order_created_v1_to_v2
    )

    return registry
```

---

## FastAPI Integration

### API Routes

```python
# app/api/routes.py
import logging
from decimal import Decimal

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.events.order_events import OrderCreatedEvent, OrderItem
from app.producers.order_producer import OrderEventPublisher
from app.producers.kafka_producer import KafkaEventProducer

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/orders", tags=["orders"])


# Request/Response models
class CreateOrderRequest(BaseModel):
    """Request to create order."""
    customer_id: str
    customer_email: EmailStr
    items: list[OrderItem]

    class Config:
        json_schema_extra = {
            "example": {
                "customer_id": "CUST001",
                "customer_email": "customer@example.com",
                "items": [
                    {
                        "product_id": "PROD001",
                        "product_name": "Widget",
                        "quantity": 2,
                        "price": "50.00"
                    }
                ]
            }
        }


class CreateOrderResponse(BaseModel):
    """Response from order creation."""
    order_id: str
    event_id: str
    message: str


# Global producer (in production, use dependency injection)
_producer: KafkaEventProducer | None = None


async def get_producer() -> KafkaEventProducer:
    """Get or create Kafka producer."""
    global _producer
    if _producer is None:
        _producer = KafkaEventProducer()
        await _producer.start()
    return _producer


@router.post(
    "",
    response_model=CreateOrderResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_order(request: CreateOrderRequest) -> CreateOrderResponse:
    """
    Create new order and publish OrderCreated event.

    Flow:
    1. Validate request (automatic via Pydantic)
    2. Generate order_id
    3. Create OrderCreated event
    4. Publish to Kafka
    5. Return order details
    """
    try:
        # Generate order ID (in production: use database sequence)
        import uuid
        order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"

        # Calculate total
        total_amount = sum(
            item.price * item.quantity for item in request.items
        )

        # Create event
        event = OrderCreatedEvent(
            order_id=order_id,
            customer_id=request.customer_id,
            customer_email=request.customer_email,
            items=request.items,
            total_amount=total_amount
        )

        # Publish event
        producer = await get_producer()
        publisher = OrderEventPublisher(producer)
        await publisher.publish_order_created(event)

        logger.info(f"Order {order_id} created and event published")

        return CreateOrderResponse(
            order_id=order_id,
            event_id=str(event.event_id),
            message=f"Order {order_id} created successfully"
        )

    except Exception as e:
        logger.error(f"Failed to create order: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create order: {str(e)}"
        )


@router.get("/{order_id}/events")
async def get_order_events(order_id: str):
    """
    Get all events for an order (from event store).

    Useful for debugging and audit trail.
    """
    # In production: query event store
    # from app.event_store.store import EventStore
    # events = await event_store.get_by_aggregate(order_id)
    # return events

    return {
        "order_id": order_id,
        "message": "Event store integration not shown for brevity"
    }
```

### FastAPI Application

```python
# app/main.py
import logging

from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.api.routes import router as orders_router
from app.config.settings import get_settings

settings = get_settings()

# Configure logging
logging.basicConfig(
    level=settings.log_level,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan - startup and shutdown.

    Startup:
    - Initialize Kafka producers/consumers
    - Connect to Redis
    - Connect to database

    Shutdown:
    - Close all connections
    - Flush pending events
    """
    logger.info("Starting application...")

    # Startup logic here
    # await initialize_kafka()
    # await connect_redis()

    yield

    # Shutdown logic here
    logger.info("Shutting down application...")
    # await close_kafka()
    # await close_redis()


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="Event-Driven Architecture with FastAPI, Kafka, and Pydantic",
    version="1.0.0",
    lifespan=lifespan
)

# Include routers
app.include_router(orders_router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.app_name
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Development only
        log_level=settings.log_level.lower()
    )
```

---

## Testing (pytest-asyncio)

### Test Configuration

```python
# tests/conftest.py
import asyncio
import pytest
import pytest_asyncio
from typing import AsyncIterator

from app.producers.kafka_producer import KafkaEventProducer
from app.consumers.email_consumer import EmailEventConsumer
from app.idempotency.redis_store import IdempotencyStore


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def kafka_producer() -> AsyncIterator[KafkaEventProducer]:
    """Create Kafka producer for testing."""
    producer = KafkaEventProducer()
    await producer.start()

    yield producer

    await producer.close()


@pytest_asyncio.fixture
async def idempotency_store() -> AsyncIterator[IdempotencyStore]:
    """Create Redis idempotency store for testing."""
    store = IdempotencyStore()
    await store.connect()

    yield store

    await store.close()


@pytest_asyncio.fixture
async def email_consumer(
    idempotency_store: IdempotencyStore
) -> EmailEventConsumer:
    """Create email consumer for testing."""
    return EmailEventConsumer(idempotency_store)
```

### Producer Tests

```python
# tests/test_producers.py
import pytest
from decimal import Decimal

from app.events.order_events import OrderCreatedEvent, OrderItem
from app.producers.kafka_producer import KafkaEventProducer


@pytest.mark.asyncio
async def test_publish_order_created_event(kafka_producer: KafkaEventProducer):
    """Test publishing OrderCreated event to Kafka."""

    # Arrange
    event = OrderCreatedEvent(
        order_id="TEST-ORDER-001",
        customer_id="CUST-001",
        customer_email="test@example.com",
        items=[
            OrderItem(
                product_id="PROD-001",
                product_name="Test Widget",
                quantity=2,
                price=Decimal("50.00")
            )
        ],
        total_amount=Decimal("100.00")
    )

    # Act
    await kafka_producer.publish(
        topic="order-events",
        event=event
    )

    # Assert
    # In integration test: consume message and verify
    assert event.event_id is not None
    assert event.event_type == "OrderCreated"


@pytest.mark.asyncio
async def test_event_serialization():
    """Test Pydantic event serialization/deserialization."""

    # Arrange
    original_event = OrderCreatedEvent(
        order_id="TEST-002",
        customer_id="CUST-002",
        customer_email="test2@example.com",
        items=[
            OrderItem(
                product_id="PROD-002",
                product_name="Another Widget",
                quantity=1,
                price=Decimal("75.50")
            )
        ],
        total_amount=Decimal("75.50")
    )

    # Act - Serialize
    json_str = original_event.to_json()

    # Act - Deserialize
    deserialized_event = OrderCreatedEvent.from_json(json_str)

    # Assert
    assert deserialized_event.order_id == original_event.order_id
    assert deserialized_event.customer_email == original_event.customer_email
    assert deserialized_event.total_amount == original_event.total_amount
    assert len(deserialized_event.items) == 1
    assert deserialized_event.items[0].product_id == "PROD-002"
```

### Consumer Tests

```python
# tests/test_consumers.py
import pytest
from decimal import Decimal

from app.consumers.email_consumer import EmailEventConsumer
from app.events.order_events import OrderCreatedEvent, OrderItem
from app.idempotency.redis_store import IdempotencyStore


@pytest.mark.asyncio
async def test_email_consumer_handles_event(
    email_consumer: EmailEventConsumer
):
    """Test email consumer processes OrderCreated event."""

    # Arrange
    event = OrderCreatedEvent(
        order_id="TEST-ORDER-003",
        customer_id="CUST-003",
        customer_email="customer@example.com",
        items=[
            OrderItem(
                product_id="PROD-003",
                product_name="Widget",
                quantity=1,
                price=Decimal("100.00")
            )
        ],
        total_amount=Decimal("100.00")
    )

    # Act
    await email_consumer.handle_event(event)

    # Assert
    # Verify email was "sent" (check logs or mock email service)
    # In production: use mocks or test email service


@pytest.mark.asyncio
async def test_idempotency_prevents_duplicate_processing(
    email_consumer: EmailEventConsumer,
    idempotency_store: IdempotencyStore
):
    """Test idempotency prevents duplicate event processing."""

    # Arrange
    event = OrderCreatedEvent(
        order_id="TEST-ORDER-004",
        customer_id="CUST-004",
        customer_email="duplicate@example.com",
        items=[
            OrderItem(
                product_id="PROD-004",
                product_name="Widget",
                quantity=1,
                price=Decimal("50.00")
            )
        ],
        total_amount=Decimal("50.00")
    )

    # Act - Process event first time
    await email_consumer.handle_event(event)

    # Act - Process same event again
    await email_consumer.handle_event(event)

    # Assert - Should be marked as processed
    is_processed = await idempotency_store.is_processed(
        consumer_id="email-service",
        event_id=str(event.event_id)
    )
    assert is_processed is True
```

### Integration Tests

```python
# tests/test_integration.py
import asyncio
import pytest
from decimal import Decimal

from app.config.kafka_config import KafkaConsumerManager
from app.consumers.email_consumer import EmailEventConsumer
from app.events.order_events import OrderCreatedEvent, OrderItem
from app.idempotency.redis_store import IdempotencyStore
from app.producers.kafka_producer import KafkaEventProducer


@pytest.mark.asyncio
@pytest.mark.integration
async def test_end_to_end_event_flow():
    """
    Integration test: Publish event → Kafka → Consumer processes.

    Requires:
    - Kafka running (docker-compose up kafka)
    - Redis running (docker-compose up redis)
    """
    # Setup
    producer = KafkaEventProducer()
    await producer.start()

    idempotency_store = IdempotencyStore()
    await idempotency_store.connect()

    consumer_manager = KafkaConsumerManager(
        topics=["order-events"],
        group_id="test-consumer"
    )
    await consumer_manager.start()

    email_consumer = EmailEventConsumer(idempotency_store)

    try:
        # Arrange
        event = OrderCreatedEvent(
            order_id="INTEGRATION-TEST-001",
            customer_id="CUST-INT-001",
            customer_email="integration@example.com",
            items=[
                OrderItem(
                    product_id="PROD-INT-001",
                    product_name="Integration Widget",
                    quantity=1,
                    price=Decimal("99.99")
                )
            ],
            total_amount=Decimal("99.99")
        )

        # Act - Publish
        await producer.publish("order-events", event)

        # Act - Consume (with timeout)
        async def consume_one():
            async for consumed_event in consumer_manager.consume_events():
                if consumed_event.event_id == event.event_id:
                    await email_consumer.handle_event(consumed_event)
                    await consumer_manager.commit()
                    return True
            return False

        result = await asyncio.wait_for(consume_one(), timeout=10.0)

        # Assert
        assert result is True

        # Verify idempotency
        is_processed = await idempotency_store.is_processed(
            consumer_id="email-service",
            event_id=str(event.event_id)
        )
        assert is_processed is True

    finally:
        # Cleanup
        await producer.close()
        await consumer_manager.stop()
        await idempotency_store.close()
```

---

## Monitoring and Observability

### Metrics Collection

```python
# app/monitoring/metrics.py
import logging
from typing import Callable
from functools import wraps
import time

from prometheus_client import Counter, Histogram, Gauge

logger = logging.getLogger(__name__)

# Prometheus metrics
events_published_total = Counter(
    'events_published_total',
    'Total number of events published',
    ['event_type', 'topic']
)

events_consumed_total = Counter(
    'events_consumed_total',
    'Total number of events consumed',
    ['event_type', 'consumer_group']
)

event_processing_duration = Histogram(
    'event_processing_duration_seconds',
    'Time spent processing events',
    ['event_type', 'consumer_group']
)

event_processing_errors = Counter(
    'event_processing_errors_total',
    'Total number of event processing errors',
    ['event_type', 'consumer_group', 'error_type']
)

kafka_lag = Gauge(
    'kafka_consumer_lag',
    'Kafka consumer lag',
    ['consumer_group', 'topic', 'partition']
)


def track_event_publish(event_type: str, topic: str):
    """Decorator to track event publishing."""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)
            events_published_total.labels(
                event_type=event_type,
                topic=topic
            ).inc()
            return result
        return wrapper
    return decorator


def track_event_consumption(event_type: str, consumer_group: str):
    """Decorator to track event consumption and processing time."""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()

            try:
                result = await func(*args, **kwargs)

                # Track success
                events_consumed_total.labels(
                    event_type=event_type,
                    consumer_group=consumer_group
                ).inc()

                # Track duration
                duration = time.time() - start_time
                event_processing_duration.labels(
                    event_type=event_type,
                    consumer_group=consumer_group
                ).observe(duration)

                return result

            except Exception as e:
                # Track error
                event_processing_errors.labels(
                    event_type=event_type,
                    consumer_group=consumer_group,
                    error_type=type(e).__name__
                ).inc()
                raise

        return wrapper
    return decorator
```

### Logging Configuration

```python
# app/monitoring/logging_config.py
import logging
import sys
from pythonjsonlogger import jsonlogger


def setup_logging(level: str = "INFO"):
    """
    Configure structured JSON logging.

    Benefits:
    - Easy parsing by log aggregators (ELK, Datadog)
    - Searchable fields
    - Contextual information
    """

    # Create JSON formatter
    formatter = jsonlogger.JsonFormatter(
        fmt='%(asctime)s %(name)s %(levelname)s %(message)s %(pathname)s %(lineno)d',
        timestamp=True
    )

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)

    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.addHandler(console_handler)

    # Kafka client logging (reduce verbosity)
    logging.getLogger('aiokafka').setLevel(logging.WARNING)
    logging.getLogger('kafka').setLevel(logging.WARNING)


# Usage in application
# from app.monitoring.logging_config import setup_logging
# setup_logging("INFO")
```

### Health Checks

```python
# app/monitoring/health.py
from typing import Dict
import logging

from app.producers.kafka_producer import KafkaEventProducer
from app.idempotency.redis_store import IdempotencyStore

logger = logging.getLogger(__name__)


class HealthChecker:
    """
    Health check for application dependencies.

    Checks:
    - Kafka connectivity
    - Redis connectivity
    - Database connectivity
    """

    def __init__(
        self,
        kafka_producer: KafkaEventProducer,
        redis_store: IdempotencyStore
    ):
        self.kafka_producer = kafka_producer
        self.redis_store = redis_store

    async def check_kafka(self) -> bool:
        """Check Kafka connectivity."""
        try:
            # Try to get cluster metadata
            if self.kafka_producer._producer:
                # Producer is connected
                return True
            return False
        except Exception as e:
            logger.error(f"Kafka health check failed: {e}")
            return False

    async def check_redis(self) -> bool:
        """Check Redis connectivity."""
        try:
            if self.redis_store._redis:
                # Try ping
                await self.redis_store._redis.ping()
                return True
            return False
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return False

    async def check_all(self) -> Dict[str, bool]:
        """Run all health checks."""
        return {
            "kafka": await self.check_kafka(),
            "redis": await self.check_redis(),
        }
```

---

## Running the Example

### Requirements

```
# requirements.txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
pydantic-settings==2.1.0

# Kafka
aiokafka==0.10.0

# Redis
redis[hiredis]==5.0.1

# Database
sqlalchemy[asyncio]==2.0.23
asyncpg==0.29.0
alembic==1.13.0

# Testing
pytest==7.4.3
pytest-asyncio==0.21.1
pytest-cov==4.1.0

# Monitoring
prometheus-client==0.19.0
python-json-logger==2.0.7
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Zookeeper (required for Kafka)
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"
    networks:
      - event-driven-net

  # Kafka
  kafka:
    image: confluentinc/cp-kafka:7.5.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
      - "9093:9093"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092,PLAINTEXT_INTERNAL://kafka:9093
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_INTERNAL:PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
    networks:
      - event-driven-net

  # Redis (for idempotency)
  redis:
    image: redis:7.2-alpine
    ports:
      - "6379:6379"
    networks:
      - event-driven-net

  # PostgreSQL (for outbox and event store)
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: eventstore
      POSTGRES_PASSWORD: eventstore123
      POSTGRES_DB: eventstore
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - event-driven-net

  # Kafka UI (optional, for debugging)
  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    depends_on:
      - kafka
    ports:
      - "8080:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9093
      KAFKA_CLUSTERS_0_ZOOKEEPER: zookeeper:2181
    networks:
      - event-driven-net

networks:
  event-driven-net:
    driver: bridge

volumes:
  postgres-data:
```

### Start Services

```bash
# Start infrastructure
docker-compose up -d

# Verify Kafka is ready
docker-compose logs -f kafka

# Check topics
docker-compose exec kafka kafka-topics --bootstrap-server localhost:9092 --list
```

### Run Application

```bash
# Install dependencies
pip install -r requirements.txt

# Run database migrations (if using Alembic)
alembic upgrade head

# Run FastAPI application
python -m app.main

# Or with uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Test the Flow

```bash
# Create an order (publish event)
curl -X POST http://localhost:8000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUST001",
    "customer_email": "customer@example.com",
    "items": [
      {
        "product_id": "PROD001",
        "product_name": "Python Event Book",
        "quantity": 2,
        "price": "29.99"
      }
    ]
  }'

# Check application logs
tail -f app.log

# View Kafka messages in UI
open http://localhost:8080
```

### Run Tests

```bash
# Unit tests only
pytest tests/ -v

# Include integration tests (requires Kafka/Redis)
pytest tests/ -v -m integration

# With coverage
pytest tests/ --cov=app --cov-report=html
```

---

## Performance Notes

### Python Async Advantages

1. **Non-Blocking I/O**
   - Event producers/consumers don't block threads
   - Handle thousands of concurrent connections
   - Efficient resource usage

2. **Concurrency Model**
   - Single-threaded event loop (simple debugging)
   - No GIL issues for I/O-bound tasks
   - Easy to reason about compared to threads

3. **Memory Efficiency**
   - Lightweight coroutines (vs OS threads)
   - Scales to 10,000+ concurrent tasks

### Benchmarks (Typical)

```
Event Publishing (async):
- 10,000 events/sec (single producer)
- 50,000 events/sec (5 producers)

Event Consumption (async):
- 15,000 events/sec (single consumer)
- 75,000 events/sec (5 consumers, 3 partitions)

Idempotency Check (Redis):
- < 1ms per check (local Redis)
- < 5ms per check (remote Redis)

End-to-End Latency:
- P50: 15ms
- P95: 50ms
- P99: 100ms
```

### Optimization Tips

1. **Batch Processing**
   ```python
   # Process events in batches
   async def consume_batch(consumer: KafkaConsumerManager):
       batch = []
       async for event in consumer.consume_events():
           batch.append(event)
           if len(batch) >= 100:
               await process_batch(batch)
               await consumer.commit()
               batch.clear()
   ```

2. **Connection Pooling**
   ```python
   # Redis connection pool
   redis_pool = redis.ConnectionPool.from_url(
       settings.redis_url,
       max_connections=50
   )
   ```

3. **Async Database Queries**
   ```python
   # Use asyncpg or SQLAlchemy async
   async with AsyncSession(engine) as session:
       result = await session.execute(query)
   ```

---

## Key Takeaways

1. **Python + Async = Clean Concurrency**
   - Native async/await syntax
   - No callback hell
   - Easy error handling

2. **Pydantic = Automatic Validation**
   - Type-safe events
   - Serialization built-in
   - OpenAPI schema generation

3. **Type Hints = Fewer Bugs**
   - IDE autocomplete
   - Static analysis with mypy
   - Self-documenting code

4. **Redis Idempotency = Exactly-Once**
   - Fast duplicate detection
   - TTL-based cleanup
   - Handles redeliveries gracefully

5. **Event Store = Complete Audit Trail**
   - Replay capability
   - Debugging production issues
   - Event sourcing foundation

6. **Testing with pytest-asyncio**
   - Test async code naturally
   - Fixtures for setup/teardown
   - Integration tests with real Kafka/Redis

---

**Related Guides:**
- [Deep Dive: Event-Driven Architecture](../../../3-design/architecture-pattern/deep-dive-event-driven.md)
- [Deep Dive: Microservices](../../../3-design/architecture-pattern/deep-dive-microservices.md)

*Last Updated: 2025-10-20*
