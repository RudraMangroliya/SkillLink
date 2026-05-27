import React from 'react';

// Explore Cards Shimmer Skeleton (mimics ExplorePage.tsx)
export function ExploreCardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full animate-fade-in-slide">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col h-[380px]">
          {/* Top Banner Area */}
          <div className="h-20 bg-gray-100 dark:bg-slate-700/60 animate-shimmer relative flex-shrink-0" />
          
          <div className="px-5 pb-6 flex-1 flex flex-col relative">
            {/* Round Avatar Placeholder */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white dark:border-slate-800 bg-gray-100 dark:bg-slate-700/80 animate-shimmer -mt-10 mb-3 flex-shrink-0 z-10" />
            
            {/* Title / Name */}
            <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded-md w-3/4 animate-shimmer mb-2" />
            
            {/* Headline line 1 & 2 */}
            <div className="h-3.5 bg-gray-100 dark:bg-slate-700/50 rounded-md w-11/12 animate-shimmer mb-1.5" />
            <div className="h-3.5 bg-gray-100 dark:bg-slate-700/50 rounded-md w-5/6 animate-shimmer mb-3" />
            
            {/* Location */}
            <div className="h-3 bg-gray-100 dark:bg-slate-700/40 rounded-md w-1/3 animate-shimmer mb-4" />
            
            {/* Tags preview */}
            <div className="flex gap-2 mb-5">
              <div className="h-6 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-md w-14 animate-shimmer" />
              <div className="h-6 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-md w-16 animate-shimmer" />
              <div className="h-6 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-md w-12 animate-shimmer" />
            </div>
            
            {/* Action buttons footer */}
            <div className="mt-auto flex gap-2">
              <div className="h-10 bg-gray-100 dark:bg-slate-700/60 rounded-lg flex-1 animate-shimmer" />
              <div className="h-10 bg-gray-100 dark:bg-slate-700/60 rounded-lg flex-1 animate-shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Network Page shimmer skeletons (mimics NetworkPage.tsx active tabs)
interface NetworkCardSkeletonProps {
  type: 'suggestions' | 'requests' | 'connections';
}

export function NetworkCardSkeleton({ type }: NetworkCardSkeletonProps) {
  if (type === 'suggestions') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-slide">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 flex flex-col h-[230px]">
            {/* Header banner */}
            <div className="h-16 bg-gray-100 dark:bg-slate-700/60 animate-shimmer flex-shrink-0" />
            
            <div className="px-4 pb-4 flex-1 flex flex-col items-center text-center -mt-8 relative z-10">
              {/* Circular Avatar */}
              <div className="w-16 h-16 rounded-full border-4 border-white dark:border-slate-800 bg-gray-200 dark:bg-slate-700 animate-shimmer shrink-0" />
              
              {/* Name */}
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3 animate-shimmer mt-2.5 mb-1.5" />
              
              {/* Headline */}
              <div className="h-3 bg-gray-100 dark:bg-slate-700/50 rounded w-5/6 animate-shimmer mb-1" />
              <div className="h-3 bg-gray-100 dark:bg-slate-700/50 rounded w-1/2 animate-shimmer mb-4" />
              
              {/* View Profile Button */}
              <div className="mt-auto w-full h-8 bg-gray-100 dark:bg-slate-700/60 rounded-full animate-shimmer" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Row skeletons for requests and connections
  return (
    <div className="space-y-4 animate-fade-in-slide">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="flex items-center justify-between p-4 border border-gray-100 dark:border-slate-700/80 rounded-xl bg-white dark:bg-slate-800 shadow-sm gap-4">
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            {/* Avatar circle */}
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-slate-700 animate-shimmer shrink-0" />
            
            {/* Details lines */}
            <div className="flex-1 space-y-2 min-w-0">
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3 animate-shimmer" />
              <div className="h-3.5 bg-gray-100 dark:bg-slate-700/50 rounded w-2/3 animate-shimmer" />
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-2 shrink-0">
            <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-700/60 animate-shimmer" />
            {type === 'requests' && (
              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-700/60 animate-shimmer" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
