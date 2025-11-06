# Kotlin Project Setup Guide

**Purpose:** Standard Kotlin project setup for implementing architecture patterns
**Language:** Kotlin 1.9+ with JVM target
**Build Tool:** Gradle (Kotlin DSL) / Maven
**Framework:** Spring Boot 3.x with Kotlin
**Related:** [Architecture Patterns Guide](../examples-overview.md) | [Examples Index](../examples-overview.md)

---

## TL;DR

**Complete Kotlin project setup** with Gradle Kotlin DSL, Spring Boot 3.x, coroutines, and best practices. **Quick start**: Install JDK 17+ + Kotlin → Use Gradle Kotlin DSL → Add Spring Boot → Enable coroutines → Follow Kotlin conventions. **Key features**: Null safety, extension functions, coroutines for async, data classes, sealed classes.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Why Kotlin?](#why-kotlin)
3. [Project Initialization](#project-initialization)
4. [Project Structure](#project-structure)
5. [Build Configuration](#build-configuration)
6. [Kotlin-Specific Features](#kotlin-specific-features)
7. [Spring Boot with Kotlin](#spring-boot-with-kotlin)
8. [Testing with Kotlin](#testing-with-kotlin)
9. [Coroutines for Async](#coroutines-for-async)
10. [Best Practices](#best-practices)

---

## Prerequisites

### Required Software

```bash
# 1. JDK 17 or later
java -version
# openjdk version "17.0.x"

# 2. Kotlin compiler (optional, Gradle includes it)
kotlinc -version
# Kotlin version 1.9.x

# 3. Gradle with Kotlin DSL
gradle -version
# Gradle 8.x
```

### Installation

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install openjdk-17-jdk gradle

# Install Kotlin (optional)
curl -s https://get.sdkman.io | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"
sdk install kotlin
```

**macOS:**
```bash
brew install openjdk@17 gradle kotlin
```

**Windows:**
```powershell
choco install openjdk17 gradle kotlin
```

---

## Why Kotlin?

### Key Advantages Over Java

✅ **Null Safety** - Eliminates NullPointerExceptions at compile time
✅ **Concise Syntax** - 40% less boilerplate code
✅ **Extension Functions** - Add functions to existing classes
✅ **Coroutines** - Built-in async/await for non-blocking code
✅ **Data Classes** - Auto-generate equals(), hashCode(), toString()
✅ **Sealed Classes** - Restricted class hierarchies
✅ **Smart Casts** - Automatic type casting
✅ **100% Java Interop** - Use all Java libraries seamlessly

**Code Comparison:**

**Java:**
```java
public class User {
    private final String name;
    private final String email;

    public User(String name, String email) {
        this.name = name;
        this.email = email;
    }

    public String getName() { return name; }
    public String getEmail() { return email; }

    @Override
    public boolean equals(Object o) { /* ... */ }
    @Override
    public int hashCode() { /* ... */ }
    @Override
    public String toString() { /* ... */ }
}
```

**Kotlin:**
```kotlin
data class User(
    val name: String,
    val email: String
)
```

---

## Project Initialization

### Option 1: Spring Initializr with Kotlin

**Web Interface:**
1. Visit https://start.spring.io/
2. Configure:
   - Project: Gradle (Kotlin)
   - Language: **Kotlin**
   - Spring Boot: 3.2.x
   - Java: 17
   - Dependencies: Web, Data JPA, Validation
3. Generate and extract

**Command Line:**
```bash
curl https://start.spring.io/starter.zip \
  -d type=gradle-project-kotlin \
  -d language=kotlin \
  -d bootVersion=3.2.0 \
  -d baseDir=my-kotlin-project \
  -d groupId=com.example \
  -d artifactId=my-kotlin-project \
  -d name=MyKotlinProject \
  -d packageName=com.example.myproject \
  -d javaVersion=17 \
  -d dependencies=web,data-jpa,validation,kotlin-coroutines \
  -o my-kotlin-project.zip

unzip my-kotlin-project.zip
cd my-kotlin-project
```

### Option 2: Manual Setup with Gradle Kotlin DSL

```bash
mkdir my-kotlin-project
cd my-kotlin-project

gradle init \
  --type kotlin-application \
  --dsl kotlin \
  --test-framework junit-jupiter \
  --package com.example.myproject \
  --project-name my-kotlin-project
```

---

## Project Structure

```
my-kotlin-project/
├── src/
│   ├── main/
│   │   ├── kotlin/
│   │   │   └── com/example/myproject/
│   │   │       ├── Application.kt              # Main entry point
│   │   │       ├── domain/                     # Domain layer
│   │   │       │   ├── model/                  # Entities (data classes)
│   │   │       │   ├── repository/             # Repository interfaces
│   │   │       │   └── service/                # Domain services
│   │   │       ├── application/                # Application layer
│   │   │       │   ├── usecase/                # Use cases
│   │   │       │   └── dto/                    # DTOs (data classes)
│   │   │       ├── infrastructure/             # Infrastructure layer
│   │   │       │   ├── persistence/            # JPA repositories
│   │   │       │   ├── web/                    # REST controllers
│   │   │       │   └── config/                 # Configuration
│   │   │       └── shared/                     # Extensions, utils
│   │   └── resources/
│   │       └── application.yml
│   └── test/
│       └── kotlin/
│           └── com/example/myproject/
│               └── ApplicationTests.kt
├── build.gradle.kts                            # Gradle Kotlin DSL
├── settings.gradle.kts
└── gradle.properties
```

---

## Build Configuration

### build.gradle.kts (Gradle Kotlin DSL)

```kotlin
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    id("org.springframework.boot") version "3.2.0"
    id("io.spring.dependency-management") version "1.1.4"
    kotlin("jvm") version "1.9.20"
    kotlin("plugin.spring") version "1.9.20"
    kotlin("plugin.jpa") version "1.9.20"
}

group = "com.example"
version = "1.0.0-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.VERSION_17
}

repositories {
    mavenCentral()
}

dependencies {
    // Spring Boot Starters
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")

    // Kotlin
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8")

    // Kotlin Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-reactor:1.7.3")

    // Jackson Kotlin Module (JSON serialization)
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")

    // Database
    runtimeOnly("org.postgresql:postgresql")
    testRuntimeOnly("com.h2database:h2")

    // Testing
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testImplementation("io.mockk:mockk:1.13.8")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
}

tasks.withType<KotlinCompile> {
    kotlinOptions {
        freeCompilerArgs += "-Xjsr305=strict"
        jvmTarget = "17"
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}
```

### settings.gradle.kts

```kotlin
rootProject.name = "my-kotlin-project"
```

---

## Kotlin-Specific Features

### 1. Null Safety

```kotlin
// Non-nullable types (default)
val name: String = "John"
// name = null  // Compilation error!

// Nullable types (explicit)
val email: String? = null  // OK

// Safe call operator
val length = email?.length  // Returns null if email is null

// Elvis operator (default value)
val len = email?.length ?: 0  // Returns 0 if email is null

// Non-null assertion (use sparingly!)
val l = email!!.length  // Throws exception if email is null
```

### 2. Data Classes

```kotlin
data class User(
    val id: String,
    val name: String,
    val email: String,
    val age: Int = 0  // Default parameter
) {
    // Auto-generated: equals(), hashCode(), toString(), copy()
}

// Usage
val user = User(
    id = "1",
    name = "John",
    email = "john@example.com"
)

val updated = user.copy(email = "newemail@example.com")
```

### 3. Extension Functions

```kotlin
// Add function to existing String class
fun String.isValidEmail(): Boolean {
    return this.contains("@") && this.contains(".")
}

// Usage
val email = "john@example.com"
if (email.isValidEmail()) {
    println("Valid email")
}

// Extension on List
fun <T> List<T>.secondOrNull(): T? {
    return if (this.size >= 2) this[1] else null
}
```

### 4. Sealed Classes

```kotlin
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val message: String) : Result<Nothing>()
    object Loading : Result<Nothing>()
}

// Pattern matching (exhaustive when)
fun handleResult(result: Result<String>) = when (result) {
    is Result.Success -> println("Data: ${result.data}")
    is Result.Error -> println("Error: ${result.message}")
    Result.Loading -> println("Loading...")
}
```

### 5. Smart Casts

```kotlin
fun process(value: Any) {
    if (value is String) {
        // Automatically cast to String
        println(value.length)  // No need for explicit cast
    }
}
```

---

## Spring Boot with Kotlin

### Application Entry Point

```kotlin
package com.example.myproject

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class Application

fun main(args: Array<String>) {
    runApplication<Application>(*args)
}
```

### Entity with JPA

```kotlin
package com.example.myproject.domain.model

import jakarta.persistence.*
import java.time.LocalDateTime
import java.util.UUID

@Entity
@Table(name = "users")
data class User(
    @Id
    val id: String = UUID.randomUUID().toString(),

    @Column(nullable = false)
    val name: String,

    @Column(nullable = false, unique = true)
    val email: String,

    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    // JPA requires no-arg constructor
    constructor() : this(
        id = UUID.randomUUID().toString(),
        name = "",
        email = ""
    )
}
```

### Repository

```kotlin
package com.example.myproject.domain.repository

import com.example.myproject.domain.model.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface UserRepository : JpaRepository<User, String> {
    fun findByEmail(email: String): User?
    fun existsByEmail(email: String): Boolean
}
```

### Service

```kotlin
package com.example.myproject.domain.service

import com.example.myproject.domain.model.User
import com.example.myproject.domain.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class UserService(
    private val userRepository: UserRepository
) {
    @Transactional
    fun createUser(name: String, email: String): User {
        require(!userRepository.existsByEmail(email)) {
            "User with email $email already exists"
        }

        val user = User(
            name = name,
            email = email
        )

        return userRepository.save(user)
    }

    fun findUserByEmail(email: String): User? {
        return userRepository.findByEmail(email)
    }
}
```

### REST Controller

```kotlin
package com.example.myproject.infrastructure.web

import com.example.myproject.domain.service.UserService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/users")
class UserController(
    private val userService: UserService
) {
    @PostMapping
    fun createUser(@RequestBody request: CreateUserRequest): ResponseEntity<UserResponse> {
        val user = userService.createUser(request.name, request.email)

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(UserResponse(
                id = user.id,
                name = user.name,
                email = user.email
            ))
    }

    @GetMapping
    fun getUserByEmail(@RequestParam email: String): ResponseEntity<UserResponse> {
        val user = userService.findUserByEmail(email)
            ?: return ResponseEntity.notFound().build()

        return ResponseEntity.ok(UserResponse(
            id = user.id,
            name = user.name,
            email = user.email
        ))
    }
}

data class CreateUserRequest(
    val name: String,
    val email: String
)

data class UserResponse(
    val id: String,
    val name: String,
    val email: String
)
```

---

## Testing with Kotlin

### Unit Test with JUnit 5

```kotlin
package com.example.myproject.domain.service

import com.example.myproject.domain.repository.UserRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import kotlin.test.assertEquals
import kotlin.test.assertNotNull

class UserServiceTest {
    private val userRepository: UserRepository = mockk()
    private val userService = UserService(userRepository)

    @Test
    fun `should create user successfully`() {
        // Given
        val name = "John Doe"
        val email = "john@example.com"

        every { userRepository.existsByEmail(email) } returns false
        every { userRepository.save(any()) } answers { firstArg() }

        // When
        val user = userService.createUser(name, email)

        // Then
        assertNotNull(user)
        assertEquals(name, user.name)
        assertEquals(email, user.email)
        verify { userRepository.save(any()) }
    }

    @Test
    fun `should throw exception when email exists`() {
        // Given
        val email = "existing@example.com"
        every { userRepository.existsByEmail(email) } returns true

        // When & Then
        assertThrows<IllegalArgumentException> {
            userService.createUser("John", email)
        }
    }
}
```

### Integration Test

```kotlin
package com.example.myproject.infrastructure.web

import com.example.myproject.domain.model.User
import com.example.myproject.domain.repository.UserRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.get

@SpringBootTest
@AutoConfigureMockMvc
class UserControllerIntegrationTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var userRepository: UserRepository

    @BeforeEach
    fun setUp() {
        userRepository.deleteAll()
    }

    @Test
    fun `should create user successfully`() {
        mockMvc.post("/api/users") {
            contentType = MediaType.APPLICATION_JSON
            content = """
                {
                    "name": "John Doe",
                    "email": "john@example.com"
                }
            """.trimIndent()
        }.andExpect {
            status { isCreated() }
            jsonPath("$.name") { value("John Doe") }
            jsonPath("$.email") { value("john@example.com") }
        }
    }
}
```

---

## Coroutines for Async

### Suspend Functions

```kotlin
package com.example.myproject.application.usecase

import kotlinx.coroutines.delay
import org.springframework.stereotype.Component

@Component
class AsyncUserUseCase {

    suspend fun fetchUserData(userId: String): UserData {
        // Simulate async operation
        delay(1000)
        return UserData(userId, "John Doe")
    }

    suspend fun processMultipleUsers(userIds: List<String>): List<UserData> {
        return kotlinx.coroutines.coroutineScope {
            userIds.map { userId ->
                kotlinx.coroutines.async {
                    fetchUserData(userId)
                }
            }.map { it.await() }
        }
    }
}

data class UserData(val id: String, val name: String)
```

### Coroutine Controller

```kotlin
@RestController
@RequestMapping("/api/async")
class AsyncController(
    private val asyncUserUseCase: AsyncUserUseCase
) {
    @GetMapping("/users/{userId}")
    suspend fun getUser(@PathVariable userId: String): UserData {
        return asyncUserUseCase.fetchUserData(userId)
    }

    @GetMapping("/users")
    suspend fun getMultipleUsers(@RequestParam ids: List<String>): List<UserData> {
        return asyncUserUseCase.processMultipleUsers(ids)
    }
}
```

---

## Best Practices

### 1. Use Data Classes for DTOs

✅ **DO:**
```kotlin
data class CreateOrderRequest(
    val customerId: String,
    val items: List<OrderItem>,
    val totalAmount: BigDecimal
)
```

❌ **DON'T:**
```kotlin
class CreateOrderRequest {
    var customerId: String? = null
    var items: List<OrderItem>? = null
    // ...
}
```

### 2. Prefer Val Over Var

✅ **DO:**
```kotlin
val immutableList = listOf(1, 2, 3)
val user = User("John", "john@example.com")
```

❌ **DON'T:**
```kotlin
var mutableList = mutableListOf(1, 2, 3)
var user = User("John", "john@example.com")
user = User("Jane", "jane@example.com")  // Reassignment
```

### 3. Use Named Arguments

✅ **DO:**
```kotlin
createUser(
    name = "John",
    email = "john@example.com",
    age = 30
)
```

❌ **DON'T:**
```kotlin
createUser("John", "john@example.com", 30)
```

### 4. Use Extension Functions

✅ **DO:**
```kotlin
fun String.toSlug(): String {
    return this.lowercase()
        .replace(Regex("\\s+"), "-")
        .replace(Regex("[^a-z0-9-]"), "")
}

val slug = "My Blog Post".toSlug()
```

### 5. Use Scope Functions

```kotlin
// let - null safety
val email: String? = getEmail()
email?.let { sendEmail(it) }

// apply - configure objects
val user = User().apply {
    name = "John"
    email = "john@example.com"
}

// also - side effects
val result = calculateSomething()
    .also { logger.info("Result: $it") }

// run - execute block
val result = run {
    val a = fetchA()
    val b = fetchB()
    a + b
}
```

---

## Quick Start Commands

```bash
# Run application
./gradlew bootRun

# Run tests
./gradlew test

# Build JAR
./gradlew build

# Check Kotlin code style
./gradlew ktlintCheck

# Format Kotlin code
./gradlew ktlintFormat
```

---

## Next Steps

1. ✅ **Choose your architecture pattern** → [Architecture Patterns Guide](../examples-overview.md)
2. ✅ **Study Kotlin examples** → [Kotlin Examples](../examples-overview.md#-kotlin-examples)
3. ✅ **Implement your project** using Kotlin's features
4. ✅ **Follow Kotlin conventions** from this guide

---

## Related Resources

- **Main Guide:** [Architecture Patterns Guide](../examples-overview.md)
- **Examples Index:** [All Examples](../examples-overview.md)
- **Java Examples:** [Java Setup](../java/project-setup.md)
- **Official Kotlin Docs:** https://kotlinlang.org/docs/home.html

---

*Last Updated: 2025-10-20*
