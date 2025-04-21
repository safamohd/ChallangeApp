import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface ExpenseLimitsProps {
  totalExpenses: number;
  monthlySalary: number;
  isLoading: boolean;
}

// Define form schema for monthly salary
const salaryFormSchema = z.object({
  monthlySalary: z.coerce.number().positive({ message: "يجب أن يكون المبلغ أكبر من صفر" }),
});

type SalaryFormValues = z.infer<typeof salaryFormSchema>;

export default function ExpenseLimits({ 
  totalExpenses, 
  monthlySalary, 
  isLoading 
}: ExpenseLimitsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  // Set up the form
  const form = useForm<SalaryFormValues>({
    resolver: zodResolver(salaryFormSchema),
    defaultValues: {
      monthlySalary: 0,
    },
  });
  
  // Update form values when monthlySalary changes
  useEffect(() => {
    if (monthlySalary) {
      form.reset({ monthlySalary });
    }
  }, [monthlySalary, form]);
  
  // Define the mutation for updating salary
  const updateSalaryMutation = useMutation({
    mutationFn: async (data: SalaryFormValues) => {
      const response = await apiRequest("PUT", "/api/user/salary", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsEditing(false);
      toast({
        title: "تم تحديث الميزانية الشهرية",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error updating salary:", error);
      toast({
        title: "حدث خطأ",
        description: "لم نتمكن من تحديث الميزانية. الرجاء المحاولة مرة أخرى.",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: SalaryFormValues) => {
    updateSalaryMutation.mutate(data);
  };
  
  // Define spending thresholds as percentages of monthly salary
  const warningThreshold = 0.7; // 70% of monthly salary
  const dangerThreshold = 0.9; // 90% of monthly salary
  
  // Calculate percentage spent
  const percentageSpent = monthlySalary > 0 ? (totalExpenses / monthlySalary) * 100 : 0;
  
  // Determine status and styling
  const getStatus = () => {
    if (percentageSpent >= dangerThreshold * 100) {
      return {
        level: "خطر",
        color: "#ef4444",
        background: "#fee2e2",
        message: "لقد تجاوزت 90% من الميزانية! يرجى تقليل المصاريف."
      };
    } else if (percentageSpent >= warningThreshold * 100) {
      return {
        level: "تحذير",
        color: "#eab308",
        background: "#fef9c3",
        message: "أنت تقترب من حد الميزانية، يرجى الانتباه للمصاريف."
      };
    } else {
      return {
        level: "جيد",
        color: "#22c55e",
        background: "#dcfce7",
        message: "أنت ضمن حدود الميزانية الشهرية، استمر!"
      };
    }
  };
  
  const status = getStatus();
  
  return (
    <Card className="bg-white rounded-xl shadow mb-6">
      <CardContent className="p-5">
        <h3 className="font-bold text-lg mb-4">حدود المصاريف</h3>
        
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-600">المصروف الشهري</span>
                <div className="text-2xl font-bold text-primary">{formatCurrency(totalExpenses)}</div>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">الميزانية الشهرية</span>
                  {!isEditing && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="mr-2 text-primary hover:bg-primary/10 px-2 py-1 h-auto text-xs"
                      onClick={() => setIsEditing(true)}
                    >
                      تعديل
                    </Button>
                  )}
                </div>
                {isEditing ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-2">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <FormField
                          control={form.control}
                          name="monthlySalary"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input 
                                  type="number" 
                                  className="w-full border border-slate-300 rounded-lg p-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" 
                                  placeholder="المبلغ"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        <div className="flex space-x-1 space-x-reverse">
                          <Button 
                            type="submit" 
                            className="bg-primary hover:bg-primary/90 text-white text-xs px-2 py-1 h-auto rounded-lg"
                            disabled={updateSalaryMutation.isPending}
                          >
                            {updateSalaryMutation.isPending && (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            )}
                            حفظ
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs px-2 py-1 h-auto"
                            onClick={() => setIsEditing(false)}
                            disabled={updateSalaryMutation.isPending}
                          >
                            إلغاء
                          </Button>
                        </div>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="text-2xl font-bold">{formatCurrency(monthlySalary)}</div>
                )}
              </div>
            </div>
            
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="font-medium inline-block py-1 px-2 rounded-full text-xs" 
                        style={{ backgroundColor: status.background, color: status.color }}>
                    {status.level}
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-xs font-medium inline-block text-slate-600">
                    {Math.min(percentageSpent, 100).toFixed(1)}% مستخدم
                  </span>
                </div>
              </div>
              <Progress 
                value={Math.min(percentageSpent, 100)} 
                className="h-2.5 w-full" 
                style={{ 
                  backgroundColor: `${status.color}20`,
                  "--progress-foreground": status.color
                } as React.CSSProperties} 
              />
              
              {/* Threshold markers */}
              <div className="relative h-0">
                <div 
                  className="absolute top-[-8px] w-0.5 h-4 bg-yellow-500" 
                  style={{ left: `${warningThreshold * 100}%` }}
                  title="تحذير (70%)"
                />
                <div 
                  className="absolute top-[-8px] w-0.5 h-4 bg-red-500" 
                  style={{ left: `${dangerThreshold * 100}%` }}
                  title="خطر (90%)"
                />
              </div>
            </div>
            
            {percentageSpent >= warningThreshold * 100 && (
              <Alert variant="default" style={{ backgroundColor: status.background, borderColor: status.color }}>
                <AlertCircle className="h-4 w-4" style={{ color: status.color }} />
                <AlertTitle style={{ color: status.color }}>
                  {status.level}!
                </AlertTitle>
                <AlertDescription className="text-slate-700">
                  {status.message}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-3 gap-3 text-center text-xs pt-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#dcfce7" }}>
                <div className="font-medium text-green-800">المتاح</div>
                <div className="text-green-800">{formatCurrency(Math.max(monthlySalary - totalExpenses, 0))}</div>
              </div>
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#fef9c3" }}>
                <div className="font-medium text-yellow-800">حد التحذير</div>
                <div className="text-yellow-800">{formatCurrency(monthlySalary * warningThreshold)}</div>
              </div>
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#fee2e2" }}>
                <div className="font-medium text-red-800">حد الخطر</div>
                <div className="text-red-800">{formatCurrency(monthlySalary * dangerThreshold)}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}