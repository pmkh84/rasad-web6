import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Save, Download, Plus, Trash, Copy } from 'lucide-react';
import { readExcelFile, saveExcelFile, downloadExcel } from '../utils/excelUtils';
import { DataGrid } from './DataGrid';
import { SheetSelector } from './SheetSelector';
import { Button } from './ui/Button';

export interface SheetData {
  name: string;
  data: any[][];
  headers: string[];
}

export const ExcelEditor: React.FC<{ isAdmin?: boolean }> = ({ isAdmin = false }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [fileName, setFileName] = useState('sample.xlsx');
  const [modified, setModified] = useState(false);

  useEffect(() => {
    loadExcelFile();
  }, []);

  const loadExcelFile = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await readExcelFile(fileName);
      
      if (!result || result.sheets.length === 0) {
        setError('فایل اکسل یافت نشد');
        return;
      }
      
      setSheets(result.sheets);
      setFileName(result.fileName);
      setModified(false);
      toast.success('فایل اکسل با موفقیت بارگذاری شد');
    } catch (err) {
      console.error('Error loading Excel file:', err);
      setError('خطا در بارگذاری فایل اکسل');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await saveExcelFile(fileName, sheets);
      setModified(false);
      toast.success('تغییرات با موفقیت در ' + fileName + ' ذخیره شد');
    } catch (err) {
      console.error('Error saving Excel file:', err);
      toast.error('خطا در ذخیره تغییرات');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    try {
      downloadExcel(fileName, sheets);
      toast.success('فایل با موفقیت دانلود شد');
    } catch (err) {
      console.error('Error downloading file:', err);
      toast.error('خطا در دانلود فایل');
    }
  };

  const handleAddSheet = () => {
    if (!isAdmin) return;
    const newSheet: SheetData = {
      name: `Sheet${sheets.length + 1}`,
      data: [[]],
      headers: []
    };
    setSheets([...sheets, newSheet]);
    setActiveSheetIndex(sheets.length);
    setModified(true);
  };

  const handleDeleteSheet = () => {
    if (!isAdmin || sheets.length <= 1) return;
    const updatedSheets = sheets.filter((_, index) => index !== activeSheetIndex);
    setSheets(updatedSheets);
    setActiveSheetIndex(Math.max(0, activeSheetIndex - 1));
    setModified(true);
  };

  const handleDuplicateSheet = () => {
    if (!isAdmin) return;
    const currentSheet = sheets[activeSheetIndex];
    const newSheet: SheetData = {
      name: `${currentSheet.name} (Copy)`,
      data: JSON.parse(JSON.stringify(currentSheet.data)),
      headers: [...currentSheet.headers]
    };
    setSheets([...sheets, newSheet]);
    setActiveSheetIndex(sheets.length);
    setModified(true);
  };

  const handleCellChange = (rowIndex: number, columnIndex: number, value: any) => {
    const updatedSheets = [...sheets];
    const currentSheet = { ...updatedSheets[activeSheetIndex] };
    
    const newData = [...currentSheet.data];
    if (!newData[rowIndex]) {
      newData[rowIndex] = [];
    }
    
    newData[rowIndex][columnIndex] = value;
    currentSheet.data = newData;
    updatedSheets[activeSheetIndex] = currentSheet;
    
    setSheets(updatedSheets);
    setModified(true);
  };

  if (error && !loading && sheets.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 my-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">خطا در بارگذاری فایل اکسل</h2>
        <p className="text-gray-600 mb-6">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-medium text-gray-800">
            {fileName}
            {modified && <span className="mr-2 text-blue-500 text-sm">(تغییر یافته)</span>}
          </h2>
          <div className="flex items-center space-x-2">
            <SheetSelector 
              sheets={sheets.map(sheet => sheet.name)} 
              activeIndex={activeSheetIndex}
              onSelect={setActiveSheetIndex}
            />
            {isAdmin && (
              <div className="flex items-center space-x-1 mr-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddSheet}
                  title="افزودن شیت جدید"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteSheet}
                  disabled={sheets.length <= 1}
                  title="حذف شیت فعلی"
                >
                  <Trash className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDuplicateSheet}
                  title="کپی شیت فعلی"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {modified && (
            <Button
              onClick={handleSave}
              className="flex items-center ml-2"
              disabled={loading}
            >
              <Save className="h-4 w-4 ml-2" />
              <span>ذخیره تغییرات</span>
            </Button>
          )}
          <Button
            onClick={handleDownload}
            variant="outline"
            className="flex items-center"
            disabled={loading}
          >
            <Download className="h-4 w-4 ml-2" />
            <span>دانلود فایل</span>
          </Button>
        </div>
      </div>
      <div className="relative">
        {loading ? (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2">
              <span className="text-gray-700">در حال بارگذاری...</span>
            </div>
          </div>
        ) : null}
        {sheets.length > 0 && activeSheetIndex < sheets.length ? (
          <DataGrid
            data={sheets[activeSheetIndex].data}
            headers={sheets[activeSheetIndex].headers}
            onCellChange={handleCellChange}
          />
        ) : null}
      </div>
    </div>
  );
};