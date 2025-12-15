import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, FileText, Video, ListChecks } from 'lucide-react';

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

const tipoLabels = {
  video: 'Vídeo',
  texto: 'Texto',
  checklist_interativo: 'Checklist'
};

const tipoColors = {
  video: 'bg-blue-100 text-blue-700',
  texto: 'bg-green-100 text-green-700',
  checklist_interativo: 'bg-purple-100 text-purple-700'
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
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-500">{lessons.length} lição(ões) cadastrada(s)</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-amber-600 hover:bg-amber-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nova Lição
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-gray-200 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-gray-900">{editing ? 'Editar Lição' : 'Nova Lição'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Título *</Label>
                <Input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ex: Introdução ao Discipulado"
                  className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Curso *</Label>
                <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v })}>
                  <SelectTrigger className="border-gray-300 bg-white">
                    <SelectValue placeholder="Selecione um curso" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as any })}>
                  <SelectTrigger className="border-gray-300 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="video">Vídeo</SelectItem>
                    <SelectItem value="texto">Texto</SelectItem>
                    <SelectItem value="checklist_interativo">Checklist Interativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.tipo === 'video' && (
                <div className="space-y-2">
                  <Label className="text-gray-700">URL do Vídeo</Label>
                  <Input
                    value={form.video_url}
                    onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                    placeholder="https://youtube.com/..."
                    className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-gray-700">Texto de Apoio</Label>
                <Textarea
                  value={form.texto_apoio}
                  onChange={(e) => setForm({ ...form, texto_apoio: e.target.value })}
                  placeholder="Conteúdo de apoio da lição..."
                  rows={4}
                  className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Checklist Items (JSON)</Label>
                <Textarea
                  value={form.checklist_items}
                  onChange={(e) => setForm({ ...form, checklist_items: e.target.value })}
                  placeholder='[{"id": "1", "label": "Item 1"}]'
                  rows={4}
                  className="font-mono text-sm border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                />
                <p className="text-xs text-gray-500">
                  Formato: [{"{"}"id": "1", "label": "Texto do item"{"}"}]
                </p>
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
                {editing ? 'Salvar Alterações' : 'Criar Lição'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {lessons.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma lição cadastrada ainda.</p>
            <p className="text-sm text-gray-400 mt-1">Crie um curso primeiro, depois adicione lições.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Ordem</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Título</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 hidden sm:table-cell">Tipo</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 hidden md:table-cell">Curso</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lessons.map((lesson) => (
                <tr key={lesson.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-500">{lesson.ordem}</td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">{lesson.titulo}</p>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${tipoColors[lesson.tipo]}`}>
                      {tipoLabels[lesson.tipo]}
                    </span>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className="text-gray-600 text-sm">{getCourseName(lesson.course_id)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(lesson)} className="h-8 w-8 text-gray-500 hover:text-gray-700">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(lesson.id)} className="h-8 w-8 text-gray-500 hover:text-red-600">
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
