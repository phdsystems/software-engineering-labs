# Serverless Architecture - Groovy Implementation

**Pattern:** Serverless Architecture (FaaS)
**Language:** Groovy
**Platform:** AWS Lambda, Azure Functions, Google Cloud Functions
**Related Guide:** [Deep Dive: Serverless Architecture](../../../3-design/architecture-pattern/deep-dive-serverless.md)

## TL;DR

**Complete Serverless implementation in Groovy** where functions run in stateless containers triggered by events. **Key principle**: Write functions → deploy to cloud → scale automatically → pay per execution. **Critical components**: Lambda handlers → event triggers (HTTP, S3, DynamoDB, SQS) → cold start optimization → API Gateway → external state storage. **Groovy advantages**: Concise handler code → closures for event processing → @CompileStatic for cold start optimization → script-like simplicity with production performance.

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
10. [Testing with Spock](#testing-with-spock)
11. [Deployment](#deployment)

---

## Overview

This example demonstrates Serverless Architecture with:

- **AWS Lambda** - HTTP API, S3 trigger, DynamoDB stream (Groovy)
- **Azure Functions** - HTTP trigger, Blob trigger, Queue trigger (Groovy)
- **Google Cloud Functions** - HTTP trigger, Cloud Storage trigger (Groovy)
- **Patterns** - Cold start optimization, connection pooling, async processing

**Architecture:**
```
API Gateway → Lambda (Groovy HTTP Handler)
                ↓
           DynamoDB

S3 Upload → Lambda (Groovy S3 Handler) → Resize image → S3

DynamoDB Stream → Lambda (Groovy Stream Handler) → Elasticsearch
```

---

## Project Structure

```
serverless-example/
├── aws-lambda/
│   ├── build.gradle
│   └── src/main/groovy/com/example/lambda/
│       ├── handler/
│       │   ├── HttpApiHandler.groovy
│       │   ├── S3EventHandler.groovy
│       │   └── DynamoDBStreamHandler.groovy
│       ├── model/
│       │   ├── ApiRequest.groovy
│       │   └── ApiResponse.groovy
│       └── service/
│           ├── ImageService.groovy
│           └── DataService.groovy
│
├── azure-functions/
│   └── src/main/groovy/com/example/azure/
│       ├── HttpTriggerFunction.groovy
│       ├── BlobTriggerFunction.groovy
│       └── QueueTriggerFunction.groovy
│
└── google-cloud-functions/
    └── src/main/groovy/com/example/gcp/
        ├── HttpFunction.groovy
        └── StorageFunction.groovy
```

---

## AWS Lambda Functions

### HTTP API Handler

**build.gradle:**
```groovy
plugins {
    id 'groovy'
    id 'com.github.johnrengelman.shadow' version '8.1.1'
}

group = 'com.example.lambda'
version = '1.0.0'
sourceCompatibility = '11'

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.apache.groovy:groovy:4.0.15'
    implementation 'com.amazonaws:aws-lambda-java-core:1.2.3'
    implementation 'com.amazonaws:aws-lambda-java-events:3.11.3'
    implementation 'com.amazonaws:aws-java-sdk-dynamodb:1.12.565'
    implementation 'com.google.code.gson:gson:2.10.1'

    testImplementation 'org.spockframework:spock-core:2.3-groovy-4.0'
}

shadowJar {
    archiveBaseName = 'lambda-function'
    archiveClassifier = ''
}
```

**HttpApiHandler.groovy:**
```groovy
package com.example.lambda.handler

import com.amazonaws.services.lambda.runtime.Context
import com.amazonaws.services.lambda.runtime.RequestHandler
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent
import com.amazonaws.services.dynamodbv2.AmazonDynamoDB
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder
import com.amazonaws.services.dynamodbv2.document.DynamoDB
import com.amazonaws.services.dynamodbv2.document.Item
import com.amazonaws.services.dynamodbv2.document.Table
import com.google.gson.Gson
import groovy.transform.Canonical
import groovy.transform.CompileStatic

/**
 * AWS Lambda HTTP API Handler in Groovy
 * Handles REST API requests via API Gateway
 * Uses @CompileStatic for cold start optimization
 */
@CompileStatic
class HttpApiHandler implements
        RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    // Connection reuse across invocations (optimization)
    private static final AmazonDynamoDB dynamoClient =
        AmazonDynamoDBClientBuilder.defaultClient()
    private static final DynamoDB dynamoDB = new DynamoDB(dynamoClient)
    private static final Gson gson = new Gson()
    private static final String TABLE_NAME = System.getenv('ORDERS_TABLE')

    @Override
    APIGatewayProxyResponseEvent handleRequest(
            APIGatewayProxyRequestEvent request,
            Context context) {

        context.logger.log("Received request: ${request.path}")

        try {
            String method = request.httpMethod
            String path = request.path

            // Groovy switch expression
            switch (method) {
                case 'POST':
                    return createOrder(request, context)
                case 'GET':
                    return getOrder(request, context)
                default:
                    return buildResponse(405, [error: 'Method not allowed'])
            }

        } catch (Exception e) {
            context.logger.log("Error: ${e.message}")
            return buildResponse(500, [error: 'Internal server error'])
        }
    }

    private APIGatewayProxyResponseEvent createOrder(
            APIGatewayProxyRequestEvent request,
            Context context) {

        // Parse request body
        OrderRequest orderRequest = gson.fromJson(request.body, OrderRequest)

        // Create order
        String orderId = UUID.randomUUID().toString()
        Table table = dynamoDB.getTable(TABLE_NAME)

        // Groovy's with() for cleaner initialization
        def item = new Item().with {
            withPrimaryKey('orderId', orderId)
            withString('customerId', orderRequest.customerId)
            withNumber('totalAmount', orderRequest.totalAmount)
            withLong('createdAt', System.currentTimeMillis())
            it
        }

        table.putItem(item)

        context.logger.log("Created order: ${orderId}")

        // Build response
        def response = new OrderResponse(
            orderId: orderId,
            customerId: orderRequest.customerId,
            totalAmount: orderRequest.totalAmount,
            status: 'CREATED'
        )

        buildResponse(201, response)
    }

    private APIGatewayProxyResponseEvent getOrder(
            APIGatewayProxyRequestEvent request,
            Context context) {

        String orderId = request.pathParameters?.orderId
        if (!orderId) {
            return buildResponse(400, [error: 'Order ID required'])
        }

        Table table = dynamoDB.getTable(TABLE_NAME)
        Item item = table.getItem('orderId', orderId)

        if (!item) {
            return buildResponse(404, [error: 'Order not found'])
        }

        def response = new OrderResponse(
            orderId: item.getString('orderId'),
            customerId: item.getString('customerId'),
            totalAmount: item.getNumber('totalAmount').doubleValue(),
            status: 'RETRIEVED'
        )

        buildResponse(200, response)
    }

    private APIGatewayProxyResponseEvent buildResponse(int statusCode, Object body) {
        new APIGatewayProxyResponseEvent().with {
            it.statusCode = statusCode
            headers = [
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            ]
            it.body = gson.toJson(body)
            it
        }
    }

    // DTOs with Groovy @Canonical
    @Canonical
    static class OrderRequest {
        String customerId
        double totalAmount
    }

    @Canonical
    static class OrderResponse {
        String orderId
        String customerId
        double totalAmount
        String status
    }
}
```

### S3 Event Handler

**S3EventHandler.groovy:**
```groovy
package com.example.lambda.handler

import com.amazonaws.services.lambda.runtime.Context
import com.amazonaws.services.lambda.runtime.RequestHandler
import com.amazonaws.services.lambda.runtime.events.S3Event
import com.amazonaws.services.lambda.runtime.events.models.s3.S3EventNotification
import com.amazonaws.services.s3.AmazonS3
import com.amazonaws.services.s3.AmazonS3ClientBuilder
import com.amazonaws.services.s3.model.GetObjectRequest
import com.amazonaws.services.s3.model.ObjectMetadata
import com.amazonaws.services.s3.model.S3Object
import groovy.transform.CompileStatic

import javax.imageio.ImageIO
import java.awt.Graphics2D
import java.awt.RenderingHints
import java.awt.image.BufferedImage

/**
 * S3 Event Handler - Triggered on file upload
 * Resizes images and saves thumbnails
 * Uses Groovy for concise image processing
 */
@CompileStatic
class S3EventHandler implements RequestHandler<S3Event, String> {

    private static final AmazonS3 s3Client = AmazonS3ClientBuilder.defaultClient()
    private static final int THUMBNAIL_WIDTH = 200
    private static final int THUMBNAIL_HEIGHT = 200

    @Override
    String handleRequest(S3Event event, Context context) {
        context.logger.log("Received S3 event with ${event.records.size()} records")

        event.records.each { record ->
            String bucket = record.s3.bucket.name
            String key = record.s3.object.key

            context.logger.log("Processing file: ${bucket}/${key}")

            try {
                // Download image
                S3Object s3Object = s3Client.getObject(
                    new GetObjectRequest(bucket, key)
                )

                // Resize image using Groovy closure
                BufferedImage thumbnail = s3Object.objectContent.withCloseable { stream ->
                    resizeImage(stream)
                }

                // Upload thumbnail
                String thumbnailKey = "thumbnails/${key}"
                uploadThumbnail(bucket, thumbnailKey, thumbnail)

                context.logger.log("Created thumbnail: ${thumbnailKey}")

            } catch (Exception e) {
                context.logger.log("Error processing file: ${e.message}")
                throw new RuntimeException(e)
            }
        }

        "Successfully processed ${event.records.size()} files"
    }

    private BufferedImage resizeImage(InputStream inputStream) {
        BufferedImage originalImage = ImageIO.read(inputStream)

        BufferedImage resizedImage = new BufferedImage(
            THUMBNAIL_WIDTH,
            THUMBNAIL_HEIGHT,
            BufferedImage.TYPE_INT_RGB
        )

        // Groovy's with() for cleaner graphics code
        resizedImage.createGraphics().with { Graphics2D g ->
            g.setRenderingHint(
                RenderingHints.KEY_INTERPOLATION,
                RenderingHints.VALUE_INTERPOLATION_BILINEAR
            )
            g.drawImage(
                originalImage,
                0, 0,
                THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT,
                null
            )
            g.dispose()
        }

        resizedImage
    }

    private void uploadThumbnail(String bucket, String key, BufferedImage image) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream()
        ImageIO.write(image, 'jpg', outputStream)
        byte[] bytes = outputStream.toByteArray()

        def metadata = new ObjectMetadata().with {
            contentLength = bytes.length
            contentType = 'image/jpeg'
            it
        }

        s3Client.putObject(
            bucket,
            key,
            new ByteArrayInputStream(bytes),
            metadata
        )
    }
}
```

### DynamoDB Stream Handler

**DynamoDBStreamHandler.groovy:**
```groovy
package com.example.lambda.handler

import com.amazonaws.services.lambda.runtime.Context
import com.amazonaws.services.lambda.runtime.RequestHandler
import com.amazonaws.services.lambda.runtime.events.DynamodbEvent
import com.amazonaws.services.lambda.runtime.events.models.dynamodb.AttributeValue
import groovy.transform.CompileStatic
import groovy.util.logging.Slf4j

/**
 * DynamoDB Stream Handler - Reacts to database changes
 * Indexes data in Elasticsearch for search
 */
@Slf4j
@CompileStatic
class DynamoDBStreamHandler implements RequestHandler<DynamodbEvent, String> {

    @Override
    String handleRequest(DynamodbEvent event, Context context) {
        context.logger.log("Processing ${event.records.size()} DynamoDB records")

        event.records.each { record ->
            String eventName = record.eventName
            context.logger.log("Event: ${eventName}")

            switch (eventName) {
                case 'INSERT':
                    handleInsert(record.dynamodb.newImage, context)
                    break
                case 'MODIFY':
                    handleModify(record.dynamodb.newImage, context)
                    break
                case 'REMOVE':
                    handleRemove(record.dynamodb.keys, context)
                    break
            }
        }

        "Processed ${event.records.size()} records"
    }

    private void handleInsert(Map<String, AttributeValue> image, Context context) {
        // Extract values using Groovy's safe navigation
        String orderId = image.orderId?.s
        String customerId = image.customerId?.s
        BigDecimal amount = image.totalAmount?.n as BigDecimal

        context.logger.log("""
            Indexing new order:
              Order ID: ${orderId}
              Customer: ${customerId}
              Amount: \$${amount}
        """.stripIndent())

        // Index in Elasticsearch
        indexInElasticsearch([
            orderId: orderId,
            customerId: customerId,
            amount: amount,
            timestamp: System.currentTimeMillis()
        ])
    }

    private void handleModify(Map<String, AttributeValue> image, Context context) {
        String orderId = image.orderId?.s
        context.logger.log("Updating order: ${orderId}")

        // Update in Elasticsearch
        updateInElasticsearch(orderId, image)
    }

    private void handleRemove(Map<String, AttributeValue> keys, Context context) {
        String orderId = keys.orderId?.s
        context.logger.log("Removing order: ${orderId}")

        // Remove from Elasticsearch
        deleteFromElasticsearch(orderId)
    }

    private void indexInElasticsearch(Map data) {
        // Simulate Elasticsearch indexing
        log.info "Indexed in Elasticsearch: ${data}"
    }

    private void updateInElasticsearch(String id, Map data) {
        log.info "Updated in Elasticsearch: ${id}"
    }

    private void deleteFromElasticsearch(String id) {
        log.info "Deleted from Elasticsearch: ${id}"
    }
}
```

---

## Event Triggers

### SQS Queue Trigger

**SqsEventHandler.groovy:**
```groovy
package com.example.lambda.handler

import com.amazonaws.services.lambda.runtime.Context
import com.amazonaws.services.lambda.runtime.RequestHandler
import com.amazonaws.services.lambda.runtime.events.SQSEvent
import groovy.transform.Canonical
import groovy.transform.CompileStatic
import groovy.util.logging.Slf4j

@Slf4j
@CompileStatic
class SqsEventHandler implements RequestHandler<SQSEvent, String> {

    @Override
    String handleRequest(SQSEvent event, Context context) {
        context.logger.log("Processing ${event.records.size()} SQS messages")

        // Groovy's collect for transformation
        def results = event.records.collect { record ->
            try {
                procesMessage(record.body, context)
                [messageId: record.messageId, status: 'SUCCESS']
            } catch (Exception e) {
                context.logger.log("Failed to process message ${record.messageId}: ${e.message}")
                [messageId: record.messageId, status: 'FAILED', error: e.message]
            }
        }

        // Groovy's findAll for filtering
        def failed = results.findAll { it.status == 'FAILED' }
        if (failed) {
            context.logger.log("${failed.size()} messages failed processing")
        }

        "Processed ${results.size()} messages"
    }

    private void procesMessage(String body, Context context) {
        context.logger.log("Processing message: ${body}")

        // Parse and process message
        // Business logic here

        context.logger.log("Message processed successfully")
    }
}
```

---

## Cold Start Optimization

### Optimized Handler with Connection Pooling

**OptimizedHandler.groovy:**
```groovy
package com.example.lambda.handler

import com.amazonaws.services.lambda.runtime.Context
import com.amazonaws.services.lambda.runtime.RequestHandler
import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import groovy.transform.CompileStatic
import groovy.util.logging.Slf4j

import java.sql.Connection
import java.sql.PreparedStatement
import java.sql.ResultSet

/**
 * Optimized Lambda handler with:
 * 1. Static initialization (reused across invocations)
 * 2. Connection pooling
 * 3. @CompileStatic for performance
 */
@Slf4j
@CompileStatic
class OptimizedHandler implements RequestHandler<Map<String, Object>, Map<String, Object>> {

    // Static resources reused across invocations
    private static final HikariDataSource dataSource
    private static final long INIT_TIME

    static {
        INIT_TIME = System.currentTimeMillis()
        log.info "Initializing connection pool (cold start)"

        HikariConfig config = new HikariConfig().with {
            jdbcUrl = System.getenv('DB_URL')
            username = System.getenv('DB_USER')
            password = System.getenv('DB_PASSWORD')
            maximumPoolSize = 5
            minimumIdle = 1
            connectionTimeout = 30000
            it
        }

        dataSource = new HikariDataSource(config)
        log.info "Connection pool initialized in ${System.currentTimeMillis() - INIT_TIME}ms"
    }

    @Override
    Map<String, Object> handleRequest(Map<String, Object> input, Context context) {
        long startTime = System.currentTimeMillis()
        boolean coldStart = (startTime - INIT_TIME) < 1000

        context.logger.log("""
            Request received:
              Cold Start: ${coldStart}
              Request ID: ${context.requestId}
              Memory Limit: ${context.memoryLimitInMB} MB
        """.stripIndent())

        try {
            // Use connection pool
            def result = dataSource.connection.withCloseable { Connection conn ->
                executeQuery(conn, input)
            }

            long duration = System.currentTimeMillis() - startTime

            [
                success: true,
                result: result,
                coldStart: coldStart,
                durationMs: duration
            ]

        } catch (Exception e) {
            context.logger.log("Error: ${e.message}")
            [
                success: false,
                error: e.message
            ]
        }
    }

    private List<Map> executeQuery(Connection conn, Map input) {
        String sql = "SELECT * FROM orders WHERE customer_id = ?"

        conn.prepareStatement(sql).withCloseable { PreparedStatement stmt ->
            stmt.setString(1, input.customerId as String)

            stmt.executeQuery().withCloseable { ResultSet rs ->
                def results = []
                while (rs.next()) {
                    results << [
                        orderId: rs.getString('order_id'),
                        customerId: rs.getString('customer_id'),
                        amount: rs.getBigDecimal('amount')
                    ]
                }
                results
            }
        }
    }
}
```

### Provisioned Concurrency Configuration

**serverless.yml:**
```yaml
service: groovy-lambda-optimized

provider:
  name: aws
  runtime: java11
  memorySize: 512
  timeout: 30

functions:
  optimizedHandler:
    handler: com.example.lambda.handler.OptimizedHandler
    provisionedConcurrency: 2  # Keep 2 instances warm
    environment:
      DB_URL: ${env:DB_URL}
      DB_USER: ${env:DB_USER}
      DB_PASSWORD: ${env:DB_PASSWORD}

package:
  artifact: build/libs/lambda-function.jar
```

---

## API Gateway Integration

### API Gateway Configuration

**ApiGatewayConfig.groovy:**
```groovy
package com.example.lambda.config

import groovy.transform.CompileStatic

@CompileStatic
class ApiGatewayConfig {

    static Map<String, Object> getConfig() {
        [
            openapi: '3.0.0',
            info: [
                title: 'Serverless API',
                version: '1.0.0'
            ],
            paths: [
                '/orders': [
                    post: [
                        'x-amazon-apigateway-integration': [
                            uri: 'arn:aws:lambda:us-east-1:123456789012:function:createOrder',
                            type: 'AWS_PROXY',
                            httpMethod: 'POST'
                        ]
                    ]
                ],
                '/orders/{orderId}': [
                    get: [
                        'x-amazon-apigateway-integration': [
                            uri: 'arn:aws:lambda:us-east-1:123456789012:function:getOrder',
                            type: 'AWS_PROXY',
                            httpMethod: 'POST'
                        ]
                    ]
                ]
            ]
        ]
    }
}
```

---

## State Management

### Redis Cache Integration

**CachedHandler.groovy:**
```groovy
package com.example.lambda.handler

import com.amazonaws.services.lambda.runtime.Context
import com.amazonaws.services.lambda.runtime.RequestHandler
import groovy.transform.CompileStatic
import redis.clients.jedis.Jedis
import redis.clients.jedis.JedisPool
import redis.clients.jedis.JedisPoolConfig

@CompileStatic
class CachedHandler implements RequestHandler<Map<String, Object>, Map<String, Object>> {

    // Static Redis pool (reused across invocations)
    private static final JedisPool jedisPool

    static {
        JedisPoolConfig poolConfig = new JedisPoolConfig().with {
            maxTotal = 10
            maxIdle = 5
            minIdle = 1
            it
        }

        jedisPool = new JedisPool(
            poolConfig,
            System.getenv('REDIS_HOST'),
            System.getenv('REDIS_PORT') as Integer
        )
    }

    @Override
    Map<String, Object> handleRequest(Map<String, Object> input, Context context) {
        String cacheKey = "order:${input.orderId}"

        // Try cache first
        jedisPool.resource.withCloseable { Jedis jedis ->
            String cached = jedis.get(cacheKey)

            if (cached) {
                context.logger.log("Cache hit for ${cacheKey}")
                return [
                    success: true,
                    data: cached,
                    cached: true
                ]
            }

            // Cache miss - fetch from database
            context.logger.log("Cache miss for ${cacheKey}")
            String data = fetchFromDatabase(input.orderId as String)

            // Store in cache (5 minute TTL)
            jedis.setex(cacheKey, 300, data)

            [
                success: true,
                data: data,
                cached: false
            ]
        }
    }

    private String fetchFromDatabase(String orderId) {
        // Simulate database query
        "{\"orderId\": \"${orderId}\", \"status\": \"COMPLETED\"}"
    }
}
```

---

## Azure Functions Example

**HttpTriggerFunction.groovy:**
```groovy
package com.example.azure

import com.microsoft.azure.functions.*
import com.microsoft.azure.functions.annotation.*
import groovy.transform.CompileStatic
import groovy.util.logging.Slf4j

@Slf4j
@CompileStatic
class HttpTriggerFunction {

    @FunctionName('HttpTrigger')
    HttpResponseMessage run(
            @HttpTrigger(
                name = 'req',
                methods = [HttpMethod.GET, HttpMethod.POST],
                authLevel = AuthorizationLevel.ANONYMOUS
            ) HttpRequestMessage<Optional<String>> request,
            ExecutionContext context) {

        context.logger.info("Groovy HTTP trigger processed a request")

        // Groovy's safe navigation and Elvis operator
        String name = request.queryParameters?.name ?: request.body.orElse('Guest')

        // Groovy's string interpolation
        request.createResponseBuilder(HttpStatus.OK)
            .body("Hello, ${name}!")
            .header('Content-Type', 'text/plain')
            .build()
    }
}
```

**BlobTriggerFunction.groovy:**
```groovy
package com.example.azure

import com.microsoft.azure.functions.*
import com.microsoft.azure.functions.annotation.*
import groovy.transform.CompileStatic

@CompileStatic
class BlobTriggerFunction {

    @FunctionName('BlobTrigger')
    void run(
            @BlobTrigger(
                name = 'blob',
                path = 'uploads/{name}',
                connection = 'AzureWebJobsStorage'
            ) byte[] blob,
            @BindingName('name') String name,
            ExecutionContext context) {

        context.logger.info("Groovy Blob trigger processed blob: ${name}, size: ${blob.length} bytes")

        // Process blob
        procesBlob(blob, name, context)
    }

    private void procesBlob(byte[] blob, String name, ExecutionContext context) {
        // Groovy's with() for cleaner code
        def metadata = [
            fileName: name,
            size: blob.length,
            processed: true,
            timestamp: System.currentTimeMillis()
        ]

        context.logger.info("Blob metadata: ${metadata}")
    }
}
```

---

## Google Cloud Functions Example

**HttpFunction.groovy:**
```groovy
package com.example.gcp

import com.google.cloud.functions.HttpFunction
import com.google.cloud.functions.HttpRequest
import com.google.cloud.functions.HttpResponse
import groovy.json.JsonOutput
import groovy.transform.CompileStatic

@CompileStatic
class HttpFunction implements HttpFunction {

    @Override
    void service(HttpRequest request, HttpResponse response) {
        // Groovy's with() for response building
        response.with {
            writer.with { w ->
                def result = [
                    message: "Hello from Groovy Cloud Function!",
                    method: request.method,
                    path: request.path,
                    timestamp: System.currentTimeMillis()
                ]

                w.write(JsonOutput.toJson(result))
            }
            contentType = 'application/json'
            statusCode = 200
        }
    }
}
```

**StorageFunction.groovy:**
```groovy
package com.example.gcp

import com.google.cloud.functions.BackgroundFunction
import com.google.cloud.functions.Context
import com.google.events.cloud.storage.v1.StorageObjectData
import groovy.transform.CompileStatic
import groovy.util.logging.Slf4j

@Slf4j
@CompileStatic
class StorageFunction implements BackgroundFunction<StorageObjectData> {

    @Override
    void accept(StorageObjectData data, Context context) {
        log.info """
            Groovy Storage function triggered:
              Bucket: ${data.bucket}
              File: ${data.name}
              Size: ${data.size} bytes
              Content Type: ${data.contentType}
        """.stripIndent()

        // Process file
        processFile(data)
    }

    private void processFile(StorageObjectData data) {
        // File processing logic
        log.info "Processing file: ${data.name}"
    }
}
```

---

## Testing with Spock

### Lambda Handler Tests

**HttpApiHandlerSpec.groovy:**
```groovy
package com.example.lambda.handler

import com.amazonaws.services.lambda.runtime.Context
import com.amazonaws.services.lambda.runtime.LambdaLogger
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent
import spock.lang.Specification
import spock.lang.Subject

class HttpApiHandlerSpec extends Specification {

    @Subject
    HttpApiHandler handler = new HttpApiHandler()

    Context context = Mock() {
        getLogger() >> Mock(LambdaLogger)
    }

    def "should create order on POST request"() {
        given:
        def request = new APIGatewayProxyRequestEvent().with {
            httpMethod = 'POST'
            path = '/orders'
            body = '{"customerId":"CUST001","totalAmount":99.99}'
            it
        }

        when:
        def response = handler.handleRequest(request, context)

        then:
        response.statusCode == 201
        response.body.contains('CREATED')
    }

    def "should return 405 for unsupported methods"() {
        given:
        def request = new APIGatewayProxyRequestEvent().with {
            httpMethod = 'DELETE'
            path = '/orders'
            it
        }

        when:
        def response = handler.handleRequest(request, context)

        then:
        response.statusCode == 405
    }
}
```

### Integration Tests

**LambdaIntegrationSpec.groovy:**
```groovy
package com.example.lambda

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent
import spock.lang.Specification

class LambdaIntegrationSpec extends Specification {

    def "should handle end-to-end request flow"() {
        given:
        def request = new APIGatewayProxyRequestEvent().with {
            httpMethod = 'POST'
            path = '/orders'
            body = '{"customerId":"CUST001","totalAmount":149.99}'
            it
        }

        when:
        // Simulate full Lambda invocation
        def response = invokeLambda(request)

        then:
        response.statusCode == 201
        response.body.contains('orderId')
    }

    private Map invokeLambda(APIGatewayProxyRequestEvent request) {
        // Integration test logic
        [statusCode: 201, body: '{"orderId":"123"}']
    }
}
```

---

## Deployment

### AWS SAM Template

**template.yaml:**
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Globals:
  Function:
    Runtime: java11
    Timeout: 30
    MemorySize: 512

Resources:
  HttpApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: com.example.lambda.handler.HttpApiHandler
      CodeUri: build/libs/lambda-function.jar
      Events:
        Api:
          Type: Api
          Properties:
            Path: /orders
            Method: POST

  S3EventFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: com.example.lambda.handler.S3EventHandler
      CodeUri: build/libs/lambda-function.jar
      Events:
        S3Upload:
          Type: S3
          Properties:
            Bucket: !Ref UploadBucket
            Events: s3:ObjectCreated:*

  UploadBucket:
    Type: AWS::S3::Bucket
```

### Deploy with SAM

```bash
# Build
./gradlew shadowJar

# Deploy
sam deploy --guided
```

### Deploy with Serverless Framework

**serverless.yml:**
```yaml
service: groovy-serverless-example

provider:
  name: aws
  runtime: java11
  stage: ${opt:stage, 'dev'}
  region: us-east-1

functions:
  httpApi:
    handler: com.example.lambda.handler.HttpApiHandler
    events:
      - http:
          path: orders
          method: post

  s3Event:
    handler: com.example.lambda.handler.S3EventHandler
    events:
      - s3:
          bucket: uploads
          event: s3:ObjectCreated:*

package:
  artifact: build/libs/lambda-function.jar
```

```bash
# Deploy
serverless deploy
```

---

## Key Takeaways

1. **Stateless Functions** - No persistent state in function code
2. **Cold Start Optimization** - Static initialization and @CompileStatic
3. **Groovy Conciseness** - 40-50% less code than Java
4. **Event-Driven** - Functions triggered by various event sources
5. **Auto-Scaling** - Handles load automatically
6. **Pay-Per-Use** - Cost-effective for variable workloads
7. **Connection Pooling** - Reuse connections across invocations

**Groovy Advantages for Serverless:**
- **@CompileStatic** reduces cold start time
- **with()** method for cleaner resource handling
- **Closures** for elegant stream processing
- **Safe navigation** (?.) prevents null errors
- **String interpolation** for logging
- **Less boilerplate** than Java equivalents

**Performance Tips:**
- Use @CompileStatic for hot paths
- Initialize connections statically
- Use provisioned concurrency for critical functions
- Implement connection pooling
- Cache frequently accessed data

---

**Related Guides:**
- [Deep Dive: Serverless Architecture](../../../3-design/architecture-pattern/deep-dive-serverless.md)
- [Deep Dive: Event-Driven Architecture](../../../3-design/architecture-pattern/deep-dive-event-driven.md)
- [Groovy Setup Guide](../groovy/project-setup.md)

*Last Updated: 2025-10-20*
