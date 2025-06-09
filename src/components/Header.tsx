import React from 'react';
import { FileSpreadsheet, Lock, Unlock } from 'lucide-react';
import { Button } from './ui/Button';

interface HeaderProps {
  isAdmin: boolean;
  onAdminClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isAdmin, onAdminClick }) => {
  return (
    <header className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileSpreadsheet className="h-8 w-8 text-white/90 ml-3" />
          <h1 className="text-2xl font-bold">ویرایشگر اکسل</h1>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-sm text-white/90 ml-6">
            ویرایش مستقیم فایل‌های اکسل در برنامه
          </div>
          <Button
            variant={isAdmin ? "danger" : "white"}
            size="md"
            onClick={onAdminClick}
            className="flex items-center shadow-md hover:shadow-lg transition-shadow"
          >
            {isAdmin ? (
              <>
                <Unlock className="h-4 w-4 ml-2" />
                <span>خروج از پنل مدیریت</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 ml-2" />
                <span>ورود به پنل مدیریت</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};