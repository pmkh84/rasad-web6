import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { EditableCell } from './EditableCell';

interface DataGridProps {
  data: any[][];
  headers: string[];
  onCellChange: (rowIndex: number, columnIndex: number, value: any) => void;
  isAdmin?: boolean;
}

export const DataGrid: React.FC<DataGridProps> = ({ 
  data, 
  headers, 
  onCellChange,
  isAdmin = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = searchTerm 
    ? data.filter(row => 
        row.some(cell => 
          String(cell).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : data;

  const calculateColumns = () => {
    if (headers && headers.length > 0) return headers;
    
    const maxWidth = data.reduce((max, row) => Math.max(max, row.length), 0);
    return Array.from({ length: maxWidth }, (_, i) => 
      String.fromCharCode(65 + i % 26) + (i >= 26 ? Math.floor(i / 26) : '')
    );
  };

  const columns = calculateColumns();

  return (
    <div className="overflow-auto">
      <div className="p-4 border-b border-gray-200">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در صفحه گسترده..."
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>
      
      <div className="relative overflow-x-auto shadow-md">
        <table className="w-full text-sm text-right text-gray-500 border-collapse">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 bg-gray-200 border border-gray-300 font-semibold text-center w-12"></th>
              {columns.map((header, index) => (
                <th key={index} className="px-3 py-2 bg-gray-200 border border-gray-300 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="px-2 py-2 font-medium text-gray-700 bg-gray-100 border border-gray-300 text-center sticky right-0">
                  {rowIndex + 1}
                </td>
                {columns.map((_, colIndex) => (
                  <EditableCell
                    key={colIndex}
                    value={row[colIndex] ?? ''}
                    onChange={(value) => onCellChange(rowIndex, colIndex, value)}
                    rowIndex={rowIndex}
                    colIndex={colIndex}
                    isAdmin={isAdmin}
                  />
                ))}
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="p-4 text-center text-gray-500">
                  داده‌ای یافت نشد. {searchTerm && 'عبارت جستجو را تغییر دهید.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};