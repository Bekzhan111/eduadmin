import React, { useState } from 'react';
import { CanvasElement } from './types';
import { Plus, Trash2, CheckSquare, Square, AlignLeft, AlignCenter, AlignRight, ChevronDown, Merge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type TableElementProps = {
  element: CanvasElement;
  isEditing: boolean;
  onUpdate: (updates: Partial<CanvasElement>) => void;
};

export function TableElement({ element, isEditing, onUpdate }: TableElementProps) {
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [showTableControls, setShowTableControls] = useState(false);
  const [showRowControls, setShowRowControls] = useState<number | null>(null);
  const [showColControls, setShowColControls] = useState<number | null>(null);
  
  // Add state for multiple cell selection
  const [selectionStart, setSelectionStart] = useState<{row: number, col: number} | null>(null);
  const [_selectionEnd, setSelectionEnd] = useState<{row: number, col: number} | null>(null);
  const [selectedCells, setSelectedCells] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  
  const tableData = element.properties.tableData || {
    rows: 3,
    columns: 3,
    cells: {},
    headerRow: true,
    borderCollapse: true,
    cellPadding: 8,
    borderColor: '#cccccc',
    borderWidth: 1,
  };
  
  // Handle cell click
  const handleCellClick = (rowIndex: number, colIndex: number) => {
    if (!isEditing) return;
    
    // If shift key is pressed, start multiple selection
    if (window.event && (window.event as MouseEvent).shiftKey) {
      if (!selectionStart) {
        setSelectionStart({ row: rowIndex, col: colIndex });
        setSelectionEnd({ row: rowIndex, col: colIndex });
        setSelectedCells([`${rowIndex}-${colIndex}`]);
      } else {
        setSelectionEnd({ row: rowIndex, col: colIndex });
        
        // Calculate selected cell range
        const startRow = Math.min(selectionStart.row, rowIndex);
        const endRow = Math.max(selectionStart.row, rowIndex);
        const startCol = Math.min(selectionStart.col, colIndex);
        const endCol = Math.max(selectionStart.col, colIndex);
        
        const newSelectedCells: string[] = [];
        for (let r = startRow; r <= endRow; r++) {
          for (let c = startCol; c <= endCol; c++) {
            // Check if cell is not already merged or part of another merged cell
            const cellKey = `${r}-${c}`;
            const cell = tableData.cells[cellKey];
            if (!cell?.rowSpan && !cell?.colSpan) {
              newSelectedCells.push(cellKey);
            }
          }
        }
        
        setSelectedCells(newSelectedCells);
      }
    } else {
      // Single cell selection
      const cellKey = `${rowIndex}-${colIndex}`;
      setSelectedCell(cellKey);
      setSelectionStart(null);
      setSelectionEnd(null);
      setSelectedCells([]);
    }
  };
  
  // Handle mouse down for selection
  const handleMouseDown = (rowIndex: number, colIndex: number) => {
    if (!isEditing) return;
    
    setIsSelecting(true);
    setSelectionStart({ row: rowIndex, col: colIndex });
    setSelectionEnd({ row: rowIndex, col: colIndex });
    setSelectedCells([`${rowIndex}-${colIndex}`]);
  };
  
  // Handle mouse over for selection
  const handleMouseOver = (rowIndex: number, colIndex: number) => {
    if (!isEditing || !isSelecting || !selectionStart) return;
    
    setSelectionEnd({ row: rowIndex, col: colIndex });
    
    // Calculate selected cell range
    const startRow = Math.min(selectionStart.row, rowIndex);
    const endRow = Math.max(selectionStart.row, rowIndex);
    const startCol = Math.min(selectionStart.col, colIndex);
    const endCol = Math.max(selectionStart.col, colIndex);
    
    const newSelectedCells: string[] = [];
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        // Skip cells that are part of merged cells
        const cellKey = `${r}-${c}`;
        const cell = tableData.cells[cellKey];
        if (!cell?.rowSpan && !cell?.colSpan) {
          newSelectedCells.push(cellKey);
        }
      }
    }
    
    setSelectedCells(newSelectedCells);
  };
  
  // Handle mouse up to end selection
  const handleMouseUp = () => {
    setIsSelecting(false);
  };
  
  // Handle cell content change
  const handleCellChange = (rowIndex: number, colIndex: number, content: string) => {
    const cellKey = `${rowIndex}-${colIndex}`;
    const updatedCells = { ...tableData.cells };
    updatedCells[cellKey] = {
      ...updatedCells[cellKey],
      content
    };
    
    onUpdate({
      properties: {
        ...element.properties,
        tableData: {
          ...tableData,
          cells: updatedCells
        }
      }
    });
  };
  
  // Add row
  const addRow = (_index: number) => {
    const newRowIndex = tableData.rows;
    const updatedCells = { ...tableData.cells };
    
    // Add cells for the new row
    for (let c = 0; c < tableData.columns; c++) {
      updatedCells[`${newRowIndex}-${c}`] = {
        content: `Ячейка ${newRowIndex+1}-${c+1}`,
        backgroundColor: 'transparent',
        textAlign: 'left',
        verticalAlign: 'middle',
        borderTop: true,
        borderRight: true,
        borderBottom: true,
        borderLeft: true,
        borderColor: tableData.borderColor,
        borderWidth: tableData.borderWidth,
        padding: tableData.cellPadding,
      };
    }
    
    onUpdate({
      properties: {
        ...element.properties,
        tableData: {
          ...tableData,
          rows: tableData.rows + 1,
          cells: updatedCells
        }
      }
    });
  };
  
  // Add column
  const addColumn = (_index: number) => {
    const newColIndex = tableData.columns;
    const updatedCells = { ...tableData.cells };
    
    // Add cells for the new column
    for (let r = 0; r < tableData.rows; r++) {
      updatedCells[`${r}-${newColIndex}`] = {
        content: r === 0 && tableData.headerRow ? `Заголовок ${newColIndex+1}` : `Ячейка ${r+1}-${newColIndex+1}`,
        backgroundColor: r === 0 && tableData.headerRow ? '#f2f2f2' : 'transparent',
        textAlign: 'left',
        verticalAlign: 'middle',
        borderTop: true,
        borderRight: true,
        borderBottom: true,
        borderLeft: true,
        borderColor: tableData.borderColor,
        borderWidth: tableData.borderWidth,
        fontWeight: r === 0 && tableData.headerRow ? 'bold' : 'normal',
        padding: tableData.cellPadding,
      };
    }
    
    onUpdate({
      properties: {
        ...element.properties,
        tableData: {
          ...tableData,
          columns: tableData.columns + 1,
          cells: updatedCells
        }
      }
    });
  };
  
  // Delete row
  const deleteRow = (index: number) => {
    if (tableData.rows <= 1) return; // Don't delete the last row
    
    const updatedCells: typeof tableData.cells = {};
    
    // Rebuild cells, skipping the deleted row and renumbering
    for (let r = 0; r < tableData.rows; r++) {
      if (r === index) continue; // Skip this row
      
      const newRowIndex = r > index ? r - 1 : r;
      
      for (let c = 0; c < tableData.columns; c++) {
        updatedCells[`${newRowIndex}-${c}`] = tableData.cells[`${r}-${c}`];
      }
    }
    
    onUpdate({
      properties: {
        ...element.properties,
        tableData: {
          ...tableData,
          rows: tableData.rows - 1,
          cells: updatedCells
        }
      }
    });
    
    setSelectedCell(null);
  };
  
  // Delete column
  const deleteColumn = (index: number) => {
    if (tableData.columns <= 1) return; // Don't delete the last column
    
    const updatedCells: typeof tableData.cells = {};
    
    // Rebuild cells, skipping the deleted column and renumbering
    for (let r = 0; r < tableData.rows; r++) {
      for (let c = 0; c < tableData.columns; c++) {
        if (c === index) continue; // Skip this column
        
        const newColIndex = c > index ? c - 1 : c;
        updatedCells[`${r}-${newColIndex}`] = tableData.cells[`${r}-${c}`];
      }
    }
    
    onUpdate({
      properties: {
        ...element.properties,
        tableData: {
          ...tableData,
          columns: tableData.columns - 1,
          cells: updatedCells
        }
      }
    });
    
    setSelectedCell(null);
  };
  
  // Toggle header row
  const toggleHeaderRow = () => {
    const updatedCells = { ...tableData.cells };
    
    // Update first row styling
    for (let c = 0; c < tableData.columns; c++) {
      updatedCells[`0-${c}`] = {
        ...updatedCells[`0-${c}`],
        backgroundColor: !tableData.headerRow ? '#f2f2f2' : 'transparent',
        fontWeight: !tableData.headerRow ? 'bold' : 'normal',
      };
    }
    
    onUpdate({
      properties: {
        ...element.properties,
        tableData: {
          ...tableData,
          headerRow: !tableData.headerRow,
          cells: updatedCells
        }
      }
    });
  };
  
  // Format cell
  const formatCell = (rowIndex: number, colIndex: number, property: string, value: unknown) => {
    const cellKey = `${rowIndex}-${colIndex}`;
    const updatedCells = { ...tableData.cells };
    
    updatedCells[cellKey] = {
      ...updatedCells[cellKey],
      [property]: value
    };
    
    onUpdate({
      properties: {
        ...element.properties,
        tableData: {
          ...tableData,
          cells: updatedCells
        }
      }
    });
  };
  
  // Merge selected cells
  const mergeSelectedCells = () => {
    if (selectedCells.length <= 1) {
      alert('Выберите несколько ячеек для объединения (используйте Shift + клик или перетаскивание)');
      return;
    }
    
    // Find the boundaries of the selection
    let minRow = tableData.rows;
    let maxRow = 0;
    let minCol = tableData.columns;
    let maxCol = 0;
    
    selectedCells.forEach(cellKey => {
      const [rowStr, colStr] = cellKey.split('-');
      const row = parseInt(rowStr);
      const col = parseInt(colStr);
      
      minRow = Math.min(minRow, row);
      maxRow = Math.max(maxRow, row);
      minCol = Math.min(minCol, col);
      maxCol = Math.max(maxCol, col);
    });
    
    // Calculate spans
    const rowSpan = maxRow - minRow + 1;
    const colSpan = maxCol - minCol + 1;
    
    if (rowSpan < 1 || colSpan < 1) {
      alert('Невозможно объединить выбранные ячейки');
      return;
    }
    
    // Create updated cells object
    const updatedCells = { ...tableData.cells };
    
    // Combine content from all selected cells
    let combinedContent = '';
    selectedCells.forEach(cellKey => {
      const cellContent = updatedCells[cellKey]?.content || '';
      if (cellContent) {
        combinedContent += (combinedContent ? ' ' : '') + cellContent;
      }
    });
    
    // Set the top-left cell as the merged cell
    const mergedCellKey = `${minRow}-${minCol}`;
    updatedCells[mergedCellKey] = {
      ...updatedCells[mergedCellKey],
      content: combinedContent,
      rowSpan,
      colSpan
    };
    
    // Remove other cells from the selection
    selectedCells.forEach(cellKey => {
      if (cellKey !== mergedCellKey) {
        // Keep the cell but mark it as part of a merged cell
        updatedCells[cellKey] = {
          ...updatedCells[cellKey],
          content: '',
          isMerged: true,
          mergedTo: mergedCellKey
        };
      }
    });
    
    onUpdate({
      properties: {
        ...element.properties,
        tableData: {
          ...tableData,
          cells: updatedCells
        }
      }
    });
    
    // Reset selection
    setSelectedCells([]);
    setSelectionStart(null);
    setSelectionEnd(null);
    setSelectedCell(mergedCellKey);
  };
  
  // Split merged cell
  const splitMergedCell = (rowIndex: number, colIndex: number) => {
    const cellKey = `${rowIndex}-${colIndex}`;
    const cell = tableData.cells[cellKey];
    
    if (!cell || (!cell.rowSpan && !cell.colSpan)) {
      alert('Эта ячейка не объединена');
      return;
    }
    
    const rowSpan = cell.rowSpan || 1;
    const colSpan = cell.colSpan || 1;
    const updatedCells = { ...tableData.cells };
    
    // Reset the merged cell
    updatedCells[cellKey] = {
      ...updatedCells[cellKey],
      rowSpan: undefined,
      colSpan: undefined
    };
    
    // Reset all cells that were part of this merged cell
    for (let r = rowIndex; r < rowIndex + rowSpan; r++) {
      for (let c = colIndex; c < colIndex + colSpan; c++) {
        if (r === rowIndex && c === colIndex) continue; // Skip the main cell
        
        const currentCellKey = `${r}-${c}`;
        updatedCells[currentCellKey] = {
          ...updatedCells[currentCellKey],
          content: '',
          isMerged: undefined,
          mergedTo: undefined,
          backgroundColor: 'transparent',
          textAlign: 'left',
          verticalAlign: 'middle',
          borderTop: true,
          borderRight: true,
          borderBottom: true,
          borderLeft: true,
          borderColor: tableData.borderColor,
          borderWidth: tableData.borderWidth,
          padding: tableData.cellPadding,
        };
      }
    }
    
    onUpdate({
      properties: {
        ...element.properties,
        tableData: {
          ...tableData,
          cells: updatedCells
        }
      }
    });
  };
  
  // Generate table rows and cells
  const renderTableRows = () => {
    const rows = [];
    
    for (let r = 0; r < tableData.rows; r++) {
      const cells = [];
      
      for (let c = 0; c < tableData.columns; c++) {
        const cellKey = `${r}-${c}`;
        const cell = tableData.cells[cellKey] || {};
        const isSelected = selectedCell === cellKey;
        const isInSelection = selectedCells.includes(cellKey);
        
        // Skip cells that are part of merged cells
        if (cell.isMerged) continue;
        
        cells.push(
          <td 
            key={cellKey}
            className={`relative ${isSelected ? 'ring-2 ring-blue-500' : ''} ${isInSelection ? 'bg-blue-100' : ''}`}
            onClick={() => handleCellClick(r, c)}
            onMouseDown={() => handleMouseDown(r, c)}
            onMouseOver={() => handleMouseOver(r, c)}
            onMouseUp={handleMouseUp}
            style={{
              backgroundColor: isInSelection ? 'rgba(59, 130, 246, 0.2)' : (cell.backgroundColor || 'transparent'),
              padding: `${cell.padding || tableData.cellPadding}px`,
              borderTop: cell.borderTop ? `${cell.borderWidth || tableData.borderWidth}px solid ${cell.borderColor || tableData.borderColor}` : 'none',
              borderRight: cell.borderRight ? `${cell.borderWidth || tableData.borderWidth}px solid ${cell.borderColor || tableData.borderColor}` : 'none',
              borderBottom: cell.borderBottom ? `${cell.borderWidth || tableData.borderWidth}px solid ${cell.borderColor || tableData.borderColor}` : 'none',
              borderLeft: cell.borderLeft ? `${cell.borderWidth || tableData.borderWidth}px solid ${cell.borderColor || tableData.borderColor}` : 'none',
              textAlign: cell.textAlign || 'left',
              verticalAlign: cell.verticalAlign || 'middle',
              fontWeight: cell.fontWeight || 'normal',
              fontStyle: cell.fontStyle || 'normal',
              textDecoration: cell.textDecoration || 'none',
              color: cell.color || '#000000',
            }}
            colSpan={cell.colSpan}
            rowSpan={cell.rowSpan}
          >
            {isEditing && isSelected ? (
              <div className="flex flex-col">
                <textarea
                  value={cell.content || ''}
                  onChange={(e) => handleCellChange(r, c, e.target.value)}
                  className="w-full p-1 border-none focus:outline-none bg-transparent resize-none"
                  autoFocus
                />
                
                {/* Cell formatting controls */}
                {isSelected && (
                  <div className="absolute top-full left-0 z-10 bg-white shadow-lg border rounded-md p-2 flex gap-2 mt-1">
                    <button 
                      className={`p-1 rounded ${cell.textAlign === 'left' ? 'bg-blue-100' : ''}`}
                      onClick={() => formatCell(r, c, 'textAlign', 'left')}
                    >
                      <AlignLeft size={14} />
                    </button>
                    <button 
                      className={`p-1 rounded ${cell.textAlign === 'center' ? 'bg-blue-100' : ''}`}
                      onClick={() => formatCell(r, c, 'textAlign', 'center')}
                    >
                      <AlignCenter size={14} />
                    </button>
                    <button 
                      className={`p-1 rounded ${cell.textAlign === 'right' ? 'bg-blue-100' : ''}`}
                      onClick={() => formatCell(r, c, 'textAlign', 'right')}
                    >
                      <AlignRight size={14} />
                    </button>
                    <button 
                      className={`p-1 rounded ${cell.fontWeight === 'bold' ? 'bg-blue-100' : ''}`}
                      onClick={() => formatCell(r, c, 'fontWeight', cell.fontWeight === 'bold' ? 'normal' : 'bold')}
                    >
                      B
                    </button>
                    <button 
                      className={`p-1 rounded ${cell.fontStyle === 'italic' ? 'bg-blue-100' : ''}`}
                      onClick={() => formatCell(r, c, 'fontStyle', cell.fontStyle === 'italic' ? 'normal' : 'italic')}
                    >
                      I
                    </button>
                    
                    {/* Add split button for merged cells */}
                    {(cell.rowSpan || cell.colSpan) && (
                      <button 
                        className="p-1 rounded bg-orange-100"
                        onClick={() => splitMergedCell(r, c)}
                        title="Разделить ячейки"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 12h12M12 6v12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>{cell.content || ''}</div>
            )}
          </td>
        );
      }
      
      rows.push(
        <tr 
          key={r}
          className={`group ${r % 2 === 1 && tableData.alternateRowColors ? 'bg-gray-50' : ''}`}
          onMouseEnter={() => setShowRowControls(r)}
          onMouseLeave={() => setShowRowControls(null)}
        >
          {cells}
          
          {/* Row controls */}
          {isEditing && showRowControls === r && (
            <td className="absolute -right-10 top-0 h-full flex items-center">
              <div className="flex flex-col gap-1">
                <button 
                  className="p-1 bg-gray-100 hover:bg-gray-200 rounded"
                  onClick={() => addRow(r)}
                  title="Добавить строку"
                >
                  <Plus size={14} />
                </button>
                <button 
                  className="p-1 bg-gray-100 hover:bg-gray-200 rounded"
                  onClick={() => deleteRow(r)}
                  title="Удалить строку"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </td>
          )}
        </tr>
      );
    }
    
    return rows;
  };
  
  // Column controls
  const renderColumnControls = () => {
    if (!isEditing) return null;
    
    return (
      <tr className="h-8">
        {Array.from({ length: tableData.columns }).map((_, c) => (
          <th 
            key={c}
            className="relative group"
            onMouseEnter={() => setShowColControls(c)}
            onMouseLeave={() => setShowColControls(null)}
          >
            {showColControls === c && (
              <div className="absolute -top-10 left-0 w-full flex justify-center">
                <div className="flex gap-1">
                  <button 
                    className="p-1 bg-gray-100 hover:bg-gray-200 rounded"
                    onClick={() => addColumn(c)}
                    title="Добавить столбец"
                  >
                    <Plus size={14} />
                  </button>
                  <button 
                    className="p-1 bg-gray-100 hover:bg-gray-200 rounded"
                    onClick={() => deleteColumn(c)}
                    title="Удалить столбец"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </th>
        ))}
      </tr>
    );
  };
  
  return (
    <div 
      className="relative w-full h-full overflow-auto"
      onMouseEnter={() => setShowTableControls(true)}
      onMouseLeave={() => setShowTableControls(false)}
    >
      {/* Table controls */}
      {isEditing && showTableControls && (
        <div className="absolute -top-10 left-0 z-10 bg-white shadow-lg border rounded-md p-2 flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                Таблица <ChevronDown size={14} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="flex flex-col gap-2 p-2">
                <div className="flex items-center gap-2">
                  <button 
                    className="flex items-center gap-1 p-2 hover:bg-gray-100 rounded w-full text-left"
                    onClick={toggleHeaderRow}
                  >
                    {tableData.headerRow ? <CheckSquare size={16} /> : <Square size={16} />}
                    Строка заголовка
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    className="flex items-center gap-1 p-2 hover:bg-gray-100 rounded w-full text-left"
                    onClick={() => onUpdate({
                      properties: {
                        ...element.properties,
                        tableData: {
                          ...tableData,
                          alternateRowColors: !tableData.alternateRowColors
                        }
                      }
                    })}
                  >
                    {tableData.alternateRowColors ? <CheckSquare size={16} /> : <Square size={16} />}
                    Чередующиеся строки
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    className="flex items-center gap-1 p-2 hover:bg-gray-100 rounded w-full text-left"
                    onClick={mergeSelectedCells}
                  >
                    <Merge size={16} className="mr-1" />
                    Объединить ячейки
                  </button>
                </div>
                
                <div className="text-xs text-gray-500 px-2">
                  Для объединения ячеек выделите их, удерживая Shift или перетаскиванием
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={mergeSelectedCells}
            disabled={selectedCells.length <= 1}
            title="Объединить выбранные ячейки"
          >
            <Merge size={14} className="mr-1" />
            Объединить
          </Button>
        </div>
      )}
      
      <table 
        className="w-full h-full border-collapse"
        style={{
          borderCollapse: tableData.borderCollapse ? 'collapse' : 'separate',
          borderSpacing: tableData.borderCollapse ? '0' : `${tableData.cellSpacing || 2}px`,
          backgroundColor: tableData.backgroundColor || 'transparent',
          borderRadius: `${tableData.borderRadius || 0}px`,
          overflow: 'hidden', // Ensures border radius is applied properly
        }}
      >
        {isEditing && renderColumnControls()}
        <tbody>
          {renderTableRows()}
        </tbody>
      </table>
    </div>
  );
} 
