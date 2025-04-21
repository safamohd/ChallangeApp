import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileNavigation from '@/components/MobileNavigation';
import AddExpenseForm from '@/components/AddExpenseForm';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { toast } = useToast();
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  return (
    <div>
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {children}
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