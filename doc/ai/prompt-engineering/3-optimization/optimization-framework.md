# Prompt Optimization Framework

**Part of:** [Prompt Engineering Tutorial](../README.md)
**Date:** 2025-11-06
**Research:** Software Engineering Labs, led by Amu Hlongwane

---

## TL;DR

**4-step framework for systematic prompt improvement:** (1) Define success criteria (measurable outcomes), (2) Provide context hierarchy (system → component → problem → constraints), (3) Use progressive refinement (broad → narrow → implementation), (4) Verify and iterate (measure against criteria, refine). **Impact:** Structured optimization → 5-10x better results. **When to use:** Complex tasks, unsatisfactory initial results, production-critical code generation.

---

## Introduction

This framework provides a systematic approach to improving prompt quality. Use it when:
- Initial prompt results are unsatisfactory
- Task is complex or critical
- You need production-ready code
- Consistency across team is required

**Not needed for:** Simple, one-off tasks where first attempt succeeds.

---

## Step 1: Define Success Criteria

**Before writing prompt, define measurable outcomes.**

### Questions to Answer

1. **What is the desired output format?**
   - Code? Documentation? Analysis? Diagram?
   - Specific structure? (API format, markdown sections, etc.)

2. **What quality metrics must be met?**
   - Code coverage percentage?
   - Performance requirements (latency, throughput)?
   - Security standards (OWASP compliance)?
   - Code quality (complexity, line length)?

3. **What are the non-negotiable constraints?**
   - Tech stack (language, framework, versions)
   - Business rules (regulatory compliance, SLA)
   - Resource limits (memory, time, budget)

4. **How will you verify correctness?**
   - Test cases pass?
   - Manual review against checklist?
   - Benchmark meets threshold?

### Example: Success Criteria for API Endpoint

```
Task: Implement user registration endpoint

Success Criteria:

Output Format:
- Spring Boot REST controller
- Service layer with business logic
- JPA repository
- Unit tests (JUnit 5)
- Integration tests (TestContainers)

Quality Metrics:
- Code coverage: ≥ 80%
- Response time: < 200ms (p95)
- Cyclomatic complexity: < 10 per method
- No Checkstyle violations

Constraints:
- Java 21, Spring Boot 3.5
- PostgreSQL for persistence
- BCrypt for password hashing
- Must follow OWASP guidelines

Verification:
- All tests pass (mvn test)
- Postman collection works
- Security scan finds 0 critical issues
- Code review approved by senior engineer
```

---

## Step 2: Provide Context Hierarchy

**Organize context from broad to specific.**

### Four-Level Context Model

```
Level 1 - System Context (Broad):
[High-level system description, tech stack, scale, users]

Level 2 - Component Context (Specific):
[Specific component/module, dependencies, current state]

Level 3 - Problem Context (Immediate):
[Exact problem or task, current vs. desired behavior]

Level 4 - Constraints (Boundaries):
[Technical, business, regulatory constraints]
```

### Example: Context Hierarchy for Optimization Task

```
Level 1 - System Context:
- E-commerce platform serving 50K daily users
- Microservices architecture: 12 services
- Tech stack: Java 21, Spring Boot 3.5, PostgreSQL, Redis, Kafka
- Deployed on AWS ECS, 10 instances per service

Level 2 - Component Context:
- Order Service: Handles order creation, payment processing
- Dependencies: Payment Service (REST), Inventory Service (Kafka)
- Database: orders schema with 5 tables (1M+ order records)
- Current implementation: Synchronous REST calls

Level 3 - Problem Context:
- Checkout endpoint (/api/orders/checkout) taking 3-5 seconds
- Target: < 500ms (p95)
- Root cause suspected: N+1 queries, missing indexes

Level 4 - Constraints:
- Cannot change API contract (breaking change for mobile apps)
- Must maintain ACID guarantees for payment
- Budget: No additional infrastructure spend
- Timeline: Fix needed within 1 week
```

### Why Context Hierarchy Works

- ✅ LLM understands the big picture (Level 1)
- ✅ Focuses on relevant component (Level 2)
- ✅ Knows exact problem to solve (Level 3)
- ✅ Respects boundaries (Level 4)

---

## Step 3: Use Progressive Refinement

**Iterate from broad exploration to specific implementation.**

### Three-Stage Refinement

**Stage 1: Broad Exploration** (Understand options)
```
What are the different approaches to [PROBLEM]?

Context: [Level 1-2 from hierarchy]

List 3-5 approaches with:
- Brief description
- Pros and cons
- Complexity estimate (Low/Medium/High)
- When to use each
```

**Stage 2: Narrow Focus** (Compare and decide)
```
Compare [OPTION A] vs [OPTION B] for [SPECIFIC CONTEXT].

Context: [Level 2-3 from hierarchy]

Include comparison on:
- [CRITERIA 1]: Performance
- [CRITERIA 2]: Scalability
- [CRITERIA 3]: Complexity
- [CRITERIA 4]: Cost

Recommend best option with justification.
```

**Stage 3: Implementation** (Build the solution)
```
Implement [CHOSEN OPTION] with these requirements:

Context: [Full hierarchy, all 4 levels]

Requirements:
- [REQUIREMENT 1]
- [REQUIREMENT 2]
- [REQUIREMENT 3]

Deliverables:
- Complete code
- Unit tests
- Integration tests
- Documentation

Success Criteria: [From Step 1]
```

### Example: Progressive Refinement for Caching

**Iteration 1 - Broad:**
```
What are the options for adding caching to our user profile API?

Context: Spring Boot 3.5 REST API, 1000 req/sec, PostgreSQL database

List caching approaches (in-memory, Redis, CDN, etc.) with pros/cons.
```

**Iteration 2 - Narrow:**
```
Compare Redis vs in-memory caching (Caffeine) for our user profile API.

Context:
- Spring Boot 3.5, 5 application instances
- User profiles rarely change (updates 1% of reads)
- Need cache invalidation on updates
- 10K active users, 100K total users

Compare on:
- Consistency (across instances)
- Performance (latency)
- Complexity (implementation effort)
- Cost (infrastructure)

Which is better for our use case?
```

**Iteration 3 - Implementation:**
```
Implement Redis caching for user profile API.

Full Context: [All levels from Step 2]

Requirements:
- Use Spring Cache abstraction (@Cacheable)
- TTL: 10 minutes
- Cache key: "user:profile:{userId}"
- Evict on update (PATCH /users/{id})
- Handle Redis failures gracefully (fail open)

Deliverables:
1. RedisConfig class
2. Updated UserService with @Cacheable
3. Cache eviction in update method
4. Integration test with TestContainers (embedded Redis)
5. Monitoring: cache hit ratio metric

Success Criteria: [From Step 1]
```

---

## Step 4: Verify and Iterate

**Measure output against success criteria, refine if needed.**

### Verification Checklist

After receiving LLM output:

**1. Completeness**
- [ ] All deliverables provided?
- [ ] Code complete (no TODOs or placeholders)?
- [ ] Tests included and comprehensive?

**2. Correctness**
- [ ] Logic is sound?
- [ ] Edge cases handled?
- [ ] Error handling present?

**3. Quality**
- [ ] Meets quality metrics (coverage, complexity)?
- [ ] Follows coding standards?
- [ ] No obvious security issues?

**4. Constraints**
- [ ] Tech stack correct?
- [ ] Performance requirements met?
- [ ] Budget/time constraints respected?

**5. Format**
- [ ] Output structure matches specification?
- [ ] Documentation included?
- [ ] Examples provided?

### Refinement Based on Verification

**If output is unsatisfactory, refine prompt with:**

| Problem | Refinement Strategy |
|---------|-------------------|
| **Missing details** | Add more specific requirements, provide examples |
| **Wrong format** | Add explicit format specification with template |
| **Quality issues** | Add quality constraints (complexity, coverage, style guide) |
| **Misunderstood context** | Expand context hierarchy, provide code examples |
| **Ignores constraints** | Make constraints more explicit, use "DO NOT" list |
| **Too generic** | Add Few-Shot examples of desired output |
| **Wrong tech stack** | Specify exact versions, add code style guide |

### Example Refinement Iteration

**Initial Prompt (Vague):**
```
Create a user service.
```

**Output:** Generic interface definition, no implementation.

**Problem:** Too vague, no context, no deliverables specified.

**Refined Prompt (Specific):**
```
Act as a backend engineer.

Context: Spring Boot 3.5 REST API for user management.

Create UserService with these methods:
1. createUser(CreateUserRequest) -> UserResponse
2. getUser(Long userId) -> UserResponse
3. updateUser(Long userId, UpdateUserRequest) -> UserResponse
4. deleteUser(Long userId) -> void

Requirements:
- Validate email format (RFC 5322)
- Hash passwords with BCrypt (cost: 12)
- Throw UserNotFoundException if user doesn't exist
- Log all operations at INFO level

Deliverables:
1. UserService interface
2. UserServiceImpl with all business logic
3. Custom exceptions (UserNotFoundException, InvalidEmailException)
4. Unit tests (JUnit 5 + Mockito, 80%+ coverage)
5. Javadoc for all public methods

Tech stack: Java 21, Spring Boot 3.5, JPA, PostgreSQL
```

**Output:** Complete implementation with tests and documentation.

---

## Practical Examples

### Example 1: From Poor to Excellent (API Endpoint)

**❌ Initial Prompt (Poor):**
```
Create a user endpoint.
```

**Problems:**
- No context
- No deliverables
- No constraints
- No format

**✅ Optimized Prompt (Excellent):**
```
[Step 1: Success Criteria]
Act as a backend engineer specializing in Spring Boot.

Task: Implement REST endpoint to retrieve user profile.

Success Criteria:
- Response time: < 100ms (p95)
- Test coverage: ≥ 80%
- All Checkstyle rules pass
- Security: JWT authentication required

[Step 2: Context Hierarchy]
Level 1 - System: User management microservice, 10K users, Spring Boot 3.5
Level 2 - Component: UserController + UserService + UserRepository
Level 3 - Problem: Need GET /api/v1/users/{userId} endpoint
Level 4 - Constraints: Java 21, PostgreSQL, cannot change DB schema

[Step 3: Requirements]
Endpoint: GET /api/v1/users/{userId}

Response: UserProfileDTO
- id (Long)
- username (String)
- email (String)
- createdAt (LocalDateTime)
- lastLogin (LocalDateTime)

Authentication: Requires valid JWT token

Authorization:
- Users can access their own profile
- Admins can access any profile

Error handling:
- 401 Unauthorized: No/invalid token
- 403 Forbidden: Accessing another user's profile (non-admin)
- 404 Not Found: User doesn't exist
- 500 Internal Server Error: Generic message (log details)

[Step 4: Deliverables]
1. UserController class with endpoint method
2. UserService interface and implementation
3. UserProfileDTO record
4. @ControllerAdvice for exception handling
5. Unit tests (JUnit 5 + Mockito, 80%+ coverage)
6. Integration test (TestContainers + PostgreSQL)

Follow:
- RESTful conventions (proper HTTP verbs, status codes)
- Google Java Style Guide
- Single Responsibility Principle
```

**Result:** Production-ready code in one iteration.

---

### Example 2: Database Schema Design

**❌ Initial Prompt (Poor):**
```
Design a database for a blog.
```

**✅ Optimized Prompt (Excellent):**
```
[Step 1: Success Criteria]
Act as a database architect specializing in PostgreSQL.

Success Criteria:
- Normalized to 3NF
- Supports 10K concurrent users
- Full-text search on posts (< 50ms)
- All migrations reversible (up + down scripts)

[Step 2: Context Hierarchy]
Level 1 - System: Blog platform, PostgreSQL 15, 100K posts, 50K users
Level 2 - Component: Core blog data (users, posts, comments, tags)
Level 3 - Problem: Need schema for MVP launch
Level 4 - Constraints: Must support nested comments (3 levels), full-text search

[Step 3: Requirements]
Features:
- Users create posts
- Posts have multiple tags (many-to-many)
- Comments on posts (nested up to 3 levels)
- Users can like posts and comments
- Posts have draft/published status
- Full-text search on post title + content

[Step 4: Deliverables]
1. ER diagram (Mermaid format)
2. SQL migration scripts (Flyway naming convention):
   - V1__create_users_table.sql
   - V2__create_posts_table.sql
   - V3__create_comments_table.sql
   - V4__create_tags_table.sql
   - V5__create_indexes.sql
3. Index strategy with justification
4. Sample queries:
   - Get post with nested comments
   - Full-text search posts
   - Get user's posts with like counts

Design decisions:
- How to model nested comments efficiently? (adjacency list vs nested sets vs path enumeration)
- What indexes for full-text search? (GIN vs GiST)
- How to track like counts? (computed vs materialized)

Constraints:
- Use BIGSERIAL for IDs
- Use TIMESTAMPTZ for timestamps
- Add CHECK constraints for data integrity
- Foreign keys with appropriate ON DELETE actions
```

**Result:** Complete, production-ready schema with migrations.

---

## Optimization Patterns

### Pattern 1: Add Examples (Few-Shot)

**Before:**
```
Convert this requirement to a user story.
```

**After (with examples):**
```
Convert this requirement to a user story.

Example 1:
Requirement: "Users need to reset their password"
User Story: "As a user, I want to reset my password via email so that I can regain access if I forget it."

Example 2:
Requirement: "Admin should see user activity logs"
User Story: "As an admin, I want to view user activity logs so that I can monitor system usage and detect suspicious behavior."

Now convert:
Requirement: "System should send notifications for failed payments"
```

### Pattern 2: Add Constraints (Negative Prompting)

**Before:**
```
Implement caching.
```

**After (with constraints):**
```
Implement caching.

Constraints (DO NOT):
- Do NOT use in-memory caching (must be distributed)
- Do NOT cache sensitive data (passwords, tokens)
- Do NOT block on cache failures (fail open)
- Do NOT skip cache warming on startup
- Do NOT use default TTL (specify explicitly)
```

### Pattern 3: Add Structure (Format Specification)

**Before:**
```
Review this code.
```

**After (with structure):**
```
Review this code using this format:

## Summary
[2-3 sentence overview]

## Critical Issues (must fix)
- **Issue 1** (line X): [description] → [fix]
- **Issue 2** (line Y): [description] → [fix]

## Suggestions (nice to have)
- [Suggestion 1]
- [Suggestion 2]

## Positive Observations
- [What was done well]

## Recommendation
[Approve / Request Changes / Reject]
```

---

## Optimization Checklist

Before finalizing prompt:

- [ ] **Success criteria defined** (Step 1)
- [ ] **Context hierarchy provided** (Step 2)
  - [ ] System context (Level 1)
  - [ ] Component context (Level 2)
  - [ ] Problem context (Level 3)
  - [ ] Constraints (Level 4)
- [ ] **Requirements specific and measurable**
- [ ] **Deliverables explicitly listed**
- [ ] **Output format specified**
- [ ] **Tech stack with versions**
- [ ] **Quality metrics defined** (coverage, performance, etc.)
- [ ] **Error handling requirements**
- [ ] **Examples provided** (if complex format)
- [ ] **Constraints explicit** (technical, security, business)
- [ ] **Verification method defined**

---

## When to Stop Refining

**Stop refining when:**
- ✅ Output meets all success criteria
- ✅ Code passes all tests
- ✅ Performance benchmarks met
- ✅ Security scan clean
- ✅ Code review approved
- ✅ Satisfies project requirements

**Don't over-optimize:**
- ❌ Diminishing returns (90% → 92% improvement takes 10x effort)
- ❌ Simple tasks (one-off scripts, prototypes)
- ❌ Exploratory work (learning, experimentation)

**Good enough > perfect** for non-critical tasks.

---

## Next Steps

Now that you have a systematic framework:

1. **[Anti-Patterns](anti-patterns.md)** - Learn what to avoid
2. **[Core Techniques](../1-core-techniques/core-techniques.md)** - Apply fundamental patterns
3. **[Advanced Techniques](../2-advanced-techniques/advanced-techniques.md)** - Master complex techniques

---

## Related Documentation

- [Tutorial Home](../README.md) - Complete tutorial navigation
- [Fundamentals](../0-foundation/fundamentals.md) - Core principles
- [Memory Management](../2-advanced-techniques/memory-management.md) - Context strategies

---

**Research Attribution:** Software Engineering Labs, led by Amu Hlongwane
**Last Updated:** 2025-11-06
