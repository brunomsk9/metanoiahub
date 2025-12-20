import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserChurchId } from '@/hooks/useUserChurchId';
import { Loader2, History, ArrowRight, UserPlus, UserMinus, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface HistoryEntry {
  id: string;
  discipulo_id: string;
  discipulo_nome: string;
  old_discipulador_id: string | null;
  old_discipulador_nome: string | null;
  new_discipulador_id: string | null;
  new_discipulador_nome: string | null;
  changed_by: string;
  changed_by_nome: string;
  change_type: 'assigned' | 'transferred' | 'removed';
  notes: string | null;
  created_at: string;
}

export function DiscipleshipHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { churchId } = useUserChurchId();

  useEffect(() => {
    if (churchId) {
      fetchHistory();
    }
  }, [churchId]);

  const fetchHistory = async () => {
    if (!churchId) return;
    
    setLoading(true);
    try {
      // Fetch history entries
      const { data: historyData, error } = await supabase
        .from('discipleship_history')
        .select('*')
        .eq('church_id', churchId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (!historyData || historyData.length === 0) {
        setHistory([]);
        setLoading(false);
        return;
      }

      // Get all unique user IDs
      const userIds = new Set<string>();
      historyData.forEach(entry => {
        userIds.add(entry.discipulo_id);
        if (entry.old_discipulador_id) userIds.add(entry.old_discipulador_id);
        if (entry.new_discipulador_id) userIds.add(entry.new_discipulador_id);
        userIds.add(entry.changed_by);
      });

      // Fetch profiles for all users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome')
        .in('id', Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.id, p.nome]) || []);

      // Map history with names
      const historyWithNames: HistoryEntry[] = historyData.map(entry => ({
        ...entry,
        change_type: entry.change_type as 'assigned' | 'transferred' | 'removed',
        discipulo_nome: profileMap.get(entry.discipulo_id) || 'Usuário desconhecido',
        old_discipulador_nome: entry.old_discipulador_id 
          ? profileMap.get(entry.old_discipulador_id) || 'Usuário desconhecido' 
          : null,
        new_discipulador_nome: entry.new_discipulador_id 
          ? profileMap.get(entry.new_discipulador_id) || 'Usuário desconhecido' 
          : null,
        changed_by_nome: profileMap.get(entry.changed_by) || 'Sistema',
      }));

      setHistory(historyWithNames);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'assigned':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'transferred':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'removed':
        return <UserMinus className="h-4 w-4 text-red-500" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const getChangeTypeBadge = (type: string) => {
    switch (type) {
      case 'assigned':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Atribuído</Badge>;
      case 'transferred':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Transferido</Badge>;
      case 'removed':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">Removido</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getChangeDescription = (entry: HistoryEntry) => {
    switch (entry.change_type) {
      case 'assigned':
        return (
          <span className="text-sm text-muted-foreground">
            <strong className="text-foreground">{entry.discipulo_nome}</strong> foi atribuído a{' '}
            <strong className="text-foreground">{entry.new_discipulador_nome}</strong>
          </span>
        );
      case 'transferred':
        return (
          <span className="text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
            <strong className="text-foreground">{entry.discipulo_nome}</strong> transferido de{' '}
            <strong className="text-foreground">{entry.old_discipulador_nome}</strong>
            <ArrowRight className="h-3 w-3" />
            <strong className="text-foreground">{entry.new_discipulador_nome}</strong>
          </span>
        );
      case 'removed':
        return (
          <span className="text-sm text-muted-foreground">
            <strong className="text-foreground">{entry.discipulo_nome}</strong> foi removido de{' '}
            <strong className="text-foreground">{entry.old_discipulador_nome}</strong>
          </span>
        );
      default:
        return <span className="text-sm text-muted-foreground">Mudança registrada</span>;
    }
  };

  const filteredHistory = history.filter(entry =>
    entry.discipulo_nome.toLowerCase().includes(search.toLowerCase()) ||
    entry.old_discipulador_nome?.toLowerCase().includes(search.toLowerCase()) ||
    entry.new_discipulador_nome?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Histórico de Mudanças</h3>
          <Badge variant="secondary">{history.length} registro(s)</Badge>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <History className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {search ? 'Nenhum registro encontrado.' : 'Nenhuma mudança registrada ainda.'}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            O histórico será preenchido automaticamente quando houver mudanças nos relacionamentos de discipulado.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="divide-y divide-border">
            {filteredHistory.map((entry) => (
              <div key={entry.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getChangeTypeIcon(entry.change_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getChangeTypeBadge(entry.change_type)}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(entry.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    {getChangeDescription(entry)}
                    {entry.notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        "{entry.notes}"
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Alterado por: {entry.changed_by_nome}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <Button variant="outline" size="sm" onClick={fetchHistory}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>
    </div>
  );
}
