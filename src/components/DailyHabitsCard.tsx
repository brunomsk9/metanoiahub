import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, Heart, Star, Sun, Moon, Zap, Target, 
  Coffee, Dumbbell, Music, Smile, Plus, X, Check,
  Sparkles, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface HabitDefinition {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  completed?: boolean;
}

interface DailyHabitsCardProps {
  userId: string;
  onHabitsChange?: (completed: number, total: number) => void;
}

const ICON_OPTIONS = [
  { id: 'book', icon: BookOpen, label: 'Livro' },
  { id: 'heart', icon: Heart, label: 'Coração' },
  { id: 'star', icon: Star, label: 'Estrela' },
  { id: 'sun', icon: Sun, label: 'Sol' },
  { id: 'moon', icon: Moon, label: 'Lua' },
  { id: 'zap', icon: Zap, label: 'Energia' },
  { id: 'target', icon: Target, label: 'Alvo' },
  { id: 'coffee', icon: Coffee, label: 'Café' },
  { id: 'dumbbell', icon: Dumbbell, label: 'Exercício' },
  { id: 'music', icon: Music, label: 'Música' },
  { id: 'smile', icon: Smile, label: 'Sorriso' },
];

const COLOR_OPTIONS = [
  { id: 'primary', class: 'bg-primary', label: 'Azul' },
  { id: 'rose', class: 'bg-rose-500', label: 'Rosa' },
  { id: 'orange', class: 'bg-orange-500', label: 'Laranja' },
  { id: 'green', class: 'bg-green-500', label: 'Verde' },
  { id: 'purple', class: 'bg-purple-500', label: 'Roxo' },
  { id: 'yellow', class: 'bg-yellow-500', label: 'Amarelo' },
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

export function DailyHabitsCard({ userId, onHabitsChange }: DailyHabitsCardProps) {
  const [habits, setHabits] = useState<HabitDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('star');
  const [newHabitColor, setNewHabitColor] = useState('primary');
  const [celebratingHabit, setCelebratingHabit] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchHabits();
  }, [userId]);

  useEffect(() => {
    const completed = habits.filter(h => h.completed).length;
    onHabitsChange?.(completed, habits.length);
  }, [habits, onHabitsChange]);

  const fetchHabits = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch habit definitions
    const { data: definitions } = await supabase
      .from('habit_definitions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('ordem');

    // If no habits exist, create defaults
    if (!definitions || definitions.length === 0) {
      await createDefaultHabits();
      return;
    }

    // Fetch today's completions
    const { data: completions } = await supabase
      .from('daily_habits')
      .select('habit_type')
      .eq('user_id', userId)
      .eq('completed_date', today);

    const completedIds = new Set(completions?.map(c => c.habit_type) || []);
    
    setHabits(definitions.map(h => ({
      ...h,
      completed: completedIds.has(h.id)
    })));
    setLoading(false);
  };

  const createDefaultHabits = async () => {
    const defaults = [
      { user_id: userId, name: 'Leitura Bíblica', icon: 'book', color: 'primary', is_default: true, ordem: 0 },
      { user_id: userId, name: 'Oração', icon: 'heart', color: 'rose', is_default: true, ordem: 1 },
    ];

    const { error } = await supabase.from('habit_definitions').insert(defaults);
    if (!error) {
      fetchHabits();
    }
  };

  const toggleHabit = async (habit: HabitDefinition) => {
    const today = new Date().toISOString().split('T')[0];
    
    if (!habit.completed) {
      // Mark as completed
      const { error } = await supabase
        .from('daily_habits')
        .insert({
          user_id: userId,
          habit_type: habit.id,
          completed_date: today,
        });

      if (!error) {
        setCelebratingHabit(habit.id);
        setTimeout(() => setCelebratingHabit(null), 1500);
        
        setHabits(prev => prev.map(h => 
          h.id === habit.id ? { ...h, completed: true } : h
        ));
        
        toast({
          title: "Parabéns! 🎉",
          description: `${habit.name} concluído!`,
        });
      }
    } else {
      // Remove completion
      const { error } = await supabase
        .from('daily_habits')
        .delete()
        .eq('user_id', userId)
        .eq('habit_type', habit.id)
        .eq('completed_date', today);

      if (!error) {
        setHabits(prev => prev.map(h => 
          h.id === habit.id ? { ...h, completed: false } : h
        ));
      }
    }
  };

  const addHabit = async () => {
    if (!newHabitName.trim()) return;

    const { error } = await supabase.from('habit_definitions').insert({
      user_id: userId,
      name: newHabitName,
      icon: newHabitIcon,
      color: newHabitColor,
      is_default: false,
      ordem: habits.length,
    });

    if (!error) {
      setNewHabitName('');
      setNewHabitIcon('star');
      setNewHabitColor('primary');
      setShowAddDialog(false);
      fetchHabits();
      toast({
        title: "Hábito criado!",
        description: `"${newHabitName}" foi adicionado aos seus hábitos diários.`,
      });
    }
  };

  const deleteHabit = async (habitId: string) => {
    const { error } = await supabase
      .from('habit_definitions')
      .delete()
      .eq('id', habitId)
      .eq('user_id', userId);

    if (!error) {
      setHabits(prev => prev.filter(h => h.id !== habitId));
      toast({
        title: "Hábito removido",
        description: "O hábito foi excluído com sucesso.",
      });
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map(i => (
          <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {habits.map((habit) => {
            const Icon = getIconComponent(habit.icon);
            const colors = getColorClass(habit.color);
            const isCelebrating = celebratingHabit === habit.id;

            return (
              <motion.button
                key={habit.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleHabit(habit)}
                className={cn(
                  "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 min-h-[100px] group",
                  habit.completed
                    ? `${colors.bgLight} ${colors.border} ${colors.text}`
                    : "bg-card border-border hover:border-primary/30"
                )}
              >
                {/* Celebration effect */}
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

                {/* Delete button */}
                {!habit.is_default && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteHabit(habit.id);
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/10 hover:bg-destructive/20"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                )}

                {/* Icon */}
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

                {/* Name */}
                <span className={cn(
                  "text-xs font-medium text-center line-clamp-2",
                  habit.completed ? colors.text : "text-muted-foreground"
                )}>
                  {habit.name}
                </span>

                {/* Completed indicator */}
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
          })}

          {/* Add habit button */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <motion.button
                layout
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-all min-h-[100px] bg-muted/30"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-2">
                  <Plus className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  Novo hábito
                </span>
              </motion.button>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar novo hábito</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nome do hábito</Label>
                  <Input
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    placeholder="Ex: Exercício físico"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ícone</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {ICON_OPTIONS.map(({ id, icon: IconComp }) => (
                      <button
                        key={id}
                        onClick={() => setNewHabitIcon(id)}
                        className={cn(
                          "p-2 rounded-lg border-2 transition-all",
                          newHabitIcon === id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/30"
                        )}
                      >
                        <IconComp className={cn(
                          "w-5 h-5 mx-auto",
                          newHabitIcon === id ? "text-primary" : "text-muted-foreground"
                        )} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="flex gap-2">
                    {COLOR_OPTIONS.map(({ id, class: bgClass }) => (
                      <button
                        key={id}
                        onClick={() => setNewHabitColor(id)}
                        className={cn(
                          "w-8 h-8 rounded-full transition-all",
                          bgClass,
                          newHabitColor === id
                            ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                            : "opacity-70 hover:opacity-100"
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={addHabit}
                    disabled={!newHabitName.trim()}
                    className="flex-1"
                  >
                    Criar hábito
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </AnimatePresence>
      </div>
    </div>
  );
}
