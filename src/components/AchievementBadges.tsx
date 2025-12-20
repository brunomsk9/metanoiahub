import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, Flame, BookOpen, Target, Award, Star, 
  Zap, Crown, Medal, Heart, Sparkles, Shield,
  GraduationCap, Users, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof iconMap;
  requirement: number;
  type: 'streak' | 'lessons' | 'reading' | 'habits' | 'xp' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlocked: boolean;
  progress: number;
  unlockedAt?: string;
}

const iconMap = {
  flame: Flame,
  book: BookOpen,
  target: Target,
  award: Award,
  star: Star,
  zap: Zap,
  crown: Crown,
  medal: Medal,
  heart: Heart,
  sparkles: Sparkles,
  shield: Shield,
  graduation: GraduationCap,
  users: Users,
  calendar: Calendar,
  trophy: Trophy,
};

const tierColors = {
  bronze: 'from-amber-600 to-amber-800',
  silver: 'from-slate-300 to-slate-500',
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-cyan-300 to-purple-500',
};

const tierBorderColors = {
  bronze: 'border-amber-600/50',
  silver: 'border-slate-400/50',
  gold: 'border-yellow-500/50',
  platinum: 'border-cyan-400/50',
};

// Achievement definitions
const achievementDefinitions: Omit<Achievement, 'unlocked' | 'progress' | 'unlockedAt'>[] = [
  // Streak achievements
  { id: 'streak_7', name: 'Primeira Semana', description: 'Complete 7 dias consecutivos', icon: 'flame', requirement: 7, type: 'streak', tier: 'bronze' },
  { id: 'streak_30', name: 'Mês de Dedicação', description: 'Complete 30 dias consecutivos', icon: 'flame', requirement: 30, type: 'streak', tier: 'silver' },
  { id: 'streak_90', name: 'Trimestre de Fé', description: 'Complete 90 dias consecutivos', icon: 'flame', requirement: 90, type: 'streak', tier: 'gold' },
  { id: 'streak_365', name: 'Ano de Compromisso', description: 'Complete 365 dias consecutivos', icon: 'crown', requirement: 365, type: 'streak', tier: 'platinum' },
  
  // Lessons achievements
  { id: 'lessons_5', name: 'Primeiro Passo', description: 'Complete 5 lições', icon: 'book', requirement: 5, type: 'lessons', tier: 'bronze' },
  { id: 'lessons_25', name: 'Estudante Dedicado', description: 'Complete 25 lições', icon: 'book', requirement: 25, type: 'lessons', tier: 'silver' },
  { id: 'lessons_50', name: 'Mestre do Conhecimento', description: 'Complete 50 lições', icon: 'graduation', requirement: 50, type: 'lessons', tier: 'gold' },
  { id: 'lessons_100', name: 'Sábio', description: 'Complete 100 lições', icon: 'star', requirement: 100, type: 'lessons', tier: 'platinum' },
  
  // Reading plan achievements
  { id: 'reading_7', name: 'Leitor Iniciante', description: 'Complete 7 dias de leitura', icon: 'target', requirement: 7, type: 'reading', tier: 'bronze' },
  { id: 'reading_30', name: 'Leitor Assíduo', description: 'Complete 30 dias de leitura', icon: 'target', requirement: 30, type: 'reading', tier: 'silver' },
  { id: 'reading_100', name: 'Devorador de Palavras', description: 'Complete 100 dias de leitura', icon: 'award', requirement: 100, type: 'reading', tier: 'gold' },
  
  // Habits achievements
  { id: 'habits_50', name: 'Hábitos em Formação', description: 'Complete 50 hábitos', icon: 'heart', requirement: 50, type: 'habits', tier: 'bronze' },
  { id: 'habits_200', name: 'Disciplinado', description: 'Complete 200 hábitos', icon: 'heart', requirement: 200, type: 'habits', tier: 'silver' },
  { id: 'habits_500', name: 'Estilo de Vida', description: 'Complete 500 hábitos', icon: 'shield', requirement: 500, type: 'habits', tier: 'gold' },
  
  // XP achievements
  { id: 'xp_500', name: 'Aprendiz', description: 'Acumule 500 XP', icon: 'zap', requirement: 500, type: 'xp', tier: 'bronze' },
  { id: 'xp_2000', name: 'Experiente', description: 'Acumule 2000 XP', icon: 'zap', requirement: 2000, type: 'xp', tier: 'silver' },
  { id: 'xp_5000', name: 'Veterano', description: 'Acumule 5000 XP', icon: 'medal', requirement: 5000, type: 'xp', tier: 'gold' },
  { id: 'xp_10000', name: 'Lenda', description: 'Acumule 10000 XP', icon: 'crown', requirement: 10000, type: 'xp', tier: 'platinum' },
];

interface AchievementBadgesProps {
  compact?: boolean;
  showAll?: boolean;
}

export function AchievementBadges({ compact = false, showAll = false }: AchievementBadgesProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [loading, setLoading] = useState(true);
  const [newUnlock, setNewUnlock] = useState<Achievement | null>(null);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch user data for progress calculation
    const [profileRes, lessonsRes, readingRes, habitsRes, existingAchievements] = await Promise.all([
      supabase.from('profiles').select('current_streak, xp_points').eq('id', user.id).maybeSingle(),
      supabase.from('user_progress').select('id').eq('user_id', user.id).eq('completed', true),
      supabase.from('user_reading_progress').select('completed_days').eq('user_id', user.id),
      supabase.from('daily_habits').select('id').eq('user_id', user.id),
      supabase.from('habit_achievements').select('*').eq('user_id', user.id),
    ]);

    const streak = profileRes.data?.current_streak || 0;
    const xp = profileRes.data?.xp_points || 0;
    const lessonsCompleted = lessonsRes.data?.length || 0;
    const readingDays = readingRes.data?.reduce((acc, curr) => acc + (curr.completed_days?.length || 0), 0) || 0;
    const habitsCompleted = habitsRes.data?.length || 0;

    // Map achievement types to progress values
    const progressMap: Record<Achievement['type'], number> = {
      streak: streak,
      lessons: lessonsCompleted,
      reading: readingDays,
      habits: habitsCompleted,
      xp: xp,
      special: 0,
    };

    // Calculate achievements with progress
    const calculatedAchievements = achievementDefinitions.map(def => {
      const progress = progressMap[def.type];
      const unlocked = progress >= def.requirement;
      const existing = existingAchievements.data?.find(a => a.achievement_type === def.id);
      
      return {
        ...def,
        progress: Math.min(progress, def.requirement),
        unlocked,
        unlockedAt: existing?.achieved_at,
      };
    });

    // Check for new unlocks and save them
    for (const achievement of calculatedAchievements) {
      if (achievement.unlocked) {
        const exists = existingAchievements.data?.find(a => a.achievement_type === achievement.id);
        if (!exists) {
          // Save new achievement
          await supabase.from('habit_achievements').insert({
            user_id: user.id,
            achievement_type: achievement.id,
            streak_days: progressMap.streak,
          });
          
          // Show celebration for first new unlock only
          if (!newUnlock) {
            setNewUnlock(achievement);
            triggerCelebration();
          }
        }
      }
    }

    setAchievements(calculatedAchievements);
    setLoading(false);
  };

  const triggerCelebration = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#f59e0b', '#10b981'],
    });
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const displayAchievements = showAll 
    ? achievements 
    : compact 
      ? achievements.filter(a => a.unlocked).slice(0, 6)
      : achievements;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <>
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-warning" />
                Conquistas
              </div>
              <Badge variant="secondary" className="font-mono">
                {unlockedCount}/{achievements.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {displayAchievements.map((achievement) => {
                const Icon = iconMap[achievement.icon];
                return (
                  <motion.button
                    key={achievement.id}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedAchievement(achievement)}
                    className={cn(
                      "relative w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                      "bg-gradient-to-br",
                      achievement.unlocked ? tierColors[achievement.tier] : "from-muted to-muted/80",
                      achievement.unlocked ? "shadow-lg" : "opacity-60"
                    )}
                  >
                    <Icon className={cn(
                      "w-6 h-6",
                      achievement.unlocked ? "text-white" : "text-muted-foreground"
                    )} />
                    {achievement.unlocked && (
                      <span className="absolute -top-1 -right-1 text-xs">✨</span>
                    )}
                  </motion.button>
                );
              })}
              {unlockedCount < achievements.length && (
                <button
                  onClick={() => setSelectedAchievement(achievements.find(a => !a.unlocked) || null)}
                  className="w-12 h-12 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground hover:border-primary/50 transition-colors"
                >
                  +{achievements.length - unlockedCount}
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Achievement Detail Dialog */}
        <Dialog open={!!selectedAchievement} onOpenChange={() => setSelectedAchievement(null)}>
          <DialogContent className="sm:max-w-md">
            {selectedAchievement && (
              <AchievementDetail achievement={selectedAchievement} />
            )}
          </DialogContent>
        </Dialog>

        {/* New Unlock Celebration */}
        <AnimatePresence>
          {newUnlock && (
            <Dialog open={!!newUnlock} onOpenChange={() => setNewUnlock(null)}>
              <DialogContent className="sm:max-w-md border-none bg-gradient-to-br from-primary/10 via-background to-warning/10">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center space-y-4 py-4"
                >
                  <motion.div
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ repeat: 3, duration: 0.5 }}
                    className={cn(
                      "w-20 h-20 rounded-2xl mx-auto flex items-center justify-center bg-gradient-to-br shadow-lg",
                      tierColors[newUnlock.tier]
                    )}
                  >
                    {(() => {
                      const Icon = iconMap[newUnlock.icon];
                      return <Icon className="w-10 h-10 text-white" />;
                    })()}
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5 text-warning" />
                      Nova Conquista!
                      <Sparkles className="w-5 h-5 text-warning" />
                    </h2>
                    <p className="text-2xl font-display font-bold text-primary mt-2">
                      {newUnlock.name}
                    </p>
                    <p className="text-muted-foreground mt-1">{newUnlock.description}</p>
                  </div>
                </motion.div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Full grid view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-warning" />
          Conquistas
        </h2>
        <Badge variant="secondary" className="font-mono text-lg px-3 py-1">
          {unlockedCount}/{achievements.length}
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {displayAchievements.map((achievement) => {
          const Icon = iconMap[achievement.icon];
          const progressPercent = (achievement.progress / achievement.requirement) * 100;
          
          return (
            <motion.button
              key={achievement.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedAchievement(achievement)}
              className={cn(
                "relative p-4 rounded-2xl border transition-all text-left",
                achievement.unlocked 
                  ? `bg-gradient-to-br ${tierColors[achievement.tier]} text-white border-transparent shadow-lg`
                  : `bg-card ${tierBorderColors[achievement.tier]} hover:shadow-md`
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  achievement.unlocked ? "bg-white/20" : "bg-muted"
                )}>
                  <Icon className={cn(
                    "w-6 h-6",
                    achievement.unlocked ? "text-white" : "text-muted-foreground"
                  )} />
                </div>
                <p className={cn(
                  "text-sm font-semibold text-center line-clamp-1",
                  !achievement.unlocked && "text-foreground"
                )}>
                  {achievement.name}
                </p>
                {!achievement.unlocked && (
                  <div className="w-full">
                    <Progress value={progressPercent} className="h-1.5" />
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      {achievement.progress}/{achievement.requirement}
                    </p>
                  </div>
                )}
                {achievement.unlocked && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-none text-xs">
                    {achievement.tier}
                  </Badge>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Achievement Detail Dialog */}
      <Dialog open={!!selectedAchievement} onOpenChange={() => setSelectedAchievement(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedAchievement && (
            <AchievementDetail achievement={selectedAchievement} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AchievementDetail({ achievement }: { achievement: Achievement }) {
  const Icon = iconMap[achievement.icon];
  const progressPercent = (achievement.progress / achievement.requirement) * 100;

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-center">{achievement.name}</DialogTitle>
        <DialogDescription className="text-center">{achievement.description}</DialogDescription>
      </DialogHeader>
      
      <div className="flex flex-col items-center gap-4 py-4">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className={cn(
            "w-24 h-24 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg",
            achievement.unlocked ? tierColors[achievement.tier] : "from-muted to-muted/80"
          )}
        >
          <Icon className={cn(
            "w-12 h-12",
            achievement.unlocked ? "text-white" : "text-muted-foreground"
          )} />
        </motion.div>

        <Badge variant={achievement.unlocked ? "default" : "secondary"} className="capitalize">
          {achievement.tier}
        </Badge>

        {!achievement.unlocked ? (
          <div className="w-full space-y-2">
            <Progress value={progressPercent} className="h-3" />
            <p className="text-sm text-muted-foreground text-center">
              Progresso: {achievement.progress} / {achievement.requirement}
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-success font-semibold flex items-center gap-2 justify-center">
              <Sparkles className="w-4 h-4" />
              Conquista Desbloqueada!
            </p>
            {achievement.unlockedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Conquistada em {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
