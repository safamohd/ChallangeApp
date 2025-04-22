import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// تعريف مخططات التحقق
const loginSchema = z.object({
  email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صالح" }),
  password: z.string().min(6, { message: "يجب أن تحتوي كلمة المرور على الأقل 6 أحرف" }),
});

const registerSchema = z.object({
  username: z.string().min(3, { message: "يجب أن يحتوي اسم المستخدم على الأقل 3 أحرف" }),
  fullName: z.string().optional(),
  email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صالح" }),
  password: z.string().min(6, { message: "يجب أن تحتوي كلمة المرور على الأقل 6 أحرف" }),
  confirmPassword: z.string().min(6, { message: "يجب أن تحتوي كلمة المرور على الأقل 6 أحرف" }),
  monthlyBudget: z.union([
    z.number(),
    z.string().transform((val) => val === "" ? 0 : parseFloat(val))
  ]).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمتا المرور غير متطابقتين",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("login");
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  
  // إذا كان المستخدم مسجل الدخول بالفعل، توجيهه للصفحة الرئيسية
  React.useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // نموذج تسجيل الدخول
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // نموذج إنشاء حساب جديد
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      monthlyBudget: 0,
    },
  });

  // وظيفة تسجيل الدخول
  const onLogin = async (values: LoginFormValues) => {
    try {
      setIsLoading(true);
      await loginMutation.mutateAsync(values);
    } catch (error) {
      // الخطأ معالج في loginMutation
    } finally {
      setIsLoading(false);
    }
  };

  // وظيفة إنشاء حساب جديد
  const onRegister = async (values: RegisterFormValues) => {
    try {
      setIsLoading(true);
      // إزالة حقل confirmPassword قبل الإرسال
      const { confirmPassword, ...registrationData } = values;
      
      await registerMutation.mutateAsync(registrationData);
    } catch (error) {
      // الخطأ معالج في registerMutation
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-50 to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
        {/* قسم النموذج */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
              <TabsTrigger value="register">إنشاء حساب</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-center">تسجيل الدخول</CardTitle>
                  <CardDescription className="text-center">
                    قم بتسجيل الدخول للوصول إلى حسابك.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>البريد الإلكتروني</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="أدخل البريد الإلكتروني"
                                {...field}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>كلمة المرور</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="أدخل كلمة المرور"
                                {...field}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                      >
                        {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-center">إنشاء حساب جديد</CardTitle>
                  <CardDescription className="text-center">
                    قم بإنشاء حساب جديد للبدء في تتبع مصاريفك.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>اسم المستخدم</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="أدخل اسم المستخدم"
                                {...field}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>البريد الإلكتروني</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="أدخل البريد الإلكتروني"
                                {...field}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>كلمة المرور</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="أدخل كلمة المرور"
                                {...field}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الاسم الكامل</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="أدخل الاسم الكامل"
                                {...field}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تأكيد كلمة المرور</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="أعد إدخال كلمة المرور"
                                {...field}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="monthlyBudget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الميزانية الشهرية (اختياري)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="أدخل ميزانيتك الشهرية"
                                {...field}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                      >
                        {isLoading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* قسم المعلومات */}
        <div className="lg:col-span-3 hidden lg:block">
          <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white h-full">
            <CardContent className="p-10 flex flex-col items-center justify-center h-full">
              <h1 className="text-4xl font-bold mb-6 text-center">مصاريفي</h1>
              <p className="text-xl mb-8 text-center leading-relaxed">
                تطبيق إدارة المصاريف الشخصية الذي يساعدك على تتبع نفقاتك وتوفير أموالك بطريقة سهلة وفعالة.
              </p>
              <div className="space-y-4 w-full max-w-lg">
                <div className="bg-white/20 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">تتبع مصاريفك</h3>
                  <p>سجل جميع مصاريفك اليومية وصنفها حسب الفئات المختلفة.</p>
                </div>
                <div className="bg-white/20 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">تحليلات مفصلة</h3>
                  <p>احصل على رؤى وتحليلات مفصلة حول أنماط الإنفاق الخاصة بك.</p>
                </div>
                <div className="bg-white/20 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">حدد أهداف التوفير</h3>
                  <p>ضع أهدافًا للتوفير وتتبع تقدمك نحو تحقيقها.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}