import { createClient } from './supabase';

// Create Supabase client for assignment operations
const supabase = createClient();

export type AssignmentData = {
  question: string;
  instructions?: string;
  // Multiple choice specific
  options?: Array<{
    id: string;
    text: string;
    isCorrect?: boolean;
  }>;
  // True/False specific
  correctAnswer?: boolean;
  // Matching specific
  leftItems?: Array<{
    id: string;
    content: string;
  }>;
  rightItems?: Array<{
    id: string;
    content: string;
    matchWith: string;
  }>;
  // Open question specific
  expectedAnswer?: string;
  answerLength?: 'short' | 'medium' | 'long';
  // Quiz specific
  quizQuestions?: Array<{
    id: string;
    question: string;
    type: 'multiple-choice' | 'true-false' | 'open';
    options?: Array<{
      id: string;
      text: string;
      isCorrect?: boolean;
    }>;
    correctAnswer?: boolean | string;
    points?: number;
  }>;
  // General settings
  points?: number;
  timeLimit?: number;
  allowRetries?: boolean;
  showCorrectAnswer?: boolean;
  shuffleOptions?: boolean;
  difficultyLevel?: 1 | 2 | 3 | 4 | 5;
};

export type Assignment = {
  id: string;
  type: 'multiple-choice' | 'open-question' | 'true-false' | 'matching' | 'quiz';
  data: AssignmentData;
  bookId: string;
  elementId: string;
  createdAt: string;
  updatedAt: string;
};

// Validate assignment data structure
export function validateAssignmentData(data: any): data is AssignmentData {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  if (!data.question || typeof data.question !== 'string') {
    return false;
  }
  
  return true;
}

// Save assignment to database by updating the book's canvas elements
export async function saveAssignmentToDatabase(
  bookBaseUrl: string,
  elementId: string,
  assignmentType: string,
  assignmentData: AssignmentData
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Saving assignment to database...');
    console.log('Book base URL:', bookBaseUrl);
    console.log('Element ID:', elementId);
    console.log('Assignment type:', assignmentType);
    
    // Get current book data
    const { data: book, error: fetchError } = await supabase
      .from('books')
      .select('id, title, canvas_elements, author_id')
      .eq('base_url', bookBaseUrl)
      .single();

    if (fetchError) {
      console.error('Error fetching book:', fetchError);
      return {
        success: false,
        error: `Failed to fetch book: ${fetchError.message}`
      };
    }

    if (!book) {
      console.error('Book not found with base_url:', bookBaseUrl);
      return {
        success: false,
        error: `Book not found with base_url: ${bookBaseUrl}`
      };
    }

    // Check if user has permission to modify this book
    const { data: userProfile } = await supabase.auth.getUser();
    if (!userProfile?.user) {
      console.error('User not authenticated');
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // Only allow author or admin to modify the book
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', userProfile.user.id)
      .single();

    if (book.author_id !== userProfile.user.id && userData?.role !== 'admin' && userData?.role !== 'super_admin') {
      console.error('Permission denied: User is not the author or admin');
      return {
        success: false,
        error: 'Permission denied: You are not the author of this book'
      };
    }

    console.log('Permission check passed - user can modify book');
    console.log('Found book:', book.id, book.title);

    // Parse current canvas elements
    let canvasElements = [];
    if (book.canvas_elements) {
      try {
        canvasElements = JSON.parse(book.canvas_elements);
        console.log('Parsed canvas elements, count:', canvasElements.length);
      } catch (parseError) {
        console.error('Error parsing canvas elements:', parseError);
        canvasElements = [];
      }
    } else {
      console.log('No canvas elements found, creating empty array');
    }

    // Find and update the assignment element
    const elementIndex = canvasElements.findIndex((el: any) => el.id === elementId);
    console.log('Looking for element with ID:', elementId);
    console.log('Found element at index:', elementIndex);
    
    if (elementIndex === -1) {
      console.log('Assignment element not found with exact ID match - trying fallback methods');
      console.log('Available element IDs:', canvasElements.map((el: any) => el.id).join(', '));
      console.log('Available element types:', canvasElements.map((el: any) => el.type).join(', '));
      
      // First try to find any element with matching ID
      const exactIdMatch = canvasElements.find((el: any) => el.id === elementId);
      if (exactIdMatch) {
        console.log('Found element with exact ID match, but it might not be an assignment type');
        // Use this element anyway
        const matchIndex = canvasElements.findIndex((el: any) => el.id === exactIdMatch.id);
        
        // Update the element type to assignment if it's not already
        canvasElements[matchIndex] = {
          ...canvasElements[matchIndex],
          type: 'assignment',
          properties: {
            ...canvasElements[matchIndex].properties,
            assignmentType,
            assignmentData
          }
        };
        
        console.log('Updated element to assignment type:', canvasElements[matchIndex]);
        
        // Save back to database
        const { error: updateError } = await supabase
          .from('books')
          .update({
            canvas_elements: JSON.stringify(canvasElements),
            updated_at: new Date().toISOString()
          })
          .eq('id', book.id);
          
        if (updateError) {
          console.error('Database update error:', updateError);
          return {
            success: false,
            error: `Failed to save assignment: ${updateError.message}`
          };
        }
        
        console.log('Assignment saved successfully using exact ID match');
        return { success: true };
      }
      
      // Try to find by partial match (in case of ID format issues)
      const possibleMatches = canvasElements.filter((el: any) => 
        (el.id && elementId && el.id.includes(elementId.substring(0, 8))) || 
        (elementId && el.id && elementId.includes(el.id.substring(0, 8)))
      );
      
      if (possibleMatches.length > 0) {
        console.log('Found possible matches by partial ID:', 
          possibleMatches.map((el: any) => ({ id: el.id, type: el.type }))
        );
        
        // Try to find an assignment element among the matches
        const assignmentMatch = possibleMatches.find((el: any) => el.type === 'assignment');
        if (assignmentMatch) {
          console.log('Using assignment element with ID:', assignmentMatch.id);
          // Update the element with the matched ID
          const matchIndex = canvasElements.findIndex((el: any) => el.id === assignmentMatch.id);
          
          canvasElements[matchIndex] = {
            ...canvasElements[matchIndex],
            type: 'assignment',
            properties: {
              ...canvasElements[matchIndex].properties,
              assignmentType,
              assignmentData
            }
          };
          
          console.log('Updated element:', canvasElements[matchIndex]);
          
          // Save back to database
          const { error: updateError } = await supabase
            .from('books')
            .update({
              canvas_elements: JSON.stringify(canvasElements),
              updated_at: new Date().toISOString()
            })
            .eq('id', book.id);
            
          if (updateError) {
            console.error('Database update error:', updateError);
            return {
              success: false,
              error: `Failed to save assignment: ${updateError.message}`
            };
          }
          
          console.log('Assignment saved successfully using matched element');
          return { success: true };
        }
        
        // If no assignment type found, use the first match
        if (possibleMatches.length > 0) {
          console.log('No assignment type found in matches, using first match:', possibleMatches[0].id);
          const matchIndex = canvasElements.findIndex((el: any) => el.id === possibleMatches[0].id);
          
          // Convert the element to assignment type
          canvasElements[matchIndex] = {
            ...canvasElements[matchIndex],
            type: 'assignment',
            properties: {
              ...canvasElements[matchIndex].properties,
              assignmentType,
              assignmentData
            }
          };
          
          console.log('Converted element to assignment type:', canvasElements[matchIndex]);
          
          // Save back to database
          const { error: updateError } = await supabase
            .from('books')
            .update({
              canvas_elements: JSON.stringify(canvasElements),
              updated_at: new Date().toISOString()
            })
            .eq('id', book.id);
            
          if (updateError) {
            console.error('Database update error:', updateError);
            return {
              success: false,
              error: `Failed to save assignment: ${updateError.message}`
            };
          }
          
          console.log('Assignment saved successfully using converted element');
          return { success: true };
        }
      }
      
      // If all else fails, create a new assignment element
      console.log('No matching element found, creating new assignment element');
      const newAssignmentElement = {
        id: elementId,
        type: 'assignment' as const,
        x: 100,
        y: 100,
        width: 400,
        height: 300,
        page: 1, // Default to first page
        zIndex: Math.max(0, ...canvasElements.map((el: any) => el.zIndex)) + 1,
        rotation: 0,
        opacity: 1,
        properties: {
          backgroundColor: '#f8f9fa',
          borderColor: '#dee2e6',
          borderWidth: 1,
          borderRadius: 8,
          assignmentType,
          assignmentData
        }
      };
      
      canvasElements.push(newAssignmentElement);
      console.log('Added new assignment element:', newAssignmentElement);
      
      // Save back to database
      const { error: updateError } = await supabase
        .from('books')
        .update({
          canvas_elements: JSON.stringify(canvasElements),
          updated_at: new Date().toISOString()
        })
        .eq('id', book.id);
        
      if (updateError) {
        console.error('Database update error:', updateError);
        return {
          success: false,
          error: `Failed to save assignment: ${updateError.message}`
        };
      }
      
      console.log('Assignment saved successfully using new element');
      return { success: true };
    }

    console.log('Original element:', canvasElements[elementIndex]);

    // Update the assignment element
    canvasElements[elementIndex] = {
      ...canvasElements[elementIndex],
      type: 'assignment',
      properties: {
        ...canvasElements[elementIndex].properties,
        assignmentType,
        assignmentData
      }
    };

    console.log('Updated element:', canvasElements[elementIndex]);

    // Save back to database
    console.log('Saving updated canvas elements back to database');
    const { error: updateError } = await supabase
      .from('books')
      .update({
        canvas_elements: JSON.stringify(canvasElements),
        updated_at: new Date().toISOString()
      })
      .eq('id', book.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      
      // Handle RLS/permission errors during update
      if (updateError.message?.includes('permission denied') || 
          updateError.message?.includes('RLS') ||
          updateError.code === '42501') {
        return {
          success: false,
          error: 'Permission denied: You cannot update this book. Please check your role and permissions.'
        };
      }

      return {
        success: false,
        error: `Failed to save assignment: ${updateError.message}`
      };
    }

    console.log('Assignment saved successfully');
    return { success: true };
  } catch (error) {
    console.error('Error in saveAssignmentToDatabase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Get assignment data from database
export async function getAssignmentFromDatabase(
  bookId: string,
  elementId: string
): Promise<{ success: boolean; data?: AssignmentData; error?: string }> {
  try {
    // Get current book data
    const { data: book, error: fetchError } = await supabase
      .from('books')
      .select('canvas_elements')
      .eq('id', bookId)
      .single();

    if (fetchError) {
      return {
        success: false,
        error: `Failed to fetch book: ${fetchError.message}`
      };
    }

    // Parse current canvas elements
    let canvasElements = [];
    if (book.canvas_elements) {
      try {
        canvasElements = JSON.parse(book.canvas_elements);
      } catch (parseError) {
        console.error('Error parsing canvas elements:', parseError);
        return {
          success: false,
          error: 'Failed to parse canvas elements'
        };
      }
    }

    // Find the assignment element
    const element = canvasElements.find((el: any) => el.id === elementId);
    if (!element || element.type !== 'assignment') {
      return {
        success: false,
        error: 'Assignment element not found'
      };
    }

    const assignmentData = element.properties?.assignmentData;
    if (!validateAssignmentData(assignmentData)) {
      return {
        success: false,
        error: 'Invalid assignment data structure'
      };
    }

    return {
      success: true,
      data: assignmentData
    };
  } catch (error) {
    console.error('Error getting assignment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Create default assignment data for a given type
export function createDefaultAssignmentData(type: string): AssignmentData {
  const baseData = {
    points: 1,
    showCorrectAnswer: true,
    difficultyLevel: 3 as const
  };

  switch (type) {
    case 'multiple-choice':
      return {
        ...baseData,
        question: 'Введите ваш вопрос',
        instructions: 'Выберите один правильный ответ',
        options: [
          { id: `opt-${Date.now()}-1`, text: 'Вариант 1', isCorrect: true },
          { id: `opt-${Date.now()}-2`, text: 'Вариант 2', isCorrect: false },
          { id: `opt-${Date.now()}-3`, text: 'Вариант 3', isCorrect: false },
          { id: `opt-${Date.now()}-4`, text: 'Вариант 4', isCorrect: false }
        ],
        shuffleOptions: false
      };

    case 'true-false':
      return {
        ...baseData,
        question: 'Введите утверждение',
        instructions: 'Определите, верно ли данное утверждение',
        correctAnswer: true
      };

    case 'open-question':
      return {
        ...baseData,
        question: 'Введите ваш вопрос',
        instructions: 'Дайте развернутый ответ',
        expectedAnswer: 'Пример ожидаемого ответа',
        answerLength: 'medium' as const,
        points: 2
      };

    case 'matching':
      return {
        ...baseData,
        question: 'Сопоставьте элементы',
        instructions: 'Соедините элементы из левого и правого столбцов',
        leftItems: [
          { id: `left-${Date.now()}-1`, content: 'Элемент A' },
          { id: `left-${Date.now()}-2`, content: 'Элемент B' }
        ],
        rightItems: [
          { id: `right-${Date.now()}-1`, content: 'Соответствие 1', matchWith: `left-${Date.now()}-1` },
          { id: `right-${Date.now()}-2`, content: 'Соответствие 2', matchWith: `left-${Date.now()}-2` }
        ],
        points: 2
      };

    case 'quiz':
      return {
        ...baseData,
        question: 'Викторина',
        instructions: 'Ответьте на все вопросы',
        quizQuestions: [
          {
            id: `q-${Date.now()}`,
            question: 'Первый вопрос',
            type: 'multiple-choice' as const,
            options: [
              { id: `qopt-${Date.now()}-1`, text: 'Ответ 1', isCorrect: true },
              { id: `qopt-${Date.now()}-2`, text: 'Ответ 2', isCorrect: false }
            ],
            points: 1
          }
        ],
        timeLimit: 10
      };

    default:
      return {
        ...baseData,
        question: 'Введите ваш вопрос',
        instructions: 'Введите инструкции'
      };
  }
} 
