import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Notification, useNotifications } from "@/hooks/use-notifications";
import { formatDistance } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { ar } from "date-fns/locale";
import { useState } from "react";
import { Loader2 } from "lucide-react";

// مكون عنصر إشعار واحد
const NotificationItem = ({ notification, onRead }: { notification: Notification; onRead: (id: number) => void }) => {
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
      default:
        return "📣";
    }
  };

  // حساب الوقت المنقضي منذ إنشاء الإشعار
  const timeAgo = formatDistance(
    new Date(notification.createdAt),
    new Date(),
    { addSuffix: true, locale: ar }
  );

  return (
    <div 
      className={`p-3 border-b cursor-pointer hover:bg-muted transition-colors ${!notification.isRead ? 'bg-muted/50' : ''}`}
      onClick={() => onRead(notification.id)}
    >
      <div className="flex items-start gap-2">
        <div className="text-xl">{getIconByType(notification.type)}</div>
        <div className="flex-1 space-y-1">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-sm">{notification.title}</h4>
            {!notification.isRead && (
              <Badge variant="outline" className="bg-primary text-primary-foreground text-[10px] h-5">
                جديد
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">{notification.message}</p>
          <p className="text-[11px] text-muted-foreground">{timeAgo}</p>
        </div>
      </div>
    </div>
  );
};

// مكون أيقونة الإشعارات
export default function NotificationIcon() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleReadNotification = (id: number) => {
    markAsRead(id);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs" 
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="end">
        <div className="p-3 border-b flex justify-between items-center">
          <h3 className="font-medium text-lg">الإشعارات</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-8"
              onClick={() => markAllAsRead()}
            >
              تعيين الكل كمقروء
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <NotificationItem 
                key={notification.id} 
                notification={notification} 
                onRead={handleReadNotification} 
              />
            ))
          ) : (
            <div className="text-center p-6 text-muted-foreground">
              لا توجد إشعارات
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}