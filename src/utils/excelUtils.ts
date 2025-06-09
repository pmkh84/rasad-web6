// Import XLSX from the global object since we're using CDN
declare const XLSX: any;
const { utils, read, write } = XLSX;

import type { SheetData } from '../components/ExcelEditor';
import { uploadExcelToFirebase } from '../../firebaseUpload'; // مسیر دقیق رو بسته به پروژه‌ات تنظیم کن

// Function to read an Excel file from the server with enhanced cache busting
export async function readExcelFile(fileName: string) {
  try {
    // Enhanced cache busting with multiple parameters
    const timestamp = new Date().getTime();
    const random = Math.random().toString(36).substring(7);
    const url = `/data/${fileName}?t=${timestamp}&r=${random}&nocache=true&v=${Date.now()}`;
    
    console.log('Fetching Excel file from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT'
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Excel file: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    console.log('Received buffer size:', arrayBuffer.byteLength);
    
    // بررسی اینکه آیا فایل خالی است یا نه
    if (arrayBuffer.byteLength === 0) {
      throw new Error('File is empty or corrupted');
    }
    
    const workbook = read(arrayBuffer);
    console.log('Workbook sheet names:', workbook.SheetNames);
    
    const sheets: SheetData[] = [];
    
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = utils.sheet_to_json(worksheet, { header: 1 });
      
      const headers = jsonData.length > 0 
        ? (jsonData[0] as any[]).map((header, index) => 
            header ? String(header) : String.fromCharCode(65 + index))
        : [];
      
      const data = jsonData.length > 0 ? jsonData.slice(1) : [];
      
      sheets.push({
        name: sheetName,
        data: data as any[][],
        headers: headers
      });
    });
    
    console.log('Parsed sheets:', sheets.length);
    
    return {
      fileName,
      sheets
    };
  } catch (error) {
    console.error('Error reading Excel file:', error);
    throw error;
  }
}

// Function to save an Excel file with enhanced error handling and verification
export async function saveExcelFile(fileName: string, sheets: SheetData[]) {
  try {
    

    console.log('Starting save process for:', fileName);
    console.log('Number of sheets:', sheets.length);
    
    const workbook = {
      SheetNames: [] as string[],
      Sheets: {} as Record<string, any>
    };
    
    sheets.forEach((sheet, index) => {
      console.log(`Processing sheet ${index + 1}: ${sheet.name}`);
      const sheetData = [sheet.headers, ...sheet.data];
      const worksheet = utils.aoa_to_sheet(sheetData);
      workbook.SheetNames.push(sheet.name);
      workbook.Sheets[sheet.name] = worksheet;
    });
    
    console.log('Creating Excel buffer...');
    const excelBuffer = write(workbook, { 
      type: 'buffer',
      bookType: 'xlsx',
      bookSST: false,
      compression: true
    });
    
    console.log('Excel buffer size:', excelBuffer.length);
    
    const formData = new FormData();
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    formData.append('file', blob, fileName);
    console.log('Sending save request...');

    const downloadURL = await uploadExcelToFirebase(blob, fileName);
    console.log('File uploaded to Firebase. Download URL:', downloadURL);

    
    console.log('Sending save request...');
    
    // Enhanced fetch with better error handling and longer timeout for production
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for production
    
    try {
      const response = await fetch('/api/save-excel', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      console.log('Save response status:', response.status);
      console.log('Save response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Save failed with response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Save result:', result);
      
      // تأیید موفقیت‌آمیز بودن ذخیره
      if (!result.success) {
        throw new Error(result.error || 'خطا در ذخیره فایل');
      }
      
      // Additional verification - check if file was actually saved
      console.log('Verifying file save...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      try {
        const verifyResponse = await fetch(`/api/health`);
        if (verifyResponse.ok) {
          const healthData = await verifyResponse.json();
          console.log('Health check after save:', healthData);
          
          if (!healthData.sampleFileExists || healthData.sampleFileSize === 0) {
            console.warn('File verification failed - file may not have been saved properly');
          }
        }
      } catch (verifyError) {
        console.warn('Could not verify file save:', verifyError);
      }
      
      return result;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('درخواست به دلیل طولانی شدن زمان انتظار لغو شد');
      }
      
      // Handle network errors
      if (fetchError.message.includes('Failed to fetch') || 
          fetchError.message.includes('ERR_QUIC_PROTOCOL_ERROR')) {
        throw new Error('خطا در اتصال به سرور. لطفاً مجدداً تلاش کنید.');
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error('Error saving Excel file:', error);
    throw error;
  }
}

// Function to export the workbook to a local file
export function downloadExcel(fileName: string, sheets: SheetData[]) {
  try {
    console.log('Starting download for:', fileName);
    
    const workbook = {
      SheetNames: [] as string[],
      Sheets: {} as Record<string, any>
    };
    
    sheets.forEach(sheet => {
      const sheetData = [sheet.headers, ...sheet.data];
      const worksheet = utils.aoa_to_sheet(sheetData);
      workbook.SheetNames.push(sheet.name);
      workbook.Sheets[sheet.name] = worksheet;
    });
    
    const excelBuffer = write(workbook, { 
      type: 'buffer',
      bookType: 'xlsx',
      bookSST: false,
      compression: true
    });
    
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    console.log('Download completed');
    return true;
  } catch (error) {
    console.error('Error downloading Excel file:', error);
    throw error;
  }
}

// Function to verify file integrity after save
export async function verifyFileSave(fileName: string): Promise<boolean> {
  try {
    const timestamp = new Date().getTime();
    const response = await fetch(`/data/${fileName}?t=${timestamp}`, {
      method: 'HEAD',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    return response.ok && response.headers.get('content-length') !== '0';
  } catch (error) {
    console.warn('Could not verify file save:', error);
    return false;
  }
}

// Debug function to check server status
export async function checkServerStatus() {
  try {
    const response = await fetch('/api/health');
    if (response.ok) {
      const data = await response.json();
      console.log('Server status:', data);
      return data;
    }
  } catch (error) {
    console.error('Error checking server status:', error);
  }
  return null;
}