import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileNavigation from "@/components/MobileNavigation";
import SummaryCards from "@/components/SummaryCards";
import ExpenseChart from "@/components/ExpenseChart";
import RecentExpenses from "@/components/RecentExpenses";
import AddExpenseForm from "@/components/AddExpenseForm";
import SavingsGoal from "@/components/SavingsGoal";
import { Button } from "@/components/ui/button";
import { getCurrentMonthName, getCurrentYear } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Fetch expense summary data
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["/api/expenses/summary", selectedMonth, selectedYear],
    retry: false,
  });

  // Fetch expense data
  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ["/api/expenses", selectedMonth, selectedYear],
    retry: false,
  });

  // Fetch savings goals
  const { data: savingsGoals, isLoading: savingsLoading } = useQuery({
    queryKey: ["/api/savings-goals"],
    retry: false,
  });

  // Calculate budget and remaining amount
  const budget = 5000; // Fixed budget for now
  const totalExpenses = summary?.totalAmount || 0;
  const remaining = budget - totalExpenses;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 text-slate-800">
      <Header />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 pt-4 pb-16">
        {/* Summary Cards */}
        <SummaryCards 
          totalExpenses={totalExpenses} 
          budget={budget} 
          remaining={remaining}
          isLoading={summaryLoading} 
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Expense Chart */}
          <ExpenseChart 
            summary={summary?.categorySummary || []} 
            totalAmount={totalExpenses}
            isLoading={summaryLoading}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
          />

          {/* Recent Expenses */}
          <RecentExpenses 
            expenses={expenses || []} 
            isLoading={expensesLoading} 
          />
          
          {/* Savings Goal - only shows on larger screens */}
          <div className="hidden md:block">
            <SavingsGoal 
              goal={savingsGoals?.[0]} 
              isLoading={savingsLoading} 
            />
          </div>
        </div>
      </main>

      <MobileNavigation onAddClick={() => setShowAddExpenseModal(true)} />
      
      {/* Mobile Add Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4 lg:items-center">
          <div className="bg-white rounded-t-2xl lg:rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-auto">
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
                    variant: "success",
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
