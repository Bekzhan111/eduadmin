import React, { useState, useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { LucideIcon, X } from 'lucide-react';
import { CanvasSettings } from './types';
import { uploadMedia } from '@/utils/mediaUpload';

type Tool = {
  id: string;
  name: string;
  label: string;
  icon: LucideIcon;
  category: string;
  needsFileUpload: boolean;
  accepts?: string;
  hotkey?: string;
};

type DraggableToolProps = {
  tool: Tool;
  canvasSettings: CanvasSettings;
  onMediaUploaded?: (url: string, mediaType: string) => void;
};

// Define MediaType type to match what's expected in uploadMedia
type MediaType = 'image' | 'video' | 'audio' | 'document';

export function DraggableTool({ tool, canvasSettings, onMediaUploaded }: DraggableToolProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `tool-${tool.id}`,
    data: { type: 'tool', tool },
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = async () => {
    if (tool.needsFileUpload) {
      fileInputRef.current?.click();
    } else {
      // Get the center of the canvas
      const canvasElement = document.querySelector('[data-canvas="true"]') as HTMLElement;
      if (!canvasElement) return;
      
      const canvasRect = canvasElement.getBoundingClientRect();
      const zoomFactor = canvasSettings.zoom / 100;
      
      // Calculate position at the center of the canvas
      const x = canvasRect.width / 2 / zoomFactor;
      const y = canvasRect.height / 2 / zoomFactor;
      
      // Dispatch custom event to add tool to canvas
      const event = new CustomEvent('addToolToCanvas', {
        detail: {
          toolId: tool.id,
          position: { x, y }
        }
      });
      
      window.dispatchEvent(event);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Determine media type
      let mediaType: MediaType = 'image';
      if (file.type.startsWith('video/')) mediaType = 'video';
      if (file.type.startsWith('audio/')) mediaType = 'audio';
      
      // Upload media file
      const result = await uploadMedia(file, mediaType);
      
      if (result?.url) {
        console.log(`${mediaType} uploaded:`, result.url);
        
        // Get the center of the canvas
        const canvasElement = document.querySelector('[data-canvas="true"]') as HTMLElement;
        if (!canvasElement) return;
        
        const canvasRect = canvasElement.getBoundingClientRect();
        const zoomFactor = canvasSettings.zoom / 100;
        
        // Calculate position at the center of the canvas
        const x = canvasRect.width / 2 / zoomFactor;
        const y = canvasRect.height / 2 / zoomFactor;
        
        // Create appropriate element based on media type
        const properties: Record<string, string> = {};
        
        if (mediaType === 'image') {
          properties.imageUrl = result.url;
        } else if (mediaType === 'video') {
          properties.videoUrl = result.url;
          properties.controls = 'true';
        } else if (mediaType === 'audio') {
          properties.audioUrl = result.url;
          properties.controls = 'true';
        }
        
        // Dispatch custom event to add element to canvas
        const event = new CustomEvent('addToolToCanvas', {
          detail: {
            toolId: tool.id,
            position: { x, y },
            mediaUrl: result.url
          }
        });
        
        window.dispatchEvent(event);
        
        // Callback
        onMediaUploaded?.(result.url, mediaType);
      }
    } catch (error) {
      setUploadError('Ошибка загрузки файла');
      console.error('Error uploading media:', error);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // For general tools that don't need special click handling
  const _handleGeneralToolClick = () => {
    // This is handled by the drag functionality
  };

  const needsClickFunctionality = tool.needsFileUpload || !listeners;

  return (
    <div
      ref={setNodeRef}
      {...(needsClickFunctionality ? {} : listeners)}
      {...(needsClickFunctionality ? {} : attributes)}
      onClick={handleClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      className={`
        p-3 rounded-md border bg-white dark:bg-gray-800 
        flex flex-col items-center justify-center gap-1 
        cursor-grab hover:bg-gray-100 dark:hover:bg-gray-700
        ${isDragging ? 'opacity-50' : ''}
        ${isUploading ? 'animate-pulse' : ''}
      `}
      title={`${tool.name}${tool.hotkey ? ` (${tool.hotkey})` : ''}`}
    >
      {tool.icon && <tool.icon className="h-5 w-5" />}
      <span className="text-xs">{tool.label}</span>
      
      {tool.needsFileUpload && (
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={tool.accepts}
          onChange={handleFileChange}
          disabled={isUploading}
        />
      )}
      
      {uploadError && (
        <div className="absolute bottom-full left-0 w-full bg-red-100 text-red-700 p-2 rounded text-xs mb-1 shadow-lg">
          <div className="flex items-start justify-between">
            <span>{uploadError}</span>
            <button onClick={(e) => { e.stopPropagation(); setUploadError(null); }} className="ml-1 p-1">
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
      
      {showTooltip && tool.hotkey && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs mb-1 shadow-lg">
          {tool.name} ({tool.hotkey})
        </div>
      )}
    </div>
  );
} 
