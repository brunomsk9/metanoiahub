import { useState, useEffect } from "react";
import { 
  BookOpen, Heart, Star, Sun, Moon, Zap, Target, 
  Coffee, Dumbbell, Music, Smile, Plus, Trash2, GripVertical
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useUserChurchId } from '@/hooks/useUserChurchId';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  ordem: number;
  is_active: boolean;
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

export function AdminHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('star');
  const [newHabitColor, setNewHabitColor] = useState('primary');
  const { toast } = useToast();
  const { churchId } = useUserChurchId();

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    const { data, error } = await supabase
      .from('habit_definitions')
      .select('*')
      .order('ordem');

    if (data) {
      setHabits(data);
    }
    setLoading(false);
  };

  const addHabit = async () => {
    if (!newHabitName.trim()) return;

    if (!churchId) {
      toast({
        title: "Erro",
        description: "Usuário não está associado a uma igreja.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from('habit_definitions').insert({
      name: newHabitName,
      icon: newHabitIcon,
      color: newHabitColor,
      ordem: habits.length,
      church_id: churchId
    });

    if (!error) {
      setNewHabitName('');
      setNewHabitIcon('star');
      setNewHabitColor('primary');
      setShowAddDialog(false);
      fetchHabits();
      toast({
        title: "Hábito criado!",
        description: `"${newHabitName}" foi adicionado para todos os usuários.`,
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível criar o hábito.",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (habit: Habit) => {
    const { error } = await supabase
      .from('habit_definitions')
      .update({ is_active: !habit.is_active })
      .eq('id', habit.id);

    if (!error) {
      setHabits(prev => prev.map(h => 
        h.id === habit.id ? { ...h, is_active: !h.is_active } : h
      ));
      toast({
        title: habit.is_active ? "Hábito desativado" : "Hábito ativado",
        description: `"${habit.name}" foi ${habit.is_active ? 'desativado' : 'ativado'}.`,
      });
    }
  };

  const deleteHabit = async (habit: Habit) => {
    const { error } = await supabase
      .from('habit_definitions')
      .delete()
      .eq('id', habit.id);

    if (!error) {
      setHabits(prev => prev.filter(h => h.id !== habit.id));
      toast({
        title: "Hábito excluído",
        description: `"${habit.name}" foi removido.`,
      });
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Hábitos Diários</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os hábitos que todos os usuários verão em seu dashboard.
          </p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Hábito
            </Button>
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
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="w-24">Ícone</TableHead>
              <TableHead className="w-24">Cor</TableHead>
              <TableHead className="w-24">Ativo</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {habits.map((habit) => {
              const Icon = getIconComponent(habit.icon);
              const colorOption = COLOR_OPTIONS.find(c => c.id === habit.color);
              
              return (
                <TableRow key={habit.id} className={!habit.is_active ? 'opacity-50' : ''}>
                  <TableCell>
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                  </TableCell>
                  <TableCell className="font-medium">{habit.name}</TableCell>
                  <TableCell>
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={cn("w-6 h-6 rounded-full", colorOption?.class || 'bg-primary')} />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={habit.is_active}
                      onCheckedChange={() => toggleActive(habit)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteHabit(habit)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        <p><strong>Nota:</strong> Os hábitos criados aqui serão visíveis para todos os usuários da plataforma.</p>
        <p>Desativar um hábito o oculta do dashboard, mas mantém os dados históricos.</p>
      </div>
    </div>
  );
}
