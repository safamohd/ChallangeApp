import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
}

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
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Get category icon and color from categoryId
  const getCategoryDetails = (categoryId: number) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return {
      icon: category?.icon || 'question',
      color: category?.color || '#cccccc',
      backgroundColor: category?.color ? `${category.color}20` : '#f1f5f9', // 20 is for 12% opacity
    };
  };

  // Group expenses by date
  const groupExpensesByDate = (expenses: Expense[]) => {
    const groups: Record<string, Expense[]> = {};
    
    expenses.slice(0, 6).forEach(expense => {
      const date = new Date(expense.date);
      const today = new Date();
      
      let groupKey = formatDate(expense.date);
      
      // Check if it's today
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'اليوم';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      
      groups[groupKey].push(expense);
    });
    
    return groups;
  };

  const groupedExpenses = groupExpensesByDate(expenses || []);

  return (
    <Card className="bg-white rounded-xl shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-base">المعاملات</h3>
          <Button variant="link" className="text-primary text-sm p-0 font-medium">
            عرض الكل
          </Button>
        </div>
        
        {isLoading ? (
          // Loading skeleton
          Array(3).fill(0).map((_, index) => (
            <div key={index} className="mb-3">
              <Skeleton className="h-5 w-16 mb-2" />
              <div className="flex items-center mb-2">
                <Skeleton className="w-8 h-8 rounded-md ml-3" />
                <div className="flex flex-1 justify-between items-center">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          ))
        ) : expenses && expenses.length > 0 ? (
          // Actual expenses grouped by date
          Object.entries(groupedExpenses).map(([date, dateExpenses]) => (
            <div key={date} className="mb-3">
              <h4 className="text-sm text-gray-500 mb-2">{date}</h4>
              {dateExpenses.map((expense) => {
                const { icon, color, backgroundColor } = getCategoryDetails(expense.categoryId);
                return (
                  <div 
                    key={expense.id} 
                    className="flex items-center mb-2"
                  >
                    <div 
                      className="w-9 h-9 rounded-md flex items-center justify-center ml-3"
                      style={{ backgroundColor }}
                    >
                      <i className={`fas fa-${icon} text-sm`} style={{ color }}></i>
                    </div>
                    <div className="flex flex-1 justify-between items-center">
                      <h4 className="font-medium text-sm">{expense.title}</h4>
                      <span className="text-sm text-red-500 font-bold">-{formatCurrency(expense.amount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          // No expenses
          <div className="text-center py-6">
            <p className="text-slate-500 text-sm">لا توجد مصاريف مسجلة بعد</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
