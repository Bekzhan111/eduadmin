'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Triangle, Star, Heart, Upload, Move3D,
  Bold, Italic, Underline, ArrowUp, ArrowDown,
} from 'lucide-react';

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
  type: 'text' | 'shape' | 'image' | 'line' | 'paragraph' | 'arrow' | 'icon';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  page: number;
  zIndex: number;
  rotation: number;
  opacity: number;
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
    lineThickness?: number;
    arrowType?: 'single' | 'double' | 'none';
    iconType?: string;
    shadow?: boolean;
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
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
};

// Enhanced Tool definitions with more elements
const TOOLS = [
  { id: 'select', icon: MousePointer, label: 'Выбрать', category: 'basic' },
  { id: 'text', icon: Type, label: 'Текст', category: 'text' },
  { id: 'paragraph', icon: AlignLeft, label: 'Абзац', category: 'text' },
  { id: 'rectangle', icon: Square, label: 'Прямоугольник', category: 'shapes' },
  { id: 'circle', icon: Circle, label: 'Круг', category: 'shapes' },
  { id: 'triangle', icon: Triangle, label: 'Треугольник', category: 'shapes' },
  { id: 'star', icon: Star, label: 'Звезда', category: 'shapes' },
  { id: 'heart', icon: Heart, label: 'Сердце', category: 'shapes' },
  { id: 'line', icon: Minus, label: 'Линия', category: 'shapes' },
  { id: 'arrow', icon: Move3D, label: 'Стрелка', category: 'shapes' },
  { id: 'image', icon: ImageIcon, label: 'Изображение', category: 'media' },
  { id: 'upload', icon: Upload, label: 'Загрузить', category: 'media' },
] as const;

const TOOL_CATEGORIES = [
  { id: 'text', label: 'Текст', icon: Type },
  { id: 'shapes', label: 'Фигуры', icon: Square },
  { id: 'media', label: 'Медиа', icon: ImageIcon },
];

// Draggable Tool Component with enhanced design
function DraggableTool({ tool }: { tool: typeof TOOLS[number] }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `tool-${tool.id}`,
    data: { type: 'tool', toolType: tool.id },
  });

  const IconComponent = tool.icon;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToolClick = () => {
    if (tool.id === 'upload') {
      fileInputRef.current?.click();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Handle file upload logic here
      console.log('File uploaded:', file);
      // You would typically upload to your storage service and get a URL
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={handleToolClick}
      className={`flex flex-col items-center p-3 rounded-lg cursor-grab hover:bg-gray-100 transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-95' : 'hover:scale-105'
      } bg-white border border-gray-200 shadow-sm`}
    >
      <IconComponent className="h-5 w-5 mb-1 text-gray-700" />
      <span className="text-xs text-gray-600 text-center">{tool.label}</span>
      {tool.id === 'upload' && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
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
    onSelect();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
              color: element.properties.color || '#000',
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
              color: element.properties.color || '#000',
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
              color: element.properties.color || '#000',
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
              color: element.properties.color || '#000',
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
              backgroundColor: element.properties.color || '#000',
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
                backgroundColor: element.properties.color || '#000',
              }}
            />
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: `${(element.properties.lineThickness || 2) * 3}px solid ${element.properties.color || '#000'}`,
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

  const updateProperty = (key: string, value: string | number) => {
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
                  <Label className="text-xs">Цвет</Label>
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
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        // Handle file upload here
                        console.log('Upload file:', file);
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
  
  // UI State
  const [mainSidebarHidden, setMainSidebarHidden] = useState(searchParams?.get('hideSidebar') === 'true');
  const [toolsPanelOpen, setToolsPanelOpen] = useState(true);
  const [propertiesPanelOpen, setPropertiesPanelOpen] = useState(true);
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
  const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
  const createElementFromTool = (toolType: string, x: number, y: number): CanvasElement => {
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
  }, [elements, addToHistory]);

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
      const newElement = createElementFromTool(activeData.toolType, dropX, dropY);
      setElements(prev => {
        const newElements = [...prev, newElement];
        addToHistory(newElements);
        return newElements;
      });
      setSelectedElementId(newElement.id);
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
    if (!book) return;

    try {
      const supabase = createClient();
      
      await supabase
        .from('books')
        .update({ 
          canvas_elements: JSON.stringify(elements),
          canvas_settings: JSON.stringify(canvasSettings),
          updated_at: new Date().toISOString(),
        })
        .eq('id', book.id);

      // Show success feedback
      alert('Сохранено!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Ошибка при сохранении');
    }
  }, [book, elements, canvasSettings]);

  // Keyboard shortcuts
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

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, undo, redo, duplicateElement, deleteElement, handleSave]);

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
              className="text-gray-600"
            >
              {mainSidebarHidden ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Button>

            {/* Book title */}
            <h1 className="font-semibold text-gray-900 truncate max-w-xs">
              {book.title}
            </h1>

            {/* Undo/Redo */}
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
                className="text-gray-600"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="text-gray-600"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Center controls */}
          <div className="flex items-center space-x-4">
            {/* Zoom controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCanvasSettings(prev => ({ 
                  ...prev, 
                  zoom: Math.max(10, prev.zoom - 10) 
                }))}
                className="text-gray-600"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600 min-w-[50px] text-center">
                {canvasSettings.zoom}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCanvasSettings(prev => ({ 
                  ...prev, 
                  zoom: Math.min(300, prev.zoom + 10) 
                }))}
                className="text-gray-600"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {/* Page navigation */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCanvasSettings(prev => ({ 
                  ...prev, 
                  currentPage: Math.max(1, prev.currentPage - 1) 
                }))}
                disabled={canvasSettings.currentPage <= 1}
                className="text-gray-600"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600 min-w-[80px] text-center">
                {canvasSettings.currentPage} / {canvasSettings.totalPages}
              </span>
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
                className="text-gray-600"
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
              className={canvasSettings.showGrid ? 'text-blue-600' : 'text-gray-600'}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>

          {/* Right controls */}
          <div className="flex items-center space-x-2">
            {/* Element actions */}
            {selectedElementId && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => duplicateElement(selectedElementId)}
                  className="text-gray-600"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteElement(selectedElementId)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Panel toggles */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setToolsPanelOpen(!toolsPanelOpen)}
              className="text-gray-600"
            >
              {toolsPanelOpen ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPropertiesPanelOpen(!propertiesPanelOpen)}
              className="text-gray-600"
            >
              <Settings className="h-4 w-4" />
            </Button>

            {/* Save button */}
            <Button 
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
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
                    <DraggableTool key={tool.id} tool={tool} />
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