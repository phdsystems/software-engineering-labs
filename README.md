# Software Engineering Labs

**Comprehensive software engineering education from first principles to production systems**

[![Research](https://img.shields.io/badge/Research-Software%20Engineering%20Labs-green.svg)](https://github.com/phdsystems)

**Organization:** PHD Systems & PHD Labs
**Lead Researcher:** Amu Hlongwane
**Last Updated:** 2025-11-06

---

## Overview

Software Engineering Labs is a comprehensive educational resource that teaches software engineering from **first principles** to **production-ready distributed systems**. This repository contains:

1. **Core Software Engineering Documentation** - SDLC-organized learning materials
2. **Prompt Engineering Guide** - AI-assisted software development techniques
3. **Interactive Learning Platform** - Next.js 15 application (in development)

---

## Quick Start

### For Learners

**New to Software Engineering?**
1. Start with [First Principles Approach](doc/software-engineering/0-foundation/first-principles-approach.md)
2. Follow the [Learning Path](doc/software-engineering/0-foundation/learning-path.md)
3. Explore code examples in your preferred language

**Want to Learn Architecture?**
1. Review [Architecture Patterns Overview](doc/software-engineering/3-design/architecture-pattern/overview.md)
2. Study specific patterns (Clean Architecture, Microservices, Event-Driven, etc.)
3. See implementations in 7 programming languages

**Looking for Code Examples?**
- Navigate to [Development Examples](doc/software-engineering/4-development/example/examples-overview.md)
- Choose your language: Python, Java, Kotlin, Groovy, Go, Rust, TypeScript
- Follow working code examples

### For AI-Assisted Development

**Learn Prompt Engineering for Code Generation:**
1. Begin with [Fundamentals](doc/ai/prompt-engineering/fundamentals.md)
2. Master [Core Techniques](doc/ai/prompt-engineering/core-techniques.md)
3. Apply [Advanced Techniques](doc/ai/prompt-engineering/advanced-techniques.md)

See [Prompt Engineering Guide](doc/ai/prompt-engineering/README.md) for complete roadmap.

**Validate Documentation Links:**
```bash
python3 scripts/link-checker.py doc/
```
See [Link Checker Documentation](LINK_CHECKER_README.md) for details.

---

## Repository Structure

```
software-engineering-labs/
├── doc/
│   ├── software-engineering/        # Core SE documentation (SDLC-organized)
│   │   ├── 0-foundation/            # Design principles, learning paths
│   │   ├── 1-planning/              # Project concepts, planning
│   │   ├── 2-analysis/              # Requirements analysis
│   │   ├── 3-design/                # Design patterns, architecture patterns
│   │   ├── 4-development/           # Code examples (7 languages)
│   │   ├── 5-testing/               # Testing strategies
│   │   ├── 6-deployment/            # Deployment guides
│   │   ├── 7-maintenance/           # Operations, maintenance
│   │   ├── assets/                  # Diagrams, mockups
│   │   ├── overview.md              # SDLC-organized index
│   │   └── documentation-index.md   # Complete file catalog
│   │
│   └── ai/
│       └── prompt-engineering/      # AI-assisted development guide
│           ├── fundamentals.md
│           ├── core-techniques.md
│           ├── advanced-techniques.md
│           ├── memory-management.md
│           ├── anti-patterns.md
│           └── optimization-framework.md
│
└── learning-platform/               # Next.js 15 interactive platform (in development)
    └── se-learning-platform/
```

---

## Documentation

### Software Engineering Documentation

**Master Index:** [Documentation Overview](doc/software-engineering/overview.md)

**SDLC Phases:**

| Phase | Guide | Content |
|-------|-------|---------|
| **Phase 0: Foundation** | [Foundation Guide](doc/software-engineering/0-foundation/foundation-guide.md) | Design principles, first principles approach |
| **Phase 1: Planning** | [Planning Guide](doc/software-engineering/1-planning/planning-guide.md) | Project concepts, requirements |
| **Phase 2: Analysis** | [Analysis Guide](doc/software-engineering/2-analysis/analysis-guide.md) | Requirements analysis |
| **Phase 3: Design** | [Design Guide](doc/software-engineering/3-design/design-guide.md) | Design patterns, architecture patterns, UI/UX |
| **Phase 4: Development** | [Developer Guide](doc/software-engineering/4-development/developer-guide.md) | Code examples in 7 languages |
| **Phase 5: Testing** | [Testing Guide](doc/software-engineering/5-testing/testing-guide.md) | Testing strategies |
| **Phase 6: Deployment** | [Deployment Guide](doc/software-engineering/6-deployment/deployment-guide.md) | Deployment strategies |
| **Phase 7: Maintenance** | [Operations Guide](doc/software-engineering/7-maintenance/operations-guide.md) | Operations, monitoring |

**Quick Reference:**
- **Design Principles:** [SOLID](doc/software-engineering/0-foundation/design-principle/solid-principle.md), [DRY](doc/software-engineering/0-foundation/design-principle/dry-principle.md), [SoC](doc/software-engineering/0-foundation/design-principle/separation-of-concerns.md), [YAGNI/KISS](doc/software-engineering/0-foundation/design-principle/yagni-kiss.md)
- **Design Patterns:** [Creational](doc/software-engineering/3-design/design-pattern/creational-pattern.md), [Structural](doc/software-engineering/3-design/design-pattern/structural-pattern.md), [Behavioral](doc/software-engineering/3-design/design-pattern/behavioral-pattern.md)
- **Architecture Patterns:** [Clean Architecture](doc/software-engineering/3-design/architecture-pattern/deep-dive-clean-architecture.md), [Microservices](doc/software-engineering/3-design/architecture-pattern/deep-dive-microservices.md), [Event-Driven](doc/software-engineering/3-design/architecture-pattern/deep-dive-event-driven.md), [CQRS](doc/software-engineering/3-design/architecture-pattern/deep-dive-cqrs.md), [Event Sourcing](doc/software-engineering/3-design/architecture-pattern/deep-dive-event-sourcing.md), [Serverless](doc/software-engineering/3-design/architecture-pattern/deep-dive-serverless.md)

### Prompt Engineering Documentation

**Master Index:** [Prompt Engineering Guide](doc/ai/prompt-engineering/README.md)

**Learning Paths:**
- **Quick Start (90 min):** Fundamentals + Core Techniques + Anti-Patterns
- **Production-Ready (3-4 hrs):** All techniques + optimization framework
- **Expert (5-6 hrs):** Complete mastery + memory management

---

## Learning Paths

### Path 1: Beginner (0-2 years experience)
1. [First Principles Approach](doc/software-engineering/0-foundation/first-principles-approach.md) - Philosophy
2. [Design Principles](doc/software-engineering/0-foundation/design-principle/overview.md) - SOLID, DRY, SoC
3. [Design Patterns](doc/software-engineering/3-design/design-pattern/overview.md) - Creational, Structural, Behavioral
4. Pick one language in [Development Examples](doc/software-engineering/4-development/example/examples-overview.md)

**Time:** ~4-6 hours

### Path 2: Intermediate (2-5 years experience)
1. Review [Foundation](doc/software-engineering/0-foundation/foundation-guide.md)
2. Study [Architecture Patterns](doc/software-engineering/3-design/architecture-pattern/overview.md)
3. Compare implementations across [multiple languages](doc/software-engineering/4-development/example/examples-overview.md)
4. Learn [Deployment Strategies](doc/software-engineering/6-deployment/deployment-guide.md)

**Time:** ~6-8 hours

### Path 3: Senior (5+ years experience)
1. Deep dive into [Advanced Architecture](doc/software-engineering/3-design/architecture-pattern/overview.md) (CQRS, Event Sourcing)
2. Compare language idioms across all 7 implementations
3. Study [Production Deployment](doc/software-engineering/6-deployment/implementation-plan.md)
4. Learn [Operations](doc/software-engineering/7-maintenance/operations-guide.md)

**Time:** ~10-12 hours

### Path 4: AI-Assisted Development
1. [Prompt Engineering Fundamentals](doc/ai/prompt-engineering/fundamentals.md)
2. [Core Techniques](doc/ai/prompt-engineering/core-techniques.md) - Few-Shot, CoT, Personas
3. [Advanced Techniques](doc/ai/prompt-engineering/advanced-techniques.md) - ReAct, ToT, Reflexion
4. [Optimization Framework](doc/ai/prompt-engineering/optimization-framework.md)

**Time:** ~3-4 hours

---

## Code Examples

### Supported Languages (7)

All examples demonstrate **Clean Architecture**, **Microservices**, **Event-Driven**, and **Serverless** patterns:

| Language | Setup Guide | Examples |
|----------|-------------|----------|
| **Python** | [Setup](doc/software-engineering/4-development/example/python/project-setup.md) | 8 examples (includes ML, Hexagonal) |
| **Java** | [Setup](doc/software-engineering/4-development/example/java/project-setup.md) | 7 examples (includes CQRS, Event Sourcing) |
| **Kotlin** | [Setup](doc/software-engineering/4-development/example/kotlin/project-setup.md) | 5 examples |
| **Groovy** | [Setup](doc/software-engineering/4-development/example/groovy/project-setup.md) | 5 examples |
| **Go** | [Setup](doc/software-engineering/4-development/example/go/project-setup.md) | 5 examples |
| **Rust** | [Setup](doc/software-engineering/4-development/example/rust/project-setup.md) | 5 examples |
| **TypeScript** | [Setup](doc/software-engineering/4-development/example/typescript/project-setup.md) | 1 example (setup) |

**Total:** 41 production-ready code examples

---

## Philosophy

### First Principles Thinking

This documentation follows a **first principles approach**:

1. **Start with axioms** - SOLID principles (fundamental truths)
2. **Derive tactical solutions** - Design Patterns
3. **Scale to strategic architectures** - Architecture Patterns
4. **Implement in production** - Real code examples

> "I think it's important to reason from first principles rather than by analogy... you boil things down to the most fundamental truths and then reason up from there."
> — Elon Musk

Unlike cookbook tutorials, this approach enables you to:
- **Reason** through novel problems
- **Adapt** patterns to unique situations
- **Innovate** beyond existing solutions

Learn more: [First Principles Approach](doc/software-engineering/0-foundation/first-principles-approach.md)

---

## Learning Platform (In Development)

**Location:** `learning-platform/se-learning-platform/`

A Next.js 15 interactive learning platform with:
- Beautiful markdown rendering
- Syntax-highlighted code examples
- Progress tracking
- Search functionality
- Dark/light themes
- Responsive design

**Status:** Week 1 progress - Core UI components implemented

See [Implementation Plan](doc/software-engineering/6-deployment/implementation-plan.md) for details.

---

## Documentation Statistics

**Software Engineering Documentation:**
- **68 markdown files** (~2.3 MB)
- **7 SVG diagrams** (~100 KB)
- **8 SDLC phases** (0-7)
- **41 code examples** (7 languages)
- **Total reading time:** ~15-20 hours (complete coverage)

**Prompt Engineering Documentation:**
- **6 comprehensive modules**
- **Total reading time:** ~3-4 hours (production-ready path)

---

## Contributing

Contributions welcome! Please:

1. Follow existing SDLC structure
2. Use kebab-case for file names (except root README.md)
3. Include TL;DR sections in guide documents
4. Provide concrete software engineering examples
5. Add references for research-backed techniques
6. Test all code examples before submitting

---

## License

MIT License

Copyright (c) 2025 PHD Systems & PHD Labs

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

## Research Context

**Software Engineering Labs** is led by **Amu Hlongwane** and focuses on:

1. First principles approach to software engineering education
2. AI-assisted software development (prompt engineering)
3. Multi-language architecture pattern implementations
4. Production-ready code examples and best practices

**Related Projects:**
- **SDLC Loops Library** - Prompt templates for all SDLC phases
- **Interactive Learning Platform** - Next.js 15 educational platform

---

## Quick Reference

| I want to... | Go here |
|--------------|---------|
| **Learn fundamentals** | [Foundation Guide](doc/software-engineering/0-foundation/foundation-guide.md) |
| **See code examples** | [Examples Overview](doc/software-engineering/4-development/example/examples-overview.md) |
| **Learn architecture** | [Architecture Patterns](doc/software-engineering/3-design/architecture-pattern/overview.md) |
| **Use AI for coding** | [Prompt Engineering](doc/ai/prompt-engineering/README.md) |
| **Find specific file** | [Documentation Index](doc/software-engineering/documentation-index.md) |
| **View diagrams** | [Diagram Index](doc/software-engineering/assets/diagram-index.md) |

---

## Contact

- **Organization:** PHD Systems & PHD Labs
- **Lead Researcher:** Amu Hlongwane
- **Email:** phdsystemz@gmail.com
- **GitHub:** [@phdsystems](https://github.com/phdsystems)

---

**Last Updated:** 2025-11-06
**Version:** 1.0
**Status:** Active Development
