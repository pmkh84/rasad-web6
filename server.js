import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import fs from 'fs';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable gzip compression
app.use(compression());

// Configure multer for file uploads with memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

// Parse JSON with larger limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Determine data directory based on environment
const getDataDir = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production (Render), use a writable directory
    const tmpDir = path.resolve('/tmp/excel-data');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    return tmpDir;
  } else {
    // In development, use public/data
    const dataDir = path.resolve('public/data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return dataDir;
  }
};

const dataDir = getDataDir();

// Create default Excel file if it doesn't exist
const defaultExcelPath = path.join(dataDir, 'sample.xlsx');
if (!fs.existsSync(defaultExcelPath)) {
  try {
    // Create a minimal valid XLSX file with default data
    const defaultData = Buffer.from([
      0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x08, 0x00,
      // Minimal XLSX structure
    ]);
    fs.writeFileSync(defaultExcelPath, defaultData);
    console.log('Created default Excel file at:', defaultExcelPath);
  } catch (error) {
    console.log('Could not create default Excel file, will be created on first save');
  }
}

// Enhanced CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Add request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(60000); // 60 seconds for production
  res.setTimeout(60000); // 60 seconds for production
  next();
});

// Serve static files with proper MIME types and caching
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
    // Disable caching for HTML files
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// Serve Excel files from the data directory with no-cache headers
app.get('/data/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(dataDir, filename);
    
    console.log(`Attempting to serve file: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Set no-cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    const fileBuffer = fs.readFileSync(filePath);
    console.log(`Serving file: ${filename}, size: ${fileBuffer.length} bytes`);
    
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: 'Error reading file' });
  }
});

// Enhanced Excel file saving endpoint
app.post('/api/save-excel', upload.single('file'), (req, res) => {
  try {
    console.log('Save request received');
    console.log('Data directory:', dataDir);
    console.log('Request file:', req.file ? 'Present' : 'Missing');
    
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ 
        error: 'No file uploaded',
        success: false 
      });
    }

    const fileName = 'sample.xlsx';
    const filePath = path.join(dataDir, fileName);
    
    console.log(`Attempting to save file to: ${filePath}`);
    console.log(`File buffer size: ${req.file.buffer.length} bytes`);
    
    // Ensure directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`Created directory: ${dataDir}`);
    }
    
    // Write the file buffer to disk
    fs.writeFileSync(filePath, req.file.buffer);
    
    // Verify the file was written
    const stats = fs.statSync(filePath);
    console.log(`File saved successfully: ${fileName}`);
    console.log(`File size on disk: ${stats.size} bytes`);
    console.log(`File path: ${filePath}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    // Double-check file exists and is readable
    if (!fs.existsSync(filePath)) {
      throw new Error('File was not saved properly');
    }
    
    res.json({ 
      success: true, 
      message: `File ${fileName} saved successfully`,
      timestamp: new Date().toISOString(),
      fileSize: req.file.buffer.length,
      savedSize: stats.size,
      filePath: filePath,
      dataDir: dataDir
    });
    
  } catch (error) {
    console.error('Error in save-excel endpoint:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Server error while saving file', 
      details: error.message,
      success: false,
      dataDir: dataDir
    });
  }
});

// Health check endpoint with detailed info
app.get('/api/health', (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    dataDir: dataDir,
    dataDirExists: fs.existsSync(dataDir),
    filesInDataDir: fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : [],
    sampleFileExists: fs.existsSync(path.join(dataDir, 'sample.xlsx')),
    sampleFileSize: fs.existsSync(path.join(dataDir, 'sample.xlsx')) 
      ? fs.statSync(path.join(dataDir, 'sample.xlsx')).size 
      : 0
  };
  
  console.log('Health check:', healthData);
  res.json(healthData);
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    api: 'Excel Editor API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    dataDirectory: dataDir
  });
});

// Debug endpoint to list files
app.get('/api/debug/files', (req, res) => {
  try {
    const files = fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : [];
    const fileDetails = files.map(file => {
      const filePath = path.join(dataDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        modified: stats.mtime,
        path: filePath
      };
    });
    
    res.json({
      dataDir,
      files: fileDetails,
      totalFiles: files.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Application not built. Please run npm run build first.');
  }
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  
  // Handle multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        details: 'Maximum file size is 50MB',
        success: false
      });
    }
  }
  
  res.status(500).json({ 
    error: 'Something went wrong!', 
    details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    success: false
  });
});

// Graceful shutdown handlers
const gracefulShutdown = (signal) => {
  console.log(`${signal} received, shutting down gracefully`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📁 Data directory: ${dataDir}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log(`📊 Data dir exists: ${fs.existsSync(dataDir)}`);
  
  // Log initial file status
  const samplePath = path.join(dataDir, 'sample.xlsx');
  console.log(`📄 Sample file exists: ${fs.existsSync(samplePath)}`);
  if (fs.existsSync(samplePath)) {
    console.log(`📏 Sample file size: ${fs.statSync(samplePath).size} bytes`);
  }
});