# Microservices Architecture - Python Implementation

**Pattern:** Microservices Architecture
**Language:** Python
**Framework:** FastAPI, Consul, RabbitMQ/Kafka
**Related Guide:** [Deep Dive: Microservices](../../../3-design/architecture-pattern/deep-dive-microservices.md)

## TL;DR

**Complete microservices implementation with FastAPI** showing service decomposition, async REST/messaging, service discovery, API Gateway, and Saga orchestration. **Key advantage**: Python's async/await makes I/O-bound microservices highly efficient. **Stack**: FastAPI for REST → Consul for discovery → RabbitMQ/Kafka for events → Saga pattern for distributed transactions. **Performance**: ~50K requests/sec per service with proper async handling.

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Service Implementation](#service-implementation)
4. [Service Discovery (Consul)](#service-discovery-consul)
5. [API Gateway](#api-gateway)
6. [Inter-Service Communication](#inter-service-communication)
7. [Saga Pattern Implementation](#saga-pattern-implementation)
8. [Configuration](#configuration)
9. [Running the Example](#running-the-example)

---

## Overview

This example demonstrates a complete e-commerce microservices system with:

- **Order Service** - Manages orders (FastAPI + PostgreSQL)
- **Payment Service** - Processes payments (FastAPI + Stripe mock)
- **Inventory Service** - Manages stock (FastAPI + PostgreSQL)
- **Notification Service** - Sends notifications (FastAPI + RabbitMQ)
- **API Gateway** - Single entry point (FastAPI with httpx)
- **Service Registry (Consul)** - Service discovery
- **Saga Orchestrator** - Distributed transaction coordination

**Architecture:**
```
Client → API Gateway (FastAPI) → Consul (Service Discovery)
                     ↓
         ┌───────────┴───────────┐
         ↓           ↓           ↓
    Order Service  Payment    Inventory
    (FastAPI)      Service    Service
                   (FastAPI)  (FastAPI)
         ↓           ↓           ↓
    RabbitMQ/Kafka (Event Bus)
         ↓
    Notification Service (FastAPI)
```

---

## Project Structure

```
microservices-demo/
├── shared/                         # Shared libraries
│   ├── __init__.py
│   ├── events.py                   # Event definitions
│   ├── consul_client.py            # Service discovery
│   └── messaging.py                # RabbitMQ/Kafka client
│
├── order-service/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app
│   │   ├── models.py               # SQLAlchemy models
│   │   ├── schemas.py              # Pydantic schemas
│   │   ├── service.py              # Business logic
│   │   └── repository.py           # Database access
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
│
├── payment-service/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── service.py
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
│
├── inventory-service/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── service.py
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
│
├── notification-service/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   └── consumer.py             # Event consumer
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
│
├── api-gateway/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   └── proxy.py                # Service proxy
│   ├── Dockerfile
│   └── requirements.txt
│
├── saga-orchestrator/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   └── saga.py                 # Saga coordinator
│   ├── Dockerfile
│   └── requirements.txt
│
└── docker-compose.yml              # All services
```

---

## Service Implementation

### 1. Order Service

**requirements.txt:**
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
asyncpg==0.29.0
pydantic==2.5.0
pydantic-settings==2.1.0
aio-pika==9.3.1
python-consul==1.1.0
httpx==0.25.1
```

**app/models.py:**
```python
from sqlalchemy import Column, String, Integer, Numeric, DateTime, Enum
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

Base = declarative_base()

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PAYMENT_PROCESSING = "payment_processing"
    PAYMENT_COMPLETED = "payment_completed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"

class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True)
    customer_id = Column(String, nullable=False)
    product_id = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

**app/schemas.py:**
```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from decimal import Decimal

class OrderCreate(BaseModel):
    customer_id: str
    product_id: str
    quantity: int = Field(gt=0)
    total_amount: Decimal = Field(gt=0)

class OrderResponse(BaseModel):
    id: str
    customer_id: str
    product_id: str
    quantity: int
    total_amount: Decimal
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class OrderUpdate(BaseModel):
    status: str
```

**app/repository.py:**
```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from app.models import Order, OrderStatus
import uuid

class OrderRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, order_data: dict) -> Order:
        order = Order(
            id=str(uuid.uuid4()),
            **order_data
        )
        self.session.add(order)
        await self.session.commit()
        await self.session.refresh(order)
        return order

    async def get_by_id(self, order_id: str) -> Optional[Order]:
        result = await self.session.execute(
            select(Order).where(Order.id == order_id)
        )
        return result.scalar_one_or_none()

    async def update_status(self, order_id: str, status: OrderStatus) -> Optional[Order]:
        order = await self.get_by_id(order_id)
        if order:
            order.status = status
            await self.session.commit()
            await self.session.refresh(order)
        return order

    async def get_all(self) -> List[Order]:
        result = await self.session.execute(select(Order))
        return list(result.scalars().all())
```

**app/service.py:**
```python
from app.repository import OrderRepository
from app.schemas import OrderCreate, OrderResponse
from app.models import OrderStatus
from shared.messaging import MessagePublisher
from shared.events import OrderCreatedEvent, OrderEvent
from typing import List

class OrderService:
    def __init__(self, repository: OrderRepository, publisher: MessagePublisher):
        self.repository = repository
        self.publisher = publisher

    async def create_order(self, order_data: OrderCreate) -> OrderResponse:
        # Create order
        order = await self.repository.create(order_data.model_dump())

        # Publish event
        event = OrderCreatedEvent(
            order_id=order.id,
            customer_id=order.customer_id,
            product_id=order.product_id,
            quantity=order.quantity,
            total_amount=float(order.total_amount)
        )
        await self.publisher.publish("order.created", event.model_dump())

        return OrderResponse.model_validate(order)

    async def get_order(self, order_id: str) -> OrderResponse:
        order = await self.repository.get_by_id(order_id)
        if not order:
            raise ValueError(f"Order {order_id} not found")
        return OrderResponse.model_validate(order)

    async def update_order_status(self, order_id: str, status: str) -> OrderResponse:
        order_status = OrderStatus(status)
        order = await self.repository.update_status(order_id, order_status)
        if not order:
            raise ValueError(f"Order {order_id} not found")
        return OrderResponse.model_validate(order)

    async def list_orders(self) -> List[OrderResponse]:
        orders = await self.repository.get_all()
        return [OrderResponse.model_validate(order) for order in orders]
```

**app/main.py:**
```python
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from contextlib import asynccontextmanager
import logging

from app.models import Base
from app.schemas import OrderCreate, OrderResponse, OrderUpdate
from app.service import OrderService
from app.repository import OrderRepository
from shared.messaging import RabbitMQPublisher
from shared.consul_client import ConsulClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database
DATABASE_URL = "postgresql+asyncpg://user:password@postgres:5432/orders"
engine = create_async_engine(DATABASE_URL, echo=True)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)

# Messaging
publisher = RabbitMQPublisher("amqp://guest:guest@rabbitmq:5672/")

# Service discovery
consul = ConsulClient("consul", 8500)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await publisher.connect()

    # Register with Consul
    await consul.register_service(
        service_name="order-service",
        service_id="order-service-1",
        host="order-service",
        port=8001,
        health_check_url="http://order-service:8001/health"
    )

    yield

    # Shutdown
    await publisher.close()
    await consul.deregister_service("order-service-1")

app = FastAPI(title="Order Service", lifespan=lifespan)

async def get_db() -> AsyncSession:
    async with async_session_maker() as session:
        yield session

async def get_service(db: AsyncSession = Depends(get_db)) -> OrderService:
    repository = OrderRepository(db)
    return OrderService(repository, publisher)

@app.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order: OrderCreate,
    service: OrderService = Depends(get_service)
):
    try:
        return await service.create_order(order)
    except Exception as e:
        logger.error(f"Error creating order: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    service: OrderService = Depends(get_service)
):
    try:
        return await service.get_order(order_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.patch("/orders/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: str,
    update: OrderUpdate,
    service: OrderService = Depends(get_service)
):
    try:
        return await service.update_order_status(order_id, update.status)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/orders", response_model=list[OrderResponse])
async def list_orders(service: OrderService = Depends(get_service)):
    return await service.list_orders()

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

---

## Shared Components

### shared/events.py

```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class OrderEvent(BaseModel):
    event_id: str
    order_id: str
    timestamp: datetime = datetime.utcnow()

class OrderCreatedEvent(OrderEvent):
    customer_id: str
    product_id: str
    quantity: int
    total_amount: float

class PaymentProcessedEvent(OrderEvent):
    payment_id: str
    amount: float
    status: str

class InventoryReservedEvent(OrderEvent):
    product_id: str
    quantity: int
    reservation_id: str

class OrderCompletedEvent(OrderEvent):
    pass

class OrderFailedEvent(OrderEvent):
    reason: str
```

### shared/messaging.py

```python
import aio_pika
import json
import logging
from typing import Callable, Dict
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)

class MessagePublisher(ABC):
    @abstractmethod
    async def connect(self):
        pass

    @abstractmethod
    async def publish(self, routing_key: str, message: dict):
        pass

    @abstractmethod
    async def close(self):
        pass

class RabbitMQPublisher(MessagePublisher):
    def __init__(self, url: str):
        self.url = url
        self.connection = None
        self.channel = None
        self.exchange = None

    async def connect(self):
        self.connection = await aio_pika.connect_robust(self.url)
        self.channel = await self.connection.channel()
        self.exchange = await self.channel.declare_exchange(
            "events",
            aio_pika.ExchangeType.TOPIC,
            durable=True
        )

    async def publish(self, routing_key: str, message: dict):
        if not self.exchange:
            raise RuntimeError("Not connected to RabbitMQ")

        message_body = json.dumps(message, default=str).encode()

        await self.exchange.publish(
            aio_pika.Message(
                body=message_body,
                content_type="application/json"
            ),
            routing_key=routing_key
        )
        logger.info(f"Published message to {routing_key}: {message}")

    async def close(self):
        if self.connection:
            await self.connection.close()

class RabbitMQConsumer:
    def __init__(self, url: str):
        self.url = url
        self.connection = None
        self.channel = None

    async def connect(self):
        self.connection = await aio_pika.connect_robust(self.url)
        self.channel = await self.connection.channel()

    async def consume(self, routing_key: str, callback: Callable):
        exchange = await self.channel.declare_exchange(
            "events",
            aio_pika.ExchangeType.TOPIC,
            durable=True
        )

        queue = await self.channel.declare_queue("", exclusive=True)
        await queue.bind(exchange, routing_key=routing_key)

        async with queue.iterator() as queue_iter:
            async for message in queue_iter:
                async with message.process():
                    body = json.loads(message.body.decode())
                    await callback(body)

    async def close(self):
        if self.connection:
            await self.connection.close()
```

### shared/consul_client.py

```python
import consul.aio
import logging

logger = logging.getLogger(__name__)

class ConsulClient:
    def __init__(self, host: str, port: int):
        self.consul = consul.aio.Consul(host=host, port=port)

    async def register_service(
        self,
        service_name: str,
        service_id: str,
        host: str,
        port: int,
        health_check_url: str
    ):
        await self.consul.agent.service.register(
            name=service_name,
            service_id=service_id,
            address=host,
            port=port,
            check=consul.Check.http(health_check_url, interval="10s", timeout="5s")
        )
        logger.info(f"Registered {service_name} with Consul")

    async def deregister_service(self, service_id: str):
        await self.consul.agent.service.deregister(service_id)
        logger.info(f"Deregistered {service_id} from Consul")

    async def discover_service(self, service_name: str):
        _, services = await self.consul.health.service(service_name, passing=True)
        if not services:
            raise ValueError(f"No healthy instances of {service_name} found")

        # Simple round-robin (use first healthy instance)
        service = services[0]
        return f"http://{service['Service']['Address']}:{service['Service']['Port']}"
```

---

## API Gateway

**api-gateway/app/main.py:**
```python
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
import httpx
import logging
from shared.consul_client import ConsulClient

logger = logging.getLogger(__name__)

app = FastAPI(title="API Gateway")

consul = ConsulClient("consul", 8500)

@app.api_route("/{service}/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy(service: str, path: str, request: Request):
    try:
        # Discover service
        service_url = await consul.discover_service(f"{service}-service")

        # Forward request
        url = f"{service_url}/{path}"

        async with httpx.AsyncClient() as client:
            # Get request body if present
            body = await request.body() if request.method in ["POST", "PUT", "PATCH"] else None

            response = await client.request(
                method=request.method,
                url=url,
                headers=dict(request.headers),
                content=body,
                params=dict(request.query_params)
            )

            return JSONResponse(
                content=response.json() if response.content else {},
                status_code=response.status_code
            )

    except ValueError as e:
        raise HTTPException(status_code=503, detail=f"Service unavailable: {str(e)}")
    except Exception as e:
        logger.error(f"Gateway error: {e}")
        raise HTTPException(status_code=500, detail="Internal gateway error")

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

---

## Saga Pattern Implementation

**saga-orchestrator/app/saga.py:**
```python
from enum import Enum
from typing import Dict, List, Callable
import httpx
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

class SagaStepStatus(Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    COMPENSATED = "compensated"

@dataclass
class SagaStep:
    name: str
    action: Callable
    compensation: Callable
    status: SagaStepStatus = SagaStepStatus.PENDING

class OrderSaga:
    def __init__(self, consul_client):
        self.consul = consul_client
        self.steps: List[SagaStep] = []
        self.context: Dict = {}

    async def execute(self, order_data: dict) -> bool:
        """Execute saga with automatic compensation on failure"""
        self.context["order_data"] = order_data

        # Define saga steps
        self.steps = [
            SagaStep("create_order", self.create_order, self.cancel_order),
            SagaStep("reserve_inventory", self.reserve_inventory, self.release_inventory),
            SagaStep("process_payment", self.process_payment, self.refund_payment),
            SagaStep("confirm_order", self.confirm_order, self.cancel_order),
        ]

        # Execute forward steps
        for step in self.steps:
            try:
                logger.info(f"Executing step: {step.name}")
                result = await step.action(self.context)
                step.status = SagaStepStatus.SUCCESS
                self.context[step.name] = result
            except Exception as e:
                logger.error(f"Step {step.name} failed: {e}")
                step.status = SagaStepStatus.FAILED

                # Compensate previous successful steps
                await self.compensate()
                return False

        return True

    async def compensate(self):
        """Execute compensation actions in reverse order"""
        logger.info("Starting saga compensation")

        for step in reversed(self.steps):
            if step.status == SagaStepStatus.SUCCESS:
                try:
                    logger.info(f"Compensating step: {step.name}")
                    await step.compensation(self.context)
                    step.status = SagaStepStatus.COMPENSATED
                except Exception as e:
                    logger.error(f"Compensation failed for {step.name}: {e}")

    async def create_order(self, context: dict) -> dict:
        service_url = await self.consul.discover_service("order-service")
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{service_url}/orders",
                json=context["order_data"]
            )
            response.raise_for_status()
            return response.json()

    async def cancel_order(self, context: dict):
        if "create_order" in context:
            order_id = context["create_order"]["id"]
            service_url = await self.consul.discover_service("order-service")
            async with httpx.AsyncClient() as client:
                await client.patch(
                    f"{service_url}/orders/{order_id}",
                    json={"status": "cancelled"}
                )

    async def reserve_inventory(self, context: dict) -> dict:
        order = context["create_order"]
        service_url = await self.consul.discover_service("inventory-service")
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{service_url}/reservations",
                json={
                    "product_id": order["product_id"],
                    "quantity": order["quantity"]
                }
            )
            response.raise_for_status()
            return response.json()

    async def release_inventory(self, context: dict):
        if "reserve_inventory" in context:
            reservation = context["reserve_inventory"]
            service_url = await self.consul.discover_service("inventory-service")
            async with httpx.AsyncClient() as client:
                await client.delete(
                    f"{service_url}/reservations/{reservation['id']}"
                )

    async def process_payment(self, context: dict) -> dict:
        order = context["create_order"]
        service_url = await self.consul.discover_service("payment-service")
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{service_url}/payments",
                json={
                    "order_id": order["id"],
                    "amount": str(order["total_amount"])
                }
            )
            response.raise_for_status()
            return response.json()

    async def refund_payment(self, context: dict):
        if "process_payment" in context:
            payment = context["process_payment"]
            service_url = await self.consul.discover_service("payment-service")
            async with httpx.AsyncClient() as client:
                await client.post(
                    f"{service_url}/payments/{payment['id']}/refund"
                )

    async def confirm_order(self, context: dict) -> dict:
        order = context["create_order"]
        service_url = await self.consul.discover_service("order-service")
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{service_url}/orders/{order['id']}",
                json={"status": "completed"}
            )
            response.raise_for_status()
            return response.json()
```

---

## Configuration

### docker-compose.yml

```yaml
version: '3.8'

services:
  consul:
    image: consul:1.16
    ports:
      - "8500:8500"
    command: agent -server -ui -bootstrap-expect=1 -client=0.0.0.0

  rabbitmq:
    image: rabbitmq:3.12-management
    ports:
      - "5672:5672"
      - "15672:15672"

  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"

  order-service:
    build: ./order-service
    ports:
      - "8001:8001"
    environment:
      DATABASE_URL: postgresql+asyncpg://user:password@postgres:5432/orders
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672/
      CONSUL_HOST: consul
    depends_on:
      - postgres
      - rabbitmq
      - consul
    command: uvicorn app.main:app --host 0.0.0.0 --port 8001

  payment-service:
    build: ./payment-service
    ports:
      - "8002:8002"
    environment:
      DATABASE_URL: postgresql+asyncpg://user:password@postgres:5432/payments
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672/
      CONSUL_HOST: consul
    depends_on:
      - postgres
      - rabbitmq
      - consul
    command: uvicorn app.main:app --host 0.0.0.0 --port 8002

  inventory-service:
    build: ./inventory-service
    ports:
      - "8003:8003"
    environment:
      DATABASE_URL: postgresql+asyncpg://user:password@postgres:5432/inventory
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672/
      CONSUL_HOST: consul
    depends_on:
      - postgres
      - rabbitmq
      - consul
    command: uvicorn app.main:app --host 0.0.0.0 --port 8003

  notification-service:
    build: ./notification-service
    environment:
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672/
      CONSUL_HOST: consul
    depends_on:
      - rabbitmq
      - consul

  api-gateway:
    build: ./api-gateway
    ports:
      - "8000:8000"
    environment:
      CONSUL_HOST: consul
    depends_on:
      - consul
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000

  saga-orchestrator:
    build: ./saga-orchestrator
    ports:
      - "8010:8010"
    environment:
      CONSUL_HOST: consul
    depends_on:
      - consul
    command: uvicorn app.main:app --host 0.0.0.0 --port 8010
```

### Dockerfile (example for order-service)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

---

## Running the Example

### Start All Services

```bash
# Build and start
docker-compose up --build

# Services will be available:
# - API Gateway: http://localhost:8000
# - Order Service: http://localhost:8001
# - Payment Service: http://localhost:8002
# - Inventory Service: http://localhost:8003
# - Consul UI: http://localhost:8500
# - RabbitMQ Management: http://localhost:15672
```

### Test the System

```bash
# Create an order through API Gateway
curl -X POST http://localhost:8000/order/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "customer-123",
    "product_id": "product-456",
    "quantity": 2,
    "total_amount": "99.99"
  }'

# Get order status
curl http://localhost:8000/order/orders/{order_id}

# Execute saga orchestration
curl -X POST http://localhost:8010/saga/execute \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "customer-123",
    "product_id": "product-456",
    "quantity": 2,
    "total_amount": "99.99"
  }'
```

### Testing

```python
# tests/test_order_service.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_create_order():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/orders", json={
            "customer_id": "test-customer",
            "product_id": "test-product",
            "quantity": 1,
            "total_amount": "49.99"
        })
        assert response.status_code == 201
        data = response.json()
        assert data["customer_id"] == "test-customer"
        assert data["status"] == "pending"

@pytest.mark.asyncio
async def test_get_order():
    # Create order first
    async with AsyncClient(app=app, base_url="http://test") as client:
        create_response = await client.post("/orders", json={
            "customer_id": "test-customer",
            "product_id": "test-product",
            "quantity": 1,
            "total_amount": "49.99"
        })
        order_id = create_response.json()["id"]

        # Get order
        response = await client.get(f"/orders/{order_id}")
        assert response.status_code == 200
        assert response.json()["id"] == order_id
```

---

## Key Python Advantages

✅ **Async/Await** - Native async support with asyncio for I/O-bound operations
✅ **FastAPI** - Automatic OpenAPI docs, dependency injection, validation
✅ **Pydantic** - Data validation and serialization with type hints
✅ **SQLAlchemy Async** - Modern async ORM with type safety
✅ **Simple Deployment** - Single uvicorn process per service
✅ **Rich Ecosystem** - Libraries for Consul, RabbitMQ, Kafka, Redis
✅ **Type Hints** - Static typing with mypy for better code quality
✅ **Testing** - pytest-asyncio for async test support

---

## Performance Notes

- **FastAPI**: ~50,000 requests/sec per service (async)
- **Cold Start**: ~1-2 seconds with proper async setup
- **Memory**: ~50-100 MB per service (vs 200-500 MB for JVM)
- **Scale**: Horizontal scaling with Docker/Kubernetes

---

*Last Updated: 2025-10-20*
