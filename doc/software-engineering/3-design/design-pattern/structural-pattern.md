# Structural Design Patterns

**Purpose:** Object composition and relationships to form larger structures
**Focus:** How objects are composed to form flexible and efficient structures
**Organization:** PHD Systems & PHD Labs
**Version:** 1.0
**Date:** 2025-10-20

---

## TL;DR

**Structural patterns organize objects into larger structures while keeping them flexible and efficient**. **Seven GoF patterns**: Adapter (interface compatibility), Bridge (separate abstraction from implementation), Composite (tree structures), Decorator (dynamic behavior addition), Facade (simplified interface), Flyweight (memory optimization), Proxy (access control). **Modern essential**: Repository (data access abstraction). **When to use**: Integrating incompatible systems (Adapter), adding behavior without inheritance (Decorator), simplifying complex APIs (Facade), controlling access (Proxy), tree hierarchies (Composite), abstracting data access (Repository). **Golden rule**: Composition over inheritance → Use decorators not deep class hierarchies. **Most used**: Adapter, Decorator, Facade, Repository, Proxy. **Avoid**: Premature optimization with Flyweight, overly complex bridges.

---

## Table of Contents

- [Overview](#overview)
- [Adapter Pattern](#adapter-pattern)
- [Decorator Pattern](#decorator-pattern)
- [Facade Pattern](#facade-pattern)
- [Proxy Pattern](#proxy-pattern)
- [Repository Pattern (Modern)](#repository-pattern-modern)
- [Composite Pattern](#composite-pattern)
- [Bridge Pattern](#bridge-pattern)
- [Flyweight Pattern](#flyweight-pattern)
- [Pattern Comparison](#pattern-comparison)
- [Common Mistakes](#common-mistakes)
- [References](#references)

---

## Overview

**Structural design patterns** explain how to assemble objects and classes into larger structures while keeping these structures flexible and efficient.

### Why Structural Patterns?

**Problems they solve:**
1. **Incompatible interfaces** - Systems that can't work together
2. **Rigid inheritance** - Behavior locked into class hierarchies
3. **Complex subsystems** - Too many classes to understand
4. **Access control needs** - Protect or optimize object access
5. **Data layer coupling** - Business logic tied to database

**Benefits:**
- ✅ Flexibility - Easy to change object composition
- ✅ Reusability - Compose behavior from smaller pieces
- ✅ Maintainability - Clear structure and relationships
- ✅ Extensibility - Add new behavior without modifying existing code
- ✅ Abstraction - Hide complexity behind simple interfaces

### Pattern Categories

| Pattern | Purpose | Use Case |
|---------|---------|----------|
| **Adapter** | Interface translation | Legacy integration, third-party APIs |
| **Decorator** | Dynamic behavior addition | Middleware, cross-cutting concerns |
| **Facade** | Simplified interface | Complex subsystem access |
| **Proxy** | Access control | Lazy loading, caching, security |
| **Repository** | Data access abstraction | Domain/data layer separation |
| **Composite** | Tree structures | File systems, UI components |
| **Bridge** | Separate abstraction/implementation | Platform independence |
| **Flyweight** | Memory optimization | Large numbers of similar objects |

---

## Adapter Pattern

**Gang of Four pattern**. Convert the interface of a class into another interface clients expect. Adapter lets classes work together that couldn't otherwise because of incompatible interfaces.

### Problem

Existing code has incompatible interface with what you need:

```python
# Third-party library with incompatible interface
class OldPaymentGateway:
    def make_payment(self, card_number, amount):
        pass

# Your application expects this interface
class PaymentProcessor:
    def process(self, payment_info):
        pass
```

### Solution

Adapter translates between interfaces:

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ uses
       ▼
┌─────────────────┐
│  Target Interface│
│ + method()      │
└─────────────────┘
       △
       │ implements
       │
┌──────┴──────────┐
│    Adapter      │
│ + method()      │───► adapts ──►┌──────────────┐
└─────────────────┘               │   Adaptee    │
                                  │ + specific() │
                                  └──────────────┘
```

### Implementation

**Python Example (Class Adapter):**

```python
from abc import ABC, abstractmethod

# Target interface - what client expects
class MediaPlayer(ABC):
    @abstractmethod
    def play(self, filename: str) -> None:
        pass

    @abstractmethod
    def stop(self) -> None:
        pass

# Adaptee - existing class with incompatible interface
class VLCPlayer:
    def play_vlc(self, filename: str) -> None:
        print(f"Playing {filename} with VLC")

    def stop_vlc(self) -> None:
        print("Stopping VLC")

class WindowsMediaPlayer:
    def play_wmp(self, filename: str) -> None:
        print(f"Playing {filename} with Windows Media Player")

    def stop_wmp(self) -> None:
        print("Stopping Windows Media Player")

# Adapters - convert interfaces
class VLCAdapter(MediaPlayer):
    def __init__(self):
        self.player = VLCPlayer()

    def play(self, filename: str) -> None:
        self.player.play_vlc(filename)

    def stop(self) -> None:
        self.player.stop_vlc()

class WMPAdapter(MediaPlayer):
    def __init__(self):
        self.player = WindowsMediaPlayer()

    def play(self, filename: str) -> None:
        self.player.play_wmp(filename)

    def stop(self) -> None:
        self.player.stop_wmp()

# Client code - works with target interface
def play_audio(player: MediaPlayer, filename: str):
    player.play(filename)
    player.stop()

# Usage - different players, same interface
vlc = VLCAdapter()
wmp = WMPAdapter()

play_audio(vlc, "song.mp3")
play_audio(wmp, "song.mp3")
```

**Java Example (Object Adapter):**

```java
// Target interface
public interface PaymentProcessor {
    PaymentResult process(PaymentRequest request);
}

// Adaptee - legacy payment system
public class LegacyPaymentSystem {
    public boolean makePayment(String cardNumber, double amount, String currency) {
        System.out.println("Processing payment via legacy system");
        System.out.println("Card: " + cardNumber + ", Amount: " + amount + " " + currency);
        return true;
    }
}

// Adapter
public class LegacyPaymentAdapter implements PaymentProcessor {
    private final LegacyPaymentSystem legacySystem;

    public LegacyPaymentAdapter(LegacyPaymentSystem legacySystem) {
        this.legacySystem = legacySystem;
    }

    @Override
    public PaymentResult process(PaymentRequest request) {
        // Translate new interface to old interface
        boolean success = legacySystem.makePayment(
            request.getCardNumber(),
            request.getAmount(),
            request.getCurrency()
        );

        return new PaymentResult(
            success ? "SUCCESS" : "FAILED",
            success ? "Payment processed" : "Payment failed"
        );
    }
}

// Client code
public class PaymentService {
    private final PaymentProcessor processor;

    public PaymentService(PaymentProcessor processor) {
        this.processor = processor;
    }

    public void processPayment(PaymentRequest request) {
        PaymentResult result = processor.process(request);
        System.out.println("Result: " + result.getStatus());
    }
}

// Usage
public class Main {
    public static void main(String[] args) {
        LegacyPaymentSystem legacy = new LegacyPaymentSystem();
        PaymentProcessor adapter = new LegacyPaymentAdapter(legacy);
        PaymentService service = new PaymentService(adapter);

        PaymentRequest request = new PaymentRequest("1234-5678", 100.0, "USD");
        service.processPayment(request);
    }
}
```

**TypeScript Example (API Integration):**

```typescript
// Target interface - what our app uses
interface WeatherService {
  getCurrentWeather(city: string): Promise<Weather>;
  getForecast(city: string, days: number): Promise<Weather[]>;
}

interface Weather {
  temperature: number;
  condition: string;
  humidity: number;
}

// Adaptee - OpenWeatherMap API (different interface)
class OpenWeatherMapAPI {
  constructor(private apiKey: string) {}

  async getWeather(location: string): Promise<any> {
    // Returns: { main: { temp: 20, humidity: 65 }, weather: [{ description: "sunny" }] }
    return {
      main: { temp: 20, humidity: 65 },
      weather: [{ description: 'sunny' }],
    };
  }

  async getForecastData(location: string, days: number): Promise<any> {
    // Returns: { list: [{ main: { temp: 22 }, weather: [{ description: "cloudy" }] }] }
    return {
      list: Array(days).fill({
        main: { temp: 22, humidity: 70 },
        weather: [{ description: 'cloudy' }],
      }),
    };
  }
}

// Adapter - translate OpenWeatherMap to our interface
class OpenWeatherMapAdapter implements WeatherService {
  constructor(private api: OpenWeatherMapAPI) {}

  async getCurrentWeather(city: string): Promise<Weather> {
    const data = await this.api.getWeather(city);

    return {
      temperature: data.main.temp,
      condition: data.weather[0].description,
      humidity: data.main.humidity,
    };
  }

  async getForecast(city: string, days: number): Promise<Weather[]> {
    const data = await this.api.getForecastData(city, days);

    return data.list.map((item: any) => ({
      temperature: item.main.temp,
      condition: item.weather[0].description,
      humidity: item.main.humidity,
    }));
  }
}

// Client code - works with our interface
class WeatherApp {
  constructor(private weatherService: WeatherService) {}

  async displayWeather(city: string): Promise<void> {
    const weather = await this.weatherService.getCurrentWeather(city);
    console.log(`${city}: ${weather.temperature}°C, ${weather.condition}`);
  }
}

// Usage - can easily swap weather providers
const openWeatherAPI = new OpenWeatherMapAPI('api-key-123');
const adapter = new OpenWeatherMapAdapter(openWeatherAPI);
const app = new WeatherApp(adapter);

app.displayWeather('London');
```

**Go Example (Interface Adapter):**

```go
package main

import "fmt"

// Target interface
type CloudStorage interface {
    Upload(filename string, data []byte) error
    Download(filename string) ([]byte, error)
}

// Adaptee - AWS S3 (different interface)
type S3Client struct {
    bucket string
}

func (s *S3Client) PutObject(key string, body []byte) error {
    fmt.Printf("S3: Uploading %s to bucket %s\n", key, s.bucket)
    return nil
}

func (s *S3Client) GetObject(key string) ([]byte, error) {
    fmt.Printf("S3: Downloading %s from bucket %s\n", key, s.bucket)
    return []byte("file content"), nil
}

// Adapter
type S3Adapter struct {
    client *S3Client
}

func NewS3Adapter(bucket string) *S3Adapter {
    return &S3Adapter{
        client: &S3Client{bucket: bucket},
    }
}

func (a *S3Adapter) Upload(filename string, data []byte) error {
    return a.client.PutObject(filename, data)
}

func (a *S3Adapter) Download(filename string) ([]byte, error) {
    return a.client.GetObject(filename)
}

// Adaptee - Azure Blob Storage (different interface)
type BlobClient struct {
    container string
}

func (b *BlobClient) UploadBlob(name string, content []byte) error {
    fmt.Printf("Azure: Uploading %s to container %s\n", name, b.container)
    return nil
}

func (b *BlobClient) DownloadBlob(name string) ([]byte, error) {
    fmt.Printf("Azure: Downloading %s from container %s\n", name, b.container)
    return []byte("file content"), nil
}

// Adapter
type AzureAdapter struct {
    client *BlobClient
}

func NewAzureAdapter(container string) *AzureAdapter {
    return &AzureAdapter{
        client: &BlobClient{container: container},
    }
}

func (a *AzureAdapter) Upload(filename string, data []byte) error {
    return a.client.UploadBlob(filename, data)
}

func (a *AzureAdapter) Download(filename string) ([]byte, error) {
    return a.client.DownloadBlob(filename)
}

// Client code
func uploadFile(storage CloudStorage, filename string, data []byte) {
    storage.Upload(filename, data)
}

// Usage - same interface, different implementations
func main() {
    // Use AWS S3
    s3 := NewS3Adapter("my-bucket")
    uploadFile(s3, "file.txt", []byte("content"))

    // Use Azure Blob
    azure := NewAzureAdapter("my-container")
    uploadFile(azure, "file.txt", []byte("content"))
}
```

### When to Use

✅ **Use Adapter when:**
- Need to use existing class with incompatible interface
- Integrating third-party libraries
- Working with legacy code
- Want to create reusable class working with unforeseen classes

❌ **Don't use when:**
- Can modify source class directly
- Interface is already compatible
- Creates unnecessary indirection

---

## Decorator Pattern

**Gang of Four pattern**. Attach additional responsibilities to object dynamically. Decorators provide flexible alternative to subclassing for extending functionality.

### Problem

Need to add behavior without modifying class or creating complex inheritance hierarchies:

```python
# Bad - combinatorial explosion of subclasses
class Coffee: pass
class CoffeeWithMilk: pass
class CoffeeWithSugar: pass
class CoffeeWithMilkAndSugar: pass
class CoffeeWithMilkAndSugarAndWhippedCream: pass
# Unsustainable!
```

### Solution

Wrap objects in decorators to add behavior:

```
┌──────────────┐
│  Component   │ (interface)
│ + operation()│
└──────────────┘
       △
       │ implements
   ┌───┴───┬─────────────────┐
   │       │                 │
Concrete  Decorator     (wraps component)
   │       │ + operation() ──► calls component.operation()
   │       │                   + adds behavior
   │       △
   │       │ extends
   │   ┌───┴───┬─────────┐
   │   Dec1   Dec2      Dec3
   │   (milk) (sugar) (cream)
   └──► Each adds specific behavior
```

### Implementation

**Python Example (Middleware Pattern):**

```python
from abc import ABC, abstractmethod
from typing import Callable

# Component interface
class Handler(ABC):
    @abstractmethod
    def handle(self, request: dict) -> dict:
        pass

# Concrete component
class BaseHandler(Handler):
    def handle(self, request: dict) -> dict:
        return {"status": "success", "data": request}

# Base decorator
class HandlerDecorator(Handler):
    def __init__(self, handler: Handler):
        self._handler = handler

    def handle(self, request: dict) -> dict:
        return self._handler.handle(request)

# Concrete decorators
class LoggingDecorator(HandlerDecorator):
    def handle(self, request: dict) -> dict:
        print(f"[LOG] Processing request: {request}")
        result = super().handle(request)
        print(f"[LOG] Result: {result}")
        return result

class AuthenticationDecorator(HandlerDecorator):
    def handle(self, request: dict) -> dict:
        if "auth_token" not in request:
            return {"status": "error", "message": "Not authenticated"}

        print("[AUTH] Authentication successful")
        return super().handle(request)

class ValidationDecorator(HandlerDecorator):
    def handle(self, request: dict) -> dict:
        if "user_id" not in request:
            return {"status": "error", "message": "Missing user_id"}

        print("[VALIDATION] Request validated")
        return super().handle(request)

class CachingDecorator(HandlerDecorator):
    def __init__(self, handler: Handler):
        super().__init__(handler)
        self._cache = {}

    def handle(self, request: dict) -> dict:
        cache_key = str(request)
        if cache_key in self._cache:
            print("[CACHE] Cache hit")
            return self._cache[cache_key]

        print("[CACHE] Cache miss")
        result = super().handle(request)
        self._cache[cache_key] = result
        return result

# Usage - compose decorators dynamically
base = BaseHandler()
with_logging = LoggingDecorator(base)
with_auth = AuthenticationDecorator(with_logging)
with_validation = ValidationDecorator(with_auth)
with_cache = CachingDecorator(with_validation)

# Request goes through all decorators
request = {"auth_token": "abc123", "user_id": "user1", "action": "get_data"}
result = with_cache.handle(request)
```

**Java Example (I/O Streams - Real-World Decorator):**

```java
// Component interface
public interface DataSource {
    void writeData(String data);
    String readData();
}

// Concrete component
public class FileDataSource implements DataSource {
    private String filename;

    public FileDataSource(String filename) {
        this.filename = filename;
    }

    @Override
    public void writeData(String data) {
        System.out.println("Writing to file: " + filename);
        // Write to file
    }

    @Override
    public String readData() {
        System.out.println("Reading from file: " + filename);
        return "file content";
    }
}

// Base decorator
public abstract class DataSourceDecorator implements DataSource {
    protected DataSource wrappee;

    public DataSourceDecorator(DataSource source) {
        this.wrappee = source;
    }

    @Override
    public void writeData(String data) {
        wrappee.writeData(data);
    }

    @Override
    public String readData() {
        return wrappee.readData();
    }
}

// Concrete decorators
public class EncryptionDecorator extends DataSourceDecorator {
    public EncryptionDecorator(DataSource source) {
        super(source);
    }

    @Override
    public void writeData(String data) {
        String encrypted = encrypt(data);
        System.out.println("Encrypting data");
        super.writeData(encrypted);
    }

    @Override
    public String readData() {
        String data = super.readData();
        System.out.println("Decrypting data");
        return decrypt(data);
    }

    private String encrypt(String data) {
        return "ENCRYPTED(" + data + ")";
    }

    private String decrypt(String data) {
        return data.replace("ENCRYPTED(", "").replace(")", "");
    }
}

public class CompressionDecorator extends DataSourceDecorator {
    public CompressionDecorator(DataSource source) {
        super(source);
    }

    @Override
    public void writeData(String data) {
        String compressed = compress(data);
        System.out.println("Compressing data");
        super.writeData(compressed);
    }

    @Override
    public String readData() {
        String data = super.readData();
        System.out.println("Decompressing data");
        return decompress(data);
    }

    private String compress(String data) {
        return "COMPRESSED(" + data + ")";
    }

    private String decompress(String data) {
        return data.replace("COMPRESSED(", "").replace(")", "");
    }
}

// Usage - chain decorators
public class Main {
    public static void main(String[] args) {
        // Plain file
        DataSource source = new FileDataSource("data.txt");

        // With compression
        source = new CompressionDecorator(source);

        // With encryption
        source = new EncryptionDecorator(source);

        source.writeData("Important data");
        // Output:
        // Encrypting data
        // Compressing data
        // Writing to file: data.txt
    }
}
```

**TypeScript Example (HTTP Middleware):**

```typescript
// Component interface
interface RequestHandler {
  handle(request: Request): Promise<Response>;
}

// Concrete component
class APIHandler implements RequestHandler {
  async handle(request: Request): Promise<Response> {
    return {
      status: 200,
      body: { data: 'Response data' },
    };
  }
}

// Base decorator
abstract class HandlerDecorator implements RequestHandler {
  constructor(protected handler: RequestHandler) {}

  async handle(request: Request): Promise<Response> {
    return this.handler.handle(request);
  }
}

// Concrete decorators
class RateLimitDecorator extends HandlerDecorator {
  private requests: Map<string, number[]> = new Map();
  private limit = 100; // requests per minute
  private window = 60000; // 1 minute

  async handle(request: Request): Promise<Response> {
    const ip = request.ip;
    const now = Date.now();

    if (!this.requests.has(ip)) {
      this.requests.set(ip, []);
    }

    const timestamps = this.requests.get(ip)!;
    const recentRequests = timestamps.filter((t) => now - t < this.window);

    if (recentRequests.length >= this.limit) {
      return {
        status: 429,
        body: { error: 'Rate limit exceeded' },
      };
    }

    recentRequests.push(now);
    this.requests.set(ip, recentRequests);

    return super.handle(request);
  }
}

class CORSDecorator extends HandlerDecorator {
  async handle(request: Request): Promise<Response> {
    const response = await super.handle(request);

    return {
      ...response,
      headers: {
        ...response.headers,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    };
  }
}

class TimingDecorator extends HandlerDecorator {
  async handle(request: Request): Promise<Response> {
    const start = Date.now();
    const response = await super.handle(request);
    const duration = Date.now() - start;

    console.log(`Request to ${request.path} took ${duration}ms`);

    return {
      ...response,
      headers: {
        ...response.headers,
        'X-Response-Time': `${duration}ms`,
      },
    };
  }
}

// Usage - compose middleware stack
let handler: RequestHandler = new APIHandler();
handler = new TimingDecorator(handler);
handler = new RateLimitDecorator(handler);
handler = new CORSDecorator(handler);

// Request flows through all decorators
const response = await handler.handle({
  path: '/api/users',
  ip: '192.168.1.1',
});
```

**Rust Example (Type-Safe Decorators):**

```rust
use std::time::Instant;

// Component trait
trait Service {
    fn execute(&self, input: &str) -> String;
}

// Concrete component
struct BaseService;

impl Service for BaseService {
    fn execute(&self, input: &str) -> String {
        format!("Processed: {}", input)
    }
}

// Decorator with timing
struct TimingDecorator<S: Service> {
    service: S,
}

impl<S: Service> TimingDecorator<S> {
    fn new(service: S) -> Self {
        Self { service }
    }
}

impl<S: Service> Service for TimingDecorator<S> {
    fn execute(&self, input: &str) -> String {
        let start = Instant::now();
        let result = self.service.execute(input);
        let duration = start.elapsed();
        println!("Execution took: {:?}", duration);
        result
    }
}

// Decorator with logging
struct LoggingDecorator<S: Service> {
    service: S,
}

impl<S: Service> LoggingDecorator<S> {
    fn new(service: S) -> Self {
        Self { service }
    }
}

impl<S: Service> Service for LoggingDecorator<S> {
    fn execute(&self, input: &str) -> String {
        println!("Executing with input: {}", input);
        let result = self.service.execute(input);
        println!("Result: {}", result);
        result
    }
}

// Usage - type-safe decorator composition
fn main() {
    let service = BaseService;
    let service = TimingDecorator::new(service);
    let service = LoggingDecorator::new(service);

    let result = service.execute("test data");
    println!("{}", result);
}
```

### When to Use

✅ **Use Decorator when:**
- Need to add responsibilities without subclassing
- Want to add/remove responsibilities dynamically
- Have many optional features (avoid combinatorial explosion)
- Cross-cutting concerns (logging, caching, authentication)

❌ **Don't use when:**
- Simple inheritance suffices
- Too many small decorators (hard to debug)
- Order of decorators matters (hard to get right)

### Decorator vs Inheritance

| Decorator | Inheritance |
|-----------|-------------|
| Dynamic composition | Static at compile time |
| Multiple behaviors | One behavior per class |
| Runtime flexibility | Design-time fixed |
| Can wrap any object | Tied to class hierarchy |
| More flexible | Simpler to understand |

---

## Facade Pattern

**Gang of Four pattern**. Provide unified interface to set of interfaces in subsystem. Facade defines higher-level interface that makes subsystem easier to use.

### Problem

Complex subsystem with many classes is hard to use:

```java
// Complex subsystem - too many classes to learn
VideoFile file = new VideoFile("movie.mp4");
Codec codec = CodecFactory.extract(file);
Buffer buffer = BitrateReader.read(file, codec);
Result result = BitrateReader.convert(buffer, codec);
AudioMixer mixer = new AudioMixer();
mixer.fix(result);
// Too complex for simple task!
```

### Solution

Facade provides simple interface to complex subsystem:

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ uses
       ▼
┌─────────────────┐
│     Facade      │
│ + simpleMethod()│───► coordinates ──►┌──────────────┐
└─────────────────┘                    │  Subsystem   │
                                       │  (complex)   │
                                       │  ClassA      │
                                       │  ClassB      │
                                       │  ClassC      │
                                       └──────────────┘
```

### Implementation

**Python Example (Video Converter Facade):**

```python
# Complex subsystem classes
class VideoFile:
    def __init__(self, filename: str):
        self.filename = filename

class CodecFactory:
    @staticmethod
    def extract(file: VideoFile) -> str:
        print(f"Extracting codec from {file.filename}")
        return "MPEG4"

class BitrateReader:
    @staticmethod
    def read(file: VideoFile, codec: str) -> bytes:
        print(f"Reading file with {codec} codec")
        return b"buffer_data"

    @staticmethod
    def convert(buffer: bytes, codec: str) -> bytes:
        print(f"Converting buffer with {codec} codec")
        return b"converted_data"

class AudioMixer:
    def fix(self, data: bytes) -> bytes:
        print("Fixing audio")
        return data

# Facade - simple interface
class VideoConverter:
    """Simple interface to complex video conversion subsystem"""

    def convert(self, filename: str, format: str) -> str:
        """Convert video to specified format"""
        print(f"Converting {filename} to {format}")

        # Coordinate complex subsystem
        file = VideoFile(filename)
        codec = CodecFactory.extract(file)
        buffer = BitrateReader.read(file, codec)
        converted = BitrateReader.convert(buffer, codec)
        mixer = AudioMixer()
        result = mixer.fix(converted)

        output_filename = filename.replace(".mp4", f".{format}")
        print(f"Conversion complete: {output_filename}")
        return output_filename

# Client code - simple!
converter = VideoConverter()
converter.convert("movie.mp4", "avi")
```

**Java Example (Banking Facade):**

```java
// Complex subsystem
class AccountService {
    public boolean hasAccount(String customerId) {
        System.out.println("Checking if customer has account");
        return true;
    }

    public Account getAccount(String accountId) {
        System.out.println("Getting account details");
        return new Account(accountId, 1000.0);
    }
}

class SecurityService {
    public boolean authenticate(String customerId, String pin) {
        System.out.println("Authenticating customer");
        return true;
    }
}

class TransactionService {
    public void withdraw(Account account, double amount) {
        System.out.println("Processing withdrawal: $" + amount);
        account.debit(amount);
    }

    public void deposit(Account account, double amount) {
        System.out.println("Processing deposit: $" + amount);
        account.credit(amount);
    }
}

class NotificationService {
    public void sendEmail(String email, String message) {
        System.out.println("Sending email: " + message);
    }

    public void sendSMS(String phone, String message) {
        System.out.println("Sending SMS: " + message);
    }
}

// Facade
public class BankingFacade {
    private AccountService accountService;
    private SecurityService securityService;
    private TransactionService transactionService;
    private NotificationService notificationService;

    public BankingFacade() {
        this.accountService = new AccountService();
        this.securityService = new SecurityService();
        this.transactionService = new TransactionService();
        this.notificationService = new NotificationService();
    }

    public boolean withdrawMoney(String customerId, String pin, String accountId, double amount) {
        // Coordinate complex operations
        if (!securityService.authenticate(customerId, pin)) {
            return false;
        }

        if (!accountService.hasAccount(customerId)) {
            return false;
        }

        Account account = accountService.getAccount(accountId);

        if (account.getBalance() < amount) {
            return false;
        }

        transactionService.withdraw(account, amount);
        notificationService.sendSMS(account.getPhone(), "Withdrawal of $" + amount);

        return true;
    }

    public boolean depositMoney(String customerId, String accountId, double amount) {
        Account account = accountService.getAccount(accountId);
        transactionService.deposit(account, amount);
        notificationService.sendEmail(account.getEmail(), "Deposit of $" + amount);
        return true;
    }
}

// Client code - simple interface
public class ATM {
    private BankingFacade bank = new BankingFacade();

    public void withdraw(String customerId, String pin, String accountId, double amount) {
        boolean success = bank.withdrawMoney(customerId, pin, accountId, amount);
        if (success) {
            System.out.println("Withdrawal successful");
        } else {
            System.out.println("Withdrawal failed");
        }
    }
}
```

**TypeScript Example (E-Commerce Facade):**

```typescript
// Complex subsystem
class InventoryService {
  checkStock(productId: string): boolean {
    console.log(`Checking stock for ${productId}`);
    return true;
  }

  reserveItem(productId: string): void {
    console.log(`Reserving ${productId}`);
  }
}

class PaymentService {
  processPayment(amount: number, cardInfo: any): string {
    console.log(`Processing payment: $${amount}`);
    return 'payment-123';
  }
}

class ShippingService {
  calculateShipping(address: any): number {
    console.log('Calculating shipping cost');
    return 10.0;
  }

  scheduleDelivery(orderId: string, address: any): void {
    console.log(`Scheduling delivery for order ${orderId}`);
  }
}

class NotificationService {
  sendOrderConfirmation(email: string, orderId: string): void {
    console.log(`Sending confirmation for order ${orderId} to ${email}`);
  }
}

class CustomerService {
  updateOrderHistory(customerId: string, orderId: string): void {
    console.log(`Updating order history for customer ${customerId}`);
  }
}

// Facade - simple checkout process
class CheckoutFacade {
  private inventory = new InventoryService();
  private payment = new PaymentService();
  private shipping = new ShippingService();
  private notification = new NotificationService();
  private customer = new CustomerService();

  async checkout(order: Order): Promise<CheckoutResult> {
    try {
      // 1. Check inventory
      for (const item of order.items) {
        if (!this.inventory.checkStock(item.productId)) {
          return { success: false, error: 'Item out of stock' };
        }
      }

      // 2. Calculate shipping
      const shippingCost = this.shipping.calculateShipping(order.address);
      const totalAmount = order.totalAmount + shippingCost;

      // 3. Process payment
      const paymentId = this.payment.processPayment(totalAmount, order.cardInfo);

      // 4. Reserve items
      for (const item of order.items) {
        this.inventory.reserveItem(item.productId);
      }

      // 5. Schedule delivery
      const orderId = `ORD-${Date.now()}`;
      this.shipping.scheduleDelivery(orderId, order.address);

      // 6. Send confirmation
      this.notification.sendOrderConfirmation(order.customerEmail, orderId);

      // 7. Update customer history
      this.customer.updateOrderHistory(order.customerId, orderId);

      return {
        success: true,
        orderId,
        paymentId,
        totalAmount,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Client code - simple checkout
const checkout = new CheckoutFacade();
const result = await checkout.checkout({
  customerId: 'cust-123',
  customerEmail: 'customer@example.com',
  items: [{ productId: 'prod-1', quantity: 2 }],
  totalAmount: 50.0,
  address: { street: '123 Main St', city: 'Boston' },
  cardInfo: { number: '1234-5678', cvv: '123' },
});

if (result.success) {
  console.log(`Order placed: ${result.orderId}`);
}
```

**Go Example (AWS Facade):**

```go
package main

import "fmt"

// Complex subsystem - AWS services
type S3Service struct{}

func (s *S3Service) UploadFile(bucket, key string, data []byte) error {
    fmt.Printf("Uploading to S3: %s/%s\n", bucket, key)
    return nil
}

type DynamoDBService struct{}

func (d *DynamoDBService) PutItem(table string, item map[string]interface{}) error {
    fmt.Printf("Saving to DynamoDB: %s\n", table)
    return nil
}

type SQSService struct{}

func (s *SQSService) SendMessage(queue, message string) error {
    fmt.Printf("Sending SQS message to %s\n", queue)
    return nil
}

type SESService struct{}

func (s *SESService) SendEmail(to, subject, body string) error {
    fmt.Printf("Sending email to %s\n", to)
    return nil
}

type CloudWatchService struct{}

func (c *CloudWatchService) LogMetric(metric string, value float64) error {
    fmt.Printf("Logging metric: %s = %.2f\n", metric, value)
    return nil
}

// Facade - simple interface to AWS services
type AWSFacade struct {
    s3         *S3Service
    dynamodb   *DynamoDBService
    sqs        *SQSService
    ses        *SESService
    cloudwatch *CloudWatchService
}

func NewAWSFacade() *AWSFacade {
    return &AWSFacade{
        s3:         &S3Service{},
        dynamodb:   &DynamoDBService{},
        sqs:        &SQSService{},
        ses:        &SESService{},
        cloudwatch: &CloudWatchService{},
    }
}

// High-level operation
func (f *AWSFacade) ProcessUserUpload(userID, filename string, data []byte) error {
    // 1. Upload file to S3
    if err := f.s3.UploadFile("user-uploads", filename, data); err != nil {
        return err
    }

    // 2. Save metadata to DynamoDB
    metadata := map[string]interface{}{
        "user_id":  userID,
        "filename": filename,
        "size":     len(data),
    }
    if err := f.dynamodb.PutItem("uploads", metadata); err != nil {
        return err
    }

    // 3. Queue processing task
    if err := f.sqs.SendMessage("processing-queue", filename); err != nil {
        return err
    }

    // 4. Send confirmation email
    if err := f.ses.SendEmail(userID, "Upload Successful", "Your file has been uploaded"); err != nil {
        return err
    }

    // 5. Log metrics
    if err := f.cloudwatch.LogMetric("uploads.count", 1.0); err != nil {
        return err
    }

    return nil
}

// Client code - one simple call
func main() {
    aws := NewAWSFacade()
    err := aws.ProcessUserUpload("user-123", "document.pdf", []byte("file content"))
    if err != nil {
        fmt.Printf("Upload failed: %v\n", err)
    } else {
        fmt.Println("Upload completed successfully")
    }
}
```

### When to Use

✅ **Use Facade when:**
- Need simple interface to complex subsystem
- Want to decouple client from subsystem
- Layer architecture (facade per layer)
- Simplify library usage

❌ **Don't use when:**
- Subsystem is already simple
- Need access to all subsystem features
- Facade becomes God Object

---

## Proxy Pattern

**Gang of Four pattern**. Provide surrogate or placeholder for another object to control access to it.

### Problem

Need to control access to object (lazy loading, access control, logging, caching):

```python
# Expensive object - don't want to create until needed
heavy_object = HeavyObject()  # Takes 10 seconds to initialize!
# Want lazy loading or access control
```

### Solution

Proxy controls access to real object:

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ uses
       ▼
┌─────────────────┐
│   Subject       │ (interface)
│ + request()     │
└─────────────────┘
       △
       │ implements
   ┌───┴───┬──────────────┐
   │       │              │
RealSubject Proxy       (controls access)
   │       │ + request() ──► delegates ──► RealSubject
   │       │                 + additional logic
```

### Types of Proxies

1. **Virtual Proxy** - Lazy initialization
2. **Protection Proxy** - Access control
3. **Remote Proxy** - Represents object in different address space
4. **Smart Proxy** - Additional behavior (reference counting, logging)

### Implementation

**Python Example (Virtual Proxy - Lazy Loading):**

```python
from abc import ABC, abstractmethod

# Subject interface
class Image(ABC):
    @abstractmethod
    def display(self) -> None:
        pass

# Real subject - expensive to create
class RealImage(Image):
    def __init__(self, filename: str):
        self.filename = filename
        self._load_from_disk()

    def _load_from_disk(self) -> None:
        print(f"Loading image from disk: {self.filename}")
        # Simulate expensive operation
        import time
        time.sleep(2)

    def display(self) -> None:
        print(f"Displaying image: {self.filename}")

# Proxy - lazy loading
class ImageProxy(Image):
    def __init__(self, filename: str):
        self.filename = filename
        self._real_image: RealImage = None

    def display(self) -> None:
        # Lazy initialization - create real object only when needed
        if self._real_image is None:
            print("Creating real image (lazy loading)")
            self._real_image = RealImage(self.filename)

        self._real_image.display()

# Client code
images = [
    ImageProxy("photo1.jpg"),
    ImageProxy("photo2.jpg"),
    ImageProxy("photo3.jpg"),
]

# Images not loaded yet (fast)
print("Images created (no loading yet)")

# Load only when displayed (lazy)
images[0].display()  # Loads and displays
images[0].display()  # Just displays (already loaded)
```

**Java Example (Protection Proxy - Access Control):**

```java
// Subject interface
public interface UserRepository {
    User findById(String id);
    void save(User user);
    void delete(String id);
}

// Real subject
public class UserRepositoryImpl implements UserRepository {
    @Override
    public User findById(String id) {
        System.out.println("Finding user: " + id);
        return new User(id, "John Doe");
    }

    @Override
    public void save(User user) {
        System.out.println("Saving user: " + user.getId());
    }

    @Override
    public void delete(String id) {
        System.out.println("Deleting user: " + id);
    }
}

// Protection proxy - access control
public class ProtectedUserRepository implements UserRepository {
    private final UserRepositoryImpl realRepository;
    private final String currentUserRole;

    public ProtectedUserRepository(String currentUserRole) {
        this.realRepository = new UserRepositoryImpl();
        this.currentUserRole = currentUserRole;
    }

    @Override
    public User findById(String id) {
        // Anyone can read
        return realRepository.findById(id);
    }

    @Override
    public void save(User user) {
        if (!currentUserRole.equals("ADMIN") && !currentUserRole.equals("EDITOR")) {
            throw new SecurityException("Insufficient permissions to save user");
        }
        realRepository.save(user);
    }

    @Override
    public void delete(String id) {
        if (!currentUserRole.equals("ADMIN")) {
            throw new SecurityException("Insufficient permissions to delete user");
        }
        realRepository.delete(id);
    }
}

// Usage
public class Main {
    public static void main(String[] args) {
        // Admin user - full access
        UserRepository adminRepo = new ProtectedUserRepository("ADMIN");
        adminRepo.save(new User("1", "John"));
        adminRepo.delete("1");

        // Guest user - restricted access
        UserRepository guestRepo = new ProtectedUserRepository("GUEST");
        guestRepo.findById("1");  // OK
        // guestRepo.save(new User("2", "Jane"));  // Throws SecurityException
    }
}
```

**TypeScript Example (Caching Proxy):**

```typescript
// Subject interface
interface APIClient {
  fetchUser(id: string): Promise<User>;
  fetchPosts(userId: string): Promise<Post[]>;
}

// Real subject
class RealAPIClient implements APIClient {
  async fetchUser(id: string): Promise<User> {
    console.log(`Fetching user ${id} from API`);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { id, name: 'John Doe', email: 'john@example.com' };
  }

  async fetchPosts(userId: string): Promise<Post[]> {
    console.log(`Fetching posts for user ${userId} from API`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return [
      { id: '1', userId, title: 'Post 1' },
      { id: '2', userId, title: 'Post 2' },
    ];
  }
}

// Caching proxy
class CachingAPIProxy implements APIClient {
  private realClient: RealAPIClient;
  private userCache: Map<string, { data: User; timestamp: number }>;
  private postsCache: Map<string, { data: Post[]; timestamp: number }>;
  private cacheTTL = 60000; // 1 minute

  constructor() {
    this.realClient = new RealAPIClient();
    this.userCache = new Map();
    this.postsCache = new Map();
  }

  async fetchUser(id: string): Promise<User> {
    const cached = this.userCache.get(id);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log(`Returning cached user ${id}`);
      return cached.data;
    }

    const user = await this.realClient.fetchUser(id);
    this.userCache.set(id, { data: user, timestamp: Date.now() });
    return user;
  }

  async fetchPosts(userId: string): Promise<Post[]> {
    const cached = this.postsCache.get(userId);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log(`Returning cached posts for user ${userId}`);
      return cached.data;
    }

    const posts = await this.realClient.fetchPosts(userId);
    this.postsCache.set(userId, { data: posts, timestamp: Date.now() });
    return posts;
  }
}

// Usage
const api: APIClient = new CachingAPIProxy();

await api.fetchUser('123'); // Fetches from API
await api.fetchUser('123'); // Returns from cache
await api.fetchPosts('123'); // Fetches from API
await api.fetchPosts('123'); // Returns from cache
```

**Rust Example (Smart Proxy - Reference Counting):**

```rust
use std::rc::Rc;
use std::cell::RefCell;

// Real subject
struct Database {
    connection: String,
}

impl Database {
    fn new(connection: String) -> Self {
        println!("Opening database connection: {}", connection);
        Self { connection }
    }

    fn query(&self, sql: &str) -> Vec<String> {
        println!("Executing query: {}", sql);
        vec!["result1".to_string(), "result2".to_string()]
    }
}

impl Drop for Database {
    fn drop(&mut self) {
        println!("Closing database connection: {}", self.connection);
    }
}

// Smart proxy with reference counting
struct DatabaseProxy {
    db: Rc<RefCell<Database>>,
    query_count: Rc<RefCell<usize>>,
}

impl DatabaseProxy {
    fn new(connection: String) -> Self {
        Self {
            db: Rc::new(RefCell::new(Database::new(connection))),
            query_count: Rc::new(RefCell::new(0)),
        }
    }

    fn query(&self, sql: &str) -> Vec<String> {
        // Track query count
        *self.query_count.borrow_mut() += 1;

        // Log access
        println!("Query #{}: {}", self.query_count.borrow(), sql);

        // Delegate to real database
        self.db.borrow().query(sql)
    }

    fn get_query_count(&self) -> usize {
        *self.query_count.borrow()
    }

    fn clone(&self) -> Self {
        Self {
            db: Rc::clone(&self.db),
            query_count: Rc::clone(&self.query_count),
        }
    }
}

// Usage
fn main() {
    let db1 = DatabaseProxy::new("postgresql://localhost/db".to_string());
    db1.query("SELECT * FROM users");

    // Clone proxy - shares same connection and counter
    let db2 = db1.clone();
    db2.query("SELECT * FROM posts");

    println!("Total queries: {}", db1.get_query_count()); // 2
}
```

### When to Use

✅ **Use Proxy when:**
- Lazy loading expensive objects (Virtual Proxy)
- Access control needed (Protection Proxy)
- Remote object access (Remote Proxy)
- Additional behavior (Smart Proxy - logging, caching, reference counting)

❌ **Don't use when:**
- Direct access is simpler
- Performance overhead not acceptable
- Adds unnecessary complexity

---

## Repository Pattern (Modern)

**Not a Gang of Four pattern**, but essential in modern development. Mediates between domain and data mapping layers using collection-like interface.

### Problem

Domain logic mixed with data access logic:

```python
# Bad - domain logic knows about database
class UserService:
    def create_user(self, username, email):
        # Domain logic mixed with SQL!
        db.execute("INSERT INTO users (username, email) VALUES (?, ?)", username, email)
        user = db.fetch_one("SELECT * FROM users WHERE username = ?", username)
        return user
```

### Solution

Repository abstracts data access:

```
┌──────────────┐
│Domain Layer  │
│(Business Logic)│
└──────┬───────┘
       │ uses
       ▼
┌──────────────────┐
│  Repository      │ (interface)
│ + findById()     │
│ + save()         │
│ + delete()       │
└──────────────────┘
       △
       │ implements
       │
┌──────┴────────────┐
│ConcreteRepository │
│(SQL, NoSQL, etc.) │───► interacts ──► Database
└───────────────────┘
```

### Implementation

**Python Example:**

```python
from abc import ABC, abstractmethod
from typing import List, Optional
from dataclasses import dataclass

# Domain model
@dataclass
class User:
    id: Optional[str]
    username: str
    email: str
    active: bool = True

# Repository interface
class UserRepository(ABC):
    @abstractmethod
    def find_by_id(self, user_id: str) -> Optional[User]:
        pass

    @abstractmethod
    def find_by_email(self, email: str) -> Optional[User]:
        pass

    @abstractmethod
    def find_all(self) -> List[User]:
        pass

    @abstractmethod
    def save(self, user: User) -> User:
        pass

    @abstractmethod
    def delete(self, user_id: str) -> bool:
        pass

# Concrete implementation - PostgreSQL
class PostgreSQLUserRepository(UserRepository):
    def __init__(self, connection):
        self.conn = connection

    def find_by_id(self, user_id: str) -> Optional[User]:
        cursor = self.conn.execute(
            "SELECT * FROM users WHERE id = ?", (user_id,)
        )
        row = cursor.fetchone()
        return self._map_to_user(row) if row else None

    def find_by_email(self, email: str) -> Optional[User]:
        cursor = self.conn.execute(
            "SELECT * FROM users WHERE email = ?", (email,)
        )
        row = cursor.fetchone()
        return self._map_to_user(row) if row else None

    def find_all(self) -> List[User]:
        cursor = self.conn.execute("SELECT * FROM users")
        return [self._map_to_user(row) for row in cursor.fetchall()]

    def save(self, user: User) -> User:
        if user.id is None:
            # Insert
            cursor = self.conn.execute(
                "INSERT INTO users (username, email, active) VALUES (?, ?, ?)",
                (user.username, user.email, user.active)
            )
            user.id = str(cursor.lastrowid)
        else:
            # Update
            self.conn.execute(
                "UPDATE users SET username = ?, email = ?, active = ? WHERE id = ?",
                (user.username, user.email, user.active, user.id)
            )
        self.conn.commit()
        return user

    def delete(self, user_id: str) -> bool:
        cursor = self.conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
        self.conn.commit()
        return cursor.rowcount > 0

    def _map_to_user(self, row) -> User:
        return User(
            id=str(row[0]),
            username=row[1],
            email=row[2],
            active=bool(row[3])
        )

# Alternative implementation - In-Memory
class InMemoryUserRepository(UserRepository):
    def __init__(self):
        self.users: dict[str, User] = {}
        self.next_id = 1

    def find_by_id(self, user_id: str) -> Optional[User]:
        return self.users.get(user_id)

    def find_by_email(self, email: str) -> Optional[User]:
        return next((u for u in self.users.values() if u.email == email), None)

    def find_all(self) -> List[User]:
        return list(self.users.values())

    def save(self, user: User) -> User:
        if user.id is None:
            user.id = str(self.next_id)
            self.next_id += 1
        self.users[user.id] = user
        return user

    def delete(self, user_id: str) -> bool:
        if user_id in self.users:
            del self.users[user_id]
            return True
        return False

# Domain service - independent of data source
class UserService:
    def __init__(self, repository: UserRepository):
        self.repository = repository

    def register_user(self, username: str, email: str) -> User:
        # Check if email exists
        existing = self.repository.find_by_email(email)
        if existing:
            raise ValueError("Email already registered")

        # Create user
        user = User(id=None, username=username, email=email)
        return self.repository.save(user)

    def deactivate_user(self, user_id: str) -> bool:
        user = self.repository.find_by_id(user_id)
        if not user:
            return False

        user.active = False
        self.repository.save(user)
        return True

# Usage - production
import sqlite3
conn = sqlite3.connect("users.db")
repo = PostgreSQLUserRepository(conn)
service = UserService(repo)
user = service.register_user("johndoe", "john@example.com")

# Usage - testing
repo = InMemoryUserRepository()
service = UserService(repo)
user = service.register_user("testuser", "test@example.com")
```

**Java Example (Spring Data):**

```java
// Domain model
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private BigDecimal price;
    private Integer stock;
    private boolean active;

    // Constructors, getters, setters
}

// Repository interface
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByActiveTrue();
    List<Product> findByPriceBetween(BigDecimal min, BigDecimal max);
    Optional<Product> findByName(String name);

    @Query("SELECT p FROM Product p WHERE p.stock < :threshold AND p.active = true")
    List<Product> findLowStockProducts(@Param("threshold") Integer threshold);
}

// Domain service
@Service
public class ProductService {
    private final ProductRepository repository;

    @Autowired
    public ProductService(ProductRepository repository) {
        this.repository = repository;
    }

    public Product createProduct(String name, BigDecimal price, Integer stock) {
        Product product = new Product();
        product.setName(name);
        product.setPrice(price);
        product.setStock(stock);
        product.setActive(true);

        return repository.save(product);
    }

    public List<Product> getAvailableProducts() {
        return repository.findByActiveTrue();
    }

    public List<Product> getLowStockProducts() {
        return repository.findLowStockProducts(10);
    }

    public void discontinueProduct(Long productId) {
        repository.findById(productId).ifPresent(product -> {
            product.setActive(false);
            repository.save(product);
        });
    }
}
```

**TypeScript Example (TypeORM):**

```typescript
// Domain model
@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column('decimal')
  totalAmount: number;

  @Column()
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Repository interface (optional - TypeORM provides base)
export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByCustomerId(customerId: string): Promise<Order[]>;
  findPendingOrders(): Promise<Order[]>;
  save(order: Order): Promise<Order>;
  delete(id: string): Promise<boolean>;
}

// Custom repository implementation
@EntityRepository(Order)
export class OrderRepository extends Repository<Order> implements IOrderRepository {
  async findById(id: string): Promise<Order | null> {
    return this.findOne({ where: { id } });
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    return this.find({ where: { customerId }, order: { createdAt: 'DESC' } });
  }

  async findPendingOrders(): Promise<Order[]> {
    return this.createQueryBuilder('order')
      .where('order.status = :status', { status: 'pending' })
      .andWhere('order.createdAt > :date', { date: new Date(Date.now() - 24 * 60 * 60 * 1000) })
      .getMany();
  }

  async save(order: Order): Promise<Order> {
    return this.save(order);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.delete(id);
    return result.affected > 0;
  }
}

// Domain service
@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(OrderRepository)
    private readonly orderRepository: OrderRepository
  ) {}

  async createOrder(customerId: string, items: OrderItem[]): Promise<Order> {
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = new Order();
    order.customerId = customerId;
    order.totalAmount = totalAmount;
    order.status = 'pending';

    return this.orderRepository.save(order);
  }

  async getCustomerOrders(customerId: string): Promise<Order[]> {
    return this.orderRepository.findByCustomerId(customerId);
  }

  async processPendingOrders(): Promise<void> {
    const pendingOrders = await this.orderRepository.findPendingOrders();

    for (const order of pendingOrders) {
      // Process order
      order.status = 'processing';
      await this.orderRepository.save(order);
    }
  }
}
```

### When to Use

✅ **Use Repository when:**
- Need to separate domain from data access
- Want to test domain logic without database
- Multiple data sources possible
- Complex queries need encapsulation

❌ **Don't use when:**
- Very simple CRUD operations
- No domain logic (just data access)
- Adds unnecessary abstraction

---

## Composite Pattern

**Gang of Four pattern**. Compose objects into tree structures to represent part-whole hierarchies. Composite lets clients treat individual objects and compositions uniformly.

### Problem

Need to represent tree structures where leaves and branches treated uniformly:

```python
# Need to treat files and folders uniformly
if isinstance(item, File):
    item.display()
elif isinstance(item, Folder):
    for child in item.children:
        # Recurse for folders, display for files
        # Complex branching logic!
```

### Solution

Common interface for leaves and composites:

```
┌──────────────┐
│  Component   │ (interface)
│ + operation()│
└──────────────┘
       △
       │ implements
   ┌───┴───┬──────────────┐
   │       │              │
  Leaf   Composite    (has children)
   │       │ + operation() ──► iterates children
   │       │ + add(Component)
   │       │ + remove(Component)
```

### Implementation

**Python Example (File System):**

```python
from abc import ABC, abstractmethod
from typing import List

# Component interface
class FileSystemItem(ABC):
    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def get_size(self) -> int:
        pass

    @abstractmethod
    def display(self, indent: int = 0) -> None:
        pass

# Leaf - File
class File(FileSystemItem):
    def __init__(self, name: str, size: int):
        super().__init__(name)
        self.size = size

    def get_size(self) -> int:
        return self.size

    def display(self, indent: int = 0) -> None:
        print("  " * indent + f"📄 {self.name} ({self.size} bytes)")

# Composite - Folder
class Folder(FileSystemItem):
    def __init__(self, name: str):
        super().__init__(name)
        self.children: List[FileSystemItem] = []

    def add(self, item: FileSystemItem) -> None:
        self.children.append(item)

    def remove(self, item: FileSystemItem) -> None:
        self.children.remove(item)

    def get_size(self) -> int:
        return sum(child.get_size() for child in self.children)

    def display(self, indent: int = 0) -> None:
        print("  " * indent + f"📁 {self.name}/ ({self.get_size()} bytes)")
        for child in self.children:
            child.display(indent + 1)

# Usage - treat files and folders uniformly
root = Folder("root")

docs = Folder("documents")
docs.add(File("report.pdf", 1024))
docs.add(File("memo.txt", 256))

images = Folder("images")
images.add(File("photo1.jpg", 2048))
images.add(File("photo2.jpg", 3072))

root.add(docs)
root.add(images)
root.add(File("readme.txt", 128))

# Uniform treatment
root.display()
print(f"\nTotal size: {root.get_size()} bytes")
```

**Java Example (UI Components):**

```java
// Component interface
public interface UIComponent {
    void render();
    void setVisible(boolean visible);
}

// Leaf - Button
public class Button implements UIComponent {
    private String label;
    private boolean visible = true;

    public Button(String label) {
        this.label = label;
    }

    @Override
    public void render() {
        if (visible) {
            System.out.println("Rendering button: " + label);
        }
    }

    @Override
    public void setVisible(boolean visible) {
        this.visible = visible;
    }
}

// Leaf - TextBox
public class TextBox implements UIComponent {
    private String placeholder;
    private boolean visible = true;

    public TextBox(String placeholder) {
        this.placeholder = placeholder;
    }

    @Override
    public void render() {
        if (visible) {
            System.out.println("Rendering textbox: " + placeholder);
        }
    }

    @Override
    public void setVisible(boolean visible) {
        this.visible = visible;
    }
}

// Composite - Panel
public class Panel implements UIComponent {
    private List<UIComponent> children = new ArrayList<>();
    private boolean visible = true;

    public void add(UIComponent component) {
        children.add(component);
    }

    public void remove(UIComponent component) {
        children.remove(component);
    }

    @Override
    public void render() {
        if (visible) {
            System.out.println("Rendering panel:");
            for (UIComponent child : children) {
                child.render();
            }
        }
    }

    @Override
    public void setVisible(boolean visible) {
        this.visible = visible;
        // Propagate to children
        for (UIComponent child : children) {
            child.setVisible(visible);
        }
    }
}

// Usage
public class Main {
    public static void main(String[] args) {
        Panel loginPanel = new Panel();
        loginPanel.add(new TextBox("Username"));
        loginPanel.add(new TextBox("Password"));
        loginPanel.add(new Button("Login"));

        Panel mainPanel = new Panel();
        mainPanel.add(loginPanel);
        mainPanel.add(new Button("Forgot Password?"));

        // Render entire UI tree
        mainPanel.render();

        // Hide entire login panel
        loginPanel.setVisible(false);
    }
}
```

### When to Use

✅ **Use Composite when:**
- Need tree structures (file systems, UI components, org charts)
- Want to treat leaves and branches uniformly
- Operations apply recursively

❌ **Don't use when:**
- Flat structure (no hierarchy)
- Need type-specific operations
- Adds unnecessary complexity

---

## Bridge Pattern

**Gang of Four pattern**. Decouple abstraction from implementation so they can vary independently.

### Problem

Class hierarchy explosion when multiple dimensions vary:

```
Shape
├─ CircleRed
├─ CircleBlue
├─ SquareRed
├─ SquareBlue
└─ TriangleRed
   └─ TriangleBlue
   # N shapes × M colors = N×M classes!
```

### Solution

Separate abstraction and implementation hierarchies:

```
┌──────────────┐             ┌──────────────┐
│ Abstraction  │────────────►│Implementation│
│ (Shape)      │ has-a       │ (Color)      │
└──────────────┘             └──────────────┘
       △                            △
       │                            │
  ┌────┴────┐                 ┌─────┴─────┐
Circle   Square              Red       Blue
```

### Implementation

**Python Example:**

```python
from abc import ABC, abstractmethod

# Implementation interface
class DrawingAPI(ABC):
    @abstractmethod
    def draw_circle(self, x: float, y: float, radius: float) -> None:
        pass

    @abstractmethod
    def draw_rectangle(self, x: float, y: float, width: float, height: float) -> None:
        pass

# Concrete implementations
class VectorAPI(DrawingAPI):
    def draw_circle(self, x: float, y: float, radius: float) -> None:
        print(f"Vector: Drawing circle at ({x}, {y}) with radius {radius}")

    def draw_rectangle(self, x: float, y: float, width: float, height: float) -> None:
        print(f"Vector: Drawing rectangle at ({x}, {y}) with size {width}x{height}")

class RasterAPI(DrawingAPI):
    def draw_circle(self, x: float, y: float, radius: float) -> None:
        print(f"Raster: Drawing circle at ({x}, {y}) with radius {radius}")

    def draw_rectangle(self, x: float, y: float, width: float, height: float) -> None:
        print(f"Raster: Drawing rectangle at ({x}, {y}) with size {width}x{height}")

# Abstraction
class Shape(ABC):
    def __init__(self, api: DrawingAPI):
        self.api = api

    @abstractmethod
    def draw(self) -> None:
        pass

# Refined abstractions
class Circle(Shape):
    def __init__(self, x: float, y: float, radius: float, api: DrawingAPI):
        super().__init__(api)
        self.x = x
        self.y = y
        self.radius = radius

    def draw(self) -> None:
        self.api.draw_circle(self.x, self.y, self.radius)

class Rectangle(Shape):
    def __init__(self, x: float, y: float, width: float, height: float, api: DrawingAPI):
        super().__init__(api)
        self.x = x
        self.y = y
        self.width = width
        self.height = height

    def draw(self) -> None:
        self.api.draw_rectangle(self.x, self.y, self.width, self.height)

# Usage - mix and match
shapes = [
    Circle(10, 10, 5, VectorAPI()),
    Circle(20, 20, 10, RasterAPI()),
    Rectangle(0, 0, 100, 50, VectorAPI()),
    Rectangle(10, 10, 80, 40, RasterAPI()),
]

for shape in shapes:
    shape.draw()
```

### When to Use

✅ **Use Bridge when:**
- Want to avoid permanent binding between abstraction and implementation
- Both abstraction and implementation should be extensible
- Changes in implementation shouldn't affect clients

❌ **Don't use when:**
- Only one implementation
- Adds unnecessary complexity

---

## Flyweight Pattern

**Gang of Four pattern**. Use sharing to support large numbers of fine-grained objects efficiently.

### Problem

Too many similar objects consuming memory:

```python
# Every character is separate object - wasteful!
chars = [Character('A', font, size, color) for _ in range(1000000)]
```

### Solution

Share common state (intrinsic), store unique state (extrinsic) externally:

**Implementation not included due to length - Flyweight is advanced and rarely used.**

### When to Use

✅ **Use Flyweight when:**
- Application uses large number of objects
- Most object state can be made extrinsic
- Memory is critical concern

❌ **Don't use when:**
- Premature optimization
- Adds significant complexity
- Modern systems have plenty of memory

---

## Pattern Comparison

| Pattern | Purpose | Key Benefit |
|---------|---------|-------------|
| **Adapter** | Interface translation | Legacy integration |
| **Decorator** | Dynamic behavior | Flexible extension |
| **Facade** | Simplified interface | Ease of use |
| **Proxy** | Access control | Lazy loading, security |
| **Repository** | Data abstraction | Testability |
| **Composite** | Tree structures | Uniform treatment |
| **Bridge** | Separate dimensions | Extensibility |
| **Flyweight** | Memory optimization | Resource efficiency |

---

## Common Mistakes

### 1. Adapter vs Facade Confusion

**Adapter** - Changes interface of one class
**Facade** - Simplifies interface of multiple classes

### 2. Decorator God Object

❌ **Bad:** Decorator with too many responsibilities

### 3. Repository as DAO

**Repository** - Domain-centric, collection-like
**DAO** - Data-centric, CRUD operations

### 4. Premature Flyweight

❌ **Bad:** Using Flyweight before measuring memory usage

---

## References

1. Gang of Four - *Design Patterns* (1994)
2. Martin Fowler - *Patterns of Enterprise Application Architecture* (2002)
3. Eric Evans - *Domain-Driven Design* (2003)

---

**Last Updated:** 2025-10-20
**Version:** 1.0
