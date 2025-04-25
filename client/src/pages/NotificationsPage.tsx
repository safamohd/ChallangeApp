import { useNotifications } from "@/hooks/use-notifications";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistance } from "date-fns";
import { ar } from "date-fns/locale";
import { Bell, CheckCircle2, Loader2, Trash2 } from "lucide-react";

export default function NotificationsPage() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, dismissNotification } = useNotifications();

  // تصنيف الإشعارات حسب النوع
  const getNotificationTypeName = (type: string): string => {
    switch (type) {
      case 'spending_limit_warning':
        return "تحذير حد الإنفاق";
      case 'spending_limit_danger':
        return "تجاوز الميزانية";
      case 'luxury_spending':
        return "إنفاق الرفاهيات";
      case 'essential_decrease':
        return "إنفاق الأساسيات";
      case 'weekly_analysis':
        return "تحليل أسبوعي";
      case 'expense_trend':
        return "اتجاه الإنفاق";
      case 'challenge_started':
        return "بدء تحدي";
      case 'challenge_completed':
        return "إكمال تحدي";
      case 'challenge_failed':
        return "فشل تحدي";
      case 'challenge_cancelled':
        return "إلغاء تحدي";
      case 'challenge_suggested':
        return "اقتراح تحدي";
      default:
        return "إشعار";
    }
  };

  // لون الإشعار حسب النوع
  const getNotificationColor = (type: string): string => {
    switch (type) {
      case 'spending_limit_warning':
        return "#F59E0B"; // أصفر/برتقالي
      case 'spending_limit_danger':
        return "#EF4444"; // أحمر
      case 'luxury_spending':
        return "#8B5CF6"; // بنفسجي
      case 'essential_decrease':
        return "#10B981"; // أخضر
      case 'weekly_analysis':
        return "#3B82F6"; // أزرق
      case 'expense_trend':
        return "#EC4899"; // وردي
      case 'challenge_started':
        return "#3B82F6"; // أزرق
      case 'challenge_completed':
        return "#10B981"; // أخضر
      case 'challenge_failed':
        return "#EF4444"; // أحمر
      case 'challenge_cancelled':
        return "#6B7280"; // رمادي
      case 'challenge_suggested':
        return "#8B5CF6"; // بنفسجي
      default:
        return "#6B7280"; // رمادي
    }
  };

  // رمز الإشعار حسب النوع
  const getIconByType = (type: string) => {
    switch (type) {
      case 'spending_limit_warning':
        return "⚠️";
      case 'spending_limit_danger':
        return "🚨";
      case 'luxury_spending':
        return "💎";
      case 'essential_decrease':
        return "🛒";
      case 'weekly_analysis':
        return "📊";
      case 'expense_trend':
        return "📈";
      case 'challenge_started':
      case 'challenge_completed':
      case 'challenge_failed':
      case 'challenge_cancelled':
      case 'challenge_suggested':
        return "🏆";
      default:
        return "📣";
    }
  };

  // حساب الوقت المنقضي منذ إنشاء الإشعار
  const formatCreatedAt = (createdAt: string): string => {
    return formatDistance(
      new Date(createdAt),
      new Date(),
      { addSuffix: true, locale: ar }
    );
  };

  // التحقق مما إذا كان الإشعار متعلق بالتحديات
  const isChallengeNotification = (type: string): boolean => {
    return type.includes('challenge');
  };

  // عرض البيانات الإضافية للإشعار
  const renderAdditionalData = (data: string, type: string) => {
    try {
      const parsedData = JSON.parse(data) as Record<string, unknown>;
      
      // استخدام قائمة بدون نقاط للتحديات، وقائمة مع نقاط للإشعارات الأخرى
      const useBulletPoints = !isChallengeNotification(type);
      
      return (
        <ul className={useBulletPoints ? "list-disc list-inside space-y-1" : "space-y-1"}>
          {Object.entries(parsedData).map(([key, value]) => {
            // تجاهل المفاتيح التي تحتوي على كلمة "percentage" للتنسيق الخاص
            if (key.includes('percentage')) return null;
            
            // عرض النسب المئوية بتنسيق خاص
            const percentKey = Object.keys(parsedData).find(k => 
              k.includes('percentage') && k.startsWith(key)
            );
            
            let displayValue = String(value);
            if (key === 'currentAmount' || key === 'overspending' || key === 'amount') {
              displayValue = `${displayValue} ﷼`;
            }
            
            return (
              <li key={key}>
                {key === 'startDate' ? 'الفترة: ' : 
                 key === 'endDate' ? 'إلى: ' :
                 key === 'currentSpending' ? 'المصروفات الحالية: ' :
                 key === 'monthlyBudget' ? 'الميزانية الشهرية: ' :
                 key === 'overspending' ? 'تجاوز الميزانية: ' :
                 key === 'trendType' ? 'نوع الاتجاه: ' :
                 key === 'category' ? 'الفئة: ' :
                 key === 'luxurySpending' ? 'الإنفاق على الرفاهيات: ' :
                 key === 'essentialSpending' ? 'الإنفاق على الأساسيات: ' :
                 key === 'totalSpending' ? 'إجمالي الإنفاق: ' :
                 ''}
                {displayValue}
                {percentKey && typeof parsedData[percentKey] === 'number' ? 
                  ` (${Math.round(parsedData[percentKey] as number)}%)` : 
                  ''}
              </li>
            );
          })}
        </ul>
      );
    } catch {
      return <p>{data}</p>;
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p className="text-muted-foreground">جاري تحميل الإشعارات...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6">
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">الإشعارات</h1>
            <p className="text-muted-foreground mt-1">اطلع على آخر التحديثات والتنبيهات الخاصة بحسابك</p>
          </div>
          
          {unreadCount > 0 && (
            <Button 
              onClick={() => markAllAsRead()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>تعيين الكل كمقروء</span>
            </Button>
          )}
        </header>

        {notifications.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-10 flex flex-col items-center justify-center text-center">
              <Bell className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-1">لا توجد إشعارات</h3>
              <p className="text-muted-foreground">ستظهر جميع التنبيهات والإشعارات هنا عندما تتوفر</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`transition-colors ${!notification.isRead ? 'ring-1 ring-primary' : ''}`}
                onClick={() => !notification.isRead && markAsRead(notification.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-8 w-8 rounded-full flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${getNotificationColor(notification.type)}20` }}
                      >
                        {getIconByType(notification.type)}
                      </div>
                      <div>
                        <CardTitle 
                          className="text-base"
                          style={{ color: getNotificationColor(notification.type) }}
                        >
                          {notification.title}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {formatCreatedAt(notification.createdAt)}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {getNotificationTypeName(notification.type)}
                      </Badge>
                      {!notification.isRead && (
                        <Badge variant="secondary" className="bg-primary text-primary-foreground">
                          جديد
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm">{notification.message}</p>
                      
                      {/* عرض بيانات إضافية إذا كانت متوفرة */}
                      {notification.data && (
                        <div className="mt-2 pt-2 border-t text-sm text-muted-foreground">
                          {renderAdditionalData(notification.data, notification.type)}
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation(); // لمنع التداخل مع علامة "مقروء"
                        dismissNotification(notification.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}