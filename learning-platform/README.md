# SE Learning System

**Software Engineering Learning Platform - From First Principles to Distributed Systems**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Organization: PHD Systems](https://img.shields.io/badge/Org-PHD%20Systems-blue)](https://github.com/phdsystems)

---

## 🎯 Overview

The **SE Learning System** is a comprehensive software engineering education platform that teaches from fundamental principles (SOLID) to complex distributed systems (microservices, event sourcing).

**Philosophy:** Teaching software engineering using **first principles thinking** - starting with fundamental truths and building up to complex systems.

---

## 📖 Documentation

All documentation follows SDLC (Software Development Life Cycle) organization:

### Quick Start
- 📘 [Documentation Overview](doc/overview.md) - SDLC-organized master index
- 📂 [Documentation Index](doc/documentation-index.md) - Complete file catalog with metadata
- 🎓 [Learning Path](doc/0-foundation/learning-path.md) - Structured learning roadmap

### Documentation Structure

```
doc/
├── overview.md                    # 📘 Master index (SDLC organized)
├── documentation-index.md         # 📂 Complete file catalog
│
├── 0-foundation/                  # Design principles, first principles
├── 1-planning/                    # Project planning, requirements
├── 2-analysis/                    # Requirements analysis
├── 3-design/                      # Design patterns, architecture patterns
├── 4-development/                 # Code examples (7 languages)
├── 5-testing/                     # Testing strategies
├── 6-deployment/                  # Deployment and CI/CD
├── 7-maintenance/                 # Operations and maintenance
└── assets/                        # Diagrams and visual resources
```

---

## 🚀 Quick Navigation

| You Want To... | Go Here |
|----------------|---------|
| **Learn fundamentals** | [Phase 0: Foundation](doc/0-foundation/foundation-guide.md) |
| **See code examples** | [Phase 4: Development](doc/4-development/developer-guide.md) |
| **Learn architecture** | [Phase 3: Design](doc/3-design/design-guide.md) |
| **Deploy to production** | [Phase 6: Deployment](doc/6-deployment/deployment-guide.md) |
| **Browse all content** | [Documentation Index](doc/documentation-index.md) |

---

## 📚 What's Included

- **68 markdown files** (~2.3 MB of content)
- **7 programming languages** (Python, Java, Kotlin, Groovy, TypeScript, Go, Rust)
- **15+ architecture patterns** documented
- **5 SOLID principles** with multi-language examples
- **20+ design patterns** explained
- **7 SVG diagrams** (production-ready)
- **8 SDLC phase guides** (Foundation through Maintenance)

---

## 🎓 Learning Paths

### For Beginners (0-2 years)
1. [First Principles Approach](doc/0-foundation/first-principles-approach.md)
2. [SOLID Principles](doc/0-foundation/design-principle/solid-principle.md)
3. [Design Patterns](doc/3-design/design-pattern/overview.md)
4. [Pick a Language](doc/4-development/example/examples-overview.md)

### For Intermediate (2-5 years)
1. [Architecture Patterns](doc/3-design/architecture-pattern/overview.md)
2. [Clean Architecture](doc/3-design/architecture-pattern/deep-dive-clean-architecture.md)
3. [Microservices](doc/3-design/architecture-pattern/deep-dive-microservices.md)
4. [Multi-language Examples](doc/4-development/example/examples-overview.md)

### For Senior (5+ years)
1. [CQRS](doc/3-design/architecture-pattern/deep-dive-cqrs.md)
2. [Event Sourcing](doc/3-design/architecture-pattern/deep-dive-event-sourcing.md)
3. [Compare Language Implementations](doc/4-development/example/examples-overview.md)
4. [Production Deployment](doc/6-deployment/implementation-plan.md)

---

## 💻 Implementation

### SE Learning Platform (Next.js 15)

A production-ready web application is being built in `se-learning-platform/`:
- **Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Features:** Dark/light themes, search, code highlighting, learning paths
- **Status:** Week 2 complete (see [se-learning-platform/README.md](se-learning-platform/README.md))

**Implementation plan:** [doc/6-deployment/implementation-plan.md](doc/6-deployment/implementation-plan.md)

---

## 🎨 Design Assets

Visual resources available in [doc/assets/](doc/assets/):
- Architecture diagrams (SVG)
- UI mockups (SVG)
- User flow diagrams (SVG)
- Component architecture (SVG)

**Full catalog:** [doc/assets/diagram-index.md](doc/assets/diagram-index.md)

---

## 📊 Content by Phase

| Phase | Purpose | Files | Key Content |
|-------|---------|-------|-------------|
| **0: Foundation** | Fundamental principles | 8 | SOLID, DRY, KISS, YAGNI |
| **1: Planning** | Project planning | 2 | Project concept, ADRs |
| **2: Analysis** | Requirements | 1 | Analysis techniques |
| **3: Design** | Patterns & architecture | 12 | Design patterns, architecture patterns |
| **4: Development** | Code examples | 43 | 7 languages, 40+ examples |
| **5: Testing** | Testing strategies | 1 | TDD, integration testing |
| **6: Deployment** | CI/CD, deployment | 2 | Implementation plan |
| **7: Maintenance** | Operations | 2 | Monitoring, Git internals |

---

## 🤝 Contributing

We welcome contributions! This is an open educational resource.

**How to contribute:**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improve-solid-guide`)
3. Make your changes
4. Ensure all content is fact-checked and referenced
5. Submit a pull request

**Contribution areas:**
- Add code examples in new languages (C#, Ruby, Swift, etc.)
- Improve existing documentation
- Add new architecture patterns
- Create interactive diagrams
- Translate content to other languages

**Standards:**
- All guides must include TL;DR section
- All code examples must be runnable
- All claims must cite authoritative sources
- Follow PHD Systems/PHD Labs standards (see [CLAUDE.md](/home/developer/.claude/CLAUDE.md))

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**You are free to:**
- ✅ Use this content for learning
- ✅ Use in educational courses
- ✅ Adapt and modify for your needs
- ✅ Share with others

**With attribution to:**
- PHD Systems & PHD Labs
- Original authors and referenced sources

---

## 🏢 Organization

**PHD Systems & PHD Labs**
- Building world-class software engineering education
- First principles approach to complex systems
- Production-ready code and documentation

---

## 🌟 Philosophy

> "I think it's important to reason from first principles rather than by analogy. The normal way we conduct our lives is we reason by analogy. We are doing this because it's like something else that was done, or it is like what other people are doing. With first principles, you boil things down to the most fundamental truths... and then reason up from there."
>
> — Elon Musk

This learning system embodies first principles thinking:
1. **Start with fundamentals** - SOLID principles (axioms)
2. **Derive tactical solutions** - Design Patterns
3. **Scale to strategic architectures** - Architecture Patterns
4. **Implement in production** - Real code examples

---

## 🚀 Roadmap

**Phase 1: Content Complete** ✅
- ✅ 68 markdown files (all SDLC phases)
- ✅ 7 SVG diagrams
- ✅ SDLC organization
- ✅ Two index files (overview.md + documentation-index.md)

**Phase 2: Platform Development** (In Progress)
- ✅ Week 1 complete: Next.js 15 setup
- ✅ Week 2 complete: Content rendering
- 🚧 Week 3-6: Search, features, deployment

**Phase 3: Interactive Features** (Future)
- [ ] Code playgrounds (run examples in browser)
- [ ] Quizzes and exercises
- [ ] Progress tracking
- [ ] Learning path recommendations

**Phase 4: Community** (Future)
- [ ] User contributions
- [ ] Discussion forums
- [ ] Video tutorials
- [ ] Live workshops

---

## 📞 Contact

**Organization:** PHD Systems & PHD Labs
**GitHub:** [@phdsystems](https://github.com/phdsystems)

**Questions or feedback?**
- Open an issue on GitHub
- Contribute improvements via pull request

---

**Last Updated:** 2025-10-21
**Version:** 2.0 (SDLC Reorganization)
**Status:** Documentation reorganized, Platform development in progress

---

## ⭐ Star This Repo

If you find this resource helpful, please star the repository to show your support and help others discover it!
