'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookOpen, Plus, Save, ArrowLeft, Edit, List, BookCopy, AlertTriangle, Users, Download, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { BookSection, BookStructure } from '@/components/ui/book-structure';
import { CanvasElement, Book } from '@/components/book-editor/types';
import { BookExportImport } from '@/components/book-editor/BookExportImport';
import { CollaborationPanel } from '@/components/collaboration/CollaborationPanel';
import { CollaborationErrorBoundary } from '@/components/collaboration/CollaborationErrorBoundary';

export default function BookContentPage() {
  const params = useParams();
  const router = useRouter();
  const { userProfile } = useAuth();
  const bookBaseUrl = params?.base_url as string;
  
  // State
  const [book, setBook] = useState<Book | null>(null);
  const [bookSections, setBookSections] = useState<BookSection[]>([]);
  const [originalBookSections, setOriginalBookSections] = useState<BookSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [collaborationPanelOpen, setCollaborationPanelOpen] = useState(false);
  
  // Fetch the book data
  useEffect(() => {
    const fetchBook = async () => {
      if (!bookBaseUrl) return;
      
      setIsLoading(true);
      setError(null);
      
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
          throw new Error('Книга не найдена');
        }
        
        setBook(bookData as Book);
        
        // Load book structure from database or generate default
        let sections: BookSection[] = [];
        
        if (bookData.structure) {
          // If book already has a structure saved, use it
          sections = JSON.parse(bookData.structure);
        } else {
          // Create a default structure based on canvas elements if available
          try {
            if (bookData.canvas_elements) {
              const canvasElements = JSON.parse(bookData.canvas_elements) as CanvasElement[];
              
              // Group elements by page
              const pageGroups: Record<number, CanvasElement[]> = {};
              canvasElements.forEach(element => {
                if (!pageGroups[element.page]) {
                  pageGroups[element.page] = [];
                }
                pageGroups[element.page].push(element);
              });
              
              // Create sections based on pages
              sections = Object.keys(pageGroups).map((page, index) => {
                const pageNumber = Number(page);
                return {
                  id: `page_${pageNumber}`,
                  title: `Страница ${pageNumber}`,
                  type: 'chapter',
                  order: index,
                  isVisible: true,
                  isExpanded: true,
                  pageRef: pageNumber,
                  children: []
                };
              });
            } else {
              // Create an empty default structure
              sections = [{
                id: 'default_chapter',
                title: 'Глава 1',
                type: 'chapter',
                order: 0,
                isVisible: true,
                isExpanded: true,
                children: []
              }];
            }
          } catch (e) {
            console.error('Error parsing canvas elements', e);
            // Fallback to empty structure
            sections = [{
              id: 'default_chapter',
              title: 'Глава 1',
              type: 'chapter',
              order: 0,
              isVisible: true,
              isExpanded: true,
              children: []
            }];
          }
        }
        
        setBookSections(sections);
        setOriginalBookSections(sections);
      } catch (err) {
        console.error('Error fetching book:', err);
        setError(err instanceof Error ? err.message : 'Ошибка загрузки книги');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBook();
  }, [bookBaseUrl]);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(bookSections) !== JSON.stringify(originalBookSections);
    setHasUnsavedChanges(hasChanges);
  }, [bookSections, originalBookSections]);
  
  // Save the book structure to database
  const saveBookStructure = async () => {
    if (!book) {
      setError('Книга не загружена');
      return;
    }
    
    console.log('Saving book structure for book:', { id: book.id, base_url: book.base_url });
    console.log('Book sections to save:', bookSections);
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const supabase = createClient();
      const structureJson = JSON.stringify(bookSections);
      console.log('Structure JSON:', structureJson);
      
      // Check current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Current user:', user?.id);
      console.log('Auth error:', authError);
      
      if (!user) {
        throw new Error('Пользователь не аутентифицирован');
      }
      
      // Since the book was already loaded successfully in the component, we know the user has read access
      // Let's check ownership directly from the book object we already have
      console.log('Book data:', { id: book.id, user_id: book.user_id, base_url: book.base_url });
      console.log('Is user book owner?', book.user_id === user.id);
      
      // Check if user has edit permission
      let hasEditPermission = book.user_id === user.id; // Owner always has permission
      let shouldCreateCollaboratorRecord = false;
      
      if (!hasEditPermission) {
        // Check if user is a collaborator with edit permission
        const { data: collabData, error: collabError } = await supabase
          .from('book_collaborators')
          .select('role, permissions')
          .eq('book_id', book.id)
          .eq('user_id', user.id)
          .single();
          
        console.log('Collaboration check:', { collabData, collabError });
        
        if (collabData && ['owner', 'editor'].includes(collabData.role)) {
          hasEditPermission = true;
        }
      } else {
        // User is owner, but let's check if collaborator record exists
        const { data: ownerCollabData, error: ownerCollabError } = await supabase
          .from('book_collaborators')
          .select('role')
          .eq('book_id', book.id)
          .eq('user_id', user.id)
          .single();
          
        if (ownerCollabError?.code === 'PGRST116') {
          // No collaborator record exists for owner, we should create one
          shouldCreateCollaboratorRecord = true;
        }
      }
      
      if (!hasEditPermission) {
        throw new Error('У вас нет прав на редактирование этой книги');
      }
      
      // Create missing collaborator record for owner if needed
      if (shouldCreateCollaboratorRecord) {
        console.log('Creating missing collaborator record for book owner...');
        const { error: insertError } = await supabase
          .from('book_collaborators')
          .insert({
            book_id: book.id,
            user_id: user.id,
            role: 'owner',
            invited_by: user.id,
            joined_at: new Date().toISOString()
          });
          
        if (insertError) {
          console.warn('Could not create collaborator record:', insertError);
        } else {
          console.log('Created missing collaborator record');
        }
      }
      
      // Update the book structure using raw SQL to handle schema cache issues
      console.log('Attempting to update book structure...');
      
      // First try the standard approach
      const { data, error: updateError } = await supabase
        .from('books')
        .update({ 
          structure: structureJson,
          updated_at: new Date().toISOString()
        })
        .eq('id', book.id)
        .select();
        
      console.log('Supabase update response:', { data, error: updateError });
        
      if (updateError && updateError.message?.includes("'structure' column")) {
        // Fallback to raw SQL if schema cache issue
        console.log('Schema cache issue detected, using raw SQL function...');
        const { error: sqlError } = await supabase.rpc('update_book_structure', {
          book_id: book.id,
          structure_data: structureJson
        });
        
        if (sqlError) {
          console.error('SQL function error:', sqlError);
          throw new Error(`Ошибка при сохранении структуры: ${sqlError.message}`);
        }
        
        console.log('Structure updated successfully using SQL function');
      } else if (updateError) {
        console.error('Supabase update error:', updateError);
        throw new Error(`Ошибка при сохранении структуры: ${updateError.message}`);
      } else if (!data || data.length === 0) {
        throw new Error('Книга не найдена или не обновлена');
      }
      
      setSuccess('Структура книги сохранена');
      setOriginalBookSections([...bookSections]);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Error saving book structure:', err);
      setError(err instanceof Error ? err.message : 'Ошибка сохранения структуры книги');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle section selection and navigation
  const handleSectionSelect = (section: BookSection) => {
    setSelectedSectionId(section.id);
    
    // Only navigate to editor for sections and subsections, not chapters
    if (section.type === 'section' || section.type === 'subsection') {
      const targetUrl = `/dashboard/books/${bookBaseUrl}/edit?section=${section.id}`;
      
      if (hasUnsavedChanges) {
        setPendingNavigation(targetUrl);
        setShowSaveModal(true);
      } else {
        router.push(targetUrl);
      }
    }
  };

  // Handle book sections change with unsaved state
  const handleSectionsChange = (newSections: BookSection[]) => {
    setBookSections(newSections);
  };

  // Modal handlers
  const handleSaveAndNavigate = async () => {
    try {
      await saveBookStructure();
      setShowSaveModal(false);
      if (pendingNavigation) {
        router.push(pendingNavigation);
        setPendingNavigation(null);
      }
    } catch (error) {
      // Error is already handled in saveBookStructure
    }
  };

  const handleDiscardAndNavigate = () => {
    setBookSections([...originalBookSections]);
    setHasUnsavedChanges(false);
    setShowSaveModal(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  const handleCancelNavigation = () => {
    setShowSaveModal(false);
    setPendingNavigation(null);
  };
  
  // Helper function to find a section by ID
  const findSectionById = (id: string, sectionList: BookSection[]): BookSection | null => {
    for (const section of sectionList) {
      if (section.id === id) return section;
      if (section.children) {
        const found = findSectionById(id, section.children);
        if (found) return found;
      }
    }
    return null;
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!book) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Книга не найдена</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Link href="/dashboard/books" passHref>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{book.title}</h1>
        </div>
        
      </div>
      
      {/* Status messages */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4 bg-green-50 text-green-700 border-green-200">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      {/* Book Information with Cover */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Информация о книге
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Book Cover */}
              <div className="lg:col-span-1">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Обложка книги</h3>
                    {book.cover_image ? (
                      <img 
                        src={book.cover_image} 
                        alt={`Обложка книги: ${book.title}`}
                        className="w-full max-w-xs h-auto object-cover rounded-lg border-2 border-gray-200 shadow-md"
                      />
                    ) : (
                      <div className="w-full max-w-xs h-64 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <div className="text-center">
                          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Обложка не установлена</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Book Details */}
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Основная информация</h3>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Название</dt>
                        <dd className="mt-1 text-base font-semibold">{book.title}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Автор</dt>
                        <dd className="mt-1 text-base">{book.author || userProfile?.display_name || 'Неизвестен'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Класс</dt>
                        <dd className="mt-1 text-base">{book.grade_level ? `${book.grade_level} класс` : 'Не указан'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Предмет</dt>
                        <dd className="mt-1 text-base">{book.course || 'Не указан'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Категория</dt>
                        <dd className="mt-1 text-base">{book.category || 'Не указана'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Язык</dt>
                        <dd className="mt-1 text-base">{book.language || 'Не указан'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Статус</dt>
                        <dd className="mt-1 text-base">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            book.status === 'Published' ? 'bg-green-100 text-green-800' :
                            book.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {book.status}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Последнее обновление</dt>
                        <dd className="mt-1 text-base">{new Date(book.updated_at || '').toLocaleString()}</dd>
                      </div>
                    </dl>
                  </div>
                  
                  {/* Description */}
                  {book.description && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Описание</h3>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{book.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Book Structure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookCopy className="h-5 w-5 mr-2" />
              Структура книги
            </CardTitle>
            <CardDescription>
              Управление главами, разделами и подразделами книги
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <BookStructure 
                sections={bookSections}
                onSectionsChange={handleSectionsChange}
                onSectionSelect={handleSectionSelect}
                selectedSectionId={selectedSectionId}
              />
              
              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* Save Button */}
                <Button 
                  variant={hasUnsavedChanges ? "default" : "outline"}
                  onClick={saveBookStructure}
                  disabled={isLoading || !hasUnsavedChanges}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {hasUnsavedChanges ? 'Сохранить изменения' : 'Структура сохранена'}
                </Button>
                
                {/* Book Management Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Export/Import */}
                  {book && (
                    <BookExportImport 
                      book={book} 
                      elements={[]} // Pass empty array since we're at book level, not section level
                      settings={{ zoom: 100, currentPage: 1, showGrid: false, gridSize: 20 }}
                      onImport={() => {}} // Handle import at book level
                    />
                  )}
                  
                  {/* Collaboration Toggle */}
                  <Button
                    variant={collaborationPanelOpen ? "default" : "outline"}
                    onClick={() => setCollaborationPanelOpen(!collaborationPanelOpen)}
                    className="flex items-center justify-center"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Соавторы
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Collaboration Panel */}
        {collaborationPanelOpen && book && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Управление соавторами
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCollaborationPanelOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription>
                Добавляйте и управляйте соавторами книги
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CollaborationErrorBoundary>
                <CollaborationPanel
                  bookId={book.id}
                  className="border-none"
                  userRole={userProfile?.role}
                  isBookAuthor={book.user_id === userProfile?.id}
                />
              </CollaborationErrorBoundary>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Save Confirmation Modal */}
      <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-hidden">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center text-lg font-semibold">
              <AlertTriangle className="h-5 w-5 mr-2 text-amber-500 flex-shrink-0" />
              Несохраненные изменения
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              У вас есть несохраненные изменения в структуре книги. Что вы хотите сделать?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-3 w-full">
              <Button
                variant="default"
                onClick={handleSaveAndNavigate}
                disabled={isLoading}
                className="w-full justify-center"
              >
                <Save className="h-4 w-4 mr-2 flex-shrink-0" />
                Сохранить и продолжить
              </Button>
              
              <div className="flex gap-3 w-full">
                <Button
                  variant="destructive"
                  onClick={handleDiscardAndNavigate}
                  className="flex-1 justify-center"
                >
                  Не сохранять
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelNavigation}
                  className="flex-1 justify-center"
                >
                  Отменить
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
