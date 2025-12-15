import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

interface Resource {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: 'sos' | 'apoio' | 'devocional' | 'estudo';
  video_url: string | null;
  url_pdf: string | null;
  tags: string[] | null;
}

const categoriaLabels = {
  sos: 'S.O.S.',
  apoio: 'Apoio',
  devocional: 'Devocional',
  estudo: 'Estudo'
};

export function AdminResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    categoria: 'sos' as 'sos' | 'apoio' | 'devocional' | 'estudo',
    video_url: '',
    url_pdf: '',
    tags: ''
  });

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) toast.error('Erro ao carregar recursos');
    else setResources(data || []);

    setLoading(false);
  };

  const handleOpenDialog = (resource?: Resource) => {
    if (resource) {
      setEditing(resource);
      setForm({
        titulo: resource.titulo,
        descricao: resource.descricao || '',
        categoria: resource.categoria,
        video_url: resource.video_url || '',
        url_pdf: resource.url_pdf || '',
        tags: (resource.tags || []).join(', ')
      });
    } else {
      setEditing(null);
      setForm({ titulo: '', descricao: '', categoria: 'sos', video_url: '', url_pdf: '', tags: '' });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.titulo) {
      toast.error('Título é obrigatório');
      return;
    }

    setSaving(true);

    const tagsArray = form.tags
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    const payload = {
      titulo: form.titulo,
      descricao: form.descricao || null,
      categoria: form.categoria,
      video_url: form.video_url || null,
      url_pdf: form.url_pdf || null,
      tags: tagsArray
    };

    if (editing) {
      const { error } = await supabase.from('resources').update(payload).eq('id', editing.id);
      if (error) toast.error('Erro ao atualizar recurso');
      else {
        toast.success('Recurso atualizado!');
        setDialogOpen(false);
        fetchResources();
      }
    } else {
      const { error } = await supabase.from('resources').insert(payload);
      if (error) toast.error('Erro ao criar recurso');
      else {
        toast.success('Recurso criado!');
        setDialogOpen(false);
        fetchResources();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este recurso?')) return;

    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (error) toast.error('Erro ao excluir recurso');
    else {
      toast.success('Recurso excluído!');
      fetchResources();
    }
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
        <h2 className="text-xl font-semibold text-foreground">Recursos ({resources.length})</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Recurso
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Recurso' : 'Novo Recurso'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ex: Como lidar com o luto"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sos">S.O.S.</SelectItem>
                    <SelectItem value="apoio">Apoio</SelectItem>
                    <SelectItem value="devocional">Devocional</SelectItem>
                    <SelectItem value="estudo">Estudo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descrição do recurso..."
                />
              </div>
              <div className="space-y-2">
                <Label>URL do Vídeo</Label>
                <Input
                  value={form.video_url}
                  onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                  placeholder="https://youtube.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label>URL do PDF</Label>
                <Input
                  value={form.url_pdf}
                  onChange={(e) => setForm({ ...form, url_pdf: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Tags (separadas por vírgula)</Label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="luto, ansiedade, medo"
                />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editing ? 'Salvar Alterações' : 'Criar Recurso'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {resources.map((resource) => (
          <Card key={resource.id} className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{resource.titulo}</CardTitle>
                  <p className="text-sm text-muted-foreground">{categoriaLabels[resource.categoria]}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(resource)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(resource.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {resource.descricao && (
                <p className="text-sm text-muted-foreground">{resource.descricao}</p>
              )}
              {resource.tags && resource.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {resource.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {resources.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nenhum recurso cadastrado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
