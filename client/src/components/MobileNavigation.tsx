import React from 'react';
import { useLocation } from 'wouter';
import { useNotifications } from '@/hooks/use-notifications';

interface MobileNavigationProps {
  onAddClick: () => void;
}

export default function MobileNavigation({ onAddClick }: MobileNavigationProps) {
  const [location, setLocation] = useLocation();
  const { unreadCount } = useNotifications();

  return (
    <div className="sm:hidden fixed bottom-0 right-0 left-0 bg-white border-t border-slate-200 z-10">
      <div className="flex justify-around py-3">
        <button 
          className={`flex flex-col items-center ${location === '/' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
          onClick={() => setLocation('/')}
        >
          <i className="fas fa-home text-lg"></i>
          <span className="text-xs mt-1">الرئيسية</span>
        </button>
        
        <button 
          className={`flex flex-col items-center ${location === '/expenses' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
          onClick={() => setLocation('/expenses')}
        >
          <i className="fas fa-receipt text-lg"></i>
          <span className="text-xs mt-1">المصاريف</span>
        </button>
        
        <button 
          className="flex flex-col items-center text-primary"
          onClick={onAddClick}
        >
          <i className="fas fa-plus-circle text-lg"></i>
          <span className="text-xs mt-1">إضافة</span>
        </button>
        
        <button 
          className={`flex flex-col items-center ${location === '/challenges' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
          onClick={() => setLocation('/challenges')}
        >
          <i className="fas fa-trophy text-lg"></i>
          <span className="text-xs mt-1">التحديات</span>
        </button>
        
        <button 
          className={`flex flex-col items-center ${location === '/analytics' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
          onClick={() => setLocation('/analytics')}
        >
          <i className="fas fa-chart-pie text-lg"></i>
          <span className="text-xs mt-1">تحليلات</span>
        </button>
        
        <button 
          className={`flex flex-col items-center relative ${location === '/notifications' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
          onClick={() => setLocation('/notifications')}
        >
          <i className="fas fa-bell text-lg"></i>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="text-xs mt-1">الإشعارات</span>
        </button>
      </div>
    </div>
  );
}
