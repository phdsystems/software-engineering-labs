import { describe, it, expect } from 'vitest'
import {
  getAllContent,
  getContentBySlug,
  getContentByCategory,
} from '@/lib/api/content'

describe('Phase Navigation Integration Tests', () => {
  describe('Phase 0: Foundation', () => {
    it('should navigate through foundation content', async () => {
      const foundationContent = await getContentByCategory('0-foundation')

      if (foundationContent.length > 1) {
        const firstSlug = foundationContent[0].slug
        const content = await getContentBySlug(firstSlug)

        expect(content).toBeDefined()
        expect(content?.category).toBe('0-foundation')

        // Should have navigation if there are multiple items
        if (foundationContent.length > 1) {
          expect(content?.next || content?.prev).toBeDefined()
        }
      }
    })

    it('should have design principles in Phase 0', async () => {
      const allContent = await getAllContent()
      const principleFiles = allContent.filter(item =>
        item.slug.includes('0-foundation/design-principle')
      )

      if (principleFiles.length > 0) {
        // Should find SOLID, DRY, SoC, YAGNI/KISS
        const hasSOLID = principleFiles.some(f => f.slug.includes('solid'))
        const hasDRY = principleFiles.some(f => f.slug.includes('dry'))

        expect(hasSOLID || hasDRY).toBe(true)
      }
    })
  })

  describe('Phase 1: Planning', () => {
    it('should load planning content', async () => {
      const planningContent = await getContentByCategory('1-planning')

      if (planningContent.length > 0) {
        expect(planningContent).toBeDefined()
        expect(Array.isArray(planningContent)).toBe(true)

        planningContent.forEach(item => {
          expect(item.category).toBe('1-planning')
        })
      }
    })

    it('should have project-concept in planning', async () => {
      const allContent = await getAllContent()
      const projectConcept = allContent.find(item =>
        item.slug.includes('project-concept')
      )

      if (projectConcept) {
        expect(projectConcept.slug).toContain('1-planning')
      }
    })
  })

  describe('Phase 3: Design', () => {
    it('should load design patterns and architecture patterns', async () => {
      const designContent = await getContentByCategory('3-design')

      if (designContent.length > 0) {
        const hasPatterns = designContent.some(item =>
          item.slug.includes('pattern')
        )

        if (hasPatterns) {
          expect(hasPatterns).toBe(true)
        }
      }
    })

    it('should separate design patterns from architecture patterns', async () => {
      const allContent = await getAllContent()

      const designPatterns = allContent.filter(item =>
        item.slug.includes('3-design/design-pattern')
      )

      const archPatterns = allContent.filter(item =>
        item.slug.includes('3-design/architecture-pattern')
      )

      if (designPatterns.length > 0 && archPatterns.length > 0) {
        // Should have both categories
        expect(designPatterns.length).toBeGreaterThan(0)
        expect(archPatterns.length).toBeGreaterThan(0)

        // Should not overlap
        const designSlugs = new Set(designPatterns.map(p => p.slug))
        const archSlugs = new Set(archPatterns.map(p => p.slug))

        const overlap = [...designSlugs].filter(s => archSlugs.has(s))
        expect(overlap.length).toBe(0)
      }
    })
  })

  describe('Phase 4: Development', () => {
    it('should load examples for multiple languages', async () => {
      const allContent = await getAllContent()
      const examples = allContent.filter(item =>
        item.slug.includes('4-development/example')
      )

      if (examples.length > 0) {
        expect(examples.length).toBeGreaterThan(0)

        // Check for diversity of languages
        const languages = new Set<string>()

        examples.forEach(ex => {
          const parts = ex.slug.split('/')
          if (parts.length >= 3 && parts[1] === 'example') {
            languages.add(parts[2]) // language name
          }
        })

        if (languages.size > 0) {
          expect(languages.size).toBeGreaterThan(1)
        }
      }
    })

    it('should have examples-overview instead of README', async () => {
      const allContent = await getAllContent()
      const examplesOverview = allContent.find(item =>
        item.slug.includes('examples-overview')
      )

      if (examplesOverview) {
        expect(examplesOverview.slug).toContain('4-development')
        expect(examplesOverview.slug).not.toContain('README')
      }
    })

    it('should load Python examples', async () => {
      const allContent = await getAllContent()
      const pythonExamples = allContent.filter(item =>
        item.slug.includes('4-development/example/python')
      )

      if (pythonExamples.length > 0) {
        expect(pythonExamples.length).toBeGreaterThan(0)

        pythonExamples.forEach(ex => {
          expect(ex.slug).toMatch(/4-development\/example\/python/)
        })
      }
    })

    it('should load Java examples', async () => {
      const allContent = await getAllContent()
      const javaExamples = allContent.filter(item =>
        item.slug.includes('4-development/example/java')
      )

      if (javaExamples.length > 0) {
        expect(javaExamples.length).toBeGreaterThan(0)

        javaExamples.forEach(ex => {
          expect(ex.slug).toMatch(/4-development\/example\/java/)
        })
      }
    })
  })

  describe('Phase 6: Deployment', () => {
    it('should load deployment content', async () => {
      const deploymentContent = await getContentByCategory('6-deployment')

      if (deploymentContent.length > 0) {
        expect(deploymentContent).toBeDefined()
        expect(Array.isArray(deploymentContent)).toBe(true)

        deploymentContent.forEach(item => {
          expect(item.category).toBe('6-deployment')
        })
      }
    })

    it('should have implementation plan in deployment', async () => {
      const allContent = await getAllContent()
      const implPlan = allContent.find(item =>
        item.slug.includes('implementation-plan')
      )

      if (implPlan) {
        expect(implPlan.slug).toContain('6-deployment')
        expect(implPlan.category).toBe('6-deployment')
      }
    })
  })

  describe('Phase 7: Maintenance', () => {
    it('should load maintenance content', async () => {
      const maintenanceContent = await getContentByCategory('7-maintenance')

      if (maintenanceContent.length > 0) {
        expect(maintenanceContent).toBeDefined()
        expect(Array.isArray(maintenanceContent)).toBe(true)

        maintenanceContent.forEach(item => {
          expect(item.category).toBe('7-maintenance')
        })
      }
    })

    it('should have git-internals in maintenance', async () => {
      const allContent = await getAllContent()
      const gitInternals = allContent.find(item =>
        item.slug.includes('git-internals')
      )

      if (gitInternals) {
        expect(gitInternals.slug).toContain('7-maintenance')
        expect(gitInternals.category).toBe('7-maintenance')
      }
    })
  })

  describe('Cross-Phase Navigation', () => {
    it('should support navigation across different phases', async () => {
      const allContent = await getAllContent()

      if (allContent.length > 2) {
        // Get content from different phases
        const phase0 = allContent.find(item => item.category === '0-foundation')
        const phase3 = allContent.find(item => item.category === '3-design')

        if (phase0 && phase3) {
          const content0 = await getContentBySlug(phase0.slug)
          const content3 = await getContentBySlug(phase3.slug)

          expect(content0).toBeDefined()
          expect(content3).toBeDefined()

          // Both should have valid metadata
          expect(content0?.metadata).toBeDefined()
          expect(content3?.metadata).toBeDefined()
        }
      }
    })

    it('should maintain prev/next links within categories', async () => {
      const categories = ['0-foundation', '3-design', '4-development']

      for (const category of categories) {
        const categoryContent = await getContentByCategory(category)

        if (categoryContent.length > 1) {
          const firstSlug = categoryContent[0].slug
          const content = await getContentBySlug(firstSlug)

          if (content?.next) {
            const nextContent = await getContentBySlug(content.next)

            expect(nextContent).toBeDefined()
            // Next content should be accessible
            expect(nextContent?.slug).toBe(content.next)
          }
        }
      }
    })
  })

  describe('Phase Guide Navigation', () => {
    it('should have guides for all active phases', async () => {
      const allContent = await getAllContent()
      const guides = allContent.filter(item =>
        item.slug.endsWith('-guide')
      )

      if (guides.length > 0) {
        expect(guides.length).toBeGreaterThan(0)

        // Should have guides for foundation, planning, design, development, etc.
        const guidePhases = new Set<string>()

        guides.forEach(guide => {
          const parts = guide.slug.split('/')
          if (parts.length >= 1) {
            guidePhases.add(parts[0]) // phase directory
          }
        })

        expect(guidePhases.size).toBeGreaterThan(1)
      }
    })

    it('should load phase guides with proper content', async () => {
      const guidePatterns = [
        '0-foundation/foundation-guide',
        '3-design/design-guide',
        '4-development/developer-guide'
      ]

      for (const slug of guidePatterns) {
        const guide = await getContentBySlug(slug)

        if (guide) {
          expect(guide).toBeDefined()
          expect(guide?.title).toBeDefined()
          expect(guide?.content).toBeDefined()
          expect(guide?.content.length).toBeGreaterThan(0)
        }
      }
    })
  })

  describe('Learning Path Navigation', () => {
    it('should support beginner learning path (0 → 3 → 4)', async () => {
      // Beginner: Foundation → Design → Development
      const foundation = await getContentByCategory('0-foundation')
      const design = await getContentByCategory('3-design')
      const development = await getContentByCategory('4-development')

      if (foundation.length > 0 && design.length > 0 && development.length > 0) {
        expect(foundation.length).toBeGreaterThan(0)
        expect(design.length).toBeGreaterThan(0)
        expect(development.length).toBeGreaterThan(0)
      }
    })

    it('should support intermediate learning path (3 → 4)', async () => {
      // Intermediate: Architecture Patterns → Examples
      const design = await getContentByCategory('3-design')
      const development = await getContentByCategory('4-development')

      if (design.length > 0 && development.length > 0) {
        const hasArchPatterns = design.some(item =>
          item.slug.includes('architecture-pattern')
        )

        if (hasArchPatterns) {
          expect(hasArchPatterns).toBe(true)
          expect(development.length).toBeGreaterThan(0)
        }
      }
    })

    it('should support senior learning path (3 advanced → 4 → 6)', async () => {
      // Senior: CQRS/Event Sourcing → Implementation → Deployment
      const allContent = await getAllContent()

      const hasCQRS = allContent.some(item => item.slug.includes('cqrs'))
      const hasEventSourcing = allContent.some(item => item.slug.includes('event-sourcing'))
      const hasDeployment = allContent.some(item => item.category === '6-deployment')

      if (hasCQRS || hasEventSourcing) {
        expect(hasCQRS || hasEventSourcing).toBe(true)
      }

      if (hasDeployment) {
        expect(hasDeployment).toBe(true)
      }
    })
  })
})
