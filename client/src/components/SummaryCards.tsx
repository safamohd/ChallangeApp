import React from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Total Expenses Card */}
      <Card className="bg-white rounded-xl shadow p-5 flex justify-between items-center">
        {isLoading ? (
          <>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="w-10 h-10 rounded-full" />
          </>
        ) : (
          <>
            <div>
              <p className="text-slate-500 text-sm">إجمالي المصاريف</p>
              <h3 className="text-2xl font-bold">{formatCurrency(totalExpenses)}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <i className="fas fa-chart-line"></i>
            </div>
          </>
        )}
      </Card>

      {/* Budget Card */}
      <Card className="bg-white rounded-xl shadow p-5 flex justify-between items-center">
        {isLoading ? (
          <>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="w-10 h-10 rounded-full" />
          </>
        ) : (
          <>
            <div>
              <p className="text-slate-500 text-sm">الميزانية الشهرية</p>
              <h3 className="text-2xl font-bold">{formatCurrency(budget)}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-primary">
              <i className="fas fa-wallet"></i>
            </div>
          </>
        )}
      </Card>

      {/* Remaining Card */}
      <Card className="bg-white rounded-xl shadow p-5 flex justify-between items-center">
        {isLoading ? (
          <>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="w-10 h-10 rounded-full" />
          </>
        ) : (
          <>
            <div>
              <p className="text-slate-500 text-sm">المتبقي</p>
              <h3 className="text-2xl font-bold">{formatCurrency(remaining)}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <i className="fas fa-piggy-bank"></i>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
