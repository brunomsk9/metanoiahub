import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, GraduationCap } from 'lucide-react';

interface Course {
  id: string;
  titulo: string;
  descricao: string | null;
  track_id: string;
  thumbnail: string | null;
  duracao_minutos: number | null;
  ordem: number;
}

interface Track {
  id: string;
  titulo: string;
}

export function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    track_id: '',
    thumbnail: '',
    duracao_minutos: 0,
    ordem: 0
  });

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
        ordem: course.ordem
      });
    } else {
      setEditing(null);
      setForm({ titulo: '', descricao: '', track_id: '', thumbnail: '', duracao_minutos: 0, ordem: courses.length });
    }
    setDialogOpen(true);
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
      ordem: form.ordem
    };

    if (editing) {
      const { error } = await supabase.from('courses').update(payload).eq('id', editing.id);
      if (error) toast.error('Erro ao atualizar curso');
      else {
        toast.success('Curso atualizado!');
        setDialogOpen(false);
        fetchData();
      }
    } else {
      const { error } = await supabase.from('courses').insert(payload);
      if (error) toast.error('Erro ao criar curso');
      else {
        toast.success('Curso criado!');
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
          <DialogContent className="bg-white border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-gray-900">{editing ? 'Editar Curso' : 'Novo Curso'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Título *</Label>
                <Input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ex: 01 - Identidade em Cristo"
                  className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Trilha *</Label>
                <Select value={form.track_id} onValueChange={(v) => setForm({ ...form, track_id: v })}>
                  <SelectTrigger className="border-gray-300 bg-white">
                    <SelectValue placeholder="Selecione uma trilha" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {tracks.map((track) => (
                      <SelectItem key={track.id} value={track.id}>
                        {track.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Descrição</Label>
                <Textarea
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descrição do curso..."
                  className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">URL da Thumbnail</Label>
                <Input
                  value={form.thumbnail}
                  onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                  placeholder="https://..."
                  className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">Duração (min)</Label>
                  <Input
                    type="number"
                    value={form.duracao_minutos}
                    onChange={(e) => setForm({ ...form, duracao_minutos: parseInt(e.target.value) || 0 })}
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
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
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
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courses.map((course) => (
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
    </div>
  );
}
