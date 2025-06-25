import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

type TableDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreateTable: (rows: number, columns: number, hasHeaderRow: boolean) => void;
};

export function TableDialog({ isOpen, onClose, onCreateTable }: TableDialogProps) {
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);
  const [hasHeaderRow, setHasHeaderRow] = useState(true);
  
  const handleCreateTable = () => {
    onCreateTable(rows, columns, hasHeaderRow);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Создать таблицу</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rows">Строки</Label>
              <Input
                id="rows"
                type="number"
                min={1}
                max={20}
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value) || 1)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="columns">Столбцы</Label>
              <Input
                id="columns"
                type="number"
                min={1}
                max={10}
                value={columns}
                onChange={(e) => setColumns(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="headerRow" 
              checked={hasHeaderRow}
              onCheckedChange={(checked) => setHasHeaderRow(checked === true)}
            />
            <Label htmlFor="headerRow">Строка заголовка</Label>
          </div>
          
          {/* Table preview */}
          <div className="border rounded p-2 overflow-auto">
            <div className="text-sm text-gray-500 mb-2">Предпросмотр:</div>
            <table className="w-full border-collapse">
              <tbody>
                {Array.from({ length: Math.min(rows, 5) }).map((_, r) => (
                  <tr key={r}>
                    {Array.from({ length: Math.min(columns, 5) }).map((_, c) => (
                      <td 
                        key={c}
                        className={`border px-2 py-1 text-xs ${r === 0 && hasHeaderRow ? 'bg-gray-100 font-bold' : ''}`}
                      >
                        {r === 0 && hasHeaderRow ? `Заголовок ${c+1}` : `Ячейка ${r+1}-${c+1}`}
                      </td>
                    ))}
                    {columns > 5 && <td className="border px-2 py-1 text-xs text-gray-400">...</td>}
                  </tr>
                ))}
                {rows > 5 && (
                  <tr>
                    {Array.from({ length: Math.min(columns, 5) + (columns > 5 ? 1 : 0) }).map((_, c) => (
                      <td key={c} className="border px-2 py-1 text-xs text-gray-400">...</td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleCreateTable}>Создать</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
