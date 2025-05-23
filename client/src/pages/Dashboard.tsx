import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileNavigation from "@/components/MobileNavigation";
import SummaryCards from "@/components/SummaryCards";
import ExpenseChart from "@/components/ExpenseChart";
import RecentExpenses from "@/components/RecentExpenses";
import AddExpenseForm from "@/components/AddExpenseForm";

import SalarySettings from "@/components/SalarySettings";
import ImportanceDistribution from "@/components/ImportanceDistribution";
import ExpenseLimits from "@/components/ExpenseLimits";
import { Button } from "@/components/ui/button";
import { getCurrentMonthName, getCurrentYear } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  // استخدام الشهر الحالي والسنة الحالية دائمًا
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Fetch expense summary data
  const { data: summary, isLoading: summaryLoading } = useQuery<{
    totalAmount: number;
    categorySummary: Array<{
      categoryId: number;
      name: string;
      color: string;
      icon: string;
      amount: number;
      percentage: number;
    }>;
    importanceSummary: Array<{
      importance: string;
      amount: number;
      percentage: number;
      color: string;
    }>;
  }>({
    queryKey: ["/api/expenses/summary", currentMonth, currentYear],
    retry: false,
    refetchOnMount: true, // إعادة تحميل البيانات في كل مرة يتم فيها تحميل المكون
    refetchOnWindowFocus: true, // إعادة تحميل البيانات عند العودة للنافذة
    staleTime: 0 // اعتبار البيانات منتهية الصلاحية فوراً
  });

  // Fetch expense data
  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Array<{
    id: number;
    title: string;
    amount: number;
    categoryId: number;
    date: string;
    notes?: string;
    importance: string;
  }>>({
    queryKey: ["/api/expenses", currentMonth, currentYear],
    retry: false,
    refetchOnMount: true, // إعادة تحميل البيانات في كل مرة يتم فيها تحميل المكون
    refetchOnWindowFocus: true, // إعادة تحميل البيانات عند العودة للنافذة
    staleTime: 0 // اعتبار البيانات منتهية الصلاحية فوراً
  });

  // تم إزالة استعلام أهداف التوفير
  
  // Fetch user data for monthly salary and budget
  const { data: user, isLoading: userLoading } = useQuery<{
    id: number;
    username: string;
    monthlySalary: number;
    monthlyBudget: number;
  }>({
    queryKey: ["/api/user"],
    retry: false,
    refetchOnMount: true, // إعادة تحميل البيانات في كل مرة يتم فيها تحميل المكون
    refetchOnWindowFocus: true, // إعادة تحميل البيانات عند العودة للنافذة
    staleTime: 0 // اعتبار البيانات منتهية الصلاحية فوراً
  });

  // استخدام الميزانية الشهرية من حساب المستخدم (أو الراتب الشهري إذا لم يتم تعيين الميزانية)
  const userBudget = user?.monthlyBudget || 0; // الميزانية الشهرية
  const userSalary = user?.monthlySalary || 0; // الراتب الشهري
  const budget = userBudget > 0 ? userBudget : userSalary;
  const totalExpenses = summary?.totalAmount || 0;
  const remaining = budget - totalExpenses;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">مرحباً بك!</h2>
            <p className="text-slate-500">
              تتبع مصاريفك لشهر {getCurrentMonthName()} {getCurrentYear()}
            </p>
          </div>
          <Button 
            onClick={() => setShowAddExpenseModal(true)}
            className="mt-4 sm:mt-0 bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 flex items-center"
          >
            <i className="fas fa-plus ml-2"></i> مصروف جديد
          </Button>
        </div>

        {/* Summary Cards */}
        <SummaryCards 
          totalExpenses={totalExpenses} 
          budget={budget} 
          remaining={remaining}
          isLoading={summaryLoading} 
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Expense Chart */}
            <ExpenseChart 
              summary={summary?.categorySummary || []} 
              totalAmount={totalExpenses}
              isLoading={summaryLoading}
              selectedMonth={currentMonth}
              setSelectedMonth={() => {/* لا شيء - تم تعطيل تغيير الشهر */}}
              selectedYear={currentYear}
              setSelectedYear={() => {/* لا شيء - تم تعطيل تغيير السنة */}}
            />
            
            {/* Expense Limits (moved to here) */}
            <ExpenseLimits
              totalExpenses={totalExpenses}
              monthlySalary={budget}
              isLoading={userLoading || summaryLoading}
            />
            
            {/* Importance Distribution */}
            <ImportanceDistribution 
              summary={summary?.importanceSummary || []} 
              isLoading={summaryLoading} 
            />

            {/* Recent Expenses */}
            <RecentExpenses 
              expenses={expenses} 
              isLoading={expensesLoading} 
            />
          </div>

          <div className="lg:col-span-1">
            {/* Add Expense Form - Mobile view will show a modal */}
            <div className="hidden lg:block">
              <AddExpenseForm />
            </div>

            {/* تم إزالة تحدي التوفير بناءً على طلب المستخدم */}
          </div>
        </div>
      </main>

      <Footer />
      <MobileNavigation onAddClick={() => setShowAddExpenseModal(true)} />
      
      {/* Mobile Add Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 lg:hidden">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg">إضافة مصروف جديد</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowAddExpenseModal(false)}
              >
                <i className="fas fa-times"></i>
              </Button>
            </div>
            <div className="p-4">
              <AddExpenseForm 
                onSuccess={() => {
                  setShowAddExpenseModal(false);
                  toast({
                    title: "تم إضافة المصروف بنجاح",
                    variant: "default"
                  });
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
