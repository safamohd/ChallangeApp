import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import React from "react";

interface ImportanceSummary {
  importance: string;
  amount: number;
  percentage: number;
  color: string;
}

interface ImportanceDistributionProps {
  summary: ImportanceSummary[];
  isLoading: boolean;
}

export default function ImportanceDistribution({ 
  summary, 
  isLoading 
}: ImportanceDistributionProps) {
  
  // Get the appropriate icon for each importance level
  const getImportanceIcon = (importance: string) => {
    switch (importance) {
      case "مهم":
        return "exclamation-circle";
      case "رفاهية":
        return "star";
      case "عادي":
      default:
        return "minus-circle";
    }
  };
  
  // Get description for each importance level
  const getImportanceDescription = (importance: string) => {
    switch (importance) {
      case "مهم":
        return "المصاريف الضرورية التي لا يمكن الاستغناء عنها";
      case "رفاهية":
        return "مصاريف الرفاهية والترفيه الاختيارية";
      case "عادي":
      default:
        return "المصاريف اليومية العادية";
    }
  };

  return (
    <Card className="bg-white rounded-xl shadow mb-6">
      <CardContent className="p-5">
        <h3 className="font-bold text-lg mb-4">توزيع المصاريف حسب الأهمية</h3>
        
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : summary && summary.length > 0 ? (
          <div className="space-y-6">
            {summary.map((item) => (
              <div key={item.importance} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <i 
                      className={`fas fa-${getImportanceIcon(item.importance)} mr-2`} 
                      style={{ color: item.color }}
                    ></i>
                    <span className="font-medium">{item.importance}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">{formatCurrency(item.amount)}</div>
                    <div className="text-xs text-slate-500">{item.percentage.toFixed(1)}%</div>
                  </div>
                </div>
                
                <Progress 
                  value={item.percentage} 
                  className="h-2 w-full" 
                  style={{ 
                    backgroundColor: `${item.color}20`,
                    "--progress-foreground": item.color
                  } as React.CSSProperties} 
                />
                
                <p className="text-xs text-slate-500 mt-1">
                  {getImportanceDescription(item.importance)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-500">لا توجد بيانات متاحة</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}