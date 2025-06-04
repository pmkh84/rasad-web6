import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Lock } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (success: boolean) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      onLogin(true);
    } else {
      setError('رمز عبور اشتباه است');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md transform transition-all hover:scale-[1.01]">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-blue-500 p-4 rounded-full shadow-lg">
            <Lock className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">ورود به پنل مدیریت</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              رمز عبور
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="رمز عبور را وارد کنید"
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
          <Button type="submit" className="w-full text-lg py-3">
            ورود
          </Button>
        </form>
      </div>
    </div>
  );
};