# Serverless Architecture - Java Implementation

**Pattern:** Serverless Architecture (FaaS)
**Language:** Java
**Platform:** AWS Lambda, Azure Functions, Google Cloud Functions
**Related Guide:** [Deep Dive: Serverless Architecture](../../../3-design/architecture-pattern/deep-dive-serverless.md)

## TL;DR

**Complete Serverless implementation** where functions run in stateless containers triggered by events. **Key principle**: Write functions → deploy to cloud → scale automatically → pay per execution. **Critical components**: Lambda handlers → event triggers (HTTP, S3, DynamoDB, SQS) → cold start optimization → API Gateway → external state storage.

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [AWS Lambda Functions](#aws-lambda-functions)
4. [Event Triggers](#event-triggers)
5. [Cold Start Optimization](#cold-start-optimization)
6. [API Gateway Integration](#api-gateway-integration)
7. [State Management](#state-management)
8. [Azure Functions Example](#azure-functions-example)
9. [Google Cloud Functions Example](#google-cloud-functions-example)
10. [Testing](#testing)
11. [Deployment](#deployment)

---

## Overview

This example demonstrates Serverless Architecture with:

- **AWS Lambda** - HTTP API, S3 trigger, DynamoDB stream
- **Azure Functions** - HTTP trigger, Blob trigger, Queue trigger
- **Google Cloud Functions** - HTTP trigger, Cloud Storage trigger
- **Patterns** - Cold start optimization, connection pooling, async processing

**Architecture:**
```
API Gateway → Lambda (HTTP)
                ↓
           DynamoDB

S3 Upload → Lambda (S3 trigger) → Resize image → S3

DynamoDB Stream → Lambda (Stream) → Elasticsearch
```

---

## Project Structure

```
serverless-example/
├── aws-lambda/
│   ├── pom.xml
│   └── src/main/java/com/example/lambda/
│       ├── handler/
│       │   ├── HttpApiHandler.java
│       │   ├── S3EventHandler.java
│       │   └── DynamoDBStreamHandler.java
│       ├── model/
│       │   ├── ApiRequest.java
│       │   └── ApiResponse.java
│       └── service/
│           ├── ImageService.java
│           └── DataService.java
│
├── azure-functions/
│   └── src/main/java/com/example/azure/
│       ├── HttpTriggerFunction.java
│       ├── BlobTriggerFunction.java
│       └── QueueTriggerFunction.java
│
└── google-cloud-functions/
    └── src/main/java/com/example/gcp/
        ├── HttpFunction.java
        └── StorageFunction.java
```

---

## AWS Lambda Functions

### HTTP API Handler

**pom.xml:**
```xml
<dependencies>
    <dependency>
        <groupId>com.amazonaws</groupId>
        <artifactId>aws-lambda-java-core</artifactId>
        <version>1.2.3</version>
    </dependency>
    <dependency>
        <groupId>com.amazonaws</groupId>
        <artifactId>aws-lambda-java-events</artifactId>
        <version>3.11.3</version>
    </dependency>
    <dependency>
        <groupId>com.amazonaws</groupId>
        <artifactId>aws-java-sdk-dynamodb</artifactId>
        <version>1.12.565</version>
    </dependency>
    <dependency>
        <groupId>com.google.code.gson</groupId>
        <artifactId>gson</artifactId>
        <version>2.10.1</version>
    </dependency>
</dependencies>

<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-shade-plugin</artifactId>
            <version>3.5.0</version>
            <executions>
                <execution>
                    <phase>package</phase>
                    <goals>
                        <goal>shade</goal>
                    </goals>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

**HttpApiHandler.java:**
```java
package com.example.lambda.handler;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
import com.amazonaws.services.dynamodbv2.document.DynamoDB;
import com.amazonaws.services.dynamodbv2.document.Item;
import com.amazonaws.services.dynamodbv2.document.Table;
import com.google.gson.Gson;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * AWS Lambda HTTP API Handler
 * Handles REST API requests via API Gateway
 */
public class HttpApiHandler implements
        RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    // Connection reuse across invocations (optimization)
    private static final AmazonDynamoDB dynamoClient =
        AmazonDynamoDBClientBuilder.defaultClient();
    private static final DynamoDB dynamoDB = new DynamoDB(dynamoClient);
    private static final Gson gson = new Gson();
    private static final String TABLE_NAME = System.getenv("ORDERS_TABLE");

    @Override
    public APIGatewayProxyResponseEvent handleRequest(
            APIGatewayProxyRequestEvent request,
            Context context) {

        context.getLogger().log("Received request: " + request.getPath());

        try {
            String method = request.getHttpMethod();
            String path = request.getPath();

            return switch (method) {
                case "POST" -> createOrder(request, context);
                case "GET" -> getOrder(request, context);
                default -> buildResponse(405, "Method not allowed");
            };

        } catch (Exception e) {
            context.getLogger().log("Error: " + e.getMessage());
            return buildResponse(500, "Internal server error");
        }
    }

    private APIGatewayProxyResponseEvent createOrder(
            APIGatewayProxyRequestEvent request,
            Context context) {

        // Parse request body
        OrderRequest orderRequest = gson.fromJson(
            request.getBody(),
            OrderRequest.class
        );

        // Create order
        String orderId = UUID.randomUUID().toString();
        Table table = dynamoDB.getTable(TABLE_NAME);

        Item item = new Item()
            .withPrimaryKey("orderId", orderId)
            .withString("customerId", orderRequest.customerId)
            .withNumber("totalAmount", orderRequest.totalAmount)
            .withLong("createdAt", System.currentTimeMillis());

        table.putItem(item);

        context.getLogger().log("Created order: " + orderId);

        // Build response
        OrderResponse response = new OrderResponse(
            orderId,
            orderRequest.customerId,
            orderRequest.totalAmount,
            "CREATED"
        );

        return buildResponse(201, gson.toJson(response));
    }

    private APIGatewayProxyResponseEvent getOrder(
            APIGatewayProxyRequestEvent request,
            Context context) {

        String orderId = request.getPathParameters().get("orderId");
        Table table = dynamoDB.getTable(TABLE_NAME);

        Item item = table.getItem("orderId", orderId);

        if (item == null) {
            return buildResponse(404, "Order not found");
        }

        OrderResponse response = new OrderResponse(
            item.getString("orderId"),
            item.getString("customerId"),
            item.getNumber("totalAmount").doubleValue(),
            "RETRIEVED"
        );

        return buildResponse(200, gson.toJson(response));
    }

    private APIGatewayProxyResponseEvent buildResponse(int statusCode, String body) {
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");
        headers.put("Access-Control-Allow-Origin", "*");

        return new APIGatewayProxyResponseEvent()
            .withStatusCode(statusCode)
            .withHeaders(headers)
            .withBody(body);
    }

    // DTOs
    static class OrderRequest {
        String customerId;
        double totalAmount;
    }

    static class OrderResponse {
        String orderId;
        String customerId;
        double totalAmount;
        String status;

        OrderResponse(String orderId, String customerId,
                     double totalAmount, String status) {
            this.orderId = orderId;
            this.customerId = customerId;
            this.totalAmount = totalAmount;
            this.status = status;
        }
    }
}
```

### S3 Event Handler

**S3EventHandler.java:**
```java
package com.example.lambda.handler;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.S3Event;
import com.amazonaws.services.lambda.runtime.events.models.s3.S3EventNotification;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.GetObjectRequest;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.S3Object;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * S3 Event Handler - Triggered on file upload
 * Resizes images and saves thumbnails
 */
public class S3EventHandler implements RequestHandler<S3Event, String> {

    private static final AmazonS3 s3Client = AmazonS3ClientBuilder.defaultClient();
    private static final int THUMBNAIL_WIDTH = 200;
    private static final int THUMBNAIL_HEIGHT = 200;

    @Override
    public String handleRequest(S3Event event, Context context) {
        context.getLogger().log("Received S3 event with " +
            event.getRecords().size() + " records");

        for (S3EventNotification.S3EventNotificationRecord record : event.getRecords()) {
            String bucket = record.getS3().getBucket().getName();
            String key = record.getS3().getObject().getKey();

            context.getLogger().log("Processing file: " + bucket + "/" + key);

            try {
                // Download image
                S3Object s3Object = s3Client.getObject(
                    new GetObjectRequest(bucket, key)
                );
                InputStream inputStream = s3Object.getObjectContent();

                // Resize image
                BufferedImage thumbnail = resizeImage(inputStream);

                // Upload thumbnail
                String thumbnailKey = "thumbnails/" + key;
                uploadThumbnail(bucket, thumbnailKey, thumbnail);

                context.getLogger().log("Created thumbnail: " + thumbnailKey);

            } catch (Exception e) {
                context.getLogger().log("Error processing file: " + e.getMessage());
                throw new RuntimeException(e);
            }
        }

        return "Successfully processed " + event.getRecords().size() + " files";
    }

    private BufferedImage resizeImage(InputStream inputStream) throws IOException {
        BufferedImage originalImage = ImageIO.read(inputStream);

        BufferedImage resizedImage = new BufferedImage(
            THUMBNAIL_WIDTH,
            THUMBNAIL_HEIGHT,
            BufferedImage.TYPE_INT_RGB
        );

        Graphics2D graphics = resizedImage.createGraphics();
        graphics.setRenderingHint(
            RenderingHints.KEY_INTERPOLATION,
            RenderingHints.VALUE_INTERPOLATION_BILINEAR
        );
        graphics.drawImage(
            originalImage,
            0, 0,
            THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT,
            null
        );
        graphics.dispose();

        return resizedImage;
    }

    private void uploadThumbnail(String bucket, String key,
                                 BufferedImage image) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ImageIO.write(image, "jpg", outputStream);
        byte[] bytes = outputStream.toByteArray();

        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(bytes.length);
        metadata.setContentType("image/jpeg");

        s3Client.putObject(
            bucket,
            key,
            new ByteArrayInputStream(bytes),
            metadata
        );
    }
}
```

### DynamoDB Stream Handler

**DynamoDBStreamHandler.java:**
```java
package com.example.lambda.handler;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.DynamodbEvent;
import com.amazonaws.services.lambda.runtime.events.models.dynamodb.AttributeValue;

import java.util.Map;

/**
 * DynamoDB Stream Handler - Triggered on table changes
 * Syncs data to Elasticsearch for search
 */
public class DynamoDBStreamHandler implements
        RequestHandler<DynamodbEvent, String> {

    @Override
    public String handleRequest(DynamodbEvent event, Context context) {
        context.getLogger().log("Received DynamoDB stream event with " +
            event.getRecords().size() + " records");

        for (DynamodbEvent.DynamodbStreamRecord record : event.getRecords()) {
            String eventName = record.getEventName();
            context.getLogger().log("Event: " + eventName);

            switch (eventName) {
                case "INSERT" -> handleInsert(record, context);
                case "MODIFY" -> handleModify(record, context);
                case "REMOVE" -> handleRemove(record, context);
            }
        }

        return "Successfully processed " + event.getRecords().size() + " records";
    }

    private void handleInsert(DynamodbEvent.DynamodbStreamRecord record,
                             Context context) {
        Map<String, AttributeValue> newImage = record.getDynamodb().getNewImage();
        String orderId = newImage.get("orderId").getS();

        context.getLogger().log("Insert: " + orderId);

        // Index in Elasticsearch
        indexInElasticsearch(orderId, newImage);
    }

    private void handleModify(DynamodbEvent.DynamodbStreamRecord record,
                             Context context) {
        Map<String, AttributeValue> newImage = record.getDynamodb().getNewImage();
        String orderId = newImage.get("orderId").getS();

        context.getLogger().log("Modify: " + orderId);

        // Update in Elasticsearch
        updateInElasticsearch(orderId, newImage);
    }

    private void handleRemove(DynamodbEvent.DynamodbStreamRecord record,
                             Context context) {
        Map<String, AttributeValue> oldImage = record.getDynamodb().getOldImage();
        String orderId = oldImage.get("orderId").getS();

        context.getLogger().log("Remove: " + orderId);

        // Delete from Elasticsearch
        deleteFromElasticsearch(orderId);
    }

    private void indexInElasticsearch(String orderId,
                                     Map<String, AttributeValue> data) {
        // TODO: Call Elasticsearch API
        System.out.println("Indexing in Elasticsearch: " + orderId);
    }

    private void updateInElasticsearch(String orderId,
                                      Map<String, AttributeValue> data) {
        // TODO: Call Elasticsearch API
        System.out.println("Updating in Elasticsearch: " + orderId);
    }

    private void deleteFromElasticsearch(String orderId) {
        // TODO: Call Elasticsearch API
        System.out.println("Deleting from Elasticsearch: " + orderId);
    }
}
```

---

## Event Triggers

### Trigger Types

```yaml
# serverless.yml (Serverless Framework)
service: serverless-example

provider:
  name: aws
  runtime: java11
  region: us-east-1
  memorySize: 512
  timeout: 30

functions:
  # HTTP API
  httpApi:
    handler: com.example.lambda.handler.HttpApiHandler
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
    handler: com.example.lambda.handler.S3EventHandler
    events:
      - s3:
          bucket: image-uploads
          event: s3:ObjectCreated:*
          rules:
            - prefix: uploads/
            - suffix: .jpg

  # DynamoDB Stream
  streamProcessor:
    handler: com.example.lambda.handler.DynamoDBStreamHandler
    events:
      - stream:
          type: dynamodb
          arn:
            Fn::GetAtt: [OrdersTable, StreamArn]
          batchSize: 10
          startingPosition: TRIM_HORIZON

  # Scheduled (Cron)
  scheduledTask:
    handler: com.example.lambda.handler.ScheduledTaskHandler
    events:
      - schedule:
          rate: cron(0 2 * * ? *)  # Every day at 2 AM
          enabled: true

  # SQS Queue
  queueProcessor:
    handler: com.example.lambda.handler.QueueHandler
    events:
      - sqs:
          arn:
            Fn::GetAtt: [OrderQueue, Arn]
          batchSize: 10

resources:
  Resources:
    OrdersTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:custom.ordersTable}
        BillingMode: PAY_PER_REQUEST
        AttributeDefinitions:
          - AttributeName: orderId
            AttributeType: S
        KeySchema:
          - AttributeName: orderId
            KeyType: HASH
        StreamSpecification:
          StreamViewType: NEW_AND_OLD_IMAGES

    OrderQueue:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: order-queue

custom:
  ordersTable: orders-${self:provider.stage}
```

---

## Cold Start Optimization

### Techniques

```java
package com.example.lambda.handler;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;

/**
 * Optimized Lambda Handler
 * Techniques to reduce cold start time
 */
public class OptimizedHandler implements RequestHandler<String, String> {

    // 1. Static initialization (reused across invocations)
    private static final DatabaseConnection dbConnection = initializeDatabase();
    private static final HttpClient httpClient = HttpClient.newHttpClient();

    // 2. Lazy initialization (only when needed)
    private static ServiceClient serviceClient;

    // 3. Connection pooling
    static {
        // Initialize connection pool once
        System.setProperty("http.maxConnections", "50");
    }

    @Override
    public String handleRequest(String input, Context context) {
        // 4. Minimize dependencies (smaller JAR = faster cold start)
        // 5. Use GraalVM native image (optional, faster startup)

        // Check if warm invocation
        if (isWarmInvocation()) {
            context.getLogger().log("Warm invocation - connections reused");
        } else {
            context.getLogger().log("Cold start detected");
        }

        // Business logic
        return processRequest(input);
    }

    private static DatabaseConnection initializeDatabase() {
        // Initialize once, reuse across invocations
        return new DatabaseConnection(System.getenv("DB_URL"));
    }

    private static ServiceClient getServiceClient() {
        if (serviceClient == null) {
            serviceClient = new ServiceClient();
        }
        return serviceClient;
    }

    private boolean isWarmInvocation() {
        // Check if connections are already established
        return dbConnection != null && dbConnection.isConnected();
    }

    private String processRequest(String input) {
        // Use pre-initialized connections
        return dbConnection.query("SELECT * FROM data WHERE id = ?", input);
    }

    // Placeholder classes
    static class DatabaseConnection {
        DatabaseConnection(String url) {}
        boolean isConnected() { return true; }
        String query(String sql, String param) { return "result"; }
    }

    static class ServiceClient {}
}
```

### Provisioned Concurrency

```java
// AWS CDK configuration for provisioned concurrency
import software.amazon.awscdk.services.lambda.*;

Function function = Function.Builder.create(this, "MyFunction")
    .runtime(Runtime.JAVA_11)
    .handler("com.example.Handler")
    .code(Code.fromAsset("target/function.jar"))
    .memorySize(512)
    .timeout(Duration.seconds(30))
    .build();

// Provision 5 instances (always warm)
function.addAlias("prod", AliasOptions.builder()
    .provisionedConcurrentExecutions(5)
    .build());
```

---

## API Gateway Integration

### REST API

```java
// Lambda integrated with API Gateway REST API
public class RestApiHandler implements
        RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    @Override
    public APIGatewayProxyResponseEvent handleRequest(
            APIGatewayProxyRequestEvent request,
            Context context) {

        // CORS headers
        Map<String, String> headers = new HashMap<>();
        headers.put("Access-Control-Allow-Origin", "*");
        headers.put("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        headers.put("Access-Control-Allow-Headers", "Content-Type,Authorization");

        // Handle OPTIONS (preflight)
        if ("OPTIONS".equals(request.getHttpMethod())) {
            return new APIGatewayProxyResponseEvent()
                .withStatusCode(200)
                .withHeaders(headers);
        }

        // Route request
        String resource = request.getResource();
        String method = request.getHttpMethod();

        return switch (resource) {
            case "/orders" -> handleOrders(method, request, context);
            case "/orders/{orderId}" -> handleOrder(method, request, context);
            default -> new APIGatewayProxyResponseEvent()
                .withStatusCode(404)
                .withHeaders(headers)
                .withBody("{\"error\":\"Not found\"}");
        };
    }

    private APIGatewayProxyResponseEvent handleOrders(
            String method,
            APIGatewayProxyRequestEvent request,
            Context context) {
        // Implementation
        return new APIGatewayProxyResponseEvent()
            .withStatusCode(200)
            .withBody("{\"message\":\"Orders handled\"}");
    }

    private APIGatewayProxyResponseEvent handleOrder(
            String method,
            APIGatewayProxyRequestEvent request,
            Context context) {
        // Implementation
        return new APIGatewayProxyResponseEvent()
            .withStatusCode(200)
            .withBody("{\"message\":\"Order handled\"}");
    }
}
```

---

## State Management

### Using DynamoDB

```java
package com.example.lambda.service;

import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
import com.amazonaws.services.dynamodbv2.document.DynamoDB;
import com.amazonaws.services.dynamodbv2.document.Item;
import com.amazonaws.services.dynamodbv2.document.Table;

/**
 * Stateless function using DynamoDB for persistence
 */
public class DataService {
    private static final AmazonDynamoDB client =
        AmazonDynamoDBClientBuilder.defaultClient();
    private static final DynamoDB dynamoDB = new DynamoDB(client);
    private static final String TABLE_NAME = System.getenv("DATA_TABLE");

    public void saveData(String key, String value) {
        Table table = dynamoDB.getTable(TABLE_NAME);

        Item item = new Item()
            .withPrimaryKey("id", key)
            .withString("data", value)
            .withLong("timestamp", System.currentTimeMillis());

        table.putItem(item);
    }

    public String getData(String key) {
        Table table = dynamoDB.getTable(TABLE_NAME);
        Item item = table.getItem("id", key);

        return item != null ? item.getString("data") : null;
    }
}
```

---

## Azure Functions Example

**HttpTriggerFunction.java:**
```java
package com.example.azure;

import com.microsoft.azure.functions.*;
import com.microsoft.azure.functions.annotation.*;

import java.util.Optional;

/**
 * Azure Functions HTTP Trigger
 */
public class HttpTriggerFunction {

    @FunctionName("HttpExample")
    public HttpResponseMessage run(
            @HttpTrigger(
                name = "req",
                methods = {HttpMethod.GET, HttpMethod.POST},
                authLevel = AuthorizationLevel.ANONYMOUS
            ) HttpRequestMessage<Optional<String>> request,
            ExecutionContext context) {

        context.getLogger().info("Java HTTP trigger processed a request.");

        // Get query parameter
        String name = request.getQueryParameters().get("name");

        // Get request body
        String body = request.getBody().orElse(null);

        if (name == null && body == null) {
            return request.createResponseBuilder(HttpStatus.BAD_REQUEST)
                .body("Please pass a name on the query string or in the request body")
                .build();
        }

        return request.createResponseBuilder(HttpStatus.OK)
            .body("Hello, " + (name != null ? name : body))
            .build();
    }
}
```

**BlobTriggerFunction.java:**
```java
package com.example.azure;

import com.microsoft.azure.functions.*;
import com.microsoft.azure.functions.annotation.*;

/**
 * Azure Functions Blob Trigger
 */
public class BlobTriggerFunction {

    @FunctionName("BlobTriggerExample")
    public void run(
            @BlobTrigger(
                name = "content",
                path = "uploads/{name}",
                connection = "AzureWebJobsStorage"
            ) byte[] content,
            @BindingName("name") String name,
            ExecutionContext context) {

        context.getLogger().info("Blob trigger processed: " + name +
            " Size: " + content.length + " bytes");

        // Process blob (resize image, parse CSV, etc.)
    }
}
```

---

## Google Cloud Functions Example

**HttpFunction.java:**
```java
package com.example.gcp;

import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;
import com.google.gson.Gson;

import java.io.BufferedWriter;
import java.io.IOException;

/**
 * Google Cloud Functions HTTP Trigger
 */
public class HttpFunction implements HttpFunction {
    private static final Gson gson = new Gson();

    @Override
    public void service(HttpRequest request, HttpResponse response)
            throws IOException {

        BufferedWriter writer = response.getWriter();

        switch (request.getMethod()) {
            case "GET" -> {
                String name = request.getFirstQueryParameter("name")
                    .orElse("World");
                writer.write("Hello, " + name + "!");
            }
            case "POST" -> {
                var body = gson.fromJson(request.getReader(), RequestBody.class);
                writer.write("Received: " + body.message);
            }
            default -> response.setStatusCode(405);
        }
    }

    static class RequestBody {
        String message;
    }
}
```

---

## Testing

### Local Testing

```java
package com.example.lambda.handler;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class HttpApiHandlerTest {

    @Test
    void shouldCreateOrder() {
        // Given
        HttpApiHandler handler = new HttpApiHandler();
        APIGatewayProxyRequestEvent request = new APIGatewayProxyRequestEvent();
        request.setHttpMethod("POST");
        request.setPath("/orders");
        request.setBody("{\"customerId\":\"CUST001\",\"totalAmount\":100.0}");

        Context context = mock(Context.class);
        when(context.getLogger()).thenReturn(mock(com.amazonaws.services.lambda.runtime.LambdaLogger.class));

        // When
        APIGatewayProxyResponseEvent response = handler.handleRequest(request, context);

        // Then
        assertEquals(201, response.getStatusCode());
        assertTrue(response.getBody().contains("orderId"));
    }
}
```

---

## Deployment

### AWS SAM Template

```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Globals:
  Function:
    Runtime: java11
    Timeout: 30
    MemorySize: 512
    Environment:
      Variables:
        ORDERS_TABLE: !Ref OrdersTable

Resources:
  HttpApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: com.example.lambda.handler.HttpApiHandler
      CodeUri: target/lambda.jar
      Events:
        CreateOrder:
          Type: Api
          Properties:
            Path: /orders
            Method: post
        GetOrder:
          Type: Api
          Properties:
            Path: /orders/{orderId}
            Method: get
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref OrdersTable

  S3TriggerFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: com.example.lambda.handler.S3EventHandler
      CodeUri: target/lambda.jar
      Events:
        S3Event:
          Type: S3
          Properties:
            Bucket: !Ref ImageBucket
            Events: s3:ObjectCreated:*

  OrdersTable:
    Type: AWS::DynamoDB::Table
    Properties:
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: orderId
          AttributeType: S
      KeySchema:
        - AttributeName: orderId
          KeyType: HASH

  ImageBucket:
    Type: AWS::S3::Bucket

Outputs:
  ApiUrl:
    Description: API Gateway endpoint URL
    Value: !Sub "https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/"
```

### Deploy Commands

```bash
# Build
mvn clean package

# Deploy with SAM
sam build
sam deploy --guided

# Or with Serverless Framework
serverless deploy

# Or with AWS CLI
aws lambda create-function \
  --function-name my-function \
  --runtime java11 \
  --role arn:aws:iam::ACCOUNT:role/lambda-role \
  --handler com.example.Handler \
  --zip-file fileb://target/function.jar \
  --timeout 30 \
  --memory-size 512
```

---

## Key Takeaways

1. **Stateless Functions** - No local state, use external storage (DynamoDB, S3)
2. **Event-Driven** - Functions triggered by HTTP, storage, queues, schedules
3. **Auto-Scaling** - Automatically scales to handle load
4. **Pay-Per-Use** - Only pay for execution time
5. **Cold Starts** - Optimize with static init, provisioned concurrency
6. **Connection Reuse** - Initialize connections outside handler
7. **Small JARs** - Minimize dependencies for faster cold starts

---

**Related Guides:**
- [Deep Dive: Serverless Architecture](../../../3-design/architecture-pattern/deep-dive-serverless.md)
- [Deep Dive: Event-Driven Architecture](../../../3-design/architecture-pattern/deep-dive-event-driven.md)
- [Deep Dive: Microservices](../../../3-design/architecture-pattern/deep-dive-microservices.md)

*Last Updated: 2025-10-20*
