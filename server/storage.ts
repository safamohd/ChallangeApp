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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private expenses: Map<number, Expense>;
  private savingsGoals: Map<number, SavingsGoal>;
  private subGoals: Map<number, SubGoal>;
  
  private userId: number;
  private categoryId: number;
  private expenseId: number;
  private goalId: number;
  private subGoalId: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.expenses = new Map();
    this.savingsGoals = new Map();
    this.subGoals = new Map();
    
    this.userId = 1;
    this.categoryId = 1;
    this.expenseId = 1;
    this.goalId = 1;
    this.subGoalId = 1;
    
    // Initialize with default categories
    const defaultCategories: InsertCategory[] = [
      { name: "مطاعم", icon: "utensils", color: "#10b981" },
      { name: "تسوق", icon: "shopping-bag", color: "#3b82f6" },
      { name: "مواصلات", icon: "car", color: "#f59e0b" },
      { name: "ترفيه", icon: "film", color: "#ef4444" },
      { name: "أخرى", icon: "ellipsis-h", color: "#8b5cf6" }
    ];
    
    defaultCategories.forEach(category => this.createCategory(category));
    
    // Create a default user
    this.createUser({ username: "demo", password: "password" });
    
    // Create a default savings goal
    this.createSavingsGoal({
      title: "هدف توفير العطلة",
      targetAmount: 20000,
      currentAmount: 6000,
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      userId: 1
    });
    
    // Create default sub-goals
    this.createSubGoal({ title: "توفير ٥٠٠ ر.س هذا الأسبوع", progress: 100, goalId: 1, completed: 1 });
    this.createSubGoal({ title: "خفض مصاريف المطاعم بنسبة ٢٠٪", progress: 60, goalId: 1, completed: 0 });
    
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
        userId: 1
      },
      {
        title: "سوق المملكة",
        amount: 230,
        categoryId: 2,
        date: new Date(year, month, 23),
        notes: "",
        userId: 1
      },
      {
        title: "محطة وقود الرياض",
        amount: 180,
        categoryId: 3,
        date: new Date(year, month, 20),
        notes: "",
        userId: 1
      },
      {
        title: "سينما مول الرياض",
        amount: 120,
        categoryId: 4,
        date: new Date(year, month, 18),
        notes: "",
        userId: 1
      },
      {
        title: "مصاريف متنوعة",
        amount: 340,
        categoryId: 5,
        date: new Date(year, month, 15),
        notes: "",
        userId: 1
      },
      {
        title: "مطعم شاورما",
        amount: 90,
        categoryId: 1,
        date: new Date(year, month, 12),
        notes: "",
        userId: 1
      },
      {
        title: "ملابس",
        amount: 490,
        categoryId: 2,
        date: new Date(year, month, 10),
        notes: "",
        userId: 1
      },
      {
        title: "أوبر",
        amount: 75,
        categoryId: 3,
        date: new Date(year, month, 8),
        notes: "",
        userId: 1
      },
      {
        title: "اشتراك نتفلكس",
        amount: 45,
        categoryId: 4,
        date: new Date(year, month, 5),
        notes: "",
        userId: 1
      },
      {
        title: "صيانة",
        amount: 210,
        categoryId: 5,
        date: new Date(year, month, 3),
        notes: "",
        userId: 1
      }
    ];
    
    sampleExpenses.forEach(expense => this.createExpense(expense));
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Category operations
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryId++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }
  
  // Expense operations
  async getExpenses(userId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values())
      .filter(expense => expense.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async getExpensesByMonth(userId: number, month: number, year: number): Promise<Expense[]> {
    return Array.from(this.expenses.values())
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expense.userId === userId && 
               expenseDate.getMonth() === month && 
               expenseDate.getFullYear() === year;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async getExpenseById(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }
  
  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = this.expenseId++;
    const expense: Expense = { ...insertExpense, id };
    this.expenses.set(id, expense);
    return expense;
  }
  
  async updateExpense(id: number, expenseUpdate: Partial<InsertExpense>): Promise<Expense> {
    const expense = this.expenses.get(id);
    if (!expense) {
      throw new Error(`Expense with id ${id} not found`);
    }
    
    const updatedExpense = { ...expense, ...expenseUpdate };
    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }
  
  async deleteExpense(id: number): Promise<boolean> {
    return this.expenses.delete(id);
  }
  
  // Savings goal operations
  async getSavingsGoals(userId: number): Promise<SavingsGoal[]> {
    return Array.from(this.savingsGoals.values())
      .filter(goal => goal.userId === userId);
  }
  
  async getSavingsGoalById(id: number): Promise<SavingsGoal | undefined> {
    return this.savingsGoals.get(id);
  }
  
  async createSavingsGoal(insertGoal: InsertSavingsGoal): Promise<SavingsGoal> {
    const id = this.goalId++;
    const goal: SavingsGoal = { ...insertGoal, id };
    this.savingsGoals.set(id, goal);
    return goal;
  }
  
  async updateSavingsGoal(id: number, goalUpdate: Partial<InsertSavingsGoal>): Promise<SavingsGoal> {
    const goal = this.savingsGoals.get(id);
    if (!goal) {
      throw new Error(`Savings goal with id ${id} not found`);
    }
    
    const updatedGoal = { ...goal, ...goalUpdate };
    this.savingsGoals.set(id, updatedGoal);
    return updatedGoal;
  }
  
  // Sub-goal operations
  async getSubGoalsByGoalId(goalId: number): Promise<SubGoal[]> {
    return Array.from(this.subGoals.values())
      .filter(subGoal => subGoal.goalId === goalId);
  }
  
  async createSubGoal(insertSubGoal: InsertSubGoal): Promise<SubGoal> {
    const id = this.subGoalId++;
    const subGoal: SubGoal = { ...insertSubGoal, id };
    this.subGoals.set(id, subGoal);
    return subGoal;
  }
  
  async updateSubGoal(id: number, subGoalUpdate: Partial<InsertSubGoal>): Promise<SubGoal> {
    const subGoal = this.subGoals.get(id);
    if (!subGoal) {
      throw new Error(`Sub-goal with id ${id} not found`);
    }
    
    const updatedSubGoal = { ...subGoal, ...subGoalUpdate };
    this.subGoals.set(id, updatedSubGoal);
    return updatedSubGoal;
  }
}

export const storage = new MemStorage();
