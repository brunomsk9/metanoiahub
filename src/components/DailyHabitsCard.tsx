import { useState, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, Heart, Star, Sun, Moon, Zap, Target, 
  Coffee, Dumbbell, Music, Smile, Check,
  Sparkles, Flame, Trophy, Award, Medal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface HabitDefinition {
  id: string;
  name: string;
  icon: string;
  color: string;
  completed?: boolean;
}

interface HabitStreak {
  current_streak: number;
  best_streak: number;
  last_completed_date: string | null;
}

interface Achievement {
  type: string;
  days: number;
  title: string;
  icon: typeof Trophy;
  color: string;
}

const ACHIEVEMENTS: Achievement[] = [
  { type: 'streak_3', days: 3, title: '3 Dias Seguidos', icon: Flame, color: 'text-orange-500' },
  { type: 'streak_7', days: 7, title: '1 Semana', icon: Star, color: 'text-yellow-500' },
  { type: 'streak_14', days: 14, title: '2 Semanas', icon: Award, color: 'text-blue-500' },
  { type: 'streak_21', days: 21, title: '3 Semanas', icon: Medal, color: 'text-purple-500' },
  { type: 'streak_30', days: 30, title: '1 Mês', icon: Trophy, color: 'text-amber-500' },
  { type: 'streak_60', days: 60, title: '2 Meses', icon: Trophy, color: 'text-emerald-500' },
  { type: 'streak_90', days: 90, title: '3 Meses', icon: Trophy, color: 'text-cyan-500' },
  { type: 'streak_180', days: 180, title: '6 Meses', icon: Trophy, color: 'text-rose-500' },
  { type: 'streak_365', days: 365, title: '1 Ano', icon: Trophy, color: 'text-primary' },
];

interface DailyHabitsCardProps {
  userId: string;
  onHabitsChange?: (completed: number, total: number) => void;
}

const ICON_OPTIONS = [
  { id: 'book', icon: BookOpen },
  { id: 'heart', icon: Heart },
  { id: 'star', icon: Star },
  { id: 'sun', icon: Sun },
  { id: 'moon', icon: Moon },
  { id: 'zap', icon: Zap },
  { id: 'target', icon: Target },
  { id: 'coffee', icon: Coffee },
  { id: 'dumbbell', icon: Dumbbell },
  { id: 'music', icon: Music },
  { id: 'smile', icon: Smile },
];

const getIconComponent = (iconId: string) => {
  const found = ICON_OPTIONS.find(i => i.id === iconId);
  return found?.icon || Star;
};

const getColorClass = (colorId: string) => {
  const colorMap: Record<string, { bg: string; bgLight: string; text: string; border: string }> = {
    primary: { bg: 'bg-primary', bgLight: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
    rose: { bg: 'bg-rose-500', bgLight: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/30' },
    orange: { bg: 'bg-orange-500', bgLight: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/30' },
    green: { bg: 'bg-green-500', bgLight: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/30' },
    purple: { bg: 'bg-purple-500', bgLight: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/30' },
    yellow: { bg: 'bg-yellow-500', bgLight: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/30' },
  };
  return colorMap[colorId] || colorMap.primary;
};

// Fetch functions
async function fetchHabits(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  const [{ data: definitions }, { data: completions }] = await Promise.all([
    supabase.from('habit_definitions').select('*').eq('is_active', true).order('ordem'),
    supabase.from('daily_habits').select('habit_type').eq('user_id', userId).eq('completed_date', today)
  ]);

  if (!definitions) return [];

  const completedIds = new Set(completions?.map(c => c.habit_type) || []);
  return definitions.map(h => ({ ...h, completed: completedIds.has(h.id) }));
}

async function fetchStreak(userId: string): Promise<HabitStreak> {
  const { data } = await supabase.from('habit_streaks').select('*').eq('user_id', userId).maybeSingle();
  return data || { current_streak: 0, best_streak: 0, last_completed_date: null };
}

async function fetchAchievements(userId: string): Promise<string[]> {
  const { data } = await supabase.from('habit_achievements').select('achievement_type').eq('user_id', userId);
  return data?.map(a => a.achievement_type) || [];
}

// Memoized Habit Item
const HabitItem = memo(function HabitItem({
  habit,
  isCelebrating,
  onToggle
}: {
  habit: HabitDefinition;
  isCelebrating: boolean;
  onToggle: () => void;
}) {
  const Icon = getIconComponent(habit.icon);
  const colors = getColorClass(habit.color);

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className={cn(
        "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 min-h-[100px]",
        habit.completed
          ? `${colors.bgLight} ${colors.border} ${colors.text}`
          : "bg-card border-border hover:border-primary/30"
      )}
    >
      <AnimatePresence>
        {isCelebrating && (
          <>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className={cn("absolute inset-0 rounded-xl", colors.bg)}
            />
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                animate={{ 
                  scale: 1,
                  x: (i % 2 === 0 ? 1 : -1) * (20 + Math.random() * 20),
                  y: -30 - Math.random() * 20,
                  opacity: 0
                }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                className="absolute"
              >
                <Sparkles className={cn("w-4 h-4", colors.text)} />
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      <motion.div
        animate={isCelebrating ? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] } : {}}
        transition={{ duration: 0.5 }}
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-all",
          habit.completed ? colors.bg : "bg-muted"
        )}
      >
        {habit.completed ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500 }}
          >
            <Check className="w-5 h-5 text-white" />
          </motion.div>
        ) : (
          <Icon className={cn("w-5 h-5", colors.text)} />
        )}
      </motion.div>

      <span className={cn(
        "text-xs font-medium text-center line-clamp-2",
        habit.completed ? colors.text : "text-muted-foreground"
      )}>
        {habit.name}
      </span>

      {habit.completed && (
        <motion.span
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("text-[10px] mt-1", colors.text)}
        >
          Concluído ✓
        </motion.span>
      )}
    </motion.button>
  );
});

export const DailyHabitsCard = memo(function DailyHabitsCard({ userId, onHabitsChange }: DailyHabitsCardProps) {
  const [celebratingHabit, setCelebratingHabit] = useState<string | null>(null);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries with caching
  const { data: habits = [], isLoading: loadingHabits } = useQuery({
    queryKey: ['habits', userId],
    queryFn: () => fetchHabits(userId),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const { data: streak = { current_streak: 0, best_streak: 0, last_completed_date: null } } = useQuery({
    queryKey: ['habitStreak', userId],
    queryFn: () => fetchStreak(userId),
    staleTime: 1000 * 60 * 2,
  });

  const { data: earnedAchievements = [] } = useQuery({
    queryKey: ['habitAchievements', userId],
    queryFn: () => fetchAchievements(userId),
    staleTime: 1000 * 60 * 5,
  });

  // Notify parent of habit changes
  useEffect(() => {
    const completed = habits.filter(h => h.completed).length;
    onHabitsChange?.(completed, habits.length);
  }, [habits, onHabitsChange]);

  const checkAndAwardAchievements = useCallback(async (currentStreak: number) => {
    for (const achievement of ACHIEVEMENTS) {
      if (currentStreak >= achievement.days && !earnedAchievements.includes(achievement.type)) {
        const { error } = await supabase.from('habit_achievements').insert({
          user_id: userId,
          achievement_type: achievement.type,
          streak_days: achievement.days
        });

        if (!error) {
          queryClient.invalidateQueries({ queryKey: ['habitAchievements', userId] });
          setNewAchievement(achievement);
          
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          toast({ title: "🏆 Nova Conquista!", description: `Você desbloqueou: ${achievement.title}` });
          setTimeout(() => setNewAchievement(null), 3000);
        }
        break;
      }
    }
  }, [earnedAchievements, userId, toast, queryClient]);

  const updateStreak = useCallback(async (allCompleted: boolean) => {
    if (!allCompleted) return;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let newCurrentStreak = streak.current_streak;
    let newBestStreak = streak.best_streak;

    if (streak.last_completed_date === yesterday) {
      newCurrentStreak += 1;
    } else if (streak.last_completed_date !== today) {
      newCurrentStreak = 1;
    }

    if (newCurrentStreak > newBestStreak) {
      newBestStreak = newCurrentStreak;
    }

    const { data: existingStreak } = await supabase.from('habit_streaks').select('id').eq('user_id', userId).maybeSingle();

    if (existingStreak) {
      await supabase.from('habit_streaks').update({
        current_streak: newCurrentStreak,
        best_streak: newBestStreak,
        last_completed_date: today,
        updated_at: new Date().toISOString()
      }).eq('user_id', userId);
    } else {
      await supabase.from('habit_streaks').insert({
        user_id: userId,
        current_streak: newCurrentStreak,
        best_streak: newBestStreak,
        last_completed_date: today
      });
    }

    queryClient.invalidateQueries({ queryKey: ['habitStreak', userId] });
    checkAndAwardAchievements(newCurrentStreak);
  }, [streak, userId, checkAndAwardAchievements, queryClient]);

  const toggleHabit = useCallback(async (habit: HabitDefinition) => {
    const today = new Date().toISOString().split('T')[0];
    
    if (!habit.completed) {
      const { error } = await supabase.from('daily_habits').insert({
        user_id: userId,
        habit_type: habit.id,
        completed_date: today,
      });

      if (!error) {
        setCelebratingHabit(habit.id);
        setTimeout(() => setCelebratingHabit(null), 1500);
        
        queryClient.setQueryData(['habits', userId], (old: HabitDefinition[] | undefined) => 
          old?.map(h => h.id === habit.id ? { ...h, completed: true } : h) || []
        );
        
        const updatedHabits = habits.map(h => h.id === habit.id ? { ...h, completed: true } : h);
        const allCompleted = updatedHabits.every(h => h.completed);
        
        if (allCompleted) {
          updateStreak(true);
          toast({ title: "Parabéns! 🔥", description: "Todos os hábitos do dia concluídos!" });
        } else {
          toast({ title: "Hábito registrado!", description: `${habit.name} concluído.` });
        }
      }
    } else {
      const { error } = await supabase.from('daily_habits').delete()
        .eq('user_id', userId).eq('habit_type', habit.id).eq('completed_date', today);

      if (!error) {
        queryClient.setQueryData(['habits', userId], (old: HabitDefinition[] | undefined) => 
          old?.map(h => h.id === habit.id ? { ...h, completed: false } : h) || []
        );
      }
    }
  }, [userId, habits, updateStreak, toast, queryClient]);

  if (loadingHabits) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map(i => (
          <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  const completedCount = habits.filter(h => h.completed).length;
  const allCompleted = completedCount === habits.length && habits.length > 0;

  return (
    <div className="space-y-4">
      {/* Streak indicator */}
      {streak.current_streak > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{streak.current_streak} dias</p>
              <p className="text-[10px] text-muted-foreground">Sequência atual</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Recorde</p>
            <p className="text-sm font-bold text-orange-500">{streak.best_streak} dias</p>
          </div>
        </motion.div>
      )}

      {/* New Achievement Popup */}
      <AnimatePresence>
        {newAchievement && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 text-center"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5 }}
            >
              <newAchievement.icon className={cn("w-12 h-12 mx-auto mb-2", newAchievement.color)} />
            </motion.div>
            <h3 className="font-bold text-foreground">Nova Conquista!</h3>
            <p className={cn("text-sm font-medium", newAchievement.color)}>{newAchievement.title}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Habits grid */}
      <div className="grid grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {habits.map((habit) => (
            <HabitItem
              key={habit.id}
              habit={habit}
              isCelebrating={celebratingHabit === habit.id}
              onToggle={() => toggleHabit(habit)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Achievements earned */}
      {earnedAchievements.length > 0 && (
        <div className="pt-2">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Suas conquistas</h4>
          <div className="flex flex-wrap gap-2">
            {ACHIEVEMENTS.filter(a => earnedAchievements.includes(a.type)).map((achievement) => (
              <motion.div
                key={achievement.type}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium",
                  "bg-muted/50 border border-border/50"
                )}
              >
                <achievement.icon className={cn("w-3 h-3", achievement.color)} />
                <span className="text-foreground">{achievement.title}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* All completed celebration */}
      <AnimatePresence>
        {allCompleted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 text-center"
          >
            <Sparkles className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="font-semibold text-foreground">Dia completo!</p>
            <p className="text-xs text-muted-foreground">Todos os hábitos concluídos</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
