'use client';

import { useState } from 'react';
import { safeCopyToClipboard, showCopyNotification } from '@/utils/clipboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, BookOpen, Copy, Download, Upload, 
  CheckCircle2, XCircle, AlertCircle, FileText,
  Image as ImageIcon, Archive, RefreshCw
} from 'lucide-react';

export default function TestClipboardPage() {
  const [testText, setTestText] = useState('test-key-12345-abcdef');
  const [copyResults, setCopyResults] = useState<string[]>([]);

  const handleTestCopy = async (text: string, description: string) => {
    const success = await safeCopyToClipboard(text);
    showCopyNotification(text, success);
    
    const result = `${description}: ${success ? '✅ Успешно' : '❌ Ошибка'}`;
    setCopyResults(prev => [result, ...prev.slice(0, 9)]);
  };

  const testCases = [
    { text: 'simple-key-123', description: 'Простой ключ' },
    { text: 'very-long-registration-key-with-many-characters-12345-abcdef-ghijkl', description: 'Длинный ключ' },
    { text: 'key-with-special-chars-!@#$%^&*()', description: 'Ключ со спецсимволами' },
    { text: 'https://example.com/register?key=abc123', description: 'URL с ключом' },
    { text: 'multi\nline\nkey\ntest', description: 'Многострочный текст' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Тест Системы Копирования</h1>
        <p className="text-gray-600">
          Проверка работы улучшенной системы копирования в буфер обмена
        </p>
      </div>

      {/* Manual test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Copy className="h-5 w-5 mr-2" />
            Ручной Тест
          </CardTitle>
          <CardDescription>
            Введите текст и протестируйте копирование
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Введите текст для копирования"
              className="flex-1"
            />
            <Button 
              onClick={() => handleTestCopy(testText, 'Ручной ввод')}
              className="flex items-center space-x-2"
            >
              <Copy className="h-4 w-4" />
              <span>Копировать</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Predefined test cases */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Тестовые Случаи
          </CardTitle>
          <CardDescription>
            Различные типы ключей и текстов для тестирования
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testCases.map((testCase, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{testCase.description}</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestCopy(testCase.text, testCase.description)}
                    className="flex items-center space-x-1"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Копировать</span>
                  </Button>
                </div>
                <div className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded break-all">
                  {testCase.text}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Результаты Тестов
          </CardTitle>
          <CardDescription>
            История результатов копирования
          </CardDescription>
        </CardHeader>
        <CardContent>
          {copyResults.length > 0 ? (
            <div className="space-y-2">
              {copyResults.map((result, index) => (
                <div key={index} className="text-sm p-2 bg-gray-50 rounded font-mono">
                  {result}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Результаты тестов появятся здесь
            </div>
          )}
          
          {copyResults.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setCopyResults([])}
              className="mt-4 w-full"
            >
              Очистить Результаты
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Browser info */}
      <Card>
        <CardHeader>
          <CardTitle>Информация о Браузере</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Clipboard API:</strong> {navigator.clipboard ? '✅ Поддерживается' : '❌ Не поддерживается'}
            </div>
            <div>
              <strong>Secure Context:</strong> {window.isSecureContext ? '✅ Да' : '❌ Нет'}
            </div>
            <div>
              <strong>User Agent:</strong> {navigator.userAgent.substring(0, 50)}...
            </div>
            <div>
              <strong>execCommand:</strong> {document.queryCommandSupported?.('copy') ? '✅ Поддерживается' : '❌ Не поддерживается'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 