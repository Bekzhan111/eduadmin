import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  FileJson, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { importBookFromJSON } from './ExportFunctions';
import { BookExportData } from './types';

interface BookImportProps {
  onImport: (data: BookExportData) => void;
}

export function BookImport({ onImport }: BookImportProps) {
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const resetImport = () => {
    setImportStatus('idle');
    setImportError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-600" />
          Импорт книги из файла
        </CardTitle>
        <CardDescription>
          Вы можете импортировать книгу из JSON-файла, экспортированного ранее
        </CardDescription>
      </CardHeader>
      <CardContent>
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
            <p className="text-sm mt-2 text-gray-600">Данные из файла заполнены в форму. Вы можете внести дополнительные изменения перед созданием книги.</p>
            <Button 
              variant="outline" 
              onClick={resetImport}
              className="mt-4"
            >
              Импортировать другой файл
            </Button>
          </div>
        )}

        {importStatus === 'error' && (
          <div className="text-center py-4">
            <AlertCircle className="h-12 w-12 mx-auto mb-2 text-red-600" />
            <p className="font-medium text-red-600">Ошибка импорта</p>
            <p className="text-sm mt-1 text-red-500">{importError}</p>
            <div className="mt-4 flex justify-center gap-3">
              <Button 
                variant="outline" 
                onClick={resetImport}
              >
                Отмена
              </Button>
              <Button onClick={triggerFileInput}>
                Попробовать снова
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
