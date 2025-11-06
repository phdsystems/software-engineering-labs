# SE Learning System - Next.js 15 Implementation Plan

**Project:** Software Engineering Learning Platform
**Technology:** Next.js 15, React 19, TypeScript, Tailwind CSS
**Timeline:** 6 weeks
**Date Created:** 2025-10-20
**Version:** 1.0

---

## 🎯 Project Overview

**Goal:** Build a production-ready software engineering learning platform using Next.js 15 with:
- Server-side rendering (SSR) for SEO
- Mock API from day one (no broken links)
- Beautiful markdown rendering
- Dark/light themes
- Multi-language code examples
- Fast search functionality
- Progressive learning paths

---

## 📋 Implementation Plan

### Phase 1: Foundation & Setup (Week 1)
**Goal:** Next.js 15 app with routing, theming, and mock API

### Phase 2: Core Features (Week 2-3)
**Goal:** Markdown rendering, navigation, search

### Phase 3: Advanced Features (Week 4-5)
**Goal:** Interactive components, learning paths, progress tracking

### Phase 4: Polish & Deploy (Week 6)
**Goal:** Performance optimization, testing, deployment

---

## 🏗️ Architecture Design

### Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                   NEXT.JS 15 ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend Layer (React 19 + Next.js 15)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • App Router (file-based routing)                    │  │
│  │  • React Server Components (RSC)                      │  │
│  │  • Client Components (interactive UI)                 │  │
│  │  • Suspense boundaries (streaming)                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  Data Layer (Mock API + File System)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • Route Handlers (/api/*)                           │  │
│  │  • Server Actions (form handling)                     │  │
│  │  • File System API (read markdown from se-doc/)      │  │
│  │  • Mock Data (JSON fixtures)                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  Content Processing                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • gray-matter (frontmatter parsing)                  │  │
│  │  • remark/rehype (markdown → HTML)                    │  │
│  │  • shiki (syntax highlighting)                        │  │
│  │  • @next/mdx (MDX support)                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  UI Components                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • shadcn/ui (component library)                      │  │
│  │  • Tailwind CSS (styling)                             │  │
│  │  • next-themes (dark/light mode)                      │  │
│  │  • Framer Motion (animations)                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
se-learning-system/
├── app/                              # Next.js 15 App Router
│   ├── (marketing)/                  # Marketing pages group
│   │   ├── page.tsx                  # Homepage (/)
│   │   ├── about/
│   │   │   └── page.tsx              # About page
│   │   └── layout.tsx                # Marketing layout
│   │
│   ├── (learn)/                      # Learning platform group
│   │   ├── learn/
│   │   │   ├── page.tsx              # Learn home (/learn)
│   │   │   ├── [category]/           # Dynamic category routes
│   │   │   │   ├── page.tsx          # Category overview
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx      # Article page
│   │   │   └── layout.tsx            # Learn layout (sidebar)
│   │   └── layout.tsx
│   │
│   ├── api/                          # API Routes (Mock API)
│   │   ├── content/
│   │   │   ├── route.ts              # GET /api/content (list all)
│   │   │   └── [slug]/
│   │   │       └── route.ts          # GET /api/content/:slug
│   │   ├── search/
│   │   │   └── route.ts              # GET /api/search?q=...
│   │   ├── navigation/
│   │   │   └── route.ts              # GET /api/navigation
│   │   └── progress/
│   │       └── route.ts              # POST /api/progress
│   │
│   ├── layout.tsx                    # Root layout
│   ├── globals.css                   # Global styles
│   └── providers.tsx                 # Context providers
│
├── components/                       # React components
│   ├── ui/                           # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── tabs.tsx
│   │   ├── sheet.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── sidebar.tsx
│   │   └── mobile-nav.tsx
│   ├── content/
│   │   ├── markdown-renderer.tsx
│   │   ├── code-block.tsx
│   │   ├── language-tabs.tsx
│   │   ├── toc.tsx                   # Table of contents
│   │   └── breadcrumbs.tsx
│   ├── search/
│   │   ├── search-dialog.tsx
│   │   └── search-results.tsx
│   └── learning/
│       ├── learning-path-card.tsx
│       ├── progress-tracker.tsx
│       └── related-content.tsx
│
├── lib/                              # Utility functions
│   ├── api/
│   │   ├── content.ts                # Content API client
│   │   └── search.ts                 # Search API client
│   ├── markdown/
│   │   ├── parser.ts                 # Parse markdown files
│   │   ├── processor.ts              # Process with remark/rehype
│   │   └── utils.ts                  # Markdown utilities
│   ├── navigation/
│   │   ├── builder.ts                # Build navigation tree
│   │   └── utils.ts
│   └── utils.ts                      # General utilities
│
├── data/                             # Mock data (until real API)
│   ├── navigation.json               # Navigation structure
│   ├── learning-paths.json           # Learning path definitions
│   ├── metadata.json                 # Content metadata
│   └── search-index.json             # Search index (pre-built)
│
├── content/                          # Symlink to se-doc/
│   └── → ../se-doc/                  # All markdown content
│
├── types/                            # TypeScript types
│   ├── content.ts
│   ├── navigation.ts
│   └── api.ts
│
├── hooks/                            # React hooks
│   ├── use-content.ts
│   ├── use-search.ts
│   └── use-progress.ts
│
├── public/                           # Static assets
│   ├── images/
│   ├── fonts/
│   └── diagrams/                     # SVG diagrams
│
├── se-doc/                           # Original content (existing)
│   └── [all existing files]
│
├── scripts/                          # Build scripts
│   ├── generate-search-index.ts     # Pre-build search index
│   ├── generate-metadata.ts         # Extract frontmatter
│   └── validate-content.ts          # Content validation
│
├── next.config.js                    # Next.js configuration
├── tailwind.config.ts                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
└── package.json
```

---

## 📦 Package Dependencies

```json
{
  "name": "se-learning-system",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "generate:search": "tsx scripts/generate-search-index.ts",
    "generate:metadata": "tsx scripts/generate-metadata.ts"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",

    "gray-matter": "^4.0.3",
    "remark": "^15.0.1",
    "remark-gfm": "^4.0.0",
    "remark-rehype": "^11.1.0",
    "rehype-stringify": "^10.0.0",
    "@shikijs/rehype": "^1.0.0",
    "unified": "^11.0.4",

    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-scroll-area": "^1.0.5",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",

    "next-themes": "^0.2.1",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.344.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5",
    "eslint": "^8",
    "eslint-config-next": "15.0.0",
    "tailwindcss": "^3.4.1",
    "postcss": "^8",
    "autoprefixer": "^10.0.1",
    "tsx": "^4.7.0"
  }
}
```

---

## 🔄 Migration Strategy: Mock → Real Data

### Phase 1: Pure Mock (Week 1)
```typescript
// data/content.json (hardcoded)
[
  {
    "slug": "design-principle/solid-principle",
    "title": "SOLID Principles",
    "content": "# SOLID...",
    // ...
  }
]
```

### Phase 2: File System (Week 2-3)
```typescript
// lib/api/content.ts
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export async function getAllContent() {
  const contentDir = path.join(process.cwd(), 'se-doc')
  // Read markdown files from se-doc/
  // Parse frontmatter
  // Return structured data
}
```

### Phase 3: Real API (Future)
```typescript
// lib/api/content.ts
export async function getAllContent() {
  const response = await fetch('https://api.example.com/content')
  return response.json()
}
```

**Key benefit:** UI code never changes, only the data source!

---

## 🎯 Week-by-Week Plan

### **Week 1: Foundation**

**Tasks:**
1. ✅ Initialize Next.js 15 project with TypeScript
2. ✅ Setup Tailwind CSS + shadcn/ui
3. ✅ Create basic layout (header, footer, sidebar)
4. ✅ Implement dark/light theme toggle
5. ✅ Create mock data structure (`data/*.json`)
6. ✅ Build mock API routes (`/api/content`, `/api/navigation`)
7. ✅ Setup routing (`app/(learn)/learn/[category]/[slug]`)

**Deliverable:** Working Next.js app with mock data, routing, and theming

### **Week 2: Content Rendering**

**Tasks:**
1. ✅ Integrate markdown processing (remark/rehype)
2. ✅ Build MarkdownRenderer component
3. ✅ Add syntax highlighting (Shiki)
4. ✅ Create code block component with copy button
5. ✅ Build language tabs for multi-language examples
6. ✅ Implement table of contents (TOC)
7. ✅ Add breadcrumbs navigation

**Deliverable:** Beautiful markdown rendering with code highlighting

### **Week 3: Navigation & Search**

**Tasks:**
1. ✅ Build sidebar navigation component
2. ✅ Implement mobile navigation (sheet)
3. ✅ Create search dialog (⌘K shortcut)
4. ✅ Build search API endpoint
5. ✅ Pre-generate search index
6. ✅ Add keyboard navigation
7. ✅ Implement "Next/Previous" article navigation

**Deliverable:** Full navigation system with working search

### **Week 4: Learning Features**

**Tasks:**
1. ✅ Create learning path cards
2. ✅ Build progress tracking system
3. ✅ Add related content suggestions
4. ✅ Implement reading progress indicator
5. ✅ Create bookmark functionality (localStorage)
6. ✅ Build "Recently viewed" widget

**Deliverable:** Interactive learning features

### **Week 5: Polish & Optimization**

**Tasks:**
1. ✅ Add loading skeletons
2. ✅ Implement error boundaries
3. ✅ Optimize images (Next.js Image)
4. ✅ Add meta tags for SEO
5. ✅ Implement Open Graph tags
6. ✅ Generate sitemap.xml
7. ✅ Performance optimization

**Deliverable:** Production-ready application

### **Week 6: Testing & Deployment**

**Tasks:**
1. ✅ Write unit tests (Jest)
2. ✅ Add E2E tests (Playwright)
3. ✅ Accessibility audit (WCAG 2.1)
4. ✅ Performance testing (Lighthouse)
5. ✅ Setup CI/CD pipeline
6. ✅ Deploy to Vercel
7. ✅ Documentation

**Deliverable:** Deployed production application

---

## 🚀 Getting Started Command Sequence

```bash
# 1. Create Next.js 15 app
npx create-next-app@latest se-learning-platform \
  --typescript \
  --tailwind \
  --app \
  --src-dir=false \
  --import-alias="@/*"

cd se-learning-platform

# 2. Install dependencies
npm install \
  gray-matter \
  remark remark-gfm remark-rehype \
  rehype-stringify @shikijs/rehype \
  unified \
  next-themes \
  framer-motion \
  lucide-react \
  class-variance-authority clsx tailwind-merge

# 3. Install shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card tabs dialog input sheet scroll-area

# 4. Create directory structure
mkdir -p app/\(marketing\) app/\(learn\)/learn app/api/content app/api/search
mkdir -p components/ui components/layout components/content components/search
mkdir -p lib/api lib/markdown lib/navigation
mkdir -p data hooks types scripts

# 5. Create symlink to content
ln -s ../se-doc content

# 6. Create initial files
touch app/\(marketing\)/page.tsx
touch app/\(learn\)/learn/page.tsx
touch app/api/content/route.ts
touch lib/api/content.ts
touch data/navigation.json

# 7. Start development server
npm run dev
```

---

## 🎨 UI/UX Implementation

### Color System (Following design specs)

```typescript
// tailwind.config.ts
export default {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        // SE Learning System Dark Theme
        background: '#0d1117',
        panel: '#161b22',
        accent: '#58a6ff',
        text: '#c9d1d9',
        muted: '#8b949e',
        'code-bg': '#1f2937',
        border: '#30363d',
      }
    }
  }
}
```

### Key UI Components

1. **Layout Component** - Header, sidebar, content area
2. **Markdown Renderer** - Beautiful prose styling
3. **Code Block** - Syntax highlighting + copy button
4. **Language Tabs** - Multi-language example switcher
5. **Search Dialog** - ⌘K to search
6. **Table of Contents** - Sticky sidebar navigation
7. **Progress Tracker** - Learning path completion
8. **Theme Toggle** - Dark/light mode switcher

---

## ✅ Success Criteria

### Functional Requirements
- ✅ All 58 markdown files render beautifully
- ✅ Navigation works (no broken links)
- ✅ Search returns relevant results
- ✅ Code examples have syntax highlighting
- ✅ Dark/light themes work perfectly
- ✅ Mobile responsive design

### Performance Requirements
- ✅ First Contentful Paint < 1.5s
- ✅ Time to Interactive < 3s
- ✅ Lighthouse score > 90 (all categories)
- ✅ Bundle size < 200KB (initial load)

### User Experience Requirements
- ✅ Keyboard navigation (⌘K search, arrow keys)
- ✅ Smooth animations
- ✅ Loading states for async operations
- ✅ Error handling with user-friendly messages
- ✅ Accessibility (WCAG 2.1 AA)

---

## 🔮 Future Enhancements (Post-MVP)

1. **Interactive Code Playgrounds** - Run code examples in browser
2. **Video Tutorials** - Embed video explanations
3. **Quizzes** - Test understanding
4. **User Accounts** - Save progress, bookmarks
5. **Comments/Discussion** - Community engagement
6. **Multi-language Support** - i18n for content
7. **Real-time Collaboration** - Shared learning sessions
8. **AI Assistant** - Answer questions about content

---

## 📝 Summary

This plan delivers:
- ✅ **Next.js 15** with App Router and RSC
- ✅ **Mock API from day one** (no broken links)
- ✅ **Beautiful markdown rendering** with code highlighting
- ✅ **Search functionality** (upgradeable to Algolia later)
- ✅ **Dark/light themes** matching design specs
- ✅ **Progressive enhancement** (mock → file system → real API)
- ✅ **6-week timeline** to production deployment

---

**Created:** 2025-10-20
**Version:** 1.0
**Status:** Ready for implementation
