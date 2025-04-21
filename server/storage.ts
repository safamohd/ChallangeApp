import { 
  users, type User, type InsertUser,
  categories, type Category, type InsertCategory,
  expenses, type Expense, type InsertExpense,
  savingsGoals, type SavingsGoal, type InsertSavingsGoal,
  subGoals, type SubGoal, type InsertSubGoal
} from "@shared/schema";
// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserSalary(id: number, monthlySalary: number): Promise<User>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Expense operations
  getExpenses(userId: number): Promise<Expense[]>;
  getExpensesByMonth(userId: number, month: number, year: number): Promise<Expense[]>;
  getExpenseById(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense>;
  deleteExpense(id: number): Promise<boolean>;
  
  // Savings goal operations
  getSavingsGoals(userId: number): Promise<SavingsGoal[]>;
  getSavingsGoalById(id: number): Promise<SavingsGoal | undefined>;
  createSavingsGoal(goal: InsertSavingsGoal): Promise<SavingsGoal>;
  updateSavingsGoal(id: number, goal: Partial<InsertSavingsGoal>): Promise<SavingsGoal>;
  
  // Sub-goal operations
  getSubGoalsByGoalId(goalId: number): Promise<SubGoal[]>;
  createSubGoal(subGoal: InsertSubGoal): Promise<SubGoal>;
  updateSubGoal(id: number, subGoal: Partial<InsertSubGoal>): Promise<SubGoal>;
}

import { db } from "./db";
import { desc, eq, and, sql } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUserSalary(id: number, monthlySalary: number): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set({ monthlySalary })
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with id ${id} not found`);
    }
    
    return updatedUser;
  }
  
  // Category operations
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }
  
  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }
  
  // Expense operations
  async getExpenses(userId: number): Promise<Expense[]> {
    return db.select()
      .from(expenses)
      .where(eq(expenses.userId, userId))
      .orderBy(desc(expenses.date), desc(expenses.id)); // Sort by date and id descending (newest first)
  }
  
  async getExpensesByMonth(userId: number, month: number, year: number): Promise<Expense[]> {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);
    
    return db.select()
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          sql`${expenses.date} >= ${startDate} AND ${expenses.date} <= ${endDate}`
        )
      )
      .orderBy(desc(expenses.date), desc(expenses.id)); // Sort by date and id descending
  }
  
  async getExpenseById(id: number): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense || undefined;
  }
  
  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const [expense] = await db.insert(expenses).values(insertExpense).returning();
    return expense;
  }
  
  async updateExpense(id: number, expenseUpdate: Partial<InsertExpense>): Promise<Expense> {
    const [updatedExpense] = await db.update(expenses)
      .set(expenseUpdate)
      .where(eq(expenses.id, id))
      .returning();
    
    if (!updatedExpense) {
      throw new Error(`Expense with id ${id} not found`);
    }
    
    return updatedExpense;
  }
  
  async deleteExpense(id: number): Promise<boolean> {
    await db.delete(expenses).where(eq(expenses.id, id));
    // Check if the expense still exists after deletion
    const expense = await this.getExpenseById(id);
    return expense === undefined;
  }
  
  // Savings goal operations
  async getSavingsGoals(userId: number): Promise<SavingsGoal[]> {
    return db.select()
      .from(savingsGoals)
      .where(eq(savingsGoals.userId, userId));
  }
  
  async getSavingsGoalById(id: number): Promise<SavingsGoal | undefined> {
    const [goal] = await db.select().from(savingsGoals).where(eq(savingsGoals.id, id));
    return goal || undefined;
  }
  
  async createSavingsGoal(insertGoal: InsertSavingsGoal): Promise<SavingsGoal> {
    const [goal] = await db.insert(savingsGoals).values(insertGoal).returning();
    return goal;
  }
  
  async updateSavingsGoal(id: number, goalUpdate: Partial<InsertSavingsGoal>): Promise<SavingsGoal> {
    const [updatedGoal] = await db.update(savingsGoals)
      .set(goalUpdate)
      .where(eq(savingsGoals.id, id))
      .returning();
    
    if (!updatedGoal) {
      throw new Error(`Savings goal with id ${id} not found`);
    }
    
    return updatedGoal;
  }
  
  // Sub-goal operations
  async getSubGoalsByGoalId(goalId: number): Promise<SubGoal[]> {
    return db.select()
      .from(subGoals)
      .where(eq(subGoals.goalId, goalId));
  }
  
  async createSubGoal(insertSubGoal: InsertSubGoal): Promise<SubGoal> {
    const [subGoal] = await db.insert(subGoals).values(insertSubGoal).returning();
    return subGoal;
  }
  
  async updateSubGoal(id: number, subGoalUpdate: Partial<InsertSubGoal>): Promise<SubGoal> {
    const [updatedSubGoal] = await db.update(subGoals)
      .set(subGoalUpdate)
      .where(eq(subGoals.id, id))
      .returning();
    
    if (!updatedSubGoal) {
      throw new Error(`Sub-goal with id ${id} not found`);
    }
    
    return updatedSubGoal;
  }

  // Seed database with initial data
  async seedInitialData() {
    // Check if we already have categories (to avoid duplicate seeding)
    const existingCategories = await this.getCategories();
    if (existingCategories.length === 0) {
      // Initialize with default categories
      const defaultCategories: InsertCategory[] = [
        { name: "مطاعم", icon: "utensils", color: "#10b981" },
        { name: "تسوق", icon: "shopping-bag", color: "#3b82f6" },
        { name: "مواصلات", icon: "car", color: "#f59e0b" },
        { name: "ترفيه", icon: "film", color: "#ef4444" },
        { name: "أساسيات", icon: "home", color: "#06b6d4" },
        { name: "أخرى", icon: "ellipsis-h", color: "#8b5cf6" }
      ];
      
      for (const category of defaultCategories) {
        await this.createCategory(category);
      }
      
      // Create a default user
      const user = await this.createUser({ 
        username: "demo", 
        password: "password",
        monthlySalary: 10000 // Default monthly salary
      });
      
      // Create a default savings goal
      const goal = await this.createSavingsGoal({
        title: "هدف توفير العطلة",
        targetAmount: 20000,
        currentAmount: 6000,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        userId: user.id
      });
      
      // Create default sub-goals
      await this.createSubGoal({ title: "توفير ٥٠٠ ر.س هذا الأسبوع", progress: 100, goalId: goal.id, completed: 1 });
      await this.createSubGoal({ title: "خفض مصاريف المطاعم بنسبة ٢٠٪", progress: 60, goalId: goal.id, completed: 0 });
      
      // Create some sample expenses
      const currentDate = new Date();
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();
      
      const sampleExpenses: InsertExpense[] = [
        {
          title: "مطعم البيت السعودي",
          amount: 150,
          categoryId: 1,
          date: new Date(year, month, 25),
          notes: "",
          userId: user.id,
          importance: "رفاهية"
        },
        {
          title: "سوق المملكة",
          amount: 230,
          categoryId: 2,
          date: new Date(year, month, 23),
          notes: "",
          userId: user.id,
          importance: "عادي"
        },
        {
          title: "محطة وقود الرياض",
          amount: 180,
          categoryId: 3,
          date: new Date(year, month, 20),
          notes: "",
          userId: user.id,
          importance: "مهم"
        },
        {
          title: "سينما مول الرياض",
          amount: 120,
          categoryId: 4,
          date: new Date(year, month, 18),
          notes: "",
          userId: user.id,
          importance: "رفاهية"
        },
        {
          title: "مصاريف متنوعة",
          amount: 340,
          categoryId: 5,
          date: new Date(year, month, 15),
          notes: "",
          userId: user.id,
          importance: "عادي"
        },
        {
          title: "مطعم شاورما",
          amount: 90,
          categoryId: 1,
          date: new Date(year, month, 12),
          notes: "",
          userId: user.id,
          importance: "رفاهية"
        },
        {
          title: "ملابس",
          amount: 490,
          categoryId: 2,
          date: new Date(year, month, 10),
          notes: "",
          userId: user.id,
          importance: "عادي"
        },
        {
          title: "أوبر",
          amount: 75,
          categoryId: 3,
          date: new Date(year, month, 8),
          notes: "",
          userId: user.id,
          importance: "مهم"
        },
        {
          title: "اشتراك نتفلكس",
          amount: 45,
          categoryId: 4,
          date: new Date(year, month, 5),
          notes: "",
          userId: user.id,
          importance: "رفاهية"
        },
        {
          title: "صيانة",
          amount: 210,
          categoryId: 5,
          date: new Date(year, month, 3),
          notes: "",
          userId: user.id,
          importance: "مهم"
        }
      ];
      
      for (const expense of sampleExpenses) {
        await this.createExpense(expense);
      }
    }
  }
}

// Create and initialize database storage
export const storage = new DatabaseStorage();

// Seed initial data (will be executed when the server starts)
storage.seedInitialData().catch(error => {
  console.error("Error seeding initial data:", error);
});
