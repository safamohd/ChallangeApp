import React from 'react';
import { useLocation } from 'wouter';

interface MobileNavigationProps {
  onAddClick: () => void;
}

export default function MobileNavigation({ onAddClick }: MobileNavigationProps) {
  const [location, setLocation] = useLocation();

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
          className={`flex flex-col items-center ${location === '/analytics' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
          onClick={() => setLocation('/analytics')}
        >
          <i className="fas fa-chart-pie text-lg"></i>
          <span className="text-xs mt-1">تحليلات</span>
        </button>
        
        <button 
          className={`flex flex-col items-center ${location === '/profile' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
          onClick={() => setLocation('/profile')}
        >
          <i className="fas fa-user text-lg"></i>
          <span className="text-xs mt-1">الملف الشخصي</span>
        </button>
      </div>
    </div>
  );
}
