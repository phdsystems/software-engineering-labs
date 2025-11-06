# Event-Driven Architecture - Java Implementation

**Pattern:** Event-Driven Architecture
**Language:** Java
**Framework:** Spring Boot 3.x, Apache Kafka
**Related Guide:** [Deep Dive: Event-Driven Architecture](../../../3-design/architecture-pattern/deep-dive-event-driven.md)

## TL;DR

**Complete Event-Driven Architecture** where components communicate via asynchronous events. **Key principle**: Producers emit events → message broker → consumers react independently. **Critical components**: Event producers (publish & forget) → Kafka topics → event consumers (async processing) → guaranteed delivery → exactly-once semantics → Dead Letter Queue.

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
11. [Testing](#testing)
12. [Running the Example](#running-the-example)

---

## Overview

This example demonstrates Event-Driven Architecture for an e-commerce system with:

- **Event Producers** - Order Service, Payment Service
- **Message Broker** - Apache Kafka
- **Event Consumers** - Email Service, Analytics Service, Inventory Service
- **Patterns** - At-least-once delivery, Idempotency, DLQ
- **Events** - OrderPlaced, PaymentProcessed, OrderShipped

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
└── src/main/java/com/example/eventdriven/
    ├── event/
    │   ├── DomainEvent.java
    │   ├── OrderPlacedEvent.java
    │   ├── PaymentProcessedEvent.java
    │   └── OrderShippedEvent.java
    │
    ├── producer/
    │   ├── EventPublisher.java
    │   └── OrderEventPublisher.java
    │
    ├── consumer/
    │   ├── EmailEventConsumer.java
    │   ├── AnalyticsEventConsumer.java
    │   └── InventoryEventConsumer.java
    │
    ├── config/
    │   ├── KafkaProducerConfig.java
    │   ├── KafkaConsumerConfig.java
    │   └── KafkaTopicConfig.java
    │
    ├── service/
    │   ├── OrderService.java
    │   └── PaymentService.java
    │
    ├── outbox/
    │   ├── OutboxEvent.java
    │   ├── OutboxRepository.java
    │   └── OutboxRelay.java
    │
    └── dlq/
        ├── DeadLetterHandler.java
        └── RetryPolicy.java
```

---

## Domain Events

### Base Event Interface

```java
package com.example.eventdriven.event;

import java.time.Instant;

/**
 * Base domain event interface
 */
public interface DomainEvent {
    String getEventId();
    String getEventType();
    Instant getTimestamp();
    long getVersion();
}
```

### Order Events

```java
package com.example.eventdriven.event;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * OrderPlaced Event - Published when customer places an order
 */
public record OrderPlacedEvent(
    @JsonProperty("eventId") String eventId,
    @JsonProperty("eventType") String eventType,
    @JsonProperty("timestamp") Instant timestamp,
    @JsonProperty("version") long version,
    @JsonProperty("orderId") String orderId,
    @JsonProperty("customerId") String customerId,
    @JsonProperty("customerEmail") String customerEmail,
    @JsonProperty("items") List<OrderItem> items,
    @JsonProperty("totalAmount") BigDecimal totalAmount
) implements DomainEvent {

    @JsonCreator
    public OrderPlacedEvent(
        @JsonProperty("orderId") String orderId,
        @JsonProperty("customerId") String customerId,
        @JsonProperty("customerEmail") String customerEmail,
        @JsonProperty("items") List<OrderItem> items,
        @JsonProperty("totalAmount") BigDecimal totalAmount
    ) {
        this(
            UUID.randomUUID().toString(),
            "OrderPlaced",
            Instant.now(),
            1,
            orderId,
            customerId,
            customerEmail,
            items,
            totalAmount
        );
    }

    public record OrderItem(
        @JsonProperty("productId") String productId,
        @JsonProperty("productName") String productName,
        @JsonProperty("quantity") int quantity,
        @JsonProperty("price") BigDecimal price
    ) {}

    @Override
    public String getEventId() {
        return eventId;
    }

    @Override
    public String getEventType() {
        return eventType;
    }

    @Override
    public Instant getTimestamp() {
        return timestamp;
    }

    @Override
    public long getVersion() {
        return version;
    }
}

/**
 * PaymentProcessed Event
 */
public record PaymentProcessedEvent(
    @JsonProperty("eventId") String eventId,
    @JsonProperty("eventType") String eventType,
    @JsonProperty("timestamp") Instant timestamp,
    @JsonProperty("version") long version,
    @JsonProperty("orderId") String orderId,
    @JsonProperty("paymentId") String paymentId,
    @JsonProperty("amount") BigDecimal amount,
    @JsonProperty("paymentMethod") String paymentMethod,
    @JsonProperty("status") String status
) implements DomainEvent {

    public PaymentProcessedEvent(String orderId, String paymentId,
                                BigDecimal amount, String paymentMethod,
                                String status) {
        this(
            UUID.randomUUID().toString(),
            "PaymentProcessed",
            Instant.now(),
            1,
            orderId,
            paymentId,
            amount,
            paymentMethod,
            status
        );
    }

    @Override
    public String getEventId() {
        return eventId;
    }

    @Override
    public String getEventType() {
        return eventType;
    }

    @Override
    public Instant getTimestamp() {
        return timestamp;
    }

    @Override
    public long getVersion() {
        return version;
    }
}

/**
 * OrderShipped Event
 */
public record OrderShippedEvent(
    @JsonProperty("eventId") String eventId,
    @JsonProperty("eventType") String eventType,
    @JsonProperty("timestamp") Instant timestamp,
    @JsonProperty("version") long version,
    @JsonProperty("orderId") String orderId,
    @JsonProperty("trackingNumber") String trackingNumber,
    @JsonProperty("carrier") String carrier
) implements DomainEvent {

    public OrderShippedEvent(String orderId, String trackingNumber, String carrier) {
        this(
            UUID.randomUUID().toString(),
            "OrderShipped",
            Instant.now(),
            1,
            orderId,
            trackingNumber,
            carrier
        );
    }

    @Override
    public String getEventId() {
        return eventId;
    }

    @Override
    public String getEventType() {
        return eventType;
    }

    @Override
    public Instant getTimestamp() {
        return timestamp;
    }

    @Override
    public long getVersion() {
        return version;
    }
}
```

---

## Event Producer

### Event Publisher Interface

```java
package com.example.eventdriven.producer;

import com.example.eventdriven.event.DomainEvent;

import java.util.concurrent.CompletableFuture;

/**
 * Event Publisher - Abstraction over message broker
 */
public interface EventPublisher {
    /**
     * Publish event asynchronously (fire and forget)
     */
    void publishAsync(String topic, DomainEvent event);

    /**
     * Publish event with callback
     */
    CompletableFuture<Void> publishWithCallback(String topic, DomainEvent event);

    /**
     * Publish event synchronously (wait for acknowledgment)
     */
    void publishSync(String topic, DomainEvent event);
}
```

### Kafka Event Publisher

```java
package com.example.eventdriven.producer;

import com.example.eventdriven.event.DomainEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

/**
 * Kafka-based event publisher
 */
@Component
public class KafkaEventPublisher implements EventPublisher {
    private static final Logger log = LoggerFactory.getLogger(KafkaEventPublisher.class);

    private final KafkaTemplate<String, DomainEvent> kafkaTemplate;

    public KafkaEventPublisher(KafkaTemplate<String, DomainEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    @Override
    public void publishAsync(String topic, DomainEvent event) {
        kafkaTemplate.send(topic, event.getEventId(), event)
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Failed to publish event {} to topic {}: {}",
                        event.getEventId(), topic, ex.getMessage());
                } else {
                    log.info("Published event {} to topic {} at offset {}",
                        event.getEventId(), topic, result.getRecordMetadata().offset());
                }
            });
    }

    @Override
    public CompletableFuture<Void> publishWithCallback(String topic, DomainEvent event) {
        CompletableFuture<SendResult<String, DomainEvent>> future =
            kafkaTemplate.send(topic, event.getEventId(), event);

        return future.thenApply(result -> {
            log.info("Published event {} to partition {} at offset {}",
                event.getEventId(),
                result.getRecordMetadata().partition(),
                result.getRecordMetadata().offset());
            return null;
        }).exceptionally(ex -> {
            log.error("Failed to publish event {}: {}", event.getEventId(), ex.getMessage());
            throw new EventPublishException("Failed to publish event", ex);
        });
    }

    @Override
    public void publishSync(String topic, DomainEvent event) {
        try {
            SendResult<String, DomainEvent> result =
                kafkaTemplate.send(topic, event.getEventId(), event).get();

            log.info("Published event {} synchronously at offset {}",
                event.getEventId(), result.getRecordMetadata().offset());
        } catch (Exception e) {
            log.error("Failed to publish event synchronously: {}", e.getMessage());
            throw new EventPublishException("Failed to publish event", e);
        }
    }

    public static class EventPublishException extends RuntimeException {
        public EventPublishException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
```

### Order Event Publisher

```java
package com.example.eventdriven.producer;

import com.example.eventdriven.event.OrderPlacedEvent;
import org.springframework.stereotype.Component;

/**
 * Domain-specific event publisher
 */
@Component
public class OrderEventPublisher {
    private static final String ORDER_TOPIC = "order-events";

    private final EventPublisher eventPublisher;

    public OrderEventPublisher(EventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    public void publishOrderPlaced(OrderPlacedEvent event) {
        eventPublisher.publishAsync(ORDER_TOPIC, event);
    }

    public void publishOrderPlacedWithConfirmation(OrderPlacedEvent event) {
        eventPublisher.publishWithCallback(ORDER_TOPIC, event)
            .thenRun(() -> {
                // Update order status in database
                System.out.println("Order event published successfully: " + event.orderId());
            })
            .exceptionally(ex -> {
                // Handle failure (retry, compensate, alert)
                System.err.println("Failed to publish order event: " + ex.getMessage());
                return null;
            });
    }
}
```

---

## Event Consumer

### Email Event Consumer

```java
package com.example.eventdriven.consumer;

import com.example.eventdriven.event.OrderPlacedEvent;
import com.example.eventdriven.event.OrderShippedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

/**
 * Email Service - Sends notifications
 */
@Component
public class EmailEventConsumer {
    private static final Logger log = LoggerFactory.getLogger(EmailEventConsumer.class);

    @KafkaListener(
        topics = "order-events",
        groupId = "email-service",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleOrderPlaced(
            @Payload OrderPlacedEvent event,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset,
            Acknowledgment acknowledgment) {

        log.info("Received OrderPlaced event {} from partition {} at offset {}",
            event.getEventId(), partition, offset);

        try {
            // Send order confirmation email
            sendOrderConfirmationEmail(event);

            // Manual acknowledgment (ensures at-least-once delivery)
            acknowledgment.acknowledge();

            log.info("Successfully processed OrderPlaced event {}", event.getEventId());

        } catch (Exception e) {
            log.error("Failed to process OrderPlaced event {}: {}",
                event.getEventId(), e.getMessage());
            // Don't acknowledge - message will be redelivered
            throw e;
        }
    }

    @KafkaListener(
        topics = "shipping-events",
        groupId = "email-service"
    )
    public void handleOrderShipped(@Payload OrderShippedEvent event) {
        log.info("Received OrderShipped event {}", event.getEventId());

        // Send shipping notification email
        sendShippingNotificationEmail(event);
    }

    private void sendOrderConfirmationEmail(OrderPlacedEvent event) {
        // Simulate email sending
        log.info("Sending order confirmation email to {} for order {}",
            event.customerEmail(), event.orderId());

        // In real implementation, call email service (SendGrid, AWS SES, etc.)
        try {
            Thread.sleep(100); // Simulate network call
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private void sendShippingNotificationEmail(OrderShippedEvent event) {
        log.info("Sending shipping notification for order {} with tracking {}",
            event.orderId(), event.trackingNumber());
    }
}
```

### Analytics Event Consumer

```java
package com.example.eventdriven.consumer;

import com.example.eventdriven.event.OrderPlacedEvent;
import com.example.eventdriven.event.PaymentProcessedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Analytics Service - Tracks metrics and business intelligence
 */
@Component
public class AnalyticsEventConsumer {
    private static final Logger log = LoggerFactory.getLogger(AnalyticsEventConsumer.class);

    @KafkaListener(
        topics = {"order-events", "payment-events"},
        groupId = "analytics-service"
    )
    public void handleEvent(Object event) {
        switch (event) {
            case OrderPlacedEvent orderEvent -> trackOrderPlaced(orderEvent);
            case PaymentProcessedEvent paymentEvent -> trackPaymentProcessed(paymentEvent);
            default -> log.warn("Unknown event type: {}", event.getClass());
        }
    }

    private void trackOrderPlaced(OrderPlacedEvent event) {
        log.info("Analytics: Order placed - Customer: {}, Total: {}",
            event.customerId(), event.totalAmount());

        // Track metrics
        // - Total revenue
        // - Orders per customer
        // - Product popularity
        // - Average order value
    }

    private void trackPaymentProcessed(PaymentProcessedEvent event) {
        log.info("Analytics: Payment processed - Order: {}, Method: {}, Status: {}",
            event.orderId(), event.paymentMethod(), event.status());

        // Track metrics
        // - Payment success rate
        // - Payment method distribution
        // - Processing time
    }
}
```

### Inventory Event Consumer (with Idempotency)

```java
package com.example.eventdriven.consumer;

import com.example.eventdriven.event.OrderPlacedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Inventory Service - Reserves stock (with idempotency)
 */
@Component
public class InventoryEventConsumer {
    private static final Logger log = LoggerFactory.getLogger(InventoryEventConsumer.class);

    // Track processed events for idempotency (in production, use database)
    private final Set<String> processedEvents = ConcurrentHashMap.newKeySet();

    @KafkaListener(
        topics = "order-events",
        groupId = "inventory-service"
    )
    public void handleOrderPlaced(OrderPlacedEvent event) {
        // Idempotency check
        if (processedEvents.contains(event.getEventId())) {
            log.info("Event {} already processed, skipping", event.getEventId());
            return;
        }

        log.info("Received OrderPlaced event {}", event.getEventId());

        try {
            // Reserve inventory for each item
            for (var item : event.items()) {
                reserveStock(item.productId(), item.quantity());
            }

            // Mark as processed
            processedEvents.add(event.getEventId());

            log.info("Successfully reserved inventory for order {}", event.orderId());

        } catch (Exception e) {
            log.error("Failed to reserve inventory for order {}: {}",
                event.orderId(), e.getMessage());
            throw e;
        }
    }

    private void reserveStock(String productId, int quantity) {
        log.info("Reserving {} units of product {}", quantity, productId);
        // Update inventory database
    }
}
```

---

## Message Broker Configuration (Kafka)

### Producer Configuration

```java
package com.example.eventdriven.config;

import com.example.eventdriven.event.DomainEvent;
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
    public ProducerFactory<String, DomainEvent> producerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);

        // Reliability settings
        config.put(ProducerConfig.ACKS_CONFIG, "all");  // Wait for all replicas
        config.put(ProducerConfig.RETRIES_CONFIG, 3);
        config.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 1);  // Ordering guarantee
        config.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);  // Exactly-once

        // Performance settings
        config.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "snappy");
        config.put(ProducerConfig.BATCH_SIZE_CONFIG, 16384);
        config.put(ProducerConfig.LINGER_MS_CONFIG, 10);

        return new DefaultKafkaProducerFactory<>(config);
    }

    @Bean
    public KafkaTemplate<String, DomainEvent> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }
}
```

### Consumer Configuration

```java
package com.example.eventdriven.config;

import com.example.eventdriven.event.DomainEvent;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.listener.ContainerProperties;
import org.springframework.kafka.support.serializer.JsonDeserializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableKafka
public class KafkaConsumerConfig {

    @Bean
    public ConsumerFactory<String, DomainEvent> consumerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);

        // Consumer group settings
        config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        config.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);  // Manual commit

        // Performance settings
        config.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 100);
        config.put(ConsumerConfig.FETCH_MIN_BYTES_CONFIG, 1024);

        JsonDeserializer<DomainEvent> deserializer = new JsonDeserializer<>(DomainEvent.class);
        deserializer.addTrustedPackages("*");
        deserializer.setUseTypeHeaders(false);

        return new DefaultKafkaConsumerFactory<>(
            config,
            new StringDeserializer(),
            deserializer
        );
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, DomainEvent>
            kafkaListenerContainerFactory() {

        ConcurrentKafkaListenerContainerFactory<String, DomainEvent> factory =
            new ConcurrentKafkaListenerContainerFactory<>();

        factory.setConsumerFactory(consumerFactory());
        factory.setConcurrency(3);  // 3 consumer threads

        // Manual acknowledgment mode (at-least-once delivery)
        factory.getContainerProperties().setAckMode(
            ContainerProperties.AckMode.MANUAL
        );

        return factory;
    }
}
```

### Topic Configuration

```java
package com.example.eventdriven.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    @Bean
    public NewTopic orderEventsTopic() {
        return TopicBuilder.name("order-events")
            .partitions(3)
            .replicas(2)
            .config("retention.ms", "604800000")  // 7 days
            .config("cleanup.policy", "delete")
            .build();
    }

    @Bean
    public NewTopic paymentEventsTopic() {
        return TopicBuilder.name("payment-events")
            .partitions(3)
            .replicas(2)
            .build();
    }

    @Bean
    public NewTopic shippingEventsTopic() {
        return TopicBuilder.name("shipping-events")
            .partitions(3)
            .replicas(2)
            .build();
    }

    @Bean
    public NewTopic deadLetterTopic() {
        return TopicBuilder.name("dead-letter-queue")
            .partitions(1)
            .replicas(2)
            .build();
    }
}
```

---

## Guaranteed Delivery Patterns

### At-Least-Once Delivery

```java
// Producer side: Enable retries and idempotence
config.put(ProducerConfig.ACKS_CONFIG, "all");
config.put(ProducerConfig.RETRIES_CONFIG, 3);
config.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);

// Consumer side: Manual acknowledgment
@KafkaListener(topics = "order-events", groupId = "email-service")
public void handleEvent(OrderPlacedEvent event, Acknowledgment ack) {
    try {
        processEvent(event);
        ack.acknowledge();  // Commit only after successful processing
    } catch (Exception e) {
        // Don't acknowledge - message will be redelivered
        throw e;
    }
}
```

---

## Exactly-Once Processing

### Transactional Outbox Pattern

```java
package com.example.eventdriven.outbox;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Outbox table for transactional event publishing
 */
@Entity
@Table(name = "outbox_events")
public class OutboxEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String aggregateId;
    private String eventType;

    @Column(columnDefinition = "TEXT")
    private String payload;

    private Instant createdAt;
    private boolean published;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAggregateId() { return aggregateId; }
    public void setAggregateId(String aggregateId) { this.aggregateId = aggregateId; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public boolean isPublished() { return published; }
    public void setPublished(boolean published) { this.published = published; }
}
```

### Outbox Relay

```java
package com.example.eventdriven.outbox;

import com.example.eventdriven.producer.EventPublisher;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Outbox Relay - Publishes events from outbox table to Kafka
 */
@Component
public class OutboxRelay {
    private static final Logger log = LoggerFactory.getLogger(OutboxRelay.class);

    private final OutboxRepository outboxRepository;
    private final EventPublisher eventPublisher;
    private final ObjectMapper objectMapper;

    public OutboxRelay(OutboxRepository outboxRepository,
                      EventPublisher eventPublisher,
                      ObjectMapper objectMapper) {
        this.outboxRepository = outboxRepository;
        this.eventPublisher = eventPublisher;
        this.objectMapper = objectMapper;
    }

    @Scheduled(fixedDelay = 1000)  // Every 1 second
    @Transactional
    public void relayEvents() {
        List<OutboxEvent> unpublishedEvents =
            outboxRepository.findByPublishedFalseOrderByCreatedAtAsc();

        for (OutboxEvent outboxEvent : unpublishedEvents) {
            try {
                // Deserialize event
                Class<?> eventClass = Class.forName(outboxEvent.getEventType());
                Object event = objectMapper.readValue(
                    outboxEvent.getPayload(),
                    eventClass
                );

                // Publish to Kafka
                eventPublisher.publishSync("order-events", (com.example.eventdriven.event.DomainEvent) event);

                // Mark as published
                outboxEvent.setPublished(true);
                outboxRepository.save(outboxEvent);

                log.info("Published outbox event {}", outboxEvent.getId());

            } catch (Exception e) {
                log.error("Failed to relay outbox event {}: {}",
                    outboxEvent.getId(), e.getMessage());
            }
        }
    }
}
```

---

## Dead Letter Queue

### Dead Letter Handler

```java
package com.example.eventdriven.dlq;

import com.example.eventdriven.event.DomainEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/**
 * Dead Letter Queue Handler
 */
@Component
public class DeadLetterHandler {
    private static final Logger log = LoggerFactory.getLogger(DeadLetterHandler.class);
    private static final String DLQ_TOPIC = "dead-letter-queue";

    private final KafkaTemplate<String, DomainEvent> kafkaTemplate;

    public DeadLetterHandler(KafkaTemplate<String, DomainEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendToDeadLetterQueue(DomainEvent event, Exception exception) {
        log.error("Sending event {} to DLQ due to: {}",
            event.getEventId(), exception.getMessage());

        kafkaTemplate.send(DLQ_TOPIC, event.getEventId(), event);
    }

    @KafkaListener(topics = "dead-letter-queue", groupId = "dlq-monitor")
    public void monitorDeadLetterQueue(DomainEvent event) {
        log.warn("DLQ: Received failed event {}", event.getEventId());

        // Options:
        // 1. Alert operations team
        // 2. Store in database for manual review
        // 3. Attempt automated recovery
        // 4. Log for investigation
    }
}
```

---

## Testing

### Event Producer Test

```java
package com.example.eventdriven.producer;

import com.example.eventdriven.event.OrderPlacedEvent;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.util.List;

@SpringBootTest
@EmbeddedKafka(partitions = 1, topics = {"order-events"})
@TestPropertySource(properties = {"spring.kafka.bootstrap-servers=${spring.embedded.kafka.brokers}"})
class KafkaEventPublisherTest {

    @Autowired
    private KafkaEventPublisher eventPublisher;

    @Test
    void shouldPublishEvent() {
        OrderPlacedEvent event = new OrderPlacedEvent(
            "ORDER001",
            "CUST001",
            "customer@example.com",
            List.of(),
            BigDecimal.valueOf(100)
        );

        eventPublisher.publishAsync("order-events", event);

        // Verify event was published (use test consumer)
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
mvn spring-boot:run
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

1. **Loose Coupling** - Producers and consumers are independent
2. **Async Communication** - Fire and forget for better performance
3. **Scalability** - Add consumers without changing producers
4. **Reliability** - At-least-once delivery with acknowledgments
5. **Idempotency** - Handle duplicate messages gracefully
6. **Dead Letter Queue** - Isolate failed messages for investigation
7. **Transactional Outbox** - Exactly-once semantics with database transactions

---

**Related Guides:**
- [Deep Dive: Event-Driven Architecture](../../../3-design/architecture-pattern/deep-dive-event-driven.md)
- [Deep Dive: Microservices](../../../3-design/architecture-pattern/deep-dive-microservices.md)
- [Deep Dive: CQRS](../../../3-design/architecture-pattern/deep-dive-cqrs.md)

*Last Updated: 2025-10-20*
