# Anti-Patterns to Avoid

**Part of:** [Prompt Engineering Tutorial](README.md)
**Date:** 2025-11-06
**Research:** Software Engineering Labs, led by Amu Hlongwane

---

## TL;DR

**5 common mistakes that destroy prompt effectiveness:** Vague requests ("make it better"), Missing context (no code/error details), Overly broad scope ("build complete system"), No output format (ambiguous deliverables), Ignoring constraints (no tech stack/requirements). **Impact:** Poor prompts → 10x worse results, wasted time, incorrect code. **Fix:** Add specificity, context, scope limits, format specs, and explicit constraints.

---

## Introduction

Even experienced engineers make these prompt mistakes. Recognizing and avoiding anti-patterns is as important as mastering techniques.

**Each anti-pattern includes:**
- ❌ Bad example (what NOT to do)
- Why it fails (root cause)
- ✅ Good example (correct approach)

---

## 1. ❌ Vague Requests

### Bad Example
```
Make it better.
```

### Why It Fails
No criteria for "better" - performance? readability? security? The LLM must guess your intent, often incorrectly.

### Good Example
```
Refactor this code to improve readability:
- Extract magic numbers to constants
- Reduce method length to <20 lines
- Add descriptive variable names
- Add comments for complex logic

Code:
[PASTE CODE]

Expected outcome: More maintainable code following Clean Code principles.
```

### Key Lesson
**Always specify concrete success criteria.** What does "better" mean in measurable terms?

---

## 2. ❌ Missing Context

### Bad Example
```
Fix the NullPointerException.
```

### Why It Fails
No code provided, no error context, no environment info. The LLM cannot diagnose without seeing the patient.

### Good Example
```
Fix the NullPointerException in UserService.java line 47.

Error: java.lang.NullPointerException at getUserEmail()

Code:
public String getUserEmail() {
    User user = userRepository.findById(userId);
    return user.getEmail();  // Line 47 - NPE here
}

Context: Occurs when user has no email set (optional field).
Expected: Return empty string or throw IllegalStateException with clear message.

Environment: Java 21, Spring Boot 3.5, PostgreSQL
```

### Key Lesson
**Provide complete context:** code, error messages, environment, expected vs. actual behavior.

### Context Checklist
- ✅ Relevant code snippet
- ✅ Error messages/stack traces
- ✅ Environment details (language, framework, versions)
- ✅ Steps to reproduce
- ✅ Expected vs. actual behavior
- ✅ Constraints and requirements

---

## 3. ❌ Overly Broad Scope

### Bad Example
```
Build a complete e-commerce system.
```

### Why It Fails
Scope too large, no priorities, no tech stack, no MVP definition. Results in either generic overview or incomplete implementation.

### Good Example
```
Implement the shopping cart service for our e-commerce system.

Scope (MVP only):
- Add item to cart (POST /cart/items)
- Remove item (DELETE /cart/items/{id})
- View cart (GET /cart)
- Clear cart (DELETE /cart)

Tech stack: Spring Boot 3.5, Redis for cart storage, REST API.

Out of scope: Payment, inventory management, user accounts.

Start with AddToCart endpoint. Provide:
1. Controller with endpoint method
2. Service layer with business logic
3. Redis repository implementation
4. DTOs for request/response
5. Unit tests (JUnit 5 + Mockito)
6. Integration test with TestContainers
```

### Key Lesson
**Break large tasks into concrete, achievable steps.** Define MVP scope explicitly.

### Scope Definition Template
```
Task: [One specific task]

In scope:
- [Feature 1]
- [Feature 2]
- [Feature 3]

Out of scope:
- [Feature X]
- [Feature Y]

Tech stack: [Specific technologies]
Deliverables: [Concrete outputs]
```

---

## 4. ❌ No Output Format

### Bad Example
```
Explain microservices.
```

### Why It Fails
Could get textbook definition, diagram, code, or all of the above. No guidance on structure, depth, or format.

### Good Example
```
Explain microservices architecture in this format:

1. Definition (2-3 sentences)
2. Key characteristics (bullet list)
3. Comparison to monolith (table format with columns: Aspect, Monolith, Microservices)
4. When to use microservices (decision tree: if X then Y)
5. Example architecture diagram (Mermaid format)
6. Java Spring Boot example (complete code for one microservice)

Target audience: Java developers with Spring experience, no prior microservices knowledge.
Length: 500-800 words + code examples.
```

### Key Lesson
**Specify exact output structure.** Use format templates to ensure consistent deliverables.

### Format Specification Examples

**For Documentation:**
```
Format as:
# Title
## TL;DR (2-3 sentences)
## Problem (100 words)
## Solution (300 words with code examples)
## Trade-offs (table format)
## References (links to official docs)
```

**For Code:**
```
Deliverables:
1. Interface definition with Javadoc
2. Implementation class with inline comments
3. Unit tests (Given-When-Then format)
4. Integration test with TestContainers
5. README with usage examples
```

**For Analysis:**
```
Format as table:
| Option | Pros | Cons | Complexity | Cost | Recommendation |
|--------|------|------|------------|------|----------------|
```

---

## 5. ❌ Ignoring Constraints

### Bad Example
```
Add caching to this endpoint.
```

### Why It Fails
No cache technology specified, no TTL, no invalidation strategy, no error handling. Results in generic advice, not actionable code.

### Good Example
```
Add Redis caching to this endpoint with these constraints:

Technology: Spring Cache with Redis (Jedis client)
TTL: 5 minutes
Cache key: "user:{userId}"
Eviction policy: LRU when memory > 80%
Invalidation: On user update/delete operations

Do NOT:
- Use in-memory caching (must be Redis)
- Cache sensitive data (passwords, tokens)
- Block requests if cache is down (fail open)

Include:
- @Cacheable annotation on service method
- RedisConfig class with connection pool settings
- @CacheEvict on update/delete methods
- Integration test with embedded Redis (TestContainers)
- Error handling for cache failures

Code to modify:
[PASTE CODE]
```

### Key Lesson
**Explicitly state all constraints:** technical, business, security, performance.

### Constraint Categories

**Technical Constraints:**
```
- Language/framework: Java 21, Spring Boot 3.5
- Libraries allowed: Only Spring Boot starters + Apache Commons
- Database: PostgreSQL 15 (no NoSQL)
- Architecture: RESTful API (no GraphQL)
```

**Quality Constraints:**
```
- Code coverage: 80% minimum
- Cyclomatic complexity: <10 per method
- Documentation: All public methods need Javadoc
- Linting: Must pass Checkstyle + SpotBugs
```

**Performance Constraints:**
```
- Response time: p95 < 100ms, p99 < 200ms
- Throughput: 1000 req/sec minimum
- Memory: Heap usage < 512MB
- Database queries: < 50ms per query
```

**Security Constraints:**
```
- Authentication: OAuth 2.0 with JWT
- Authorization: Role-based access control (RBAC)
- Encryption: TLS 1.3 for transport, AES-256 at rest
- No secrets in code (use environment variables)
```

---

## 6. ❌ Assuming LLM Knowledge

### Bad Example
```
Implement the feature we discussed yesterday.
```

### Why It Fails
LLMs don't remember previous conversations unless context is explicitly provided.

### Good Example
```
Implement the feature we discussed: User notification preferences.

Context from previous conversation:
- Users can enable/disable email, SMS, push notifications
- Preferences stored in PostgreSQL (user_preferences table)
- Changes trigger audit log entry
- API: PATCH /api/users/{userId}/preferences

Now implement the PATCH endpoint with:
- Input validation (only allow valid notification types)
- Optimistic locking (version field)
- Audit logging
- Unit and integration tests
```

### Key Lesson
**Always provide complete context.** Don't assume the LLM remembers anything.

---

## 7. ❌ No Error Handling Specification

### Bad Example
```
Create a login endpoint.
```

### Why It Fails
No guidance on error handling, status codes, error messages, security implications.

### Good Example
```
Create a login endpoint with comprehensive error handling.

Happy path:
- Input: {username, password}
- Output: {token, userId, expiresAt}
- Status: 200 OK

Error cases:
1. Invalid credentials (wrong password)
   - Status: 401 Unauthorized
   - Message: "Invalid credentials" (generic, don't reveal if username exists)
   - Action: Log failed attempt with IP address

2. Account locked (3 failed attempts)
   - Status: 423 Locked
   - Message: "Account locked. Try again in 15 minutes."
   - Action: Set lockout timestamp in database

3. Missing username/password
   - Status: 400 Bad Request
   - Message: "Username and password required"

4. Database connection failure
   - Status: 500 Internal Server Error
   - Message: "Service temporarily unavailable" (generic)
   - Action: Log full error details, alert ops team

Security requirements:
- Never reveal if username exists (timing-safe comparison)
- Rate limit: 5 attempts per IP per 15 minutes
- Hash passwords with BCrypt (cost factor: 12)
- Log all authentication attempts (success/failure)
```

### Key Lesson
**Specify all error scenarios explicitly.** Security-conscious error handling prevents information leakage.

---

## 8. ❌ Mixing Multiple Tasks

### Bad Example
```
Implement authentication, add logging, refactor the database layer, and fix the deployment script.
```

### Why It Fails
Too many unrelated tasks. LLM tries to do everything, does nothing well.

### Good Example
```
Task 1: Implement authentication
[Detailed requirements for auth only]

Once Task 1 is complete and tested, I'll provide Task 2.
```

**Or use task decomposition:**
```
Multi-task project: Improve user service

Break into sequential tasks:

Task 1: Implement JWT authentication
- [Specific requirements]
- Acceptance: All auth tests pass

Task 2: Add structured logging
- [Specific requirements]
- Prerequisite: Task 1 complete
- Acceptance: Logs in JSON format, <5ms overhead

Task 3: Refactor database layer
- [Specific requirements]
- Prerequisite: Tasks 1-2 complete
- Acceptance: All integration tests pass

Complete Task 1 first.
```

### Key Lesson
**One task per prompt.** Complete and verify before moving to the next.

---

## 9. ❌ No Acceptance Criteria

### Bad Example
```
Improve the performance of this code.
```

### Why It Fails
No definition of "done". How much improvement? How to measure?

### Good Example
```
Optimize this code to meet performance requirements:

Current performance:
- Response time: p95 = 800ms, p99 = 1.5s
- Throughput: 50 req/sec
- Memory: 200MB heap usage

Target performance (acceptance criteria):
- Response time: p95 < 200ms, p99 < 500ms
- Throughput: > 200 req/sec
- Memory: < 150MB heap usage

Code to optimize:
[PASTE CODE]

Constraints:
- Cannot change API contract (breaking change)
- Must maintain 100% backward compatibility
- All existing tests must still pass

Provide:
1. Performance analysis (bottlenecks identified)
2. Optimized code with explanations
3. Benchmark comparison (before/after)
4. Memory profile comparison
```

### Key Lesson
**Define measurable acceptance criteria.** "Done" must be objective, not subjective.

---

## 10. ❌ Ignoring the Tech Stack

### Bad Example
```
Implement user authentication.
```

### Why It Fails
No tech stack specified. Could get Node.js, Python, Java, Go, or pseudo-code.

### Good Example
```
Implement user authentication with this exact tech stack:

Backend:
- Java 21 (use records, pattern matching, new features)
- Spring Boot 3.5
- Spring Security 6.x
- JPA/Hibernate 6.x
- PostgreSQL 15

Libraries:
- Lombok (for @Slf4j, @RequiredArgsConstructor)
- MapStruct (for DTO mapping)
- jjwt (for JWT tokens)

Testing:
- JUnit 5 (Jupiter)
- Mockito 5.x
- TestContainers (for integration tests)
- AssertJ (for fluent assertions)

Code style:
- Google Java Style Guide
- Max method length: 20 lines
- Max cyclomatic complexity: 10

Provide production-ready code following these technologies exactly.
```

### Key Lesson
**Specify exact tech stack with versions.** Different frameworks have different idioms and best practices.

---

## Common Thread Across Anti-Patterns

All anti-patterns share a root cause: **Insufficient specificity**

**Formula for avoiding anti-patterns:**

```
Effective Prompt = Specificity + Context + Constraints + Format + Acceptance Criteria

Where:
- Specificity: Concrete, measurable requirements
- Context: All relevant information (code, errors, environment)
- Constraints: Technical, business, security boundaries
- Format: Exact structure of desired output
- Acceptance Criteria: Measurable definition of "done"
```

---

## Anti-Pattern Detection Checklist

Before submitting a prompt, verify:

- [ ] Is the task specific and concrete?
- [ ] Have I provided all necessary context (code, errors, environment)?
- [ ] Is the scope manageable (not trying to build entire systems)?
- [ ] Have I specified the exact output format I want?
- [ ] Have I listed all constraints (technical, security, performance)?
- [ ] Have I specified the tech stack with versions?
- [ ] Have I defined error handling requirements?
- [ ] Is this a single, focused task (not mixing multiple unrelated tasks)?
- [ ] Have I defined measurable acceptance criteria?
- [ ] Have I avoided assumptions about LLM memory?

**If you answered "no" to any question, refine your prompt before submitting.**

---

## Next Steps

Now that you know what to avoid, learn how to systematically improve prompts:

1. **[Optimization Framework](optimization-framework.md)** - Step-by-step prompt improvement process
2. **[Core Techniques](core-techniques.md)** - Positive patterns to apply
3. **[Fundamentals](fundamentals.md)** - Core principles review

---

## Related Documentation

- [Tutorial Home](README.md) - Complete tutorial navigation
- [Advanced Techniques](advanced-techniques.md) - Complex patterns
- [Memory Management](memory-management.md) - Context window strategies

---

**Research Attribution:** Software Engineering Labs, led by Amu Hlongwane
**Last Updated:** 2025-11-06
