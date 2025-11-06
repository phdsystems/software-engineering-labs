# Groovy Project Setup Guide

**Purpose:** Standard Groovy project setup for implementing architecture patterns
**Language:** Groovy 4.x (JVM-based)
**Build Tool:** Gradle / Maven
**Framework:** Spring Boot 3.x with Groovy, Grails (optional)
**Related:** [Architecture Patterns Guide](../examples-overview.md) | [Examples Index](../examples-overview.md)

---

## TL;DR

**Complete Groovy project setup** with Gradle, Spring Boot 3.x, and dynamic features. **Quick start**: Install JDK 17+ + Groovy → Use Gradle → Add Spring Boot → Leverage closures and meta-programming. **Key features**: Dynamic typing, closures, operator overloading, AST transformations, powerful DSLs.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Why Groovy?](#why-groovy)
3. [Project Initialization](#project-initialization)
4. [Project Structure](#project-structure)
5. [Build Configuration](#build-configuration)
6. [Groovy-Specific Features](#groovy-specific-features)
7. [Spring Boot with Groovy](#spring-boot-with-groovy)
8. [Testing with Spock](#testing-with-spock)
9. [Grails Framework (Optional)](#grails-framework-optional)
10. [Best Practices](#best-practices)

---

## Prerequisites

### Required Software

```bash
# 1. JDK 17 or later
java -version

# 2. Groovy 4.x
groovy -version

# 3. Gradle
gradle -version
```

### Installation

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install openjdk-17-jdk

# Install SDKMAN! (package manager for Groovy)
curl -s https://get.sdkman.io | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"

# Install Groovy
sdk install groovy
sdk install gradle
```

**macOS:**
```bash
brew install openjdk@17 groovy gradle
```

**Windows:**
```powershell
choco install openjdk17 groovy gradle
```

---

## Why Groovy?

### Key Advantages

✅ **Dynamic Typing** - Optional type declarations, runtime flexibility
✅ **Closures** - First-class functions with powerful syntax
✅ **Operator Overloading** - Custom operators for DSLs
✅ **AST Transformations** - Compile-time code generation (@Immutable, @Canonical)
✅ **Native Collections** - Built-in list/map literals
✅ **String Interpolation** - GStrings with embedded expressions
✅ **Powerful DSLs** - Build readable domain-specific languages
✅ **100% Java Compatible** - Use all Java libraries
✅ **Less Boilerplate** - Optional semicolons, return, getters/setters

**Code Comparison:**

**Java:**
```java
public class User {
    private String name;
    private String email;

    public User(String name, String email) {
        this.name = name;
        this.email = email;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
```

**Groovy:**
```groovy
class User {
    String name
    String email
}
```

---

## Project Initialization

### Option 1: Spring Initializr with Groovy

**Web Interface:**
1. Visit https://start.spring.io/
2. Configure:
   - Project: Gradle - Groovy
   - Language: **Groovy**
   - Spring Boot: 3.2.x
   - Java: 17
   - Dependencies: Web, Data JPA, Validation
3. Generate and extract

**Command Line:**
```bash
curl https://start.spring.io/starter.zip \
  -d type=gradle-project \
  -d language=groovy \
  -d bootVersion=3.2.0 \
  -d baseDir=my-groovy-project \
  -d groupId=com.example \
  -d artifactId=my-groovy-project \
  -d name=MyGroovyProject \
  -d packageName=com.example.myproject \
  -d javaVersion=17 \
  -d dependencies=web,data-jpa,validation \
  -o my-groovy-project.zip

unzip my-groovy-project.zip
cd my-groovy-project
```

### Option 2: Manual Gradle Setup

```bash
mkdir my-groovy-project
cd my-groovy-project

gradle init \
  --type groovy-application \
  --dsl groovy \
  --test-framework spock \
  --package com.example.myproject \
  --project-name my-groovy-project
```

---

## Project Structure

```
my-groovy-project/
├── src/
│   ├── main/
│   │   ├── groovy/
│   │   │   └── com/example/myproject/
│   │   │       ├── Application.groovy          # Main entry point
│   │   │       ├── domain/                     # Domain layer
│   │   │       │   ├── model/                  # Entities
│   │   │       │   ├── repository/             # Repositories
│   │   │       │   └── service/                # Services
│   │   │       ├── application/                # Application layer
│   │   │       │   └── usecase/                # Use cases
│   │   │       ├── infrastructure/             # Infrastructure
│   │   │       │   ├── persistence/            # JPA
│   │   │       │   ├── web/                    # Controllers
│   │   │       │   └── config/                 # Configuration
│   │   │       └── shared/                     # Utilities
│   │   └── resources/
│   │       └── application.yml
│   └── test/
│       └── groovy/
│           └── com/example/myproject/
│               └── ApplicationSpec.groovy
├── build.gradle
└── settings.gradle
```

---

## Build Configuration

### build.gradle

```groovy
plugins {
    id 'groovy'
    id 'org.springframework.boot' version '3.2.0'
    id 'io.spring.dependency-management' version '1.1.4'
}

group = 'com.example'
version = '1.0.0-SNAPSHOT'
sourceCompatibility = '17'

repositories {
    mavenCentral()
}

dependencies {
    // Spring Boot
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-validation'

    // Groovy
    implementation 'org.apache.groovy:groovy-all:4.0.15'

    // Database
    runtimeOnly 'org.postgresql:postgresql'
    testRuntimeOnly 'com.h2database:h2'

    // Testing (Spock Framework)
    testImplementation 'org.spockframework:spock-core:2.4-M1-groovy-4.0'
    testImplementation 'org.spockframework:spock-spring:2.4-M1-groovy-4.0'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

---

## Groovy-Specific Features

### 1. Dynamic Typing & Optional Types

```groovy
// Dynamic typing (type inferred)
def name = "John"
def age = 30
def list = [1, 2, 3]

// Static typing (optional)
String explicitName = "Jane"
int explicitAge = 25

// Method with optional types
def greet(name) {
    "Hello, ${name}!"
}

String typedGreet(String name) {
    "Hello, ${name}!"
}
```

### 2. Closures

```groovy
// Simple closure
def greeting = { name ->
    "Hello, ${name}!"
}
println greeting("John")

// Closure with multiple parameters
def add = { a, b ->
    a + b
}
println add(5, 3)  // 8

// Closure in collections
def numbers = [1, 2, 3, 4, 5]
def doubled = numbers.collect { it * 2 }  // [2, 4, 6, 8, 10]
def evens = numbers.findAll { it % 2 == 0 }  // [2, 4]

// Closure with default parameter 'it'
def squares = numbers.collect { it ** 2 }  // [1, 4, 9, 16, 25]
```

### 3. GStrings (String Interpolation)

```groovy
def name = "John"
def age = 30

// String interpolation
def message = "Hello, ${name}! You are ${age} years old."
def simple = "Hello, $name!"

// Multi-line strings
def multiLine = """
    Name: ${name}
    Age: ${age}
"""

// Expression evaluation
def result = "1 + 1 = ${1 + 1}"  // "1 + 1 = 2"
```

### 4. Collection Literals

```groovy
// Lists
def list = [1, 2, 3, 4, 5]
def empty = []
def mixed = [1, "two", 3.0, new Date()]

// Maps
def person = [
    name: "John",
    age: 30,
    email: "john@example.com"
]
println person.name  // "John"
println person['email']  // "john@example.com"

// Ranges
def range = 1..10
def letters = 'a'..'z'
```

### 5. AST Transformations

```groovy
import groovy.transform.*

// @Immutable - Immutable class
@Immutable
class Point {
    int x
    int y
}

// @Canonical - equals(), hashCode(), toString()
@Canonical
class User {
    String name
    String email
}

// @Builder - Builder pattern
@Builder
class Order {
    String id
    String customerId
    BigDecimal amount
}

// Usage
def order = Order.builder()
    .id("ORD001")
    .customerId("CUST001")
    .amount(99.99)
    .build()

// @ToString, @EqualsAndHashCode
@ToString(includeNames = true)
@EqualsAndHashCode
class Product {
    String name
    BigDecimal price
}
```

### 6. Operator Overloading

```groovy
class Money {
    BigDecimal amount
    String currency

    Money plus(Money other) {
        assert this.currency == other.currency
        new Money(
            amount: this.amount + other.amount,
            currency: this.currency
        )
    }

    Money multiply(Number factor) {
        new Money(
            amount: this.amount * factor,
            currency: this.currency
        )
    }
}

// Usage
def money1 = new Money(amount: 100, currency: 'USD')
def money2 = new Money(amount: 50, currency: 'USD')

def total = money1 + money2  // Calls plus()
def doubled = money1 * 2     // Calls multiply()
```

---

## Spring Boot with Groovy

### Application Entry Point

```groovy
package com.example.myproject

import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication

@SpringBootApplication
class Application {
    static void main(String[] args) {
        SpringApplication.run(Application, args)
    }
}
```

### Entity

```groovy
package com.example.myproject.domain.model

import groovy.transform.EqualsAndHashCode
import groovy.transform.ToString
import jakarta.persistence.*

import java.time.LocalDateTime

@Entity
@Table(name = "users")
@ToString(includeNames = true)
@EqualsAndHashCode(includes = ['id'])
class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id

    @Column(nullable = false)
    String name

    @Column(nullable = false, unique = true)
    String email

    LocalDateTime createdAt = LocalDateTime.now()
}
```

### Repository

```groovy
package com.example.myproject.domain.repository

import com.example.myproject.domain.model.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface UserRepository extends JpaRepository<User, String> {
    User findByEmail(String email)
    boolean existsByEmail(String email)
}
```

### Service

```groovy
package com.example.myproject.domain.service

import com.example.myproject.domain.model.User
import com.example.myproject.domain.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class UserService {
    final UserRepository userRepository

    UserService(UserRepository userRepository) {
        this.userRepository = userRepository
    }

    @Transactional
    User createUser(String name, String email) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException(
                "User with email ${email} already exists"
            )
        }

        def user = new User(name: name, email: email)
        userRepository.save(user)
    }

    User findUserByEmail(String email) {
        userRepository.findByEmail(email)
    }

    List<User> findAllUsers() {
        userRepository.findAll()
    }
}
```

### REST Controller

```groovy
package com.example.myproject.infrastructure.web

import com.example.myproject.domain.service.UserService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/users")
class UserController {
    final UserService userService

    UserController(UserService userService) {
        this.userService = userService
    }

    @PostMapping
    ResponseEntity createUser(@RequestBody Map request) {
        def user = userService.createUser(
            request.name as String,
            request.email as String
        )

        ResponseEntity.status(HttpStatus.CREATED).body([
            id: user.id,
            name: user.name,
            email: user.email
        ])
    }

    @GetMapping
    ResponseEntity getUserByEmail(@RequestParam String email) {
        def user = userService.findUserByEmail(email)

        if (!user) {
            return ResponseEntity.notFound().build()
        }

        ResponseEntity.ok([
            id: user.id,
            name: user.name,
            email: user.email
        ])
    }

    @GetMapping("/all")
    ResponseEntity getAllUsers() {
        def users = userService.findAllUsers()

        def response = users.collect { user ->
            [
                id: user.id,
                name: user.name,
                email: user.email
            ]
        }

        ResponseEntity.ok(response)
    }
}
```

---

## Testing with Spock

### Spock Specification

```groovy
package com.example.myproject.domain.service

import com.example.myproject.domain.repository.UserRepository
import spock.lang.Specification

class UserServiceSpec extends Specification {
    UserRepository userRepository = Mock()
    UserService userService = new UserService(userRepository)

    def "should create user successfully"() {
        given: "a valid name and email"
        def name = "John Doe"
        def email = "john@example.com"

        and: "email doesn't exist"
        userRepository.existsByEmail(email) >> false
        userRepository.save(_ as com.example.myproject.domain.model.User) >> { args ->
            args[0]
        }

        when: "creating the user"
        def user = userService.createUser(name, email)

        then: "user is created successfully"
        user.name == name
        user.email == email

        and: "repository save was called"
        1 * userRepository.save(_ as com.example.myproject.domain.model.User)
    }

    def "should throw exception when email exists"() {
        given: "an existing email"
        def email = "existing@example.com"
        userRepository.existsByEmail(email) >> true

        when: "attempting to create user"
        userService.createUser("John", email)

        then: "exception is thrown"
        thrown(IllegalArgumentException)
    }

    def "should find user by email"() {
        given: "a user exists"
        def email = "john@example.com"
        def expectedUser = new com.example.myproject.domain.model.User(
            name: "John",
            email: email
        )
        userRepository.findByEmail(email) >> expectedUser

        when: "finding user by email"
        def user = userService.findUserByEmail(email)

        then: "user is found"
        user == expectedUser
    }
}
```

### Data-Driven Tests

```groovy
def "validate email format"() {
    expect: "email validation"
    isValidEmail(email) == valid

    where: "test data"
    email                  | valid
    "john@example.com"     | true
    "invalid-email"        | false
    "no-at-sign.com"       | false
    "user@domain"          | false
    "valid.email@test.com" | true
}

static boolean isValidEmail(String email) {
    email?.contains('@') && email?.contains('.')
}
```

---

## Grails Framework (Optional)

### What is Grails?

Grails is a full-stack web framework built on Groovy, Spring Boot, and Hibernate.

**Features:**
- Convention over configuration
- GORM (Grails Object Relational Mapping)
- Built-in scaffolding
- Powerful plugin system

### Quick Start

```bash
# Install Grails
sdk install grails

# Create application
grails create-app my-grails-app
cd my-grails-app

# Create domain class
grails create-domain-class com.example.User

# Generate controller and views
grails generate-all com.example.User

# Run application
grails run-app
```

### Grails Domain Class

```groovy
package com.example

import grails.gorm.annotation.Entity

@Entity
class User {
    String name
    String email
    Date dateCreated
    Date lastUpdated

    static constraints = {
        name blank: false
        email email: true, unique: true
    }

    static mapping = {
        table 'users'
    }
}
```

---

## Best Practices

### 1. Use AST Transformations

✅ **DO:**
```groovy
@Canonical
@ToString(includeNames = true)
class User {
    String name
    String email
}
```

❌ **DON'T:**
```groovy
class User {
    String name
    String email

    @Override
    String toString() { /* manual implementation */ }
    @Override
    boolean equals(Object obj) { /* manual implementation */ }
    // ...
}
```

### 2. Leverage Closures

✅ **DO:**
```groovy
users.findAll { it.age > 18 }
      .collect { it.name }
      .sort()
```

❌ **DON'T:**
```groovy
def result = []
for (user in users) {
    if (user.age > 18) {
        result.add(user.name)
    }
}
result.sort()
```

### 3. Use Safe Navigation

✅ **DO:**
```groovy
def length = user?.name?.length()
```

❌ **DON'T:**
```groovy
def length = null
if (user != null) {
    if (user.name != null) {
        length = user.name.length()
    }
}
```

### 4. Build DSLs

```groovy
class ConfigBuilder {
    Map config = [:]

    def database(Closure closure) {
        def db = [:]
        closure.delegate = db
        closure()
        config.database = db
    }

    def server(Closure closure) {
        def srv = [:]
        closure.delegate = srv
        closure()
        config.server = srv
    }
}

// DSL usage
def builder = new ConfigBuilder()
builder.with {
    database {
        url = "jdbc:postgresql://localhost:5432/mydb"
        username = "postgres"
        password = "secret"
    }

    server {
        port = 8080
        host = "localhost"
    }
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

# Run Groovy script
groovy MyScript.groovy

# Groovy console (interactive)
groovyConsole
```

---

## Next Steps

1. ✅ **Choose your architecture pattern** → [Architecture Patterns Guide](../examples-overview.md)
2. ✅ **Study Groovy examples** → [Groovy Examples](../examples-overview.md#-groovy-examples)
3. ✅ **Leverage Groovy's dynamic features** for DSLs and metaprogramming
4. ✅ **Use Spock for testing** - Most expressive testing framework

---

## Related Resources

- **Main Guide:** [Architecture Patterns Guide](../examples-overview.md)
- **Examples Index:** [All Examples](../examples-overview.md)
- **Java Examples:** [Java Setup](../java/project-setup.md)
- **Kotlin Examples:** [Kotlin Setup](../kotlin/project-setup.md)
- **Official Groovy Docs:** https://groovy-lang.org/documentation.html
- **Spock Framework:** https://spockframework.org/

---

*Last Updated: 2025-10-20*
