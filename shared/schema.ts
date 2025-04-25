import { pgTable, text, serial, integer, timestamp, real, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// إنشاء نوع مخصص للإشعارات
export const notificationTypeEnum = pgEnum('notification_type', [
  'spending_limit_warning', // تحذير عند تجاوز الحد المسموح للإنفاق
  'spending_limit_danger',  // خطر عند تجاوز الحد الخطر للإنفاق
  'luxury_spending',        // تحذير عند زيادة الإنفاق على الرفاهية
  'essential_decrease',     // إشعار عند انخفاض الإنفاق على الأساسيات
  'weekly_analysis',        // تحليل أسبوعي
  'expense_trend',          // اتجاه الإنفاق
  'challenge_suggestion',   // اقتراح تحدي جديد
  'challenge_started',      // تم بدء تحدي جديد
  'challenge_completed',    // تم إكمال التحدي بنجاح
  'challenge_failed',       // فشل في إكمال التحدي
  'challenge_cancelled'     // تم إلغاء التحدي
]);

// إنشاء أنواع مخصصة للتحديات
export const challengeTypeEnum = pgEnum('challenge_type', [
  'category_limit',     // تحديات الحد من الإنفاق على فئة معينة
  'importance_limit',   // تحديات الحد من الإنفاق حسب الأهمية
  'time_based',         // تحديات مرتبطة بالوقت (مثل عدم الإنفاق في عطلة نهاية الأسبوع)
  'spending_reduction', // تحديات تقليل الإنفاق العام
  'consistency'         // تحديات الانتظام في تسجيل المصاريف
  // تم إزالة نوع 'saving_goal' (تحديات الادخار) بناءً على المتطلبات
]);

// إنشاء حالات التحديات
export const challengeStatusEnum = pgEnum('challenge_status', [
  'suggested',  // تم اقتراح التحدي
  'active',     // التحدي نشط
  'completed',  // تم إكمال التحدي
  'failed',     // فشل في التحدي
  'dismissed'   // تم رفض التحدي
]);

// Users schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),  // البريد الإلكتروني هو المعرف الفريد الوحيد
  monthlySalary: real("monthly_salary").default(0),  // الراتب الشهري
  monthlyBudget: real("monthly_budget").default(0),  // الميزانية الشهرية
  fullName: text("full_name").default(""),  // الاسم الكامل للمستخدم
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  monthlySalary: true,
  monthlyBudget: true,
  fullName: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  expenses: many(expenses),
  savingsGoals: many(savingsGoals),
  notifications: many(notifications),
  challenges: many(challenges),
}));

// Expense Categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  icon: true,
  color: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Category relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  expenses: many(expenses),
}));

// Expenses
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  amount: real("amount").notNull(),
  categoryId: integer("category_id").notNull(),
  date: timestamp("date").notNull(),
  notes: text("notes"),
  userId: integer("user_id").notNull(),
  importance: text("importance").default("عادي"),
});

// Create a custom schema for expense inserts with date transformation
export const insertExpenseSchema = z.object({
  title: z.string(),
  amount: z.number(),
  categoryId: z.number(),
  date: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]),
  notes: z.string().optional(),
  userId: z.number(),
  importance: z.enum(["مهم", "عادي", "رفاهية"]).default("عادي"),
});

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

// Expense relations
export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [expenses.categoryId], 
    references: [categories.id],
  }),
}));

// Savings Goals
export const savingsGoals = pgTable("savings_goals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  targetAmount: real("target_amount").notNull(),
  currentAmount: real("current_amount").notNull().default(0),
  deadline: timestamp("deadline"),
  userId: integer("user_id").notNull(),
});

export const insertSavingsGoalSchema = createInsertSchema(savingsGoals).pick({
  title: true,
  targetAmount: true,
  currentAmount: true,
  deadline: true,
  userId: true,
});

export type InsertSavingsGoal = z.infer<typeof insertSavingsGoalSchema>;
export type SavingsGoal = typeof savingsGoals.$inferSelect;

// Savings Goal relations
export const savingsGoalsRelations = relations(savingsGoals, ({ one, many }) => ({
  user: one(users, {
    fields: [savingsGoals.userId],
    references: [users.id],
  }),
  subGoals: many(subGoals),
}));

// Sub-goals or challenges
export const subGoals = pgTable("sub_goals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  progress: real("progress").notNull().default(0),
  goalId: integer("goal_id").notNull(),
  completed: integer("completed").notNull().default(0),
});

export const insertSubGoalSchema = createInsertSchema(subGoals).pick({
  title: true,
  progress: true,
  goalId: true,
  completed: true,
});

export type InsertSubGoal = z.infer<typeof insertSubGoalSchema>;
export type SubGoal = typeof subGoals.$inferSelect;

// Sub-goals relations
export const subGoalsRelations = relations(subGoals, ({ one }) => ({
  savingsGoal: one(savingsGoals, {
    fields: [subGoals.goalId],
    references: [savingsGoals.id],
  }),
}));

// إشعارات النظام
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // المستخدم الذي يتعلق به الإشعار
  type: text("type").notNull(), // نوع الإشعار
  title: text("title").notNull(), // عنوان الإشعار
  message: text("message").notNull(), // محتوى الإشعار
  createdAt: timestamp("created_at").defaultNow().notNull(), // تاريخ إنشاء الإشعار
  isRead: boolean("is_read").default(false).notNull(), // هل تم قراءة الإشعار؟
  data: text("data"), // بيانات إضافية متعلقة بالإشعار (بتنسيق JSON)
});

export const insertNotificationSchema = z.object({
  userId: z.number(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  data: z.string().optional()
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// علاقات الإشعارات
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// جدول التحديات
export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // المستخدم المتعلق بالتحدي
  title: text("title").notNull(), // عنوان التحدي
  description: text("description").notNull(), // وصف التحدي
  type: challengeTypeEnum("type").notNull(), // نوع التحدي
  status: challengeStatusEnum("status").default("suggested").notNull(), // حالة التحدي
  startDate: timestamp("start_date").defaultNow().notNull(), // تاريخ بدء التحدي
  endDate: timestamp("end_date").notNull(), // تاريخ انتهاء التحدي
  progress: real("progress").default(0).notNull(), // نسبة التقدم (0-100)
  targetValue: real("target_value"), // قيمة الهدف (على سبيل المثال: مبلغ الادخار)
  currentValue: real("current_value").default(0), // القيمة الحالية
  createdAt: timestamp("created_at").defaultNow().notNull(), // تاريخ إنشاء التحدي
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // تاريخ آخر تحديث للتحدي
  metadata: text("metadata"), // بيانات إضافية بتنسيق JSON (مثل معرف الفئة، أو أيام الأسبوع)
});

export const insertChallengeSchema = z.object({
  userId: z.number(),
  title: z.string(),
  description: z.string(),
  type: z.enum(['category_limit', 'importance_limit', 'time_based', 'spending_reduction', 'consistency']),
  status: z.enum(['suggested', 'active', 'completed', 'failed', 'dismissed']).default('active'),
  startDate: z.union([z.date(), z.string().transform(str => new Date(str))]).default(() => new Date()),
  endDate: z.union([z.date(), z.string().transform(str => new Date(str))]),
  progress: z.number().default(0),
  targetValue: z.number().optional(),
  currentValue: z.number().default(0),
  metadata: z.string().optional(),
});

export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Challenge = typeof challenges.$inferSelect;

// علاقات التحديات
export const challengesRelations = relations(challenges, ({ one }) => ({
  user: one(users, {
    fields: [challenges.userId],
    references: [users.id],
  }),
}));
