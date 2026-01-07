import { AppShell } from "@/components/layout";
import { PageTransition } from "@/components/PageTransition";
import AchievementBadges from "@/components/AchievementBadges";
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
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 shadow-lg shadow-primary/25 mb-4">
              <Trophy className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Conquistas
            </h1>
            <p className="text-muted-foreground">Acompanhe seu progresso e desbloqueie badges</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card className="glass-effect text-center group hover:border-primary/40 transition-all duration-300">
              <CardContent className="pt-5 pb-4">
                <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.streak}</p>
                <p className="text-xs text-muted-foreground mt-1">Streak</p>
              </CardContent>
            </Card>
            <Card className="glass-effect text-center group hover:border-primary/40 transition-all duration-300">
              <CardContent className="pt-5 pb-4">
                <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.xp}</p>
                <p className="text-xs text-muted-foreground mt-1">XP Total</p>
              </CardContent>
            </Card>
            <Card className="glass-effect text-center group hover:border-primary/40 transition-all duration-300">
              <CardContent className="pt-5 pb-4">
                <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.lessons}</p>
                <p className="text-xs text-muted-foreground mt-1">Lições</p>
              </CardContent>
            </Card>
            <Card className="glass-effect text-center group hover:border-primary/40 transition-all duration-300">
              <CardContent className="pt-5 pb-4">
                <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.habits}</p>
                <p className="text-xs text-muted-foreground mt-1">Hábitos</p>
              </CardContent>
            </Card>
            <Card className="glass-effect text-center col-span-2 sm:col-span-1 group hover:border-primary/40 transition-all duration-300">
              <CardContent className="pt-5 pb-4">
                <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.readingDays}</p>
                <p className="text-xs text-muted-foreground mt-1">Dias Lidos</p>
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