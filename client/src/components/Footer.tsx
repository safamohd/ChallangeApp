import React from 'react';
import { Link } from 'wouter';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-10">
      <div className="max-w-5xl mx-auto p-4 flex flex-col sm:flex-row justify-between items-center">
        <p className="text-slate-500 text-sm mb-3 sm:mb-0">© ٢٠٢٣ تطبيق مصاريفي. جميع الحقوق محفوظة</p>
        <div className="flex gap-4">
          <Link href="#" className="text-slate-500 hover:text-primary text-sm">المساعدة</Link>
          <Link href="#" className="text-slate-500 hover:text-primary text-sm">الخصوصية</Link>
          <Link href="#" className="text-slate-500 hover:text-primary text-sm">الشروط والأحكام</Link>
        </div>
      </div>
    </footer>
  );
}
