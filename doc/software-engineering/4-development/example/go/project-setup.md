# Go Project Setup Guide

**Purpose:** Standard Go project setup for implementing architecture patterns
**Language:** Go 1.21+
**Build Tool:** Go modules (go mod)
**Framework:** Gin / Echo / Chi / Standard library
**Related:** [Architecture Patterns Guide](../examples-overview.md) | [Examples Index](../examples-overview.md)

---

## TL;DR

**Complete Go project setup** with modern tooling, web frameworks, and best practices. **Quick start**: Install Go 1.21+ → Use go mod → Add Gin or Echo → Follow project layout → Use interfaces for dependencies. **Key features**: Fast compilation, static typing, built-in concurrency (goroutines), simple deployment (single binary), excellent standard library, garbage collection.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Why Go?](#why-go)
3. [Project Initialization](#project-initialization)
4. [Project Structure](#project-structure)
5. [Dependency Management](#dependency-management)
6. [Go-Specific Features](#go-specific-features)
7. [Web Framework Examples](#web-framework-examples)
8. [Testing with Go](#testing-with-go)
9. [Concurrency Patterns](#concurrency-patterns)
10. [Best Practices](#best-practices)

---

## Prerequisites

### Required Software

```bash
# Go 1.21 or later
go version
# go version go1.21.x linux/amd64
```

### Installation

**Ubuntu/Debian:**
```bash
# Download and install Go
wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH=$PATH:/usr/local/go/bin
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin

# Verify installation
go version
```

**macOS:**
```bash
brew install go

# Or download from https://go.dev/dl/
```

**Windows:**
```powershell
# Using Chocolatey
choco install golang

# Or download installer from https://go.dev/dl/
```

---

## Why Go?

### Key Advantages

✅ **Fast Compilation** - Compiles to native code in seconds
✅ **Static Typing** - Type safety with type inference
✅ **Built-in Concurrency** - Goroutines and channels for concurrent programming
✅ **Single Binary** - No runtime dependencies, easy deployment
✅ **Excellent Standard Library** - HTTP, JSON, testing built-in
✅ **Simple Language** - Few keywords, easy to learn
✅ **Garbage Collection** - Automatic memory management
✅ **Cross-Compilation** - Build for any OS/architecture
✅ **Strong Tooling** - Built-in formatter, linter, test runner

**Code Example:**

**Go:**
```go
package main

import (
    "fmt"
    "net/http"
)

type User struct {
    ID    string `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

func main() {
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello, World!")
    })

    http.ListenAndServe(":8080", nil)
}
```

**Built and deployed as single binary:**
```bash
go build -o myapp
./myapp  # Runs immediately, no dependencies!
```

---

## Project Initialization

### Option 1: Standard Project with Go Modules

```bash
# Create project directory
mkdir my-go-project
cd my-go-project

# Initialize Go module
go mod init github.com/username/my-go-project

# Create main.go
cat > main.go << 'EOF'
package main

import "fmt"

func main() {
    fmt.Println("Hello, Go!")
}
EOF

# Run the project
go run main.go
```

### Option 2: Web API with Gin Framework

```bash
mkdir my-gin-api
cd my-gin-api

# Initialize module
go mod init github.com/username/my-gin-api

# Install Gin
go get -u github.com/gin-gonic/gin

# Create main.go
cat > main.go << 'EOF'
package main

import "github.com/gin-gonic/gin"

func main() {
    r := gin.Default()
    r.GET("/", func(c *gin.Context) {
        c.JSON(200, gin.H{
            "message": "Hello, Gin!",
        })
    })
    r.Run(":8080")
}
EOF

# Run
go run main.go
```

### Option 3: Web API with Echo Framework

```bash
mkdir my-echo-api
cd my-echo-api

go mod init github.com/username/my-echo-api
go get -u github.com/labstack/echo/v4

# Create main.go with Echo
```

---

## Project Structure

### Standard Go Project Layout

```
my-go-project/
├── cmd/
│   └── api/
│       └── main.go                     # Application entry point
├── internal/                           # Private application code
│   ├── domain/                         # Domain layer (business logic)
│   │   ├── user/
│   │   │   ├── user.go                 # Domain entity
│   │   │   ├── repository.go           # Repository interface
│   │   │   └── service.go              # Domain service
│   │   └── order/
│   │       ├── order.go
│   │       └── repository.go
│   ├── application/                    # Application layer
│   │   └── usecase/
│   │       ├── create_user.go          # Use case
│   │       └── get_user.go
│   ├── infrastructure/                 # Infrastructure layer
│   │   ├── persistence/
│   │   │   ├── postgres/
│   │   │   │   └── user_repository.go  # Postgres implementation
│   │   │   └── memory/
│   │   │       └── user_repository.go  # In-memory implementation
│   │   ├── http/
│   │   │   ├── handler/
│   │   │   │   └── user_handler.go     # HTTP handlers
│   │   │   ├── middleware/
│   │   │   │   └── auth.go
│   │   │   └── router.go               # Route definitions
│   │   └── config/
│   │       └── config.go               # Configuration
│   └── shared/                         # Shared utilities
│       ├── errors/
│       │   └── errors.go
│       └── logger/
│           └── logger.go
├── pkg/                                # Public libraries (can be imported)
│   └── utils/
│       └── validator.go
├── test/
│   ├── integration/
│   └── e2e/
├── scripts/
│   └── migrate.sh
├── docs/
├── go.mod                              # Module definition
├── go.sum                              # Dependency checksums
├── Makefile
├── Dockerfile
└── README.md
```

---

## Dependency Management

### go.mod File

```go
module github.com/username/my-go-project

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/lib/pq v1.10.9
    github.com/stretchr/testify v1.8.4
)

require (
    // Indirect dependencies (auto-managed)
    github.com/bytedance/sonic v1.9.1 // indirect
    github.com/gin-contrib/sse v0.1.0 // indirect
    // ...
)
```

### Common Commands

```bash
# Add dependency
go get github.com/gin-gonic/gin

# Add specific version
go get github.com/gin-gonic/gin@v1.9.1

# Update dependencies
go get -u ./...

# Tidy modules (remove unused, add missing)
go mod tidy

# Download dependencies
go mod download

# Verify dependencies
go mod verify

# View dependency graph
go mod graph
```

---

## Go-Specific Features

### 1. Interfaces (Implicit Implementation)

```go
package domain

// Repository interface
type UserRepository interface {
    Save(user *User) error
    FindByID(id string) (*User, error)
    FindByEmail(email string) (*User, error)
}

// Implementation (no "implements" keyword needed!)
type PostgresUserRepository struct {
    db *sql.DB
}

// Implements UserRepository interface automatically
func (r *PostgresUserRepository) Save(user *User) error {
    // Implementation
    return nil
}

func (r *PostgresUserRepository) FindByID(id string) (*User, error) {
    // Implementation
    return nil, nil
}

func (r *PostgresUserRepository) FindByEmail(email string) (*User, error) {
    // Implementation
    return nil, nil
}
```

### 2. Structs and Methods

```go
package domain

import "time"

// User domain entity
type User struct {
    ID        string    `json:"id"`
    Name      string    `json:"name"`
    Email     string    `json:"email"`
    CreatedAt time.Time `json:"created_at"`
}

// Constructor function (idiomatic Go)
func NewUser(name, email string) *User {
    return &User{
        ID:        generateID(),
        Name:      name,
        Email:     email,
        CreatedAt: time.Now(),
    }
}

// Method with value receiver (read-only)
func (u User) IsValid() bool {
    return u.Name != "" && u.Email != ""
}

// Method with pointer receiver (can modify)
func (u *User) UpdateEmail(newEmail string) {
    u.Email = newEmail
}
```

### 3. Error Handling

```go
package application

import (
    "errors"
    "fmt"
)

var (
    ErrUserNotFound      = errors.New("user not found")
    ErrUserAlreadyExists = errors.New("user already exists")
)

func (s *UserService) CreateUser(name, email string) (*domain.User, error) {
    // Check if user exists
    existing, err := s.repo.FindByEmail(email)
    if err != nil {
        return nil, fmt.Errorf("checking user existence: %w", err)
    }
    if existing != nil {
        return nil, ErrUserAlreadyExists
    }

    // Create user
    user := domain.NewUser(name, email)
    if err := s.repo.Save(user); err != nil {
        return nil, fmt.Errorf("saving user: %w", err)
    }

    return user, nil
}

// Usage
user, err := service.CreateUser("John", "john@example.com")
if err != nil {
    if errors.Is(err, ErrUserAlreadyExists) {
        // Handle duplicate user
    }
    return err
}
```

### 4. Goroutines and Channels

```go
package main

import (
    "fmt"
    "time"
)

// Goroutine example
func processUser(userID string, results chan<- string) {
    time.Sleep(100 * time.Millisecond)
    results <- fmt.Sprintf("Processed user %s", userID)
}

func main() {
    userIDs := []string{"1", "2", "3", "4", "5"}
    results := make(chan string, len(userIDs))

    // Launch goroutines (concurrent execution)
    for _, id := range userIDs {
        go processUser(id, results)
    }

    // Collect results
    for range userIDs {
        result := <-results
        fmt.Println(result)
    }

    close(results)
}
```

### 5. Context for Cancellation

```go
package infrastructure

import (
    "context"
    "database/sql"
    "time"
)

func (r *PostgresUserRepository) FindByID(ctx context.Context, id string) (*User, error) {
    // Create timeout context
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()

    query := "SELECT id, name, email FROM users WHERE id = $1"
    var user User

    // QueryRowContext respects context cancellation
    err := r.db.QueryRowContext(ctx, query, id).Scan(&user.ID, &user.Name, &user.Email)
    if err != nil {
        return nil, err
    }

    return &user, nil
}
```

---

## Web Framework Examples

### Gin Framework

```go
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

type CreateUserRequest struct {
    Name  string `json:"name" binding:"required"`
    Email string `json:"email" binding:"required,email"`
}

type UserResponse struct {
    ID    string `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

func main() {
    r := gin.Default()

    // Middleware
    r.Use(gin.Logger())
    r.Use(gin.Recovery())

    // Routes
    api := r.Group("/api")
    {
        users := api.Group("/users")
        {
            users.POST("", createUser)
            users.GET("/:id", getUser)
            users.GET("", listUsers)
        }
    }

    r.Run(":8080")
}

func createUser(c *gin.Context) {
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Business logic here
    user := UserResponse{
        ID:    "123",
        Name:  req.Name,
        Email: req.Email,
    }

    c.JSON(http.StatusCreated, user)
}

func getUser(c *gin.Context) {
    id := c.Param("id")
    // Fetch user by ID
    c.JSON(http.StatusOK, gin.H{"id": id})
}

func listUsers(c *gin.Context) {
    // List users
    c.JSON(http.StatusOK, []UserResponse{})
}
```

### Standard Library (net/http)

```go
package main

import (
    "encoding/json"
    "net/http"
)

type UserHandler struct {
    service *UserService
}

func (h *UserHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    switch r.Method {
    case http.MethodGet:
        h.getUser(w, r)
    case http.MethodPost:
        h.createUser(w, r)
    default:
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
    }
}

func (h *UserHandler) createUser(w http.ResponseWriter, r *http.Request) {
    var req CreateUserRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    user, err := h.service.CreateUser(req.Name, req.Email)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(user)
}

func main() {
    handler := &UserHandler{service: NewUserService()}
    http.Handle("/api/users", handler)
    http.ListenAndServe(":8080", nil)
}
```

---

## Testing with Go

### Unit Test

```go
package domain_test

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/username/myproject/internal/domain"
)

func TestNewUser(t *testing.T) {
    // Arrange
    name := "John Doe"
    email := "john@example.com"

    // Act
    user := domain.NewUser(name, email)

    // Assert
    assert.NotNil(t, user)
    assert.NotEmpty(t, user.ID)
    assert.Equal(t, name, user.Name)
    assert.Equal(t, email, user.Email)
    assert.False(t, user.CreatedAt.IsZero())
}

func TestUser_IsValid(t *testing.T) {
    tests := []struct {
        name     string
        user     domain.User
        expected bool
    }{
        {
            name:     "valid user",
            user:     domain.User{Name: "John", Email: "john@example.com"},
            expected: true,
        },
        {
            name:     "missing name",
            user:     domain.User{Name: "", Email: "john@example.com"},
            expected: false,
        },
        {
            name:     "missing email",
            user:     domain.User{Name: "John", Email: ""},
            expected: false,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := tt.user.IsValid()
            assert.Equal(t, tt.expected, result)
        })
    }
}
```

### Mock Repository

```go
package application_test

import (
    "testing"
    "github.com/stretchr/testify/mock"
    "github.com/username/myproject/internal/domain"
)

// Mock implementation
type MockUserRepository struct {
    mock.Mock
}

func (m *MockUserRepository) Save(user *domain.User) error {
    args := m.Called(user)
    return args.Error(0)
}

func (m *MockUserRepository) FindByID(id string) (*domain.User, error) {
    args := m.Called(id)
    if args.Get(0) == nil {
        return nil, args.Error(1)
    }
    return args.Get(0).(*domain.User), args.Error(1)
}

func (m *MockUserRepository) FindByEmail(email string) (*domain.User, error) {
    args := m.Called(email)
    if args.Get(0) == nil {
        return nil, args.Error(1)
    }
    return args.Get(0).(*domain.User), args.Error(1)
}

// Test using mock
func TestUserService_CreateUser(t *testing.T) {
    // Arrange
    mockRepo := new(MockUserRepository)
    service := application.NewUserService(mockRepo)

    mockRepo.On("FindByEmail", "john@example.com").Return(nil, nil)
    mockRepo.On("Save", mock.Anything).Return(nil)

    // Act
    user, err := service.CreateUser("John", "john@example.com")

    // Assert
    assert.NoError(t, err)
    assert.NotNil(t, user)
    mockRepo.AssertExpectations(t)
}
```

### Integration Test

```go
package integration_test

import (
    "context"
    "database/sql"
    "testing"
    _ "github.com/lib/pq"
)

func TestUserRepository_Integration(t *testing.T) {
    if testing.Short() {
        t.Skip("skipping integration test")
    }

    // Setup test database
    db, err := sql.Open("postgres", "postgres://localhost/test_db?sslmode=disable")
    if err != nil {
        t.Fatal(err)
    }
    defer db.Close()

    // Run migrations
    // ...

    // Create repository
    repo := persistence.NewPostgresUserRepository(db)

    // Test
    user := domain.NewUser("John", "john@example.com")
    err = repo.Save(context.Background(), user)
    assert.NoError(t, err)

    found, err := repo.FindByID(context.Background(), user.ID)
    assert.NoError(t, err)
    assert.Equal(t, user.Name, found.Name)
}
```

---

## Concurrency Patterns

### Worker Pool

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
    defer wg.Done()
    for j := range jobs {
        fmt.Printf("Worker %d processing job %d\n", id, j)
        time.Sleep(100 * time.Millisecond)
        results <- j * 2
    }
}

func main() {
    const numWorkers = 3
    const numJobs = 10

    jobs := make(chan int, numJobs)
    results := make(chan int, numJobs)
    var wg sync.WaitGroup

    // Start workers
    for w := 1; w <= numWorkers; w++ {
        wg.Add(1)
        go worker(w, jobs, results, &wg)
    }

    // Send jobs
    for j := 1; j <= numJobs; j++ {
        jobs <- j
    }
    close(jobs)

    // Wait for completion
    go func() {
        wg.Wait()
        close(results)
    }()

    // Collect results
    for result := range results {
        fmt.Println("Result:", result)
    }
}
```

---

## Best Practices

### 1. Use Interfaces for Dependencies

✅ **DO:**
```go
type UserService struct {
    repo UserRepository  // Interface, not concrete type
}

func NewUserService(repo UserRepository) *UserService {
    return &UserService{repo: repo}
}
```

### 2. Return Errors, Don't Panic

✅ **DO:**
```go
func GetUser(id string) (*User, error) {
    if id == "" {
        return nil, errors.New("id cannot be empty")
    }
    // ...
}
```

❌ **DON'T:**
```go
func GetUser(id string) *User {
    if id == "" {
        panic("id cannot be empty")  // Never panic in libraries!
    }
    // ...
}
```

### 3. Use Context for Cancellation

✅ **DO:**
```go
func (s *Service) Process(ctx context.Context, data string) error {
    select {
    case <-ctx.Done():
        return ctx.Err()
    default:
        // Process data
    }
    return nil
}
```

### 4. Accept Interfaces, Return Structs

✅ **DO:**
```go
func NewService(repo UserRepository) *Service {  // Accept interface
    return &Service{repo: repo}  // Return concrete type
}
```

### 5. Use Table-Driven Tests

✅ **DO:**
```go
func TestValidateEmail(t *testing.T) {
    tests := []struct {
        name    string
        email   string
        wantErr bool
    }{
        {"valid email", "test@example.com", false},
        {"missing @", "testexample.com", true},
        {"empty", "", true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := ValidateEmail(tt.email)
            if (err != nil) != tt.wantErr {
                t.Errorf("ValidateEmail() error = %v, wantErr %v", err, tt.wantErr)
            }
        })
    }
}
```

---

## Quick Start Commands

```bash
# Run application
go run cmd/api/main.go

# Build binary
go build -o bin/api cmd/api/main.go

# Run tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run tests (verbose)
go test -v ./...

# Format code
go fmt ./...

# Vet code (static analysis)
go vet ./...

# Run linter (install golangci-lint first)
golangci-lint run

# Cross-compile for Linux
GOOS=linux GOARCH=amd64 go build -o bin/api-linux cmd/api/main.go

# Cross-compile for Windows
GOOS=windows GOARCH=amd64 go build -o bin/api.exe cmd/api/main.go
```

---

## Next Steps

1. ✅ **Choose your architecture pattern** → [Architecture Patterns Guide](../examples-overview.md)
2. ✅ **Study Go examples** → [Go Examples](../examples-overview.md#-go-examples)
3. ✅ **Implement your project** using Go's interfaces and concurrency
4. ✅ **Follow Go conventions** from this guide

---

## Related Resources

- **Main Guide:** [Architecture Patterns Guide](../examples-overview.md)
- **Examples Index:** [All Examples](../examples-overview.md)
- **Official Go Docs:** https://go.dev/doc/
- **Effective Go:** https://go.dev/doc/effective_go
- **Go Project Layout:** https://github.com/golang-standards/project-layout

---

*Last Updated: 2025-10-20*
