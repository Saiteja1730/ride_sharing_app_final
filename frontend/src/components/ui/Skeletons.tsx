export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="glass-card p-5 space-y-3 animate-pulse">
      <div className="skeleton h-5 w-2/5 rounded-lg" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton h-3 rounded-lg ${i === lines - 1 ? 'w-3/5' : 'w-full'}`} />
      ))}
    </div>
  );
}

export function RideCardSkeleton() {
  return (
    <div className="glass-card p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton h-4 w-32 rounded-lg" />
        <div className="skeleton h-5 w-20 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="skeleton w-3 h-3 rounded-full" />
          <div className="skeleton h-3 w-3/4 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <div className="skeleton w-3 h-3 rounded-full" />
          <div className="skeleton h-3 w-2/3 rounded-lg" />
        </div>
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
        <div className="skeleton h-5 w-16 rounded-lg" />
        <div className="skeleton h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass-card p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-2">
        <div className="skeleton w-10 h-10 rounded-xl" />
        <div className="skeleton h-4 w-24 rounded-lg" />
      </div>
      <div className="skeleton h-8 w-20 rounded-lg mt-3" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-12 w-full rounded-xl" />
      ))}
    </div>
  );
}
