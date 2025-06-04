'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  CollisionDetection,
  rectIntersection,
  getFirstCollision,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { 
  Save, 
  Send, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Type,
  Image as ImageIcon,
  Square,
  Circle,
  Minus,
  AlignLeft,
  Settings,
  ZoomIn,
  ZoomOut,
  Grid,
  Layers,
  MousePointer,
  Copy,
  Trash2,
  Upload,
} from 'lucide-react';

// Types
type Book = {
  id: string;
  base_url: string;
  title: string;
  description: string;
  grade_level: string;
  course: string;
  category: string;
  status: 'Draft' | 'Moderation' | 'Approved' | 'Active';
  author_id: string;
  pages_count: number;
  price: number;
  cover_image?: string;
  language: string;
  created_at: string;
  updated_at: string;
};

type CanvasElement = {
  id: string;
  type: 'text' | 'image' | 'shape' | 'line' | 'paragraph';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  page: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  properties: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
    rotation?: number;
    opacity?: number;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    autoSize?: boolean;
    shapeType?: 'rectangle' | 'circle';
    imageUrl?: string;
    shadow?: {
      x: number;
      y: number;
      blur: number;
      color: string;
    };
  };
};

type Tool = 'select' | 'text' | 'image' | 'rectangle' | 'circle' | 'line' | 'paragraph';

// Tool definitions for Canva-like interface
const CANVAS_TOOLS = [
  { id: 'select', type: 'select', icon: MousePointer, label: 'Выбрать', shortcut: 'V' },
  { id: 'text', type: 'text', icon: Type, label: 'Текст', shortcut: 'T' },
  { id: 'paragraph', type: 'paragraph', icon: AlignLeft, label: 'Абзац', shortcut: 'P' },
  { id: 'image', type: 'image', icon: ImageIcon, label: 'Изображение', shortcut: 'I' },
  { id: 'rectangle', type: 'shape', icon: Square, label: 'Прямоугольник', shortcut: 'R' },
  { id: 'circle', type: 'shape', icon: Circle, label: 'Круг', shortcut: 'C' },
  { id: 'line', type: 'line', icon: Minus, label: 'Линия', shortcut: 'L' },
] as const;

// Font families
const FONT_FAMILIES = [
  'Arial', 'Times New Roman', 'Helvetica', 'Georgia', 'Verdana', 'Roboto', 'Open Sans'
];

// Draggable tool component
function DraggableTool({ tool }: { tool: typeof CANVAS_TOOLS[number] }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `tool-${tool.id}`,
    data: { type: 'tool', toolType: tool.id },
  });

  const IconComponent = tool.icon;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <IconComponent className="h-6 w-6 text-gray-600 group-hover:text-blue-600 mb-1" />
      <span className="text-xs text-gray-600 group-hover:text-blue-600 text-center">
        {tool.label}
      </span>
    </div>
  );
}

// Resize handles component
function ResizeHandles({ 
  element, 
  onResize 
}: { 
  element: CanvasElement; 
  onResize: (elementId: string, newWidth: number, newHeight: number) => void;
}) {
  const handleMouseDown = (direction: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = element.width;
    const startHeight = element.height;

    const handleMouseMove = (e: MouseEvent) => {
      let newWidth = startWidth;
      let newHeight = startHeight;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      switch (direction) {
        case 'nw':
          newWidth = startWidth - deltaX;
          newHeight = startHeight - deltaY;
          break;
        case 'ne':
          newWidth = startWidth + deltaX;
          newHeight = startHeight - deltaY;
          break;
        case 'sw':
          newWidth = startWidth - deltaX;
          newHeight = startHeight + deltaY;
          break;
        case 'se':
          newWidth = startWidth + deltaX;
          newHeight = startHeight + deltaY;
          break;
        case 'n':
          newHeight = startHeight - deltaY;
          break;
        case 's':
          newHeight = startHeight + deltaY;
          break;
        case 'w':
          newWidth = startWidth - deltaX;
          break;
        case 'e':
          newWidth = startWidth + deltaX;
          break;
      }

      // Minimum size constraints
      newWidth = Math.max(20, newWidth);
      newHeight = Math.max(20, newHeight);

      onResize(element.id, newWidth, newHeight);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handles = [
    { id: 'nw', className: 'top-0 left-0 cursor-nw-resize', style: { transform: 'translate(-50%, -50%)' } },
    { id: 'n', className: 'top-0 left-1/2 cursor-n-resize', style: { transform: 'translate(-50%, -50%)' } },
    { id: 'ne', className: 'top-0 right-0 cursor-ne-resize', style: { transform: 'translate(50%, -50%)' } },
    { id: 'w', className: 'top-1/2 left-0 cursor-w-resize', style: { transform: 'translate(-50%, -50%)' } },
    { id: 'e', className: 'top-1/2 right-0 cursor-e-resize', style: { transform: 'translate(50%, -50%)' } },
    { id: 'sw', className: 'bottom-0 left-0 cursor-sw-resize', style: { transform: 'translate(-50%, 50%)' } },
    { id: 's', className: 'bottom-0 left-1/2 cursor-s-resize', style: { transform: 'translate(-50%, 50%)' } },
    { id: 'se', className: 'bottom-0 right-0 cursor-se-resize', style: { transform: 'translate(50%, 50%)' } },
  ];

  return (
    <>
      {handles.map((handle) => (
        <div
          key={handle.id}
          className={`absolute w-3 h-3 bg-blue-500 border border-white rounded-full hover:bg-blue-600 ${handle.className}`}
          style={handle.style}
          onMouseDown={handleMouseDown(handle.id)}
        />
      ))}
    </>
  );
}

// Draggable canvas element component
function DraggableCanvasElement({ 
  element, 
  isSelected, 
  isEditing,
  onSelect, 
  onDoubleClick,
  onResize,
  onUpdateContent,
}: {
  element: CanvasElement;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: (id: string) => void;
  onDoubleClick: (id: string) => void;
  onResize: (elementId: string, newWidth: number, newHeight: number) => void;
  onUpdateContent: (elementId: string, content: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: element.id,
    data: { type: 'element', element },
    disabled: isEditing,
  });

  const [editingContent, setEditingContent] = useState(element.content);

  const style = {
    position: 'absolute' as const,
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    zIndex: isDragging ? 1000 : element.zIndex,
    opacity: element.properties.opacity || 1,
    transform: element.properties.rotation ? `rotate(${element.properties.rotation}deg)` : undefined,
  };

  // Handle keydown for editing inputs to prevent global handlers
  const handleEditingKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation(); // Prevent global keyboard handlers
    if (e.key === 'Enter') {
      onUpdateContent(element.id, editingContent);
    } else if (e.key === 'Escape') {
      setEditingContent(element.content); // Reset content
      onUpdateContent(element.id, element.content);
    }
  };

  const getElementContent = () => {
    if (isEditing && (element.type === 'text' || element.type === 'paragraph')) {
      return element.type === 'text' ? (
        <Input
          value={editingContent}
          onChange={(e) => setEditingContent(e.target.value)}
          onBlur={() => onUpdateContent(element.id, editingContent)}
          onKeyDown={handleEditingKeyDown}
          className="w-full h-full border-none bg-transparent p-0"
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
      ) : (
        <Textarea
          value={editingContent}
          onChange={(e) => setEditingContent(e.target.value)}
          onBlur={() => onUpdateContent(element.id, editingContent)}
          onKeyDown={handleEditingKeyDown}
          className="w-full h-full border-none bg-transparent p-2 resize-none"
          style={{
            fontSize: element.properties.fontSize || 14,
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
    }

    switch (element.type) {
      case 'text':
      case 'paragraph':
        return (
          <div
            className="w-full h-full flex items-center justify-start px-2 py-1"
            style={{
              fontSize: element.properties.fontSize || 16,
              fontFamily: element.properties.fontFamily || 'Arial',
              fontWeight: element.properties.fontWeight || 'normal',
              fontStyle: element.properties.fontStyle || 'normal',
              textDecoration: element.properties.textDecoration || 'none',
              color: element.properties.color || '#000000',
              backgroundColor: element.properties.backgroundColor || 'transparent',
              borderRadius: element.properties.borderRadius || 0,
              borderWidth: element.properties.borderWidth || 0,
              borderColor: element.properties.borderColor || '#000000',
              borderStyle: element.properties.borderWidth ? 'solid' : 'none',
              textAlign: element.properties.textAlign || 'left',
              wordWrap: 'break-word',
              overflow: 'hidden',
            }}
          >
            {element.content || 'Новый текст'}
          </div>
        );
      
      case 'shape':
        if (element.properties.shapeType === 'circle') {
          return (
            <div
              className="w-full h-full"
              style={{
                backgroundColor: element.properties.backgroundColor || '#e5e5e5',
                borderRadius: '50%',
                borderWidth: element.properties.borderWidth || 1,
                borderColor: element.properties.borderColor || '#000000',
                borderStyle: 'solid',
              }}
            />
          );
        } else {
          return (
            <div
              className="w-full h-full"
              style={{
                backgroundColor: element.properties.backgroundColor || '#e5e5e5',
                borderRadius: element.properties.borderRadius || 0,
                borderWidth: element.properties.borderWidth || 1,
                borderColor: element.properties.borderColor || '#000000',
                borderStyle: 'solid',
              }}
            />
          );
        }
      
      case 'line':
        return (
          <div
            className="w-full h-full flex items-center"
            style={{
              backgroundColor: element.properties.backgroundColor || '#000000',
              height: element.properties.borderWidth || 2,
            }}
          />
        );
      
      case 'image':
        if (element.properties.imageUrl) {
          return (
            <div className="w-full h-full relative">
              <img
                src={element.properties.imageUrl}
                alt="Canvas element"
                className="w-full h-full object-cover"
                style={{
                  borderRadius: element.properties.borderRadius || 0,
                  borderWidth: element.properties.borderWidth || 0,
                  borderColor: element.properties.borderColor || '#000000',
                  borderStyle: element.properties.borderWidth ? 'solid' : 'none',
                }}
              />
            </div>
          );
        } else {
          return (
            <div className="w-full h-full bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-500 cursor-pointer">
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto mb-2" />
                <span className="text-sm">Загрузить изображение</span>
              </div>
            </div>
          );
        }
      
      default:
        return (
          <div className="w-full h-full bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-500 text-sm">
            Элемент
          </div>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...(!isEditing ? listeners : {})}
      {...(!isEditing ? attributes : {})}
      style={style}
      className={`select-none transition-all duration-200 ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${isDragging ? 'opacity-50' : ''} ${
        isEditing ? 'cursor-text' : 'cursor-move'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(element.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick(element.id);
      }}
    >
      {getElementContent()}
      {isSelected && !isEditing && (
        <ResizeHandles element={element} onResize={onResize} />
      )}
    </div>
  );
}

// Droppable canvas component
function DroppableCanvas({ children, isOver }: { children: React.ReactNode; isOver: boolean }) {
  const { setNodeRef } = useDroppable({
    id: 'canvas-drop-zone',
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative bg-white border-2 shadow-lg transition-colors ${
        isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
      style={{
        width: 210 * 3.7795, // A4 width in pixels
        height: 297 * 3.7795, // A4 height in pixels
      }}
    >
      {children}
    </div>
  );
}

function BookEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { userProfile, isLoading: authLoading } = useAuth();
  
  // Core state
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Canvas state
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>([]);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [currentTool, setCurrentTool] = useState<Tool>('select');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Canvas settings
  const [canvasWidth, setCanvasWidth] = useState(210); // A4 width in mm
  const [canvasHeight, setCanvasHeight] = useState(297); // A4 height in mm
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize] = useState(10);
  
  // Drag state
  const [activeElement, setActiveElement] = useState<CanvasElement | null>(null);
  const [editingText, setEditingText] = useState<string | null>(null);
  
  // Undo/redo state
  const [history, setHistory] = useState<CanvasElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // UI state
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [leftPanelWidth] = useState(280);
  const [rightPanelWidth] = useState(320);
  
  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // DnD sensors with proper configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Custom collision detection for precise canvas dropping
  const customCollisionDetection: CollisionDetection = useCallback((args) => {
    const pointerIntersections = rectIntersection(args);
    const intersections = pointerIntersections.length > 0 
      ? pointerIntersections 
      : rectIntersection(args);

    const overId = getFirstCollision(intersections, 'id');

    if (overId != null) {
      if (overId === 'canvas-drop-zone') {
        return [{
          id: overId,
          data: {
            droppableContainer: args.droppableContainers.find(container => container.id === overId),
            value: 0,
          },
        }];
      }
    }

    return [];
  }, []);

  // Save state to history for undo/redo
  const saveToHistory = useCallback((elements: CanvasElement[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push([...elements]);
      return newHistory.slice(-50); // Keep last 50 states
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Update canvas elements with history
  const updateCanvasElements = useCallback((updater: (prev: CanvasElement[]) => CanvasElement[]) => {
    setCanvasElements(prev => {
      const updated = updater(prev);
      saveToHistory(updated);
      return updated;
    });
  }, [saveToHistory]);

  // Undo functionality
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setCanvasElements(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  // Redo functionality
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setCanvasElements(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Generate new element ID
  const generateElementId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create new element from tool
  const createElementFromTool = (toolType: string, x: number, y: number): CanvasElement => {
    const id = generateElementId();
    const baseElement = {
      id,
      x,
      y,
      page: currentPage,
      zIndex: canvasElements.length + 1,
      locked: false,
      visible: true,
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
            textAlign: 'left',
            autoSize: true,
          },
        };
      
      case 'paragraph':
        return {
          ...baseElement,
          type: 'paragraph',
          width: 300,
          height: 100,
          content: 'Новый абзац текста...',
          properties: {
            fontSize: 14,
            fontFamily: 'Arial',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'none',
            color: '#000000',
            textAlign: 'left',
            backgroundColor: 'transparent',
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
            backgroundColor: '#000000',
            borderWidth: 2,
          },
        };
      
      case 'image':
        return {
          ...baseElement,
          type: 'image',
          width: 200,
          height: 150,
          content: '',
          properties: {
            backgroundColor: '#f5f5f5',
            borderWidth: 1,
            borderColor: '#d0d0d0',
          },
        };
      
      default:
        return {
          ...baseElement,
          type: 'text',
          width: 150,
          height: 40,
          content: 'Элемент',
          properties: {
            fontSize: 16,
            fontFamily: 'Arial',
            color: '#000000',
          },
        };
    }
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;

    if (activeData?.type === 'element') {
      setActiveElement(activeData.element);
    } else if (activeData?.type === 'tool') {
      // Create a preview element for the tool
      const previewElement = createElementFromTool(activeData.toolType, 0, 0);
      setActiveElement(previewElement);
    }
  };

  // Handle drag over
  const handleDragOver = (_event: DragOverEvent) => {
    // Visual feedback during drag operations
  };

  // Handle drag end - Fixed animation bug
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeData = active.data.current;

    if (!over) {
      setActiveElement(null);
      return;
    }

    if (over.id === 'canvas-drop-zone') {
      if (activeData?.type === 'tool') {
        // Add new element from tool to canvas
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          // Use absolute coordinates from the drop event
          const pointerEvent = event.activatorEvent as PointerEvent;
          const x = Math.max(0, Math.min(pointerEvent.clientX - rect.left - 50, canvasWidth * 3.7795 - 100));
          const y = Math.max(0, Math.min(pointerEvent.clientY - rect.top - 20, canvasHeight * 3.7795 - 40));
          
          const newElement = createElementFromTool(activeData.toolType, x, y);
          updateCanvasElements(prev => [...prev, newElement]);
          setSelectedElements([newElement.id]);
        }
      } else if (activeData?.type === 'element') {
        // Move existing element using absolute coordinates
        const elementId = activeData.element.id;
        const rect = canvasRef.current?.getBoundingClientRect();
        
        if (rect) {
          const pointerEvent = event.activatorEvent as PointerEvent;
          const newX = Math.max(0, Math.min(pointerEvent.clientX - rect.left - activeData.element.width / 2, canvasWidth * 3.7795 - activeData.element.width));
          const newY = Math.max(0, Math.min(pointerEvent.clientY - rect.top - activeData.element.height / 2, canvasHeight * 3.7795 - activeData.element.height));
          
          updateCanvasElements(prev => prev.map(el => 
            el.id === elementId 
              ? { ...el, x: newX, y: newY }
              : el
          ));
        }
      }
    }

    setActiveElement(null);
  };

  // Handle element selection
  const handleElementSelect = (elementId: string) => {
    if (selectedElements.includes(elementId)) {
      setSelectedElements(prev => prev.filter(id => id !== elementId));
    } else {
      setSelectedElements([elementId]);
    }
    setEditingText(null);
  };

  // Handle text editing
  const handleElementDoubleClick = (elementId: string) => {
    const element = canvasElements.find(el => el.id === elementId);
    if (element && (element.type === 'text' || element.type === 'paragraph')) {
      setEditingText(elementId);
      setSelectedElements([elementId]);
    } else if (element && element.type === 'image' && !element.properties.imageUrl) {
      // Trigger image upload
      fileInputRef.current?.click();
    }
  };

  // Handle text content update
  const handleUpdateContent = (elementId: string, content: string) => {
    updateCanvasElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, content } : el
    ));
    setEditingText(null);
  };

  // Handle element resize
  const handleElementResize = (elementId: string, newWidth: number, newHeight: number) => {
    updateCanvasElements(prev => prev.map(el => 
      el.id === elementId 
        ? { ...el, width: newWidth, height: newHeight }
        : el
    ));
  };

  // Update element properties
  const updateElementProperties = (
    elementId: string, 
    updates: Partial<CanvasElement['properties']> & { x?: number; y?: number; width?: number; height?: number }
  ) => {
    updateCanvasElements(prev => prev.map(el => {
      if (el.id === elementId) {
        const updatedEl = { 
          ...el,
          ...(updates.x !== undefined ? { x: updates.x } : {}),
          ...(updates.y !== undefined ? { y: updates.y } : {}),
          ...(updates.width !== undefined ? { width: updates.width } : {}),
          ...(updates.height !== undefined ? { height: updates.height } : {}),
          properties: { 
            ...el.properties, 
            ...Object.fromEntries(
              Object.entries(updates).filter(([key]) => !['x', 'y', 'width', 'height'].includes(key))
            )
          } 
        };
        return updatedEl;
      }
      return el;
    }));
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Файл слишком большой. Максимальный размер: 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Пожалуйста, выберите файл изображения');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      
      if (selectedElements.length === 1) {
        // Update existing selected image element
        updateElementProperties(selectedElements[0], { imageUrl });
      } else {
        // Create new image element
        const newElement = createElementFromTool('image', 100, 100);
        newElement.properties.imageUrl = imageUrl;
        updateCanvasElements(prev => [...prev, newElement]);
        setSelectedElements([newElement.id]);
      }
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    event.target.value = '';
  };

  // Handle canvas click (deselect)
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedElements([]);
      setEditingText(null);
    }
  };

  // Handle keyboard shortcuts - Fixed backspace issue
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't interfere with text editing
    if (editingText) {
      return;
    }

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
          // Duplicate selected elements
          if (selectedElements.length > 0) {
            const elementsToDuplicate = canvasElements.filter(el => selectedElements.includes(el.id));
            const duplicatedElements = elementsToDuplicate.map(el => ({
              ...el,
              id: generateElementId(),
              x: el.x + 20,
              y: el.y + 20,
            }));
            updateCanvasElements(prev => [...prev, ...duplicatedElements]);
            setSelectedElements(duplicatedElements.map(el => el.id));
          }
          break;
        case 'c':
          e.preventDefault();
          // Copy elements (basic implementation)
          break;
        case 'v':
          e.preventDefault();
          // Paste elements (basic implementation)
          break;
      }
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      // Only delete elements if not editing text and have selected elements
      if (selectedElements.length > 0) {
        e.preventDefault();
        updateCanvasElements(prev => prev.filter(el => !selectedElements.includes(el.id)));
        setSelectedElements([]);
      }
    }
  }, [selectedElements, canvasElements, undo, redo, updateCanvasElements, editingText]);

  // Set up keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Save canvas to database
  const saveCanvasData = async () => {
    if (!book || !userProfile) return;

    setIsSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      
      const { error: updateError } = await supabase
        .from('books')
        .update({
          canvas_elements: JSON.stringify(canvasElements),
          canvas_width: canvasWidth,
          canvas_height: canvasHeight,
          total_pages: totalPages,
          updated_at: new Date().toISOString(),
        })
        .eq('id', book.id);

      if (updateError) {
        throw new Error(`Ошибка сохранения: ${updateError.message}`);
      }

      setSuccess('Изменения сохранены успешно!');
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Error saving canvas:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка при сохранении');
    } finally {
      setIsSaving(false);
    }
  };

  // Load book data
  const fetchBook = useCallback(async () => {
    if (!params.base_url || !userProfile) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('base_url', params.base_url)
        .eq('author_id', userProfile.id)
        .single();

      if (bookError) {
        throw new Error(`Книга не найдена: ${bookError.message}`);
      }

      setBook(bookData);

      // Load canvas elements if they exist
      if (bookData.canvas_elements) {
        try {
          const elements = JSON.parse(bookData.canvas_elements);
          setCanvasElements(elements);
          saveToHistory(elements);
        } catch (e) {
          console.error('Error parsing canvas elements:', e);
        }
      }

      if (bookData.canvas_width) setCanvasWidth(bookData.canvas_width);
      if (bookData.canvas_height) setCanvasHeight(bookData.canvas_height);
      if (bookData.total_pages) setTotalPages(bookData.total_pages);

    } catch (err) {
      console.error('Error fetching book:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке книги');
    } finally {
      setIsLoading(false);
    }
  }, [params.base_url, userProfile, saveToHistory]);

  useEffect(() => {
    if (!authLoading && userProfile && userProfile.role === 'author') {
      fetchBook();
    }
  }, [authLoading, userProfile, fetchBook]);

  // Get current page elements
  const currentPageElements = canvasElements.filter(el => el.page === currentPage);
  const selectedElement = selectedElements.length === 1 ? canvasElements.find(el => el.id === selectedElements[0]) : null;

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка редактора...</p>
        </div>
      </div>
    );
  }

  if (!userProfile || userProfile.role !== 'author') {
    return (
      <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Доступ запрещен</h1>
          <p className="text-gray-600 mb-4">Только авторы могут редактировать книги.</p>
          <Button onClick={() => router.push('/dashboard')} className="bg-blue-600 hover:bg-blue-700">
            Вернуться на главную
          </Button>
        </div>
      </div>
    );
  }

  if (error && !book) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Ошибка</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/dashboard/books')} className="bg-blue-600 hover:bg-blue-700">
            Вернуться к книгам
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                router.push('/dashboard/books');
              }}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Назад к книгам
            </Button>
            
            <div className="h-6 w-px bg-gray-300" />
            
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{book?.title || 'Загрузка...'}</h1>
              <p className="text-sm text-gray-500">Редактор книги</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {error && (
              <div className="text-red-600 text-sm mr-4">{error}</div>
            )}
            {success && (
              <div className="text-green-600 text-sm mr-4">{success}</div>
            )}
            
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                saveCanvasData();
              }}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Сохранить
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={(e) => e.preventDefault()}
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Send className="h-4 w-4 mr-2" />
              На модерацию
            </Button>

            <Button 
              type="button"
              variant="ghost" 
              size="sm"
              onClick={(e) => e.preventDefault()}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Tool selection */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              {CANVAS_TOOLS.map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <Button
                    key={tool.id}
                    type="button"
                    variant={currentTool === tool.id ? "default" : "ghost"}
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentTool(tool.id as Tool);
                    }}
                    className={`h-8 w-8 p-0 ${
                      currentTool === tool.id ? 'bg-blue-600 text-white' : 'text-gray-600'
                    }`}
                    title={`${tool.label} (${tool.shortcut})`}
                  >
                    <IconComponent className="h-4 w-4" />
                  </Button>
                );
              })}
            </div>

            <div className="h-6 w-px bg-gray-300" />

            {/* Undo/Redo */}
            <div className="flex items-center space-x-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  undo();
                }}
                disabled={historyIndex <= 0}
                title="Отменить (Ctrl+Z)"
              >
                ↶
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  redo();
                }}
                disabled={historyIndex >= history.length - 1}
                title="Повторить (Ctrl+Y)"
              >
                ↷
              </Button>
            </div>

            <div className="h-6 w-px bg-gray-300" />

            {/* Zoom controls */}
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  setZoomLevel(prev => Math.max(0.1, prev - 0.1));
                }}
                disabled={zoomLevel <= 0.1}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600 w-16 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  setZoomLevel(prev => Math.min(3, prev + 0.1));
                }}
                disabled={zoomLevel >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-6 w-px bg-gray-300" />

            {/* Grid toggle */}
            <Button
              type="button"
              variant={showGrid ? "default" : "ghost"}
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                setShowGrid(!showGrid);
              }}
              className={showGrid ? 'bg-blue-600 text-white' : ''}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>

          {/* Page controls */}
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                setCurrentPage(prev => Math.max(1, prev - 1));
              }}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">
              Страница {currentPage} из {totalPages}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                setCurrentPage(prev => Math.min(totalPages, prev + 1));
              }}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                setTotalPages(prev => prev + 1);
              }}
              title="Добавить страницу"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Panel toggles */}
          <div className="flex items-center space-x-1">
            <Button
              type="button"
              variant={showPropertiesPanel ? "default" : "ghost"}
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                setShowPropertiesPanel(!showPropertiesPanel);
              }}
              className={showPropertiesPanel ? 'bg-blue-600 text-white' : ''}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={showLayersPanel ? "default" : "ghost"}
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                setShowLayersPanel(!showLayersPanel);
              }}
              className={showLayersPanel ? 'bg-blue-600 text-white' : ''}
            >
              <Layers className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar - Element Library */}
          <div 
            className="bg-white border-r border-gray-200 overflow-y-auto"
            style={{ width: leftPanelWidth }}
          >
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Элементы</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Инструменты</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {CANVAS_TOOLS.slice(1).map((tool) => (
                      <DraggableTool key={tool.id} tool={tool} />
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Быстрые действия</h4>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={(e) => {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Загрузить изображение
                    </Button>
                    {selectedElements.length > 0 && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={(e) => {
                            e.preventDefault();
                            // Duplicate functionality
                            const elementsToDuplicate = canvasElements.filter(el => selectedElements.includes(el.id));
                            const duplicatedElements = elementsToDuplicate.map(el => ({
                              ...el,
                              id: generateElementId(),
                              x: el.x + 20,
                              y: el.y + 20,
                            }));
                            updateCanvasElements(prev => [...prev, ...duplicatedElements]);
                            setSelectedElements(duplicatedElements.map(el => el.id));
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Дублировать
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-red-600 border-red-300 hover:bg-red-50"
                          onClick={(e) => {
                            e.preventDefault();
                            updateCanvasElements(prev => prev.filter(el => !selectedElements.includes(el.id)));
                            setSelectedElements([]);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Удалить
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Canvas area */}
          <div className="flex-1 bg-gray-200 overflow-auto relative">
            <div className="p-8">
              <div 
                ref={canvasRef}
                className="mx-auto bg-white shadow-2xl relative"
                style={{
                  width: canvasWidth * 3.7795 * zoomLevel,
                  height: canvasHeight * 3.7795 * zoomLevel,
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top left',
                }}
                onClick={handleCanvasClick}
              >
                {/* Grid overlay */}
                {showGrid && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `
                        radial-gradient(circle, #e5e5e5 1px, transparent 1px)
                      `,
                      backgroundSize: `${gridSize}px ${gridSize}px`,
                    }}
                  />
                )}

                <DroppableCanvas isOver={false}>
                  {currentPageElements.map((element) => (
                    <DraggableCanvasElement
                      key={element.id}
                      element={element}
                      isSelected={selectedElements.includes(element.id)}
                      isEditing={editingText === element.id}
                      onSelect={handleElementSelect}
                      onDoubleClick={handleElementDoubleClick}
                      onResize={handleElementResize}
                      onUpdateContent={handleUpdateContent}
                    />
                  ))}
                </DroppableCanvas>

                {/* Empty state */}
                {currentPageElements.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <Type className="h-8 w-8" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Начните создание</h3>
                      <p className="text-sm">
                        Перетащите элементы из левой панели<br />
                        или используйте горячие клавиши
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar - Properties Panel */}
          {showPropertiesPanel && (
            <div 
              className="bg-white border-l border-gray-200 overflow-y-auto"
              style={{ width: rightPanelWidth }}
            >
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Свойства</h3>
                
                {selectedElement ? (
                  <div className="space-y-6">
                    {/* Position and Size */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Позиция и размер</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs text-gray-500">X</Label>
                          <Input
                            type="number"
                            value={Math.round(selectedElement.x)}
                            onChange={(e) => updateElementProperties(selectedElement.id, { x: Number(e.target.value) })}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Y</Label>
                          <Input
                            type="number"
                            value={Math.round(selectedElement.y)}
                            onChange={(e) => updateElementProperties(selectedElement.id, { y: Number(e.target.value) })}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Ширина</Label>
                          <Input
                            type="number"
                            value={Math.round(selectedElement.width)}
                            onChange={(e) => updateElementProperties(selectedElement.id, { width: Number(e.target.value) })}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Высота</Label>
                          <Input
                            type="number"
                            value={Math.round(selectedElement.height)}
                            onChange={(e) => updateElementProperties(selectedElement.id, { height: Number(e.target.value) })}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Text Properties */}
                    {(selectedElement.type === 'text' || selectedElement.type === 'paragraph') && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Текст</h4>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs text-gray-500">Содержание</Label>
                            {selectedElement.type === 'text' ? (
                              <Input
                                value={selectedElement.content}
                                onChange={(e) => {
                                  updateCanvasElements(prev => prev.map(el => 
                                    el.id === selectedElement.id ? { ...el, content: e.target.value } : el
                                  ));
                                }}
                                className="h-8 text-xs"
                              />
                            ) : (
                              <Textarea
                                value={selectedElement.content}
                                onChange={(e) => {
                                  updateCanvasElements(prev => prev.map(el => 
                                    el.id === selectedElement.id ? { ...el, content: e.target.value } : el
                                  ));
                                }}
                                className="text-xs"
                                rows={3}
                              />
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs text-gray-500">Шрифт</Label>
                              <Select
                                value={selectedElement.properties.fontFamily || 'Arial'}
                                onValueChange={(value) => updateElementProperties(selectedElement.id, { fontFamily: value })}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {FONT_FAMILIES.map(font => (
                                    <SelectItem key={font} value={font}>{font}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label className="text-xs text-gray-500">Размер</Label>
                              <Input
                                type="number"
                                value={selectedElement.properties.fontSize || 16}
                                onChange={(e) => updateElementProperties(selectedElement.id, { fontSize: Number(e.target.value) })}
                                className="h-8 text-xs"
                                min="8"
                                max="120"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-1">
                            <Button
                              type="button"
                              variant={selectedElement.properties.fontWeight === 'bold' ? 'default' : 'outline'}
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                updateElementProperties(selectedElement.id, { 
                                  fontWeight: selectedElement.properties.fontWeight === 'bold' ? 'normal' : 'bold'
                                });
                              }}
                              className="h-8 text-xs font-bold"
                            >
                              B
                            </Button>
                            <Button
                              type="button"
                              variant={selectedElement.properties.fontStyle === 'italic' ? 'default' : 'outline'}
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                updateElementProperties(selectedElement.id, { 
                                  fontStyle: selectedElement.properties.fontStyle === 'italic' ? 'normal' : 'italic'
                                });
                              }}
                              className="h-8 text-xs italic"
                            >
                              I
                            </Button>
                            <Button 
                              type="button"
                              variant={selectedElement.properties.textDecoration === 'underline' ? 'default' : 'outline'}
                              size="sm" 
                              onClick={(e) => {
                                e.preventDefault();
                                updateElementProperties(selectedElement.id, { 
                                  textDecoration: selectedElement.properties.textDecoration === 'underline' ? 'none' : 'underline'
                                });
                              }}
                              className="h-8 text-xs underline"
                            >
                              U
                            </Button>
                          </div>

                          <div>
                            <Label className="text-xs text-gray-500">Выравнивание</Label>
                            <div className="grid grid-cols-4 gap-1 mt-1">
                              {(['left', 'center', 'right', 'justify'] as const).map((align) => (
                                <Button
                                  key={align}
                                  type="button"
                                  variant={selectedElement.properties.textAlign === align ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    updateElementProperties(selectedElement.id, { textAlign: align });
                                  }}
                                  className="h-8 text-xs"
                                >
                                  {align === 'left' ? '⬅' : align === 'center' ? '↔' : align === 'right' ? '➡' : '⬌'}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Color Properties */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Цвета</h4>
                      <div className="space-y-3">
                        {(selectedElement.type === 'text' || selectedElement.type === 'paragraph') && (
                          <div>
                            <Label className="text-xs text-gray-500">Цвет текста</Label>
                            <div className="flex items-center space-x-2 mt-1">
                              <Input
                                type="color"
                                value={selectedElement.properties.color || '#000000'}
                                onChange={(e) => updateElementProperties(selectedElement.id, { color: e.target.value })}
                                className="w-12 h-8 p-1 border rounded"
                              />
                              <Input
                                type="text"
                                value={selectedElement.properties.color || '#000000'}
                                onChange={(e) => updateElementProperties(selectedElement.id, { color: e.target.value })}
                                className="flex-1 h-8 text-xs font-mono"
                              />
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <Label className="text-xs text-gray-500">Цвет фона</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Input
                              type="color"
                              value={selectedElement.properties.backgroundColor || '#ffffff'}
                              onChange={(e) => updateElementProperties(selectedElement.id, { backgroundColor: e.target.value })}
                              className="w-12 h-8 p-1 border rounded"
                            />
                            <Input
                              type="text"
                              value={selectedElement.properties.backgroundColor || 'transparent'}
                              onChange={(e) => updateElementProperties(selectedElement.id, { backgroundColor: e.target.value })}
                              className="flex-1 h-8 text-xs font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Border Properties */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Рамка</h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-gray-500">Толщина</Label>
                            <Input
                              type="number"
                              value={selectedElement.properties.borderWidth || 0}
                              onChange={(e) => updateElementProperties(selectedElement.id, { borderWidth: Number(e.target.value) })}
                              className="h-8 text-xs"
                              min="0"
                              max="20"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Радиус</Label>
                            <Input
                              type="number"
                              value={selectedElement.properties.borderRadius || 0}
                              onChange={(e) => updateElementProperties(selectedElement.id, { borderRadius: Number(e.target.value) })}
                              className="h-8 text-xs"
                              min="0"
                              max="50"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-xs text-gray-500">Цвет рамки</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Input
                              type="color"
                              value={selectedElement.properties.borderColor || '#000000'}
                              onChange={(e) => updateElementProperties(selectedElement.id, { borderColor: e.target.value })}
                              className="w-12 h-8 p-1 border rounded"
                            />
                            <Input
                              type="text"
                              value={selectedElement.properties.borderColor || '#000000'}
                              onChange={(e) => updateElementProperties(selectedElement.id, { borderColor: e.target.value })}
                              className="flex-1 h-8 text-xs font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Advanced Properties */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Дополнительно</h4>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-gray-500">Прозрачность</Label>
                          <Input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={selectedElement.properties.opacity || 1}
                            onChange={(e) => updateElementProperties(selectedElement.id, { opacity: Number(e.target.value) })}
                            className="w-full h-8"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs text-gray-500">Поворот (градусы)</Label>
                          <Input
                            type="number"
                            value={selectedElement.properties.rotation || 0}
                            onChange={(e) => updateElementProperties(selectedElement.id, { rotation: Number(e.target.value) })}
                            className="h-8 text-xs"
                            min="-360"
                            max="360"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 mt-8">
                    <Settings className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">Выберите элемент для редактирования свойств</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Layers Panel */}
          {showLayersPanel && (
            <div 
              className="bg-white border-l border-gray-200 overflow-y-auto"
              style={{ width: rightPanelWidth }}
            >
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Слои</h3>
                
                <div className="space-y-1">
                  {currentPageElements
                    .slice()
                    .sort((a, b) => b.zIndex - a.zIndex)
                    .map((element) => (
                      <div
                        key={element.id}
                        className={`p-2 rounded border text-sm cursor-pointer ${
                          selectedElements.includes(element.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleElementSelect(element.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-gray-200 rounded flex items-center justify-center">
                              {element.type === 'text' && <Type className="h-2 w-2" />}
                              {element.type === 'image' && <ImageIcon className="h-2 w-2" />}
                              {element.type === 'shape' && <Square className="h-2 w-2" />}
                            </div>
                            <span className="truncate">
                              {element.content || `${element.type} элемент`}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">
                            {element.zIndex}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hidden file input for image upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeElement && (
          <div
            className="bg-white border-2 border-blue-500 rounded-lg shadow-lg pointer-events-none"
            style={{
              width: activeElement.width,
              height: activeElement.height,
              padding: '8px',
            }}
          >
            <div className="text-xs text-gray-600 truncate">
              {activeElement.content || `${activeElement.type} элемент`}
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

export default function BookEditorPageWithSuspense() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Загрузка...</div>}>
      <BookEditorPage />
    </Suspense>
  );
} 