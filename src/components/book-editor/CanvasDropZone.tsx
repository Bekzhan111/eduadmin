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

  // Calculate actual canvas dimensions based on zoom
  const actualWidth = settings.canvasWidth * 3.7795;
  const actualHeight = settings.canvasHeight * 3.7795;
  const zoomFactor = settings.zoom / 100;
  const scaledWidth = actualWidth * zoomFactor;
  const scaledHeight = actualHeight * zoomFactor;

  // Memoize styles to prevent unnecessary recalculations
  const { canvasStyle, containerStyle, gridStyle } = useMemo(() => {
    return {
      canvasStyle: {
        width: `${actualWidth}px`,
        height: `${actualHeight}px`,
        transform: `scale(${zoomFactor})`,
        transformOrigin: 'top left',
        transition: 'transform 0.12s ease-out', // Smoother transition
      },
      containerStyle: {
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
        minWidth: `${scaledWidth}px`,
        minHeight: `${scaledHeight}px`,
        transition: 'width 0.12s ease-out, height 0.12s ease-out', // Smoother transition
      },
      gridStyle: showGrid ? {
        backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
        backgroundSize: `${20 * zoomFactor}px ${20 * zoomFactor}px`,
        opacity: zoomFactor > 3 ? 0.05 : 0.1, // Reduce grid opacity at high zoom levels
      } : {}
    };
  }, [actualWidth, actualHeight, zoomFactor, scaledWidth, scaledHeight, showGrid]);

  // Calculate padding based on zoom - more padding at higher zoom levels
  const paddingValue = useMemo(() => {
    // Base padding is 8 units (2rem)
    // Add more padding at higher zoom levels
    const extraPadding = settings.zoom > 100 ? Math.min(Math.round(settings.zoom / 25), 40) : 0;
    return `${8 + extraPadding}px`;
  }, [settings.zoom]);

  return (
    <div className="w-full h-full overflow-auto bg-gray-50" style={{ padding: paddingValue }}>
      <div className="flex items-start justify-center min-h-full">
        <div style={containerStyle} className="relative">
          <div
            ref={setNodeRef}
            data-canvas="true"
            className={`relative bg-white shadow-xl border ${
              isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            } transition-all duration-200`}
            style={canvasStyle}
          >
            {/* Grid overlay */}
            {showGrid && (
              <div 
                className="absolute inset-0"
                style={gridStyle}
              />
            )}
            
            {/* Page indicator */}
            <div 
              className="absolute left-0 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow"
              style={{ 
                top: `-${32 * zoomFactor}px`,
                fontSize: `${Math.max(8, Math.min(12 * zoomFactor, 24))}px`, // Constrain font size
              }}
            >
              Страница {settings.currentPage} из {settings.totalPages}
            </div>
            
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}); 

CanvasDropZone.displayName = 'CanvasDropZone'; 
