/**
 * Skeleton Loader Component
 * Shows loading placeholders while content is being fetched
 */

import React from 'react';

interface SkeletonLoaderProps {
  type?: 'card' | 'text' | 'circle' | 'rectangle';
  count?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  type = 'card', 
  count = 1,
  className = '' 
}) => {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  if (type === 'card') {
    return (
      <>
        {skeletons.map((i) => (
          <div key={i} className={`bg-dark-surface border border-dark-border rounded-lg p-4 ${className}`}>
            <div className="animate-pulse">
              {/* Image placeholder */}
              <div className="w-full h-32 bg-dark-border rounded mb-4"></div>
              {/* Title placeholder */}
              <div className="h-6 bg-dark-border rounded w-3/4 mb-3"></div>
              {/* Description placeholder */}
              <div className="h-4 bg-dark-border rounded w-full mb-2"></div>
              <div className="h-4 bg-dark-border rounded w-5/6 mb-4"></div>
              {/* Button placeholder */}
              <div className="h-10 bg-dark-border rounded w-full"></div>
            </div>
          </div>
        ))}
      </>
    );
  }

  if (type === 'text') {
    return (
      <>
        {skeletons.map((i) => (
          <div key={i} className={`animate-pulse ${className}`}>
            <div className="h-4 bg-dark-border rounded w-full mb-2"></div>
          </div>
        ))}
      </>
    );
  }

  if (type === 'circle') {
    return (
      <>
        {skeletons.map((i) => (
          <div key={i} className={`animate-pulse ${className}`}>
            <div className="w-12 h-12 bg-dark-border rounded-full"></div>
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {skeletons.map((i) => (
        <div key={i} className={`animate-pulse ${className}`}>
          <div className="h-20 bg-dark-border rounded w-full"></div>
        </div>
      ))}
    </>
  );
};
