import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase';
import { fetchBooksWithCorrectClient } from '@/utils/supabase-admin';
import { Button } from '@/components/ui/button';
import { BookExportImport } from './BookExportImport';
import { CollaborationPanel } from '@/components/collaboration/CollaborationPanel';
import { CollaborationErrorBoundary } from '@/components/collaboration/CollaborationErrorBoundary';
import { PresenceIndicator } from '@/components/collaboration/PresenceIndicator';
import { EditingLockIndicator } from '@/components/collaboration/EditingLockIndicator';
import { usePresence } from '@/hooks/usePresence';
import { useEditingSessions } from '@/hooks/useEditingSessions';
import { useCollaboration } from '@/hooks/useCollaboration';
import { formatUserName } from '@/utils/collaboration';
import { 
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { 
  Save, Type, Square, Circle, Image as ImageIcon, Minus, AlignLeft,
  Menu, PanelLeftClose, PanelLeftOpen, Plus, Trash2, Undo2, Redo2,
  ZoomIn, ZoomOut, Grid3X3, SkipForward, SkipBack,
  Triangle, Star, Heart, Video,
  Volume2,
  ArrowRight,
  ChevronDown,
  Maximize,
  Sigma,
  BarChart,
  LineChart,
  PieChart,
  HelpCircle,
  ListChecks,
  Edit3,
  CheckSquare,
  Target,
  Table,
  X,
  History,
  Users,
  // Icon imports
  Home, User, Settings, Search, Mail, Phone, Calendar, Clock, Map, Camera, Music,
  File, Folder, Download, Upload, Copy, Check, Bell, AlertCircle, Info,
  Shield, Lock, Eye, ThumbsUp, MessageCircle, Share, Link, Zap, Award, Gift,
  Briefcase, Flag, Sun, Moon, Lightbulb, Battery, Wifi, Globe, Database, Code,
  Monitor, Smartphone, PlayCircle, Volume, Palette, Bookmark, Filter, RefreshCw
} from 'lucide-react';
import { uploadMedia } from '@/utils/mediaUpload';
import { DraggableTool } from './DraggableTool';
import { CanvasElementComponent } from './CanvasElement';
import { CanvasDropZone } from './CanvasDropZone';
import { PropertiesPanel } from './PropertiesPanel';
import { Book, CanvasElement as CanvasElementType, CanvasSettings, BookVersion } from './types';
import { getDefaultWidth, getDefaultHeight, getDefaultContent, getEnhancedPropertiesForTool, createDefaultTableCells } from './utils';
import { TableDialog } from './TableDialog';
import { ChartElement } from './ChartElement';
import { MathElement } from './MathElement';
import { TableElement } from './TableElement';
import { AssignmentElement } from './AssignmentElement';
import { renderIcon } from './IconRenderer';
import { MediaUploadProgress } from './MediaUploadProgress';
import { MediaMetadataEditor } from './MediaMetadataEditor';
import { VersionHistoryPanel } from './VersionHistoryPanel';
import { Input } from '@/components/ui/input';

// Enhanced tool definitions with more elements and categories
const TOOLS = [
  // Content tools
  { id: 'text', name: 'Текст', label: 'Текст', icon: Type, category: 'content', needsFileUpload: false, hotkey: 'T' },
  { id: 'paragraph', name: 'Абзац', label: 'Абзац', icon: AlignLeft, category: 'content', needsFileUpload: false, hotkey: 'P' },
  
  // Math tools
  { id: 'math', name: 'Формула', label: 'Формула', icon: Sigma, category: 'math', needsFileUpload: false, hotkey: 'M' },
  
  // Media tools
  { id: 'image', name: 'Изображение', label: 'Изображение', icon: ImageIcon, category: 'media', needsFileUpload: true, accepts: 'image/*', hotkey: 'I' },
  { id: 'video', name: 'Видео', label: 'Видео', icon: Video, category: 'media', needsFileUpload: true, accepts: 'video/*', hotkey: 'V' },
  { id: 'audio', name: 'Аудио', label: 'Аудио', icon: Volume2, category: 'media', needsFileUpload: true, accepts: 'audio/*', hotkey: 'U' },
  
  // Shape tools
  { id: 'rectangle', name: 'Прямоугольник', label: 'Прямоугольник', icon: Square, category: 'shapes', needsFileUpload: false, hotkey: 'R' },
  { id: 'circle', name: 'Круг', label: 'Круг', icon: Circle, category: 'shapes', needsFileUpload: false, hotkey: 'C' },
  { id: 'triangle', name: 'Треугольник', label: 'Треугольник', icon: Triangle, category: 'shapes', needsFileUpload: false, hotkey: '' },
  { id: 'star', name: 'Звезда', label: 'Звезда', icon: Star, category: 'shapes', needsFileUpload: false, hotkey: '' },
  { id: 'heart', name: 'Сердце', label: 'Сердце', icon: Heart, category: 'shapes', needsFileUpload: false, hotkey: '' },
  
  // Drawing tools
  { id: 'line', name: 'Линия', label: 'Линия', icon: Minus, category: 'drawing', needsFileUpload: false, hotkey: 'L' },
  { id: 'arrow', name: 'Стрелка', label: 'Стрелка', icon: ArrowRight, category: 'drawing', needsFileUpload: false, hotkey: 'A' },
  
  // Chart tools
  { id: 'bar-chart', name: 'Столбчатая диаграмма', label: 'Столбчатая', icon: BarChart, category: 'charts', needsFileUpload: false, hotkey: 'B' },
  { id: 'line-chart', name: 'Линейная диаграмма', label: 'Линейная', icon: LineChart, category: 'charts', needsFileUpload: false, hotkey: 'N' },
  { id: 'pie-chart', name: 'Круговая диаграмма', label: 'Круговая', icon: PieChart, category: 'charts', needsFileUpload: false, hotkey: 'G' },
  
  // Table tools
  { id: 'table', name: 'Таблица', label: 'Таблица', icon: Table, category: 'tables', needsFileUpload: false, hotkey: 'D' },
  
  // Assignment tools
  { id: 'multiple-choice', name: 'Множественный выбор', label: 'Выбор ответа', icon: ListChecks, category: 'assignments', needsFileUpload: false, hotkey: '' },
  { id: 'open-question', name: 'Открытый вопрос', label: 'Открытый вопрос', icon: Edit3, category: 'assignments', needsFileUpload: false, hotkey: '' },
  { id: 'true-false', name: 'Верно/Неверно', label: 'Верно/Неверно', icon: CheckSquare, category: 'assignments', needsFileUpload: false, hotkey: '' },
  { id: 'matching', name: 'Сопоставление', label: 'Сопоставление', icon: Target, category: 'assignments', needsFileUpload: false, hotkey: '' },
  { id: 'quiz', name: 'Викторина', label: 'Викторина', icon: HelpCircle, category: 'assignments', needsFileUpload: false, hotkey: '' },

  // Icon tools
  { id: 'icon-home', name: 'Иконка Дом', label: 'Дом', icon: Home, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-user', name: 'Иконка Пользователь', label: 'Пользователь', icon: User, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-settings', name: 'Иконка Настройки', label: 'Настройки', icon: Settings, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-search', name: 'Иконка Поиск', label: 'Поиск', icon: Search, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-mail', name: 'Иконка Почта', label: 'Почта', icon: Mail, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-phone', name: 'Иконка Телефон', label: 'Телефон', icon: Phone, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-calendar', name: 'Иконка Календарь', label: 'Календарь', icon: Calendar, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-clock', name: 'Иконка Часы', label: 'Часы', icon: Clock, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-map', name: 'Иконка Карта', label: 'Карта', icon: Map, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-camera', name: 'Иконка Камера', label: 'Камера', icon: Camera, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-music', name: 'Иконка Музыка', label: 'Музыка', icon: Music, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-file', name: 'Иконка Файл', label: 'Файл', icon: File, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-folder', name: 'Иконка Папка', label: 'Папка', icon: Folder, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-download', name: 'Иконка Скачать', label: 'Скачать', icon: Download, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-upload', name: 'Иконка Загрузить', label: 'Загрузить', icon: Upload, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-copy', name: 'Иконка Копировать', label: 'Копировать', icon: Copy, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-check', name: 'Иконка Галочка', label: 'Галочка', icon: Check, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-bell', name: 'Иконка Уведомления', label: 'Звонок', icon: Bell, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-alert', name: 'Иконка Предупреждение', label: 'Внимание', icon: AlertCircle, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-info', name: 'Иконка Информация', label: 'Инфо', icon: Info, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-shield', name: 'Иконка Защита', label: 'Щит', icon: Shield, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-lock', name: 'Иконка Замок', label: 'Замок', icon: Lock, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-eye', name: 'Иконка Глаз', label: 'Глаз', icon: Eye, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-thumbs-up', name: 'Иконка Лайк', label: 'Лайк', icon: ThumbsUp, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-message', name: 'Иконка Сообщение', label: 'Сообщение', icon: MessageCircle, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-share', name: 'Иконка Поделиться', label: 'Поделиться', icon: Share, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-link', name: 'Иконка Ссылка', label: 'Ссылка', icon: Link, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-zap', name: 'Иконка Молния', label: 'Молния', icon: Zap, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-award', name: 'Иконка Награда', label: 'Награда', icon: Award, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-gift', name: 'Иконка Подарок', label: 'Подарок', icon: Gift, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-briefcase', name: 'Иконка Портфель', label: 'Портфель', icon: Briefcase, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-flag', name: 'Иконка Флаг', label: 'Флаг', icon: Flag, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-sun', name: 'Иконка Солнце', label: 'Солнце', icon: Sun, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-moon', name: 'Иконка Луна', label: 'Луна', icon: Moon, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-lightbulb', name: 'Иконка Лампочка', label: 'Лампочка', icon: Lightbulb, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-battery', name: 'Иконка Батарея', label: 'Батарея', icon: Battery, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-wifi', name: 'Иконка WiFi', label: 'WiFi', icon: Wifi, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-globe', name: 'Иконка Глобус', label: 'Глобус', icon: Globe, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-database', name: 'Иконка База данных', label: 'БД', icon: Database, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-code', name: 'Иконка Код', label: 'Код', icon: Code, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-monitor', name: 'Иконка Монитор', label: 'Монитор', icon: Monitor, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-smartphone', name: 'Иконка Смартфон', label: 'Телефон', icon: Smartphone, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-play', name: 'Иконка Воспроизведение', label: 'Играть', icon: PlayCircle, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-volume', name: 'Иконка Громкость', label: 'Громкость', icon: Volume, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-palette', name: 'Иконка Палитра', label: 'Палитра', icon: Palette, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-bookmark', name: 'Иконка Закладка', label: 'Закладка', icon: Bookmark, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-filter', name: 'Иконка Фильтр', label: 'Фильтр', icon: Filter, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-refresh', name: 'Иконка Обновить', label: 'Обновить', icon: RefreshCw, category: 'icons', needsFileUpload: false, hotkey: '' },
] as const;

const TOOL_CATEGORIES = [
  { id: 'content', label: 'Текст', icon: Type },
  { id: 'math', label: 'Формула', icon: Sigma },
  { id: 'shapes', label: 'Фигуры', icon: Square },
  { id: 'media', label: 'Медиа', icon: ImageIcon },
  { id: 'drawing', label: 'Рисование', icon: Minus },
  { id: 'charts', label: 'Диаграммы', icon: BarChart },
  { id: 'tables', label: 'Таблицы', icon: Table },
  { id: 'assignments', label: 'Задания', icon: HelpCircle },
  { id: 'icons', label: 'Иконки', icon: Star },
];

export function BookEditor() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { userProfile } = useAuth();
  
  // Get the book base URL from params
  const bookBaseUrl = params?.base_url as string;
  
  // State
  const [book, setBook] = useState<Book | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [elements, setElements] = useState<CanvasElementType[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [activeElement, setActiveElement] = useState<CanvasElementType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [history, setHistory] = useState<CanvasElementType[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [bookVersions, setBookVersions] = useState<BookVersion[]>([]);
  const [isVersionHistoryPanelOpen, setIsVersionHistoryPanelOpen] = useState(false);
  const [_uploadedMediaUrls, _setUploadedMediaUrls] = useState<Record<string, string>>({});
  const [_changeLog, _setChangeLog] = useState<Array<{
    id: string;
    timestamp: Date;
    action: string;
    details: string;
    user: string;
  }>>([]);
  
  // Media upload state
  const [uploadProgress, setUploadProgress] = useState({
    isVisible: false,
    progress: 0,
    fileName: '',
    error: ''
  });

  // Media metadata editor state
  const [metadataEditor, setMetadataEditor] = useState({
    isOpen: false,
    element: null as CanvasElementType | null
  });

  // Media upload handlers
  const handleUploadStart = useCallback(() => {
    setUploadProgress(prev => ({
      ...prev,
      isVisible: true,
      progress: 0,
      error: ''
    }));
  }, []);

  const handleUploadProgress = useCallback((progress: number, fileName: string) => {
    setUploadProgress(prev => ({
      ...prev,
      progress,
      fileName
    }));
  }, []);

  const handleUploadError = useCallback((error: string) => {
    setUploadProgress(prev => ({
      ...prev,
      error
    }));
  }, []);

  const handleUploadComplete = useCallback(() => {
    // Keep the progress visible for a moment to show completion
    setTimeout(() => {
      setUploadProgress(prev => ({
        ...prev,
        isVisible: false
      }));
    }, 2000);
  }, []);

  const handleUploadDismiss = useCallback(() => {
    setUploadProgress(prev => ({
      ...prev,
      isVisible: false,
      error: ''
    }));
  }, []);

  // Metadata editor handlers
  const handleOpenMetadataEditor = useCallback((element: CanvasElementType) => {
    if (element.type === 'image') {
      setMetadataEditor({
        isOpen: true,
        element
      });
    }
  }, []);

  const handleCloseMetadataEditor = useCallback(() => {
    setMetadataEditor({
      isOpen: false,
      element: null
    });
  }, []);

  const handleUpdateElementMetadata = useCallback((updates: Partial<CanvasElementType>) => {
    if (!metadataEditor.element) return;
    
    setElements(prev => 
      prev.map(el => 
        el.id === metadataEditor.element!.id 
          ? { ...el, ...updates }
          : el
      )
    );
  }, [metadataEditor.element]);
  
  // Table Dialog State
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [pendingTablePosition, setPendingTablePosition] = useState<{x: number, y: number} | null>(null);
  
  // UI State
  const [mainSidebarHidden, setMainSidebarHidden] = useState(searchParams?.get('hideSidebar') === 'true');
  const [toolsPanelOpen, setToolsPanelOpen] = useState(true);
  const [propertiesPanelOpen, setPropertiesPanelOpen] = useState(true);
  const [collaborationPanelOpen, setCollaborationPanelOpen] = useState(false);
  const [_pagesPanelOpen, _setPagesPanelOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState('content');

  // Collaboration hooks
  const {
    currentUserRole,
    currentUserPermissions
  } = useCollaboration({
    bookId: book?.id || '',
    autoLoad: !!book?.id
  });

  const { 
    presence, 
    updatePresence 
  } = usePresence({ 
    bookId: book?.id || '', 
    enabled: !!book?.id 
  });

  const {
    editingSessions,
    isSessionLocked,
    startEditingSession,
    endEditingSession,
    updateSessionActivity
  } = useEditingSessions({
    bookId: book?.id || '',
    enabled: !!book?.id
  });

  // Canvas settings
  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>({
    zoom: 50,
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
    smartGuides: true,
    snapToElements: true,
    snapDistance: 5,
    renderQuality: 'normal',
    enableAnimations: true,
    maxUndoSteps: 50,
    autoSave: false,
    autoSaveInterval: 30,
  });

  // Zoom input state
  const [zoomInput, setZoomInput] = useState('50');

  // Sync zoom input with canvas settings
  useEffect(() => {
    setZoomInput(canvasSettings.zoom.toString());
  }, [canvasSettings.zoom]);

  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [currentResize, setCurrentResize] = useState<{
    elementId: string;
    direction: string;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startElementX: number;
    startElementY: number;
  } | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Generate ID function  
  const generateId = useCallback(() => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }, []);

  // Get smart position for new elements
  const _getSmartPosition = useCallback(() => {
    // Default position
    let x = 100;
    let y = 100;
    
    // Try to place new elements in a smart way to avoid overlap
    const currentPageElements = elements.filter(el => el.page === canvasSettings.currentPage);
    
    if (currentPageElements.length > 0) {
      // Find a position that doesn't overlap with existing elements
      const positions = currentPageElements.map(el => ({ x: el.x, y: el.y, width: el.width, height: el.height }));
      
      // Simple algorithm: try to place elements in a grid pattern
      const gridSize = 120; // Space between elements
      let foundPosition = false;
      
      for (let row = 0; row < 10 && !foundPosition; row++) {
        for (let col = 0; col < 10 && !foundPosition; col++) {
          const testX = 50 + col * gridSize;
          const testY = 50 + row * gridSize;
          
          // Check if this position overlaps with any existing element
          const overlaps = positions.some(pos => 
            testX < pos.x + pos.width &&
            testX + 100 > pos.x &&
            testY < pos.y + pos.height &&
            testY + 50 > pos.y
          );
          
          if (!overlaps) {
            x = testX;
            y = testY;
            foundPosition = true;
          }
        }
      }
    }
    
    return { x, y };
  }, [elements, canvasSettings.currentPage]);

  // Add to history with functional state updates to avoid stale closures
  const addToHistory = useCallback((newElements: CanvasElementType[]) => {
    setHistory(prev => {
      const newHistory = [...prev];
      
      // Remove any states after current index if we're not at the end
      if (historyIndex < newHistory.length - 1) {
        newHistory.splice(historyIndex + 1);
      }
      
      // Add new state
      newHistory.push([...newElements]);
      
      // Keep only last 50 states
      return newHistory.slice(-50);
    });
    
    setHistoryIndex(prev => {
      const newIndex = prev + 1;
      return Math.min(newIndex, 49);
    });
  }, [historyIndex]);

  // Undo/Redo functionality
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
    }
  }, [history, historyIndex]);

  // Automatically end editing when selection changes
  useEffect(() => {
    if (selectedElementId !== editingElementId && editingElementId) {
      setEditingElementId(null);
    }
  }, [selectedElementId, editingElementId]);

  // Computed values
  const currentPageElements = elements.filter(el => el.page === canvasSettings.currentPage);
  const selectedElement = selectedElementId ? elements.find(el => el.id === selectedElementId) || null : null;

  // Load book data - modified to also load edit history
  useEffect(() => {
    const loadBook = async () => {
      if (!params?.base_url) return;
      
      try {
        setIsLoading(true);
        const supabase = createClient();
        
        // Check if the base_url looks like a UUID (book ID) or an actual base_url
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.base_url);
        
        let bookData = null;
        
        if (isUUID) {
          // For UUID (book ID), use fetchBooksWithCorrectClient to handle collaborative access
          const { data: booksData, error } = await fetchBooksWithCorrectClient(
            userProfile?.role,
            userProfile?.id,
            supabase
          );
          
          if (error) throw error;
          
          // Find the specific book by ID
          bookData = booksData?.find(book => book.id === params.base_url);
          if (!bookData) {
            throw new Error('Book not found or you do not have access to this book');
          }
        } else {
          // For base_url, use direct query (original behavior)
          const { data, error } = await supabase
            .from('books')
            .select('*')
            .eq('base_url', params.base_url)
            .single();
          
          if (error) throw error;
          bookData = data;
        }
        
        setBook(bookData);
        
        // Load canvas data
        if (bookData.canvas_elements) {
          try {
            const parsedElements = JSON.parse(bookData.canvas_elements);
            setElements(parsedElements);
            
            // Initialize history directly without using addToHistory
            setHistory([parsedElements]);
            setHistoryIndex(0);
          } catch (e) {
            console.error('Error parsing canvas elements:', e);
            setElements([]);
            setHistory([[]]);
            setHistoryIndex(0);
          }
        } else {
          // No elements, initialize empty
          setElements([]);
          setHistory([[]]);
          setHistoryIndex(0);
        }
        
        if (bookData.canvas_settings) {
          try {
            const parsedSettings = JSON.parse(bookData.canvas_settings);
            // Ensure zoom defaults to 50 if not set
            const settingsWithDefaults = {
              ...parsedSettings,
              zoom: parsedSettings.zoom !== undefined ? parsedSettings.zoom : 50
            };
            setCanvasSettings(prev => ({ ...prev, ...settingsWithDefaults }));
          } catch (e) {
            console.error('Error parsing canvas settings:', e);
          }
        }

        // Load versions from localStorage
        try {
          const storedVersions = localStorage.getItem(`book-versions-${bookData.id}`);
          if (storedVersions) {
            const parsedVersions = JSON.parse(storedVersions);
            setBookVersions(Array.isArray(parsedVersions) ? parsedVersions : []);
          } else {
            setBookVersions([]);
          }
        } catch (e) {
          console.error('Error loading versions from localStorage:', e);
          setBookVersions([]);
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading book:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
          bookUrl: params?.base_url,
          errorType: typeof error,
          errorKeys: error && typeof error === 'object' ? Object.keys(error) : 'No keys'
        });
        // Initialize empty state on error
        setElements([]);
        setHistory([[]]);
        setHistoryIndex(0);
        
        // Try to load versions from localStorage if we have a book ID from the URL
        if (params?.base_url) {
          try {
            const client = createClient();
            const { data } = await client
              .from('books')
              .select('id')
              .eq('base_url', params.base_url)
              .single();
              
            if (data?.id) {
              const storedVersions = localStorage.getItem(`book-versions-${data.id}`);
              if (storedVersions) {
                const parsedVersions = JSON.parse(storedVersions);
                setBookVersions(Array.isArray(parsedVersions) ? parsedVersions : []);
                return;
              }
            }
          } catch (e) {
            console.error('Error getting book ID for versions:', e);
          }
        }
        
        // Default to empty versions if we couldn't load from localStorage
        setBookVersions([]);
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBook();
  }, [params?.base_url]); // Removed addToHistory dependency

  // Title editing functions
  const handleStartEditingTitle = useCallback(() => {
    if (book?.title) {
      setTempTitle(book.title);
      setIsEditingTitle(true);
    }
  }, [book?.title]);

  const handleSaveTitle = useCallback(async () => {
    if (!book || !tempTitle.trim()) return;
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('books')
        .update({
          title: tempTitle.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', book.id);
      
      if (error) throw error;
      
      // Update local book state
      setBook(prev => prev ? { ...prev, title: tempTitle.trim() } : null);
      setIsEditingTitle(false);
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50';
      notification.textContent = 'Название книги сохранено';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 3000);
    } catch (error) {
      console.error('Error saving book title:', error instanceof Error ? error.message : error);
      
      // Show error notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50';
      notification.textContent = 'Ошибка при сохранении названия';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 3000);
    }
  }, [book, tempTitle]);

  const handleCancelEditingTitle = useCallback(() => {
    setIsEditingTitle(false);
    setTempTitle('');
  }, []);

  const handleTitleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEditingTitle();
    }
  }, [handleSaveTitle, handleCancelEditingTitle]);

  // Add event listener for tool clicks
  useEffect(() => {
    const handleAddToolToCanvas = (event: CustomEvent) => {
      // Skip if not initialized
      if (!isInitialized) {
        console.log('Skipping tool add - not initialized');
        return;
      }
      
      const { toolId, position, mediaUrl } = event.detail;
      console.log('Add tool to canvas:', toolId, position, mediaUrl);
      
      // Special handling for table tool
      if (toolId === 'table') {
        // Store the position and show the table dialog
        setPendingTablePosition({ x: position.x, y: position.y });
        setShowTableDialog(true);
        return;
      }
      
      // Determine the correct element type based on tool category
      const getElementType = (toolId: string): CanvasElementType['type'] => {
        // Media tools - use their exact IDs as types
        if (['image', 'video', 'audio'].includes(toolId)) {
          return toolId as CanvasElementType['type'];
        }
        // Check if it's a shape tool
        if (['rectangle', 'circle', 'triangle', 'star', 'heart'].includes(toolId)) {
          return 'shape';
        }
        // Check if it's a chart tool
        if (['bar-chart', 'line-chart', 'pie-chart'].includes(toolId)) {
          return 'chart';
        }
        // Check if it's an assignment tool
        if (['multiple-choice', 'open-question', 'true-false', 'matching', 'quiz'].includes(toolId)) {
          return 'assignment';
        }
        // Check if it's an icon tool
        if (toolId.startsWith('icon-')) {
          return 'icon';
        }
        // For other tools, use their ID as type
        return toolId as CanvasElementType['type'];
      };
      
      // Get default dimensions for the tool
      const width = getDefaultWidth(toolId);
      const height = getDefaultHeight(toolId);
      
      // Get canvas dimensions to constrain elements within boundaries
      const canvasWidth = canvasSettings.canvasWidth * 3.7795; // Convert mm to px
      const canvasHeight = canvasSettings.canvasHeight * 3.7795; // Convert mm to px
      
      // Constrain position to stay within canvas boundaries
      const x = Math.min(Math.max(0, position.x), canvasWidth - width);
      const y = Math.min(Math.max(0, position.y), canvasHeight - height);
      
      // Create the new element
      const elementType = getElementType(toolId);
      let elementProperties = getEnhancedPropertiesForTool(toolId);
      
      // If mediaUrl is provided, update the appropriate property
      if (mediaUrl) {
        if (toolId === 'image') {
          elementProperties = { ...elementProperties, imageUrl: mediaUrl };
        } else if (toolId === 'video') {
          elementProperties = { ...elementProperties, videoUrl: mediaUrl };
        } else if (toolId === 'audio') {
          elementProperties = { ...elementProperties, audioUrl: mediaUrl };
        }
      }
      
      console.log('=== HANDLE ADD TOOL DEBUG ===');
      console.log('Tool ID:', toolId);
      console.log('Element type:', elementType);
      console.log('Element properties from getEnhancedPropertiesForTool:', elementProperties);
      console.log('Media URL:', mediaUrl);
      console.log('========================');
      
      // Create the new element
      const newElement: CanvasElementType = {
        id: generateId(),
        type: elementType,
        x,
        y,
        width,
        height,
        content: getDefaultContent(toolId),
        page: canvasSettings.currentPage,
        zIndex: Math.max(0, ...elements.map(el => el.zIndex)) + 1,
        rotation: 0,
        opacity: 1,
        properties: elementProperties,
      };
      
      // Add the new element to the canvas
      setElements(prev => {
        const newElements = [...prev, newElement];
        
        // Add to history with functional updates
        setHistory(historyPrev => {
          const newHistory = [...historyPrev];
          
          // Remove any states after current index if we're not at the end
          setHistoryIndex(indexPrev => {
            if (indexPrev < newHistory.length - 1) {
              newHistory.splice(indexPrev + 1);
            }
            
            // Add new state
            newHistory.push([...newElements]);
            
            // Keep only last 50 states
            const finalHistory = newHistory.slice(-50);
            setHistory(finalHistory);
            
            return Math.min(indexPrev + 1, 49);
          });
          
          return newHistory.slice(-50);
        });
        
        return newElements;
      });
      
      // Select the new element
      setSelectedElementId(newElement.id);
    };
    
    window.addEventListener('addToolToCanvas', handleAddToolToCanvas as EventListener);
    
    return () => {
      window.removeEventListener('addToolToCanvas', handleAddToolToCanvas as EventListener);
    };
  }, [elements, canvasSettings, generateId, isInitialized]);

  // Save functionality - modified to handle edit history
  const handleSave = useCallback(async () => {
    if (!book) return;
    
    try {
      // Show loading notification
      const loadingNotification = document.createElement('div');
      loadingNotification.id = 'save-loading';
      loadingNotification.className = 'fixed top-4 right-4 bg-blue-500 text-white p-3 rounded-lg shadow-lg z-50';
      loadingNotification.textContent = 'Сохранение...';
      document.body.appendChild(loadingNotification);

      // Basic update data
      const updateData = {
        canvas_elements: JSON.stringify(elements),
        canvas_settings: JSON.stringify(canvasSettings),
        updated_at: new Date().toISOString(),
        // Set Draft status if undefined
        ...(book.status === undefined && { status: 'Draft' })
      };

      // First save the book without requesting edit_history to avoid any potential issues
      const supabase = createClient();
      const { error: saveError } = await supabase
        .from('books')
        .update(updateData)
        .eq('id', book.id);
      
      // Remove loading notification
      const existingLoading = document.getElementById('save-loading');
      if (existingLoading) {
        document.body.removeChild(existingLoading);
      }
      
      if (saveError) throw saveError;
      
      // Get updated edit history in a separate request to avoid transaction issues
      try {
        const { data: historyData, error: historyError } = await supabase
          .from('books')
          .select('edit_history')
          .eq('id', book.id)
          .single();
        
        if (!historyError && historyData && historyData.edit_history) {
          setEditHistory(historyData.edit_history);
        }
      } catch (historyError) {
        // Log but don't throw - this is non-critical
        console.warn('Error fetching edit history:', historyError);
      }
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50';
      notification.textContent = 'Книга успешно сохранена';
      document.body.appendChild(notification);
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    } catch (error) {
      console.error('Error saving book:', error instanceof Error ? error.message : error);
      
      // Show error notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50';
      notification.textContent = `Ошибка при сохранении книги: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`;
      document.body.appendChild(notification);
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    }
  }, [book, elements, canvasSettings]);

  // Auto-save functionality
  useEffect(() => {
    if (!book || !canvasSettings.autoSave || elements.length === 0) return;
    
    const autoSaveTimer = setInterval(() => {
      handleSave();
    }, canvasSettings.autoSaveInterval * 1000);
    
    return () => clearInterval(autoSaveTimer);
  }, [book, elements, canvasSettings, handleSave]);

  // Add page functionality
  const handleAddPage = useCallback(() => {
    setCanvasSettings(prev => ({
      ...prev,
      totalPages: prev.totalPages + 1,
      currentPage: prev.totalPages + 1,
    }));
  }, []);

  // Delete page functionality
  const handleDeletePage = useCallback(() => {
    if (canvasSettings.totalPages <= 1) return;
    
    // Skip if not initialized
    if (!isInitialized) {
      console.log('Skipping page delete - not initialized');
      return;
    }
    
    // Delete elements from current page
    const newElements = elements.filter(el => el.page !== canvasSettings.currentPage);
    
    // Adjust page numbers for elements on pages after current
    const adjustedElements = newElements.map(el => {
      if (el.page > canvasSettings.currentPage) {
        return { ...el, page: el.page - 1 };
      }
      return el;
    });
    
    setElements(adjustedElements);
    
    // Add to history with functional updates
    setHistory(historyPrev => {
      const newHistory = [...historyPrev];
      
      // Remove any states after current index if we're not at the end
      setHistoryIndex(indexPrev => {
        if (indexPrev < newHistory.length - 1) {
          newHistory.splice(indexPrev + 1);
        }
        
        // Add new state
        newHistory.push([...adjustedElements]);
        
        // Keep only last 50 states
        const finalHistory = newHistory.slice(-50);
        setHistory(finalHistory);
        
        return Math.min(indexPrev + 1, 49);
      });
      
      return newHistory.slice(-50);
    });
    
    // Update canvas settings
    const newCurrentPage = canvasSettings.currentPage > 1 ? canvasSettings.currentPage - 1 : 1;
    setCanvasSettings(prev => ({
      ...prev,
      totalPages: prev.totalPages - 1,
      currentPage: newCurrentPage,
    }));
  }, [elements, canvasSettings, isInitialized]);

  // Update element
  const updateElement = useCallback((elementId: string, updates: Partial<CanvasElementType>) => {
    // Skip if not initialized
    if (!isInitialized) {
      console.log('Skipping element update - not initialized');
      return;
    }
    
    setElements(prev => {
      const newElements = prev.map(el => {
        if (el.id === elementId) {
          const updatedElement = { ...el, ...updates };
          return updatedElement;
        }
        return el;
      });
      
      // Add to history with functional updates
      setHistory(historyPrev => {
        const newHistory = [...historyPrev];
        
        // Remove any states after current index if we're not at the end
        setHistoryIndex(indexPrev => {
          if (indexPrev < newHistory.length - 1) {
            newHistory.splice(indexPrev + 1);
          }
          
          // Add new state
          newHistory.push([...newElements]);
          
          // Keep only last 50 states
          const finalHistory = newHistory.slice(-50);
          setHistory(finalHistory);
          
          return Math.min(indexPrev + 1, 49);
        });
        
        return newHistory.slice(-50);
      });
      
      return newElements;
    });
  }, [isInitialized]);

  // Delete element
  const deleteElement = useCallback((id: string) => {
    // Skip if not initialized
    if (!isInitialized) {
      console.log('Skipping element delete - not initialized');
      return;
    }
    
    setElements(prev => {
      const newElements = prev.filter(el => el.id !== id);
      
      // Add to history with functional updates
      setHistory(historyPrev => {
        const newHistory = [...historyPrev];
        
        // Remove any states after current index if we're not at the end
        setHistoryIndex(indexPrev => {
          if (indexPrev < newHistory.length - 1) {
            newHistory.splice(indexPrev + 1);
          }
          
          // Add new state
          newHistory.push([...newElements]);
          
          // Keep only last 50 states
          const finalHistory = newHistory.slice(-50);
          setHistory(finalHistory);
          
          return Math.min(indexPrev + 1, 49);
        });
        
        return newHistory.slice(-50);
      });
      
      return newElements;
    });
    setSelectedElementId(null);
  }, [isInitialized]);

  // Duplicate element
  const _duplicateElement = useCallback((id: string) => {
    const element = elements.find(el => el.id === id);
    if (!element) return;
    
    const newElement = {
      ...element,
      id: generateId(),
      x: element.x + 20,
      y: element.y + 20,
    };
    
    setElements(prev => {
      const newElements = [...prev, newElement];
      addToHistory(newElements);
      return newElements;
    });
    
    setSelectedElementId(newElement.id);
  }, [elements, addToHistory, generateId]);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;
    
    // Check if this is a tool or an existing element
    if (activeId.startsWith('tool-')) {
      // This is a tool being dragged
      const toolType = activeId.replace('tool-', '');
      const matchingTool = TOOLS.find(t => t.id === toolType);
      
      if (matchingTool) {
        console.log('Tool drag started:', matchingTool.name);
        // We don't need to set activeElement for tools
      }
    } else {
      // This is an existing element being dragged
      const activeElementData = elements.find(el => el.id === activeId);
      if (activeElementData) {
        setActiveElement(activeElementData);
      }
    }
  }, [elements]);

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveElement(null);
    
    // If no drop occurred, do nothing
    if (!event.over || !event.active.data.current) return;
    
    // Get data from the dragged item
    const { tool, element: existingElement } = event.active.data.current as { 
      tool?: typeof TOOLS[number]; 
      element?: CanvasElementType;
    };
    
    if (existingElement) {
      // Handle moving existing elements
      const updatedElements = elements.map(el => {
        if (el.id === existingElement.id) {
          // Calculate new position based on delta
          const delta = {
            x: event.delta.x / (canvasSettings.zoom / 100),
            y: event.delta.y / (canvasSettings.zoom / 100),
          };
          
          let newX = el.x + delta.x;
          let newY = el.y + delta.y;
          
          // Get canvas dimensions to constrain elements within boundaries
          const canvasElement = document.querySelector('[data-canvas="true"]') as HTMLElement;
          let canvasWidth = canvasSettings.canvasWidth * 3.7795; // Default fallback
          let canvasHeight = canvasSettings.canvasHeight * 3.7795; // Default fallback
          
          if (canvasElement) {
          const canvasRect = canvasElement.getBoundingClientRect();
          const zoomFactor = canvasSettings.zoom / 100;
            canvasWidth = canvasRect.width / zoomFactor;
            canvasHeight = canvasRect.height / zoomFactor;
          }
          
          // Apply boundary constraints
          newX = Math.max(0, Math.min(newX, canvasWidth - el.width));
          newY = Math.max(0, Math.min(newY, canvasHeight - el.height));
          
          // Snap to grid if enabled
          if (canvasSettings.snapToGrid) {
            newX = Math.round(newX / canvasSettings.gridSize) * canvasSettings.gridSize;
            newY = Math.round(newY / canvasSettings.gridSize) * canvasSettings.gridSize;
          }
          
          return { ...el, x: newX, y: newY };
        }
        return el;
      });
      
      setElements(updatedElements);
      addToHistory(updatedElements);
            return;
          }
          
    if (!tool) return;
    
    // Create a new element based on the tool type
    const position = _getSmartPosition();
    let type: CanvasElementType['type'] = 'text'; // Default type
    let properties: any = {};
    
    // Convert tool ID to element type if needed
    if (tool.id === 'text' || tool.id === 'paragraph') {
      type = tool.id as CanvasElementType['type'];
      properties = getEnhancedPropertiesForTool(tool.id);
    } else if (tool.id === 'rectangle' || tool.id === 'circle' || tool.id === 'triangle' || tool.id === 'star' || tool.id === 'heart') {
      type = 'shape';
      properties = getEnhancedPropertiesForTool(tool.id);
    } else if (tool.id === 'image' || tool.id === 'video' || tool.id === 'audio') {
      type = tool.id as CanvasElementType['type'];
    } else if (tool.id === 'line' || tool.id === 'arrow') {
      type = tool.id as CanvasElementType['type'];
    } else if (tool.id === 'math') {
      type = 'math';
    } else if (tool.id === 'table') {
      type = 'table';
    } else if (tool.id === 'bar-chart' || tool.id === 'line-chart' || tool.id === 'pie-chart') {
      type = 'chart';
      
      // Set chart type based on tool
      if (tool.id === 'bar-chart') {
        properties = { ...properties, chartType: 'bar' };
        console.log('Creating bar chart with properties:', properties);
      } else if (tool.id === 'line-chart') {
        properties = { ...properties, chartType: 'line' };
        console.log('Creating line chart with properties:', properties);
      } else if (tool.id === 'pie-chart') {
        properties = { ...properties, chartType: 'pie' };
        console.log('Creating pie chart with properties:', properties);
      }
    } else if (tool.id === 'multiple-choice' || tool.id === 'open-question' || tool.id === 'true-false' || tool.id === 'matching' || tool.id === 'quiz') {
      type = 'assignment';
      
      // Set assignment type and default data
      if (tool.id === 'multiple-choice') {
        properties = { 
          ...properties, 
          assignmentType: 'multiple-choice',
          assignmentData: {
            question: 'Введите ваш вопрос',
            instructions: 'Выберите один правильный ответ',
            options: [
              { id: '1', text: 'Вариант 1', isCorrect: true },
              { id: '2', text: 'Вариант 2', isCorrect: false },
              { id: '3', text: 'Вариант 3', isCorrect: false },
              { id: '4', text: 'Вариант 4', isCorrect: false }
            ],
            points: 1,
            shuffleOptions: false,
            showCorrectAnswer: true,
            difficultyLevel: 3
          }
        };
      } else if (tool.id === 'open-question') {
        properties = { 
          ...properties, 
          assignmentType: 'open-question',
          assignmentData: {
            question: 'Введите ваш вопрос',
            instructions: 'Дайте развернутый ответ',
            expectedAnswer: 'Пример ожидаемого ответа',
            answerLength: 'medium',
            points: 2,
            showCorrectAnswer: true,
            difficultyLevel: 3
          }
        };
      } else if (tool.id === 'true-false') {
        properties = { 
          ...properties, 
          assignmentType: 'true-false',
          assignmentData: {
            question: 'Введите утверждение',
            instructions: 'Определите, верно ли данное утверждение',
            correctAnswer: true,
            points: 1,
            showCorrectAnswer: true,
            difficultyLevel: 3
          }
        };
      } else if (tool.id === 'matching') {
        properties = { 
          ...properties, 
          assignmentType: 'matching',
          assignmentData: {
            question: 'Сопоставьте элементы',
            instructions: 'Соедините элементы из левого и правого столбцов',
            leftItems: [
              { id: 'left1', content: 'Элемент A' },
              { id: 'left2', content: 'Элемент B' }
            ],
            rightItems: [
              { id: 'right1', content: 'Соответствие 1', matchWith: 'left1' },
              { id: 'right2', content: 'Соответствие 2', matchWith: 'left2' }
            ],
            points: 2,
            showCorrectAnswer: true,
            difficultyLevel: 3
          }
        };
      } else if (tool.id === 'quiz') {
        properties = { 
          ...properties, 
          assignmentType: 'quiz',
          assignmentData: {
            question: 'Викторина',
            instructions: 'Ответьте на все вопросы',
            quizQuestions: [
              {
                id: 'q1',
                question: 'Первый вопрос',
                type: 'multiple-choice',
                options: [
                  { id: '1', text: 'Ответ 1', isCorrect: true },
                  { id: '2', text: 'Ответ 2', isCorrect: false }
                ],
                points: 1
              }
            ],
            points: 1,
            timeLimit: 10,
            showCorrectAnswer: true,
            difficultyLevel: 3
          }
        };
      }
    }
    
    // Create new element
          const newElement: CanvasElementType = {
            id: generateId(),
      type,
      x: position.x,
      y: position.y,
      width: getDefaultWidth(tool.id),
      height: getDefaultHeight(tool.id),
      content: getDefaultContent(tool.id),
            page: canvasSettings.currentPage,
            zIndex: Math.max(0, ...elements.map(el => el.zIndex)) + 1,
            rotation: 0,
            opacity: 1,
      properties,
          };
          
          // Add the new element to the canvas
    const newElements = [...elements, newElement];
    setElements(newElements);
            addToHistory(newElements);
          
          // Select the new element
          setSelectedElementId(newElement.id);
  }, [elements, canvasSettings, _getSmartPosition, generateId]);

  // Handle drag over
  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // This is a placeholder for any logic that might be needed
    // when an element is dragged over a droppable area
  }, []);

  // Handle change page
  const handleChangePage = useCallback((pageNumber: number) => {
    // Skip if not initialized
    if (!isInitialized) {
      console.log('Skipping page change - not initialized');
      return;
    }
    
    console.log('Changing to page:', pageNumber);
    setCanvasSettings(prev => ({
      ...prev,
      currentPage: pageNumber,
    }));
    
    // Update presence to show current page
    updatePresence(`page-${pageNumber}`, { 
      pageNumber,
      action: 'viewing'
    });
  }, [isInitialized, updatePresence]);

  // Handle zoom
  const setZoom = useCallback((newZoom: number) => {
    console.log('Setting zoom to:', newZoom);
    const clampedZoom = Math.min(Math.max(newZoom, 10), 500);
    setCanvasSettings(prev => ({
      ...prev,
      zoom: clampedZoom
    }));
    setZoomInput(clampedZoom.toString());
  }, []);

  const handleZoomIn = useCallback((e?: React.MouseEvent) => {
    // Stop event propagation if it exists
    if (e) {
      e.preventDefault(); 
      e.stopPropagation();
    }
    console.log('Zoom in clicked');
    setZoom(canvasSettings.zoom + 10);
  }, [canvasSettings.zoom, setZoom]);

  const handleZoomOut = useCallback((e?: React.MouseEvent) => {
    // Stop event propagation if it exists
    if (e) {
      e.preventDefault(); 
      e.stopPropagation();
    }
    console.log('Zoom out clicked');
    setZoom(canvasSettings.zoom - 10);
  }, [canvasSettings.zoom, setZoom]);
  
  // Handle zoom input change
  const handleZoomInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setZoomInput(e.target.value);
  }, []);
  
  // Apply custom zoom value on Enter or blur
  const handleApplyCustomZoom = useCallback((e?: React.KeyboardEvent | React.FocusEvent) => {
    if (e && 'key' in e && e.key !== 'Enter') {
      return;
    }
    
    const newZoomValue = parseInt(zoomInput, 10);
    if (!isNaN(newZoomValue) && newZoomValue >= 10 && newZoomValue <= 500) {
      setZoom(newZoomValue);
    } else {
      // Reset to current zoom if invalid
      setZoomInput(canvasSettings.zoom.toString());
    }
  }, [zoomInput, setZoom, canvasSettings.zoom]);
  
  // Add keyboard shortcuts for common actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key - end editing and clear selection
      if (e.key === 'Escape') {
        e.preventDefault();
        if (editingElementId) {
          setEditingElementId(null);
        } else if (selectedElementId) {
          setSelectedElementId(null);
        }
        return;
      }
      
      // Skip if we're editing an element
      if (editingElementId) return;
      
      // Skip if focus is on an input element
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        document.activeElement instanceof HTMLSelectElement
      ) {
        return;
      }

      // Delete selected element with Delete key
      if (e.key === 'Delete' && selectedElementId) {
        e.preventDefault();
        deleteElement(selectedElementId);
        return;
      }
      
      // Zoom in with Ctrl/Cmd + Plus
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        setZoom(canvasSettings.zoom + 10);
      }
      
      // Zoom out with Ctrl/Cmd + Minus
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        setZoom(canvasSettings.zoom - 10);
      }
      
      // Reset zoom with Ctrl/Cmd + 0
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        setZoom(100);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvasSettings.zoom, setZoom, selectedElementId, editingElementId, deleteElement]);

  // Handle toggle grid
  const handleToggleGrid = useCallback(() => {
    setCanvasSettings(prev => ({
      ...prev,
      showGrid: !prev.showGrid,
    }));
  }, []);

  // Toggle two-page view
  const _handleToggleTwoPageView = useCallback(() => {
    setCanvasSettings(prev => ({
      ...prev,
      twoPageView: !prev.twoPageView
    }));
  }, []);

  // Handle media upload
  const _handleMediaUpload = useCallback(async (file: File, mediaType: 'image' | 'video' | 'audio') => {
    if (!file) return;
    
    try {
      // Upload media file
      const result = await uploadMedia(file, mediaType);
      
      if (result?.url) {
        console.log(`${mediaType} uploaded:`, result.url);
        
        // Create appropriate element based on media type
        let type: CanvasElementType['type'] = 'image';
        const properties: Record<string, string | boolean | number> = {};
        
        if (mediaType === 'image') {
          type = 'image';
          properties.imageUrl = result.url;
        } else if (mediaType === 'video') {
          type = 'video';
          properties.videoUrl = result.url;
          properties.controls = true;
        } else if (mediaType === 'audio') {
          type = 'audio';
          properties.audioUrl = result.url;
          properties.controls = true;
        }
        
        // Create the new element
        const newElement: CanvasElementType = {
          id: generateId(),
          type,
          x: 100,
          y: 100,
          width: getDefaultWidth(type),
          height: getDefaultHeight(type),
          content: '',
          page: canvasSettings.currentPage,
          zIndex: Math.max(0, ...elements.map(el => el.zIndex)) + 1,
          rotation: 0,
          opacity: 1,
          properties: {
            ...getEnhancedPropertiesForTool(type),
            ...properties
          },
        };
        
        // Add the new element to the canvas
        setElements(prev => {
          const newElements = [...prev, newElement];
          addToHistory(newElements);
          return newElements;
        });
        
        // Select the new element
        setSelectedElementId(newElement.id);
        
        return result.url;
      }
    } catch (error) {
      console.error('Error uploading media:', error instanceof Error ? error.message : error);
    }
    
    return null;
  }, [canvasSettings.currentPage, generateId, elements, addToHistory]);

  // Handle table creation from dialog
  const handleCreateTable = useCallback((rows: number, columns: number, hasHeaderRow: boolean) => {
    if (!pendingTablePosition) return;
    
    // Create table element
    const newElement: CanvasElementType = {
      id: generateId(),
      type: 'table',
      x: pendingTablePosition.x,
      y: pendingTablePosition.y,
      width: getDefaultWidth('table'),
      height: getDefaultHeight('table'),
      content: '',
      page: canvasSettings.currentPage,
      zIndex: Math.max(0, ...elements.map(el => el.zIndex)) + 1,
      rotation: 0,
      opacity: 1,
      properties: {
        ...getEnhancedPropertiesForTool('table'),
        tableData: {
          rows,
          columns,
          cells: createDefaultTableCells(rows, columns),
          headerRow: hasHeaderRow,
          headerColumn: false,
          borderCollapse: true,
          cellPadding: 8,
          cellSpacing: 0,
          borderColor: '#cccccc',
          borderWidth: 1,
          alternateRowColors: false,
        }
      },
    };
    
    // Add the new element to the canvas
    setElements(prev => {
      const newElements = [...prev, newElement];
      addToHistory(newElements);
      return newElements;
    });
    
    // Select the new element
    setSelectedElementId(newElement.id);
    setPendingTablePosition(null);
  }, [pendingTablePosition, canvasSettings.currentPage, elements, addToHistory, generateId]);

  // Zoom presets
  const ZOOM_PRESETS = [
    { label: '50%', value: 50 },
    { label: '75%', value: 75 },
    { label: '100%', value: 100 },
    { label: '125%', value: 125 },
    { label: '150%', value: 150 },
    { label: '200%', value: 200 },
    { label: '300%', value: 300 },
    { label: '400%', value: 400 },
    { label: '500%', value: 500 },
  ];

  // State for zoom preset dropdown
  const [showZoomPresets, setShowZoomPresets] = useState(false);
  const zoomDropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close zoom preset dropdown
  useEffect(() => {
    if (!showZoomPresets) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (zoomDropdownRef.current && event.target && !zoomDropdownRef.current.contains(event.target as Node)) {
        setShowZoomPresets(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showZoomPresets]);

  // Reset zoom to 100%
  const handleResetZoom = useCallback(() => {
    setZoom(100);
  }, [setZoom]);

  // Handle loading a previous version
  const handleLoadVersion = useCallback((versionElements: CanvasElementType[]) => {
    // Ensure elements are properly typed
    const typedElements = Array.isArray(versionElements) 
      ? versionElements as CanvasElementType[]
      : [];
    
    setElements(typedElements);
    addToHistory(typedElements);
    
    // Save the book with the restored elements
    if (book?.id) {
      const saveRestoredVersion = async () => {
        try {
          const client = createClient();
          const { error } = await client
            .from('books')
            .update({ 
              canvas_elements: JSON.stringify(typedElements),
              updated_at: new Date().toISOString()
            })
            .eq('id', book.id);
            
          if (error) {
            console.error('Error saving restored version:', error instanceof Error ? error.message : error);
          }
        } catch (e) {
          console.error('Exception saving restored version:', e);
        }
      };
      
      saveRestoredVersion();
    }
  }, [addToHistory, book]);

  // Handle saving a version
  const handleSaveVersion = useCallback(async (name: string, description: string) => {
    if (!book || !userProfile) {
      console.error('Cannot save version: book or user profile is null');
      return false;
    }
    
    try {
      // Generate a unique ID for the version
      const versionId = crypto.randomUUID();
      
      // Create the new version object
      const newVersion: BookVersion = {
        id: versionId,
        name,
        description: description || undefined,
        timestamp: new Date().toISOString(),
        elements: [...elements], // Make a copy of the current elements
        userName: userProfile.display_name || 'Unknown User',
        userId: userProfile.id
      };
      
      // Add the new version to the versions array
      const updatedVersions = [newVersion, ...bookVersions];
      setBookVersions(updatedVersions);
      
      // Store versions in localStorage
      if (book.id) {
        localStorage.setItem(`book-versions-${book.id}`, JSON.stringify(updatedVersions));
      }
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50';
      notification.textContent = 'Версия успешно сохранена';
      document.body.appendChild(notification);
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
      
      return true;
    } catch (error) {
      // Log the error
      console.error('Error saving version:', error instanceof Error ? error.message : error);
      
      // Get a meaningful error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error && typeof error === 'object' && 'message' in error 
            ? String(error.message) 
            : 'Неизвестная ошибка');
      
      // Show error notification
      const errorNotification = document.createElement('div');
      errorNotification.className = 'fixed top-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50';
      errorNotification.textContent = `Ошибка сохранения версии: ${errorMessage}`;
      document.body.appendChild(errorNotification);
      
      // Hide notification after 5 seconds
      setTimeout(() => {
        document.body.removeChild(errorNotification);
      }, 5000);
      
      return false;
    }
  }, [book, elements, userProfile, bookVersions]);

  // Toggle version history panel
  const toggleVersionHistoryPanel = useCallback(() => {
    setIsVersionHistoryPanelOpen(prev => !prev);
  }, []);
  
  // Handle importing a book from JSON
  const handleImportBook = useCallback(async (importData: BookExportData) => {
    if (!book) return;
    
    try {
      // Set the imported elements
      setElements(importData.elements);
      addToHistory(importData.elements);
      
      // Set the imported settings
      setCanvasSettings(prev => ({
        ...prev,
        canvasWidth: importData.settings.canvasWidth,
        canvasHeight: importData.settings.canvasHeight,
        totalPages: importData.settings.totalPages,
        backgroundColor: importData.settings.backgroundColor,
        gridSize: importData.settings.gridSize || prev.gridSize,
        showGrid: importData.settings.showGrid !== undefined ? importData.settings.showGrid : prev.showGrid,
      }));
      
      // Save the changes to the database
      const supabase = createClient();
      const { error } = await supabase
        .from('books')
        .update({
          canvas_elements: JSON.stringify(importData.elements),
          canvas_settings: JSON.stringify({
            ...canvasSettings,
            canvasWidth: importData.settings.canvasWidth,
            canvasHeight: importData.settings.canvasHeight,
            totalPages: importData.settings.totalPages,
            backgroundColor: importData.settings.backgroundColor,
            gridSize: importData.settings.gridSize || canvasSettings.gridSize,
            showGrid: importData.settings.showGrid !== undefined ? importData.settings.showGrid : canvasSettings.showGrid,
          }),
          updated_at: new Date().toISOString()
        })
        .eq('id', book.id);
        
      if (error) {
        console.error('Error saving imported book:', error instanceof Error ? error.message : error);
        
        // Show error notification
        const errorNotification = document.createElement('div');
        errorNotification.className = 'fixed top-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50';
        errorNotification.textContent = `Ошибка при импорте книги: ${error.message}`;
        document.body.appendChild(errorNotification);
        
        // Hide notification after 5 seconds
        setTimeout(() => {
          document.body.removeChild(errorNotification);
        }, 5000);
        
        return;
      }
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50';
      notification.textContent = 'Книга успешно импортирована';
      document.body.appendChild(notification);
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
      
    } catch (error) {
      console.error('Error importing book:', error instanceof Error ? error.message : error);
      
      // Show error notification
      const errorNotification = document.createElement('div');
      errorNotification.className = 'fixed top-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50';
      errorNotification.textContent = `Ошибка при импорте книги: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`;
      document.body.appendChild(errorNotification);
      
      // Hide notification after 5 seconds
      setTimeout(() => {
        document.body.removeChild(errorNotification);
      }, 5000);
    }
  }, [book, canvasSettings, addToHistory]);

  // If loading, show skeleton
  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col gap-4 p-8">
        <div className="w-full h-16 bg-gray-200 animate-pulse rounded-md"></div>
        <div className="flex-1 w-full bg-gray-200 animate-pulse rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top toolbar */}
      <div className="h-16 border-b flex items-center justify-between px-4 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMainSidebarHidden(!mainSidebarHidden)}
            title={mainSidebarHidden ? 'Показать боковую панель' : 'Скрыть боковую панель'}
          >
            {mainSidebarHidden ? <Menu /> : <Menu />}
          </Button>
          
          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onKeyPress={handleTitleKeyPress}
                  onBlur={handleSaveTitle}
                  className="text-xl font-semibold bg-white border rounded px-2 py-1 min-w-[200px]"
                  placeholder="Введите название книги"
                  autoFocus
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveTitle}
                  title="Сохранить название"
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEditingTitle}
                  title="Отменить"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 
                  className="text-xl font-semibold cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                  onClick={handleStartEditingTitle}
                  title="Кликните для редактирования названия"
                >
                  {book?.title || 'Без названия'}
          </h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStartEditingTitle}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Редактировать название"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Отменить"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Повторить"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
          
          {/* Export/Import component */}
          {book && (
            <BookExportImport 
              book={book} 
              elements={elements} 
              settings={canvasSettings} 
              onImport={handleImportBook}
            />
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault(); 
              e.stopPropagation();
              handleZoomOut(e);
            }}
            disabled={canvasSettings.zoom <= 10}
            title="Уменьшить (Ctrl/Cmd + -)"
            className="focus:outline-none active:bg-gray-200 h-8 px-2"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center">
            <input
              type="text"
              className="w-14 h-8 text-sm text-center border rounded-l mx-1 p-0"
              value={zoomInput}
              onChange={handleZoomInputChange}
              onKeyDown={handleApplyCustomZoom}
              onBlur={handleApplyCustomZoom}
              aria-label="Zoom percentage"
            />
            <div className="relative">
              <button
                className="bg-gray-100 hover:bg-gray-200 border border-l-0 rounded-r h-8 px-1 flex items-center text-xs"
                onClick={() => setShowZoomPresets(!showZoomPresets)}
                title="Preset zoom levels"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
              
              {showZoomPresets && (
                <div 
                  ref={zoomDropdownRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-white border rounded shadow-lg z-50 max-h-48 overflow-y-auto"
                  style={{ minWidth: '80px' }}
                >
                  {ZOOM_PRESETS.map(preset => (
                    <button
                      key={preset.value}
                      className={`w-full text-left px-3 py-1 text-sm hover:bg-gray-100 ${
                        canvasSettings.zoom === preset.value ? 'bg-blue-100' : ''
                      }`}
                      onClick={() => {
                        setZoom(preset.value);
                        setShowZoomPresets(false);
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="text-sm mr-1">%</span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault(); 
              e.stopPropagation();
              handleZoomIn(e);
            }}
            disabled={canvasSettings.zoom >= 500}
            title="Увеличить (Ctrl/Cmd + +)"
            className="focus:outline-none active:bg-gray-200 h-8 px-2"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetZoom}
            title="Масштаб по умолчанию (Ctrl/Cmd + 0)"
            className="focus:outline-none active:bg-gray-200 h-8 px-2 mr-1"
          >
            <Maximize className="h-4 w-4" />
          </Button>
          
          <Button
            variant={canvasSettings.showGrid ? "secondary" : "outline"}
            size="sm"
            onClick={handleToggleGrid}
            title={canvasSettings.showGrid ? 'Скрыть сетку' : 'Показать сетку'}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleVersionHistoryPanel}
            title="История версий"
            className="ml-1 flex items-center gap-1"
          >
            <History className="h-4 w-4" />
            <span>История</span>
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            title="Сохранить книгу (Ctrl/Cmd + S)"
            className="ml-1"
          >
            <Save className="h-4 w-4 mr-1" />
            Сохранить
          </Button>

          {selectedElementId && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => selectedElementId && deleteElement(selectedElementId)}
              title="Удалить выбранный элемент"
              className="ml-2"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Удалить элемент
            </Button>
          )}
        </div>
      </div>

      {/* Main editor area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Tools */}
        <div className={`border-r w-64 flex flex-col bg-gray-50 dark:bg-gray-800 ${!toolsPanelOpen ? 'hidden' : ''}`}>
          <div className="p-4 border-b">
            <h3 className="font-semibold">Инструменты</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {/* Tool categories */}
            <div className="p-2 grid grid-cols-2 gap-1 text-center min-h-fit">
              {TOOL_CATEGORIES.map(category => (
                <button
                  key={category.id}
                  className={`p-2 rounded-md flex flex-col items-center justify-center text-xs min-h-[60px] ${
                    activeCategory === category.id
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.icon && <category.icon className="h-5 w-5 mb-1" />}
                  {category.label}
                </button>
              ))}
            </div>
            
            {/* Tool items */}
            <div className="p-2">
              <DndContext 
                sensors={sensors} 
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
              >
                <div className="grid grid-cols-2 gap-2">
                  {TOOLS.filter(tool => tool.category === activeCategory).map(tool => (
                    <DraggableTool 
                      key={tool.id} 
                      tool={tool} 
                      canvasSettings={canvasSettings}
                      onMediaUploaded={(url, type) => {
                        // Handle media upload callback
                        console.log('Media uploaded:', url, type);
                      }}
                      onUploadProgress={handleUploadProgress}
                      onUploadError={handleUploadError}
                      onUploadStart={handleUploadStart}
                      onUploadComplete={handleUploadComplete}
                    />
                  ))}
                </div>
                
                <DragOverlay>
                  {activeElement && (
                    <div className="bg-white border shadow-lg p-2 rounded-md">
                      {activeElement.type === 'text' && (
                        <div style={{ fontFamily: activeElement.properties?.fontFamily || 'Arial' }}>
                          {activeElement.content}
                        </div>
                      )}
                      {activeElement.type === 'shape' && (
                        <div 
                          style={{
                            width: '50px',
                            height: '50px',
                            backgroundColor: activeElement.properties?.backgroundColor || '#e0e0e0',
                            borderRadius: activeElement.properties?.shapeType === 'circle' ? '50%' : '0',
                          }}
                        ></div>
                      )}
                      {activeElement.type === 'image' && (
                        <div style={{ width: '50px', height: '50px' }}>
                          <ImageIcon className="h-full w-full text-gray-400" />
                        </div>
                      )}
                    </div>
                  )}
                </DragOverlay>
              </DndContext>
            </div>
          </div>
        </div>

        {/* Main canvas area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Canvas */}
          <div className="flex-1 overflow-auto bg-gray-300 dark:bg-gray-700 p-8 flex items-center justify-center">
            <DndContext 
              sensors={sensors} 
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
            >
              <CanvasDropZone settings={canvasSettings} showGrid={canvasSettings.showGrid}>
                <div 
                  className="absolute inset-0 w-full h-full"
                  onClick={(e) => {
                    // Если клик по самому холсту (не по элементу), снимаем выделение и завершаем редактирование
                    if (e.target === e.currentTarget) {
                      setSelectedElementId(null);
                      setEditingElementId(null);
                    }
                  }}
                >
                {currentPageElements.map(element => {
                  const elementLock = isSessionLocked(element.id);
                  return (
                    <div key={element.id} className="relative">
                      <CanvasElementComponent
                        element={element}
                    isSelected={selectedElementId === element.id}
                      onSelect={() => {
                        // Завершаем редактирование предыдущего элемента
                        if (editingElementId && editingElementId !== element.id) {
                          setEditingElementId(null);
                        }
                        // Выбираем новый элемент
                        setSelectedElementId(element.id);
                      }}
                    onUpdate={(updates: Partial<CanvasElementType>) => updateElement(element.id, updates)}
                    isEditing={editingElementId === element.id}
                    onEdit={async (editing: boolean) => {
                      if (editing) {
                        // Check if element is locked by another user
                        const lock = isSessionLocked(element.id);
                        if (lock) {
                          alert(`Этот элемент редактируется пользователем ${formatUserName(lock.user)}. Подождите, пока они закончат.`);
                          return;
                        }
                        
                        // Start editing session
                        const success = await startEditingSession(element.id, 'element');
                        if (success) {
                          setEditingElementId(element.id);
                          updatePresence(`element-${element.id}`, { 
                            elementId: element.id,
                            action: 'editing',
                            elementType: element.type
                          });
                        } else {
                          alert('Не удалось начать редактирование. Элемент может быть заблокирован.');
                        }
                      } else {
                        setEditingElementId(null);
                        await endEditingSession(element.id);
                        updatePresence(`page-${canvasSettings.currentPage}`, { 
                          pageNumber: canvasSettings.currentPage,
                          action: 'viewing'
                        });
                      }
                    }}
                      canvasSettings={canvasSettings}
                      onDelete={() => deleteElement(element.id)}
                      onOpenMetadataEditor={handleOpenMetadataEditor}
                      bookBaseUrl={bookBaseUrl} // Pass the book's base_url to CanvasElementComponent
                      />
                      
                      {/* Show lock indicator if element is locked by another user */}
                      {elementLock && (
                        <div className="absolute inset-0 bg-yellow-100 bg-opacity-60 border-2 border-yellow-400 rounded pointer-events-none flex items-center justify-center">
                          <div className="bg-white rounded px-2 py-1 shadow-lg text-sm">
                            🔒 {formatUserName(elementLock.user)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              </CanvasDropZone>
            </DndContext>
          </div>
          
          {/* Bottom toolbar */}
          <div className="h-12 border-t flex items-center justify-between px-4 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (canvasSettings.currentPage > 1) {
                    handleChangePage(canvasSettings.currentPage - 1);
                  }
                }}
                disabled={canvasSettings.currentPage <= 1}
                title="Предыдущая страница"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <span className="mx-2 text-sm">
                Страница {canvasSettings.currentPage} из {canvasSettings.totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (canvasSettings.currentPage < canvasSettings.totalPages) {
                    handleChangePage(canvasSettings.currentPage + 1);
                  }
                }}
                disabled={canvasSettings.currentPage >= canvasSettings.totalPages}
                title="Следующая страница"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddPage}
                title="Добавить страницу"
              >
                <Plus className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeletePage}
                disabled={canvasSettings.totalPages <= 1}
                title="Удалить страницу"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setToolsPanelOpen(!toolsPanelOpen)}
                title={toolsPanelOpen ? 'Скрыть панель инструментов' : 'Показать панель инструментов'}
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPropertiesPanelOpen(!propertiesPanelOpen)}
                title={propertiesPanelOpen ? 'Скрыть панель свойств' : 'Показать панель свойств'}
              >
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
              
              <Button
                variant={collaborationPanelOpen ? "default" : "outline"}
                size="sm"
                onClick={() => setCollaborationPanelOpen(!collaborationPanelOpen)}
                title={collaborationPanelOpen ? 'Скрыть панель совместной работы' : 'Показать панель совместной работы'}
                className={collaborationPanelOpen ? 'bg-blue-600 text-white border-blue-600' : ''}
              >
                <Users className="h-4 w-4" />
                <span className="ml-1 text-xs">Соавторы</span>
              </Button>
              
              {/* Add Collaborator Button - Show for authors */}
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  console.log('Collaboration button clicked!');
                  console.log('userProfile:', userProfile);
                  console.log('book:', book);
                  console.log('currentUserRole:', currentUserRole);
                  setCollaborationPanelOpen(true);
                  // Add a small delay to ensure panel opens, then focus on invite button
                  setTimeout(() => {
                    const inviteButton = document.querySelector('[data-invite-button]') as HTMLButtonElement;
                    if (inviteButton) {
                      console.log('Found invite button, clicking it');
                      inviteButton.click();
                    } else {
                      console.log('Invite button not found');
                    }
                  }, 100);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg border-2 border-blue-500"
                title="Добавить соавтора"
              >
                <Users className="h-4 w-4 mr-1" />
                Добавить соавтора
              </Button>
              

              {/* Presence Indicator */}
              {presence.length > 0 && (
                <PresenceIndicator
                  presence={presence}
                  currentUserId={userProfile?.id}
                  showDetails={true}
                  maxVisible={3}
                  className="ml-2"
                />
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar - Properties */}
        {propertiesPanelOpen && selectedElement && (
          <div className="border-l w-80 bg-gray-50 dark:bg-gray-800 flex flex-col h-full">
            {/* Properties panel - Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              <PropertiesPanel
                selectedElement={selectedElement}
                onUpdate={(updates) => {
                  if (selectedElementId) {
                    updateElement(selectedElementId, updates);
                  }
                }}
                onClose={() => setPropertiesPanelOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Right sidebar - Collaboration */}
        {collaborationPanelOpen && book && (
          <div className="border-l w-80 bg-gray-50 dark:bg-gray-800 flex flex-col h-full">
            {/* Collaboration panel - Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              <CollaborationErrorBoundary>
                <CollaborationPanel
                  bookId={book.id}
                  className="h-full border-none"
                  userRole={userProfile?.role}
                  isBookAuthor={book.author_id === userProfile?.id}
                />
              </CollaborationErrorBoundary>
            </div>
          </div>
        )}
      </div>
      
      {/* Table Dialog */}
      {showTableDialog && (
        <TableDialog
          isOpen={showTableDialog}
          onClose={() => {
            setShowTableDialog(false);
            setPendingTablePosition(null);
          }}
          onCreateTable={handleCreateTable}
        />
      )}

      {/* Media Upload Progress */}
      <MediaUploadProgress
        isVisible={uploadProgress.isVisible}
        progress={uploadProgress.progress}
        fileName={uploadProgress.fileName}
        error={uploadProgress.error}
        onDismiss={handleUploadDismiss}
        onCancel={handleUploadDismiss}
      />

      {/* Media Metadata Editor */}
      <MediaMetadataEditor
        isOpen={metadataEditor.isOpen}
        onClose={handleCloseMetadataEditor}
        element={metadataEditor.element}
        onUpdate={handleUpdateElementMetadata}
      />

      {/* Version history panel */}
      {isInitialized && (
        <VersionHistoryPanel
          bookId={book?.id || ''}
          versions={bookVersions}
          onLoadVersion={handleLoadVersion}
          onSaveVersion={handleSaveVersion}
          isOpen={isVersionHistoryPanelOpen}
          onClose={() => setIsVersionHistoryPanelOpen(false)}
        />
      )}
    </div>
  );
} 
