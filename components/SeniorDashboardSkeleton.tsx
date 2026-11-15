import React from "react";

export function SeniorDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-white text-slate-800 animate-pulse select-none">
      {/* Top Header Skeleton */}
      <header className="border-b border-slate-100 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-200/80" />
            <div className="space-y-1.5">
              <div className="w-24 h-4 bg-slate-200/90 rounded-md" />
              <div className="w-36 h-3 bg-slate-100 rounded-md" />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-20 h-7 bg-slate-100 rounded-xl hidden sm:block" />
            <div className="w-24 h-8 bg-slate-100 rounded-xl" />
            <div className="w-20 h-8 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </header>

      {/* Main Container Skeleton */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* Mascot Banner Skeleton */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          {/* Avatar circle */}
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-slate-200/70 shrink-0" />

          <div className="flex-1 space-y-3.5 w-full text-center sm:text-left">
            <div className="w-48 sm:w-64 h-8 bg-slate-200/90 rounded-lg mx-auto sm:mx-0" />
            <div className="space-y-1.5">
              <div className="w-full sm:w-4/5 h-4 bg-slate-200/60 rounded mx-auto sm:mx-0" />
              <div className="w-3/4 sm:w-2/3 h-4 bg-slate-200/50 rounded mx-auto sm:mx-0" />
            </div>

            {/* Two Action Buttons Skeleton */}
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <div className="w-40 h-12 rounded-2xl bg-slate-200/80" />
              <div className="w-44 h-12 rounded-2xl bg-slate-200/80" />
            </div>
          </div>
        </div>

        {/* Medicines List Skeleton */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="space-y-1">
              <div className="w-40 h-6 bg-slate-200/90 rounded-md" />
              <div className="w-56 h-3.5 bg-slate-200/60 rounded-md" />
            </div>
            <div className="w-16 h-6 bg-slate-100 rounded-lg" />
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-5"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-200/80 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-5 bg-slate-200/90 rounded-md" />
                      <div className="w-14 h-4 bg-slate-100 rounded-md" />
                    </div>
                    <div className="w-52 h-4 bg-slate-100 rounded" />
                    <div className="w-36 h-3.5 bg-slate-100 rounded" />
                  </div>
                </div>

                <div className="w-32 h-11 bg-slate-200/70 rounded-xl shrink-0 self-end sm:self-center" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
