import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

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
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Cursos ({courses.length})</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Curso
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Curso' : 'Novo Curso'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
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
                  <SelectContent>
                    {tracks.map((track) => (
                      <SelectItem key={track.id} value={track.id}>
                        {track.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editing ? 'Salvar Alterações' : 'Criar Curso'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {courses.map((course) => (
          <Card key={course.id} className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{course.titulo}</CardTitle>
                  <p className="text-sm text-muted-foreground">{getTrackName(course.track_id)}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(course)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(course.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {course.descricao && (
              <CardContent>
                <p className="text-sm text-muted-foreground">{course.descricao}</p>
              </CardContent>
            )}
          </Card>
        ))}

        {courses.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nenhum curso cadastrado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
