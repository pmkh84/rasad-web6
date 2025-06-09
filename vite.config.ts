import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'handle-excel-operations',
      configureServer(server) {
        const dataDir = path.resolve('public/data');
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }

        server.middlewares.use('/api/save-excel', async (req, res) => {
          if (req.method === 'POST') {
            try {
              const chunks = [];
              req.on('data', chunk => chunks.push(chunk));
              req.on('end', async () => {
                const buffer = Buffer.concat(chunks);
                const boundary = req.headers['content-type'].split('boundary=')[1];
                
                const fileStart = buffer.indexOf(Buffer.from(`Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`));
                if (fileStart === -1) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'Invalid file content' }));
                  return;
                }

                const contentStart = buffer.indexOf(Buffer.from('\r\n\r\n'), fileStart) + 4;
                const contentEnd = buffer.lastIndexOf(Buffer.from(`--${boundary}--`)) - 2;
                const fileContent = buffer.slice(contentStart, contentEnd);

                const fileName = 'sample.xlsx';
                const filePath = path.join(dataDir, fileName);

                try {
                  fs.writeFileSync(filePath, fileContent);
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 200;
                  res.end(JSON.stringify({ 
                    success: true, 
                    message: `File ${fileName} saved successfully` 
                  }));
                } catch (writeError) {
                  console.error('Error writing file:', writeError);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ 
                    error: 'Error saving file', 
                    details: writeError.message 
                  }));
                }
              });
            } catch (error) {
              console.error('Error handling file upload:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Server error' }));
            }
          } else {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method not allowed' }));
          }
        });
      }
    }
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['clsx', 'lucide-react', 'react-hot-toast']
        }
      }
    }
  },
  server: {
    port: process.env.PORT || 3000,
    host: true
  }
});