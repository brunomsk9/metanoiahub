import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

// Dashboard skeleton with multiple sections
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto lg:max-w-none animate-fade-in">
      {/* Greeting skeleton */}
      <header className="pt-2">
        <Skeleton className="h-4 w-12 mb-1" />
        <Skeleton className="h-6 w-32" />
      </header>

      {/* Verse skeleton */}
      <section className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-40 rounded-xl" />
      </section>

      {/* Stats skeleton */}
      <section className="space-y-4">
        <Skeleton className="h-3 w-16" />
        <div className="flex gap-3">
          <Skeleton className="flex-1 h-16 rounded-lg" />
          <Skeleton className="flex-1 h-16 rounded-lg" />
        </div>
        
        {/* Habits skeleton */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-8" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-12 flex-1 rounded-lg" />
            <Skeleton className="h-12 flex-1 rounded-lg" />
          </div>
        </div>
      </section>

      {/* Collapsible sections skeleton */}
      <section className="space-y-3">
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
      </section>
    </div>
  );
}

// Tracks page skeleton
export function TracksSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb skeleton */}
      <Skeleton className="h-5 w-24" />
      
      {/* Filters skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
      
      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-[16/10] w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Library page skeleton
export function LibrarySkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb skeleton */}
      <Skeleton className="h-5 w-24" />
      
      {/* Search skeleton */}
      <div className="max-w-md mx-auto">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      
      {/* Tabs skeleton */}
      <div className="max-w-md mx-auto">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      
      {/* Grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-[16/9] w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 flex-1 rounded" />
                <Skeleton className="h-8 w-16 rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Discipleship page skeleton
export function DiscipleshipSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb skeleton */}
      <Skeleton className="h-5 w-24" />
      
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-7 w-7 rounded" />
        <Skeleton className="h-8 w-40" />
      </div>
      <Skeleton className="h-4 w-64" />
      
      {/* Cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </Card>
        ))}
      </div>
      
      {/* Table skeleton */}
      <Card className="p-4">
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </Card>
    </div>
  );
}

// Ministry page skeleton
export function MinistrySkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb skeleton */}
      <Skeleton className="h-5 w-24" />
      
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-7 w-7 rounded" />
        <Skeleton className="h-8 w-32" />
      </div>
      <Skeleton className="h-4 w-52" />
      
      {/* Tabs skeleton */}
      <Skeleton className="h-10 w-64 rounded-lg" />
      
      {/* Content skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Generic card list skeleton
export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-8 w-20 rounded" />
          </div>
        </Card>
      ))}
    </div>
  );
}

// Full page loading skeleton with AppShell placeholder
export function FullPageSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-12 h-12 rounded-xl bg-primary/20 animate-pulse" />
    </div>
  );
}
