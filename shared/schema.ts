import { pgTable, text, serial, integer, timestamp, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  monthlySalary: real("monthly_salary").default(5000),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  monthlySalary: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  expenses: many(expenses),
  savingsGoals: many(savingsGoals),
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
