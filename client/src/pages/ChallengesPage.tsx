import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  Clock, 
  Flag, 
  Award, 
  Ban, 
  XCircle, 
  Trophy, 
  PieChart, 
  Calendar, 
  Activity, 
  DollarSign,
  Target,
  BarChart4, 
  Loader2 
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";

// أنواع البيانات
interface Challenge {
  id: number;
  userId: number;
  title: string;
  description: string;
  type: string;
  status: "suggested" | "active" | "completed" | "failed" | "dismissed";
  startDate: string;
  endDate: string;
  progress: number;
  targetValue: number;
  currentValue: number;
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
}



export default function ChallengesPage() {
  const [activeTab, setActiveTab] = useState<string>("active");
  const { toast } = useToast();

  // جلب التحديات
  const { data: challenges, isLoading: isLoadingChallenges } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges"],
    queryFn: async () => {
      const response = await fetch("/api/challenges");
      
      if (!response.ok) {
        throw new Error("حدث خطأ أثناء جلب التحديات");
      }
      
      return await response.json();
    }
  });

  // جلب التحدي النشط
  const { data: activeChallenge, isLoading: isLoadingActive } = useQuery<Challenge>({
    queryKey: ["/api/challenges/active"],
    queryFn: async () => {
      const response = await fetch("/api/challenges/active");
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error("حدث خطأ أثناء جلب التحدي النشط");
      }
      
      return await response.json();
    }
  });

  // جلب اقتراحات التحديات
  const { data: suggestedChallenges, isLoading: isLoadingSuggestions } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges/suggestions"],
    queryFn: async () => {
      const response = await fetch("/api/challenges/suggestions");
      
      if (!response.ok) {
        throw new Error("حدث خطأ أثناء جلب اقتراحات التحديات");
      }
      
      return await response.json();
    }
  });

  // بدء تحدي
  const startChallengeMutation = useMutation({
    mutationFn: async (challenge: Challenge) => {
      const response = await apiRequest("POST", "/api/challenges/start", {
        type: challenge.type,
        title: challenge.title,
        description: challenge.description,
        metadata: challenge.metadata,
        targetValue: challenge.targetValue
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "حدث خطأ أثناء بدء التحدي");
      }
      
      // بمجرد أن يتم بدء التحدي بنجاح، نحذفه من قائمة الاقتراحات إذا كان موجوداً
      if (suggestedChallenges) {
        const updatedSuggestions = suggestedChallenges.filter(c => c.id !== challenge.id);
        queryClient.setQueryData(["/api/challenges/suggestions"], updatedSuggestions);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم بدء التحدي بنجاح!",
        description: "سيتم تتبع تقدمك تلقائياً بناءً على سلوك الإنفاق اليومي.",
      });
      
      // تحديث البيانات
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges/suggestions"] });
      
      // تعيين البيانات المحدثة مباشرة
      queryClient.setQueryData(["/api/challenges/active"], data);
    },
    onError: (error: Error) => {
      toast({
        title: "فشل بدء التحدي",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // إلغاء تحدي
  const cancelChallengeMutation = useMutation({
    mutationFn: async (challengeId: number) => {
      const response = await apiRequest("PUT", `/api/challenges/${challengeId}/cancel`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "حدث خطأ أثناء إلغاء التحدي");
      }
      
      // تحديث العنصر النشط (إذا كان هذا هو التحدي النشط)
      if (activeChallenge && activeChallenge.id === challengeId) {
        queryClient.setQueryData(["/api/challenges/active"], null);
      }
      
      // حذف التحدي من الاقتراحات إذا كان موجوداً فيها
      if (suggestedChallenges) {
        const updatedSuggestions = suggestedChallenges.filter(c => c.id !== challengeId);
        queryClient.setQueryData(["/api/challenges/suggestions"], updatedSuggestions);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم إلغاء التحدي",
        description: "يمكنك دائمًا تجربة تحدٍ آخر.",
      });
      
      // تحديث البيانات
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges/suggestions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل إلغاء التحدي",
        description: error.message,
        variant: "destructive",
      });
    }
  });


  
  // تحديث تقدم التحدي
  const updateProgressMutation = useMutation({
    mutationFn: async ({ challengeId, progress, currentValue }: { challengeId: number, progress: number, currentValue?: number }) => {
      const response = await apiRequest("PUT", `/api/challenges/${challengeId}/update-progress`, {
        progress,
        currentValue
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "حدث خطأ أثناء تحديث تقدم التحدي");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث التقدم",
        description: "أحسنت! استمر في التقدم.",
      });
      
      // تحديث البيانات
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges/active"] });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل تحديث التقدم",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // معالجة بدء التحدي
  const handleStartChallenge = (challenge: Challenge) => {
    startChallengeMutation.mutate(challenge);
  };

  // معالجة إلغاء التحدي
  const handleCancelChallenge = (challengeId: number) => {
    if (confirm("هل أنت متأكد من رغبتك في إلغاء هذا التحدي؟")) {
      cancelChallengeMutation.mutate(challengeId);
    }
  };

  // معالجة تحديث تقدم التحدي
  const handleUpdateProgress = (challengeId: number, progress: number, currentValue?: number) => {
    updateProgressMutation.mutate({ challengeId, progress, currentValue });
  };

  // تصنيف التحديات
  const getChallengesByStatus = (status: string) => {
    if (!challenges) return [];
    return challenges.filter(challenge => challenge.status === status);
  };

  // استخراج الملاحظات من التحدي
  const getChallengeMetadata = (challenge: Challenge) => {
    try {
      return challenge.metadata ? JSON.parse(challenge.metadata) : {};
    } catch (e) {
      return {};
    }
  };

  // تحويل نوع التحدي إلى نص عربي
  const getChallengeTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      'category_limit': 'تحدي فئة',
      'importance_limit': 'تحدي أهمية',
      'time_based': 'تحدي زمني',
      'spending_reduction': 'تحدي توفير',
      'saving_goal': 'هدف ادخار',
      'consistency': 'تحدي انتظام'
    };
    
    return typeMap[type] || type;
  };

  // احصل على لون حالة التحدي
  const getChallengeStatusColor = (status: string) => {
    const statusColorMap: Record<string, string> = {
      'suggested': 'bg-blue-100 text-blue-800',
      'active': 'bg-green-100 text-green-800',
      'completed': 'bg-purple-100 text-purple-800',
      'failed': 'bg-red-100 text-red-800',
      'dismissed': 'bg-gray-100 text-gray-800'
    };
    
    return statusColorMap[status] || 'bg-gray-100 text-gray-800';
  };

  // احصل على نص حالة التحدي
  const getChallengeStatusText = (status: string) => {
    const statusTextMap: Record<string, string> = {
      'suggested': 'مقترح',
      'active': 'نشط',
      'completed': 'مكتمل',
      'failed': 'فشل',
      'dismissed': 'ملغي'
    };
    
    return statusTextMap[status] || status;
  };

  // احصل على أيقونة حالة التحدي
  const getChallengeStatusIcon = (status: string) => {
    switch (status) {
      case 'suggested':
        return <Flag className="h-4 w-4 mr-1" />;
      case 'active':
        return <Clock className="h-4 w-4 mr-1" />;
      case 'completed':
        return <Check className="h-4 w-4 mr-1" />;
      case 'failed':
        return <XCircle className="h-4 w-4 mr-1" />;
      case 'dismissed':
        return <Ban className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  // احصل على أيقونة نوع التحدي
  const getChallengeTypeIcon = (type: string) => {
    switch (type) {
      case 'category_limit':
        return <PieChart className="h-4 w-4 mr-1" />;
      case 'importance_limit':
        return <Target className="h-4 w-4 mr-1" />;
      case 'time_based':
        return <Calendar className="h-4 w-4 mr-1" />;
      case 'spending_reduction':
        return <DollarSign className="h-4 w-4 mr-1" />;
      case 'saving_goal':
        return <Award className="h-4 w-4 mr-1" />;
      case 'consistency':
        return <Activity className="h-4 w-4 mr-1" />;
      default:
        return <Flag className="h-4 w-4 mr-1" />;
    }
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('ar-SA', options);
  };

  // احسب المدة المتبقية للتحدي
  const getRemainingDays = (endDateString: string) => {
    const endDate = new Date(endDateString);
    const today = new Date();
    
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  // عرض بطاقة تحدي
  const renderChallengeCard = (challenge: Challenge) => (
    <Card 
      key={challenge.id} 
      className={`w-full shadow-sm hover:shadow-md transition-all border overflow-hidden
        ${challenge.status === 'active' ? 'ring-1 ring-primary/20 bg-primary/[0.03]' : ''}
        ${challenge.status === 'completed' ? 'ring-1 ring-green-200 bg-green-50/30' : ''}
        ${challenge.status === 'failed' ? 'ring-1 ring-red-200 bg-red-50/30' : ''}
      `}
      dir="rtl"
    >
      {challenge.status === 'active' && (
        <div className="bg-primary/10 h-1.5">
          <div className="bg-primary h-full" style={{ width: `${challenge.progress}%` }}></div>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {getChallengeTypeIcon(challenge.type)}
              <Badge variant="outline" className="font-normal">
                {getChallengeTypeText(challenge.type)}
              </Badge>
              <Badge className={getChallengeStatusColor(challenge.status)}>
                {getChallengeStatusIcon(challenge.status)}
                {getChallengeStatusText(challenge.status)}
              </Badge>
            </div>
            <CardTitle className="text-lg font-bold">{challenge.title}</CardTitle>
          </div>
          
          {challenge.status === 'active' && (
            <div className="flex flex-col items-center justify-center bg-primary/10 rounded-full w-14 h-14 shrink-0">
              <span className="text-lg font-bold text-primary">{challenge.progress.toFixed(0)}%</span>
              <span className="text-[10px] text-primary/80">التقدم</span>
            </div>
          )}
        </div>
        <CardDescription className="text-sm mt-2 leading-relaxed">
          {challenge.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-3">
        {challenge.status === 'active' && (
          <div className="mb-4">
            <div className="flex justify-between mb-1 items-center text-sm">
              <span className="font-medium">التقدم في التحدي:</span>
              <span>{challenge.progress.toFixed(0)}%</span>
            </div>
            <Progress value={challenge.progress} className="h-2" />
          </div>
        )}
        
        <div className="text-sm text-muted-foreground">
          <div className="flex justify-between items-center mb-2 bg-muted/20 p-2 rounded-md">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 ml-1.5 text-muted-foreground" />
              <span>تاريخ البدء:</span>
            </div>
            <span>{formatDate(challenge.startDate)}</span>
          </div>
          
          <div className="flex justify-between items-center mb-3 bg-muted/20 p-2 rounded-md">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 ml-1.5 text-muted-foreground" />
              <span>تاريخ الانتهاء:</span>
            </div>
            <span>{formatDate(challenge.endDate)}</span>
          </div>
          
          {challenge.status === 'active' && (
            <>
              <div className="flex justify-between items-center mb-3 p-2 bg-primary/5 rounded-md">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 ml-1.5 text-primary" />
                  <span className="font-medium text-primary">الوقت المتبقي:</span>
                </div>
                <span className="font-medium">{getRemainingDays(challenge.endDate)} أيام</span>
              </div>
              
              <Separator className="my-3" />
              
              <Alert className="bg-amber-50 border-amber-200 p-3 my-2">
                <div className="flex items-center mb-1">
                  <Activity className="h-4 w-4 ml-1.5 text-amber-600" />
                  <AlertTitle className="text-amber-800 font-medium text-sm">كيف يتم تتبع التحدي؟</AlertTitle>
                </div>
                <AlertDescription className="text-xs leading-relaxed text-amber-700">
                  {challenge.type === 'category_limit' && "يجب عدم الإنفاق على الفئة المحددة لمدة 24 ساعة على الأقل لإحراز تقدم في التحدي. سيتم تحديث تقدمك تلقائياً بناءً على سلوك إنفاقك اليومي."}
                  {challenge.type === 'importance_limit' && "يتم فحص مستويات أهمية مصاريفك اليومية وتحديث التقدم تلقائياً. استمر في تجنب المصاريف غير الضرورية لإحراز تقدم."}
                  {challenge.type === 'time_based' && "يتم مراقبة الإنفاق في الأيام المحددة وتحديث التقدم تلقائياً. تجنب الإنفاق في هذه الأيام لإكمال التحدي."}
                  {challenge.type === 'spending_reduction' && "يتم مقارنة إجمالي إنفاقك خلال فترة التحدي بالمتوسط السابق وتحديث التقدم تلقائياً. استمر في تقليل الإنفاق للنجاح."}
                  {challenge.type === 'saving_goal' && "يتم تتبع مدى التزامك بالتوفير خلال فترة التحدي. المبالغ التي توفرها من خلال تقليل الإنفاق تحتسب تلقائياً."}
                  {challenge.type === 'consistency' && "يتم مراقبة انتظامك في تسجيل المصاريف وتحديث التقدم بناءً على ذلك. استمر في تسجيل مصاريفك يومياً للنجاح."}
                </AlertDescription>
              </Alert>
            </>
          )}
        </div>
      </CardContent>
      
      <CardFooter className={`pt-0 ${challenge.status === 'active' ? 'bg-gradient-to-t from-primary/5 to-transparent' : ''}`}>
        {challenge.status === 'suggested' && (
          <div className="w-full flex rtl:space-x-reverse space-x-2">
            <Button 
              onClick={() => handleStartChallenge(challenge)} 
              className="flex-1"
              disabled={startChallengeMutation.isPending}
            >
              {startChallengeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Target className="h-4 w-4 ml-2" />
              )}
              ابدأ التحدي
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleCancelChallenge(challenge.id)}
              className="flex-1"
              disabled={cancelChallengeMutation.isPending}
            >
              {cancelChallengeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Ban className="h-4 w-4 ml-2" />
              )}
              تجاهل
            </Button>
          </div>
        )}
        
        {challenge.status === 'active' && (
          <div className="w-full text-center">
            <div className="bg-green-50 border border-green-100 p-3 rounded-md mb-3 text-sm">
              <div className="flex items-center justify-center mb-1">
                <Activity className="h-4 w-4 ml-1.5 text-green-600" />
                <p className="font-semibold text-green-800">التحدي قيد التنفيذ!</p>
              </div>
              <p className="text-xs text-green-700">يتم تتبع تقدمك تلقائياً بناءً على سلوك الإنفاق اليومي</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => handleCancelChallenge(challenge.id)}
              size="sm"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors border-red-200"
              disabled={cancelChallengeMutation.isPending}
            >
              {cancelChallengeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <XCircle className="h-4 w-4 ml-1" />
              )}
              إلغاء التحدي
            </Button>
          </div>
        )}
        
        {challenge.status === 'completed' && (
          <div className="w-full text-center">
            <div className="bg-green-50 border border-green-100 p-3 rounded-md text-sm">
              <div className="flex items-center justify-center">
                <Trophy className="h-5 w-5 ml-1.5 text-green-600" />
                <p className="font-semibold text-green-800">تهانينا! تم إنجاز التحدي بنجاح</p>
              </div>
              <p className="text-xs text-green-700 mt-1">استمر في تحسين عاداتك المالية من خلال التحديات الجديدة</p>
            </div>
          </div>
        )}
        
        {challenge.status === 'failed' && (
          <div className="w-full text-center">
            <div className="bg-red-50 border border-red-100 p-3 rounded-md text-sm">
              <div className="flex items-center justify-center">
                <XCircle className="h-5 w-5 ml-1.5 text-red-500" />
                <p className="font-semibold text-red-700">لم يكتمل التحدي</p>
              </div>
              <p className="text-xs text-red-600 mt-1">لا تقلق، يمكنك دائمًا تجربة تحديات أخرى وتحسين أدائك</p>
            </div>
          </div>
        )}
        
        {challenge.status === 'dismissed' && (
          <div className="w-full text-center">
            <div className="bg-gray-50 border border-gray-100 p-3 rounded-md text-sm">
              <div className="flex items-center justify-center">
                <Ban className="h-5 w-5 ml-1.5 text-gray-500" />
                <p className="font-semibold text-gray-700">تم تجاهل التحدي</p>
              </div>
              <p className="text-xs text-gray-600 mt-1">يمكنك استكشاف تحديات أخرى تناسب أهدافك المالية</p>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );

  // تصفية التحديات حسب الحالة
  const filteredChallenges = () => {
    switch (activeTab) {
      case "active":
        return activeChallenge ? [activeChallenge] : [];
      case "suggested":
        return suggestedChallenges || [];
      case "completed":
        return getChallengesByStatus("completed");
      case "all":
      default:
        return challenges || [];
    }
  };


  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-right">تحدياتي المالية</h1>
          {activeChallenge && (
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 py-1.5 px-3">
              <Target className="h-4 w-4 ml-1" />
              تحدي نشط قيد التنفيذ
            </Badge>
          )}
        </div>
        
        <Alert className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 text-right">
          <div className="flex items-center">
            <Trophy className="h-5 w-5 text-primary ml-2" />
            <AlertTitle className="font-bold text-primary">تحدياتك الشخصية</AlertTitle>
          </div>
          <AlertDescription className="text-muted-foreground mt-2">
            تساعدك التحديات المالية على تحسين عاداتك المالية وتحقيق أهدافك في التوفير. ابدأ تحديًا جديدًا الآن وتتبع تقدمك تلقائيًا!
          </AlertDescription>
        </Alert>
        
        <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <TabsList className="w-full mb-6 bg-background/50 p-1 shadow-sm border">
            <TabsTrigger value="active" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium">
              <Activity className="h-4 w-4 ml-1.5" />
              النشط
            </TabsTrigger>
            <TabsTrigger value="suggested" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium">
              <Flag className="h-4 w-4 ml-1.5" />
              مقترحات
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium">
              <Check className="h-4 w-4 ml-1.5" />
              مكتملة
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium">
              <BarChart4 className="h-4 w-4 ml-1.5" />
              الكل
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab}>
            {isLoadingChallenges || isLoadingActive || isLoadingSuggestions ? (
              <div className="flex flex-col justify-center items-center py-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">جاري تحميل التحديات...</p>
              </div>
            ) : filteredChallenges().length === 0 ? (
              <div className="text-center py-10 bg-muted/20 rounded-lg border border-dashed">
                {activeTab === "active" ? (
                  <div className="max-w-md mx-auto">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">لا توجد تحديات نشطة</h3>
                    <p className="text-muted-foreground mb-4">يمكنك بدء تحدي جديد من علامة التبويب "مقترحات"</p>
                    <Button onClick={() => setActiveTab("suggested")} variant="outline">
                      <Flag className="h-4 w-4 ml-2" />
                      استعرض التحديات المقترحة
                    </Button>
                  </div>
                ) : activeTab === "suggested" ? (
                  <div className="max-w-md mx-auto">
                    <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">لا توجد تحديات مقترحة</h3>
                    <p className="text-muted-foreground">أضف المزيد من المصاريف للحصول على اقتراحات مخصصة بناءً على أنماط إنفاقك</p>
                  </div>
                ) : activeTab === "completed" ? (
                  <div className="max-w-md mx-auto">
                    <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">لا توجد تحديات مكتملة</h3>
                    <p className="text-muted-foreground">أكمل تحدي لعرضه هنا. يتم تحديث التقدم تلقائيًا بناءً على عاداتك المالية.</p>
                  </div>
                ) : (
                  <div className="max-w-md mx-auto">
                    <BarChart4 className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">لا توجد تحديات</h3>
                    <p className="text-muted-foreground">ستظهر التحديات هنا بمجرد بدء استخدام التطبيق بشكل منتظم</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
                {filteredChallenges().map((challenge) => renderChallengeCard(challenge))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}