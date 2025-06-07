'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BookOpen, Plus, Trash2, Edit, GripVertical, ChevronDown, ChevronRight,
  FileText, Folder, FolderOpen, Move, Copy, Eye, EyeOff
} from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export type BookSection = {
  id: string;
  title: string;
  type: 'chapter' | 'section' | 'subsection';
  order: number;
  parentId?: string;
  content?: string;
  isVisible: boolean;
  isExpanded: boolean;
  children?: BookSection[];
};

interface BookStructureProps {
  sections: BookSection[];
  onSectionsChange: (sections: BookSection[]) => void;
  onSectionSelect?: (section: BookSection) => void;
  selectedSectionId?: string;
}

export function BookStructure({ 
  sections, 
  onSectionsChange, 
  onSectionSelect,
  selectedSectionId 
}: BookStructureProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [draggedItem, setDraggedItem] = useState<BookSection | null>(null);

  // Helper functions
  const generateId = () => `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const findSectionById = (id: string, sectionList: BookSection[] = sections): BookSection | null => {
    for (const section of sectionList) {
      if (section.id === id) return section;
      if (section.children) {
        const found = findSectionById(id, section.children);
        if (found) return found;
      }
    }
    return null;
  };

  const updateSection = (id: string, updates: Partial<BookSection>) => {
    const updateInList = (list: BookSection[]): BookSection[] => {
      return list.map(section => {
        if (section.id === id) {
          return { ...section, ...updates };
        }
        if (section.children) {
          return { ...section, children: updateInList(section.children) };
        }
        return section;
      });
    };
    onSectionsChange(updateInList(sections));
  };

  const addSection = (type: BookSection['type'], parentId?: string) => {
    const newSection: BookSection = {
      id: generateId(),
      title: `Новый ${type === 'chapter' ? 'раздел' : type === 'section' ? 'подраздел' : 'пункт'}`,
      type,
      order: 0,
      parentId,
      isVisible: true,
      isExpanded: true,
      children: type === 'chapter' ? [] : undefined,
    };

    if (parentId) {
      const updateInList = (list: BookSection[]): BookSection[] => {
        return list.map(section => {
          if (section.id === parentId) {
            const children = section.children || [];
            return { 
              ...section, 
              children: [...children, newSection],
              isExpanded: true 
            };
          }
          if (section.children) {
            return { ...section, children: updateInList(section.children) };
          }
          return section;
        });
      };
      onSectionsChange(updateInList(sections));
    } else {
      onSectionsChange([...sections, newSection]);
    }
  };

  const deleteSection = (id: string) => {
    const deleteFromList = (list: BookSection[]): BookSection[] => {
      return list.filter(section => {
        if (section.id === id) return false;
        if (section.children) {
          section.children = deleteFromList(section.children);
        }
        return true;
      });
    };
    onSectionsChange(deleteFromList(sections));
  };

  const duplicateSection = (id: string) => {
    const section = findSectionById(id);
    if (!section) return;

    const duplicateWithNewIds = (original: BookSection): BookSection => ({
      ...original,
      id: generateId(),
      title: `${original.title} (копия)`,
      children: original.children?.map(duplicateWithNewIds),
    });

    const duplicate = duplicateWithNewIds(section);
    
    if (section.parentId) {
      const updateInList = (list: BookSection[]): BookSection[] => {
        return list.map(parent => {
          if (parent.id === section.parentId) {
            const children = parent.children || [];
            return { ...parent, children: [...children, duplicate] };
          }
          if (parent.children) {
            return { ...parent, children: updateInList(parent.children) };
          }
          return parent;
        });
      };
      onSectionsChange(updateInList(sections));
    } else {
      onSectionsChange([...sections, duplicate]);
    }
  };

  const startEditing = (section: BookSection) => {
    setEditingId(section.id);
    setEditingTitle(section.title);
  };

  const saveEditing = () => {
    if (editingId) {
      updateSection(editingId, { title: editingTitle });
      setEditingId(null);
      setEditingTitle('');
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const section = findSectionById(event.active.id as string);
    setDraggedItem(section);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedItem(null);
    // TODO: Implement reordering logic
  };

  // Render section item
  const renderSection = (section: BookSection, level: number = 0) => {
    const isEditing = editingId === section.id;
    const isSelected = selectedSectionId === section.id;
    const hasChildren = section.children && section.children.length > 0;

    return (
      <div key={section.id} className="select-none">
        <SortableItem
          id={section.id}
          section={section}
          level={level}
          isEditing={isEditing}
          isSelected={isSelected}
          hasChildren={!!hasChildren}
          onEdit={startEditing}
          onSave={saveEditing}
          onCancel={cancelEditing}
          onDelete={deleteSection}
          onDuplicate={duplicateSection}
          onToggleVisibility={(id) => {
            const current = findSectionById(id);
            if (current) {
              updateSection(id, { isVisible: !current.isVisible });
            }
          }}
          onToggleExpanded={(id) => {
            const current = findSectionById(id);
            if (current) {
              updateSection(id, { isExpanded: !current.isExpanded });
            }
          }}
          onSelect={() => onSectionSelect?.(section)}
          onAddChild={(type) => addSection(type, section.id)}
          editingTitle={editingTitle}
          onEditingTitleChange={setEditingTitle}
        />
        
        {/* Render children */}
        {hasChildren && (section.isExpanded ?? true) && (
          <div className="ml-6 border-l-2 border-gray-200 pl-4">
            {section.children!.map(child => renderSection(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BookOpen className="h-5 w-5 mr-2" />
          Структура Книги
        </CardTitle>
        <CardDescription>
          Управление главами, разделами и подразделами книги
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Add new chapter button */}
        <div className="mb-4">
          <Button 
            onClick={() => addSection('chapter')}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Добавить Главу</span>
          </Button>
        </div>

        {/* Structure tree */}
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="space-y-2">
            {sections.length > 0 ? (
              sections.map(section => renderSection(section))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Структура книги пуста</p>
                <p className="text-sm">Добавьте первую главу для начала</p>
              </div>
            )}
          </div>
          
          <DragOverlay>
            {draggedItem && (
              <div className="bg-white border-2 border-blue-500 rounded-lg p-2 shadow-lg">
                {draggedItem.title}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </CardContent>
    </Card>
  );
}

// Sortable item component
function SortableItem({
  id,
  section,
  level,
  isEditing,
  isSelected,
  hasChildren,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onDuplicate,
  onToggleVisibility,
  onToggleExpanded,
  onSelect,
  onAddChild,
  editingTitle,
  onEditingTitleChange,
}: {
  id: string;
  section: BookSection;
  level: number;
  isEditing: boolean;
  isSelected: boolean;
  hasChildren: boolean;
  onEdit: (section: BookSection) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleExpanded: (id: string) => void;
  onSelect: () => void;
  onAddChild: (type: BookSection['type']) => void;
  editingTitle: string;
  onEditingTitleChange: (title: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getIcon = () => {
    switch (section.type) {
      case 'chapter':
        return hasChildren && (section.isExpanded ?? false) ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />;
      case 'section':
        return <FileText className="h-4 w-4" />;
      case 'subsection':
        return <FileText className="h-3 w-3" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center space-x-2 p-2 rounded-lg border transition-all
        ${isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'}
        ${isDragging ? 'shadow-lg' : 'hover:bg-gray-50'}
      `}
    >
      {/* Drag handle */}
      <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      {/* Expand/collapse button */}
      {hasChildren && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleExpanded(id)}
          className="p-1 h-6 w-6"
        >
          {section.isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </Button>
      )}

      {/* Icon */}
      <div className="text-gray-600">
        {getIcon()}
      </div>

      {/* Title */}
      <div className="flex-1" onClick={onSelect}>
        {isEditing ? (
          <Input
            value={editingTitle}
            onChange={(e) => onEditingTitleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSave();
              if (e.key === 'Escape') onCancel();
            }}
            onBlur={onSave}
            className="h-8"
            autoFocus
          />
        ) : (
          <span className={`cursor-pointer ${!section.isVisible ? 'opacity-50 line-through' : ''}`}>
            {section.title}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-1">
        {/* Visibility toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleVisibility(id)}
          className="p-1 h-6 w-6"
          title={section.isVisible ? 'Скрыть' : 'Показать'}
        >
          {section.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
        </Button>

        {/* Add child (only for chapters) */}
        {section.type === 'chapter' && (
          <div className="relative group">
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-6 w-6"
              title="Добавить подраздел"
            >
              <Plus className="h-3 w-3" />
            </Button>
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg p-2 space-y-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddChild('section')}
                className="w-full justify-start text-xs"
              >
                Раздел
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddChild('subsection')}
                className="w-full justify-start text-xs"
              >
                Подраздел
              </Button>
            </div>
          </div>
        )}

        {/* Edit */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(section)}
          className="p-1 h-6 w-6"
          title="Редактировать"
        >
          <Edit className="h-3 w-3" />
        </Button>

        {/* Duplicate */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDuplicate(id)}
          className="p-1 h-6 w-6"
          title="Дублировать"
        >
          <Copy className="h-3 w-3" />
        </Button>

        {/* Delete */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(id)}
          className="p-1 h-6 w-6 text-red-600 hover:text-red-700"
          title="Удалить"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
} 