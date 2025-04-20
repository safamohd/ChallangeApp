import React from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface SummaryCardsProps {
  totalExpenses: number;
  budget: number;
  remaining: number;
  isLoading: boolean;
}

export default function SummaryCards({ 
  totalExpenses, 
  budget, 
  remaining, 
  isLoading 
}: SummaryCardsProps) {
  // Calculate percentage of budget spent
  const percentSpent = Math.min(Math.round((totalExpenses / budget) * 100), 100);
  
  return (
    <div className="mb-6">
      <Card className="bg-primary text-white rounded-2xl shadow-lg p-6 mb-4">
        {isLoading ? (
          <>
            <div className="space-y-2 mb-4">
              <Skeleton className="h-5 w-40 bg-white/20" />
              <Skeleton className="h-8 w-36 bg-white/20" />
            </div>
            <Skeleton className="h-2 w-full bg-white/20 rounded-full" />
          </>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-white/80 text-sm">إجمالي المصاريف الشهرية</p>
              <h3 className="text-2xl font-bold">{formatCurrency(totalExpenses)}</h3>
            </div>
            <Progress value={percentSpent} className="h-2 bg-white/20" />
            <div className="mt-2 text-left">
              <span className="text-sm text-white/80">{percentSpent}%</span>
            </div>
          </>
        )}
      </Card>
      
      <div className="grid grid-cols-4 gap-2 bg-white rounded-xl shadow p-2 mb-6">
        <button className="flex flex-col items-center justify-center p-3 hover:bg-gray-50 rounded-lg">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-primary mb-1">
            <i className="fas fa-plus"></i>
          </div>
          <span className="text-xs">إضافة</span>
        </button>
        
        <button className="flex flex-col items-center justify-center p-3 hover:bg-gray-50 rounded-lg">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-primary mb-1">
            <i className="fas fa-th-large"></i>
          </div>
          <span className="text-xs">الفئات</span>
        </button>
        
        <button className="flex flex-col items-center justify-center p-3 hover:bg-gray-50 rounded-lg">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-primary mb-1">
            <i className="fas fa-wallet"></i>
          </div>
          <span className="text-xs">الميزانية</span>
        </button>
        
        <button className="flex flex-col items-center justify-center p-3 hover:bg-gray-50 rounded-lg">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-primary mb-1">
            <i className="fas fa-bullseye"></i>
          </div>
          <span className="text-xs">الأهداف</span>
        </button>
      </div>
    </div>
  );
}
