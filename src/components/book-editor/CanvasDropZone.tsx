import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { CanvasSettings } from './types';

type CanvasDropZoneProps = { 
  children: React.ReactNode;
  settings: CanvasSettings;
  showGrid: boolean;
};

export const CanvasDropZone = React.memo(({ 
  children, 
  settings,
  showGrid 
}: CanvasDropZoneProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas',
  });

  const zoomFactor = settings.zoom / 100;

  // Memoize styles to prevent unnecessary recalculations
  const { canvasStyle, gridStyle } = useMemo(() => {
    return {
      canvasStyle: {
        transform: `scale(${zoomFactor})`,
        transformOrigin: 'top center',
        transition: 'transform 0.12s ease-out',
        minHeight: '100vh',
        width: '100%',
      },
      gridStyle: showGrid ? {
        backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
        backgroundSize: `${20 * zoomFactor}px ${20 * zoomFactor}px`,
        opacity: zoomFactor > 3 ? 0.05 : 0.1,
      } : {}
    };
  }, [zoomFactor, showGrid]);

  return (
    <div className="w-full h-full overflow-auto bg-gray-50" style={{ padding: '20px' }}>
      <div className="max-w-7xl mx-auto">
        <div
          ref={setNodeRef}
          data-canvas="true"
          className={`relative bg-white shadow-lg border-2 min-h-screen ${
            isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          } transition-all duration-200`}
          style={canvasStyle}
        >
          {/* Grid overlay */}
          {showGrid && (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={gridStyle}
            />
          )}
          
          {children}
        </div>
      </div>
    </div>
  );
}); 

CanvasDropZone.displayName = 'CanvasDropZone'; 
