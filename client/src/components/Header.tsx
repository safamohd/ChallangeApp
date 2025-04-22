import React from 'react';
import { Link } from 'wouter';
import UserProfileDrawer from './UserProfileDrawer';
import { useAuth } from '@/hooks/use-auth';
import { Bell } from 'lucide-react';
import { Button } from './ui/button';

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow">
      <div className="max-w-5xl mx-auto p-4 flex justify-between items-center">
        <Link href="/">
          <h1 className="text-xl font-bold text-primary cursor-pointer">
            <i className="fas fa-wallet ml-2"></i>مصاريفي
          </h1>
        </Link>
        <div className="flex items-center gap-3">
          {user && (
            <>
              <Button variant="ghost" size="icon" className="text-slate-500 hover:text-primary">
                <Bell className="h-5 w-5" />
              </Button>
              <UserProfileDrawer />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
