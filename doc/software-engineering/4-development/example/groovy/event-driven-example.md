# Event-Driven Architecture - Groovy Implementation

**Pattern:** Event-Driven Architecture
**Language:** Groovy
**Framework:** Spring Boot 3.x, Apache Kafka
**Related Guide:** [Deep Dive: Event-Driven Architecture](../../../3-design/architecture-pattern/deep-dive-event-driven.md)

## TL;DR

**Complete Event-Driven Architecture in Groovy** where components communicate via asynchronous events. **Key principle**: Producers emit events → message broker → consumers react independently. **Critical components**: Event producers (publish & forget) → Kafka topics → event consumers (async processing) → guaranteed delivery → exactly-once semantics → Dead Letter Queue. **Groovy advantages**: Concise event definitions with @Canonical → closures for event handlers → DSL for Kafka configuration → Spock for event testing.

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Domain Events](#domain-events)
4. [Event Producer](#event-producer)
5. [Event Consumer](#event-consumer)
6. [Message Broker Configuration (Kafka)](#message-broker-configuration-kafka)
7. [Guaranteed Delivery Patterns](#guaranteed-delivery-patterns)
8. [Exactly-Once Processing](#exactly-once-processing)
9. [Dead Letter Queue](#dead-letter-queue)
10. [Event Schema Evolution](#event-schema-evolution)
11. [Testing with Spock](#testing-with-spock)
12. [Running the Example](#running-the-example)

---

## Overview

This example demonstrates Event-Driven Architecture for an e-commerce system with:

- **Event Producers** - Order Service, Payment Service (Groovy)
- **Message Broker** - Apache Kafka
- **Event Consumers** - Email Service, Analytics Service, Inventory Service (Groovy)
- **Patterns** - At-least-once delivery, Idempotency, DLQ
- **Events** - OrderPlaced, PaymentProcessed, OrderShipped

**Architecture:**
```
Order Service → OrderPlaced Event → Kafka Topic
(Groovy)                                ↓
                        ┌───────────────┼───────────────┐
                        ↓               ↓               ↓
                Email Service   Analytics Service   Inventory Service
                (Groovy)        (Groovy)            (Groovy)
                (send receipt)  (track metrics)     (reserve stock)
```

---

## Project Structure

```
event-driven-example/
└── src/main/groovy/com/example/eventdriven/
    ├── event/
    │   ├── DomainEvent.groovy
    │   ├── OrderPlacedEvent.groovy
    │   ├── PaymentProcessedEvent.groovy
    │   └── OrderShippedEvent.groovy
    │
    ├── producer/
    │   ├── EventPublisher.groovy
    │   └── OrderEventPublisher.groovy
    │
    ├── consumer/
    │   ├── EmailEventConsumer.groovy
    │   ├── AnalyticsEventConsumer.groovy
    │   └── InventoryEventConsumer.groovy
    │
    ├── config/
    │   ├── KafkaProducerConfig.groovy
    │   ├── KafkaConsumerConfig.groovy
    │   └── KafkaTopicConfig.groovy
    │
    ├── service/
    │   ├── OrderService.groovy
    │   └── PaymentService.groovy
    │
    ├── outbox/
    │   ├── OutboxEvent.groovy
    │   ├── OutboxRepository.groovy
    │   └── OutboxRelay.groovy
    │
    └── dlq/
        ├── DeadLetterHandler.groovy
        └── RetryPolicy.groovy
```

---

## Domain Events

### Base Event Interface

```groovy
package com.example.eventdriven.event

import groovy.transform.CompileStatic

import java.time.Instant

/**
 * Base domain event interface
 */
@CompileStatic
trait DomainEvent {
    abstract String getEventId()
    abstract String getEventType()
    abstract Instant getTimestamp()
    abstract long getVersion()

    // Groovy trait method with default implementation
    boolean isValid() {
        eventId && eventType && timestamp && version > 0
    }
}
```

### Order Events

```groovy
package com.example.eventdriven.event

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import groovy.transform.Canonical
import groovy.transform.CompileStatic

import java.time.Instant

/**
 * OrderPlaced Event - Published when customer places an order
 * Uses @Canonical for automatic equals/hashCode/toString
 */
@CompileStatic
@Canonical
class OrderPlacedEvent implements DomainEvent {
    @JsonProperty('eventId')
    final String eventId

    @JsonProperty('eventType')
    final String eventType

    @JsonProperty('timestamp')
    final Instant timestamp

    @JsonProperty('version')
    final long version

    @JsonProperty('orderId')
    final String orderId

    @JsonProperty('customerId')
    final String customerId

    @JsonProperty('customerEmail')
    final String customerEmail

    @JsonProperty('items')
    final List<OrderItem> items

    @JsonProperty('totalAmount')
    final BigDecimal totalAmount

    // Primary constructor (from domain)
    OrderPlacedEvent(String orderId, String customerId, String customerEmail,
                    List<OrderItem> items, BigDecimal totalAmount) {
        this.eventId = UUID.randomUUID().toString()
        this.eventType = 'OrderPlaced'
        this.timestamp = Instant.now()
        this.version = 1
        this.orderId = orderId
        this.customerId = customerId
        this.customerEmail = customerEmail
        this.items = items
        this.totalAmount = totalAmount
    }

    // Reconstruction constructor (from JSON)
    @JsonCreator
    OrderPlacedEvent(
        @JsonProperty('eventId') String eventId,
        @JsonProperty('eventType') String eventType,
        @JsonProperty('timestamp') Instant timestamp,
        @JsonProperty('version') long version,
        @JsonProperty('orderId') String orderId,
        @JsonProperty('customerId') String customerId,
        @JsonProperty('customerEmail') String customerEmail,
        @JsonProperty('items') List<OrderItem> items,
        @JsonProperty('totalAmount') BigDecimal totalAmount
    ) {
        this.eventId = eventId
        this.eventType = eventType
        this.timestamp = timestamp
        this.version = version
        this.orderId = orderId
        this.customerId = customerId
        this.customerEmail = customerEmail
        this.items = items
        this.totalAmount = totalAmount
    }

    @Canonical
    static class OrderItem {
        String productId
        String productName
        int quantity
        BigDecimal price
    }
}

/**
 * PaymentProcessed Event
 */
@CompileStatic
@Canonical
class PaymentProcessedEvent implements DomainEvent {
    final String eventId = UUID.randomUUID().toString()
    final String eventType = 'PaymentProcessed'
    final Instant timestamp = Instant.now()
    final long version = 1

    final String orderId
    final String paymentId
    final BigDecimal amount
    final String paymentMethod
    final PaymentStatus status

    enum PaymentStatus {
        SUCCESS, FAILED, PENDING, REFUNDED
    }
}

/**
 * OrderShipped Event
 */
@CompileStatic
@Canonical
class OrderShippedEvent implements DomainEvent {
    final String eventId = UUID.randomUUID().toString()
    final String eventType = 'OrderShipped'
    final Instant timestamp = Instant.now()
    final long version = 1

    final String orderId
    final String trackingNumber
    final String carrier
    final Instant estimatedDelivery
}
```

---

## Event Producer

### Event Publisher Interface

```groovy
package com.example.eventdriven.producer

import com.example.eventdriven.event.DomainEvent
import groovy.transform.CompileStatic

import java.util.concurrent.CompletableFuture

/**
 * Event Publisher - Abstraction over message broker
 */
@CompileStatic
interface EventPublisher {
    /**
     * Publish event asynchronously (fire and forget)
     */
    void publishAsync(String topic, DomainEvent event)

    /**
     * Publish event with callback
     */
    CompletableFuture<Void> publishWithCallback(String topic, DomainEvent event)

    /**
     * Publish event synchronously (wait for acknowledgment)
     */
    void publishSync(String topic, DomainEvent event)
}
```

### Kafka Event Publisher

```groovy
package com.example.eventdriven.producer

import com.example.eventdriven.event.DomainEvent
import groovy.transform.CompileStatic
import groovy.util.logging.Slf4j
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.kafka.support.SendResult
import org.springframework.stereotype.Component

import java.util.concurrent.CompletableFuture

/**
 * Kafka-based event publisher with Groovy enhancements
 */
@Slf4j
@CompileStatic
@Component
class KafkaEventPublisher implements EventPublisher {
    private final KafkaTemplate<String, DomainEvent> kafkaTemplate

    KafkaEventPublisher(KafkaTemplate<String, DomainEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate
    }

    @Override
    void publishAsync(String topic, DomainEvent event) {
        kafkaTemplate.send(topic, event.eventId, event).whenComplete { result, ex ->
            if (ex) {
                log.error "Failed to publish event ${event.eventId} to topic ${topic}: ${ex.message}"
            } else {
                log.info "Published event ${event.eventId} to topic ${topic} at offset ${result.recordMetadata.offset()}"
            }
        }
    }

    @Override
    CompletableFuture<Void> publishWithCallback(String topic, DomainEvent event) {
        CompletableFuture<SendResult<String, DomainEvent>> future =
            kafkaTemplate.send(topic, event.eventId, event)

        future.thenApply { result ->
            log.info """
                Published event ${event.eventId}:
                  Partition: ${result.recordMetadata.partition()}
                  Offset: ${result.recordMetadata.offset()}
                  Topic: ${topic}
            """.stripIndent()
            null
        }.exceptionally { ex ->
            log.error "Failed to publish event ${event.eventId}: ${ex.message}"
            throw new EventPublishException("Failed to publish event", ex)
        }
    }

    @Override
    void publishSync(String topic, DomainEvent event) {
        try {
            SendResult<String, DomainEvent> result =
                kafkaTemplate.send(topic, event.eventId, event).get()

            log.info "Published event ${event.eventId} synchronously at offset ${result.recordMetadata.offset()}"
        } catch (Exception e) {
            log.error "Failed to publish event synchronously: ${e.message}"
            throw new EventPublishException("Failed to publish event", e)
        }
    }

    static class EventPublishException extends RuntimeException {
        EventPublishException(String message, Throwable cause) {
            super(message, cause)
        }
    }
}
```

### Order Event Publisher

```groovy
package com.example.eventdriven.producer

import com.example.eventdriven.event.OrderPlacedEvent
import groovy.transform.CompileStatic
import groovy.util.logging.Slf4j
import org.springframework.stereotype.Component

@Slf4j
@CompileStatic
@Component
class OrderEventPublisher {
    private final EventPublisher eventPublisher

    OrderEventPublisher(EventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher
    }

    void publishOrderPlaced(OrderPlacedEvent event) {
        log.info "Publishing OrderPlaced event for order: ${event.orderId}"

        // Groovy's with() for cleaner validation
        event.with {
            assert orderId
            assert customerId
            assert items?.size() > 0
            assert totalAmount > 0
        }

        eventPublisher.publishAsync('order-placed', event)
    }

    void publishOrderPlacedWithConfirmation(OrderPlacedEvent event) {
        eventPublisher.publishWithCallback('order-placed', event)
            .thenAccept {
                log.info "Order ${event.orderId} event confirmed"
            }
            .exceptionally { ex ->
                log.error "Failed to confirm order ${event.orderId} event: ${ex.message}"
                null
            }
    }
}
```

---

## Event Consumer

### Email Event Consumer

```groovy
package com.example.eventdriven.consumer

import com.example.eventdriven.event.OrderPlacedEvent
import com.example.eventdriven.event.OrderShippedEvent
import com.example.eventdriven.event.PaymentProcessedEvent
import groovy.transform.CompileStatic
import groovy.util.logging.Slf4j
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.kafka.support.Acknowledgment
import org.springframework.stereotype.Component

@Slf4j
@CompileStatic
@Component
class EmailEventConsumer {
    private final Set<String> processedEvents = ([] as Set).asSynchronized()

    @KafkaListener(
        topics = ['order-placed'],
        groupId = 'email-service',
        containerFactory = 'kafkaListenerContainerFactory'
    )
    void handleOrderPlaced(OrderPlacedEvent event, Acknowledgment ack) {
        log.info "Received OrderPlaced event: ${event.eventId}"

        // Idempotency check
        if (processedEvents.contains(event.eventId)) {
            log.warn "Event ${event.eventId} already processed, skipping"
            ack.acknowledge()
            return
        }

        try {
            // Groovy's multiline strings and interpolation
            sendEmail(
                to: event.customerEmail,
                subject: "Order Confirmation #${event.orderId}",
                body: """
                    Dear Customer,

                    Thank you for your order!

                    Order ID: ${event.orderId}
                    Total Amount: \$${event.totalAmount}

                    Items:
                    ${event.items.collect { "- ${it.productName} x${it.quantity} - \$${it.price}" }.join('\n')}

                    We'll notify you when your order ships.

                    Thank you for shopping with us!
                """.stripIndent()
            )

            processedEvents.add(event.eventId)
            ack.acknowledge()

            log.info "Email sent for order: ${event.orderId}"

        } catch (Exception e) {
            log.error "Failed to send email for order ${event.orderId}: ${e.message}"
            // Don't acknowledge - message will be retried
        }
    }

    @KafkaListener(topics = ['payment-processed'], groupId = 'email-service')
    void handlePaymentProcessed(PaymentProcessedEvent event, Acknowledgment ack) {
        log.info "Received PaymentProcessed event: ${event.eventId}"

        if (processedEvents.contains(event.eventId)) {
            ack.acknowledge()
            return
        }

        try {
            def subject = event.status == PaymentProcessedEvent.PaymentStatus.SUCCESS ?
                "Payment Successful #${event.orderId}" :
                "Payment Failed #${event.orderId}"

            def body = event.status == PaymentProcessedEvent.PaymentStatus.SUCCESS ?
                """
                    Your payment has been processed successfully!

                    Order ID: ${event.orderId}
                    Payment ID: ${event.paymentId}
                    Amount: \$${event.amount}
                    Method: ${event.paymentMethod}
                """.stripIndent() :
                """
                    We were unable to process your payment.

                    Order ID: ${event.orderId}
                    Please update your payment information.
                """.stripIndent()

            sendEmail(to: 'customer@example.com', subject: subject, body: body)

            processedEvents.add(event.eventId)
            ack.acknowledge()

        } catch (Exception e) {
            log.error "Failed to send payment email: ${e.message}"
        }
    }

    @KafkaListener(topics = ['order-shipped'], groupId = 'email-service')
    void handleOrderShipped(OrderShippedEvent event, Acknowledgment ack) {
        log.info "Received OrderShipped event: ${event.eventId}"

        if (processedEvents.contains(event.eventId)) {
            ack.acknowledge()
            return
        }

        try {
            sendEmail(
                to: 'customer@example.com',
                subject: "Your Order Has Shipped! #${event.orderId}",
                body: """
                    Great news! Your order has shipped.

                    Order ID: ${event.orderId}
                    Tracking Number: ${event.trackingNumber}
                    Carrier: ${event.carrier}
                    Estimated Delivery: ${event.estimatedDelivery}

                    Track your shipment at: https://tracking.example.com/${event.trackingNumber}
                """.stripIndent()
            )

            processedEvents.add(event.eventId)
            ack.acknowledge()

        } catch (Exception e) {
            log.error "Failed to send shipping email: ${e.message}"
        }
    }

    private void sendEmail(Map params) {
        // Simulate email sending
        log.info """
            ========== EMAIL ==========
            To: ${params.to}
            Subject: ${params.subject}
            ---
            ${params.body}
            ===========================
        """.stripIndent()

        // Simulate external API call
        sleep(100)
    }
}
```

### Analytics Event Consumer

```groovy
package com.example.eventdriven.consumer

import com.example.eventdriven.event.OrderPlacedEvent
import com.example.eventdriven.event.PaymentProcessedEvent
import groovy.transform.CompileStatic
import groovy.util.logging.Slf4j
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.stereotype.Component

import java.util.concurrent.ConcurrentHashMap

@Slf4j
@CompileStatic
@Component
class AnalyticsEventConsumer {
    private final Map<String, Integer> orderCountByCustomer = new ConcurrentHashMap<>()
    private final Map<String, BigDecimal> revenueByCustomer = new ConcurrentHashMap<>()
    private final Map<String, Integer> paymentStatusCounts = new ConcurrentHashMap<>()

    @KafkaListener(topics = ['order-placed'], groupId = 'analytics-service')
    void trackOrderPlaced(OrderPlacedEvent event) {
        log.info "Tracking OrderPlaced event: ${event.orderId}"

        // Groovy's getOrDefault with closure
        orderCountByCustomer.merge(event.customerId, 1) { old, inc -> old + inc }
        revenueByCustomer.merge(event.customerId, event.totalAmount) { old, inc -> old + inc }

        log.info """
            Analytics Updated:
              Customer: ${event.customerId}
              Total Orders: ${orderCountByCustomer[event.customerId]}
              Total Revenue: \$${revenueByCustomer[event.customerId]}
        """.stripIndent()
    }

    @KafkaListener(topics = ['payment-processed'], groupId = 'analytics-service')
    void trackPaymentProcessed(PaymentProcessedEvent event) {
        log.info "Tracking PaymentProcessed event: ${event.paymentId}"

        String status = event.status.toString()
        paymentStatusCounts.merge(status, 1) { old, inc -> old + inc }

        log.info "Payment stats: ${paymentStatusCounts}"
    }

    // Groovy method to get analytics report
    Map<String, Object> getAnalyticsReport() {
        [
            totalCustomers: orderCountByCustomer.size(),
            totalOrders: orderCountByCustomer.values().sum() ?: 0,
            totalRevenue: revenueByCustomer.values().sum() ?: BigDecimal.ZERO,
            customerStats: orderCountByCustomer.collect { customerId, count ->
                [
                    customerId: customerId,
                    orderCount: count,
                    revenue: revenueByCustomer[customerId]
                ]
            },
            paymentStats: paymentStatusCounts
        ]
    }
}
```

### Inventory Event Consumer

```groovy
package com.example.eventdriven.consumer

import com.example.eventdriven.event.OrderPlacedEvent
import groovy.transform.CompileStatic
import groovy.util.logging.Slf4j
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Component

import java.util.concurrent.ConcurrentHashMap

@Slf4j
@CompileStatic
@Component
class InventoryEventConsumer {
    private final Map<String, Integer> inventory = new ConcurrentHashMap<>()
    private final KafkaTemplate<String, Object> kafkaTemplate

    InventoryEventConsumer(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate

        // Initialize inventory
        inventory.put('PROD001', 100)
        inventory.put('PROD002', 50)
        inventory.put('PROD003', 75)
    }

    @KafkaListener(topics = ['order-placed'], groupId = 'inventory-service')
    void reserveInventory(OrderPlacedEvent event) {
        log.info "Reserving inventory for order: ${event.orderId}"

        try {
            // Check and reserve inventory for all items
            boolean allAvailable = event.items.every { item ->
                inventory.getOrDefault(item.productId, 0) >= item.quantity
            }

            if (allAvailable) {
                // Reserve inventory using Groovy's each
                event.items.each { item ->
                    inventory.merge(item.productId, -item.quantity) { old, dec -> old + dec }
                }

                kafkaTemplate.send('inventory-reserved', [
                    orderId: event.orderId,
                    success: true,
                    items: event.items
                ])

                log.info "Inventory reserved for order: ${event.orderId}"
                log.info "Current inventory: ${inventory}"

            } else {
                kafkaTemplate.send('inventory-failed', [
                    orderId: event.orderId,
                    success: false,
                    reason: 'Insufficient inventory'
                ])

                log.warn "Insufficient inventory for order: ${event.orderId}"
            }

        } catch (Exception e) {
            log.error "Error reserving inventory for order ${event.orderId}: ${e.message}"
            kafkaTemplate.send('inventory-failed', [
                orderId: event.orderId,
                success: false,
                reason: e.message
            ])
        }
    }
}
```

---

## Message Broker Configuration (Kafka)

### Kafka Producer Config

```groovy
package com.example.eventdriven.config

import groovy.transform.CompileStatic
import org.apache.kafka.clients.producer.ProducerConfig
import org.apache.kafka.common.serialization.StringSerializer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.kafka.core.DefaultKafkaProducerFactory
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.kafka.core.ProducerFactory
import org.springframework.kafka.support.serializer.JsonSerializer

@CompileStatic
@Configuration
class KafkaProducerConfig {

    @Bean
    ProducerFactory<String, Object> producerFactory() {
        // Groovy map syntax for clean configuration
        Map<String, Object> config = [
            (ProducerConfig.BOOTSTRAP_SERVERS_CONFIG): 'localhost:9092',
            (ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG): StringSerializer,
            (ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG): JsonSerializer,
            (ProducerConfig.ACKS_CONFIG): 'all',
            (ProducerConfig.RETRIES_CONFIG): 3,
            (ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION): 1,
            (ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG): true,
            (ProducerConfig.COMPRESSION_TYPE_CONFIG): 'snappy'
        ]

        new DefaultKafkaProducerFactory<>(config)
    }

    @Bean
    KafkaTemplate<String, Object> kafkaTemplate() {
        new KafkaTemplate<>(producerFactory())
    }
}
```

### Kafka Consumer Config

```groovy
package com.example.eventdriven.config

import groovy.transform.CompileStatic
import org.apache.kafka.clients.consumer.ConsumerConfig
import org.apache.kafka.common.serialization.StringDeserializer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory
import org.springframework.kafka.core.ConsumerFactory
import org.springframework.kafka.core.DefaultKafkaConsumerFactory
import org.springframework.kafka.listener.ContainerProperties
import org.springframework.kafka.support.serializer.JsonDeserializer

@CompileStatic
@Configuration
class KafkaConsumerConfig {

    @Bean
    ConsumerFactory<String, Object> consumerFactory() {
        Map<String, Object> config = [
            (ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG): 'localhost:9092',
            (ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG): StringDeserializer,
            (ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG): JsonDeserializer,
            (ConsumerConfig.AUTO_OFFSET_RESET_CONFIG): 'earliest',
            (ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG): false,
            (ConsumerConfig.MAX_POLL_RECORDS_CONFIG): 10,
            (JsonDeserializer.TRUSTED_PACKAGES): '*',
            (JsonDeserializer.USE_TYPE_INFO_HEADERS): false
        ]

        new DefaultKafkaConsumerFactory<>(config)
    }

    @Bean
    ConcurrentKafkaListenerContainerFactory<String, Object> kafkaListenerContainerFactory() {
        def factory = new ConcurrentKafkaListenerContainerFactory<String, Object>()
        factory.consumerFactory = consumerFactory()
        factory.containerProperties.ackMode = ContainerProperties.AckMode.MANUAL
        factory.concurrency = 3
        factory
    }
}
```

### Kafka Topic Config

```groovy
package com.example.eventdriven.config

import groovy.transform.CompileStatic
import org.apache.kafka.clients.admin.NewTopic
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.kafka.config.TopicBuilder

@CompileStatic
@Configuration
class KafkaTopicConfig {

    @Bean
    NewTopic orderPlacedTopic() {
        TopicBuilder.name('order-placed')
            .partitions(3)
            .replicas(1)
            .build()
    }

    @Bean
    NewTopic paymentProcessedTopic() {
        TopicBuilder.name('payment-processed')
            .partitions(3)
            .replicas(1)
            .build()
    }

    @Bean
    NewTopic orderShippedTopic() {
        TopicBuilder.name('order-shipped')
            .partitions(3)
            .replicas(1)
            .build()
    }

    @Bean
    NewTopic inventoryReservedTopic() {
        TopicBuilder.name('inventory-reserved')
            .partitions(3)
            .replicas(1)
            .build()
    }

    @Bean
    NewTopic deadLetterTopic() {
        TopicBuilder.name('dead-letter-queue')
            .partitions(1)
            .replicas(1)
            .build()
    }
}
```

---

## Guaranteed Delivery Patterns

### Outbox Pattern

```groovy
package com.example.eventdriven.outbox

import groovy.transform.Canonical
import groovy.transform.CompileStatic
import jakarta.persistence.*

import java.time.LocalDateTime

@CompileStatic
@Canonical
@Entity
@Table(name = 'outbox_events')
class OutboxEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id

    String eventId
    String eventType
    String aggregateId

    @Column(columnDefinition = 'TEXT')
    String payload

    @Enumerated(EnumType.STRING)
    OutboxStatus status = OutboxStatus.PENDING

    LocalDateTime createdAt = LocalDateTime.now()
    LocalDateTime processedAt

    Integer retryCount = 0
    LocalDateTime nextRetryAt

    enum OutboxStatus {
        PENDING, PUBLISHED, FAILED
    }
}
```

### Outbox Relay

```groovy
package com.example.eventdriven.outbox

import com.fasterxml.jackson.databind.ObjectMapper
import groovy.transform.CompileStatic
import groovy.util.logging.Slf4j
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

import java.time.LocalDateTime

@Slf4j
@CompileStatic
@Component
class OutboxRelay {
    private final OutboxRepository outboxRepository
    private final KafkaTemplate<String, Object> kafkaTemplate
    private final ObjectMapper objectMapper

    OutboxRelay(OutboxRepository outboxRepository,
                KafkaTemplate<String, Object> kafkaTemplate,
                ObjectMapper objectMapper) {
        this.outboxRepository = outboxRepository
        this.kafkaTemplate = kafkaTemplate
        this.objectMapper = objectMapper
    }

    @Scheduled(fixedDelay = 5000L) // Every 5 seconds
    @Transactional
    void relayPendingEvents() {
        List<OutboxEvent> pendingEvents = outboxRepository
            .findByStatusAndNextRetryAtBefore(
                OutboxEvent.OutboxStatus.PENDING,
                LocalDateTime.now()
            )

        if (pendingEvents) {
            log.info "Relaying ${pendingEvents.size()} pending events"

            pendingEvents.each { event ->
                try {
                    // Parse and publish event
                    Map eventData = objectMapper.readValue(event.payload, Map)
                    kafkaTemplate.send(event.eventType, event.eventId, eventData).get()

                    // Mark as published
                    event.status = OutboxEvent.OutboxStatus.PUBLISHED
                    event.processedAt = LocalDateTime.now()
                    outboxRepository.save(event)

                    log.info "Published event: ${event.eventId}"

                } catch (Exception e) {
                    log.error "Failed to publish event ${event.eventId}: ${e.message}"

                    event.retryCount++
                    event.nextRetryAt = calculateNextRetry(event.retryCount)

                    if (event.retryCount >= 5) {
                        event.status = OutboxEvent.OutboxStatus.FAILED
                    }

                    outboxRepository.save(event)
                }
            }
        }
    }

    private LocalDateTime calculateNextRetry(int retryCount) {
        // Exponential backoff: 2^retryCount minutes
        int delayMinutes = Math.pow(2, retryCount) as int
        LocalDateTime.now().plusMinutes(delayMinutes)
    }
}
```

---

## Exactly-Once Processing

### Idempotent Consumer

```groovy
package com.example.eventdriven.consumer

import groovy.transform.CompileStatic
import groovy.util.logging.Slf4j
import jakarta.persistence.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Component
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

import java.time.LocalDateTime

@CompileStatic
@Entity
@Table(name = 'processed_events')
class ProcessedEvent {
    @Id
    String eventId

    String eventType
    LocalDateTime processedAt = LocalDateTime.now()
}

@Repository
interface ProcessedEventRepository extends JpaRepository<ProcessedEvent, String> {
    boolean existsByEventId(String eventId)
}

@Slf4j
@CompileStatic
@Component
class IdempotentEventProcessor {
    private final ProcessedEventRepository repository

    IdempotentEventProcessor(ProcessedEventRepository repository) {
        this.repository = repository
    }

    @Transactional
    boolean processOnce(String eventId, String eventType, Closure<Void> processor) {
        if (repository.existsByEventId(eventId)) {
            log.warn "Event ${eventId} already processed, skipping"
            return false
        }

        try {
            // Execute business logic
            processor.call()

            // Record processing
            repository.save(new ProcessedEvent(
                eventId: eventId,
                eventType: eventType
            ))

            log.info "Event ${eventId} processed successfully"
            return true

        } catch (Exception e) {
            log.error "Failed to process event ${eventId}: ${e.message}"
            throw e
        }
    }
}
```

---

## Dead Letter Queue

### Dead Letter Handler

```groovy
package com.example.eventdriven.dlq

import groovy.transform.CompileStatic
import groovy.util.logging.Slf4j
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Component

@Slf4j
@CompileStatic
@Component
class DeadLetterHandler {
    private final KafkaTemplate<String, Object> kafkaTemplate

    DeadLetterHandler(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate
    }

    void sendToDeadLetterQueue(String originalTopic, Object event, Exception error) {
        log.error "Sending event to DLQ. Original topic: ${originalTopic}, Error: ${error.message}"

        def dlqMessage = [
            originalTopic: originalTopic,
            event: event,
            error: error.message,
            stackTrace: error.stackTrace.collect { it.toString() },
            timestamp: System.currentTimeMillis()
        ]

        kafkaTemplate.send('dead-letter-queue', dlqMessage)
    }

    @KafkaListener(topics = ['dead-letter-queue'], groupId = 'dlq-handler')
    void handleDeadLetter(Map<String, Object> dlqMessage) {
        log.warn """
            Dead Letter Queue Message:
              Original Topic: ${dlqMessage.originalTopic}
              Error: ${dlqMessage.error}
              Timestamp: ${dlqMessage.timestamp}
        """.stripIndent()

        // Store in database for manual investigation
        // Alert operations team
    }
}
```

---

## Event Schema Evolution

### Versioned Events

```groovy
package com.example.eventdriven.event

import groovy.transform.Canonical
import groovy.transform.CompileStatic

@CompileStatic
@Canonical
class OrderPlacedEventV2 implements DomainEvent {
    final String eventId = UUID.randomUUID().toString()
    final String eventType = 'OrderPlaced'
    final Instant timestamp = Instant.now()
    final long version = 2  // Schema version

    // Original fields
    final String orderId
    final String customerId
    final String customerEmail
    final List<OrderItem> items
    final BigDecimal totalAmount

    // New fields in V2
    final String promoCode
    final BigDecimal discount
    final String preferredDeliveryDate

    // Backward compatibility constructor
    static OrderPlacedEventV2 fromV1(OrderPlacedEvent v1Event) {
        new OrderPlacedEventV2(
            orderId: v1Event.orderId,
            customerId: v1Event.customerId,
            customerEmail: v1Event.customerEmail,
            items: v1Event.items,
            totalAmount: v1Event.totalAmount,
            promoCode: null,
            discount: BigDecimal.ZERO,
            preferredDeliveryDate: null
        )
    }
}
```

---

## Testing with Spock

### Event Producer Tests

```groovy
package com.example.eventdriven.producer

import com.example.eventdriven.event.OrderPlacedEvent
import org.springframework.kafka.core.KafkaTemplate
import spock.lang.Specification
import spock.lang.Subject

class KafkaEventPublisherSpec extends Specification {

    KafkaTemplate<String, Object> kafkaTemplate = Mock()

    @Subject
    KafkaEventPublisher publisher = new KafkaEventPublisher(kafkaTemplate)

    def "should publish event asynchronously"() {
        given:
        def event = new OrderPlacedEvent(
            orderId: 'ORD001',
            customerId: 'CUST001',
            customerEmail: 'customer@example.com',
            items: [],
            totalAmount: 99.99
        )

        when:
        publisher.publishAsync('order-placed', event)

        then:
        1 * kafkaTemplate.send('order-placed', event.eventId, event)
    }
}
```

### Event Consumer Tests

```groovy
package com.example.eventdriven.consumer

import com.example.eventdriven.event.OrderPlacedEvent
import org.springframework.kafka.support.Acknowledgment
import spock.lang.Specification
import spock.lang.Subject

class EmailEventConsumerSpec extends Specification {

    @Subject
    EmailEventConsumer consumer = new EmailEventConsumer()

    Acknowledgment ack = Mock()

    def "should send email on order placed"() {
        given:
        def event = new OrderPlacedEvent(
            orderId: 'ORD001',
            customerId: 'CUST001',
            customerEmail: 'test@example.com',
            items: [
                new OrderPlacedEvent.OrderItem(
                    productId: 'PROD001',
                    productName: 'Test Product',
                    quantity: 2,
                    price: 49.99
                )
            ],
            totalAmount: 99.98
        )

        when:
        consumer.handleOrderPlaced(event, ack)

        then:
        1 * ack.acknowledge()
        noExceptionThrown()
    }

    def "should handle duplicate events idempotently"() {
        given:
        def event = new OrderPlacedEvent(
            orderId: 'ORD002',
            customerId: 'CUST002',
            customerEmail: 'test@example.com',
            items: [],
            totalAmount: 50.00
        )

        when:
        consumer.handleOrderPlaced(event, ack)
        consumer.handleOrderPlaced(event, ack) // Duplicate

        then:
        2 * ack.acknowledge()
    }
}
```

---

## Running the Example

### Start Kafka

```bash
# Start Zookeeper
docker run -d --name zookeeper -p 2181:2181 zookeeper:3.8

# Start Kafka
docker run -d --name kafka -p 9092:9092 \
  -e KAFKA_ZOOKEEPER_CONNECT=localhost:2181 \
  -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 \
  wurstmeister/kafka:2.13-2.8.1
```

### build.gradle

```groovy
plugins {
    id 'groovy'
    id 'org.springframework.boot' version '3.2.0'
}

dependencies {
    implementation 'org.apache.groovy:groovy:4.0.15'
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.kafka:spring-kafka'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    runtimeOnly 'com.h2database:h2'

    testImplementation 'org.spockframework:spock-core:2.3-groovy-4.0'
    testImplementation 'org.springframework.kafka:spring-kafka-test'
}
```

### Run Application

```bash
./gradlew bootRun
```

### Test Events

```bash
# Publish order event
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUST001",
    "customerEmail": "customer@example.com",
    "items": [
      {"productId": "PROD001", "productName": "Widget", "quantity": 2, "price": 49.99}
    ],
    "totalAmount": 99.98
  }'
```

---

## Key Takeaways

1. **Asynchronous Communication** - Events decouple producers and consumers
2. **Groovy Conciseness** - 40% less code with @Canonical and closures
3. **Idempotency** - Exactly-once processing with event tracking
4. **Dead Letter Queue** - Handles failed message processing
5. **Outbox Pattern** - Guaranteed event delivery
6. **Spock Testing** - Expressive event-driven tests
7. **Schema Evolution** - Backward-compatible event versions

**Groovy Advantages for Event-Driven:**
- **@Canonical** reduces event boilerplate
- **Closures** for flexible event handlers
- **with()** for cleaner event validation
- **stripIndent()** for readable multiline strings
- **Map syntax** for clean Kafka configuration

---

**Related Guides:**
- [Deep Dive: Event-Driven Architecture](../../../3-design/architecture-pattern/deep-dive-event-driven.md)
- [Deep Dive: Microservices](../../../3-design/architecture-pattern/deep-dive-microservices.md)
- [Groovy Setup Guide](../groovy/project-setup.md)

*Last Updated: 2025-10-20*
