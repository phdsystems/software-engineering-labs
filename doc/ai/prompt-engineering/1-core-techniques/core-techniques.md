# Core Prompt Engineering Techniques

**Part of:** [Prompt Engineering Tutorial](../README.md)
**Date:** 2025-11-06
**Research:** Software Engineering Labs, led by Amu Hlongwane

---

## TL;DR

**5 essential techniques for immediate improvement:** Few-Shot (provide examples), Chain-of-Thought (request reasoning steps), Persona-Based (assign expert roles), Constraint-Based (define boundaries), Format Specification (structure outputs). **Quick win:** Add 2-3 examples to any prompt → 3-5x better results. **When to use:** Few-Shot for unclear tasks, CoT for complex decisions, Persona for domain expertise.

---

## Introduction

These five core techniques form the foundation of effective prompt engineering. Master these first before moving to advanced techniques. Each technique addresses specific challenges in guiding LLM outputs.

---

## 1. Few-Shot Prompting

**Technique:** Provide examples of desired input-output pairs.

**Template:**
```
Task: Convert requirements to user stories.

Example 1:
Input: "Users need to reset their password"
Output: "As a user, I want to reset my password via email so that I can regain access if I forget it."

Example 2:
Input: "Admin should see user activity logs"
Output: "As an admin, I want to view user activity logs so that I can monitor system usage and detect suspicious behavior."

Now convert this requirement:
Input: "System should send notifications for failed payments"
Output:
```

**When to use:** When output format is critical or task is ambiguous.

**Key Benefits:**
- ✅ Shows exact format expected
- ✅ Reduces ambiguity in complex tasks
- ✅ Works for structured outputs (JSON, SQL, user stories)
- ✅ Improves consistency across multiple generations

**Software Engineering Examples:**

**Example 1: SQL Query Generation**
```
Task: Convert natural language to SQL queries.

Example 1:
Input: "Find all users who registered in the last 7 days"
Output:
SELECT * FROM users
WHERE created_at >= NOW() - INTERVAL 7 DAY
ORDER BY created_at DESC;

Example 2:
Input: "Get top 10 products by revenue"
Output:
SELECT p.product_id, p.name, SUM(o.amount) as revenue
FROM products p
JOIN orders o ON p.product_id = o.product_id
GROUP BY p.product_id, p.name
ORDER BY revenue DESC
LIMIT 10;

Now convert:
Input: "Show users who haven't logged in for 30 days"
Output:
```

**Example 2: Code Review Comments**
```
Task: Write constructive code review comments.

Example 1:
Issue: Method has 50 lines
Comment: "Consider breaking this method into smaller functions. The parsing logic (lines 12-25) and validation logic (lines 26-40) could be separate methods. This improves testability and readability."

Example 2:
Issue: Missing error handling
Comment: "Add try-catch for the database connection (line 47). If the connection fails, the user gets a generic 500 error. Return a specific error message and log the exception for debugging."

Now review this code:
[CODE WITH SECURITY VULNERABILITY]
Comment:
```

---

## 2. Chain-of-Thought (CoT) Prompting

**Technique:** Request step-by-step reasoning before the final answer.

**Variants:**
- **Manual CoT:** Explicitly provide reasoning steps in examples
- **Zero-Shot CoT:** Simply add "Let's think step by step" to the prompt
- **Auto-CoT:** Automatically generate reasoning chains

**Template (Manual CoT):**
```
Problem: Design a rate limiting strategy for our API.

Think through this step-by-step:
1. What are the different types of rate limits we could implement?
2. What are the pros/cons of each approach?
3. Which approach best fits our requirements?
4. How should we handle rate limit violations?
5. What metrics should we track?

After reasoning through these steps, provide your recommendation.
```

**Template (Zero-Shot CoT):**
```
Problem: Design a rate limiting strategy for our API with 1000 req/sec load.

Let's think step by step.
```

**When to use:** For complex decisions, architectural choices, debugging, or mathematical reasoning.

**Key Benefits:**
- ✅ Improves accuracy for complex problems
- ✅ Makes reasoning transparent and verifiable
- ✅ Helps identify flawed logic early
- ✅ Useful for debugging and troubleshooting

**Software Engineering Examples:**

**Example 1: Debugging Strategy**
```
Problem: Application crashes with OutOfMemoryError after 2 hours in production.

Let's debug this step by step:
1. What are the common causes of memory leaks in Java applications?
2. What monitoring data should we collect (heap dumps, GC logs)?
3. What tools can we use to analyze memory usage (JVisualVM, MAT)?
4. What code patterns should we look for (unclosed resources, static collections, listeners)?
5. How do we reproduce this in a test environment?

Walk through each step and provide a diagnostic plan.
```

**Example 2: Architecture Decision**
```
Problem: Choose between REST, GraphQL, or gRPC for microservices communication.

Context:
- 50 microservices
- Mostly internal APIs (not public)
- Performance is critical (p95 < 100ms)
- Multiple languages (Java, Python, Go)

Let's evaluate step by step:
1. What are the performance characteristics of each protocol?
2. What is the development complexity (schema definition, code generation)?
3. How does each handle versioning and backward compatibility?
4. What tooling/ecosystem support exists for our language stack?
5. What are the operational considerations (debugging, monitoring)?

After analyzing each factor, recommend the best approach with justification.
```

**Research:** Wei et al. (2022) "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models"

---

## 3. Persona-Based Prompting

**Technique:** Assign expert personas to the LLM.

**Examples:**

### Security Expert
```
Act as a security engineer specializing in OWASP Top 10 vulnerabilities.
Review this authentication code for security issues:
[CODE]

Provide:
1. List of vulnerabilities found (with OWASP category)
2. Severity rating (Critical/High/Medium/Low)
3. Exploit scenario for each
4. Remediation code snippets
```

### Performance Engineer
```
You are a performance optimization expert with 15 years experience.
This endpoint has 95th percentile latency of 2 seconds.
Analyze the code and provide:
1. Performance bottlenecks (with profiling insights)
2. Optimization recommendations (ranked by impact)
3. Expected performance improvement for each
4. Code examples for top 3 optimizations
```

### API Architect
```
Act as an API architect with expertise in REST and GraphQL design.
Review this API design for:
1. RESTful best practices (resource naming, HTTP verbs, status codes)
2. Versioning strategy
3. Error handling consistency
4. Pagination and filtering approach
5. Security considerations (authentication, rate limiting)

Provide specific recommendations with examples.
```

### Database Architect
```
You are a database architect specializing in PostgreSQL optimization.
Analyze this schema for:
1. Normalization issues
2. Missing indexes
3. Data type choices
4. Constraint definitions
5. Query performance implications

Recommend specific changes with SQL migration scripts.
```

**When to use:** When you need domain-specific expertise, specialized terminology, or focused analysis.

**Key Benefits:**
- ✅ Activates relevant training data
- ✅ Adjusts technical depth appropriately
- ✅ Provides domain-specific insights
- ✅ Sets appropriate tone and style

---

## 4. Constraint-Based Prompting

**Technique:** Explicitly define what NOT to do.

**Template:**
```
Task: Implement user registration endpoint.

Requirements:
- Use Spring Boot 3.5 REST controller
- Validate email format and password strength
- Return 201 Created on success

Constraints (DO NOT):
- Do not store passwords in plain text
- Do not use deprecated Spring Security APIs
- Do not skip input validation
- Do not return sensitive info in error messages
- Do not use blocking I/O for email sending

Implement the endpoint following these constraints.
```

**Why it works:** LLMs sometimes take shortcuts or use outdated patterns. Explicit constraints prevent common mistakes.

**Software Engineering Examples:**

**Example 1: Legacy Code Refactoring**
```
Task: Refactor this legacy authentication service.

Requirements:
- Extract business logic from controller
- Add unit tests (JUnit 5 + Mockito)
- Use dependency injection

Constraints (DO NOT):
- Do not change the public API (breaking change)
- Do not modify database schema
- Do not remove existing error handling
- Do not use reflection or dynamic proxies
- Do not add new external dependencies

Provide refactored code with before/after comparison.
```

**Example 2: Database Migration**
```
Task: Create database migration for adding user roles.

Requirements:
- Add roles table
- Add user_roles junction table
- Migrate existing admin users to admin role

Constraints (DO NOT):
- Do not drop existing tables
- Do not lose any existing data
- Do not use database-specific syntax (must work on PostgreSQL and MySQL)
- Do not create migrations without rollback scripts
- Do not skip foreign key constraints

Provide both up and down migration scripts.
```

**Key Benefits:**
- ✅ Prevents common anti-patterns
- ✅ Enforces best practices
- ✅ Avoids security vulnerabilities
- ✅ Maintains consistency with existing codebase

---

## 5. Format Specification

**Technique:** Define exact output structure.

**Template:**
```
Task: Explain the Strategy pattern.

Format your response exactly as follows:

## Definition
[One-sentence definition]

## Problem It Solves
[2-3 sentences]

## Structure
[Mermaid class diagram]

## Implementation Example
[Java code example with comments]

## When to Use
- [Bullet point 1]
- [Bullet point 2]
- [Bullet point 3]

## Trade-offs
| Pros | Cons |
|------|------|
| [Pro 1] | [Con 1] |
| [Pro 2] | [Con 2] |

## Related Patterns
- [Pattern 1]: [One-line relationship]
- [Pattern 2]: [One-line relationship]
```

**Software Engineering Examples:**

**Example 1: API Documentation Format**
```
Task: Document the /api/users/{id} endpoint.

Format your response exactly as follows:

## Endpoint
[HTTP method and path]

## Description
[One-sentence summary]

## Authentication
[Required auth type]

## Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| [param] | [type] | [yes/no] | [description] |

## Query Parameters
[Same table format]

## Request Body
```json
[example request]
```

## Success Response (200 OK)
```json
[example response]
```

## Error Responses
- **400 Bad Request**: [when this occurs]
- **401 Unauthorized**: [when this occurs]
- **404 Not Found**: [when this occurs]

## Example cURL
```bash
[working curl command]
```
```

**Example 2: Architecture Decision Record (ADR) Format**
```
Task: Document decision to use Redis for caching.

Format as Architecture Decision Record:

# ADR-001: [Title]

**Date:** YYYY-MM-DD
**Status:** [Proposed/Accepted/Deprecated/Superseded]
**Deciders:** [Names]

## Context
[2-3 sentences on the problem]

## Decision
[What was decided]

## Rationale
[Why this decision was made]
- Reason 1: [explanation]
- Reason 2: [explanation]
- Reason 3: [explanation]

## Consequences

### Positive
- [Benefit 1]
- [Benefit 2]

### Negative
- [Cost 1]
- [Cost 2]

### Neutral
- [Other impact 1]
- [Other impact 2]

## Alternatives Considered
1. **[Alternative 1]**: [Why rejected]
2. **[Alternative 2]**: [Why rejected]

## References
- [Link to relevant docs]
- [Link to discussion]
```

**Key Benefits:**
- ✅ Ensures consistent documentation
- ✅ Makes outputs machine-parseable (JSON, YAML, markdown)
- ✅ Reduces post-processing work
- ✅ Enables template reuse across projects

---

## Combining Core Techniques

**Effective prompts combine multiple techniques:**

**Example: Code Review with All 5 Techniques**
```
[PERSONA] Act as a senior software engineer specializing in Java and Spring Boot.

[FEW-SHOT]
Example code review:
Issue: Missing null check
Comment: "Add null validation for 'user' parameter (line 12). If null is passed, the method throws NullPointerException. Return Optional.empty() or throw IllegalArgumentException with clear message."

[CHAIN-OF-THOUGHT]
Review this pull request step-by-step:
1. Check code quality (naming, structure, readability)
2. Identify bugs and edge cases
3. Check security vulnerabilities (OWASP)
4. Evaluate test coverage
5. Assess performance implications

[CONSTRAINTS]
Constraints:
- Do not approve code without tests
- Do not suggest rewrites unless absolutely necessary
- Do not ignore security issues
- Do not accept TODO comments in production code

[FORMAT SPECIFICATION]
Format your review as:

## Summary
[2-3 sentence overview]

## Critical Issues (must fix before merge)
- [Issue 1]: [Explanation + line number]
- [Issue 2]: [Explanation + line number]

## Suggestions (nice to have)
- [Suggestion 1]: [Explanation]
- [Suggestion 2]: [Explanation]

## Positive Observations
- [What was done well]

## Recommendation
[Approve / Request Changes / Reject]

[CODE TO REVIEW]
```

---

## Next Steps

Now that you've mastered core techniques, proceed to:

1. **[Advanced Techniques](../2-advanced-techniques/advanced-techniques.md)** - ReAct, Tree of Thoughts, Self-Consistency, Reflexion
2. **[Memory Management](../2-advanced-techniques/memory-management.md)** - Context windows, conversation history, caching
3. **[Anti-Patterns](../3-optimization/anti-patterns.md)** - Common mistakes to avoid

---

## Related Documentation

- [Tutorial Home](../README.md) - Complete tutorial navigation
- [Fundamentals](../0-foundation/fundamentals.md) - Core principles (prerequisite)
- [Optimization Framework](../3-optimization/optimization-framework.md) - How to improve prompts systematically

---

**Research Attribution:** Software Engineering Labs, led by Amu Hlongwane
**Last Updated:** 2025-11-06
