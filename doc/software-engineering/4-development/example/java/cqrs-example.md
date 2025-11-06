# CQRS (Command Query Responsibility Segregation) - Java Implementation

**Pattern:** CQRS
**Language:** Java
**Framework:** Spring Boot 3.x, Axon Framework
**Related Guide:** [Deep Dive: CQRS](../../../3-design/architecture-pattern/deep-dive-cqrs.md)

## TL;DR

**Complete CQRS implementation** separating writes (commands) from reads (queries) with independent models and databases. **Key principle**: Command model (normalized) → events → Query model (denormalized). **Critical components**: Command handlers modify write DB → publish events → projection handlers update read DB → query handlers serve optimized views.

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Write Model (Command Side)](#write-model-command-side)
4. [Read Model (Query Side)](#read-model-query-side)
5. [Event Synchronization](#event-synchronization)
6. [Complete Example with Axon Framework](#complete-example-with-axon-framework)
7. [Testing](#testing)
8. [Running the Example](#running-the-example)

---

## Overview

This example demonstrates CQRS for an e-commerce order system with:

- **Write Model** - Normalized, domain-focused (PostgreSQL)
- **Read Model** - Denormalized, query-optimized (MongoDB)
- **Event Bus** - Synchronizes models
- **Commands** - Create order, update status, cancel order
- **Queries** - Get order details, list orders, order history

**Architecture:**
```
Command → CommandHandler → Write DB (PostgreSQL)
                              ↓
                          Events
                              ↓
                     EventHandler (Projection)
                              ↓
Query → QueryHandler ← Read DB (MongoDB)
```

---

## Project Structure

```
cqrs-example/
└── src/main/java/com/example/cqrs/
    ├── command/                      # Write side
    │   ├── CreateOrderCommand.java
    │   ├── UpdateOrderStatusCommand.java
    │   ├── OrderCommandHandler.java
    │   ├── Order.java               # Write model
    │   └── OrderRepository.java
    │
    ├── query/                        # Read side
    │   ├── GetOrderQuery.java
    │   ├── ListOrdersQuery.java
    │   ├── OrderQueryHandler.java
    │   ├── OrderView.java           # Read model
    │   └── OrderViewRepository.java
    │
    ├── event/                        # Domain events
    │   ├── OrderCreatedEvent.java
    │   ├── OrderStatusUpdatedEvent.java
    │   └── OrderCancelledEvent.java
    │
    ├── projection/                   # Event handlers
    │   └── OrderProjection.java
    │
    └── api/                          # REST API
        ├── OrderCommandController.java
        └── OrderQueryController.java
```

---

## Write Model (Command Side)

### Commands

```java
package com.example.cqrs.command;

import java.math.BigDecimal;
import java.util.List;

/**
 * Command - Intention to change state
 */
public record CreateOrderCommand(
    String customerId,
    List<OrderItem> items,
    BigDecimal totalAmount
) {
    public record OrderItem(String productId, int quantity, BigDecimal price) {}
}

public record UpdateOrderStatusCommand(
    String orderId,
    OrderStatus newStatus
) {}

public record CancelOrderCommand(String orderId) {}

enum OrderStatus {
    PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
}
```

### Write Model (Domain Entity)

```java
package com.example.cqrs.command;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Write Model - Normalized, domain-focused
 */
@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String customerId;
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "order_id")
    private List<OrderLineItem> lineItems = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    protected Order() {}

    public Order(String customerId, BigDecimal totalAmount,
                 List<OrderLineItem> lineItems) {
        this.customerId = customerId;
        this.totalAmount = totalAmount;
        this.lineItems = lineItems;
        this.status = OrderStatus.PENDING;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Business logic
    public void updateStatus(OrderStatus newStatus) {
        if (this.status == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Cannot update cancelled order");
        }
        this.status = newStatus;
        this.updatedAt = LocalDateTime.now();
    }

    public void cancel() {
        if (this.status == OrderStatus.DELIVERED) {
            throw new IllegalStateException("Cannot cancel delivered order");
        }
        this.status = OrderStatus.CANCELLED;
        this.updatedAt = LocalDateTime.now();
    }

    // Getters
    public String getId() { return id; }
    public String getCustomerId() { return customerId; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public OrderStatus getStatus() { return status; }
    public List<OrderLineItem> getLineItems() { return lineItems; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}

@Entity
@Table(name = "order_line_items")
class OrderLineItem {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String productId;
    private int quantity;
    private BigDecimal price;

    protected OrderLineItem() {}

    public OrderLineItem(String productId, int quantity, BigDecimal price) {
        this.productId = productId;
        this.quantity = quantity;
        this.price = price;
    }

    // Getters
    public String getId() { return id; }
    public String getProductId() { return productId; }
    public int getQuantity() { return quantity; }
    public BigDecimal getPrice() { return price; }
}
```

### Command Handler

```java
package com.example.cqrs.command;

import com.example.cqrs.event.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Command Handler - Executes commands, publishes events
 */
@Service
public class OrderCommandHandler {
    private final OrderRepository orderRepository;
    private final ApplicationEventPublisher eventPublisher;

    public OrderCommandHandler(OrderRepository orderRepository,
                              ApplicationEventPublisher eventPublisher) {
        this.orderRepository = orderRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public String handle(CreateOrderCommand command) {
        // 1. Create domain entity
        List<OrderLineItem> lineItems = command.items().stream()
            .map(item -> new OrderLineItem(
                item.productId(),
                item.quantity(),
                item.price()
            ))
            .collect(Collectors.toList());

        Order order = new Order(
            command.customerId(),
            command.totalAmount(),
            lineItems
        );

        // 2. Save to write database
        Order savedOrder = orderRepository.save(order);

        // 3. Publish domain event
        OrderCreatedEvent event = new OrderCreatedEvent(
            savedOrder.getId(),
            savedOrder.getCustomerId(),
            savedOrder.getTotalAmount(),
            savedOrder.getLineItems().stream()
                .map(item -> new OrderCreatedEvent.LineItem(
                    item.getProductId(),
                    item.getQuantity(),
                    item.getPrice()
                ))
                .collect(Collectors.toList()),
            savedOrder.getCreatedAt()
        );

        eventPublisher.publishEvent(event);

        return savedOrder.getId();
    }

    @Transactional
    public void handle(UpdateOrderStatusCommand command) {
        Order order = orderRepository.findById(command.orderId())
            .orElseThrow(() -> new OrderNotFoundException(command.orderId()));

        OrderStatus oldStatus = order.getStatus();
        order.updateStatus(command.newStatus());

        orderRepository.save(order);

        // Publish event
        OrderStatusUpdatedEvent event = new OrderStatusUpdatedEvent(
            order.getId(),
            oldStatus,
            command.newStatus(),
            order.getUpdatedAt()
        );

        eventPublisher.publishEvent(event);
    }

    @Transactional
    public void handle(CancelOrderCommand command) {
        Order order = orderRepository.findById(command.orderId())
            .orElseThrow(() -> new OrderNotFoundException(command.orderId()));

        order.cancel();
        orderRepository.save(order);

        // Publish event
        OrderCancelledEvent event = new OrderCancelledEvent(
            order.getId(),
            order.getUpdatedAt()
        );

        eventPublisher.publishEvent(event);
    }

    static class OrderNotFoundException extends RuntimeException {
        public OrderNotFoundException(String orderId) {
            super("Order not found: " + orderId);
        }
    }
}
```

### Write Repository

```java
package com.example.cqrs.command;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, String> {
}
```

---

## Read Model (Query Side)

### Queries

```java
package com.example.cqrs.query;

/**
 * Query - Request for data
 */
public record GetOrderQuery(String orderId) {}

public record ListOrdersQuery(String customerId, int page, int size) {}

public record OrderHistoryQuery(String customerId) {}
```

### Read Model (Denormalized View)

```java
package com.example.cqrs.query;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Read Model - Denormalized, query-optimized
 */
@Document(collection = "order_views")
public class OrderView {
    @Id
    private String orderId;
    private String customerId;
    private String customerName;        // Denormalized from Customer service
    private BigDecimal totalAmount;
    private String status;
    private List<LineItemView> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public OrderView() {}

    public OrderView(String orderId, String customerId, String customerName,
                    BigDecimal totalAmount, String status,
                    List<LineItemView> items,
                    LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.orderId = orderId;
        this.customerId = customerId;
        this.customerName = customerName;
        this.totalAmount = totalAmount;
        this.status = status;
        this.items = items;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters
    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<LineItemView> getItems() { return items; }
    public void setItems(List<LineItemView> items) { this.items = items; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public record LineItemView(
        String productId,
        String productName,     // Denormalized from Product service
        int quantity,
        BigDecimal price
    ) {}
}
```

### Query Handler

```java
package com.example.cqrs.query;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Query Handler - Executes queries against read model
 */
@Service
public class OrderQueryHandler {
    private final OrderViewRepository orderViewRepository;

    public OrderQueryHandler(OrderViewRepository orderViewRepository) {
        this.orderViewRepository = orderViewRepository;
    }

    public OrderView handle(GetOrderQuery query) {
        return orderViewRepository.findById(query.orderId())
            .orElseThrow(() -> new OrderNotFoundException(query.orderId()));
    }

    public Page<OrderView> handle(ListOrdersQuery query) {
        PageRequest pageRequest = PageRequest.of(query.page(), query.size());
        return orderViewRepository.findByCustomerId(query.customerId(), pageRequest);
    }

    public List<OrderView> handle(OrderHistoryQuery query) {
        return orderViewRepository.findByCustomerIdOrderByCreatedAtDesc(
            query.customerId()
        );
    }

    static class OrderNotFoundException extends RuntimeException {
        public OrderNotFoundException(String orderId) {
            super("Order not found: " + orderId);
        }
    }
}
```

### Read Repository

```java
package com.example.cqrs.query;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface OrderViewRepository extends MongoRepository<OrderView, String> {
    Page<OrderView> findByCustomerId(String customerId, Pageable pageable);
    List<OrderView> findByCustomerIdOrderByCreatedAtDesc(String customerId);
}
```

---

## Event Synchronization

### Domain Events

```java
package com.example.cqrs.event;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Domain Events - Bridge write and read models
 */
public record OrderCreatedEvent(
    String orderId,
    String customerId,
    BigDecimal totalAmount,
    List<LineItem> items,
    LocalDateTime createdAt
) {
    public record LineItem(String productId, int quantity, BigDecimal price) {}
}

public record OrderStatusUpdatedEvent(
    String orderId,
    OrderStatus oldStatus,
    OrderStatus newStatus,
    LocalDateTime updatedAt
) {}

public record OrderCancelledEvent(
    String orderId,
    LocalDateTime cancelledAt
) {}
```

### Projection (Event Handler)

```java
package com.example.cqrs.projection;

import com.example.cqrs.event.*;
import com.example.cqrs.query.OrderView;
import com.example.cqrs.query.OrderViewRepository;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

/**
 * Projection - Updates read model based on events
 */
@Component
public class OrderProjection {
    private final OrderViewRepository orderViewRepository;

    public OrderProjection(OrderViewRepository orderViewRepository) {
        this.orderViewRepository = orderViewRepository;
    }

    @EventListener
    public void on(OrderCreatedEvent event) {
        // TODO: Fetch customer name from Customer service
        String customerName = fetchCustomerName(event.customerId());

        // TODO: Fetch product names from Product service
        var items = event.items().stream()
            .map(item -> new OrderView.LineItemView(
                item.productId(),
                fetchProductName(item.productId()),  // Denormalize
                item.quantity(),
                item.price()
            ))
            .collect(Collectors.toList());

        OrderView view = new OrderView(
            event.orderId(),
            event.customerId(),
            customerName,
            event.totalAmount(),
            "PENDING",
            items,
            event.createdAt(),
            event.createdAt()
        );

        orderViewRepository.save(view);
    }

    @EventListener
    public void on(OrderStatusUpdatedEvent event) {
        OrderView view = orderViewRepository.findById(event.orderId())
            .orElseThrow();

        view.setStatus(event.newStatus().name());
        view.setUpdatedAt(event.updatedAt());

        orderViewRepository.save(view);
    }

    @EventListener
    public void on(OrderCancelledEvent event) {
        OrderView view = orderViewRepository.findById(event.orderId())
            .orElseThrow();

        view.setStatus("CANCELLED");
        view.setUpdatedAt(event.cancelledAt());

        orderViewRepository.save(view);
    }

    // Helper methods (in real app, call other services)
    private String fetchCustomerName(String customerId) {
        return "John Doe";  // Placeholder
    }

    private String fetchProductName(String productId) {
        return "Product " + productId;  // Placeholder
    }
}
```

---

## Complete Example with Axon Framework

### Axon Aggregate (Write Model)

```java
package com.example.cqrs.axon;

import com.example.cqrs.command.*;
import com.example.cqrs.event.*;
import org.axonframework.commandhandling.CommandHandler;
import org.axonframework.eventsourcing.EventSourcingHandler;
import org.axonframework.modelling.command.AggregateIdentifier;
import org.axonframework.modelling.command.AggregateLifecycle;
import org.axonframework.spring.stereotype.Aggregate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Axon Aggregate - Combines command handling and event sourcing
 */
@Aggregate
public class OrderAggregate {

    @AggregateIdentifier
    private String orderId;
    private String customerId;
    private OrderStatus status;

    protected OrderAggregate() {}

    @CommandHandler
    public OrderAggregate(CreateOrderCommand command) {
        // Validate
        if (command.items().isEmpty()) {
            throw new IllegalArgumentException("Order must have at least one item");
        }

        // Apply event (state will be updated by event sourcing handler)
        AggregateLifecycle.apply(new OrderCreatedEvent(
            java.util.UUID.randomUUID().toString(),
            command.customerId(),
            command.totalAmount(),
            command.items().stream()
                .map(item -> new OrderCreatedEvent.LineItem(
                    item.productId(),
                    item.quantity(),
                    item.price()
                ))
                .toList(),
            LocalDateTime.now()
        ));
    }

    @CommandHandler
    public void handle(UpdateOrderStatusCommand command) {
        if (this.status == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Cannot update cancelled order");
        }

        AggregateLifecycle.apply(new OrderStatusUpdatedEvent(
            this.orderId,
            this.status,
            command.newStatus(),
            LocalDateTime.now()
        ));
    }

    @CommandHandler
    public void handle(CancelOrderCommand command) {
        if (this.status == OrderStatus.DELIVERED) {
            throw new IllegalStateException("Cannot cancel delivered order");
        }

        AggregateLifecycle.apply(new OrderCancelledEvent(
            this.orderId,
            LocalDateTime.now()
        ));
    }

    // Event Sourcing Handlers - Update aggregate state
    @EventSourcingHandler
    public void on(OrderCreatedEvent event) {
        this.orderId = event.orderId();
        this.customerId = event.customerId();
        this.status = OrderStatus.PENDING;
    }

    @EventSourcingHandler
    public void on(OrderStatusUpdatedEvent event) {
        this.status = event.newStatus();
    }

    @EventSourcingHandler
    public void on(OrderCancelledEvent event) {
        this.status = OrderStatus.CANCELLED;
    }
}
```

### Axon Projection

```java
package com.example.cqrs.axon;

import com.example.cqrs.event.*;
import com.example.cqrs.query.*;
import org.axonframework.eventhandling.EventHandler;
import org.axonframework.queryhandling.QueryHandler;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

/**
 * Axon Projection - Handles events and queries
 */
@Component
public class OrderQueryProjection {
    private final OrderViewRepository repository;

    public OrderQueryProjection(OrderViewRepository repository) {
        this.repository = repository;
    }

    @EventHandler
    public void on(OrderCreatedEvent event) {
        var items = event.items().stream()
            .map(item -> new OrderView.LineItemView(
                item.productId(),
                "Product " + item.productId(),
                item.quantity(),
                item.price()
            ))
            .collect(Collectors.toList());

        OrderView view = new OrderView(
            event.orderId(),
            event.customerId(),
            "Customer " + event.customerId(),
            event.totalAmount(),
            "PENDING",
            items,
            event.createdAt(),
            event.createdAt()
        );

        repository.save(view);
    }

    @EventHandler
    public void on(OrderStatusUpdatedEvent event) {
        repository.findById(event.orderId()).ifPresent(view -> {
            view.setStatus(event.newStatus().name());
            view.setUpdatedAt(event.updatedAt());
            repository.save(view);
        });
    }

    @EventHandler
    public void on(OrderCancelledEvent event) {
        repository.findById(event.orderId()).ifPresent(view -> {
            view.setStatus("CANCELLED");
            view.setUpdatedAt(event.cancelledAt());
            repository.save(view);
        });
    }

    @QueryHandler
    public OrderView handle(GetOrderQuery query) {
        return repository.findById(query.orderId())
            .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    @QueryHandler
    public java.util.List<OrderView> handle(OrderHistoryQuery query) {
        return repository.findByCustomerIdOrderByCreatedAtDesc(query.customerId());
    }
}
```

---

## Testing

### Command Handler Test

```java
package com.example.cqrs.command;

import com.example.cqrs.event.OrderCreatedEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderCommandHandlerTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private OrderCommandHandler commandHandler;

    @Test
    void shouldCreateOrderAndPublishEvent() {
        // Given
        CreateOrderCommand command = new CreateOrderCommand(
            "CUST001",
            List.of(new CreateOrderCommand.OrderItem("PROD001", 2, BigDecimal.valueOf(50))),
            BigDecimal.valueOf(100)
        );

        Order savedOrder = new Order("CUST001", BigDecimal.valueOf(100), List.of());
        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);

        // When
        String orderId = commandHandler.handle(command);

        // Then
        assertNotNull(orderId);
        verify(orderRepository).save(any(Order.class));

        ArgumentCaptor<OrderCreatedEvent> eventCaptor =
            ArgumentCaptor.forClass(OrderCreatedEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());

        OrderCreatedEvent event = eventCaptor.getValue();
        assertEquals("CUST001", event.customerId());
        assertEquals(BigDecimal.valueOf(100), event.totalAmount());
    }
}
```

### Query Handler Test

```java
package com.example.cqrs.query;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderQueryHandlerTest {

    @Mock
    private OrderViewRepository repository;

    @InjectMocks
    private OrderQueryHandler queryHandler;

    @Test
    void shouldGetOrderById() {
        // Given
        OrderView view = new OrderView(
            "ORDER001",
            "CUST001",
            "John Doe",
            BigDecimal.valueOf(100),
            "PENDING",
            List.of(),
            LocalDateTime.now(),
            LocalDateTime.now()
        );

        when(repository.findById("ORDER001")).thenReturn(Optional.of(view));

        // When
        OrderView result = queryHandler.handle(new GetOrderQuery("ORDER001"));

        // Then
        assertNotNull(result);
        assertEquals("ORDER001", result.getOrderId());
        assertEquals("CUST001", result.getCustomerId());
    }
}
```

---

## Running the Example

### Dependencies (pom.xml)

```xml
<dependencies>
    <!-- Spring Boot -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-mongodb</artifactId>
    </dependency>

    <!-- PostgreSQL for write model -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
    </dependency>

    <!-- Axon Framework (optional) -->
    <dependency>
        <groupId>org.axonframework</groupId>
        <artifactId>axon-spring-boot-starter</artifactId>
        <version>4.9.0</version>
    </dependency>
</dependencies>
```

### Application Configuration

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/orders_write
    username: postgres
    password: postgres
  jpa:
    hibernate:
      ddl-auto: update
  data:
    mongodb:
      uri: mongodb://localhost:27017/orders_read

server:
  port: 8080
```

### Start Dependencies

```bash
# Start PostgreSQL
docker run -d -p 5432:5432 -e POSTGRES_DB=orders_write \
  -e POSTGRES_PASSWORD=postgres postgres:15

# Start MongoDB
docker run -d -p 27017:27017 mongo:7
```

### Run Application

```bash
mvn spring-boot:run
```

### Test API

```bash
# Create order (Command)
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUST001",
    "items": [
      {"productId": "PROD001", "quantity": 2, "price": 50.00}
    ],
    "totalAmount": 100.00
  }'

# Response: {"orderId": "uuid-123"}

# Get order (Query)
curl http://localhost:8080/api/orders/uuid-123

# Response:
{
  "orderId": "uuid-123",
  "customerId": "CUST001",
  "customerName": "John Doe",
  "totalAmount": 100.00,
  "status": "PENDING",
  "items": [
    {
      "productId": "PROD001",
      "productName": "Product PROD001",
      "quantity": 2,
      "price": 50.00
    }
  ]
}
```

---

## Key Takeaways

1. **Separation of Concerns** - Write model optimized for commands, read model for queries
2. **Independent Scaling** - Scale read and write sides independently
3. **Optimized Queries** - Denormalized read model provides fast queries
4. **Event-Driven Sync** - Events keep models eventually consistent
5. **Flexible Read Models** - Multiple read models for different use cases
6. **Testing** - Command and query sides can be tested independently
7. **Eventual Consistency** - Accept delay between write and read

---

**Related Guides:**
- [Deep Dive: CQRS](../../../3-design/architecture-pattern/deep-dive-cqrs.md)
- [Deep Dive: Event Sourcing](../../../3-design/architecture-pattern/deep-dive-event-sourcing.md)
- [Deep Dive: Event-Driven Architecture](../../../3-design/architecture-pattern/deep-dive-event-driven.md)

*Last Updated: 2025-10-20*
