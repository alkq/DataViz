'use client';

/** Shimmer skeleton block. Animates a subtle sweep so loads feel alive. */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-gray-200/70 dark:bg-slate-700/50 ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10" />
    </div>
  );
}

/** A grid of dataset-card skeletons. */
export function DatasetCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-3 w-24" />
        </div>
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-2/3" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-7 w-20 rounded-lg" />
        <Skeleton className="h-7 w-16 rounded-lg" />
      </div>
    </div>
  );
}

/** A stat-card skeleton (dashboard). */
export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-20" />
    </div>
  );
}

/**
 * Shimmer keyframes injected once. Tailwind's default doesn't ship `shimmer`,
 * so we define it here and reference it in <Skeleton />.
 */
export function SkeletonStyles() {
  return (
    <style jsx global>{`
      @keyframes shimmer {
        100% { transform: translateX(100%); }
      }
    `}</style>
  );
}
