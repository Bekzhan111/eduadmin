import React from 'react';

interface SkeletonProps {
  type?: 'card' | 'text' | 'avatar' | 'table' | 'custom';
  count?: number;
  rows?: number;
  lines?: number;
  className?: string;
  height?: string | number;
  width?: string | number;
}

// Base skeleton with shimmer animation
const BaseSkeleton: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ 
  className = '', 
  style 
}) => (
  <div 
    className={`animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] rounded ${className}`}
    style={style}
  />
);

// Card skeleton - имитирует карточку с изображением, заголовком и текстом
const CardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
    {/* Image placeholder */}
    <BaseSkeleton className="w-full h-32 mb-4" />
    
    {/* Title placeholder */}
    <BaseSkeleton className="h-6 w-3/4 mb-3" />
    
    {/* Text placeholders */}
    <BaseSkeleton className="h-4 w-full mb-2" />
    <BaseSkeleton className="h-4 w-5/6 mb-2" />
    <BaseSkeleton className="h-4 w-2/3" />
    
    {/* Button placeholder */}
    <div className="mt-4 flex space-x-2">
      <BaseSkeleton className="h-8 w-20" />
      <BaseSkeleton className="h-8 w-16" />
    </div>
  </div>
);

// Text skeleton - линии текста
const TextSkeleton: React.FC<{ lines: number }> = ({ lines }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, index) => (
      <BaseSkeleton 
        key={index}
        className={`h-4 ${
          index === lines - 1 ? 'w-3/4' : 'w-full'
        }`}
      />
    ))}
  </div>
);

// Avatar skeleton - аватар с именем
const AvatarSkeleton: React.FC = () => (
  <div className="flex items-center space-x-3">
    {/* Avatar circle */}
    <BaseSkeleton className="w-10 h-10 rounded-full flex-shrink-0" />
    
    {/* Name and info */}
    <div className="flex-1 space-y-2">
      <BaseSkeleton className="h-4 w-32" />
      <BaseSkeleton className="h-3 w-24" />
    </div>
  </div>
);

// Table skeleton - строки таблицы
const TableSkeleton: React.FC<{ rows: number }> = ({ rows }) => (
  <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
    {/* Table header */}
    <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
      <div className="flex space-x-6">
        <BaseSkeleton className="h-4 w-24" />
        <BaseSkeleton className="h-4 w-32" />
        <BaseSkeleton className="h-4 w-20" />
        <BaseSkeleton className="h-4 w-16" />
      </div>
    </div>
    
    {/* Table rows */}
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="px-6 py-4">
          <div className="flex items-center space-x-6">
            <BaseSkeleton className="w-8 h-8 rounded-full" />
            <BaseSkeleton className="h-4 w-32" />
            <BaseSkeleton className="h-4 w-24" />
            <BaseSkeleton className="h-4 w-16" />
            <BaseSkeleton className="h-4 w-20" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Main SkeletonLoader component
export const SkeletonLoader: React.FC<SkeletonProps> = ({
  type = 'text',
  count = 1,
  rows = 5,
  lines = 3,
  className = '',
  height,
  width
}) => {
  // Custom skeleton with specific dimensions
  if (type === 'custom') {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: count }).map((_, index) => (
          <BaseSkeleton
            key={index}
            style={{
              height: typeof height === 'number' ? `${height}px` : height,
              width: typeof width === 'number' ? `${width}px` : width
            }}
          />
        ))}
      </div>
    );
  }

  // Render based on type
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return Array.from({ length: count }).map((_, index) => (
          <CardSkeleton key={index} />
        ));
      
      case 'text':
        return <TextSkeleton lines={lines} />;
      
      case 'avatar':
        return Array.from({ length: count }).map((_, index) => (
          <AvatarSkeleton key={index} />
        ));
      
      case 'table':
        return <TableSkeleton rows={rows} />;
      
      default:
        return <TextSkeleton lines={lines} />;
    }
  };

  return (
    <div className={`${type === 'card' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : ''} ${className}`}>
      {renderSkeleton()}
    </div>
  );
};

// Utility component for quick skeleton usage
export const Skeleton = BaseSkeleton;

export default SkeletonLoader; 