import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Expense, Category } from '@shared/schema';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileNavigation from "@/components/MobileNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, getCategoryIcon } from '@/lib/utils';
import { Search, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AllExpensesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedImportance, setSelectedImportance] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Fetch expenses and categories
  const { data: expenses = [], isLoading: isLoadingExpenses } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });
  
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Filter expenses based on search query, category and importance
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || expense.categoryId.toString() === selectedCategory;
    const matchesImportance = selectedImportance === 'all' || expense.importance === selectedImportance;
    
    return matchesSearch && matchesCategory && matchesImportance;
  });
  
  // Sort expenses by date
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });
  
  // Get category details by ID
  const getCategoryById = (id: number): Category | undefined => {
    return categories.find((category: Category) => category.id === id);
  };
  
  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };
  
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const { toast } = useToast();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Header />
      
      <main className="flex-1 max-w-5xl w-full mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 text-center">جميع المصاريف</h1>
        
        {/* Search and Filter Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
          <div className="flex flex-col space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <Input
                type="text"
                placeholder="بحث عن مصروف..."
                className="pl-3 pr-10 py-2 border border-slate-300 rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Select 
                  value={selectedCategory} 
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="border border-slate-300 rounded-lg">
                    <SelectValue placeholder="جميع الفئات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الفئات</SelectItem>
                    {categories.map((category: Category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        <div className="flex items-center">
                          <i className={`fas fa-${category.icon} mr-2`} style={{ color: category.color }}></i>
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Select 
                  value={selectedImportance} 
                  onValueChange={setSelectedImportance}
                >
                  <SelectTrigger className="border border-slate-300 rounded-lg">
                    <SelectValue placeholder="مستوى الأهمية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المستويات</SelectItem>
                    <SelectItem value="مهم">
                      <div className="flex items-center">
                        <i className="fas fa-exclamation-circle mr-2 text-red-500"></i>
                        <span>مهم</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="عادي">
                      <div className="flex items-center">
                        <i className="fas fa-minus-circle mr-2 text-blue-500"></i>
                        <span>عادي</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="رفاهية">
                      <div className="flex items-center">
                        <i className="fas fa-star mr-2 text-purple-500"></i>
                        <span>رفاهية</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div 
              className="flex items-center justify-center cursor-pointer py-2 px-3 bg-slate-100 rounded-lg hover:bg-slate-200" 
              onClick={toggleSortOrder}
            >
              <span className="text-sm">ترتيب حسب التاريخ</span>
              <ArrowUpDown className="mr-2 h-4 w-4" />
              <span className="text-sm mr-1">
                {sortOrder === 'desc' ? 'الأحدث أولاً' : 'الأقدم أولاً'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Expenses List */}
      <div className="space-y-3">
        {isLoadingExpenses || isLoadingCategories ? (
          // Loading state
          Array(5).fill(0).map((_, index) => (
            <Card key={index} className="bg-white rounded-xl shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-10 w-20 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : sortedExpenses.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">لا توجد مصاريف</h3>
            <p className="text-slate-500">لا توجد مصاريف تطابق معايير البحث الخاصة بك</p>
          </div>
        ) : (
          // Expenses list
          sortedExpenses.map((expense) => {
            const category = getCategoryById(expense.categoryId);
            
            return (
              <Card key={expense.id} className="bg-white rounded-xl shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center mb-1">
                        {category && (
                          <i 
                            className={`${getCategoryIcon(category.icon)} ml-2`} 
                            style={{ color: category.color }}
                          ></i>
                        )}
                        <h3 className="font-bold">{expense.title}</h3>
                        {expense.importance === 'مهم' && (
                          <span className="bg-red-100 text-red-800 text-xs font-medium mr-2 px-2 py-0.5 rounded">
                            <i className="fas fa-exclamation-circle ml-1"></i>
                            مهم
                          </span>
                        )}
                        {expense.importance === 'رفاهية' && (
                          <span className="bg-purple-100 text-purple-800 text-xs font-medium mr-2 px-2 py-0.5 rounded">
                            <i className="fas fa-star ml-1"></i>
                            رفاهية
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500">
                        {category?.name} • {formatDate(expense.date)}
                      </div>
                      {expense.notes && (
                        <p className="text-sm mt-2 text-slate-600">{expense.notes}</p>
                      )}
                    </div>
                    <div className="text-lg font-bold" style={{ 
                      color: expense.importance === 'مهم' ? '#dc2626' : 
                             expense.importance === 'رفاهية' ? '#7e22ce' : '#2563eb' 
                    }}>
                      {formatCurrency(expense.amount)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      
      {/* Summary */}
      {!isLoadingExpenses && sortedExpenses.length > 0 && (
        <div className="mt-6 bg-slate-100 p-4 rounded-lg text-center">
          <p className="text-slate-600">
            <span className="font-bold">{sortedExpenses.length}</span> من أصل <span className="font-bold">{expenses.length}</span> مصروف
          </p>
          <p className="text-slate-600 mt-1">
            المبلغ الإجمالي: <span className="font-bold">{formatCurrency(sortedExpenses.reduce((sum, expense) => sum + expense.amount, 0))}</span>
          </p>
        </div>
      )}
      </main>

      <Footer />
      <MobileNavigation onAddClick={() => setShowAddExpenseModal(true)} />
    </div>
  );
}