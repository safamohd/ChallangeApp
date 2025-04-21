import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
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
import { Loader2 } from "lucide-react";

// Define form schema for monthly salary
const salaryFormSchema = z.object({
  monthlySalary: z.coerce.number().positive({ message: "يجب أن يكون الراتب أكبر من صفر" }),
});

type SalaryFormValues = z.infer<typeof salaryFormSchema>;

export default function SalarySettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Fetch user data
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
  });

  // Set up the form
  const form = useForm<SalaryFormValues>({
    resolver: zodResolver(salaryFormSchema),
    defaultValues: {
      monthlySalary: 0,
    },
  });

  // Update form values when user data is loaded
  useEffect(() => {
    if (user?.monthlySalary) {
      form.reset({
        monthlySalary: user.monthlySalary,
      });
    }
  }, [user, form]);

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
        title: "تم تحديث الراتب الشهري",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error updating salary:", error);
      toast({
        title: "حدث خطأ",
        description: "لم نتمكن من تحديث الراتب. الرجاء المحاولة مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: SalaryFormValues) => {
    updateSalaryMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow mb-6">
        <CardContent className="p-5 flex justify-center items-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow mb-6">
      <CardContent className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">الراتب الشهري</h3>
          {!isEditing && (
            <Button 
              variant="outline" 
              className="text-primary border-primary hover:bg-primary/10"
              onClick={() => setIsEditing(true)}
            >
              تعديل
            </Button>
          )}
        </div>

        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="monthlySalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-slate-600">الراتب الشهري (ر.س)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-3 space-x-reverse">
                <Button 
                  type="submit" 
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-lg"
                  disabled={updateSalaryMutation.isPending}
                >
                  {updateSalaryMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  حفظ
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-100"
                  onClick={() => setIsEditing(false)}
                  disabled={updateSalaryMutation.isPending}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="p-3 bg-primary/10 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-slate-700">الراتب الشهري</p>
              <p className="font-bold text-xl text-primary">
                {formatCurrency(user?.monthlySalary || 0)}
              </p>
            </div>
            <p className="text-sm text-slate-500 mt-2">تستخدم لحساب حدود المصاريف والميزانية</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}