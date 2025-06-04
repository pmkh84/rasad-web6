import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

interface EditableCellProps {
  value: any;
  onChange: (value: any) => void;
  rowIndex: number;
  colIndex: number;
  isAdmin?: boolean;
}

export const EditableCell: React.FC<EditableCellProps> = ({ 
  value, 
  onChange, 
  rowIndex, 
  colIndex
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
      handleFormulaOrValue(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      handleFormulaOrValue(editValue);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleFormulaOrValue(editValue);
      // Move to next cell
      const nextCell = document.querySelector(`[data-row="${rowIndex}"][data-col="${colIndex + 1}"]`) as HTMLElement;
      if (nextCell) {
        nextCell.click();
        nextCell.focus();
      }
    }
  };

  const handleFormulaOrValue = (input: string) => {
    if (input.startsWith('=')) {
      try {
        const formula = input.substring(1)
          .replace(/([A-Z]+)(\d+)/g, (match, col, row) => {
            const colIndex = col.split('').reduce((acc, char) => 
              acc * 26 + char.charCodeAt(0) - 64, 0) - 1;
            return `getCellValue("${colIndex},${parseInt(row) - 1}")`;
          });
        // Create a safe evaluation context
        const getCellValue = (coord: string) => {
          const [col, row] = coord.split(',').map(Number);
          const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
          return cell ? Number(cell.textContent) || 0 : 0;
        };
        // eslint-disable-next-line no-new-func
        const result = new Function('getCellValue', `return ${formula}`)(getCellValue);
        onChange(isNaN(result) ? input : result);
      } catch (err) {
        onChange(input);
      }
    } else {
      onChange(input);
    }
  };

  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <td 
      className={clsx(
        'px-2 py-1.5 border border-gray-300 transition-all',
        {
          'p-0': isEditing,
          'hover:bg-blue-50 hover:shadow-inner cursor-pointer': !isEditing
        }
      )}
      onDoubleClick={handleDoubleClick}
      data-row={rowIndex}
      data-col={colIndex}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue ?? ''}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-full py-1.5 px-2 border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      ) : (
        <div className="min-h-[1.5rem] min-w-[3rem]">{displayValue ?? ''}</div>
      )}
    </td>
  );
};