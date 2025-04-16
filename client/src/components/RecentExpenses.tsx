import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface Expense {
  id: number;
  title: string;
  amount: number;
  categoryId: number;
  date: string;
  notes?: string;
}

interface RecentExpensesProps {
  expenses: Expense[];
  isLoading: boolean;
}

export default function RecentExpenses({ expenses, isLoading }: RecentExpensesProps) {
  // Fetch categories for icon and color mapping
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });
  
  // Get category icon and color from categoryId
  const getCategoryDetails = (categoryId: number) => {
    const category = categories?.find((cat: any) => cat.id === categoryId);
    return {
      icon: category?.icon || 'question',
      color: category?.color || '#cccccc',
      backgroundColor: category?.color ? `${category.color}20` : '#f1f5f9', // 20 is for 12% opacity
    };
  };

  return (
    <Card className="bg-white rounded-xl shadow">
      <CardContent className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">آخر المصاريف</h3>
          <Button variant="link" className="text-primary hover:underline text-sm p-0">
            عرض الكل
          </Button>
        </div>
        
        {isLoading ? (
          // Loading skeleton
          Array(4).fill(0).map((_, index) => (
            <div key={index} className={`${index < 3 ? 'border-b' : ''} py-3 flex items-center`}>
              <Skeleton className="w-10 h-10 rounded-full ml-3" />
              <div className="flex-1">
                <Skeleton className="h-5 w-40 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
          ))
        ) : expenses && expenses.length > 0 ? (
          // Actual expenses
          expenses.slice(0, 4).map((expense, index) => {
            const { icon, color, backgroundColor } = getCategoryDetails(expense.categoryId);
            return (
              <div 
                key={expense.id} 
                className={`${index < expenses.slice(0, 4).length - 1 ? 'border-b' : ''} py-3 flex items-center`}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center ml-3"
                  style={{ backgroundColor, color }}
                >
                  <i className={`fas fa-${icon}`}></i>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{expense.title}</h4>
                  <p className="text-sm text-slate-500">{formatDate(expense.date)}</p>
                </div>
                <span className="font-bold text-danger">- {formatCurrency(expense.amount)}</span>
              </div>
            );
          })
        ) : (
          // No expenses
          <div className="text-center py-8">
            <p className="text-slate-500">لا توجد مصاريف مسجلة بعد</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
