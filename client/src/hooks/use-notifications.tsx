import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { 
  useQuery, 
  useMutation, 
  QueryClient, 
  useQueryClient
} from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "./use-auth";

// أنواع الإشعارات
export type NotificationType = 
  | 'spending_limit_warning'
  | 'spending_limit_danger'
  | 'luxury_spending'
  | 'essential_decrease'
  | 'weekly_analysis'
  | 'expense_trend';

// نموذج الإشعار
export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  data?: string;
}

// واجهة سياق الإشعارات
interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: Error | null;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: number) => void;
}

// إنشاء السياق
const NotificationsContext = createContext<NotificationsContextType | null>(null);

// مزود السياق
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // استعلامات البيانات
  const { 
    data: notifications = [], 
    error, 
    isLoading 
  } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      if (!user) return [];
      const response = await apiRequest('GET', '/api/notifications');
      return await response.json();
    },
    enabled: !!user, // تفعيل الاستعلام فقط إذا كان المستخدم مسجل الدخول
    refetchInterval: 60000, // تحديث كل دقيقة
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 30000, // اعتبار البيانات قديمة بعد 30 ثانية
  });
  
  // استعلام عدد الإشعارات غير المقروءة
  const { 
    data: unreadCountData = { count: 0 }
  } = useQuery({
    queryKey: ['/api/notifications/unread-count'],
    queryFn: async () => {
      if (!user) return { count: 0 };
      const response = await apiRequest('GET', '/api/notifications/unread-count');
      return await response.json();
    },
    enabled: !!user,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 30000,
  });
  
  // وضع علامة "مقروء" على إشعار محدد
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PUT', `/api/notifications/${id}/read`);
      return await response.json();
    },
    onSuccess: () => {
      // إعادة تحميل بيانات الإشعارات وعدد الإشعارات غير المقروءة
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // وضع علامة "مقروء" على جميع الإشعارات
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PUT', '/api/notifications/mark-all-read');
      return await response.json();
    },
    onSuccess: () => {
      // إعادة تحميل بيانات الإشعارات وعدد الإشعارات غير المقروءة
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      
      toast({
        title: "تم تحديث الإشعارات",
        description: "تم وضع علامة مقروء على جميع الإشعارات",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // دوال مساعدة
  const markAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };
  
  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount: unreadCountData.count,
        isLoading,
        error,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

// Hook لاستخدام سياق الإشعارات
export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}