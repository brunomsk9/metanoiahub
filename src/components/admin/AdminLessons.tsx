import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, FileText, X, Upload, Paperclip, FileImage, FileSpreadsheet, Presentation, File, ChevronLeft, ChevronRight } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';

const ITEMS_PER_PAGE = 10;

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
  materiais: string[];
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
  const [uploading, setUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [form, setForm] = useState({
    titulo: '',
    course_id: '',
    tipo: 'video' as 'video' | 'texto' | 'checklist_interativo',
    video_url: '',
    texto_apoio: '',
    checklist_items: '[]',
    duracao_minutos: 0,
    ordem: 0,
    materiais: [] as string[]
  });

  const totalPages = Math.ceil(lessons.length / ITEMS_PER_PAGE);
  const paginatedLessons = lessons.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [lessonsRes, coursesRes] = await Promise.all([
      supabase.from('lessons').select('*').order('ordem'),
      supabase.from('courses').select('id, titulo').order('ordem')
    ]);

    if (lessonsRes.error) toast.error('Erro ao carregar aulas');
    else {
      const lessonsData = (lessonsRes.data || []).map(lesson => ({
        ...lesson,
        materiais: Array.isArray(lesson.materiais) 
          ? (lesson.materiais as unknown as string[]) 
          : []
      })) as Lesson[];
      setLessons(lessonsData);
    }

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
        ordem: lesson.ordem,
        materiais: Array.isArray(lesson.materiais) ? lesson.materiais : []
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
        ordem: lessons.length,
        materiais: []
      });
    }
    setDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 10MB');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `aulas/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('materiais')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        toast.error('Erro ao fazer upload: ' + uploadError.message);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('materiais')
        .getPublicUrl(fileName);

      setForm(prev => ({
        ...prev,
        materiais: [...prev.materiais, publicUrl]
      }));
      toast.success('Arquivo anexado!');
    } catch (error) {
      toast.error('Erro ao fazer upload');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveMaterial = (index: number) => {
    setForm(prev => ({
      ...prev,
      materiais: prev.materiais.filter((_, i) => i !== index)
    }));
  };

  const getFileName = (url: string) => {
    return url.split('/').pop() || url;
  };

  const getFileIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase() || '';
    
    if (['pdf'].includes(ext)) {
      return <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />;
    }
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
      return <FileImage className="h-4 w-4 text-blue-500 flex-shrink-0" />;
    }
    if (['doc', 'docx'].includes(ext)) {
      return <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />;
    }
    if (['xls', 'xlsx'].includes(ext)) {
      return <FileSpreadsheet className="h-4 w-4 text-green-600 flex-shrink-0" />;
    }
    if (['ppt', 'pptx'].includes(ext)) {
      return <Presentation className="h-4 w-4 text-orange-500 flex-shrink-0" />;
    }
    return <File className="h-4 w-4 text-gray-500 flex-shrink-0" />;
  };

  const getFileTypeLabel = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase() || '';
    
    if (['pdf'].includes(ext)) return 'PDF';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'Imagem';
    if (['doc', 'docx'].includes(ext)) return 'Word';
    if (['xls', 'xlsx'].includes(ext)) return 'Excel';
    if (['ppt', 'pptx'].includes(ext)) return 'PowerPoint';
    return 'Arquivo';
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
      ordem: form.ordem,
      materiais: form.materiais
    };

    if (editing) {
      const { error } = await supabase.from('lessons').update(payload).eq('id', editing.id);
      if (error) toast.error('Erro ao atualizar aula');
      else {
        toast.success('Aula atualizada!');
        setDialogOpen(false);
        fetchData();
      }
    } else {
      const { error } = await supabase.from('lessons').insert(payload);
      if (error) toast.error('Erro ao criar aula');
      else {
        toast.success('Aula criada!');
        setDialogOpen(false);
        fetchData();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta aula?')) return;

    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (error) toast.error('Erro ao excluir aula');
    else {
      toast.success('Aula excluída!');
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
        <p className="text-gray-500">{lessons.length} aula(s) cadastrada(s)</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-amber-600 hover:bg-amber-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nova Aula
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Aula' : 'Nova Aula'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
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
                  <SelectContent className="bg-popover border-border">
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
                  <SelectContent className="bg-popover border-border">
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
                <Label>Conteúdo de Texto</Label>
                <RichTextEditor
                  value={form.texto_apoio}
                  onChange={(html) => setForm({ ...form, texto_apoio: html })}
                  placeholder="Escreva o conteúdo da aula aqui..."
                />
                <p className="text-xs text-muted-foreground">
                  Use a barra de ferramentas para formatar o texto com negrito, listas, títulos, etc.
                </p>
              </div>
              {form.tipo === 'checklist_interativo' && (
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
              )}
              
              {/* Multiple Materials Upload */}
              <div className="space-y-2">
                <Label>Materiais Complementares</Label>
                
                {/* List of uploaded materials */}
                {form.materiais.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {form.materiais.map((url, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border/50">
                        {getFileIcon(url)}
                        <span className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded">
                          {getFileTypeLabel(url)}
                        </span>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline truncate flex-1"
                        >
                          {getFileName(url)}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterial(index)}
                          className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="material-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('material-upload')?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Adicionar Arquivo
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: PDF, Word, PowerPoint, Excel, Imagens. Máximo 10MB por arquivo.
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
              <Button onClick={handleSave} disabled={saving} className="w-full bg-primary hover:bg-primary/90">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editing ? 'Salvar Alterações' : 'Criar Aula'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {lessons.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma aula cadastrada ainda.</p>
            <p className="text-sm text-gray-400 mt-1">Crie um curso primeiro, depois adicione aulas.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Ordem</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Título</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 hidden sm:table-cell">Tipo</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 hidden md:table-cell">Curso</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 hidden lg:table-cell">Materiais</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedLessons.map((lesson) => (
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
                  <td className="py-3 px-4 hidden lg:table-cell">
                    {lesson.materiais?.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                        <Paperclip className="h-3 w-3" />
                        {lesson.materiais.length} arquivo(s)
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, lessons.length)} de {lessons.length}
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