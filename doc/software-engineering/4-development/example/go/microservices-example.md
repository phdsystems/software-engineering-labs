# Microservices Architecture - Go Implementation

**Pattern:** Microservices Architecture
**Language:** Go
**Framework:** gRPC, Gin, NATS/Kafka
**Related Guide:** [Deep Dive: Microservices](../../../3-design/architecture-pattern/deep-dive-microservices.md)

## TL;DR

**Complete microservices in Go** with gRPC for inter-service communication, service mesh patterns, and distributed tracing. **Key components**: Independent services → gRPC for sync calls → NATS/Kafka for async events → service discovery → distributed tracing with OpenTelemetry → circuit breakers → graceful shutdown. **Go advantages**: Fast startup, small memory footprint, native concurrency, single binary deployment.

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Service Implementation](#service-implementation)
4. [gRPC Communication](#grpc-communication)
5. [Service Discovery](#service-discovery)
6. [API Gateway](#api-gateway)
7. [Message-Based Communication](#message-based-communication)
8. [Circuit Breaker Pattern](#circuit-breaker-pattern)
9. [Distributed Tracing](#distributed-tracing)
10. [Running the Example](#running-the-example)

---

## Overview

This example demonstrates a complete e-commerce microservices system with:

- **Order Service** - Manages orders (gRPC + HTTP)
- **Payment Service** - Processes payments (gRPC)
- **Inventory Service** - Manages stock (gRPC)
- **API Gateway** - Single entry point (HTTP → gRPC)
- **Message Broker** - NATS for async events
- **Service Mesh** - Circuit breakers, retries, timeouts

**Architecture:**
```
Client → API Gateway (Gin) → gRPC → Services
                             ↓
                        NATS Event Bus
                             ↓
              ┌──────────────┼──────────────┐
              ↓              ↓              ↓
        Order Service  Payment Service  Inventory Service
```

---

## Project Structure

```
microservices/
├── api-gateway/
│   ├── main.go
│   ├── handler/
│   │   └── order_handler.go
│   └── client/
│       └── grpc_clients.go
│
├── order-service/
│   ├── main.go
│   ├── proto/
│   │   ├── order.proto
│   │   └── order.pb.go
│   ├── server/
│   │   └── grpc_server.go
│   ├── service/
│   │   └── order_service.go
│   └── repository/
│       └── order_repository.go
│
├── payment-service/
│   ├── main.go
│   ├── proto/
│   │   ├── payment.proto
│   │   └── payment.pb.go
│   └── server/
│       └── grpc_server.go
│
├── inventory-service/
│   ├── main.go
│   └── server/
│       └── grpc_server.go
│
└── shared/
    ├── tracing/
    │   └── tracer.go
    ├── circuitbreaker/
    │   └── breaker.go
    └── events/
        └── nats_client.go

go.work (workspace)
```

---

## Service Implementation

### Order Service

#### proto/order.proto

```protobuf
syntax = "proto3";

package order;

option go_package = "order-service/proto";

service OrderService {
  rpc CreateOrder(CreateOrderRequest) returns (CreateOrderResponse);
  rpc GetOrder(GetOrderRequest) returns (GetOrderResponse);
}

message CreateOrderRequest {
  string customer_id = 1;
  string product_id = 2;
  int32 quantity = 3;
  double amount = 4;
}

message CreateOrderResponse {
  string order_id = 1;
  string status = 2;
  string message = 3;
}

message GetOrderRequest {
  string order_id = 1;
}

message GetOrderResponse {
  string order_id = 1;
  string customer_id = 2;
  string product_id = 3;
  int32 quantity = 4;
  double amount = 5;
  string status = 6;
}
```

#### server/grpc_server.go

```go
package server

import (
	"context"
	"log"

	pb "order-service/proto"
	"order-service/service"

	"github.com/google/uuid"
)

// OrderServer implements the gRPC OrderService
type OrderServer struct {
	pb.UnimplementedOrderServiceServer
	orderService *service.OrderService
}

// NewOrderServer creates a new gRPC server
func NewOrderServer(orderService *service.OrderService) *OrderServer {
	return &OrderServer{
		orderService: orderService,
	}
}

// CreateOrder handles order creation
func (s *OrderServer) CreateOrder(ctx context.Context, req *pb.CreateOrderRequest) (*pb.CreateOrderResponse, error) {
	log.Printf("Received CreateOrder request: %+v", req)

	// Generate order ID
	orderID := uuid.New().String()

	// Create order
	order := &service.Order{
		ID:         orderID,
		CustomerID: req.CustomerId,
		ProductID:  req.ProductId,
		Quantity:   req.Quantity,
		Amount:     req.Amount,
		Status:     "PENDING",
	}

	if err := s.orderService.CreateOrder(ctx, order); err != nil {
		log.Printf("Failed to create order: %v", err)
		return &pb.CreateOrderResponse{
			OrderId: "",
			Status:  "FAILED",
			Message: err.Error(),
		}, err
	}

	log.Printf("Order created: %s", orderID)

	return &pb.CreateOrderResponse{
		OrderId: orderID,
		Status:  "PENDING",
		Message: "Order created successfully",
	}, nil
}

// GetOrder retrieves an order by ID
func (s *OrderServer) GetOrder(ctx context.Context, req *pb.GetOrderRequest) (*pb.GetOrderResponse, error) {
	log.Printf("Received GetOrder request: %s", req.OrderId)

	order, err := s.orderService.GetOrder(ctx, req.OrderId)
	if err != nil {
		return nil, err
	}

	return &pb.GetOrderResponse{
		OrderId:    order.ID,
		CustomerId: order.CustomerID,
		ProductId:  order.ProductID,
		Quantity:   order.Quantity,
		Amount:     order.Amount,
		Status:     order.Status,
	}, nil
}
```

#### service/order_service.go

```go
package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/nats-io/nats.go"
)

// Order represents an order entity
type Order struct {
	ID         string  `json:"order_id"`
	CustomerID string  `json:"customer_id"`
	ProductID  string  `json:"product_id"`
	Quantity   int32   `json:"quantity"`
	Amount     float64 `json:"amount"`
	Status     string  `json:"status"`
}

// OrderService handles business logic
type OrderService struct {
	repo       OrderRepository
	natsClient *nats.Conn
}

// OrderRepository interface
type OrderRepository interface {
	Save(ctx context.Context, order *Order) error
	FindByID(ctx context.Context, id string) (*Order, error)
}

// NewOrderService creates a new service
func NewOrderService(repo OrderRepository, natsClient *nats.Conn) *OrderService {
	return &OrderService{
		repo:       repo,
		natsClient: natsClient,
	}
}

// CreateOrder creates a new order and publishes event
func (s *OrderService) CreateOrder(ctx context.Context, order *Order) error {
	// Save order
	if err := s.repo.Save(ctx, order); err != nil {
		return fmt.Errorf("failed to save order: %w", err)
	}

	// Publish OrderCreated event
	event := map[string]interface{}{
		"event_type": "OrderCreated",
		"order_id":   order.ID,
		"customer_id": order.CustomerID,
		"product_id":  order.ProductID,
		"quantity":    order.Quantity,
		"amount":      order.Amount,
	}

	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	if err := s.natsClient.Publish("orders.created", data); err != nil {
		log.Printf("Failed to publish event: %v", err)
		// Don't fail the request if event publishing fails
	}

	log.Printf("Published OrderCreated event: %s", order.ID)
	return nil
}

// GetOrder retrieves an order
func (s *OrderService) GetOrder(ctx context.Context, id string) (*Order, error) {
	return s.repo.FindByID(ctx, id)
}
```

#### main.go

```go
package main

import (
	"context"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	pb "order-service/proto"
	"order-service/repository"
	"order-service/server"
	"order-service/service"

	"github.com/nats-io/nats.go"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

func main() {
	// Connect to NATS
	natsURL := getEnv("NATS_URL", "nats://localhost:4222")
	nc, err := nats.Connect(natsURL)
	if err != nil {
		log.Fatalf("Failed to connect to NATS: %v", err)
	}
	defer nc.Close()

	log.Println("Connected to NATS")

	// Initialize repository (in-memory for demo)
	repo := repository.NewInMemoryOrderRepository()

	// Initialize service
	orderService := service.NewOrderService(repo, nc)

	// Create gRPC server
	grpcServer := grpc.NewServer()
	pb.RegisterOrderServiceServer(grpcServer, server.NewOrderServer(orderService))

	// Enable reflection for grpcurl
	reflection.Register(grpcServer)

	// Listen on port
	port := getEnv("PORT", "50051")
	listener, err := net.Listen("tcp", ":"+port)
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	log.Printf("Order Service listening on port %s", port)

	// Graceful shutdown
	go func() {
		if err := grpcServer.Serve(listener); err != nil {
			log.Fatalf("Failed to serve: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down gracefully...")
	grpcServer.GracefulStop()
	log.Println("Server stopped")
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
```

---

## gRPC Communication

### Payment Service Client

```go
package client

import (
	"context"
	"fmt"
	"log"
	"time"

	pb "payment-service/proto"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// PaymentClient wraps gRPC client
type PaymentClient struct {
	client pb.PaymentServiceClient
	conn   *grpc.ClientConn
}

// NewPaymentClient creates a new payment client
func NewPaymentClient(address string) (*PaymentClient, error) {
	conn, err := grpc.Dial(
		address,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithBlock(),
		grpc.WithTimeout(5*time.Second),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to payment service: %w", err)
	}

	client := pb.NewPaymentServiceClient(conn)

	return &PaymentClient{
		client: client,
		conn:   conn,
	}, nil
}

// ProcessPayment calls the payment service
func (c *PaymentClient) ProcessPayment(ctx context.Context, orderID string, amount float64) (bool, error) {
	// Set timeout for this RPC
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	req := &pb.ProcessPaymentRequest{
		OrderId: orderID,
		Amount:  amount,
	}

	log.Printf("Calling payment service: %+v", req)

	resp, err := c.client.ProcessPayment(ctx, req)
	if err != nil {
		return false, fmt.Errorf("payment RPC failed: %w", err)
	}

	log.Printf("Payment response: success=%v, message=%s", resp.Success, resp.Message)

	return resp.Success, nil
}

// Close closes the gRPC connection
func (c *PaymentClient) Close() error {
	return c.conn.Close()
}
```

---

## Service Discovery

### Consul Integration

```go
package discovery

import (
	"fmt"
	"log"

	"github.com/hashicorp/consul/api"
)

// ServiceRegistry handles service registration and discovery
type ServiceRegistry struct {
	client *api.Client
}

// NewServiceRegistry creates a new registry
func NewServiceRegistry(consulAddress string) (*ServiceRegistry, error) {
	config := api.DefaultConfig()
	config.Address = consulAddress

	client, err := api.NewClient(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create consul client: %w", err)
	}

	return &ServiceRegistry{client: client}, nil
}

// RegisterService registers a service with Consul
func (sr *ServiceRegistry) RegisterService(serviceName, serviceID, address string, port int) error {
	registration := &api.AgentServiceRegistration{
		ID:      serviceID,
		Name:    serviceName,
		Address: address,
		Port:    port,
		Check: &api.AgentServiceCheck{
			HTTP:                           fmt.Sprintf("http://%s:%d/health", address, port),
			Interval:                       "10s",
			Timeout:                        "3s",
			DeregisterCriticalServiceAfter: "30s",
		},
	}

	if err := sr.client.Agent().ServiceRegister(registration); err != nil {
		return fmt.Errorf("failed to register service: %w", err)
	}

	log.Printf("Registered service: %s (%s) at %s:%d", serviceName, serviceID, address, port)
	return nil
}

// DiscoverService discovers a service by name
func (sr *ServiceRegistry) DiscoverService(serviceName string) (string, error) {
	services, _, err := sr.client.Health().Service(serviceName, "", true, nil)
	if err != nil {
		return "", fmt.Errorf("failed to discover service: %w", err)
	}

	if len(services) == 0 {
		return "", fmt.Errorf("no healthy instances of service %s found", serviceName)
	}

	// Return first healthy instance
	service := services[0].Service
	address := fmt.Sprintf("%s:%d", service.Address, service.Port)

	log.Printf("Discovered service: %s at %s", serviceName, address)
	return address, nil
}

// DeregisterService removes service from Consul
func (sr *ServiceRegistry) DeregisterService(serviceID string) error {
	if err := sr.client.Agent().ServiceDeregister(serviceID); err != nil {
		return fmt.Errorf("failed to deregister service: %w", err)
	}

	log.Printf("Deregistered service: %s", serviceID)
	return nil
}
```

---

## API Gateway

### api-gateway/handler/order_handler.go

```go
package handler

import (
	"context"
	"net/http"
	"time"

	pb "order-service/proto"

	"github.com/gin-gonic/gin"
)

// OrderHandler translates HTTP to gRPC
type OrderHandler struct {
	orderClient pb.OrderServiceClient
}

// NewOrderHandler creates a new handler
func NewOrderHandler(orderClient pb.OrderServiceClient) *OrderHandler {
	return &OrderHandler{
		orderClient: orderClient,
	}
}

// CreateOrder handles POST /api/orders
func (h *OrderHandler) CreateOrder(c *gin.Context) {
	var req struct {
		CustomerID string  `json:"customer_id" binding:"required"`
		ProductID  string  `json:"product_id" binding:"required"`
		Quantity   int32   `json:"quantity" binding:"required,gt=0"`
		Amount     float64 `json:"amount" binding:"required,gt=0"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Call order service via gRPC
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	grpcReq := &pb.CreateOrderRequest{
		CustomerId: req.CustomerID,
		ProductId:  req.ProductID,
		Quantity:   req.Quantity,
		Amount:     req.Amount,
	}

	resp, err := h.orderClient.CreateOrder(ctx, grpcReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create order",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"order_id": resp.OrderId,
		"status":   resp.Status,
		"message":  resp.Message,
	})
}

// GetOrder handles GET /api/orders/:id
func (h *OrderHandler) GetOrder(c *gin.Context) {
	orderID := c.Param("id")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	req := &pb.GetOrderRequest{OrderId: orderID}
	resp, err := h.orderClient.GetOrder(ctx, req)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"order_id":    resp.OrderId,
		"customer_id": resp.CustomerId,
		"product_id":  resp.ProductId,
		"quantity":    resp.Quantity,
		"amount":      resp.Amount,
		"status":      resp.Status,
	})
}
```

### api-gateway/main.go

```go
package main

import (
	"log"

	"api-gateway/handler"

	pb "order-service/proto"

	"github.com/gin-gonic/gin"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func main() {
	// Connect to order service
	orderServiceAddr := "localhost:50051"
	conn, err := grpc.Dial(
		orderServiceAddr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		log.Fatalf("Failed to connect to order service: %v", err)
	}
	defer conn.Close()

	orderClient := pb.NewOrderServiceClient(conn)

	// Create handlers
	orderHandler := handler.NewOrderHandler(orderClient)

	// Setup router
	router := gin.Default()

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy"})
	})

	// API routes
	api := router.Group("/api")
	{
		api.POST("/orders", orderHandler.CreateOrder)
		api.GET("/orders/:id", orderHandler.GetOrder)
	}

	// Start server
	log.Println("API Gateway listening on :8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
```

---

## Message-Based Communication

### NATS Event Publisher

```go
package events

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/nats-io/nats.go"
)

// EventPublisher publishes events to NATS
type EventPublisher struct {
	conn *nats.Conn
}

// NewEventPublisher creates a new publisher
func NewEventPublisher(natsURL string) (*EventPublisher, error) {
	nc, err := nats.Connect(natsURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to NATS: %w", err)
	}

	log.Println("Connected to NATS")
	return &EventPublisher{conn: nc}, nil
}

// Publish publishes an event
func (ep *EventPublisher) Publish(subject string, event interface{}) error {
	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	if err := ep.conn.Publish(subject, data); err != nil {
		return fmt.Errorf("failed to publish event: %w", err)
	}

	log.Printf("Published event to %s: %v", subject, event)
	return nil
}

// Close closes the connection
func (ep *EventPublisher) Close() {
	ep.conn.Close()
}
```

### NATS Event Consumer

```go
package events

import (
	"encoding/json"
	"log"

	"github.com/nats-io/nats.go"
)

// EventConsumer consumes events from NATS
type EventConsumer struct {
	conn *nats.Conn
}

// NewEventConsumer creates a new consumer
func NewEventConsumer(natsURL string) (*EventConsumer, error) {
	nc, err := nats.Connect(natsURL)
	if err != nil {
		return nil, err
	}

	return &EventConsumer{conn: nc}, nil
}

// Subscribe subscribes to a subject
func (ec *EventConsumer) Subscribe(subject string, handler func(interface{})) error {
	_, err := ec.conn.Subscribe(subject, func(msg *nats.Msg) {
		var event map[string]interface{}
		if err := json.Unmarshal(msg.Data, &event); err != nil {
			log.Printf("Failed to unmarshal event: %v", err)
			return
		}

		log.Printf("Received event from %s: %v", subject, event)
		handler(event)
	})

	if err != nil {
		return err
	}

	log.Printf("Subscribed to %s", subject)
	return nil
}

// Close closes the connection
func (ec *EventConsumer) Close() {
	ec.conn.Close()
}
```

---

## Circuit Breaker Pattern

### shared/circuitbreaker/breaker.go

```go
package circuitbreaker

import (
	"errors"
	"sync"
	"time"
)

// State represents circuit breaker state
type State int

const (
	StateClosed State = iota
	StateOpen
	StateHalfOpen
)

// CircuitBreaker implements circuit breaker pattern
type CircuitBreaker struct {
	mu              sync.Mutex
	state           State
	failureCount    int
	successCount    int
	failureThreshold int
	successThreshold int
	timeout         time.Duration
	openTime        time.Time
}

// NewCircuitBreaker creates a new circuit breaker
func NewCircuitBreaker(failureThreshold, successThreshold int, timeout time.Duration) *CircuitBreaker {
	return &CircuitBreaker{
		state:            StateClosed,
		failureThreshold: failureThreshold,
		successThreshold: successThreshold,
		timeout:          timeout,
	}
}

// Call executes the function with circuit breaker protection
func (cb *CircuitBreaker) Call(fn func() error) error {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	// Check if circuit should transition from open to half-open
	if cb.state == StateOpen && time.Since(cb.openTime) > cb.timeout {
		cb.state = StateHalfOpen
		cb.successCount = 0
	}

	// Reject if circuit is open
	if cb.state == StateOpen {
		return errors.New("circuit breaker is open")
	}

	// Execute function
	err := fn()

	if err != nil {
		cb.onFailure()
		return err
	}

	cb.onSuccess()
	return nil
}

func (cb *CircuitBreaker) onSuccess() {
	if cb.state == StateHalfOpen {
		cb.successCount++
		if cb.successCount >= cb.successThreshold {
			cb.state = StateClosed
			cb.failureCount = 0
		}
	}
	// Reset failure count in closed state
	if cb.state == StateClosed {
		cb.failureCount = 0
	}
}

func (cb *CircuitBreaker) onFailure() {
	cb.failureCount++
	if cb.failureCount >= cb.failureThreshold {
		cb.state = StateOpen
		cb.openTime = time.Now()
	}
}

// GetState returns current state
func (cb *CircuitBreaker) GetState() State {
	cb.mu.Lock()
	defer cb.mu.Unlock()
	return cb.state
}
```

### Usage with gRPC Client

```go
package client

import (
	"context"
	"time"

	"shared/circuitbreaker"
	pb "payment-service/proto"
)

// PaymentClientWithBreaker wraps client with circuit breaker
type PaymentClientWithBreaker struct {
	client  *PaymentClient
	breaker *circuitbreaker.CircuitBreaker
}

// NewPaymentClientWithBreaker creates client with circuit breaker
func NewPaymentClientWithBreaker(address string) (*PaymentClientWithBreaker, error) {
	client, err := NewPaymentClient(address)
	if err != nil {
		return nil, err
	}

	breaker := circuitbreaker.NewCircuitBreaker(
		3,              // Open after 3 failures
		2,              // Close after 2 successes
		10*time.Second, // Retry after 10s
	)

	return &PaymentClientWithBreaker{
		client:  client,
		breaker: breaker,
	}, nil
}

// ProcessPayment calls service with circuit breaker protection
func (c *PaymentClientWithBreaker) ProcessPayment(ctx context.Context, orderID string, amount float64) (bool, error) {
	var success bool
	var err error

	breakerErr := c.breaker.Call(func() error {
		success, err = c.client.ProcessPayment(ctx, orderID, amount)
		return err
	})

	if breakerErr != nil {
		return false, breakerErr
	}

	return success, err
}
```

---

## Distributed Tracing

### shared/tracing/tracer.go

```go
package tracing

import (
	"context"
	"fmt"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/jaeger"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.4.0"
	"go.opentelemetry.io/otel/trace"
)

// InitTracer initializes OpenTelemetry tracer
func InitTracer(serviceName, jaegerEndpoint string) (trace.Tracer, func(), error) {
	// Create Jaeger exporter
	exporter, err := jaeger.New(jaeger.WithCollectorEndpoint(
		jaeger.WithEndpoint(jaegerEndpoint),
	))
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create Jaeger exporter: %w", err)
	}

	// Create resource
	res, err := resource.New(
		context.Background(),
		resource.WithAttributes(
			semconv.ServiceNameKey.String(serviceName),
		),
	)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create resource: %w", err)
	}

	// Create tracer provider
	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
	)

	otel.SetTracerProvider(tp)

	tracer := tp.Tracer(serviceName)

	// Cleanup function
	cleanup := func() {
		_ = tp.Shutdown(context.Background())
	}

	return tracer, cleanup, nil
}
```

### Usage in Service

```go
package server

import (
	"context"
	"log"

	"order-service/shared/tracing"

	"go.opentelemetry.io/otel/attribute"
)

func (s *OrderServer) CreateOrder(ctx context.Context, req *pb.CreateOrderRequest) (*pb.CreateOrderResponse, error) {
	// Start span
	ctx, span := s.tracer.Start(ctx, "CreateOrder")
	defer span.End()

	// Add attributes
	span.SetAttributes(
		attribute.String("customer_id", req.CustomerId),
		attribute.String("product_id", req.ProductId),
		attribute.Int("quantity", int(req.Quantity)),
	)

	log.Printf("Processing order with trace_id: %s", span.SpanContext().TraceID())

	// Business logic...
	// Span is automatically sent to Jaeger

	return &pb.CreateOrderResponse{
		OrderId: orderID,
		Status:  "SUCCESS",
	}, nil
}
```

---

## Running the Example

### Prerequisites

```bash
# Install dependencies
go get google.golang.org/grpc
go get github.com/gin-gonic/gin
go get github.com/nats-io/nats.go
go get github.com/hashicorp/consul/api
go get go.opentelemetry.io/otel
```

### Start Infrastructure

```bash
# Start NATS
docker run -d --name nats -p 4222:4222 nats:latest

# Start Consul
docker run -d --name consul -p 8500:8500 consul:latest

# Start Jaeger (optional, for tracing)
docker run -d --name jaeger \
  -p 6831:6831/udp \
  -p 16686:16686 \
  jaegertracing/all-in-one:latest
```

### Generate gRPC Code

```bash
# Install protoc and plugins
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Generate
cd order-service
protoc --go_out=. --go-grpc_out=. proto/order.proto
```

### Run Services

```bash
# Terminal 1: Order Service
cd order-service
go run main.go

# Terminal 2: Payment Service
cd payment-service
go run main.go

# Terminal 3: Inventory Service
cd inventory-service
go run main.go

# Terminal 4: API Gateway
cd api-gateway
go run main.go
```

### Test

```bash
# Create order via API Gateway
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUST001",
    "product_id": "PROD001",
    "quantity": 2,
    "amount": 99.99
  }'

# Get order
curl http://localhost:8080/api/orders/{order_id}

# Test gRPC directly with grpcurl
grpcurl -plaintext -d '{"order_id":"123"}' \
  localhost:50051 order.OrderService/GetOrder
```

### Build Binaries

```bash
# Build all services
go build -o bin/order-service ./order-service
go build -o bin/payment-service ./payment-service
go build -o bin/inventory-service ./inventory-service
go build -o bin/api-gateway ./api-gateway

# Run
./bin/order-service
```

---

## Key Takeaways

1. **gRPC Efficiency** - Binary protocol, faster than JSON/HTTP
2. **Service Independence** - Each service is a separate binary
3. **Async Communication** - NATS for event-driven patterns
4. **Circuit Breakers** - Prevent cascading failures
5. **Service Discovery** - Dynamic service location with Consul
6. **Distributed Tracing** - OpenTelemetry + Jaeger for observability
7. **Graceful Shutdown** - Handle SIGTERM/SIGINT properly
8. **Fast Startup** - Go services start in milliseconds

---

**Related Guides:**
- [Deep Dive: Microservices Architecture](../../../3-design/architecture-pattern/deep-dive-microservices.md)
- [Deep Dive: Event-Driven Architecture](../../../3-design/architecture-pattern/deep-dive-event-driven.md)

*Last Updated: 2025-10-20*
