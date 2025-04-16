import React from 'react';
import { Link } from 'wouter';

export default function Header() {
  return (
    <header className="bg-white shadow">
      <div className="max-w-5xl mx-auto p-4 flex justify-between items-center">
        <Link href="/">
          <h1 className="text-xl font-bold text-primary cursor-pointer">
            <i className="fas fa-wallet ml-2"></i>مصاريفي
          </h1>
        </Link>
        <div className="flex items-center gap-3">
          <button className="text-slate-500 hover:text-primary">
            <i className="fas fa-bell text-lg"></i>
          </button>
          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
            <i className="fas fa-user text-slate-500"></i>
          </div>
        </div>
      </div>
    </header>
  );
}
