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
  Save, Type, Square, Circle, MousePointer, Image as ImageIcon, Minus, AlignLeft,
  Menu, X, PanelLeftClose, PanelLeftOpen, Plus, Trash2, Copy, Undo2, Redo2,
  ZoomIn, ZoomOut, Grid3X3, Eye, SkipForward, SkipBack, Settings, Layers,
  Triangle, Star, Heart, Upload, Move3D, Lock,
  Bold, Italic, Underline, ArrowUp, ArrowDown, Video, Link, BookOpen,
  RotateCw, Palette, FlipHorizontal,
  Scissors, Clipboard, Wand2, Sparkles, Target, FileText
} from 'lucide-react';
import { uploadMedia, uploadMediaFromUrl, MediaType, UploadResult } from '@/utils/mediaUpload';

// Enhanced Types
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
};

type CanvasElement = {
  id: string;
  type: 'text' | 'shape' | 'image' | 'line' | 'paragraph' | 'arrow' | 'icon' | 'video';
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
  };
};

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
};

type Template = {
  id: string;
  name: string;
  preview: string;
  elements: CanvasElement[];
  category: 'basic' | 'business' | 'creative' | 'education';
};

// Enhanced Tool definitions with more elements and categories
const TOOLS = [
  { id: 'select', icon: MousePointer, label: 'Выбрать', category: 'basic', hotkey: 'V' },
  
  // Text tools
  { id: 'text', icon: Type, label: 'Текст', category: 'text', hotkey: 'T' },
  { id: 'paragraph', icon: AlignLeft, label: 'Абзац', category: 'text', hotkey: 'P' },
  { id: 'heading', icon: FileText, label: 'Заголовок', category: 'text', hotkey: 'H' },
  
  // Shape tools
  { id: 'rectangle', icon: Square, label: 'Прямоугольник', category: 'shapes', hotkey: 'R' },
  { id: 'circle', icon: Circle, label: 'Круг', category: 'shapes', hotkey: 'C' },
  { id: 'triangle', icon: Triangle, label: 'Треугольник', category: 'shapes', hotkey: '' },
  { id: 'star', icon: Star, label: 'Звезда', category: 'shapes', hotkey: '' },
  { id: 'heart', icon: Heart, label: 'Сердце', category: 'shapes', hotkey: '' },
  { id: 'line', icon: Minus, label: 'Линия', category: 'shapes', hotkey: 'L' },
  { id: 'arrow', icon: Move3D, label: 'Стрелка', category: 'shapes', hotkey: 'A' },
  
  // Media tools
  { id: 'image', icon: ImageIcon, label: 'Изображение', category: 'media', hotkey: 'I' },
  { id: 'upload', icon: Upload, label: 'Загрузить', category: 'media', hotkey: '' },
  { id: 'video', icon: Video, label: 'Видео', category: 'media', hotkey: '' },
  { id: 'video-url', icon: Link, label: 'Видео по URL', category: 'media', hotkey: '' },
  
  // Advanced tools
  { id: 'gradient-bg', icon: Palette, label: 'Градиент', category: 'advanced', hotkey: '' },
  { id: 'smart-crop', icon: Scissors, label: 'Умная обрезка', category: 'advanced', hotkey: '' },
  { id: 'magic-resize', icon: Wand2, label: 'Умный ресайз', category: 'advanced', hotkey: '' },
] as const;

const TOOL_CATEGORIES = [
  { id: 'text', label: 'Текст', icon: Type },
  { id: 'shapes', label: 'Фигуры', icon: Square },
  { id: 'media', label: 'Медиа', icon: ImageIcon },
  { id: 'advanced', label: 'Продвинутые', icon: Sparkles },
];

// Predefined templates
const _TEMPLATES: Template[] = [
  {
    id: 'title-page',
    name: 'Титульная страница',
    preview: '/templates/title-page.svg',
    category: 'basic',
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
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const IconComponent = tool.icon;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToolClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.();
    
    if (tool.id === 'upload') {
      fileInputRef.current?.click();
    } else if (tool.id === 'video') {
      fileInputRef.current?.click();
    } else if (tool.id === 'video-url') {
      setShowUrlInput(true);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const mediaType: MediaType = tool.id === 'video' ? 'video' : 'image';
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
            <span>${mediaType === 'video' ? 'Видео' : 'Изображение'} загружено! Перетащите на холст.</span>
          </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
          notification.style.transform = 'translateX(100%)';
          setTimeout(() => document.body.removeChild(notification), 300);
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

  const handleUrlUpload = async () => {
    if (!urlInput.trim()) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const result: UploadResult = await uploadMediaFromUrl(urlInput, 'video');
      
      if (result.success && result.url) {
        if (onMediaUploaded) {
          onMediaUploaded(result.url, 'video');
        }
        
        // Success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50';
        notification.textContent = 'Видео по URL загружено! Перетащите на холст.';
        document.body.appendChild(notification);
        setTimeout(() => document.body.removeChild(notification), 3000);
        
        setUrlInput('');
        setShowUrlInput(false);
      } else {
        setUploadError(result.error || 'Ошибка загрузки видео по URL');
      }
    } catch (error) {
      setUploadError('Ошибка загрузки видео');
      console.error('URL upload error:', error);
    } finally {
      setIsUploading(false);
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
  const needsClickFunctionality = ['upload', 'video', 'video-url'].includes(tool.id);

  const handleGeneralToolClick = (e: React.MouseEvent) => {
    if (!needsClickFunctionality) {
      e.stopPropagation();
      const position = getSmartPosition();
      
      // Enhanced element creation with better defaults
      const newElement = {
        id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: tool.id as CanvasElement['type'],
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
          borderWidth: 0,
          borderColor: '#2980b9',
          borderRadius: 8,
        };
      case 'circle':
        return {
          ...baseProps,
          shapeType: 'circle' as const,
          backgroundColor: '#e74c3c',
          borderWidth: 0,
          borderColor: '#c0392b',
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
          flex flex-col items-center p-3 rounded-xl transition-all duration-200 
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
        
        <IconComponent className={`h-6 w-6 mb-2 transition-colors ${isSelected ? 'text-blue-600' : 'text-gray-700 group-hover:text-blue-600'}`} />
        <span className={`text-xs text-center font-medium transition-colors ${isSelected ? 'text-blue-700' : 'text-gray-600 group-hover:text-gray-800'}`}>
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
        {(tool.id === 'upload' || tool.id === 'video') && (
          <input
            ref={fileInputRef}
            type="file"
            accept={tool.id === 'video' ? 'video/*' : 'image/*'}
            onChange={handleFileUpload}
            className="hidden"
          />
        )}
      </div>
      
      {/* Enhanced tooltip */}
      {showTooltip && !isDragging && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-50 whitespace-nowrap">
          <div className="font-medium">{tool.label}</div>
          {tool.hotkey && tool.hotkey.trim() && <div className="text-gray-300">Горячая клавиша: {tool.hotkey}</div>}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
      
      {/* Enhanced error display */}
      {uploadError && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg shadow-lg z-20">
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
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-1 text-red-600">{uploadError}</div>
        </div>
      )}
      
      {/* Enhanced URL input */}
      {showUrlInput && tool.id === 'video-url' && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white border border-gray-200 rounded-xl shadow-xl z-20 min-w-64">
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1 block">URL видео</Label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/video.mp4"
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUrlUpload();
                }}
                disabled={isUploading || !urlInput.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Загрузка...' : 'Загрузить'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUrlInput(false);
                  setUrlInput('');
                  setUploadError(null);
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm py-2 px-3 rounded-lg font-medium transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Enhanced Canvas Element Component with resize handles
function CanvasElementComponent({ 
  element, 
  isSelected, 
  onSelect, 
  onUpdate,
  isEditing,
  onEdit 
}: { 
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  isEditing: boolean;
  onEdit: (editing: boolean) => void;
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

    const borderStyle = element.properties.borderWidth ? {
      border: `${element.properties.borderWidth}px ${element.properties.borderStyle || 'solid'} ${element.properties.borderColor || '#000'}`
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
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={shapeStyle}
                >
                  <Star 
                    className="w-3/4 h-3/4" 
                    fill={element.properties.backgroundColor || '#e5e5e5'}
                    stroke={element.properties.borderColor || '#000'}
                    strokeWidth={element.properties.borderWidth || 1}
                  />
                </div>
              );
            case 'heart':
              return (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={shapeStyle}
                >
                  <Heart 
                    className="w-3/4 h-3/4" 
                    fill={element.properties.backgroundColor || '#e5e5e5'}
                    stroke={element.properties.borderColor || '#000'}
                    strokeWidth={element.properties.borderWidth || 1}
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
      default:
        return <div>Element</div>;
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
  const { userProfile } = useAuth();
  
  // State
  const [book, setBook] = useState<Book | null>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [activeElement, setActiveElement] = useState<CanvasElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<CanvasElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [uploadedMediaUrls, setUploadedMediaUrls] = useState<Record<string, string>>({});
  
  // UI State
  const [mainSidebarHidden, setMainSidebarHidden] = useState(searchParams?.get('hideSidebar') === 'true');
  const [toolsPanelOpen, setToolsPanelOpen] = useState(true);
  const [propertiesPanelOpen, setPropertiesPanelOpen] = useState(true);
  const [pagesPanelOpen, setPagesPanelOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState('text');

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

  // Create element from tool with enhanced types
  const createElementFromTool = (toolType: string, x: number, y: number, mediaUrl?: string): CanvasElement => {
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
      case 'paragraph':
        return {
          ...baseElement,
          type: 'paragraph',
          width: 250,
          height: 100,
          content: 'Новый абзац\nНачните печатать...',
          properties: {
            fontSize: 14,
            fontFamily: 'Arial',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'none',
            color: '#000000',
            backgroundColor: 'transparent',
            textAlign: 'left',
            verticalAlign: 'top',
            borderRadius: 0,
          },
        };
      case 'rectangle':
        return {
          ...baseElement,
          type: 'shape',
          width: 100,
          height: 100,
          content: '',
          properties: {
            shapeType: 'rectangle',
            backgroundColor: '#e5e5e5',
            borderWidth: 1,
            borderColor: '#000000',
            borderStyle: 'solid',
            borderRadius: 0,
          },
        };
      case 'circle':
        return {
          ...baseElement,
          type: 'shape',
          width: 100,
          height: 100,
          content: '',
          properties: {
            shapeType: 'circle',
            backgroundColor: '#e5e5e5',
            borderWidth: 1,
            borderColor: '#000000',
            borderStyle: 'solid',
          },
        };
      case 'triangle':
        return {
          ...baseElement,
          type: 'shape',
          width: 100,
          height: 100,
          content: '',
          properties: {
            shapeType: 'triangle',
            backgroundColor: '#e5e5e5',
            borderWidth: 1,
            borderColor: '#000000',
            borderStyle: 'solid',
          },
        };
      case 'star':
        return {
          ...baseElement,
          type: 'shape',
          width: 100,
          height: 100,
          content: '',
          properties: {
            shapeType: 'star',
            backgroundColor: '#e5e5e5',
            borderWidth: 1,
            borderColor: '#000000',
            borderStyle: 'solid',
          },
        };
      case 'heart':
        return {
          ...baseElement,
          type: 'shape',
          width: 100,
          height: 100,
          content: '',
          properties: {
            shapeType: 'heart',
            backgroundColor: '#e5e5e5',
            borderWidth: 1,
            borderColor: '#000000',
            borderStyle: 'solid',
          },
        };
      case 'line':
        return {
          ...baseElement,
          type: 'line',
          width: 200,
          height: 2,
          content: '',
          properties: {
            lineThickness: 2,
            color: '#000000',
            borderRadius: 0,
          },
        };
      case 'arrow':
        return {
          ...baseElement,
          type: 'arrow',
          width: 200,
          height: 50,
          content: '',
          properties: {
            lineThickness: 2,
            color: '#000000',
            arrowType: 'single',
            borderRadius: 0,
          },
        };
      case 'image':
      case 'upload':
        return {
          ...baseElement,
          type: 'image',
          width: 150,
          height: 150,
          content: '',
          properties: {
            backgroundColor: '#f0f0f0',
            borderWidth: 1,
            borderColor: '#cccccc',
            borderStyle: 'dashed',
            borderRadius: 0,
            imageUrl: mediaUrl || '',
          },
        };
      case 'video':
      case 'video-url':
        return {
          ...baseElement,
          type: 'video',
          width: 300,
          height: 200,
          content: '',
          properties: {
            backgroundColor: '#f0f0f0',
            borderWidth: 1,
            borderColor: '#cccccc',
            borderStyle: 'dashed',
            borderRadius: 0,
            videoUrl: mediaUrl || '',
            autoplay: false,
            muted: true,
            controls: true,
            loop: false,
          },
        };
      default:
        return {
          ...baseElement,
          type: 'text',
          width: 100,
          height: 40,
          content: 'Element',
          properties: {
            borderRadius: 0,
          },
        };
    }
  };

  // Update element
  const updateElement = useCallback((elementId: string, updates: Partial<CanvasElement>) => {
    setElements(prev => {
      const newElements = prev.map(el => 
        el.id === elementId ? { ...el, ...updates } : el
      );
      addToHistory(newElements);
      return newElements;
    });
  }, [addToHistory]);

  // Delete element
  const deleteElement = useCallback((elementId: string) => {
    setElements(prev => {
      const newElements = prev.filter(el => el.id !== elementId);
      addToHistory(newElements);
      return newElements;
    });
    setSelectedElementId(null);
  }, [addToHistory]);

  // Duplicate element
  const duplicateElement = useCallback((elementId: string) => {
    const element = elements.find(el => el.id === elementId);
    if (element) {
      const newElement = {
        ...element,
        id: generateId(),
        x: element.x + 20,
        y: element.y + 20,
        zIndex: elements.length,
      };
      setElements(prev => {
        const newElements = [...prev, newElement];
        addToHistory(newElements);
        return newElements;
      });
      setSelectedElementId(newElement.id);
    }
  }, [elements, addToHistory, generateId]);

  // Move element up in layers
  const moveElementUp = useCallback((elementId: string) => {
    setElements(prev => {
      const element = prev.find(el => el.id === elementId);
      if (!element) return prev;
      
      const maxZIndex = Math.max(...prev.map(el => el.zIndex));
      if (element.zIndex < maxZIndex) {
        const newElements = prev.map(el => 
          el.id === elementId ? { ...el, zIndex: el.zIndex + 1 } : el
        );
        addToHistory(newElements);
        return newElements;
      }
      return prev;
    });
  }, [addToHistory]);

  // Move element down in layers  
  const moveElementDown = useCallback((elementId: string) => {
    setElements(prev => {
      const element = prev.find(el => el.id === elementId);
      if (!element) return prev;
      
      if (element.zIndex > 0) {
        const newElements = prev.map(el => 
          el.id === elementId ? { ...el, zIndex: el.zIndex - 1 } : el
        );
        addToHistory(newElements);
        return newElements;
      }
      return prev;
    });
  }, [addToHistory]);

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;

    if (activeData?.type === 'element') {
      setActiveElement(activeData.element);
    } else if (activeData?.type === 'tool') {
      const previewElement = createElementFromTool(activeData.toolType, 0, 0);
      setActiveElement(previewElement);
    }
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // No state updates during drag for performance
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveElement(null);

    if (!over || over.id !== 'canvas') return;

    const activeData = active.data.current;
    
    // Get canvas element and calculate proper coordinates
    const canvasElement = document.querySelector('[data-canvas="true"]') as HTMLElement;
    if (!canvasElement) return;

    const canvasRect = canvasElement.getBoundingClientRect();
    const clientX = (event.activatorEvent as MouseEvent).clientX;
    const clientY = (event.activatorEvent as MouseEvent).clientY;
    
    // Calculate position relative to canvas with zoom scaling
    const zoomFactor = canvasSettings.zoom / 100;
    const dropX = Math.max(0, (clientX - canvasRect.left) / zoomFactor - 50);
    const dropY = Math.max(0, (clientY - canvasRect.top) / zoomFactor - 20);

    if (activeData?.type === 'tool') {
      // Add new element
      const toolType = activeData.toolType;
      
      // Check if there's an uploaded media URL for this tool type
      let mediaUrl = '';
      if (toolType === 'image' || toolType === 'upload') {
        mediaUrl = uploadedMediaUrls.image || '';
      } else if (toolType === 'video' || toolType === 'video-url') {
        mediaUrl = uploadedMediaUrls.video || '';
      }
      
      const newElement = createElementFromTool(toolType, dropX, dropY, mediaUrl);
      setElements(prev => {
        const newElements = [...prev, newElement];
        addToHistory(newElements);
        return newElements;
      });
      setSelectedElementId(newElement.id);
      
      // Clear the uploaded URL after using it
      if (mediaUrl) {
        setUploadedMediaUrls(prev => {
          const updated = { ...prev };
          if (toolType === 'image' || toolType === 'upload') {
            delete updated.image;
          } else if (toolType === 'video' || toolType === 'video-url') {
            delete updated.video;
          }
          return updated;
        });
      }
    } else if (activeData?.type === 'element') {
      // Move existing element
      const elementId = activeData.element.id;
      const deltaX = event.delta?.x || 0;
      const deltaY = event.delta?.y || 0;
      
      updateElement(elementId, { 
        x: Math.max(0, activeData.element.x + deltaX / zoomFactor),
        y: Math.max(0, activeData.element.y + deltaY / zoomFactor)
      });
    }
  };

  // Load book data
  const fetchBook = useCallback(async () => {
    if (!params.base_url || !userProfile) return;

    try {
      const supabase = createClient();
      
      const { data: bookData, error } = await supabase
        .from('books')
        .select('*')
        .eq('base_url', params.base_url)
        .eq('author_id', userProfile.id)
        .single();

      if (error) throw error;
      
      setBook(bookData);

      // Load canvas elements
      if (bookData.canvas_elements) {
        const loadedElements = JSON.parse(bookData.canvas_elements);
        setElements(loadedElements);
        addToHistory(loadedElements);
      }

      // Load canvas settings
      if (bookData.canvas_settings) {
        const loadedSettings = JSON.parse(bookData.canvas_settings);
        setCanvasSettings(prev => ({ ...prev, ...loadedSettings }));
      }
    } catch (error) {
      console.error('Error loading book:', error);
    } finally {
      setIsLoading(false);
    }
  }, [params.base_url, userProfile, addToHistory]);

  useEffect(() => {
    if (userProfile) {
      fetchBook();
    }
  }, [fetchBook, userProfile]);

  // Save functionality
  const handleSave = useCallback(async () => {
    if (!book) {
      console.log('No book available for saving');
      alert('Ошибка: Книга не найдена');
      return;
    }

    try {
      console.log('Starting save process...');
      console.log('Book ID:', book.id);
      console.log('User Profile:', userProfile?.id);
      
      const supabase = createClient();
      
      // Test Supabase connection first
      console.log('Testing Supabase connection...');
      const { data: testData, error: testError } = await supabase
        .from('books')
        .select('id')
        .eq('id', book.id)
        .single();
      
      if (testError) {
        console.error('Supabase connection test failed:', testError);
        alert('Ошибка подключения к базе данных: ' + testError.message);
        return;
      }
      
      console.log('Supabase connection test successful:', testData);
      
      // Prepare data for saving
      const canvasElementsJson = JSON.stringify(elements);
      const canvasSettingsJson = JSON.stringify(canvasSettings);
      
      console.log('Saving book data:');
      console.log('- Book ID:', book.id);
      console.log('- Elements count:', elements.length);
      console.log('- Canvas settings:', canvasSettings);
      console.log('- Elements JSON length:', canvasElementsJson.length);
      console.log('- Settings JSON length:', canvasSettingsJson.length);
      
      const updateData = {
        canvas_elements: canvasElementsJson,
        canvas_settings: canvasSettingsJson,
        updated_at: new Date().toISOString(),
      };
      
      console.log('Update data prepared:', Object.keys(updateData));
      
      const { data, error } = await supabase
        .from('books')
        .update(updateData)
        .eq('id', book.id)
        .select();

      console.log('Update response:');
      console.log('- Data:', data);
      console.log('- Error:', error);

      if (error) {
        console.error('Save error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        alert('Ошибка при сохранении: ' + (error.message || 'Неизвестная ошибка'));
        return;
      }

      if (!data || data.length === 0) {
        console.error('No data returned from update');
        alert('Ошибка: Не удалось обновить книгу. Проверьте права доступа.');
        return;
      }

      console.log('Book saved successfully:', data);
      alert('Книга успешно сохранена!');
      
      // Update the history after successful save
      addToHistory(elements);
      
    } catch (error) {
      console.error('Save error (catch block):', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      alert('Ошибка при сохранении: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    }
  }, [book, elements, canvasSettings, addToHistory, userProfile]);

  // Handle media upload success
  const handleMediaUploaded = useCallback((url: string, type: string) => {
    console.log('Media uploaded:', url, type);
    // Store the uploaded URL to use when the tool is dragged to canvas
    setUploadedMediaUrls(prev => ({
      ...prev,
      [type]: url
    }));
  }, []);

  // Handle adding tools to canvas via click
  const handleAddElementFromTool = useCallback((elementData: Partial<CanvasElement>) => {
    const newElement: CanvasElement = {
      id: elementData.id || generateId(),
      type: elementData.type || 'text',
      x: elementData.x || 0,
      y: elementData.y || 0,
      width: elementData.width || 100,
      height: elementData.height || 40,
      content: elementData.content || '',
      rotation: 0,
      opacity: 1,
      properties: elementData.properties || {},
      ...elementData,
      page: canvasSettings.currentPage,
      zIndex: elements.length,
    };
    
    setElements(prev => {
      const newElements = [...prev, newElement];
      addToHistory(newElements);
      return newElements;
    });
    setSelectedElementId(newElement.id);
  }, [canvasSettings.currentPage, elements.length, addToHistory, generateId]);

  // Keyboard shortcuts and tool click events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 'd':
            e.preventDefault();
            if (selectedElementId) {
              duplicateElement(selectedElementId);
            }
            break;
          case 's':
            e.preventDefault();
            handleSave();
            break;
        }
      } else if (e.key === 'Delete' && selectedElementId) {
        deleteElement(selectedElementId);
      }
    };

    // Handle tool click events
    const handleAddToolToCanvas = (e: CustomEvent) => {
      const { element } = e.detail;
      handleAddElementFromTool(element);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('addToolToCanvas', handleAddToolToCanvas as EventListener);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('addToolToCanvas', handleAddToolToCanvas as EventListener);
    };
  }, [selectedElementId, undo, redo, duplicateElement, deleteElement, handleSave, handleAddElementFromTool]);

  // Sidebar toggle
  const toggleMainSidebar = () => {
    const newHiddenState = !mainSidebarHidden;
    setMainSidebarHidden(newHiddenState);
    
    const newSearchParams = new URLSearchParams(searchParams?.toString());
    if (newHiddenState) {
      newSearchParams.set('hideSidebar', 'true');
    } else {
      newSearchParams.delete('hideSidebar');
    }
    
    const newUrl = `${window.location.pathname}?${newSearchParams.toString()}`;
    window.history.replaceState({}, '', newUrl);
    window.location.reload();
  };

  // Get current page elements
  const currentPageElements = elements.filter(el => el.page === canvasSettings.currentPage);
  const selectedElement: CanvasElement | null = selectedElementId ? elements.find(el => el.id === selectedElementId) || null : null;

  // Page management functions
  const handlePageChange = useCallback((page: number) => {
    // Ensure page is valid
    if (page < 1 || page > canvasSettings.totalPages) {
      console.warn('Invalid page number:', page);
      return;
    }
    
    console.log('Switching to page:', page);
    
    // Only update if different page
    if (page !== canvasSettings.currentPage) {
      setCanvasSettings(prev => ({ ...prev, currentPage: page }));
      setSelectedElementId(null);
      setEditingElementId(null);
    }
  }, [canvasSettings.currentPage, canvasSettings.totalPages]);

  const handlePageAdd = useCallback((afterPage?: number) => {
    const insertAfter = afterPage || canvasSettings.totalPages;
    
    setCanvasSettings(prev => ({
      ...prev,
      totalPages: prev.totalPages + 1,
      currentPage: insertAfter + 1
    }));
    
    // Update page numbers for elements after the insertion point
    setElements(prev => {
      const newElements = prev.map(el => 
        el.page > insertAfter ? { ...el, page: el.page + 1 } : el
      );
      addToHistory(newElements);
      return newElements;
    });
  }, [canvasSettings.totalPages, addToHistory]);

  const handlePageDelete = useCallback((page: number) => {
    if (canvasSettings.totalPages <= 1) return; // Don't delete the last page
    
    // Remove all elements from the deleted page
    setElements(prev => {
      const newElements = prev
        .filter(el => el.page !== page)
        .map(el => el.page > page ? { ...el, page: el.page - 1 } : el);
      addToHistory(newElements);
      return newElements;
    });
    
    setCanvasSettings(prev => {
      const newTotalPages = prev.totalPages - 1;
      const newCurrentPage = prev.currentPage > page 
        ? prev.currentPage - 1 
        : prev.currentPage > newTotalPages 
        ? newTotalPages 
        : prev.currentPage;
      
      return {
        ...prev,
        totalPages: newTotalPages,
        currentPage: newCurrentPage
      };
    });
  }, [canvasSettings.totalPages, addToHistory]);

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
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-4">
            {/* Sidebar toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMainSidebar}
              className="text-gray-600 hover:bg-gray-100 transition-colors"
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
            <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
                className="text-gray-600 hover:bg-white hover:shadow-sm transition-all disabled:opacity-50"
                title="Отменить (Ctrl+Z)"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="text-gray-600 hover:bg-white hover:shadow-sm transition-all disabled:opacity-50"
                title="Повторить (Ctrl+Y)"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Center controls */}
          <div className="flex items-center space-x-6">
            {/* Zoom controls */}
            <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCanvasSettings(prev => ({ 
                  ...prev, 
                  zoom: Math.max(10, prev.zoom - 10) 
                }))}
                className="text-gray-600 hover:bg-white hover:shadow-sm transition-all"
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
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
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
                className="text-gray-600 hover:bg-white hover:shadow-sm transition-all"
                title="Увеличить масштаб"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {/* Page navigation */}
            <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCanvasSettings(prev => ({ 
                  ...prev, 
                  currentPage: Math.max(1, prev.currentPage - 1) 
                }))}
                disabled={canvasSettings.currentPage <= 1}
                className="text-gray-600 hover:bg-white hover:shadow-sm transition-all disabled:opacity-50"
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
                className="text-gray-600 hover:bg-white hover:shadow-sm transition-all"
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
              className={`transition-all ${canvasSettings.showGrid 
                ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Переключить сетку"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>

          {/* Right controls */}
          <div className="flex items-center space-x-3">
            {/* Element actions */}
            {selectedElementId && (
              <div className="flex items-center space-x-1 bg-red-50 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => duplicateElement(selectedElementId)}
                  className="text-gray-600 hover:bg-white hover:text-green-700 hover:shadow-sm transition-all"
                  title="Дублировать элемент (Ctrl+D)"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteElement(selectedElementId)}
                  className="text-red-600 hover:bg-white hover:text-red-700 hover:shadow-sm transition-all"
                  title="Удалить элемент (Delete)"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Panel toggles */}
            <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPagesPanelOpen(!pagesPanelOpen)}
                className={`transition-all ${pagesPanelOpen 
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
                className={`transition-all ${toolsPanelOpen 
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
                className={`transition-all ${propertiesPanelOpen 
                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                  : 'text-gray-600 hover:bg-white hover:shadow-sm'
                }`}
                title="Переключить панель свойств"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>

            {/* Save button */}
            <Button 
              onClick={handleSave}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              title="Сохранить изменения (Ctrl+S)"
            >
              <Save className="h-4 w-4 mr-2" />
              Сохранить
            </Button>
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
                <div className="grid grid-cols-3 gap-3">
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