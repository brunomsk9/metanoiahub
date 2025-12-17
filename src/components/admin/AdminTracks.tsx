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

const ITEMS_PER_PAGE = 10;

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
  const [currentPage, setCurrentPage] = useState(1);
  
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    categoria: '',
    cover_image: '',
    ordem: 0,
    publico_alvo: ['discipulo'] as AppRole[],
    is_base: false
  });

  const totalPages = Math.ceil(tracks.length / ITEMS_PER_PAGE);
  const paginatedTracks = tracks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
      is_base: form.is_base
    };

    if (editing) {
      const { error } = await supabase
        .from('tracks')
        .update(payload)
        .eq('id', editing.id);

      if (error) {
        toast.error('Erro ao atualizar trilha');
      } else {
        toast.success('Trilha atualizada!');
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
        toast.success('Trilha criada!');
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
          <DialogContent className="bg-white border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-gray-900">{editing ? 'Editar Trilha' : 'Nova Trilha'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Título *</Label>
                <Input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ex: Jornada Metanoia"
                  className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Categoria *</Label>
                <Input
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  placeholder="Ex: Fundamentos"
                  className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Público Alvo *</Label>
                <div className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="discipulo"
                      checked={form.publico_alvo.includes('discipulo')}
                      onCheckedChange={() => togglePublicoAlvo('discipulo')}
                    />
                    <label htmlFor="discipulo" className="text-sm text-gray-700 flex items-center gap-1 cursor-pointer">
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
                    <label htmlFor="discipulador" className="text-sm text-gray-700 flex items-center gap-1 cursor-pointer">
                      <UserCheck className="h-4 w-4" />
                      Discipuladores
                    </label>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Selecione quem terá acesso a esta trilha</p>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Descrição</Label>
                <Textarea
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descrição da trilha..."
                  className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">URL da Capa</Label>
                <Input
                  value={form.cover_image}
                  onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
                  placeholder="https://..."
                  className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Ordem</Label>
                <Input
                  type="number"
                  value={form.ordem}
                  onChange={(e) => setForm({ ...form, ordem: parseInt(e.target.value) || 0 })}
                  className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
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
              <Button onClick={handleSave} disabled={saving} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editing ? 'Salvar Alterações' : 'Criar Trilha'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {tracks.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma trilha cadastrada ainda.</p>
            <Button 
              onClick={() => handleOpenDialog()} 
              variant="outline" 
              className="mt-4 border-gray-300 text-gray-700"
            >
              Criar primeira trilha
            </Button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Ordem</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Título</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 hidden sm:table-cell">Categoria</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 hidden md:table-cell">Público</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 hidden lg:table-cell">Tipo</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedTracks.map((track) => (
                <tr key={track.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-500">{track.ordem}</td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{track.titulo}</p>
                      {track.descricao && (
                        <p className="text-sm text-gray-500 truncate max-w-xs">{track.descricao}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <span className="inline-flex px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">
                      {track.categoria}
                    </span>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                      {getPublicoAlvoLabel(track.publico_alvo)}
                    </span>
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell">
                    {track.is_base && (
                      <span className="inline-flex px-2 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium">
                        Alicerce
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(track)} className="h-8 w-8 text-gray-500 hover:text-gray-700">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(track.id)} className="h-8 w-8 text-gray-500 hover:text-red-600">
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, tracks.length)} de {tracks.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">
              {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}