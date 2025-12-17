import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, GraduationCap, Users, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { SaveSuccess, useSaveSuccess } from '@/components/ui/save-success';

type AppRole = Database['public']['Enums']['app_role'];

interface Course {
  id: string;
  titulo: string;
  descricao: string | null;
  track_id: string;
  thumbnail: string | null;
  duracao_minutos: number | null;
  ordem: number;
  publico_alvo: AppRole[];
}

interface Track {
  id: string;
  titulo: string;
}

const ITEMS_PER_PAGE = 10;

export function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { showSuccess, successMessage, triggerSuccess } = useSaveSuccess();
  
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    track_id: '',
    thumbnail: '',
    duracao_minutos: 0,
    ordem: 0,
    publico_alvo: ['discipulo'] as AppRole[]
  });

  const totalPages = Math.ceil(courses.length / ITEMS_PER_PAGE);
  const paginatedCourses = courses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [coursesRes, tracksRes] = await Promise.all([
      supabase.from('courses').select('*').order('ordem'),
      supabase.from('tracks').select('id, titulo').order('ordem')
    ]);

    if (coursesRes.error) toast.error('Erro ao carregar cursos');
    else setCourses(coursesRes.data || []);

    if (tracksRes.error) toast.error('Erro ao carregar trilhas');
    else setTracks(tracksRes.data || []);

    setLoading(false);
  };

  const handleOpenDialog = (course?: Course) => {
    if (course) {
      setEditing(course);
      setForm({
        titulo: course.titulo,
        descricao: course.descricao || '',
        track_id: course.track_id,
        thumbnail: course.thumbnail || '',
        duracao_minutos: course.duracao_minutos || 0,
        ordem: course.ordem,
        publico_alvo: course.publico_alvo || ['discipulo']
      });
    } else {
      setEditing(null);
      setForm({ titulo: '', descricao: '', track_id: '', thumbnail: '', duracao_minutos: 0, ordem: courses.length, publico_alvo: ['discipulo'] });
    }
    setDialogOpen(true);
  };

  const togglePublicoAlvo = (role: AppRole) => {
    const current = form.publico_alvo;
    if (current.includes(role)) {
      if (current.length > 1) {
        setForm({ ...form, publico_alvo: current.filter(r => r !== role) });
      }
    } else {
      setForm({ ...form, publico_alvo: [...current, role] });
    }
  };

  const handleSave = async () => {
    if (!form.titulo || !form.track_id) {
      toast.error('Título e trilha são obrigatórios');
      return;
    }

    setSaving(true);

    const payload = {
      titulo: form.titulo,
      descricao: form.descricao || null,
      track_id: form.track_id,
      thumbnail: form.thumbnail || null,
      duracao_minutos: form.duracao_minutos,
      ordem: form.ordem,
      publico_alvo: form.publico_alvo
    };

    if (editing) {
      const { error } = await supabase.from('courses').update(payload).eq('id', editing.id);
      if (error) toast.error('Erro ao atualizar curso');
      else {
        triggerSuccess('Curso atualizado!');
        setDialogOpen(false);
        fetchData();
      }
    } else {
      const { error } = await supabase.from('courses').insert(payload);
      if (error) toast.error('Erro ao criar curso');
      else {
        triggerSuccess('Curso criado!');
        setDialogOpen(false);
        fetchData();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este curso?')) return;

    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) toast.error('Erro ao excluir curso');
    else {
      toast.success('Curso excluído!');
      fetchData();
    }
  };

  const getTrackName = (trackId: string) => {
    return tracks.find(t => t.id === trackId)?.titulo || 'Sem trilha';
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
        <p className="text-gray-500">{courses.length} curso(s) cadastrado(s)</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-amber-600 hover:bg-amber-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Novo Curso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Curso' : 'Novo Curso'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ex: 01 - Identidade em Cristo"
                />
              </div>
              <div className="space-y-2">
                <Label>Trilha *</Label>
                <Select value={form.track_id} onValueChange={(v) => setForm({ ...form, track_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma trilha" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {tracks.map((track) => (
                      <SelectItem key={track.id} value={track.id}>
                        {track.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Público Alvo *</Label>
                <div className="flex gap-4 p-3 bg-muted/50 rounded-lg border border-border/50">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="course-discipulo"
                      checked={form.publico_alvo.includes('discipulo')}
                      onCheckedChange={() => togglePublicoAlvo('discipulo')}
                    />
                    <label htmlFor="course-discipulo" className="text-sm text-foreground flex items-center gap-1 cursor-pointer">
                      <Users className="h-4 w-4" />
                      Discípulos
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="course-discipulador"
                      checked={form.publico_alvo.includes('discipulador')}
                      onCheckedChange={() => togglePublicoAlvo('discipulador')}
                    />
                    <label htmlFor="course-discipulador" className="text-sm text-foreground flex items-center gap-1 cursor-pointer">
                      <UserCheck className="h-4 w-4" />
                      Discipuladores
                    </label>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Selecione quem terá acesso a este curso</p>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descrição do curso..."
                />
              </div>
              <div className="space-y-2">
                <Label>URL da Thumbnail</Label>
                <Input
                  value={form.thumbnail}
                  onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duração (min)</Label>
                  <Input
                    type="number"
                    value={form.duracao_minutos}
                    onChange={(e) => setForm({ ...form, duracao_minutos: parseInt(e.target.value) || 0 })}
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
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full bg-primary hover:bg-primary/90">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editing ? 'Salvar Alterações' : 'Criar Curso'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {courses.length === 0 ? (
          <div className="p-12 text-center">
            <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum curso cadastrado ainda.</p>
            <p className="text-sm text-gray-400 mt-1">Crie uma trilha primeiro, depois adicione cursos.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Ordem</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Título</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 hidden sm:table-cell">Trilha</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 hidden md:table-cell">Público</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedCourses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-500">{course.ordem}</td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{course.titulo}</p>
                      {course.duracao_minutos ? (
                        <p className="text-sm text-gray-500">{course.duracao_minutos} min</p>
                      ) : null}
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <span className="text-gray-600">{getTrackName(course.track_id)}</span>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                      {getPublicoAlvoLabel(course.publico_alvo)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(course)} className="h-8 w-8 text-gray-500 hover:text-gray-700">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(course.id)} className="h-8 w-8 text-gray-500 hover:text-red-600">
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
            Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, courses.length)} de {courses.length}
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
      <SaveSuccess show={showSuccess} message={successMessage} />
    </div>
  );
}