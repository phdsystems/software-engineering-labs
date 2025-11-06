# SE Learning System - Platform

**Software Engineering Learning Platform built with Next.js 15**

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

## 🚀 Quick Start

```bash
# Development server is ALREADY RUNNING at http://localhost:3000
npm run dev

# Build for production
npm run build

# Run production
npm start
```

## ✅ What's Working (Weeks 1-2 Complete)

### Week 1: Foundation
- **Dark/Light Theme** - GitHub-inspired design
- **Responsive Layout** - Mobile, tablet, desktop
- **Navigation** - Header, sidebar, mobile menu
- **Pages** - Homepage, Learn home, Dynamic content
- **Type-Safe** - Full TypeScript coverage

### Week 2: Markdown Rendering
- **Filesystem API** - Reads 58 markdown files from se-doc/
- **Syntax Highlighting** - Shiki with dark/light themes
- **Table of Contents** - Auto-generated with scroll spy
- **Code Blocks** - Copy button, language labels
- **Reading Time** - Auto-calculated from content

## 📁 Key Files

```
app/
  (marketing)/page.tsx          # Homepage
  (learn)/learn/page.tsx        # Learn home
  (learn)/learn/[...slug]/      # Dynamic content pages
  api/content/route.ts          # Content API
components/
  layout/                       # Header, Footer, Sidebar
  markdown/                     # MarkdownRenderer, CodeBlock, TOC
lib/
  api/content.ts                # API client (Phase 2: Filesystem)
  markdown.ts                   # Markdown processing pipeline
types/                          # TypeScript types
```

## 🎨 Design System

**Dark Theme:** GitHub-inspired (#0d1117)
**Light Theme:** Professional (#f8fafc)

## 📚 Documentation

- `IMPLEMENTATION_PLAN.md` - 6-week roadmap
- `WEEK_1_COMPLETE.md` - Week 1 summary
- `WEEK_2_COMPLETE.md` - Week 2 summary

## 🎯 Status

**Week 1:** ✅ Complete (Foundation)
**Week 2:** ✅ Complete (Markdown Rendering)
**Week 3:** 🚧 Next (Search & Navigation)

**Server:** Running at http://localhost:3000
**Content:** 58 markdown files from se-doc/
