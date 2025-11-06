import Link from 'next/link'
import { ArrowRight, Book, Code, Layers, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="container py-12 md:py-24 lg:py-32">
      {/* Hero Section */}
      <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold leading-tight tracking-tighter md:text-6xl lg:text-7xl lg:leading-[1.1]">
          Software Engineering
          <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {' '}from First Principles
          </span>
        </h1>
        <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
          Learn software engineering from fundamental truths to complex distributed systems.
          Master SOLID principles, design patterns, clean architecture, and modern architectures.
        </p>
        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link href="/learn">
              Start Learning
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/learn/guide/first-principles-approach">
              First Principles
            </Link>
          </Button>
        </div>
      </div>

      {/* Learning Paths */}
      <div className="mx-auto mt-24 max-w-[980px]">
        <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">
          Choose Your Learning Path
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Beginner (0-2 years)</CardTitle>
              <CardDescription>
                Start with fundamentals and build strong foundations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="mr-2 text-primary">→</span>
                  <span>Design Principles (SOLID, DRY, KISS)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">→</span>
                  <span>Design Patterns (Gang of Four)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">→</span>
                  <span>Clean Architecture Basics</span>
                </li>
              </ul>
              <Button asChild variant="outline" className="mt-4 w-full">
                <Link href="/learn?path=beginner">View Path</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Intermediate (2-5 years)</CardTitle>
              <CardDescription>
                Master architecture patterns and distributed systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="mr-2 text-primary">→</span>
                  <span>Architecture Patterns</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">→</span>
                  <span>Microservices & Event-Driven</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">→</span>
                  <span>Cloud-Native Patterns</span>
                </li>
              </ul>
              <Button asChild variant="outline" className="mt-4 w-full">
                <Link href="/learn?path=intermediate">View Path</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Advanced (5+ years)</CardTitle>
              <CardDescription>
                Deep dive into CQRS, Event Sourcing, and more
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="mr-2 text-primary">→</span>
                  <span>CQRS Pattern</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">→</span>
                  <span>Event Sourcing</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">→</span>
                  <span>Distributed Systems</span>
                </li>
              </ul>
              <Button asChild variant="outline" className="mt-4 w-full">
                <Link href="/learn?path=advanced">View Path</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features */}
      <div className="mx-auto mt-24 max-w-[980px]">
        <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">
          Why Learn Here?
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Book className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-semibold">First Principles</h3>
            <p className="text-sm text-muted-foreground">
              Learn from fundamental truths, not by analogy
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Code className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-semibold">Multi-Language</h3>
            <p className="text-sm text-muted-foreground">
              Examples in 7 languages: Python, Java, Kotlin, Go, Rust, TypeScript, Groovy
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-semibold">Progressive</h3>
            <p className="text-sm text-muted-foreground">
              From principles to patterns to architecture
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-semibold">Production-Ready</h3>
            <p className="text-sm text-muted-foreground">
              Real-world examples and best practices
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mx-auto mt-24 max-w-[980px] text-center">
        <div className="rounded-lg border border-border bg-card p-8">
          <h2 className="mb-4 text-3xl font-bold">Ready to Start?</h2>
          <p className="mb-6 text-muted-foreground">
            Begin your journey from first principles to distributed systems
          </p>
          <Button asChild size="lg">
            <Link href="/learn">
              Start Learning Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
