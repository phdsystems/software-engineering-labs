# Microservices Architecture - Kotlin Implementation

**Pattern:** Microservices Architecture
**Language:** Kotlin
**Framework:** Spring Boot 3.x, Spring Cloud
**Related Guide:** [Deep Dive: Microservices](../../../3-design/architecture-pattern/deep-dive-microservices.md)

## TL;DR

**Complete microservices implementation** with Spring Boot and Kotlin showing service decomposition, REST/messaging communication, service discovery, API Gateway, and Saga orchestration. **Key components**: Independent services → Spring Cloud Gateway → Eureka discovery → inter-service communication via REST + Kafka → distributed transactions with Saga pattern. **Kotlin advantages**: Data classes for DTOs → coroutines for async operations → null safety → extension functions → concise syntax.

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
9. [Testing with MockK](#testing-with-mockk)
10. [Running the Example](#running-the-example)

---

## Overview

This example demonstrates a complete e-commerce microservices system with:

- **Order Service** - Manages orders (Kotlin coroutines for async)
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

**build.gradle.kts:**
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
    implementation("org.springframework.cloud:spring-cloud-starter-netflix-eureka-client")
    implementation("org.springframework.kafka:spring-kafka")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-reactor:1.7.3")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("com.h2database:h2")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.mockk:mockk:1.13.8")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
}

dependencyManagement {
    imports {
        mavenBom("org.springframework.cloud:spring-cloud-dependencies:2023.0.0")
    }
}
```

**OrderServiceApplication.kt:**
```kotlin
package com.example.order

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.cloud.client.discovery.EnableDiscoveryClient

@SpringBootApplication
@EnableDiscoveryClient
class OrderServiceApplication

fun main(args: Array<String>) {
    runApplication<OrderServiceApplication>(*args)
}
```

**Order.kt (Entity with Data Class):**
```kotlin
package com.example.order.domain

import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDateTime

@Entity
@Table(name = "orders")
data class Order(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false)
    val customerId: String,

    @Column(nullable = false)
    val productId: String,

    @Column(nullable = false)
    val quantity: Int,

    @Column(nullable = false)
    val amount: BigDecimal,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: OrderStatus = OrderStatus.PENDING,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    enum class OrderStatus {
        PENDING, CONFIRMED, PAYMENT_PROCESSING, COMPLETED, CANCELLED, FAILED
    }
}
```

**OrderRepository.kt:**
```kotlin
package com.example.order.repository

import com.example.order.domain.Order
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface OrderRepository : JpaRepository<Order, Long>
```

**OrderService.kt (with Coroutines):**
```kotlin
package com.example.order.service

import com.example.order.domain.Order
import com.example.order.repository.OrderRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal

// DTOs as data classes
data class CreateOrderRequest(
    val customerId: String,
    val productId: String,
    val quantity: Int,
    val amount: BigDecimal
)

data class OrderEvent(
    val orderId: Long,
    val customerId: String,
    val productId: String,
    val quantity: Int,
    val amount: BigDecimal
)

@Service
class OrderService(
    private val orderRepository: OrderRepository,
    private val kafkaTemplate: KafkaTemplate<String, OrderEvent>
) {
    @Transactional
    suspend fun createOrder(request: CreateOrderRequest): Order = withContext(Dispatchers.IO) {
        // Create order
        val order = Order(
            customerId = request.customerId,
            productId = request.productId,
            quantity = request.quantity,
            amount = request.amount
        )

        val savedOrder = orderRepository.save(order)

        // Publish event asynchronously
        val event = OrderEvent(
            orderId = savedOrder.id!!,
            customerId = savedOrder.customerId,
            productId = savedOrder.productId,
            quantity = savedOrder.quantity,
            amount = savedOrder.amount
        )

        kafkaTemplate.send("order-created", event)

        savedOrder
    }

    @Transactional
    fun updateOrderStatus(orderId: Long, status: Order.OrderStatus) {
        val order = orderRepository.findById(orderId)
            .orElseThrow { IllegalArgumentException("Order not found: $orderId") }

        order.status = status
        orderRepository.save(order)
    }

    fun getOrder(orderId: Long): Order {
        return orderRepository.findById(orderId)
            .orElseThrow { IllegalArgumentException("Order not found: $orderId") }
    }
}
```

**OrderController.kt (with Extension Functions):**
```kotlin
package com.example.order.controller

import com.example.order.domain.Order
import com.example.order.service.CreateOrderRequest
import com.example.order.service.OrderService
import kotlinx.coroutines.runBlocking
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/orders")
class OrderController(private val orderService: OrderService) {

    @PostMapping
    fun createOrder(@RequestBody request: CreateOrderRequest): ResponseEntity<Order> = runBlocking {
        val order = orderService.createOrder(request)
        ResponseEntity.status(HttpStatus.CREATED).body(order)
    }

    @GetMapping("/{orderId}")
    fun getOrder(@PathVariable orderId: Long): ResponseEntity<Order> {
        val order = orderService.getOrder(orderId)
        return ResponseEntity.ok(order)
    }

    @PatchMapping("/{orderId}/status")
    fun updateStatus(
        @PathVariable orderId: Long,
        @RequestParam status: Order.OrderStatus
    ): ResponseEntity<Unit> {
        orderService.updateOrderStatus(orderId, status)
        return ResponseEntity.ok().build()
    }
}

// Extension function for ResponseEntity
fun <T> T.toCreatedResponse(): ResponseEntity<T> = ResponseEntity.status(HttpStatus.CREATED).body(this)
fun <T> T.toOkResponse(): ResponseEntity<T> = ResponseEntity.ok(this)
```

---

### 2. Payment Service

**PaymentService.kt (with Sealed Classes for Result):**
```kotlin
package com.example.payment.service

import com.example.payment.domain.Payment
import com.example.payment.repository.PaymentRepository
import kotlinx.coroutines.delay
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import kotlin.random.Random

data class OrderEvent(
    val orderId: Long,
    val customerId: String,
    val productId: String,
    val quantity: Int,
    val amount: BigDecimal
)

data class PaymentEvent(
    val orderId: Long,
    val paymentId: Long,
    val success: Boolean,
    val amount: BigDecimal
)

// Sealed class for payment result
sealed class PaymentResult {
    data class Success(val payment: Payment) : PaymentResult()
    data class Failure(val reason: String) : PaymentResult()
}

@Service
class PaymentService(
    private val paymentRepository: PaymentRepository,
    private val kafkaTemplate: KafkaTemplate<String, PaymentEvent>
) {
    @KafkaListener(topics = ["order-created"], groupId = "payment-service")
    @Transactional
    fun handleOrderCreated(event: OrderEvent) {
        // Process payment
        val payment = Payment(
            orderId = event.orderId,
            customerId = event.customerId,
            amount = event.amount
        )

        // Simulate payment processing
        val result = processPayment(payment)

        payment.status = when (result) {
            is PaymentResult.Success -> Payment.PaymentStatus.SUCCESS
            is PaymentResult.Failure -> Payment.PaymentStatus.FAILED
        }

        val savedPayment = paymentRepository.save(payment)

        // Publish result
        val paymentEvent = PaymentEvent(
            orderId = event.orderId,
            paymentId = savedPayment.id!!,
            success = result is PaymentResult.Success,
            amount = savedPayment.amount
        )

        val topic = if (result is PaymentResult.Success) "payment-success" else "payment-failed"
        kafkaTemplate.send(topic, paymentEvent)
    }

    private suspend fun processPayment(payment: Payment): PaymentResult {
        return try {
            delay(100) // Simulate external API call
            // Simulate 90% success rate
            if (Random.nextDouble() < 0.9) {
                PaymentResult.Success(payment)
            } else {
                PaymentResult.Failure("Insufficient funds")
            }
        } catch (e: Exception) {
            PaymentResult.Failure(e.message ?: "Unknown error")
        }
    }
}
```

**Payment.kt (Entity):**
```kotlin
package com.example.payment.domain

import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDateTime

@Entity
@Table(name = "payments")
data class Payment(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false)
    val orderId: Long,

    @Column(nullable = false)
    val customerId: String,

    @Column(nullable = false)
    val amount: BigDecimal,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: PaymentStatus = PaymentStatus.PENDING,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    enum class PaymentStatus {
        PENDING, SUCCESS, FAILED, REFUNDED
    }
}
```

---

### 3. Inventory Service

**InventoryService.kt (with Null Safety):**
```kotlin
package com.example.inventory.service

import com.example.inventory.domain.Inventory
import com.example.inventory.repository.InventoryRepository
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal

data class PaymentEvent(
    val orderId: Long,
    val paymentId: Long,
    val success: Boolean,
    val productId: String?,
    val quantity: Int?
)

data class InventoryEvent(
    val orderId: Long,
    val productId: String,
    val quantity: Int,
    val reserved: Boolean
)

@Service
class InventoryService(
    private val inventoryRepository: InventoryRepository,
    private val kafkaTemplate: KafkaTemplate<String, InventoryEvent>
) {
    @KafkaListener(topics = ["payment-success"], groupId = "inventory-service")
    @Transactional
    fun handlePaymentSuccess(event: PaymentEvent) {
        val productId = event.productId ?: run {
            publishInventoryFailed(event.orderId, "UNKNOWN", 0)
            return
        }

        val quantity = event.quantity ?: run {
            publishInventoryFailed(event.orderId, productId, 0)
            return
        }

        // Check and reserve inventory
        val inventory = inventoryRepository.findByProductId(productId)

        if (inventory == null) {
            publishInventoryFailed(event.orderId, productId, quantity)
            return
        }

        val reserved = if (inventory.availableQuantity >= quantity) {
            inventory.availableQuantity -= quantity
            inventory.reservedQuantity += quantity
            inventoryRepository.save(inventory)
            true
        } else {
            false
        }

        // Publish result
        val inventoryEvent = InventoryEvent(
            orderId = event.orderId,
            productId = productId,
            quantity = quantity,
            reserved = reserved
        )

        val topic = if (reserved) "inventory-reserved" else "inventory-failed"
        kafkaTemplate.send(topic, inventoryEvent)
    }

    @KafkaListener(topics = ["payment-failed"], groupId = "inventory-service")
    fun handlePaymentFailed(event: PaymentEvent) {
        val productId = event.productId ?: "UNKNOWN"
        val quantity = event.quantity ?: 0
        publishInventoryFailed(event.orderId, productId, quantity)
    }

    private fun publishInventoryFailed(orderId: Long, productId: String, quantity: Int) {
        val inventoryEvent = InventoryEvent(
            orderId = orderId,
            productId = productId,
            quantity = quantity,
            reserved = false
        )
        kafkaTemplate.send("inventory-failed", inventoryEvent)
    }
}
```

**Inventory.kt (Entity):**
```kotlin
package com.example.inventory.domain

import jakarta.persistence.*

@Entity
@Table(name = "inventory")
data class Inventory(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(unique = true, nullable = false)
    val productId: String,

    @Column(nullable = false)
    val productName: String,

    @Column(nullable = false)
    var availableQuantity: Int,

    @Column(nullable = false)
    var reservedQuantity: Int = 0
)
```

---

## Service Discovery (Eureka)

**EurekaServerApplication.kt:**
```kotlin
package com.example.eureka

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer

@SpringBootApplication
@EnableEurekaServer
class EurekaServerApplication

fun main(args: Array<String>) {
    runApplication<EurekaServerApplication>(*args)
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

**ApiGatewayApplication.kt:**
```kotlin
package com.example.gateway

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.cloud.client.discovery.EnableDiscoveryClient

@SpringBootApplication
@EnableDiscoveryClient
class ApiGatewayApplication

fun main(args: Array<String>) {
    runApplication<ApiGatewayApplication>(*args)
}
```

**application.yml (API Gateway with Kotlin DSL):**
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

**PaymentServiceClient.kt:**
```kotlin
package com.example.order.client

import org.springframework.cloud.openfeign.FeignClient
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import java.math.BigDecimal

@FeignClient(name = "payment-service")
interface PaymentServiceClient {

    @PostMapping("/api/payments/process")
    fun processPayment(@RequestBody request: PaymentRequest): PaymentResponse
}

data class PaymentRequest(
    val orderId: Long,
    val customerId: String,
    val amount: BigDecimal
)

data class PaymentResponse(
    val paymentId: Long,
    val success: Boolean,
    val message: String
)
```

### Message-Based Communication with Kafka

**KafkaProducerConfig.kt (Kotlin DSL):**
```kotlin
package com.example.order.config

import org.apache.kafka.clients.producer.ProducerConfig
import org.apache.kafka.common.serialization.StringSerializer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.kafka.core.DefaultKafkaProducerFactory
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.kafka.core.ProducerFactory
import org.springframework.kafka.support.serializer.JsonSerializer

@Configuration
class KafkaProducerConfig {

    @Bean
    fun producerFactory(): ProducerFactory<String, Any> {
        val config = mapOf(
            ProducerConfig.BOOTSTRAP_SERVERS_CONFIG to "localhost:9092",
            ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG to StringSerializer::class.java,
            ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG to JsonSerializer::class.java
        )
        return DefaultKafkaProducerFactory(config)
    }

    @Bean
    fun kafkaTemplate(): KafkaTemplate<String, Any> = KafkaTemplate(producerFactory())
}
```

**KafkaConsumerConfig.kt:**
```kotlin
package com.example.payment.config

import org.apache.kafka.clients.consumer.ConsumerConfig
import org.apache.kafka.common.serialization.StringDeserializer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.kafka.annotation.EnableKafka
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory
import org.springframework.kafka.core.ConsumerFactory
import org.springframework.kafka.core.DefaultKafkaConsumerFactory
import org.springframework.kafka.support.serializer.JsonDeserializer

@Configuration
@EnableKafka
class KafkaConsumerConfig {

    @Bean
    fun consumerFactory(): ConsumerFactory<String, Any> {
        val config = mapOf(
            ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG to "localhost:9092",
            ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG to StringDeserializer::class.java,
            ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG to JsonDeserializer::class.java,
            JsonDeserializer.TRUSTED_PACKAGES to "*"
        )

        return DefaultKafkaConsumerFactory(
            config,
            StringDeserializer(),
            JsonDeserializer(Any::class.java).apply {
                addTrustedPackages("*")
            }
        )
    }

    @Bean
    fun kafkaListenerContainerFactory(): ConcurrentKafkaListenerContainerFactory<String, Any> {
        return ConcurrentKafkaListenerContainerFactory<String, Any>().apply {
            consumerFactory = consumerFactory()
            setConcurrency(3)
        }
    }
}
```

---

## Saga Pattern Implementation

### Saga Orchestrator

**SagaOrchestrator.kt (with when expression):**
```kotlin
package com.example.saga

import org.springframework.kafka.annotation.KafkaListener
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Service
import java.math.BigDecimal
import java.util.concurrent.ConcurrentHashMap

data class OrderEvent(
    val orderId: Long,
    val customerId: String,
    val productId: String,
    val quantity: Int,
    val amount: BigDecimal
)

data class PaymentEvent(
    val orderId: Long,
    val paymentId: Long,
    val success: Boolean
)

data class InventoryEvent(
    val orderId: Long,
    val productId: String,
    val quantity: Int,
    val reserved: Boolean
)

data class CancelOrderEvent(val orderId: Long)
data class RefundPaymentEvent(val orderId: Long)
data class CompleteOrderEvent(val orderId: Long)

enum class SagaStep {
    ORDER_CREATED,
    PAYMENT_COMPLETED,
    PAYMENT_FAILED,
    INVENTORY_RESERVED,
    INVENTORY_FAILED,
    COMPLETED,
    COMPENSATED
}

data class SagaState(
    val orderId: Long,
    var step: SagaStep
)

@Service
class SagaOrchestrator(
    private val kafkaTemplate: KafkaTemplate<String, Any>
) {
    private val sagaStates = ConcurrentHashMap<Long, SagaState>()

    @KafkaListener(topics = ["order-created"], groupId = "saga-orchestrator")
    fun handleOrderCreated(event: OrderEvent) {
        val state = SagaState(event.orderId, SagaStep.ORDER_CREATED)
        sagaStates[event.orderId] = state
        println("Saga started for order: ${event.orderId}")
    }

    @KafkaListener(topics = ["payment-success"], groupId = "saga-orchestrator")
    fun handlePaymentSuccess(event: PaymentEvent) {
        sagaStates[event.orderId]?.let { state ->
            state.step = SagaStep.PAYMENT_COMPLETED
            println("Payment succeeded for order: ${event.orderId}")
        }
    }

    @KafkaListener(topics = ["payment-failed"], groupId = "saga-orchestrator")
    fun handlePaymentFailed(event: PaymentEvent) {
        sagaStates[event.orderId]?.let { state ->
            state.step = SagaStep.PAYMENT_FAILED
            compensateOrder(event.orderId)
        }
    }

    @KafkaListener(topics = ["inventory-reserved"], groupId = "saga-orchestrator")
    fun handleInventoryReserved(event: InventoryEvent) {
        sagaStates[event.orderId]?.let { state ->
            state.step = SagaStep.INVENTORY_RESERVED
            completeOrder(event.orderId)
        }
    }

    @KafkaListener(topics = ["inventory-failed"], groupId = "saga-orchestrator")
    fun handleInventoryFailed(event: InventoryEvent) {
        sagaStates[event.orderId]?.let { state ->
            state.step = SagaStep.INVENTORY_FAILED
            compensatePayment(event.orderId)
            compensateOrder(event.orderId)
        }
    }

    private fun compensateOrder(orderId: Long) {
        println("Compensating order: $orderId")
        kafkaTemplate.send("order-cancel", CancelOrderEvent(orderId))
        sagaStates.remove(orderId)
    }

    private fun compensatePayment(orderId: Long) {
        println("Compensating payment for order: $orderId")
        kafkaTemplate.send("payment-refund", RefundPaymentEvent(orderId))
    }

    private fun completeOrder(orderId: Long) {
        println("Completing order: $orderId")
        kafkaTemplate.send("order-complete", CompleteOrderEvent(orderId))
        sagaStates.remove(orderId)
    }
}
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

## Testing with MockK

### Service Test with Coroutines

**OrderServiceTest.kt:**
```kotlin
package com.example.order.service

import com.example.order.domain.Order
import com.example.order.repository.OrderRepository
import io.mockk.*
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import org.springframework.kafka.core.KafkaTemplate
import java.math.BigDecimal
import java.util.*

@OptIn(ExperimentalCoroutinesApi::class)
class OrderServiceTest {

    private val orderRepository = mockk<OrderRepository>()
    private val kafkaTemplate = mockk<KafkaTemplate<String, OrderEvent>>()
    private val orderService = OrderService(orderRepository, kafkaTemplate)

    @Test
    fun `should create order and publish event`() = runTest {
        // Given
        val request = CreateOrderRequest(
            customerId = "CUST001",
            productId = "PROD001",
            quantity = 2,
            amount = BigDecimal("99.99")
        )

        val savedOrder = Order(
            id = 1L,
            customerId = request.customerId,
            productId = request.productId,
            quantity = request.quantity,
            amount = request.amount
        )

        every { orderRepository.save(any()) } returns savedOrder
        every { kafkaTemplate.send(any(), any<OrderEvent>()) } returns mockk()

        // When
        val result = orderService.createOrder(request)

        // Then
        assertEquals(savedOrder.id, result.id)
        assertEquals(savedOrder.customerId, result.customerId)

        verify { orderRepository.save(any()) }
        verify { kafkaTemplate.send("order-created", any<OrderEvent>()) }
    }

    @Test
    fun `should update order status`() {
        // Given
        val orderId = 1L
        val order = Order(
            id = orderId,
            customerId = "CUST001",
            productId = "PROD001",
            quantity = 2,
            amount = BigDecimal("99.99")
        )

        every { orderRepository.findById(orderId) } returns Optional.of(order)
        every { orderRepository.save(any()) } returns order

        // When
        orderService.updateOrderStatus(orderId, Order.OrderStatus.COMPLETED)

        // Then
        assertEquals(Order.OrderStatus.COMPLETED, order.status)
        verify { orderRepository.save(order) }
    }

    @Test
    fun `should throw exception when order not found`() {
        // Given
        val orderId = 999L
        every { orderRepository.findById(orderId) } returns Optional.empty()

        // When & Then
        assertThrows(IllegalArgumentException::class.java) {
            orderService.getOrder(orderId)
        }
    }
}
```

### Controller Test

**OrderControllerTest.kt:**
```kotlin
package com.example.order.controller

import com.example.order.domain.Order
import com.example.order.service.CreateOrderRequest
import com.example.order.service.OrderService
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import io.mockk.coEvery
import io.mockk.mockk
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.get
import java.math.BigDecimal

@WebMvcTest(OrderController::class)
class OrderControllerTest {

    @TestConfiguration
    class TestConfig {
        @Bean
        fun orderService(): OrderService = mockk()
    }

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var orderService: OrderService

    private val objectMapper = jacksonObjectMapper()

    @Test
    fun `should create order`() {
        // Given
        val request = CreateOrderRequest(
            customerId = "CUST001",
            productId = "PROD001",
            quantity = 2,
            amount = BigDecimal("99.99")
        )

        val order = Order(
            id = 1L,
            customerId = request.customerId,
            productId = request.productId,
            quantity = request.quantity,
            amount = request.amount
        )

        coEvery { orderService.createOrder(request) } returns order

        // When & Then
        mockMvc.post("/api/orders") {
            contentType = MediaType.APPLICATION_JSON
            content = objectMapper.writeValueAsString(request)
        }.andExpect {
            status { isCreated() }
            jsonPath("$.id") { value(1) }
            jsonPath("$.customerId") { value("CUST001") }
        }
    }
}
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
./gradlew bootRun

# 2. Start API Gateway
cd api-gateway
./gradlew bootRun

# 3. Start Microservices
cd order-service && ./gradlew bootRun &
cd payment-service && ./gradlew bootRun &
cd inventory-service && ./gradlew bootRun &
cd saga-orchestrator && ./gradlew bootRun &
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
```

---

## Key Takeaways

1. **Kotlin Data Classes** - Perfect for DTOs, entities, and events (automatic equals, hashCode, toString)
2. **Null Safety** - Compiler prevents null pointer exceptions
3. **Coroutines** - Lightweight async operations for better performance
4. **Extension Functions** - Add functionality to existing classes
5. **Sealed Classes** - Type-safe result handling (Success/Failure)
6. **Smart Casts** - Automatic type casting in when expressions
7. **Concise Syntax** - Less boilerplate compared to Java
8. **MockK** - Kotlin-first mocking library with DSL support

---

**Related Guides:**
- [Deep Dive: Microservices Architecture](../../../3-design/architecture-pattern/deep-dive-microservices.md)
- [Deep Dive: Event-Driven Architecture](../../../3-design/architecture-pattern/deep-dive-event-driven.md)
- [Kotlin Project Setup](project-setup.md)

*Last Updated: 2025-10-20*
