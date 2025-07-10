import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Divide, Asterisk, Equal, Calculator, Beaker, ArrowRightLeft, History } from 'lucide-react';

interface EnhancedCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'basic' | 'scientific' | 'converter' | 'history';

interface CalculationHistory {
  expression: string;
  result: string;
  timestamp: Date;
}

export function EnhancedCalculator({ isOpen, onClose }: EnhancedCalculatorProps) {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [memory, setMemory] = useState(0);
  const [history, setHistory] = useState<CalculationHistory[]>([]);
  
  // Unit converter states
  const [fromUnit, setFromUnit] = useState('meters');
  const [toUnit, setToUnit] = useState('feet');
  const [convertValue, setConvertValue] = useState('');
  const [convertResult, setConvertResult] = useState('');

  // Save history to localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('calculator-history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('calculator-history', JSON.stringify(history));
  }, [history]);

  const handleNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(display);
    } else if (operation) {
      const currentValue = previousValue || '0';
      const newValue = calculate(parseFloat(currentValue), inputValue, operation);
      
      setDisplay(String(newValue));
      setPreviousValue(String(newValue));
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '*':
        return firstValue * secondValue;
      case '/':
        return secondValue !== 0 ? firstValue / secondValue : 0;
      case '^':
        return Math.pow(firstValue, secondValue);
      default:
        return secondValue;
    }
  };

  const handleEqual = () => {
    const inputValue = parseFloat(display);
    
    if (previousValue !== null && operation) {
      const newValue = calculate(parseFloat(previousValue), inputValue, operation);
      const expression = `${previousValue} ${operation} ${inputValue}`;
      const result = String(newValue);
      
      // Add to history
      setHistory(prev => [...prev, {
        expression,
        result,
        timestamp: new Date()
      }].slice(-50)); // Keep last 50 calculations
      
      setDisplay(result);
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const handleScientificFunction = (func: string) => {
    const value = parseFloat(display);
    let result = 0;

    switch (func) {
      case 'sin':
        result = Math.sin(value * Math.PI / 180);
        break;
      case 'cos':
        result = Math.cos(value * Math.PI / 180);
        break;
      case 'tan':
        result = Math.tan(value * Math.PI / 180);
        break;
      case 'ln':
        result = Math.log(value);
        break;
      case 'log':
        result = Math.log10(value);
        break;
      case 'sqrt':
        result = Math.sqrt(value);
        break;
      case 'x²':
        result = Math.pow(value, 2);
        break;
      case '1/x':
        result = 1 / value;
        break;
      case 'π':
        result = Math.PI;
        break;
      case 'e':
        result = Math.E;
        break;
      default:
        return;
    }

    const expression = `${func}(${value})`;
    setHistory(prev => [...prev, {
      expression,
      result: String(result),
      timestamp: new Date()
    }].slice(-50));

    setDisplay(String(result));
    setWaitingForOperand(true);
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const handleDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const handleMemory = (action: string) => {
    const value = parseFloat(display);
    switch (action) {
      case 'MC':
        setMemory(0);
        break;
      case 'MR':
        setDisplay(String(memory));
        setWaitingForOperand(true);
        break;
      case 'M+':
        setMemory(memory + value);
        break;
      case 'M-':
        setMemory(memory - value);
        break;
      case 'MS':
        setMemory(value);
        break;
    }
  };

  // Unit conversion
  const conversions = {
    // Length
    meters: { feet: 3.28084, inches: 39.3701, yards: 1.09361, kilometers: 0.001, centimeters: 100 },
    feet: { meters: 0.3048, inches: 12, yards: 0.333333, kilometers: 0.0003048, centimeters: 30.48 },
    inches: { meters: 0.0254, feet: 0.0833333, yards: 0.0277778, kilometers: 0.0000254, centimeters: 2.54 },
    // Weight
    kilograms: { pounds: 2.20462, grams: 1000, ounces: 35.274 },
    pounds: { kilograms: 0.453592, grams: 453.592, ounces: 16 },
    grams: { kilograms: 0.001, pounds: 0.00220462, ounces: 0.035274 },
    // Temperature would need special handling
  };

  const handleUnitConversion = () => {
    const value = parseFloat(convertValue);
    if (isNaN(value)) return;

    // @ts-expect-error - we know the structure
    const conversionRate = conversions[fromUnit]?.[toUnit];
    if (conversionRate) {
      setConvertResult((value * conversionRate).toString());
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('calculator-history');
  };

  const tabs = [
    { id: 'basic', label: 'Базовый', icon: Calculator },
    { id: 'scientific', label: 'Научный', icon: Beaker },
    { id: 'converter', label: 'Конвертер', icon: ArrowRightLeft },
    { id: 'history', label: 'История', icon: History },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-[450px] max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Калькулятор</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex mt-3 bg-white/10 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Display */}
          {(activeTab === 'basic' || activeTab === 'scientific') && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-right text-3xl font-mono min-h-[70px] flex items-center justify-end border-2 border-gray-100">
              <span className="text-gray-800">{display}</span>
            </div>
          )}

          {/* Memory indicators */}
          {(activeTab === 'basic' || activeTab === 'scientific') && memory !== 0 && (
            <div className="text-xs text-blue-600 mb-2 text-center">
              Memory: {memory}
            </div>
          )}

          {/* Basic Calculator */}
          {activeTab === 'basic' && (
            <div className="space-y-3">
              {/* Memory buttons */}
              <div className="grid grid-cols-5 gap-2">
                {['MC', 'MR', 'M+', 'M-', 'MS'].map((btn) => (
                  <button
                    key={btn}
                    onClick={() => handleMemory(btn)}
                    className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                  >
                    {btn}
                  </button>
                ))}
              </div>

              {/* Main buttons */}
              <div className="grid grid-cols-4 gap-3">
                <button
                  onClick={handleClear}
                  className="col-span-2 p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  Clear
                </button>
                <button
                  onClick={() => handleOperation('/')}
                  className="p-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Divide className="h-5 w-5 mx-auto" />
                </button>
                <button
                  onClick={() => handleOperation('*')}
                  className="p-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Asterisk className="h-5 w-5 mx-auto" />
                </button>

                {[['7', '8', '9'], ['4', '5', '6'], ['1', '2', '3']].map((row, rowIndex) => (
                  <React.Fragment key={rowIndex}>
                    {row.map((num) => (
                      <button
                        key={num}
                        onClick={() => handleNumber(num)}
                        className="p-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors font-medium text-lg"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        if (rowIndex === 0) handleOperation('-');
                        else if (rowIndex === 1) handleOperation('+');
                        else handleEqual();
                      }}
                      className={`p-3 ${rowIndex === 2 ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'} text-white rounded-lg transition-colors`}
                    >
                      {rowIndex === 0 ? <Minus className="h-5 w-5 mx-auto" /> : 
                       rowIndex === 1 ? <Plus className="h-5 w-5 mx-auto" /> : 
                       <Equal className="h-5 w-5 mx-auto" />}
                    </button>
                  </React.Fragment>
                ))}

                <button
                  onClick={() => handleNumber('0')}
                  className="col-span-2 p-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors font-medium text-lg"
                >
                  0
                </button>
                <button
                  onClick={handleDecimal}
                  className="p-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors font-medium text-lg"
                >
                  .
                </button>
                <button
                  onClick={handleEqual}
                  className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Equal className="h-5 w-5 mx-auto" />
                </button>
              </div>
            </div>
          )}

          {/* Scientific Calculator */}
          {activeTab === 'scientific' && (
            <div className="space-y-3">
              {/* Scientific functions */}
              <div className="grid grid-cols-5 gap-2">
                {['sin', 'cos', 'tan', 'ln', 'log'].map((func) => (
                  <button
                    key={func}
                    onClick={() => handleScientificFunction(func)}
                    className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                  >
                    {func}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-5 gap-2">
                {['√', 'x²', '1/x', 'π', 'e'].map((func) => (
                  <button
                    key={func}
                    onClick={() => handleScientificFunction(func === '√' ? 'sqrt' : func)}
                    className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                  >
                    {func}
                  </button>
                ))}
              </div>

              {/* Basic operations for scientific */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={handleClear}
                  className="col-span-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  C
                </button>
                <button
                  onClick={() => handleOperation('^')}
                  className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  x^y
                </button>
                <button
                  onClick={() => handleOperation('/')}
                  className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  ÷
                </button>

                {['7', '8', '9', '*'].map((btn) => (
                  <button
                    key={btn}
                    onClick={() => btn === '*' ? handleOperation('*') : handleNumber(btn)}
                    className={`p-2 ${btn === '*' ? 'bg-orange-500 text-white' : 'bg-gray-200'} rounded-lg hover:${btn === '*' ? 'bg-orange-600' : 'bg-gray-300'} transition-colors`}
                  >
                    {btn === '*' ? '×' : btn}
                  </button>
                ))}

                {['4', '5', '6', '-'].map((btn) => (
                  <button
                    key={btn}
                    onClick={() => btn === '-' ? handleOperation('-') : handleNumber(btn)}
                    className={`p-2 ${btn === '-' ? 'bg-orange-500 text-white' : 'bg-gray-200'} rounded-lg hover:${btn === '-' ? 'bg-orange-600' : 'bg-gray-300'} transition-colors`}
                  >
                    {btn}
                  </button>
                ))}

                {['1', '2', '3', '+'].map((btn) => (
                  <button
                    key={btn}
                    onClick={() => btn === '+' ? handleOperation('+') : handleNumber(btn)}
                    className={`p-2 ${btn === '+' ? 'bg-orange-500 text-white' : 'bg-gray-200'} rounded-lg hover:${btn === '+' ? 'bg-orange-600' : 'bg-gray-300'} transition-colors`}
                  >
                    {btn}
                  </button>
                ))}

                <button
                  onClick={() => handleNumber('0')}
                  className="col-span-2 p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  0
                </button>
                <button
                  onClick={handleDecimal}
                  className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  .
                </button>
                <button
                  onClick={handleEqual}
                  className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  =
                </button>
              </div>
            </div>
          )}

          {/* Unit Converter */}
          {activeTab === 'converter' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">От:</label>
                  <select
                    value={fromUnit}
                    onChange={(e) => setFromUnit(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <optgroup label="Длина">
                      <option value="meters">Метры</option>
                      <option value="feet">Футы</option>
                      <option value="inches">Дюймы</option>
                    </optgroup>
                    <optgroup label="Вес">
                      <option value="kilograms">Килограммы</option>
                      <option value="pounds">Фунты</option>
                      <option value="grams">Граммы</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">В:</label>
                  <select
                    value={toUnit}
                    onChange={(e) => setToUnit(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <optgroup label="Длина">
                      <option value="meters">Метры</option>
                      <option value="feet">Футы</option>
                      <option value="inches">Дюймы</option>
                    </optgroup>
                    <optgroup label="Вес">
                      <option value="kilograms">Килограммы</option>
                      <option value="pounds">Фунты</option>
                      <option value="grams">Граммы</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Значение:</label>
                <input
                  type="number"
                  value={convertValue}
                  onChange={(e) => setConvertValue(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  placeholder="Введите значение"
                />
              </div>

              <button
                onClick={handleUnitConversion}
                className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Конвертировать
              </button>

              {convertResult && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-800">{convertResult}</div>
                    <div className="text-sm text-green-600">{toUnit}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* History */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-700">История вычислений</h4>
                <button
                  onClick={clearHistory}
                  className="text-sm text-red-600 hover:text-red-800 transition-colors"
                >
                  Очистить
                </button>
              </div>
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                {history.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    История вычислений пуста
                  </div>
                ) : (
                  history.slice().reverse().map((item, index) => (
                    <div
                      key={index}
                      onClick={() => setDisplay(item.result)}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <div className="font-mono text-sm">{item.expression} = {item.result}</div>
                      <div className="text-xs text-gray-500">
                        {item.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}