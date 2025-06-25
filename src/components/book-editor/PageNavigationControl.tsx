import React from 'react';
import { Button } from '@/components/ui/button';
import { SkipBack, SkipForward, Plus, Trash2 } from 'lucide-react';

interface PageNavigationControlProps {
  currentPage: number;
  totalPages: number;
  onChangePage: (pageNumber: number) => void;
  onAddPage: () => void;
  onDeletePage: () => void;
}

export function PageNavigationControl({
  currentPage,
  totalPages,
  onChangePage,
  onAddPage,
  onDeletePage,
}: PageNavigationControlProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (currentPage > 1) {
            onChangePage(currentPage - 1);
          }
        }}
        disabled={currentPage <= 1}
        title="Предыдущая страница"
      >
        <SkipBack className="h-4 w-4" />
      </Button>
      
      <span className="mx-2 text-sm">
        Страница {currentPage} из {totalPages}
      </span>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (currentPage < totalPages) {
            onChangePage(currentPage + 1);
          }
        }}
        disabled={currentPage >= totalPages}
        title="Следующая страница"
      >
        <SkipForward className="h-4 w-4" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onAddPage}
        title="Добавить страницу"
      >
        <Plus className="h-4 w-4" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onDeletePage}
        disabled={totalPages <= 1}
        title="Удалить страницу"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
} 
