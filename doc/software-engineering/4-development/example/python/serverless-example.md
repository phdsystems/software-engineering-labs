# Serverless Architecture - Python Implementation

**Pattern:** Serverless Architecture (FaaS)
**Language:** Python
**Platform:** AWS Lambda, Azure Functions, Google Cloud Functions
**Related Guide:** [Deep Dive: Serverless Architecture](../../../3-design/architecture-pattern/deep-dive-serverless.md)

## TL;DR

**Complete Serverless implementation** using Python 3.11+ with async/await, type hints, and Pydantic validation. **Key advantages**: Fast cold starts (Python interpreter) → native async support → rich ecosystem (boto3, FastAPI) → minimal dependencies → excellent for data processing. **Critical patterns**: Lambda layers for dependencies → async handlers for I/O → connection reuse → type-safe request/response → comprehensive observability.

**Python strengths for serverless**: Faster cold starts than Java → built-in async → simpler deployment → perfect for data/ML tasks → extensive AWS SDK support.

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
12. [Performance Optimization](#performance-optimization)

---

## Overview

This example demonstrates Serverless Architecture with Python featuring:

- **AWS Lambda** - HTTP API (FastAPI integration), S3 triggers, DynamoDB Streams, SQS
- **Azure Functions** - HTTP trigger, Blob trigger, Queue trigger
- **Google Cloud Functions** - HTTP trigger, Cloud Storage trigger, Pub/Sub
- **Patterns** - Async handlers, type safety, dependency layers, observability

**Architecture:**
```
API Gateway → Lambda (FastAPI)
                ↓
           DynamoDB

S3 Upload → Lambda (async) → Process image → S3
                              ↓
                          SQS Queue

DynamoDB Stream → Lambda → OpenSearch

EventBridge Schedule → Lambda (cron) → Generate reports

SQS → Lambda (batch) → Process orders
```

**Python Advantages:**
- ⚡ Fast cold starts (100-300ms vs 1-2s for Java)
- 🔄 Native async/await for I/O operations
- 📦 Smaller deployment packages
- 🐍 Rich data processing libraries (Pandas, NumPy, Pillow)
- 🧪 Easy mocking and testing
- 🎯 Type hints for safety without runtime overhead

---

## Project Structure

```
serverless-python/
├── aws-lambda/
│   ├── functions/
│   │   ├── http-api/
│   │   │   ├── handler.py
│   │   │   ├── models.py
│   │   │   ├── service.py
│   │   │   └── requirements.txt
│   │   ├── s3-processor/
│   │   │   ├── handler.py
│   │   │   ├── image_processor.py
│   │   │   └── requirements.txt
│   │   ├── dynamodb-stream/
│   │   │   ├── handler.py
│   │   │   └── requirements.txt
│   │   ├── sqs-processor/
│   │   │   ├── handler.py
│   │   │   └── requirements.txt
│   │   └── scheduled-task/
│   │       ├── handler.py
│   │       └── requirements.txt
│   ├── layers/
│   │   └── common/
│   │       ├── python/
│   │       │   └── lib/
│   │       │       ├── config.py
│   │       │       ├── logging_config.py
│   │       │       └── utils.py
│   │       └── requirements.txt
│   ├── template.yaml          # SAM template
│   └── serverless.yml         # Serverless Framework
│
├── azure-functions/
│   ├── function_app.py
│   ├── requirements.txt
│   └── host.json
│
├── google-cloud-functions/
│   ├── http_function/
│   │   ├── main.py
│   │   └── requirements.txt
│   └── storage_function/
│       ├── main.py
│       └── requirements.txt
│
└── tests/
    ├── test_http_handler.py
    ├── test_s3_processor.py
    └── conftest.py
```

---

## AWS Lambda Functions

### HTTP API Handler (FastAPI Integration)

**handler.py:**
```python
"""
AWS Lambda HTTP API Handler with FastAPI
Handles REST API requests via API Gateway with type safety
"""
import json
import os
from typing import Any, Dict
from datetime import datetime
from decimal import Decimal

import boto3
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit
from pydantic import BaseModel, Field, validator

# Initialize AWS Lambda Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics()
app = APIGatewayRestResolver()

# Initialize DynamoDB (connection reuse across invocations)
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['ORDERS_TABLE'])


# Request/Response Models with Pydantic
class OrderRequest(BaseModel):
    """Order creation request"""
    customer_id: str = Field(..., min_length=1, max_length=50)
    total_amount: Decimal = Field(..., gt=0)
    items: list[str] = Field(..., min_items=1)

    @validator('total_amount')
    def validate_amount(cls, v):
        if v > Decimal('100000'):
            raise ValueError('Amount exceeds maximum limit')
        return v


class OrderResponse(BaseModel):
    """Order response"""
    order_id: str
    customer_id: str
    total_amount: Decimal
    status: str
    created_at: str


# API Routes
@app.post("/orders")
@tracer.capture_method
def create_order() -> Dict[str, Any]:
    """Create new order"""
    try:
        # Parse and validate request
        request_data = app.current_event.json_body
        order_request = OrderRequest(**request_data)

        # Generate order ID
        order_id = f"ORD-{datetime.utcnow().strftime('%Y%m%d')}-{os.urandom(4).hex()}"

        # Save to DynamoDB
        item = {
            'orderId': order_id,
            'customerId': order_request.customer_id,
            'totalAmount': order_request.total_amount,
            'items': order_request.items,
            'status': 'CREATED',
            'createdAt': datetime.utcnow().isoformat(),
        }

        table.put_item(Item=item)

        # Log and metrics
        logger.info("Order created", extra={"order_id": order_id})
        metrics.add_metric(name="OrderCreated", unit=MetricUnit.Count, value=1)

        # Build response
        response = OrderResponse(
            order_id=order_id,
            customer_id=order_request.customer_id,
            total_amount=order_request.total_amount,
            status='CREATED',
            created_at=item['createdAt']
        )

        return {
            "statusCode": 201,
            "body": response.model_dump_json()
        }

    except ValueError as e:
        logger.error("Validation error", extra={"error": str(e)})
        return {
            "statusCode": 400,
            "body": json.dumps({"error": str(e)})
        }


@app.get("/orders/<order_id>")
@tracer.capture_method
def get_order(order_id: str) -> Dict[str, Any]:
    """Get order by ID"""
    try:
        # Query DynamoDB
        response = table.get_item(Key={'orderId': order_id})

        if 'Item' not in response:
            return {
                "statusCode": 404,
                "body": json.dumps({"error": "Order not found"})
            }

        item = response['Item']

        # Build response
        order_response = OrderResponse(
            order_id=item['orderId'],
            customer_id=item['customerId'],
            total_amount=item['totalAmount'],
            status=item['status'],
            created_at=item['createdAt']
        )

        metrics.add_metric(name="OrderRetrieved", unit=MetricUnit.Count, value=1)

        return {
            "statusCode": 200,
            "body": order_response.model_dump_json()
        }

    except Exception as e:
        logger.exception("Error retrieving order")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "Internal server error"})
        }


# Lambda handler
@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Lambda entry point"""
    return app.resolve(event, context)
```

**models.py:**
```python
"""
Data models for HTTP API
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field


class Order(BaseModel):
    """Order domain model"""
    order_id: str
    customer_id: str
    total_amount: Decimal
    items: list[str]
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        """Pydantic config"""
        json_encoders = {
            Decimal: lambda v: float(v),
            datetime: lambda v: v.isoformat()
        }
```

**requirements.txt:**
```txt
boto3>=1.34.0
aws-lambda-powertools>=2.31.0
pydantic>=2.5.0
```

---

### S3 Event Handler (Async Image Processing)

**handler.py:**
```python
"""
S3 Event Handler - Async Image Processing
Triggered on S3 upload, resizes images and saves thumbnails
"""
import asyncio
import io
import os
from typing import Any, Dict, List
from urllib.parse import unquote_plus

import boto3
from aws_lambda_powertools import Logger, Tracer
from PIL import Image

logger = Logger()
tracer = Tracer()

# Initialize S3 client (reused across invocations)
s3_client = boto3.client('s3')

# Configuration
THUMBNAIL_SIZES = [(200, 200), (400, 400), (800, 800)]
SUPPORTED_FORMATS = {'.jpg', '.jpeg', '.png', '.webp'}


class ImageProcessor:
    """Image processing utility"""

    @staticmethod
    async def resize_image(
        image_bytes: bytes,
        size: tuple[int, int]
    ) -> bytes:
        """Resize image maintaining aspect ratio"""
        # Run CPU-intensive operation in thread pool
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            ImageProcessor._resize_sync,
            image_bytes,
            size
        )

    @staticmethod
    def _resize_sync(image_bytes: bytes, size: tuple[int, int]) -> bytes:
        """Synchronous resize operation"""
        img = Image.open(io.BytesIO(image_bytes))

        # Convert RGBA to RGB if necessary
        if img.mode == 'RGBA':
            img = img.convert('RGB')

        # Resize maintaining aspect ratio
        img.thumbnail(size, Image.Resampling.LANCZOS)

        # Save to bytes
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG', quality=85, optimize=True)
        return buffer.getvalue()


async def process_image(
    bucket: str,
    key: str,
    processor: ImageProcessor
) -> List[str]:
    """Process single image - create multiple thumbnails"""
    logger.info(f"Processing image: {bucket}/{key}")

    try:
        # Download original image
        response = s3_client.get_object(Bucket=bucket, Key=key)
        image_bytes = response['Body'].read()

        # Create thumbnails asynchronously
        tasks = [
            processor.resize_image(image_bytes, size)
            for size in THUMBNAIL_SIZES
        ]
        thumbnails = await asyncio.gather(*tasks)

        # Upload thumbnails
        uploaded_keys = []
        for size, thumbnail_bytes in zip(THUMBNAIL_SIZES, thumbnails):
            thumbnail_key = f"thumbnails/{size[0]}x{size[1]}/{key}"

            s3_client.put_object(
                Bucket=bucket,
                Key=thumbnail_key,
                Body=thumbnail_bytes,
                ContentType='image/jpeg',
                Metadata={
                    'original-key': key,
                    'thumbnail-size': f"{size[0]}x{size[1]}"
                }
            )

            uploaded_keys.append(thumbnail_key)
            logger.info(f"Created thumbnail: {thumbnail_key}")

        return uploaded_keys

    except Exception as e:
        logger.exception(f"Error processing image {key}")
        raise


async def process_s3_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """Process S3 event - handle multiple records"""
    processor = ImageProcessor()
    results = []

    # Process all records concurrently
    tasks = []
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = unquote_plus(record['s3']['object']['key'])

        # Check if supported format
        if any(key.lower().endswith(fmt) for fmt in SUPPORTED_FORMATS):
            tasks.append(process_image(bucket, key, processor))
        else:
            logger.warning(f"Unsupported format: {key}")

    if tasks:
        results = await asyncio.gather(*tasks, return_exceptions=True)

    # Log results
    success_count = sum(1 for r in results if not isinstance(r, Exception))
    logger.info(f"Processed {success_count}/{len(tasks)} images successfully")

    return {
        'processedCount': success_count,
        'totalCount': len(tasks)
    }


@logger.inject_lambda_context
@tracer.capture_lambda_handler
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Lambda entry point - async wrapper"""
    # Run async function
    return asyncio.run(process_s3_event(event))
```

**requirements.txt:**
```txt
boto3>=1.34.0
aws-lambda-powertools>=2.31.0
Pillow>=10.1.0
```

---

### DynamoDB Stream Handler

**handler.py:**
```python
"""
DynamoDB Stream Handler
Syncs data changes to OpenSearch for full-text search
"""
import json
import os
from typing import Any, Dict, List
from datetime import datetime

import boto3
from aws_lambda_powertools import Logger, Tracer
from opensearchpy import OpenSearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth

logger = Logger()
tracer = Tracer()

# Initialize OpenSearch client
region = os.environ.get('AWS_REGION', 'us-east-1')
service = 'es'
credentials = boto3.Session().get_credentials()
awsauth = AWS4Auth(
    credentials.access_key,
    credentials.secret_key,
    region,
    service,
    session_token=credentials.token
)

opensearch = OpenSearch(
    hosts=[{'host': os.environ['OPENSEARCH_ENDPOINT'], 'port': 443}],
    http_auth=awsauth,
    use_ssl=True,
    verify_certs=True,
    connection_class=RequestsHttpConnection
)

INDEX_NAME = 'orders'


class StreamProcessor:
    """Process DynamoDB stream records"""

    @staticmethod
    def process_insert(record: Dict[str, Any]) -> None:
        """Handle INSERT event"""
        new_image = record['dynamodb']['NewImage']
        order_id = new_image['orderId']['S']

        logger.info(f"Processing INSERT for order: {order_id}")

        # Convert DynamoDB format to document
        doc = StreamProcessor._convert_dynamodb_to_doc(new_image)

        # Index in OpenSearch
        opensearch.index(
            index=INDEX_NAME,
            id=order_id,
            body=doc
        )

        logger.info(f"Indexed order in OpenSearch: {order_id}")

    @staticmethod
    def process_modify(record: Dict[str, Any]) -> None:
        """Handle MODIFY event"""
        new_image = record['dynamodb']['NewImage']
        order_id = new_image['orderId']['S']

        logger.info(f"Processing MODIFY for order: {order_id}")

        # Convert and update
        doc = StreamProcessor._convert_dynamodb_to_doc(new_image)

        opensearch.update(
            index=INDEX_NAME,
            id=order_id,
            body={'doc': doc}
        )

        logger.info(f"Updated order in OpenSearch: {order_id}")

    @staticmethod
    def process_remove(record: Dict[str, Any]) -> None:
        """Handle REMOVE event"""
        old_image = record['dynamodb']['OldImage']
        order_id = old_image['orderId']['S']

        logger.info(f"Processing REMOVE for order: {order_id}")

        # Delete from OpenSearch
        opensearch.delete(
            index=INDEX_NAME,
            id=order_id
        )

        logger.info(f"Deleted order from OpenSearch: {order_id}")

    @staticmethod
    def _convert_dynamodb_to_doc(image: Dict[str, Any]) -> Dict[str, Any]:
        """Convert DynamoDB item to OpenSearch document"""
        return {
            'orderId': image['orderId']['S'],
            'customerId': image['customerId']['S'],
            'totalAmount': float(image['totalAmount']['N']),
            'status': image['status']['S'],
            'createdAt': image['createdAt']['S'],
            'indexed_at': datetime.utcnow().isoformat()
        }


@logger.inject_lambda_context
@tracer.capture_lambda_handler
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Lambda entry point"""
    logger.info(f"Received {len(event['Records'])} DynamoDB stream records")

    processor = StreamProcessor()
    processed = 0
    errors = 0

    for record in event['Records']:
        try:
            event_name = record['eventName']

            if event_name == 'INSERT':
                processor.process_insert(record)
            elif event_name == 'MODIFY':
                processor.process_modify(record)
            elif event_name == 'REMOVE':
                processor.process_remove(record)

            processed += 1

        except Exception as e:
            logger.exception(f"Error processing record: {e}")
            errors += 1

    logger.info(f"Processed {processed} records, {errors} errors")

    return {
        'processed': processed,
        'errors': errors
    }
```

**requirements.txt:**
```txt
boto3>=1.34.0
aws-lambda-powertools>=2.31.0
opensearch-py>=2.4.0
requests-aws4auth>=1.2.0
```

---

### SQS Queue Processor

**handler.py:**
```python
"""
SQS Queue Processor
Batch process messages from SQS queue
"""
import json
import os
from typing import Any, Dict, List
from dataclasses import dataclass

import boto3
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.utilities.batch import (
    BatchProcessor,
    EventType,
    batch_processor
)
from aws_lambda_powertools.utilities.data_classes.sqs_event import SQSRecord

logger = Logger()
tracer = Tracer()
metrics = Metrics()

# Initialize services
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['ORDERS_TABLE'])
processor = BatchProcessor(event_type=EventType.SQS)


@dataclass
class OrderMessage:
    """Order message from SQS"""
    order_id: str
    action: str
    data: Dict[str, Any]


def record_handler(record: SQSRecord) -> None:
    """Process individual SQS record"""
    try:
        # Parse message
        body = json.loads(record.body)
        message = OrderMessage(**body)

        logger.info(f"Processing order: {message.order_id}, action: {message.action}")

        # Process based on action
        if message.action == 'process_payment':
            process_payment(message)
        elif message.action == 'send_confirmation':
            send_confirmation(message)
        elif message.action == 'update_inventory':
            update_inventory(message)
        else:
            logger.warning(f"Unknown action: {message.action}")

        metrics.add_metric(name="MessageProcessed", unit="Count", value=1)

    except Exception as e:
        logger.exception(f"Error processing record: {e}")
        raise  # Re-raise to mark as failed


def process_payment(message: OrderMessage) -> None:
    """Process payment for order"""
    logger.info(f"Processing payment for order: {message.order_id}")

    # Update order status
    table.update_item(
        Key={'orderId': message.order_id},
        UpdateExpression='SET #status = :status, paymentProcessedAt = :timestamp',
        ExpressionAttributeNames={'#status': 'status'},
        ExpressionAttributeValues={
            ':status': 'PAYMENT_PROCESSED',
            ':timestamp': message.data.get('timestamp')
        }
    )


def send_confirmation(message: OrderMessage) -> None:
    """Send order confirmation email"""
    logger.info(f"Sending confirmation for order: {message.order_id}")

    # In production, integrate with SES or SNS
    # For now, just log
    email = message.data.get('customer_email')
    logger.info(f"Would send confirmation to: {email}")


def update_inventory(message: OrderMessage) -> None:
    """Update inventory for ordered items"""
    logger.info(f"Updating inventory for order: {message.order_id}")

    items = message.data.get('items', [])
    logger.info(f"Updating inventory for {len(items)} items")


@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics
@batch_processor(record_handler=record_handler, processor=processor)
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Lambda entry point with batch processing"""
    return processor.response()
```

**requirements.txt:**
```txt
boto3>=1.34.0
aws-lambda-powertools>=2.31.0
```

---

### Scheduled Function (EventBridge/CloudWatch)

**handler.py:**
```python
"""
Scheduled Lambda Function
Runs on schedule to generate daily reports
"""
import os
from datetime import datetime, timedelta
from typing import Any, Dict, List
from decimal import Decimal

import boto3
from aws_lambda_powertools import Logger, Tracer
from boto3.dynamodb.conditions import Key

logger = Logger()
tracer = Tracer()

# Initialize services
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')
table = dynamodb.Table(os.environ['ORDERS_TABLE'])
reports_bucket = os.environ['REPORTS_BUCKET']


@dataclass
class DailyReport:
    """Daily sales report"""
    date: str
    total_orders: int
    total_revenue: Decimal
    average_order_value: Decimal
    orders_by_status: Dict[str, int]


class ReportGenerator:
    """Generate daily sales reports"""

    @staticmethod
    async def generate_daily_report(date: datetime) -> DailyReport:
        """Generate report for specific date"""
        logger.info(f"Generating report for {date.date()}")

        # Query orders for the date
        start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)

        # Scan with filter (in production, use GSI with date partition)
        response = table.scan(
            FilterExpression=Key('createdAt').between(
                start_of_day.isoformat(),
                end_of_day.isoformat()
            )
        )

        orders = response.get('Items', [])

        # Calculate metrics
        total_orders = len(orders)
        total_revenue = sum(Decimal(str(o['totalAmount'])) for o in orders)
        average_order_value = total_revenue / total_orders if total_orders > 0 else Decimal('0')

        # Orders by status
        orders_by_status = {}
        for order in orders:
            status = order['status']
            orders_by_status[status] = orders_by_status.get(status, 0) + 1

        return DailyReport(
            date=date.date().isoformat(),
            total_orders=total_orders,
            total_revenue=total_revenue,
            average_order_value=average_order_value,
            orders_by_status=orders_by_status
        )

    @staticmethod
    def save_report_to_s3(report: DailyReport) -> str:
        """Save report to S3"""
        report_key = f"reports/daily/{report.date}.json"

        # Convert to JSON-serializable format
        report_data = {
            'date': report.date,
            'totalOrders': report.total_orders,
            'totalRevenue': float(report.total_revenue),
            'averageOrderValue': float(report.average_order_value),
            'ordersByStatus': report.orders_by_status,
            'generatedAt': datetime.utcnow().isoformat()
        }

        s3_client.put_object(
            Bucket=reports_bucket,
            Key=report_key,
            Body=json.dumps(report_data, indent=2),
            ContentType='application/json'
        )

        logger.info(f"Report saved to s3://{reports_bucket}/{report_key}")
        return report_key


@logger.inject_lambda_context
@tracer.capture_lambda_handler
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Lambda entry point - scheduled execution"""
    # Generate report for yesterday
    yesterday = datetime.utcnow() - timedelta(days=1)

    generator = ReportGenerator()
    report = generator.generate_daily_report(yesterday)
    report_key = generator.save_report_to_s3(report)

    logger.info(f"Daily report generated: {report.total_orders} orders, ${report.total_revenue}")

    return {
        'statusCode': 200,
        'reportDate': report.date,
        'reportKey': report_key,
        'metrics': {
            'totalOrders': report.total_orders,
            'totalRevenue': float(report.total_revenue)
        }
    }
```

**requirements.txt:**
```txt
boto3>=1.34.0
aws-lambda-powertools>=2.31.0
```

---

## Event Triggers

### Serverless Framework Configuration

**serverless.yml:**
```yaml
service: serverless-python-example

frameworkVersion: '3'

provider:
  name: aws
  runtime: python3.11
  region: us-east-1
  memorySize: 512
  timeout: 30
  architecture: arm64  # Graviton2 for better price/performance

  environment:
    ORDERS_TABLE: ${self:custom.ordersTable}
    REPORTS_BUCKET: ${self:custom.reportsBucket}
    OPENSEARCH_ENDPOINT: ${self:custom.opensearchEndpoint}
    LOG_LEVEL: INFO
    POWERTOOLS_SERVICE_NAME: serverless-example
    POWERTOOLS_METRICS_NAMESPACE: ServerlessExample

  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - dynamodb:Query
            - dynamodb:Scan
            - dynamodb:GetItem
            - dynamodb:PutItem
            - dynamodb:UpdateItem
            - dynamodb:DeleteItem
          Resource:
            - !GetAtt OrdersTable.Arn
        - Effect: Allow
          Action:
            - s3:GetObject
            - s3:PutObject
          Resource:
            - !Sub ${ImagesBucket.Arn}/*
            - !Sub ${ReportsBucket.Arn}/*
        - Effect: Allow
          Action:
            - sqs:ReceiveMessage
            - sqs:DeleteMessage
            - sqs:GetQueueAttributes
          Resource:
            - !GetAtt OrderQueue.Arn

# Lambda Layers for shared dependencies
layers:
  common:
    path: layers/common
    name: ${self:service}-common-layer
    description: Common dependencies and utilities
    compatibleRuntimes:
      - python3.11
    retain: false

functions:
  # HTTP API Handler
  httpApi:
    handler: functions/http-api/handler.lambda_handler
    layers:
      - !Ref CommonLambdaLayer
    events:
      - httpApi:
          path: /orders
          method: post
      - httpApi:
          path: /orders/{orderId}
          method: get
    environment:
      ORDERS_TABLE: !Ref OrdersTable

  # S3 Event Processor
  imageProcessor:
    handler: functions/s3-processor/handler.lambda_handler
    timeout: 300  # 5 minutes for image processing
    memorySize: 1024  # More memory for image processing
    events:
      - s3:
          bucket: ${self:custom.imagesBucket}
          event: s3:ObjectCreated:*
          rules:
            - prefix: uploads/
            - suffix: .jpg
      - s3:
          bucket: ${self:custom.imagesBucket}
          event: s3:ObjectCreated:*
          rules:
            - prefix: uploads/
            - suffix: .png

  # DynamoDB Stream Processor
  streamProcessor:
    handler: functions/dynamodb-stream/handler.lambda_handler
    layers:
      - !Ref CommonLambdaLayer
    events:
      - stream:
          type: dynamodb
          arn: !GetAtt OrdersTable.StreamArn
          batchSize: 100
          startingPosition: LATEST
          maximumRetryAttempts: 3
          enabled: true

  # SQS Queue Processor
  queueProcessor:
    handler: functions/sqs-processor/handler.lambda_handler
    layers:
      - !Ref CommonLambdaLayer
    events:
      - sqs:
          arn: !GetAtt OrderQueue.Arn
          batchSize: 10
          maximumBatchingWindowInSeconds: 10
          functionResponseType: ReportBatchItemFailures

  # Scheduled Task (Daily Report)
  dailyReport:
    handler: functions/scheduled-task/handler.lambda_handler
    layers:
      - !Ref CommonLambdaLayer
    events:
      - schedule:
          rate: cron(0 2 * * ? *)  # Every day at 2 AM UTC
          enabled: true
          input:
            reportType: daily

# CloudFormation Resources
resources:
  Resources:
    # DynamoDB Table
    OrdersTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:custom.ordersTable}
        BillingMode: PAY_PER_REQUEST
        AttributeDefinitions:
          - AttributeName: orderId
            AttributeType: S
          - AttributeName: customerId
            AttributeType: S
          - AttributeName: createdAt
            AttributeType: S
        KeySchema:
          - AttributeName: orderId
            KeyType: HASH
        GlobalSecondaryIndexes:
          - IndexName: CustomerIndex
            KeySchema:
              - AttributeName: customerId
                KeyType: HASH
              - AttributeName: createdAt
                KeyType: RANGE
            Projection:
              ProjectionType: ALL
        StreamSpecification:
          StreamViewType: NEW_AND_OLD_IMAGES
        PointInTimeRecoverySpecification:
          PointInTimeRecoveryEnabled: true
        Tags:
          - Key: Environment
            Value: ${self:provider.stage}

    # S3 Buckets
    ImagesBucket:
      Type: AWS::S3::Bucket
      Properties:
        BucketName: ${self:custom.imagesBucket}
        VersioningConfiguration:
          Status: Enabled
        LifecycleConfiguration:
          Rules:
            - Id: DeleteOldThumbnails
              Status: Enabled
              Prefix: thumbnails/
              ExpirationInDays: 90

    ReportsBucket:
      Type: AWS::S3::Bucket
      Properties:
        BucketName: ${self:custom.reportsBucket}
        VersioningConfiguration:
          Status: Enabled

    # SQS Queue
    OrderQueue:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: ${self:service}-order-queue
        VisibilityTimeout: 180  # 3x function timeout
        MessageRetentionPeriod: 1209600  # 14 days
        RedrivePolicy:
          deadLetterTargetArn: !GetAtt OrderDLQ.Arn
          maxReceiveCount: 3

    # Dead Letter Queue
    OrderDLQ:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: ${self:service}-order-dlq
        MessageRetentionPeriod: 1209600

custom:
  ordersTable: ${self:service}-orders-${self:provider.stage}
  imagesBucket: ${self:service}-images-${self:provider.stage}
  reportsBucket: ${self:service}-reports-${self:provider.stage}
  opensearchEndpoint: ${env:OPENSEARCH_ENDPOINT}

plugins:
  - serverless-python-requirements

# Python Requirements Plugin Configuration
pythonRequirements:
  dockerizePip: true
  layer: true  # Package requirements as layer
  slim: true  # Remove unnecessary files
  strip: false
  zip: true
  pythonBin: python3.11
```

---

## Cold Start Optimization

### Optimization Techniques

**optimized_handler.py:**
```python
"""
Optimized Lambda Handler
Techniques to minimize cold start time and maximize performance
"""
import os
import json
from typing import Any, Dict
from functools import lru_cache

# 1. Import only what you need (reduce import time)
import boto3
from aws_lambda_powertools import Logger

# 2. Initialize clients outside handler (connection reuse)
logger = Logger()
_dynamodb_client = None
_s3_client = None

# 3. Use lazy initialization for expensive resources
def get_dynamodb_client():
    """Lazy-load DynamoDB client"""
    global _dynamodb_client
    if _dynamodb_client is None:
        _dynamodb_client = boto3.client('dynamodb')
    return _dynamodb_client


def get_s3_client():
    """Lazy-load S3 client"""
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client('s3')
    return _s3_client


# 4. Cache configuration (avoid repeated env var lookups)
@lru_cache(maxsize=1)
def get_config() -> Dict[str, str]:
    """Cached configuration"""
    return {
        'table_name': os.environ['ORDERS_TABLE'],
        'region': os.environ.get('AWS_REGION', 'us-east-1'),
        'log_level': os.environ.get('LOG_LEVEL', 'INFO')
    }


# 5. Pre-compile regex patterns, load constants
import re
EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
PHONE_PATTERN = re.compile(r'^\+?1?\d{9,15}$')


class OptimizedService:
    """Service with optimized initialization"""

    def __init__(self):
        # Lazy load only when needed
        self._config = get_config()
        self._db_client = None

    @property
    def db_client(self):
        """Lazy-loaded database client"""
        if self._db_client is None:
            self._db_client = get_dynamodb_client()
        return self._db_client

    def process_request(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Business logic with optimized patterns"""
        # Use pre-compiled regex
        if 'email' in data and not EMAIL_PATTERN.match(data['email']):
            raise ValueError("Invalid email format")

        # Use cached config
        table_name = self._config['table_name']

        # Use lazy-loaded client
        response = self.db_client.get_item(
            TableName=table_name,
            Key={'id': {'S': data['id']}}
        )

        return response.get('Item', {})


# 6. Global instance (reused across warm invocations)
_service_instance = None


def get_service() -> OptimizedService:
    """Get or create service instance"""
    global _service_instance
    if _service_instance is None:
        _service_instance = OptimizedService()
        logger.info("Service initialized (cold start)")
    else:
        logger.info("Service reused (warm invocation)")
    return _service_instance


@logger.inject_lambda_context
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Optimized Lambda handler

    Cold Start Optimization Checklist:
    ✓ Minimal imports
    ✓ Lazy initialization
    ✓ Connection reuse
    ✓ Cached configuration
    ✓ Pre-compiled patterns
    ✓ Global instances
    """
    service = get_service()

    try:
        result = service.process_request(event)
        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }
    except Exception as e:
        logger.exception("Error processing request")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

### Performance Comparison

```python
"""
Cold Start Performance Analysis

Python vs Java:
- Python 3.11 cold start: 100-300ms
- Java 11 cold start: 1000-2000ms
- Python wins on cold starts!

Python Optimization Impact:
- Unoptimized: 250ms cold start
- With lazy loading: 180ms cold start
- With ARM64 (Graviton2): 150ms cold start
- With minimal dependencies: 120ms cold start

Memory optimization:
- 128MB: 200ms execution, low cost
- 512MB: 50ms execution, higher cost
- 1024MB: 30ms execution, proportional cost
- Sweet spot: 512MB for most workloads
"""
```

### Provisioned Concurrency (for critical APIs)

**provisioned_concurrency.py:**
```python
"""
AWS CDK configuration for provisioned concurrency
Keep functions warm for zero cold starts
"""
from aws_cdk import (
    aws_lambda as lambda_,
    aws_lambda_python_alpha as lambda_python,
    Duration,
)
from constructs import Construct


class ProvisionedLambda(Construct):
    """Lambda with provisioned concurrency"""

    def __init__(self, scope: Construct, id: str):
        super().__init__(scope, id)

        # Create function
        function = lambda_python.PythonFunction(
            self, 'ApiFunction',
            runtime=lambda_.Runtime.PYTHON_3_11,
            entry='functions/http-api',
            index='handler.py',
            handler='lambda_handler',
            memory_size=512,
            timeout=Duration.seconds(30),
            architecture=lambda_.Architecture.ARM_64,
            environment={
                'POWERTOOLS_SERVICE_NAME': 'api',
                'LOG_LEVEL': 'INFO'
            }
        )

        # Create version
        version = function.current_version

        # Create alias with provisioned concurrency
        alias = lambda_.Alias(
            self, 'ProductionAlias',
            alias_name='prod',
            version=version,
            provisioned_concurrent_executions=10  # Always 10 warm instances
        )

        # Auto-scaling for provisioned concurrency
        target = alias.add_auto_scaling(
            min_capacity=10,
            max_capacity=100
        )

        target.scale_on_utilization(
            utilization_target=0.7  # Scale when 70% utilized
        )
```

---

## API Gateway Integration

### FastAPI-style Lambda Handler

**fastapi_handler.py:**
```python
"""
FastAPI-style Lambda Handler with AWS Lambda Powertools
Provides FastAPI-like routing with full AWS integration
"""
from typing import Any, Dict, Optional
from datetime import datetime

from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from aws_lambda_powertools.event_handler.exceptions import (
    BadRequestError,
    NotFoundError,
    UnauthorizedError
)
from aws_lambda_powertools.logging import correlation_paths
from pydantic import BaseModel, Field, validator

logger = Logger()
tracer = Tracer()
metrics = Metrics()
app = APIGatewayRestResolver()


# Request/Response Models
class CreateOrderRequest(BaseModel):
    """Order creation request"""
    customer_id: str = Field(..., min_length=1)
    items: list[str] = Field(..., min_items=1)
    total_amount: float = Field(..., gt=0)

    @validator('total_amount')
    def validate_amount(cls, v):
        if v > 100000:
            raise ValueError('Amount exceeds maximum')
        return round(v, 2)


class OrderResponse(BaseModel):
    """Order response"""
    order_id: str
    status: str
    created_at: str


# Middleware
@app.before_request
def check_authentication():
    """Authentication middleware"""
    auth_header = app.current_event.get_header_value('authorization')

    if not auth_header:
        raise UnauthorizedError("Missing authorization header")

    # Validate token (simplified)
    if not auth_header.startswith('Bearer '):
        raise UnauthorizedError("Invalid authorization format")

    logger.info("Request authenticated")


# Routes
@app.get("/health")
def health_check() -> Dict[str, Any]:
    """Health check endpoint (no auth required)"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/orders")
@tracer.capture_method
def create_order() -> Dict[str, Any]:
    """Create new order"""
    try:
        # Get and validate request body
        request_data = app.current_event.json_body
        order_request = CreateOrderRequest(**request_data)

        # Business logic
        order_id = f"ORD-{datetime.utcnow().timestamp()}"

        # Record metrics
        metrics.add_metric(name="OrderCreated", unit="Count", value=1)
        metrics.add_metric(
            name="OrderAmount",
            unit="None",
            value=order_request.total_amount
        )

        # Build response
        response = OrderResponse(
            order_id=order_id,
            status='CREATED',
            created_at=datetime.utcnow().isoformat()
        )

        return {
            "statusCode": 201,
            "body": response.model_dump()
        }

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise BadRequestError(str(e))


@app.get("/orders/<order_id>")
@tracer.capture_method
def get_order(order_id: str) -> Dict[str, Any]:
    """Get order by ID"""
    # Query database
    # For demo, return mock data

    if not order_id.startswith('ORD-'):
        raise NotFoundError(f"Order {order_id} not found")

    response = OrderResponse(
        order_id=order_id,
        status='COMPLETED',
        created_at=datetime.utcnow().isoformat()
    )

    return {
        "statusCode": 200,
        "body": response.model_dump()
    }


@app.put("/orders/<order_id>")
@tracer.capture_method
def update_order(order_id: str) -> Dict[str, Any]:
    """Update order"""
    request_data = app.current_event.json_body

    # Update logic here

    return {
        "statusCode": 200,
        "body": {"message": f"Order {order_id} updated"}
    }


@app.delete("/orders/<order_id>")
@tracer.capture_method
def delete_order(order_id: str) -> Dict[str, Any]:
    """Delete order"""
    # Delete logic here

    return {
        "statusCode": 204,
        "body": {}
    }


# Exception handlers
@app.exception_handler(ValueError)
def handle_validation_error(ex: ValueError) -> Dict[str, Any]:
    """Handle validation errors"""
    logger.error(f"Validation error: {ex}")

    return {
        "statusCode": 400,
        "body": {
            "error": "ValidationError",
            "message": str(ex)
        }
    }


@app.exception_handler(Exception)
def handle_generic_error(ex: Exception) -> Dict[str, Any]:
    """Handle unexpected errors"""
    logger.exception("Unexpected error")

    return {
        "statusCode": 500,
        "body": {
            "error": "InternalServerError",
            "message": "An unexpected error occurred"
        }
    }


# Lambda handler
@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Lambda entry point"""
    return app.resolve(event, context)
```

---

## State Management

### DynamoDB with Type Safety

**dynamodb_service.py:**
```python
"""
Type-safe DynamoDB service
Using Pydantic for data validation and boto3 for AWS SDK
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from dataclasses import dataclass

import boto3
from boto3.dynamodb.conditions import Key, Attr
from pydantic import BaseModel, Field
from aws_lambda_powertools import Logger

logger = Logger()


class Order(BaseModel):
    """Order model with validation"""
    order_id: str
    customer_id: str
    total_amount: Decimal
    items: List[str]
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        """Pydantic config"""
        json_encoders = {
            Decimal: lambda v: float(v),
            datetime: lambda v: v.isoformat()
        }


class OrderRepository:
    """DynamoDB repository for orders"""

    def __init__(self, table_name: str):
        self.dynamodb = boto3.resource('dynamodb')
        self.table = self.dynamodb.Table(table_name)

    def create(self, order: Order) -> Order:
        """Create new order"""
        item = {
            'orderId': order.order_id,
            'customerId': order.customer_id,
            'totalAmount': order.total_amount,
            'items': order.items,
            'status': order.status,
            'createdAt': order.created_at.isoformat(),
        }

        if order.updated_at:
            item['updatedAt'] = order.updated_at.isoformat()

        self.table.put_item(Item=item)
        logger.info(f"Created order: {order.order_id}")

        return order

    def get(self, order_id: str) -> Optional[Order]:
        """Get order by ID"""
        response = self.table.get_item(Key={'orderId': order_id})

        if 'Item' not in response:
            return None

        item = response['Item']
        return Order(
            order_id=item['orderId'],
            customer_id=item['customerId'],
            total_amount=Decimal(str(item['totalAmount'])),
            items=item['items'],
            status=item['status'],
            created_at=datetime.fromisoformat(item['createdAt']),
            updated_at=datetime.fromisoformat(item['updatedAt']) if 'updatedAt' in item else None
        )

    def update_status(self, order_id: str, new_status: str) -> None:
        """Update order status"""
        self.table.update_item(
            Key={'orderId': order_id},
            UpdateExpression='SET #status = :status, updatedAt = :timestamp',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': new_status,
                ':timestamp': datetime.utcnow().isoformat()
            }
        )
        logger.info(f"Updated order {order_id} status to {new_status}")

    def list_by_customer(self, customer_id: str, limit: int = 20) -> List[Order]:
        """List orders for customer"""
        response = self.table.query(
            IndexName='CustomerIndex',
            KeyConditionExpression=Key('customerId').eq(customer_id),
            Limit=limit,
            ScanIndexForward=False  # Newest first
        )

        orders = []
        for item in response.get('Items', []):
            orders.append(Order(
                order_id=item['orderId'],
                customer_id=item['customerId'],
                total_amount=Decimal(str(item['totalAmount'])),
                items=item['items'],
                status=item['status'],
                created_at=datetime.fromisoformat(item['createdAt']),
                updated_at=datetime.fromisoformat(item['updatedAt']) if 'updatedAt' in item else None
            ))

        return orders

    def delete(self, order_id: str) -> None:
        """Delete order"""
        self.table.delete_item(Key={'orderId': order_id})
        logger.info(f"Deleted order: {order_id}")
```

---

## Azure Functions Example

**function_app.py:**
```python
"""
Azure Functions HTTP, Blob, and Queue Triggers
Python v2 programming model
"""
import json
import logging
from typing import Optional
from datetime import datetime

import azure.functions as func
from pydantic import BaseModel, Field

app = func.FunctionApp()


# Models
class OrderRequest(BaseModel):
    """Order request model"""
    customer_id: str = Field(..., min_length=1)
    total_amount: float = Field(..., gt=0)


class OrderResponse(BaseModel):
    """Order response model"""
    order_id: str
    status: str
    created_at: str


# HTTP Trigger
@app.route(route="orders", methods=["GET", "POST"], auth_level=func.AuthLevel.ANONYMOUS)
def http_trigger(req: func.HttpRequest) -> func.HttpResponse:
    """HTTP trigger function"""
    logging.info('Python HTTP trigger function processed a request.')

    if req.method == 'POST':
        try:
            # Parse and validate request
            req_body = req.get_json()
            order_request = OrderRequest(**req_body)

            # Create order
            order_id = f"ORD-{datetime.utcnow().timestamp()}"

            response = OrderResponse(
                order_id=order_id,
                status='CREATED',
                created_at=datetime.utcnow().isoformat()
            )

            return func.HttpResponse(
                body=response.model_dump_json(),
                status_code=201,
                mimetype='application/json'
            )

        except ValueError as e:
            return func.HttpResponse(
                body=json.dumps({'error': str(e)}),
                status_code=400,
                mimetype='application/json'
            )

    elif req.method == 'GET':
        # List orders
        return func.HttpResponse(
            body=json.dumps({'orders': []}),
            status_code=200,
            mimetype='application/json'
        )


# Blob Trigger
@app.blob_trigger(
    arg_name="myblob",
    path="uploads/{name}",
    connection="AzureWebJobsStorage"
)
def blob_trigger(myblob: func.InputStream):
    """Blob trigger function - processes uploaded files"""
    logging.info(f'Python blob trigger processed blob: {myblob.name}')
    logging.info(f'Blob size: {myblob.length} bytes')

    # Process blob content
    content = myblob.read()

    # Example: Save processed content
    # process_and_save(content, myblob.name)


# Queue Trigger
@app.queue_trigger(
    arg_name="msg",
    queue_name="order-queue",
    connection="AzureWebJobsStorage"
)
def queue_trigger(msg: func.QueueMessage):
    """Queue trigger function - processes queue messages"""
    logging.info(f'Python queue trigger processed message: {msg.id}')

    try:
        # Parse message
        message_body = json.loads(msg.get_body().decode('utf-8'))

        # Process message
        order_id = message_body.get('order_id')
        action = message_body.get('action')

        logging.info(f'Processing order {order_id}: {action}')

        # Business logic here

    except Exception as e:
        logging.error(f'Error processing message: {e}')
        raise


# Timer Trigger (scheduled)
@app.timer_trigger(
    arg_name="timer",
    schedule="0 0 2 * * *",  # Daily at 2 AM
    run_on_startup=False
)
def timer_trigger(timer: func.TimerRequest):
    """Timer trigger function - runs on schedule"""
    logging.info('Python timer trigger function executed.')

    if timer.past_due:
        logging.info('The timer is past due!')

    # Generate daily report
    logging.info('Generating daily report...')
```

**requirements.txt:**
```txt
azure-functions>=1.18.0
pydantic>=2.5.0
```

**host.json:**
```json
{
  "version": "2.0",
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true,
        "maxTelemetryItemsPerSecond": 20
      }
    }
  },
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  }
}
```

---

## Google Cloud Functions Example

### HTTP Function

**main.py:**
```python
"""
Google Cloud Functions HTTP and Storage Triggers
"""
import json
import functions_framework
from typing import Any
from datetime import datetime
from pydantic import BaseModel, Field
from google.cloud import storage


# Models
class OrderRequest(BaseModel):
    """Order request"""
    customer_id: str = Field(..., min_length=1)
    total_amount: float = Field(..., gt=0)


# HTTP Function
@functions_framework.http
def http_function(request) -> tuple[str, int, dict]:
    """HTTP Cloud Function"""

    # Enable CORS
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
        return ('', 204, headers)

    headers = {'Access-Control-Allow-Origin': '*'}

    if request.method == 'POST':
        try:
            # Parse request
            request_json = request.get_json(silent=True)
            order_request = OrderRequest(**request_json)

            # Create order
            order_id = f"ORD-{datetime.utcnow().timestamp()}"

            response = {
                'order_id': order_id,
                'status': 'CREATED',
                'created_at': datetime.utcnow().isoformat()
            }

            return (json.dumps(response), 201, headers)

        except ValueError as e:
            return (json.dumps({'error': str(e)}), 400, headers)

    elif request.method == 'GET':
        return (json.dumps({'orders': []}), 200, headers)

    return (json.dumps({'error': 'Method not allowed'}), 405, headers)


# Cloud Storage Function
@functions_framework.cloud_event
def storage_function(cloud_event):
    """Cloud Storage trigger function"""

    data = cloud_event.data

    bucket_name = data['bucket']
    file_name = data['name']

    print(f'Processing file: gs://{bucket_name}/{file_name}')

    # Get file
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(file_name)

    # Process file
    content = blob.download_as_bytes()

    print(f'File size: {len(content)} bytes')

    # Example: Create thumbnail and upload
    # thumbnail = process_image(content)
    # thumbnail_blob = bucket.blob(f'thumbnails/{file_name}')
    # thumbnail_blob.upload_from_string(thumbnail)


# Pub/Sub Function
@functions_framework.cloud_event
def pubsub_function(cloud_event):
    """Pub/Sub trigger function"""

    import base64

    # Decode Pub/Sub message
    message_data = base64.b64decode(cloud_event.data['message']['data']).decode('utf-8')

    print(f'Received message: {message_data}')

    # Process message
    try:
        message = json.loads(message_data)
        order_id = message.get('order_id')
        action = message.get('action')

        print(f'Processing order {order_id}: {action}')

        # Business logic here

    except Exception as e:
        print(f'Error processing message: {e}')
        raise
```

**requirements.txt:**
```txt
functions-framework>=3.5.0
pydantic>=2.5.0
google-cloud-storage>=2.14.0
```

---

## Testing

### Unit Tests with Moto

**test_http_handler.py:**
```python
"""
Unit tests for HTTP API handler using moto for AWS mocking
"""
import json
import os
from datetime import datetime
from decimal import Decimal
import pytest
from moto import mock_dynamodb
import boto3

# Import handler
from functions.http_api import handler


@pytest.fixture
def lambda_context():
    """Mock Lambda context"""
    class MockContext:
        function_name = 'test-function'
        memory_limit_in_mb = 512
        invoked_function_arn = 'arn:aws:lambda:us-east-1:123456789012:function:test-function'
        aws_request_id = 'test-request-id'

    return MockContext()


@pytest.fixture
def dynamodb_table():
    """Create mock DynamoDB table"""
    with mock_dynamodb():
        # Create DynamoDB resource
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

        # Create table
        table = dynamodb.create_table(
            TableName='orders-test',
            KeySchema=[
                {'AttributeName': 'orderId', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'orderId', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )

        # Set environment variable
        os.environ['ORDERS_TABLE'] = 'orders-test'

        yield table


def test_create_order(dynamodb_table, lambda_context):
    """Test order creation"""
    # Arrange
    event = {
        'httpMethod': 'POST',
        'path': '/orders',
        'body': json.dumps({
            'customer_id': 'CUST001',
            'total_amount': 100.50,
            'items': ['ITEM001', 'ITEM002']
        })
    }

    # Act
    response = handler.lambda_handler(event, lambda_context)

    # Assert
    assert response['statusCode'] == 201

    body = json.loads(response['body'])
    assert 'order_id' in body
    assert body['status'] == 'CREATED'
    assert body['customer_id'] == 'CUST001'


def test_get_order(dynamodb_table, lambda_context):
    """Test get order"""
    # Arrange - create order first
    dynamodb_table.put_item(Item={
        'orderId': 'ORD-123',
        'customerId': 'CUST001',
        'totalAmount': Decimal('100.50'),
        'items': ['ITEM001'],
        'status': 'CREATED',
        'createdAt': datetime.utcnow().isoformat()
    })

    event = {
        'httpMethod': 'GET',
        'path': '/orders/ORD-123',
        'pathParameters': {'orderId': 'ORD-123'}
    }

    # Act
    response = handler.lambda_handler(event, lambda_context)

    # Assert
    assert response['statusCode'] == 200

    body = json.loads(response['body'])
    assert body['order_id'] == 'ORD-123'
    assert body['customer_id'] == 'CUST001'


def test_get_nonexistent_order(dynamodb_table, lambda_context):
    """Test get non-existent order"""
    # Arrange
    event = {
        'httpMethod': 'GET',
        'path': '/orders/ORD-999',
        'pathParameters': {'orderId': 'ORD-999'}
    }

    # Act
    response = handler.lambda_handler(event, lambda_context)

    # Assert
    assert response['statusCode'] == 404


def test_invalid_amount(dynamodb_table, lambda_context):
    """Test validation error"""
    # Arrange
    event = {
        'httpMethod': 'POST',
        'path': '/orders',
        'body': json.dumps({
            'customer_id': 'CUST001',
            'total_amount': -50.00,  # Invalid
            'items': ['ITEM001']
        })
    }

    # Act
    response = handler.lambda_handler(event, lambda_context)

    # Assert
    assert response['statusCode'] == 400
```

**conftest.py:**
```python
"""
Pytest configuration and shared fixtures
"""
import os
import pytest


@pytest.fixture(autouse=True)
def aws_credentials():
    """Set mock AWS credentials"""
    os.environ['AWS_ACCESS_KEY_ID'] = 'testing'
    os.environ['AWS_SECRET_ACCESS_KEY'] = 'testing'
    os.environ['AWS_SECURITY_TOKEN'] = 'testing'
    os.environ['AWS_SESSION_TOKEN'] = 'testing'
    os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'


@pytest.fixture
def lambda_powertools_env():
    """Set Lambda Powertools environment variables"""
    os.environ['POWERTOOLS_SERVICE_NAME'] = 'test-service'
    os.environ['POWERTOOLS_METRICS_NAMESPACE'] = 'TestNamespace'
    os.environ['LOG_LEVEL'] = 'INFO'
```

**requirements-dev.txt:**
```txt
pytest>=7.4.0
pytest-cov>=4.1.0
pytest-asyncio>=0.21.0
moto[all]>=4.2.0
```

---

## Deployment

### AWS SAM Template

**template.yaml:**
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Serverless Python Application

Globals:
  Function:
    Runtime: python3.11
    Timeout: 30
    MemorySize: 512
    Architectures:
      - arm64  # Graviton2 for better performance
    Environment:
      Variables:
        POWERTOOLS_SERVICE_NAME: !Ref ServiceName
        POWERTOOLS_METRICS_NAMESPACE: !Ref MetricsNamespace
        LOG_LEVEL: INFO

Parameters:
  ServiceName:
    Type: String
    Default: serverless-example

  MetricsNamespace:
    Type: String
    Default: ServerlessExample

Resources:
  # Lambda Layer for common dependencies
  CommonLayer:
    Type: AWS::Serverless::LayerVersion
    Properties:
      LayerName: !Sub ${ServiceName}-common-layer
      Description: Common dependencies (boto3, powertools, pydantic)
      ContentUri: layers/common/
      CompatibleRuntimes:
        - python3.11
      CompatibleArchitectures:
        - arm64
    Metadata:
      BuildMethod: python3.11

  # HTTP API Function
  HttpApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub ${ServiceName}-http-api
      CodeUri: functions/http-api/
      Handler: handler.lambda_handler
      Layers:
        - !Ref CommonLayer
      Events:
        CreateOrder:
          Type: HttpApi
          Properties:
            Path: /orders
            Method: post
        GetOrder:
          Type: HttpApi
          Properties:
            Path: /orders/{orderId}
            Method: get
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref OrdersTable
      Environment:
        Variables:
          ORDERS_TABLE: !Ref OrdersTable

  # S3 Processor Function
  ImageProcessorFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub ${ServiceName}-image-processor
      CodeUri: functions/s3-processor/
      Handler: handler.lambda_handler
      Timeout: 300
      MemorySize: 1024
      Events:
        S3Event:
          Type: S3
          Properties:
            Bucket: !Ref ImagesBucket
            Events: s3:ObjectCreated:*
            Filter:
              S3Key:
                Rules:
                  - Name: prefix
                    Value: uploads/
      Policies:
        - S3CrudPolicy:
            BucketName: !Ref ImagesBucket

  # DynamoDB Stream Function
  StreamProcessorFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub ${ServiceName}-stream-processor
      CodeUri: functions/dynamodb-stream/
      Handler: handler.lambda_handler
      Layers:
        - !Ref CommonLayer
      Events:
        DynamoDBStream:
          Type: DynamoDB
          Properties:
            Stream: !GetAtt OrdersTable.StreamArn
            StartingPosition: LATEST
            BatchSize: 100
            MaximumRetryAttempts: 3
      Policies:
        - DynamoDBStreamReadPolicy:
            TableName: !Ref OrdersTable
            StreamName: !GetAtt OrdersTable.StreamArn

  # DynamoDB Table
  OrdersTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub ${ServiceName}-orders
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: orderId
          AttributeType: S
        - AttributeName: customerId
          AttributeType: S
        - AttributeName: createdAt
          AttributeType: S
      KeySchema:
        - AttributeName: orderId
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: CustomerIndex
          KeySchema:
            - AttributeName: customerId
              KeyType: HASH
            - AttributeName: createdAt
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES

  # S3 Bucket
  ImagesBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub ${ServiceName}-images-${AWS::AccountId}

Outputs:
  ApiUrl:
    Description: HTTP API endpoint URL
    Value: !Sub https://${ServerlessHttpApi}.execute-api.${AWS::Region}.amazonaws.com

  OrdersTableName:
    Description: DynamoDB table name
    Value: !Ref OrdersTable

  ImagesBucketName:
    Description: S3 bucket name
    Value: !Ref ImagesBucket
```

### Deployment Commands

```bash
# Install dependencies
pip install -r requirements-dev.txt

# Run tests
pytest tests/ -v --cov=functions

# Build with SAM
sam build --use-container

# Deploy
sam deploy --guided

# Or deploy with Serverless Framework
serverless deploy --stage prod

# Monitor logs
sam logs -n HttpApiFunction --tail

# Invoke function locally
sam local invoke HttpApiFunction -e events/create-order.json

# Start local API
sam local start-api
```

---

## Performance Optimization

### Memory vs Cost Analysis

```python
"""
Lambda Performance Optimization Guide

Memory vs Performance:
- 128MB: $0.0000000021/ms, ~200ms execution
- 256MB: $0.0000000042/ms, ~120ms execution
- 512MB: $0.0000000083/ms, ~50ms execution   ← Sweet spot
- 1024MB: $0.0000000167/ms, ~30ms execution
- 2048MB: $0.0000000333/ms, ~20ms execution

Cost calculation:
- 512MB, 50ms: $0.000000415 per invocation
- 1024MB, 30ms: $0.000000501 per invocation
- Verdict: 512MB is often most cost-effective

Python advantages:
- ✓ Fast cold starts (100-300ms)
- ✓ Lower memory footprint
- ✓ Native async for I/O
- ✓ Easy profiling with cProfile
"""
```

### Async Best Practices

**async_best_practices.py:**
```python
"""
Async/await best practices for Lambda
"""
import asyncio
import aioboto3
from typing import List, Dict, Any


async def process_batch_async(items: List[str]) -> List[Dict[str, Any]]:
    """Process multiple items concurrently"""

    # Create async session
    session = aioboto3.Session()

    async with session.client('s3') as s3:
        # Process all items concurrently
        tasks = [process_item(s3, item) for item in items]
        results = await asyncio.gather(*tasks)

    return results


async def process_item(s3_client, item: str) -> Dict[str, Any]:
    """Process single item"""
    # Async I/O operations
    response = await s3_client.get_object(
        Bucket='my-bucket',
        Key=item
    )

    content = await response['Body'].read()

    return {
        'item': item,
        'size': len(content)
    }


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Lambda handler with async processing"""
    items = event.get('items', [])

    # Run async function
    results = asyncio.run(process_batch_async(items))

    return {
        'statusCode': 200,
        'processed': len(results)
    }
```

---

## Key Takeaways

### Python Serverless Advantages

1. **Fast Cold Starts** - 100-300ms vs 1-2s for Java
2. **Native Async** - Built-in async/await for I/O operations
3. **Smaller Packages** - Faster deployment and initialization
4. **Rich Ecosystem** - boto3, Pandas, NumPy, Pillow for data processing
5. **Type Safety** - Pydantic for runtime validation with type hints
6. **Easy Testing** - Moto for AWS mocking, pytest for testing
7. **Cost Effective** - Lower memory requirements = lower costs

### Best Practices

- ✓ Use AWS Lambda Powertools for logging, tracing, metrics
- ✓ Type hints everywhere for maintainability
- ✓ Pydantic for request/response validation
- ✓ Lazy initialization for expensive resources
- ✓ Lambda layers for shared dependencies
- ✓ ARM64 (Graviton2) for 20% better price/performance
- ✓ Async handlers for I/O-bound operations
- ✓ Connection reuse across invocations
- ✓ Comprehensive testing with moto
- ✓ Monitor with CloudWatch and X-Ray

### When to Use Python for Serverless

**Perfect for:**
- ✓ Data processing and ETL
- ✓ Image/video processing
- ✓ API backends with fast responses
- ✓ Event-driven automation
- ✓ Machine learning inference
- ✓ Real-time stream processing

**Consider Java/Go instead for:**
- ✗ CPU-intensive long-running tasks
- ✗ Applications requiring ultra-low latency (<10ms)
- ✗ Strong compile-time type safety requirements

---

**Related Guides:**
- [Deep Dive: Serverless Architecture](../../../3-design/architecture-pattern/deep-dive-serverless.md)
- [Deep Dive: Event-Driven Architecture](../../../3-design/architecture-pattern/deep-dive-event-driven.md)
- [Python Project Setup Guide](project-setup.md)

*Last Updated: 2025-10-20*
