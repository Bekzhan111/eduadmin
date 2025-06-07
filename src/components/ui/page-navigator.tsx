import React, { useState } from 'react';
import { Plus, Trash2, Copy, ChevronUp, ChevronDown, FileText, Image as ImageIcon, MoreVertical, Grip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export type CanvasElement = {
  id: string;
  type: 'text' | 'shape' | 'image' | 'line' | 'paragraph' | 'arrow' | 'icon' | 'video' | 'audio';
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
  };
};

export type PageInfo = {
  pageNumber: number;
  elementCount: number;
  hasImages: boolean;
  hasText: boolean;
  isVisible: boolean;
  thumbnail?: string;
};

export function PageNavigator({
  currentPage,
  totalPages,
  elements,
  canvasSettings,
  onPageChange,
  onPageAdd,
  onPageDelete,
  onPageDuplicate,
  onPageMove,
  className = ""
}: {
  currentPage: number;
  totalPages: number;
  elements: CanvasElement[];
  canvasSettings: {
    canvasWidth: number;
    canvasHeight: number;
    zoom: number;
  };
  onPageChange: (page: number) => void;
  onPageAdd: (afterPage?: number) => void;
  onPageDelete: (page: number) => void;
  onPageDuplicate: (page: number) => void;
  onPageMove: (fromPage: number, toPage: number) => void;
  className?: string;
}) {
  const [expandedView, setExpandedView] = useState(true);
  const [draggedPage, setDraggedPage] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Generate page info from elements
  const getPageInfo = (pageNumber: number): PageInfo => {
    const pageElements = elements.filter(el => el.page === pageNumber);
    return {
      pageNumber,
      elementCount: pageElements.length,
      hasImages: pageElements.some(el => el.type === 'image' || el.type === 'video'),
      hasText: pageElements.some(el => el.type === 'text' || el.type === 'paragraph'),
      isVisible: true, // Can be enhanced with state management
    };
  };

  // Generate simple page thumbnail (placeholder for now)
  const generatePageThumbnail = (pageNumber: number) => {
    const pageElements = elements.filter(el => el.page === pageNumber);
    const aspectRatio = canvasSettings.canvasHeight / canvasSettings.canvasWidth;
    
    return (
      <div 
        className="relative bg-white border rounded overflow-hidden"
        style={{ 
          width: '64px', 
          height: `${64 * aspectRatio}px`,
          minHeight: '80px'
        }}
      >
        {/* Simple representation of elements */}
        {pageElements.slice(0, 5).map((element, _index) => (
          <div
            key={element.id}
            className={`absolute rounded-sm ${
              element.type === 'text' || element.type === 'paragraph' 
                ? 'bg-blue-200' 
                : element.type === 'image' || element.type === 'video'
                ? 'bg-green-200'
                : 'bg-gray-200'
            }`}
            style={{
              left: `${(element.x / canvasSettings.canvasWidth) * 100}%`,
              top: `${(element.y / canvasSettings.canvasHeight) * 100}%`,
              width: `${Math.min((element.width / canvasSettings.canvasWidth) * 100, 30)}%`,
              height: `${Math.min((element.height / canvasSettings.canvasHeight) * 100, 30)}%`,
              opacity: 0.7,
              zIndex: element.zIndex,
            }}
          />
        ))}
        
        {/* Page number overlay */}
        <div className="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 rounded-tl">
          {pageNumber}
        </div>
      </div>
    );
  };

  const handlePageClick = (pageNumber: number, e: React.MouseEvent) => {
    // Only prevent if we're actively dragging pages
    if (isDragging && draggedPage) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // Only prevent if clicking directly on buttons or dropdown elements
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button') || target.closest('[data-radix-popper-content-wrapper]')) {
      return;
    }
    
    console.log('Page clicked:', pageNumber);
    onPageChange(pageNumber);
  };

  const handleDragStart = (e: React.DragEvent, pageNumber: number) => {
    console.log('Drag start:', pageNumber);
    setDraggedPage(pageNumber);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    console.log('Drag end');
    setDraggedPage(null);
    // Short delay to prevent immediate clicks
    setTimeout(() => {
      setIsDragging(false);
    }, 50);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetPage: number) => {
    e.preventDefault();
    if (draggedPage && draggedPage !== targetPage) {
      onPageMove(draggedPage, targetPage);
    }
    setDraggedPage(null);
  };

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col ${className} shadow-sm`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center">
            <FileText className="h-4 w-4 mr-2 text-blue-600" />
            Страницы
          </h3>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedView(!expandedView)}
              className="h-7 w-7 p-0 hover:bg-blue-100 transition-colors"
              title={expandedView ? "Компактный вид" : "Развернутый вид"}
            >
              {expandedView ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageAdd()}
              className="h-7 w-7 p-0 hover:bg-green-100 hover:text-green-700 transition-colors"
              title="Добавить новую страницу"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Page counter with better styling */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
            Страница {currentPage} из {totalPages}
          </div>
          <div className="text-xs text-gray-400">
            {elements.filter(el => el.page === currentPage).length} элем.
          </div>
        </div>
      </div>

      {/* Pages list */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => {
            const pageInfo = getPageInfo(pageNumber);
            const isCurrentPage = pageNumber === currentPage;
            
            return (
              <div
                key={pageNumber}
                className={`group relative border rounded-xl transition-all duration-200 cursor-pointer transform hover:scale-[1.02] ${
                  isCurrentPage 
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md scale-[1.02]' 
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 hover:shadow-sm'
                } ${isDragging && draggedPage === pageNumber ? 'rotate-2 scale-105' : ''}`}
                onClick={(e) => handlePageClick(pageNumber, e)}
                draggable
                onDragStart={(e) => handleDragStart(e, pageNumber)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, pageNumber)}
              >
                {expandedView ? (
                  /* Expanded view with thumbnail */
                  <div className="p-3">
                    <div className="flex items-start space-x-3">
                      {/* Drag handle */}
                      <div className="flex-shrink-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Grip className="h-3 w-3 text-gray-400" />
                      </div>
                      
                      {/* Thumbnail */}
                      <div className="flex-shrink-0">
                        <div className="relative">
                          {generatePageThumbnail(pageNumber)}
                          {isCurrentPage && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
                          )}
                        </div>
                      </div>
                      
                      {/* Page info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-900 flex items-center">
                            Страница {pageNumber}
                            {isCurrentPage && (
                              <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                                Активная
                              </span>
                            )}
                          </h4>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:shadow-md"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPageDuplicate(pageNumber);
                                }}
                                className="flex items-center space-x-2"
                              >
                                <Copy className="h-4 w-4" />
                                <span>Дублировать страницу</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPageAdd(pageNumber);
                                }}
                                className="flex items-center space-x-2"
                              >
                                <Plus className="h-4 w-4" />
                                <span>Вставить после</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {totalPages > 1 && (
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onPageDelete(pageNumber);
                                  }}
                                  className="text-red-600 flex items-center space-x-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span>Удалить страницу</span>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        {/* Element counts with better styling */}
                        <div className="flex items-center space-x-3 text-xs">
                          <span className="flex items-center px-2 py-1 bg-gray-100 rounded-full">
                            <FileText className="h-3 w-3 mr-1" />
                            {pageInfo.elementCount}
                          </span>
                          {pageInfo.hasText && (
                            <span className="flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                              <FileText className="h-3 w-3 mr-1" />
                              Текст
                            </span>
                          )}
                          {pageInfo.hasImages && (
                            <span className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full">
                              <ImageIcon className="h-3 w-3 mr-1" />
                              Медиа
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Compact view with better styling */
                  <div className="p-2 flex items-center space-x-3">
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Grip className="h-3 w-3 text-gray-400" />
                    </div>
                    <div className="w-8 h-10 bg-gradient-to-br from-gray-100 to-gray-200 border rounded-md text-xs flex items-center justify-center text-gray-600 font-medium shadow-sm">
                      {pageNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 font-medium">Стр. {pageNumber}</div>
                      <div className="text-xs text-gray-500">{pageInfo.elementCount} элем.</div>
                    </div>
                    {isCurrentPage && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                )}
                
                {/* Drag indicator with better styling */}
                {draggedPage === pageNumber && (
                  <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-2 border-blue-500 border-dashed rounded-xl backdrop-blur-sm" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div className="p-3 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageAdd()}
            className="flex-1 bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 shadow-sm"
            title="Добавить новую страницу в конец"
          >
            <Plus className="h-3 w-3 mr-1" />
            Добавить
          </Button>
          {totalPages > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageDuplicate(currentPage)}
              className="flex-1 bg-white hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all duration-200 shadow-sm"
              title="Дублировать текущую страницу"
            >
              <Copy className="h-3 w-3 mr-1" />
              Дублировать
            </Button>
          )}
        </div>
        
        {/* Additional quick info */}
        <div className="mt-2 text-xs text-gray-400 text-center">
          Перетащите страницы для изменения порядка
        </div>
      </div>
    </div>
  );
} 