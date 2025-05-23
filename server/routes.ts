import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertExpenseSchema, 
  insertSavingsGoalSchema, 
  insertSubGoalSchema,
  notificationTypeEnum,
  insertChallengeSchema,
  type Challenge
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
  const warningLimit = monthlyBudget * 0.7; // 70% من الميزانية الشهرية
  const dangerLimit = monthlyBudget * 0.9; // 90% من الميزانية الشهرية
  
  // التحقق مما إذا كنا بحاجة لإنشاء إشعار
  if (currentSpending >= warningLimit && currentSpending < dangerLimit) {
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
  const dangerLimit = monthlyBudget * 0.9; // 90% من الميزانية الشهرية
  if (currentSpending >= dangerLimit) {
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
        title: 'تحذير: اقتراب من تجاوز الميزانية',
        message: `لقد وصلت مصاريفك إلى ${Math.round((currentSpending / monthlyBudget) * 100)}% من الميزانية الشهرية.`,
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

// وظائف خاصة بنظام التحديات

// تحليل بيانات المستخدم لإنشاء التحديات المناسبة
async function analyzeUserDataForChallenges(userId: number) {
  try {
    // 1. جلب بيانات المستخدم
    const user = await storage.getUser(userId);
    if (!user) return null;
    
    // 2. جلب المصاريف للشهر الحالي
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const expenses = await storage.getExpensesByMonth(userId, currentMonth, currentYear);
    
    // 3. تحليل البيانات استنادًا إلى طلبات التحدي المختلفة
    
    // أ. تحليل الإنفاق حسب الفئات
    const categorySpending: Record<number, number> = {};
    expenses.forEach(expense => {
      if (!categorySpending[expense.categoryId]) {
        categorySpending[expense.categoryId] = 0;
      }
      categorySpending[expense.categoryId] += expense.amount;
    });
    
    // ب. تحديد الفئة ذات الإنفاق الأعلى
    let maxSpendingCategory = 0;
    let maxSpendingAmount = 0;
    
    for (const categoryId in categorySpending) {
      if (categorySpending[categoryId] > maxSpendingAmount) {
        maxSpendingAmount = categorySpending[categoryId];
        maxSpendingCategory = parseInt(categoryId);
      }
    }
    
    // جـ. تحليل الإنفاق حسب الأهمية
    const importanceSpending: Record<string, number> = {
      'مهم': 0,
      'عادي': 0,
      'رفاهية': 0
    };
    
    expenses.forEach(expense => {
      if (expense.importance) {
        importanceSpending[expense.importance] += expense.amount;
      }
    });
    
    // د. حساب النسب المئوية للإنفاق حسب الأهمية
    const totalSpending = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const luxuryPercentage = totalSpending > 0 ? (importanceSpending['رفاهية'] / totalSpending) * 100 : 0;
    const normalPercentage = totalSpending > 0 ? (importanceSpending['عادي'] / totalSpending) * 100 : 0;
    const essentialPercentage = totalSpending > 0 ? (importanceSpending['مهم'] / totalSpending) * 100 : 0;
    
    // هـ. تحليل أنماط الإنفاق اليومية
    const daySpending: Record<number, number> = {};
    expenses.forEach(expense => {
      const day = new Date(expense.date).getDay(); // 0 = الأحد، 6 = السبت
      if (!daySpending[day]) {
        daySpending[day] = 0;
      }
      daySpending[day] += expense.amount;
    });
    
    // و. تحليل إنفاق نهاية الأسبوع (الجمعة + السبت)
    const weekendSpending = (daySpending[5] || 0) + (daySpending[6] || 0);
    const weekdaySpending = totalSpending - weekendSpending;
    const weekendPercentage = totalSpending > 0 ? (weekendSpending / totalSpending) * 100 : 0;
    
    // ز. قياس نسبة الإنفاق إلى الميزانية
    const monthlyBudget = user.monthlyBudget || 0;
    const budgetPercentage = monthlyBudget > 0 ? (totalSpending / monthlyBudget) * 100 : 0;
    
    // ح. مراقبة انتظام تسجيل المصاريف (هل هناك فجوات كبيرة بين تواريخ المصاريف؟)
    const sortedDates = expenses.map(e => new Date(e.date).getTime()).sort();
    let maxGapDays = 0;
    
    if (sortedDates.length > 1) {
      for (let i = 1; i < sortedDates.length; i++) {
        const gap = (sortedDates[i] - sortedDates[i-1]) / (1000 * 60 * 60 * 24); // التحويل إلى أيام
        maxGapDays = Math.max(maxGapDays, gap);
      }
    }
    
    // التحقق من التحديات الحالية للمستخدم
    const userChallenges = await storage.getChallenges(userId);
    const activeOrSuggestedChallengeTypes = userChallenges
      .filter(c => c.status === 'active' || c.status === 'suggested')
      .map(c => c.type);
    
    // إنشاء التحديات المناسبة استنادًا إلى التحليل
    let challengeCount = 0;
    
    // تحدي تقليل الإنفاق على الفئة الأكثر استهلاكًا
    if (maxSpendingCategory > 0 && !activeOrSuggestedChallengeTypes.includes('category_limit')) {
      const category = await storage.getCategoryById(maxSpendingCategory);
      if (category) {
        const challenge = {
          userId: userId,
          title: `تحدي تقليل الإنفاق على ${category.name}`,
          description: `تجنب الإنفاق على ${category.name} لمدة 10 أيام لتوفير المال.`,
          type: 'category_limit' as const,
          status: 'suggested' as const,
          startDate: new Date(),
          endDate: new Date(new Date().setDate(new Date().getDate() + 10)),
          progress: 0,
          targetValue: maxSpendingAmount * 0.7, // هدف خفض 30٪
          currentValue: 0,
          metadata: JSON.stringify({
            categoryId: maxSpendingCategory,
            categoryName: category.name,
            duration: 10 // أيام
          })
        };
        
        await storage.createChallenge(challenge);
        challengeCount++;
        
        await createChallengeSuggestionNotification(userId, {
          title: challenge.title,
          description: challenge.description,
          type: challenge.type
        });
      }
    }
    
    // تحدي تقليل الإنفاق على الرفاهيات
    if (luxuryPercentage > 30 && !activeOrSuggestedChallengeTypes.includes('importance_limit')) {
      const challenge = {
        userId: userId,
        title: 'تحدي التوقف عن الرفاهيات',
        description: 'لا مصاريف رفاهية لمدة أسبوع، ركز على الضروريات فقط.',
        type: 'importance_limit' as const,
        status: 'suggested' as const,
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        progress: 0,
        targetValue: 0, // لا رفاهيات
        currentValue: 0,
        metadata: JSON.stringify({
          importance: 'رفاهية',
          duration: 7 // أيام
        })
      };
      
      await storage.createChallenge(challenge);
      challengeCount++;
      
      await createChallengeSuggestionNotification(userId, {
        title: challenge.title,
        description: challenge.description,
        type: challenge.type
      });
    }
    
    // تحدي عدم الإنفاق في نهاية الأسبوع
    if (weekendPercentage > 35 && !activeOrSuggestedChallengeTypes.includes('time_based')) {
      const challenge = {
        userId: userId,
        title: 'لا إنفاق في نهاية الأسبوع',
        description: 'تجنب الإنفاق يومي الجمعة والسبت لأسبوعين.',
        type: 'time_based' as const,
        status: 'suggested' as const,
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 14)),
        progress: 0,
        targetValue: 4, // 4 أيام نهاية أسبوع
        currentValue: 0,
        metadata: JSON.stringify({
          days: [5, 6], // الجمعة والسبت
          duration: 14 // أيام
        })
      };
      
      await storage.createChallenge(challenge);
      challengeCount++;
      
      await createChallengeSuggestionNotification(userId, {
        title: challenge.title,
        description: challenge.description,
        type: challenge.type
      });
    }
    
    // تحدي تقليل الإنفاق الأسبوعي عند الاقتراب من الميزانية
    if (budgetPercentage > 75 && !activeOrSuggestedChallengeTypes.includes('spending_reduction')) {
      const weeklyAvg = totalSpending / (currentDate.getDate() / 7); // متوسط الإنفاق الأسبوعي
      const targetAmount = weeklyAvg * 0.7;
      
      const challenge = {
        userId: userId,
        title: 'تحدي التقليل 30%',
        description: `قم بخفض إنفاقك الأسبوعي بنسبة 30% (إلى ${Math.round(targetAmount)} ﷼) هذا الأسبوع.`,
        type: 'spending_reduction' as const,
        status: 'suggested' as const,
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        progress: 0,
        targetValue: targetAmount,
        currentValue: 0,
        metadata: JSON.stringify({
          targetReduction: 30,
          weeklyAverage: weeklyAvg,
          targetAmount: targetAmount,
          duration: 7 // أيام
        })
      };
      
      await storage.createChallenge(challenge);
      challengeCount++;
      
      await createChallengeSuggestionNotification(userId, {
        title: challenge.title,
        description: challenge.description,
        type: challenge.type
      });
    }
    
    // تم إزالة تحدي الادخار (saving_goal) بناءً على المتطلبات
    
    // تحدي الانتظام في تسجيل المصاريف
    if ((maxGapDays > 3 || expenses.length < 10) && !activeOrSuggestedChallengeTypes.includes('consistency')) {
      const challenge = {
        userId: userId,
        title: 'تحدي تسجيل المصاريف',
        description: 'سجل مصاريفك يوميًا لمدة 7 أيام متتالية.',
        type: 'consistency' as const,
        status: 'suggested' as const,
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        progress: 0,
        targetValue: 7, // عدد الأيام
        currentValue: 0,
        metadata: JSON.stringify({
          duration: 7, // أيام
          requiresDaily: true
        })
      };
      
      await storage.createChallenge(challenge);
      challengeCount++;
      
      await createChallengeSuggestionNotification(userId, {
        title: challenge.title,
        description: challenge.description,
        type: challenge.type
      });
    }
    
    return challengeCount;
    
  } catch (error) {
    console.error("Error analyzing user data for challenges:", error);
    return 0;
  }
}

// إنشاء إشعار باقتراح تحدي جديد
async function createChallengeSuggestionNotification(userId: number, challenge: any) {
  try {
    await storage.createNotification({
      userId,
      type: 'challenge_suggestion',
      title: 'تحدي جديد متاح!',
      message: `نقترح عليك تجربة "${challenge.title}". ${challenge.description}`,
      data: JSON.stringify(challenge)
    });
    
    console.log(`تم إنشاء إشعار باقتراح تحدي جديد للمستخدم ${userId}`);
    return true;
  } catch (error) {
    console.error("Error creating challenge suggestion notification:", error);
    return false;
  }
}

// التحقق من إنجاز التحدي
async function checkChallengeCompletion(challenge: Challenge, userId: number): Promise<{ completed: boolean, progress: number, currentValue?: number, failed?: boolean }> {
  try {
    // استخراج البيانات الوصفية
    const metadata = challenge.metadata ? JSON.parse(challenge.metadata) : {};
    
    // جلب المصاريف منذ بدء التحدي
    const startDate = new Date(challenge.startDate);
    const endDate = new Date(challenge.endDate);
    const today = new Date();
    
    // تحديد ما إذا كان التحدي قد انتهى
    const isExpired = today > endDate;
    
    // حساب مدة التحدي بالأيام
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // جلب مصاريف الفترة
    const allExpenses = await storage.getExpenses(userId);
    const challengePeriodExpenses = allExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= (isExpired ? endDate : today);
    });
    
    // استخراج أيام المصاريف الفريدة
    const dayExpenseMap = new Map<string, number[]>();
    
    challengePeriodExpenses.forEach(expense => {
      const dateStr = new Date(expense.date).toISOString().split('T')[0];
      if (!dayExpenseMap.has(dateStr)) {
        dayExpenseMap.set(dateStr, []);
      }
      dayExpenseMap.get(dateStr)!.push(expense.id);
    });
    
    // تحليل التقدم استنادًا إلى نوع التحدي
    switch (challenge.type) {
      case 'category_limit': {
        // تحدي الحد من الإنفاق على فئة معينة
        const categoryId = metadata.categoryId;
        
        // التحقق من عدم الإنفاق على هذه الفئة - أي مصروف من هذه الفئة يؤدي إلى فشل التحدي فوراً
        const categoryExpenses = challengePeriodExpenses.filter(e => e.categoryId === categoryId);
        
        // شروط الفشل: وجود أي مصروف في الفئة المحددة
        if (categoryExpenses.length > 0) {
          return { 
            completed: false,
            progress: 0,
            currentValue: categoryExpenses.reduce((sum, e) => sum + e.amount, 0),
            failed: true
          };
        }
        
        // حساب عدد الأيام التي مرت بنجاح (بدون إنفاق على الفئة المحظورة)
        let successDays = 0;
        
        // تقسيم الأيام إلى فترات 24 ساعة من بداية التحدي
        let currentDate = new Date(startDate);
        while (currentDate <= (isExpired ? endDate : today)) {
          const nextDate = new Date(currentDate);
          nextDate.setDate(nextDate.getDate() + 1);
          
          // نجتاز يوم واحد إذا لم يكن هناك إنفاق على الفئة المحظورة
          const dayStr = currentDate.toISOString().split('T')[0];
          successDays++;
          
          currentDate = nextDate;
        }
        
        // التقدم يعتمد على عدد الأيام الناجحة من إجمالي أيام التحدي
        const progress = Math.min(100, (successDays / totalDays) * 100);
        
        // شروط إكمال التحدي: انتهاء المدة بدون إنفاق على الفئة المحددة
        const completed = isExpired && categoryExpenses.length === 0;
        
        return { 
          completed,
          progress, 
          currentValue: successDays
        };
      }
      
      case 'importance_limit': {
        // تحدي الحد من الإنفاق حسب الأهمية
        const importance = metadata.importance;
        const onlyEssentials = metadata.onlyEssentials;
        
        if (onlyEssentials) {
          // تحدي الإنفاق على الضروريات فقط
          const nonEssentialExpenses = challengePeriodExpenses.filter(e => e.importance !== 'مهم');
          
          // شروط الفشل: وجود أي مصروف غير ضروري
          if (nonEssentialExpenses.length > 0) {
            return { 
              completed: false,
              progress: 0,
              currentValue: nonEssentialExpenses.reduce((sum, e) => sum + e.amount, 0),
              failed: true
            };
          }
          
          // حساب عدد الأيام التي مرت بنجاح (فقط مصاريف ضرورية أو لا مصاريف)
          let successDays = 0;
          
          // تقسيم الأيام إلى فترات 24 ساعة من بداية التحدي
          let currentDate = new Date(startDate);
          while (currentDate <= (isExpired ? endDate : today)) {
            const nextDate = new Date(currentDate);
            nextDate.setDate(nextDate.getDate() + 1);
            
            // نجتاز يوم واحد بنجاح
            successDays++;
            
            currentDate = nextDate;
          }
          
          // التقدم يعتمد على عدد الأيام الناجحة من إجمالي أيام التحدي
          const progress = Math.min(100, (successDays / totalDays) * 100);
          
          // شروط إكمال التحدي: انتهاء المدة بدون إنفاق غير ضروري
          const completed = isExpired && nonEssentialExpenses.length === 0;
          
          return { 
            completed,
            progress,
            currentValue: successDays
          };
        } else {
          // تحدي تجنب الإنفاق على فئة معينة من الأهمية
          const importanceExpenses = challengePeriodExpenses.filter(e => e.importance === importance);
          
          // شروط الفشل: وجود أي مصروف في فئة الأهمية المحددة
          if (importanceExpenses.length > 0) {
            return { 
              completed: false,
              progress: 0,
              currentValue: importanceExpenses.reduce((sum, e) => sum + e.amount, 0),
              failed: true
            };
          }
          
          // حساب عدد الأيام التي مرت بنجاح
          let successDays = 0;
          
          // تقسيم الأيام إلى فترات 24 ساعة من بداية التحدي
          let currentDate = new Date(startDate);
          while (currentDate <= (isExpired ? endDate : today)) {
            const nextDate = new Date(currentDate);
            nextDate.setDate(nextDate.getDate() + 1);
            
            // نجتاز يوم واحد
            successDays++;
            
            currentDate = nextDate;
          }
          
          // التقدم يعتمد على عدد الأيام الناجحة من إجمالي أيام التحدي
          const progress = Math.min(100, (successDays / totalDays) * 100);
          
          // شروط إكمال التحدي: انتهاء المدة بدون إنفاق على فئة الأهمية المحددة
          const completed = isExpired && importanceExpenses.length === 0;
          
          return { 
            completed,
            progress,
            currentValue: successDays
          };
        }
      }
      
      case 'time_based': {
        // تحدي عدم الإنفاق في أيام محددة (نهاية الأسبوع: الجمعة = 5، السبت = 6)
        const restrictedDays = metadata.days || [5, 6]; // الأيام المحظورة (افتراضيًا: نهاية الأسبوع)
        
        // التحقق من كل مصروف للتحقق من أنه لم يتم في يوم محظور
        const violatingExpenses = challengePeriodExpenses.filter(e => {
          const expenseDay = new Date(e.date).getDay();
          return restrictedDays.includes(expenseDay);
        });
        
        // شروط الفشل: وجود أي مصروف في الأيام المحظورة
        if (violatingExpenses.length > 0) {
          return { 
            completed: false,
            progress: 0,
            currentValue: violatingExpenses.reduce((sum, e) => sum + e.amount, 0),
            failed: true
          };
        }
        
        // حساب عدد الأيام المحظورة التي مرت بنجاح (بدون إنفاق)
        const restrictedDaysPassed = [];
        let currentDate = new Date(startDate);
        while (currentDate <= (isExpired ? endDate : today)) {
          if (restrictedDays.includes(currentDate.getDay())) {
            restrictedDaysPassed.push(new Date(currentDate).toISOString().split('T')[0]);
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // حساب إجمالي عدد الأيام المحظورة في فترة التحدي
        let totalRestrictedDays = 0;
        currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          if (restrictedDays.includes(currentDate.getDay())) {
            totalRestrictedDays++;
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // التقدم يعتمد على عدد الأيام المحظورة التي تم اجتيازها بنجاح
        const progress = totalRestrictedDays > 0 ? 
          Math.min(100, (restrictedDaysPassed.length / totalRestrictedDays) * 100) : 0;
        
        // شروط إكمال التحدي: انتهاء المدة بدون إنفاق في الأيام المحظورة
        const completed = isExpired && violatingExpenses.length === 0;
        
        return { 
          completed,
          progress,
          currentValue: restrictedDaysPassed.length
        };
      }
      
      case 'spending_reduction': {
        // تحدي تخفيض الإنفاق
        const targetReduction = metadata.targetReduction || 30; // نسبة التخفيض المطلوبة
        const weeklyAverage = metadata.weeklyAverage || 0;
        const targetAmount = metadata.targetAmount || 0;
        
        // حساب إجمالي الإنفاق خلال فترة التحدي
        const totalSpent = challengePeriodExpenses.reduce((sum, e) => sum + e.amount, 0);
        
        // شروط الفشل: تجاوز المبلغ المستهدف
        const failed = targetAmount > 0 && totalSpent > targetAmount;
        
        // شروط إكمال التحدي: انتهاء المدة والإنفاق أقل من أو يساوي المبلغ المستهدف
        const completed = isExpired && totalSpent <= targetAmount;
        
        // حساب التقدم
        let progress = 0;
        if (totalSpent <= targetAmount) {
          // إذا تم الوصول للهدف المنشود
          progress = 100;
        } else if (weeklyAverage > 0 && targetAmount > 0) {
          // قياس التقدم بناءً على المسافة بين المتوسط الأسبوعي والمبلغ المستهدف
          const maxAmount = weeklyAverage;
          const reduction = Math.max(0, maxAmount - totalSpent);
          progress = Math.min(100, (reduction / (maxAmount - targetAmount)) * 100);
        } else {
          // إذا لم تتوفر معلومات كافية، نستخدم التقدم بناءً على المدة
          const daysPassed = Math.min(Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)), totalDays);
          progress = Math.min(100, (daysPassed / totalDays) * 100);
        }
        
        return { 
          completed, 
          progress, 
          currentValue: totalSpent,
          failed
        };
      }
      
      case 'consistency': {
        // تحدي تسجيل المصاريف بانتظام لمدة معينة (واحد في اليوم)
        const targetDays = metadata.targetDays || 7; // عدد الأيام المستهدفة (افتراضيًا: 7 أيام)
        const requiresDaily = metadata.requiresDaily === true; // هل يتطلب التحدي تسجيل المصاريف يوميًا؟
        
        // جمع الأيام التي تم تسجيل مصاريف فيها
        const recordedDays = new Set<string>();
        
        challengePeriodExpenses.forEach(expense => {
          recordedDays.add(new Date(expense.date).toISOString().split('T')[0]);
        });
        
        // حساب الأيام التي مرت من بداية التحدي
        const daysPassed = new Map<string, boolean>();
        let currentDate = new Date(startDate);
        let totalDaysPassed = 0;
        
        while (currentDate <= (isExpired ? endDate : today)) {
          const dayStr = currentDate.toISOString().split('T')[0];
          const hasExpenseOnDay = recordedDays.has(dayStr);
          daysPassed.set(dayStr, hasExpenseOnDay);
          totalDaysPassed++;
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // البحث عن أي يوم مكسور (يوم مر بدون تسجيل مصاريف)
        const daysWithExpenses = Array.from(daysPassed.entries())
          .filter(([_, hasExpense]) => hasExpense)
          .map(([day]) => day);
          
        const daysRecorded = daysWithExpenses.length;
        
        // للتحديات اليومية - يجب أن يكون التقدم تدريجياً (1/7 في اليوم)
        let progress = 0;
        
        if (requiresDaily) {
          // الحد الأقصى للأيام هو عدد الأيام المستهدفة أو عدد الأيام المنقضية (أيهما أقل)
          const maxDaysRequiredSoFar = Math.min(totalDaysPassed, targetDays);
          // التقدم هو نسبة عدد الأيام المسجلة إلى الحد الأقصى للأيام المطلوبة حتى الآن
          progress = Math.min(100, (daysRecorded / targetDays) * 100);
        } else {
          // للتحديات غير اليومية - يتم حساب التقدم تراكمياً
          progress = Math.min(100, (daysRecorded / targetDays) * 100);
        }
        
        // شروط إكمال التحدي: 
        // 1. إذا كان التحدي يتطلب تسجيل المصاريف يوميًا: تم تسجيل مصاريف لـ targetDays يوم متتالي
        // 2. إذا كان غير يومي: تم تسجيل المصاريف في عدد الأيام المطلوبة على الأقل
        const completed = daysRecorded >= targetDays;
        
        return { 
          completed,
          progress,
          currentValue: daysRecorded
        };
      }

      default:
        return { completed: false, progress: 0 };
    }
    
  } catch (error) {
    console.error("Error checking challenge completion:", error);
    return { completed: false, progress: 0 };
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
  
  // حذف إشعار محدد
  apiRouter.delete("/notifications/:id", isAuthenticated, async (req: Request, res: Response) => {
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
      
      const success = await storage.deleteNotification(id);
      if (success) {
        res.json({ success: true, message: "تم حذف الإشعار بنجاح" });
      } else {
        res.status(500).json({ error: "فشل في حذف الإشعار" });
      }
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ error: error.message || "حدث خطأ أثناء حذف الإشعار" });
    }
  });
  
  // ================ APIs الخاصة بالتحديات ================
  
  // الحصول على جميع التحديات الخاصة بالمستخدم
  apiRouter.get("/challenges", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const challenges = await storage.getChallenges(userId);
      res.status(200).json(challenges);
    } catch (error: any) {
      console.error('Error fetching challenges:', error);
      res.status(500).json({ error: error.message || 'حدث خطأ أثناء جلب التحديات' });
    }
  });
  
  // الحصول على التحدي النشط حاليًا
  apiRouter.get("/challenges/active", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const challenge = await storage.getActiveChallenge(userId);
      
      if (!challenge) {
        return res.status(404).json({ message: 'لا يوجد تحدي نشط حاليًا' });
      }
      
      // ملاحظة: تم إزالة التحقق من نوع التحدي "saving_goal" لأنه لم يعد موجودًا في السكيما
      
      // التحقق من حالة التحدي وتحديث التقدم
      const completionStatus = await checkChallengeCompletion(challenge, userId);
      
      // التحقق من فشل التحدي (مثل إذا كان هناك إنفاق على فئة محظورة)
      if (completionStatus.failed && challenge.status === 'active') {
        await storage.updateChallengeStatus(challenge.id, 'failed');
        
        // إنشاء إشعار بفشل التحدي
        await storage.createNotification({
          userId,
          type: 'challenge_failed',
          title: 'فشل التحدي',
          message: `لم تتمكن من إكمال التحدي "${challenge.title}" لأنك خالفت شروطه. حاول مرة أخرى!`,
          data: JSON.stringify({
            challengeId: challenge.id,
            title: challenge.title
          })
        });
        
        // جلب التحدي بعد التحديث
        const updatedChallenge = await storage.getChallengeById(challenge.id);
        return res.status(200).json(updatedChallenge);
      }
      
      // تحديث التقدم إذا تغير، ولم يفشل التحدي
      if (!completionStatus.failed && 
          (completionStatus.progress !== challenge.progress || 
           completionStatus.currentValue !== challenge.currentValue)) {
        await storage.updateChallengeProgress(
          challenge.id, 
          completionStatus.progress, 
          completionStatus.currentValue
        );
      }
      
      // إذا انتهى التحدي وتم إكماله
      if (completionStatus.completed && challenge.status === 'active') {
        await storage.updateChallengeStatus(challenge.id, 'completed');
        
        // إنشاء إشعار بإكمال التحدي
        await storage.createNotification({
          userId,
          type: 'challenge_completed',
          title: 'تهانينا! تم إكمال التحدي',
          message: `لقد أكملت "${challenge.title}" بنجاح. استمر في التقدم!`,
          data: JSON.stringify({
            challengeId: challenge.id,
            title: challenge.title
          })
        });
        
        // جلب التحدي بعد التحديث
        const updatedChallenge = await storage.getChallengeById(challenge.id);
        return res.status(200).json(updatedChallenge);
      }
      
      // تحديث التحدي إذا انتهت مدته ولم يتم إكماله
      const now = new Date();
      const endDate = new Date(challenge.endDate);
      
      if (endDate < now && challenge.status === 'active') {
        await storage.updateChallengeStatus(challenge.id, 'failed');
        
        // إنشاء إشعار بفشل التحدي
        await storage.createNotification({
          userId,
          type: 'challenge_failed',
          title: 'انتهى وقت التحدي',
          message: `انتهت مدة التحدي "${challenge.title}" دون إكماله. حاول مرة أخرى!`,
          data: JSON.stringify({
            challengeId: challenge.id,
            title: challenge.title
          })
        });
        
        // جلب التحدي بعد التحديث
        const updatedChallenge = await storage.getChallengeById(challenge.id);
        return res.status(200).json(updatedChallenge);
      }
      
      res.status(200).json({
        ...challenge,
        progress: completionStatus.progress,
        currentValue: completionStatus.currentValue
      });
    } catch (error: any) {
      console.error('Error fetching active challenge:', error);
      res.status(500).json({ error: error.message || 'حدث خطأ أثناء جلب التحدي النشط' });
    }
  });
  
  // الحصول على اقتراحات التحديات بناءً على بيانات المستخدم
  apiRouter.get("/challenges/suggestions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // التحقق مما إذا كان لدى المستخدم تحدي نشط بالفعل
      const activeChallenge = await storage.getActiveChallenge(userId);
      
      // تحليل بيانات المستخدم واقتراح تحديات
      const challengeCount = await analyzeUserDataForChallenges(userId);
      
      // الحصول على التحديات المقترحة
      const challenges = await storage.getChallenges(userId);
      const suggestedChallenges = challenges.filter(c => c.status === 'suggested');
      
      if (suggestedChallenges.length === 0) {
        return res.status(200).json([]);
      }
      
      return res.status(200).json(suggestedChallenges);
    } catch (error: any) {
      console.error('Error analyzing user data for challenges:', error);
      res.status(500).json({ error: error.message || 'حدث خطأ أثناء تحليل البيانات لاقتراح التحديات' });
    }
  });
  
  // بدء تحدي جديد
  apiRouter.post("/challenges/start", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // التحقق مما إذا كان لدى المستخدم تحدي نشط بالفعل
      const activeChallenge = await storage.getActiveChallenge(userId);
      if (activeChallenge) {
        return res.status(400).json({ 
          error: 'لديك تحدي نشط بالفعل. أكمله أو قم بإلغائه قبل بدء تحدٍ جديد',
          activeChallenge
        });
      }
      
      // المعلومات المطلوبة لبدء التحدي
      const { type, title, description, metadata, challengeId } = req.body;
      
      if (!type || !title || !description) {
        return res.status(400).json({ error: 'يجب توفير نوع التحدي وعنوانه ووصفه' });
      }
      
      // استخراج مدة التحدي من البيانات الوصفية
      let duration = 7; // المدة الافتراضية هي أسبوع
      
      try {
        const metadataObj = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
        duration = metadataObj.duration || 7;
      } catch (e) {
        // استخدام المدة الافتراضية إذا فشل تحليل البيانات الوصفية
      }
      
      // حساب تاريخ البدء والانتهاء
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + duration);
      
      // إنشاء التحدي جديد أو تحديث تحدي موجود من الاقتراحات
      let newChallenge;
      
      if (challengeId) {
        // التحقق من وجود التحدي وأنه من الاقتراحات
        const existingChallenge = await storage.getChallengeById(challengeId);
        
        if (existingChallenge && existingChallenge.userId === userId && existingChallenge.status === 'suggested') {
          // تحديث التحدي المقترح إلى نشط
          newChallenge = await storage.updateChallenge(challengeId, {
            status: 'active',
            startDate,
            endDate,
            progress: 0,
            currentValue: 0
          });
        } else {
          // إذا لم يتم العثور على التحدي، أو كان للمستخدم آخر، أو ليس في حالة "مقترح"
          return res.status(400).json({ error: 'التحدي المحدد غير متوفر أو غير مؤهل للبدء' });
        }
      } else {
        // إنشاء تحدي جديد
        newChallenge = await storage.createChallenge({
          userId,
          type,
          title,
          description,
          metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata),
          startDate,
          endDate,
          status: 'active',
          progress: 0,
          currentValue: 0
        });
      }
      
      // إنشاء إشعار ببدء التحدي
      await storage.createNotification({
        userId,
        type: 'challenge_started',
        title: 'تم بدء تحدي جديد',
        message: `لقد بدأت تحدي "${title}". استمر في المتابعة للتقدم!`,
        data: JSON.stringify({
          challengeId: newChallenge.id,
          title,
          endDate
        })
      });
      
      res.status(201).json(newChallenge);
    } catch (error: any) {
      console.error('Error starting challenge:', error);
      res.status(500).json({ error: error.message || 'حدث خطأ أثناء بدء التحدي' });
    }
  });
  
  // إلغاء تحدي
  apiRouter.put("/challenges/:id/cancel", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const challengeId = parseInt(req.params.id);
      
      // التحقق من وجود التحدي وملكيته
      const challenge = await storage.getChallengeById(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ error: 'التحدي غير موجود' });
      }
      
      if (challenge.userId !== userId) {
        return res.status(403).json({ error: 'غير مصرح لك بإلغاء هذا التحدي' });
      }
      
      // التحقق من أن التحدي نشط أو مقترح
      if (challenge.status !== 'active' && challenge.status !== 'suggested') {
        return res.status(400).json({ 
          error: `لا يمكن إلغاء أو تجاهل التحدي في حالة "${challenge.status}"`,
          status: challenge.status
        });
      }
      
      // تحديث حالة التحدي
      // في جميع الحالات (سواء كان مقترحًا أو نشطًا) نستخدم حالة "dismissed"
      const newStatus = 'dismissed';
      const updatedChallenge = await storage.updateChallengeStatus(challengeId, newStatus);
      
      // إنشاء إشعار مناسب (إلغاء أو تجاهل)
      if (challenge.status === 'suggested') {
        await storage.createNotification({
          userId,
          type: 'challenge_dismissed',
          title: 'تم تجاهل التحدي',
          message: `لقد قمت بتجاهل تحدي "${challenge.title}".`,
          data: JSON.stringify({
            challengeId,
            title: challenge.title
          })
        });
      } else {
        await storage.createNotification({
          userId,
          type: 'challenge_cancelled',
          title: 'تم إلغاء التحدي',
          message: `لقد قمت بإلغاء تحدي "${challenge.title}".`,
          data: JSON.stringify({
            challengeId,
            title: challenge.title
          })
        });
      }
      
      res.status(200).json(updatedChallenge);
    } catch (error: any) {
      console.error('Error cancelling challenge:', error);
      res.status(500).json({ error: error.message || 'حدث خطأ أثناء إلغاء التحدي' });
    }
  });
  
  // تحديث تقدم التحدي يدويًا
  apiRouter.put("/challenges/:id/update-progress", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const challengeId = parseInt(req.params.id);
      const { progress, currentValue } = req.body;
      
      // التحقق من وجود التحدي وملكيته
      const challenge = await storage.getChallengeById(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ error: 'التحدي غير موجود' });
      }
      
      if (challenge.userId !== userId) {
        return res.status(403).json({ error: 'غير مصرح لك بتحديث هذا التحدي' });
      }
      
      // التحقق من أن التحدي نشط
      if (challenge.status !== 'active') {
        return res.status(400).json({ 
          error: `لا يمكن تحديث التقدم في التحدي في حالة "${challenge.status}"`,
          status: challenge.status
        });
      }
      
      // تحديث تقدم التحدي
      let updatedChallenge;
      
      if (progress !== undefined && currentValue !== undefined) {
        updatedChallenge = await storage.updateChallengeProgress(challengeId, progress, currentValue);
      } else if (progress !== undefined) {
        updatedChallenge = await storage.updateChallengeProgress(challengeId, progress);
      } else {
        return res.status(400).json({ error: 'يجب توفير قيمة progress على الأقل' });
      }
      
      // تحديث حالة التحدي إذا اكتمل
      if (progress >= 100) {
        updatedChallenge = await storage.updateChallengeStatus(challengeId, 'completed');
        
        // إنشاء إشعار بإكمال التحدي
        await storage.createNotification({
          userId,
          type: 'challenge_completed',
          title: 'تهانينا! تم إكمال التحدي',
          message: `لقد أكملت "${challenge.title}" بنجاح. استمر في التقدم!`,
          data: JSON.stringify({
            challengeId,
            title: challenge.title
          })
        });
      }
      
      res.status(200).json(updatedChallenge);
    } catch (error: any) {
      console.error('Error updating challenge progress:', error);
      res.status(500).json({ error: error.message || 'حدث خطأ أثناء تحديث تقدم التحدي' });
    }
  });
  
  // Register the API router
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
