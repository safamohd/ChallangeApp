import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, calculatePercentage } from "@/lib/utils";

interface SavingsGoalProps {
  goal?: {
    id: number;
    title: string;
    targetAmount: number;
    currentAmount: number;
    deadline?: string;
    subGoals?: Array<{
      id: number;
      title: string;
      progress: number;
      completed: number;
    }>;
  };
  isLoading: boolean;
}

export default function SavingsGoal({ goal, isLoading }: SavingsGoalProps) {
  // Calculate days remaining if deadline exists
  const getDaysRemaining = (deadline?: string): number | null => {
    if (!deadline) return null;
    
    const deadlineDate = new Date(deadline);
    const currentDate = new Date();
    
    const differenceInTime = deadlineDate.getTime() - currentDate.getTime();
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    
    return Math.max(0, differenceInDays);
  };
  
  const daysRemaining = goal?.deadline ? getDaysRemaining(goal.deadline) : null;
  const percentage = goal ? calculatePercentage(goal.currentAmount, goal.targetAmount) : 0;

  return (
    <Card className="bg-white rounded-xl shadow">
      <CardContent className="p-5">
        <h3 className="font-bold text-lg mb-4">تحدي التوفير</h3>
        
        {isLoading ? (
          <>
            <Skeleton className="h-32 w-full mb-4" />
            {[1, 2].map((i) => (
              <div key={i} className="border-b py-3 flex items-center">
                <Skeleton className="w-10 h-10 rounded-full ml-3" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-40 mb-1" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </>
        ) : goal ? (
          <>
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-secondary">{goal.title}</h4>
                <span className="text-sm font-bold">{percentage}٪</span>
              </div>
              <Progress value={percentage} className="w-full bg-slate-200 h-2.5 mt-2" />
              <div className="flex justify-between mt-2 text-sm text-slate-500">
                <span>
                  {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                </span>
                {daysRemaining !== null && (
                  <span>متبقي {daysRemaining} يوم</span>
                )}
              </div>
            </div>
            
            {goal.subGoals?.map((subGoal) => (
              <div 
                key={subGoal.id} 
                className={`${subGoal.id !== goal.subGoals?.[goal.subGoals.length - 1].id ? 'border-b' : ''} py-3 flex items-center`}
              >
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center ml-3 ${
                    subGoal.completed 
                      ? 'bg-green-100 text-success' 
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <i className={`fas fa-${subGoal.completed ? 'check' : 'stopwatch'}`}></i>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{subGoal.title}</h4>
                  <Progress 
                    value={subGoal.progress} 
                    className={`w-full h-1.5 mt-1.5 ${
                      subGoal.completed 
                        ? 'bg-success' 
                        : 'bg-accent'
                    }`} 
                  />
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-8 mb-4">
            <p className="text-slate-500">لا توجد أهداف توفير مسجلة بعد</p>
          </div>
        )}
        
        <Button 
          variant="outline" 
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 rounded-lg mt-4"
        >
          <i className="fas fa-plus ml-2"></i> إضافة هدف جديد
        </Button>
      </CardContent>
    </Card>
  );
}
