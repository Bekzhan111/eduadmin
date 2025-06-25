'use client';

import React, { useState } from 'react';

// Копируем функцию getEnhancedPropertiesForTool напрямую
const getEnhancedPropertiesForTool = (toolId: string): Record<string, any> => {
  switch (toolId) {
    case 'rectangle':
      return {
        shapeType: 'rectangle',
        backgroundColor: '#e0e0e0',
        borderColor: '#000000',
        borderWidth: 0,
        borderRadius: 0,
      };
    case 'circle':
      return {
        shapeType: 'circle',
        backgroundColor: '#e0e0e0',
        borderColor: '#000000',
        borderWidth: 0,
      };
    case 'triangle':
      return {
        shapeType: 'triangle',
        backgroundColor: '#e0e0e0',
        borderColor: '#000000',
        borderWidth: 0,
      };
    case 'star':
      return {
        shapeType: 'star',
        backgroundColor: '#e0e0e0',
        borderColor: '#000000',
        borderWidth: 0,
      };
    case 'heart':
      return {
        shapeType: 'heart',
        backgroundColor: '#e0e0e0',
        borderColor: '#000000',
        borderWidth: 0,
      };
    default:
      return {
        shapeType: 'rectangle',
        backgroundColor: '#e0e0e0',
        borderColor: '#000000',
        borderWidth: 0,
        borderRadius: 0,
      };
  }
};

export default function TestShapesPage() {
  const [results, setResults] = useState<any[]>([]);

  const testShape = (shapeType: string) => {
    const properties = getEnhancedPropertiesForTool(shapeType);
    const result = {
      shapeType,
      properties,
      timestamp: new Date().toISOString()
    };
    setResults(prev => [...prev, result]);
  };

  const renderShape = (shapeType: string, properties: any) => {
    const style = {
      width: '100px',
      height: '100px',
      backgroundColor: properties.backgroundColor || '#e0e0e0',
      border: `${properties.borderWidth || 0}px solid ${properties.borderColor || 'transparent'}`,
      borderRadius: properties.borderRadius || 0,
      display: 'inline-block',
      margin: '10px'
    };

    switch (shapeType) {
      case 'circle':
        return (
          <div style={{...style, borderRadius: '50%'}} />
        );
      case 'triangle':
        return (
          <div style={{...style, backgroundColor: 'transparent', position: 'relative'}}>
            <svg 
              viewBox="0 0 100 100"
              style={{width: '100%', height: '100%'}}
              fill={properties.backgroundColor || '#e0e0e0'}
              stroke={properties.borderColor || 'transparent'}
              strokeWidth={properties.borderWidth || 0}
            >
              <polygon points="50 10, 90 90, 10 90" />
            </svg>
          </div>
        );
      case 'star':
        return (
          <div style={{...style, backgroundColor: 'transparent', position: 'relative'}}>
            <svg 
              viewBox="0 0 24 24"
              style={{width: '100%', height: '100%'}}
              fill={properties.backgroundColor || '#e0e0e0'}
              stroke={properties.borderColor || 'transparent'}
              strokeWidth={properties.borderWidth || 0}
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
        );
      case 'heart':
        return (
          <div style={{...style, backgroundColor: 'transparent', position: 'relative'}}>
            <svg 
              viewBox="0 0 24 24"
              style={{width: '100%', height: '100%'}}
              fill={properties.backgroundColor || '#e0e0e0'}
              stroke={properties.borderColor || 'transparent'}
              strokeWidth={properties.borderWidth || 0}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
        );
      default: // rectangle
        return <div style={style} />;
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Тест Фигур</h1>
      
      <div className="mb-4 space-x-2">
        <button 
          onClick={() => testShape('rectangle')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Прямоугольник
        </button>
        <button 
          onClick={() => testShape('circle')}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Круг
        </button>
        <button 
          onClick={() => testShape('triangle')}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Треугольник
        </button>
        <button 
          onClick={() => testShape('star')}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Звезда
        </button>
        <button 
          onClick={() => testShape('heart')}
          className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"
        >
          Сердце
        </button>
        <button 
          onClick={() => setResults([])}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Очистить
        </button>
      </div>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Визуальный тест:</h2>
        <div className="border-2 border-gray-300 bg-white p-4">
          {results.map((result, index) => (
            <div key={index} className="inline-block text-center">
              {renderShape(result.shapeType, result.properties)}
              <div className="text-sm">{result.shapeType}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Результаты тестов:</h2>
        <div className="space-y-2">
          {results.map((result, index) => (
            <div key={index} className="bg-gray-100 p-2 rounded">
              <div className="font-medium">Тест {index + 1}: {result.shapeType}</div>
              <div className="text-sm text-gray-600">
                shapeType в properties: {result.properties.shapeType}
              </div>
              <div className="text-xs text-gray-500">
                {result.timestamp}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 
