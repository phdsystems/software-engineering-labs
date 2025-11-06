import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const DOC_DIR = join(process.cwd(), '..', 'doc')

describe('Index Files Integration Tests', () => {
  describe('doc/overview.md', () => {
    const overviewPath = join(DOC_DIR, 'overview.md')

    it('should exist in doc/ directory', () => {
      expect(existsSync(overviewPath)).toBe(true)
    })

    it('should have proper header structure', () => {
      if (existsSync(overviewPath)) {
        const content = readFileSync(overviewPath, 'utf-8')

        expect(content).toContain('# Documentation Overview')
        expect(content).toContain('Purpose:')
        expect(content).toContain('SDLC')
      }
    })

    it('should reference all 8 SDLC phases', () => {
      if (existsSync(overviewPath)) {
        const content = readFileSync(overviewPath, 'utf-8')

        const phases = [
          'Phase 0: Foundation',
          'Phase 1: Planning',
          'Phase 2: Analysis',
          'Phase 3: Design',
          'Phase 4: Development',
          'Phase 5: Testing',
          'Phase 6: Deployment',
          'Phase 7: Maintenance'
        ]

        phases.forEach(phase => {
          expect(content).toContain(phase)
        })
      }
    })

    it('should have quick navigation table', () => {
      if (existsSync(overviewPath)) {
        const content = readFileSync(overviewPath, 'utf-8')

        expect(content).toContain('Quick Navigation')
        expect(content).toContain('You Want To...')
        expect(content).toContain('Go Here')
      }
    })

    it('should link to phase guides', () => {
      if (existsSync(overviewPath)) {
        const content = readFileSync(overviewPath, 'utf-8')

        const guideLinks = [
          'foundation-guide',
          'planning-guide',
          'design-guide',
          'developer-guide'
        ]

        guideLinks.forEach(guide => {
          expect(content).toContain(guide)
        })
      }
    })

    it('should reference documentation-index.md', () => {
      if (existsSync(overviewPath)) {
        const content = readFileSync(overviewPath, 'utf-8')

        expect(content).toContain('documentation-index.md')
        expect(content).toContain('Documentation Index')
      }
    })

    it('should have learning paths section', () => {
      if (existsSync(overviewPath)) {
        const content = readFileSync(overviewPath, 'utf-8')

        expect(content).toContain('Learning Paths')
        expect(content).toContain('Beginner')
        expect(content).toContain('Intermediate')
        expect(content).toContain('Senior')
      }
    })
  })

  describe('doc/documentation-index.md', () => {
    const indexPath = join(DOC_DIR, 'documentation-index.md')

    it('should exist in doc/ directory', () => {
      expect(existsSync(indexPath)).toBe(true)
    })

    it('should have proper header structure', () => {
      if (existsSync(indexPath)) {
        const content = readFileSync(indexPath, 'utf-8')

        expect(content).toContain('# Documentation Index')
        expect(content).toContain('Purpose:')
        expect(content).toContain('Complete file catalog')
      }
    })

    it('should have quick navigation section', () => {
      if (existsSync(indexPath)) {
        const content = readFileSync(indexPath, 'utf-8')

        expect(content).toContain('Quick Navigation')
        expect(content).toContain('Use Case')
      }
    })

    it('should list all SDLC phases', () => {
      if (existsSync(indexPath)) {
        const content = readFileSync(indexPath, 'utf-8')

        const phases = [
          'Phase 0: Foundation',
          'Phase 1: Planning',
          'Phase 2: Analysis',
          'Phase 3: Design',
          'Phase 4: Development',
          'Phase 5: Testing',
          'Phase 6: Deployment',
          'Phase 7: Maintenance'
        ]

        phases.forEach(phase => {
          expect(content).toContain(phase)
        })
      }
    })

    it('should have file statistics', () => {
      if (existsSync(indexPath)) {
        const content = readFileSync(indexPath, 'utf-8')

        expect(content).toContain('Documentation Statistics')
        expect(content).toContain('Total Files')
        expect(content).toContain('markdown files')
      }
    })

    it('should have complete file catalog', () => {
      if (existsSync(indexPath)) {
        const content = readFileSync(indexPath, 'utf-8')

        expect(content).toContain('Complete File Catalog')
        expect(content).toContain('File')
        expect(content).toContain('Size')
        expect(content).toContain('Purpose')
      }
    })

    it('should have use case-driven paths', () => {
      if (existsSync(indexPath)) {
        const content = readFileSync(indexPath, 'utf-8')

        expect(content).toContain('Use Case-Driven Paths')
        expect(content).toContain('New to Software Engineering')
        expect(content).toContain('Learn Architecture')
      }
    })

    it('should reference overview.md', () => {
      if (existsSync(indexPath)) {
        const content = readFileSync(indexPath, 'utf-8')

        expect(content).toContain('overview.md')
        expect(content).toContain('Documentation Overview')
      }
    })

    it('should have quick reference by topic', () => {
      if (existsSync(indexPath)) {
        const content = readFileSync(indexPath, 'utf-8')

        expect(content).toContain('Quick Reference by Topic')

        const topics = [
          'Design Principles',
          'Design Patterns',
          'Architecture Patterns',
          'Programming Languages'
        ]

        topics.forEach(topic => {
          expect(content).toContain(topic)
        })
      }
    })
  })

  describe('Index Files Cross-Reference', () => {
    it('should have bidirectional links between overview and index', () => {
      const overviewPath = join(DOC_DIR, 'overview.md')
      const indexPath = join(DOC_DIR, 'documentation-index.md')

      if (existsSync(overviewPath) && existsSync(indexPath)) {
        const overview = readFileSync(overviewPath, 'utf-8')
        const index = readFileSync(indexPath, 'utf-8')

        // Overview should link to index
        expect(overview).toContain('documentation-index.md')

        // Index should link to overview
        expect(index).toContain('overview.md')
      }
    })

    it('should provide complementary navigation approaches', () => {
      const overviewPath = join(DOC_DIR, 'overview.md')
      const indexPath = join(DOC_DIR, 'documentation-index.md')

      if (existsSync(overviewPath) && existsSync(indexPath)) {
        const overview = readFileSync(overviewPath, 'utf-8')
        const index = readFileSync(indexPath, 'utf-8')

        // Overview: SDLC-organized
        expect(overview).toContain('SDLC')
        expect(overview).toContain('Phase')

        // Index: File catalog with metadata
        expect(index).toContain('file catalog')
        expect(index).toContain('metadata')
      }
    })
  })

  describe('Assets Directory', () => {
    const assetsPath = join(DOC_DIR, 'assets')

    it('should have assets directory', () => {
      expect(existsSync(assetsPath)).toBe(true)
    })

    it('should have diagram-index.md in assets', () => {
      const diagramIndexPath = join(assetsPath, 'diagram-index.md')

      if (existsSync(diagramIndexPath)) {
        expect(existsSync(diagramIndexPath)).toBe(true)
      }
    })

    it('should have SVG diagrams in assets', () => {
      if (existsSync(assetsPath)) {
        const content = readFileSync(join(DOC_DIR, 'documentation-index.md'), 'utf-8')

        const diagrams = [
          'architecture-diagram.svg',
          'ui-layout-mockup.svg',
          'user-flow-diagram.svg'
        ]

        diagrams.forEach(diagram => {
          expect(content).toContain(diagram)
        })
      }
    })
  })

  describe('README Compliance', () => {
    it('should not have README.md in doc/ subdirectories', () => {
      const subdirs = [
        '0-foundation',
        '1-planning',
        '2-analysis',
        '3-design',
        '4-development',
        '5-testing',
        '6-deployment',
        '7-maintenance'
      ]

      subdirs.forEach(subdir => {
        const readmePath = join(DOC_DIR, subdir, 'README.md')
        expect(existsSync(readmePath)).toBe(false)
      })
    })

    it('should have phase guides instead of READMEs', () => {
      const guideFiles = [
        '0-foundation/foundation-guide.md',
        '1-planning/planning-guide.md',
        '2-analysis/analysis-guide.md',
        '3-design/design-guide.md',
        '4-development/developer-guide.md',
        '5-testing/testing-guide.md',
        '6-deployment/deployment-guide.md',
        '7-maintenance/operations-guide.md'
      ]

      guideFiles.forEach(guide => {
        const guidePath = join(DOC_DIR, guide)
        expect(existsSync(guidePath)).toBe(true)
      })
    })

    it('should not have README.md in example directory', () => {
      const exampleReadme = join(DOC_DIR, '4-development', 'example', 'README.md')
      expect(existsSync(exampleReadme)).toBe(false)
    })

    it('should have examples-overview.md instead of README', () => {
      const examplesOverview = join(DOC_DIR, '4-development', 'example', 'examples-overview.md')
      expect(existsSync(examplesOverview)).toBe(true)
    })
  })

  describe('Version and Metadata', () => {
    it('should have version info in overview.md', () => {
      const overviewPath = join(DOC_DIR, 'overview.md')

      if (existsSync(overviewPath)) {
        const content = readFileSync(overviewPath, 'utf-8')

        expect(content).toContain('Last Updated')
        expect(content).toContain('Version')
      }
    })

    it('should have version info in documentation-index.md', () => {
      const indexPath = join(DOC_DIR, 'documentation-index.md')

      if (existsSync(indexPath)) {
        const content = readFileSync(indexPath, 'utf-8')

        expect(content).toContain('Last Updated')
        expect(content).toContain('Version')
      }
    })

    it('should have organization info', () => {
      const overviewPath = join(DOC_DIR, 'overview.md')

      if (existsSync(overviewPath)) {
        const content = readFileSync(overviewPath, 'utf-8')

        expect(content).toContain('PHD Systems')
        expect(content).toContain('PHD Labs')
      }
    })
  })
})
