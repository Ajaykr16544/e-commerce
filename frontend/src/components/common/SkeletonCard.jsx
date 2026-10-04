import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-card p-3 animate-pulse flex flex-col justify-between">
      <div>
        <div className="w-full aspect-square bg-slate-200 rounded-xl mb-3 relative overflow-hidden">
          <div className="absolute inset-0 shimmer"></div>
        </div>
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
        <div className="h-5 bg-slate-200 rounded w-4/5 mb-3"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
        <div className="h-6 bg-slate-200 rounded w-1/3"></div>
        <div className="h-8 bg-slate-200 rounded-lg w-10"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;
