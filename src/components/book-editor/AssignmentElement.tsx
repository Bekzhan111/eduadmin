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
            <p className="text-sm text-green-700" style={{ color: '#047857' }}>
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
      // Новые типы
      case 'concept-map': return 'Карта понятий';
      case 'drag-to-point': return 'Перетаскивание';
      case 'numbers-on-image': return 'Числа на изображении';
      case 'grouping': return 'Сгруппировать';
      case 'ordering': return 'Упорядочить';
      case 'word-grid': return 'Сетка слов';
      case 'crossword': return 'Кроссворд';
      case 'highlight-words': return 'Выделить слова';
      case 'text-editing': return 'Редактирование текста';
      case 'text-highlighting': return 'Выделение текста';
      case 'hint': return 'Подсказка';
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

  const renderConceptMap = () => {
    if (!assignmentData.conceptMap) return null;

    const { cells, connections } = assignmentData.conceptMap;
    const rows = assignmentData.conceptMap.rows || 3;
    const cols = assignmentData.conceptMap.cols || 3;

    return (
      <div className="space-y-4">
        <div className="relative bg-gray-50 p-4 rounded-lg">
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            {connections?.map((connection, index) => {
              const fromCell = cells?.find(cell => cell.id === connection.from);
              const toCell = cells?.find(cell => cell.id === connection.to);
              if (!fromCell || !toCell) return null;

              const fromX = (fromCell.col * 150) + 75;
              const fromY = (fromCell.row * 80) + 40;
              const toX = (toCell.col * 150) + 75;
              const toY = (toCell.row * 80) + 40;

              return (
                <g key={index}>
                  <line
                    x1={fromX}
                    y1={fromY}
                    x2={toX}
                    y2={toY}
                    stroke="#3b82f6"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                    </marker>
                  </defs>
                </g>
              );
            })}
          </svg>
          
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, zIndex: 2, position: 'relative' }}>
            {Array.from({ length: rows * cols }, (_, index) => {
              const row = Math.floor(index / cols);
              const col = index % cols;
              const cell = cells?.find(c => c.row === row && c.col === col);
              
              return (
                <div
                  key={index}
                  className="h-20 border-2 border-gray-300 rounded-lg bg-white p-2 flex items-center justify-center text-sm"
                  style={{ minWidth: '140px' }}
                >
                  {cell ? (
                    <div className="text-center">
                      {cell.content}
                    </div>
                  ) : (
                    <div className="text-gray-400">Пустая ячейка</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderDragToPoint = () => {
    if (!assignmentData.dragItems || !assignmentData.dropZones) return null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Варианты ответов</h4>
            <div className="space-y-2">
              {assignmentData.dragItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-grab hover:bg-blue-100 transition-colors"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', item.id);
                  }}
                >
                  {item.content}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Области для перетаскивания</h4>
            <div className="space-y-2">
              {assignmentData.dropZones.map((zone) => (
                <div
                  key={zone.id}
                  className={`p-4 min-h-[60px] border-2 border-dashed rounded-lg transition-colors ${
                    studentAnswers[zone.id] 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                  }`}
                  onDrop={(e) => {
                    e.preventDefault();
                    const draggedId = e.dataTransfer.getData('text/plain');
                    setStudentAnswers(prev => ({
                      ...prev,
                      [zone.id]: draggedId
                    }));
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="font-medium text-sm mb-1">{zone.label}</div>
                  {studentAnswers[zone.id] && (
                    <div className="text-sm text-green-700">
                      Размещено: {assignmentData.dragItems.find(item => item.id === studentAnswers[zone.id])?.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {showCorrectAnswers && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-700 font-semibold mb-2">Правильные ответы:</p>
            {assignmentData.dropZones.map((zone) => (
              <div key={zone.id} className="text-sm text-green-600">
                {zone.label}: {assignmentData.dragItems.find(item => item.id === zone.correctAnswer)?.content}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderNumbersOnImage = () => {
    if (!assignmentData.numberPoints) return null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Варианты ответов</h4>
            <div className="grid grid-cols-2 gap-2">
              {assignmentData.options?.map((option, index) => (
                <div
                  key={option.id}
                  className="p-2 bg-blue-50 border border-blue-200 rounded-lg cursor-grab hover:bg-blue-100 transition-colors flex items-center justify-center"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({ optionId: option.id, number: index + 1 }));
                  }}
                >
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <span className="ml-2 text-sm">{option.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Изображение</h4>
            <div className="relative border rounded-lg overflow-hidden">
              <img 
                src={assignmentData.imageUrl} 
                alt="Задание" 
                className="w-full h-auto max-h-96 object-contain"
              />
              {assignmentData.numberPoints?.map((point) => (
                <div
                  key={point.id}
                  className="absolute w-12 h-12 border-2 border-dashed border-gray-400 rounded-full flex items-center justify-center bg-white bg-opacity-80 hover:bg-opacity-100 transition-colors"
                  style={{
                    left: `${point.x}px`,
                    top: `${point.y}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                    setStudentAnswers(prev => ({
                      ...prev,
                      [point.id]: data.optionId
                    }));
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {studentAnswers[point.id] && (
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                      {assignmentData.options?.findIndex(opt => opt.id === studentAnswers[point.id]) + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {showCorrectAnswers && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-700 font-semibold mb-2">Правильные ответы:</p>
            {assignmentData.numberPoints?.map((point) => (
              <div key={point.id} className="text-sm text-green-600">
                Точка {point.label}: {assignmentData.options?.find(opt => opt.id === point.correctAnswer)?.text}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderGrouping = () => {
    if (!assignmentData.items || !assignmentData.groups) return null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Элементы для группировки</h4>
            <div className="grid grid-cols-2 gap-2">
              {assignmentData.items.map((item) => (
                <div
                  key={item.id}
                  className="p-2 bg-gray-50 border border-gray-200 rounded-lg cursor-grab hover:bg-gray-100 transition-colors"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', item.id);
                  }}
                >
                  {item.type === 'text' && <span>{item.content}</span>}
                  {item.type === 'image' && <img src={item.content} alt="Элемент" className="w-full h-16 object-cover rounded" />}
                  {item.type === 'text-image' && (
                    <div className="flex items-center space-x-2">
                      <img src={item.imageUrl} alt="Элемент" className="w-8 h-8 object-cover rounded" />
                      <span className="text-sm">{item.content}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${assignmentData.groups?.length || 2}, 1fr)` }}>
            {assignmentData.groups?.map((group) => (
              <div
                key={group.id}
                className="min-h-[120px] p-3 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"
                onDrop={(e) => {
                  e.preventDefault();
                  const draggedId = e.dataTransfer.getData('text/plain');
                  const currentItems = studentAnswers[group.id] || [];
                  if (!currentItems.includes(draggedId)) {
                    setStudentAnswers(prev => ({
                      ...prev,
                      [group.id]: [...currentItems, draggedId]
                    }));
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                <h5 className="font-medium text-sm mb-2 text-center">{group.name}</h5>
                <div className="space-y-1">
                  {(studentAnswers[group.id] || []).map((itemId) => {
                    const item = assignmentData.items.find(i => i.id === itemId);
                    return item ? (
                      <div key={itemId} className="p-2 bg-white border rounded text-sm">
                        {item.type === 'text' && item.content}
                        {item.type === 'image' && <img src={item.content} alt="Элемент" className="w-full h-8 object-cover rounded" />}
                        {item.type === 'text-image' && (
                          <div className="flex items-center space-x-1">
                            <img src={item.imageUrl} alt="Элемент" className="w-4 h-4 object-cover rounded" />
                            <span className="text-xs">{item.content}</span>
                          </div>
                        )}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {showCorrectAnswers && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-700 font-semibold mb-2">Правильная группировка:</p>
            {assignmentData.groups?.map((group) => (
              <div key={group.id} className="text-sm text-green-600 mb-1">
                <strong>{group.name}:</strong> {group.correctItems?.map(itemId => 
                  assignmentData.items.find(i => i.id === itemId)?.content || assignmentData.items.find(i => i.id === itemId)?.text
                ).join(', ')}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderOrdering = () => {
    if (!assignmentData.items) return null;

    // Shuffle items for display if not already shuffled
    const shuffledItems = assignmentData.shuffledItems || assignmentData.items;

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Расположите элементы в правильном порядке</h4>
          <div className="space-y-2">
            {shuffledItems.map((item, index) => (
              <div
                key={item.id}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-grab hover:bg-gray-100 transition-colors flex items-center justify-between"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', JSON.stringify({ itemId: item.id, fromIndex: index }));
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                  const fromIndex = data.fromIndex;
                  const toIndex = index;
                  
                  if (fromIndex !== toIndex) {
                    const newItems = [...shuffledItems];
                    const [movedItem] = newItems.splice(fromIndex, 1);
                    newItems.splice(toIndex, 0, movedItem);
                    
                    setStudentAnswers(prev => ({
                      ...prev,
                      [element.id]: newItems
                    }));
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    {item.type === 'text' && <span>{item.content}</span>}
                    {item.type === 'image' && <img src={item.content} alt="Элемент" className="w-16 h-16 object-cover rounded" />}
                    {item.type === 'text-image' && (
                      <div className="flex items-center space-x-2">
                        <img src={item.imageUrl} alt="Элемент" className="w-12 h-12 object-cover rounded" />
                        <span>{item.content}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-gray-400">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {showCorrectAnswers && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-700 font-semibold mb-2">Правильный порядок:</p>
            {assignmentData.items.map((item, index) => (
              <div key={item.id} className="text-sm text-green-600">
                {index + 1}. {item.content || item.text}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderWordGrid = () => {
    if (!assignmentData.gridWords || !assignmentData.gridSize) return null;

    const { gridSize, gridWords, hiddenWords } = assignmentData;
    const grid = assignmentData.grid || [];

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Найдите слова в сетке</h4>
          <div className="inline-block border rounded-lg p-2 bg-gray-50">
            <div 
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
            >
              {grid.map((row, rowIndex) => 
                row.map((letter, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`w-8 h-8 border border-gray-300 flex items-center justify-center text-sm font-mono cursor-pointer hover:bg-blue-100 ${
                      studentAnswers[`${rowIndex}-${colIndex}`] ? 'bg-yellow-200' : 'bg-white'
                    }`}
                    onClick={() => {
                      const key = `${rowIndex}-${colIndex}`;
                      setStudentAnswers(prev => ({
                        ...prev,
                        [key]: !prev[key]
                      }));
                    }}
                  >
                    {letter}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Найдите эти слова:</h4>
          <div className="grid grid-cols-2 gap-2">
            {hiddenWords?.map((word, index) => (
              <div key={index} className="text-sm p-2 bg-gray-100 rounded">
                {word}
              </div>
            ))}
          </div>
        </div>
        
        {showCorrectAnswers && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-700 font-semibold mb-2">Расположение слов:</p>
            {gridWords?.map((word, index) => (
              <div key={index} className="text-sm text-green-600">
                {word.word}: {word.direction} - Начинается с позиции ({word.startRow + 1}, {word.startCol + 1})
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCrossword = () => {
    if (!assignmentData.crosswordGrid || !assignmentData.crosswordClues) return null;

    const { crosswordGrid, crosswordClues } = assignmentData;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Сетка кроссворда</h4>
            <div className="inline-block border rounded-lg p-2 bg-gray-50">
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${crosswordGrid[0]?.length || 10}, 1fr)` }}>
                {crosswordGrid.map((row, rowIndex) => 
                  row.map((cell, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`w-8 h-8 border flex items-center justify-center text-xs relative ${
                        cell.isBlack ? 'bg-black' : 'bg-white border-gray-400'
                      }`}
                    >
                      {cell.number && (
                        <span className="absolute top-0 left-0 text-xs text-blue-600 font-bold">
                          {cell.number}
                        </span>
                      )}
                      {!cell.isBlack && (
                        <input
                          type="text"
                          maxLength={1}
                          className="w-full h-full text-center border-none outline-none bg-transparent text-sm font-mono"
                          value={studentAnswers[`${rowIndex}-${colIndex}`] || ''}
                          onChange={(e) => {
                            const key = `${rowIndex}-${colIndex}`;
                            setStudentAnswers(prev => ({
                              ...prev,
                              [key]: e.target.value.toUpperCase()
                            }));
                          }}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">По горизонтали</h4>
              <div className="space-y-1">
                {crosswordClues.across?.map((clue, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">{clue.number}.</span> {clue.clue}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">По вертикали</h4>
              <div className="space-y-1">
                {crosswordClues.down?.map((clue, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">{clue.number}.</span> {clue.clue}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {showCorrectAnswers && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-700 font-semibold mb-2">Правильные ответы:</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>По горизонтали:</strong>
                {crosswordClues.across?.map((clue, index) => (
                  <div key={index} className="text-sm text-green-600">
                    {clue.number}. {clue.answer}
                  </div>
                ))}
              </div>
              <div>
                <strong>По вертикали:</strong>
                {crosswordClues.down?.map((clue, index) => (
                  <div key={index} className="text-sm text-green-600">
                    {clue.number}. {clue.answer}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderHighlightWords = () => {
    if (!assignmentData.textContent || !assignmentData.wordsToHighlight) return null;

    const { textContent, wordsToHighlight } = assignmentData;

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Выделите указанные слова в тексте</h4>
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="text-sm leading-relaxed">
              {textContent.split(/(\s+)/).map((word, index) => {
                const cleanWord = word.replace(/[.,!?;:]/g, '').toLowerCase();
                const isHighlightable = wordsToHighlight.some(w => w.toLowerCase() === cleanWord);
                const isHighlighted = studentAnswers[`word-${index}`];
                
                return (
                  <span
                    key={index}
                    className={`${isHighlightable ? 'cursor-pointer hover:bg-blue-100' : ''} ${
                      isHighlighted ? 'bg-yellow-300' : ''
                    }`}
                    onClick={() => {
                      if (isHighlightable) {
                        const key = `word-${index}`;
                        setStudentAnswers(prev => ({
                          ...prev,
                          [key]: !prev[key]
                        }));
                      }
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Найдите эти слова:</h4>
          <div className="flex flex-wrap gap-2">
            {wordsToHighlight.map((word, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                {word}
              </span>
            ))}
          </div>
        </div>
        
        {showCorrectAnswers && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-700 font-semibold mb-2">Все слова найдены правильно!</p>
          </div>
        )}
      </div>
    );
  };

  const renderTextEditing = () => {
    if (!assignmentData.originalText) return null;

    const { originalText, editingInstructions } = assignmentData;

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Исходный текст:</h4>
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {originalText}
            </div>
          </div>
        </div>
        
        {editingInstructions && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Инструкции по редактированию:</h4>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">{editingInstructions}</p>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Ваша отредактированная версия:</h4>
          <textarea
            className="w-full h-32 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Введите отредактированный текст здесь..."
            value={studentAnswers[element.id] || ''}
            onChange={(e) => {
              setStudentAnswers(prev => ({
                ...prev,
                [element.id]: e.target.value
              }));
            }}
          />
        </div>
        
        {showCorrectAnswers && assignmentData.expectedResult && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-700 font-semibold mb-2">Ожидаемый результат:</p>
            <div className="text-sm text-green-600 whitespace-pre-wrap">
              {assignmentData.expectedResult}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTextHighlighting = () => {
    if (!assignmentData.textContent) return null;

    const { textContent, highlightInstructions } = assignmentData;

    return (
      <div className="space-y-4">
        {highlightInstructions && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">{highlightInstructions}</p>
          </div>
        )}
        
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Выделите нужные части текста:</h4>
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="text-sm leading-relaxed">
              {textContent.split(/(\s+)/).map((word, index) => {
                const isHighlighted = studentAnswers[`highlight-${index}`];
                
                return (
                  <span
                    key={index}
                    className={`cursor-pointer hover:bg-blue-100 ${
                      isHighlighted ? 'bg-yellow-300' : ''
                    }`}
                    onClick={() => {
                      const key = `highlight-${index}`;
                      setStudentAnswers(prev => ({
                        ...prev,
                        [key]: !prev[key]
                      }));
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
        
        {showCorrectAnswers && assignmentData.correctHighlights && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-700 font-semibold mb-2">Правильные выделения:</p>
            <div className="text-sm text-green-600">
              {assignmentData.correctHighlights.map((highlight, index) => (
                <span key={index} className="inline-block bg-yellow-200 px-1 mx-1 rounded">
                  {highlight}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderHint = () => {
    const { hintText, showHint } = assignmentData;

    return (
      <div className="space-y-4">
        <div className="p-4 border rounded-lg bg-blue-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center">
              💡
            </div>
            <h4 className="font-semibold text-sm">Подсказка</h4>
          </div>
          
          {showHint || studentAnswers[`show-hint-${element.id}`] ? (
            <div className="mt-3 p-3 bg-white border border-blue-200 rounded">
              <p className="text-sm text-blue-800">{hintText}</p>
            </div>
          ) : (
            <button
              className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => {
                setStudentAnswers(prev => ({
                  ...prev,
                  [`show-hint-${element.id}`]: true
                }));
              }}
            >
              Показать подсказку
            </button>
          )}
        </div>
        
        {assignmentData.followUpQuestion && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Вопрос:</h4>
            <p className="text-sm text-gray-700">{assignmentData.followUpQuestion}</p>
            <textarea
              className="w-full h-20 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите ваш ответ..."
              value={studentAnswers[`follow-up-${element.id}`] || ''}
              onChange={(e) => {
                setStudentAnswers(prev => ({
                  ...prev,
                  [`follow-up-${element.id}`]: e.target.value
                }));
              }}
            />
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
      // Новые типы
      case 'concept-map': return renderConceptMap();
      case 'drag-to-point': return renderDragToPoint();
      case 'numbers-on-image': return renderNumbersOnImage();
      case 'grouping': return renderGrouping();
      case 'ordering': return renderOrdering();
      case 'word-grid': return renderWordGrid();
      case 'crossword': return renderCrossword();
      case 'highlight-words': return renderHighlightWords();
      case 'text-editing': return renderTextEditing();
      case 'text-highlighting': return renderTextHighlighting();
      case 'hint': return renderHint();
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

      // Новые типы заданий
      case 'concept-map':
        feedback = 'Карта понятий заполнена.';
        break;

      case 'drag-to-point':
        let correctDragPlacements = 0;
        const totalDragZones = assignmentData.dropZones?.length || 0;
        assignmentData.dropZones?.forEach((zone) => {
          if (studentAnswers[zone.id] === zone.correctAnswer) {
            correctDragPlacements++;
          }
        });
        isCorrect = correctDragPlacements === totalDragZones;
        feedback = isCorrect ? 'Все элементы размещены правильно!' : `Правильно размещено ${correctDragPlacements} из ${totalDragZones} элементов.`;
        break;

      case 'numbers-on-image':
        let correctNumberPlacements = 0;
        const totalNumberPoints = assignmentData.numberPoints?.length || 0;
        assignmentData.numberPoints?.forEach((point) => {
          if (studentAnswers[point.id] === point.correctAnswer) {
            correctNumberPlacements++;
          }
        });
        isCorrect = correctNumberPlacements === totalNumberPoints;
        feedback = isCorrect ? 'Все числа размещены правильно!' : `Правильно размещено ${correctNumberPlacements} из ${totalNumberPoints} чисел.`;
        break;

      case 'grouping':
        let correctGroupings = 0;
        const totalGroups = assignmentData.groups?.length || 0;
        assignmentData.groups?.forEach((group) => {
          const studentItems = studentAnswers[group.id] || [];
          const correctItems = group.correctItems || [];
          if (studentItems.length === correctItems.length && 
              studentItems.every(item => correctItems.includes(item))) {
            correctGroupings++;
          }
        });
        isCorrect = correctGroupings === totalGroups;
        feedback = isCorrect ? 'Все группы сформированы правильно!' : `Правильно сгруппировано ${correctGroupings} из ${totalGroups} групп.`;
        break;

      case 'ordering':
        const userOrder = studentAnswers[element.id] || assignmentData.shuffledItems || assignmentData.items;
        const correctOrder = assignmentData.items;
        isCorrect = userOrder.length === correctOrder.length && 
                   userOrder.every((item, index) => item.id === correctOrder[index].id);
        feedback = isCorrect ? 'Элементы упорядочены правильно!' : 'Порядок элементов неверный.';
        break;

      case 'word-grid':
        let foundWords = 0;
        const totalWords = assignmentData.hiddenWords?.length || 0;
        // Simple validation - count selected cells
        const selectedCells = Object.keys(studentAnswers).filter(key => 
          key.includes('-') && studentAnswers[key]
        ).length;
        foundWords = Math.min(selectedCells / 5, totalWords); // Approximate
        isCorrect = foundWords === totalWords;
        feedback = isCorrect ? 'Все слова найдены!' : `Найдено примерно ${Math.floor(foundWords)} из ${totalWords} слов.`;
        break;

      case 'crossword':
        let correctCrosswordAnswers = 0;
        let totalCrosswordAnswers = 0;
        const { crosswordClues } = assignmentData;
        
        crosswordClues?.across?.forEach(clue => {
          totalCrosswordAnswers++;
          // Check if answer matches (simplified)
          const userAnswer = Object.keys(studentAnswers)
            .filter(key => key.includes('-'))
            .map(key => studentAnswers[key])
            .join('');
          if (userAnswer.toLowerCase().includes(clue.answer.toLowerCase())) {
            correctCrosswordAnswers++;
          }
        });
        
        crosswordClues?.down?.forEach(clue => {
          totalCrosswordAnswers++;
        });
        
        isCorrect = correctCrosswordAnswers === totalCrosswordAnswers;
        feedback = isCorrect ? 'Кроссворд решен правильно!' : `Правильно ${correctCrosswordAnswers} из ${totalCrosswordAnswers} слов.`;
        break;

      case 'highlight-words':
        let correctHighlights = 0;
        const totalHighlightWords = assignmentData.wordsToHighlight?.length || 0;
        
        assignmentData.wordsToHighlight?.forEach(word => {
          // Check if word is highlighted
          const isHighlighted = Object.keys(studentAnswers).some(key => 
            key.startsWith('word-') && studentAnswers[key]
          );
          if (isHighlighted) correctHighlights++;
        });
        
        isCorrect = correctHighlights === totalHighlightWords;
        feedback = isCorrect ? 'Все слова выделены правильно!' : `Правильно выделено ${correctHighlights} из ${totalHighlightWords} слов.`;
        break;

      case 'text-editing':
        const editedText = studentAnswers[element.id] || '';
        const expectedResult = assignmentData.expectedResult || '';
        
        // Simple similarity check (can be improved)
        const similarity = editedText.length > 0 ? 
          (editedText.toLowerCase().includes(expectedResult.toLowerCase()) ? 1 : 0.5) : 0;
        
        isCorrect = similarity >= 0.8;
        feedback = isCorrect ? 'Текст отредактирован правильно!' : 'Текст требует доработки.';
        break;

      case 'text-highlighting':
        const highlightedParts = Object.keys(studentAnswers).filter(key => 
          key.startsWith('highlight-') && studentAnswers[key]
        ).length;
        
        const expectedHighlights = assignmentData.correctHighlights?.length || 0;
        isCorrect = highlightedParts === expectedHighlights;
        feedback = isCorrect ? 'Правильные части текста выделены!' : `Выделено ${highlightedParts} частей.`;
        break;

      case 'hint':
        const followUpAnswer = studentAnswers[`follow-up-${element.id}`] || '';
        const hasAnswer = followUpAnswer.trim().length > 0;
        
        isCorrect = hasAnswer;
        feedback = hasAnswer ? 'Ответ получен!' : 'Пожалуйста, ответьте на вопрос.';
        break;
        
      default:
        feedback = 'Ответ отправлен.';
    }

    return { isCorrect, feedback };
  };

  return (
    <div 
      className={`border rounded-lg shadow-sm w-full h-full`}
      style={{
        backgroundColor: element.properties?.backgroundColor || '#ffffff',
        color: element.properties?.color || '#000000'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b cursor-pointer"
        style={{
          backgroundColor: 'transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
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
