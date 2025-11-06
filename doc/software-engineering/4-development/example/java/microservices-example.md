# Microservices Architecture - Java Implementation

**Pattern:** Microservices Architecture
**Language:** Java
**Framework:** Spring Boot 3.x, Spring Cloud
**Related Guide:** [Deep Dive: Microservices](../../../3-design/architecture-pattern/deep-dive-microservices.md)

## TL;DR

**Complete microservices implementation** with Spring Boot showing service decomposition, REST/messaging communication, service discovery, API Gateway, and Saga orchestration. **Key components**: Independent services → Spring Cloud Gateway → Eureka discovery → inter-service communication via REST + Kafka → distributed transactions with Saga pattern.

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Service Implementation](#service-implementation)
4. [Service Discovery (Eureka)](#service-discovery-eureka)
5. [API Gateway](#api-gateway)
6. [Inter-Service Communication](#inter-service-communication)
7. [Saga Pattern Implementation](#saga-pattern-implementation)
8. [Configuration](#configuration)
9. [Running the Example](#running-the-example)

---

## Overview

This example demonstrates a complete e-commerce microservices system with:

- **Order Service** - Manages orders
- **Payment Service** - Processes payments
- **Inventory Service** - Manages stock
- **Notification Service** - Sends notifications
- **API Gateway** - Single entry point
- **Service Registry (Eureka)** - Service discovery
- **Saga Orchestrator** - Distributed transaction coordination

**Architecture:**
```
Client → API Gateway → Service Registry (Eureka)
                     ↓
         ┌───────────┴───────────┐
         ↓           ↓           ↓
    Order Service  Payment    Inventory
                   Service    Service
         ↓           ↓           ↓
    Kafka Topics (Event Bus)
         ↓
    Notification Service
```

---

## Project Structure

```
microservices-demo/
├── eureka-server/              # Service Registry
├── api-gateway/                # API Gateway
├── order-service/              # Order management
├── payment-service/            # Payment processing
├── inventory-service/          # Inventory management
├── notification-service/       # Notifications
└── saga-orchestrator/          # Saga coordination
```

---

## Service Implementation

### 1. Order Service

**pom.xml:**
```xml
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
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.kafka</groupId>
        <artifactId>spring-kafka</artifactId>
    </dependency>
    <dependency>
        <groupId>com.h2database</groupId>
        <artifactId>h2</artifactId>
    </dependency>
</dependencies>
```

**OrderServiceApplication.java:**
```java
package com.example.order;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class OrderServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }
}
```

**Order.java (Entity):**
```java
package com.example.order.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String customerId;
    private String productId;
    private Integer quantity;
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    private LocalDateTime createdAt;

    // Constructors
    public Order() {
        this.createdAt = LocalDateTime.now();
        this.status = OrderStatus.PENDING;
    }

    public Order(String customerId, String productId, Integer quantity, BigDecimal amount) {
        this();
        this.customerId = customerId;
        this.productId = productId;
        this.quantity = quantity;
        this.amount = amount;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public enum OrderStatus {
        PENDING, CONFIRMED, PAYMENT_PROCESSING, COMPLETED, CANCELLED, FAILED
    }
}
```

**OrderRepository.java:**
```java
package com.example.order.repository;

import com.example.order.domain.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
}
```

**OrderService.java:**
```java
package com.example.order.service;

import com.example.order.domain.Order;
import com.example.order.repository.OrderRepository;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final KafkaTemplate<String, OrderEvent> kafkaTemplate;

    public OrderService(OrderRepository orderRepository,
                       KafkaTemplate<String, OrderEvent> kafkaTemplate) {
        this.orderRepository = orderRepository;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Transactional
    public Order createOrder(CreateOrderRequest request) {
        // Create order
        Order order = new Order(
            request.customerId(),
            request.productId(),
            request.quantity(),
            request.amount()
        );

        Order savedOrder = orderRepository.save(order);

        // Publish event
        OrderEvent event = new OrderEvent(
            savedOrder.getId(),
            savedOrder.getCustomerId(),
            savedOrder.getProductId(),
            savedOrder.getQuantity(),
            savedOrder.getAmount()
        );

        kafkaTemplate.send("order-created", event);

        return savedOrder;
    }

    @Transactional
    public void updateOrderStatus(Long orderId, Order.OrderStatus status) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));

        order.setStatus(status);
        orderRepository.save(order);
    }

    public Order getOrder(Long orderId) {
        return orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));
    }
}

record CreateOrderRequest(String customerId, String productId,
                         Integer quantity, java.math.BigDecimal amount) {}

record OrderEvent(Long orderId, String customerId, String productId,
                 Integer quantity, java.math.BigDecimal amount) {}
```

**OrderController.java:**
```java
package com.example.order.controller;

import com.example.order.domain.Order;
import com.example.order.service.OrderService;
import com.example.order.service.CreateOrderRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<Order> createOrder(@RequestBody CreateOrderRequest request) {
        Order order = orderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<Order> getOrder(@PathVariable Long orderId) {
        Order order = orderService.getOrder(orderId);
        return ResponseEntity.ok(order);
    }

    @PatchMapping("/{orderId}/status")
    public ResponseEntity<Void> updateStatus(
            @PathVariable Long orderId,
            @RequestParam Order.OrderStatus status) {
        orderService.updateOrderStatus(orderId, status);
        return ResponseEntity.ok().build();
    }
}
```

---

### 2. Payment Service

**PaymentService.java:**
```java
package com.example.payment.service;

import com.example.payment.domain.Payment;
import com.example.payment.repository.PaymentRepository;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Random;

@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final KafkaTemplate<String, PaymentEvent> kafkaTemplate;
    private final Random random = new Random();

    public PaymentService(PaymentRepository paymentRepository,
                         KafkaTemplate<String, PaymentEvent> kafkaTemplate) {
        this.paymentRepository = paymentRepository;
        this.kafkaTemplate = kafkaTemplate;
    }

    @KafkaListener(topics = "order-created", groupId = "payment-service")
    @Transactional
    public void handleOrderCreated(OrderEvent event) {
        // Process payment
        Payment payment = new Payment(
            event.orderId(),
            event.customerId(),
            event.amount()
        );

        // Simulate payment processing
        boolean success = processPayment(payment);

        payment.setStatus(success ? Payment.PaymentStatus.SUCCESS :
                                   Payment.PaymentStatus.FAILED);
        paymentRepository.save(payment);

        // Publish result
        PaymentEvent paymentEvent = new PaymentEvent(
            event.orderId(),
            payment.getId(),
            success,
            payment.getAmount()
        );

        kafkaTemplate.send(success ? "payment-success" : "payment-failed",
                          paymentEvent);
    }

    private boolean processPayment(Payment payment) {
        // Simulate payment processing (90% success rate)
        try {
            Thread.sleep(100); // Simulate external API call
            return random.nextDouble() < 0.9;
        } catch (InterruptedException e) {
            return false;
        }
    }
}

record OrderEvent(Long orderId, String customerId, String productId,
                 Integer quantity, BigDecimal amount) {}

record PaymentEvent(Long orderId, Long paymentId, boolean success,
                   BigDecimal amount) {}
```

**Payment.java (Entity):**
```java
package com.example.payment.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long orderId;
    private String customerId;
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    private LocalDateTime createdAt;

    public Payment() {
        this.createdAt = LocalDateTime.now();
        this.status = PaymentStatus.PENDING;
    }

    public Payment(Long orderId, String customerId, BigDecimal amount) {
        this();
        this.orderId = orderId;
        this.customerId = customerId;
        this.amount = amount;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public PaymentStatus getStatus() { return status; }
    public void setStatus(PaymentStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public enum PaymentStatus {
        PENDING, SUCCESS, FAILED, REFUNDED
    }
}
```

---

### 3. Inventory Service

**InventoryService.java:**
```java
package com.example.inventory.service;

import com.example.inventory.domain.Inventory;
import com.example.inventory.repository.InventoryRepository;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryService {
    private final InventoryRepository inventoryRepository;
    private final KafkaTemplate<String, InventoryEvent> kafkaTemplate;

    public InventoryService(InventoryRepository inventoryRepository,
                           KafkaTemplate<String, InventoryEvent> kafkaTemplate) {
        this.inventoryRepository = inventoryRepository;
        this.kafkaTemplate = kafkaTemplate;
    }

    @KafkaListener(topics = "payment-success", groupId = "inventory-service")
    @Transactional
    public void handlePaymentSuccess(PaymentEvent event) {
        String productId = event.productId();
        Integer quantity = event.quantity();

        // Check and reserve inventory
        Inventory inventory = inventoryRepository.findByProductId(productId)
            .orElseThrow(() -> new RuntimeException("Product not found"));

        boolean reserved = false;
        if (inventory.getAvailableQuantity() >= quantity) {
            inventory.setAvailableQuantity(
                inventory.getAvailableQuantity() - quantity
            );
            inventory.setReservedQuantity(
                inventory.getReservedQuantity() + quantity
            );
            inventoryRepository.save(inventory);
            reserved = true;
        }

        // Publish result
        InventoryEvent inventoryEvent = new InventoryEvent(
            event.orderId(),
            productId,
            quantity,
            reserved
        );

        kafkaTemplate.send(reserved ? "inventory-reserved" : "inventory-failed",
                          inventoryEvent);
    }

    @KafkaListener(topics = "payment-failed", groupId = "inventory-service")
    @Transactional
    public void handlePaymentFailed(PaymentEvent event) {
        // No inventory action needed if payment fails
        InventoryEvent inventoryEvent = new InventoryEvent(
            event.orderId(),
            event.productId(),
            event.quantity(),
            false
        );

        kafkaTemplate.send("inventory-failed", inventoryEvent);
    }
}

record PaymentEvent(Long orderId, Long paymentId, boolean success,
                   String productId, Integer quantity) {}

record InventoryEvent(Long orderId, String productId,
                     Integer quantity, boolean reserved) {}
```

**Inventory.java (Entity):**
```java
package com.example.inventory.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "inventory")
public class Inventory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String productId;

    private String productName;
    private Integer availableQuantity;
    private Integer reservedQuantity;

    public Inventory() {}

    public Inventory(String productId, String productName, Integer availableQuantity) {
        this.productId = productId;
        this.productName = productName;
        this.availableQuantity = availableQuantity;
        this.reservedQuantity = 0;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public Integer getAvailableQuantity() { return availableQuantity; }
    public void setAvailableQuantity(Integer availableQuantity) {
        this.availableQuantity = availableQuantity;
    }

    public Integer getReservedQuantity() { return reservedQuantity; }
    public void setReservedQuantity(Integer reservedQuantity) {
        this.reservedQuantity = reservedQuantity;
    }
}
```

---

## Service Discovery (Eureka)

**EurekaServerApplication.java:**
```java
package com.example.eureka;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}
```

**application.yml (Eureka Server):**
```yaml
server:
  port: 8761

eureka:
  client:
    register-with-eureka: false
    fetch-registry: false
  server:
    enable-self-preservation: false
```

---

## API Gateway

**ApiGatewayApplication.java:**
```java
package com.example.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class ApiGatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
```

**application.yml (API Gateway):**
```yaml
server:
  port: 8080

spring:
  application:
    name: api-gateway
  cloud:
    gateway:
      discovery:
        locator:
          enabled: true
          lower-case-service-id: true
      routes:
        - id: order-service
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**
        - id: payment-service
          uri: lb://payment-service
          predicates:
            - Path=/api/payments/**
        - id: inventory-service
          uri: lb://inventory-service
          predicates:
            - Path=/api/inventory/**

eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
```

---

## Inter-Service Communication

### REST Communication with Feign Client

**PaymentServiceClient.java:**
```java
package com.example.order.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "payment-service")
public interface PaymentServiceClient {

    @PostMapping("/api/payments/process")
    PaymentResponse processPayment(@RequestBody PaymentRequest request);
}

record PaymentRequest(Long orderId, String customerId,
                     java.math.BigDecimal amount) {}

record PaymentResponse(Long paymentId, boolean success, String message) {}
```

### Message-Based Communication with Kafka

**KafkaProducerConfig.java:**
```java
package com.example.order.config;

import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaProducerConfig {

    @Bean
    public ProducerFactory<String, Object> producerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        return new DefaultKafkaProducerFactory<>(config);
    }

    @Bean
    public KafkaTemplate<String, Object> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }
}
```

**KafkaConsumerConfig.java:**
```java
package com.example.payment.config;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.support.serializer.JsonDeserializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaConsumerConfig {

    @Bean
    public ConsumerFactory<String, Object> consumerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        config.put(JsonDeserializer.TRUSTED_PACKAGES, "*");
        return new DefaultKafkaConsumerFactory<>(config);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, Object> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, Object> factory =
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        return factory;
    }
}
```

---

## Saga Pattern Implementation

### Saga Orchestrator

**SagaOrchestrator.java:**
```java
package com.example.saga;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SagaOrchestrator {
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final Map<Long, SagaState> sagaStates = new ConcurrentHashMap<>();

    public SagaOrchestrator(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    @KafkaListener(topics = "order-created", groupId = "saga-orchestrator")
    public void handleOrderCreated(OrderEvent event) {
        SagaState state = new SagaState(event.orderId());
        state.setStep(SagaStep.ORDER_CREATED);
        sagaStates.put(event.orderId(), state);

        // Start saga: trigger payment
        System.out.println("Saga started for order: " + event.orderId());
    }

    @KafkaListener(topics = "payment-success", groupId = "saga-orchestrator")
    public void handlePaymentSuccess(PaymentEvent event) {
        SagaState state = sagaStates.get(event.orderId());
        if (state != null) {
            state.setStep(SagaStep.PAYMENT_COMPLETED);
            System.out.println("Payment succeeded for order: " + event.orderId());
            // Inventory reservation happens automatically via event
        }
    }

    @KafkaListener(topics = "payment-failed", groupId = "saga-orchestrator")
    public void handlePaymentFailed(PaymentEvent event) {
        SagaState state = sagaStates.get(event.orderId());
        if (state != null) {
            state.setStep(SagaStep.PAYMENT_FAILED);
            compensateOrder(event.orderId());
        }
    }

    @KafkaListener(topics = "inventory-reserved", groupId = "saga-orchestrator")
    public void handleInventoryReserved(InventoryEvent event) {
        SagaState state = sagaStates.get(event.orderId());
        if (state != null) {
            state.setStep(SagaStep.INVENTORY_RESERVED);
            completeOrder(event.orderId());
        }
    }

    @KafkaListener(topics = "inventory-failed", groupId = "saga-orchestrator")
    public void handleInventoryFailed(InventoryEvent event) {
        SagaState state = sagaStates.get(event.orderId());
        if (state != null) {
            state.setStep(SagaStep.INVENTORY_FAILED);
            compensatePayment(event.orderId());
            compensateOrder(event.orderId());
        }
    }

    private void compensateOrder(Long orderId) {
        System.out.println("Compensating order: " + orderId);
        kafkaTemplate.send("order-cancel", new CancelOrderEvent(orderId));
        sagaStates.remove(orderId);
    }

    private void compensatePayment(Long orderId) {
        System.out.println("Compensating payment for order: " + orderId);
        kafkaTemplate.send("payment-refund", new RefundPaymentEvent(orderId));
    }

    private void completeOrder(Long orderId) {
        System.out.println("Completing order: " + orderId);
        kafkaTemplate.send("order-complete", new CompleteOrderEvent(orderId));
        sagaStates.remove(orderId);
    }

    static class SagaState {
        private final Long orderId;
        private SagaStep step;

        public SagaState(Long orderId) {
            this.orderId = orderId;
        }

        public Long getOrderId() { return orderId; }
        public SagaStep getStep() { return step; }
        public void setStep(SagaStep step) { this.step = step; }
    }

    enum SagaStep {
        ORDER_CREATED,
        PAYMENT_COMPLETED,
        PAYMENT_FAILED,
        INVENTORY_RESERVED,
        INVENTORY_FAILED,
        COMPLETED,
        COMPENSATED
    }
}

record OrderEvent(Long orderId, String customerId, String productId,
                 Integer quantity, java.math.BigDecimal amount) {}

record PaymentEvent(Long orderId, Long paymentId, boolean success) {}

record InventoryEvent(Long orderId, String productId,
                     Integer quantity, boolean reserved) {}

record CancelOrderEvent(Long orderId) {}

record RefundPaymentEvent(Long orderId) {}

record CompleteOrderEvent(Long orderId) {}
```

---

## Configuration

### Order Service Configuration

**application.yml:**
```yaml
server:
  port: 8081

spring:
  application:
    name: order-service
  datasource:
    url: jdbc:h2:mem:orderdb
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true
  kafka:
    bootstrap-servers: localhost:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer

eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
  instance:
    prefer-ip-address: true
```

---

## Running the Example

### Prerequisites

```bash
# 1. Start Kafka and Zookeeper
docker-compose up -d

# docker-compose.yml
version: '3'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:latest
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
```

### Start Services

```bash
# 1. Start Eureka Server
cd eureka-server
mvn spring-boot:run

# 2. Start API Gateway
cd api-gateway
mvn spring-boot:run

# 3. Start Microservices
cd order-service && mvn spring-boot:run &
cd payment-service && mvn spring-boot:run &
cd inventory-service && mvn spring-boot:run &
cd saga-orchestrator && mvn spring-boot:run &
```

### Test the System

```bash
# Create an order
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUST001",
    "productId": "PROD001",
    "quantity": 2,
    "amount": 99.99
  }'

# Response
{
  "id": 1,
  "customerId": "CUST001",
  "productId": "PROD001",
  "quantity": 2,
  "amount": 99.99,
  "status": "PENDING",
  "createdAt": "2025-10-20T10:30:00"
}

# Check order status
curl http://localhost:8080/api/orders/1

# Saga Flow (in logs):
# 1. Order created
# 2. Payment processing...
# 3. Payment succeeded
# 4. Inventory reserved
# 5. Order completed
```

---

## Key Takeaways

1. **Service Independence** - Each service has its own database and can be deployed independently
2. **Service Discovery** - Eureka enables dynamic service registration and discovery
3. **API Gateway** - Single entry point for clients, handles routing and load balancing
4. **Event-Driven Communication** - Kafka enables loose coupling between services
5. **Saga Pattern** - Manages distributed transactions with compensation logic
6. **REST + Messaging** - Synchronous REST for queries, asynchronous messaging for events
7. **Resilience** - Services continue operating even if other services fail

---

**Related Guides:**
- [Deep Dive: Microservices Architecture](../../../3-design/architecture-pattern/deep-dive-microservices.md)
- [Deep Dive: Event-Driven Architecture](../../../3-design/architecture-pattern/deep-dive-event-driven.md)
- [Deep Dive: CQRS](../../../3-design/architecture-pattern/deep-dive-cqrs.md)

*Last Updated: 2025-10-20*
