# Event-Driven Architecture - Kotlin Implementation

**Pattern:** Event-Driven Architecture
**Language:** Kotlin
**Framework:** Spring Boot 3.x, Apache Kafka
**Related Guide:** [Deep Dive: Event-Driven Architecture](../../../3-design/architecture-pattern/deep-dive-event-driven.md)

## TL;DR

**Complete Event-Driven Architecture** where components communicate via asynchronous events using Kotlin coroutines. **Key principle**: Producers emit events → message broker → consumers react independently with non-blocking async processing. **Critical components**: Event producers (suspend functions) → Kafka topics → event consumers (coroutine-based) → guaranteed delivery → exactly-once semantics → Dead Letter Queue. **Kotlin advantages**: Coroutines for async → sealed classes for events → null safety → data classes for DTOs.

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Domain Events](#domain-events)
4. [Event Producer with Coroutines](#event-producer-with-coroutines)
5. [Event Consumer with Flow](#event-consumer-with-flow)
6. [Message Broker Configuration](#message-broker-configuration)
7. [Guaranteed Delivery Patterns](#guaranteed-delivery-patterns)
8. [Exactly-Once Processing](#exactly-once-processing)
9. [Dead Letter Queue](#dead-letter-queue)
10. [Event Schema Evolution](#event-schema-evolution)
11. [Testing with MockK](#testing-with-mockk)
12. [Running the Example](#running-the-example)

---

## Overview

This example demonstrates Event-Driven Architecture for an e-commerce system with:

- **Event Producers** - Order Service, Payment Service (coroutine-based)
- **Message Broker** - Apache Kafka
- **Event Consumers** - Email Service, Analytics Service, Inventory Service
- **Patterns** - At-least-once delivery, Idempotency, DLQ
- **Events** - Sealed class hierarchy with type safety

**Architecture:**
```
Order Service → OrderPlaced Event → Kafka Topic
                                        ↓
                        ┌───────────────┼───────────────┐
                        ↓               ↓               ↓
                Email Service   Analytics Service   Inventory Service
                (send receipt)  (track metrics)     (reserve stock)
```

---

## Project Structure

```
event-driven-example/
└── src/main/kotlin/com/example/eventdriven/
    ├── event/
    │   ├── DomainEvent.kt
    │   ├── OrderEvents.kt
    │   └── PaymentEvents.kt
    │
    ├── producer/
    │   ├── EventPublisher.kt
    │   └── OrderEventPublisher.kt
    │
    ├── consumer/
    │   ├── EmailEventConsumer.kt
    │   ├── AnalyticsEventConsumer.kt
    │   └── InventoryEventConsumer.kt
    │
    ├── config/
    │   ├── KafkaProducerConfig.kt
    │   ├── KafkaConsumerConfig.kt
    │   └── KafkaTopicConfig.kt
    │
    ├── service/
    │   ├── OrderService.kt
    │   └── PaymentService.kt
    │
    ├── outbox/
    │   ├── OutboxEvent.kt
    │   ├── OutboxRepository.kt
    │   └── OutboxRelay.kt
    │
    └── dlq/
        ├── DeadLetterHandler.kt
        └── RetryPolicy.kt
```

---

## Domain Events

### Base Event Interface

```kotlin
package com.example.eventdriven.event

import java.time.Instant

/**
 * Base domain event interface
 */
interface DomainEvent {
    val eventId: String
    val eventType: String
    val timestamp: Instant
    val version: Long
}
```

### Order Events (Sealed Class Hierarchy)

```kotlin
package com.example.eventdriven.event

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import java.math.BigDecimal
import java.time.Instant
import java.util.*

/**
 * Sealed class for Order Events - Type-safe event hierarchy
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "eventType")
@JsonSubTypes(
    JsonSubTypes.Type(value = OrderEvent.OrderPlaced::class, name = "OrderPlaced"),
    JsonSubTypes.Type(value = OrderEvent.OrderCancelled::class, name = "OrderCancelled"),
    JsonSubTypes.Type(value = OrderEvent.OrderShipped::class, name = "OrderShipped")
)
sealed class OrderEvent : DomainEvent {

    /**
     * OrderPlaced Event - Published when customer places an order
     */
    data class OrderPlaced(
        override val eventId: String = UUID.randomUUID().toString(),
        override val timestamp: Instant = Instant.now(),
        override val version: Long = 1,
        val orderId: String,
        val customerId: String,
        val customerEmail: String,
        val items: List<OrderItem>,
        val totalAmount: BigDecimal
    ) : OrderEvent() {
        override val eventType: String = "OrderPlaced"

        data class OrderItem(
            val productId: String,
            val productName: String,
            val quantity: Int,
            val price: BigDecimal
        )
    }

    /**
     * OrderCancelled Event
     */
    data class OrderCancelled(
        override val eventId: String = UUID.randomUUID().toString(),
        override val timestamp: Instant = Instant.now(),
        override val version: Long = 1,
        val orderId: String,
        val reason: String
    ) : OrderEvent() {
        override val eventType: String = "OrderCancelled"
    }

    /**
     * OrderShipped Event
     */
    data class OrderShipped(
        override val eventId: String = UUID.randomUUID().toString(),
        override val timestamp: Instant = Instant.now(),
        override val version: Long = 1,
        val orderId: String,
        val trackingNumber: String,
        val carrier: String
    ) : OrderEvent() {
        override val eventType: String = "OrderShipped"
    }
}

/**
 * Payment Events - Sealed class
 */
sealed class PaymentEvent : DomainEvent {

    data class PaymentProcessed(
        override val eventId: String = UUID.randomUUID().toString(),
        override val timestamp: Instant = Instant.now(),
        override val version: Long = 1,
        val orderId: String,
        val paymentId: String,
        val amount: BigDecimal,
        val paymentMethod: String,
        val status: PaymentStatus
    ) : PaymentEvent() {
        override val eventType: String = "PaymentProcessed"

        enum class PaymentStatus {
            SUCCESS, FAILED, PENDING
        }
    }

    data class PaymentRefunded(
        override val eventId: String = UUID.randomUUID().toString(),
        override val timestamp: Instant = Instant.now(),
        override val version: Long = 1,
        val orderId: String,
        val paymentId: String,
        val amount: BigDecimal
    ) : PaymentEvent() {
        override val eventType: String = "PaymentRefunded"
    }
}
```

---

## Event Producer with Coroutines

### Event Publisher Interface

```kotlin
package com.example.eventdriven.producer

import com.example.eventdriven.event.DomainEvent
import kotlinx.coroutines.flow.Flow

/**
 * Event Publisher - Abstraction over message broker
 */
interface EventPublisher {
    /**
     * Publish event asynchronously using coroutines
     */
    suspend fun publishAsync(topic: String, event: DomainEvent)

    /**
     * Publish event with acknowledgment
     */
    suspend fun publishWithAck(topic: String, event: DomainEvent): Boolean

    /**
     * Publish multiple events as Flow
     */
    suspend fun publishBatch(topic: String, events: Flow<DomainEvent>)
}
```

### Kafka Event Publisher (Coroutine-Based)

```kotlin
package com.example.eventdriven.producer

import com.example.eventdriven.event.DomainEvent
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.future.await
import kotlinx.coroutines.withContext
import org.slf4j.LoggerFactory
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Component

/**
 * Kafka-based event publisher with coroutines
 */
@Component
class KafkaEventPublisher(
    private val kafkaTemplate: KafkaTemplate<String, DomainEvent>
) : EventPublisher {

    private val log = LoggerFactory.getLogger(javaClass)

    override suspend fun publishAsync(topic: String, event: DomainEvent) = withContext(Dispatchers.IO) {
        try {
            val future = kafkaTemplate.send(topic, event.eventId, event)
            val result = future.await()

            log.info(
                "Published event {} to topic {} at partition {} offset {}",
                event.eventId,
                topic,
                result.recordMetadata.partition(),
                result.recordMetadata.offset()
            )
        } catch (e: Exception) {
            log.error("Failed to publish event {} to topic {}: {}", event.eventId, topic, e.message)
            throw EventPublishException("Failed to publish event", e)
        }
    }

    override suspend fun publishWithAck(topic: String, event: DomainEvent): Boolean = withContext(Dispatchers.IO) {
        try {
            val future = kafkaTemplate.send(topic, event.eventId, event)
            future.await()
            log.info("Successfully published event {} to topic {}", event.eventId, topic)
            true
        } catch (e: Exception) {
            log.error("Failed to publish event {}: {}", event.eventId, e.message)
            false
        }
    }

    override suspend fun publishBatch(topic: String, events: Flow<DomainEvent>) {
        events.collect { event ->
            publishAsync(topic, event)
        }
    }

    class EventPublishException(message: String, cause: Throwable? = null) : RuntimeException(message, cause)
}
```

### Order Event Publisher

```kotlin
package com.example.eventdriven.producer

import com.example.eventdriven.event.OrderEvent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

/**
 * Domain-specific event publisher
 */
@Component
class OrderEventPublisher(
    private val eventPublisher: EventPublisher
) {
    private val log = LoggerFactory.getLogger(javaClass)
    private val scope = CoroutineScope(Dispatchers.Default)

    companion object {
        const val ORDER_TOPIC = "order-events"
    }

    suspend fun publishOrderPlaced(event: OrderEvent.OrderPlaced) {
        eventPublisher.publishAsync(ORDER_TOPIC, event)
    }

    suspend fun publishOrderPlacedWithConfirmation(event: OrderEvent.OrderPlaced): Boolean {
        return try {
            val success = eventPublisher.publishWithAck(ORDER_TOPIC, event)
            if (success) {
                log.info("Order event published successfully: ${event.orderId}")
            } else {
                log.error("Failed to publish order event: ${event.orderId}")
            }
            success
        } catch (e: Exception) {
            log.error("Exception publishing order event: ${e.message}")
            false
        }
    }

    // Fire and forget (non-blocking)
    fun publishOrderPlacedAsync(event: OrderEvent.OrderPlaced) {
        scope.launch {
            try {
                publishOrderPlaced(event)
            } catch (e: Exception) {
                log.error("Async publish failed: ${e.message}")
            }
        }
    }
}
```

---

## Event Consumer with Flow

### Email Event Consumer

```kotlin
package com.example.eventdriven.consumer

import com.example.eventdriven.event.OrderEvent
import kotlinx.coroutines.delay
import org.slf4j.LoggerFactory
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.kafka.support.Acknowledgment
import org.springframework.kafka.support.KafkaHeaders
import org.springframework.messaging.handler.annotation.Header
import org.springframework.messaging.handler.annotation.Payload
import org.springframework.stereotype.Component

/**
 * Email Service - Sends notifications (coroutine-based)
 */
@Component
class EmailEventConsumer {
    private val log = LoggerFactory.getLogger(javaClass)

    @KafkaListener(
        topics = ["order-events"],
        groupId = "email-service",
        containerFactory = "kafkaListenerContainerFactory"
    )
    suspend fun handleOrderEvent(
        @Payload event: OrderEvent,
        @Header(KafkaHeaders.RECEIVED_PARTITION) partition: Int,
        @Header(KafkaHeaders.OFFSET) offset: Long,
        acknowledgment: Acknowledgment?
    ) {
        log.info("Received {} event from partition {} at offset {}", event.eventType, partition, offset)

        try {
            when (event) {
                is OrderEvent.OrderPlaced -> handleOrderPlaced(event)
                is OrderEvent.OrderShipped -> handleOrderShipped(event)
                is OrderEvent.OrderCancelled -> handleOrderCancelled(event)
            }

            // Manual acknowledgment (ensures at-least-once delivery)
            acknowledgment?.acknowledge()
            log.info("Successfully processed event {}", event.eventId)

        } catch (e: Exception) {
            log.error("Failed to process event {}: {}", event.eventId, e.message)
            throw e // Don't acknowledge - message will be redelivered
        }
    }

    private suspend fun handleOrderPlaced(event: OrderEvent.OrderPlaced) {
        log.info("Sending order confirmation email to {} for order {}", event.customerEmail, event.orderId)
        sendEmail(event.customerEmail, "Order Confirmation", buildOrderConfirmationEmail(event))
    }

    private suspend fun handleOrderShipped(event: OrderEvent.OrderShipped) {
        log.info("Sending shipping notification for order {} with tracking {}", event.orderId, event.trackingNumber)
        // Send shipping notification
    }

    private suspend fun handleOrderCancelled(event: OrderEvent.OrderCancelled) {
        log.info("Sending cancellation notification for order {}", event.orderId)
        // Send cancellation notification
    }

    private suspend fun sendEmail(to: String, subject: String, body: String) {
        // Simulate async email sending with coroutine
        delay(100)
        log.info("Email sent to: $to")
    }

    private fun buildOrderConfirmationEmail(event: OrderEvent.OrderPlaced): String {
        return """
            Order Confirmation

            Order ID: ${event.orderId}
            Customer: ${event.customerId}
            Total: ${event.totalAmount}

            Items:
            ${event.items.joinToString("\n") { "- ${it.productName} x${it.quantity}: ${it.price}" }}
        """.trimIndent()
    }
}
```

### Analytics Event Consumer (with Flow)

```kotlin
package com.example.eventdriven.consumer

import com.example.eventdriven.event.OrderEvent
import com.example.eventdriven.event.PaymentEvent
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import org.slf4j.LoggerFactory
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.stereotype.Component

/**
 * Analytics Service - Tracks metrics with Flow
 */
@Component
class AnalyticsEventConsumer {
    private val log = LoggerFactory.getLogger(javaClass)

    // Shared flow for real-time analytics
    private val _analyticsEvents = MutableSharedFlow<AnalyticsData>()
    val analyticsEvents = _analyticsEvents.asSharedFlow()

    @KafkaListener(topics = ["order-events", "payment-events"], groupId = "analytics-service")
    suspend fun handleEvent(event: Any) {
        when (event) {
            is OrderEvent.OrderPlaced -> trackOrderPlaced(event)
            is PaymentEvent.PaymentProcessed -> trackPaymentProcessed(event)
            else -> log.warn("Unknown event type: ${event::class.simpleName}")
        }
    }

    private suspend fun trackOrderPlaced(event: OrderEvent.OrderPlaced) {
        log.info("Analytics: Order placed - Customer: {}, Total: {}", event.customerId, event.totalAmount)

        val analyticsData = AnalyticsData.OrderMetrics(
            orderId = event.orderId,
            customerId = event.customerId,
            totalAmount = event.totalAmount,
            itemCount = event.items.size,
            timestamp = event.timestamp
        )

        _analyticsEvents.emit(analyticsData)
    }

    private suspend fun trackPaymentProcessed(event: PaymentEvent.PaymentProcessed) {
        log.info(
            "Analytics: Payment processed - Order: {}, Method: {}, Status: {}",
            event.orderId,
            event.paymentMethod,
            event.status
        )

        val analyticsData = AnalyticsData.PaymentMetrics(
            orderId = event.orderId,
            paymentMethod = event.paymentMethod,
            status = event.status,
            amount = event.amount,
            timestamp = event.timestamp
        )

        _analyticsEvents.emit(analyticsData)
    }

    sealed class AnalyticsData {
        data class OrderMetrics(
            val orderId: String,
            val customerId: String,
            val totalAmount: java.math.BigDecimal,
            val itemCount: Int,
            val timestamp: java.time.Instant
        ) : AnalyticsData()

        data class PaymentMetrics(
            val orderId: String,
            val paymentMethod: String,
            val status: PaymentEvent.PaymentProcessed.PaymentStatus,
            val amount: java.math.BigDecimal,
            val timestamp: java.time.Instant
        ) : AnalyticsData()
    }
}
```

### Inventory Event Consumer (with Idempotency)

```kotlin
package com.example.eventdriven.consumer

import com.example.eventdriven.event.OrderEvent
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import org.slf4j.LoggerFactory
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.stereotype.Component

/**
 * Inventory Service - Reserves stock (with idempotency and mutex)
 */
@Component
class InventoryEventConsumer {
    private val log = LoggerFactory.getLogger(javaClass)

    // Track processed events for idempotency (in production, use database)
    private val processedEvents = mutableSetOf<String>()
    private val mutex = Mutex()

    @KafkaListener(topics = ["order-events"], groupId = "inventory-service")
    suspend fun handleOrderPlaced(event: OrderEvent) {
        if (event !is OrderEvent.OrderPlaced) return

        // Idempotency check with mutex
        mutex.withLock {
            if (processedEvents.contains(event.eventId)) {
                log.info("Event {} already processed, skipping", event.eventId)
                return
            }

            log.info("Received OrderPlaced event {}", event.eventId)

            try {
                // Reserve inventory for each item
                event.items.forEach { item ->
                    reserveStock(item.productId, item.quantity)
                }

                // Mark as processed
                processedEvents.add(event.eventId)

                log.info("Successfully reserved inventory for order {}", event.orderId)

            } catch (e: Exception) {
                log.error("Failed to reserve inventory for order {}: {}", event.orderId, e.message)
                throw e
            }
        }
    }

    private suspend fun reserveStock(productId: String, quantity: Int) {
        log.info("Reserving {} units of product {}", quantity, productId)
        // Update inventory database
    }
}
```

---

## Message Broker Configuration

### Producer Configuration (Kotlin DSL)

```kotlin
package com.example.eventdriven.config

import com.example.eventdriven.event.DomainEvent
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
    fun producerFactory(): ProducerFactory<String, DomainEvent> {
        val config = mapOf(
            ProducerConfig.BOOTSTRAP_SERVERS_CONFIG to "localhost:9092",
            ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG to StringSerializer::class.java,
            ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG to JsonSerializer::class.java,
            // Reliability settings
            ProducerConfig.ACKS_CONFIG to "all",  // Wait for all replicas
            ProducerConfig.RETRIES_CONFIG to 3,
            ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION to 1,  // Ordering guarantee
            ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG to true,  // Exactly-once
            // Performance settings
            ProducerConfig.COMPRESSION_TYPE_CONFIG to "snappy",
            ProducerConfig.BATCH_SIZE_CONFIG to 16384,
            ProducerConfig.LINGER_MS_CONFIG to 10
        )
        return DefaultKafkaProducerFactory(config)
    }

    @Bean
    fun kafkaTemplate(): KafkaTemplate<String, DomainEvent> = KafkaTemplate(producerFactory())
}
```

### Consumer Configuration

```kotlin
package com.example.eventdriven.config

import com.example.eventdriven.event.DomainEvent
import org.apache.kafka.clients.consumer.ConsumerConfig
import org.apache.kafka.common.serialization.StringDeserializer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.kafka.annotation.EnableKafka
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory
import org.springframework.kafka.core.ConsumerFactory
import org.springframework.kafka.core.DefaultKafkaConsumerFactory
import org.springframework.kafka.listener.ContainerProperties
import org.springframework.kafka.support.serializer.JsonDeserializer

@Configuration
@EnableKafka
class KafkaConsumerConfig {

    @Bean
    fun consumerFactory(): ConsumerFactory<String, DomainEvent> {
        val config = mapOf(
            ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG to "localhost:9092",
            ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG to StringDeserializer::class.java,
            ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG to JsonDeserializer::class.java,
            ConsumerConfig.AUTO_OFFSET_RESET_CONFIG to "earliest",
            ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG to false,  // Manual commit
            ConsumerConfig.MAX_POLL_RECORDS_CONFIG to 100,
            ConsumerConfig.FETCH_MIN_BYTES_CONFIG to 1024
        )

        val deserializer = JsonDeserializer(DomainEvent::class.java).apply {
            addTrustedPackages("*")
            setUseTypeHeaders(false)
        }

        return DefaultKafkaConsumerFactory(config, StringDeserializer(), deserializer)
    }

    @Bean
    fun kafkaListenerContainerFactory(): ConcurrentKafkaListenerContainerFactory<String, DomainEvent> {
        return ConcurrentKafkaListenerContainerFactory<String, DomainEvent>().apply {
            consumerFactory = consumerFactory()
            setConcurrency(3)  // 3 consumer threads
            // Manual acknowledgment mode (at-least-once delivery)
            containerProperties.ackMode = ContainerProperties.AckMode.MANUAL
        }
    }
}
```

### Topic Configuration

```kotlin
package com.example.eventdriven.config

import org.apache.kafka.clients.admin.NewTopic
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.kafka.config.TopicBuilder

@Configuration
class KafkaTopicConfig {

    @Bean
    fun orderEventsTopic(): NewTopic = TopicBuilder.name("order-events")
        .partitions(3)
        .replicas(2)
        .config("retention.ms", "604800000")  // 7 days
        .config("cleanup.policy", "delete")
        .build()

    @Bean
    fun paymentEventsTopic(): NewTopic = TopicBuilder.name("payment-events")
        .partitions(3)
        .replicas(2)
        .build()

    @Bean
    fun shippingEventsTopic(): NewTopic = TopicBuilder.name("shipping-events")
        .partitions(3)
        .replicas(2)
        .build()

    @Bean
    fun deadLetterTopic(): NewTopic = TopicBuilder.name("dead-letter-queue")
        .partitions(1)
        .replicas(2)
        .build()
}
```

---

## Guaranteed Delivery Patterns

### At-Least-Once Delivery with Coroutines

```kotlin
// Consumer side: Manual acknowledgment with suspend function
@KafkaListener(topics = ["order-events"], groupId = "email-service")
suspend fun handleEvent(event: OrderEvent, ack: Acknowledgment?) {
    try {
        processEvent(event)
        ack?.acknowledge()  // Commit only after successful processing
    } catch (e: Exception) {
        // Don't acknowledge - message will be redelivered
        throw e
    }
}

private suspend fun processEvent(event: OrderEvent) = withContext(Dispatchers.IO) {
    // Process event asynchronously
}
```

---

## Exactly-Once Processing

### Transactional Outbox Pattern

```kotlin
package com.example.eventdriven.outbox

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "outbox_events")
data class OutboxEvent(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: String? = null,

    @Column(nullable = false)
    val aggregateId: String,

    @Column(nullable = false)
    val eventType: String,

    @Column(columnDefinition = "TEXT", nullable = false)
    val payload: String,

    @Column(nullable = false)
    val createdAt: Instant = Instant.now(),

    @Column(nullable = false)
    var published: Boolean = false
)
```

### Outbox Relay (Coroutine-Based)

```kotlin
package com.example.eventdriven.outbox

import com.example.eventdriven.event.DomainEvent
import com.example.eventdriven.producer.EventPublisher
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import kotlinx.coroutines.*
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

/**
 * Outbox Relay - Publishes events from outbox table to Kafka (coroutine-based)
 */
@Component
class OutboxRelay(
    private val outboxRepository: OutboxRepository,
    private val eventPublisher: EventPublisher
) {
    private val log = LoggerFactory.getLogger(javaClass)
    private val objectMapper = jacksonObjectMapper()
    private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())

    @Scheduled(fixedDelay = 1000)  // Every 1 second
    @Transactional
    fun relayEvents() {
        scope.launch {
            val unpublishedEvents = outboxRepository.findByPublishedFalseOrderByCreatedAtAsc()

            unpublishedEvents.forEach { outboxEvent ->
                try {
                    // Deserialize event
                    val eventClass = Class.forName(outboxEvent.eventType)
                    val event = objectMapper.readValue(outboxEvent.payload, eventClass) as DomainEvent

                    // Publish to Kafka
                    eventPublisher.publishAsync("order-events", event)

                    // Mark as published
                    outboxEvent.published = true
                    outboxRepository.save(outboxEvent)

                    log.info("Published outbox event {}", outboxEvent.id)

                } catch (e: Exception) {
                    log.error("Failed to relay outbox event {}: {}", outboxEvent.id, e.message)
                }
            }
        }
    }
}
```

---

## Dead Letter Queue

### Dead Letter Handler

```kotlin
package com.example.eventdriven.dlq

import com.example.eventdriven.event.DomainEvent
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.slf4j.LoggerFactory
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Component

/**
 * Dead Letter Queue Handler (coroutine-based)
 */
@Component
class DeadLetterHandler(
    private val kafkaTemplate: KafkaTemplate<String, DomainEvent>
) {
    private val log = LoggerFactory.getLogger(javaClass)

    companion object {
        const val DLQ_TOPIC = "dead-letter-queue"
    }

    suspend fun sendToDeadLetterQueue(event: DomainEvent, exception: Exception) = withContext(Dispatchers.IO) {
        log.error("Sending event {} to DLQ due to: {}", event.eventId, exception.message)
        kafkaTemplate.send(DLQ_TOPIC, event.eventId, event)
    }

    @KafkaListener(topics = [DLQ_TOPIC], groupId = "dlq-monitor")
    suspend fun monitorDeadLetterQueue(event: DomainEvent) {
        log.warn("DLQ: Received failed event {}", event.eventId)

        // Options:
        // 1. Alert operations team
        // 2. Store in database for manual review
        // 3. Attempt automated recovery
        // 4. Log for investigation
    }
}
```

---

## Testing with MockK

### Event Producer Test

```kotlin
package com.example.eventdriven.producer

import com.example.eventdriven.event.OrderEvent
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Test
import org.springframework.kafka.core.KafkaTemplate
import java.math.BigDecimal

@OptIn(ExperimentalCoroutinesApi::class)
class OrderEventPublisherTest {

    private val eventPublisher = mockk<EventPublisher>()
    private val orderEventPublisher = OrderEventPublisher(eventPublisher)

    @Test
    fun `should publish order placed event`() = runTest {
        // Given
        val event = OrderEvent.OrderPlaced(
            orderId = "ORDER001",
            customerId = "CUST001",
            customerEmail = "customer@example.com",
            items = emptyList(),
            totalAmount = BigDecimal("100.00")
        )

        coEvery { eventPublisher.publishAsync(any(), any()) } returns Unit

        // When
        orderEventPublisher.publishOrderPlaced(event)

        // Then
        coVerify { eventPublisher.publishAsync("order-events", event) }
    }

    @Test
    fun `should publish with confirmation`() = runTest {
        // Given
        val event = OrderEvent.OrderPlaced(
            orderId = "ORDER001",
            customerId = "CUST001",
            customerEmail = "customer@example.com",
            items = emptyList(),
            totalAmount = BigDecimal("100.00")
        )

        coEvery { eventPublisher.publishWithAck(any(), any()) } returns true

        // When
        val result = orderEventPublisher.publishOrderPlacedWithConfirmation(event)

        // Then
        assert(result)
        coVerify { eventPublisher.publishWithAck("order-events", event) }
    }
}
```

### Event Consumer Test

```kotlin
package com.example.eventdriven.consumer

import com.example.eventdriven.event.OrderEvent
import io.mockk.*
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Test
import org.springframework.kafka.support.Acknowledgment
import java.math.BigDecimal

@OptIn(ExperimentalCoroutinesApi::class)
class EmailEventConsumerTest {

    private val consumer = EmailEventConsumer()

    @Test
    fun `should handle order placed event`() = runTest {
        // Given
        val event = OrderEvent.OrderPlaced(
            orderId = "ORDER001",
            customerId = "CUST001",
            customerEmail = "test@example.com",
            items = emptyList(),
            totalAmount = BigDecimal("100.00")
        )

        val acknowledgment = mockk<Acknowledgment>(relaxed = true)

        // When
        consumer.handleOrderEvent(event, 0, 1L, acknowledgment)

        // Then
        verify { acknowledgment.acknowledge() }
    }
}
```

---

## Running the Example

### Start Kafka

```bash
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

# Start
docker-compose up -d
```

### Run Application

```bash
./gradlew bootRun
```

### Test

```bash
# Publish event via REST API
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUST001",
    "customerEmail": "customer@example.com",
    "items": [
      {"productId": "PROD001", "productName": "Widget", "quantity": 2, "price": 50.00}
    ],
    "totalAmount": 100.00
  }'

# Check consumer logs
tail -f logs/application.log
```

---

## Key Takeaways

1. **Coroutines for Async** - Non-blocking event publishing and consumption
2. **Sealed Classes** - Type-safe event hierarchies with exhaustive when expressions
3. **Flow** - Reactive streams for real-time event processing
4. **Null Safety** - Compile-time null checks prevent NPEs
5. **Data Classes** - Perfect for events and DTOs
6. **Suspend Functions** - Async without callbacks
7. **Mutex** - Thread-safe idempotency checks
8. **MockK** - Kotlin-first mocking with coroutine support

---

**Related Guides:**
- [Deep Dive: Event-Driven Architecture](../../../3-design/architecture-pattern/deep-dive-event-driven.md)
- [Deep Dive: Microservices](../../../3-design/architecture-pattern/deep-dive-microservices.md)
- [Kotlin Project Setup](project-setup.md)

*Last Updated: 2025-10-20*
