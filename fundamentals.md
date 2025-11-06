# Prompt Engineering Fundamentals

**Part of:** [Prompt Engineering Tutorial](README.md)
**Date:** 2025-11-06
**Research:** Software Engineering Labs, led by Amu Hlongwane

---

## TL;DR

**Core principles for effective prompts:** Clarity (be specific), Context (provide domain info), Role (assign persona), Decomposition (break into steps), Constraints (define boundaries). **Impact:** Well-structured prompts produce 5-10x better results. **Result:** Transform vague "make it better" into precise, actionable instructions.

---

## Introduction

**Prompt Engineering** is the discipline of designing inputs (prompts) that guide Large Language Models (LLMs) to produce desired outputs. In software engineering contexts, effective prompt engineering can dramatically improve code quality, reduce development time, and minimize errors.

### Why Prompt Engineering Matters

| Aspect | Poor Prompt | Good Prompt | Impact |
|--------|-------------|-------------|--------|
| **Clarity** | "Make it better" | "Refactor for SOLID principles" | 10x more actionable |
| **Context** | "Fix the bug" | "Fix NPE in UserService.java:47 when email is null" | 5x faster resolution |
| **Constraints** | "Add tests" | "Add JUnit 5 tests with 80%+ coverage using Mockito" | Production-ready output |
| **Output Format** | "Explain this" | "Explain with code examples, diagrams, and trade-offs" | Complete documentation |

---

## The Five Fundamental Principles

### 1. Clarity and Specificity

**Principle:** The more precise your prompt, the more accurate the output.

**Poor:**
```
Write a function to process data.
```

**Good:**
```
Write a Python function that:
- Accepts a list of dictionaries with keys: id, name, email, created_at
- Validates email format using regex
- Filters records created in the last 30 days
- Returns sorted list by created_at (newest first)
- Raises ValueError for invalid emails
- Includes docstring and type hints
```

**Why it works:** Eliminates ambiguity, provides exact requirements, specifies error handling.

**Key Guidelines:**
- ✅ Specify input/output formats
- ✅ Define edge cases and error handling
- ✅ State expected behavior explicitly
- ✅ Include non-functional requirements (performance, security)
- ❌ Avoid vague terms like "good", "better", "optimize"

### 2. Context Provision

**Principle:** LLMs perform better with relevant context about the problem domain.

**Poor:**
```
How do I cache this?
```

**Good:**
```
Context: Spring Boot 3.5 REST API with PostgreSQL database.
Problem: User profile endpoint (/api/users/{id}) queries database on every request.
Current load: 1000 req/sec, 95th percentile: 200ms.
Goal: Reduce latency to <50ms using Redis cache.

How should I implement caching for this endpoint?
```

**Why it works:** Provides tech stack, performance context, specific goals, and constraints.

**Context Hierarchy:**

```
Level 1 - System Context (broad):
- Technology stack
- System architecture
- Scale (users, requests, data volume)

Level 2 - Component Context (specific):
- Specific service/module
- Dependencies
- Current implementation

Level 3 - Problem Context (immediate):
- Exact issue or task
- Current behavior vs. desired behavior
- Constraints

Level 4 - Environmental Context (operational):
- Development vs. production
- Available resources
- Time/budget constraints
```

**Example with Full Context:**
```
Level 1 - System: E-commerce platform, Java 21, Spring Boot 3.5, PostgreSQL, Redis, 50K users
Level 2 - Component: OrderService handles order creation, depends on InventoryService and PaymentService
Level 3 - Problem: Race condition when multiple users order last item in stock
Level 4 - Environment: Production issue, needs fix within 2 hours, can't take system offline

Task: Implement distributed locking to prevent race condition.
```

### 3. Role Assignment

**Principle:** Assigning a specific role/persona to the LLM improves response quality and adjusts tone/depth.

**Examples:**
- "Act as a senior software architect with 15 years experience in distributed systems..."
- "As a security engineer specializing in OWASP Top 10, review this code for..."
- "You are an expert in database optimization. Explain..."
- "As a technical writer, document this API..."

**Why it works:** Activates relevant training data, adjusts technical depth, and sets appropriate tone.

**Role Selection Guide:**

| Task Type | Recommended Role | Why |
|-----------|-----------------|-----|
| **Architecture Design** | Senior Software Architect | High-level thinking, trade-offs |
| **Code Review** | Senior Software Engineer | Best practices, patterns |
| **Security Audit** | Security Engineer (OWASP) | Vulnerability focus |
| **Performance Optimization** | Performance Engineer | Profiling, bottlenecks |
| **API Design** | API Architect | REST/GraphQL best practices |
| **Database Design** | Database Architect | Normalization, indexes |
| **Documentation** | Technical Writer | Clarity, completeness |
| **Testing** | QA Engineer | Test coverage, edge cases |

**Example:**
```
Act as a senior software architect with expertise in microservices.

Context: Monolithic e-commerce application (500K LOC), 10M users, scaling issues.
Task: Design migration strategy to microservices.

Provide:
1. Service boundary recommendations
2. Migration sequencing (which services first)
3. Data decomposition strategy
4. Rollback plan
```

### 4. Task Decomposition

**Principle:** Break complex tasks into smaller, sequential steps to prevent overwhelming the model and ensure logical progression.

**Poor:**
```
Build a user authentication system.
```

**Good:**
```
Build a user authentication system following these steps:

Step 1: Design the database schema (users table with id, email, password_hash, created_at)
Step 2: Implement password hashing with bcrypt (cost factor: 12)
Step 3: Create registration endpoint (POST /auth/register)
Step 4: Create login endpoint (POST /auth/login) returning JWT token
Step 5: Implement JWT validation middleware
Step 6: Add unit tests (JUnit 5) for each component
Step 7: Add integration tests using TestContainers

Complete each step before moving to the next.
```

**Why it works:** Prevents overwhelming the model, ensures logical progression, allows verification at each stage.

**Decomposition Strategies:**

**1. Sequential Decomposition (ordered steps):**
```
Step 1: Create data model
Step 2: Implement repository layer
Step 3: Build service layer
Step 4: Add REST controller
Step 5: Write tests
```

**2. Layered Decomposition (by abstraction):**
```
Layer 1: Database schema
Layer 2: Data access (Repository)
Layer 3: Business logic (Service)
Layer 4: API endpoints (Controller)
Layer 5: Integration tests
```

**3. Feature Decomposition (by capability):**
```
Feature 1: User registration
Feature 2: User login
Feature 3: Password reset
Feature 4: Email verification
Feature 5: Session management
```

**4. Risk-Based Decomposition (by complexity):**
```
Low Risk: Read-only endpoints (implement first)
Medium Risk: CRUD operations
High Risk: Payment processing (implement last, most testing)
```

### 5. Constraint Specification

**Principle:** Define boundaries, limitations, and non-negotiable requirements upfront.

**Example:**
```
Constraints:
- Java 21+ only (no legacy Java 8 syntax)
- Must follow Google Java Style Guide
- No third-party dependencies beyond Spring Boot starter
- Maximum method length: 20 lines
- All public methods must have Javadoc
- Code must pass Checkstyle and SpotBugs
- Performance: API response time < 100ms (p95)
- Security: No SQL injection vulnerabilities
```

**Types of Constraints:**

**1. Technical Constraints:**
```
- Language/framework version: Java 21, Spring Boot 3.5
- Libraries allowed: Only standard library + Spring Boot
- Database: PostgreSQL 15 only (no NoSQL)
- Architecture: RESTful API (no GraphQL)
```

**2. Quality Constraints:**
```
- Code coverage: 80% minimum
- Cyclomatic complexity: <10 per method
- Documentation: All public APIs must have Javadoc
- Linting: Must pass ESLint with strict config
```

**3. Performance Constraints:**
```
- Response time: p95 < 100ms, p99 < 200ms
- Throughput: 1000 req/sec minimum
- Memory: Heap usage < 512MB
- Database queries: < 50ms per query
```

**4. Security Constraints:**
```
- Authentication: OAuth 2.0 with JWT
- Authorization: Role-based access control (RBAC)
- Encryption: TLS 1.3 for transport, AES-256 for data at rest
- No secrets in code (use environment variables)
```

**5. Business Constraints:**
```
- Budget: $5000 cloud infrastructure per month
- Timeline: MVP in 3 months
- Compliance: GDPR compliant, SOC 2 Type II
- Availability: 99.9% uptime SLA
```

**Constraint Template:**
```
Task: [What to build]

Technical Constraints:
- [Language, framework, versions]
- [Allowed/forbidden libraries]
- [Architecture patterns]

Quality Constraints:
- [Code coverage, complexity]
- [Documentation requirements]
- [Linting, static analysis]

Performance Constraints:
- [Latency requirements]
- [Throughput requirements]
- [Resource limits]

Security Constraints:
- [Authentication/authorization]
- [Encryption requirements]
- [Compliance standards]

Business Constraints:
- [Budget, timeline]
- [Regulatory compliance]
- [SLA requirements]

Deliver: [Expected output]
```

---

## Combining the Principles

**Effective prompts combine all five principles:**

```
[ROLE] Act as a senior backend engineer.

[CONTEXT]
System: E-commerce API, Spring Boot 3.5, PostgreSQL 15
Problem: Order confirmation emails taking 5 seconds to send, blocking API response
Current: Synchronous email sending in OrderService
Load: 100 orders/minute during peak

[TASK - DECOMPOSED]
Refactor email sending to be asynchronous:

Step 1: Create EmailService with async method
Step 2: Configure Spring @Async with thread pool (10 threads)
Step 3: Update OrderService to call email service asynchronously
Step 4: Add retry logic (3 attempts with exponential backoff)
Step 5: Add monitoring (track success/failure rates)

[CONSTRAINTS]
- Must use Spring Boot's @Async (no external queue like Kafka)
- Email failures should NOT fail order creation
- Add unit tests with @MockBean
- Response time after change: < 200ms

[CLARITY - EXPECTED OUTPUT]
Provide:
1. EmailService class with @Async method
2. AsyncConfig class for thread pool setup
3. Updated OrderService with async call
4. Unit tests for EmailService
5. Explanation of failure handling
```

**Result:** This prompt is **10x more effective** than "Make email sending faster" because it combines:
- ✅ Clear role (senior backend engineer)
- ✅ Full context (tech stack, problem, scale)
- ✅ Decomposed steps (5 clear steps)
- ✅ Specific constraints (Spring @Async, no queue, timing)
- ✅ Precise output format (5 deliverables)

---

## Next Steps

Now that you understand the fundamental principles, proceed to:

1. **[Core Techniques](core-techniques.md)** - Learn Few-Shot, Chain-of-Thought, and more
2. **[Advanced Techniques](advanced-techniques.md)** - Master ReAct, Tree of Thoughts, Reflexion
3. **[Memory Management](memory-management.md)** - Handle long conversations and context

---

## Related Documentation

- [Tutorial Home](README.md) - Complete tutorial navigation
- [Anti-Patterns](anti-patterns.md) - Common mistakes to avoid
- [Optimization Framework](optimization-framework.md) - How to improve your prompts

---

**Research Attribution:** Software Engineering Labs, led by Amu Hlongwane
**Last Updated:** 2025-11-06
