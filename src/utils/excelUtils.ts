// Import XLSX from the global object since we're using CDN
declare const XLSX: any;
const { utils, read, write } = XLSX;

import type { SheetData } from '../components/ExcelEditor';

// Function to read an Excel file from the server
export async function readExcelFile(fileName: string) {
  try {
    const response = await fetch(`/data/${fileName}?t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Excel file: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const workbook = read(arrayBuffer);
    
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
    
    return {
      fileName,
      sheets
    };
  } catch (error) {
    console.error('Error reading Excel file:', error);
    throw error;
  }
}

// Function to save an Excel file
export async function saveExcelFile(fileName: string, sheets: SheetData[]) {
  try {
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
    
    const formData = new FormData();
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    formData.append('file', blob, fileName);
    
    const response = await fetch('/api/save-excel', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save Excel file: ${await response.text()}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving Excel file:', error);
    throw error;
  }
}

// Function to export the workbook to a local file
export function downloadExcel(fileName: string, sheets: SheetData[]) {
  try {
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
    
    return true;
  } catch (error) {
    console.error('Error downloading Excel file:', error);
    throw error;
  }
}