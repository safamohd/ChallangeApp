import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertExpenseSchema, 
  insertSavingsGoalSchema, 
  insertSubGoalSchema,
  notificationTypeEnum
} from "@shared/schema";
import { setupAuth } from "./auth";

// وظيفة middleware للتأكد من أن المستخدم مسجل الدخول
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "يجب تسجيل الدخول للوصول إلى هذه الخدمة" });
};

// وظائف مساعدة لإنشاء الإشعارات

// إنشاء إشعار تجاوز حد الإنفاق (تحذير)
async function createSpendingWarningNotification(userId: number, currentSpending: number, monthlyBudget: number) {
  const warningLimit = monthlyBudget * 0.8; // 80% من الميزانية الشهرية
  
  // التحقق مما إذا كنا بحاجة لإنشاء إشعار
  if (currentSpending >= warningLimit && currentSpending < monthlyBudget) {
    // الحصول على جميع إشعارات التحذير للشهر الحالي
    const currentDate = new Date();
    const notifications = await storage.getNotifications(userId);
    
    // التحقق مما إذا كان هناك إشعار تحذير حالي لهذا الشهر
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const existingWarning = notifications.find(n => {
      if (n.type !== 'spending_limit_warning') return false;
      const notifDate = new Date(n.createdAt);
      return notifDate.getMonth() === currentMonth && notifDate.getFullYear() === currentYear;
    });

    // إذا لم يكن هناك إشعار مسبق، قم بإنشاء واحد جديد
    if (!existingWarning) {
      console.log("إنشاء إشعار تحذير حد الإنفاق جديد");
      await storage.createNotification({
        userId,
        type: 'spending_limit_warning',
        title: 'تنبيه: اقتراب من حد الميزانية',
        message: `لقد وصلت مصاريفك إلى ${Math.round((currentSpending / monthlyBudget) * 100)}% من الميزانية الشهرية المحددة.`,
        data: JSON.stringify({
          currentSpending,
          monthlyBudget,
          percentage: (currentSpending / monthlyBudget) * 100
        })
      });
    }
  }
}

// إنشاء إشعار تجاوز حد الإنفاق (خطر)
async function createSpendingDangerNotification(userId: number, currentSpending: number, monthlyBudget: number) {
  if (currentSpending >= monthlyBudget) {
    // الحصول على جميع إشعارات الخطر للشهر الحالي
    const currentDate = new Date();
    const notifications = await storage.getNotifications(userId);
    
    // التحقق مما إذا كان هناك إشعار خطر حالي لهذا الشهر
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const existingDanger = notifications.find(n => {
      if (n.type !== 'spending_limit_danger') return false;
      const notifDate = new Date(n.createdAt);
      return notifDate.getMonth() === currentMonth && notifDate.getFullYear() === currentYear;
    });
    
    // إذا لم يكن هناك إشعار مسبق، قم بإنشاء واحد جديد
    if (!existingDanger) {
      console.log("إنشاء إشعار خطر تجاوز الميزانية جديد");
      await storage.createNotification({
        userId,
        type: 'spending_limit_danger',
        title: 'تحذير: تجاوز الميزانية الشهرية',
        message: `لقد تجاوزت مصاريفك الميزانية الشهرية بنسبة ${Math.round(((currentSpending - monthlyBudget) / monthlyBudget) * 100)}%.`,
        data: JSON.stringify({
          currentSpending,
          monthlyBudget,
          overspending: currentSpending - monthlyBudget,
          percentage: ((currentSpending - monthlyBudget) / monthlyBudget) * 100
        })
      });
    }
  }
}

// إنشاء إشعار الإنفاق على الرفاهية
async function createLuxurySpendingNotification(userId: number, luxurySpending: number, totalSpending: number) {
  const luxuryPercentage = (luxurySpending / totalSpending) * 100;
  
  if (luxuryPercentage > 30) { // إذا كان الإنفاق على الرفاهية يتجاوز 30%
    // الحصول على جميع إشعارات الرفاهية للشهر الحالي
    const currentDate = new Date();
    const notifications = await storage.getNotifications(userId);
    
    // التحقق مما إذا كان هناك إشعار رفاهية حالي لهذا الشهر
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const existingLuxury = notifications.find(n => {
      if (n.type !== 'luxury_spending') return false;
      const notifDate = new Date(n.createdAt);
      return notifDate.getMonth() === currentMonth && notifDate.getFullYear() === currentYear;
    });
    
    // إذا لم يكن هناك إشعار مسبق، قم بإنشاء واحد جديد
    if (!existingLuxury) {
      console.log("إنشاء إشعار جديد للإنفاق على الرفاهيات");
      await storage.createNotification({
        userId,
        type: 'luxury_spending',
        title: 'تحليل: ارتفاع الإنفاق على الرفاهيات',
        message: `لاحظنا أن ${Math.round(luxuryPercentage)}% من مصاريفك هذا الشهر على الرفاهيات. قد ترغب في إعادة تنظيم أولويات الإنفاق.`,
        data: JSON.stringify({
          luxurySpending,
          totalSpending,
          percentage: luxuryPercentage
        })
      });
    }
  }
}

// إنشاء إشعار انخفاض الإنفاق على الأساسيات
async function createEssentialDecreaseNotification(userId: number, essentialSpending: number, totalSpending: number) {
  const essentialPercentage = (essentialSpending / totalSpending) * 100;
  
  if (essentialPercentage < 50 && totalSpending > 0) { // إذا كان الإنفاق على الأساسيات أقل من 50%
    // الحصول على جميع إشعارات الأساسيات للشهر الحالي
    const currentDate = new Date();
    const notifications = await storage.getNotifications(userId);
    
    // التحقق مما إذا كان هناك إشعار أساسيات حالي لهذا الشهر
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const existingEssential = notifications.find(n => {
      if (n.type !== 'essential_decrease') return false;
      const notifDate = new Date(n.createdAt);
      return notifDate.getMonth() === currentMonth && notifDate.getFullYear() === currentYear;
    });
    
    // إذا لم يكن هناك إشعار مسبق، قم بإنشاء واحد جديد
    if (!existingEssential) {
      console.log("إنشاء إشعار جديد لانخفاض الإنفاق على الأساسيات");
      await storage.createNotification({
        userId,
        type: 'essential_decrease',
        title: 'تحليل: انخفاض الإنفاق على الأساسيات',
        message: `لاحظنا أن الإنفاق على العناصر الأساسية (${Math.round(essentialPercentage)}%) منخفض نسبيًا مقارنة بإجمالي الإنفاق.`,
        data: JSON.stringify({
          essentialSpending,
          totalSpending,
          percentage: essentialPercentage
        })
      });
    }
  }
}

// إنشاء التحليل الأسبوعي
async function createWeeklyAnalysisNotification(userId: number) {
  // الحصول على جميع إشعارات التحليل الأسبوعي
  const currentDate = new Date();
  const notifications = await storage.getNotifications(userId);
  
  // التحقق مما إذا كان هناك إشعار تحليل أسبوعي لهذا الأسبوع
  const today = currentDate.getDate();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // نبحث عن إشعار تم إنشاؤه خلال الأسبوع الحالي
  const existingWeeklyAnalysis = notifications.find(n => {
    if (n.type !== 'weekly_analysis') return false;
    const notifDate = new Date(n.createdAt);
    const dayDiff = Math.abs(today - notifDate.getDate());
    return notifDate.getMonth() === currentMonth && 
           notifDate.getFullYear() === currentYear &&
           dayDiff < 7; // في نفس الأسبوع
  });
  
  // إذا لم يكن هناك إشعار مسبق، قم بإنشاء واحد جديد
  if (!existingWeeklyAnalysis) {
    console.log("إنشاء إشعار تحليل أسبوعي جديد");
    
    const lastWeekDate = new Date();
    lastWeekDate.setDate(currentDate.getDate() - 7);
    
    // سنستخدم هذه الوظيفة فقط لإنشاء تحليل أسبوعي بسيط
    await storage.createNotification({
      userId,
      type: 'weekly_analysis',
      title: 'التحليل الأسبوعي لمصاريفك',
      message: `استعرض التحليل الأسبوعي لمصاريفك للتعرف على اتجاهات الإنفاق وفرص التوفير.`,
      data: JSON.stringify({
        startDate: lastWeekDate.toISOString(),
        endDate: currentDate.toISOString()
      })
    });
  }
}

// إنشاء إشعار اتجاه الإنفاق
async function createExpenseTrendNotification(userId: number, trendType: 'increase' | 'decrease', percentage: number, category?: string) {
  // الحصول على جميع إشعارات اتجاه الإنفاق
  const currentDate = new Date();
  const notifications = await storage.getNotifications(userId);
  
  // التحقق مما إذا كان هناك إشعار اتجاه إنفاق مشابه لهذا الشهر
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // نحدد ما إذا كنا بالفعل أرسلنا إشعارًا مماثلًا هذا الشهر
  const existingTrendNotification = notifications.find(n => {
    if (n.type !== 'expense_trend') return false;
    
    // فحص التاريخ
    const notifDate = new Date(n.createdAt);
    if (notifDate.getMonth() !== currentMonth || notifDate.getFullYear() !== currentYear) {
      return false;
    }
    
    // إذا كان الإشعار يخص نفس الفئة
    if (category) {
      try {
        const data = JSON.parse(n.data || '{}');
        return data.category === category && data.trendType === trendType;
      } catch {
        return false;
      }
    }
    
    return true;
  });
  
  // إذا لم يكن هناك إشعار مشابه، قم بإنشاء واحد جديد
  if (!existingTrendNotification) {
    console.log("إنشاء إشعار اتجاه إنفاق جديد");
    
    const title = trendType === 'increase' 
      ? 'زيادة في الإنفاق' 
      : 'انخفاض في الإنفاق';
      
    const message = category 
      ? `لاحظنا ${trendType === 'increase' ? 'زيادة' : 'انخفاضًا'} بنسبة ${Math.round(percentage)}% في إنفاقك على ${category} مقارنة بالشهر الماضي.`
      : `لاحظنا ${trendType === 'increase' ? 'زيادة' : 'انخفاضًا'} بنسبة ${Math.round(percentage)}% في إجمالي إنفاقك مقارنة بالشهر الماضي.`;
      
    await storage.createNotification({
      userId,
      type: 'expense_trend',
      title,
      message,
      data: JSON.stringify({
        trendType,
        percentage,
        category
      })
    });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // إعداد المصادقة
  setupAuth(app);
  // prefix all routes with /api
  const apiRouter = express.Router();
  
  // User API - هذه النقطة مُفعّلة بالفعل عن طريق ملف auth.ts
  
  // PUT /api/user/salary - Update user's monthly salary
  apiRouter.put("/user/salary", isAuthenticated, async (req: Request, res: Response) => {
    const { monthlySalary } = req.body;
    
    if (!monthlySalary || monthlySalary <= 0) {
      return res.status(400).json({ message: "يجب أن يكون الراتب الشهري رقمًا موجبًا" });
    }
    
    try {
      const userId = req.user!.id;
      const updatedUser = await storage.updateUserSalary(userId, monthlySalary);
      
      // Don't send the password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating salary:", error);
      res.status(500).json({ message: "فشل في تحديث الراتب الشهري" });
    }
  });
  
  // Categories API
  apiRouter.get("/categories", isAuthenticated, async (_req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "فشل في جلب الفئات" });
    }
  });
  
  // Add new category
  apiRouter.post("/categories", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const newCategory = await storage.createCategory(req.body);
      res.status(201).json(newCategory);
    } catch (error) {
      console.error("Error adding category:", error);
      res.status(500).json({ message: "فشل في إضافة الفئة" });
    }
  });
  
  // Expenses API
  apiRouter.get("/expenses", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id; // استخدام معرف المستخدم الحالي
      
      // Query parameters for filtering by month and year
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      
      // New query parameters for filtering by date range
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      
      let expenses;
      
      // If we have startDate parameter, filter by date range
      if (startDate) {
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date();
        
        // Get all expenses and then filter
        const allExpenses = await storage.getExpenses(userId);
        
        expenses = allExpenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= start && expenseDate <= end;
        });
      }
      // Otherwise, if we have month/year parameters, filter by month/year
      else if (month !== undefined && year !== undefined) {
        expenses = await storage.getExpensesByMonth(userId, month, year);
      } 
      // If no filters are provided, get all expenses
      else {
        expenses = await storage.getExpenses(userId);
      }
      
      // Log expenses for debugging
      console.log("Fetched expenses:", expenses.length);
      
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "فشل في جلب المصاريف" });
    }
  });
  
  apiRouter.post("/expenses", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Add userId to the request body
      const expenseData = { ...req.body, userId };
      
      // Log the request body for debugging
      console.log("Expense data received:", JSON.stringify(expenseData));
      
      // Validate the request body
      const validatedData = insertExpenseSchema.parse(expenseData);
      
      // Log the validated data
      console.log("Validated expense data:", JSON.stringify(validatedData));
      
      const newExpense = await storage.createExpense(validatedData);
      
      // بعد إضافة المصروف، تحقق مما إذا كان يجب إنشاء إشعارات
      try {
        // الحصول على معلومات المستخدم للتحقق من الميزانية
        const user = await storage.getUser(userId);
        if (user) {
          // الحصول على إجمالي المصاريف لهذا الشهر
          const currentDate = new Date();
          const month = currentDate.getMonth();
          const year = currentDate.getFullYear();
          const expenses = await storage.getExpensesByMonth(userId, month, year);
          const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
          
          // إذا كان المستخدم لديه ميزانية شهرية، تحقق من حدود الإنفاق
          const monthlyBudget = user.monthlyBudget || 0;
          if (monthlyBudget > 0) {
            // التحقق من حدود الإنفاق وإنشاء إشعارات إذا لزم الأمر
            await createSpendingWarningNotification(userId, totalAmount, monthlyBudget);
            await createSpendingDangerNotification(userId, totalAmount, monthlyBudget);
          }
          
          // تحليل أنماط الإنفاق إذا كان هناك مصاريف كافية
          if (expenses.length > 5) {
            // حساب الإنفاق حسب الأهمية
            const luxuryExpenses = expenses.filter(e => e.importance === 'رفاهية');
            const essentialExpenses = expenses.filter(e => e.importance === 'مهم');
            
            const luxuryAmount = luxuryExpenses.reduce((sum, e) => sum + e.amount, 0);
            const essentialAmount = essentialExpenses.reduce((sum, e) => sum + e.amount, 0);
            
            // إنشاء إشعارات للإنفاق على الرفاهية أو الأساسيات إذا لزم الأمر
            await createLuxurySpendingNotification(userId, luxuryAmount, totalAmount);
            await createEssentialDecreaseNotification(userId, essentialAmount, totalAmount);
          }
        }
      } catch (notificationError) {
        // لا نريد أن تفشل عملية إضافة المصروف إذا فشلت عملية إنشاء الإشعارات
        console.error("Error creating notifications:", notificationError);
      }
      
      res.status(201).json(newExpense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", JSON.stringify(error.errors));
        res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      } else {
        console.error("Server error:", error);
        res.status(500).json({ message: "فشل في إضافة المصروف" });
      }
    }
  });
  
  apiRouter.put("/expenses/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Get the existing expense to verify it exists and belongs to the user
      const existingExpense = await storage.getExpenseById(id);
      if (!existingExpense) {
        return res.status(404).json({ message: "المصروف غير موجود" });
      }
      
      // التحقق من أن المصروف ينتمي للمستخدم الحالي
      if (existingExpense.userId !== userId) {
        return res.status(403).json({ message: "ليس لديك صلاحية تعديل هذا المصروف" });
      }
      
      // Validate the request body
      const validatedData = insertExpenseSchema.partial().parse(req.body);
      
      const updatedExpense = await storage.updateExpense(id, validatedData);
      res.json(updatedExpense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      } else {
        res.status(500).json({ message: "فشل في تحديث المصروف" });
      }
    }
  });
  
  apiRouter.delete("/expenses/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Get the existing expense to verify it exists and belongs to the user
      const existingExpense = await storage.getExpenseById(id);
      if (!existingExpense) {
        return res.status(404).json({ message: "المصروف غير موجود" });
      }
      
      // التحقق من أن المصروف ينتمي للمستخدم الحالي
      if (existingExpense.userId !== userId) {
        return res.status(403).json({ message: "ليس لديك صلاحية حذف هذا المصروف" });
      }
      
      const deleted = await storage.deleteExpense(id);
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "المصروف غير موجود" });
      }
    } catch (error) {
      res.status(500).json({ message: "فشل في حذف المصروف" });
    }
  });
  
  // Expense summary API
  apiRouter.get("/expenses/summary", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Query parameters for filtering by month and year
      const month = req.query.month !== undefined 
        ? parseInt(req.query.month as string) 
        : new Date().getMonth();
      const year = req.query.year !== undefined 
        ? parseInt(req.query.year as string) 
        : new Date().getFullYear();
        
      // New query parameters for filtering by date range
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      
      let expenses;
      
      // If we have startDate parameter, filter by date range
      if (startDate) {
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date();
        
        // Get all expenses and then filter
        const allExpenses = await storage.getExpenses(userId);
        
        expenses = allExpenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= start && expenseDate <= end;
        });
      } else {
        // Otherwise filter by month/year
        expenses = await storage.getExpensesByMonth(userId, month, year);
      }
      
      const categories = await storage.getCategories();
      
      // Log expenses for debugging
      console.log("Fetched expenses for summary:", expenses.length);
      
      // Calculate the total amount of expenses
      const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      // Group expenses by category
      const byCategory = expenses.reduce((acc, expense) => {
        const categoryId = expense.categoryId;
        if (!acc[categoryId]) {
          acc[categoryId] = 0;
        }
        acc[categoryId] += expense.amount;
        return acc;
      }, {} as Record<number, number>);
      
      // Format the summary with category details
      const categorySummary = Object.entries(byCategory).map(([categoryId, amount]) => {
        const category = categories.find(c => c.id === parseInt(categoryId));
        return {
          categoryId: parseInt(categoryId),
          name: category?.name || "غير معروف",
          color: category?.color || "#cccccc",
          icon: category?.icon || "question",
          amount,
          percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0
        };
      });
      
      // Sort by amount in descending order
      categorySummary.sort((a, b) => b.amount - a.amount);
      
      // Group expenses by importance
      const byImportance = expenses.reduce((acc, expense) => {
        const importance = expense.importance || "عادي";
        if (!acc[importance]) {
          acc[importance] = 0;
        }
        acc[importance] += expense.amount;
        return acc;
      }, {} as Record<string, number>);
      
      // Format the importance summary
      const importanceSummary = Object.entries(byImportance).map(([importance, amount]) => {
        return {
          importance,
          amount,
          percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
          color: importance === "مهم" ? "#ef4444" : importance === "رفاهية" ? "#8b5cf6" : "#3b82f6"
        };
      });
      
      // Sort by amount in descending order
      importanceSummary.sort((a, b) => b.amount - a.amount);
      
      // قم بإنشاء إشعار تحليل أسبوعي إذا كان اليوم هو يوم الأحد
      try {
        const today = new Date();
        if (today.getDay() === 0) { // 0 = الأحد
          // تحقق مما إذا كان هناك مصاريف كافية لإنشاء تحليل
          if (expenses.length > 10) {
            await createWeeklyAnalysisNotification(userId);
            
            // فحص اتجاهات الإنفاق للفئات الرئيسية
            if (categorySummary.length > 0) {
              const topCategory = categorySummary[0];
              await createExpenseTrendNotification(userId, 'increase', topCategory.percentage, topCategory.name);
            }
          }
        }
      } catch (notificationError) {
        console.error("Error creating weekly analysis notification:", notificationError);
      }
      
      res.json({
        totalAmount,
        categorySummary,
        importanceSummary
      });
    } catch (error) {
      console.error("Error fetching expense summary:", error);
      res.status(500).json({ message: "فشل في جلب ملخص المصاريف" });
    }
  });
  
  // Savings Goals API
  apiRouter.get("/savings-goals", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const goals = await storage.getSavingsGoals(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "فشل في جلب أهداف التوفير" });
    }
  });
  
  apiRouter.get("/savings-goals/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const goal = await storage.getSavingsGoalById(id);
      
      if (!goal) {
        return res.status(404).json({ message: "هدف التوفير غير موجود" });
      }
      
      // Get sub-goals for this savings goal
      const subGoals = await storage.getSubGoalsByGoalId(id);
      
      res.json({
        ...goal,
        subGoals
      });
    } catch (error) {
      res.status(500).json({ message: "فشل في جلب هدف التوفير" });
    }
  });
  
  apiRouter.post("/savings-goals", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Add userId to the request body
      const goalData = { ...req.body, userId };
      
      // Validate the request body
      const validatedData = insertSavingsGoalSchema.parse(goalData);
      
      const newGoal = await storage.createSavingsGoal(validatedData);
      res.status(201).json(newGoal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      } else {
        res.status(500).json({ message: "فشل في إضافة هدف التوفير" });
      }
    }
  });
  
  apiRouter.put("/savings-goals/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Get the existing goal to verify it exists and belongs to the user
      const existingGoal = await storage.getSavingsGoalById(id);
      if (!existingGoal) {
        return res.status(404).json({ message: "هدف التوفير غير موجود" });
      }
      
      // التحقق من أن هدف التوفير ينتمي للمستخدم الحالي
      if (existingGoal.userId !== userId) {
        return res.status(403).json({ message: "ليس لديك صلاحية تعديل هذا الهدف" });
      }
      
      // Validate the request body
      const validatedData = insertSavingsGoalSchema.partial().parse(req.body);
      
      const updatedGoal = await storage.updateSavingsGoal(id, validatedData);
      res.json(updatedGoal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      } else {
        res.status(500).json({ message: "فشل في تحديث هدف التوفير" });
      }
    }
  });
  
  // Sub-goals API
  apiRouter.post("/sub-goals", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Validate the request body
      const validatedData = insertSubGoalSchema.parse(req.body);
      
      // Verify the parent goal exists
      const parentGoal = await storage.getSavingsGoalById(validatedData.goalId);
      if (!parentGoal) {
        return res.status(404).json({ message: "هدف التوفير الرئيسي غير موجود" });
      }
      
      // التحقق من أن هدف التوفير الرئيسي ينتمي للمستخدم الحالي
      if (parentGoal.userId !== userId) {
        return res.status(403).json({ message: "ليس لديك صلاحية إضافة أهداف فرعية لهذا الهدف" });
      }
      
      const newSubGoal = await storage.createSubGoal(validatedData);
      res.status(201).json(newSubGoal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      } else {
        res.status(500).json({ message: "فشل في إضافة الهدف الفرعي" });
      }
    }
  });
  
  apiRouter.put("/sub-goals/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // الحصول على الهدف الفرعي
      const subGoal = await storage.getSubGoalById(id);
      if (!subGoal) {
        return res.status(404).json({ message: "الهدف الفرعي غير موجود" });
      }
      
      // الحصول على الهدف الرئيسي للتحقق من الملكية
      const parentGoal = await storage.getSavingsGoalById(subGoal.goalId);
      if (!parentGoal) {
        return res.status(404).json({ message: "هدف التوفير الرئيسي غير موجود" });
      }
      
      // التحقق من أن هدف التوفير الرئيسي ينتمي للمستخدم الحالي
      if (parentGoal.userId !== userId) {
        return res.status(403).json({ message: "ليس لديك صلاحية تعديل هذا الهدف الفرعي" });
      }
      
      // Validate the request body
      const validatedData = insertSubGoalSchema.partial().parse(req.body);
      
      const updatedSubGoal = await storage.updateSubGoal(id, validatedData);
      res.json(updatedSubGoal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      } else {
        res.status(500).json({ message: "فشل في تحديث الهدف الفرعي" });
      }
    }
  });
  
  // PUT /api/user/profile - Update user's profile information
  apiRouter.put("/user/profile", isAuthenticated, async (req: Request, res: Response) => {
    const updateSchema = z.object({
      fullName: z.string().optional(),
      monthlyBudget: z.number().optional()
    });
    
    try {
      const data = updateSchema.parse(req.body);
      
      if (Object.keys(data).length === 0) {
        return res.status(400).json({ error: "لم يتم توفير أي بيانات للتحديث" });
      }
      
      const updatedUser = await storage.updateUserProfile(req.user!.id, data);
      
      // Don't send the password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "بيانات غير صالحة", details: error.errors });
      }
      res.status(500).json({ error: "حدث خطأ أثناء تحديث الملف الشخصي" });
    }
  });
  
  // API مسارات الإشعارات
  
  // الحصول على جميع الإشعارات للمستخدم الحالي
  apiRouter.get("/notifications", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const notifications = await storage.getNotifications(req.user!.id);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // الحصول على عدد الإشعارات غير المقروءة
  apiRouter.get("/notifications/unread-count", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const count = await storage.countUnreadNotifications(req.user!.id);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // وضع علامة "مقروء" على إشعار محدد
  apiRouter.put("/notifications/:id/read", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const notification = await storage.getNotificationById(id);
      
      if (!notification) {
        return res.status(404).json({ error: "إشعار غير موجود" });
      }
      
      // التحقق من ملكية الإشعار
      if (notification.userId !== req.user!.id) {
        return res.status(403).json({ error: "غير مصرح بهذه العملية" });
      }
      
      const updatedNotification = await storage.markNotificationAsRead(id);
      res.json(updatedNotification);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // وضع علامة "مقروء" على جميع الإشعارات
  apiRouter.put("/notifications/mark-all-read", isAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.markAllNotificationsAsRead(req.user!.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // إنشاء إشعار جديد (للاختبار والاستخدام الداخلي)
  apiRouter.post("/notifications", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const data = {
        ...req.body,
        userId: req.user!.id
      };
      
      const notification = await storage.createNotification(data);
      res.status(201).json(notification);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Register the API router
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
