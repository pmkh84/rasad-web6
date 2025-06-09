// Import XLSX from the global object since we're using CDN
const { utils, read, write } = XLSX;

let currentSheets = [];
let activeSheetIndex = 0;
let isAdmin = false;

// DOM Elements
const adminBtn = document.getElementById('adminBtn');
const adminLogin = document.getElementById('adminLogin');
const loginForm = document.getElementById('loginForm');
const mainContent = document.getElementById('mainContent');
const excelGrid = document.getElementById('excelGrid');
const sheetSelector = document.getElementById('sheetSelector');
const saveBtn = document.getElementById('saveBtn');
const downloadBtn = document.getElementById('downloadBtn');
const addSheet = document.getElementById('addSheet');
const deleteSheet = document.getElementById('deleteSheet');

// Event Listeners
adminBtn.addEventListener('click', toggleAdminPanel);
loginForm.addEventListener('submit', handleLogin);
sheetSelector.addEventListener('change', handleSheetChange);
saveBtn.addEventListener('click', handleSave);
downloadBtn.addEventListener('click', handleDownload);
addSheet.addEventListener('click', handleAddSheet);
deleteSheet.addEventListener('click', handleDeleteSheet);

// Initialize
loadExcelFile();

async function loadExcelFile() {
  try {
    const response = await fetch(`/data/sample.xlsx?t=${Date.now()}`);
    if (!response.ok) throw new Error('Failed to load file');
    
    const buffer = await response.arrayBuffer();
    const workbook = read(buffer);
    
    currentSheets = workbook.SheetNames.map(name => {
      const worksheet = workbook.Sheets[name];
      const data = utils.sheet_to_json(worksheet, { header: 1 });
      return { name, data };
    });
    
    updateSheetSelector();
    renderActiveSheet();
  } catch (error) {
    console.error('Error loading Excel file:', error);
  }
}

function updateSheetSelector() {
  sheetSelector.innerHTML = currentSheets.map((sheet, index) => 
    `<option value="${index}">${sheet.name}</option>`
  ).join('');
}

function renderActiveSheet() {
  const sheet = currentSheets[activeSheetIndex];
  if (!sheet) return;

  const headers = sheet.data[0] || [];
  const rows = sheet.data.slice(1);

  const table = document.createElement('table');
  
  // Create header row
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `<th></th>${headers.map((header, i) => 
    `<th>${header || String.fromCharCode(65 + i)}</th>`
  ).join('')}`;
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create data rows
  const tbody = document.createElement('tbody');
  rows.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${rowIndex + 1}</td>${headers.map((_, colIndex) => 
      `<td contenteditable="true" data-row="${rowIndex}" data-col="${colIndex}">${row[colIndex] || ''}</td>`
    ).join('')}`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  excelGrid.innerHTML = '';
  excelGrid.appendChild(table);

  // Add event listeners for editable cells
  table.querySelectorAll('[contenteditable="true"]').forEach(cell => {
    cell.addEventListener('blur', handleCellEdit);
    cell.addEventListener('keydown', handleCellKeydown);
  });
}

function handleCellEdit(event) {
  const cell = event.target;
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);
  const value = cell.textContent;

  currentSheets[activeSheetIndex].data[row + 1][col] = value;
}

function handleCellKeydown(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    event.target.blur();
  }
}

function handleSheetChange(event) {
  activeSheetIndex = parseInt(event.target.value);
  renderActiveSheet();
}

async function handleSave() {
  try {
    const workbook = {
      SheetNames: currentSheets.map(sheet => sheet.name),
      Sheets: {}
    };

    currentSheets.forEach(sheet => {
      workbook.Sheets[sheet.name] = utils.aoa_to_sheet(sheet.data);
    });

    const buffer = write(workbook, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const formData = new FormData();
    formData.append('file', blob, 'sample.xlsx');

    const response = await fetch('/api/save-excel', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Failed to save file');
    
    alert('فایل با موفقیت ذخیره شد');
  } catch (error) {
    console.error('Error saving file:', error);
    alert('خطا در ذخیره فایل');
  }
}

function handleDownload() {
  try {
    const workbook = {
      SheetNames: currentSheets.map(sheet => sheet.name),
      Sheets: {}
    };

    currentSheets.forEach(sheet => {
      workbook.Sheets[sheet.name] = utils.aoa_to_sheet(sheet.data);
    });

    const buffer = write(workbook, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'excel-export.xlsx';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading file:', error);
    alert('خطا در دانلود فایل');
  }
}

function handleAddSheet() {
  if (!isAdmin) return;
  const newSheet = {
    name: `Sheet${currentSheets.length + 1}`,
    data: [[]]
  };
  currentSheets.push(newSheet);
  activeSheetIndex = currentSheets.length - 1;
  updateSheetSelector();
  renderActiveSheet();
}

function handleDeleteSheet() {
  if (!isAdmin || currentSheets.length <= 1) return;
  currentSheets.splice(activeSheetIndex, 1);
  activeSheetIndex = Math.max(0, activeSheetIndex - 1);
  updateSheetSelector();
  renderActiveSheet();
}

function toggleAdminPanel() {
  if (isAdmin) {
    isAdmin = false;
    adminBtn.innerHTML = `
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <span>ورود به پنل مدیریت</span>
    `;
  } else {
    adminLogin.classList.remove('hidden');
  }
}

function handleLogin(event) {
  event.preventDefault();
  const password = document.getElementById('password').value;
  const errorElement = document.getElementById('loginError');

  if (password === 'admin123') {
    isAdmin = true;
    adminLogin.classList.add('hidden');
    adminBtn.innerHTML = `
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      <span>خروج از پنل مدیریت</span>
    `;
  } else {
    errorElement.textContent = 'رمز عبور اشتباه است';
  }
}