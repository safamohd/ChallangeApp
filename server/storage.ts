import { 
  users, type User, type InsertUser,
  categories, type Category, type InsertCategory,
  expenses, type Expense, type InsertExpense,
  savingsGoals, type SavingsGoal, type InsertSavingsGoal,
  subGoals, type SubGoal, type InsertSubGoal,
  notifications, type Notification, type InsertNotification,
  challenges, type Challenge, type InsertChallenge
} from "@shared/schema";
// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserSalary(id: number, monthlySalary: number): Promise<User>;
  updateUserProfile(id: number, profileData: { fullName?: string; monthlyBudget?: number }): Promise<User>;
  
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
  getSubGoalById(id: number): Promise<SubGoal | undefined>;
  createSubGoal(subGoal: InsertSubGoal): Promise<SubGoal>;
  updateSubGoal(id: number, subGoal: Partial<InsertSubGoal>): Promise<SubGoal>;

  // Notification operations
  getNotifications(userId: number): Promise<Notification[]>;
  getNotificationById(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  countUnreadNotifications(userId: number): Promise<number>;
  
  // Challenge operations
  getChallenges(userId: number): Promise<Challenge[]>;
  getActiveChallenge(userId: number): Promise<Challenge | undefined>;
  getChallengeById(id: number): Promise<Challenge | undefined>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  updateChallenge(id: number, challenge: Partial<InsertChallenge>): Promise<Challenge>;
  updateChallengeStatus(id: number, status: 'active' | 'completed' | 'failed' | 'dismissed'): Promise<Challenge>;
  updateChallengeProgress(id: number, progress: number, currentValue?: number): Promise<Challenge>;
}

import { db } from "./db";
import { desc, eq, and, sql, or } from "drizzle-orm";

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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
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
  
  async updateUserProfile(id: number, profileData: { fullName?: string; monthlyBudget?: number }): Promise<User> {
    // تحقق من وجود المستخدم قبل التحديث
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const [updatedUser] = await db.update(users)
      .set(profileData)
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`Failed to update user profile for id ${id}`);
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
  
  async getSubGoalById(id: number): Promise<SubGoal | undefined> {
    const [subGoal] = await db.select().from(subGoals).where(eq(subGoals.id, id));
    return subGoal || undefined;
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

  // Notification operations
  async getNotifications(userId: number): Promise<Notification[]> {
    return db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt)); // أحدث الإشعارات أولاً
  }

  async getNotificationById(id: number): Promise<Notification | undefined> {
    const [notification] = await db.select()
      .from(notifications)
      .where(eq(notifications.id, id));
    return notification || undefined;
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    try {
      const [notification] = await db.insert(notifications)
        .values(insertNotification)
        .returning();
      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      // إنشاء كائن إشعار بسيط حتى لا يتوقف البرنامج إذا فشل إنشاء الإشعار
      return {
        id: -1,
        userId: insertNotification.userId,
        type: insertNotification.type,
        title: insertNotification.title,
        message: insertNotification.message,
        createdAt: new Date(),
        isRead: false,
        data: insertNotification.data || null
      };
    }
  }

  async markNotificationAsRead(id: number): Promise<Notification> {
    const [updatedNotification] = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    
    if (!updatedNotification) {
      throw new Error(`Notification with id ${id} not found`);
    }
    
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async countUnreadNotifications(userId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    
    return result[0]?.count || 0;
  }
  
  // Challenge operations
  
  async getChallenges(userId: number): Promise<Challenge[]> {
    return db.select()
      .from(challenges)
      .where(eq(challenges.userId, userId))
      .orderBy(desc(challenges.createdAt));
  }
  
  async getActiveChallenge(userId: number): Promise<Challenge | undefined> {
    const [challenge] = await db.select()
      .from(challenges)
      .where(and(
        eq(challenges.userId, userId),
        eq(challenges.status, 'active')
      ));
    
    return challenge || undefined;
  }
  
  async getChallengeById(id: number): Promise<Challenge | undefined> {
    const [challenge] = await db.select()
      .from(challenges)
      .where(eq(challenges.id, id));
    
    return challenge || undefined;
  }
  
  async createChallenge(insertChallenge: InsertChallenge): Promise<Challenge> {
    try {
      // We need to adapt the data to match the expected types in the database
      const sql = `
        INSERT INTO challenges (
          user_id, title, description, type, status, 
          start_date, end_date, progress, target_value, 
          current_value, metadata
        ) 
        VALUES (
          $1, $2, $3, $4::challenge_type, $5::challenge_status, 
          $6, $7, $8, $9, 
          $10, $11
        )
        RETURNING *
      `;
      
      const result = await db.execute(sql, [
        insertChallenge.userId,
        insertChallenge.title,
        insertChallenge.description,
        insertChallenge.type,
        insertChallenge.status || 'active',
        insertChallenge.startDate,
        insertChallenge.endDate,
        insertChallenge.progress || 0,
        insertChallenge.targetValue || null,
        insertChallenge.currentValue || 0,
        insertChallenge.metadata || null
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error("Error creating challenge:", error);
      throw new Error("Failed to create challenge");
    }
  }
  
  async updateChallenge(id: number, challengeUpdate: Partial<InsertChallenge>): Promise<Challenge> {
    // تحديث تاريخ آخر تعديل للتحدي
    const updatedData = {
      ...challengeUpdate,
      updatedAt: new Date()
    };
    
    const [updatedChallenge] = await db.update(challenges)
      .set(updatedData)
      .where(eq(challenges.id, id))
      .returning();
    
    if (!updatedChallenge) {
      throw new Error(`Challenge with id ${id} not found`);
    }
    
    return updatedChallenge;
  }
  
  async updateChallengeStatus(id: number, status: 'active' | 'completed' | 'failed' | 'dismissed'): Promise<Challenge> {
    try {
      const sql = `
        UPDATE challenges
        SET status = $1::challenge_status, updated_at = $2
        WHERE id = $3
        RETURNING *
      `;
      
      const result = await db.execute(sql, [
        status,
        new Date(),
        id
      ]);
      
      if (result.rows.length === 0) {
        throw new Error(`Challenge with id ${id} not found`);
      }
      
      return result.rows[0];
    } catch (error) {
      console.error("Error updating challenge status:", error);
      throw new Error(`Failed to update challenge status: ${error.message}`);
    }
  }
  
  async updateChallengeProgress(id: number, progress: number, currentValue?: number): Promise<Challenge> {
    try {
      let sql;
      let params;
      
      if (currentValue !== undefined) {
        sql = `
          UPDATE challenges
          SET progress = $1, current_value = $2, updated_at = $3
          WHERE id = $4
          RETURNING *
        `;
        params = [progress, currentValue, new Date(), id];
      } else {
        sql = `
          UPDATE challenges
          SET progress = $1, updated_at = $2
          WHERE id = $3
          RETURNING *
        `;
        params = [progress, new Date(), id];
      }
      
      const result = await db.execute(sql, params);
      
      if (result.rows.length === 0) {
        throw new Error(`Challenge with id ${id} not found`);
      }
      
      return result.rows[0];
    } catch (error) {
      console.error("Error updating challenge progress:", error);
      throw new Error(`Failed to update challenge progress: ${error.message}`);
    }
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
        email: "demo@example.com", // إضافة البريد الإلكتروني
        monthlySalary: 10000, // الراتب الشهري الافتراضي
        fullName: "مستخدم تجريبي", // اسم المستخدم الكامل الافتراضي
        monthlyBudget: 8000 // الميزانية الشهرية الافتراضية
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
