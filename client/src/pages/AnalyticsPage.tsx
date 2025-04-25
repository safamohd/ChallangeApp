import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileNavigation from "@/components/MobileNavigation";
import AddExpenseForm from "@/components/AddExpenseForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type TimeFilter = "week" | "month" | "year";

// استرجاع تاريخ بداية الفترة حسب الفلتر المختار
const getStartDate = (filter: TimeFilter): Date => {
  const now = new Date();
  switch (filter) {
    case "week":
      const lastWeek = new Date(now);
      lastWeek.setDate(now.getDate() - 7);
      return lastWeek;
    case "month":
      const lastMonth = new Date(now);
      lastMonth.setDate(now.getDate() - 30);
      return lastMonth;
    case "year":
      const lastYear = new Date(now);
      lastYear.setFullYear(now.getFullYear() - 1);
      return lastYear;
  }
};

// تحويل تاريخ إلى سلسلة نصية بتنسيق YYYY-MM-DD
const formatDateForApi = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

export default function AnalyticsPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");
  const [showAddExpense, setShowAddExpense] = useState(false);
  
  // استرجاع بيانات المصاريف
  const startDate = formatDateForApi(getStartDate(timeFilter));
  const { data: expenses = [], isLoading: expensesLoading } = useQuery<any[]>({
    queryKey: [
      "/api/expenses",
      timeFilter,
      startDate
    ],
    queryFn: async () => {
      const url = new URL('/api/expenses', window.location.origin);
      url.searchParams.append('startDate', startDate);
      const res = await fetch(url);
      return res.json();
    },
    retry: false,
    refetchOnMount: true, // إعادة تحميل البيانات في كل مرة يتم فيها تحميل المكون
    refetchOnWindowFocus: true, // إعادة تحميل البيانات عند العودة للنافذة
    staleTime: 0 // اعتبار البيانات منتهية الصلاحية فوراً
  });

  // استرجاع بيانات الفئات
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<any[]>({
    queryKey: ["/api/categories"],
    retry: false,
    refetchOnMount: true, // إعادة تحميل البيانات في كل مرة يتم فيها تحميل المكون
    refetchOnWindowFocus: true, // إعادة تحميل البيانات عند العودة للنافذة
    staleTime: 0 // اعتبار البيانات منتهية الصلاحية فوراً
  });

  // استرجاع بيانات المستخدم
  const { data: user, isLoading: userLoading } = useQuery<{
    id: number;
    username: string;
    monthlySalary: number;
  }>({
    queryKey: ["/api/user"],
    retry: false,
    refetchOnMount: true, // إعادة تحميل البيانات في كل مرة يتم فيها تحميل المكون
    refetchOnWindowFocus: true, // إعادة تحميل البيانات عند العودة للنافذة
    staleTime: 0 // اعتبار البيانات منتهية الصلاحية فوراً
  });

  // التحميل
  const isLoading = expensesLoading || categoriesLoading || userLoading;

  // تجهيز بيانات المخطط الدائري (حسب الفئة)
  const categoryData = categories.map((category) => {
    const categoryExpenses = expenses.filter(
      (expense) => expense.categoryId === category.id
    );
    
    const total = categoryExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    
    return {
      name: category.name,
      value: total,
      color: category.color,
      id: category.id,
    };
  })
  .filter(item => item.value > 0)
  // ترتيب البيانات تنازليًا حسب القيمة
  .sort((a, b) => b.value - a.value);

  // إجمالي المصاريف
  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  // تجهيز بيانات مخطط الأعمدة (حسب الأهمية)
  const importanceData = [
    {
      name: "مهم",
      value: expenses
        .filter((expense) => expense.importance === "مهم")
        .reduce((sum, expense) => sum + expense.amount, 0),
      color: "#dc2626", // أحمر
    },
    {
      name: "عادي",
      value: expenses
        .filter((expense) => expense.importance === "عادي")
        .reduce((sum, expense) => sum + expense.amount, 0),
      color: "#2563eb", // أزرق
    },
    {
      name: "رفاهية",
      value: expenses
        .filter((expense) => expense.importance === "رفاهية")
        .reduce((sum, expense) => sum + expense.amount, 0),
      color: "#7e22ce", // بنفسجي
    },
  ];

  // تجهيز بيانات المخطط الزمني
  const getTimeSeriesData = () => {
    // إنشاء قاموس التواريخ
    const dateMap: Record<string, number> = {};
    
    // تعيين التواريخ من بداية الفترة إلى الآن
    const startDate = getStartDate(timeFilter);
    const currentDate = new Date();
    
    let current = new Date(startDate);
    while (current <= currentDate) {
      const dateStr = formatDateForApi(current);
      dateMap[dateStr] = 0;
      current.setDate(current.getDate() + 1);
    }
    
    // ملء البيانات
    expenses.forEach((expense) => {
      const expenseDate = expense.date.split('T')[0];
      if (dateMap[expenseDate] !== undefined) {
        dateMap[expenseDate] += expense.amount;
      }
    });
    
    // تحويل إلى مصفوفة
    return Object.entries(dateMap).map(([date, amount]) => ({
      date,
      amount,
    }));
  };
  
  const timeSeriesData = getTimeSeriesData();
  
  // تحديد أيام الذروة في الإنفاق
  const getPeakDays = () => {
    if (timeSeriesData.length === 0) return [];
    
    // حساب متوسط الإنفاق
    const totalAmount = timeSeriesData.reduce((sum, item) => sum + item.amount, 0);
    const averageAmount = totalAmount / timeSeriesData.filter(item => item.amount > 0).length || 0;
    
    // تعتبر أيام الذروة هي الأيام التي يكون فيها الإنفاق أعلى من 1.5 من المتوسط
    const threshold = averageAmount * 1.5;
    
    // العثور على أيام الذروة
    return timeSeriesData
      .filter(item => item.amount > threshold && item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3) // اختيار أعلى 3 أيام فقط
      .map(item => {
        const date = new Date(item.date);
        return {
          date: date.toLocaleDateString("ar-SA"),
          amount: item.amount
        };
      });
  };
  
  const peakDays = getPeakDays();

  // إعداد نص الملخص
  const getSummaryText = () => {
    if (isLoading || categories.length === 0 || expenses.length === 0) {
      return "جاري تحميل البيانات...";
    }

    // البحث عن الفئة ذات الإنفاق الأعلى
    let maxCategory = { name: "", value: 0 };
    for (const cat of categoryData) {
      if (cat.value > maxCategory.value) {
        maxCategory = cat;
      }
    }

    // حساب نسبة مصاريف الرفاهية
    const luxuryPercentage = 
      importanceData[2].value > 0 
        ? Math.round((importanceData[2].value / totalExpenses) * 100) 
        : 0;

    // تنسيق الفترة الزمنية
    let periodText = "";
    switch (timeFilter) {
      case "week":
        periodText = "آخر ٧ أيام";
        break;
      case "month":
        periodText = "آخر ٣٠ يوم";
        break;
      case "year":
        periodText = "السنة الحالية";
        break;
    }

    return `في ${periodText}، قمت بإنفاق أعلى نسبة على ${
      maxCategory.name || "لا توجد بيانات"
    }، وبلغت نسبة المصروفات من فئة 'رفاهية' حوالي ${luxuryPercentage}٪ من إجمالي المصروفات.`;
  };

  // إعادة تحميل البيانات بعد إضافة مصروف جديد
  const handleAddExpenseSuccess = () => {
    setShowAddExpense(false);
    // InvalidateQueries سيؤدي إلى إعادة تحميل البيانات تلقائيًا
    queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
    queryClient.invalidateQueries({ queryKey: ["/api/expenses/summary"] });
    
    // إعادة تحميل الاستعلام بإعدادات الفلتر الحالية
    queryClient.invalidateQueries({ 
      queryKey: ["/api/expenses", timeFilter, startDate] 
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Header />

      {/* نافذة إضافة مصروف جديدة */}
      <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
        <DialogContent className="max-w-md mx-auto">
          <AddExpenseForm onSuccess={handleAddExpenseSuccess} />
        </DialogContent>
      </Dialog>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4">
        {/* عنوان الصفحة وفلتر التاريخ */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-bold mb-4 md:mb-0">تحليلات المصاريف</h1>
          <Select
            value={timeFilter}
            onValueChange={(value) => setTimeFilter(value as TimeFilter)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="اختر الفترة الزمنية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">آخر ٧ أيام</SelectItem>
              <SelectItem value="month">آخر ٣٠ يوم</SelectItem>
              <SelectItem value="year">السنة الحالية</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* تم إزالة ملخص الإحصائيات العام */}

        {/* الرسوم البيانية */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* مخطط الفئات */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">تصنيف المصروفات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex justify-center items-center mb-4 mx-auto max-w-md">
                {isLoading ? (
                  <Skeleton className="h-full w-full rounded-lg" />
                ) : categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="45%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                        labelLine={{ stroke: "#64748b", strokeWidth: 1, strokeDasharray: "2 2", strokeOpacity: 0.7 }}
                        label={({ percent, x, y, cx, cy }) => {
                          // زيادة المسافة من الرسم البياني بشكل كبير
                          const radius = 130; // زيادة القيمة لإبعاد النسب عن المخطط أكثر
                          const angleRad = Math.atan2(y - cy, x - cx);
                          const nx = cx + radius * Math.cos(angleRad);
                          const ny = cy + radius * Math.sin(angleRad);
                          
                          return (
                            <text 
                              x={nx} 
                              y={ny} 
                              textAnchor={x > cx ? "start" : "end"} 
                              dominantBaseline="central"
                              fill="#64748b"
                              fontWeight="500"
                              fontSize="12"
                              style={{ filter: 'drop-shadow(0px 0px 2px white)' }}
                            >
                              {`${(percent * 100).toFixed(0)}%`}
                            </text>
                          );
                        }}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => formatCurrency(value as number)} 
                        contentStyle={{ textAlign: 'right', direction: 'rtl' }} 
                      />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        iconType="circle"
                        iconSize={10}
                        formatter={(value) => <span style={{ fontSize: '0.8rem', marginRight: '5px' }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground">
                    لا توجد بيانات للعرض
                  </p>
                )}
              </div>
              
              {/* ملخص مخطط الفئات */}
              {!isLoading && categoryData.length > 0 && (
                <div className="text-sm border-t pt-3 text-center max-w-lg mx-auto">
                  <p className="font-medium">
                    الفئة الأعلى إنفاقاً هي: <span className="text-primary">{categoryData[0].name}</span> 
                    <span className="text-primary font-bold mr-1">({(categoryData[0].value / totalExpenses * 100).toFixed(0)}٪)</span>
                  </p>
                  <p className="text-muted-foreground mt-1">
                    بلغت قيمة الإنفاق في هذه الفئة <span className="text-primary font-medium">{formatCurrency(categoryData[0].value)}</span> من إجمالي <span className="text-primary font-medium">{formatCurrency(totalExpenses)}</span>
                  </p>
                  {categoryData.length > 1 && (
                    <p className="text-muted-foreground mt-1">
                      الفرق بينها وبين الفئة التالية <span className="text-primary font-medium">{categoryData[1].name}</span> هو <span className="text-primary font-medium">{formatCurrency(categoryData[0].value - categoryData[1].value)}</span>
                    </p>
                  )}
                  <p className="text-muted-foreground mt-2 text-xs">
                    <span className="text-amber-600">توصية:</span> يُنصح بتقليل الإنفاق في هذه الفئة مستقبلاً لتحسين توازن ميزانيتك.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* مخطط حسب الأهمية */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">حسب أهمية المصروف</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] flex justify-center items-center mb-4 mx-auto max-w-md">
                {isLoading ? (
                  <Skeleton className="h-full w-full rounded-lg" />
                ) : totalExpenses > 0 ? (
                  <ResponsiveContainer width="90%" height="100%" className="mx-auto">
                    <BarChart
                      data={importanceData}
                      layout="horizontal"
                      margin={{ top: 30, right: 20, left: 20, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        type="category" 
                        tick={{ fill: "#64748b" }}
                      />
                      <YAxis 
                        type="number"
                      />
                      <Tooltip 
                        formatter={(value) => formatCurrency(value as number)} 
                        contentStyle={{ textAlign: 'right', direction: 'rtl' }} 
                      />
                      <Bar 
                        dataKey="value" 
                        name="" 
                        isAnimationActive={true}
                        label={(props) => {
                          const { x, y, height, value } = props;
                          return (
                            <text
                              x={x}
                              y={y - 10}
                              textAnchor="middle"
                              fill="#64748b"
                              fontSize={12}
                            >
                              {formatCurrency(Number(value))}
                            </text>
                          );
                        }}
                      >
                        {importanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground">
                    لا توجد بيانات للعرض
                  </p>
                )}
              </div>
              
              {/* ملخص مخطط الأهمية */}
              {!isLoading && totalExpenses > 0 && (
                <div className="text-sm border-t pt-3 text-center max-w-lg mx-auto">
                  {(() => {
                    // العثور على الفئة ذات أعلى قيمة
                    const maxImportance = importanceData.reduce((prev, current) => 
                      (prev.value > current.value) ? prev : current);
                    
                    // حساب النسب المئوية
                    const importantPercent = Math.round((importanceData[0].value / totalExpenses) * 100);
                    const normalPercent = Math.round((importanceData[1].value / totalExpenses) * 100);
                    const luxuryPercent = Math.round((importanceData[2].value / totalExpenses) * 100);
                    
                    if (maxImportance.name === "مهم") {
                      return (
                        <>
                          <p className="font-medium text-green-600">
                            معظم مصاريفك على عناصر مهمة (<span className="font-bold">{importantPercent}٪</span>)، وهذا جيد.
                          </p>
                          <p className="text-muted-foreground mt-1">
                            استمر في الحفاظ على هذا التوازن مع تخفيض نسبة الرفاهية (<span className="text-primary font-medium">{luxuryPercent}٪</span>).
                          </p>
                          <p className="text-muted-foreground mt-2 text-xs">
                            <span className="text-green-600">✓</span> توزيع ميزانيتك متوازن. 
                          </p>
                        </>
                      );
                    } else {
                      const warningCategory = maxImportance.name === "عادي" ? "العادية" : "الرفاهية";
                      const warningPercent = maxImportance.name === "عادي" ? normalPercent : luxuryPercent;
                      
                      return (
                        <>
                          <p className="font-medium text-red-600">
                            تحذير: أكبر إنفاق لديك كان في فئة {maxImportance.name} (<span className="font-bold">{warningPercent}٪</span>).
                          </p>
                          <p className="text-muted-foreground mt-1">
                            نسبة الإنفاق على العناصر المهمة (<span className="text-primary">{importantPercent}٪</span>) أقل من المصاريف {warningCategory}.
                          </p>
                          <p className="text-muted-foreground mt-2 text-xs">
                            <span className="text-amber-600">توصية:</span> يُنصح بمراجعة أولوياتك وإعادة توزيع الميزانية لزيادة نسبة العناصر المهمة على حساب فئة {maxImportance.name}.
                          </p>
                        </>
                      );
                    }
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* مخطط المصاريف حسب الأيام */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {timeFilter === "week" || timeFilter === "month"
                ? "المصروفات اليومية"
                : "الإنفاق الشهري"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex justify-center items-center mb-4 mx-auto max-w-3xl">
              {isLoading ? (
                <Skeleton className="h-full w-full rounded-lg" />
              ) : timeSeriesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={timeSeriesData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: "#64748b" }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        if (timeFilter === "year") {
                          // للسنة نستخدم اسم الشهر
                          return new Date(value).toLocaleDateString("ar-SA", { month: "short" });
                        } else {
                          // لليوم والشهر نستخدم اليوم
                          return date.getDate().toString();
                        }
                      }}
                    />
                    <YAxis 
                      tick={{ fill: "#64748b" }} 
                      tickFormatter={(value) => {
                        // اختصار الأرقام الكبيرة
                        if (value >= 1000) {
                          return `${(value / 1000).toFixed(1)}k`;
                        }
                        return value.toString();
                      }}
                    />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value as number)} 
                      labelFormatter={(label) => {
                        return new Date(label).toLocaleDateString("ar-SA");
                      }}
                      contentStyle={{ textAlign: 'right', direction: 'rtl' }} 
                    />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      wrapperStyle={{ paddingTop: 10 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      name="المصروفات"
                      stroke="#8884d8"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground">
                  لا توجد بيانات للعرض
                </p>
              )}
            </div>
            
            {/* ملخص أيام الذروة */}
            {!isLoading && peakDays.length > 0 && (
              <div className="text-sm border-t pt-3 text-center max-w-lg mx-auto">
                <p className="font-medium">
                  ذروة الإنفاق كانت في الأيام/الفترات التالية:
                </p>
                <div className="mt-1 text-muted-foreground flex flex-wrap justify-center gap-2">
                  {peakDays.map((day, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full bg-slate-100 text-xs">
                      {day.date}: <span className="text-primary mr-1">{formatCurrency(day.amount)}</span>
                    </span>
                  ))}
                </div>
                
                {/* تفاصيل إضافية عن نمط الإنفاق */}
                {(() => {
                  // حساب متوسط الإنفاق للأيام التي بها إنفاق فقط
                  const daysWithExpenses = timeSeriesData.filter(day => day.amount > 0);
                  const avgExpense = daysWithExpenses.length 
                    ? daysWithExpenses.reduce((sum, day) => sum + day.amount, 0) / daysWithExpenses.length 
                    : 0;
                    
                  // حساب نسبة الارتفاع في أيام الذروة
                  const peakAverage = peakDays.reduce((sum, day) => sum + day.amount, 0) / peakDays.length;
                  const peakPercentageAboveAvg = avgExpense ? Math.round((peakAverage / avgExpense - 1) * 100) : 0;
                  
                  return (
                    <>
                      <p className="text-muted-foreground mt-2">
                        معدل الإنفاق في أيام الذروة يزيد عن المتوسط بنسبة <span className="text-primary font-medium">{peakPercentageAboveAvg}٪</span>
                      </p>
                      <p className="text-muted-foreground mt-2 text-xs">
                        <span className="text-amber-600">توصية:</span> حاول تقسيم مشترياتك الكبيرة على عدة أيام لتجنب الارتفاع المفاجئ في المصاريف.
                      </p>
                    </>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
      <MobileNavigation onAddClick={() => setShowAddExpense(true)} />

      {/* نافذة إضافة مصروف جديد */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 lg:hidden">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg">إضافة مصروف جديد</h3>
              <button 
                className="p-2 rounded-full hover:bg-slate-100"
                onClick={() => setShowAddExpense(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-4">
              <AddExpenseForm 
                onSuccess={handleAddExpenseSuccess} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}