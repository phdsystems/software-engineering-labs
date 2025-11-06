# Java Project Setup Guide

**Purpose:** Standard Java project setup for implementing architecture patterns
**Language:** Java 17+ (LTS)
**Build Tool:** Maven / Gradle
**Framework:** Spring Boot 3.x
**Related:** [Architecture Patterns Guide](../examples-overview.md) | [Examples Index](../examples-overview.md)

---

## TL;DR

**Complete Java project setup** with Maven/Gradle, Spring Boot 3.x, testing framework, and best practices. **Quick start**: Install JDK 17+ → Choose Maven/Gradle → Generate Spring Boot project → Add dependencies → Follow conventions. **Key tools**: Maven for dependency management, JUnit 5 for testing, Spring Boot for framework, Docker for containerization.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Initialization](#project-initialization)
3. [Project Structure](#project-structure)
4. [Build Tool Configuration](#build-tool-configuration)
5. [Dependencies](#dependencies)
6. [Application Configuration](#application-configuration)
7. [Testing Setup](#testing-setup)
8. [Code Quality Tools](#code-quality-tools)
9. [Docker Setup](#docker-setup)
10. [CI/CD Integration](#cicd-integration)
11. [Best Practices](#best-practices)

---

## Prerequisites

### Required Software

```bash
# 1. Java Development Kit (JDK) 17 or later
# Check version
java -version
# Should show: openjdk version "17.0.x" or higher

# 2. Maven (if using Maven)
mvn -version
# Should show: Apache Maven 3.8.x or higher

# 3. Gradle (if using Gradle)
gradle -version
# Should show: Gradle 8.x or higher

# 4. IDE (recommended)
# - IntelliJ IDEA (Community or Ultimate)
# - Eclipse
# - VS Code with Java extensions
```

### Installation

**Ubuntu/Debian:**
```bash
# Install OpenJDK 17
sudo apt update
sudo apt install openjdk-17-jdk maven

# Verify installation
java -version
mvn -version
```

**macOS:**
```bash
# Using Homebrew
brew install openjdk@17 maven

# Set JAVA_HOME
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
source ~/.zshrc
```

**Windows:**
```powershell
# Using Chocolatey
choco install openjdk17 maven

# Or download from:
# - OpenJDK: https://adoptium.net/
# - Maven: https://maven.apache.org/download.cgi
```

---

## Project Initialization

### Option 1: Spring Initializr (Recommended)

**Web Interface:**
1. Visit https://start.spring.io/
2. Configure:
   - Project: Maven or Gradle
   - Language: Java
   - Spring Boot: 3.2.x (latest stable)
   - Java: 17
   - Packaging: Jar
   - Dependencies: Web, Data JPA, Validation, etc.
3. Click "Generate" and extract ZIP

**Command Line:**
```bash
curl https://start.spring.io/starter.zip \
  -d type=maven-project \
  -d language=java \
  -d bootVersion=3.2.0 \
  -d baseDir=my-project \
  -d groupId=com.example \
  -d artifactId=my-project \
  -d name=MyProject \
  -d packageName=com.example.myproject \
  -d packaging=jar \
  -d javaVersion=17 \
  -d dependencies=web,data-jpa,validation,actuator,lombok \
  -o my-project.zip

unzip my-project.zip
cd my-project
```

### Option 2: Manual Setup

```bash
# Create directory structure
mkdir -p my-project/src/{main,test}/java/com/example/myproject
mkdir -p my-project/src/{main,test}/resources
cd my-project

# Create pom.xml (see Build Tool Configuration section)
```

---

## Project Structure

### Standard Maven/Gradle Structure

```
my-project/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/example/myproject/
│   │   │       ├── Application.java           # Main entry point
│   │   │       ├── domain/                    # Domain layer
│   │   │       │   ├── model/                 # Entities, value objects
│   │   │       │   ├── repository/            # Repository interfaces
│   │   │       │   └── service/               # Domain services
│   │   │       ├── application/               # Application layer
│   │   │       │   ├── usecase/               # Use cases
│   │   │       │   ├── dto/                   # DTOs
│   │   │       │   └── mapper/                # Mappers
│   │   │       ├── infrastructure/            # Infrastructure layer
│   │   │       │   ├── persistence/           # JPA repositories
│   │   │       │   ├── web/                   # REST controllers
│   │   │       │   ├── messaging/             # Kafka, RabbitMQ
│   │   │       │   └── config/                # Configuration
│   │   │       └── shared/                    # Shared utilities
│   │   └── resources/
│   │       ├── application.yml                # Main config
│   │       ├── application-dev.yml            # Dev profile
│   │       ├── application-prod.yml           # Prod profile
│   │       ├── db/migration/                  # Flyway/Liquibase
│   │       └── static/                        # Static assets
│   └── test/
│       ├── java/
│       │   └── com/example/myproject/
│       │       ├── domain/                    # Unit tests
│       │       ├── application/               # Use case tests
│       │       ├── infrastructure/            # Integration tests
│       │       └── ApplicationTests.java      # Context load test
│       └── resources/
│           └── application-test.yml           # Test config
├── pom.xml                                    # Maven (or build.gradle)
├── .gitignore
├── README.md
└── Dockerfile
```

---

## Build Tool Configuration

### Maven (pom.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>

    <groupId>com.example</groupId>
    <artifactId>my-project</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <name>My Project</name>
    <description>Description of my project</description>

    <properties>
        <java.version>17</java.version>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <!-- Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- Database -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>test</scope>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Testing -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

### Gradle (build.gradle)

```gradle
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.2.0'
    id 'io.spring.dependency-management' version '1.1.4'
}

group = 'com.example'
version = '1.0.0-SNAPSHOT'
sourceCompatibility = '17'

configurations {
    compileOnly {
        extendsFrom annotationProcessor
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // Spring Boot Starters
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-validation'

    // Database
    runtimeOnly 'org.postgresql:postgresql'
    testRuntimeOnly 'com.h2database:h2'

    // Lombok
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'

    // Testing
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

---

## Dependencies

### Essential Dependencies

**Spring Boot Starters:**
```xml
<!-- Web applications -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<!-- Database access -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>

<!-- Validation -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>

<!-- Monitoring -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

**Database Drivers:**
```xml
<!-- PostgreSQL -->
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>

<!-- MySQL -->
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <scope>runtime</scope>
</dependency>

<!-- H2 (for testing) -->
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>test</scope>
</dependency>
```

**Utilities:**
```xml
<!-- Lombok (reduces boilerplate) -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>

<!-- MapStruct (object mapping) -->
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId>
    <version>1.5.5.Final</version>
</dependency>
```

### Architecture-Specific Dependencies

**For Microservices:**
```xml
<!-- Service discovery -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>

<!-- API Gateway -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-gateway</artifactId>
</dependency>

<!-- Circuit breaker -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-circuitbreaker-resilience4j</artifactId>
</dependency>
```

**For Event-Driven:**
```xml
<!-- Kafka -->
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
</dependency>
```

**For CQRS/Event Sourcing:**
```xml
<!-- Axon Framework -->
<dependency>
    <groupId>org.axonframework</groupId>
    <artifactId>axon-spring-boot-starter</artifactId>
    <version>4.9.0</version>
</dependency>
```

---

## Application Configuration

### application.yml

```yaml
spring:
  application:
    name: my-project

  # Database configuration
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: ${DB_USERNAME:postgres}
    password: ${DB_PASSWORD:postgres}
    driver-class-name: org.postgresql.Driver

  # JPA configuration
  jpa:
    hibernate:
      ddl-auto: validate  # Use Flyway/Liquibase for migrations
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true

  # Flyway migration
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true

# Server configuration
server:
  port: 8080
  servlet:
    context-path: /api

# Logging
logging:
  level:
    root: INFO
    com.example.myproject: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"

# Actuator endpoints
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: when-authorized
```

### Profile-Specific Configuration

**application-dev.yml:**
```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true

logging:
  level:
    com.example.myproject: DEBUG
```

**application-prod.yml:**
```yaml
spring:
  datasource:
    url: ${DATABASE_URL}
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5

logging:
  level:
    root: WARN
    com.example.myproject: INFO
```

---

## Testing Setup

### JUnit 5 Configuration

**Unit Test Example:**
```java
package com.example.myproject.domain.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

@DisplayName("User Service Tests")
class UserServiceTest {

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService();
    }

    @Test
    @DisplayName("Should create user successfully")
    void shouldCreateUser() {
        // Given
        String username = "john.doe";

        // When
        User user = userService.createUser(username);

        // Then
        assertNotNull(user);
        assertEquals(username, user.getUsername());
    }
}
```

**Integration Test Example:**
```java
package com.example.myproject.infrastructure.web;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class UserControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldReturnUserList() throws Exception {
        mockMvc.perform(get("/api/users"))
            .andExpect(status().isOk())
            .andExpect(content().contentType("application/json"));
    }
}
```

### Test Dependencies

```xml
<dependencies>
    <!-- JUnit 5 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>

    <!-- Mockito -->
    <dependency>
        <groupId>org.mockito</groupId>
        <artifactId>mockito-core</artifactId>
        <scope>test</scope>
    </dependency>

    <!-- AssertJ (fluent assertions) -->
    <dependency>
        <groupId>org.assertj</groupId>
        <artifactId>assertj-core</artifactId>
        <scope>test</scope>
    </dependency>

    <!-- Testcontainers (for integration tests) -->
    <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>postgresql</artifactId>
        <version>1.19.3</version>
        <scope>test</scope>
    </dependency>
</dependencies>
```

---

## Code Quality Tools

### Checkstyle

**checkstyle.xml:**
```xml
<?xml version="1.0"?>
<!DOCTYPE module PUBLIC
    "-//Checkstyle//DTD Checkstyle Configuration 1.3//EN"
    "https://checkstyle.org/dtds/configuration_1_3.dtd">

<module name="Checker">
    <module name="TreeWalker">
        <module name="LineLength">
            <property name="max" value="120"/>
        </module>
        <module name="Indentation">
            <property name="basicOffset" value="4"/>
        </module>
    </module>
</module>
```

**Maven Plugin:**
```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-checkstyle-plugin</artifactId>
    <version>3.3.1</version>
    <configuration>
        <configLocation>checkstyle.xml</configLocation>
    </configuration>
</plugin>
```

### SpotBugs

```xml
<plugin>
    <groupId>com.github.spotbugs</groupId>
    <artifactId>spotbugs-maven-plugin</artifactId>
    <version>4.8.2.0</version>
</plugin>
```

### JaCoCo (Code Coverage)

```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.11</version>
    <executions>
        <execution>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

---

## Docker Setup

### Dockerfile

```dockerfile
# Build stage
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Download dependencies
RUN ./mvnw dependency:go-offline

# Copy source code
COPY src src

# Build application
RUN ./mvnw package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=dev
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/mydb
      - SPRING_DATASOURCE_USERNAME=postgres
      - SPRING_DATASOURCE_PASSWORD=postgres
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=mydb
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

---

## CI/CD Integration

### GitHub Actions

**.github/workflows/ci.yml:**
```yaml
name: Java CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up JDK 17
      uses: actions/setup-java@v3
      with:
        java-version: '17'
        distribution: 'temurin'
        cache: maven

    - name: Build with Maven
      run: mvn clean verify

    - name: Run tests
      run: mvn test

    - name: Generate coverage report
      run: mvn jacoco:report

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
```

---

## Best Practices

### 1. Dependency Management

✅ **DO:**
- Use Spring Boot BOM for version management
- Keep dependencies up to date
- Use `dependencyManagement` section
- Declare only direct dependencies

❌ **DON'T:**
- Mix dependency versions
- Include unnecessary dependencies
- Duplicate transitive dependencies

### 2. Package Structure

✅ **DO:**
- Package by feature/domain (not by layer)
- Use meaningful package names
- Keep related classes together

**Good:**
```
com.example.myproject.user/
  ├── User.java
  ├── UserRepository.java
  ├── UserService.java
  └── UserController.java
```

**Bad:**
```
com.example.myproject.controller/
com.example.myproject.service/
com.example.myproject.repository/
com.example.myproject.model/
```

### 3. Configuration

✅ **DO:**
- Use profiles (dev, prod, test)
- Externalize configuration
- Use environment variables for secrets
- Document all properties

❌ **DON'T:**
- Hardcode values
- Commit secrets to version control
- Use different property keys across profiles

### 4. Testing

✅ **DO:**
- Write unit tests for business logic
- Write integration tests for APIs
- Use Testcontainers for database tests
- Aim for 80%+ coverage

❌ **DON'T:**
- Skip tests
- Test implementation details
- Use real databases in unit tests

### 5. Error Handling

✅ **DO:**
- Use `@ControllerAdvice` for global exception handling
- Create custom exception classes
- Return meaningful error messages
- Log exceptions with context

---

## Quick Start Commands

```bash
# Create project
curl https://start.spring.io/starter.zip -d dependencies=web,data-jpa,validation -o project.zip
unzip project.zip
cd project

# Run application
./mvnw spring-boot:run

# Run tests
./mvnw test

# Package application
./mvnw clean package

# Run with Docker
docker-compose up --build

# Check code quality
./mvnw checkstyle:check
./mvnw spotbugs:check

# Generate coverage report
./mvnw jacoco:report
```

---

## Next Steps

1. ✅ **Choose your architecture pattern** → [Architecture Patterns Guide](../examples-overview.md)
2. ✅ **Study examples** → [Java Examples](../examples-overview.md#-java-examples)
3. ✅ **Implement your project** using the chosen pattern
4. ✅ **Follow best practices** from this guide

---

## Related Resources

- **Main Guide:** [Architecture Patterns Guide](../examples-overview.md)
- **Examples Index:** [All Examples](../examples-overview.md)
- **Java Examples:**
  - [Microservices](microservices-example.md)
  - [Clean Architecture](clean-architecture-example.md)
  - [CQRS](cqrs-example.md)
  - [Event Sourcing](event-sourcing-example.md)
  - [Event-Driven](event-driven-example.md)
  - [Serverless](serverless-example.md)

---

*Last Updated: 2025-10-20*
