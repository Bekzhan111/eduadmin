'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, Settings, BookOpen, Star, Heart, Download,
  Eye, Clock, Target, Award, Bookmark, Bell,
  Shield, Globe, Palette, Monitor, Moon, Sun,
  Mail, Phone, Edit, Save, X, Plus, Trash2,
  Calendar, BarChart3, TrendingUp, Users, Camera
} from 'lucide-react';

// Types
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar: string;
  bio: string;
  joinDate: string;
  location: string;
  website: string;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  stats: {
    booksRead: number;
    booksPublished: number;
    totalReviews: number;
    averageRating: number;
    followers: number;
    following: number;
    viewsReceived: number;
    downloadsReceived: number;
  };
  readingPreferences: {
    favoriteCategories: string[];
    preferredLanguages: string[];
    preferredFormats: string[];
    difficultyLevel: string[];
    readingGoals: {
      booksPerMonth: number;
      minutesPerDay: number;
      targetCategories: string[];
    };
    notifications: {
      email: boolean;
      push: boolean;
      bookRecommendations: boolean;
      newComments: boolean;
      newFollowers: boolean;
      weeklyDigest: boolean;
    };
  };
  privacy: {
    showReadingHistory: boolean;
    showStats: boolean;
    showEmail: boolean;
    allowMessages: boolean;
    showOnlineStatus: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
    fontFamily: string;
    accentColor: string;
  };
}

interface UserProfileProps {
  userId?: string;
  editable?: boolean;
  compact?: boolean;
  showStats?: boolean;
  className?: string;
}

export function UserProfile({ 
  userId, 
  editable = false,
  compact = false,
  showStats = true,
  className = ''
}: UserProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'privacy' | 'appearance'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  // Mock data
  const mockProfile: UserProfile = {
    id: '1',
    username: 'aleksandr_dev',
    email: 'aleksandr@example.com',
    fullName: 'Александр Иванов',
    avatar: '/avatars/aleksandr.jpg',
    bio: 'Разработчик полного стека с 5+ годами опыта. Увлекаюсь современными технологиями и обучением.',
    joinDate: '2022-03-15',
    location: 'Москва, Россия',
    website: 'https://aleksandr-dev.com',
    socialLinks: {
      twitter: 'aleksandr_dev',
      linkedin: 'aleksandr-ivanov-dev',
      github: 'aleksandr-dev'
    },
    stats: {
      booksRead: 45,
      booksPublished: 3,
      totalReviews: 127,
      averageRating: 4.3,
      followers: 234,
      following: 89,
      viewsReceived: 15847,
      downloadsReceived: 3456
    },
    readingPreferences: {
      favoriteCategories: ['Программирование', 'ИИ и ML', 'UX/UI', 'Предпринимательство'],
      preferredLanguages: ['Русский', 'English'],
      preferredFormats: ['PDF', 'EPUB'],
      difficultyLevel: ['intermediate', 'advanced'],
      readingGoals: {
        booksPerMonth: 4,
        minutesPerDay: 60,
        targetCategories: ['Программирование', 'ИИ и ML']
      },
      notifications: {
        email: true,
        push: true,
        bookRecommendations: true,
        newComments: true,
        newFollowers: false,
        weeklyDigest: true
      }
    },
    privacy: {
      showReadingHistory: true,
      showStats: true,
      showEmail: false,
      allowMessages: true,
      showOnlineStatus: true
    },
    appearance: {
      theme: 'light',
      fontSize: 'medium',
      fontFamily: 'Inter',
      accentColor: '#3B82F6'
    }
  };

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setProfile(mockProfile);
    setEditedProfile(mockProfile);
    setIsLoading(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile({ ...profile! });
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setProfile(editedProfile);
    setIsEditing(false);
    setIsLoading(false);
    
    console.log('Profile saved:', editedProfile);
  };

  const handleCancel = () => {
    setEditedProfile({ ...profile! });
    setIsEditing(false);
  };

  const updateProfile = (field: string, value: any) => {
    if (!editedProfile) return;
    
    const keys = field.split('.');
    const updated = { ...editedProfile };
    let current: any = updated;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setEditedProfile(updated);
  };

  const addCategory = () => {
    if (!newCategory || !editedProfile) return;
    
    const updated = { ...editedProfile };
    if (!updated.readingPreferences.favoriteCategories.includes(newCategory)) {
      updated.readingPreferences.favoriteCategories.push(newCategory);
      setEditedProfile(updated);
    }
    setNewCategory('');
  };

  const removeCategory = (category: string) => {
    if (!editedProfile) return;
    
    const updated = { ...editedProfile };
    updated.readingPreferences.favoriteCategories = 
      updated.readingPreferences.favoriteCategories.filter(c => c !== category);
    setEditedProfile(updated);
  };

  const addLanguage = () => {
    if (!newLanguage || !editedProfile) return;
    
    const updated = { ...editedProfile };
    if (!updated.readingPreferences.preferredLanguages.includes(newLanguage)) {
      updated.readingPreferences.preferredLanguages.push(newLanguage);
      setEditedProfile(updated);
    }
    setNewLanguage('');
  };

  const removeLanguage = (language: string) => {
    if (!editedProfile) return;
    
    const updated = { ...editedProfile };
    updated.readingPreferences.preferredLanguages = 
      updated.readingPreferences.preferredLanguages.filter(l => l !== language);
    setEditedProfile(updated);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading && !profile) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-20 h-20 bg-gray-300 rounded-full"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const currentProfile = isEditing ? editedProfile! : profile;

  if (compact) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
              {currentProfile.fullName.charAt(0)}
            </div>
            {currentProfile.privacy.showOnlineStatus && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {currentProfile.fullName}
            </h3>
            <p className="text-sm text-gray-600 truncate">
              @{currentProfile.username}
            </p>
            {showStats && (
              <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                <span className="flex items-center space-x-1">
                  <BookOpen className="h-3 w-3" />
                  <span>{currentProfile.stats.booksRead}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Star className="h-3 w-3" />
                  <span>{currentProfile.stats.averageRating}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>{currentProfile.stats.followers}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {currentProfile.fullName.charAt(0)}
              </div>
              {currentProfile.privacy.showOnlineStatus && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
              )}
              {isEditing && (
                <button className="absolute -top-1 -right-1 p-1 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                  <Camera className="h-3 w-3" />
                </button>
              )}
            </div>
            
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Полное имя</Label>
                    <Input
                      value={currentProfile.fullName}
                      onChange={(e) => updateProfile('fullName', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Имя пользователя</Label>
                    <Input
                      value={currentProfile.username}
                      onChange={(e) => updateProfile('username', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">О себе</Label>
                    <textarea
                      value={currentProfile.bio}
                      onChange={(e) => updateProfile('bio', e.target.value)}
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {currentProfile.fullName}
                  </h1>
                  <p className="text-gray-600 mb-2">@{currentProfile.username}</p>
                  <p className="text-gray-700 leading-relaxed mb-3">
                    {currentProfile.bio}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Присоединился {formatDate(currentProfile.joinDate)}</span>
                    </span>
                    {currentProfile.location && (
                      <span className="flex items-center space-x-1">
                        <Globe className="h-4 w-4" />
                        <span>{currentProfile.location}</span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {editable && (
              <>
                {isEditing ? (
                  <>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Сохранить
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Отмена
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEdit}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Редактировать
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      {showStats && currentProfile.privacy.showStats && (
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-2xl font-bold text-gray-900">
                  {currentProfile.stats.booksRead}
                </span>
              </div>
              <p className="text-sm text-gray-600">Прочитано книг</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="text-2xl font-bold text-gray-900">
                  {currentProfile.stats.averageRating}
                </span>
              </div>
              <p className="text-sm text-gray-600">Средняя оценка</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-2xl font-bold text-gray-900">
                  {currentProfile.stats.followers}
                </span>
              </div>
              <p className="text-sm text-gray-600">Подписчиков</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Eye className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-2xl font-bold text-gray-900">
                  {currentProfile.stats.viewsReceived.toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-600">Просмотров</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      {editable && (
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'profile', name: 'Профиль', icon: User },
              { id: 'preferences', name: 'Предпочтения', icon: Settings },
              { id: 'privacy', name: 'Приватность', icon: Shield },
              { id: 'appearance', name: 'Внешний вид', icon: Palette }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 inline mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Email</Label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={currentProfile.email}
                    onChange={(e) => updateProfile('email', e.target.value)}
                  />
                ) : (
                  <p className="text-gray-900">{currentProfile.email}</p>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Местоположение</Label>
                {isEditing ? (
                  <Input
                    value={currentProfile.location}
                    onChange={(e) => updateProfile('location', e.target.value)}
                  />
                ) : (
                  <p className="text-gray-900">{currentProfile.location}</p>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Веб-сайт</Label>
                {isEditing ? (
                  <Input
                    value={currentProfile.website}
                    onChange={(e) => updateProfile('website', e.target.value)}
                  />
                ) : (
                  <a 
                    href={currentProfile.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {currentProfile.website}
                  </a>
                )}
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Социальные сети</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Twitter</Label>
                  {isEditing ? (
                    <Input
                      value={currentProfile.socialLinks.twitter || ''}
                      onChange={(e) => updateProfile('socialLinks.twitter', e.target.value)}
                      placeholder="username"
                    />
                  ) : (
                    <p className="text-gray-900">@{currentProfile.socialLinks.twitter}</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">LinkedIn</Label>
                  {isEditing ? (
                    <Input
                      value={currentProfile.socialLinks.linkedin || ''}
                      onChange={(e) => updateProfile('socialLinks.linkedin', e.target.value)}
                      placeholder="username"
                    />
                  ) : (
                    <p className="text-gray-900">{currentProfile.socialLinks.linkedin}</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">GitHub</Label>
                  {isEditing ? (
                    <Input
                      value={currentProfile.socialLinks.github || ''}
                      onChange={(e) => updateProfile('socialLinks.github', e.target.value)}
                      placeholder="username"
                    />
                  ) : (
                    <p className="text-gray-900">{currentProfile.socialLinks.github}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-6">
            {/* Favorite Categories */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Любимые категории</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {currentProfile.readingPreferences.favoriteCategories.map((category, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {category}
                    {isEditing && (
                      <button
                        onClick={() => removeCategory(category)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {isEditing && (
                <div className="flex space-x-2">
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Добавить категорию"
                    className="flex-1"
                  />
                  <Button onClick={addCategory} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Preferred Languages */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Предпочитаемые языки</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {currentProfile.readingPreferences.preferredLanguages.map((language, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                  >
                    {language}
                    {isEditing && (
                      <button
                        onClick={() => removeLanguage(language)}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {isEditing && (
                <div className="flex space-x-2">
                  <Input
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    placeholder="Добавить язык"
                    className="flex-1"
                  />
                  <Button onClick={addLanguage} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Reading Goals */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Цели чтения</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Книг в месяц
                  </Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={currentProfile.readingPreferences.readingGoals.booksPerMonth}
                      onChange={(e) => updateProfile('readingPreferences.readingGoals.booksPerMonth', parseInt(e.target.value))}
                    />
                  ) : (
                    <p className="text-gray-900">
                      {currentProfile.readingPreferences.readingGoals.booksPerMonth} книг
                    </p>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Минут в день
                  </Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={currentProfile.readingPreferences.readingGoals.minutesPerDay}
                      onChange={(e) => updateProfile('readingPreferences.readingGoals.minutesPerDay', parseInt(e.target.value))}
                    />
                  ) : (
                    <p className="text-gray-900">
                      {currentProfile.readingPreferences.readingGoals.minutesPerDay} минут
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Уведомления</h3>
              <div className="space-y-3">
                {Object.entries(currentProfile.readingPreferences.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        {key === 'email' && 'Email уведомления'}
                        {key === 'push' && 'Push уведомления'}
                        {key === 'bookRecommendations' && 'Рекомендации книг'}
                        {key === 'newComments' && 'Новые комментарии'}
                        {key === 'newFollowers' && 'Новые подписчики'}
                        {key === 'weeklyDigest' && 'Еженедельная сводка'}
                      </span>
                    </div>
                    {isEditing ? (
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => updateProfile(`readingPreferences.notifications.${key}`, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    ) : (
                      <span className={`text-sm ${value ? 'text-green-600' : 'text-gray-400'}`}>
                        {value ? 'Включено' : 'Выключено'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Настройки приватности</h3>
              <div className="space-y-4">
                {Object.entries(currentProfile.privacy).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        {key === 'showReadingHistory' && 'Показывать историю чтения'}
                        {key === 'showStats' && 'Показывать статистику'}
                        {key === 'showEmail' && 'Показывать email'}
                        {key === 'allowMessages' && 'Разрешить сообщения'}
                        {key === 'showOnlineStatus' && 'Показывать статус онлайн'}
                      </span>
                    </div>
                    {isEditing ? (
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => updateProfile(`privacy.${key}`, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    ) : (
                      <span className={`text-sm ${value ? 'text-green-600' : 'text-red-600'}`}>
                        {value ? 'Включено' : 'Выключено'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Внешний вид</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Тема</Label>
                  {isEditing ? (
                    <select
                      value={currentProfile.appearance.theme}
                      onChange={(e) => updateProfile('appearance.theme', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="light">Светлая</option>
                      <option value="dark">Темная</option>
                      <option value="system">Системная</option>
                    </select>
                  ) : (
                    <div className="flex items-center space-x-2">
                      {currentProfile.appearance.theme === 'light' && <Sun className="h-4 w-4 text-yellow-500" />}
                      {currentProfile.appearance.theme === 'dark' && <Moon className="h-4 w-4 text-blue-500" />}
                      {currentProfile.appearance.theme === 'system' && <Monitor className="h-4 w-4 text-gray-500" />}
                      <span className="text-gray-900">
                        {currentProfile.appearance.theme === 'light' && 'Светлая'}
                        {currentProfile.appearance.theme === 'dark' && 'Темная'}
                        {currentProfile.appearance.theme === 'system' && 'Системная'}
                      </span>
                    </div>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Размер шрифта</Label>
                  {isEditing ? (
                    <select
                      value={currentProfile.appearance.fontSize}
                      onChange={(e) => updateProfile('appearance.fontSize', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="small">Маленький</option>
                      <option value="medium">Средний</option>
                      <option value="large">Большой</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">
                      {currentProfile.appearance.fontSize === 'small' && 'Маленький'}
                      {currentProfile.appearance.fontSize === 'medium' && 'Средний'}
                      {currentProfile.appearance.fontSize === 'large' && 'Большой'}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Шрифт</Label>
                  {isEditing ? (
                    <select
                      value={currentProfile.appearance.fontFamily}
                      onChange={(e) => updateProfile('appearance.fontFamily', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                      <option value="Source Sans Pro">Source Sans Pro</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">{currentProfile.appearance.fontFamily}</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Акцентный цвет</Label>
                  {isEditing ? (
                    <input
                      type="color"
                      value={currentProfile.appearance.accentColor}
                      onChange={(e) => updateProfile('appearance.accentColor', e.target.value)}
                      className="w-full h-10 border border-gray-300 rounded-lg"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: currentProfile.appearance.accentColor }}
                      ></div>
                      <span className="text-gray-900">{currentProfile.appearance.accentColor}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 