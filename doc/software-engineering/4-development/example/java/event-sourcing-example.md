# Event Sourcing - Java Implementation

**Pattern:** Event Sourcing
**Language:** Java
**Framework:** Spring Boot 3.x, Axon Framework
**Related Guide:** [Deep Dive: Event Sourcing](../../../3-design/architecture-pattern/deep-dive-event-sourcing.md)

## TL;DR

**Complete Event Sourcing implementation** where state is derived from append-only event log. **Key principle**: Store events, not state → replay events to rebuild state. **Critical components**: Event Store (append-only log) → Aggregate (event application) → Snapshots (performance) → Projections (read models) → Event versioning (evolution).

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Event Store Implementation](#event-store-implementation)
4. [Aggregate with Event Sourcing](#aggregate-with-event-sourcing)
5. [Snapshots for Performance](#snapshots-for-performance)
6. [Event Versioning](#event-versioning)
7. [Projections](#projections)
8. [Axon Framework Example](#axon-framework-example)
9. [Testing](#testing)
10. [Running the Example](#running-the-example)

---

## Overview

This example demonstrates Event Sourcing for a bank account system with:

- **Event Store** - Append-only log of all account events
- **Aggregates** - Account state rebuilt from events
- **Snapshots** - Periodic snapshots for performance
- **Projections** - Read models derived from events
- **Event Versioning** - Handle evolving event schemas

**Architecture:**
```
Command → Aggregate → New Event → Event Store (append-only)
                                      ↓
Query → Load Events → Replay → Current State
                                      ↓
                              Projection (Read Model)
```

---

## Project Structure

```
event-sourcing-example/
└── src/main/java/com/example/eventsourcing/
    ├── domain/
    │   ├── Account.java              # Aggregate
    │   ├── AccountId.java
    │   └── Money.java
    │
    ├── event/
    │   ├── AccountCreatedEvent.java
    │   ├── MoneyDepositedEvent.java
    │   ├── MoneyWithdrawnEvent.java
    │   └── AccountClosedEvent.java
    │
    ├── command/
    │   ├── CreateAccountCommand.java
    │   ├── DepositMoneyCommand.java
    │   └── WithdrawMoneyCommand.java
    │
    ├── eventstore/
    │   ├── EventStore.java           # Interface
    │   ├── InMemoryEventStore.java   # Implementation
    │   ├── EventStream.java
    │   └── Snapshot.java
    │
    ├── aggregate/
    │   ├── AggregateRoot.java
    │   └── AccountAggregate.java
    │
    ├── projection/
    │   └── AccountSummaryProjection.java
    │
    └── api/
        └── AccountController.java
```

---

## Event Store Implementation

### Event Interface

```java
package com.example.eventsourcing.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Base event interface
 */
public interface DomainEvent {
    String getEventId();
    String getAggregateId();
    long getVersion();
    Instant getTimestamp();
    String getEventType();
}
```

### Domain Events

```java
package com.example.eventsourcing.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Account events - Immutable records of what happened
 */
public record AccountCreatedEvent(
    String eventId,
    String aggregateId,
    long version,
    Instant timestamp,
    String accountNumber,
    String ownerName,
    BigDecimal initialBalance
) implements DomainEvent {

    public AccountCreatedEvent(String aggregateId, long version,
                              String accountNumber, String ownerName,
                              BigDecimal initialBalance) {
        this(
            UUID.randomUUID().toString(),
            aggregateId,
            version,
            Instant.now(),
            accountNumber,
            ownerName,
            initialBalance
        );
    }

    @Override
    public String getEventType() {
        return "AccountCreated";
    }
}

public record MoneyDepositedEvent(
    String eventId,
    String aggregateId,
    long version,
    Instant timestamp,
    BigDecimal amount
) implements DomainEvent {

    public MoneyDepositedEvent(String aggregateId, long version,
                              BigDecimal amount) {
        this(
            UUID.randomUUID().toString(),
            aggregateId,
            version,
            Instant.now(),
            amount
        );
    }

    @Override
    public String getEventType() {
        return "MoneyDeposited";
    }
}

public record MoneyWithdrawnEvent(
    String eventId,
    String aggregateId,
    long version,
    Instant timestamp,
    BigDecimal amount
) implements DomainEvent {

    public MoneyWithdrawnEvent(String aggregateId, long version,
                              BigDecimal amount) {
        this(
            UUID.randomUUID().toString(),
            aggregateId,
            version,
            Instant.now(),
            amount
        );
    }

    @Override
    public String getEventType() {
        return "MoneyWithdrawn";
    }
}

public record AccountClosedEvent(
    String eventId,
    String aggregateId,
    long version,
    Instant timestamp
) implements DomainEvent {

    public AccountClosedEvent(String aggregateId, long version) {
        this(
            UUID.randomUUID().toString(),
            aggregateId,
            version,
            Instant.now()
        );
    }

    @Override
    public String getEventType() {
        return "AccountClosed";
    }
}
```

### Event Store Interface

```java
package com.example.eventsourcing.eventstore;

import com.example.eventsourcing.event.DomainEvent;

import java.util.List;

/**
 * Event Store - Append-only log of domain events
 */
public interface EventStore {
    /**
     * Append events to aggregate stream
     * @throws ConcurrencyException if expectedVersion doesn't match
     */
    void appendEvents(String aggregateId, long expectedVersion,
                     List<DomainEvent> events);

    /**
     * Load all events for an aggregate
     */
    EventStream loadEvents(String aggregateId);

    /**
     * Load events from a specific version
     */
    EventStream loadEvents(String aggregateId, long fromVersion);

    /**
     * Save snapshot
     */
    void saveSnapshot(Snapshot snapshot);

    /**
     * Load latest snapshot
     */
    Snapshot loadSnapshot(String aggregateId);
}

class ConcurrencyException extends RuntimeException {
    public ConcurrencyException(String message) {
        super(message);
    }
}
```

### Event Stream

```java
package com.example.eventsourcing.eventstore;

import com.example.eventsourcing.event.DomainEvent;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Stream of events for an aggregate
 */
public class EventStream {
    private final String aggregateId;
    private final List<DomainEvent> events;
    private final long version;

    public EventStream(String aggregateId, List<DomainEvent> events) {
        this.aggregateId = aggregateId;
        this.events = new ArrayList<>(events);
        this.version = events.isEmpty() ? 0 :
            events.get(events.size() - 1).getVersion();
    }

    public String getAggregateId() {
        return aggregateId;
    }

    public List<DomainEvent> getEvents() {
        return Collections.unmodifiableList(events);
    }

    public long getVersion() {
        return version;
    }

    public boolean isEmpty() {
        return events.isEmpty();
    }
}
```

### In-Memory Event Store

```java
package com.example.eventsourcing.eventstore;

import com.example.eventsourcing.event.DomainEvent;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Simple in-memory event store implementation
 * In production, use database (PostgreSQL, EventStoreDB, etc.)
 */
@Component
public class InMemoryEventStore implements EventStore {
    // aggregateId -> List of events
    private final Map<String, List<DomainEvent>> eventStreams =
        new ConcurrentHashMap<>();

    // aggregateId -> Snapshot
    private final Map<String, Snapshot> snapshots =
        new ConcurrentHashMap<>();

    @Override
    public void appendEvents(String aggregateId, long expectedVersion,
                            List<DomainEvent> events) {
        synchronized (eventStreams) {
            List<DomainEvent> stream = eventStreams
                .computeIfAbsent(aggregateId, k -> new ArrayList<>());

            // Optimistic concurrency control
            long currentVersion = stream.isEmpty() ? 0 :
                stream.get(stream.size() - 1).getVersion();

            if (currentVersion != expectedVersion) {
                throw new ConcurrencyException(
                    "Expected version " + expectedVersion +
                    " but was " + currentVersion
                );
            }

            stream.addAll(events);
        }
    }

    @Override
    public EventStream loadEvents(String aggregateId) {
        return loadEvents(aggregateId, 0);
    }

    @Override
    public EventStream loadEvents(String aggregateId, long fromVersion) {
        List<DomainEvent> stream = eventStreams
            .getOrDefault(aggregateId, Collections.emptyList());

        List<DomainEvent> filtered = stream.stream()
            .filter(e -> e.getVersion() > fromVersion)
            .collect(Collectors.toList());

        return new EventStream(aggregateId, filtered);
    }

    @Override
    public void saveSnapshot(Snapshot snapshot) {
        snapshots.put(snapshot.aggregateId(), snapshot);
    }

    @Override
    public Snapshot loadSnapshot(String aggregateId) {
        return snapshots.get(aggregateId);
    }
}
```

### Snapshot

```java
package com.example.eventsourcing.eventstore;

import java.time.Instant;

/**
 * Snapshot - Point-in-time aggregate state
 * Optimization to avoid replaying all events
 */
public record Snapshot(
    String aggregateId,
    long version,
    Object state,
    Instant timestamp
) {}
```

---

## Aggregate with Event Sourcing

### Aggregate Root Base Class

```java
package com.example.eventsourcing.aggregate;

import com.example.eventsourcing.event.DomainEvent;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Base class for event-sourced aggregates
 */
public abstract class AggregateRoot {
    private String id;
    private long version;
    private final List<DomainEvent> uncommittedEvents = new ArrayList<>();

    protected void markEventsAsCommitted() {
        uncommittedEvents.clear();
    }

    public List<DomainEvent> getUncommittedEvents() {
        return Collections.unmodifiableList(uncommittedEvents);
    }

    /**
     * Apply event and add to uncommitted list
     */
    protected void applyEvent(DomainEvent event) {
        applyEventInternal(event);
        uncommittedEvents.add(event);
    }

    /**
     * Apply event during replay (don't add to uncommitted)
     */
    public void replayEvent(DomainEvent event) {
        applyEventInternal(event);
    }

    /**
     * Subclasses implement this to update state
     */
    protected abstract void applyEventInternal(DomainEvent event);

    // Getters
    public String getId() {
        return id;
    }

    protected void setId(String id) {
        this.id = id;
    }

    public long getVersion() {
        return version;
    }

    protected void setVersion(long version) {
        this.version = version;
    }

    protected void incrementVersion() {
        this.version++;
    }
}
```

### Account Aggregate

```java
package com.example.eventsourcing.aggregate;

import com.example.eventsourcing.event.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Account Aggregate - State derived from events
 */
public class AccountAggregate extends AggregateRoot {
    private String accountNumber;
    private String ownerName;
    private BigDecimal balance;
    private boolean closed;

    // Factory method - Create new account
    public static AccountAggregate create(String accountNumber,
                                         String ownerName,
                                         BigDecimal initialBalance) {
        if (initialBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Initial balance cannot be negative");
        }

        AccountAggregate account = new AccountAggregate();
        String aggregateId = UUID.randomUUID().toString();

        // Apply event (this updates state and adds to uncommitted events)
        AccountCreatedEvent event = new AccountCreatedEvent(
            aggregateId,
            1,
            accountNumber,
            ownerName,
            initialBalance
        );

        account.applyEvent(event);
        return account;
    }

    // Command - Deposit money
    public void deposit(BigDecimal amount) {
        if (closed) {
            throw new IllegalStateException("Account is closed");
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }

        long nextVersion = getVersion() + 1;
        MoneyDepositedEvent event = new MoneyDepositedEvent(
            getId(),
            nextVersion,
            amount
        );

        applyEvent(event);
    }

    // Command - Withdraw money
    public void withdraw(BigDecimal amount) {
        if (closed) {
            throw new IllegalStateException("Account is closed");
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        if (balance.compareTo(amount) < 0) {
            throw new IllegalArgumentException("Insufficient funds");
        }

        long nextVersion = getVersion() + 1;
        MoneyWithdrawnEvent event = new MoneyWithdrawnEvent(
            getId(),
            nextVersion,
            amount
        );

        applyEvent(event);
    }

    // Command - Close account
    public void close() {
        if (closed) {
            throw new IllegalStateException("Account already closed");
        }
        if (balance.compareTo(BigDecimal.ZERO) != 0) {
            throw new IllegalStateException("Cannot close account with non-zero balance");
        }

        long nextVersion = getVersion() + 1;
        AccountClosedEvent event = new AccountClosedEvent(
            getId(),
            nextVersion
        );

        applyEvent(event);
    }

    // Event handlers - Update state based on events
    @Override
    protected void applyEventInternal(DomainEvent event) {
        switch (event) {
            case AccountCreatedEvent e -> {
                setId(e.aggregateId());
                setVersion(e.version());
                this.accountNumber = e.accountNumber();
                this.ownerName = e.ownerName();
                this.balance = e.initialBalance();
                this.closed = false;
            }
            case MoneyDepositedEvent e -> {
                setVersion(e.version());
                this.balance = this.balance.add(e.amount());
            }
            case MoneyWithdrawnEvent e -> {
                setVersion(e.version());
                this.balance = this.balance.subtract(e.amount());
            }
            case AccountClosedEvent e -> {
                setVersion(e.version());
                this.closed = true;
            }
            default -> throw new IllegalArgumentException(
                "Unknown event type: " + event.getClass()
            );
        }
    }

    // Getters
    public String getAccountNumber() {
        return accountNumber;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public boolean isClosed() {
        return closed;
    }
}
```

### Repository

```java
package com.example.eventsourcing.aggregate;

import com.example.eventsourcing.event.DomainEvent;
import com.example.eventsourcing.eventstore.EventStore;
import com.example.eventsourcing.eventstore.EventStream;
import com.example.eventsourcing.eventstore.Snapshot;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for event-sourced aggregates
 */
@Repository
public class AccountRepository {
    private final EventStore eventStore;
    private static final int SNAPSHOT_FREQUENCY = 10;

    public AccountRepository(EventStore eventStore) {
        this.eventStore = eventStore;
    }

    public void save(AccountAggregate aggregate) {
        List<DomainEvent> events = aggregate.getUncommittedEvents();
        if (events.isEmpty()) {
            return;
        }

        // Append events with optimistic concurrency control
        eventStore.appendEvents(
            aggregate.getId(),
            aggregate.getVersion() - events.size(),
            events
        );

        aggregate.markEventsAsCommitted();

        // Create snapshot periodically
        if (aggregate.getVersion() % SNAPSHOT_FREQUENCY == 0) {
            Snapshot snapshot = new Snapshot(
                aggregate.getId(),
                aggregate.getVersion(),
                aggregate,
                java.time.Instant.now()
            );
            eventStore.saveSnapshot(snapshot);
        }
    }

    public AccountAggregate load(String aggregateId) {
        // Try to load from snapshot first
        Snapshot snapshot = eventStore.loadSnapshot(aggregateId);

        AccountAggregate aggregate;
        long fromVersion;

        if (snapshot != null) {
            aggregate = (AccountAggregate) snapshot.state();
            fromVersion = snapshot.version();
        } else {
            aggregate = new AccountAggregate();
            fromVersion = 0;
        }

        // Load events after snapshot
        EventStream stream = eventStore.loadEvents(aggregateId, fromVersion);

        // Replay events to rebuild state
        for (DomainEvent event : stream.getEvents()) {
            aggregate.replayEvent(event);
        }

        return aggregate;
    }
}
```

---

## Snapshots for Performance

### Snapshot Strategy

```java
package com.example.eventsourcing.snapshot;

import com.example.eventsourcing.aggregate.AccountAggregate;
import com.example.eventsourcing.eventstore.EventStore;
import com.example.eventsourcing.eventstore.Snapshot;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * Snapshot strategy - When and how to create snapshots
 */
@Component
public class SnapshotStrategy {
    private static final int EVENTS_THRESHOLD = 10;
    private final EventStore eventStore;

    public SnapshotStrategy(EventStore eventStore) {
        this.eventStore = eventStore;
    }

    public boolean shouldCreateSnapshot(AccountAggregate aggregate) {
        // Create snapshot every N events
        return aggregate.getVersion() % EVENTS_THRESHOLD == 0;
    }

    public void createSnapshot(AccountAggregate aggregate) {
        Snapshot snapshot = new Snapshot(
            aggregate.getId(),
            aggregate.getVersion(),
            aggregate,
            Instant.now()
        );

        eventStore.saveSnapshot(snapshot);
    }
}
```

---

## Event Versioning

### Event Upcasting

```java
package com.example.eventsourcing.versioning;

import com.example.eventsourcing.event.DomainEvent;

/**
 * Event Upcaster - Convert old event versions to new
 */
public interface EventUpcaster {
    boolean canUpcast(DomainEvent event);
    DomainEvent upcast(DomainEvent event);
}

/**
 * Example: AccountCreatedEventV1 → AccountCreatedEventV2
 */
@Component
class AccountCreatedEventUpcaster implements EventUpcaster {

    @Override
    public boolean canUpcast(DomainEvent event) {
        return event instanceof AccountCreatedEventV1;
    }

    @Override
    public DomainEvent upcast(DomainEvent event) {
        AccountCreatedEventV1 v1 = (AccountCreatedEventV1) event;

        // Add new field with default value
        return new AccountCreatedEventV2(
            v1.eventId(),
            v1.aggregateId(),
            v1.version(),
            v1.timestamp(),
            v1.accountNumber(),
            v1.ownerName(),
            v1.initialBalance(),
            "USD"  // New field: currency (default value)
        );
    }
}

// Old version
record AccountCreatedEventV1(
    String eventId,
    String aggregateId,
    long version,
    Instant timestamp,
    String accountNumber,
    String ownerName,
    BigDecimal initialBalance
) implements DomainEvent {
    @Override
    public String getEventType() {
        return "AccountCreated.v1";
    }
}

// New version
record AccountCreatedEventV2(
    String eventId,
    String aggregateId,
    long version,
    Instant timestamp,
    String accountNumber,
    String ownerName,
    BigDecimal initialBalance,
    String currency  // New field
) implements DomainEvent {
    @Override
    public String getEventType() {
        return "AccountCreated.v2";
    }
}
```

---

## Projections

### Account Summary Projection

```java
package com.example.eventsourcing.projection;

import com.example.eventsourcing.event.*;
import org.springframework.context.event.EventListener;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Projection - Read model built from events
 */
@Component
public class AccountSummaryProjection {
    private final AccountSummaryRepository repository;

    public AccountSummaryProjection(AccountSummaryRepository repository) {
        this.repository = repository;
    }

    @EventListener
    public void on(AccountCreatedEvent event) {
        AccountSummary summary = new AccountSummary(
            event.aggregateId(),
            event.accountNumber(),
            event.ownerName(),
            event.initialBalance(),
            0,
            event.timestamp()
        );
        repository.save(summary);
    }

    @EventListener
    public void on(MoneyDepositedEvent event) {
        repository.findById(event.aggregateId()).ifPresent(summary -> {
            summary.balance = summary.balance.add(event.amount());
            summary.transactionCount++;
            summary.lastActivity = event.timestamp();
            repository.save(summary);
        });
    }

    @EventListener
    public void on(MoneyWithdrawnEvent event) {
        repository.findById(event.aggregateId()).ifPresent(summary -> {
            summary.balance = summary.balance.subtract(event.amount());
            summary.transactionCount++;
            summary.lastActivity = event.timestamp();
            repository.save(summary);
        });
    }
}

@Document(collection = "account_summaries")
class AccountSummary {
    @Id
    String accountId;
    String accountNumber;
    String ownerName;
    BigDecimal balance;
    int transactionCount;
    Instant lastActivity;

    public AccountSummary(String accountId, String accountNumber,
                         String ownerName, BigDecimal balance,
                         int transactionCount, Instant lastActivity) {
        this.accountId = accountId;
        this.accountNumber = accountNumber;
        this.ownerName = ownerName;
        this.balance = balance;
        this.transactionCount = transactionCount;
        this.lastActivity = lastActivity;
    }

    // Getters and Setters
}

interface AccountSummaryRepository extends MongoRepository<AccountSummary, String> {}
```

---

## Axon Framework Example

### Axon Aggregate

```java
package com.example.eventsourcing.axon;

import com.example.eventsourcing.command.*;
import com.example.eventsourcing.event.*;
import org.axonframework.commandhandling.CommandHandler;
import org.axonframework.eventsourcing.EventSourcingHandler;
import org.axonframework.modelling.command.AggregateIdentifier;
import org.axonframework.modelling.command.AggregateLifecycle;
import org.axonframework.spring.stereotype.Aggregate;

import java.math.BigDecimal;

/**
 * Axon handles event sourcing automatically
 */
@Aggregate(snapshotTriggerDefinition = "accountSnapshotTrigger")
public class AxonAccountAggregate {

    @AggregateIdentifier
    private String accountId;
    private BigDecimal balance;
    private boolean closed;

    protected AxonAccountAggregate() {}

    @CommandHandler
    public AxonAccountAggregate(CreateAccountCommand command) {
        AggregateLifecycle.apply(new AccountCreatedEvent(
            command.accountId(),
            1,
            command.accountNumber(),
            command.ownerName(),
            command.initialBalance()
        ));
    }

    @CommandHandler
    public void handle(DepositMoneyCommand command) {
        if (closed) {
            throw new IllegalStateException("Account is closed");
        }
        if (command.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }

        AggregateLifecycle.apply(new MoneyDepositedEvent(
            accountId,
            AggregateLifecycle.getVersion() + 1,
            command.amount()
        ));
    }

    @CommandHandler
    public void handle(WithdrawMoneyCommand command) {
        if (closed) {
            throw new IllegalStateException("Account is closed");
        }
        if (balance.compareTo(command.amount()) < 0) {
            throw new IllegalArgumentException("Insufficient funds");
        }

        AggregateLifecycle.apply(new MoneyWithdrawnEvent(
            accountId,
            AggregateLifecycle.getVersion() + 1,
            command.amount()
        ));
    }

    @EventSourcingHandler
    public void on(AccountCreatedEvent event) {
        this.accountId = event.aggregateId();
        this.balance = event.initialBalance();
        this.closed = false;
    }

    @EventSourcingHandler
    public void on(MoneyDepositedEvent event) {
        this.balance = this.balance.add(event.amount());
    }

    @EventSourcingHandler
    public void on(MoneyWithdrawnEvent event) {
        this.balance = this.balance.subtract(event.amount());
    }

    @EventSourcingHandler
    public void on(AccountClosedEvent event) {
        this.closed = true;
    }
}
```

### Axon Configuration

```java
package com.example.eventsourcing.config;

import org.axonframework.eventsourcing.EventCountSnapshotTriggerDefinition;
import org.axonframework.eventsourcing.SnapshotTriggerDefinition;
import org.axonframework.eventsourcing.Snapshotter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AxonConfig {

    @Bean
    public SnapshotTriggerDefinition accountSnapshotTrigger(Snapshotter snapshotter) {
        return new EventCountSnapshotTriggerDefinition(snapshotter, 10);
    }
}
```

---

## Testing

### Aggregate Test

```java
package com.example.eventsourcing.aggregate;

import com.example.eventsourcing.event.*;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class AccountAggregateTest {

    @Test
    void shouldCreateAccountWithInitialBalance() {
        AccountAggregate account = AccountAggregate.create(
            "ACC001",
            "John Doe",
            BigDecimal.valueOf(1000)
        );

        assertEquals(BigDecimal.valueOf(1000), account.getBalance());
        assertEquals(1, account.getUncommittedEvents().size());
        assertTrue(account.getUncommittedEvents().get(0) instanceof AccountCreatedEvent);
    }

    @Test
    void shouldDepositMoney() {
        AccountAggregate account = AccountAggregate.create(
            "ACC001",
            "John Doe",
            BigDecimal.valueOf(1000)
        );

        account.deposit(BigDecimal.valueOf(500));

        assertEquals(BigDecimal.valueOf(1500), account.getBalance());
        assertEquals(2, account.getUncommittedEvents().size());
    }

    @Test
    void shouldReplayEventsToRebuildState() {
        // Create initial events
        AccountCreatedEvent created = new AccountCreatedEvent(
            "AGG001",
            1,
            "ACC001",
            "John Doe",
            BigDecimal.valueOf(1000)
        );

        MoneyDepositedEvent deposited = new MoneyDepositedEvent(
            "AGG001",
            2,
            BigDecimal.valueOf(500)
        );

        // Replay events
        AccountAggregate account = new AccountAggregate();
        account.replayEvent(created);
        account.replayEvent(deposited);

        // Verify state
        assertEquals(BigDecimal.valueOf(1500), account.getBalance());
        assertEquals("ACC001", account.getAccountNumber());
        assertEquals(2, account.getVersion());
    }
}
```

---

## Running the Example

### Dependencies

```xml
<dependencies>
    <!-- Spring Boot -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- Axon Framework -->
    <dependency>
        <groupId>org.axonframework</groupId>
        <artifactId>axon-spring-boot-starter</artifactId>
        <version>4.9.0</version>
    </dependency>

    <!-- MongoDB for projections -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-mongodb</artifactId>
    </dependency>
</dependencies>
```

### Configuration

```yaml
# application.yml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/event_sourcing

axon:
  eventhandling:
    processors:
      account-projection:
        mode: tracking
```

### Run

```bash
mvn spring-boot:run
```

---

## Key Takeaways

1. **Events as Source of Truth** - All state derived from event log
2. **Temporal Queries** - Can query state at any point in time
3. **Audit Trail** - Complete history of all changes
4. **Event Replay** - Rebuild state by replaying events
5. **Snapshots** - Optimize performance without losing history
6. **Event Versioning** - Handle schema evolution gracefully
7. **CQRS Integration** - Events naturally separate write and read models

---

**Related Guides:**
- [Deep Dive: Event Sourcing](../../../3-design/architecture-pattern/deep-dive-event-sourcing.md)
- [Deep Dive: CQRS](../../../3-design/architecture-pattern/deep-dive-cqrs.md)
- [Deep Dive: Event-Driven Architecture](../../../3-design/architecture-pattern/deep-dive-event-driven.md)

*Last Updated: 2025-10-20*
