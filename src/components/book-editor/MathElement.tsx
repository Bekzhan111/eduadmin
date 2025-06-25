import React, { useState, useRef, useEffect } from 'react';
import { CanvasElement } from './types';
import { MathFormulaEditor } from './MathFormulaEditor';

type MathElementProps = {
  element: CanvasElement;
  isEditing: boolean;
  onUpdate: (updates: Partial<CanvasElement>) => void;
};

export function MathElement({ element, isEditing, onUpdate }: MathElementProps) {
  const [isEditingFormula, setIsEditingFormula] = useState(false);
  const formulaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Default MathML example if no formula is provided
  const defaultMathML = `
    <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
      <mrow>
        <mi>E</mi>
        <mo>=</mo>
        <msup>
          <mi>mc</mi>
          <mn>2</mn>
        </msup>
      </mrow>
    </math>
  `;
  
  // Update element dimensions based on formula size
  const updateElementDimensions = () => {
    if (formulaRef.current) {
      // Get precise measurements of the formula
      const rect = formulaRef.current.getBoundingClientRect();
      
      // Minimal padding
      const padding = 4; // 2px on each side
      
      const newWidth = Math.max(rect.width + padding, 30);
      const newHeight = Math.max(rect.height + padding, 25);
      
      // Update parent element dimensions
      onUpdate({
        width: newWidth,
        height: newHeight
      });
    }
  };
  
  // Update dimensions when formula changes or component mounts
  useEffect(() => {
    if (formulaRef.current) {
      // Initial update after render
      updateElementDimensions();
    }
  }, [element.properties.mathFormula]);
  
  // Effect to automatically open formula editor when element is first added
  // or when clicking on an empty formula element
  useEffect(() => {
    if (isEditing && !element.properties.mathFormula) {
      setIsEditingFormula(true);
    }
  }, [isEditing, element.properties.mathFormula]);
  
  const handleSaveFormula = (formula: string) => {
    onUpdate({
      properties: {
        ...element.properties,
        mathFormula: formula
      }
    });
    setIsEditingFormula(false);
    
    // Force recalculation of dimensions after formula is saved
    setTimeout(() => {
      updateElementDimensions();
    }, 100); // Small delay to ensure formula is rendered
  };
  
  const handleCancelEdit = () => {
    setIsEditingFormula(false);
  };
  
  const getFontSize = () => {
    switch (element.properties.mathSize) {
      case 'small': return '0.8em';
      case 'large': return '1.5em';
      default: return '1em';
    }
  };
  
  if (isEditing && isEditingFormula) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-[350px] min-w-[350px] max-h-[80vh] overflow-hidden">
          <div className="p-3 border-b flex justify-between items-center bg-blue-50 rounded-t-lg">
            <h3 className="font-medium text-gray-800 text-sm">Редактор математических формул</h3>
          </div>
          
          <div className="p-3 overflow-y-auto max-h-[calc(80vh-70px)]">
            <MathFormulaEditor 
              initialFormula={element.properties.mathFormula || defaultMathML}
              onSave={handleSaveFormula}
              onCancel={handleCancelEdit}
            />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef}
      className={`flex items-center justify-center ${isEditing ? 'cursor-pointer border-2 border-dashed border-blue-300' : ''}`}
      onClick={() => isEditing && setIsEditingFormula(true)}
      style={{
        fontSize: getFontSize(),
        backgroundColor: element.properties.backgroundColor || 'transparent',
        padding: 0, // Remove padding from container
        width: 'auto', // Let the container size match the content
        height: 'auto',
        display: 'inline-flex',
        borderRadius: '4px',
      }}
    >
      {element.properties.mathFormula ? (
        <div 
          ref={formulaRef}
          className="math-formula p-1" // Add minimal padding to the formula itself
          dangerouslySetInnerHTML={{ __html: element.properties.mathFormula }}
        />
      ) : (
        <div 
          ref={formulaRef}
          className="math-formula p-1" // Add minimal padding to the formula itself
          dangerouslySetInnerHTML={{ __html: defaultMathML }}
        />
      )}
    </div>
  );
}
