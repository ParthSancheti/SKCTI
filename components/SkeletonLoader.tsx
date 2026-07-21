"use client";

/* Skeletons match the exact geometry of incoming content — no spinners. */
export function ChapterSkeleton() {
  return (
    <div className="bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-4 shadow-xl">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/10 animate-pulse border border-white/5 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 bg-white/10 animate-pulse border border-white/5 rounded-full" />
          <div className="h-3 w-1/3 bg-white/10 animate-pulse border border-white/5 rounded-full" />
        </div>
        <div className="h-7 w-24 bg-white/10 animate-pulse border border-white/5 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-11 bg-white/10 animate-pulse border border-white/5 rounded-full" />
        ))}
      </div>
    </div>
  );
}

export function TestSkeleton() {
  return (
    <div className="bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex items-center gap-4 shadow-xl">
      <div className="w-12 h-12 bg-white/10 animate-pulse border border-white/5 rounded-2xl" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 bg-white/10 animate-pulse border border-white/5 rounded-full" />
        <div className="h-3 w-1/2 bg-white/10 animate-pulse border border-white/5 rounded-full" />
      </div>
      <div className="h-10 w-24 bg-white/10 animate-pulse border border-white/5 rounded-full" />
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-center gap-4 mx-6 shadow-md">
      <div className="w-10 h-10 bg-white/10 animate-pulse border border-white/5 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/2 bg-white/10 animate-pulse border border-white/5 rounded-full" />
      </div>
      <div className="h-4 w-12 bg-white/10 animate-pulse border border-white/5 rounded-full" />
    </div>
  );
}
