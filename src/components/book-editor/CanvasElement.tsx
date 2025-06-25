import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Image from 'next/image';
import { CanvasElement } from './types';
import { 
  ImageIcon, Video, Volume2,
  // Icons for rendering
  Home, User, Settings, Search, Mail, Phone, Calendar, Clock, Map, Camera, Music, File, Folder, Download, Upload, Save, Copy, Trash, Plus, X, Check, Menu, Bell, AlertCircle, Info, Shield, Lock, Eye, ThumbsUp, MessageCircle, Share, Link, Zap, Award, Gift, Briefcase, Flag, Sun, Moon, Lightbulb, Battery, Wifi, Globe, Database, Code, Monitor, Smartphone, PlayCircle, Volume, Palette, Bookmark, Filter, RefreshCw, Edit3, Table, ListChecks, CheckSquare, Target, HelpCircle
} from 'lucide-react';
import { TableElement } from './TableElement';
import { MathElement } from './MathElement';
import { AssignmentElement } from './AssignmentElement';
import { renderIcon } from './IconRenderer';

type ResizeDirection = 
  | 'n' | 'e' | 's' | 'w' 
  | 'ne' | 'nw' | 'se' | 'sw' 
  | null;

type CanvasElementProps = { 
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  isEditing: boolean;
  onEdit: (editing: boolean) => void;
  onGroup?: (elementIds: string[]) => void;
  isGrouped?: boolean;
  snapLines?: Array<{x?: number, y?: number}>;
  onShowSnapLines?: (lines: Array<{x?: number, y?: number}>) => void;
  canvasSettings?: {
    zoom: number;
    snapToGrid: boolean;
    gridSize: number;
  };
  onDelete?: () => void;
  children?: React.ReactNode;
};

export function CanvasElementComponent({
  element, 
  isSelected, 
  onSelect, 
  onUpdate,
  isEditing,
  onEdit,
  onGroup: _onGroup,
  isGrouped: _isGrouped = false,
  snapLines: _snapLines = [],
  onShowSnapLines: _onShowSnapLines,
  canvasSettings = { zoom: 100, snapToGrid: false, gridSize: 10 },
  onDelete,
  children
}: CanvasElementProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: element.id,
    data: { type: 'element', element },
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection>(null);
  const [currentResize, setCurrentResize] = useState({ 
    width: element.width, 
    height: element.height, 
    x: element.x, 
    y: element.y 
  });

  // Use refs to maintain the latest state values in event handlers
  const resizeStateRef = useRef({
    isResizing: false,
    resizeDirection: null as ResizeDirection,
    startResize: { x: 0, y: 0, width: 0, height: 0, mouseX: 0, mouseY: 0 },
    currentResize: { width: element.width, height: element.height, x: element.x, y: element.y },
    keepAspectRatio: false,
    originalAspectRatio: 1,
    element,
    canvasSettings,
    onUpdate
  });

  // Update refs whenever state changes
  useEffect(() => {
    resizeStateRef.current.isResizing = isResizing;
    resizeStateRef.current.resizeDirection = resizeDirection;
    resizeStateRef.current.currentResize = currentResize;
    resizeStateRef.current.element = element;
    resizeStateRef.current.canvasSettings = canvasSettings;
    resizeStateRef.current.onUpdate = onUpdate;
  }, [isResizing, resizeDirection, currentResize, element, canvasSettings, onUpdate]);

  // Update currentResize when element changes (but not during resizing)
  useEffect(() => {
    if (!isResizing) {
      setCurrentResize({
        width: element.width,
        height: element.height,
        x: element.x,
        y: element.y
      });
    }
  }, [element.width, element.height, element.x, element.y, isResizing]);

  // Apply transform using CSS transforms (performance optimized)
  const style = {
    position: 'absolute' as const,
    left: isResizing ? currentResize.x : element.x,
    top: isResizing ? currentResize.y : element.y,
    width: isResizing ? currentResize.width : element.width,
    height: isResizing ? currentResize.height : element.height,
    transform: `
      ${transform && !isResizing ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : ''}
      rotate(${element.rotation}deg)
    `,
    opacity: isDragging ? 0.7 : element.opacity,
    zIndex: element.zIndex + (isDragging || isResizing ? 1000 : 0),
    transition: isDragging || isResizing ? 'none' : 'all 0.2s ease',
  };

  // When shift key is pressed, maintain aspect ratio
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        resizeStateRef.current.keepAspectRatio = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        resizeStateRef.current.keepAspectRatio = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    if (!isResizing) {
      e.stopPropagation();
      console.log('Element clicked:', element.id);
      onSelect();
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!isResizing) {
      e.stopPropagation();
      console.log('Element double clicked:', element.id);
      if (element.type === 'text' || element.type === 'paragraph' || element.type === 'table' || element.type === 'math') {
        onEdit(true);
      }
    }
  };

  const handleTextSave = () => {
    const newContent = element.type === 'paragraph' 
      ? textareaRef.current?.value || element.content
      : inputRef.current?.value || element.content;
    
    onUpdate({ content: newContent });
    onEdit(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && element.type === 'text') {
      handleTextSave();
    } else if (e.key === 'Escape') {
      onEdit(false);
    }
  };

  // Event handlers using refs to avoid stale closures
  const handleResizeMove = useCallback((e: MouseEvent) => {
    const state = resizeStateRef.current;
    if (!state.isResizing || !state.resizeDirection) return;

    console.log('📏 Resize move:', state.resizeDirection, 'Mouse:', e.clientX, e.clientY);

    // Calculate how much the mouse has moved
    const zoomFactor = state.canvasSettings.zoom / 100;
    const deltaX = (e.clientX - state.startResize.mouseX) / zoomFactor;
    const deltaY = (e.clientY - state.startResize.mouseY) / zoomFactor;
    
    // Initialize new size and position with the original values
    let newWidth = state.startResize.width;
    let newHeight = state.startResize.height;
    let newX = state.startResize.x;
    let newY = state.startResize.y;
    
    // Get canvas dimensions to constrain elements within boundaries
    const canvasElement = document.querySelector('[data-canvas="true"]') as HTMLElement;
    let canvasWidth = 800; // Default fallback
    let canvasHeight = 1000; // Default fallback
    
    if (canvasElement) {
      const canvasRect = canvasElement.getBoundingClientRect();
      canvasWidth = canvasRect.width / zoomFactor;
      canvasHeight = canvasRect.height / zoomFactor;
    }

    // Minimum size constraints
    const minSize = 20;
    
    // For icons, automatically maintain aspect ratio (unless Shift is held to override)
    const shouldKeepAspectRatio = state.keepAspectRatio || state.element.type === 'icon';
    
    // Apply size changes based on direction - simplified logic
    switch (state.resizeDirection) {
      case 'e': // East - right edge
        newWidth = Math.max(minSize, state.startResize.width + deltaX);
        if (shouldKeepAspectRatio && state.element.type === 'icon') {
          newHeight = newWidth; // Keep icons square
        }
        break;
        
      case 'w': // West - left edge
        newWidth = Math.max(minSize, state.startResize.width - deltaX);
        newX = state.startResize.x + (state.startResize.width - newWidth);
        if (shouldKeepAspectRatio && state.element.type === 'icon') {
          newHeight = newWidth; // Keep icons square
          newY = state.startResize.y + (state.startResize.height - newHeight) / 2; // Center vertically
        }
        break;
        
      case 's': // South - bottom edge
        newHeight = Math.max(minSize, state.startResize.height + deltaY);
        if (shouldKeepAspectRatio && state.element.type === 'icon') {
          newWidth = newHeight; // Keep icons square
          newX = state.startResize.x + (state.startResize.width - newWidth) / 2; // Center horizontally
        }
        break;
        
      case 'n': // North - top edge
        newHeight = Math.max(minSize, state.startResize.height - deltaY);
        newY = state.startResize.y + (state.startResize.height - newHeight);
        if (shouldKeepAspectRatio && state.element.type === 'icon') {
          newWidth = newHeight; // Keep icons square
          newX = state.startResize.x + (state.startResize.width - newWidth) / 2; // Center horizontally
        }
        break;
        
      case 'se': // Southeast - bottom right
        newWidth = Math.max(minSize, state.startResize.width + deltaX);
        newHeight = Math.max(minSize, state.startResize.height + deltaY);
        if (shouldKeepAspectRatio) {
          if (state.element.type === 'icon') {
            // For icons, always keep square
            const newSize = Math.max(newWidth, newHeight);
            newWidth = newSize;
            newHeight = newSize;
          } else {
            const aspectRatio = state.originalAspectRatio;
            if (Math.abs(deltaX / aspectRatio) > Math.abs(deltaY)) {
              newHeight = newWidth / aspectRatio;
            } else {
              newWidth = newHeight * aspectRatio;
            }
          }
        }
        break;
        
      case 'sw': // Southwest - bottom left
        newWidth = Math.max(minSize, state.startResize.width - deltaX);
        newHeight = Math.max(minSize, state.startResize.height + deltaY);
        newX = state.startResize.x + (state.startResize.width - newWidth);
        if (shouldKeepAspectRatio) {
          if (state.element.type === 'icon') {
            // For icons, always keep square
            const newSize = Math.max(newWidth, newHeight);
            newWidth = newSize;
            newHeight = newSize;
            newX = state.startResize.x + (state.startResize.width - newWidth);
          } else {
            const aspectRatio = state.originalAspectRatio;
            if (Math.abs(deltaX / aspectRatio) > Math.abs(deltaY)) {
              newHeight = newWidth / aspectRatio;
            } else {
              newWidth = newHeight * aspectRatio;
              newX = state.startResize.x + (state.startResize.width - newWidth);
            }
          }
        }
        break;
        
      case 'ne': // Northeast - top right
        newWidth = Math.max(minSize, state.startResize.width + deltaX);
        newHeight = Math.max(minSize, state.startResize.height - deltaY);
        newY = state.startResize.y + (state.startResize.height - newHeight);
        if (shouldKeepAspectRatio) {
          if (state.element.type === 'icon') {
            // For icons, always keep square
            const newSize = Math.max(newWidth, newHeight);
            newWidth = newSize;
            newHeight = newSize;
            newY = state.startResize.y + (state.startResize.height - newHeight);
          } else {
            const aspectRatio = state.originalAspectRatio;
            if (Math.abs(deltaX / aspectRatio) > Math.abs(deltaY)) {
              newHeight = newWidth / aspectRatio;
              newY = state.startResize.y + (state.startResize.height - newHeight);
            } else {
              newWidth = newHeight * aspectRatio;
            }
          }
        }
        break;
        
      case 'nw': // Northwest - top left
        newWidth = Math.max(minSize, state.startResize.width - deltaX);
        newHeight = Math.max(minSize, state.startResize.height - deltaY);
        newX = state.startResize.x + (state.startResize.width - newWidth);
        newY = state.startResize.y + (state.startResize.height - newHeight);
        if (shouldKeepAspectRatio) {
          if (state.element.type === 'icon') {
            // For icons, always keep square
            const newSize = Math.max(newWidth, newHeight);
            newWidth = newSize;
            newHeight = newSize;
            newX = state.startResize.x + (state.startResize.width - newWidth);
            newY = state.startResize.y + (state.startResize.height - newHeight);
          } else {
            const aspectRatio = state.originalAspectRatio;
            if (Math.abs(deltaX / aspectRatio) > Math.abs(deltaY)) {
              newHeight = newWidth / aspectRatio;
              newY = state.startResize.y + (state.startResize.height - newHeight);
            } else {
              newWidth = newHeight * aspectRatio;
              newX = state.startResize.x + (state.startResize.width - newWidth);
            }
          }
        }
        break;
    }
    
    // Final boundary checks - ensure element stays within canvas
    newX = Math.max(0, Math.min(newX, canvasWidth - newWidth));
    newY = Math.max(0, Math.min(newY, canvasHeight - newHeight));
    
    // Ensure element doesn't extend beyond canvas boundaries
    if (newX + newWidth > canvasWidth) {
      newWidth = canvasWidth - newX;
    }
    if (newY + newHeight > canvasHeight) {
      newHeight = canvasHeight - newY;
    }
    
    // Apply grid snapping if enabled
    if (state.canvasSettings.snapToGrid) {
      const gridSize = state.canvasSettings.gridSize;
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
      newWidth = Math.round(newWidth / gridSize) * gridSize;
      newHeight = Math.round(newHeight / gridSize) * gridSize;
    }
    
    // Update state directly
    const newResize = {
      width: newWidth,
      height: newHeight,
      x: newX,
      y: newY
    };
    
    // Update refs and React state
    resizeStateRef.current.currentResize = newResize;
    setCurrentResize(newResize);
    
    console.log('📐 Updated size:', newResize);
  }, []);

  const handleResizeEnd = useCallback(() => {
    const state = resizeStateRef.current;
    console.log('✅ Resize end. Final size:', state.currentResize);
    
    // Clean up event listeners
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    
    // Apply the final dimensions to the element
    state.onUpdate({
      x: state.currentResize.x,
      y: state.currentResize.y,
      width: state.currentResize.width,
      height: state.currentResize.height
    });
    
    // Reset resizing state
    setIsResizing(false);
    setResizeDirection(null);
    resizeStateRef.current.isResizing = false;
    resizeStateRef.current.resizeDirection = null;
  }, [handleResizeMove]);

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent, direction: ResizeDirection) => {
    console.log('🔄 Resize start:', direction, 'Element:', element.id);
    e.stopPropagation();
    e.preventDefault();

    // Initialize resizing state
    setIsResizing(true);
    setResizeDirection(direction);
    
    const startResize = { 
      x: element.x, 
      y: element.y, 
      width: element.width, 
      height: element.height,
      mouseX: e.clientX,
      mouseY: e.clientY
    };
    
    const currentResize = {
      width: element.width,
      height: element.height,
      x: element.x,
      y: element.y
    };
    
    // Update refs
    resizeStateRef.current.isResizing = true;
    resizeStateRef.current.resizeDirection = direction;
    resizeStateRef.current.startResize = startResize;
    resizeStateRef.current.currentResize = currentResize;
    resizeStateRef.current.originalAspectRatio = element.width / element.height;
    
    setCurrentResize(currentResize);

    // Add global event listeners
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  // Calculate content scaling based on element size relative to default/initial size
  const calculateContentScale = () => {
    const defaultWidth = element.properties.defaultWidth || 200;
    const defaultHeight = element.properties.defaultHeight || 100;
    const scaleX = element.width / defaultWidth;
    const scaleY = element.height / defaultHeight;
    
    // Use the smaller scale to maintain readability
    const scale = Math.min(scaleX, scaleY);
    
    // Limit scale between 0.3 and 3 for practical purposes
    return Math.max(0.3, Math.min(3, scale));
  };

  const contentScale = calculateContentScale();

  const renderContent = () => {
    if (isEditing && (element.type === 'text' || element.type === 'paragraph')) {
      if (element.type === 'paragraph') {
        return (
          <textarea
            ref={textareaRef}
            defaultValue={element.content}
            onBlur={handleTextSave}
            onKeyDown={handleKeyDown}
            className="w-full h-full resize-none border-none outline-none bg-transparent"
            style={{
              fontSize: (element.properties.fontSize || 16) * contentScale,
              fontFamily: element.properties.fontFamily || 'Arial',
              fontWeight: element.properties.fontWeight || 'normal',
              fontStyle: element.properties.fontStyle || 'normal',
              textDecoration: element.properties.textDecoration || 'none',
              color: element.properties.color || '#000000',
              textAlign: element.properties.textAlign || 'left',
            }}
            autoFocus
          />
        );
      } else {
        return (
          <input
            ref={inputRef}
            defaultValue={element.content}
            onBlur={handleTextSave}
            onKeyDown={handleKeyDown}
            className="w-full h-full border-none outline-none bg-transparent"
            style={{
              fontSize: (element.properties.fontSize || 16) * contentScale,
              fontFamily: element.properties.fontFamily || 'Arial',
              fontWeight: element.properties.fontWeight || 'normal',
              fontStyle: element.properties.fontStyle || 'normal',
              textDecoration: element.properties.textDecoration || 'none',
              color: element.properties.color || '#000000',
              textAlign: element.properties.textAlign || 'center',
            }}
            autoFocus
          />
        );
      }
    }

    const scaledBorderWidth = (element.properties.borderWidth || 0) * contentScale;
    const borderStyle = scaledBorderWidth > 0 ? {
      border: `${scaledBorderWidth}px ${element.properties.borderStyle || 'solid'} ${element.properties.borderColor || '#000000'}`
    } : {};

    switch (element.type) {
      case 'text':
        return (
          <div
            className="w-full h-full flex items-center justify-center cursor-text"
            style={{
              fontSize: (element.properties.fontSize || 16) * contentScale,
              fontFamily: element.properties.fontFamily || 'Arial',
              fontWeight: element.properties.fontWeight || 'normal',
              fontStyle: element.properties.fontStyle || 'normal',
              textDecoration: element.properties.textDecoration || 'none',
              color: element.properties.color || '#000000',
              backgroundColor: element.properties.backgroundColor || 'transparent',
              textAlign: element.properties.textAlign || 'center',
              borderRadius: (element.properties.borderRadius || 0) * contentScale,
              ...borderStyle,
            }}
          >
            {element.content || 'Новый текст'}
          </div>
        );
      case 'paragraph':
        return (
          <div
            className="w-full h-full cursor-text overflow-hidden"
            style={{
              fontSize: (element.properties.fontSize || 14) * contentScale,
              fontFamily: element.properties.fontFamily || 'Arial',
              fontWeight: element.properties.fontWeight || 'normal',
              fontStyle: element.properties.fontStyle || 'normal',
              textDecoration: element.properties.textDecoration || 'none',
              color: element.properties.color || '#000000',
              backgroundColor: element.properties.backgroundColor || 'transparent',
              textAlign: element.properties.textAlign || 'left',
              borderRadius: (element.properties.borderRadius || 0) * contentScale,
              whiteSpace: 'pre-wrap',
              padding: `${2 * contentScale}px`,
              ...borderStyle,
            }}
          >
            {element.content || 'Новый абзац\nНачните печатать...'}
          </div>
        );
      case 'table':
        return (
          <div style={{ transform: `scale(${contentScale})`, transformOrigin: 'top left' }}>
            <TableElement 
              element={element} 
              isEditing={isEditing}
              onUpdate={onUpdate}
            />
          </div>
        );
      case 'shape':
        const renderShape = () => {
          const shapeStyle = {
            backgroundColor: element.properties.backgroundColor || '#e5e5e5',
            ...borderStyle,
          };

          // Получаем тип фигуры
          const shapeType = element.properties.shapeType;
          
          // Явно проверяем каждый тип фигуры
          if (shapeType === 'circle') {
            return (
              <div
                className="w-full h-full"
                style={{
                  ...shapeStyle,
                  borderRadius: '50%',
                }}
              />
            );
          } else if (shapeType === 'triangle') {
            return (
              <div className="w-full h-full flex items-center justify-center">
                <svg 
                  viewBox="0 0 100 100"
                  className="w-full h-full"
                  fill={element.properties.backgroundColor || '#e5e5e5'}
                  stroke={element.properties.borderColor || 'transparent'}
                  strokeWidth={(element.properties.borderWidth || 0) * contentScale}
                >
                  <polygon points="50 10, 90 90, 10 90" />
                </svg>
              </div>
            );
          } else if (shapeType === 'star') {
            return (
              <div className="w-full h-full flex items-center justify-center">
                <svg 
                  viewBox="0 0 24 24"
                  className="w-full h-full"
                  fill={element.properties.backgroundColor || '#e5e5e5'}
                  stroke={element.properties.borderColor || 'transparent'}
                  strokeWidth={(element.properties.borderWidth || 0) * contentScale}
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
            );
          } else if (shapeType === 'heart') {
            return (
              <div className="w-full h-full flex items-center justify-center">
                <svg 
                  viewBox="0 0 24 24"
                  className="w-full h-full"
                  fill={element.properties.backgroundColor || '#e5e5e5'}
                  stroke={element.properties.borderColor || 'transparent'}
                  strokeWidth={(element.properties.borderWidth || 0) * contentScale}
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
            );
          } else {
            // Default to rectangle
            return (
              <div
                className="w-full h-full"
                style={{
                  ...shapeStyle,
                  borderRadius: (element.properties.borderRadius || 0) * contentScale,
                }}
              />
            );
          }
        };
        return renderShape();
      case 'line':
        return (
          <div
            className="w-full"
            style={{
              height: (element.properties.lineThickness || 2) * contentScale,
              backgroundColor: element.properties.color || '#000000',
              top: '50%',
              position: 'absolute',
              borderRadius: (element.properties.borderRadius || 0) * contentScale,
            }}
          />
        );
      case 'image':
        return (
          <div 
            className="w-full h-full bg-gray-100 flex items-center justify-center overflow-hidden"
            style={{
              borderRadius: (element.properties.borderRadius || 0) * contentScale,
              ...borderStyle,
            }}
          >
            {element.properties.imageUrl ? (
              <Image 
                src={element.properties.imageUrl} 
                alt="Element"
                width={element.width}
                height={element.height}
                className="w-full h-full object-cover"
                style={{ borderRadius: (element.properties.borderRadius || 0) * contentScale }}
              />
            ) : (
              <div className="text-center text-gray-500">
                <ImageIcon className="h-8 w-8 mx-auto mb-2" style={{ transform: `scale(${contentScale})` }} />
                <span className="text-sm" style={{ fontSize: `${12 * contentScale}px` }}>Изображение</span>
              </div>
            )}
          </div>
        );
      case 'video':
        return (
          <div 
            className="w-full h-full bg-gray-100 flex items-center justify-center overflow-hidden"
            style={{
              borderRadius: (element.properties.borderRadius || 0) * contentScale,
              ...borderStyle,
            }}
          >
            {element.properties.videoUrl ? (
              <video 
                src={element.properties.videoUrl}
                controls={element.properties.controls !== false}
                autoPlay={element.properties.autoplay || false}
                muted={element.properties.muted !== false}
                loop={element.properties.loop || false}
                className="w-full h-full object-cover"
                style={{ borderRadius: (element.properties.borderRadius || 0) * contentScale }}
                preload="metadata"
              />
            ) : (
              <div className="text-center text-gray-500">
                <Video className="h-8 w-8 mx-auto mb-2" style={{ transform: `scale(${contentScale})` }} />
                <span className="text-sm" style={{ fontSize: `${12 * contentScale}px` }}>Видео</span>
              </div>
            )}
          </div>
        );
      case 'audio':
        return (
          <div 
            className="w-full h-full bg-gray-100 flex items-center justify-center overflow-hidden"
            style={{
              borderRadius: (element.properties.borderRadius || 0) * contentScale,
              ...borderStyle,
            }}
          >
            {element.properties.audioUrl ? (
              <audio 
                src={element.properties.audioUrl}
                controls={element.properties.controls !== false}
                autoPlay={element.properties.autoplay || false}
                muted={element.properties.muted !== false}
                loop={element.properties.loop || false}
                className="w-full h-full object-cover"
                style={{ borderRadius: (element.properties.borderRadius || 0) * contentScale }}
                preload="metadata"
              />
            ) : (
              <div className="text-center text-gray-500">
                <Volume2 className="h-8 w-8 mx-auto mb-2" style={{ transform: `scale(${contentScale})` }} />
                <span className="text-sm" style={{ fontSize: `${12 * contentScale}px` }}>Аудио</span>
              </div>
            )}
          </div>
        );
      case 'math':
        return (
          <div style={{ transform: `scale(${contentScale})`, transformOrigin: 'center' }}>
            <MathElement 
              element={element} 
              isEditing={isEditing}
              onUpdate={onUpdate}
            />
          </div>
        );
      case 'assignment':
        return (
          <div style={{ transform: `scale(${contentScale})`, transformOrigin: 'top left' }}>
            <AssignmentElement 
              element={element} 
              isEditing={isEditing}
              _onUpdate={onUpdate}
            />
          </div>
        );
      case 'icon':
        return (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{
              backgroundColor: element.properties.backgroundColor || 'transparent',
              borderRadius: (element.properties.borderRadius || 0) * contentScale,
              ...borderStyle,
            }}
          >
            {element.properties.iconType && renderIcon(element.properties.iconType, {
              size: Math.min(element.width, element.height) * 0.7,
              color: element.properties.color || '#000000',
            })}
          </div>
        );
      default:
        return (
          <div className="w-full h-full flex items-center justify-center text-gray-600 bg-gray-100 border border-gray-300 rounded" style={borderStyle}>
            <span className="text-sm capitalize" style={{ fontSize: `${12 * contentScale}px` }}>{element.type}</span>
          </div>
        );
    }
  };

  // Resize handles
  const renderResizeHandles = () => {
    if (!isSelected || isDragging) {
      console.log('❌ No handles:', { isSelected, isDragging });
      return null;
    }

    console.log('✨ Rendering resize handles for element:', element.id);

    const handleStyle = "absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full z-20 shadow-md hover:bg-blue-600 transition-colors";
    
    return (
      <>
        {/* Corner handles */}
        <div 
          className={`${handleStyle} -top-1.5 -left-1.5 cursor-nw-resize`} 
          onMouseDown={(e) => handleResizeStart(e, 'nw')}
          title="Изменить размер: северо-запад"
        />
        <div 
          className={`${handleStyle} -top-1.5 -right-1.5 cursor-ne-resize`}
          onMouseDown={(e) => handleResizeStart(e, 'ne')}
          title="Изменить размер: северо-восток"
        />
        <div 
          className={`${handleStyle} -bottom-1.5 -left-1.5 cursor-sw-resize`}
          onMouseDown={(e) => handleResizeStart(e, 'sw')}
          title="Изменить размер: юго-запад"
        />
        <div 
          className={`${handleStyle} -bottom-1.5 -right-1.5 cursor-se-resize`}
          onMouseDown={(e) => handleResizeStart(e, 'se')}
          title="Изменить размер: юго-восток"
        />
        
        {/* Side handles */}
        <div 
          className={`${handleStyle} -top-1.5 left-1/2 -translate-x-1/2 cursor-n-resize`}
          onMouseDown={(e) => handleResizeStart(e, 'n')}
          title="Изменить размер: север"
        />
        <div 
          className={`${handleStyle} -bottom-1.5 left-1/2 -translate-x-1/2 cursor-s-resize`}
          onMouseDown={(e) => handleResizeStart(e, 's')}
          title="Изменить размер: юг"
        />
        <div 
          className={`${handleStyle} -left-1.5 top-1/2 -translate-y-1/2 cursor-w-resize`}
          onMouseDown={(e) => handleResizeStart(e, 'w')}
          title="Изменить размер: запад"
        />
        <div 
          className={`${handleStyle} -right-1.5 top-1/2 -translate-y-1/2 cursor-e-resize`}
          onMouseDown={(e) => handleResizeStart(e, 'e')}
          title="Изменить размер: восток"
        />

        {/* Resize preview overlay */}
        {isResizing && (
          <div 
            className="absolute inset-0 border-2 border-dashed border-blue-500 bg-blue-100 bg-opacity-20 pointer-events-none"
          />
        )}
        
        {/* Show aspect ratio indicator when shift is pressed or for icons */}
        {isResizing && (resizeStateRef.current.keepAspectRatio || element.type === 'icon') && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-30">
            {element.type === 'icon' ? 'Квадратная иконка' : 'Сохранение пропорций'}
          </div>
        )}
      </>
    );
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        elementRef.current = node;
      }}
      {...(isResizing ? {} : listeners)}
      {...(isResizing ? {} : attributes)}
      style={style}
      className={`group ${isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-gray-300'} ${isResizing ? 'cursor-auto' : 'cursor-move'} relative`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      data-x={isResizing ? currentResize.x : element.x}
      data-y={isResizing ? currentResize.y : element.y}
      data-width={isResizing ? currentResize.width : element.width}
      data-height={isResizing ? currentResize.height : element.height}
    >
      {children ? children : renderContent()}
      {renderResizeHandles()}
      
      {/* Delete button */}
      {isSelected && onDelete && (
        <button
          className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-red-600 transition-colors z-20"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Удалить элемент"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        </button>
      )}
    </div>
  );
} 
