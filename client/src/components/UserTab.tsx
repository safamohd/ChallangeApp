import React from 'react';
import { useLocation } from 'wouter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from './ui/button';
import { useAuth } from '@/hooks/use-auth';
import { User, Bell, LogOut } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';

export default function UserTab() {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { unreadCount } = useNotifications();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-primary relative">
          <User className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="px-2 py-1.5 text-sm font-medium text-center text-muted-foreground">
          {user.username}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer flex items-center gap-2"
          onClick={() => setLocation('/profile')}
        >
          <User className="h-4 w-4" />
          <span>الملف الشخصي</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer flex items-center gap-2"
          onClick={() => setLocation('/notifications')}
        >
          <Bell className="h-4 w-4" />
          <span className="flex-1">الإشعارات</span>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] px-1.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer text-red-500 flex items-center gap-2"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="h-4 w-4" />
          <span>تسجيل الخروج</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}