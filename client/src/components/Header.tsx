import React from 'react';
import { Link } from 'wouter';

export default function Header() {
  return (
    <header className="bg-primary text-white">
      <div className="max-w-5xl mx-auto p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <i className="fas fa-user text-white"></i>
          </div>
          <div className="text-left">
            <p className="text-sm opacity-90">مرحباً</p>
            <h2 className="font-bold text-white">أحمد</h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-white">
            <i className="fas fa-bell text-lg"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
