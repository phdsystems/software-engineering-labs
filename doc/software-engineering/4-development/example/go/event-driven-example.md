# Event-Driven Architecture - Go Implementation

**Pattern:** Event-Driven Architecture
**Language:** Go
**Framework:** NATS/Kafka, Standard library
**Related Guide:** [Deep Dive: Event-Driven Architecture](../../../3-design/architecture-pattern/deep-dive-event-driven.md)

## TL;DR

**Complete Event-Driven Architecture in Go** where components communicate via async events with goroutines for concurrent processing. **Key principle**: Producers emit events → message broker → consumers react independently using channels. **Go-idiomatic**: Goroutines for async consumers, channels for backpressure, context for cancellation, structured concurrency. **Critical components**: Event producers (fire & forget) → NATS/Kafka → event consumers (buffered channels) → graceful shutdown → at-least-once delivery.

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Domain Events](#domain-events)
4. [Event Producer](#event-producer)
5. [Event Consumer](#event-consumer)
6. [NATS Implementation](#nats-implementation)
7. [Kafka Implementation](#kafka-implementation)
8. [Concurrency Patterns](#concurrency-patterns)
9. [Testing](#testing)
10. [Running the Example](#running-the-example)

---

## Overview

This example demonstrates Event-Driven Architecture for an e-commerce system with:

- **Event Producers** - Order Service, Payment Service
- **Message Brokers** - NATS (lightweight), Kafka (high-throughput)
- **Event Consumers** - Email Service, Analytics Service, Inventory Service
- **Patterns** - At-least-once delivery, idempotency, worker pools with goroutines

**Architecture:**
```
Order Service → OrderPlaced Event → NATS/Kafka
                                        ↓
                        ┌───────────────┼───────────────┐
                        ↓               ↓               ↓
            Email Service (goroutines) Analytics   Inventory
            (send receipt)             (metrics)   (reserve stock)
```

---

## Project Structure

```
event-driven/
├── cmd/
│   ├── producer/
│   │   └── main.go
│   └── consumer/
│       └── main.go
│
├── event/
│   ├── event.go
│   ├── order_events.go
│   └── payment_events.go
│
├── publisher/
│   ├── publisher.go
│   ├── nats_publisher.go
│   └── kafka_publisher.go
│
├── consumer/
│   ├── email_consumer.go
│   ├── analytics_consumer.go
│   └── inventory_consumer.go
│
├── broker/
│   ├── nats.go
│   └── kafka.go
│
└── worker/
    └── pool.go

go.mod
```

---

## Domain Events

### event/event.go

```go
package event

import (
	"time"

	"github.com/google/uuid"
)

// Event is the base interface for all domain events
type Event interface {
	EventID() string
	EventType() string
	Timestamp() time.Time
	Version() int
}

// BaseEvent contains common event fields
type BaseEvent struct {
	ID        string    `json:"event_id"`
	Type      string    `json:"event_type"`
	Timestamp time.Time `json:"timestamp"`
	Ver       int       `json:"version"`
}

func NewBaseEvent(eventType string) BaseEvent {
	return BaseEvent{
		ID:        uuid.New().String(),
		Type:      eventType,
		Timestamp: time.Now(),
		Ver:       1,
	}
}

func (e BaseEvent) EventID() string       { return e.ID }
func (e BaseEvent) EventType() string     { return e.Type }
func (e BaseEvent) Timestamp() time.Time  { return e.Timestamp }
func (e BaseEvent) Version() int          { return e.Ver }
```

### event/order_events.go

```go
package event

// OrderPlacedEvent is published when order is created
type OrderPlacedEvent struct {
	BaseEvent
	OrderID       string  `json:"order_id"`
	CustomerID    string  `json:"customer_id"`
	CustomerEmail string  `json:"customer_email"`
	Items         []Item  `json:"items"`
	TotalAmount   float64 `json:"total_amount"`
}

// Item represents an order item
type Item struct {
	ProductID   string  `json:"product_id"`
	ProductName string  `json:"product_name"`
	Quantity    int     `json:"quantity"`
	Price       float64 `json:"price"`
}

// NewOrderPlacedEvent creates a new order event
func NewOrderPlacedEvent(orderID, customerID, customerEmail string, items []Item, totalAmount float64) *OrderPlacedEvent {
	return &OrderPlacedEvent{
		BaseEvent:     NewBaseEvent("OrderPlaced"),
		OrderID:       orderID,
		CustomerID:    customerID,
		CustomerEmail: customerEmail,
		Items:         items,
		TotalAmount:   totalAmount,
	}
}

// OrderShippedEvent is published when order ships
type OrderShippedEvent struct {
	BaseEvent
	OrderID        string `json:"order_id"`
	TrackingNumber string `json:"tracking_number"`
	Carrier        string `json:"carrier"`
}

func NewOrderShippedEvent(orderID, trackingNumber, carrier string) *OrderShippedEvent {
	return &OrderShippedEvent{
		BaseEvent:      NewBaseEvent("OrderShipped"),
		OrderID:        orderID,
		TrackingNumber: trackingNumber,
		Carrier:        carrier,
	}
}
```

### event/payment_events.go

```go
package event

// PaymentProcessedEvent is published when payment completes
type PaymentProcessedEvent struct {
	BaseEvent
	OrderID       string  `json:"order_id"`
	PaymentID     string  `json:"payment_id"`
	Amount        float64 `json:"amount"`
	PaymentMethod string  `json:"payment_method"`
	Status        string  `json:"status"` // SUCCESS, FAILED
}

func NewPaymentProcessedEvent(orderID, paymentID string, amount float64, method, status string) *PaymentProcessedEvent {
	return &PaymentProcessedEvent{
		BaseEvent:     NewBaseEvent("PaymentProcessed"),
		OrderID:       orderID,
		PaymentID:     paymentID,
		Amount:        amount,
		PaymentMethod: method,
		Status:        status,
	}
}
```

---

## Event Producer

### publisher/publisher.go

```go
package publisher

import (
	"context"
	"event-driven/event"
)

// EventPublisher is the interface for publishing events
type EventPublisher interface {
	Publish(ctx context.Context, topic string, event event.Event) error
	PublishAsync(ctx context.Context, topic string, event event.Event) <-chan error
	Close() error
}
```

### publisher/nats_publisher.go

```go
package publisher

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"event-driven/event"

	"github.com/nats-io/nats.go"
)

// NATSPublisher publishes events to NATS
type NATSPublisher struct {
	conn *nats.Conn
}

// NewNATSPublisher creates a new NATS publisher
func NewNATSPublisher(url string) (*NATSPublisher, error) {
	nc, err := nats.Connect(url,
		nats.MaxReconnects(-1),
		nats.ReconnectWait(nats.DefaultReconnectWait),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to NATS: %w", err)
	}

	log.Println("Connected to NATS")
	return &NATSPublisher{conn: nc}, nil
}

// Publish synchronously publishes an event
func (p *NATSPublisher) Publish(ctx context.Context, subject string, evt event.Event) error {
	data, err := json.Marshal(evt)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	if err := p.conn.Publish(subject, data); err != nil {
		return fmt.Errorf("failed to publish event: %w", err)
	}

	log.Printf("Published event %s to %s", evt.EventID(), subject)
	return nil
}

// PublishAsync asynchronously publishes an event
func (p *NATSPublisher) PublishAsync(ctx context.Context, subject string, evt event.Event) <-chan error {
	errChan := make(chan error, 1)

	go func() {
		defer close(errChan)

		select {
		case <-ctx.Done():
			errChan <- ctx.Err()
			return
		default:
		}

		err := p.Publish(ctx, subject, evt)
		if err != nil {
			errChan <- err
		}
	}()

	return errChan
}

// Close closes the NATS connection
func (p *NATSPublisher) Close() error {
	p.conn.Close()
	return nil
}
```

### publisher/kafka_publisher.go

```go
package publisher

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"event-driven/event"

	"github.com/segmentio/kafka-go"
)

// KafkaPublisher publishes events to Kafka
type KafkaPublisher struct {
	writer *kafka.Writer
}

// NewKafkaPublisher creates a new Kafka publisher
func NewKafkaPublisher(brokers []string, topic string) *KafkaPublisher {
	writer := &kafka.Writer{
		Addr:     kafka.TCP(brokers...),
		Topic:    topic,
		Balancer: &kafka.LeastBytes{},
		// Reliability settings
		RequiredAcks: kafka.RequireAll,
		MaxAttempts:  3,
		Async:        false, // Synchronous by default
	}

	log.Printf("Created Kafka publisher for topic: %s", topic)
	return &KafkaPublisher{writer: writer}
}

// Publish synchronously publishes an event
func (p *KafkaPublisher) Publish(ctx context.Context, topic string, evt event.Event) error {
	data, err := json.Marshal(evt)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	msg := kafka.Message{
		Key:   []byte(evt.EventID()),
		Value: data,
	}

	if err := p.writer.WriteMessages(ctx, msg); err != nil {
		return fmt.Errorf("failed to write message: %w", err)
	}

	log.Printf("Published event %s to Kafka topic %s", evt.EventID(), topic)
	return nil
}

// PublishAsync asynchronously publishes an event
func (p *KafkaPublisher) PublishAsync(ctx context.Context, topic string, evt event.Event) <-chan error {
	errChan := make(chan error, 1)

	go func() {
		defer close(errChan)
		err := p.Publish(ctx, topic, evt)
		if err != nil {
			errChan <- err
		}
	}()

	return errChan
}

// Close closes the Kafka writer
func (p *KafkaPublisher) Close() error {
	return p.writer.Close()
}
```

---

## Event Consumer

### consumer/email_consumer.go

```go
package consumer

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"event-driven/event"

	"github.com/nats-io/nats.go"
)

// EmailConsumer sends notification emails
type EmailConsumer struct {
	conn         *nats.Conn
	subscription *nats.Subscription
	// Track processed events for idempotency
	processedEvents map[string]bool
}

// NewEmailConsumer creates a new email consumer
func NewEmailConsumer(url, subject string) (*EmailConsumer, error) {
	nc, err := nats.Connect(url)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to NATS: %w", err)
	}

	consumer := &EmailConsumer{
		conn:            nc,
		processedEvents: make(map[string]bool),
	}

	// Subscribe with queue group for load balancing
	sub, err := nc.QueueSubscribe(subject, "email-service", consumer.handleMessage)
	if err != nil {
		nc.Close()
		return nil, fmt.Errorf("failed to subscribe: %w", err)
	}

	consumer.subscription = sub
	log.Printf("Email consumer subscribed to %s", subject)

	return consumer, nil
}

func (c *EmailConsumer) handleMessage(msg *nats.Msg) {
	var evt event.OrderPlacedEvent
	if err := json.Unmarshal(msg.Data, &evt); err != nil {
		log.Printf("Failed to unmarshal event: %v", err)
		return
	}

	// Idempotency check
	if c.processedEvents[evt.EventID()] {
		log.Printf("Event %s already processed, skipping", evt.EventID())
		return
	}

	log.Printf("Received OrderPlaced event: %s", evt.EventID())

	// Send email (simulated)
	if err := c.sendOrderConfirmationEmail(&evt); err != nil {
		log.Printf("Failed to send email: %v", err)
		// In production: move to DLQ or retry
		return
	}

	// Mark as processed
	c.processedEvents[evt.EventID()] = true
	log.Printf("Successfully processed event %s", evt.EventID())
}

func (c *EmailConsumer) sendOrderConfirmationEmail(evt *event.OrderPlacedEvent) error {
	log.Printf("Sending order confirmation email to %s for order %s",
		evt.CustomerEmail, evt.OrderID)

	// Simulate email sending
	time.Sleep(100 * time.Millisecond)

	// In production: call email service (SendGrid, AWS SES, etc.)
	return nil
}

// Close closes the consumer
func (c *EmailConsumer) Close() {
	if c.subscription != nil {
		c.subscription.Unsubscribe()
	}
	if c.conn != nil {
		c.conn.Close()
	}
}
```

### consumer/analytics_consumer.go

```go
package consumer

import (
	"context"
	"encoding/json"
	"log"

	"event-driven/event"
	"event-driven/worker"

	"github.com/nats-io/nats.go"
)

// AnalyticsConsumer tracks metrics using worker pool
type AnalyticsConsumer struct {
	conn       *nats.Conn
	workerPool *worker.Pool
}

// NewAnalyticsConsumer creates a new analytics consumer with worker pool
func NewAnalyticsConsumer(url string, subjects []string, numWorkers int) (*AnalyticsConsumer, error) {
	nc, err := nats.Connect(url)
	if err != nil {
		return nil, err
	}

	// Create worker pool for concurrent processing
	pool := worker.NewPool(numWorkers)
	pool.Start()

	consumer := &AnalyticsConsumer{
		conn:       nc,
		workerPool: pool,
	}

	// Subscribe to multiple subjects
	for _, subject := range subjects {
		_, err := nc.Subscribe(subject, func(msg *nats.Msg) {
			// Submit to worker pool for concurrent processing
			pool.Submit(func() {
				consumer.processEvent(msg.Data)
			})
		})

		if err != nil {
			nc.Close()
			return nil, err
		}

		log.Printf("Analytics consumer subscribed to %s", subject)
	}

	return consumer, nil
}

func (c *AnalyticsConsumer) processEvent(data []byte) {
	var baseEvt event.BaseEvent
	if err := json.Unmarshal(data, &baseEvt); err != nil {
		log.Printf("Failed to unmarshal base event: %v", err)
		return
	}

	switch baseEvt.EventType() {
	case "OrderPlaced":
		var evt event.OrderPlacedEvent
		if err := json.Unmarshal(data, &evt); err != nil {
			log.Printf("Failed to unmarshal OrderPlaced event: %v", err)
			return
		}
		c.trackOrderPlaced(&evt)

	case "PaymentProcessed":
		var evt event.PaymentProcessedEvent
		if err := json.Unmarshal(data, &evt); err != nil {
			log.Printf("Failed to unmarshal PaymentProcessed event: %v", err)
			return
		}
		c.trackPaymentProcessed(&evt)

	default:
		log.Printf("Unknown event type: %s", baseEvt.EventType())
	}
}

func (c *AnalyticsConsumer) trackOrderPlaced(evt *event.OrderPlacedEvent) {
	log.Printf("Analytics: Order placed - Customer: %s, Total: %.2f",
		evt.CustomerID, evt.TotalAmount)

	// Track metrics:
	// - Total revenue
	// - Orders per customer
	// - Product popularity
	// - Average order value
}

func (c *AnalyticsConsumer) trackPaymentProcessed(evt *event.PaymentProcessedEvent) {
	log.Printf("Analytics: Payment processed - Order: %s, Status: %s",
		evt.OrderID, evt.Status)

	// Track metrics:
	// - Payment success rate
	// - Payment method distribution
	// - Processing time
}

// Close closes the consumer
func (c *AnalyticsConsumer) Close() {
	c.workerPool.Stop()
	c.conn.Close()
}
```

### consumer/inventory_consumer.go

```go
package consumer

import (
	"encoding/json"
	"log"
	"sync"

	"event-driven/event"

	"github.com/nats-io/nats.go"
)

// InventoryConsumer reserves stock with idempotency
type InventoryConsumer struct {
	conn            *nats.Conn
	processedEvents sync.Map // Thread-safe map for idempotency
}

// NewInventoryConsumer creates a new inventory consumer
func NewInventoryConsumer(url, subject string) (*InventoryConsumer, error) {
	nc, err := nats.Connect(url)
	if err != nil {
		return nil, err
	}

	consumer := &InventoryConsumer{
		conn: nc,
	}

	_, err = nc.Subscribe(subject, consumer.handleOrderPlaced)
	if err != nil {
		nc.Close()
		return nil, err
	}

	log.Printf("Inventory consumer subscribed to %s", subject)
	return consumer, nil
}

func (c *InventoryConsumer) handleOrderPlaced(msg *nats.Msg) {
	var evt event.OrderPlacedEvent
	if err := json.Unmarshal(msg.Data, &evt); err != nil {
		log.Printf("Failed to unmarshal event: %v", err)
		return
	}

	// Idempotency check using sync.Map (thread-safe)
	if _, loaded := c.processedEvents.LoadOrStore(evt.EventID(), true); loaded {
		log.Printf("Event %s already processed, skipping", evt.EventID())
		return
	}

	log.Printf("Processing OrderPlaced event: %s", evt.EventID())

	// Reserve inventory for each item
	for _, item := range evt.Items {
		c.reserveStock(item.ProductID, item.Quantity)
	}

	log.Printf("Successfully reserved inventory for order %s", evt.OrderID)
}

func (c *InventoryConsumer) reserveStock(productID string, quantity int) {
	log.Printf("Reserving %d units of product %s", quantity, productID)
	// Update inventory database
}

// Close closes the consumer
func (c *InventoryConsumer) Close() {
	c.conn.Close()
}
```

---

## Concurrency Patterns

### worker/pool.go

```go
package worker

import (
	"context"
	"log"
	"sync"
)

// Pool manages a pool of worker goroutines
type Pool struct {
	numWorkers int
	jobs       chan func()
	wg         sync.WaitGroup
	ctx        context.Context
	cancel     context.CancelFunc
}

// NewPool creates a new worker pool
func NewPool(numWorkers int) *Pool {
	ctx, cancel := context.WithCancel(context.Background())
	return &Pool{
		numWorkers: numWorkers,
		jobs:       make(chan func(), 100), // Buffered channel for backpressure
		ctx:        ctx,
		cancel:     cancel,
	}
}

// Start starts the worker pool
func (p *Pool) Start() {
	for i := 0; i < p.numWorkers; i++ {
		p.wg.Add(1)
		go p.worker(i)
	}
	log.Printf("Started worker pool with %d workers", p.numWorkers)
}

func (p *Pool) worker(id int) {
	defer p.wg.Done()

	for {
		select {
		case <-p.ctx.Done():
			log.Printf("Worker %d shutting down", id)
			return
		case job, ok := <-p.jobs:
			if !ok {
				log.Printf("Worker %d: jobs channel closed", id)
				return
			}
			// Execute job
			job()
		}
	}
}

// Submit submits a job to the pool
func (p *Pool) Submit(job func()) {
	select {
	case p.jobs <- job:
		// Job submitted
	case <-p.ctx.Done():
		// Pool is shutting down
		log.Println("Cannot submit job: pool is shutting down")
	}
}

// Stop stops the worker pool gracefully
func (p *Pool) Stop() {
	log.Println("Stopping worker pool...")
	close(p.jobs)      // Stop accepting new jobs
	p.cancel()         // Signal workers to stop
	p.wg.Wait()        // Wait for all workers to finish
	log.Println("Worker pool stopped")
}
```

---

## NATS Implementation

### broker/nats.go

```go
package broker

import (
	"fmt"

	"github.com/nats-io/nats.go"
)

// NATSConfig holds NATS configuration
type NATSConfig struct {
	URL            string
	MaxReconnects  int
	ReconnectWait  int // seconds
}

// ConnectNATS creates a NATS connection
func ConnectNATS(config NATSConfig) (*nats.Conn, error) {
	opts := []nats.Option{
		nats.MaxReconnects(config.MaxReconnects),
	}

	nc, err := nats.Connect(config.URL, opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to NATS: %w", err)
	}

	return nc, nil
}
```

---

## Kafka Implementation

### broker/kafka.go

```go
package broker

import (
	"context"
	"encoding/json"
	"log"

	"event-driven/event"

	"github.com/segmentio/kafka-go"
)

// KafkaConsumer consumes events from Kafka
type KafkaConsumer struct {
	reader *kafka.Reader
}

// NewKafkaConsumer creates a new Kafka consumer
func NewKafkaConsumer(brokers []string, topic, groupID string) *KafkaConsumer {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers: brokers,
		Topic:   topic,
		GroupID: groupID,
		// Start reading from earliest offset
		StartOffset: kafka.FirstOffset,
		// Commit offsets manually for at-least-once delivery
		CommitInterval: 0,
	})

	log.Printf("Created Kafka consumer for topic: %s, group: %s", topic, groupID)
	return &KafkaConsumer{reader: reader}
}

// Consume starts consuming messages
func (c *KafkaConsumer) Consume(ctx context.Context, handler func(event.Event) error) error {
	for {
		msg, err := c.reader.FetchMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				// Context cancelled, shutdown gracefully
				return nil
			}
			log.Printf("Error fetching message: %v", err)
			continue
		}

		log.Printf("Received message: offset=%d, partition=%d", msg.Offset, msg.Partition)

		// Unmarshal event
		var evt event.BaseEvent
		if err := json.Unmarshal(msg.Value, &evt); err != nil {
			log.Printf("Failed to unmarshal event: %v", err)
			// Commit anyway to skip bad message
			c.reader.CommitMessages(ctx, msg)
			continue
		}

		// Process event
		if err := handler(&evt); err != nil {
			log.Printf("Failed to process event: %v", err)
			// Don't commit - message will be redelivered
			continue
		}

		// Commit offset (at-least-once delivery)
		if err := c.reader.CommitMessages(ctx, msg); err != nil {
			log.Printf("Failed to commit message: %v", err)
		}
	}
}

// Close closes the Kafka reader
func (c *KafkaConsumer) Close() error {
	return c.reader.Close()
}
```

---

## Testing

### Event Publisher Test

```go
package publisher_test

import (
	"context"
	"testing"
	"time"

	"event-driven/event"
	"event-driven/publisher"

	"github.com/nats-io/nats.go"
)

func TestNATSPublisher_Publish(t *testing.T) {
	// Start embedded NATS server for testing
	server := nats.RunDefaultServer()
	defer server.Shutdown()

	// Create publisher
	pub, err := publisher.NewNATSPublisher(nats.DefaultURL)
	if err != nil {
		t.Fatalf("Failed to create publisher: %v", err)
	}
	defer pub.Close()

	// Create event
	evt := event.NewOrderPlacedEvent(
		"ORDER001",
		"CUST001",
		"test@example.com",
		[]event.Item{},
		100.0,
	)

	// Publish
	ctx := context.Background()
	if err := pub.Publish(ctx, "orders.placed", evt); err != nil {
		t.Errorf("Failed to publish event: %v", err)
	}
}

func TestNATSPublisher_PublishAsync(t *testing.T) {
	server := nats.RunDefaultServer()
	defer server.Shutdown()

	pub, err := publisher.NewNATSPublisher(nats.DefaultURL)
	if err != nil {
		t.Fatalf("Failed to create publisher: %v", err)
	}
	defer pub.Close()

	evt := event.NewOrderPlacedEvent("ORDER001", "CUST001", "test@example.com", nil, 100.0)

	ctx := context.Background()
	errChan := pub.PublishAsync(ctx, "orders.placed", evt)

	// Wait for result
	select {
	case err := <-errChan:
		if err != nil {
			t.Errorf("Async publish failed: %v", err)
		}
	case <-time.After(5 * time.Second):
		t.Error("Timeout waiting for async publish")
	}
}
```

### Consumer Test

```go
package consumer_test

import (
	"testing"
	"time"

	"event-driven/consumer"
	"event-driven/event"
	"event-driven/publisher"

	"github.com/nats-io/nats.go"
)

func TestEmailConsumer_Integration(t *testing.T) {
	server := nats.RunDefaultServer()
	defer server.Shutdown()

	// Create consumer
	cons, err := consumer.NewEmailConsumer(nats.DefaultURL, "orders.placed")
	if err != nil {
		t.Fatalf("Failed to create consumer: %v", err)
	}
	defer cons.Close()

	// Create publisher
	pub, err := publisher.NewNATSPublisher(nats.DefaultURL)
	if err != nil {
		t.Fatalf("Failed to create publisher: %v", err)
	}
	defer pub.Close()

	// Publish event
	evt := event.NewOrderPlacedEvent("ORDER001", "CUST001", "test@example.com", nil, 100.0)
	if err := pub.Publish(context.Background(), "orders.placed", evt); err != nil {
		t.Fatalf("Failed to publish: %v", err)
	}

	// Wait for processing
	time.Sleep(200 * time.Millisecond)

	// Verify event was processed (check logs in real implementation)
}
```

---

## Running the Example

### Prerequisites

```bash
# Install dependencies
go get github.com/nats-io/nats.go
go get github.com/segmentio/kafka-go
go get github.com/google/uuid
```

### Start Message Broker

```bash
# Option 1: NATS (lightweight, easy to run)
docker run -d --name nats -p 4222:4222 nats:latest

# Option 2: Kafka (high-throughput, more complex)
docker-compose up -d

# docker-compose.yml
# version: '3'
# services:
#   zookeeper:
#     image: confluentinc/cp-zookeeper:latest
#     environment:
#       ZOOKEEPER_CLIENT_PORT: 2181
#
#   kafka:
#     image: confluentinc/cp-kafka:latest
#     depends_on:
#       - zookeeper
#     ports:
#       - "9092:9092"
#     environment:
#       KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
#       KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
```

### Run Producer

```go
// cmd/producer/main.go
package main

import (
	"context"
	"log"
	"time"

	"event-driven/event"
	"event-driven/publisher"
)

func main() {
	// Create publisher
	pub, err := publisher.NewNATSPublisher("nats://localhost:4222")
	if err != nil {
		log.Fatal(err)
	}
	defer pub.Close()

	// Publish events
	for i := 1; i <= 10; i++ {
		evt := event.NewOrderPlacedEvent(
			fmt.Sprintf("ORDER%03d", i),
			"CUST001",
			"customer@example.com",
			[]event.Item{
				{ProductID: "PROD001", ProductName: "Widget", Quantity: 2, Price: 50.0},
			},
			100.0,
		)

		if err := pub.Publish(context.Background(), "orders.placed", evt); err != nil {
			log.Printf("Failed to publish: %v", err)
		}

		time.Sleep(1 * time.Second)
	}

	log.Println("Published 10 events")
}
```

### Run Consumer

```go
// cmd/consumer/main.go
package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"event-driven/consumer"
)

func main() {
	// Create consumers
	emailConsumer, err := consumer.NewEmailConsumer("nats://localhost:4222", "orders.placed")
	if err != nil {
		log.Fatal(err)
	}
	defer emailConsumer.Close()

	analyticsConsumer, err := consumer.NewAnalyticsConsumer(
		"nats://localhost:4222",
		[]string{"orders.placed", "payment.processed"},
		5, // 5 workers
	)
	if err != nil {
		log.Fatal(err)
	}
	defer analyticsConsumer.Close()

	log.Println("Consumers started, press Ctrl+C to stop")

	// Wait for interrupt
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down gracefully...")
}
```

### Test

```bash
# Terminal 1: Run consumer
go run cmd/consumer/main.go

# Terminal 2: Run producer
go run cmd/producer/main.go

# Observe events being processed in consumer logs
```

---

## Key Takeaways

1. **Goroutines for Async** - Concurrent event processing with goroutines
2. **Channels for Backpressure** - Buffered channels control flow
3. **Worker Pools** - Limit concurrency with worker pool pattern
4. **Context for Cancellation** - Graceful shutdown using context
5. **Idempotency** - Use sync.Map for thread-safe deduplication
6. **At-Least-Once Delivery** - Manual acknowledgment after processing
7. **NATS for Simplicity** - Lightweight, easy to deploy
8. **Kafka for Scale** - High-throughput, persistent log

---

**Related Guides:**
- [Deep Dive: Event-Driven Architecture](../../../3-design/architecture-pattern/deep-dive-event-driven.md)
- [Deep Dive: Microservices](../../../3-design/architecture-pattern/deep-dive-microservices.md)

*Last Updated: 2025-10-20*
