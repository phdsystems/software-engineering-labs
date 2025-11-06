# Serverless Architecture - Go Implementation

**Pattern:** Serverless Architecture (FaaS)
**Language:** Go
**Platform:** AWS Lambda, Google Cloud Functions, Azure Functions
**Related Guide:** [Deep Dive: Serverless Architecture](../../../3-design/architecture-pattern/deep-dive-serverless.md)

## TL;DR

**Complete Serverless in Go** with functions triggered by HTTP, S3, DynamoDB, and more. **Key advantage**: Go's fast cold start (100ms vs 1s+ for JVM), small memory footprint (20MB vs 256MB+), native AWS Lambda support. **Go-idiomatic**: Handler functions, context for timeouts, single binary deployment, environment variables for config. **Critical patterns**: Init once (global vars), connection reuse, structured logging, graceful error handling.

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [AWS Lambda Functions](#aws-lambda-functions)
4. [Event Triggers](#event-triggers)
5. [Cold Start Optimization](#cold-start-optimization)
6. [API Gateway Integration](#api-gateway-integration)
7. [State Management](#state-management)
8. [Google Cloud Functions](#google-cloud-functions)
9. [Azure Functions](#azure-functions)
10. [Testing](#testing)
11. [Deployment](#deployment)

---

## Overview

This example demonstrates Serverless Architecture with:

- **AWS Lambda** - HTTP API, S3 trigger, DynamoDB stream
- **Google Cloud Functions** - HTTP trigger, Storage trigger
- **Azure Functions** - HTTP trigger (custom handler)
- **Patterns** - Cold start optimization, connection pooling, context propagation

**Architecture:**
```
API Gateway → Lambda (HTTP)
                ↓
           DynamoDB

S3 Upload → Lambda (S3 trigger) → Resize image → S3

DynamoDB Stream → Lambda (Stream) → Process changes
```

---

## Project Structure

```
serverless/
├── cmd/
│   ├── http-api/
│   │   └── main.go
│   ├── s3-processor/
│   │   └── main.go
│   └── dynamodb-stream/
│       └── main.go
│
├── handler/
│   ├── order_handler.go
│   ├── image_handler.go
│   └── stream_handler.go
│
├── service/
│   ├── order_service.go
│   └── image_service.go
│
├── repository/
│   └── dynamodb_repo.go
│
└── infrastructure/
    ├── aws.go
    └── config.go

serverless.yml (Serverless Framework)
template.yaml (AWS SAM)
Makefile
```

---

## AWS Lambda Functions

### HTTP API Handler

#### handler/order_handler.go

```go
package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/google/uuid"
)

// Initialize AWS clients once (reused across invocations)
var (
	sess        *aws.Session
	dynamodbSvc *dynamodb.DynamoDB
	tableName   = os.Getenv("ORDERS_TABLE")
)

func init() {
	// Cold start: initialize once
	sess = session.Must(session.NewSession())
	dynamodbSvc = dynamodb.New(sess)
	log.Println("Initialized AWS clients")
}

// OrderRequest is the request DTO
type OrderRequest struct {
	CustomerID  string  `json:"customer_id"`
	ProductID   string  `json:"product_id"`
	Quantity    int     `json:"quantity"`
	TotalAmount float64 `json:"total_amount"`
}

// OrderResponse is the response DTO
type OrderResponse struct {
	OrderID     string  `json:"order_id"`
	CustomerID  string  `json:"customer_id"`
	TotalAmount float64 `json:"total_amount"`
	Status      string  `json:"status"`
}

// HandleOrderRequest handles API Gateway requests
func HandleOrderRequest(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Received %s request: %s", request.HTTPMethod, request.Path)

	// Route based on HTTP method
	switch request.HTTPMethod {
	case "POST":
		return createOrder(ctx, request)
	case "GET":
		return getOrder(ctx, request)
	default:
		return response(405, map[string]string{"error": "Method not allowed"}), nil
	}
}

func createOrder(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Parse request body
	var orderReq OrderRequest
	if err := json.Unmarshal([]byte(request.Body), &orderReq); err != nil {
		return response(400, map[string]string{"error": "Invalid request body"}), nil
	}

	// Create order
	orderID := uuid.New().String()

	// Save to DynamoDB
	item := map[string]*dynamodb.AttributeValue{
		"order_id":     {S: aws.String(orderID)},
		"customer_id":  {S: aws.String(orderReq.CustomerID)},
		"product_id":   {S: aws.String(orderReq.ProductID)},
		"quantity":     {N: aws.String(fmt.Sprintf("%d", orderReq.Quantity))},
		"total_amount": {N: aws.String(fmt.Sprintf("%.2f", orderReq.TotalAmount))},
		"status":       {S: aws.String("PENDING")},
	}

	_, err := dynamodbSvc.PutItemWithContext(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	})

	if err != nil {
		log.Printf("Failed to save order: %v", err)
		return response(500, map[string]string{"error": "Failed to create order"}), nil
	}

	log.Printf("Created order: %s", orderID)

	// Return response
	orderResp := OrderResponse{
		OrderID:     orderID,
		CustomerID:  orderReq.CustomerID,
		TotalAmount: orderReq.TotalAmount,
		Status:      "PENDING",
	}

	return response(201, orderResp), nil
}

func getOrder(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	orderID := request.PathParameters["orderId"]
	if orderID == "" {
		return response(400, map[string]string{"error": "Missing orderId"}), nil
	}

	// Query DynamoDB
	result, err := dynamodbSvc.GetItemWithContext(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"order_id": {S: aws.String(orderID)},
		},
	})

	if err != nil {
		log.Printf("Failed to get order: %v", err)
		return response(500, map[string]string{"error": "Failed to get order"}), nil
	}

	if result.Item == nil {
		return response(404, map[string]string{"error": "Order not found"}), nil
	}

	// Build response
	orderResp := OrderResponse{
		OrderID:    *result.Item["order_id"].S,
		CustomerID: *result.Item["customer_id"].S,
		Status:     *result.Item["status"].S,
	}

	return response(200, orderResp), nil
}

// Helper function to create API Gateway response
func response(statusCode int, body interface{}) events.APIGatewayProxyResponse {
	bodyJSON, _ := json.Marshal(body)

	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                "application/json",
			"Access-Control-Allow-Origin": "*",
		},
		Body: string(bodyJSON),
	}
}
```

#### cmd/http-api/main.go

```go
package main

import (
	"serverless/handler"

	"github.com/aws/aws-lambda-go/lambda"
)

func main() {
	// Start Lambda handler
	lambda.Start(handler.HandleOrderRequest)
}
```

---

### S3 Event Handler

#### handler/image_handler.go

```go
package handler

import (
	"bytes"
	"context"
	"fmt"
	"image"
	"image/jpeg"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/nfnt/resize"
)

var (
	s3Svc *s3.S3
)

func init() {
	sess := session.Must(session.NewSession())
	s3Svc = s3.New(sess)
	log.Println("Initialized S3 client")
}

// HandleS3Event processes S3 events
func HandleS3Event(ctx context.Context, event events.S3Event) error {
	log.Printf("Received S3 event with %d records", len(event.Records))

	for _, record := range event.Records {
		bucket := record.S3.Bucket.Name
		key := record.S3.Object.Key

		log.Printf("Processing file: %s/%s", bucket, key)

		// Download image
		img, err := downloadImage(ctx, bucket, key)
		if err != nil {
			log.Printf("Failed to download image: %v", err)
			continue
		}

		// Resize image
		thumbnail := resizeImage(img, 200, 200)

		// Upload thumbnail
		thumbnailKey := fmt.Sprintf("thumbnails/%s", key)
		if err := uploadImage(ctx, bucket, thumbnailKey, thumbnail); err != nil {
			log.Printf("Failed to upload thumbnail: %v", err)
			continue
		}

		log.Printf("Created thumbnail: %s", thumbnailKey)
	}

	return nil
}

func downloadImage(ctx context.Context, bucket, key string) (image.Image, error) {
	result, err := s3Svc.GetObjectWithContext(ctx, &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get object: %w", err)
	}
	defer result.Body.Close()

	img, _, err := image.Decode(result.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to decode image: %w", err)
	}

	return img, nil
}

func resizeImage(img image.Image, width, height uint) image.Image {
	return resize.Resize(width, height, img, resize.Lanczos3)
}

func uploadImage(ctx context.Context, bucket, key string, img image.Image) error {
	// Encode image
	buf := new(bytes.Buffer)
	if err := jpeg.Encode(buf, img, &jpeg.Options{Quality: 90}); err != nil {
		return fmt.Errorf("failed to encode image: %w", err)
	}

	// Upload to S3
	_, err := s3Svc.PutObjectWithContext(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(bucket),
		Key:         aws.String(key),
		Body:        bytes.NewReader(buf.Bytes()),
		ContentType: aws.String("image/jpeg"),
	})

	return err
}
```

#### cmd/s3-processor/main.go

```go
package main

import (
	"serverless/handler"

	"github.com/aws/aws-lambda-go/lambda"
)

func main() {
	lambda.Start(handler.HandleS3Event)
}
```

---

### DynamoDB Stream Handler

#### handler/stream_handler.go

```go
package handler

import (
	"context"
	"log"

	"github.com/aws/aws-lambda-go/events"
)

// HandleDynamoDBStream processes DynamoDB stream events
func HandleDynamoDBStream(ctx context.Context, event events.DynamoDBEvent) error {
	log.Printf("Received DynamoDB stream event with %d records", len(event.Records))

	for _, record := range event.Records {
		log.Printf("Event: %s", record.EventName)

		switch record.EventName {
		case "INSERT":
			handleInsert(record)
		case "MODIFY":
			handleModify(record)
		case "REMOVE":
			handleRemove(record)
		}
	}

	return nil
}

func handleInsert(record events.DynamoDBEventRecord) {
	newImage := record.Change.NewImage
	orderID := newImage["order_id"].String()

	log.Printf("Insert: %s", orderID)

	// Sync to Elasticsearch, send notification, etc.
	indexInSearch(orderID, newImage)
}

func handleModify(record events.DynamoDBEventRecord) {
	newImage := record.Change.NewImage
	orderID := newImage["order_id"].String()

	log.Printf("Modify: %s", orderID)

	// Update search index
	updateInSearch(orderID, newImage)
}

func handleRemove(record events.DynamoDBEventRecord) {
	oldImage := record.Change.OldImage
	orderID := oldImage["order_id"].String()

	log.Printf("Remove: %s", orderID)

	// Delete from search index
	deleteFromSearch(orderID)
}

func indexInSearch(orderID string, data map[string]events.DynamoDBAttributeValue) {
	log.Printf("Indexing in search: %s", orderID)
	// Call Elasticsearch API
}

func updateInSearch(orderID string, data map[string]events.DynamoDBAttributeValue) {
	log.Printf("Updating in search: %s", orderID)
}

func deleteFromSearch(orderID string) {
	log.Printf("Deleting from search: %s", orderID)
}
```

#### cmd/dynamodb-stream/main.go

```go
package main

import (
	"serverless/handler"

	"github.com/aws/aws-lambda-go/lambda"
)

func main() {
	lambda.Start(handler.HandleDynamoDBStream)
}
```

---

## Event Triggers

### serverless.yml

```yaml
service: serverless-go-example

provider:
  name: aws
  runtime: go1.x
  region: us-east-1
  memorySize: 128
  timeout: 30
  environment:
    ORDERS_TABLE: ${self:custom.ordersTable}

functions:
  # HTTP API
  httpApi:
    handler: bin/http-api
    events:
      - httpApi:
          path: /orders
          method: post
      - httpApi:
          path: /orders/{orderId}
          method: get
    environment:
      ORDERS_TABLE: ${self:custom.ordersTable}

  # S3 Trigger
  imageProcessor:
    handler: bin/s3-processor
    events:
      - s3:
          bucket: my-image-bucket
          event: s3:ObjectCreated:*
          rules:
            - prefix: uploads/
            - suffix: .jpg

  # DynamoDB Stream
  streamProcessor:
    handler: bin/dynamodb-stream
    events:
      - stream:
          type: dynamodb
          arn:
            Fn::GetAtt: [OrdersTable, StreamArn]
          batchSize: 10
          startingPosition: TRIM_HORIZON

  # Scheduled (Cron)
  scheduledTask:
    handler: bin/scheduled-task
    events:
      - schedule:
          rate: cron(0 2 * * ? *)  # Every day at 2 AM
          enabled: true

resources:
  Resources:
    OrdersTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:custom.ordersTable}
        BillingMode: PAY_PER_REQUEST
        AttributeDefinitions:
          - AttributeName: order_id
            AttributeType: S
        KeySchema:
          - AttributeName: order_id
            KeyType: HASH
        StreamSpecification:
          StreamViewType: NEW_AND_OLD_IMAGES

custom:
  ordersTable: orders-${self:provider.stage}
```

---

## Cold Start Optimization

### Techniques

```go
package handler

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/events"
	_ "github.com/lib/pq"
)

// 1. Initialize outside handler (reused across invocations)
var (
	db         *sql.DB
	httpClient *http.Client

	// Flag to track warm invocations
	isWarm bool
)

func init() {
	// This runs once per container initialization
	log.Println("Cold start: initializing...")

	// 2. Connection pooling
	var err error
	db, err = sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(5)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(time.Hour)

	// 3. Reuse HTTP connections
	httpClient = &http.Client{
		Timeout: 10 * time.Second,
		Transport: &http.Transport{
			MaxIdleConns:        10,
			MaxIdleConnsPerHost: 5,
			IdleConnTimeout:     90 * time.Second,
		},
	}

	isWarm = true
	log.Println("Initialization complete")
}

// OptimizedHandler demonstrates cold start optimization
func OptimizedHandler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if !isWarm {
		log.Println("Cold start detected")
	} else {
		log.Println("Warm invocation - connections reused")
	}

	// Use pre-initialized resources
	row := db.QueryRowContext(ctx, "SELECT COUNT(*) FROM orders")
	var count int
	if err := row.Scan(&count); err != nil {
		log.Printf("Database query failed: %v", err)
	}

	// Make HTTP call with reused client
	resp, err := httpClient.Get("https://api.example.com/data")
	if err == nil {
		defer resp.Body.Close()
		log.Printf("HTTP call succeeded: %d", resp.StatusCode)
	}

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       `{"status":"ok"}`,
	}, nil
}
```

### Provisioned Concurrency (AWS SAM)

```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  HttpApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: http-api
      Runtime: go1.x
      CodeUri: bin/
      MemorySize: 128
      Timeout: 30
      AutoPublishAlias: live
      ProvisionedConcurrencyConfig:
        ProvisionedConcurrentExecutions: 5  # Always warm
```

---

## API Gateway Integration

### HTTP API with Path Parameters

```go
package handler

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/aws/aws-lambda-go/events"
)

// HandleAPIRequest routes requests
func HandleAPIRequest(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// CORS headers
	headers := map[string]string{
		"Access-Control-Allow-Origin":  "*",
		"Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type,Authorization",
	}

	// Handle OPTIONS (preflight)
	if request.HTTPMethod == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers:    headers,
		}, nil
	}

	// Route based on path and method
	resource := request.Resource
	method := request.HTTPMethod

	switch {
	case resource == "/orders" && method == "POST":
		return createOrder(ctx, request)
	case resource == "/orders/{orderId}" && method == "GET":
		return getOrder(ctx, request)
	case resource == "/orders/{orderId}" && method == "PUT":
		return updateOrder(ctx, request)
	default:
		return events.APIGatewayProxyResponse{
			StatusCode: 404,
			Headers:    headers,
			Body:       `{"error":"Not found"}`,
		}, nil
	}
}

func updateOrder(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	orderID := request.PathParameters["orderId"]

	var updates map[string]interface{}
	if err := json.Unmarshal([]byte(request.Body), &updates); err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       fmt.Sprintf(`{"error":"Invalid request: %v"}`, err),
		}, nil
	}

	// Update order logic...

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       fmt.Sprintf(`{"order_id":"%s","status":"updated"}`, orderID),
	}, nil
}
```

---

## State Management

### Using DynamoDB

```go
package repository

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

// Order represents an order entity
type Order struct {
	OrderID     string  `dynamodbav:"order_id"`
	CustomerID  string  `dynamodbav:"customer_id"`
	ProductID   string  `dynamodbav:"product_id"`
	Quantity    int     `dynamodbav:"quantity"`
	TotalAmount float64 `dynamodbav:"total_amount"`
	Status      string  `dynamodbav:"status"`
}

// OrderRepository manages order persistence
type OrderRepository struct {
	svc       *dynamodb.DynamoDB
	tableName string
}

// NewOrderRepository creates a new repository
func NewOrderRepository(tableName string) *OrderRepository {
	sess := session.Must(session.NewSession())
	return &OrderRepository{
		svc:       dynamodb.New(sess),
		tableName: tableName,
	}
}

// Save saves an order
func (r *OrderRepository) Save(ctx context.Context, order *Order) error {
	item, err := dynamodbattribute.MarshalMap(order)
	if err != nil {
		return fmt.Errorf("failed to marshal order: %w", err)
	}

	_, err = r.svc.PutItemWithContext(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(r.tableName),
		Item:      item,
	})

	return err
}

// Get retrieves an order by ID
func (r *OrderRepository) Get(ctx context.Context, orderID string) (*Order, error) {
	result, err := r.svc.GetItemWithContext(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(r.tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"order_id": {S: aws.String(orderID)},
		},
	})

	if err != nil {
		return nil, err
	}

	if result.Item == nil {
		return nil, fmt.Errorf("order not found")
	}

	var order Order
	if err := dynamodbattribute.UnmarshalMap(result.Item, &order); err != nil {
		return nil, fmt.Errorf("failed to unmarshal order: %w", err)
	}

	return &order, nil
}
```

---

## Google Cloud Functions

### HTTP Function

```go
package function

import (
	"encoding/json"
	"fmt"
	"net/http"
)

// OrderRequest is the request DTO
type OrderRequest struct {
	CustomerID  string  `json:"customer_id"`
	ProductID   string  `json:"product_id"`
	Quantity    int     `json:"quantity"`
	TotalAmount float64 `json:"total_amount"`
}

// HandleHTTP is the entry point for Google Cloud Functions
func HandleHTTP(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")

	// Handle OPTIONS
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Route based on method
	switch r.Method {
	case http.MethodPost:
		createOrder(w, r)
	case http.MethodGet:
		getOrders(w, r)
	default:
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
	}
}

func createOrder(w http.ResponseWriter, r *http.Request) {
	var req OrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"%v"}`, err), http.StatusBadRequest)
		return
	}

	// Business logic...

	resp := map[string]interface{}{
		"order_id":     "ORDER001",
		"customer_id":  req.CustomerID,
		"status":       "PENDING",
		"total_amount": req.TotalAmount,
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(resp)
}

func getOrders(w http.ResponseWriter, r *http.Request) {
	orders := []map[string]interface{}{
		{"order_id": "ORDER001", "status": "PENDING"},
		{"order_id": "ORDER002", "status": "COMPLETED"},
	}

	json.NewEncoder(w).Encode(orders)
}
```

### Deploy to GCP

```bash
# Deploy HTTP function
gcloud functions deploy order-api \
  --runtime go120 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point HandleHTTP

# Deploy Storage function
gcloud functions deploy image-processor \
  --runtime go120 \
  --trigger-resource my-bucket \
  --trigger-event google.storage.object.finalize
```

---

## Azure Functions

### Custom Handler

```go
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
)

// AzureRequest represents Azure Functions invocation request
type AzureRequest struct {
	Data     map[string]interface{} `json:"Data"`
	Metadata map[string]interface{} `json:"Metadata"`
}

// AzureResponse represents Azure Functions response
type AzureResponse struct {
	Outputs     map[string]interface{} `json:"Outputs"`
	Logs        []string               `json:"Logs"`
	ReturnValue interface{}            `json:"ReturnValue"`
}

func orderHandler(w http.ResponseWriter, r *http.Request) {
	var azureReq AzureRequest
	if err := json.NewDecoder(r.Body).Decode(&azureReq); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Process request
	response := AzureResponse{
		Outputs: map[string]interface{}{
			"res": map[string]interface{}{
				"statusCode": 200,
				"body":       `{"status":"success"}`,
			},
		},
		Logs:        []string{"Processed order"},
		ReturnValue: nil,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func main() {
	customHandlerPort, exists := os.LookupEnv("FUNCTIONS_CUSTOMHANDLER_PORT")
	if !exists {
		customHandlerPort = "8080"
	}

	http.HandleFunc("/order", orderHandler)

	log.Printf("Azure Functions custom handler listening on :%s", customHandlerPort)
	log.Fatal(http.ListenAndServe(":"+customHandlerPort, nil))
}
```

---

## Testing

### Local Testing

```go
package handler_test

import (
	"context"
	"testing"

	"serverless/handler"

	"github.com/aws/aws-lambda-go/events"
)

func TestHandleOrderRequest(t *testing.T) {
	// Mock request
	request := events.APIGatewayProxyRequest{
		HTTPMethod: "POST",
		Path:       "/orders",
		Body:       `{"customer_id":"CUST001","product_id":"PROD001","quantity":2,"total_amount":100.0}`,
	}

	// Call handler
	response, err := handler.HandleOrderRequest(context.Background(), request)

	// Assertions
	if err != nil {
		t.Fatalf("Handler failed: %v", err)
	}

	if response.StatusCode != 201 {
		t.Errorf("Expected status 201, got %d", response.StatusCode)
	}

	if response.Headers["Content-Type"] != "application/json" {
		t.Error("Expected Content-Type: application/json")
	}
}
```

### Integration Testing with LocalStack

```bash
# Start LocalStack
docker run -d --name localstack \
  -p 4566:4566 \
  -e SERVICES=lambda,dynamodb,s3 \
  localstack/localstack

# Deploy function to LocalStack
aws --endpoint-url=http://localhost:4566 lambda create-function \
  --function-name order-api \
  --runtime go1.x \
  --handler http-api \
  --zip-file fileb://function.zip \
  --role arn:aws:iam::000000000000:role/lambda-role

# Test function
aws --endpoint-url=http://localhost:4566 lambda invoke \
  --function-name order-api \
  --payload '{"httpMethod":"POST","body":"{}"}' \
  response.json
```

---

## Deployment

### Build and Deploy

#### Makefile

```makefile
.PHONY: build deploy clean

build:
	GOOS=linux GOARCH=amd64 go build -o bin/http-api ./cmd/http-api
	GOOS=linux GOARCH=amd64 go build -o bin/s3-processor ./cmd/s3-processor
	GOOS=linux GOARCH=amd64 go build -o bin/dynamodb-stream ./cmd/dynamodb-stream

deploy: build
	serverless deploy --verbose

deploy-sam: build
	sam build
	sam deploy --guided

clean:
	rm -rf bin/
	rm -rf .serverless/
```

### Deploy with Serverless Framework

```bash
# Install Serverless Framework
npm install -g serverless

# Build binaries
make build

# Deploy
serverless deploy --stage prod --region us-east-1

# Deploy single function
serverless deploy function --function httpApi

# View logs
serverless logs --function httpApi --tail
```

### Deploy with AWS SAM

```bash
# Build
sam build

# Test locally
sam local start-api

# Deploy
sam deploy --guided

# Test
curl https://abc123.execute-api.us-east-1.amazonaws.com/Prod/orders
```

---

## Key Takeaways

1. **Fast Cold Starts** - Go starts in ~100ms (vs 1s+ for JVM)
2. **Small Memory** - 20-50MB typical (vs 256MB+ for JVM)
3. **Init Once** - Use global variables for connection reuse
4. **Single Binary** - Easy deployment, no dependencies
5. **Context Propagation** - Use context for timeouts and cancellation
6. **Stateless Design** - Store state in DynamoDB, S3, etc.
7. **Graceful Errors** - Return proper HTTP status codes
8. **Structured Logging** - JSON logs for CloudWatch insights

---

**Related Guides:**
- [Deep Dive: Serverless Architecture](../../../3-design/architecture-pattern/deep-dive-serverless.md)
- [Deep Dive: Event-Driven Architecture](../../../3-design/architecture-pattern/deep-dive-event-driven.md)

*Last Updated: 2025-10-20*
