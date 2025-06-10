'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageNavigator } from '@/components/ui/page-navigator';
import { 
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { 
  Save, Type, Square, Circle, Image as ImageIcon, Minus, AlignLeft,
  Menu, X, PanelLeftClose, PanelLeftOpen, Plus, Trash2, Copy, Undo2, Redo2,
  ZoomIn, ZoomOut, Grid3X3, Eye, SkipForward, SkipBack, Settings, Layers,
  Triangle, Star, Heart, Upload, Lock,
  Bold, Italic, Underline, ArrowUp, ArrowDown, Video, BookOpen,
  RotateCw, FlipHorizontal,
  Clipboard, Target, FileText,
  Volume2, CheckCircle, PlayCircle, XCircle, Archive, Download,
  ArrowRight
} from 'lucide-react';
import { uploadMedia } from '@/utils/mediaUpload';
import type { MediaType, UploadResult } from '@/utils/mediaUpload';

// Enhanced Book type with version control and collaboration
type Book = {
  id: string;
  base_url: string;
  title: string;
  description: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  canvas_elements?: string;
  canvas_settings?: string;
  status?: 'Draft' | 'Moderation' | 'Approved' | 'Active' | 'Rejected';
  version?: number;
  collaborators?: string[];
  auto_save_enabled?: boolean;
  last_auto_save?: string;
};

// Enhanced Canvas Element with grouping, animations, and filters
type CanvasElement = {
  id: string;
  type: 'text' | 'shape' | 'image' | 'line' | 'paragraph' | 'arrow' | 'icon' | 'video' | 'audio' | 'group';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  page: number;
  zIndex: number;
  rotation: number;
  opacity: number;
  locked?: boolean;
  visible?: boolean;
  // Grouping support
  groupId?: string;
  isGroup?: boolean;
  children?: string[];
  // Animation properties
  animations?: {
    entrance?: 'fadeIn' | 'slideInLeft' | 'slideInRight' | 'slideInUp' | 'slideInDown' | 'zoomIn' | 'bounceIn';
    exit?: 'fadeOut' | 'slideOutLeft' | 'slideOutRight' | 'slideOutUp' | 'slideOutDown' | 'zoomOut' | 'bounceOut';
    duration?: number;
    delay?: number;
    iteration?: number;
  };
  // Enhanced properties
  properties: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    borderStyle?: string;
    textAlign?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    shapeType?: 'rectangle' | 'circle' | 'triangle' | 'star' | 'heart';
    imageUrl?: string;
    videoUrl?: string;
    audioUrl?: string;
    lineThickness?: number;
    arrowType?: 'single' | 'double' | 'none';
    iconType?: string;
    shadow?: boolean;
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    autoplay?: boolean;
    muted?: boolean;
    controls?: boolean;
    loop?: boolean;
    animation?: string;
    gradient?: {
      type: 'linear' | 'radial';
      colors: string[];
      direction?: number;
    };
    // Filters and effects
    filters?: {
      blur?: number;
      brightness?: number;
      contrast?: number;
      saturate?: number;
      sepia?: number;
      hueRotate?: number;
      invert?: boolean;
      grayscale?: number;
    };
    // Transform properties
    skewX?: number;
    skewY?: number;
    scaleX?: number;
    scaleY?: number;
  };
};

// Enhanced Canvas Settings with guides and performance options
type CanvasSettings = {
  zoom: number;
  currentPage: number;
  totalPages: number;
  canvasWidth: number;
  canvasHeight: number;
  showGrid: boolean;
  twoPageView: boolean;
  snapToGrid: boolean;
  gridSize: number;
  showRulers: boolean;
  showGuides: boolean;
  // Smart guides
  smartGuides: boolean;
  snapToElements: boolean;
  snapDistance: number;
  // Performance settings
  renderQuality: 'draft' | 'normal' | 'high';
  enableAnimations: boolean;
  maxUndoSteps: number;
  // Auto-save settings
  autoSave: boolean;
  autoSaveInterval: number; // in seconds
};

// Template system
type Template = {
  id: string;
  name: string;
  preview: string;
  elements: CanvasElement[];
  category: 'basic' | 'business' | 'creative' | 'education' | 'presentation' | 'book' | 'magazine';
  tags: string[];
  author: string;
  downloads: number;
  premium: boolean;
};

// Collaboration types
type _Comment = {
  id: string;
  elementId?: string;
  x: number;
  y: number;
  page: number;
  content: string;
  author: string;
  timestamp: Date;
  resolved: boolean;
  replies?: _Comment[];
};

// Enhanced Enhanced tool definitions with more elements and categories
const TOOLS = [
  // Content tools
  { id: 'text', name: 'Текст', label: 'Текст', icon: Type, category: 'content', needsFileUpload: false, hotkey: 'T' },
  { id: 'paragraph', name: 'Абзац', label: 'Абзац', icon: AlignLeft, category: 'content', needsFileUpload: false, hotkey: 'P' },
  
  // Media tools
  { id: 'image', name: 'Изображение', label: 'Изображение', icon: ImageIcon, category: 'media', needsFileUpload: true, accepts: 'image/*', hotkey: 'I' },
  { id: 'video', name: 'Видео', label: 'Видео', icon: Video, category: 'media', needsFileUpload: true, accepts: 'video/*', hotkey: 'V' },
  { id: 'audio', name: 'Аудио', label: 'Аудио', icon: Volume2, category: 'media', needsFileUpload: true, accepts: 'audio/*', hotkey: 'U' },
  
  // Shape tools
  { id: 'rectangle', name: 'Прямоугольник', label: 'Прямоугольник', icon: Square, category: 'shapes', needsFileUpload: false, hotkey: 'R' },
  { id: 'circle', name: 'Круг', label: 'Круг', icon: Circle, category: 'shapes', needsFileUpload: false, hotkey: 'C' },
  { id: 'triangle', name: 'Треугольник', label: 'Треугольник', icon: Triangle, category: 'shapes', needsFileUpload: false, hotkey: '' },
  { id: 'star', name: 'Звезда', label: 'Звезда', icon: Star, category: 'shapes', needsFileUpload: false, hotkey: '' },
  { id: 'heart', name: 'Сердце', label: 'Сердце', icon: Heart, category: 'shapes', needsFileUpload: false, hotkey: '' },
  
  // Drawing tools
  { id: 'line', name: 'Линия', label: 'Линия', icon: Minus, category: 'drawing', needsFileUpload: false, hotkey: 'L' },
  { id: 'arrow', name: 'Стрелка', label: 'Стрелка', icon: ArrowRight, category: 'drawing', needsFileUpload: false, hotkey: 'A' },
] as const;

const TOOL_CATEGORIES = [
  { id: 'content', label: 'Текст', icon: Type },
  { id: 'shapes', label: 'Фигуры', icon: Square },
  { id: 'media', label: 'Медиа', icon: ImageIcon },
  { id: 'drawing', label: 'Рисование', icon: Minus },
];

// Predefined templates
const _TEMPLATES: Template[] = [
  {
    id: 'title-page',
    name: 'Титульная страница',
    preview: '/templates/title-page.svg',
    category: 'basic',
    tags: ['заголовок', 'титул', 'обложка'],
    author: 'EduAdmin',
    downloads: 0,
    premium: false,
    elements: [
      {
        id: 'template-title',
        type: 'text',
        x: 50,
        y: 100,
        width: 400,
        height: 80,
        content: 'НАЗВАНИЕ КНИГИ',
        page: 1,
        zIndex: 1,
        rotation: 0,
        opacity: 1,
        properties: {
          fontSize: 48,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          color: '#2c3e50',
          textAlign: 'center',
        },
      },
      {
        id: 'template-subtitle',
        type: 'text',
        x: 50,
        y: 200,
        width: 400,
        height: 40,
        content: 'Подзаголовок или описание',
        page: 1,
        zIndex: 2,
        rotation: 0,
        opacity: 1,
        properties: {
          fontSize: 18,
          fontFamily: 'Arial',
          color: '#7f8c8d',
          textAlign: 'center',
        },
      },
      {
        id: 'template-author',
        type: 'text',
        x: 50,
        y: 350,
        width: 400,
        height: 30,
        content: 'Автор: Ваше имя',
        page: 1,
        zIndex: 3,
        rotation: 0,
        opacity: 1,
        properties: {
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#34495e',
          textAlign: 'center',
        },
      },
    ],
  },
  // Add more templates...
];

// Quick actions for selected elements
const _QUICK_ACTIONS = [
  { id: 'duplicate', label: 'Дублировать', icon: Copy, hotkey: 'Ctrl+D' },
  { id: 'delete', label: 'Удалить', icon: Trash2, hotkey: 'Del' },
  { id: 'copy', label: 'Копировать', icon: Clipboard, hotkey: 'Ctrl+C' },
  { id: 'lock', label: 'Заблокировать', icon: Lock, hotkey: '' },
  { id: 'bring-front', label: 'На передний план', icon: ArrowUp, hotkey: '' },
  { id: 'rotate', label: 'Повернуть', icon: RotateCw, hotkey: 'R' },
  { id: 'align-center', label: 'Центрировать', icon: Target, hotkey: '' },
  { id: 'flip-h', label: 'Отразить по горизонтали', icon: FlipHorizontal, hotkey: '' },
];

// Enhanced Draggable Tool Component
function DraggableTool({ 
  tool, 
  onMediaUploaded,
  isSelected,
  onSelect,
  canvasSettings
}: { 
  tool: typeof TOOLS[number]; 
  onMediaUploaded?: (url: string, type: string) => void;
  isSelected?: boolean;
  onSelect?: () => void;
  canvasSettings: CanvasSettings;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `tool-${tool.id}`,
    data: { type: 'tool', toolType: tool.id },
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const IconComponent = tool.icon;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToolClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.();
    
    if (tool.id === 'image' || tool.id === 'video' || tool.id === 'audio') {
      fileInputRef.current?.click();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const mediaType: MediaType = tool.id === 'video' ? 'video' : tool.id === 'audio' ? 'audio' : 'image';
      const result: UploadResult = await uploadMedia(file, mediaType);
      
      if (result.success && result.url) {
        if (onMediaUploaded) {
          onMediaUploaded(result.url, mediaType);
        }
        
        // Create a notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50 transition-all duration-300';
        notification.innerHTML = `
          <div class="flex items-center space-x-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>${mediaType === 'video' ? 'Видео' : mediaType === 'audio' ? 'Аудио' : 'Изображение'} загружено! Перетащите на холст.</span>
          </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
          notification.style.transform = 'translateX(100%)';
          setTimeout(() => document.body.removeChild(notification), 3000);
        }, 3000);
      } else {
        setUploadError(result.error || 'Ошибка загрузки');
      }
    } catch (error) {
      setUploadError('Ошибка загрузки файла');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Smart element positioning
  const getSmartPosition = () => {
    const canvasElement = document.querySelector('[data-canvas="true"]') as HTMLElement;
    if (!canvasElement) return { x: 100, y: 100 };

    const canvasRect = canvasElement.getBoundingClientRect();
    const zoomFactor = canvasSettings.zoom / 100;
    
    // Calculate center position
    let centerX = (canvasRect.width / 2) / zoomFactor;
    let centerY = (canvasRect.height / 2) / zoomFactor;
    
    // Add some random offset to avoid overlapping
    centerX += (Math.random() - 0.5) * 100;
    centerY += (Math.random() - 0.5) * 100;
    
    // Snap to grid if enabled
    if (canvasSettings.snapToGrid) {
      centerX = Math.round(centerX / canvasSettings.gridSize) * canvasSettings.gridSize;
      centerY = Math.round(centerY / canvasSettings.gridSize) * canvasSettings.gridSize;
    }
    
    return { x: Math.max(0, centerX - 50), y: Math.max(0, centerY - 25) };
  };

  // Determine if this tool needs click functionality
  const needsClickFunctionality = ['image', 'video', 'audio'].includes(tool.id);

  const handleGeneralToolClick = (e: React.MouseEvent) => {
    if (!needsClickFunctionality) {
      e.stopPropagation();
      const position = getSmartPosition();
      
      // Determine the correct element type based on tool category
      const getElementType = (toolId: string): CanvasElement['type'] => {
        // Check if it's a shape tool
        if (['rectangle', 'circle', 'triangle', 'star', 'heart'].includes(toolId)) {
          return 'shape';
        }
        // For other tools, use their ID as type
        return toolId as CanvasElement['type'];
      };
      
      // Enhanced element creation with better defaults
      const newElement = {
        id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: getElementType(tool.id),
        ...position,
        width: getDefaultWidth(tool.id),
        height: getDefaultHeight(tool.id),
        content: getDefaultContent(tool.id),
        page: canvasSettings.currentPage,
        zIndex: 0,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        properties: getEnhancedPropertiesForTool(tool.id)
      };
      
      // Dispatch custom event to add element
      window.dispatchEvent(new CustomEvent('addToolToCanvas', { 
        detail: { tool: tool.id, element: newElement } 
      }));
    }
  };

  const getDefaultWidth = (toolId: string) => {
    switch (toolId) {
      case 'text': return 150;
      case 'heading': return 300;
      case 'paragraph': return 250;
      case 'line': return 200;
      case 'arrow': return 200;
      case 'image': return 150;
      case 'video': return 300;
      default: return 100;
    }
  };

  const getDefaultHeight = (toolId: string) => {
    switch (toolId) {
      case 'text': return 40;
      case 'heading': return 60;
      case 'paragraph': return 120;
      case 'line': return 2;
      case 'arrow': return 50;
      case 'image': return 150;
      case 'video': return 200;
      default: return 100;
    }
  };

  const getDefaultContent = (toolId: string) => {
    switch (toolId) {
      case 'text': return 'Новый текст';
      case 'heading': return 'ЗАГОЛОВОК';
      case 'paragraph': return 'Новый абзац.\nНачните печатать здесь...';
      default: return '';
    }
  };

  const getEnhancedPropertiesForTool = (toolId: string) => {
    const baseProps = {
      borderRadius: 0,
      shadow: false,
      animation: 'none',
    };

    switch (toolId) {
      case 'text':
        return {
          ...baseProps,
          fontSize: 16,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          color: '#000000',
          backgroundColor: 'transparent',
          textAlign: 'center' as const,
        };
      case 'heading':
        return {
          ...baseProps,
          fontSize: 32,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          color: '#2c3e50',
          backgroundColor: 'transparent',
          textAlign: 'center' as const,
        };
      case 'paragraph':
        return {
          ...baseProps,
          fontSize: 14,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          color: '#2c3e50',
          backgroundColor: 'transparent',
          textAlign: 'left' as const,
        };
      case 'rectangle':
        return {
          ...baseProps,
          shapeType: 'rectangle' as const,
          backgroundColor: '#3498db',
          borderWidth: 2,
          borderColor: '#2980b9',
          borderStyle: 'solid',
          borderRadius: 8,
        };
      case 'circle':
        return {
          ...baseProps,
          shapeType: 'circle' as const,
          backgroundColor: '#e74c3c',
          borderWidth: 2,
          borderColor: '#c0392b',
          borderStyle: 'solid',
        };
      case 'triangle':
        return {
          ...baseProps,
          shapeType: 'triangle' as const,
          backgroundColor: '#f39c12',
          borderWidth: 2,
          borderColor: '#e67e22',
          borderStyle: 'solid',
        };
      case 'star':
        return {
          ...baseProps,
          shapeType: 'star' as const,
          backgroundColor: '#f1c40f',
          borderWidth: 2,
          borderColor: '#f39c12',
          borderStyle: 'solid',
        };
      case 'heart':
        return {
          ...baseProps,
          shapeType: 'heart' as const,
          backgroundColor: '#e91e63',
          borderWidth: 2,
          borderColor: '#c2185b',
          borderStyle: 'solid',
        };
      case 'line':
        return {
          ...baseProps,
          lineThickness: 3,
          color: '#34495e',
        };
      case 'gradient-bg':
        return {
          ...baseProps,
          shapeType: 'rectangle' as const,
          backgroundColor: '#3498db',
          gradient: {
            type: 'linear' as const,
            colors: ['#3498db', '#9b59b6'],
            direction: 45,
          },
        };
      default:
        return baseProps;
    }
  };

  return (
    <div className="relative group">
      <div
        ref={setNodeRef}
        {...(needsClickFunctionality ? {} : listeners)}
        {...(needsClickFunctionality ? {} : attributes)}
        onClick={needsClickFunctionality ? handleToolClick : handleGeneralToolClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          flex flex-col items-center p-4 rounded-xl transition-all duration-200 min-w-[80px] min-h-[80px]
          ${isDragging ? 'opacity-50 scale-95' : 'hover:scale-110'} 
          ${isSelected ? 'bg-blue-50 border-2 border-blue-400 shadow-lg' : 'bg-white border-2 border-gray-200'} 
          ${needsClickFunctionality ? 'cursor-pointer' : 'cursor-pointer hover:cursor-grab'} 
          hover:bg-gradient-to-br hover:from-white hover:to-gray-50 hover:shadow-lg
          hover:border-blue-300 group-hover:z-10
        `}
        title={needsClickFunctionality ? 'Нажмите для настройки' : 'Нажмите для добавления или перетащите на холст'}
      >
        {/* Enhanced drag handle for clickable tools */}
        {needsClickFunctionality && (
          <div
            {...listeners}
            {...attributes}
            className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-grab bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110"
            title="Перетащите для добавления на холст"
          >
            <div className="w-3 h-3 bg-white rounded-full opacity-80"></div>
          </div>
        )}
        
        {/* Hotkey indicator */}
        {tool.hotkey && tool.hotkey.trim() && (
          <div className="absolute -top-1 -right-1 bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            {tool.hotkey}
          </div>
        )}
        
        <IconComponent className={`h-7 w-7 mb-2 transition-colors ${isSelected ? 'text-blue-600' : 'text-gray-700 group-hover:text-blue-600'}`} />
        <span className={`text-xs text-center font-medium transition-colors leading-tight ${isSelected ? 'text-blue-700' : 'text-gray-600 group-hover:text-gray-800'}`}>
          {tool.label}
        </span>
        
        {/* Enhanced loading state */}
        {isUploading && (
          <div className="absolute inset-0 bg-white bg-opacity-95 flex flex-col items-center justify-center rounded-xl backdrop-blur-sm">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mb-2"></div>
            <span className="text-xs text-blue-600 font-medium">Загрузка...</span>
          </div>
        )}
        
        {/* Hidden file input */}
        {(tool.id === 'image' || tool.id === 'video' || tool.id === 'audio') && (
          <input
            ref={fileInputRef}
            type="file"
            accept={tool.id === 'video' ? 'video/*' : tool.id === 'audio' ? 'audio/*' : 'image/*'}
            onChange={handleFileUpload}
            className="hidden"
          />
        )}
      </div>
      
      {/* Enhanced tooltip */}
      {showTooltip && !isDragging && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-[9999] whitespace-nowrap">
          <div className="font-medium">{tool.label}</div>
          {tool.hotkey && tool.hotkey.trim() && <div className="text-gray-300">Горячая клавиша: {tool.hotkey}</div>}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
        </div>
      )}
      
      {/* Enhanced error display */}
      {uploadError && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg shadow-lg z-[90]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <X className="w-2 h-2 text-white" />
              </div>
              <span className="font-medium">Ошибка:</span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setUploadError(null);
              }}
              className="text-red-600 hover:text-red-800 transition-colors"
            >
              <X className="w-4 w-4" />
            </button>
          </div>
          <div className="mt-1 text-red-600">{uploadError}</div>
        </div>
      )}
    </div>
  );
}

// Enhanced Canvas Element Component with resize handles and advanced features
function CanvasElementComponent({ 
  element, 
  isSelected, 
  onSelect, 
  onUpdate,
  isEditing,
  onEdit,
  onGroup: _onGroup,
  isGrouped: _isGrouped = false,
  snapLines: _snapLines = [],
  onShowSnapLines: _onShowSnapLines
}: { 
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
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: element.id,
    data: { type: 'element', element },
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Apply transform using CSS transforms (performance optimized)
  const style = {
    position: 'absolute' as const,
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    transform: `
      ${transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : ''}
      rotate(${element.rotation}deg)
    `,
    opacity: isDragging ? 0.7 : element.opacity,
    zIndex: element.zIndex + (isDragging ? 1000 : 0),
    transition: isDragging ? 'none' : 'all 0.2s ease',
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Element clicked:', element.id);
    onSelect();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Element double clicked:', element.id);
    if (element.type === 'text' || element.type === 'paragraph') {
      onEdit(true);
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
              fontSize: element.properties.fontSize || 16,
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
              fontSize: element.properties.fontSize || 16,
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

    const borderStyle = element.properties.borderWidth && element.properties.borderWidth > 0 ? {
      border: `${element.properties.borderWidth}px ${element.properties.borderStyle || 'solid'} ${element.properties.borderColor || '#000000'}`
    } : {};

    switch (element.type) {
      case 'text':
        return (
          <div
            className="w-full h-full flex items-center justify-center cursor-text"
            style={{
              fontSize: element.properties.fontSize || 16,
              fontFamily: element.properties.fontFamily || 'Arial',
              fontWeight: element.properties.fontWeight || 'normal',
              fontStyle: element.properties.fontStyle || 'normal',
              textDecoration: element.properties.textDecoration || 'none',
              color: element.properties.color || '#000000',
              backgroundColor: element.properties.backgroundColor || 'transparent',
              textAlign: element.properties.textAlign || 'center',
              borderRadius: element.properties.borderRadius || 0,
              ...borderStyle,
            }}
          >
            {element.content || 'Новый текст'}
          </div>
        );
      case 'paragraph':
        return (
          <div
            className="w-full h-full p-2 cursor-text overflow-hidden"
            style={{
              fontSize: element.properties.fontSize || 14,
              fontFamily: element.properties.fontFamily || 'Arial',
              fontWeight: element.properties.fontWeight || 'normal',
              fontStyle: element.properties.fontStyle || 'normal',
              textDecoration: element.properties.textDecoration || 'none',
              color: element.properties.color || '#000000',
              backgroundColor: element.properties.backgroundColor || 'transparent',
              textAlign: element.properties.textAlign || 'left',
              borderRadius: element.properties.borderRadius || 0,
              whiteSpace: 'pre-wrap',
              ...borderStyle,
            }}
          >
            {element.content || 'Новый абзац\nНачните печатать...'}
          </div>
        );
      case 'shape':
        const renderShape = () => {
          const shapeStyle = {
            backgroundColor: element.properties.backgroundColor || '#e5e5e5',
            ...borderStyle,
          };

          switch (element.properties.shapeType) {
            case 'circle':
              return (
                <div
                  className="w-full h-full"
                  style={{
                    ...shapeStyle,
                    borderRadius: '50%',
                  }}
                />
              );
            case 'triangle':
              return (
                <div
                  className="w-full h-full"
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: `${element.width / 2}px solid transparent`,
                    borderRight: `${element.width / 2}px solid transparent`,
                    borderBottom: `${element.height}px solid ${element.properties.backgroundColor || '#e5e5e5'}`,
                    backgroundColor: 'transparent',
                  }}
                />
              );
            case 'star':
              return (
                <div className="w-full h-full flex items-center justify-center">
                  <Star 
                    className="w-full h-full" 
                    fill={element.properties.backgroundColor || '#e5e5e5'}
                    stroke={element.properties.borderColor || 'transparent'}
                    strokeWidth={element.properties.borderWidth || 0}
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '100%',
                      display: 'block'
                    }}
                  />
                </div>
              );
            case 'heart':
              return (
                <div className="w-full h-full flex items-center justify-center">
                  <Heart 
                    className="w-full h-full" 
                    fill={element.properties.backgroundColor || '#e5e5e5'}
                    stroke={element.properties.borderColor || 'transparent'}
                    strokeWidth={element.properties.borderWidth || 0}
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '100%',
                      display: 'block'
                    }}
                  />
                </div>
              );
            default: // rectangle
              return (
                <div
                  className="w-full h-full"
                  style={{
                    ...shapeStyle,
                    borderRadius: element.properties.borderRadius || 0,
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
              height: element.properties.lineThickness || 2,
              backgroundColor: element.properties.color || '#000000',
              top: '50%',
              position: 'relative',
              transform: 'translateY(-50%)',
              borderRadius: element.properties.borderRadius || 0,
            }}
          />
        );
      case 'arrow':
        return (
          <div className="w-full h-full flex items-center">
            <div
              className="flex-1"
              style={{
                height: element.properties.lineThickness || 2,
                backgroundColor: element.properties.color || '#000000',
              }}
            />
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: `${(element.properties.lineThickness || 2) * 3}px solid ${element.properties.color || '#000000'}`,
                borderTop: `${(element.properties.lineThickness || 2) * 2}px solid transparent`,
                borderBottom: `${(element.properties.lineThickness || 2) * 2}px solid transparent`,
              }}
            />
          </div>
        );
      case 'image':
        return (
          <div 
            className="w-full h-full bg-gray-100 flex items-center justify-center overflow-hidden"
            style={{
              borderRadius: element.properties.borderRadius || 0,
              ...borderStyle,
            }}
          >
            {element.properties.imageUrl ? (
              <Image 
                src={element.properties.imageUrl} 
                alt="Uploaded" 
                fill
                className="object-cover"
                style={{ borderRadius: element.properties.borderRadius || 0 }}
              />
            ) : (
              <div className="text-center text-gray-500">
                <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                <span className="text-sm">Изображение</span>
              </div>
            )}
          </div>
        );
      case 'video':
        return (
          <div 
            className="w-full h-full bg-gray-100 flex items-center justify-center overflow-hidden"
            style={{
              borderRadius: element.properties.borderRadius || 0,
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
                style={{ borderRadius: element.properties.borderRadius || 0 }}
                preload="metadata"
              />
            ) : (
              <div className="text-center text-gray-500">
                <Video className="h-8 w-8 mx-auto mb-2" />
                <span className="text-sm">Видео</span>
              </div>
            )}
          </div>
        );
      case 'audio':
        return (
          <div 
            className="w-full h-full bg-gray-100 flex items-center justify-center overflow-hidden"
            style={{
              borderRadius: element.properties.borderRadius || 0,
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
                style={{ borderRadius: element.properties.borderRadius || 0 }}
                preload="metadata"
              />
            ) : (
              <div className="text-center text-gray-500">
                <Volume2 className="h-8 w-8 mx-auto mb-2" />
                <span className="text-sm">Аудио</span>
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="w-full h-full flex items-center justify-center text-gray-600 bg-gray-100 border border-gray-300 rounded" style={borderStyle}>
            <span className="text-sm capitalize">{element.type}</span>
          </div>
        );
    }
  };

  // Resize handles
  const renderResizeHandles = () => {
    if (!isSelected || isDragging) return null;

    const handleStyle = "absolute w-2 h-2 bg-blue-500 border border-white rounded-full";
    
    return (
      <>
        {/* Corner handles */}
        <div className={`${handleStyle} -top-1 -left-1 cursor-nw-resize`} />
        <div className={`${handleStyle} -top-1 -right-1 cursor-ne-resize`} />
        <div className={`${handleStyle} -bottom-1 -left-1 cursor-sw-resize`} />
        <div className={`${handleStyle} -bottom-1 -right-1 cursor-se-resize`} />
        
        {/* Side handles */}
        <div className={`${handleStyle} -top-1 left-1/2 -translate-x-1/2 cursor-n-resize`} />
        <div className={`${handleStyle} -bottom-1 left-1/2 -translate-x-1/2 cursor-s-resize`} />
        <div className={`${handleStyle} -left-1 top-1/2 -translate-y-1/2 cursor-w-resize`} />
        <div className={`${handleStyle} -right-1 top-1/2 -translate-y-1/2 cursor-e-resize`} />
      </>
    );
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`group ${isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-gray-300'} cursor-move relative`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {renderContent()}
      {renderResizeHandles()}
    </div>
  );
}

// Canvas Drop Zone with Canva-style design
function CanvasDropZone({ 
  children, 
  settings,
  showGrid 
}: { 
  children: React.ReactNode;
  settings: CanvasSettings;
  showGrid: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas',
  });

  const canvasStyle = {
    width: settings.canvasWidth * 3.7795 * (settings.zoom / 100),
    height: settings.canvasHeight * 3.7795 * (settings.zoom / 100),
    transform: `scale(${settings.zoom / 100})`,
    transformOrigin: 'top left',
  };

  return (
    <div className="flex items-center justify-center p-8 bg-gray-50 min-h-full overflow-auto">
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
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
        )}
        
        {/* Page indicator */}
        <div className="absolute -top-8 left-0 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow">
          Страница {settings.currentPage} из {settings.totalPages}
        </div>
        
        {children}
      </div>
    </div>
  );
}

// Properties Panel Component
function PropertiesPanel({ 
  selectedElement, 
  onUpdate, 
  onClose 
}: { 
  selectedElement: CanvasElement | null;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  onClose: () => void;
}) {
  if (!selectedElement) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Свойства</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-center text-gray-500 py-8">
          Выберите элемент для редактирования
        </div>
      </div>
    );
  }

  const updateProperty = (key: string, value: string | number | boolean) => {
    onUpdate({
      properties: {
        ...selectedElement.properties,
        [key]: value,
      },
    });
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Свойства</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-6">
        {/* Position & Size */}
        <div>
          <h4 className="text-sm font-medium mb-3">Позиция и размер</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">X</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.x)}
                onChange={(e) => {
                  e.preventDefault();
                  onUpdate({ x: Number(e.target.value) });
                }}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Y</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.y)}
                onChange={(e) => {
                  e.preventDefault();
                  onUpdate({ y: Number(e.target.value) });
                }}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Ширина</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.width)}
                onChange={(e) => {
                  e.preventDefault();
                  onUpdate({ width: Number(e.target.value) });
                }}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Высота</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.height)}
                onChange={(e) => {
                  e.preventDefault();
                  onUpdate({ height: Number(e.target.value) });
                }}
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Text Properties */}
        {(selectedElement.type === 'text' || selectedElement.type === 'paragraph') && (
          <div>
            <h4 className="text-sm font-medium mb-3">Текст</h4>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Содержание</Label>
                {selectedElement.type === 'paragraph' ? (
                  <textarea
                    value={selectedElement.content}
                    onChange={(e) => {
                      e.preventDefault();
                      onUpdate({ content: e.target.value });
                    }}
                    className="w-full p-2 border border-gray-300 rounded text-sm h-20 resize-none"
                  />
                ) : (
                  <Input
                    value={selectedElement.content}
                    onChange={(e) => {
                      e.preventDefault();
                      onUpdate({ content: e.target.value });
                    }}
                    className="h-8"
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Размер шрифта</Label>
                  <Input
                    type="number"
                    value={selectedElement.properties.fontSize || 16}
                    onChange={(e) => {
                      e.preventDefault();
                      updateProperty('fontSize', Number(e.target.value));
                    }}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Цвет текста</Label>
                  <div className="flex space-x-1">
                    <Input
                      type="color"
                      value={selectedElement.properties.color || '#000000'}
                      onChange={(e) => {
                        e.preventDefault();
                        updateProperty('color', e.target.value);
                      }}
                      className="h-8 w-12 p-1 border rounded"
                    />
                    <Input
                      type="text"
                      value={selectedElement.properties.color || '#000000'}
                      onChange={(e) => {
                        e.preventDefault();
                        updateProperty('color', e.target.value);
                      }}
                      placeholder="#000000"
                      className="h-8 flex-1 text-xs"
                    />
                  </div>
                </div>
              </div>
              
              {/* Color Presets */}
              <div>
                <Label className="text-xs mb-2 block">Быстрые цвета</Label>
                <div className="grid grid-cols-8 gap-1">
                  {[
                    '#000000', '#ffffff', '#ff0000', '#00ff00', 
                    '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
                    '#800000', '#008000', '#000080', '#808000',
                    '#800080', '#008080', '#c0c0c0', '#808080'
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() => updateProperty('color', color)}
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-xs">Цвет фона</Label>
                <div className="flex space-x-1">
                  <Input
                    type="color"
                    value={selectedElement.properties.backgroundColor || '#ffffff'}
                    onChange={(e) => {
                      e.preventDefault();
                      updateProperty('backgroundColor', e.target.value);
                    }}
                    className="h-8 w-12 p-1 border rounded"
                  />
                  <Input
                    type="text"
                    value={selectedElement.properties.backgroundColor || '#ffffff'}
                    onChange={(e) => {
                      e.preventDefault();
                      updateProperty('backgroundColor', e.target.value);
                    }}
                    placeholder="#ffffff"
                    className="h-8 flex-1 text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateProperty('backgroundColor', 'transparent')}
                    className="h-8 px-2 text-xs"
                  >
                    Прозрачный
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Семейство шрифта</Label>
                  <select
                    value={selectedElement.properties.fontFamily || 'Arial'}
                    onChange={(e) => {
                      e.preventDefault();
                      updateProperty('fontFamily', e.target.value);
                    }}
                    className="w-full h-8 border border-gray-300 rounded text-sm"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Courier New">Courier New</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Выравнивание</Label>
                  <select
                    value={selectedElement.properties.textAlign || 'left'}
                    onChange={(e) => {
                      e.preventDefault();
                      updateProperty('textAlign', e.target.value);
                    }}
                    className="w-full h-8 border border-gray-300 rounded text-sm"
                  >
                    <option value="left">Слева</option>
                    <option value="center">По центру</option>
                    <option value="right">Справа</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={selectedElement.properties.fontWeight === 'bold' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    updateProperty('fontWeight', 
                      selectedElement.properties.fontWeight === 'bold' ? 'normal' : 'bold'
                    );
                  }}
                  className="flex-1"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant={selectedElement.properties.fontStyle === 'italic' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    updateProperty('fontStyle', 
                      selectedElement.properties.fontStyle === 'italic' ? 'normal' : 'italic'
                    );
                  }}
                  className="flex-1"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  variant={selectedElement.properties.textDecoration === 'underline' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    updateProperty('textDecoration', 
                      selectedElement.properties.textDecoration === 'underline' ? 'none' : 'underline'
                    );
                  }}
                  className="flex-1"
                >
                  <Underline className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Background & Border */}
        <div>
          <h4 className="text-sm font-medium mb-3">Фон и границы</h4>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Цвет фона</Label>
              <Input
                type="color"
                value={selectedElement.properties.backgroundColor || '#ffffff'}
                onChange={(e) => {
                  e.preventDefault();
                  updateProperty('backgroundColor', e.target.value);
                }}
                className="h-8"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Толщина границы</Label>
                <Input
                  type="number"
                  min="0"
                  value={selectedElement.properties.borderWidth || 0}
                  onChange={(e) => {
                    e.preventDefault();
                    updateProperty('borderWidth', Number(e.target.value));
                  }}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Цвет границы</Label>
                <Input
                  type="color"
                  value={selectedElement.properties.borderColor || '#000000'}
                  onChange={(e) => {
                    e.preventDefault();
                    updateProperty('borderColor', e.target.value);
                  }}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Радиус границы</Label>
                <Input
                  type="number"
                  min="0"
                  value={selectedElement.properties.borderRadius || 0}
                  onChange={(e) => {
                    e.preventDefault();
                    updateProperty('borderRadius', Number(e.target.value));
                  }}
                  className="h-8"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Стиль границы</Label>
              <select
                value={selectedElement.properties.borderStyle || 'solid'}
                onChange={(e) => {
                  e.preventDefault();
                  updateProperty('borderStyle', e.target.value);
                }}
                className="w-full h-8 border border-gray-300 rounded text-sm"
              >
                <option value="solid">Сплошная</option>
                <option value="dashed">Пунктирная</option>
                <option value="dotted">Точечная</option>
                <option value="double">Двойная</option>
              </select>
            </div>
          </div>
        </div>

        {/* Line/Arrow Properties */}
        {(selectedElement.type === 'line' || selectedElement.type === 'arrow') && (
          <div>
            <h4 className="text-sm font-medium mb-3">Линия</h4>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Толщина линии</Label>
                <Input
                  type="number"
                  min="1"
                  value={selectedElement.properties.lineThickness || 2}
                  onChange={(e) => {
                    e.preventDefault();
                    updateProperty('lineThickness', Number(e.target.value));
                  }}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Цвет линии</Label>
                <Input
                  type="color"
                  value={selectedElement.properties.color || '#000000'}
                  onChange={(e) => {
                    e.preventDefault();
                    updateProperty('color', e.target.value);
                  }}
                  className="h-8"
                />
              </div>
            </div>
          </div>
        )}

        {/* Image Properties */}
        {selectedElement.type === 'image' && (
          <div>
            <h4 className="text-sm font-medium mb-3">Изображение</h4>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">URL изображения</Label>
                <Input
                  value={selectedElement.properties.imageUrl || ''}
                  onChange={(e) => {
                    e.preventDefault();
                    updateProperty('imageUrl', e.target.value);
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="h-8"
                />
              </div>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={async () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        try {
                          const result = await uploadMedia(file, 'image');
                          if (result.success && result.url) {
                            updateProperty('imageUrl', result.url);
                            alert('Изображение успешно загружено!');
                          } else {
                            alert('Ошибка загрузки изображения: ' + result.error);
                          }
                        } catch (error) {
                          alert('Ошибка загрузки изображения');
                          console.error('Image upload error:', error);
                        }
                      }
                    };
                    input.click();
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Загрузить изображение
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Video Properties */}
        {selectedElement.type === 'video' && (
          <div>
            <h4 className="text-sm font-medium mb-3">Видео</h4>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">URL видео</Label>
                <Input
                  value={selectedElement.properties.videoUrl || ''}
                  onChange={(e) => {
                    e.preventDefault();
                    updateProperty('videoUrl', e.target.value);
                  }}
                  placeholder="https://example.com/video.mp4"
                  className="h-8"
                />
              </div>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={async () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'video/*';
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        try {
                          const result = await uploadMedia(file, 'video');
                          if (result.success && result.url) {
                            updateProperty('videoUrl', result.url);
                            alert('Видео успешно загружено!');
                          } else {
                            alert('Ошибка загрузки видео: ' + result.error);
                          }
                        } catch (error) {
                          alert('Ошибка загрузки видео');
                          console.error('Video upload error:', error);
                        }
                      }
                    };
                    input.click();
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Загрузить видео
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedElement.properties.controls !== false}
                    onChange={(e) => {
                      e.preventDefault();
                      updateProperty('controls', e.target.checked);
                    }}
                    className="rounded"
                  />
                  <span className="text-xs">Элементы управления</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedElement.properties.autoplay || false}
                    onChange={(e) => {
                      e.preventDefault();
                      updateProperty('autoplay', e.target.checked);
                    }}
                    className="rounded"
                  />
                  <span className="text-xs">Автовоспроизведение</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedElement.properties.muted !== false}
                    onChange={(e) => {
                      e.preventDefault();
                      updateProperty('muted', e.target.checked);
                    }}
                    className="rounded"
                  />
                  <span className="text-xs">Без звука</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedElement.properties.loop || false}
                    onChange={(e) => {
                      e.preventDefault();
                      updateProperty('loop', e.target.checked);
                    }}
                    className="rounded"
                  />
                  <span className="text-xs">Повтор</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Audio Properties */}
        {selectedElement.type === 'audio' && (
          <div>
            <h4 className="text-sm font-medium mb-3">Аудио</h4>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">URL аудио</Label>
                <Input
                  value={selectedElement.properties.audioUrl || ''}
                  onChange={(e) => {
                    e.preventDefault();
                    updateProperty('audioUrl', e.target.value);
                  }}
                  placeholder="https://example.com/audio.mp3"
                  className="h-8"
                />
              </div>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={async () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'audio/*';
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        try {
                          const result = await uploadMedia(file, 'audio');
                          if (result.success && result.url) {
                            updateProperty('audioUrl', result.url);
                            alert('Аудио успешно загружено!');
                          } else {
                            alert('Ошибка загрузки аудио: ' + result.error);
                          }
                        } catch (error) {
                          alert('Ошибка загрузки аудио');
                          console.error('Audio upload error:', error);
                        }
                      }
                    };
                    input.click();
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Загрузить аудио
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedElement.properties.autoplay || false}
                    onChange={(e) => {
                      e.preventDefault();
                      updateProperty('autoplay', e.target.checked);
                    }}
                    className="rounded"
                  />
                  <span className="text-xs">Автовоспроизведение</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedElement.properties.muted !== false}
                    onChange={(e) => {
                      e.preventDefault();
                      updateProperty('muted', e.target.checked);
                    }}
                    className="rounded"
                  />
                  <span className="text-xs">Без звука</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedElement.properties.loop || false}
                    onChange={(e) => {
                      e.preventDefault();
                      updateProperty('loop', e.target.checked);
                    }}
                    className="rounded"
                  />
                  <span className="text-xs">Повтор</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Transform */}
        <div>
          <h4 className="text-sm font-medium mb-3">Трансформация</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Поворот (°)</Label>
              <Input
                type="number"
                value={selectedElement.rotation || 0}
                onChange={(e) => {
                  e.preventDefault();
                  onUpdate({ rotation: Number(e.target.value) });
                }}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Прозрачность (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={Math.round((selectedElement.opacity || 1) * 100)}
                onChange={(e) => {
                  e.preventDefault();
                  onUpdate({ opacity: Number(e.target.value) / 100 });
                }}
                className="h-8"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Editor Component
function BookEditor() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { userProfile: _userProfile } = useAuth();
  
  // State
  const [book, setBook] = useState<Book | null>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [activeElement, setActiveElement] = useState<CanvasElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<CanvasElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [_uploadedMediaUrls, setUploadedMediaUrls] = useState<Record<string, string>>({});
  const [_changeLog, _setChangeLog] = useState<Array<{
    id: string;
    timestamp: Date;
    action: string;
    details: string;
    user: string;
  }>>([]);
  
  // UI State
  const [mainSidebarHidden, setMainSidebarHidden] = useState(searchParams?.get('hideSidebar') === 'true');
  const [toolsPanelOpen, setToolsPanelOpen] = useState(true);
  const [propertiesPanelOpen, setPropertiesPanelOpen] = useState(true);
  const [pagesPanelOpen, setPagesPanelOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState('content');

  // Canvas settings
  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>({
    zoom: 100,
    currentPage: 1,
    totalPages: 1,
    canvasWidth: 210, // A4 width in mm
    canvasHeight: 297, // A4 height in mm
    showGrid: false,
    twoPageView: false,
    snapToGrid: false,
    gridSize: 10,
    showRulers: false,
    showGuides: false,
    // Smart guides
    smartGuides: false,
    snapToElements: false,
    snapDistance: 10,
    // Performance settings
    renderQuality: 'normal',
    enableAnimations: true,
    maxUndoSteps: 50,
    // Auto-save settings
    autoSave: true,
    autoSaveInterval: 30, // in seconds
  });

  // Sensors with proper configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Generate unique ID
  const generateId = useCallback(() => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, []);

  // Smart element positioning function
  const _getSmartPosition = useCallback(() => {
    const canvasElement = document.querySelector('[data-canvas="true"]') as HTMLElement;
    if (!canvasElement) return { x: 100, y: 100 };

    const canvasRect = canvasElement.getBoundingClientRect();
    const zoomFactor = canvasSettings.zoom / 100;
    
    // Calculate center position
    let centerX = (canvasRect.width / 2) / zoomFactor;
    let centerY = (canvasRect.height / 2) / zoomFactor;
    
    // Add some random offset to avoid overlapping
    centerX += (Math.random() - 0.5) * 100;
    centerY += (Math.random() - 0.5) * 100;
    
    // Snap to grid if enabled
    if (canvasSettings.snapToGrid) {
      centerX = Math.round(centerX / canvasSettings.gridSize) * canvasSettings.gridSize;
      centerY = Math.round(centerY / canvasSettings.gridSize) * canvasSettings.gridSize;
    }
    
    return { x: Math.max(0, centerX - 50), y: Math.max(0, centerY - 25) };
  }, [canvasSettings]);

  // Add to history
  const addToHistory = useCallback((newElements: CanvasElement[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push([...newElements]);
      return newHistory.slice(-50); // Keep last 50 states
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Undo/Redo functionality
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setElements(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setElements(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Computed values
  const currentPageElements = elements.filter(el => el.page === canvasSettings.currentPage);
  const selectedElement = selectedElementId ? elements.find(el => el.id === selectedElementId) || null : null;

  // Load book data
  useEffect(() => {
    const loadBook = async () => {
      if (!params?.base_url) return;
      
      try {
        const supabase = createClient();
        const { data: bookData, error } = await supabase
          .from('books')
          .select('*')
          .eq('base_url', params.base_url)
          .single();
        
        if (error) throw error;
        
        setBook(bookData);
        
        // Load canvas data
        if (bookData.canvas_elements) {
          try {
            const parsedElements = JSON.parse(bookData.canvas_elements);
            setElements(parsedElements);
            addToHistory(parsedElements);
          } catch (e) {
            console.error('Error parsing canvas elements:', e);
          }
        }
        
        if (bookData.canvas_settings) {
          try {
            const parsedSettings = JSON.parse(bookData.canvas_settings);
            setCanvasSettings(prev => ({ ...prev, ...parsedSettings }));
          } catch (e) {
            console.error('Error parsing canvas settings:', e);
          }
        }
      } catch (error) {
        console.error('Error loading book:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBook();
  }, [params?.base_url, addToHistory]);

  // Save functionality
  const handleSave = useCallback(async () => {
    if (!book) return;
    
    try {
      // Show loading notification
      const loadingNotification = document.createElement('div');
      loadingNotification.id = 'save-loading';
      loadingNotification.className = 'fixed top-4 right-4 bg-blue-500 text-white p-3 rounded-lg shadow-lg z-50';
      loadingNotification.textContent = 'Сохранение...';
      document.body.appendChild(loadingNotification);

      const supabase = createClient();
      const { error } = await supabase
        .from('books')
        .update({
          canvas_elements: JSON.stringify(elements),
          canvas_settings: JSON.stringify(canvasSettings),
          updated_at: new Date().toISOString(),
          // Устанавливаем статус 'Draft' если он не определен
          ...(book.status === undefined && { status: 'Draft' })
        })
        .eq('id', book.id);
      
      // Remove loading notification
      const existingLoading = document.getElementById('save-loading');
      if (existingLoading) {
        document.body.removeChild(existingLoading);
      }

      if (error) throw error;
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50';
      notification.innerHTML = `
        <div class="flex items-center">
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
          </svg>
          Изменения сохранены!
        </div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 3000);
    } catch (error) {
      // Remove loading notification if it exists
      const existingLoading = document.getElementById('save-loading');
      if (existingLoading) {
        document.body.removeChild(existingLoading);
      }

      console.error('Save error:', error);
      
      // Show error notification
      const errorNotification = document.createElement('div');
      errorNotification.className = 'fixed top-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50 max-w-md';
      errorNotification.innerHTML = `
        <div class="flex items-start">
          <svg class="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
          </svg>
          <div>
            <div class="font-medium">Ошибка сохранения</div>
            <div class="text-sm opacity-90">${error instanceof Error ? error.message : 'Неизвестная ошибка'}</div>
          </div>
        </div>
      `;
      document.body.appendChild(errorNotification);
      setTimeout(() => {
        if (document.body.contains(errorNotification)) {
          document.body.removeChild(errorNotification);
        }
      }, 5000);
    }
  }, [book, elements, canvasSettings]);

  // Book management functions for different roles
  const handleSendToModeration = useCallback(async () => {
    if (!book || !_userProfile) return;
    
    if (!confirm(`Отправить книгу "${book.title}" на модерацию? После отправки вы не сможете её редактировать.`)) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('books')
        .update({ status: 'Moderation' })
        .eq('id', book.id);

      if (error) throw error;

      // Update local book state
      setBook(prev => prev ? { ...prev, status: 'Moderation' } : null);
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-blue-500 text-white p-3 rounded-lg shadow-lg z-50';
      notification.textContent = 'Книга отправлена на модерацию!';
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 3000);
    } catch (error) {
      console.error('Error sending to moderation:', error);
      alert('Ошибка отправки на модерацию');
    }
  }, [book, _userProfile]);

  const handleApproveBook = useCallback(async () => {
    if (!book || !_userProfile) return;
    
    if (!confirm(`Одобрить книгу "${book.title}"?`)) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('books')
        .update({ 
          status: 'Approved',
          moderator_id: _userProfile.id
        })
        .eq('id', book.id);

      if (error) throw error;

      setBook(prev => prev ? { ...prev, status: 'Approved' } : null);
      
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50';
      notification.textContent = 'Книга одобрена!';
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 3000);
    } catch (error) {
      console.error('Error approving book:', error);
      alert('Ошибка одобрения книги');
    }
  }, [book, _userProfile]);

  const handleActivateBook = useCallback(async () => {
    if (!book || !_userProfile) return;
    
    if (!confirm(`Активировать книгу "${book.title}"? Она станет доступна для покупки.`)) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('books')
        .update({ status: 'Active' })
        .eq('id', book.id);

      if (error) throw error;

      setBook(prev => prev ? { ...prev, status: 'Active' } : null);
      
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-purple-500 text-white p-3 rounded-lg shadow-lg z-50';
      notification.textContent = 'Книга активирована!';
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 3000);
    } catch (error) {
      console.error('Error activating book:', error);
      alert('Ошибка активации книги');
    }
  }, [book, _userProfile]);

  const handleRejectBook = useCallback(async () => {
    if (!book || !_userProfile) return;
    
    const reason = prompt('Укажите причину отклонения книги:');
    if (!reason) return;
    
    if (!confirm(`Отклонить книгу "${book.title}"?`)) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('books')
        .update({ 
          status: 'Rejected',
          rejection_reason: reason
        })
        .eq('id', book.id);

      if (error) throw error;

      setBook(prev => prev ? { ...prev, status: 'Rejected' } : null);
      
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50';
      notification.textContent = 'Книга отклонена!';
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 3000);
    } catch (error) {
      console.error('Error rejecting book:', error);
      alert('Ошибка отклонения книги');
    }
  }, [book, _userProfile]);

  const handleArchiveBook = useCallback(async () => {
    if (!book || !_userProfile) return;
    
    if (!confirm(`Архивировать книгу "${book.title}"? Она будет скрыта от пользователей.`)) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('books')
        .update({ status: 'Draft' })
        .eq('id', book.id);

      if (error) throw error;

      setBook(prev => prev ? { ...prev, status: 'Draft' } : null);
      
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-gray-500 text-white p-3 rounded-lg shadow-lg z-50';
      notification.textContent = 'Книга архивирована!';
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 3000);
    } catch (error) {
      console.error('Error archiving book:', error);
      alert('Ошибка архивирования книги');
    }
  }, [book, _userProfile]);

  // Element management
  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => {
      const newElements = prev.map(el => el.id === id ? { ...el, ...updates } : el);
      addToHistory(newElements);
      return newElements;
    });
  }, [addToHistory]);

  const deleteElement = useCallback((id: string) => {
    setElements(prev => {
      const newElements = prev.filter(el => el.id !== id);
      addToHistory(newElements);
      return newElements;
    });
    setSelectedElementId(null);
  }, [addToHistory]);

  const duplicateElement = useCallback((id: string) => {
    const element = elements.find(el => el.id === id);
    if (!element) return;
    
    const duplicate = {
      ...element,
      id: generateId(),
      x: element.x + 20,
      y: element.y + 20,
    };
    
    setElements(prev => {
      const newElements = [...prev, duplicate];
      addToHistory(newElements);
      return newElements;
    });
  }, [elements, generateId, addToHistory]);

  // Layer management
  const moveElementUp = useCallback((id: string) => {
    setElements(prev => {
      const newElements = prev.map(el => 
        el.id === id ? { ...el, zIndex: el.zIndex + 1 } : el
      );
      addToHistory(newElements);
      return newElements;
    });
  }, [addToHistory]);

  const moveElementDown = useCallback((id: string) => {
    setElements(prev => {
      const newElements = prev.map(el => 
        el.id === id ? { ...el, zIndex: Math.max(0, el.zIndex - 1) } : el
      );
      addToHistory(newElements);
      return newElements;
    });
  }, [addToHistory]);

  // Media upload handler
  const handleMediaUploaded = useCallback((url: string, type: string) => {
    console.log('Media uploaded:', { url, type });
    setUploadedMediaUrls(prev => ({ ...prev, [type]: url }));
    
    // Automatically create element if no element is currently being dragged
    const canvasElement = document.querySelector('[data-canvas="true"]') as HTMLElement;
    let position = { x: 100, y: 100 };
    
    if (canvasElement) {
      const canvasRect = canvasElement.getBoundingClientRect();
      const zoomFactor = canvasSettings.zoom / 100;
      
      // Calculate center position
      let centerX = (canvasRect.width / 2) / zoomFactor;
      let centerY = (canvasRect.height / 2) / zoomFactor;
      
      // Add some random offset to avoid overlapping
      centerX += (Math.random() - 0.5) * 100;
      centerY += (Math.random() - 0.5) * 100;
      
      // Snap to grid if enabled
      if (canvasSettings.snapToGrid) {
        centerX = Math.round(centerX / canvasSettings.gridSize) * canvasSettings.gridSize;
        centerY = Math.round(centerY / canvasSettings.gridSize) * canvasSettings.gridSize;
      }
      
      position = { x: Math.max(0, centerX - 50), y: Math.max(0, centerY - 25) };
    }
    
    let newElement: CanvasElement;
    
    if (type === 'image') {
      newElement = {
        id: generateId(),
        type: 'image',
        x: position.x,
        y: position.y,
        width: 200,
        height: 150,
        content: '',
        page: canvasSettings.currentPage,
        zIndex: elements.length,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        properties: {
          imageUrl: url,
          borderRadius: 8,
          shadow: false,
        },
      };
    } else if (type === 'video') {
      newElement = {
        id: generateId(),
        type: 'video',
        x: position.x,
        y: position.y,
        width: 300,
        height: 200,
        content: '',
        page: canvasSettings.currentPage,
        zIndex: elements.length,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        properties: {
          videoUrl: url,
          controls: true,
          autoplay: false,
          muted: true,
          loop: false,
          borderRadius: 8,
        },
      };
    } else if (type === 'audio') {
      newElement = {
        id: generateId(),
        type: 'audio',
        x: position.x,
        y: position.y,
        width: 300,
        height: 60,
        content: '',
        page: canvasSettings.currentPage,
        zIndex: elements.length,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        properties: {
          audioUrl: url,
          controls: true,
          autoplay: false,
          muted: false,
          loop: false,
          borderRadius: 8,
        },
      };
    } else {
      return; // Unknown type
    }
    
    // Add element to canvas
    setElements(prev => {
      const newElements = [...prev, newElement];
      addToHistory(newElements);
      return newElements;
    });
    
    // Show notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50';
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>${type === 'video' ? 'Видео' : type === 'audio' ? 'Аудио' : 'Изображение'} добавлено на холст!</span>
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  }, [generateId, canvasSettings, elements.length, addToHistory]);
  
  // Sidebar toggle
  const toggleMainSidebar = useCallback(() => {
    setMainSidebarHidden(prev => !prev);
  }, []);

  // Page management
  const handlePageChange = useCallback((page: number) => {
    setCanvasSettings(prev => ({ ...prev, currentPage: page }));
  }, []);

  const handlePageAdd = useCallback(() => {
    setCanvasSettings(prev => ({
      ...prev,
      totalPages: prev.totalPages + 1,
      currentPage: prev.totalPages + 1
    }));
  }, []);

  const handlePageDelete = useCallback((page: number) => {
    if (canvasSettings.totalPages <= 1) return;
    
    setElements(prev => {
      const newElements = prev.filter(el => el.page !== page);
      addToHistory(newElements);
      return newElements;
    });
    
    setCanvasSettings(prev => ({
      ...prev,
      totalPages: prev.totalPages - 1,
      currentPage: Math.min(prev.currentPage, prev.totalPages - 1)
    }));
  }, [canvasSettings.totalPages, addToHistory]);

  // Create element from tool with enhanced types
  const createElementFromTool = useCallback((toolType: string, x: number, y: number, _mediaUrl?: string): CanvasElement => {
    const baseElement = {
      id: generateId(),
      x: Math.max(0, x),
      y: Math.max(0, y),
      page: canvasSettings.currentPage,
      zIndex: elements.length,
      rotation: 0,
      opacity: 1,
    };

    switch (toolType) {
      case 'text':
        return {
          ...baseElement,
          type: 'text',
          width: 150,
          height: 40,
          content: 'Новый текст',
          properties: {
            fontSize: 16,
            fontFamily: 'Arial',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'none',
            color: '#000000',
            backgroundColor: 'transparent',
            textAlign: 'center',
            verticalAlign: 'middle',
            borderRadius: 0,
          },
        };
      default:
        return {
          ...baseElement,
          type: 'text',
          width: 100,
          height: 40,
          content: '',
          properties: {},
        };
    }
  }, [generateId, canvasSettings.currentPage, elements.length]);

  // Drag and drop handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const element = elements.find(el => el.id === active.id);
    if (element) {
      setActiveElement(element);
    }
  }, [elements]);

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Handle drag over logic
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over, delta } = event;
    setActiveElement(null);
    
    if (!over || !delta) return;
    
    // Handle drop on canvas
    if (over.id === 'canvas') {
      if (active.data.current?.type === 'tool') {
        const toolType = active.data.current.toolType;
        const canvasElement = document.querySelector('[data-canvas="true"]') as HTMLElement;
        if (canvasElement) {
          const rect = canvasElement.getBoundingClientRect();
          const activatorEvent = event.activatorEvent as MouseEvent;
          const x = activatorEvent.clientX - rect.left;
          const y = activatorEvent.clientY - rect.top;
          
          const newElement = createElementFromTool(toolType, x, y);
          setElements(prev => {
            const newElements = [...prev, newElement];
            addToHistory(newElements);
            return newElements;
          });
        }
      } else if (active.data.current?.type === 'element') {
        // Move existing element
        const element = elements.find(el => el.id === active.id);
        if (element) {
          updateElement(element.id, {
            x: element.x + delta.x,
            y: element.y + delta.y,
          });
        }
      }
    }
  }, [elements, createElementFromTool, updateElement, addToHistory]);

  // Listen for tool addition events
  useEffect(() => {
    const handleAddToolToCanvas = (event: CustomEvent) => {
      const { element } = event.detail;
      setElements(prev => {
        const newElements = [...prev, element];
        addToHistory(newElements);
        return newElements;
      });
    };

    window.addEventListener('addToolToCanvas', handleAddToolToCanvas as EventListener);
    return () => {
      window.removeEventListener('addToolToCanvas', handleAddToolToCanvas as EventListener);
    };
  }, [addToHistory]);

  const handlePageDuplicate = useCallback((page: number) => {
    // Get all elements from the source page
    const pageElements = elements.filter(el => el.page === page);
    
    // Create duplicated elements for the new page
    const duplicatedElements = pageElements.map(el => ({
      ...el,
      id: generateId(),
      page: canvasSettings.totalPages + 1
    }));
    
    setElements(prev => {
      const newElements = [...prev, ...duplicatedElements];
      addToHistory(newElements);
      return newElements;
    });
    
    setCanvasSettings(prev => ({
      ...prev,
      totalPages: prev.totalPages + 1,
      currentPage: prev.totalPages + 1
    }));
  }, [elements, canvasSettings.totalPages, addToHistory, generateId]);

  const handlePageMove = useCallback((fromPage: number, toPage: number) => {
    if (fromPage === toPage) return;
    
    setElements(prev => {
      const newElements = prev.map(el => {
        if (el.page === fromPage) {
          return { ...el, page: toPage };
        } else if (fromPage < toPage && el.page > fromPage && el.page <= toPage) {
          return { ...el, page: el.page - 1 };
        } else if (fromPage > toPage && el.page >= toPage && el.page < fromPage) {
          return { ...el, page: el.page + 1 };
        }
        return el;
      });
      addToHistory(newElements);
      return newElements;
    });
    
    setCanvasSettings(prev => ({ ...prev, currentPage: toPage }));
  }, [addToHistory]);

  // Export functions for approved books
  const handleExportHTML = useCallback(async () => {
    if (!book) return;
    
    try {
      // Generate HTML content from canvas elements
      const htmlContent = generateHTMLFromElements(elements, canvasSettings, book);
      
      // Create and download file
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50';
      notification.textContent = 'HTML файл успешно скачан!';
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 3000);
    } catch (error) {
      console.error('Error exporting HTML:', error);
      alert('Ошибка экспорта в HTML');
    }
  }, [book, elements, canvasSettings]);

  const handleExportPDF = useCallback(async () => {
    if (!book) return;
    
    try {
      // Generate PDF content (simplified version)
      const pdfContent = generatePDFFromElements(elements, canvasSettings, book);
      
      // Create and download file
      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50';
      notification.textContent = 'PDF файл успешно скачан!';
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 3000);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Ошибка экспорта в PDF');
    }
  }, [book, elements, canvasSettings]);

  const handleExportJSON = useCallback(async () => {
    if (!book) return;
    
    try {
      // Export book data as JSON
      const exportData = {
        book: {
          title: book.title,
          description: book.description,
          created_at: book.created_at,
          updated_at: book.updated_at
        },
        elements: elements,
        settings: canvasSettings
      };
      
      const jsonContent = JSON.stringify(exportData, null, 2);
      
      // Create and download file
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50';
      notification.textContent = 'JSON файл успешно скачан!';
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 3000);
    } catch (error) {
      console.error('Error exporting JSON:', error);
      alert('Ошибка экспорта в JSON');
    }
  }, [book, elements, canvasSettings]);

  // Export source code for editing (for moderators, super admins, teachers)
  const handleExportSourceCode = useCallback(async () => {
    if (!book) return;
    
    try {
      // Generate editable HTML/CSS source code
      const sourceCode = generateEditableSourceCode(elements, canvasSettings, book);
      
      // Create and download file
      const blob = new Blob([sourceCode], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}_source.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-purple-500 text-white p-3 rounded-lg shadow-lg z-50';
      notification.textContent = 'Исходный код успешно скачан для редактирования!';
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 3000);
    } catch (error) {
      console.error('Error exporting source code:', error);
      alert('Ошибка экспорта исходного кода');
    }
  }, [book, elements, canvasSettings]);

  // Helper function to generate HTML from elements
  const generateHTMLFromElements = (elements: CanvasElement[], settings: CanvasSettings, book: Book): string => {
    const pages = Array.from({ length: settings.totalPages }, (_, i) => i + 1);
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${book.title}</title>
    <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f5f5f5; }
        .book-container { max-width: ${settings.canvasWidth * 3.7795}px; margin: 0 auto; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .page { position: relative; width: ${settings.canvasWidth * 3.7795}px; height: ${settings.canvasHeight * 3.7795}px; margin: 20px 0; page-break-after: always; overflow: hidden; }
        .element { position: absolute; }
        .text-element { display: flex; align-items: center; justify-content: center; }
        .paragraph-element { padding: 8px; white-space: pre-wrap; }
        .shape-element { }
        .image-element { background-size: cover; background-position: center; }
        @media print { body { background: white; padding: 0; } .page { margin: 0; box-shadow: none; } }
    </style>
</head>
<body>
    <div class="book-container">
        <h1 style="text-align: center; padding: 20px; margin: 0; border-bottom: 1px solid #ddd;">${book.title}</h1>
        ${pages.map(pageNum => {
          const pageElements = elements.filter(el => el.page === pageNum);
          return `
        <div class="page" data-page="${pageNum}">
            ${pageElements.map(el => {
              const style = `
                left: ${el.x}px;
                top: ${el.y}px;
                width: ${el.width}px;
                height: ${el.height}px;
                transform: rotate(${el.rotation}deg);
                opacity: ${el.opacity};
                z-index: ${el.zIndex};
                ${el.properties.fontSize ? `font-size: ${el.properties.fontSize}px;` : ''}
                ${el.properties.fontFamily ? `font-family: ${el.properties.fontFamily};` : ''}
                ${el.properties.fontWeight ? `font-weight: ${el.properties.fontWeight};` : ''}
                ${el.properties.color ? `color: ${el.properties.color};` : ''}
                ${el.properties.backgroundColor ? `background-color: ${el.properties.backgroundColor};` : ''}
                ${el.properties.textAlign ? `text-align: ${el.properties.textAlign};` : ''}
                ${el.properties.borderRadius ? `border-radius: ${el.properties.borderRadius}px;` : ''}
              `;
              
              return `<div class="element ${el.type}-element" style="${style}">${el.content || ''}</div>`;
            }).join('')}
        </div>`;
        }).join('')}
    </div>
</body>
</html>`;
    
    return htmlContent;
  };

  // Helper function to generate PDF content (basic implementation)
  const generatePDFFromElements = (elements: CanvasElement[], settings: CanvasSettings, book: Book): string => {
    // This is a simplified PDF generation - in real implementation you'd use a library like jsPDF
    return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 ${settings.canvasWidth * 2.83} ${settings.canvasHeight * 2.83}]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(${book.title}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
338
%%EOF`;
  };

  // Helper function to generate editable source code
  const generateEditableSourceCode = (elements: CanvasElement[], settings: CanvasSettings, book: Book): string => {
    const pages = Array.from({ length: settings.totalPages }, (_, i) => i + 1);
    
    // Generate CSS classes for each element type
    const generateCSS = () => {
      const css = `
        /* ==============================================
           РЕДАКТИРУЕМЫЕ СТИЛИ КНИГИ: ${book.title}
           ============================================== */
        
        /* Основные стили страницы */
        body {
            margin: 0;
            padding: 20px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
        }
        
        .book-container {
            max-width: ${settings.canvasWidth * 3.7795}px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            border-radius: 8px;
            overflow: hidden;
        }
        
        .book-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 30px 20px;
            margin-bottom: 0;
        }
        
        .book-title {
            font-size: 2.5em;
            margin: 0;
            font-weight: 300;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .book-description {
            margin: 10px 0 0 0;
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .page {
            position: relative;
            width: ${settings.canvasWidth * 3.7795}px;
            height: ${settings.canvasHeight * 3.7795}px;
            margin: 0;
            page-break-after: always;
            overflow: hidden;
            background: #ffffff;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .page:last-child {
            border-bottom: none;
        }
        
        .page-number {
            position: absolute;
            bottom: 10px;
            right: 20px;
            font-size: 12px;
            color: #888;
            background: rgba(255,255,255,0.8);
            padding: 5px 10px;
            border-radius: 15px;
        }
        
        /* Стили элементов */
        .element {
            position: absolute;
            transition: all 0.3s ease;
        }
        
        .element:hover {
            transform: scale(1.02);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .text-element {
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border-radius: 4px;
        }
        
        .paragraph-element {
            padding: 12px;
            white-space: pre-wrap;
            line-height: 1.6;
            border-radius: 8px;
            background: rgba(255,255,255,0.9);
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .shape-element {
            border-radius: 4px;
            transition: all 0.3s ease;
        }
        
        .image-element {
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }
        
        .line-element {
            background: #333;
        }
        
        .arrow-element {
            background: #333;
        }
        
        /* Адаптивные стили */
        @media screen and (max-width: 768px) {
            body { padding: 10px; }
            .book-container { margin: 0; }
            .book-title { font-size: 2em; }
        }
        
        @media print {
            body { 
                background: white !important; 
                padding: 0 !important; 
            }
            .book-container { 
                box-shadow: none !important; 
                border-radius: 0 !important; 
            }
            .page { 
                margin: 0 !important; 
                box-shadow: none !important; 
                border: none !important; 
            }
            .element:hover {
                transform: none !important;
                box-shadow: none !important;
            }
        }
        
        /* Кастомные стили для редактирования */
        .editable-text {
            border: 2px dashed transparent;
            transition: border-color 0.3s ease;
        }
        
        .editable-text:hover {
            border-color: #007bff;
            background: rgba(0,123,255,0.05);
        }
        
        .highlight-important {
            background: linear-gradient(120deg, #a8edea 0%, #fed6e3 100%) !important;
            padding: 8px 12px;
            border-radius: 6px;
            font-weight: 500;
        }
        
        .call-to-action {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            color: white !important;
            padding: 15px 25px;
            border-radius: 25px;
            text-align: center;
            font-weight: bold;
            box-shadow: 0 6px 20px rgba(102,126,234,0.4);
        }
      `;
      
      return css;
    };
    
    // Generate HTML structure
    const htmlContent = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${book.title} - Исходный код для редактирования</title>
    <style>
        ${generateCSS()}
    </style>
</head>
<body>
    <!-- ИНСТРУКЦИЯ ПО РЕДАКТИРОВАНИЮ -->
    <!-- 
    Этот файл содержит исходный код книги "${book.title}" для редактирования.
    
    КАК РЕДАКТИРОВАТЬ:
    1. Откройте этот файл в любом текстовом редакторе (VS Code, Sublime Text, Notepad++)
    2. Измените содержимое между тегами HTML
    3. Настройте стили в секции <style> выше
    4. Сохраните файл и откройте в браузере для просмотра
    
    СТРУКТУРА:
    - Секция <style> содержит все CSS стили
    - Каждая страница находится в элементе .page
    - Элементы книги имеют классы .element, .text-element, .paragraph-element и т.д.
    
    ПОЛЕЗНЫЕ КЛАССЫ:
    - .highlight-important - выделение важного текста
    - .call-to-action - кнопки призыва к действию
    - .editable-text - редактируемый текст с hover-эффектом
    -->
    
    <div class="book-container">
        <div class="book-header">
            <h1 class="book-title">${book.title}</h1>
            ${book.description ? `<p class="book-description">${book.description}</p>` : ''}
        </div>
        
        ${pages.map(pageNum => {
          const pageElements = elements.filter(el => el.page === pageNum);
          return `
        <!-- СТРАНИЦА ${pageNum} -->
        <div class="page" data-page="${pageNum}" id="page-${pageNum}">
            <div class="page-number">Страница ${pageNum}</div>
            ${pageElements.map((el, index) => {
              const style = `
                left: ${el.x}px;
                top: ${el.y}px;
                width: ${el.width}px;
                height: ${el.height}px;
                transform: rotate(${el.rotation}deg);
                opacity: ${el.opacity};
                z-index: ${el.zIndex};
                ${el.properties.fontSize ? `font-size: ${el.properties.fontSize}px;` : ''}
                ${el.properties.fontFamily ? `font-family: '${el.properties.fontFamily}', sans-serif;` : ''}
                ${el.properties.fontWeight ? `font-weight: ${el.properties.fontWeight};` : ''}
                ${el.properties.color ? `color: ${el.properties.color};` : ''}
                ${el.properties.backgroundColor ? `background-color: ${el.properties.backgroundColor};` : ''}
                ${el.properties.textAlign ? `text-align: ${el.properties.textAlign};` : ''}
                ${el.properties.borderRadius ? `border-radius: ${el.properties.borderRadius}px;` : ''}
                ${el.properties.borderColor ? `border: ${el.properties.borderWidth || 1}px solid ${el.properties.borderColor};` : ''}
              `.trim();
              
              const elementId = `element-${pageNum}-${index}`;
              const classes = `element ${el.type}-element ${el.type === 'text' || el.type === 'paragraph' ? 'editable-text' : ''}`;
              
              return `
            <!-- ЭЛЕМЕНТ: ${el.type.toUpperCase()} -->
            <div id="${elementId}" class="${classes}" style="${style}">
                ${el.content || ''}
            </div>`;
            }).join('')}
        </div>`;
        }).join('')}
        
        <!-- ФУТЕР С ИНФОРМАЦИЕЙ -->
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; border-top: 1px solid #dee2e6;">
            <p><strong>Исходный код книги:</strong> ${book.title}</p>
            <p>Экспортировано: ${new Date().toLocaleDateString('ru-RU')} в ${new Date().toLocaleTimeString('ru-RU')}</p>
            <p>Система: EduAdmin | Редактируемый HTML/CSS</p>
            <p style="margin-top: 15px; font-size: 14px;">
                💡 <strong>Совет:</strong> Используйте классы .highlight-important и .call-to-action для стилизации важных элементов
            </p>
        </div>
    </div>
    
    <!-- JAVASCRIPT ДЛЯ ИНТЕРАКТИВНОСТИ (ОПЦИОНАЛЬНО) -->
    <script>
        // Простая интерактивность для редактируемых элементов
        document.addEventListener('DOMContentLoaded', function() {
            const editableElements = document.querySelectorAll('.editable-text');
            
            editableElements.forEach(element => {
                element.addEventListener('click', function() {
                    this.classList.toggle('highlight-important');
                });
                
                element.addEventListener('dblclick', function() {
                    this.classList.toggle('call-to-action');
                });
            });
            
            // Логирование изменений
            console.log('📚 Исходный код книги "${book.title}" загружен');
            console.log('🔧 Для редактирования откройте этот файл в текстовом редакторе');
            console.log('✨ Клик по тексту - выделение важного, двойной клик - кнопка действия');
        });
    </script>
</body>
</html>`;
    
    return htmlContent;
  };

  // Log changes
  const _logChange = useCallback((action: string, details: string, user = 'Текущий пользователь') => {
    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      action,
      details,
      user
    };
    
    _setChangeLog(prev => [newLog, ...prev.slice(0, 99)]); // Keep only last 100 changes
    
    // Store in localStorage for persistence
    try {
      const existingLogs = JSON.parse(localStorage.getItem(`book_logs_${params?.base_url}`) || '[]');
      const updatedLogs = [newLog, ...existingLogs.slice(0, 99)];
      localStorage.setItem(`book_logs_${params?.base_url}`, JSON.stringify(updatedLogs));
    } catch (error) {
      console.error('Failed to save change log:', error);
    }
  }, [params?.base_url]);

  // Define unused callback functions to fix TypeScript errors
  const _onGroup = useCallback((_elementIds: string[]) => {
    // Group functionality placeholder
  }, []);

  const _isGrouped = false;
  const _snapLines: Array<{x?: number, y?: number}> = [];
  const _onShowSnapLines = useCallback((_lines: Array<{x?: number, y?: number}>) => {
    // Snap lines functionality placeholder
  }, []);

  // Load change log on component mount
  useEffect(() => {
    try {
      const savedLogs = JSON.parse(localStorage.getItem(`book_logs_${params?.base_url}`) || '[]');
      _setChangeLog(savedLogs.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp)
      })));
    } catch (error) {
      console.error('Failed to load change log:', error);
    }
  }, [params?.base_url]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка редактора...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Книга не найдена</h2>
          <p className="text-gray-600">Проверьте правильность ссылки</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      autoScroll={false}
    >
      <div className="h-screen bg-gray-50 flex flex-col">
        {/* Header - Canva style */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between shadow-sm z-40 relative min-w-0">
          <div className="flex items-center space-x-4 flex-shrink-0">
            {/* Sidebar toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMainSidebar}
              className="text-gray-600 hover:bg-gray-100 transition-colors h-9"
              title={mainSidebarHidden ? "Показать главную панель" : "Скрыть главную панель"}
            >
              {mainSidebarHidden ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Button>

            {/* Book title */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                {book.title.charAt(0).toUpperCase()}
              </div>
              <h1 className="font-semibold text-gray-900 truncate max-w-xs">
                {book.title}
              </h1>
              <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                Редактирование
              </div>
            </div>

            {/* Undo/Redo */}
            <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
                className="text-gray-600 hover:bg-white hover:shadow-sm transition-all disabled:opacity-50 h-9"
                title="Отменить (Ctrl+Z)"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="text-gray-600 hover:bg-white hover:shadow-sm transition-all disabled:opacity-50 h-9"
                title="Повторить (Ctrl+Y)"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Center controls */}
          <div className="flex items-center space-x-6 flex-shrink-0">
            {/* Zoom controls */}
            <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCanvasSettings(prev => ({ 
                  ...prev, 
                  zoom: Math.max(10, prev.zoom - 10) 
                }))}
                className="text-gray-600 hover:bg-white hover:shadow-sm transition-all h-9"
                title="Уменьшить масштаб"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 min-w-[50px] text-center font-medium">
                  {canvasSettings.zoom}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCanvasSettings(prev => ({ ...prev, zoom: 100 }))}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 h-8"
                  title="Сбросить масштаб"
                >
                  100%
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCanvasSettings(prev => ({ 
                  ...prev, 
                  zoom: Math.min(300, prev.zoom + 10) 
                }))}
                className="text-gray-600 hover:bg-white hover:shadow-sm transition-all h-9"
                title="Увеличить масштаб"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {/* Page navigation */}
            <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCanvasSettings(prev => ({ 
                  ...prev, 
                  currentPage: Math.max(1, prev.currentPage - 1) 
                }))}
                disabled={canvasSettings.currentPage <= 1}
                className="text-gray-600 hover:bg-white hover:shadow-sm transition-all disabled:opacity-50 h-9"
                title="Предыдущая страница"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-600 font-medium">
                  {canvasSettings.currentPage}
                </span>
                <span className="text-sm text-gray-400">/</span>
                <span className="text-sm text-gray-400">
                  {canvasSettings.totalPages}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (canvasSettings.currentPage >= canvasSettings.totalPages) {
                    setCanvasSettings(prev => ({ 
                      ...prev, 
                      currentPage: prev.currentPage + 1,
                      totalPages: prev.totalPages + 1 
                    }));
                  } else {
                    setCanvasSettings(prev => ({ 
                      ...prev, 
                      currentPage: prev.currentPage + 1 
                    }));
                  }
                }}
                className="text-gray-600 hover:bg-white hover:shadow-sm transition-all h-9"
                title={canvasSettings.currentPage >= canvasSettings.totalPages ? "Добавить новую страницу" : "Следующая страница"}
              >
                {canvasSettings.currentPage >= canvasSettings.totalPages ? (
                  <Plus className="h-4 w-4" />
                ) : (
                  <SkipForward className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Grid toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCanvasSettings(prev => ({ 
                ...prev, 
                showGrid: !prev.showGrid 
              }))}
              className={`transition-all h-9 ${canvasSettings.showGrid 
                ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Переключить сетку"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>

          {/* Right controls - Expanded width and ensured space */}
          <div className="flex items-center space-x-3 flex-shrink-0 min-w-0 ml-4">
            {/* Element actions */}
            {selectedElementId && (
              <div className="flex items-center space-x-1 bg-red-50 rounded-lg p-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => duplicateElement(selectedElementId)}
                  className="text-gray-600 hover:bg-white hover:text-green-700 hover:shadow-sm transition-all h-9"
                  title="Дублировать элемент (Ctrl+D)"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteElement(selectedElementId)}
                  className="text-red-600 hover:bg-white hover:text-red-700 hover:shadow-sm transition-all h-9"
                  title="Удалить элемент (Delete)"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Panel toggles */}
            <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPagesPanelOpen(!pagesPanelOpen)}
                className={`transition-all h-9 ${pagesPanelOpen 
                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                  : 'text-gray-600 hover:bg-white hover:shadow-sm'
                }`}
                title="Переключить панель страниц"
              >
                <BookOpen className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setToolsPanelOpen(!toolsPanelOpen)}
                className={`transition-all h-9 ${toolsPanelOpen 
                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                  : 'text-gray-600 hover:bg-white hover:shadow-sm'
                }`}
                title="Переключить панель инструментов"
              >
                {toolsPanelOpen ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPropertiesPanelOpen(!propertiesPanelOpen)}
                className={`transition-all h-9 ${propertiesPanelOpen 
                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                  : 'text-gray-600 hover:bg-white hover:shadow-sm'
                }`}
                title="Переключить панель свойств"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>

            {/* Action buttons group - Enhanced size and spacing */}
            <div className="flex items-center justify-center bg-gray-50 rounded-lg px-12 py-3 min-w-fit w-auto">
            {/* Save button */}
            <Button 
              onClick={handleSave}
                variant="ghost"
                size="sm"
                className="text-green-600 hover:bg-white hover:text-green-700 hover:shadow-sm transition-all font-medium px-5 py-2.5 rounded-lg whitespace-nowrap h-10"
              title="Сохранить изменения (Ctrl+S)"
            >
              <Save className="h-4 w-4 mr-2" />
              Сохранить
            </Button>
            
            {/* Author actions */}
            {_userProfile && book && book.author_id === _userProfile.id && book.status === 'Draft' && (
              <>
                <div className="w-px h-7 bg-gradient-to-t from-gray-200 via-gray-400 to-gray-200 mx-6"></div>
                <Button
                  onClick={handleSendToModeration}
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:bg-white hover:text-blue-700 hover:shadow-sm transition-all font-medium px-5 py-2.5 rounded-lg whitespace-nowrap h-10"
                  title="Отправить книгу на модерацию"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  На модерацию
                </Button>
              </>
            )}
            
            {/* Export JSON for authors */}
            {_userProfile && book && book.author_id === _userProfile.id && (
              <>
                <div className="w-px h-7 bg-gradient-to-t from-gray-200 via-gray-400 to-gray-200 mx-6"></div>
                <Button
                  onClick={handleExportJSON}
                  variant="ghost"
                  size="sm"
                  className="text-orange-600 hover:bg-white hover:text-orange-700 hover:shadow-sm transition-all font-medium px-5 py-2.5 rounded-lg whitespace-nowrap h-10"
                  title="Экспортировать данные книги в JSON формате"
                >
                  <Download className="h-4 w-4 mr-2" />
                  JSON
                </Button>
              </>
            )}
            
            {/* Source code button for special roles - placed harmoniously next to save */}
            {_userProfile && (_userProfile.role === 'moderator' || _userProfile.role === 'super_admin' || _userProfile.role === 'teacher') && book && (book.status === 'Moderation' || book.status === 'Approved' || book.status === 'Active' || book.author_id === _userProfile.id) && (
              <>
                {/* Beautiful separator */}
                <div className="w-px h-7 bg-gradient-to-t from-gray-200 via-gray-400 to-gray-200 mx-6"></div>
                <Button
                  onClick={handleExportSourceCode}
                  variant="ghost"
                  size="sm"
                  className="text-purple-600 hover:bg-white hover:text-purple-700 hover:shadow-sm transition-all font-medium px-5 py-2.5 rounded-lg whitespace-nowrap h-10"
                  title="Скачать исходный код для редактирования (HTML/CSS)"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Исходный код
                </Button>
              </>
            )}
            </div>

            {/* Book Management Actions - Compact */}
            {_userProfile && book && (
              <div className="flex items-center space-x-2">
                {/* Status indicator */}
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  book.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                  book.status === 'Moderation' ? 'bg-yellow-100 text-yellow-800' :
                  book.status === 'Approved' ? 'bg-green-100 text-green-800' :
                  book.status === 'Active' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {book.status === 'Draft' ? 'Черновик' :
                   book.status === 'Moderation' ? 'Модерация' :
                   book.status === 'Approved' ? 'Одобрено' :
                   book.status === 'Active' ? 'Активно' :
                   'Отклонено'}
                </div>

                {/* Quick Management Actions */}
                {_userProfile.role === 'moderator' && book.status === 'Moderation' && (
                  <>
                    <Button onClick={handleApproveBook} variant="outline" size="sm" className="bg-green-500 hover:bg-green-600 text-white border-0 h-9" title="Одобрить">
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleRejectBook} variant="outline" size="sm" className="bg-red-500 hover:bg-red-600 text-white border-0 h-9" title="Отклонить">
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {_userProfile.role === 'super_admin' && (
                  <>
                    {book.status === 'Moderation' && (
                      <>
                        <Button onClick={handleApproveBook} variant="outline" size="sm" className="bg-green-500 hover:bg-green-600 text-white border-0 h-9" title="Одобрить">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button onClick={handleRejectBook} variant="outline" size="sm" className="bg-red-500 hover:bg-red-600 text-white border-0 h-9" title="Отклонить">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {book.status === 'Approved' && (
                      <Button onClick={handleActivateBook} variant="outline" size="sm" className="bg-purple-500 hover:bg-purple-600 text-white border-0 h-9" title="Активировать">
                        <PlayCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {book.status === 'Active' && (
                      <Button onClick={handleArchiveBook} variant="outline" size="sm" className="bg-gray-500 hover:bg-gray-600 text-white border-0 h-9" title="Архивировать">
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
            
            {/* Compact Export Section */}
            {book && (book.status === 'Approved' || book.status === 'Active') && (
              <div className="flex items-center space-x-1 border-l border-gray-200 pl-3">
                <span className="text-xs text-gray-500">Скачать:</span>
                <Button onClick={handleExportHTML} variant="outline" size="sm" className="bg-blue-500 hover:bg-blue-600 text-white border-0 px-2 h-9" title="HTML">
                  <FileText className="h-4 w-4" />
                </Button>
                <Button onClick={handleExportPDF} variant="outline" size="sm" className="bg-red-500 hover:bg-red-600 text-white border-0 px-2 h-9" title="PDF">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex min-h-0">
          {/* Tools Panel - Canva style */}
          {toolsPanelOpen && (
            <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
              {/* Category tabs - Icons only */}
              <div className="border-b border-gray-200 p-3">
                <div className="flex justify-center space-x-4">
                  {TOOL_CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`p-3 rounded-lg transition-colors ${
                        activeCategory === category.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      title={category.label}
                    >
                      <category.icon className="h-6 w-6" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Tools grid */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  {TOOLS.filter(tool => tool.category === activeCategory).map((tool) => (
                    <DraggableTool key={tool.id} tool={tool} onMediaUploaded={handleMediaUploaded} isSelected={selectedElementId === tool.id} onSelect={() => setSelectedElementId(tool.id)} canvasSettings={canvasSettings} />
                  ))}
                </div>

                {/* Canvas Settings */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Настройки холста</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Ширина (мм)</Label>
                        <Input
                          type="number"
                          value={canvasSettings.canvasWidth}
                          onChange={(e) => {
                            e.preventDefault();
                            setCanvasSettings(prev => ({ 
                              ...prev, 
                              canvasWidth: Number(e.target.value) 
                            }));
                          }}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Высота (мм)</Label>
                        <Input
                          type="number"
                          value={canvasSettings.canvasHeight}
                          onChange={(e) => {
                            e.preventDefault();
                            setCanvasSettings(prev => ({ 
                              ...prev, 
                              canvasHeight: Number(e.target.value) 
                            }));
                          }}
                          className="h-8"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCanvasSettings(prev => ({ 
                          ...prev, 
                          canvasWidth: 210, 
                          canvasHeight: 297 
                        }))}
                        className="flex-1"
                      >
                        A4
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCanvasSettings(prev => ({ 
                          ...prev, 
                          canvasWidth: 420, 
                          canvasHeight: 297 
                        }))}
                        className="flex-1"
                      >
                        A3
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Layers section with drag to reorder */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <Layers className="h-4 w-4 mr-2" />
                    Слои
                  </h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {[...currentPageElements]
                      .sort((a, b) => b.zIndex - a.zIndex)
                      .map((element) => (
                        <div
                          key={element.id}
                          onClick={() => setSelectedElementId(element.id)}
                          className={`p-2 rounded cursor-pointer text-xs flex items-center justify-between ${
                            selectedElementId === element.id
                              ? 'bg-blue-100 text-blue-700'
                              : 'hover:bg-gray-100 text-gray-600'
                          }`}
                        >
                          <span className="truncate">
                            {element.content || `${element.type} ${element.id.slice(-4)}`}
                          </span>
                          <div className="flex space-x-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                moveElementUp(element.id);
                              }}
                              className="opacity-60 hover:opacity-100"
                              title="Поднять слой"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                moveElementDown(element.id);
                              }}
                              className="opacity-60 hover:opacity-100"
                              title="Опустить слой"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                updateElement(element.id, { 
                                  opacity: element.opacity === 1 ? 0.5 : 1 
                                });
                              }}
                              className="opacity-60 hover:opacity-100"
                              title="Переключить видимость"
                            >
                              <Eye className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Page Navigator Panel */}
          {pagesPanelOpen && (
            <PageNavigator
              currentPage={canvasSettings.currentPage}
              totalPages={canvasSettings.totalPages}
              elements={elements}
              canvasSettings={canvasSettings}
              onPageChange={handlePageChange}
              onPageAdd={handlePageAdd}
              onPageDelete={handlePageDelete}
              onPageDuplicate={handlePageDuplicate}
              onPageMove={handlePageMove}
              className="w-64"
            />
          )}

          {/* Canvas Area */}
          <div 
            id="canvas"
            className="flex-1 overflow-auto"
            onClick={() => {
              setSelectedElementId(null);
              setEditingElementId(null);
            }}
          >
            <CanvasDropZone 
              settings={canvasSettings}
              showGrid={canvasSettings.showGrid}
            >
              {currentPageElements.map((element) => (
                <CanvasElementComponent
                  key={element.id}
                  element={element}
                  isSelected={selectedElementId === element.id}
                  isEditing={editingElementId === element.id}
                  onSelect={() => setSelectedElementId(element.id)}
                  onUpdate={(updates) => updateElement(element.id, updates)}
                  onEdit={(editing) => setEditingElementId(editing ? element.id : null)}
                  onGroup={_onGroup}
                  isGrouped={_isGrouped}
                  snapLines={_snapLines}
                  onShowSnapLines={_onShowSnapLines}
                />
              ))}
            </CanvasDropZone>
          </div>

          {/* Properties Panel */}
          {propertiesPanelOpen && (
            <PropertiesPanel
              selectedElement={selectedElement}
              onUpdate={(updates) => selectedElement && updateElement(selectedElement.id, updates)}
              onClose={() => setPropertiesPanelOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeElement && (
          <div className="bg-white border-2 border-blue-500 shadow-lg p-3 rounded-lg opacity-90">
            <div className="flex items-center space-x-2">
              {activeElement.type === 'text' && <Type className="h-4 w-4 text-blue-600" />}
              {activeElement.type === 'shape' && <Square className="h-4 w-4 text-blue-600" />}
              {activeElement.type === 'image' && <ImageIcon className="h-4 w-4 text-blue-600" />}
              <span className="text-sm font-medium text-gray-900">
                {activeElement.content || activeElement.type}
              </span>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

export default function BookEditorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <BookEditor />
    </Suspense>
  );
} 