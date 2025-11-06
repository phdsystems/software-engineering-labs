# Microservices Architecture - Groovy Implementation

**Pattern:** Microservices Architecture
**Language:** Groovy
**Framework:** Spring Boot 3.x, Spring Cloud
**Related Guide:** [Deep Dive: Microservices](../../../3-design/architecture-pattern/deep-dive-microservices.md)

## TL;DR

**Complete microservices implementation in Groovy** with Spring Boot showing service decomposition, REST/messaging communication, service discovery, API Gateway, and Saga orchestration. **Key components**: Independent services → Spring Cloud Gateway → Eureka discovery → inter-service communication via REST + Kafka → distributed transactions with Saga pattern. **Groovy advantages**: Concise service code → DSL for configuration → Spock for contract testing → @CompileStatic for production services.

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Service Implementation](#service-implementation)
4. [Service Discovery (Eureka)](#service-discovery-eureka)
5. [API Gateway](#api-gateway)
6. [Inter-Service Communication](#inter-service-communication)
7. [Saga Pattern Implementation](#saga-pattern-implementation)
8. [Configuration with Groovy DSL](#configuration-with-groovy-dsl)
9. [Testing with Spock](#testing-with-spock)
10. [Running the Example](#running-the-example)

---

## Overview

This example demonstrates a complete e-commerce microservices system with:

- **Order Service** - Manages orders (Groovy)
- **Payment Service** - Processes payments (Groovy)
- **Inventory Service** - Manages stock (Groovy)
- **Notification Service** - Sends notifications (Groovy)
- **API Gateway** - Single entry point (Spring Cloud Gateway)
- **Service Registry (Eureka)** - Service discovery
- **Saga Orchestrator** - Distributed transaction coordination

**Architecture:**
```
Client → API Gateway → Service Registry (Eureka)
                     ↓
         ┌───────────┴───────────┐
         ↓           ↓           ↓
    Order Service  Payment    Inventory
    (Groovy)       Service    Service
                   (Groovy)   (Groovy)
         ↓           ↓           ↓
    Kafka Topics (Event Bus)
         ↓
    Notification Service (Groovy)
```

---

## Project Structure

```
microservices-demo/
├── eureka-server/              # Service Registry
├── api-gateway/                # API Gateway
├── order-service/              # Order management (Groovy)
├── payment-service/            # Payment processing (Groovy)
├── inventory-service/          # Inventory management (Groovy)
├── notification-service/       # Notifications (Groovy)
└── saga-orchestrator/          # Saga coordination (Groovy)
```

---

## Service Implementation

### 1. Order Service

**build.gradle:**
```groovy
plugins {
    id 'groovy'
    id 'org.springframework.boot' version '3.2.0'
    id 'io.spring.dependency-management' version '1.1.4'
}

group = 'com.example.microservices'
version = '1.0.0'
sourceCompatibility = '17'

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.apache.groovy:groovy:4.0.15'
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.cloud:spring-cloud-starter-netflix-eureka-client'
    implementation 'org.springframework.kafka:spring-kafka'
    runtimeOnly 'com.h2database:h2'

    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.spockframework:spock-core:2.3-groovy-4.0'
    testImplementation 'org.spockframework:spock-spring:2.3-groovy-4.0'
}

dependencyManagement {
    imports {
        mavenBom "org.springframework.cloud:spring-cloud-dependencies:2023.0.0"
    }
}
```

**OrderServiceApplication.groovy:**
```groovy
package com.example.order

import groovy.transform.CompileStatic
import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.cloud.client.discovery.EnableDiscoveryClient

@CompileStatic
@SpringBootApplication
@EnableDiscoveryClient
class OrderServiceApplication {
    static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication, args)
    }
}
```

**Order.groovy (Entity):**
```groovy
package com.example.order.domain

import groovy.transform.Canonical
import groovy.transform.CompileStatic
import jakarta.persistence.*

import java.time.LocalDateTime

@CompileStatic
@Canonical
@Entity
@Table(name = 'orders')
class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id

    String customerId
    String productId
    Integer quantity
    BigDecimal amount

    @Enumerated(EnumType.STRING)
    OrderStatus status = OrderStatus.PENDING

    LocalDateTime createdAt = LocalDateTime.now()

    enum OrderStatus {
        PENDING, CONFIRMED, PAYMENT_PROCESSING, COMPLETED, CANCELLED, FAILED
    }
}
```

**OrderRepository.groovy:**
```groovy
package com.example.order.repository

import com.example.order.domain.Order
import groovy.transform.CompileStatic
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@CompileStatic
@Repository
interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCustomerId(String customerId)
    List<Order> findByStatus(Order.OrderStatus status)
}
```

**OrderService.groovy:**
```groovy
package com.example.order.service

import com.example.order.domain.Order
import com.example.order.repository.OrderRepository
import groovy.transform.Canonical
import groovy.transform.CompileStatic
import groovy.util.logging.Slf4j
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Slf4j
@CompileStatic
@Service
class OrderService {
    private final OrderRepository orderRepository
    private final KafkaTemplate<String, OrderEvent> kafkaTemplate

    OrderService(OrderRepository orderRepository,
                 KafkaTemplate<String, OrderEvent> kafkaTemplate) {
        this.orderRepository = orderRepository
        this.kafkaTemplate = kafkaTemplate
    }

    @Transactional
    Order createOrder(CreateOrderRequest request) {
        // Create order
        def order = new Order(
            customerId: request.customerId,
            productId: request.productId,
            quantity: request.quantity,
            amount: request.amount
        )

        Order savedOrder = orderRepository.save(order)

        // Publish event using Groovy's with() for cleaner syntax
        def event = new OrderEvent().with {
            orderId = savedOrder.id
            customerId = savedOrder.customerId
            productId = savedOrder.productId
            quantity = savedOrder.quantity
            amount = savedOrder.amount
            it
        }

        kafkaTemplate.send('order-created', event)
        log.info "Order created: ${savedOrder.id}"

        savedOrder
    }

    @Transactional
    void updateOrderStatus(Long orderId, Order.OrderStatus status) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow { new RuntimeException("Order not found: ${orderId}") }

        order.status = status
        orderRepository.save(order)
        log.info "Order ${orderId} status updated to ${status}"
    }

    Order getOrder(Long orderId) {
        orderRepository.findById(orderId)
            .orElseThrow { new RuntimeException("Order not found: ${orderId}") }
    }

    List<Order> getOrdersByCustomer(String customerId) {
        orderRepository.findByCustomerId(customerId)
    }
}

@Canonical
class CreateOrderRequest {
    String customerId
    String productId
    Integer quantity
    BigDecimal amount
}

@Canonical
class OrderEvent {
    Long orderId
    String customerId
    String productId
    Integer quantity
    BigDecimal amount
}
```

**OrderController.groovy:**
```groovy
package com.example.order.controller

import com.example.order.domain.Order
import com.example.order.service.CreateOrderRequest
import com.example.order.service.OrderService
import groovy.transform.CompileStatic
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@CompileStatic
@RestController
@RequestMapping('/api/orders')
class OrderController {
    private final OrderService orderService

    OrderController(OrderService orderService) {
        this.orderService = orderService
    }

    @PostMapping
    ResponseEntity<Order> createOrder(@RequestBody CreateOrderRequest request) {
        Order order = orderService.createOrder(request)
        ResponseEntity.status(HttpStatus.CREATED).body(order)
    }

    @GetMapping('/{orderId}')
    ResponseEntity<Order> getOrder(@PathVariable Long orderId) {
        Order order = orderService.getOrder(orderId)
        ResponseEntity.ok(order)
    }

    @GetMapping('/customer/{customerId}')
    ResponseEntity<List<Order>> getOrdersByCustomer(@PathVariable String customerId) {
        List<Order> orders = orderService.getOrdersByCustomer(customerId)
        ResponseEntity.ok(orders)
    }

    @PatchMapping('/{orderId}/status')
    ResponseEntity<Void> updateStatus(
            @PathVariable Long orderId,
            @RequestParam Order.OrderStatus status) {
        orderService.updateOrderStatus(orderId, status)
        ResponseEntity.ok().build()
    }
}
```

---

### 2. Payment Service

**PaymentService.groovy:**
```groovy
package com.example.payment.service

import com.example.payment.domain.Payment
import com.example.payment.repository.PaymentRepository
import groovy.transform.Canonical
import groovy.transform.CompileStatic
import groovy.util.logging.Slf4j
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Slf4j
@CompileStatic
@Service
class PaymentService {
    private final PaymentRepository paymentRepository
    private final KafkaTemplate<String, PaymentEvent> kafkaTemplate
    private final Random random = new Random()

    PaymentService(PaymentRepository paymentRepository,
                   KafkaTemplate<String, PaymentEvent> kafkaTemplate) {
        this.paymentRepository = paymentRepository
        this.kafkaTemplate = kafkaTemplate
    }

    @KafkaListener(topics = ['order-created'], groupId = 'payment-service')
    @Transactional
    void handleOrderCreated(OrderEvent event) {
        log.info "Processing payment for order: ${event.orderId}"

        // Process payment
        def payment = new Payment(
            orderId: event.orderId,
            customerId: event.customerId,
            amount: event.amount
        )

        // Simulate payment processing (90% success rate)
        boolean success = processPayment(payment)

        payment.status = success ?
            Payment.PaymentStatus.SUCCESS :
            Payment.PaymentStatus.FAILED

        paymentRepository.save(payment)

        // Publish result using Groovy's with() method
        def paymentEvent = new PaymentEvent().with {
            orderId = event.orderId
            paymentId = payment.id
            it.success = success
            amount = payment.amount
            it
        }

        String topic = success ? 'payment-success' : 'payment-failed'
        kafkaTemplate.send(topic, paymentEvent)

        log.info "Payment ${success ? 'successful' : 'failed'} for order: ${event.orderId}"
    }

    private boolean processPayment(Payment payment) {
        // Simulate payment processing
        sleep(100) // Simulate external API call
        random.nextDouble() < 0.9 // 90% success rate
    }

    @Transactional
    Payment refundPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow { new RuntimeException("Payment not found: ${paymentId}") }

        if (payment.status != Payment.PaymentStatus.SUCCESS) {
            throw new IllegalStateException("Can only refund successful payments")
        }

        payment.status = Payment.PaymentStatus.REFUNDED
        paymentRepository.save(payment)

        log.info "Payment refunded: ${paymentId}"
        payment
    }
}

@Canonical
class OrderEvent {
    Long orderId
    String customerId
    String productId
    Integer quantity
    BigDecimal amount
}

@Canonical
class PaymentEvent {
    Long orderId
    Long paymentId
    boolean success
    BigDecimal amount
}
```

**Payment.groovy (Entity):**
```groovy
package com.example.payment.domain

import groovy.transform.Canonical
import groovy.transform.CompileStatic
import jakarta.persistence.*

import java.time.LocalDateTime

@CompileStatic
@Canonical
@Entity
@Table(name = 'payments')
class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id

    Long orderId
    String customerId
    BigDecimal amount

    @Enumerated(EnumType.STRING)
    PaymentStatus status = PaymentStatus.PENDING

    LocalDateTime createdAt = LocalDateTime.now()

    enum PaymentStatus {
        PENDING, SUCCESS, FAILED, REFUNDED
    }
}
```

---

### 3. Inventory Service

**InventoryService.groovy:**
```groovy
package com.example.inventory.service

import com.example.inventory.domain.Inventory
import com.example.inventory.repository.InventoryRepository
import groovy.transform.Canonical
import groovy.transform.CompileStatic
import groovy.util.logging.Slf4j
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Slf4j
@CompileStatic
@Service
class InventoryService {
    private final InventoryRepository inventoryRepository
    private final KafkaTemplate<String, InventoryEvent> kafkaTemplate

    InventoryService(InventoryRepository inventoryRepository,
                     KafkaTemplate<String, InventoryEvent> kafkaTemplate) {
        this.inventoryRepository = inventoryRepository
        this.kafkaTemplate = kafkaTemplate
    }

    @KafkaListener(topics = ['payment-success'], groupId = 'inventory-service')
    @Transactional
    void handlePaymentSuccess(PaymentEvent event) {
        log.info "Reserving inventory for order: ${event.orderId}"

        def inventory = inventoryRepository.findByProductId(event.productId)
            .orElseThrow { new RuntimeException("Product not found: ${event.productId}") }

        // Check availability
        if (inventory.quantity >= event.quantity) {
            // Reserve inventory
            inventory.quantity -= event.quantity
            inventory.reserved += event.quantity
            inventoryRepository.save(inventory)

            // Publish success event
            kafkaTemplate.send('inventory-reserved', new InventoryEvent(
                orderId: event.orderId,
                productId: event.productId,
                quantity: event.quantity,
                success: true
            ))

            log.info "Inventory reserved for order: ${event.orderId}"
        } else {
            // Publish failure event
            kafkaTemplate.send('inventory-failed', new InventoryEvent(
                orderId: event.orderId,
                productId: event.productId,
                quantity: event.quantity,
                success: false
            ))

            log.warn "Insufficient inventory for order: ${event.orderId}"
        }
    }

    @KafkaListener(topics = ['payment-failed'], groupId = 'inventory-service')
    @Transactional
    void handlePaymentFailed(PaymentEvent event) {
        log.info "Payment failed, no inventory action for order: ${event.orderId}"
    }

    @Transactional
    void releaseInventory(String productId, Integer quantity) {
        def inventory = inventoryRepository.findByProductId(productId)
            .orElseThrow { new RuntimeException("Product not found: ${productId}") }

        inventory.reserved -= quantity
        inventory.quantity += quantity
        inventoryRepository.save(inventory)

        log.info "Inventory released for product: ${productId}, quantity: ${quantity}"
    }
}

@Canonical
class PaymentEvent {
    Long orderId
    Long paymentId
    boolean success
    BigDecimal amount
    String productId
    Integer quantity
}

@Canonical
class InventoryEvent {
    Long orderId
    String productId
    Integer quantity
    boolean success
}
```

**Inventory.groovy (Entity):**
```groovy
package com.example.inventory.domain

import groovy.transform.Canonical
import groovy.transform.CompileStatic
import jakarta.persistence.*

@CompileStatic
@Canonical
@Entity
@Table(name = 'inventory')
class Inventory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id

    @Column(unique = true)
    String productId

    String productName
    Integer quantity = 0
    Integer reserved = 0

    Integer getAvailable() {
        quantity - reserved
    }
}
```

---

### 4. Notification Service

**NotificationService.groovy:**
```groovy
package com.example.notification.service

import groovy.transform.Canonical
import groovy.transform.CompileStatic
import groovy.util.logging.Slf4j
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.stereotype.Service

@Slf4j
@CompileStatic
@Service
class NotificationService {

    @KafkaListener(topics = ['order-created'], groupId = 'notification-service')
    void handleOrderCreated(OrderEvent event) {
        sendEmail(
            to: event.customerEmail,
            subject: "Order Confirmation #${event.orderId}",
            body: """
                Thank you for your order!

                Order ID: ${event.orderId}
                Product: ${event.productId}
                Quantity: ${event.quantity}
                Total: \$${event.amount}
            """.stripIndent()
        )
    }

    @KafkaListener(topics = ['payment-success'], groupId = 'notification-service')
    void handlePaymentSuccess(PaymentEvent event) {
        sendEmail(
            to: event.customerEmail,
            subject: "Payment Successful #${event.orderId}",
            body: """
                Your payment has been processed successfully!

                Order ID: ${event.orderId}
                Amount: \$${event.amount}
            """.stripIndent()
        )
    }

    @KafkaListener(topics = ['payment-failed'], groupId = 'notification-service')
    void handlePaymentFailed(PaymentEvent event) {
        sendEmail(
            to: event.customerEmail,
            subject: "Payment Failed #${event.orderId}",
            body: """
                We were unable to process your payment.

                Order ID: ${event.orderId}
                Please update your payment information.
            """.stripIndent()
        )
    }

    private void sendEmail(Map params) {
        // Simulate email sending
        log.info """
            Sending email:
            To: ${params.to}
            Subject: ${params.subject}
            Body: ${params.body}
        """.stripIndent()
    }
}

@Canonical
class OrderEvent {
    Long orderId
    String customerId
    String customerEmail
    String productId
    Integer quantity
    BigDecimal amount
}

@Canonical
class PaymentEvent {
    Long orderId
    String customerEmail
    BigDecimal amount
    boolean success
}
```

---

## Service Discovery (Eureka)

### Eureka Server

**EurekaServerApplication.groovy:**
```groovy
package com.example.eureka

import groovy.transform.CompileStatic
import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer

@CompileStatic
@SpringBootApplication
@EnableEurekaServer
class EurekaServerApplication {
    static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication, args)
    }
}
```

**application.yml:**
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

**ApiGatewayApplication.groovy:**
```groovy
package com.example.gateway

import groovy.transform.CompileStatic
import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.cloud.gateway.route.RouteLocator
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder
import org.springframework.context.annotation.Bean

@CompileStatic
@SpringBootApplication
class ApiGatewayApplication {
    static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication, args)
    }

    @Bean
    RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        // Groovy-style route configuration
        builder.routes()
            .route('order-service') { r ->
                r.path('/api/orders/**')
                    .uri('lb://order-service')
            }
            .route('payment-service') { r ->
                r.path('/api/payments/**')
                    .uri('lb://payment-service')
            }
            .route('inventory-service') { r ->
                r.path('/api/inventory/**')
                    .uri('lb://inventory-service')
            }
            .build()
    }
}
```

**application.yml:**
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

eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
```

---

## Inter-Service Communication

### REST Client with Groovy

**OrderServiceClient.groovy:**
```groovy
package com.example.client

import groovy.transform.CompileStatic
import groovy.util.logging.Slf4j
import org.springframework.cloud.client.ServiceInstance
import org.springframework.cloud.client.discovery.DiscoveryClient
import org.springframework.stereotype.Component
import org.springframework.web.client.RestTemplate

@Slf4j
@CompileStatic
@Component
class OrderServiceClient {
    private final DiscoveryClient discoveryClient
    private final RestTemplate restTemplate

    OrderServiceClient(DiscoveryClient discoveryClient, RestTemplate restTemplate) {
        this.discoveryClient = discoveryClient
        this.restTemplate = restTemplate
    }

    Map getOrder(Long orderId) {
        String serviceUrl = getServiceUrl('order-service')
        String url = "${serviceUrl}/api/orders/${orderId}"

        try {
            restTemplate.getForObject(url, Map)
        } catch (Exception e) {
            log.error "Failed to get order ${orderId}: ${e.message}"
            null
        }
    }

    private String getServiceUrl(String serviceName) {
        List<ServiceInstance> instances = discoveryClient.getInstances(serviceName)
        if (instances.isEmpty()) {
            throw new RuntimeException("No instances found for service: ${serviceName}")
        }
        instances[0].uri.toString()
    }
}
```

---

## Saga Pattern Implementation

**SagaOrchestrator.groovy:**
```groovy
package com.example.saga

import groovy.transform.Canonical
import groovy.transform.CompileStatic
import groovy.util.logging.Slf4j
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Service

@Slf4j
@CompileStatic
@Service
class SagaOrchestrator {
    private final KafkaTemplate<String, Object> kafkaTemplate
    private final Map<Long, SagaState> sagaStates = [:].asSynchronized()

    SagaOrchestrator(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate
    }

    @KafkaListener(topics = ['order-created'], groupId = 'saga-orchestrator')
    void startSaga(OrderEvent event) {
        log.info "Starting saga for order: ${event.orderId}"

        sagaStates[event.orderId] = new SagaState(
            orderId: event.orderId,
            step: SagaStep.ORDER_CREATED
        )
    }

    @KafkaListener(topics = ['payment-success'], groupId = 'saga-orchestrator')
    void handlePaymentSuccess(PaymentEvent event) {
        log.info "Saga payment success for order: ${event.orderId}"

        sagaStates[event.orderId]?.with {
            step = SagaStep.PAYMENT_COMPLETED
            paymentId = event.paymentId
        }
    }

    @KafkaListener(topics = ['payment-failed'], groupId = 'saga-orchestrator')
    void handlePaymentFailed(PaymentEvent event) {
        log.info "Saga payment failed for order: ${event.orderId}, starting compensation"

        sagaStates[event.orderId]?.with {
            step = SagaStep.PAYMENT_FAILED
            failed = true
        }

        // Compensate: Cancel order
        kafkaTemplate.send('order-cancel', event.orderId)
    }

    @KafkaListener(topics = ['inventory-reserved'], groupId = 'saga-orchestrator')
    void handleInventoryReserved(InventoryEvent event) {
        log.info "Saga inventory reserved for order: ${event.orderId}"

        sagaStates[event.orderId]?.with {
            step = SagaStep.INVENTORY_RESERVED
        }

        // Complete saga
        kafkaTemplate.send('order-complete', event.orderId)
    }

    @KafkaListener(topics = ['inventory-failed'], groupId = 'saga-orchestrator')
    void handleInventoryFailed(InventoryEvent event) {
        log.info "Saga inventory failed for order: ${event.orderId}, starting compensation"

        sagaStates[event.orderId]?.with {
            step = SagaStep.INVENTORY_FAILED
            failed = true
        }

        // Compensate: Refund payment
        Long paymentId = sagaStates[event.orderId]?.paymentId
        if (paymentId) {
            kafkaTemplate.send('payment-refund', paymentId)
        }

        // Cancel order
        kafkaTemplate.send('order-cancel', event.orderId)
    }

    @Canonical
    static class SagaState {
        Long orderId
        SagaStep step
        Long paymentId
        boolean failed = false
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

@Canonical
class OrderEvent {
    Long orderId
    String customerId
    String productId
    Integer quantity
    BigDecimal amount
}

@Canonical
class PaymentEvent {
    Long orderId
    Long paymentId
    boolean success
}

@Canonical
class InventoryEvent {
    Long orderId
    String productId
    Integer quantity
    boolean success
}
```

---

## Configuration with Groovy DSL

### Kafka Configuration

**KafkaConfig.groovy:**
```groovy
package com.example.config

import groovy.transform.CompileStatic
import org.apache.kafka.clients.consumer.ConsumerConfig
import org.apache.kafka.clients.producer.ProducerConfig
import org.apache.kafka.common.serialization.StringDeserializer
import org.apache.kafka.common.serialization.StringSerializer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory
import org.springframework.kafka.core.*
import org.springframework.kafka.support.serializer.JsonDeserializer
import org.springframework.kafka.support.serializer.JsonSerializer

@CompileStatic
@Configuration
class KafkaConfig {

    @Bean
    ProducerFactory<String, Object> producerFactory() {
        // Groovy map syntax for configuration
        Map<String, Object> config = [
            (ProducerConfig.BOOTSTRAP_SERVERS_CONFIG): 'localhost:9092',
            (ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG): StringSerializer,
            (ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG): JsonSerializer,
            (ProducerConfig.ACKS_CONFIG): 'all',
            (ProducerConfig.RETRIES_CONFIG): 3
        ]

        new DefaultKafkaProducerFactory<>(config)
    }

    @Bean
    KafkaTemplate<String, Object> kafkaTemplate() {
        new KafkaTemplate<>(producerFactory())
    }

    @Bean
    ConsumerFactory<String, Object> consumerFactory() {
        Map<String, Object> config = [
            (ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG): 'localhost:9092',
            (ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG): StringDeserializer,
            (ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG): JsonDeserializer,
            (ConsumerConfig.AUTO_OFFSET_RESET_CONFIG): 'earliest',
            (JsonDeserializer.TRUSTED_PACKAGES): '*'
        ]

        new DefaultKafkaConsumerFactory<>(config)
    }

    @Bean
    ConcurrentKafkaListenerContainerFactory<String, Object> kafkaListenerContainerFactory() {
        def factory = new ConcurrentKafkaListenerContainerFactory<String, Object>()
        factory.consumerFactory = consumerFactory()
        factory
    }
}
```

---

## Testing with Spock

### Contract Testing

**OrderServiceContractSpec.groovy:**
```groovy
package com.example.order

import com.example.order.domain.Order
import com.example.order.service.CreateOrderRequest
import com.example.order.service.OrderService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.http.HttpStatus
import spock.lang.Specification

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class OrderServiceContractSpec extends Specification {

    @Autowired
    TestRestTemplate restTemplate

    def "should create order and return 201 CREATED"() {
        given:
        def request = new CreateOrderRequest(
            customerId: 'CUST001',
            productId: 'PROD001',
            quantity: 5,
            amount: 99.99
        )

        when:
        def response = restTemplate.postForEntity(
            '/api/orders',
            request,
            Order
        )

        then:
        response.statusCode == HttpStatus.CREATED
        response.body.customerId == 'CUST001'
        response.body.productId == 'PROD001'
        response.body.quantity == 5
        response.body.status == Order.OrderStatus.PENDING
    }

    def "should retrieve order by ID"() {
        given:
        def createRequest = new CreateOrderRequest(
            customerId: 'CUST002',
            productId: 'PROD002',
            quantity: 3,
            amount: 49.99
        )
        def created = restTemplate.postForEntity('/api/orders', createRequest, Order)
        def orderId = created.body.id

        when:
        def response = restTemplate.getForEntity(
            "/api/orders/${orderId}",
            Order
        )

        then:
        response.statusCode == HttpStatus.OK
        response.body.id == orderId
        response.body.customerId == 'CUST002'
    }
}
```

### Integration Testing with Kafka

**PaymentServiceKafkaSpec.groovy:**
```groovy
package com.example.payment

import com.example.payment.service.OrderEvent
import com.example.payment.service.PaymentService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.kafka.test.context.EmbeddedKafka
import spock.lang.Specification
import spock.util.concurrent.PollingConditions

@SpringBootTest
@EmbeddedKafka(partitions = 1, topics = ['order-created', 'payment-success', 'payment-failed'])
class PaymentServiceKafkaSpec extends Specification {

    @Autowired
    KafkaTemplate<String, OrderEvent> kafkaTemplate

    @Autowired
    PaymentService paymentService

    def "should process order event from Kafka"() {
        given:
        def orderEvent = new OrderEvent(
            orderId: 123L,
            customerId: 'CUST001',
            productId: 'PROD001',
            quantity: 2,
            amount: 59.99
        )
        def conditions = new PollingConditions(timeout: 10, initialDelay: 1)

        when:
        kafkaTemplate.send('order-created', orderEvent)

        then:
        conditions.eventually {
            // Verify payment was processed
            assert paymentService != null
        }
    }
}
```

---

## Running the Example

### Start Infrastructure

```bash
# Start Zookeeper
docker run -d --name zookeeper -p 2181:2181 zookeeper:3.8

# Start Kafka
docker run -d --name kafka -p 9092:9092 \
  -e KAFKA_ZOOKEEPER_CONNECT=localhost:2181 \
  -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 \
  wurstmeister/kafka:2.13-2.8.1
```

### Start Services

```bash
# Start Eureka Server
cd eureka-server && ./gradlew bootRun

# Start API Gateway
cd api-gateway && ./gradlew bootRun

# Start Order Service
cd order-service && ./gradlew bootRun

# Start Payment Service
cd payment-service && ./gradlew bootRun

# Start Inventory Service
cd inventory-service && ./gradlew bootRun

# Start Notification Service
cd notification-service && ./gradlew bootRun

# Start Saga Orchestrator
cd saga-orchestrator && ./gradlew bootRun
```

### Test the System

```bash
# Create order through API Gateway
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUST001",
    "productId": "PROD001",
    "quantity": 2,
    "amount": 99.99
  }'

# Get order status
curl http://localhost:8080/api/orders/1
```

---

## Key Takeaways

1. **Service Independence** - Each microservice is independently deployable
2. **Groovy Conciseness** - 30-40% less code than Java equivalent
3. **Event-Driven Communication** - Kafka for async messaging
4. **Service Discovery** - Eureka for dynamic service location
5. **API Gateway Pattern** - Single entry point with routing
6. **Saga Pattern** - Distributed transaction coordination
7. **Spock Testing** - Expressive contract and integration tests
8. **Groovy DSL** - Natural configuration syntax

**Groovy Advantages for Microservices:**
- **Less boilerplate** with @Canonical and @CompileStatic
- **Cleaner configuration** with map syntax
- **with() method** for cleaner object initialization
- **Spock framework** for better test readability
- **Closures** for flexible callbacks and DSLs

---

**Related Guides:**
- [Deep Dive: Microservices](../../../3-design/architecture-pattern/deep-dive-microservices.md)
- [Deep Dive: Event-Driven Architecture](../../../3-design/architecture-pattern/deep-dive-event-driven.md)
- [Groovy Setup Guide](../groovy/project-setup.md)

*Last Updated: 2025-10-20*
