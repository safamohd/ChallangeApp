import React from 'react';
import { useLocation } from 'wouter';

interface MobileNavigationProps {
  onAddClick: () => void;
}

export default function MobileNavigation({ onAddClick }: MobileNavigationProps) {
  const [location, setLocation] = useLocation();

  return (
    <div className="sm:hidden fixed bottom-0 right-0 left-0 bg-white border-t border-slate-200 z-10">
      <div className="flex justify-around py-2 px-2">
        <button 
          className={`flex flex-col items-center p-2 rounded-xl ${location === '/' ? 'text-primary bg-primary/10' : 'text-slate-500'}`}
          onClick={() => setLocation('/')}
        >
          <i className="fas fa-home text-lg"></i>
          <span className="text-xs mt-1">الرئيسية</span>
        </button>
        
        <button 
          className={`flex flex-col items-center p-2 rounded-xl ${location === '/reports' ? 'text-primary bg-primary/10' : 'text-slate-500'}`}
          onClick={() => setLocation('/reports')}
        >
          <i className="fas fa-chart-pie text-lg"></i>
          <span className="text-xs mt-1">التحليل</span>
        </button>
        
        <button 
          className="flex flex-col items-center p-2 text-white bg-primary rounded-xl shadow-lg"
          onClick={onAddClick}
        >
          <i className="fas fa-plus text-lg"></i>
          <span className="text-xs mt-1">إضافة</span>
        </button>
        
        <button 
          className={`flex flex-col items-center p-2 rounded-xl ${location === '/goals' ? 'text-primary bg-primary/10' : 'text-slate-500'}`}
          onClick={() => setLocation('/goals')}
        >
          <i className="fas fa-bullseye text-lg"></i>
          <span className="text-xs mt-1">الأهداف</span>
        </button>
        
        <button 
          className={`flex flex-col items-center p-2 rounded-xl ${location === '/settings' ? 'text-primary bg-primary/10' : 'text-slate-500'}`}
          onClick={() => setLocation('/settings')}
        >
          <i className="fas fa-user text-lg"></i>
          <span className="text-xs mt-1">الملف</span>
        </button>
      </div>
    </div>
  );
}
