import React from 'react';
import { useLocation } from 'wouter';
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
  importance: string;
}

interface RecentExpensesProps {
  expenses: Expense[];
  isLoading: boolean;
}

export default function RecentExpenses({ expenses, isLoading }: RecentExpensesProps) {
  const [_, setLocation] = useLocation();
  
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
  
  // Navigate to all expenses page
  const goToAllExpenses = () => {
    setLocation('/expenses');
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
          Array(5).fill(0).map((_, index) => (
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
          expenses.slice(0, 5).map((expense, index) => {
            const { icon, color, backgroundColor } = getCategoryDetails(expense.categoryId);
            return (
              <div 
                key={expense.id} 
                className={`${index < expenses.slice(0, 5).length - 1 ? 'border-b' : ''} py-3 flex items-center`}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center ml-3"
                  style={{ backgroundColor, color }}
                >
                  <i className={`fas fa-${icon}`}></i>
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <h4 className="font-medium">{expense.title}</h4>
                    {expense.importance && (
                      <span className={`mr-2 text-xs px-2 py-0.5 rounded-full ${
                        expense.importance === "مهم" 
                          ? "bg-red-100 text-red-800" 
                          : expense.importance === "رفاهية" 
                            ? "bg-purple-100 text-purple-800" 
                            : "bg-blue-100 text-blue-800"
                      }`}>
                        {expense.importance}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{formatDate(expense.date)}</p>
                </div>
                <span className="font-bold text-primary">- {formatCurrency(expense.amount)}</span>
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
