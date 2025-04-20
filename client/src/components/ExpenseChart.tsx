import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { getArabicMonths } from "@/lib/utils";

interface CategorySummary {
  categoryId: number;
  name: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
}

interface ExpenseChartProps {
  summary: CategorySummary[];
  totalAmount: number;
  isLoading: boolean;
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
}

export default function ExpenseChart({ 
  summary, 
  totalAmount, 
  isLoading,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear 
}: ExpenseChartProps) {
  const months = getArabicMonths();
  
  // Generate years for dropdown (current year and 2 years back)
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear];
  
  // Calculate conic gradient for pie chart dynamically
  const calculateConicGradient = () => {
    if (!summary || summary.length === 0) return 'conic-gradient(#e2e8f0 0% 100%)';
    
    let gradient = 'conic-gradient(';
    let startPercentage = 0;
    
    summary.forEach((category, index) => {
      const endPercentage = startPercentage + category.percentage;
      gradient += `${category.color} ${startPercentage}% ${endPercentage}%`;
      
      if (index < summary.length - 1) {
        gradient += ', ';
      }
      
      startPercentage = endPercentage;
    });
    
    gradient += ')';
    return gradient;
  };

  return (
    <Card className="bg-white rounded-xl shadow mb-6">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-base">التحليلات</h3>
          <button className="text-primary text-sm font-medium">عرض المزيد</button>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4">
          <div className="font-bold text-lg">
            {months[selectedMonth]}
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-4 p-4">
            <Skeleton className="w-[180px] h-[180px] rounded-full" />
            <div className="flex flex-col gap-2 w-full">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-full h-5" />
              ))}
            </div>
          </div>
        ) : summary && summary.length > 0 ? (
          <div className="flex flex-col items-center">
            <div 
              className="relative w-36 h-36 mb-4"
            >
              <div className="absolute inset-0 rounded-full"
                   style={{ background: calculateConicGradient() }}>
              </div>
              <div className="absolute inset-[20%] bg-white rounded-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-red-500 font-bold text-xl">-{formatCurrency(totalAmount)}</div>
                </div>
              </div>
            </div>
            
            <div className="w-full grid grid-cols-2 gap-x-8 gap-y-1">
              {summary.slice(0, 4).map((category) => (
                <div key={category.categoryId} className="flex justify-between py-1">
                  <div className="flex items-center">
                    <span 
                      className="w-2 h-2 rounded-full ml-1" 
                      style={{ backgroundColor: category.color }}
                    ></span>
                    <span className="text-sm">{category.name}</span>
                  </div>
                  <span className="text-sm text-red-500">-{formatCurrency(category.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-500">لا توجد مصاريف مسجلة في هذا الشهر</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
