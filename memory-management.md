# Memory and Context Management

**Part of:** [Prompt Engineering Tutorial](README.md)
**Date:** 2025-11-06
**Research:** Software Engineering Labs, led by Amu Hlongwane

---

## TL;DR

**Challenge:** LLMs have limited context windows (4K-128K tokens) and don't inherently remember past conversations. **4 memory types:** Conversation Buffer (recent messages), Sliding Window (recent + summarized old), Semantic (vector store retrieval), Structured (entity tracking). **3 context strategies:** Token Budget Allocation, Hierarchical Summarization, Selective Loading. **When to use:** Short session → Buffer, Multi-day → Sliding Window + Semantic, Long project → Hybrid approach.

---

## Introduction

LLMs face two critical limitations:
1. **Limited context windows** - Can only process 4K-128K tokens at once
2. **No persistent memory** - Don't remember previous conversations unless explicitly provided

Effective memory management enables:
- Multi-session workflows (code reviews spanning days)
- Long conversations without context loss
- Retrieval of relevant past decisions
- Coherent project development over weeks

---

## Memory Types

### 1. Short-Term Memory (Conversation Buffer)

Store recent conversation turns within the context window.

```python
# Simple conversation buffer (last N messages)
class ConversationBuffer:
    def __init__(self, max_messages=10):
        self.messages = []
        self.max_messages = max_messages

    def add_message(self, role, content):
        self.messages.append({"role": role, "content": content})
        # Keep only last N messages
        if len(self.messages) > self.max_messages:
            self.messages = self.messages[-self.max_messages:]

    def get_context(self):
        return self.messages

# Usage in prompt
conversation = ConversationBuffer(max_messages=10)
conversation.add_message("user", "How do I implement JWT authentication?")
conversation.add_message("assistant", "[JWT implementation details]")
conversation.add_message("user", "Now add refresh token support")

# Send conversation history with new prompt
prompt = {
    "messages": conversation.get_context() + [
        {"role": "user", "content": "Add token rotation"}
    ]
}
```

**When to use:** Short sessions (< 20 messages), simple tasks, all context fits in window

**Pros:**
- ✅ Simple implementation
- ✅ No information loss
- ✅ Easy debugging

**Cons:**
- ❌ Fails when context exceeds window
- ❌ No prioritization of important vs. trivial messages

---

### 2. Sliding Window Memory

Keep recent messages and summarize older ones.

```python
def sliding_window_memory(messages, window_size=5, max_tokens=8000):
    """
    Keep last window_size messages as-is,
    summarize older messages if total > max_tokens
    """
    recent_messages = messages[-window_size:]
    older_messages = messages[:-window_size]

    if estimate_tokens(older_messages) > max_tokens / 2:
        # Summarize older messages
        summary_prompt = f"""
        Summarize this conversation history in 200 words:
        {format_messages(older_messages)}

        Focus on:
        - Key decisions made
        - Technical constraints established
        - Current implementation state
        """
        summary = llm.complete(summary_prompt)

        return [
            {"role": "system", "content": f"Previous conversation summary: {summary}"}
        ] + recent_messages
    else:
        return messages
```

**When to use:** Medium-length sessions (20-50 messages), need recent details + high-level context

**Software Engineering Example:**
```python
# Day 1: Implement authentication
messages = [
    {"role": "user", "content": "Implement JWT authentication"},
    {"role": "assistant", "content": "[JWT implementation]"},
    # ... 10 more messages about JWT details
]

# Day 2: Add OAuth (sliding window applies)
# Recent 5 messages: OAuth discussion (full detail)
# Older 10 messages: Summarized to "Implemented JWT with bcrypt, 15-min expiry, refresh tokens"
```

**Pros:**
- ✅ Maintains recent context in full detail
- ✅ Preserves key decisions from past
- ✅ Scales to longer conversations

**Cons:**
- ❌ Summarization may lose important details
- ❌ Requires LLM call to generate summary

---

### 3. Semantic Memory (Vector Store)

Store important information in vector database for retrieval.

```python
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings

class SemanticMemory:
    def __init__(self):
        self.vectorstore = Chroma(
            embedding_function=OpenAIEmbeddings()
        )

    def remember(self, content, metadata=None):
        """Store important information"""
        self.vectorstore.add_texts(
            texts=[content],
            metadatas=[metadata] if metadata else None
        )

    def recall(self, query, k=3):
        """Retrieve relevant memories"""
        docs = self.vectorstore.similarity_search(query, k=k)
        return [doc.page_content for doc in docs]

# Usage
memory = SemanticMemory()

# Store architecture decisions
memory.remember(
    "We chose PostgreSQL over MongoDB because ACID guarantees are critical for financial transactions",
    metadata={"type": "architecture_decision", "date": "2025-11-06"}
)

# Later, recall when needed
context = memory.recall("Why did we choose PostgreSQL?")
prompt = f"""
Context from previous decisions:
{context}

Now, should we add read replicas for scaling?
"""
```

**When to use:** Long-running projects, need to retrieve specific past decisions, large knowledge base

**Software Engineering Example:**
```python
# Week 1: Store decisions
memory.remember("API rate limit: 1000 req/min per user (product requirement)")
memory.remember("Authentication: JWT with 15-min access token, 7-day refresh token")
memory.remember("Database: PostgreSQL 15 with pgbouncer connection pooling")

# Week 4: Retrieve relevant context
# User asks: "What's our rate limiting strategy?"
context = memory.recall("rate limiting strategy", k=2)
# Returns: ["API rate limit: 1000 req/min...", related decisions]
```

**Pros:**
- ✅ Retrieves only relevant information
- ✅ Scales to massive conversation histories
- ✅ Semantic search (not just keyword matching)

**Cons:**
- ❌ Requires vector database infrastructure
- ❌ Embedding costs
- ❌ May miss context not semantically related

---

### 4. Structured Memory (Entity Tracking)

Track entities and relationships explicitly.

```python
class StructuredMemory:
    def __init__(self):
        self.entities = {}  # Track objects/concepts
        self.relationships = []  # Track connections

    def add_entity(self, entity_type, name, properties):
        """Track entities like users, services, databases"""
        self.entities[name] = {
            "type": entity_type,
            "properties": properties
        }

    def add_relationship(self, from_entity, to_entity, relationship_type):
        """Track relationships like 'UserService depends_on PostgreSQL'"""
        self.relationships.append({
            "from": from_entity,
            "to": to_entity,
            "type": relationship_type
        })

    def get_context(self):
        """Generate context summary"""
        context = "System Components:\n"
        for name, entity in self.entities.items():
            context += f"- {name} ({entity['type']}): {entity['properties']}\n"

        context += "\nRelationships:\n"
        for rel in self.relationships:
            context += f"- {rel['from']} {rel['type']} {rel['to']}\n"

        return context

# Usage
memory = StructuredMemory()

# Track system components
memory.add_entity("service", "UserService", {"language": "Java", "port": 8080})
memory.add_entity("database", "PostgreSQL", {"version": "15", "host": "db.internal"})
memory.add_relationship("UserService", "PostgreSQL", "depends_on")

# Use in prompt
prompt = f"""
Current system architecture:
{memory.get_context()}

Task: Add caching layer. What changes are needed?
"""
```

**When to use:** Complex system architectures, need to track dependencies, explicit entity relationships

**Software Engineering Example:**
```python
# Track microservices architecture
memory.add_entity("service", "OrderService", {"tech": "Spring Boot", "db": "orders_db"})
memory.add_entity("service", "PaymentService", {"tech": "Node.js", "db": "payments_db"})
memory.add_entity("message_queue", "Kafka", {"topics": ["orders", "payments"]})

memory.add_relationship("OrderService", "Kafka", "publishes_to")
memory.add_relationship("PaymentService", "Kafka", "subscribes_to")
memory.add_relationship("OrderService", "PaymentService", "calls_api")

# Generate context for new feature
context = memory.get_context()
# Returns:
# System Components:
# - OrderService (service): {'tech': 'Spring Boot', 'db': 'orders_db'}
# - PaymentService (service): {'tech': 'Node.js', 'db': 'payments_db'}
# - Kafka (message_queue): {'topics': ['orders', 'payments']}
# Relationships:
# - OrderService publishes_to Kafka
# - PaymentService subscribes_to Kafka
# - OrderService calls_api PaymentService
```

**Pros:**
- ✅ Explicit, queryable structure
- ✅ Tracks complex dependencies
- ✅ Easy to visualize (can generate diagrams)

**Cons:**
- ❌ Requires manual entity/relationship tracking
- ❌ More complex to implement
- ❌ Rigid structure may miss implicit relationships

---

## Context Window Management Strategies

### Strategy 1: Token Budget Allocation

Allocate tokens across prompt components to prevent overflow.

```python
def allocate_token_budget(max_tokens=4000):
    """Allocate tokens across prompt components"""
    return {
        "system_prompt": max_tokens * 0.10,      # 400 tokens (instructions)
        "conversation_history": max_tokens * 0.40,  # 1600 tokens (context)
        "current_context": max_tokens * 0.20,    # 800 tokens (code, docs)
        "user_query": max_tokens * 0.10,         # 400 tokens (question)
        "response_buffer": max_tokens * 0.20     # 800 tokens (LLM response)
    }

budget = allocate_token_budget(max_tokens=8000)

# Truncate conversation to fit budget
conversation_tokens = estimate_tokens(conversation_history)
if conversation_tokens > budget["conversation_history"]:
    # Summarize or trim oldest messages
    conversation_history = truncate_to_budget(
        conversation_history,
        max_tokens=budget["conversation_history"]
    )
```

**When to use:** Strict token limits (GPT-3.5 4K), need predictable costs, prevent context overflow

---

### Strategy 2: Hierarchical Summarization

Summarize long conversations in tiers based on recency.

```python
def hierarchical_summarization(long_conversation):
    """
    Summarize long conversations in tiers:
    - Tier 1: Last 5 messages (detailed)
    - Tier 2: Messages 6-20 (summarized)
    - Tier 3: Messages 21+ (highly compressed)
    """
    recent = long_conversation[-5:]
    mid_range = long_conversation[-20:-5]
    ancient = long_conversation[:-20]

    # Summarize mid-range
    mid_summary = llm.complete(f"""
    Summarize these messages in 100 words:
    {format_messages(mid_range)}
    """)

    # Highly compress ancient history
    ancient_summary = llm.complete(f"""
    Extract only critical decisions and constraints (50 words max):
    {format_messages(ancient)}
    """)

    return {
        "summary": f"Early decisions: {ancient_summary}\n\nRecent context: {mid_summary}",
        "recent_messages": recent
    }
```

**When to use:** Very long conversations (50+ messages), multi-week projects, need to preserve critical decisions

---

### Strategy 3: Selective Context Loading

Load only relevant context based on query.

```python
def selective_context(query, full_context, max_tokens=2000):
    """
    Load only relevant context based on query
    """
    # Rank context by relevance
    context_chunks = split_into_chunks(full_context)

    relevance_scores = []
    for chunk in context_chunks:
        score = calculate_relevance(query, chunk)  # Cosine similarity
        relevance_scores.append((chunk, score))

    # Sort by relevance and take top chunks
    relevance_scores.sort(key=lambda x: x[1], reverse=True)

    selected_context = []
    current_tokens = 0

    for chunk, score in relevance_scores:
        chunk_tokens = estimate_tokens(chunk)
        if current_tokens + chunk_tokens <= max_tokens:
            selected_context.append(chunk)
            current_tokens += chunk_tokens
        else:
            break

    return "\n\n".join(selected_context)
```

**When to use:** Large codebases, need context-specific information, token limits prevent loading everything

---

## Software Engineering Use Case: Multi-Session Code Review

```python
class CodeReviewMemory:
    def __init__(self):
        self.file_changes = {}  # Track modified files
        self.review_comments = []  # Store all comments
        self.decisions = []  # Architecture decisions
        self.vectorstore = Chroma(embedding_function=OpenAIEmbeddings())

    def add_file_change(self, filename, change_type, description):
        """Track file modifications"""
        if filename not in self.file_changes:
            self.file_changes[filename] = []
        self.file_changes[filename].append({
            "type": change_type,
            "description": description,
            "timestamp": datetime.now()
        })

        # Store in vector db for semantic search
        self.vectorstore.add_texts(
            texts=[f"{filename}: {description}"],
            metadatas=[{"type": "file_change", "file": filename}]
        )

    def add_review_comment(self, filename, line, severity, comment):
        """Store review feedback"""
        self.review_comments.append({
            "file": filename,
            "line": line,
            "severity": severity,
            "comment": comment
        })

    def get_context_for_file(self, filename):
        """Get relevant context for specific file"""
        # Get file history
        history = self.file_changes.get(filename, [])

        # Get related review comments
        comments = [c for c in self.review_comments if c["file"] == filename]

        # Get semantically related changes
        related = self.vectorstore.similarity_search(
            filename,
            k=3,
            filter={"type": "file_change"}
        )

        context = f"""
File: {filename}

Recent Changes:
{format_changes(history)}

Previous Review Comments:
{format_comments(comments)}

Related Changes:
{format_related(related)}
"""
        return context

    def generate_review_prompt(self, filename, code):
        """Generate context-aware review prompt"""
        context = self.get_context_for_file(filename)

        return f"""
Act as a senior code reviewer.

{context}

Review this updated code:
```
{code}
```

Focus on:
1. Addressing previous review comments
2. Consistency with related changes
3. New issues introduced
"""

# Usage across multiple sessions
memory = CodeReviewMemory()

# Session 1: Review UserService
memory.add_file_change("UserService.java", "modified", "Added JWT authentication")
memory.add_review_comment("UserService.java", 47, "high", "Password not hashed")

# Session 2: Review updated UserService (context preserved)
prompt = memory.generate_review_prompt("UserService.java", updated_code)
# LLM can reference previous feedback about password hashing
```

---

## Best Practices

### 1. Memory Persistence

```python
# Save memory state between sessions
memory.save_to_disk("conversation_state.json")

# Restore later
memory = ConversationMemory.load_from_disk("conversation_state.json")
```

**Why important:** Enables multi-day/multi-week workflows, preserves project context across sessions.

---

### 2. Memory Pruning

```python
# Remove irrelevant or outdated memories
def prune_memory(memory, relevance_threshold=0.3, max_age_days=30):
    current_time = datetime.now()

    pruned = []
    for item in memory.items:
        # Check age
        age = (current_time - item.timestamp).days
        if age > max_age_days:
            continue

        # Check relevance
        if item.relevance_score < relevance_threshold:
            continue

        pruned.append(item)

    return pruned
```

**Why important:** Prevents memory bloat, maintains focus on relevant context, reduces token costs.

---

### 3. Memory Compression

```python
# Compress old conversations
def compress_conversation(old_messages):
    """Convert detailed conversation into summary"""
    return llm.complete(f"""
    Compress this conversation into key points:
    {format_messages(old_messages)}

    Output format:
    - Decision: [what was decided]
    - Rationale: [why]
    - Constraints: [limitations established]
    - Next steps: [action items]
    """)
```

**Why important:** Keeps essential information while reducing token usage, preserves decisions without full transcript.

---

## Memory Strategy Decision Matrix

| Scenario | Memory Strategy | Why |
|----------|----------------|-----|
| **Short debugging session** | Conversation Buffer | Simple, all context fits in window |
| **Multi-day development** | Sliding Window + Semantic | Recent details + retrieval of past decisions |
| **Code review over weeks** | Structured Memory + Vector Store | Track entities, relationships, retrieve relevant history |
| **Architecture discussion** | Hierarchical Summarization | Preserve decisions, compress details |
| **Long-running project** | Hybrid (all strategies) | Different contexts need different approaches |

---

## Next Steps

Now that you understand memory management, proceed to:

1. **[Anti-Patterns](anti-patterns.md)** - Common mistakes to avoid
2. **[Optimization Framework](optimization-framework.md)** - Systematic prompt improvement
3. **[Fundamentals](fundamentals.md)** - Review core principles

---

## Related Documentation

- [Tutorial Home](README.md) - Complete tutorial navigation
- [Advanced Techniques](advanced-techniques.md) - ReAct, ToT, Reflexion (use memory in these patterns)
- [Core Techniques](core-techniques.md) - Few-Shot, CoT, Persona

---

## References

- Weston et al. (2014) "Memory Networks"
- Wu et al. (2022) "MemPrompt: Memory-assisted Prompt Editing"
- Park et al. (2023) "Generative Agents: Interactive Simulacra of Human Behavior"

---

**Research Attribution:** Software Engineering Labs, led by Amu Hlongwane
**Last Updated:** 2025-11-06
