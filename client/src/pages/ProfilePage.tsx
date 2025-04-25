import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import { Pencil, Save, X } from "lucide-react";

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [monthlyBudget, setMonthlyBudget] = useState<number>(user?.monthlyBudget || 0);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateProfile = async (field: 'fullName' | 'monthlyBudget') => {
    if (!user) return;
    
    let updateData = {};
    
    if (field === 'fullName') {
      updateData = { fullName };
      if (!fullName.trim()) {
        toast({
          title: "خطأ في التحديث",
          description: "الرجاء إدخال اسم صحيح",
          variant: "destructive",
        });
        return;
      }
    } else if (field === 'monthlyBudget') {
      updateData = { monthlyBudget: Number(monthlyBudget) };
      if (isNaN(Number(monthlyBudget)) || Number(monthlyBudget) < 0) {
        toast({
          title: "خطأ في التحديث",
          description: "الرجاء إدخال قيمة صحيحة للميزانية",
          variant: "destructive",
        });
        return;
      }
    }
    
    try {
      setIsLoading(true);
      const res = await apiRequest("PUT", "/api/user/profile", updateData);
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "فشل تحديث الملف الشخصي");
      }
      
      const updatedUser = await res.json();
      queryClient.setQueryData(["/api/user"], updatedUser);
      
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث بيانات الملف الشخصي",
      });
      
      if (field === 'fullName') {
        setIsEditingName(false);
      } else if (field === 'monthlyBudget') {
        setIsEditingBudget(false);
      }
    } catch (error) {
      toast({
        title: "خطأ في التحديث",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء تحديث البيانات",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = (field: 'fullName' | 'monthlyBudget') => {
    if (field === 'fullName') {
      setFullName(user?.fullName || "");
      setIsEditingName(false);
    } else if (field === 'monthlyBudget') {
      setMonthlyBudget(user?.monthlyBudget || 0);
      setIsEditingBudget(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 text-right">الملف الشخصي</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-right">المعلومات الشخصية</CardTitle>
            <CardDescription className="text-right">
              عرض وتعديل معلوماتك الشخصية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* البريد الإلكتروني (غير قابل للتعديل) */}
            <div>
              <Label className="block text-right mb-2">البريد الإلكتروني</Label>
              <Input 
                value={user?.email || ""} 
                disabled 
                dir="rtl"
                className="text-right bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">لا يمكن تغيير البريد الإلكتروني</p>
            </div>
            
            {/* الاسم الكامل */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => isEditingName ? cancelEdit('fullName') : setIsEditingName(true)}
                  disabled={isLoading}
                >
                  {isEditingName ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                </Button>
                <Label className="text-right">الاسم الكامل</Label>
              </div>
              
              <div className="flex gap-2">
                {isEditingName && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateProfile('fullName')}
                    disabled={isLoading}
                  >
                    <Save className="h-4 w-4 ml-1" />
                    حفظ
                  </Button>
                )}
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={!isEditingName || isLoading}
                  dir="rtl"
                  className="text-right"
                />
              </div>
            </div>
            
            {/* الميزانية الشهرية */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => isEditingBudget ? cancelEdit('monthlyBudget') : setIsEditingBudget(true)}
                  disabled={isLoading}
                >
                  {isEditingBudget ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                </Button>
                <Label className="text-right">الميزانية الشهرية</Label>
              </div>
              
              <div className="flex gap-2">
                {isEditingBudget && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateProfile('monthlyBudget')}
                    disabled={isLoading}
                  >
                    <Save className="h-4 w-4 ml-1" />
                    حفظ
                  </Button>
                )}
                <Input
                  type="number"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(parseFloat(e.target.value) || 0)}
                  disabled={!isEditingBudget || isLoading}
                  dir="rtl"
                  className="text-right"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-right">تسجيل الخروج</CardTitle>
            <CardDescription className="text-right">
              إدارة جلسة تسجيل الدخول الخاصة بك
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (confirm("هل أنت متأكد من تسجيل الخروج؟")) {
                    logoutMutation.mutate();
                  }
                }}
              >
                تسجيل الخروج
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}