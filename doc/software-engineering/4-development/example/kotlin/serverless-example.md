# Serverless Architecture - Kotlin Implementation

**Pattern:** Serverless Architecture (FaaS)
**Language:** Kotlin
**Platform:** AWS Lambda, Azure Functions, Google Cloud Functions
**Related Guide:** [Deep Dive: Serverless Architecture](../../../3-design/architecture-pattern/deep-dive-serverless.md)

## TL;DR

**Complete Serverless implementation** where Kotlin functions run in stateless containers triggered by events. **Key principle**: Write suspend functions → deploy to cloud → scale automatically → pay per execution. **Critical components**: Lambda handlers (Kotlin) → event triggers (HTTP, S3, DynamoDB, SQS) → cold start optimization → API Gateway → external state storage. **Kotlin advantages**: Coroutines for async → null safety → data classes for DTOs → extension functions → concise syntax → GraalVM native image support.

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
10. [Testing with MockK](#testing-with-mockk)
11. [Deployment](#deployment)

---

## Overview

This example demonstrates Serverless Architecture with:

- **AWS Lambda** - HTTP API, S3 trigger, DynamoDB stream (Kotlin)
- **Azure Functions** - HTTP trigger, Blob trigger, Queue trigger
- **Google Cloud Functions** - HTTP trigger, Cloud Storage trigger
- **Patterns** - Cold start optimization, coroutines, connection pooling, async processing

**Architecture:**
```
API Gateway → Lambda (HTTP) [Kotlin coroutines]
                ↓
           DynamoDB

S3 Upload → Lambda (S3 trigger) [Kotlin] → Resize image → S3

DynamoDB Stream → Lambda (Stream) [Kotlin] → Elasticsearch
```

---

## Project Structure

```
serverless-example/
├── aws-lambda/
│   ├── build.gradle.kts
│   └── src/main/kotlin/com/example/lambda/
│       ├── handler/
│       │   ├── HttpApiHandler.kt
│       │   ├── S3EventHandler.kt
│       │   └── DynamoDBStreamHandler.kt
│       ├── model/
│       │   ├── ApiRequest.kt
│       │   └── ApiResponse.kt
│       └── service/
│           ├── ImageService.kt
│           └── DataService.kt
│
├── azure-functions/
│   └── src/main/kotlin/com/example/azure/
│       ├── HttpTriggerFunction.kt
│       ├── BlobTriggerFunction.kt
│       └── QueueTriggerFunction.kt
│
└── google-cloud-functions/
    └── src/main/kotlin/com/example/gcp/
        ├── HttpFunction.kt
        └── StorageFunction.kt
```

---

## AWS Lambda Functions

### Build Configuration

**build.gradle.kts:**
```kotlin
plugins {
    kotlin("jvm") version "1.9.20"
    id("com.github.johnrengelman.shadow") version "8.1.1"
}

dependencies {
    implementation("com.amazonaws:aws-lambda-java-core:1.2.3")
    implementation("com.amazonaws:aws-lambda-java-events:3.11.3")
    implementation("software.amazon.awssdk:dynamodb:2.20.0")
    implementation("software.amazon.awssdk:s3:2.20.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin:2.15.3")

    testImplementation("io.mockk:mockk:1.13.8")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
}

tasks.shadowJar {
    archiveClassifier.set("")
    mergeServiceFiles()
}
```

### HTTP API Handler (with Coroutines)

**HttpApiHandler.kt:**
```kotlin
package com.example.lambda.handler

import com.amazonaws.services.lambda.runtime.Context
import com.amazonaws.services.lambda.runtime.RequestHandler
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import kotlinx.coroutines.runBlocking
import software.amazon.awssdk.services.dynamodb.DynamoDbClient
import software.amazon.awssdk.services.dynamodb.model.*
import java.math.BigDecimal
import java.util.*

/**
 * AWS Lambda HTTP API Handler (Kotlin with coroutines)
 */
class HttpApiHandler : RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    companion object {
        // Connection reuse across invocations (optimization)
        private val dynamoDb: DynamoDbClient = DynamoDbClient.builder().build()
        private val objectMapper = jacksonObjectMapper()
        private val tableName = System.getenv("ORDERS_TABLE") ?: "orders"
    }

    override fun handleRequest(
        request: APIGatewayProxyRequestEvent,
        context: Context
    ): APIGatewayProxyResponseEvent = runBlocking {
        context.logger.log("Received request: ${request.path}")

        try {
            when (request.httpMethod) {
                "POST" -> createOrder(request, context)
                "GET" -> getOrder(request, context)
                else -> buildResponse(405, mapOf("error" to "Method not allowed"))
            }
        } catch (e: Exception) {
            context.logger.log("Error: ${e.message}")
            buildResponse(500, mapOf("error" to "Internal server error"))
        }
    }

    private suspend fun createOrder(
        request: APIGatewayProxyRequestEvent,
        context: Context
    ): APIGatewayProxyResponseEvent {
        // Parse request body
        val orderRequest = objectMapper.readValue<OrderRequest>(request.body)

        // Create order
        val orderId = UUID.randomUUID().toString()

        val item = mapOf(
            "orderId" to AttributeValue.builder().s(orderId).build(),
            "customerId" to AttributeValue.builder().s(orderRequest.customerId).build(),
            "totalAmount" to AttributeValue.builder().n(orderRequest.totalAmount.toString()).build(),
            "createdAt" to AttributeValue.builder().n(System.currentTimeMillis().toString()).build()
        )

        dynamoDb.putItem(
            PutItemRequest.builder()
                .tableName(tableName)
                .item(item)
                .build()
        )

        context.logger.log("Created order: $orderId")

        // Build response
        val response = OrderResponse(
            orderId = orderId,
            customerId = orderRequest.customerId,
            totalAmount = orderRequest.totalAmount,
            status = "CREATED"
        )

        return buildResponse(201, response)
    }

    private suspend fun getOrder(
        request: APIGatewayProxyRequestEvent,
        context: Context
    ): APIGatewayProxyResponseEvent {
        val orderId = request.pathParameters?.get("orderId")
            ?: return buildResponse(400, mapOf("error" to "Missing orderId"))

        val key = mapOf(
            "orderId" to AttributeValue.builder().s(orderId).build()
        )

        val result = dynamoDb.getItem(
            GetItemRequest.builder()
                .tableName(tableName)
                .key(key)
                .build()
        )

        val item = result.item()
        if (item.isEmpty()) {
            return buildResponse(404, mapOf("error" to "Order not found"))
        }

        val response = OrderResponse(
            orderId = item["orderId"]?.s() ?: "",
            customerId = item["customerId"]?.s() ?: "",
            totalAmount = item["totalAmount"]?.n()?.toBigDecimalOrNull() ?: BigDecimal.ZERO,
            status = "RETRIEVED"
        )

        return buildResponse(200, response)
    }

    private fun buildResponse(statusCode: Int, body: Any): APIGatewayProxyResponseEvent {
        val headers = mapOf(
            "Content-Type" to "application/json",
            "Access-Control-Allow-Origin" to "*"
        )

        return APIGatewayProxyResponseEvent().apply {
            this.statusCode = statusCode
            this.headers = headers
            this.body = objectMapper.writeValueAsString(body)
        }
    }
}

// DTOs as data classes
data class OrderRequest(
    val customerId: String,
    val totalAmount: BigDecimal
)

data class OrderResponse(
    val orderId: String,
    val customerId: String,
    val totalAmount: BigDecimal,
    val status: String
)

// Extension function for null-safe BigDecimal conversion
fun String.toBigDecimalOrNull(): BigDecimal? = try {
    BigDecimal(this)
} catch (e: Exception) {
    null
}
```

### S3 Event Handler (with Coroutines)

**S3EventHandler.kt:**
```kotlin
package com.example.lambda.handler

import com.amazonaws.services.lambda.runtime.Context
import com.amazonaws.services.lambda.runtime.RequestHandler
import com.amazonaws.services.lambda.runtime.events.S3Event
import kotlinx.coroutines.*
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.GetObjectRequest
import software.amazon.awssdk.services.s3.model.PutObjectRequest
import java.awt.Graphics2D
import java.awt.RenderingHints
import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import javax.imageio.ImageIO

/**
 * S3 Event Handler - Triggered on file upload (Kotlin with coroutines)
 * Resizes images and saves thumbnails asynchronously
 */
class S3EventHandler : RequestHandler<S3Event, String> {

    companion object {
        private val s3Client: S3Client = S3Client.builder().build()
        private const val THUMBNAIL_WIDTH = 200
        private const val THUMBNAIL_HEIGHT = 200
    }

    override fun handleRequest(event: S3Event, context: Context): String = runBlocking {
        context.logger.log("Received S3 event with ${event.records.size} records")

        val jobs = event.records.map { record ->
            async(Dispatchers.IO) {
                val bucket = record.s3.bucket.name
                val key = record.s3.`object`.key

                context.logger.log("Processing file: $bucket/$key")

                try {
                    // Download image
                    val objectBytes = downloadImage(bucket, key)

                    // Resize image asynchronously
                    val thumbnail = resizeImage(objectBytes)

                    // Upload thumbnail
                    val thumbnailKey = "thumbnails/$key"
                    uploadThumbnail(bucket, thumbnailKey, thumbnail)

                    context.logger.log("Created thumbnail: $thumbnailKey")
                } catch (e: Exception) {
                    context.logger.log("Error processing file: ${e.message}")
                    throw e
                }
            }
        }

        // Wait for all jobs to complete
        jobs.awaitAll()

        "Successfully processed ${event.records.size} files"
    }

    private suspend fun downloadImage(bucket: String, key: String): ByteArray = withContext(Dispatchers.IO) {
        val request = GetObjectRequest.builder()
            .bucket(bucket)
            .key(key)
            .build()

        s3Client.getObject(request).readAllBytes()
    }

    private suspend fun resizeImage(imageBytes: ByteArray): ByteArray = withContext(Dispatchers.Default) {
        val originalImage = ImageIO.read(ByteArrayInputStream(imageBytes))

        val resizedImage = BufferedImage(
            THUMBNAIL_WIDTH,
            THUMBNAIL_HEIGHT,
            BufferedImage.TYPE_INT_RGB
        )

        val graphics: Graphics2D = resizedImage.createGraphics()
        graphics.setRenderingHint(
            RenderingHints.KEY_INTERPOLATION,
            RenderingHints.VALUE_INTERPOLATION_BILINEAR
        )
        graphics.drawImage(
            originalImage,
            0, 0,
            THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT,
            null
        )
        graphics.dispose()

        val outputStream = ByteArrayOutputStream()
        ImageIO.write(resizedImage, "jpg", outputStream)
        outputStream.toByteArray()
    }

    private suspend fun uploadThumbnail(
        bucket: String,
        key: String,
        imageBytes: ByteArray
    ) = withContext(Dispatchers.IO) {
        val request = PutObjectRequest.builder()
            .bucket(bucket)
            .key(key)
            .contentType("image/jpeg")
            .build()

        s3Client.putObject(request, RequestBody.fromBytes(imageBytes))
    }
}
```

### DynamoDB Stream Handler (with when expression)

**DynamoDBStreamHandler.kt:**
```kotlin
package com.example.lambda.handler

import com.amazonaws.services.lambda.runtime.Context
import com.amazonaws.services.lambda.runtime.RequestHandler
import com.amazonaws.services.lambda.runtime.events.DynamodbEvent
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext

/**
 * DynamoDB Stream Handler - Triggered on table changes (Kotlin)
 * Syncs data to Elasticsearch for search
 */
class DynamoDBStreamHandler : RequestHandler<DynamodbEvent, String> {

    override fun handleRequest(event: DynamodbEvent, context: Context): String = runBlocking {
        context.logger.log("Received DynamoDB stream event with ${event.records.size} records")

        event.records.forEach { record ->
            val eventName = record.eventName
            context.logger.log("Event: $eventName")

            when (eventName) {
                "INSERT" -> handleInsert(record, context)
                "MODIFY" -> handleModify(record, context)
                "REMOVE" -> handleRemove(record, context)
                else -> context.logger.log("Unknown event: $eventName")
            }
        }

        "Successfully processed ${event.records.size} records"
    }

    private suspend fun handleInsert(
        record: DynamodbEvent.DynamodbStreamRecord,
        context: Context
    ) = withContext(Dispatchers.IO) {
        val newImage = record.dynamodb.newImage
        val orderId = newImage["orderId"]?.s

        context.logger.log("Insert: $orderId")
        orderId?.let { indexInElasticsearch(it, newImage) }
    }

    private suspend fun handleModify(
        record: DynamodbEvent.DynamodbStreamRecord,
        context: Context
    ) = withContext(Dispatchers.IO) {
        val newImage = record.dynamodb.newImage
        val orderId = newImage["orderId"]?.s

        context.logger.log("Modify: $orderId")
        orderId?.let { updateInElasticsearch(it, newImage) }
    }

    private suspend fun handleRemove(
        record: DynamodbEvent.DynamodbStreamRecord,
        context: Context
    ) = withContext(Dispatchers.IO) {
        val oldImage = record.dynamodb.oldImage
        val orderId = oldImage["orderId"]?.s

        context.logger.log("Remove: $orderId")
        orderId?.let { deleteFromElasticsearch(it) }
    }

    private suspend fun indexInElasticsearch(
        orderId: String,
        data: Map<String, com.amazonaws.services.lambda.runtime.events.models.dynamodb.AttributeValue>
    ) {
        // TODO: Call Elasticsearch API
        println("Indexing in Elasticsearch: $orderId")
    }

    private suspend fun updateInElasticsearch(
        orderId: String,
        data: Map<String, com.amazonaws.services.lambda.runtime.events.models.dynamodb.AttributeValue>
    ) {
        // TODO: Call Elasticsearch API
        println("Updating in Elasticsearch: $orderId")
    }

    private suspend fun deleteFromElasticsearch(orderId: String) {
        // TODO: Call Elasticsearch API
        println("Deleting from Elasticsearch: $orderId")
    }
}
```

---

## Event Triggers

### Trigger Types (serverless.yml)

```yaml
# serverless.yml (Serverless Framework)
service: serverless-kotlin-example

provider:
  name: aws
  runtime: java11
  region: us-east-1
  memorySize: 512
  timeout: 30

package:
  artifact: build/libs/lambda-all.jar

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

**OptimizedHandler.kt:**
```kotlin
package com.example.lambda.handler

import com.amazonaws.services.lambda.runtime.Context
import com.amazonaws.services.lambda.runtime.RequestHandler
import kotlinx.coroutines.runBlocking

/**
 * Optimized Lambda Handler (Kotlin)
 * Techniques to reduce cold start time
 */
class OptimizedHandler : RequestHandler<String, String> {

    companion object {
        // 1. Static initialization (reused across invocations)
        private val dbConnection: DatabaseConnection = initializeDatabase()
        private var serviceClient: ServiceClient? = null

        // 2. Connection pooling
        init {
            System.setProperty("http.maxConnections", "50")
        }

        private fun initializeDatabase(): DatabaseConnection {
            // Initialize once, reuse across invocations
            return DatabaseConnection(System.getenv("DB_URL") ?: "")
        }

        // 3. Lazy initialization (only when needed)
        private fun getServiceClient(): ServiceClient {
            return serviceClient ?: ServiceClient().also { serviceClient = it }
        }
    }

    override fun handleRequest(input: String, context: Context): String = runBlocking {
        // 4. Minimize dependencies (smaller JAR = faster cold start)
        // 5. Use GraalVM native image (optional, faster startup)

        // Check if warm invocation
        if (isWarmInvocation()) {
            context.logger.log("Warm invocation - connections reused")
        } else {
            context.logger.log("Cold start detected")
        }

        // Business logic with coroutines
        processRequest(input)
    }

    private fun isWarmInvocation(): Boolean {
        return dbConnection.isConnected()
    }

    private suspend fun processRequest(input: String): String {
        return dbConnection.query("SELECT * FROM data WHERE id = ?", input)
    }

    // Placeholder classes
    class DatabaseConnection(private val url: String) {
        fun isConnected(): Boolean = url.isNotEmpty()
        suspend fun query(sql: String, param: String): String = "result"
    }

    class ServiceClient
}
```

### GraalVM Native Image Configuration

**native-image.properties:**
```properties
Args = --no-fallback \
       --initialize-at-build-time \
       -H:+ReportExceptionStackTraces \
       -H:+PrintClassInitialization
```

**build.gradle.kts (Native Image):**
```kotlin
plugins {
    id("org.graalvm.buildtools.native") version "0.9.28"
}

graalvmNative {
    binaries {
        named("main") {
            imageName.set("lambda-function")
            mainClass.set("com.example.lambda.handler.HttpApiHandler")
            buildArgs.add("--no-fallback")
        }
    }
}
```

---

## API Gateway Integration

### REST API with Extension Functions

**RestApiHandler.kt:**
```kotlin
package com.example.lambda.handler

import com.amazonaws.services.lambda.runtime.Context
import com.amazonaws.services.lambda.runtime.RequestHandler
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper

class RestApiHandler : RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private val objectMapper = jacksonObjectMapper()

    override fun handleRequest(
        request: APIGatewayProxyRequestEvent,
        context: Context
    ): APIGatewayProxyResponseEvent {
        // Handle OPTIONS (preflight)
        if (request.httpMethod == "OPTIONS") {
            return buildCorsResponse(200)
        }

        // Route request
        return when (request.resource) {
            "/orders" -> handleOrders(request.httpMethod, request, context)
            "/orders/{orderId}" -> handleOrder(request.httpMethod, request, context)
            else -> buildResponse(404, mapOf("error" to "Not found"))
        }
    }

    private fun handleOrders(
        method: String,
        request: APIGatewayProxyRequestEvent,
        context: Context
    ): APIGatewayProxyResponseEvent {
        return buildResponse(200, mapOf("message" to "Orders handled"))
    }

    private fun handleOrder(
        method: String,
        request: APIGatewayProxyRequestEvent,
        context: Context
    ): APIGatewayProxyResponseEvent {
        return buildResponse(200, mapOf("message" to "Order handled"))
    }

    // Extension function for building responses
    private fun buildResponse(statusCode: Int, body: Any): APIGatewayProxyResponseEvent {
        return APIGatewayProxyResponseEvent().apply {
            this.statusCode = statusCode
            this.headers = corsHeaders()
            this.body = objectMapper.writeValueAsString(body)
        }
    }

    private fun buildCorsResponse(statusCode: Int): APIGatewayProxyResponseEvent {
        return APIGatewayProxyResponseEvent().apply {
            this.statusCode = statusCode
            this.headers = corsHeaders()
        }
    }

    private fun corsHeaders(): Map<String, String> = mapOf(
        "Access-Control-Allow-Origin" to "*",
        "Access-Control-Allow-Methods" to "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers" to "Content-Type,Authorization"
    )
}
```

---

## State Management

### Using DynamoDB (with Extension Functions)

**DataService.kt:**
```kotlin
package com.example.lambda.service

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import software.amazon.awssdk.services.dynamodb.DynamoDbClient
import software.amazon.awssdk.services.dynamodb.model.*

/**
 * Stateless function using DynamoDB for persistence (Kotlin)
 */
class DataService {
    companion object {
        private val dynamoDb: DynamoDbClient = DynamoDbClient.builder().build()
        private val tableName = System.getenv("DATA_TABLE") ?: "data"
    }

    suspend fun saveData(key: String, value: String) = withContext(Dispatchers.IO) {
        val item = mapOf(
            "id" to key.toAttributeValue(),
            "data" to value.toAttributeValue(),
            "timestamp" to System.currentTimeMillis().toString().toAttributeValue()
        )

        dynamoDb.putItem(
            PutItemRequest.builder()
                .tableName(tableName)
                .item(item)
                .build()
        )
    }

    suspend fun getData(key: String): String? = withContext(Dispatchers.IO) {
        val result = dynamoDb.getItem(
            GetItemRequest.builder()
                .tableName(tableName)
                .key(mapOf("id" to key.toAttributeValue()))
                .build()
        )

        result.item()["data"]?.s()
    }
}

// Extension functions for AttributeValue
fun String.toAttributeValue(): AttributeValue = AttributeValue.builder().s(this).build()
fun Long.toAttributeValue(): AttributeValue = AttributeValue.builder().n(this.toString()).build()
```

---

## Azure Functions Example

**HttpTriggerFunction.kt:**
```kotlin
package com.example.azure

import com.microsoft.azure.functions.*
import com.microsoft.azure.functions.annotation.*
import kotlinx.coroutines.runBlocking

/**
 * Azure Functions HTTP Trigger (Kotlin)
 */
class HttpTriggerFunction {

    @FunctionName("HttpExample")
    fun run(
        @HttpTrigger(
            name = "req",
            methods = [HttpMethod.GET, HttpMethod.POST],
            authLevel = AuthorizationLevel.ANONYMOUS
        ) request: HttpRequestMessage<String?>,
        context: ExecutionContext
    ): HttpResponseMessage = runBlocking {
        context.logger.info("Kotlin HTTP trigger processed a request.")

        // Get query parameter
        val name = request.queryParameters["name"]

        // Get request body
        val body = request.body

        when {
            name != null -> request.createResponseBuilder(HttpStatus.OK)
                .body("Hello, $name")
                .build()
            body != null -> request.createResponseBuilder(HttpStatus.OK)
                .body("Hello, $body")
                .build()
            else -> request.createResponseBuilder(HttpStatus.BAD_REQUEST)
                .body("Please pass a name on the query string or in the request body")
                .build()
        }
    }
}
```

**BlobTriggerFunction.kt:**
```kotlin
package com.example.azure

import com.microsoft.azure.functions.*
import com.microsoft.azure.functions.annotation.*
import kotlinx.coroutines.runBlocking

/**
 * Azure Functions Blob Trigger (Kotlin with coroutines)
 */
class BlobTriggerFunction {

    @FunctionName("BlobTriggerExample")
    fun run(
        @BlobTrigger(
            name = "content",
            path = "uploads/{name}",
            connection = "AzureWebJobsStorage"
        ) content: ByteArray,
        @BindingName("name") name: String,
        context: ExecutionContext
    ): Unit = runBlocking {
        context.logger.info("Kotlin Blob trigger processed: $name Size: ${content.size} bytes")
        // Process blob asynchronously
    }
}
```

---

## Google Cloud Functions Example

**HttpFunction.kt:**
```kotlin
package com.example.gcp

import com.google.cloud.functions.HttpFunction
import com.google.cloud.functions.HttpRequest
import com.google.cloud.functions.HttpResponse
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import kotlinx.coroutines.runBlocking

/**
 * Google Cloud Functions HTTP Trigger (Kotlin)
 */
class HttpFunction : HttpFunction {
    private val objectMapper = jacksonObjectMapper()

    override fun service(request: HttpRequest, response: HttpResponse) = runBlocking {
        val writer = response.writer

        when (request.method) {
            "GET" -> {
                val name = request.getFirstQueryParameter("name").orElse("World")
                writer.write("Hello, $name!")
            }
            "POST" -> {
                val body = objectMapper.readValue<RequestBody>(request.reader)
                writer.write("Received: ${body.message}")
            }
            else -> response.setStatusCode(405)
        }
    }

    data class RequestBody(val message: String)
}
```

---

## Testing with MockK

### Lambda Handler Test

**HttpApiHandlerTest.kt:**
```kotlin
package com.example.lambda.handler

import com.amazonaws.services.lambda.runtime.Context
import com.amazonaws.services.lambda.runtime.LambdaLogger
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
class HttpApiHandlerTest {

    private val handler = HttpApiHandler()

    @Test
    fun `should create order`() = runTest {
        // Given
        val request = APIGatewayProxyRequestEvent().apply {
            httpMethod = "POST"
            path = "/orders"
            body = """{"customerId":"CUST001","totalAmount":100.0}"""
        }

        val context = mockk<Context>()
        val logger = mockk<LambdaLogger>(relaxed = true)
        every { context.logger } returns logger

        // When
        val response = handler.handleRequest(request, context)

        // Then
        assertEquals(201, response.statusCode)
        assertTrue(response.body.contains("orderId"))
    }

    @Test
    fun `should return 405 for unsupported method`() {
        // Given
        val request = APIGatewayProxyRequestEvent().apply {
            httpMethod = "DELETE"
            path = "/orders"
        }

        val context = mockk<Context>()
        val logger = mockk<LambdaLogger>(relaxed = true)
        every { context.logger } returns logger

        // When
        val response = handler.handleRequest(request, context)

        // Then
        assertEquals(405, response.statusCode)
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
      CodeUri: build/libs/lambda-all.jar
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
      CodeUri: build/libs/lambda-all.jar
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
# Build fat JAR
./gradlew shadowJar

# Deploy with SAM
sam build
sam deploy --guided

# Or with Serverless Framework
serverless deploy

# Or with AWS CLI
aws lambda create-function \
  --function-name kotlin-function \
  --runtime java11 \
  --role arn:aws:iam::ACCOUNT:role/lambda-role \
  --handler com.example.lambda.handler.HttpApiHandler \
  --zip-file fileb://build/libs/lambda-all.jar \
  --timeout 30 \
  --memory-size 512
```

### GraalVM Native Image Deployment

```bash
# Build native image
./gradlew nativeCompile

# Package for Lambda
zip lambda-native.zip bootstrap

# Deploy
aws lambda create-function \
  --function-name kotlin-native-function \
  --runtime provided.al2 \
  --role arn:aws:iam::ACCOUNT:role/lambda-role \
  --handler bootstrap \
  --zip-file fileb://lambda-native.zip
```

---

## Key Takeaways

1. **Coroutines for Async** - Non-blocking I/O with suspend functions
2. **Null Safety** - Compile-time null checks prevent runtime errors
3. **Data Classes** - Perfect for DTOs and events
4. **Extension Functions** - Add functionality to existing classes
5. **Sealed Classes** - Type-safe error handling
6. **Smart Casts** - Automatic type casting in when expressions
7. **GraalVM Native Image** - Faster cold starts, lower memory usage
8. **Concise Syntax** - Less boilerplate than Java

---

**Related Guides:**
- [Deep Dive: Serverless Architecture](../../../3-design/architecture-pattern/deep-dive-serverless.md)
- [Deep Dive: Event-Driven Architecture](../../../3-design/architecture-pattern/deep-dive-event-driven.md)
- [Kotlin Project Setup](project-setup.md)

*Last Updated: 2025-10-20*
