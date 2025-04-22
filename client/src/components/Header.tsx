import React from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Bell, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

export default function Header() {
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-5xl mx-auto p-4">
        {/* رسالة الترحيب بالمستخدم */}
        {user && (
          <div className="mb-3 text-right">
            <h2 className="text-lg font-bold text-gray-800">
              مرحباً بك، {user.fullName || user.username}
            </h2>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <div>
            {user && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-slate-500 hover:text-red-500"
                onClick={handleLogout}
                title="تسجيل الخروج"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            )}
          </div>
          
          <Link href="/">
            <h1 className="text-xl font-bold text-primary cursor-pointer">
              <i className="fas fa-wallet ml-2"></i>مصاريفي
            </h1>
          </Link>
          
          <div className="flex items-center gap-3">
            {user && (
              <Button variant="ghost" size="icon" className="text-slate-500 hover:text-primary">
                <Bell className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
