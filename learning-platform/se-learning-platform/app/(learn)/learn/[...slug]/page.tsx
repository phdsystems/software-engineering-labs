import { notFound } from 'next/navigation'
import { getAllContent, getContentBySlug } from '@/lib/api/content'
import { Card, CardContent } from '@/components/ui/card'
import { MarkdownRenderer } from '@/components/markdown/markdown-renderer'
import { TableOfContents } from '@/components/markdown/table-of-contents'
import { MobileTOC } from '@/components/markdown/mobile-toc'

export async function generateStaticParams() {
  const allContent = await getAllContent()

  return allContent.map((content) => ({
    slug: content.slug.split('/'),
  }))
}

interface PageProps {
  params: Promise<{
    slug: string[]
  }>
}

export default async function ContentPage({ params }: PageProps) {
  const resolvedParams = await params
  const slug = resolvedParams.slug.join('/')
  const content = await getContentBySlug(slug)

  if (!content) {
    notFound()
  }

  return (
    <>
      {/* Mobile TOC Floating Button */}
      <MobileTOC items={content.toc} />

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-8 max-w-7xl mx-auto">
        {/* Main Content */}
        <div className="min-w-0">
          {/* Breadcrumbs */}
          <div className="mb-6 flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Learn</span>
            <span>→</span>
            <span className="capitalize">{content.category.replace('-', ' ')}</span>
            <span>→</span>
            <span className="text-foreground">{content.title}</span>
          </div>

          {/* Content Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">{content.title}</h1>
            <p className="text-xl text-muted-foreground mb-4">
              {content.description}
            </p>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>{content.metadata.readingTime} min read</span>
              <span>·</span>
              <span>Updated {content.metadata.lastUpdated}</span>
              {content.metadata.difficulty && (
                <>
                  <span>·</span>
                  <span className="capitalize">{content.metadata.difficulty}</span>
                </>
              )}
            </div>
          </div>

          {/* Content */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <MarkdownRenderer content={content.content} />
            </CardContent>
          </Card>

          {/* Tags */}
          {content.metadata.tags && content.metadata.tags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {content.metadata.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-md bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between border-t border-border pt-8">
            {content.prev ? (
              <a
                href={`/learn/${content.prev}`}
                className="flex items-center text-sm font-medium text-primary hover:underline"
              >
                ← Previous
              </a>
            ) : (
              <div />
            )}
            {content.next ? (
              <a
                href={`/learn/${content.next}`}
                className="flex items-center text-sm font-medium text-primary hover:underline"
              >
                Next →
              </a>
            ) : (
              <div />
            )}
          </div>
        </div>

        {/* Table of Contents Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <TableOfContents items={content.toc} />
          </div>
        </aside>
      </div>
    </div>
    </>
  )
}
