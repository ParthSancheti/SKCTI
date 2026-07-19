"use client";

/* Skeletons match the exact geometry of incoming content — no spinners. */
export function ChapterSkeleton() {
  return (
    <div className="glassy rounded-glass p-8 space-y-4">
      <div className="flex items-center gap-4">
        <div className="skeleton w-12 h-12 rounded-input" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-2/3 rounded-full" />
          <div className="skeleton h-3 w-1/3 rounded-full" />
        </div>
        <div className="skeleton h-7 w-24 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-11 rounded-full" />
        ))}
      </div>
    </div>
  );
}

export function TestSkeleton() {
  return (
    <div className="glassy rounded-glass p-8 flex items-center gap-4">
      <div className="skeleton w-12 h-12 rounded-input" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-3/4 rounded-full" />
        <div className="skeleton h-3 w-1/2 rounded-full" />
      </div>
      <div className="skeleton h-10 w-24 rounded-full" />
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="glassy rounded-glass p-6 flex items-center gap-4">
      <div className="skeleton w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-1/2 rounded-full" />
      </div>
      <div className="skeleton h-4 w-12 rounded-full" />
    </div>
  );
}
