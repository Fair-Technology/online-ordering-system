import React from 'react';

/* ─── Building blocks ──────────────────────────────────────────── */

export const SkeletonNavBar: React.FC = () => (
  <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
    <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-16">
      <div className="flex items-center gap-2">
        <div className="skeleton h-8 w-8 rounded-lg" />
        <div className="skeleton h-5 w-32 rounded-full" />
      </div>
      <div className="flex items-center gap-4">
        <div className="skeleton h-5 w-5 rounded" />
        <div className="skeleton h-5 w-5 rounded" />
      </div>
    </div>
  </header>
);

export const SkeletonHero: React.FC = () => (
  <div className="skeleton h-72 md:h-96 w-full" />
);

export const SkeletonCategoryBar: React.FC = () => (
  <div className="sticky top-[64px] z-40 bg-white border-b border-gray-200 shadow-sm">
    <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3 px-6 py-3">
      {[28, 20, 24, 22, 26].map((w, i) => (
        <div key={i} className={`skeleton h-9 w-${w} rounded-full`} />
      ))}
    </div>
  </div>
);

export const SkeletonProductCard: React.FC = () => (
  <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden flex flex-col h-full shadow-sm">
    <div className="skeleton aspect-[4/3] w-full" />
    <div className="p-4 flex flex-col gap-3 flex-1">
      <div className="skeleton h-5 w-3/4 rounded-full" />
      <div className="skeleton h-4 w-16 rounded-full" />
      <div className="space-y-2">
        <div className="skeleton h-3 w-full rounded-full" />
        <div className="skeleton h-3 w-4/5 rounded-full" />
      </div>
      <div className="skeleton h-9 w-full rounded-full mt-auto" />
    </div>
  </div>
);

/* ─── Full-page skeletons ───────────────────────────────────────── */

export const ShopPageSkeleton: React.FC = () => (
  <div className="bg-gray-50/60 min-h-screen">
    <div className="sticky top-0 z-50">
      <SkeletonNavBar />
    </div>
    <SkeletonHero />
    <SkeletonCategoryBar />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-14">
      {[0, 1].map((si) => (
        <div key={si}>
          <div className="skeleton h-6 w-40 rounded-full mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {[0, 1, 2, 3].map((ci) => (
              <SkeletonProductCard key={ci} />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const CheckoutPageSkeleton: React.FC = () => (
  <div className="bg-gray-50/60 min-h-screen flex flex-col">
    <div className="sticky top-0 z-50">
      <SkeletonNavBar />
    </div>
    <div className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
      <div className="skeleton h-8 w-32 rounded-full mb-8" />
      <div className="grid lg:grid-cols-[1fr_420px] gap-8">
        {/* Left — order summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="skeleton h-5 w-28 rounded-full" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton w-14 h-14 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-36 rounded-full" />
                <div className="skeleton h-3 w-24 rounded-full" />
              </div>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-4 flex justify-between">
            <div className="skeleton h-5 w-20 rounded-full" />
            <div className="skeleton h-5 w-16 rounded-full" />
          </div>
        </div>
        {/* Right — form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="skeleton h-5 w-24 rounded-full" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-11 w-full rounded-xl" />
          ))}
          <div className="skeleton h-24 w-full rounded-xl" />
          <div className="skeleton h-11 w-full rounded-full" />
        </div>
      </div>
    </div>
  </div>
);
