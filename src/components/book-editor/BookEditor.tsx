import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase';
// import { fetchBooksWithCorrectClient } from '@/utils/supabase-admin';
import { Button } from '@/components/ui/button';
// Removed collaboration imports - moved to book content page
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
  Calculator,
  Italic,
  Bold,
  Underline,
  // Icon imports for new assignment types
  MousePointer, Link2, List, ChevronRight, MousePointer2, Network, Move, Hash, ArrowUpDown, Grid3x3, Crosshair, Highlighter, FileText, Lightbulb as HintIcon,
  // Icon imports
  Home, User, Settings, Search, Mail, Phone, Calendar, Clock, Map, Camera, Music,
  File, Folder, Download, Upload, Copy, Check, Bell, AlertCircle, Info,
  Shield, Lock, Eye, ThumbsUp, MessageCircle, Share, Link, Zap, Award, Gift,
  Briefcase, Flag, Sun, Moon, Lightbulb, Battery, Wifi, Globe, Database, Code,
  Monitor, Smartphone, PlayCircle, Volume, Palette, Bookmark, Filter, RefreshCw,
  BookOpen, ArrowLeft
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
import { EnhancedCalculator } from './EnhancedCalculator';
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
  
  // New OPIQ-style interactive assignments
  { id: 'fill-in-blank', name: 'Пропуск (запись)', label: 'Пропуск', icon: Type, category: 'assignments', needsFileUpload: false, hotkey: '' },
  { id: 'multiple-select', name: 'Несколько из списка', label: 'Множественный выбор', icon: CheckSquare, category: 'assignments', needsFileUpload: false, hotkey: '' },
  { id: 'single-select', name: 'Один из списка', label: 'Один вариант', icon: Circle, category: 'assignments', needsFileUpload: false, hotkey: '' },
  { id: 'dropdown-select', name: 'Раскрывающийся список', label: 'Выпадающий список', icon: ChevronDown, category: 'assignments', needsFileUpload: false, hotkey: '' },
  { id: 'image-hotspots', name: 'Элементы на изображении', label: 'Интерактивное изображение', icon: MousePointer, category: 'assignments', needsFileUpload: false, hotkey: '' },
  { id: 'connect-pairs', name: 'Соедините пары', label: 'Соединение пар', icon: Link2, category: 'assignments', needsFileUpload: false, hotkey: '' },
  
  // New assignment types
  { id: 'concept-map', name: 'Карта понятий', label: 'Карта понятий', icon: Network, category: 'assignments', needsFileUpload: false, hotkey: '' },
  { id: 'drag-to-point', name: 'Перетаскивание', label: 'Перетаскивание', icon: Move, category: 'assignments', needsFileUpload: false, hotkey: '' },
  { id: 'numbers-on-image', name: 'Числа на изображении', label: 'Числа на изображ.', icon: Hash, category: 'assignments', needsFileUpload: false, hotkey: '' },
  { id: 'grouping', name: 'Сгруппировать', label: 'Сгруппировать', icon: Users, category: 'assignments', needsFileUpload: false, hotkey: '' },
  { id: 'ordering', name: 'Упорядочить', label: 'Упорядочить', icon: ArrowUpDown, category: 'assignments', needsFileUpload: false, hotkey: '' },
  { id: 'word-grid', name: 'Сетка слов', label: 'Сетка слов', icon: Grid3x3, category: 'assignments', needsFileUpload: false, hotkey: '' },
  { id: 'crossword', name: 'Кроссворд', label: 'Кроссворд', icon: Crosshair, category: 'assignments', needsFileUpload: false, hotkey: '' },
  { id: 'highlight-words', name: 'Выделить слова', label: 'Выделить слова', icon: Highlighter, category: 'assignments', needsFileUpload: false, hotkey: '' },
  { id: 'text-editing', name: 'Редактирование текста', label: 'Редакт. текста', icon: FileText, category: 'assignments', needsFileUpload: false, hotkey: '' },
  { id: 'text-highlighting', name: 'Выделение текста', label: 'Выделение текста', icon: Highlighter, category: 'assignments', needsFileUpload: false, hotkey: '' },
  { id: 'hint', name: 'Подсказка', label: 'Подсказка', icon: HintIcon, category: 'assignments', needsFileUpload: false, hotkey: '' },

  // Educational Icon tools with custom SVG icons
  { id: 'icon-analysis', name: 'Анализ', label: 'Анализ', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Анализ' },
  { id: 'icon-attention', name: 'Внимание', label: 'Внимание', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Внимание' },
  { id: 'icon-speaking', name: 'Говорение', label: 'Говорение', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Говорение' },
  { id: 'icon-homework', name: 'Домашняя работа', label: 'Домашняя работа', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Домашняя работа' },
  { id: 'icon-ask-question', name: 'Задай вопрос', label: 'Задай вопрос', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Задай вопрос' },
  { id: 'icon-game', name: 'Игра', label: 'Игра', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Игра' },
  { id: 'icon-game-1', name: 'Игра 1', label: 'Игра 1', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Игра_1' },
  { id: 'icon-game-2', name: 'Игра 2', label: 'Игра 2', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Игра_2' },
  { id: 'icon-internet', name: 'Интернет', label: 'Интернет', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Интернет' },
  { id: 'icon-draw', name: 'Нарисуй', label: 'Нарисуй', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Нарисуй' },
  { id: 'icon-circle', name: 'Обведи', label: 'Обведи', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Обведи' },
  { id: 'icon-check-mark', name: 'Отметь галочкой', label: 'Отметь галочкой', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Отметь галочкой' },
  { id: 'icon-puzzle', name: 'Пазл', label: 'Пазл', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Пазл' },
  { id: 'icon-singing', name: 'Пение', label: 'Пение', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Пение' },
  { id: 'icon-writing', name: 'Письмо', label: 'Письмо', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Письмо' },
  { id: 'icon-show', name: 'Покажи', label: 'Покажи', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Покажи' },
  { id: 'icon-self-check', name: 'Проверь себя', label: 'Проверь себя', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Проверь себя' },
  { id: 'icon-individual-work', name: 'Работа индивидуально', label: 'Индивидуально', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Работа Индивидуальная' },
  { id: 'icon-group-work', name: 'Работа в группе', label: 'В группе', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Работа в Группе' },
  { id: 'icon-pair-work', name: 'Работа в паре', label: 'В паре', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Работа в Паре' },
  { id: 'icon-color', name: 'Раскрась', label: 'Раскрась', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Раскрась' },
  { id: 'icon-conclusion', name: 'Сделай вывод', label: 'Сделай вывод', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Сделай вывод' },
  { id: 'icon-listening', name: 'Слушание', label: 'Слушание', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Слушание' },
  { id: 'icon-connect', name: 'Соедини', label: 'Соедини', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Соедини' },
  { id: 'icon-save', name: 'Сохрани', label: 'Сохрани', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Сохрани' },
  { id: 'icon-functional-literacy', name: 'Функциональная грамотность', label: 'Функц. грамотность', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Функциональная грамотность' },
  { id: 'icon-reading', name: 'Чтение', label: 'Чтение', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Чтение' },
  { id: 'icon-video', name: 'Видео', label: 'Видео', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG видео' },
  { id: 'icon-video-library', name: 'Видеотека', label: 'Видеотека', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG видеотека' },
  { id: 'icon-globe-kg', name: 'Глобус', label: 'Глобус', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG глобус' },
  { id: 'icon-monitor-kg', name: 'Монитор', label: 'Монитор', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG монитор' },
  { id: 'icon-reflection', name: 'Рефлексия', label: 'Рефлексия', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG рефлексия' },
  { id: 'icon-construct', name: 'Сконструируй', label: 'Сконструируй', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG сконструируй' },
  { id: 'icon-goal', name: 'Цель', label: 'Цель', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG цель' },
  
  // Additional educational icons  
  { id: 'icon-ae', name: 'АӘ', label: 'АӘ', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG АӘ' },
  { id: 'icon-disk', name: 'Диск', label: 'Диск', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Диск' },
  { id: 'icon-other-level', name: 'Другой уровень', label: 'Другой уровень', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG Другой уровень' },
  { id: 'icon-kite', name: 'Воздушный змей', label: 'Воздушный змей', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG воз._змей' },
  { id: 'icon-initial-program-white', name: 'Начальная программа (белый)', label: 'Нач. прогр. (белый)', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG на. программу_белый' },
  { id: 'icon-initial-program', name: 'Начальная программа', label: 'Нач. программа', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG нап. программу' },
  { id: 'icon-pen-test', name: 'Проба пера', label: 'Проба пера', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG проба пера' },
  { id: 'icon-artistic-taste', name: 'Художественный вкус', label: 'Худож. вкус', icon: ImageIcon, category: 'icons', needsFileUpload: false, hotkey: '', svgFileName: 'KG художественный вкус' },
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

export function BookEditor({ sectionId: propSectionId }: { sectionId?: string | null }) {
  const params = useParams();
  const searchParams = useSearchParams();
  const { userProfile } = useAuth();
  
  // Get the book base URL from params
  const bookBaseUrl = params?.base_url as string;
  
  // Get the section ID from props or search params if available
  const sectionId = propSectionId || searchParams?.get('section');
  
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
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
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
  // Sidebar is automatically hidden on book editor pages
  // Panel states removed - all tools moved to top toolbar
  // Removed collaboration panel state - moved to book content page
  const [_pagesPanelOpen, _setPagesPanelOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState('content');

  // Removed collaboration hooks - moved to book content page

  // Canvas settings - infinite scroll layout
  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>({
    zoom: 100,
    currentPage: 1, // Keep for compatibility but not used
    totalPages: 1, // Keep for compatibility but not used  
    canvasWidth: 100, // Full width percentage
    canvasHeight: 100, // Auto height
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
  const [zoomInput, setZoomInput] = useState('100');

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
    // Get canvas dimensions for boundary checking
    const canvasElement = document.querySelector('[data-canvas="true"]') as HTMLElement;
    let canvasWidth = canvasSettings.canvasWidth * 3.7795; // Default fallback
    let canvasHeight = canvasSettings.canvasHeight * 3.7795; // Default fallback
    
    if (canvasElement) {
      const canvasRect = canvasElement.getBoundingClientRect();
      const zoomFactor = canvasSettings.zoom / 100;
      canvasWidth = canvasRect.width / zoomFactor;
      canvasHeight = canvasRect.height / zoomFactor;
    }
    
    // Default position with boundary constraints
    let x = Math.min(100, canvasWidth - 150); // Leave space for element width
    let y = Math.min(100, canvasHeight - 100); // Leave space for element height
    
    // Try to place new elements in a smart way to avoid overlap (infinite scroll)
    if (elements.length > 0) {
      // Find a position that doesn't overlap with existing elements
      const positions = elements.map(el => ({ x: el.x, y: el.y, width: el.width, height: el.height }));
      
      // Simple algorithm: try to place elements in a grid pattern
      const gridSize = 120; // Space between elements
      let foundPosition = false;
      
      for (let row = 0; row < 10 && !foundPosition; row++) {
        for (let col = 0; col < 10 && !foundPosition; col++) {
          const testX = 50 + col * gridSize;
          const testY = 50 + row * gridSize;
          
          // Check canvas boundaries - ensure element stays within canvas
          if (testX + 100 > canvasWidth || testY + 50 > canvasHeight) {
            continue; // Skip this position if it would exceed canvas boundaries
          }
          
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
    
    // Final boundary check to ensure position is within canvas
    x = Math.max(0, Math.min(x, canvasWidth - 100));
    y = Math.max(0, Math.min(y, canvasHeight - 50));
    
    return { x, y };
  }, [elements, canvasSettings]); // Added canvasSettings dependency

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

  // Computed values - infinite scroll (show all elements)
  const currentPageElements = elements; // Show all elements in infinite scroll
  const selectedElement = selectedElementId ? elements.find(el => el.id === selectedElementId) || null : null;

  // Load book data - modified to also load edit history
  useEffect(() => {
    const loadBook = async () => {
      if (!bookBaseUrl) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setSectionError(null); // Clear any previous section errors
      try {
        const supabase = createClient();
        const { data: bookData, error: bookError } = await supabase
          .from('books')
          .select('*')
          .eq('base_url', bookBaseUrl)
          .single();

        if (bookError) {
          throw bookError;
        }

        if (!bookData) {
          throw new Error('Book not found');
        }

        setBook(bookData as Book);

        // Load book structure if available
        let sections: any[] = [];
        if (bookData.structure) {
          try {
            sections = JSON.parse(bookData.structure);
            setBookSections(Array.isArray(sections) ? sections : []);
          } catch (e) {
            console.error('Error parsing book structure', e);
            setBookSections([]);
          }
        } else {
          // If no structure exists, create a default one
          setBookSections([]);
          if (sectionId) {
            setSectionError('Структура книги не настроена. Перейдите на страницу содержания для настройки разделов.');
          }
        }

        // Load canvas elements
        if (bookData.canvas_elements) {
          try {
            let loadedElements = JSON.parse(bookData.canvas_elements) as CanvasElementType[];
            
            // If we have a section ID, filter elements to only show those for the specific section
            if (sectionId && sections.length > 0) {
              // Find the section in the book structure
              const findSection = (sectionId: string, sectionList: any[]): any | null => {
                for (const section of sectionList) {
                  if (section.id === sectionId) return section;
                  if (section.children) {
                    const found = findSection(sectionId, section.children);
                    if (found) return found;
                  }
                }
                return null;
              };
              
              const currentSection = findSection(sectionId, sections);
              
              if (currentSection && currentSection.pageRef !== undefined) {
                // If the section has a pageRef, filter elements by page
                loadedElements = loadedElements.filter(element => element.page === currentSection.pageRef);
              }
              
              // Set page title to section title if available
              if (currentSection && currentSection.title) {
                document.title = `Редактирование: ${currentSection.title} - ${bookData.title}`;
              } else if (sectionId) {
                // Section ID provided but section not found - this might be an invalid/old section ID
                console.warn(`Section with ID "${sectionId}" not found in book structure`);
                setSectionError(`Раздел с ID "${sectionId}" не найден. Возможно, структура книги была изменена.`);
                document.title = `Редактирование раздела - ${bookData.title}`;
              }
            } else if (sectionId) {
              // Section ID provided but no sections exist yet
              console.warn(`Section ID "${sectionId}" provided but book has no structure`);
              document.title = `Редактирование раздела - ${bookData.title}`;
            }
            
            setElements(loadedElements);
            
            // Initialize history with loaded elements
            setHistory([loadedElements]);
            setHistoryIndex(0);
          } catch (e) {
            console.error('Error parsing canvas elements', e);
            // Initialize with empty elements if parsing fails
            setElements([]);
            setHistory([[]]);
            setHistoryIndex(0);
          }
        } else {
          // Initialize with empty elements if no canvas_elements
          setElements([]);
          setHistory([[]]);
          setHistoryIndex(0);
        }

        // Load canvas settings
        if (bookData.canvas_settings) {
          try {
            const settings = JSON.parse(bookData.canvas_settings);
            // ... existing canvas settings code ...
          } catch (e) {
            console.error('Error parsing canvas settings', e);
            // ... existing error handling code ...
          }
        } else {
          // ... existing default settings code ...
        }

        // Set initial title for editing
        setTempTitle(bookData.title);

        // ... existing version history code ...

        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading book:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBook();
  }, [bookBaseUrl, sectionId]);

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
      
      const { toolId, position, mediaUrl, fontFamily, textStyle } = event.detail;
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
        if (['multiple-choice', 'open-question', 'true-false', 'matching', 'quiz', 'fill-in-blank', 'multiple-select', 'single-select', 'dropdown-select', 'image-hotspots', 'connect-pairs', 'concept-map', 'drag-to-point', 'numbers-on-image', 'grouping', 'ordering', 'word-grid', 'crossword', 'highlight-words', 'text-editing', 'text-highlighting', 'hint'].includes(toolId)) {
          return 'assignment';
        }
        // Check if it's an icon tool
        if (toolId.startsWith('icon-')) {
          return 'icon';
        }
        // Check if it's a font tool or text formatting tool - all create text elements
        if (toolId.startsWith('font-') || toolId.startsWith('text-') || toolId === 'text') {
          return 'text';
        }
        // Paragraph should create paragraph type
        if (toolId === 'paragraph') {
          return 'paragraph';
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
      
      // If fontFamily is provided, update font properties
      if (fontFamily) {
        elementProperties = { ...elementProperties, fontFamily };
      }
      
      // If textStyle is provided, update text style properties
      if (textStyle) {
        switch (textStyle) {
          case 'bold':
            elementProperties = { ...elementProperties, fontWeight: 'bold' };
            break;
          case 'italic':
            elementProperties = { ...elementProperties, fontStyle: 'italic' };
            break;
          case 'underline':
            elementProperties = { ...elementProperties, textDecoration: 'underline' };
            break;
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
        page: 1, // All elements on single infinite page
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
  }, [book, canvasSettings.autoSave, canvasSettings.autoSaveInterval, elements.length]);

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
          
          // Apply strict boundary constraints to prevent elements from exceeding canvas boundaries
          const originalX = newX;
          const originalY = newY;
          
          // Constrain X position
          newX = Math.max(0, Math.min(newX, canvasWidth - el.width));
          
          // Constrain Y position  
          newY = Math.max(0, Math.min(newY, canvasHeight - el.height));
          
          // Additional safety check - if element dimensions would cause overflow, adjust position
          if (newX + el.width > canvasWidth) {
            newX = Math.max(0, canvasWidth - el.width);
          }
          if (newY + el.height > canvasHeight) {
            newY = Math.max(0, canvasHeight - el.height);
          }
          
          // Auto-correction feedback: if position was corrected, briefly show visual indicator
          if (originalX !== newX || originalY !== newY) {
            console.log('🔄 Auto-corrected element position:', {
              original: { x: originalX, y: originalY },
              corrected: { x: newX, y: newY },
              elementId: el.id
            });
          }
          
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
    } else if (tool.id === 'multiple-choice' || tool.id === 'open-question' || tool.id === 'true-false' || tool.id === 'matching' || tool.id === 'quiz' ||
               tool.id === 'fill-in-blank' || tool.id === 'multiple-select' || tool.id === 'single-select' || tool.id === 'dropdown-select' || tool.id === 'image-hotspots' || tool.id === 'connect-pairs' ||
               tool.id === 'concept-map' || tool.id === 'drag-to-point' || tool.id === 'numbers-on-image' || tool.id === 'grouping' || tool.id === 'ordering' || tool.id === 'word-grid' || tool.id === 'crossword' || tool.id === 'highlight-words' || tool.id === 'text-editing' || tool.id === 'text-highlighting' || tool.id === 'hint') {
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
            pointsEnabled: true,
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
            pointsEnabled: true,
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
            pointsEnabled: true,
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
            pointsEnabled: true,
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
            pointsEnabled: true,
            timeLimit: 10,
            showCorrectAnswer: true,
            difficultyLevel: 3
          }
        };
      } else if (tool.id === 'fill-in-blank') {
        properties = { 
          ...properties, 
          assignmentType: 'fill-in-blank',
          assignmentData: {
            question: 'Заполните пропуски в тексте:',
            instructions: 'Введите подходящие слова в пустые поля',
            textWithBlanks: 'В году есть ____ месяцев и ____ времени года.',
            correctAnswers: ['двенадцать', 'четыре'],
            blanks: [
              { id: 'blank1', position: 13, answer: 'двенадцать', caseSensitive: false },
              { id: 'blank2', position: 31, answer: 'четыре', caseSensitive: false }
            ],
            correctAnswerType: 'SINGLE', // Default to single correct answer
            points: 1,
            pointsEnabled: true, // По умолчанию система баллов включена
            timeLimit: null,
            showCorrectAnswer: true
          }
        };
      } else if (tool.id === 'multiple-select') {
        properties = { 
          ...properties, 
          assignmentType: 'multiple-select',
          assignmentData: {
            question: 'Выберите все правильные ответы:',
            instructions: 'Отметьте один или несколько вариантов ответа',
            options: [
              { id: 'opt1', text: 'Вариант 1', isCorrect: true },
              { id: 'opt2', text: 'Вариант 2', isCorrect: false },
              { id: 'opt3', text: 'Вариант 3', isCorrect: true },
              { id: 'opt4', text: 'Вариант 4', isCorrect: false }
            ],
            points: 15,
            pointsEnabled: true,
            timeLimit: null,
            showCorrectAnswer: true,
            partialCredit: true
          }
        };
      } else if (tool.id === 'single-select') {
        properties = { 
          ...properties, 
          assignmentType: 'single-select',
          assignmentData: {
            question: 'Выберите один правильный ответ:',
            instructions: 'Отметьте только один вариант ответа',
            options: [
              { id: 'opt1', text: 'Вариант 1', isCorrect: false },
              { id: 'opt2', text: 'Вариант 2', isCorrect: true },
              { id: 'opt3', text: 'Вариант 3', isCorrect: false }
            ],
            points: 10,
            pointsEnabled: true,
            timeLimit: null,
            showCorrectAnswer: true
          }
        };
      } else if (tool.id === 'dropdown-select') {
        properties = { 
          ...properties, 
          assignmentType: 'dropdown-select',
          assignmentData: {
            question: 'Выберите правильный ответ из выпадающего списка:',
            instructions: 'Откройте список и выберите подходящий вариант',
            options: [
              { id: 'opt1', text: 'Выберите ответ...', isCorrect: false, isPlaceholder: true },
              { id: 'opt2', text: 'Вариант 1', isCorrect: false },
              { id: 'opt3', text: 'Правильный ответ', isCorrect: true },
              { id: 'opt4', text: 'Вариант 3', isCorrect: false }
            ],
            points: 8,
            pointsEnabled: true,
            timeLimit: null,
            showCorrectAnswer: true
          }
        };
      } else if (tool.id === 'image-hotspots') {
        properties = { 
          ...properties, 
          assignmentType: 'image-hotspots',
          assignmentData: {
            question: 'Найдите и отметьте элементы на изображении:',
            instructions: 'Нажмите на указанные области изображения',
            imageUrl: 'https://via.placeholder.com/400x300?text=Загрузите+изображение',
            hotspots: [
              { 
                id: 'spot1', 
                x: 100, 
                y: 100, 
                radius: 20, 
                label: 'Элемент 1',
                feedback: 'Правильно! Это элемент 1.',
                isCorrect: true 
              },
              { 
                id: 'spot2', 
                x: 200, 
                y: 150, 
                radius: 25, 
                label: 'Элемент 2',
                feedback: 'Верно! Вы нашли элемент 2.',
                isCorrect: true 
              }
            ],
            points: 20,
            pointsEnabled: true,
            timeLimit: null,
            showCorrectAnswer: true,
            allowMultipleAttempts: true
          }
        };
      } else if (tool.id === 'connect-pairs') {
        properties = { 
          ...properties, 
          assignmentType: 'connect-pairs',
          assignmentData: {
            question: 'Соедините пары элементов:',
            instructions: 'Перетащите элементы из левого столбца к соответствующим элементам в правом столбце',
            leftItems: [
              { id: 'left1', content: 'Понятие 1', type: 'text' },
              { id: 'left2', content: 'Понятие 2', type: 'text' },
              { id: 'left3', content: 'Понятие 3', type: 'text' }
            ],
            rightItems: [
              { id: 'right1', content: 'Определение 1', type: 'text', matchWith: 'left1' },
              { id: 'right2', content: 'Определение 2', type: 'text', matchWith: 'left2' },
              { id: 'right3', content: 'Определение 3', type: 'text', matchWith: 'left3' }
            ],
            connections: [],
            points: 18,
            pointsEnabled: true,
            timeLimit: null,
            showCorrectAnswer: true,
            allowPartialCredit: true
          }
        };
      } else if (tool.id === 'concept-map') {
        properties = { 
          ...properties, 
          assignmentType: 'concept-map',
          assignmentData: {
            question: 'Заполните карту понятий:',
            instructions: 'Добавьте информацию в ячейки и создайте связи между понятиями',
            conceptMap: {
              rows: 3,
              cols: 3,
              cells: [
                { id: 'cell-0-0', row: 0, col: 0, content: 'Основное понятие' },
                { id: 'cell-0-1', row: 0, col: 1, content: 'Связанное понятие 1' },
                { id: 'cell-1-0', row: 1, col: 0, content: 'Связанное понятие 2' }
              ],
              connections: [
                { from: 'cell-0-0', to: 'cell-0-1' },
                { from: 'cell-0-0', to: 'cell-1-0' }
              ]
            },
            points: 25,
            pointsEnabled: true,
            timeLimit: null,
            showCorrectAnswer: true
          }
        };
      } else if (tool.id === 'drag-to-point') {
        properties = { 
          ...properties, 
          assignmentType: 'drag-to-point',
          assignmentData: {
            question: 'Перетащите элементы в правильные области:',
            instructions: 'Переместите каждый элемент в соответствующую зону',
            dragItems: [
              { id: 'item1', content: 'Элемент 1' },
              { id: 'item2', content: 'Элемент 2' },
              { id: 'item3', content: 'Элемент 3' }
            ],
            dropZones: [
              { id: 'zone1', label: 'Зона 1', correctAnswer: 'item1' },
              { id: 'zone2', label: 'Зона 2', correctAnswer: 'item2' },
              { id: 'zone3', label: 'Зона 3', correctAnswer: 'item3' }
            ],
            points: 20,
            pointsEnabled: true,
            timeLimit: null,
            showCorrectAnswer: true
          }
        };
      } else if (tool.id === 'numbers-on-image') {
        properties = { 
          ...properties, 
          assignmentType: 'numbers-on-image',
          assignmentData: {
            question: 'Разместите числа на изображении:',
            instructions: 'Перетащите пронумерованные элементы в правильные места на изображении',
            imageUrl: 'https://via.placeholder.com/400x300?text=Загрузите+изображение',
            options: [
              { id: 'opt1', text: 'Вариант 1' },
              { id: 'opt2', text: 'Вариант 2' },
              { id: 'opt3', text: 'Вариант 3' }
            ],
            numberPoints: [
              { id: 'point1', x: 100, y: 100, label: 'Точка 1', correctAnswer: 'opt1' },
              { id: 'point2', x: 200, y: 150, label: 'Точка 2', correctAnswer: 'opt2' },
              { id: 'point3', x: 150, y: 200, label: 'Точка 3', correctAnswer: 'opt3' }
            ],
            points: 22,
            pointsEnabled: true,
            timeLimit: null,
            showCorrectAnswer: true
          }
        };
      } else if (tool.id === 'grouping') {
        properties = { 
          ...properties, 
          assignmentType: 'grouping',
          assignmentData: {
            question: 'Распределите элементы по группам:',
            instructions: 'Перетащите каждый элемент в правильную группу',
            items: [
              { id: 'item1', content: 'Элемент 1', type: 'text' },
              { id: 'item2', content: 'Элемент 2', type: 'text' },
              { id: 'item3', content: 'Элемент 3', type: 'text' },
              { id: 'item4', content: 'Элемент 4', type: 'text' }
            ],
            groups: [
              { id: 'group1', name: 'Группа 1', correctItems: ['item1', 'item2'] },
              { id: 'group2', name: 'Группа 2', correctItems: ['item3', 'item4'] }
            ],
            points: 18,
            pointsEnabled: true,
            timeLimit: null,
            showCorrectAnswer: true
          }
        };
      } else if (tool.id === 'ordering') {
        properties = { 
          ...properties, 
          assignmentType: 'ordering',
          assignmentData: {
            question: 'Расположите элементы в правильном порядке:',
            instructions: 'Перетащите элементы, чтобы расположить их в правильной последовательности',
            items: [
              { id: 'item1', content: 'Первый элемент', type: 'text' },
              { id: 'item2', content: 'Второй элемент', type: 'text' },
              { id: 'item3', content: 'Третий элемент', type: 'text' },
              { id: 'item4', content: 'Четвертый элемент', type: 'text' }
            ],
            shuffledItems: [
              { id: 'item3', content: 'Третий элемент', type: 'text' },
              { id: 'item1', content: 'Первый элемент', type: 'text' },
              { id: 'item4', content: 'Четвертый элемент', type: 'text' },
              { id: 'item2', content: 'Второй элемент', type: 'text' }
            ],
            points: 16,
            pointsEnabled: true,
            timeLimit: null,
            showCorrectAnswer: true
          }
        };
      } else if (tool.id === 'word-grid') {
        properties = { 
          ...properties, 
          assignmentType: 'word-grid',
          assignmentData: {
            question: 'Найдите слова в сетке:',
            instructions: 'Нажмите на буквы, чтобы выделить скрытые слова',
            gridSize: 10,
            hiddenWords: ['СЛОВО', 'ТЕКСТ', 'ПОИСК'],
            grid: [
              ['С', 'Л', 'О', 'В', 'О', 'Х', 'Я', 'Ю', 'Ф', 'Д'],
              ['Ч', 'Ь', 'Г', 'Ы', 'Ъ', 'Т', 'Е', 'К', 'С', 'Т'],
              ['П', 'О', 'И', 'С', 'К', 'Н', 'Ш', 'Э', 'Ж', 'Б'],
              ['А', 'Р', 'Ы', 'В', 'Ф', 'Ц', 'И', 'Л', 'Щ', 'М'],
              ['Ж', 'Д', 'Е', 'Н', 'Г', 'Й', 'К', 'У', 'Х', 'З']
            ],
            gridWords: [
              { word: 'СЛОВО', startRow: 0, startCol: 0, direction: 'horizontal' },
              { word: 'ТЕКСТ', startRow: 1, startCol: 5, direction: 'horizontal' },
              { word: 'ПОИСК', startRow: 2, startCol: 0, direction: 'horizontal' }
            ],
            points: 15,
            pointsEnabled: true,
            timeLimit: null,
            showCorrectAnswer: true
          }
        };
      } else if (tool.id === 'crossword') {
        properties = { 
          ...properties, 
          assignmentType: 'crossword',
          assignmentData: {
            question: 'Решите кроссворд:',
            instructions: 'Введите ответы в соответствующие клетки',
            crosswordGrid: [
              [{ isBlack: true }, { isBlack: true }, { number: 1, isBlack: false }, { isBlack: false }, { isBlack: false }],
              [{ number: 2, isBlack: false }, { isBlack: false }, { isBlack: false }, { isBlack: false }, { isBlack: true }],
              [{ isBlack: false }, { isBlack: true }, { isBlack: false }, { isBlack: true }, { isBlack: true }],
              [{ isBlack: false }, { isBlack: true }, { isBlack: false }, { isBlack: true }, { isBlack: true }],
              [{ isBlack: false }, { isBlack: true }, { isBlack: false }, { isBlack: true }, { isBlack: true }]
            ],
            crosswordClues: {
              across: [
                { number: 1, clue: 'Вопрос по горизонтали 1', answer: 'СЛОВО' },
                { number: 2, clue: 'Вопрос по горизонтали 2', answer: 'ТЕКСТ' }
              ],
              down: [
                { number: 1, clue: 'Вопрос по вертикали 1', answer: 'СТИХ' },
                { number: 3, clue: 'Вопрос по вертикали 3', answer: 'ОКО' }
              ]
            },
            points: 24,
            pointsEnabled: true,
            timeLimit: null,
            showCorrectAnswer: true
          }
        };
      } else if (tool.id === 'highlight-words') {
        properties = { 
          ...properties, 
          assignmentType: 'highlight-words',
          assignmentData: {
            question: 'Выделите указанные слова в тексте:',
            instructions: 'Нажмите на слова, которые соответствуют заданию',
            textContent: 'Это пример текста для выделения определенных слов. Найдите и выделите ключевые слова в данном тексте.',
            wordsToHighlight: ['пример', 'текста', 'слова', 'ключевые'],
            points: 12,
            pointsEnabled: true,
            timeLimit: null,
            showCorrectAnswer: true
          }
        };
      } else if (tool.id === 'text-editing') {
        properties = { 
          ...properties, 
          assignmentType: 'text-editing',
          assignmentData: {
            question: 'Отредактируйте текст согласно инструкциям:',
            instructions: 'Исправьте грамматические ошибки и улучшите стиль текста',
            originalText: 'Этот текст содержит ошибки которые нужно исправить. Также можно улучшить стиль написания.',
            editingInstructions: 'Исправьте пунктуацию, добавьте запятые где необходимо, улучшите читаемость текста.',
            expectedResult: 'Этот текст содержит ошибки, которые нужно исправить. Также можно улучшить стиль написания.',
            points: 20,
            pointsEnabled: true,
            timeLimit: null,
            showCorrectAnswer: true
          }
        };
      } else if (tool.id === 'text-highlighting') {
        properties = { 
          ...properties, 
          assignmentType: 'text-highlighting',
          assignmentData: {
            question: 'Выделите важные части текста:',
            instructions: 'Нажмите на слова или фразы, которые являются ключевыми для понимания текста',
            textContent: 'Важная информация часто скрыта в тексте среди второстепенных деталей. Умение выделять главное - это ключевой навык для эффективного чтения.',
            highlightInstructions: 'Выделите фразы, которые содержат основную мысль текста',
            correctHighlights: ['Важная информация', 'ключевой навык', 'выделять главное'],
            points: 15,
            pointsEnabled: true,
            timeLimit: null,
            showCorrectAnswer: true
          }
        };
      } else if (tool.id === 'hint') {
        properties = { 
          ...properties, 
          assignmentType: 'hint',
          assignmentData: {
            question: 'Подсказка',
            instructions: 'Нажмите кнопку, чтобы получить подсказку',
            hintText: 'Это подсказка, которая поможет вам в решении задачи. Используйте её мудро!',
            showHint: false,
            followUpQuestion: 'Как вы используете полученную подсказку для решения задачи?',
            points: 5,
            pointsEnabled: true,
            timeLimit: null,
            showCorrectAnswer: false
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
            page: 1, // All elements on single infinite page
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
    
    // Presence update removed - collaboration moved to book content page
  }, [isInitialized]);

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
          page: 1, // All elements on single infinite page
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
  
  // Add section-related state (moved here to fix hooks order)
  const [bookSections, setBookSections] = useState<any[]>([]);
  const [sectionError, setSectionError] = useState<string | null>(null);

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
  
  // toggleToolPanel removed - panels moved to top toolbar
  
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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        sensors={sensors}
      >
        {/* Top Toolbar */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
          {/* First Row - Navigation and Title */}
          <div className="flex items-center justify-between p-2 px-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              {sectionId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mr-2"
                  onClick={() => window.location.href = `/dashboard/books/${bookBaseUrl}/content`}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  К структуре
                </Button>
              )}
              
              <div className="mr-2">
                {isEditingTitle ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleUpdateTitle();
                    }}
                    className="flex items-center"
                  >
                    <Input
                      type="text"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      autoFocus
                      className="w-64"
                      onBlur={handleUpdateTitle}
                    />
                  </form>
                ) : (
                  <h1
                    className="text-xl font-semibold cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => setIsEditingTitle(true)}
                    title="Нажмите, чтобы отредактировать заголовок"
                  >
                    {book?.title || 'Untitled Book'}
                  </h1>
                )}
              </div>
            </div>
            
            {/* Action buttons */}
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

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCalculatorOpen(true)}
                title="Открыть калькулятор"
                className="ml-1"
              >
                <Calculator className="h-4 w-4 mr-1" />
                Калькулятор
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

          {/* Second Row - Tool Categories */}
          <div className="flex items-center gap-1 p-2 px-4 bg-gray-50 dark:bg-gray-900">
            {TOOL_CATEGORIES.map(category => (
              <button
                key={category.id}
                className={`px-3 py-1 rounded-md flex items-center gap-1 text-xs ${
                  activeCategory === category.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                onClick={() => {
                  setActiveCategory(category.id);
                  setSelectedElementId(null); // Close properties panel when switching categories
                }}
              >
                {category.icon && <category.icon className="h-4 w-4" />}
                {category.label}
              </button>
            ))}
          </div>

          {/* Third Row - Tool Items OR Properties (full width) */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            {selectedElement ? (
              /* Properties Panel - Full width when element is selected */
              <PropertiesPanel
                selectedElement={selectedElement}
                onUpdate={(updates) => {
                  if (selectedElementId) {
                    updateElement(selectedElementId, updates);
                  }
                }}
                onClose={() => setSelectedElementId(null)}
              />
            ) : (
              /* Tools Section - Shows when no element is selected */
              <div className="flex items-center gap-1 p-2 px-4 overflow-x-auto bg-gray-25 dark:bg-gray-850">
                <DndContext 
                  sensors={sensors} 
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                >
                  {TOOLS.filter(tool => tool.category === activeCategory).map(tool => (
                    <div key={tool.id} className="flex-shrink-0">
                      <DraggableTool 
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
                    </div>
                  ))}
                  
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
            )}
          </div>
        </div>

        {/* Main editor area - Full width canvas */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Section error message */}
          {sectionError && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{sectionError}</p>
                  <p className="mt-2 text-sm text-red-600">
                    <a 
                      href={`/dashboard/books/${bookBaseUrl}/content`}
                      className="font-medium underline hover:text-red-500"
                    >
                      Перейти к настройке содержания →
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Canvas - Infinite Scroll Full Width */}
          <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800">
            <DndContext 
              sensors={sensors} 
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
            >
              <CanvasDropZone settings={canvasSettings} showGrid={canvasSettings.showGrid}>
                <div 
                  className="w-full min-h-screen relative p-8"
                  style={{
                    backgroundColor: canvasSettings.backgroundColor || '#ffffff',
                  }}
                  onClick={(e) => {
                    // Если клик по самому холсту (не по элементу), снимаем выделение и завершаем редактирование
                    if (e.target === e.currentTarget) {
                      setSelectedElementId(null);
                      setEditingElementId(null);
                    }
                  }}
                >
                {currentPageElements.map(element => {
                  // Element lock check removed - collaboration moved to book content page
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
                    onEdit={(editing: boolean) => {
                      // Element editing - collaboration features removed
                      if (editing) {
                        setEditingElementId(element.id);
                      } else {
                        setEditingElementId(null);
                      }
                    }}
                      canvasSettings={canvasSettings}
                      onDelete={() => deleteElement(element.id)}
                      onOpenMetadataEditor={handleOpenMetadataEditor}
                      bookBaseUrl={bookBaseUrl} // Pass the book's base_url to CanvasElementComponent
                      />
                      
                      {/* Lock indicator removed - collaboration moved to book content page */}
                    </div>
                  );
                })}
                </div>
              </CanvasDropZone>
            </DndContext>
          </div>
        </div>
      </DndContext>

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

      {/* Enhanced Calculator */}
      <EnhancedCalculator
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />
    </div>
  );
} 
