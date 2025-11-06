import Link from 'next/link'
import { Book, FileText, Layers, Code } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getAllContent, getCategories } from '@/lib/api/content'

export default async function LearnHomePage() {
  const categories = await getCategories()
  const recentContent = (await getAllContent()).slice(0, 6)

  return (
    <div className="container py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Learn Software Engineering
        </h1>
        <p className="text-xl text-muted-foreground">
          Master software engineering from first principles to distributed systems
        </p>
      </div>

      {/* Categories */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/learn/guide/first-principles-approach">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Book className="h-5 w-5 text-primary" />
                  <CardTitle>Getting Started</CardTitle>
                </div>
                <CardDescription>
                  Learn the philosophy and fundamentals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  First principles approach and learning paths
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/learn/design-principle/overview">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle>Design Principles</CardTitle>
                </div>
                <CardDescription>
                  SOLID, DRY, KISS, and more
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Foundation of software design
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/learn/design-pattern/overview">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Layers className="h-5 w-5 text-primary" />
                  <CardTitle>Design Patterns</CardTitle>
                </div>
                <CardDescription>
                  Gang of Four and modern patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Tactical solutions to common problems
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/learn/architecture-pattern/overview">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Layers className="h-5 w-5 text-primary" />
                  <CardTitle>Architecture Patterns</CardTitle>
                </div>
                <CardDescription>
                  System-level design patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Clean Architecture, Microservices, Event-Driven, CQRS
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/learn/example/overview">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Code className="h-5 w-5 text-primary" />
                  <CardTitle>Code Examples</CardTitle>
                </div>
                <CardDescription>
                  Multi-language implementations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Python, Java, Kotlin, TypeScript, Go, Rust, Groovy
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Learning Paths */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Learning Paths</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Beginner (0-2 years)</CardTitle>
              <CardDescription>40 hours · 4 modules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Design Principles → Design Patterns → Clean Architecture
              </p>
              <Link
                href="/learn?path=beginner"
                className="inline-flex items-center text-sm font-medium text-primary hover:underline"
              >
                View path →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Intermediate (2-5 years)</CardTitle>
              <CardDescription>60 hours · 2 modules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Architecture Patterns → Microservices → Event-Driven
              </p>
              <Link
                href="/learn?path=intermediate"
                className="inline-flex items-center text-sm font-medium text-primary hover:underline"
              >
                View path →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Advanced (5+ years)</CardTitle>
              <CardDescription>50 hours · 1 module</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                CQRS → Event Sourcing → Distributed Systems
              </p>
              <Link
                href="/learn?path=advanced"
                className="inline-flex items-center text-sm font-medium text-primary hover:underline"
              >
                View path →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Start Learning CTA */}
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Begin?</h2>
        <p className="text-muted-foreground mb-6">
          Start with first principles and build your way up to distributed systems
        </p>
        <Link
          href="/learn/guide/first-principles-approach"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Start with First Principles
        </Link>
      </div>
    </div>
  )
}
