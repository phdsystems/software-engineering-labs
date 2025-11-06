# Advanced Prompt Engineering Techniques

**Part of:** [Prompt Engineering Tutorial](../README.md)
**Date:** 2025-11-06
**Research:** Software Engineering Labs, led by Amu Hlongwane

---

## TL;DR

**12 advanced techniques for complex tasks:** ReAct (reasoning + acting), Tree of Thoughts (explore paths), Self-Consistency (majority vote), Reflexion (learn from mistakes), Tool Use (external APIs), Least-to-Most (simple → complex), Multi-Turn Dialogue, Iterative Refinement, Meta-Prompting, Negative Prompting, Temperature Control, Memory Management. **Biggest impact:** ReAct for debugging, ToT for architecture decisions, Reflexion for iterative improvement. **When to use:** Complex problems requiring structured exploration, external tool integration, or multi-step reasoning.

---

## Introduction

Advanced techniques build on core methods to handle complex, multi-step tasks. These patterns enable structured problem-solving, external tool integration, and sophisticated reasoning chains.

**Prerequisites:** Master [Core Techniques](../1-core-techniques/core-techniques.md) first (Few-Shot, CoT, Persona, Constraints, Format).

---

## 1. Iterative Refinement

**Technique:** Start broad, then progressively narrow focus.

**Stage 1 - Initial Exploration:**
```
Explain different approaches to implementing real-time notifications in a web application.
```

**Stage 2 - Narrow to Technology:**
```
Compare WebSockets vs Server-Sent Events (SSE) for real-time notifications.
Include: performance, browser support, scalability, complexity.
```

**Stage 3 - Implementation Details:**
```
Provide a complete WebSocket implementation for Spring Boot 3.5:
- Configuration class
- Message broker setup (STOMP)
- Controller for sending notifications
- JavaScript client code
- Error handling and reconnection logic
```

**When to use:** When exploring unfamiliar territory, learning new technologies, or refining requirements.

---

## 2. Meta-Prompting

**Technique:** Ask the LLM to help design the prompt.

**Example:**
```
I need to implement a microservices-based e-commerce system.

Before I ask detailed questions, help me structure my prompts effectively.
What information should I provide in each prompt to get the best architectural guidance?

Generate a template prompt I can use for:
1. Defining service boundaries
2. Designing inter-service communication
3. Handling distributed transactions
4. Implementing observability
```

**When to use:** Starting complex projects, unsure how to structure prompts, need guidance on prompt design.

---

## 3. Negative Prompting

**Technique:** Specify undesired behaviors or outputs.

**Example:**
```
Generate SQL migration scripts for user authentication tables.

Include:
- Users table with proper indexes
- Password reset tokens table
- Audit log table

Exclude:
- Do NOT use VARCHAR(255) blindly - choose appropriate lengths
- Do NOT create indexes on every column
- Do NOT use outdated SQL syntax (e.g., avoid DATETIME in favor of TIMESTAMP)
- Do NOT skip foreign key constraints
- Do NOT use generic names like "data" or "value"
```

**When to use:** Preventing anti-patterns, enforcing standards, avoiding common mistakes.

---

## 4. Temperature and Token Control

**Technique:** Adjust model parameters for different tasks.

| Task Type | Temperature | Max Tokens | Reasoning |
|-----------|-------------|------------|-----------|
| **Code Generation** | 0.2 - 0.3 | 1000-2000 | Low creativity, high precision |
| **Code Explanation** | 0.5 - 0.7 | 500-1000 | Balanced clarity and completeness |
| **Architecture Design** | 0.7 - 0.9 | 1500-2500 | Higher creativity for options |
| **Bug Fixing** | 0.2 - 0.4 | 500-1000 | Precise, deterministic solutions |
| **Code Review** | 0.4 - 0.6 | 1000-1500 | Balanced critical analysis |

**Example:**
```python
# For code generation (low temperature)
response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{"role": "user", "content": prompt}],
    temperature=0.3,  # Low creativity
    max_tokens=2000
)

# For architecture brainstorming (high temperature)
response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{"role": "user", "content": prompt}],
    temperature=0.8,  # Higher creativity
    max_tokens=2500
)
```

**When to use:** Control output diversity, balance creativity vs. precision.

---

## 5. Multi-Turn Dialogue Patterns

**Technique:** Build context across multiple interactions.

**Turn 1 - Establish Context:**
```
I'm working on a Spring Boot microservice for order processing.
Tech stack: Java 21, Spring Boot 3.5, PostgreSQL, Kafka.
Current architecture: REST API → Service Layer → Repository → Database.

Acknowledge and summarize the context.
```

**Turn 2 - Specific Problem:**
```
We're experiencing race conditions when multiple instances process the same order simultaneously.
Current behavior: Order gets processed twice, causing duplicate charges.

What distributed locking strategies should we consider?
```

**Turn 3 - Implementation:**
```
Let's go with Redis-based distributed locking using Redisson.
Provide complete implementation including:
- Redisson configuration
- Lock acquisition in service layer
- Proper lock release (even on exceptions)
- Handling lock timeouts
- Unit tests with TestContainers
```

**When to use:** Complex problems requiring multiple refinement steps, building on previous context.

---

## 6. ReAct (Reasoning + Acting)

**Technique:** Interleave reasoning traces with task-specific actions (e.g., API calls, database queries, tool usage).

**Pattern:** Thought → Action → Observation → Thought → Action → ...

**Template:**
```
Task: Debug why user authentication is failing for user ID 12345.

Use this ReAct pattern:

Thought 1: I need to check if the user exists in the database.
Action 1: Query database for user ID 12345.
Observation 1: [USER FOUND: id=12345, email=john@example.com, status=ACTIVE]

Thought 2: User exists and is active. Let me check the authentication logs.
Action 2: Query auth logs for user ID 12345 in the last hour.
Observation 2: [3 failed login attempts, error: "Invalid credentials"]

Thought 3: Multiple failed attempts suggest password issue. Let me verify password hash.
Action 3: Check password hash format in database.
Observation 3: [Hash format: bcrypt, last_password_change: 2 hours ago]

Thought 4: Password was recently changed. Let me check if password reset was completed properly.
Action 4: Query password_reset_tokens table for user 12345.
Observation 4: [FOUND: token used but not marked as consumed]

Conclusion: Password reset token not properly invalidated. Need to fix token cleanup logic.
```

**Software Engineering Use Case:**
```
Task: Optimize slow database query in OrderService.

Thought 1: Need to identify the slow query first.
Action 1: Check APM logs for OrderService queries taking >1 second.
Observation 1: [Query: SELECT * FROM orders JOIN order_items ... takes 3.2s avg]

Thought 2: This is a JOIN query. Let me check if indexes exist.
Action 2: EXPLAIN ANALYZE the slow query.
Observation 2: [Sequential scan on order_items table, no index on order_id FK]

Thought 3: Missing index on foreign key causing sequential scan.
Action 3: Create index on order_items.order_id and measure improvement.
Observation 3: [Query time reduced from 3.2s to 0.15s]

Conclusion: Added index on order_items(order_id). Query is now 20x faster.
```

**When to use:** Debugging, troubleshooting, interactive problem-solving with external tools.

**Research:** Yao et al. (2022) "ReAct: Synergizing Reasoning and Acting in Language Models"

---

## 7. Tree of Thoughts (ToT)

**Technique:** Explore multiple reasoning paths simultaneously, evaluate them, and select the best branch.

**Pattern:** Generate multiple solutions → Evaluate each → Select best → Continue from best branch

**Template:**
```
Problem: Design a caching strategy for our e-commerce platform.

Generate 3 different approaches:

Approach 1: Redis for session cache + CDN for static assets
├─ Pros: Simple, well-tested, good for session data
├─ Cons: Separate systems, harder to manage invalidation
└─ Estimated complexity: Low

Approach 2: Distributed cache (Hazelcast) embedded in app
├─ Pros: Low latency, no network hop, automatic replication
├─ Cons: Increases app memory, complex clustering
└─ Estimated complexity: Medium

Approach 3: Multi-tier caching (L1: in-memory, L2: Redis, L3: DB)
├─ Pros: Optimal performance, graceful degradation
├─ Cons: High complexity, cache coherence challenges
└─ Estimated complexity: High

Evaluation criteria:
- Performance: Approach 3 > Approach 1 > Approach 2
- Simplicity: Approach 1 > Approach 2 > Approach 3
- Scalability: Approach 3 > Approach 1 > Approach 2
- Cost: Approach 2 > Approach 1 > Approach 3

Best choice for our context (medium traffic, small team): Approach 1
Rationale: Balances performance and complexity. Team familiar with Redis.
```

**Software Engineering Use Case:**
```
Problem: Choose database for new microservice (high write volume, 10K writes/sec).

Option Tree:
├─ Branch 1: PostgreSQL
│   ├─ Evaluate: ACID guarantees strong, but write-heavy might hit limits
│   ├─ Sub-branch 1a: Single instance with write-ahead log tuning
│   │   └─ Max throughput: ~8K writes/sec (below requirement)
│   └─ Sub-branch 1b: PostgreSQL with pgpool read replicas
│       └─ Max throughput: ~8K writes/sec (writes still bottleneck)
├─ Branch 2: MongoDB
│   ├─ Evaluate: High write throughput, but eventual consistency
│   ├─ Sub-branch 2a: Replica set with write concern "majority"
│   │   └─ Max throughput: ~15K writes/sec (meets requirement)
│   └─ Sub-branch 2b: Sharded cluster
│       └─ Max throughput: ~50K writes/sec (over-engineered for now)
└─ Branch 3: Cassandra
    ├─ Evaluate: Excellent write performance, but operational complexity
    └─ Max throughput: ~100K writes/sec (overkill, adds complexity)

Decision: MongoDB replica set (Branch 2a)
- Meets 10K writes/sec requirement
- Acceptable consistency model for our use case
- Team has MongoDB experience
- Can scale to sharding if needed later
```

**When to use:** Complex architectural decisions, multiple valid approaches, need to explore trade-offs systematically.

**Research:** Yao et al. (2023) "Tree of Thoughts: Deliberate Problem Solving with Large Language Models"

---

## 8. Self-Consistency

**Technique:** Generate multiple independent reasoning paths and take majority vote.

**Pattern:** Sample N solutions → Execute each independently → Take consensus/majority

**Template:**
```
Problem: Estimate the optimal connection pool size for our database.

Generate 5 independent analyses:

Analysis 1 (Thread-based):
- Max concurrent requests: 200
- Avg query time: 50ms
- Conclusion: Pool size = 200 * 0.05 = 10 connections

Analysis 2 (Little's Law):
- Throughput: 100 req/sec
- Avg response time: 100ms
- Conclusion: Pool size = 100 * 0.1 = 10 connections

Analysis 3 (Resource-based):
- Database max connections: 100
- Number of app instances: 5
- Reserved for admin/monitoring: 10
- Conclusion: Pool size = (100 - 10) / 5 = 18 connections per instance

Analysis 4 (Performance testing):
- Tested pool sizes: 5, 10, 15, 20, 25
- Optimal latency at: 15 connections (p95: 80ms)
- Conclusion: Pool size = 15 connections

Analysis 5 (HikariCP formula):
- CPU cores: 4
- Formula: connections = cores * 2 + effective_spindle_count
- Conclusion: Pool size = 4 * 2 + 1 = 9 connections

Consensus:
- Median: 10 connections
- Mode: 10 connections (appears twice)
- Range: 9-18 connections
- Recommended: Start with 10, monitor, adjust to 15 if needed
```

**When to use:** Critical decisions where multiple approaches should agree, reducing hallucination risk.

**Research:** Wang et al. (2022) "Self-Consistency Improves Chain of Thought Reasoning in Language Models"

---

## 9. Reflexion (Self-Reflection)

**Technique:** Generate solution → Evaluate → Reflect on mistakes → Regenerate improved solution.

**Pattern:** Attempt → Feedback → Reflection → Retry with improvements

**Template:**
```
Task: Implement user authentication endpoint.

Attempt 1:
[CODE]
public ResponseEntity<String> login(String username, String password) {
    User user = userRepository.findByUsername(username);
    if (user.getPassword().equals(password)) {
        return ResponseEntity.ok("Success");
    }
    return ResponseEntity.status(401).body("Failed");
}
[/CODE]

Evaluation/Feedback:
❌ Security: Storing/comparing plain text passwords
❌ Error handling: NullPointerException if user not found
❌ Return type: Should return JWT token, not string
❌ Best practices: Should use BCrypt for password hashing

Reflection:
- Mistake 1: Didn't consider password security best practices
- Mistake 2: Didn't handle null case for user not found
- Mistake 3: Didn't think about JWT token generation
- Lesson: Always consider OWASP security guidelines for authentication

Attempt 2 (Improved):
[CODE]
@PostMapping("/login")
public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
    User user = userRepository.findByUsername(request.getUsername())
        .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

    if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
        throw new UnauthorizedException("Invalid credentials");
    }

    String jwtToken = jwtService.generateToken(user);
    return ResponseEntity.ok(new LoginResponse(jwtToken, user.getId()));
}
[/CODE]

Evaluation:
✅ Security: Using BCrypt password encoder
✅ Error handling: Proper exception handling
✅ Return type: Returns JWT token in structured response
✅ Best practices: Following Spring Security conventions
```

**Software Engineering Use Case - Bug Fix:**
```
Bug: Application crashes with OutOfMemoryError after 6 hours.

Attempt 1 (Hypothesis: Memory leak in cache):
Action: Increased heap size from 2GB to 4GB.
Result: Crash delayed to 12 hours. Not fixed.

Reflection:
- Mistake: Treated symptom, not root cause
- Lesson: Heap size increase doesn't fix memory leaks
- Next approach: Profile memory to find actual leak

Attempt 2 (Hypothesis: HTTP connection pool not closing):
Action: Added connection pool monitoring, found 500+ CLOSE_WAIT sockets.
Analysis: Connections not properly closed in error cases.
Fix: Added try-with-resources for HttpClient.
Result: Memory stable after 48 hours. Fixed!

Reflection:
- Success: Profiling revealed actual issue
- Lesson: Always profile before guessing
- Prevention: Add monitoring for connection pool metrics
```

**When to use:** Iterative problem-solving, learning from mistakes, continuous improvement.

**Research:** Shinn et al. (2023) "Reflexion: Language Agents with Verbal Reinforcement Learning"

---

## 10. Tool Use / Function Calling

**Technique:** Allow LLM to invoke external tools, APIs, or functions to gather information or perform actions.

**Pattern:** Identify need → Select tool → Call tool → Process result → Continue

**Template:**
```
Task: Generate deployment report for production release.

Available tools:
- get_git_commits(since, until): Get commit history
- query_database(sql): Run database query
- check_ci_status(pipeline_id): Get CI/CD status
- get_jira_tickets(project, status): Fetch JIRA tickets

Execution:

Step 1: Get commits since last release
Tool: get_git_commits(since="2025-11-01", until="2025-11-06")
Result: [47 commits, 12 contributors]

Step 2: Check if all tests passed
Tool: check_ci_status(pipeline_id="release-v2.5")
Result: {status: "passed", tests: 847, coverage: 85%}

Step 3: Get completed tickets
Tool: get_jira_tickets(project="PROD", status="Done")
Result: [23 tickets: 15 features, 5 bugs, 3 improvements]

Step 4: Query production database for current users
Tool: query_database("SELECT COUNT(*) FROM users WHERE active=true")
Result: {active_users: 15247}

Generated Report:
# Release v2.5 Deployment Report
- Commits: 47 (12 contributors)
- Tests: 847 passed (85% coverage)
- Features: 15
- Bug fixes: 5
- Active users: 15,247
- Status: Ready for deployment
```

**Software Engineering Use Case:**
```
Task: Debug production issue - slow API response.

Available tools:
- query_apm(endpoint, time_range): Get APM metrics
- query_logs(service, level, time_range): Fetch logs
- query_database_stats(): Get database performance metrics
- check_redis_metrics(): Get cache hit ratio

Execution:

Tool call 1: query_apm("/api/users", "last_hour")
Result: {p50: 45ms, p95: 2300ms, p99: 5500ms}
Analysis: High p95/p99 indicates occasional slowness.

Tool call 2: query_logs("user-service", "ERROR", "last_hour")
Result: [15 "Connection timeout to Redis" errors]
Analysis: Redis connectivity issues.

Tool call 3: check_redis_metrics()
Result: {hit_ratio: 0.35, connections: 487/500, evictions: 15240}
Analysis: Cache almost full, high eviction rate, low hit ratio.

Tool call 4: query_database_stats()
Result: {slow_queries: 42, avg_query_time: 350ms}
Analysis: Database compensating for cache misses.

Root cause: Redis memory full → evictions → cache misses → slow database queries
Fix: Increase Redis memory or implement better cache eviction policy
```

**When to use:** When LLM needs real-time data, external system interaction, or computational tasks beyond its capabilities.

**Research:** Schick et al. (2023) "Toolformer: Language Models Can Teach Themselves to Use Tools"

---

## 11. Least-to-Most Prompting

**Technique:** Break complex problem into simpler subproblems, solve sequentially from easiest to hardest.

**Pattern:** Decompose → Sort by difficulty → Solve simple → Build on previous → Solve complex

**Template:**
```
Complex task: Migrate monolithic application to microservices.

Decomposition (least to most complex):

Level 1 (Easiest): Extract read-only services
├─ Subtask: Create reporting service (no writes, just queries)
├─ Complexity: Low (no data consistency issues)
└─ Prerequisites: None

Level 2 (Easy): Extract stateless services
├─ Subtask: Create email notification service
├─ Complexity: Low-Medium (stateless, external dependency)
└─ Prerequisites: Level 1 completed

Level 3 (Medium): Extract bounded contexts
├─ Subtask: Create user management service
├─ Complexity: Medium (own database, clear boundaries)
└─ Prerequisites: Levels 1-2 completed

Level 4 (Medium-Hard): Handle cross-service transactions
├─ Subtask: Implement Saga pattern for order processing
├─ Complexity: High (distributed transactions, compensations)
└─ Prerequisites: Levels 1-3 completed

Level 5 (Hardest): Migrate core business logic
├─ Subtask: Extract payment service (PCI compliance, zero downtime)
├─ Complexity: Very High (critical path, regulatory requirements)
└─ Prerequisites: All previous levels completed + thorough testing

Execution:
1. Start with Level 1 (reporting service) - lowest risk
2. Learn from Level 1 experience
3. Apply lessons to Level 2 (email service)
4. Build confidence and patterns
5. Tackle increasingly complex levels
6. Each level builds on previous success
```

**When to use:** Large refactoring, complex migrations, learning new technologies incrementally.

**Research:** Zhou et al. (2022) "Least-to-Most Prompting Enables Complex Reasoning in Large Language Models"

---

## 12. Combining Advanced Techniques

**Effective workflows combine multiple advanced techniques:**

**Example: Production Debugging with ReAct + Reflexion + Tool Use**
```
[TOOL USE] Available tools: APM, logs, database profiler, Redis monitoring

[REACT PATTERN]
Thought 1: API latency is high. Check APM metrics first.
Action 1: query_apm("/api/checkout", "last_hour")
Observation 1: {p95: 3500ms, p99: 7200ms}

Thought 2: Very high tail latencies. Check for errors.
Action 2: query_logs("checkout-service", "ERROR", "last_hour")
Observation 2: [42 "Database connection timeout" errors]

[REFLEXION]
Attempt 1: Increase database connection pool size (10 → 20)
Result: No improvement. Still seeing timeouts.

Reflection: Pool size wasn't the issue. Need to look at query performance.

Attempt 2: Profile slow queries
Tool: query_database_stats()
Result: [ORDER BY clause on unindexed column taking 2.5s]

Fix: Added index on order.created_at
Result: p95 dropped from 3500ms to 180ms. Fixed!

Lesson: Always profile before scaling resources.
```

---

## Next Steps

Now that you've mastered advanced techniques, proceed to:

1. **[Memory Management](memory-management.md)** - Context windows, conversation history, caching strategies
2. **[Anti-Patterns](../3-optimization/anti-patterns.md)** - Common mistakes to avoid
3. **[Optimization Framework](../3-optimization/optimization-framework.md)** - Systematic prompt improvement

---

## Related Documentation

- [Tutorial Home](../README.md) - Complete tutorial navigation
- [Core Techniques](../1-core-techniques/core-techniques.md) - Prerequisite techniques
- [Fundamentals](../0-foundation/fundamentals.md) - Core principles

---

**Research Attribution:** Software Engineering Labs, led by Amu Hlongwane
**Last Updated:** 2025-11-06
