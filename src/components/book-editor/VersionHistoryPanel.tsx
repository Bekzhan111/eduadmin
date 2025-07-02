import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Clock, 
  Save, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp,
  Calendar,
  User,
  Archive,
  X
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { BookVersion, CanvasElement } from './types';

// Format date helper function
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

interface VersionHistoryPanelProps {
  bookId: string;
  versions: BookVersion[];
  onLoadVersion: (elements: CanvasElement[]) => void;
  onSaveVersion: (name: string, description: string) => Promise<boolean>;
  isOpen: boolean;
  onClose: () => void;
}

export function VersionHistoryPanel({
  bookId,
  versions,
  onLoadVersion,
  onSaveVersion,
  isOpen,
  onClose
}: VersionHistoryPanelProps) {
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [versionDescription, setVersionDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Format relative time
  const getRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 60) {
      return `${minutes} ${minutes === 1 ? 'минуту' : 'минут'} назад`;
    } else if (hours < 24) {
      return `${hours} ${hours === 1 ? 'час' : 'часов'} назад`;
    } else {
      return `${days} ${days === 1 ? 'день' : 'дней'} назад`;
    }
  };

  const handleRestoreVersion = async (version: BookVersion) => {
    setIsLoading(true);
    try {
      onLoadVersion(version.elements);
      // Close expanded view
      setExpandedVersionId(null);
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50';
      notification.textContent = `Версия "${version.name}" успешно восстановлена`;
      document.body.appendChild(notification);
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    } catch (error) {
      console.error('Error restoring version:', error);
      
      // Show error notification
      const errorNotification = document.createElement('div');
      errorNotification.className = 'fixed top-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50';
      errorNotification.textContent = 'Ошибка при восстановлении версии';
      document.body.appendChild(errorNotification);
      
      // Hide notification after 5 seconds
      setTimeout(() => {
        document.body.removeChild(errorNotification);
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveVersion = async () => {
    if (!versionName.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      const success = await onSaveVersion(
        versionName.trim(),
        versionDescription.trim()
      );
      
      if (success) {
        setSaveDialogOpen(false);
        setVersionName('');
        setVersionDescription('');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-80 bg-white shadow-lg border-l border-gray-200 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 className="font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" />
          История версий
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex justify-end mb-4">
          <Button 
            onClick={() => setSaveDialogOpen(true)}
            size="sm"
            className="flex items-center gap-1"
          >
            <Save className="h-4 w-4" />
            Сохранить текущую версию
          </Button>
        </div>

        {versions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Archive className="mx-auto h-12 w-12 opacity-20 mb-2" />
            <p>История версий пуста</p>
            <p className="text-sm mt-2">
              Сохраняйте важные версии книги, чтобы иметь возможность вернуться к ним
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {versions.map((version) => (
              <div 
                key={version.id}
                className="border rounded-md overflow-hidden bg-white"
              >
                <div 
                  className="p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedVersionId(expandedVersionId === version.id ? null : version.id)}
                >
                  <div>
                    <h4 className="font-medium">
                      {version.name}
                    </h4>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {getRelativeTime(version.timestamp)}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    {expandedVersionId === version.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {expandedVersionId === version.id && (
                  <div className="p-3 border-t border-gray-100 bg-gray-50">
                    <div className="space-y-3 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{formatDate(version.timestamp)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{version.userName || 'Неизвестный пользователь'}</span>
                      </div>

                      {version.description && (
                        <div className="text-sm bg-white p-2 rounded border border-gray-200">
                          {version.description}
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button
                        onClick={() => handleRestoreVersion(version)}
                        disabled={isLoading}
                        size="sm"
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Восстановить
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save version dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сохранить текущую версию</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Название версии
              </label>
              <Input
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder="Например: Финальная версия главы 1"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Описание изменений (необязательно)
              </label>
              <Textarea
                value={versionDescription}
                onChange={(e) => setVersionDescription(e.target.value)}
                placeholder="Опишите, что было изменено в этой версии"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveDialogOpen(false)}
              disabled={isSaving}
            >
              Отмена
            </Button>
            <Button
              onClick={handleSaveVersion}
              disabled={!versionName.trim() || isSaving}
            >
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
