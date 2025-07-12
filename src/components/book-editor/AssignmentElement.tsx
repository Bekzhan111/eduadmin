import React from 'react';
import { Star, Check, X, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { CanvasElement } from './types';
import { saveAssignmentToDatabase, validateAssignmentData } from '../../utils/assignments';
import { useRouter } from 'next/navigation';

type AssignmentElementProps = {
  element: CanvasElement;
  isEditing: boolean;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  bookBaseUrl?: string; // Changed from bookId to bookBaseUrl for saving to database
};

export function AssignmentElement({ element, isEditing, onUpdate, bookBaseUrl }: AssignmentElementProps) {
  // Debug logging for bookBaseUrl
  console.log('AssignmentElement received bookBaseUrl:', bookBaseUrl);
  
  // Компонент звездной шкалы для уровня сложности
  const StarRating = ({ 
    rating, 
    onRatingChange, 
    readonly = false, 
    size = 16 
  }: {
    rating: number;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
    size?: number;
  }) => {
    const [hoveredStar, setHoveredStar] = React.useState<number | null>(null);

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={`cursor-pointer transition-colors ${
              star <= (hoveredStar || rating)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            } ${readonly ? 'cursor-default' : 'hover:text-yellow-400'}`}
            onClick={() => !readonly && onRatingChange?.(star as number)}
            onMouseEnter={() => !readonly && setHoveredStar(star)}
            onMouseLeave={() => !readonly && setHoveredStar(null)}
          />
        ))}
      </div>
    );
  };

  const [isExpanded, setIsExpanded] = React.useState(true);
  const [studentAnswers, setStudentAnswers] = React.useState<Record<string, any>>({});
  const [showCorrectAnswers, setShowCorrectAnswers] = React.useState(false);

  const assignmentType = element.properties?.assignmentType;
  const assignmentData = element.properties?.assignmentData;

  if (!assignmentType || !assignmentData) {
    return (
      <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg">
        <p className="text-gray-500">Настройте задание в панели свойств</p>
      </div>
    );
  }

  const renderMultipleChoice = () => {
    if (!assignmentData.options) return null;

    return (
      <div className="space-y-2">
        {assignmentData.options.map((option, _index) => (
          <div key={option.id} className="flex items-center space-x-2">
            <input
              type="radio"
              name={`question-${element.id}`}
              id={`option-${option.id}`}
              disabled={!isEditing}
              checked={studentAnswers[element.id] === option.id}
              onChange={() => {
                if (isEditing) {
                  setStudentAnswers(prev => ({
                    ...prev,
                    [element.id]: option.id
                  }));
                }
              }}
              className="w-4 h-4"
            />
            <label 
              htmlFor={`option-${option.id}`} 
              className={`flex-1 cursor-pointer ${
                showCorrectAnswers && option.isCorrect ? 'text-green-600 font-semibold' : ''
              } ${
                showCorrectAnswers && !option.isCorrect && studentAnswers[element.id] === option.id 
                  ? 'text-red-600' : ''
              }`}
            >
              {option.text}
              {showCorrectAnswers && option.isCorrect && (
                <Check className="inline w-4 h-4 ml-2 text-green-600" />
              )}
              {showCorrectAnswers && !option.isCorrect && studentAnswers[element.id] === option.id && (
                <X className="inline w-4 h-4 ml-2 text-red-600" />
              )}
            </label>
          </div>
        ))}
      </div>
    );
  };

  const renderTrueFalse = () => {
    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            name={`tf-${element.id}`}
            id={`true-${element.id}`}
            disabled={!isEditing}
            checked={studentAnswers[element.id] === true}
            onChange={() => {
              if (isEditing) {
                setStudentAnswers(prev => ({
                  ...prev,
                  [element.id]: true
                }));
              }
            }}
            className="w-4 h-4"
          />
          <label 
            htmlFor={`true-${element.id}`} 
            className={`cursor-pointer ${
              showCorrectAnswers && assignmentData.correctAnswer === true ? 'text-green-600 font-semibold' : ''
            } ${
              showCorrectAnswers && assignmentData.correctAnswer !== true && studentAnswers[element.id] === true 
                ? 'text-red-600' : ''
            }`}
          >
            Верно
            {showCorrectAnswers && assignmentData.correctAnswer === true && (
              <Check className="inline w-4 h-4 ml-2 text-green-600" />
            )}
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            name={`tf-${element.id}`}
            id={`false-${element.id}`}
            disabled={!isEditing}
            checked={studentAnswers[element.id] === false}
            onChange={() => {
              if (isEditing) {
                setStudentAnswers(prev => ({
                  ...prev,
                  [element.id]: false
                }));
              }
            }}
            className="w-4 h-4"
          />
          <label 
            htmlFor={`false-${element.id}`} 
            className={`cursor-pointer ${
              showCorrectAnswers && assignmentData.correctAnswer === false ? 'text-green-600 font-semibold' : ''
            } ${
              showCorrectAnswers && assignmentData.correctAnswer !== false && studentAnswers[element.id] === false 
                ? 'text-red-600' : ''
            }`}
          >
            Неверно
            {showCorrectAnswers && assignmentData.correctAnswer === false && (
              <Check className="inline w-4 h-4 ml-2 text-green-600" />
            )}
          </label>
        </div>
      </div>
    );
  };

  const renderOpenQuestion = () => {
    const textareaHeight = assignmentData.answerLength === 'short' ? '80px' : 
                          assignmentData.answerLength === 'medium' ? '120px' : '200px';

    return (
      <div className="space-y-2">
        <textarea
          placeholder="Введите ваш ответ..."
          disabled={!isEditing}
          value={studentAnswers[element.id] || ''}
          onChange={(e) => {
            if (isEditing) {
              setStudentAnswers(prev => ({
                ...prev,
                [element.id]: e.target.value
              }));
            }
          }}
          className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ height: textareaHeight }}
        />
        {showCorrectAnswers && assignmentData.expectedAnswer && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-700">
              <strong>Ожидаемый ответ:</strong> {assignmentData.expectedAnswer}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderMatching = () => {
    if (!assignmentData.leftItems || !assignmentData.rightItems) return null;

    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Левый столбец</h4>
          {assignmentData.leftItems.map((item) => (
            <div key={item.id} className="p-2 border rounded bg-gray-50">
              {item.content}
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Правый столбец</h4>
          {assignmentData.rightItems.map((item) => (
            <div 
              key={item.id} 
              className={`p-2 border rounded cursor-pointer ${
                studentAnswers[item.matchWith] === item.id ? 'bg-blue-100 border-blue-300' : 'bg-gray-50'
              } ${
                showCorrectAnswers && item.matchWith && studentAnswers[item.matchWith] === item.id 
                  ? 'bg-green-100 border-green-300' : ''
              }`}
              onClick={() => {
                if (isEditing && item.matchWith) {
                  setStudentAnswers(prev => ({
                    ...prev,
                    [item.matchWith]: item.id
                  }));
                }
              }}
            >
              {item.content}
              {showCorrectAnswers && item.matchWith && studentAnswers[item.matchWith] === item.id && (
                <Check className="inline w-4 h-4 ml-2 text-green-600" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderQuiz = () => {
    if (!assignmentData.quizQuestions) return null;

    return (
      <div className="space-y-4">
        {assignmentData.quizQuestions.map((question, index) => (
          <div key={question.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold">
                {index + 1}. {question.question}
              </h4>
              {question.points && (
                <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {question.points} баллов
                </span>
              )}
            </div>
            
            {question.type === 'multiple-choice' && question.options && (
              <div className="space-y-2 mt-3">
                {question.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`quiz-${question.id}`}
                      disabled={!isEditing}
                      checked={studentAnswers[question.id] === option.id}
                      onChange={() => {
                        if (isEditing) {
                          setStudentAnswers(prev => ({
                            ...prev,
                            [question.id]: option.id
                          }));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <label className={`cursor-pointer ${
                      showCorrectAnswers && option.isCorrect ? 'text-green-600 font-semibold' : ''
                    }`}>
                      {option.text}
                    </label>
                  </div>
                ))}
              </div>
            )}
            
            {question.type === 'true-false' && (
              <div className="space-y-2 mt-3">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`quiz-tf-${question.id}`}
                      disabled={!isEditing}
                      checked={studentAnswers[question.id] === true}
                      onChange={() => {
                        if (isEditing) {
                          setStudentAnswers(prev => ({
                            ...prev,
                            [question.id]: true
                          }));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span>Верно</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`quiz-tf-${question.id}`}
                      disabled={!isEditing}
                      checked={studentAnswers[question.id] === false}
                      onChange={() => {
                        if (isEditing) {
                          setStudentAnswers(prev => ({
                            ...prev,
                            [question.id]: false
                          }));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span>Неверно</span>
                  </label>
                </div>
              </div>
            )}
            
            {question.type === 'open' && (
              <textarea
                placeholder="Введите ваш ответ..."
                disabled={!isEditing}
                value={studentAnswers[question.id] || ''}
                onChange={(e) => {
                  if (isEditing) {
                    setStudentAnswers(prev => ({
                      ...prev,
                      [question.id]: e.target.value
                    }));
                  }
                }}
                className="w-full mt-3 p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const getAssignmentTitle = () => {
    switch (assignmentType) {
      case 'multiple-choice': return 'Множественный выбор';
      case 'open-question': return 'Открытый вопрос';
      case 'true-false': return 'Верно/Неверно';
      case 'matching': return 'Сопоставление';
      case 'quiz': return 'Викторина';
      // New OPIQ assignment types
      case 'fill-in-blank': return 'Пропуск (запись)';
      case 'multiple-select': return 'Несколько из списка';
      case 'single-select': return 'Один из списка';
      case 'dropdown-select': return 'Раскрывающийся список';
      case 'image-hotspots': return 'Элементы на изображении';
      case 'connect-pairs': return 'Соедините пары';
      default: return 'Задание';
    }
  };

  const renderFillInBlank = () => {
    if (!assignmentData.textWithBlanks || !assignmentData.blanks) return null;

    const text = assignmentData.textWithBlanks;
    const blanks = assignmentData.blanks;
    
    // Split text by underscores and create inputs for blanks
    const parts = text.split('____');
    
    return (
      <div className="space-y-3">
        <div className="text-gray-700 leading-relaxed">
          {parts.map((part, index) => (
            <span key={index}>
              {part}
              {index < blanks.length && (
                <input
                  type="text"
                  className="mx-1 px-2 py-1 border-b-2 border-blue-300 bg-transparent focus:outline-none focus:border-blue-500 min-w-[100px]"
                  placeholder="..."
                  value={studentAnswers[`blank-${index}`] || ''}
                  onChange={(e) => {
                    setStudentAnswers(prev => ({
                      ...prev,
                      [`blank-${index}`]: e.target.value
                    }));
                  }}
                />
              )}
            </span>
          ))}
        </div>
        {showCorrectAnswers && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-700">
              <strong>Правильные ответы:</strong> {assignmentData.correctAnswers?.join(', ')}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderMultipleSelect = () => {
    if (!assignmentData.options) return null;

    return (
      <div className="space-y-2">
        {assignmentData.options.map((option, _index) => (
          <div key={option.id} className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`option-${option.id}`}
              checked={(studentAnswers[element.id] || []).includes(option.id)}
              onChange={(e) => {
                const currentAnswers = studentAnswers[element.id] || [];
                let newAnswers;
                if (e.target.checked) {
                  newAnswers = [...currentAnswers, option.id];
                } else {
                  newAnswers = currentAnswers.filter(id => id !== option.id);
                }
                setStudentAnswers(prev => ({
                  ...prev,
                  [element.id]: newAnswers
                }));
              }}
              className="w-4 h-4"
            />
            <label 
              htmlFor={`option-${option.id}`} 
              className={`flex-1 cursor-pointer ${
                showCorrectAnswers && option.isCorrect ? 'text-green-600 font-semibold' : ''
              }`}
            >
              {option.text}
              {showCorrectAnswers && option.isCorrect && (
                <Check className="inline w-4 h-4 ml-2 text-green-600" />
              )}
            </label>
          </div>
        ))}
      </div>
    );
  };

  const renderSingleSelect = () => {
    if (!assignmentData.options) return null;

    return (
      <div className="space-y-2">
        {assignmentData.options.map((option, _index) => (
          <div key={option.id} className="flex items-center space-x-2">
            <input
              type="radio"
              name={`single-select-${element.id}`}
              id={`option-${option.id}`}
              checked={studentAnswers[element.id] === option.id}
              onChange={() => {
                setStudentAnswers(prev => ({
                  ...prev,
                  [element.id]: option.id
                }));
              }}
              className="w-4 h-4"
            />
            <label 
              htmlFor={`option-${option.id}`} 
              className={`flex-1 cursor-pointer ${
                showCorrectAnswers && option.isCorrect ? 'text-green-600 font-semibold' : ''
              }`}
            >
              {option.text}
              {showCorrectAnswers && option.isCorrect && (
                <Check className="inline w-4 h-4 ml-2 text-green-600" />
              )}
            </label>
          </div>
        ))}
      </div>
    );
  };

  const renderDropdownSelect = () => {
    if (!assignmentData.options) return null;

    return (
      <div className="space-y-2">
        <select
          value={studentAnswers[element.id] || ''}
          onChange={(e) => {
            setStudentAnswers(prev => ({
              ...prev,
              [element.id]: e.target.value
            }));
          }}
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {assignmentData.options.map((option) => (
            <option 
              key={option.id} 
              value={option.isPlaceholder ? '' : option.id}
              disabled={option.isPlaceholder}
            >
              {option.text}
            </option>
          ))}
        </select>
        {showCorrectAnswers && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-700">
              <strong>Правильный ответ:</strong> {assignmentData.options?.find(opt => opt.isCorrect)?.text}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderImageHotspots = () => {
    if (!assignmentData.hotspots) return null;

    return (
      <div className="space-y-3">
        <div className="relative bg-gray-100 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
          {assignmentData.imageUrl ? (
            <div className="relative">
              <img 
                src={assignmentData.imageUrl} 
                alt="Interactive" 
                className="max-w-full max-h-[300px] object-contain"
              />
              {assignmentData.hotspots.map((hotspot) => (
                <button
                  key={hotspot.id}
                  className={`absolute w-6 h-6 rounded-full border-2 ${
                    (studentAnswers[hotspot.id] || false) 
                      ? 'bg-blue-500 border-blue-600' 
                      : 'bg-red-400 border-red-500 hover:bg-red-500'
                  } transition-colors`}
                  style={{
                    left: `${hotspot.x}px`,
                    top: `${hotspot.y}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  onClick={() => {
                    setStudentAnswers(prev => ({
                      ...prev,
                      [hotspot.id]: !prev[hotspot.id]
                    }));
                  }}
                  title={hotspot.label}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p>Загрузите изображение для интерактивного задания</p>
            </div>
          )}
        </div>
        {showCorrectAnswers && (
          <div className="space-y-1">
            {assignmentData.hotspots.map((hotspot) => (
              <div key={hotspot.id} className="text-sm text-green-700">
                <strong>{hotspot.label}:</strong> {hotspot.feedback}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderConnectPairs = () => {
    if (!assignmentData.leftItems || !assignmentData.rightItems) return null;

    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">Перетащите элементы из левого столбца к соответствующим в правом</p>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-gray-700">Понятия</h4>
            {assignmentData.leftItems.map((item) => (
              <div 
                key={item.id} 
                className="p-3 border-2 border-dashed border-gray-300 rounded-lg bg-blue-50 cursor-grab hover:bg-blue-100 transition-colors"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', item.id);
                }}
              >
                {item.content}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-gray-700">Определения</h4>
            {assignmentData.rightItems.map((item) => (
              <div 
                key={item.id} 
                className={`p-3 border-2 rounded-lg min-h-[50px] transition-colors ${
                  studentAnswers[item.id] 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                }`}
                onDrop={(e) => {
                  e.preventDefault();
                  const draggedId = e.dataTransfer.getData('text/plain');
                  setStudentAnswers(prev => ({
                    ...prev,
                    [item.id]: draggedId
                  }));
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                {item.content}
                {studentAnswers[item.id] && (
                  <div className="mt-2 p-2 bg-blue-100 border border-blue-200 rounded">
                    Соединено с: {assignmentData.leftItems.find(left => left.id === studentAnswers[item.id])?.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        {showCorrectAnswers && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-700 font-semibold mb-2">Правильные соединения:</p>
            {assignmentData.rightItems.map((item) => (
              <div key={item.id} className="text-sm text-green-600">
                {item.content} ↔ {assignmentData.leftItems.find(left => left.id === item.matchWith)?.content}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderAssignmentContent = () => {
    switch (assignmentType) {
      case 'multiple-choice': return renderMultipleChoice();
      case 'open-question': return renderOpenQuestion();
      case 'true-false': return renderTrueFalse();
      case 'matching': return renderMatching();
      case 'quiz': return renderQuiz();
      // New OPIQ assignment types
      case 'fill-in-blank': return renderFillInBlank();
      case 'multiple-select': return renderMultipleSelect();
      case 'single-select': return renderSingleSelect();
      case 'dropdown-select': return renderDropdownSelect();
      case 'image-hotspots': return renderImageHotspots();
      case 'connect-pairs': return renderConnectPairs();
      default: return (
        <div className="text-center text-gray-500 py-8">
          <p>Неподдерживаемый тип задания: {assignmentType}</p>
          <p className="text-sm mt-1">Пожалуйста, настройте задание в панели свойств</p>
        </div>
      );
    }
  };

  const handleSave = async () => {
    console.log('handleSave called with bookBaseUrl:', bookBaseUrl);
    console.log('Element ID:', element.id);
    console.log('Assignment type:', assignmentType);
    console.log('Assignment data:', assignmentData);
    
    if (!bookBaseUrl) {
      console.error('Error: bookBaseUrl is missing');
      alert('Ошибка: Не удалось определить URL книги. Пожалуйста, попробуйте перезагрузить страницу.');
      return;
    }
    
    if (!assignmentData) {
      console.error('Error: assignmentData is missing');
      alert('Ошибка: Данные задания отсутствуют. Пожалуйста, настройте задание в панели свойств.');
      return;
    }

    const isValid = validateAssignmentData(assignmentData);
    if (!isValid) {
      console.error('Некорректные данные задания');
      alert('Ошибка: Некорректные данные задания. Пожалуйста, проверьте настройки задания.');
      return;
    }

    try {
      const response = await saveAssignmentToDatabase(
        bookBaseUrl, 
        element.id, 
        assignmentType || 'multiple-choice', 
        assignmentData
      );
      
      if (response.success) {
        console.log('Задание успешно сохранено');
        alert('Задание успешно сохранено!');
      } else {
        console.error('Ошибка при сохранении задания:', response.error);
        alert(`Ошибка при сохранении: ${response.error}`);
      }
    } catch (error) {
      console.error('Exception during assignment save:', error);
      alert(`Произошла ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  // Validate user answers and show results
  const validateAnswers = () => {
    let isCorrect = false;
    let feedback = '';

    switch (assignmentType) {
      case 'multiple-choice':
        const selectedOption = assignmentData.options?.find(opt => opt.id === studentAnswers[element.id]);
        isCorrect = selectedOption?.isCorrect || false;
        feedback = isCorrect ? 'Правильно!' : 'Неправильно. ';
        if (!isCorrect && assignmentData.showCorrectAnswer) {
          const correctOption = assignmentData.options?.find(opt => opt.isCorrect);
          feedback += `Правильный ответ: ${correctOption?.text}`;
        }
        break;
        
      case 'true-false':
        isCorrect = studentAnswers[element.id] === assignmentData.correctAnswer;
        feedback = isCorrect ? 'Правильно!' : `Неправильно. Правильный ответ: ${assignmentData.correctAnswer ? 'Верно' : 'Неверно'}`;
        break;
        
      case 'open-question':
        // For open questions, we can't automatically validate, but we can show expected answer
        feedback = 'Ответ отправлен на проверку.';
        if (assignmentData.expectedAnswer && assignmentData.showCorrectAnswer) {
          feedback += ` Ожидаемый ответ: ${assignmentData.expectedAnswer}`;
        }
        break;

      // New OPIQ assignment types validation
      case 'fill-in-blank':
        let correctBlanks = 0;
        const totalBlanks = assignmentData.blanks?.length || 0;
        assignmentData.blanks?.forEach((blank, index) => {
          const userAnswer = studentAnswers[`blank-${index}`]?.toLowerCase().trim();
          const correctAnswer = blank.answer.toLowerCase().trim();
          if (!blank.caseSensitive ? userAnswer === correctAnswer : studentAnswers[`blank-${index}`]?.trim() === blank.answer.trim()) {
            correctBlanks++;
          }
        });
        isCorrect = correctBlanks === totalBlanks;
        feedback = isCorrect ? 'Все пропуски заполнены правильно!' : `Правильно заполнено ${correctBlanks} из ${totalBlanks} пропусков.`;
        break;

      case 'multiple-select':
        const selectedAnswers = studentAnswers[element.id] || [];
        const correctAnswers = assignmentData.options?.filter(opt => opt.isCorrect).map(opt => opt.id) || [];
        isCorrect = selectedAnswers.length === correctAnswers.length && 
                   selectedAnswers.every(id => correctAnswers.includes(id));
        feedback = isCorrect ? 'Правильно!' : 'Не все правильные ответы выбраны.';
        break;

      case 'single-select':
        const selectedSingle = assignmentData.options?.find(opt => opt.id === studentAnswers[element.id]);
        isCorrect = selectedSingle?.isCorrect || false;
        feedback = isCorrect ? 'Правильно!' : 'Неправильный ответ.';
        break;

      case 'dropdown-select':
        const selectedDropdown = assignmentData.options?.find(opt => opt.id === studentAnswers[element.id]);
        isCorrect = selectedDropdown?.isCorrect || false;
        feedback = isCorrect ? 'Правильно!' : 'Неправильный ответ.';
        break;

      case 'image-hotspots':
        const correctHotspots = assignmentData.hotspots?.filter(spot => spot.isCorrect).length || 0;
        const selectedHotspots = assignmentData.hotspots?.filter(spot => studentAnswers[spot.id]).length || 0;
        isCorrect = selectedHotspots === correctHotspots && 
                   assignmentData.hotspots?.every(spot => spot.isCorrect ? studentAnswers[spot.id] : !studentAnswers[spot.id]);
        feedback = isCorrect ? 'Все элементы найдены правильно!' : `Найдено ${selectedHotspots} из ${correctHotspots} элементов.`;
        break;

      case 'connect-pairs':
        let correctConnections = 0;
        const totalConnections = assignmentData.rightItems?.length || 0;
        assignmentData.rightItems?.forEach((rightItem) => {
          if (studentAnswers[rightItem.id] === rightItem.matchWith) {
            correctConnections++;
          }
        });
        isCorrect = correctConnections === totalConnections;
        feedback = isCorrect ? 'Все пары соединены правильно!' : `Правильно соединено ${correctConnections} из ${totalConnections} пар.`;
        break;
        
      default:
        feedback = 'Ответ отправлен.';
    }

    return { isCorrect, feedback };
  };

  return (
    <div 
      className={`border rounded-lg bg-white shadow-sm`}
      style={{
        width: element.width,
        height: element.height,
        minHeight: '200px'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-lg">{getAssignmentTitle()}</h3>
          {assignmentData.difficultyLevel && (
            <div className="flex items-center gap-1">
              <StarRating 
                rating={assignmentData.difficultyLevel} 
                readonly={true} 
                size={14} 
              />
            </div>
          )}
          {assignmentData.points && (
            <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
              {assignmentData.points} баллов
            </span>
          )}
          {assignmentData.timeLimit && (
            <span className="text-sm bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
              {assignmentData.timeLimit} мин
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {isEditing && assignmentData.showCorrectAnswer && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCorrectAnswers(!showCorrectAnswers);
              }}
              className="text-sm px-2 py-1 rounded hover:bg-gray-200"
            >
              {showCorrectAnswers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
          <ChevronDown 
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          />
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4">
          {/* Question */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">{assignmentData.question}</h4>
            {assignmentData.instructions && (
              <p className="text-sm text-gray-600 mb-3">{assignmentData.instructions}</p>
            )}
          </div>

          {/* Assignment specific content */}
          {renderAssignmentContent()}

          {/* Submit button for student mode */}
          {isEditing && (
            <div className="mt-4 pt-4 border-t">
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" 
                onClick={() => {
                  const validation = validateAnswers();
                  alert(validation.feedback);
                  
                  // If this is for saving to database (when bookBaseUrl is available), also save
                  if (bookBaseUrl) {
                    handleSave();
                  }
                }}
              >
                Отправить ответ
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
