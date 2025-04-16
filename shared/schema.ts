import { pgTable, text, serial, integer, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

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

// Expenses
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  amount: real("amount").notNull(),
  categoryId: integer("category_id").notNull(),
  date: timestamp("date").notNull(),
  notes: text("notes"),
  userId: integer("user_id").notNull(),
});

export const insertExpenseSchema = createInsertSchema(expenses).pick({
  title: true,
  amount: true,
  categoryId: true,
  date: true,
  notes: true,
  userId: true,
});

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

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
