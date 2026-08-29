'use client';
import React from 'react';

export function Skeleton({ className = '', style = {} }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={style}
    />
  );
}

export function CardSkeleton({ className = '' }) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header skeleton */}
      <div className="bg-gray-50 px-6 py-3 border-b">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-24" />
          ))}
        </div>
      </div>

      {/* Body skeletons */}
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} className="h-5 w-24" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ items = 5 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="w-24 h-8 rounded" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="p-6 space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="w-24 h-10 rounded-lg" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-10 w-20 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}

export function DashboardSidebarSkeleton() {
  return (
    <div className="h-screen bg-white border-r flex flex-col">
      {/* Header skeleton */}
      <div className="p-4 border-b">
        <Skeleton className="h-8 w-32 mx-auto" />
      </div>

      {/* Menu skeleton */}
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg">
            <Skeleton className="w-6 h-6" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>

      {/* Footer skeleton */}
      <div className="p-3 border-t">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}