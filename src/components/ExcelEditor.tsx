import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Save, Download, Plus, Trash, Copy, RefreshCw, FileText, Bug } from 'lucide-react';
import { readExcelFile, saveExcelFile, downloadExcel, checkServerStatus } from '../utils/excelUtils';
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
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [fileName, setFileName] = useState('sample.xlsx');
  const [modified, setModified] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [serverStatus, setServerStatus] = useState<any>(null);

  useEffect(() => {
    loadExcelFile();
    // Check server status on load
    checkServerStatus().then(setServerStatus);
  }, []);

  const loadExcelFile = async (showLoadingToast = false) => {
    try {
      setLoading(true);
      setError(null);
      
      if (showLoadingToast) {
        toast.loading('در حال بارگذاری مجدد...', { id: 'reload' });
      }
      
      const result = await readExcelFile(fileName);
      
      if (!result || result.sheets.length === 0) {
        // ایجاد شیت پیش‌فرض اگر فایل وجود نداشت
        const defaultSheet: SheetData = {
          name: 'Sheet1',
          data: [
            ['نام', 'سن', 'شهر', 'امتیاز'],
            ['علی احمدی', 25, 'تهران', 85],
            ['مریم رضایی', 30, 'اصفهان', 92],
            ['حسن محمدی', 28, 'شیراز', 78]
          ],
          headers: ['نام', 'سن', 'شهر', 'امتیاز']
        };
        setSheets([defaultSheet]);
        setModified(true);
        toast.success('شیت پیش‌فرض ایجاد شد');
        return;
      }
      
      setSheets(result.sheets);
      setFileName(result.fileName);
      setModified(false);
      
      if (showLoadingToast) {
        toast.success('داده‌ها با موفقیت بارگذاری شد', { id: 'reload' });
      } else {
        toast.success('فایل اکسل با موفقیت بارگذاری شد');
      }
    } catch (err) {
      console.error('Error loading Excel file:', err);
      setError('خطا در بارگذاری فایل اکسل');
      toast.error('خطا در بارگذاری فایل اکسل');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    
    try {
      setRefreshing(true);
      
      // Check server status first
      const status = await checkServerStatus();
      setServerStatus(status);
      
      await loadExcelFile(true);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSave = async () => {
    if (saving) return; // Prevent multiple simultaneous saves
    
    try {
      setSaving(true);
      setError(null);
      
      const saveToast = toast.loading('در حال ذخیره تغییرات...');
      
      console.log('Starting save process...');
      
      // Check server status before saving
      const preStatus = await checkServerStatus();
      console.log('Server status before save:', preStatus);
      
      const result = await saveExcelFile(fileName, sheets);
      console.log('Save completed:', result);
      
      setModified(false);
      setLastSaveTime(new Date());
      
      toast.success('تغییرات با موفقیت ذخیره شد', { id: saveToast });
      
      // Wait a bit longer for file system to sync in production
      setTimeout(async () => {
        try {
          console.log('Refreshing data after save...');
          
          // Check server status after save
          const postStatus = await checkServerStatus();
          console.log('Server status after save:', postStatus);
          setServerStatus(postStatus);
          
          // Force reload from server
          const refreshResult = await readExcelFile(fileName);
          if (refreshResult && refreshResult.sheets.length > 0) {
            setSheets(refreshResult.sheets);
            console.log('Data refreshed successfully');
            toast.success('داده‌ها به‌روزرسانی شد', { duration: 2000 });
          }
        } catch (refreshError) {
          console.warn('Could not refresh data after save:', refreshError);
          toast.warning('ذخیره موفق بود اما بارگذاری مجدد با مشکل مواجه شد');
        }
      }, 2000); // Wait 2 seconds for production environment
      
    } catch (err) {
      console.error('Error saving Excel file:', err);
      const errorMessage = err instanceof Error ? err.message : 'خطا در ذخیره تغییرات';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
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
      data: [['ستون A', 'ستون B', 'ستون C'], ['', '', '']],
      headers: ['ستون A', 'ستون B', 'ستون C']
    };
    setSheets([...sheets, newSheet]);
    setActiveSheetIndex(sheets.length);
    setModified(true);
    toast.success('شیت جدید اضافه شد');
  };

  const handleDeleteSheet = () => {
    if (!isAdmin || sheets.length <= 1) return;
    const updatedSheets = sheets.filter((_, index) => index !== activeSheetIndex);
    setSheets(updatedSheets);
    setActiveSheetIndex(Math.max(0, activeSheetIndex - 1));
    setModified(true);
    toast.success('شیت حذف شد');
  };

  const handleDuplicateSheet = () => {
    if (!isAdmin) return;
    const currentSheet = sheets[activeSheetIndex];
    const newSheet: SheetData = {
      name: `${currentSheet.name} (کپی)`,
      data: JSON.parse(JSON.stringify(currentSheet.data)),
      headers: [...currentSheet.headers]
    };
    setSheets([...sheets, newSheet]);
    setActiveSheetIndex(sheets.length);
    setModified(true);
    toast.success('شیت کپی شد');
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

  const handleDebugInfo = async () => {
    try {
      const status = await checkServerStatus();
      setServerStatus(status);
      
      // Also check debug endpoint
      const debugResponse = await fetch('/api/debug/files');
      if (debugResponse.ok) {
        const debugData = await debugResponse.json();
        console.log('Debug info:', debugData);
        toast.success('اطلاعات دیباگ در کنسول نمایش داده شد');
      }
    } catch (error) {
      console.error('Debug error:', error);
      toast.error('خطا در دریافت اطلاعات دیباگ');
    }
  };

  if (error && !loading && sheets.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 my-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">خطا در بارگذاری فایل اکسل</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <div className="flex justify-center space-x-4">
          <Button onClick={loadExcelFile} className="flex items-center">
            <RefreshCw className="h-4 w-4 ml-2" />
            تلاش مجدد
          </Button>
          <Button onClick={handleDebugInfo} variant="outline" className="flex items-center">
            <Bug className="h-4 w-4 ml-2" />
            اطلاعات دیباگ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* نوار ابزار اصلی */}
      <div className="border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-medium text-gray-800 flex items-center">
            <FileText className="h-5 w-5 ml-2" />
            {fileName}
            {modified && <span className="mr-2 text-blue-500 text-sm">(تغییر یافته)</span>}
            {lastSaveTime && (
              <span className="mr-2 text-green-600 text-xs">
                آخرین ذخیره: {lastSaveTime.toLocaleTimeString('fa-IR')}
              </span>
            )}
            {serverStatus && (
              <span className="mr-2 text-gray-500 text-xs">
                فایل در سرور: {serverStatus.sampleFileExists ? '✓' : '✗'} 
                ({serverStatus.sampleFileSize || 0} بایت)
              </span>
            )}
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
          <Button
            onClick={handleDebugInfo}
            variant="ghost"
            size="sm"
            className="flex items-center ml-2"
            title="نمایش اطلاعات دیباگ"
          >
            <Bug className="h-4 w-4 ml-2" />
            <span>دیباگ</span>
          </Button>
          <Button
            onClick={handleRefresh}
            variant="ghost"
            className="flex items-center ml-2"
            disabled={loading || refreshing}
            title="بارگذاری مجدد داده‌ها"
          >
            {refreshing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 ml-2"></div>
                <span>بارگذاری...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 ml-2" />
                <span>بارگذاری مجدد</span>
              </>
            )}
          </Button>
          {modified && (
            <Button
              onClick={handleSave}
              className="flex items-center ml-2"
              disabled={loading || saving}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                  <span>در حال ذخیره...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 ml-2" />
                  <span>ذخیره تغییرات</span>
                </>
              )}
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
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-gray-700">در حال بارگذاری...</span>
            </div>
          </div>
        ) : null}
        {sheets.length > 0 && activeSheetIndex < sheets.length ? (
          <DataGrid
            data={sheets[activeSheetIndex].data}
            headers={sheets[activeSheetIndex].headers}
            onCellChange={handleCellChange}
            isAdmin={isAdmin}
          />
        ) : null}
      </div>
      
      {/* نمایش خطا در پایین صفحه */}
      {error && (
        <div className="border-t border-red-200 bg-red-50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-700">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              ✕
            </Button>
          </div>
        </div>
      )}
      
      {/* نمایش اطلاعات سرور در حالت دیباگ */}
      {serverStatus && (
        <div className="border-t border-gray-200 bg-gray-50 p-2 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>محیط: {serverStatus.environment}</span>
            <span>دایرکتوری داده: {serverStatus.dataDir}</span>
            <span>فایل‌ها: {serverStatus.filesInDataDir?.length || 0}</span>
          </div>
        </div>
      )}
    </div>
  );
};