import React, { useState, useEffect, useRef } from 'react';
import { 
  RotateCcw, Save, X, ChevronLeft, ChevronRight
} from 'lucide-react';

type MathFormulaEditorProps = {
  initialFormula: string;
  onSave: (formula: string) => void;
  onCancel: () => void;
};

// Helper function to convert visual editor content to MathML (hidden from user)
const convertToMathML = (visualFormula: string, display: 'inline' | 'block' = 'block'): string => {
  // This is a simplified implementation - a real one would need more sophisticated parsing
  return `<math xmlns="http://www.w3.org/1998/Math/MathML" display="${display}">
    ${visualFormula}
  </math>`;
};

// Helper function to extract content from MathML (hidden from user)
const extractFromMathML = (mathml: string): string => {
  // Simple extraction - a real implementation would need proper XML parsing
  const contentMatch = mathml.match(/<math[^>]*>([\s\S]*)<\/math>/i);
  return contentMatch ? contentMatch[1].trim() : '';
};

// Tab definitions for the math symbol categories
type MathSymbol = {
  label: string;
  value: string;
  render?: string;
};

type MathTab = {
  id: string;
  name: string;
  symbols: MathSymbol[];
};

const mathTabs: MathTab[] = [
  {
    id: 'basic',
    name: 'Basic',
    symbols: [
      { label: 'α', value: '<mi>&alpha;</mi>', render: 'α' },
      { label: 'β', value: '<mi>&beta;</mi>', render: 'β' },
      { label: 'γ', value: '<mi>&gamma;</mi>', render: 'γ' },
      { label: 'ABC', value: '<mi>ABC</mi>', render: 'ABC' },
      { label: 'sin', value: '<mi>sin</mi>', render: 'sin' },
      { label: '≥', value: '<mo>&ge;</mo>', render: '≥' },
      { label: 'x̄', value: '<mover><mi>x</mi><mo>&#175;</mo></mover>', render: 'x̄' },
      { label: '∑', value: '<mo>&sum;</mo>', render: '∑' },
      { label: '∫', value: '<mo>&int;</mo>', render: '∫' },
      { label: '∏', value: '<mo>&prod;</mo>', render: '∏' },
      { label: '(', value: '<mo>(</mo>', render: '(' },
      { label: 'H₂O', value: '<mi>H</mi><msub><mi>2</mi><mi>O</mi></msub>', render: 'H₂O' },
      { label: 'cos', value: '<mi>cos</mi>', render: 'cos' },
      { label: '÷', value: '<mo>&divide;</mo>', render: '÷' },
      { label: 'C', value: '<mi>C</mi>', render: 'C' },
      { label: 'V', value: '<mi>V</mi>', render: 'V' },
      { label: '→', value: '<mo>&rarr;</mo>', render: '→' },
      { label: '□', value: '<mo>&#9633;</mo>', render: '□' },
      { label: '□', value: '<mo>&#9633;</mo>', render: '□' },
      { label: '□', value: '<mo>&#9633;</mo>', render: '□' },
      { label: '□', value: '<mo>&#9633;</mo>', render: '□' },
      { label: ')', value: '<mo>)</mo>', render: ')' },
    ]
  },
  {
    id: 'greek',
    name: 'Greek',
    symbols: [
      { label: 'α', value: '<mi>&alpha;</mi>' },
      { label: 'β', value: '<mi>&beta;</mi>' },
      { label: 'γ', value: '<mi>&gamma;</mi>' },
      { label: 'δ', value: '<mi>&delta;</mi>' },
      { label: 'ε', value: '<mi>&epsilon;</mi>' },
      { label: 'ζ', value: '<mi>&zeta;</mi>' },
      { label: 'η', value: '<mi>&eta;</mi>' },
      { label: 'θ', value: '<mi>&theta;</mi>' },
      { label: 'ι', value: '<mi>&iota;</mi>' },
      { label: 'κ', value: '<mi>&kappa;</mi>' },
      { label: 'λ', value: '<mi>&lambda;</mi>' },
      { label: 'μ', value: '<mi>&mu;</mi>' },
      { label: 'ν', value: '<mi>&nu;</mi>' },
      { label: 'ξ', value: '<mi>&xi;</mi>' },
      { label: 'π', value: '<mi>&pi;</mi>' },
      { label: 'ρ', value: '<mi>&rho;</mi>' },
      { label: 'σ', value: '<mi>&sigma;</mi>' },
      { label: 'τ', value: '<mi>&tau;</mi>' },
      { label: 'υ', value: '<mi>&upsilon;</mi>' },
      { label: 'φ', value: '<mi>&phi;</mi>' },
      { label: 'χ', value: '<mi>&chi;</mi>' },
      { label: 'ψ', value: '<mi>&psi;</mi>' },
      { label: 'ω', value: '<mi>&omega;</mi>' },
      { label: 'Γ', value: '<mi>&Gamma;</mi>' },
      { label: 'Δ', value: '<mi>&Delta;</mi>' },
      { label: 'Θ', value: '<mi>&Theta;</mi>' },
      { label: 'Λ', value: '<mi>&Lambda;</mi>' },
      { label: 'Ξ', value: '<mi>&Xi;</mi>' },
      { label: 'Π', value: '<mi>&Pi;</mi>' },
      { label: 'Σ', value: '<mi>&Sigma;</mi>' },
      { label: 'Φ', value: '<mi>&Phi;</mi>' },
      { label: 'Ψ', value: '<mi>&Psi;</mi>' },
      { label: 'Ω', value: '<mi>&Omega;</mi>' },
    ]
  },
  {
    id: 'functions',
    name: 'Functions',
    symbols: [
      { label: 'sin', value: '<mi>sin</mi>' },
      { label: 'cos', value: '<mi>cos</mi>' },
      { label: 'tan', value: '<mi>tan</mi>' },
      { label: 'cot', value: '<mi>cot</mi>' },
      { label: 'sec', value: '<mi>sec</mi>' },
      { label: 'csc', value: '<mi>csc</mi>' },
      { label: 'arcsin', value: '<mi>arcsin</mi>' },
      { label: 'arccos', value: '<mi>arccos</mi>' },
      { label: 'arctan', value: '<mi>arctan</mi>' },
      { label: 'sinh', value: '<mi>sinh</mi>' },
      { label: 'cosh', value: '<mi>cosh</mi>' },
      { label: 'tanh', value: '<mi>tanh</mi>' },
      { label: 'log', value: '<mi>log</mi>' },
      { label: 'ln', value: '<mi>ln</mi>' },
      { label: 'exp', value: '<mi>exp</mi>' },
      { label: 'lim', value: '<mi>lim</mi>' },
      { label: 'f(x)', value: '<mi>f</mi><mo>(</mo><mi>x</mi><mo>)</mo>' },
      { label: 'f′(x)', value: '<mi>f</mi><mo>&prime;</mo><mo>(</mo><mi>x</mi><mo>)</mo>' },
      { label: '∫f(x)dx', value: '<mo>&int;</mo><mi>f</mi><mo>(</mo><mi>x</mi><mo>)</mo><mi>d</mi><mi>x</mi>' },
      { label: '∑', value: '<mo>&sum;</mo>' },
      { label: '∏', value: '<mo>&prod;</mo>' },
    ]
  },
  {
    id: 'operators',
    name: 'Operators',
    symbols: [
      { label: '+', value: '<mo>+</mo>' },
      { label: '−', value: '<mo>&minus;</mo>' },
      { label: '×', value: '<mo>&times;</mo>' },
      { label: '÷', value: '<mo>&divide;</mo>' },
      { label: '=', value: '<mo>=</mo>' },
      { label: '≠', value: '<mo>&ne;</mo>' },
      { label: '<', value: '<mo>&lt;</mo>' },
      { label: '>', value: '<mo>&gt;</mo>' },
      { label: '≤', value: '<mo>&le;</mo>' },
      { label: '≥', value: '<mo>&ge;</mo>' },
      { label: '±', value: '<mo>&plusmn;</mo>' },
      { label: '∓', value: '<mo>&mp;</mo>' },
      { label: '≈', value: '<mo>&approx;</mo>' },
      { label: '≡', value: '<mo>&equiv;</mo>' },
      { label: '≅', value: '<mo>&cong;</mo>' },
      { label: '∝', value: '<mo>&prop;</mo>' },
      { label: '→', value: '<mo>&rarr;</mo>' },
      { label: '←', value: '<mo>&larr;</mo>' },
      { label: '↔', value: '<mo>&harr;</mo>' },
      { label: '⇒', value: '<mo>&Rightarrow;</mo>' },
      { label: '⇐', value: '<mo>&Leftarrow;</mo>' },
      { label: '⇔', value: '<mo>&Leftrightarrow;</mo>' },
    ]
  },
  {
    id: 'matrices',
    name: 'Matrices',
    symbols: [
      { 
        label: '2×2', 
        value: '<mo>(</mo><mtable><mtr><mtd><mo>&#9633;</mo></mtd><mtd><mo>&#9633;</mo></mtd></mtr><mtr><mtd><mo>&#9633;</mo></mtd><mtd><mo>&#9633;</mo></mtd></mtr></mtable><mo>)</mo>',
        render: '( □□ )'
      },
      { 
        label: '3×3', 
        value: '<mo>(</mo><mtable><mtr><mtd><mo>&#9633;</mo></mtd><mtd><mo>&#9633;</mo></mtd><mtd><mo>&#9633;</mo></mtd></mtr><mtr><mtd><mo>&#9633;</mo></mtd><mtd><mo>&#9633;</mo></mtd><mtd><mo>&#9633;</mo></mtd></mtr><mtr><mtd><mo>&#9633;</mo></mtd><mtd><mo>&#9633;</mo></mtd><mtd><mo>&#9633;</mo></mtd></mtr></mtable><mo>)</mo>',
        render: '( □□□ )'
      },
      { 
        label: '|det|', 
        value: '<mo>|</mo><mtable><mtr><mtd><mo>&#9633;</mo></mtd><mtd><mo>&#9633;</mo></mtd></mtr><mtr><mtd><mo>&#9633;</mo></mtd><mtd><mo>&#9633;</mo></mtd></mtr></mtable><mo>|</mo>',
        render: '|□□|'
      },
      { 
        label: '[A]', 
        value: '<mo>[</mo><mtable><mtr><mtd><mo>&#9633;</mo></mtd><mtd><mo>&#9633;</mo></mtd></mtr><mtr><mtd><mo>&#9633;</mo></mtd><mtd><mo>&#9633;</mo></mtd></mtr></mtable><mo>]</mo>',
        render: '[□□]'
      },
      { 
        label: 'Vector', 
        value: '<mover><mi>a</mi><mo>→</mo></mover>',
        render: 'a⃗'
      },
      { 
        label: 'Unit Vector', 
        value: '<mover><mi>e</mi><mo>^</mo></mover>',
        render: 'ê'
      },
      { 
        label: 'Dot Product', 
        value: '<mi>a</mi><mo>&sdot;</mo><mi>b</mi>',
        render: 'a·b'
      },
      { 
        label: 'Cross Product', 
        value: '<mi>a</mi><mo>&times;</mo><mi>b</mi>',
        render: 'a×b'
      },
    ]
  },
  {
    id: 'advanced',
    name: 'Advanced',
    symbols: [
      { 
        label: 'Fraction', 
        value: '<mfrac><mrow>&#9633;</mrow><mrow>&#9633;</mrow></mfrac>',
        render: '□/□'
      },
      { 
        label: 'Square Root', 
        value: '<msqrt><mo>&#9633;</mo></msqrt>',
        render: '√□'
      },
      { 
        label: 'nth Root', 
        value: '<mroot><mrow>&#9633;</mrow><mrow>&#9633;</mrow></mroot>',
        render: '∛□'
      },
      { 
        label: 'Superscript', 
        value: '<msup><mrow>&#9633;</mrow><mrow>&#9633;</mrow></msup>',
        render: 'x²'
      },
      { 
        label: 'Subscript', 
        value: '<msub><mrow>&#9633;</mrow><mrow>&#9633;</mrow></msub>',
        render: 'x₁'
      },
      { 
        label: 'Sub-Super', 
        value: '<msubsup><mrow>&#9633;</mrow><mrow>&#9633;</mrow><mrow>&#9633;</mrow></msubsup>',
        render: 'x₁²'
      },
      { 
        label: 'Definite Integral', 
        value: '<msubsup><mo>&int;</mo><mrow>&#9633;</mrow><mrow>&#9633;</mrow></msubsup><mrow>&#9633;</mrow>',
        render: '∫ᵇₐ'
      },
      { 
        label: 'Sum', 
        value: '<munderover><mo>&sum;</mo><mrow>&#9633;</mrow><mrow>&#9633;</mrow></munderover>',
        render: '∑ᵏᵢ'
      },
      { 
        label: 'Product', 
        value: '<munderover><mo>&prod;</mo><mrow>&#9633;</mrow><mrow>&#9633;</mrow></munderover>',
        render: '∏ᵏᵢ'
      },
      { 
        label: 'Limit', 
        value: '<munder><mo>lim</mo><mrow>&#9633;</mrow></munder>',
        render: 'lim'
      },
      { 
        label: 'Cases', 
        value: '<mrow><mo>{</mo><mtable><mtr><mtd><mo>&#9633;</mtd><mtd><mo>&#9633;</mo></mtd></mtr><mtr><mtd><mo>&#9633;</mtd><mtd><mo>&#9633;</mo></mtd></mtr></mtable></mrow>',
        render: '{□□}'
      },
    ]
  }
];

export function MathFormulaEditor({ initialFormula, onSave, onCancel }: MathFormulaEditorProps) {
  const [formula, setFormula] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const tabContainerRef = useRef<HTMLDivElement>(null);

  // Initialize the editor with the provided formula
  useEffect(() => {
    if (initialFormula) {
      const extracted = extractFromMathML(initialFormula);
      setFormula(extracted);
      setHistory([extracted]);
      setHistoryIndex(0);
    } else {
      // Default formula
      const defaultFormula = '<mi>E</mi><mo>=</mo><mi>m</mi><msup><mi>c</mi><mn>2</mn></msup>';
      setFormula(defaultFormula);
      setHistory([defaultFormula]);
      setHistoryIndex(0);
    }
  }, [initialFormula]);

  // Add to history when formula changes
  const updateFormula = (newFormula: string) => {
    setFormula(newFormula);
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newFormula]);
    setHistoryIndex(prev => prev + 1);
  };

  // Undo/Redo functionality
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setFormula(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setFormula(history[historyIndex + 1]);
    }
  };

  // Insert element at cursor position
  const insertElement = (element: string) => {
    if (inputRef.current) {
      const start = inputRef.current.selectionStart;
      const end = inputRef.current.selectionEnd;
      const newFormula = 
        formula.substring(0, start) + 
        element + 
        formula.substring(end);
      
      updateFormula(newFormula);
      
      // Set cursor position after the inserted element
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(start + element.length, start + element.length);
        }
      }, 0);
    } else {
      updateFormula(formula + element);
    }
  };

  // Handle save
  const handleSave = () => {
    const mathML = convertToMathML(formula);
    onSave(mathML);
  };

  // Scroll tabs horizontally
  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabContainerRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      tabContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Get visible symbols for the current tab
  const visibleSymbols = mathTabs.find(tab => tab.id === activeTab)?.symbols || [];

  return (
    <div className="flex flex-col w-full">
      {/* Formula Preview */}
      <div className="p-3 bg-white flex justify-center items-center border rounded mb-2 w-full">
        <div 
          className="math-formula text-base"
          dangerouslySetInnerHTML={{ __html: convertToMathML(formula) }}
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex border rounded-t overflow-hidden bg-white mb-0 w-full">
        <button 
          className="flex items-center justify-center w-6 text-gray-500 bg-gray-100"
          onClick={() => scrollTabs('left')}
        >
          <ChevronLeft className="w-3 h-3" />
        </button>
        
        <div 
          ref={tabContainerRef}
          className="flex-1 flex overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {mathTabs.map(tab => (
            <button
              key={tab.id}
              className={`px-2 py-1 whitespace-nowrap font-medium text-xs transition-colors ${
                activeTab === tab.id 
                  ? 'text-white bg-red-500' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.name}
            </button>
          ))}
        </div>
        
        <button 
          className="flex items-center justify-center w-6 text-gray-500 bg-gray-100"
          onClick={() => scrollTabs('right')}
        >
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Symbol Grid */}
      <div className="border border-t-0 rounded-b p-2 bg-white mb-2 w-full">
        <div className="grid grid-cols-4 gap-1">
          {visibleSymbols.map((symbol, index) => (
            <button
              key={index}
              className="h-8 flex items-center justify-center border rounded hover:bg-blue-50 hover:border-blue-300 transition-colors text-sm min-h-[32px]"
              onClick={() => insertElement(symbol.value)}
              title={symbol.label}
            >
              {symbol.render || symbol.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between w-full">
        <div className="flex gap-1">
          <button
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Отменить"
          >
            <RotateCcw className={historyIndex <= 0 ? "text-gray-300 w-3 h-3" : "text-gray-600 w-3 h-3"} />
          </button>
          <button
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Повторить"
          >
            <RotateCcw 
              className={historyIndex >= history.length - 1 ? "text-gray-300 w-3 h-3" : "text-gray-600 w-3 h-3"} 
              style={{ transform: 'scaleX(-1)' }} 
            />
          </button>
        </div>
        <div className="flex gap-1">
          <button
            className="px-2 py-1 border rounded hover:bg-gray-200 transition-colors flex items-center gap-1 text-xs"
            onClick={onCancel}
          >
            <X className="w-3 h-3" />
            Отмена
          </button>
          <button
            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1 text-xs"
            onClick={handleSave}
          >
            <Save className="w-3 h-3" />
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
} 
