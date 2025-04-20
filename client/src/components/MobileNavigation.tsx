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
          className={`flex flex-col items-center ${location === '/reports' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
          onClick={() => setLocation('/reports')}
        >
          <i className="fas fa-chart-pie text-lg"></i>
          <span className="text-xs mt-1">التقارير</span>
        </button>
        
        <button 
          className="flex flex-col items-center text-primary"
          onClick={onAddClick}
        >
          <i className="fas fa-plus-circle text-lg"></i>
          <span className="text-xs mt-1">إضافة</span>
        </button>
        
        <button 
          className={`flex flex-col items-center ${location === '/goals' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
          onClick={() => setLocation('/goals')}
        >
          <i className="fas fa-bullseye text-lg"></i>
          <span className="text-xs mt-1">الأهداف</span>
        </button>
        
        <button 
          className={`flex flex-col items-center ${location === '/settings' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
          onClick={() => setLocation('/settings')}
        >
          <i className="fas fa-cog text-lg"></i>
          <span className="text-xs mt-1">الإعدادات</span>
        </button>
      </div>
    </div>
  );
}
