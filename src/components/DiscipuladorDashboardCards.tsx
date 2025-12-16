import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Flame, BookOpen } from "lucide-react";

interface DiscipleInfo {
  id: string;
  nome: string;
  current_streak: number;
  xp_points: number;
  alicerce_completed: boolean;
}

export function DiscipuladorDashboardCards() {
  const [disciples, setDisciples] = useState<DiscipleInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisciples();
  }, []);

  const fetchDisciples = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: relationships } = await supabase
      .from('discipleship_relationships')
      .select('discipulo_id, alicerce_completed_presencial')
      .eq('discipulador_id', session.user.id)
      .eq('status', 'active');

    if (relationships && relationships.length > 0) {
      const discipleIds = relationships.map(r => r.discipulo_id);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome, current_streak, xp_points')
        .in('id', discipleIds);

      if (profiles) {
        const disciplesWithProgress = profiles.map(p => ({
          ...p,
          alicerce_completed: relationships.find(r => r.discipulo_id === p.id)?.alicerce_completed_presencial || false
        }));
        setDisciples(disciplesWithProgress);
      }
    }

    setLoading(false);
  };

  if (loading) return null;
  if (disciples.length === 0) return null;

  const avgStreak = disciples.length > 0 
    ? Math.round(disciples.reduce((sum, d) => sum + d.current_streak, 0) / disciples.length)
    : 0;

  const alicerceCompleted = disciples.filter(d => d.alicerce_completed).length;

  return (
    <div className="space-y-3">
      
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl font-bold text-foreground">{disciples.length}</p>
          <p className="text-[10px] text-muted-foreground">Discípulos</p>
        </div>
        
        <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-xl font-bold text-foreground">{avgStreak}</p>
          <p className="text-[10px] text-muted-foreground">Média streak</p>
        </div>
        
        <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-xl font-bold text-foreground">{alicerceCompleted}</p>
          <p className="text-[10px] text-muted-foreground">Alicerce OK</p>
        </div>
      </div>

      {/* Quick list of disciples */}
      <div className="space-y-2">
        {disciples.slice(0, 3).map((disciple) => (
          <div 
            key={disciple.id}
            className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                {disciple.nome?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <span className="text-sm text-foreground">{disciple.nome || 'Sem nome'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Flame className="w-3 h-3 text-orange-500" />
              {disciple.current_streak}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
