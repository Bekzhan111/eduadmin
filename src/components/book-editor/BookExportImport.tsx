import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Upload, 
  FileJson, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Book, CanvasElement, CanvasSettings, BookExportData } from './types';
import { exportBookAsJSON, downloadBookJSON, importBookFromJSON } from './ExportFunctions';

interface BookExportImportProps {
  book: Book;
  elements: CanvasElement[];
  settings: CanvasSettings;
  onImport: (data: BookExportData) => void;
}

export function BookExportImport({ 
  book, 
  elements, 
  settings, 
  onImport 
}: BookExportImportProps) {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const exportData = exportBookAsJSON(elements, settings, book);
      downloadBookJSON(exportData);
    } catch (error) {
      console.error('Error exporting book:', error);
      alert('Ошибка при экспорте книги. Пожалуйста, попробуйте еще раз.');
    }
  };

  const handleImportClick = () => {
    setIsImportDialogOpen(true);
    setImportStatus('idle');
    setImportError(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('loading');
    setImportError(null);

    try {
      const importData = await importBookFromJSON(file);
      onImport(importData);
      setImportStatus('success');
    } catch (error) {
      console.error('Error importing book:', error);
      setImportStatus('error');
      setImportError(error instanceof Error ? error.message : 'Неизвестная ошибка импорта');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const closeImportDialog = () => {
    setIsImportDialogOpen(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={handleExport}
          title="Экспортировать книгу"
        >
          <Download className="h-4 w-4" />
          <span>Экспорт</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={handleImportClick}
          title="Импортировать книгу"
        >
          <Upload className="h-4 w-4" />
          <span>Импорт</span>
        </Button>
      </div>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Импорт книги</DialogTitle>
            <DialogDescription>
              Загрузите файл JSON с данными книги для импорта.
              Это заменит текущее содержимое книги.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {importStatus === 'idle' && (
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={triggerFileInput}
              >
                <FileJson className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  Нажмите для выбора файла или перетащите файл сюда
                </p>
                <p className="text-xs text-gray-500">
                  Поддерживаются только JSON-файлы экспорта книг
                </p>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json,application/json"
                  className="hidden"
                />
              </div>
            )}

            {importStatus === 'loading' && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Импорт книги...</p>
              </div>
            )}

            {importStatus === 'success' && (
              <div className="text-center py-4 text-green-600">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2" />
                <p className="font-medium">Книга успешно импортирована!</p>
              </div>
            )}

            {importStatus === 'error' && (
              <div className="text-center py-4 text-red-600">
                <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                <p className="font-medium">Ошибка импорта</p>
                <p className="text-sm mt-1">{importError}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={closeImportDialog}
            >
              {importStatus === 'success' ? 'Закрыть' : 'Отмена'}
            </Button>
            {importStatus === 'error' && (
              <Button onClick={triggerFileInput}>
                Попробовать снова
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 
