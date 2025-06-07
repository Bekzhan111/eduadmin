'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  MessageCircle, Star, ThumbsUp, ThumbsDown, Reply, Flag, 
  Edit, Trash2, Send,
  User, Calendar, Filter
} from 'lucide-react';

// Types
export interface Comment {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  rating?: number; // 1-5 stars
  createdAt: string;
  updatedAt?: string;
  parentId?: string; // For replies
  likes: number;
  dislikes: number;
  isEdited: boolean;
  isReported: boolean;
  status: 'active' | 'hidden' | 'deleted';
  replies?: Comment[];
}

export interface CommentStats {
  totalComments: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
  recentComments: number;
}

interface BookCommentsProps {
  bookId: string;
  bookTitle: string;
  currentUserId?: string;
  isReadOnly?: boolean;
  className?: string;
}

export function BookComments({ 
  bookId, 
  bookTitle, 
  currentUserId, 
  isReadOnly = false,
  className = '' 
}: BookCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [stats, setStats] = useState<CommentStats>({
    totalComments: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    recentComments: 0
  });
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating' | 'likes'>('newest');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockComments: Comment[] = [
      {
        id: '1',
        bookId,
        userId: 'user1',
        userName: 'Анна Петрова',
        userAvatar: '/avatars/anna.jpg',
        content: 'Отличная книга! Очень понравился стиль изложения и глубина проработки темы. Рекомендую всем, кто интересуется данной областью.',
        rating: 5,
        createdAt: '2024-01-15T10:30:00Z',
        likes: 12,
        dislikes: 1,
        isEdited: false,
        isReported: false,
        status: 'active',
        replies: [
          {
            id: '1-1',
            bookId,
            userId: 'user2',
            userName: 'Михаил Иванов',
            content: 'Согласен! Автор действительно хорошо разбирается в теме.',
            createdAt: '2024-01-15T14:20:00Z',
            parentId: '1',
            likes: 3,
            dislikes: 0,
            isEdited: false,
            isReported: false,
            status: 'active'
          }
        ]
      },
      {
        id: '2',
        bookId,
        userId: 'user3',
        userName: 'Елена Сидорова',
        content: 'Книга неплохая, но местами слишком сложная для понимания. Хотелось бы больше примеров.',
        rating: 3,
        createdAt: '2024-01-14T16:45:00Z',
        likes: 5,
        dislikes: 2,
        isEdited: true,
        isReported: false,
        status: 'active'
      },
      {
        id: '3',
        bookId,
        userId: 'user4',
        userName: 'Дмитрий Козлов',
        content: 'Превосходная работа! Каждая глава открывает новые горизонты. Спасибо автору за такой труд!',
        rating: 5,
        createdAt: '2024-01-13T09:15:00Z',
        likes: 8,
        dislikes: 0,
        isEdited: false,
        isReported: false,
        status: 'active'
      }
    ];

    setComments(mockComments);
    
    // Calculate stats
    const totalComments = mockComments.length;
    const ratings = mockComments.filter(c => c.rating).map(c => c.rating!);
    const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(rating => ratingDistribution[rating]++);
    
    setStats({
      totalComments,
      averageRating,
      ratingDistribution,
      recentComments: mockComments.filter(c => 
        new Date(c.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length
    });
  }, [bookId]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUserId) return;
    
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const comment: Comment = {
      id: Date.now().toString(),
      bookId,
      userId: currentUserId,
      userName: 'Вы',
      content: newComment,
      rating: newRating || undefined,
      createdAt: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      isEdited: false,
      isReported: false,
      status: 'active'
    };
    
    setComments(prev => [comment, ...prev]);
    setNewComment('');
    setNewRating(0);
    setIsLoading(false);
    
    // Show success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50 transition-all duration-300';
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>Комментарий добавлен!</span>
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  };

  const handleReply = async (parentId: string) => {
    if (!replyText.trim() || !currentUserId) return;
    
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const reply: Comment = {
      id: `${parentId}-${Date.now()}`,
      bookId,
      userId: currentUserId,
      userName: 'Вы',
      content: replyText,
      createdAt: new Date().toISOString(),
      parentId,
      likes: 0,
      dislikes: 0,
      isEdited: false,
      isReported: false,
      status: 'active'
    };
    
    setComments(prev => prev.map(comment => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), reply]
        };
      }
      return comment;
    }));
    
    setReplyingTo(null);
    setReplyText('');
    setIsLoading(false);
  };

  const handleLike = (commentId: string) => {
    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        return { ...comment, likes: comment.likes + 1 };
      }
      if (comment.replies) {
        return {
          ...comment,
          replies: comment.replies.map(reply => 
            reply.id === commentId ? { ...reply, likes: reply.likes + 1 } : reply
          )
        };
      }
      return comment;
    }));
  };

  const handleDislike = (commentId: string) => {
    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        return { ...comment, dislikes: comment.dislikes + 1 };
      }
      if (comment.replies) {
        return {
          ...comment,
          replies: comment.replies.map(reply => 
            reply.id === commentId ? { ...reply, dislikes: reply.dislikes + 1 } : reply
          )
        };
      }
      return comment;
    }));
  };

  const handleEdit = (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      setEditingComment(commentId);
      setEditText(comment.content);
    }
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editText.trim()) return;
    
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, content: editText, isEdited: true, updatedAt: new Date().toISOString() }
        : comment
    ));
    
    setEditingComment(null);
    setEditText('');
  };

  const handleDelete = (commentId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот комментарий?')) {
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    }
  };

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onRate?.(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!interactive}
          >
            <Star 
              className={`h-4 w-4 ${
                star <= rating 
                  ? 'text-yellow-400 fill-yellow-400' 
                  : 'text-gray-300'
              }`} 
            />
          </button>
        ))}
      </div>
    );
  };

  const sortedComments = [...comments].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'likes':
        return b.likes - a.likes;
      default:
        return 0;
    }
  }).filter(comment => 
    filterRating === null || comment.rating === filterRating
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'только что';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} ч. назад`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)} дн. назад`;
    } else {
      return date.toLocaleDateString('ru-RU');
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MessageCircle className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Комментарии</h3>
            <p className="text-sm text-gray-600">к книге "{bookTitle}"</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.totalComments}</div>
            <div className="text-xs text-gray-500">комментариев</div>
          </div>
          {stats.averageRating > 0 && (
            <div className="text-center">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="text-lg font-bold text-gray-900">
                  {stats.averageRating.toFixed(1)}
                </span>
              </div>
              <div className="text-xs text-gray-500">средняя оценка</div>
            </div>
          )}
        </div>
      </div>

      {/* Rating Distribution */}
      {stats.averageRating > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Распределение оценок</h4>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center space-x-3">
                <div className="flex items-center space-x-1 w-12">
                  <span className="text-sm text-gray-600">{rating}</span>
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${stats.totalComments > 0 ? (stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] / stats.totalComments) * 100 : 0}%` 
                    }}
                  />
                </div>
                <span className="text-sm text-gray-500 w-8">
                  {stats.ratingDistribution[rating]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Comment Form */}
      {!isReadOnly && currentUserId && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Оставить комментарий</h4>
          
          {/* Rating */}
          <div className="mb-4">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Ваша оценка (необязательно)
            </Label>
            {renderStars(newRating, true, setNewRating)}
          </div>

          {/* Comment Text */}
          <div className="mb-4">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Комментарий
            </Label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Поделитесь своими впечатлениями о книге..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {newComment.length}/500 символов
            </div>
            <Button 
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Отправка...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Send className="h-4 w-4" />
                  <span>Отправить</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Filters and Sorting */}
      <div className="flex items-center justify-between mb-6 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Фильтр:</span>
            <select
              value={filterRating || ''}
              onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="">Все оценки</option>
              <option value="5">5 звезд</option>
              <option value="4">4 звезды</option>
              <option value="3">3 звезды</option>
              <option value="2">2 звезды</option>
              <option value="1">1 звезда</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Сортировка:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="newest">Сначала новые</option>
            <option value="oldest">Сначала старые</option>
            <option value="rating">По оценке</option>
            <option value="likes">По лайкам</option>
          </select>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {sortedComments.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Пока нет комментариев</h3>
            <p className="text-gray-600">
              {isReadOnly ? 'Комментарии к этой книге еще не оставлены.' : 'Станьте первым, кто оставит комментарий!'}
            </p>
          </div>
        ) : (
          sortedComments.map((comment) => (
            <div key={comment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              {/* Comment Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                    {comment.userAvatar ? (
                      <img src={comment.userAvatar} alt={comment.userName} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      comment.userName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{comment.userName}</h4>
                      {comment.isEdited && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          изменено
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(comment.createdAt)}</span>
                      {comment.rating && (
                        <div className="flex items-center space-x-1">
                          <span>•</span>
                          {renderStars(comment.rating)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {currentUserId === comment.userId && (
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(comment.id)}
                      className="text-gray-500 hover:text-blue-600"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(comment.id)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Comment Content */}
              <div className="mb-4">
                {editingComment === comment.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(comment.id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Сохранить
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingComment(null);
                          setEditText('');
                        }}
                      >
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                )}
              </div>

              {/* Comment Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleLike(comment.id)}
                    className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span className="text-sm">{comment.likes}</span>
                  </button>
                  <button
                    onClick={() => handleDislike(comment.id)}
                    className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    <span className="text-sm">{comment.dislikes}</span>
                  </button>
                  {!isReadOnly && currentUserId && (
                    <button
                      onClick={() => setReplyingTo(comment.id)}
                      className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      <Reply className="h-4 w-4" />
                      <span className="text-sm">Ответить</span>
                    </button>
                  )}
                </div>
                
                <button className="text-gray-400 hover:text-gray-600">
                  <Flag className="h-4 w-4" />
                </button>
              </div>

              {/* Reply Form */}
              {replyingTo === comment.id && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Написать ответ..."
                    className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText('');
                      }}
                    >
                      Отмена
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleReply(comment.id)}
                      disabled={!replyText.trim() || isLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Ответить
                    </Button>
                  </div>
                </div>
              )}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 pl-6 border-l-2 border-gray-200 space-y-4">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {reply.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900 text-sm">{reply.userName}</h5>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(reply.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        
                        {currentUserId === reply.userId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(reply.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      
                      <p className="text-gray-700 text-sm mb-2">{reply.content}</p>
                      
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleLike(reply.id)}
                          className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors"
                        >
                          <ThumbsUp className="h-3 w-3" />
                          <span className="text-xs">{reply.likes}</span>
                        </button>
                        <button
                          onClick={() => handleDislike(reply.id)}
                          className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors"
                        >
                          <ThumbsDown className="h-3 w-3" />
                          <span className="text-xs">{reply.dislikes}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {sortedComments.length > 0 && (
        <div className="text-center mt-6">
          <Button variant="outline" className="text-gray-600 hover:text-gray-800">
            Загрузить еще комментарии
          </Button>
        </div>
      )}
    </div>
  );
} 