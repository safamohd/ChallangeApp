import { useState, useEffect } from "react";
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
import { Check, Clock, Flag, Award, Ban, XCircle, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Loader2 } from "lucide-react";

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
    mutationFn: async (challengeId: number) => {
      const response = await apiRequest("POST", "/api/challenges/start", { challengeId });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "حدث خطأ أثناء بدء التحدي");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم بدء التحدي بنجاح!",
        description: "ابدأ العمل على التحدي الآن.",
      });
      
      // تحديث البيانات
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges/suggestions"] });
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
      
      return await response.json();
    },
    onSuccess: () => {
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
  const handleStartChallenge = (challengeId: number) => {
    startChallengeMutation.mutate(challengeId);
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
        return <Clock className="h-4 w-4 mr-1" />;
      case 'importance_limit':
        return <Flag className="h-4 w-4 mr-1" />;
      case 'time_based':
        return <Clock className="h-4 w-4 mr-1" />;
      case 'spending_reduction':
        return <Award className="h-4 w-4 mr-1" />;
      case 'saving_goal':
        return <Award className="h-4 w-4 mr-1" />;
      case 'consistency':
        return <Trophy className="h-4 w-4 mr-1" />;
      default:
        return null;
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
    <Card key={challenge.id} className="w-full mb-4 shadow-sm hover:shadow-md transition-shadow border" dir="rtl">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">{challenge.title}</CardTitle>
          <div className="flex space-x-1 rtl:space-x-reverse">
            <Badge className={getChallengeStatusColor(challenge.status)}>
              {getChallengeStatusIcon(challenge.status)}
              {getChallengeStatusText(challenge.status)}
            </Badge>
            <Badge variant="outline">
              {getChallengeTypeIcon(challenge.type)}
              {getChallengeTypeText(challenge.type)}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-sm mt-1">
          {challenge.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="mb-4 text-sm">
          <div className="flex justify-between mb-1 items-center">
            <span>التقدم:</span>
            <span>{challenge.progress.toFixed(0)}%</span>
          </div>
          <Progress value={challenge.progress} className="h-2" />
        </div>
        
        <div className="text-sm text-muted-foreground grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium">تاريخ البدء:</span> {formatDate(challenge.startDate)}
          </div>
          <div>
            <span className="font-medium">تاريخ الانتهاء:</span> {formatDate(challenge.endDate)}
          </div>
          {challenge.status === 'active' && (
            <div className="col-span-2">
              <span className="font-medium">متبقي:</span> {getRemainingDays(challenge.endDate)} أيام
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        {challenge.status === 'suggested' && (
          <div className="w-full flex rtl:space-x-reverse space-x-2">
            <Button 
              onClick={() => handleStartChallenge(challenge.id)} 
              className="flex-1"
              disabled={startChallengeMutation.isPending}
            >
              {startChallengeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : null}
              ابدأ التحدي
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleCancelChallenge(challenge.id)}
              className="flex-1"
              disabled={cancelChallengeMutation.isPending}
            >
              تجاهل
            </Button>
          </div>
        )}
        
        {challenge.status === 'active' && (
          <div className="w-full flex rtl:space-x-reverse space-x-2">
            <Button 
              variant="outline" 
              onClick={() => handleUpdateProgress(challenge.id, 100)}
              className="flex-1"
              disabled={updateProgressMutation.isPending}
            >
              أكملت التحدي
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleCancelChallenge(challenge.id)}
              className="flex-1"
              disabled={cancelChallengeMutation.isPending}
            >
              إلغاء
            </Button>
          </div>
        )}
        
        {challenge.status === 'completed' && (
          <Button variant="outline" className="w-full" disabled>
            <Check className="h-4 w-4 mr-2" />
            تم الإنجاز! تهانينا
          </Button>
        )}
        
        {challenge.status === 'failed' && (
          <Button variant="outline" className="w-full text-red-500" disabled>
            <XCircle className="h-4 w-4 mr-2" />
            لم يكتمل التحدي
          </Button>
        )}
        
        {challenge.status === 'dismissed' && (
          <Button variant="outline" className="w-full" disabled>
            <Ban className="h-4 w-4 mr-2" />
            تم تجاهل التحدي
          </Button>
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
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6 text-right">تحدياتي المالية</h1>
        
        <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="active">النشط</TabsTrigger>
            <TabsTrigger value="suggested">مقترحات</TabsTrigger>
            <TabsTrigger value="completed">مكتملة</TabsTrigger>
            <TabsTrigger value="all">الكل</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab}>
            {isLoadingChallenges || isLoadingActive || isLoadingSuggestions ? (
              <div className="flex justify-center items-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredChallenges().length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                {activeTab === "active" ? (
                  <div>
                    <h3 className="text-lg font-medium mb-2">لا توجد تحديات نشطة</h3>
                    <p>يمكنك بدء تحدي جديد من علامة التبويب "مقترحات"</p>
                  </div>
                ) : activeTab === "suggested" ? (
                  <div>
                    <h3 className="text-lg font-medium mb-2">لا توجد تحديات مقترحة</h3>
                    <p>أضف المزيد من المصاريف للحصول على اقتراحات مخصصة</p>
                  </div>
                ) : activeTab === "completed" ? (
                  <div>
                    <h3 className="text-lg font-medium mb-2">لا توجد تحديات مكتملة</h3>
                    <p>أكمل تحدي لعرضه هنا</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-medium mb-2">لا توجد تحديات</h3>
                    <p>ستظهر التحديات هنا بمجرد بدء استخدام التطبيق</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredChallenges().map((challenge) => renderChallengeCard(challenge))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}