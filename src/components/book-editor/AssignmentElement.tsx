import React from 'react';
import { Star, Check, X, ChevronDown, Eye, EyeOff } from 'lucide-react';

type AssignmentElementProps = {
  element: {
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    content: string;
    properties: {
      assignmentType?: string;
      assignmentData?: any;
      backgroundColor?: string;
      borderColor?: string;
      borderWidth?: number;
      borderRadius?: number;
    };
  };
  isEditing: boolean;
  _onUpdate: (updates: any) => void;
};

export function AssignmentElement({ element, isEditing: _isEditing, _onUpdate }: AssignmentElementProps) {
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
        {assignmentData.options.map((option, index) => (
          <div key={option.id} className="flex items-center space-x-2">
            <input
              type="radio"
              name={`question-${element.id}`}
              id={`option-${option.id}`}
              disabled={_isEditing}
              checked={studentAnswers[element.id] === option.id}
              onChange={() => {
                if (_isEditing) {
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
            disabled={_isEditing}
            checked={studentAnswers[element.id] === true}
            onChange={() => {
              if (_isEditing) {
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
            disabled={_isEditing}
            checked={studentAnswers[element.id] === false}
            onChange={() => {
              if (_isEditing) {
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
          disabled={_isEditing}
          value={studentAnswers[element.id] || ''}
          onChange={(e) => {
            if (_isEditing) {
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
                if (_isEditing && item.matchWith) {
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
                      disabled={_isEditing}
                      checked={studentAnswers[question.id] === option.id}
                      onChange={() => {
                        if (_isEditing) {
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
                      disabled={_isEditing}
                      checked={studentAnswers[question.id] === true}
                      onChange={() => {
                        if (_isEditing) {
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
                      disabled={_isEditing}
                      checked={studentAnswers[question.id] === false}
                      onChange={() => {
                        if (_isEditing) {
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
                disabled={_isEditing}
                value={studentAnswers[question.id] || ''}
                onChange={(e) => {
                  if (_isEditing) {
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
      default: return 'Задание';
    }
  };

  const renderAssignmentContent = () => {
    switch (assignmentType) {
      case 'multiple-choice': return renderMultipleChoice();
      case 'open-question': return renderOpenQuestion();
      case 'true-false': return renderTrueFalse();
      case 'matching': return renderMatching();
      case 'quiz': return renderQuiz();
      default: return null;
    }
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
          {_isEditing && assignmentData.showCorrectAnswer && (
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
          {_isEditing && (
            <div className="mt-4 pt-4 border-t">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Отправить ответ
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
