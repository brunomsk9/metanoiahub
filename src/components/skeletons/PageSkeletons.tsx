import { Skeleton } from "@/components/ui/skeleton";

// Dashboard skeleton with multiple sections
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto lg:max-w-none animate-fade-in section-pattern">
      {/* Greeting skeleton */}
      <header className="pt-2">
        <Skeleton className="h-4 w-12 mb-1" />
        <Skeleton className="h-6 w-32" />
      </header>

      {/* Verse skeleton */}
      <section className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <div className="glass-effect rounded-xl p-4">
          <Skeleton className="h-32 rounded-lg" />
        </div>
      </section>

      {/* Stats skeleton */}
      <section className="space-y-4">
        <Skeleton className="h-3 w-16" />
        <div className="flex gap-3">
          <div className="flex-1 glass-effect rounded-lg p-4">
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="flex-1 glass-effect rounded-lg p-4">
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
        
        {/* Habits skeleton */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-8" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1 glass-effect rounded-lg p-3">
              <Skeleton className="h-6 w-full" />
            </div>
            <div className="flex-1 glass-effect rounded-lg p-3">
              <Skeleton className="h-6 w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Collapsible sections skeleton */}
      <section className="space-y-3">
        <div className="glass-effect rounded-lg p-3">
          <Skeleton className="h-6 w-full" />
        </div>
        <div className="glass-effect rounded-lg p-3">
          <Skeleton className="h-6 w-full" />
        </div>
        <div className="glass-effect rounded-lg p-3">
          <Skeleton className="h-6 w-full" />
        </div>
      </section>
    </div>
  );
}

// Tracks page skeleton
export function TracksSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in section-pattern">
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
          <div key={i} className="glass-effect rounded-xl overflow-hidden">
            <Skeleton className="aspect-[16/10] w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Library page skeleton
export function LibrarySkeleton() {
  return (
    <div className="space-y-6 animate-fade-in section-pattern">
      {/* Breadcrumb skeleton */}
      <Skeleton className="h-5 w-24" />
      
      {/* Search skeleton */}
      <div className="max-w-md mx-auto">
        <div className="glass-effect rounded-lg p-1">
          <Skeleton className="h-8 w-full rounded" />
        </div>
      </div>
      
      {/* Tabs skeleton */}
      <div className="max-w-md mx-auto">
        <div className="glass-effect rounded-lg p-1">
          <Skeleton className="h-8 w-full rounded" />
        </div>
      </div>
      
      {/* Grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="glass-effect rounded-xl overflow-hidden">
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
          </div>
        ))}
      </div>
    </div>
  );
}

// Discipleship page skeleton
export function DiscipleshipSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in section-pattern">
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
          <div key={i} className="glass-effect rounded-xl p-4">
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
          </div>
        ))}
      </div>
      
      {/* Table skeleton */}
      <div className="glass-effect rounded-xl p-4">
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded" />
          <Skeleton className="h-12 w-full rounded" />
          <Skeleton className="h-12 w-full rounded" />
          <Skeleton className="h-12 w-full rounded" />
        </div>
      </div>
    </div>
  );
}

// Ministry page skeleton
export function MinistrySkeleton() {
  return (
    <div className="space-y-6 animate-fade-in section-pattern">
      {/* Breadcrumb skeleton */}
      <Skeleton className="h-5 w-24" />
      
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-7 w-7 rounded" />
        <Skeleton className="h-8 w-32" />
      </div>
      <Skeleton className="h-4 w-52" />
      
      {/* Tabs skeleton */}
      <div className="glass-effect rounded-lg p-1 w-64">
        <Skeleton className="h-8 w-full rounded" />
      </div>
      
      {/* Content skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-effect rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
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
        <div key={i} className="glass-effect rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-8 w-20 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Full page loading skeleton with AppShell placeholder
export function FullPageSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 animate-pulse" />
    </div>
  );
}
