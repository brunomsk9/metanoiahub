import { AppShell } from "@/components/layout";
import { PageTransition } from "@/components/PageTransition";
import { AchievementBadges } from "@/components/AchievementBadges";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Target, Flame, BookOpen, Heart, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";

export default function Achievements() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    streak: 0,
    xp: 0,
    lessons: 0,
    habits: 0,
    readingDays: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [profileRes, lessonsRes, habitsRes, readingRes] = await Promise.all([
      supabase.from('profiles').select('current_streak, xp_points').eq('id', user.id).maybeSingle(),
      supabase.from('user_progress').select('id').eq('user_id', user.id).eq('completed', true),
      supabase.from('daily_habits').select('id').eq('user_id', user.id),
      supabase.from('user_reading_progress').select('completed_days').eq('user_id', user.id),
    ]);

    setStats({
      streak: profileRes.data?.current_streak || 0,
      xp: profileRes.data?.xp_points || 0,
      lessons: lessonsRes.data?.length || 0,
      habits: habitsRes.data?.length || 0,
      readingDays: readingRes.data?.reduce((acc, curr) => acc + (curr.completed_days?.length || 0), 0) || 0,
    });
  };

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  }, [navigate]);

  return (
    <PageTransition>
      <AppShell onLogout={handleLogout}>
        <div className="space-y-8 pb-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-warning to-warning/60 mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground">Conquistas</h1>
            <p className="text-muted-foreground">Acompanhe seu progresso e desbloqueie badges</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card className="text-center">
              <CardContent className="pt-4 pb-3">
                <Flame className="w-6 h-6 mx-auto text-orange-500 mb-2" />
                <p className="text-2xl font-bold text-foreground">{stats.streak}</p>
                <p className="text-xs text-muted-foreground">Streak</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-4 pb-3">
                <Zap className="w-6 h-6 mx-auto text-yellow-500 mb-2" />
                <p className="text-2xl font-bold text-foreground">{stats.xp}</p>
                <p className="text-xs text-muted-foreground">XP Total</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-4 pb-3">
                <BookOpen className="w-6 h-6 mx-auto text-blue-500 mb-2" />
                <p className="text-2xl font-bold text-foreground">{stats.lessons}</p>
                <p className="text-xs text-muted-foreground">Lições</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-4 pb-3">
                <Heart className="w-6 h-6 mx-auto text-pink-500 mb-2" />
                <p className="text-2xl font-bold text-foreground">{stats.habits}</p>
                <p className="text-xs text-muted-foreground">Hábitos</p>
              </CardContent>
            </Card>
            <Card className="text-center col-span-2 sm:col-span-1">
              <CardContent className="pt-4 pb-3">
                <Target className="w-6 h-6 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold text-foreground">{stats.readingDays}</p>
                <p className="text-xs text-muted-foreground">Dias Lidos</p>
              </CardContent>
            </Card>
          </div>

          {/* All Achievements */}
          <AchievementBadges showAll />
        </div>
      </AppShell>
    </PageTransition>
  );
}