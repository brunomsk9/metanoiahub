import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, BookOpen, Users, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { SaveSuccess, useSaveSuccess } from '@/components/ui/save-success';
import { useUserChurchId } from '@/hooks/useUserChurchId';
import { SortableHeader } from '@/components/ui/sortable-header';
import { useSorting } from '@/hooks/useSorting';
import { usePagination } from '@/hooks/usePagination';

type AppRole = Database['public']['Enums']['app_role'];

interface Track {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: string;
  cover_image: string | null;
  ordem: number;
  publico_alvo: AppRole[];
  is_base: boolean;
}

export function AdminTracks() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Track | null>(null);
  const [saving, setSaving] = useState(false);
  const { showSuccess, successMessage, triggerSuccess } = useSaveSuccess();
  const { churchId } = useUserChurchId();
  
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    categoria: '',
    cover_image: '',
    ordem: 0,
    publico_alvo: ['discipulo'] as AppRole[],
    is_base: false
  });

  // Sorting and pagination
  const sorting = useSorting({ data: tracks, defaultSortKey: 'ordem', defaultDirection: 'asc' });
  const pagination = usePagination({ data: sorting.sortedData, pageSize: 10 });

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .order('ordem');

    if (error) {
      toast.error('Erro ao carregar trilhas');
    } else {
      setTracks(data || []);
    }
    setLoading(false);
  };

  const handleOpenDialog = (track?: Track) => {
    if (track) {
      setEditing(track);
      setForm({
        titulo: track.titulo,
        descricao: track.descricao || '',
        categoria: track.categoria,
        cover_image: track.cover_image || '',
        ordem: track.ordem,
        publico_alvo: track.publico_alvo || ['discipulo'],
        is_base: track.is_base || false
      });
    } else {
      setEditing(null);
      setForm({ titulo: '', descricao: '', categoria: '', cover_image: '', ordem: tracks.length, publico_alvo: ['discipulo'], is_base: false });
    }
    setDialogOpen(true);
  };

  const togglePublicoAlvo = (role: AppRole) => {
    const current = form.publico_alvo;
    if (current.includes(role)) {
      // Don't allow removing all roles
      if (current.length > 1) {
        setForm({ ...form, publico_alvo: current.filter(r => r !== role) });
      }
    } else {
      setForm({ ...form, publico_alvo: [...current, role] });
    }
  };

  const handleSave = async () => {
    if (!form.titulo || !form.categoria) {
      toast.error('Título e categoria são obrigatórios');
      return;
    }

    if (!churchId) {
      toast.error('Erro: Usuário não está associado a uma igreja');
      return;
    }

    setSaving(true);

    // If setting this track as base, unset any existing base track first
    if (form.is_base) {
      await supabase.from('tracks').update({ is_base: false }).eq('is_base', true);
    }

    const payload = {
      titulo: form.titulo,
      descricao: form.descricao || null,
      categoria: form.categoria,
      cover_image: form.cover_image || null,
      ordem: form.ordem,
      publico_alvo: form.publico_alvo,
      is_base: form.is_base,
      church_id: churchId
    };

    if (editing) {
      const { error } = await supabase
        .from('tracks')
        .update(payload)
        .eq('id', editing.id);

      if (error) {
        toast.error('Erro ao atualizar trilha');
      } else {
        triggerSuccess('Trilha atualizada!');
        setDialogOpen(false);
        fetchTracks();
      }
    } else {
      const { error } = await supabase
        .from('tracks')
        .insert(payload);

      if (error) {
        toast.error('Erro ao criar trilha');
      } else {
        triggerSuccess('Trilha criada!');
        setDialogOpen(false);
        fetchTracks();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta trilha?')) return;

    const { error } = await supabase.from('tracks').delete().eq('id', id);

    if (error) {
      toast.error('Erro ao excluir trilha');
    } else {
      toast.success('Trilha excluída!');
      fetchTracks();
    }
  };

  const getPublicoAlvoLabel = (publico_alvo: AppRole[]) => {
    if (publico_alvo.includes('discipulo') && publico_alvo.includes('discipulador')) {
      return 'Todos';
    }
    if (publico_alvo.includes('discipulador')) {
      return 'Discipuladores';
    }
    return 'Discípulos';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-500">{tracks.length} trilha(s) cadastrada(s)</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-amber-600 hover:bg-amber-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nova Trilha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Trilha' : 'Nova Trilha'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ex: Jornada Metanoia"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Input
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  placeholder="Ex: Fundamentos"
                />
              </div>
              <div className="space-y-2">
                <Label>Público Alvo *</Label>
                <div className="flex gap-4 p-3 bg-muted/50 rounded-lg border border-border/50">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="discipulo"
                      checked={form.publico_alvo.includes('discipulo')}
                      onCheckedChange={() => togglePublicoAlvo('discipulo')}
                    />
                    <label htmlFor="discipulo" className="text-sm text-foreground flex items-center gap-1 cursor-pointer">
                      <Users className="h-4 w-4" />
                      Discípulos
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="discipulador"
                      checked={form.publico_alvo.includes('discipulador')}
                      onCheckedChange={() => togglePublicoAlvo('discipulador')}
                    />
                    <label htmlFor="discipulador" className="text-sm text-foreground flex items-center gap-1 cursor-pointer">
                      <UserCheck className="h-4 w-4" />
                      Discipuladores
                    </label>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Selecione quem terá acesso a esta trilha</p>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descrição da trilha..."
                />
              </div>
              <div className="space-y-2">
                <Label>URL da Capa</Label>
                <Input
                  value={form.cover_image}
                  onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={form.ordem}
                  onChange={(e) => setForm({ ...form, ordem: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <Checkbox 
                  id="is_base"
                  checked={form.is_base}
                  onCheckedChange={(checked) => setForm({ ...form, is_base: !!checked })}
                />
                <label htmlFor="is_base" className="text-sm text-foreground cursor-pointer">
                  <span className="font-medium">Trilha Alicerce</span>
                  <p className="text-xs text-muted-foreground">Marque se esta é a trilha inicial obrigatória</p>
                </label>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full bg-primary hover:bg-primary/90">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editing ? 'Salvar Alterações' : 'Criar Trilha'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-effect rounded-xl border border-primary/20 overflow-hidden">
        {tracks.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma trilha cadastrada ainda.</p>
            <Button 
              onClick={() => handleOpenDialog()} 
              variant="outline" 
              className="mt-4"
            >
              Criar primeira trilha
            </Button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-card/80 border-b border-primary/10">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-foreground">
                  <SortableHeader 
                    sortState={sorting.getSortIcon('ordem')} 
                    onClick={() => sorting.toggleSort('ordem')}
                  >
                    Ordem
                  </SortableHeader>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-foreground">
                  <SortableHeader 
                    sortState={sorting.getSortIcon('titulo')} 
                    onClick={() => sorting.toggleSort('titulo')}
                  >
                    Título
                  </SortableHeader>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-foreground hidden sm:table-cell">
                  <SortableHeader 
                    sortState={sorting.getSortIcon('categoria')} 
                    onClick={() => sorting.toggleSort('categoria')}
                  >
                    Categoria
                  </SortableHeader>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-foreground hidden md:table-cell">Público</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-foreground hidden lg:table-cell">Tipo</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {pagination.paginatedData.map((track) => (
                <tr key={track.id} className="hover:bg-primary/5 transition-colors">
                  <td className="py-3 px-4 text-muted-foreground">{track.ordem}</td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-foreground">{track.titulo}</p>
                      {track.descricao && (
                        <p className="text-sm text-muted-foreground truncate max-w-xs">{track.descricao}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {track.categoria}
                    </span>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {getPublicoAlvoLabel(track.publico_alvo)}
                    </span>
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell">
                    {track.is_base && (
                      <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-primary/20 text-primary border border-primary/30">
                        Alicerce
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(track)} className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-primary/10">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(track.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Mostrando {pagination.startIndex + 1} a {pagination.endIndex} de {sorting.sortedData.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={pagination.prevPage}
              disabled={pagination.currentPage === 1}
              className="h-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {pagination.currentPage} de {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={pagination.nextPage}
              disabled={pagination.currentPage === pagination.totalPages}
              className="h-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      <SaveSuccess show={showSuccess} message={successMessage} />
    </div>
  );
}