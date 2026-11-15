import React from "react";

export function CaregiverPortalSkeleton() {
  return (
    <div className="min-h-screen bg-white text-slate-800 animate-pulse select-none">
      {/* Top Header Skeleton */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-200/80" />
            <div className="space-y-1">
              <div className="w-44 h-4 bg-slate-200/90 rounded" />
              <div className="w-32 h-3 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="w-32 h-8 bg-slate-100 rounded-lg" />
        </div>
      </header>

      {/* Main Container Skeleton */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Row Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="w-24 h-3 bg-slate-200/70 rounded" />
              <div className="w-16 h-8 bg-slate-200/90 rounded" />
            </div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="w-48 h-5 bg-slate-200/90 rounded" />
              <div className="w-64 h-3.5 bg-slate-100 rounded" />
            </div>
            <div className="w-24 h-6 bg-slate-200/60 rounded-full" />
          </div>
          <div className="w-full h-56 bg-slate-200/40 rounded-xl" />
        </div>

        {/* Medicines & Schedule Row Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <div className="w-36 h-5 bg-slate-200/90 rounded" />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl h-20" />
              ))}
            </div>
          </div>

          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <div className="w-36 h-5 bg-slate-200/90 rounded" />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl h-20" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
