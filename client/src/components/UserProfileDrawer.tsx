import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { User, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function UserProfileDrawer() {
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user) return null;

  // استخراج الحرف الأول من اسم المستخدم للعرض في الصورة الرمزية
  const initialsAvatar = user.username.substring(0, 1).toUpperCase();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" className="w-9 px-0 aspect-square">
          <User className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader className="text-right">
          <SheetTitle>الملف الشخصي</SheetTitle>
          <SheetDescription>
            إدارة حسابك والإعدادات الشخصية
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6 flex items-center justify-center flex-col">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarFallback className="text-xl">{initialsAvatar}</AvatarFallback>
          </Avatar>
          
          <h3 className="text-xl font-medium">{user.username}</h3>
          {user.email && (
            <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
          )}
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-3 mt-4">
          <h4 className="text-sm font-medium mb-2">المعلومات الشخصية</h4>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">اسم المستخدم:</div>
            <div className="text-right">{user.username}</div>
            
            {user.email && (
              <>
                <div className="text-muted-foreground">البريد الإلكتروني:</div>
                <div className="text-right">{user.email}</div>
              </>
            )}
            
            <div className="text-muted-foreground">الراتب الشهري:</div>
            <div className="text-right">
              {typeof user.monthlySalary === 'number' && user.monthlySalary > 0 
                ? `${user.monthlySalary} ﷼` 
                : 'غير محدد'
              }
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-2">
          <Button variant="outline" className="w-full justify-start">
            <Settings className="ml-2 h-4 w-4" />
            إعدادات الحساب
          </Button>
          
          <Button 
            variant="destructive" 
            className="w-full justify-start"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="ml-2 h-4 w-4" />
            {logoutMutation.isPending ? 'جاري تسجيل الخروج...' : 'تسجيل الخروج'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}