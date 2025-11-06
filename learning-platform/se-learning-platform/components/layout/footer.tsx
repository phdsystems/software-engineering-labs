import Link from 'next/link'
import { Book } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Book className="h-5 w-5 text-primary" />
              <span className="font-bold">SE Learning</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Software engineering education from first principles to distributed systems.
            </p>
          </div>

          {/* Learning */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Learning</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/learn/guide/first-principles-approach"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  First Principles
                </Link>
              </li>
              <li>
                <Link
                  href="/learn/guide/learning-path"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Learning Paths
                </Link>
              </li>
              <li>
                <Link
                  href="/learn/design-principle/overview"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Design Principles
                </Link>
              </li>
              <li>
                <Link
                  href="/learn/design-pattern/overview"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Design Patterns
                </Link>
              </li>
            </ul>
          </div>

          {/* Architecture */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Architecture</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/learn/architecture-pattern/deep-dive-clean-architecture"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clean Architecture
                </Link>
              </li>
              <li>
                <Link
                  href="/learn/architecture-pattern/deep-dive-microservices"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Microservices
                </Link>
              </li>
              <li>
                <Link
                  href="/learn/architecture-pattern/deep-dive-event-driven"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Event-Driven
                </Link>
              </li>
              <li>
                <Link
                  href="/learn/architecture-pattern/deep-dive-cqrs"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  CQRS & Event Sourcing
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Organization</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/phdsystems"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <Link
                  href="/contributing"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contributing
                </Link>
              </li>
              <li>
                <Link
                  href="/license"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  License (MIT)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>
            © {currentYear} PHD Systems & PHD Labs. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
