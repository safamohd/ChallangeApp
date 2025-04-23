import React from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import NotificationIcon from './NotificationIcon';
import UserTab from './UserTab';

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow">
      <div className="max-w-5xl mx-auto p-4">        
        <div className="flex justify-between items-center">
          <div>
            {user && <UserTab />}
          </div>
          
          <Link href="/">
            <h1 className="text-xl font-bold text-primary cursor-pointer">
              <i className="fas fa-wallet ml-2"></i>مصاريفي
            </h1>
          </Link>
          
          <div className="flex items-center gap-3">
            {user && <NotificationIcon />}
          </div>
        </div>
      </div>
    </header>
  );
}
