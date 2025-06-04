import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SheetSelectorProps {
  sheets: string[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export const SheetSelector: React.FC<SheetSelectorProps> = ({ 
  sheets, 
  activeIndex, 
  onSelect 
}) => {
  return (
    <div className="relative inline-block">
      <select
        value={activeIndex}
        onChange={(e) => onSelect(Number(e.target.value))}
        className="appearance-none bg-gray-100 border border-gray-300 rounded-md py-1.5 pl-3 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {sheets.map((sheet, index) => (
          <option key={index} value={index}>
            {sheet}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
    </div>
  );
};