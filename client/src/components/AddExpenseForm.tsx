import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

// Define the Category interface
interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
}

// Create a schema for the expense form
const expenseFormSchema = z.object({
  title: z.string().min(2, { message: "يجب أن يحتوي العنوان على حرفين على الأقل" }),
  amount: z.coerce.number().positive({ message: "يجب أن يكون المبلغ أكبر من صفر" }),
  categoryId: z.coerce.number({ invalid_type_error: "الرجاء اختيار فئة" }),
  date: z.string().min(1, { message: "الرجاء اختيار تاريخ" }),
  notes: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface AddExpenseFormProps {
  onSuccess?: () => void;
}

export default function AddExpenseForm({ onSuccess }: AddExpenseFormProps) {
  const { toast } = useToast();
  
  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Get current date in YYYY-MM-DD format for default value
  const today = new Date().toISOString().split('T')[0];
  
  // Initialize form with default values
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      title: "",
      amount: 0, // Use 0 instead of undefined
      categoryId: 0, // Use 0 instead of undefined
      date: today,
      notes: "",
    },
  });
  
  const onSubmit = async (data: ExpenseFormValues) => {
    try {
      // Convert date string to Date object for the API
      const formattedData = {
        ...data,
        date: new Date(data.date),
      };
      
      await apiRequest('POST', '/api/expenses', formattedData);
      
      // Reset form after successful submission
      form.reset({
        title: "",
        amount: 0, // Use 0 instead of undefined
        categoryId: data.categoryId, // Keep the same category selected
        date: today,
        notes: "",
      });
      
      // Show success message
      toast({
        title: "تم إضافة المصروف بنجاح",
        variant: "default",
      });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses/summary"] });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "حدث خطأ",
        description: "لم نتمكن من إضافة المصروف. الرجاء المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-white rounded-xl shadow mb-6">
      <CardContent className="p-5">
        <h3 className="font-bold text-lg mb-4">إضافة مصروف جديد</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-slate-600">العنوان</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="مثال: وجبة غداء" 
                      className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-slate-600">المبلغ (ر.س)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="٠" 
                      className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-slate-600">الفئة</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary">
                        <SelectValue placeholder="اختر الفئة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.isArray(categories) && categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          <div className="flex items-center">
                            <i className={`fas fa-${category.icon} mr-2`} style={{ color: category.color }}></i>
                            <span>{category.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-slate-600">التاريخ</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-slate-600">ملاحظات (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={2} 
                      className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-lg">
              إضافة المصروف
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
