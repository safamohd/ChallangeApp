import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertExpenseSchema, insertSavingsGoalSchema, insertSubGoalSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api
  const apiRouter = express.Router();
  
  // User API
  apiRouter.get("/user", async (_req: Request, res: Response) => {
    try {
      // For now, we'll use a mock user with ID 1 for demonstration
      const user = await storage.getUser(1);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      // Don't send the password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "فشل في جلب بيانات المستخدم" });
    }
  });

  // PUT /api/user/salary - Update user's monthly salary
  apiRouter.put("/user/salary", async (req: Request, res: Response) => {
    const { monthlySalary } = req.body;
    
    if (!monthlySalary || monthlySalary <= 0) {
      return res.status(400).json({ message: "يجب أن يكون الراتب الشهري رقمًا موجبًا" });
    }
    
    try {
      // For now, we'll use a mock user with ID 1 for demonstration
      const userId = 1;
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
  apiRouter.get("/categories", async (_req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "فشل في جلب الفئات" });
    }
  });
  
  // Add new category
  apiRouter.post("/categories", async (req: Request, res: Response) => {
    try {
      const newCategory = await storage.createCategory(req.body);
      res.status(201).json(newCategory);
    } catch (error) {
      console.error("Error adding category:", error);
      res.status(500).json({ message: "فشل في إضافة الفئة" });
    }
  });
  
  // Expenses API
  apiRouter.get("/expenses", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Using fixed user ID for now
      
      // Query parameters for filtering by month and year
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      
      let expenses;
      if (month !== undefined && year !== undefined) {
        expenses = await storage.getExpensesByMonth(userId, month, year);
      } else {
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
  
  apiRouter.post("/expenses", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Using fixed user ID for now
      
      // Add userId to the request body
      const expenseData = { ...req.body, userId };
      
      // Log the request body for debugging
      console.log("Expense data received:", JSON.stringify(expenseData));
      
      // Validate the request body
      const validatedData = insertExpenseSchema.parse(expenseData);
      
      // Log the validated data
      console.log("Validated expense data:", JSON.stringify(validatedData));
      
      const newExpense = await storage.createExpense(validatedData);
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
  
  apiRouter.put("/expenses/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the existing expense to verify it exists and belongs to the user
      const existingExpense = await storage.getExpenseById(id);
      if (!existingExpense) {
        return res.status(404).json({ message: "المصروف غير موجود" });
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
  
  apiRouter.delete("/expenses/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the existing expense to verify it exists and belongs to the user
      const existingExpense = await storage.getExpenseById(id);
      if (!existingExpense) {
        return res.status(404).json({ message: "المصروف غير موجود" });
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
  apiRouter.get("/expenses/summary", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Using fixed user ID for now
      
      // Query parameters for filtering by month and year
      const month = req.query.month !== undefined 
        ? parseInt(req.query.month as string) 
        : new Date().getMonth();
      const year = req.query.year !== undefined 
        ? parseInt(req.query.year as string) 
        : new Date().getFullYear();
      
      const expenses = await storage.getExpensesByMonth(userId, month, year);
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
  apiRouter.get("/savings-goals", async (_req: Request, res: Response) => {
    try {
      const userId = 1; // Using fixed user ID for now
      const goals = await storage.getSavingsGoals(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "فشل في جلب أهداف التوفير" });
    }
  });
  
  apiRouter.get("/savings-goals/:id", async (req: Request, res: Response) => {
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
  
  apiRouter.post("/savings-goals", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Using fixed user ID for now
      
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
  
  apiRouter.put("/savings-goals/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the existing goal to verify it exists and belongs to the user
      const existingGoal = await storage.getSavingsGoalById(id);
      if (!existingGoal) {
        return res.status(404).json({ message: "هدف التوفير غير موجود" });
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
  apiRouter.post("/sub-goals", async (req: Request, res: Response) => {
    try {
      // Validate the request body
      const validatedData = insertSubGoalSchema.parse(req.body);
      
      // Verify the parent goal exists
      const parentGoal = await storage.getSavingsGoalById(validatedData.goalId);
      if (!parentGoal) {
        return res.status(404).json({ message: "هدف التوفير الرئيسي غير موجود" });
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
  
  apiRouter.put("/sub-goals/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
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
  
  // Register the API router
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
