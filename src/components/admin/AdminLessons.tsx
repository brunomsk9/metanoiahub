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
import { Plus, Pencil, Trash2, Loader2, Video, FileText, ListChecks } from 'lucide-react';

interface Lesson {
  id: string;
  titulo: string;
  course_id: string;
  tipo: 'video' | 'texto' | 'checklist_interativo';
  video_url: string | null;
  texto_apoio: string | null;
  checklist_items: any;
  duracao_minutos: number | null;
  ordem: number;
}

interface Course {
  id: string;
  titulo: string;
}

const tipoIcons = {
  video: Video,
  texto: FileText,
  checklist_interativo: ListChecks
};

const tipoLabels = {
  video: 'Vídeo',
  texto: 'Texto',
  checklist_interativo: 'Checklist'
};

export function AdminLessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    titulo: '',
    course_id: '',
    tipo: 'video' as 'video' | 'texto' | 'checklist_interativo',
    video_url: '',
    texto_apoio: '',
    checklist_items: '[]',
    duracao_minutos: 0,
    ordem: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [lessonsRes, coursesRes] = await Promise.all([
      supabase.from('lessons').select('*').order('ordem'),
      supabase.from('courses').select('id, titulo').order('ordem')
    ]);

    if (lessonsRes.error) toast.error('Erro ao carregar lições');
    else setLessons(lessonsRes.data || []);

    if (coursesRes.error) toast.error('Erro ao carregar cursos');
    else setCourses(coursesRes.data || []);

    setLoading(false);
  };

  const handleOpenDialog = (lesson?: Lesson) => {
    if (lesson) {
      setEditing(lesson);
      setForm({
        titulo: lesson.titulo,
        course_id: lesson.course_id,
        tipo: lesson.tipo,
        video_url: lesson.video_url || '',
        texto_apoio: lesson.texto_apoio || '',
        checklist_items: JSON.stringify(lesson.checklist_items || [], null, 2),
        duracao_minutos: lesson.duracao_minutos || 0,
        ordem: lesson.ordem
      });
    } else {
      setEditing(null);
      setForm({
        titulo: '',
        course_id: '',
        tipo: 'video',
        video_url: '',
        texto_apoio: '',
        checklist_items: '[]',
        duracao_minutos: 0,
        ordem: lessons.length
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.titulo || !form.course_id) {
      toast.error('Título e curso são obrigatórios');
      return;
    }

    let checklistParsed;
    try {
      checklistParsed = JSON.parse(form.checklist_items);
    } catch {
      toast.error('JSON do checklist inválido');
      return;
    }

    setSaving(true);

    const payload = {
      titulo: form.titulo,
      course_id: form.course_id,
      tipo: form.tipo,
      video_url: form.video_url || null,
      texto_apoio: form.texto_apoio || null,
      checklist_items: checklistParsed,
      duracao_minutos: form.duracao_minutos,
      ordem: form.ordem
    };

    if (editing) {
      const { error } = await supabase.from('lessons').update(payload).eq('id', editing.id);
      if (error) toast.error('Erro ao atualizar lição');
      else {
        toast.success('Lição atualizada!');
        setDialogOpen(false);
        fetchData();
      }
    } else {
      const { error } = await supabase.from('lessons').insert(payload);
      if (error) toast.error('Erro ao criar lição');
      else {
        toast.success('Lição criada!');
        setDialogOpen(false);
        fetchData();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta lição?')) return;

    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (error) toast.error('Erro ao excluir lição');
    else {
      toast.success('Lição excluída!');
      fetchData();
    }
  };

  const getCourseName = (courseId: string) => {
    return courses.find(c => c.id === courseId)?.titulo || 'Sem curso';
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
        <h2 className="text-xl font-semibold text-foreground">Lições ({lessons.length})</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Lição
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Lição' : 'Nova Lição'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ex: Introdução ao Discipulado"
                />
              </div>
              <div className="space-y-2">
                <Label>Curso *</Label>
                <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Vídeo</SelectItem>
                    <SelectItem value="texto">Texto</SelectItem>
                    <SelectItem value="checklist_interativo">Checklist Interativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.tipo === 'video' && (
                <div className="space-y-2">
                  <Label>URL do Vídeo</Label>
                  <Input
                    value={form.video_url}
                    onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                    placeholder="https://youtube.com/..."
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Texto de Apoio</Label>
                <Textarea
                  value={form.texto_apoio}
                  onChange={(e) => setForm({ ...form, texto_apoio: e.target.value })}
                  placeholder="Conteúdo de apoio da lição..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Checklist Items (JSON)</Label>
                <Textarea
                  value={form.checklist_items}
                  onChange={(e) => setForm({ ...form, checklist_items: e.target.value })}
                  placeholder='[{"id": "1", "label": "Item 1"}]'
                  rows={4}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Formato: [{"{"}"id": "1", "label": "Texto do item"{"}"}]
                </p>
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
                {editing ? 'Salvar Alterações' : 'Criar Lição'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {lessons.map((lesson) => {
          const Icon = tipoIcons[lesson.tipo];
          return (
            <Card key={lesson.id} className="bg-card border-border">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{lesson.titulo}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {getCourseName(lesson.course_id)} • {tipoLabels[lesson.tipo]}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(lesson)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(lesson.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}

        {lessons.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma lição cadastrada ainda.
          </p>
        )}
      </div>
    </div>
  );
}
