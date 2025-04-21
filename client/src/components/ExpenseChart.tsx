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
      <CardContent className="p-5">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg">توزيع المصاريف</h3>
          <div className="text-sm text-slate-500 font-medium">
            {months[selectedMonth]} {selectedYear}
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <Skeleton className="w-[200px] h-[200px] rounded-full" />
            <div className="flex flex-col gap-3 w-full max-w-[300px]">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="w-full h-6" />
              ))}
            </div>
          </div>
        ) : summary && summary.length > 0 ? (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <div 
              className="pie-chart relative w-[200px] h-[200px] rounded-full overflow-hidden mb-4 sm:mb-0"
              style={{ background: calculateConicGradient() }}
            >
              <div className="chart-center absolute w-[70%] h-[70%] bg-white rounded-full top-[15%] left-[15%] flex items-center justify-center shadow-sm">
                <span className="text-lg font-bold">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              {summary.map((category) => (
                <div key={category.categoryId} className="flex items-center">
                  <span 
                    className="w-3 h-3 rounded-full ml-2" 
                    style={{ backgroundColor: category.color }}
                  ></span>
                  <span className="text-slate-600">{category.name}</span>
                  <span className="mr-auto font-medium">{formatCurrency(category.amount)}</span>
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
