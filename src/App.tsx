import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { ExcelEditor } from './components/ExcelEditor';
import { Header } from './components/Header';
import { AdminLogin } from './components/AdminLogin';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster position="top-right" />
      <Header isAdmin={isAdmin} onAdminClick={() => setIsAdmin(!isAdmin)} />
      {isAdmin ? (
        <AdminLogin onLogin={(success) => setIsAdmin(success)} />
      ) : (
        <main className="flex-1 p-4 container mx-auto max-w-7xl">
          <ExcelEditor isAdmin={isAdmin} />
        </main>
      )}
    </div>
  );
}

export default App;