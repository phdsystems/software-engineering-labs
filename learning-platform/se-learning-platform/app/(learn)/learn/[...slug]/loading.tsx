import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-8 max-w-7xl mx-auto">
        {/* Main Content Skeleton */}
        <div className="min-w-0">
          {/* Breadcrumbs Skeleton */}
          <div className="mb-6 flex items-center space-x-2">
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Header Skeleton */}
          <div className="mb-8 space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-full" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          {/* Content Card Skeleton */}
          <Card className="mb-8">
            <CardContent className="p-8 space-y-4">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />

              <div className="space-y-2 pt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>

              {/* Code Block Skeleton */}
              <div className="mt-6">
                <Skeleton className="h-32 w-full" />
              </div>

              <div className="space-y-2 pt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* TOC Sidebar Skeleton */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-2">
            <Skeleton className="h-5 w-32 mb-4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </aside>
      </div>
    </div>
  )
}
