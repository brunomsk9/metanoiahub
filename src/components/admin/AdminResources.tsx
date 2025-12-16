import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, LifeBuoy, Book, Music, Video } from 'lucide-react';
import { FileUpload } from './FileUpload';

type ResourceCategory = 'sos' | 'apoio' | 'devocional' | 'estudo' | 'livro' | 'musica' | 'pregacao';

interface Resource {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: ResourceCategory;
  video_url: string | null;
  url_pdf: string | null;
  tags: string[] | null;
  autor: string | null;
  link_externo: string | null;
  imagem_capa: string | null;
}

const categoriaLabels: Record<ResourceCategory, string> = {
  sos: 'S.O.S.',
  apoio: 'Apoio',
  devocional: 'Devocional',
  estudo: 'Estudo',
  livro: 'Livro',
  musica: 'Música',
  pregacao: 'Pregação'
};

const categoriaColors: Record<ResourceCategory, string> = {
  sos: 'bg-red-100 text-red-700',
  apoio: 'bg-blue-100 text-blue-700',
  devocional: 'bg-purple-100 text-purple-700',
  estudo: 'bg-green-100 text-green-700',
  livro: 'bg-amber-100 text-amber-700',
  musica: 'bg-pink-100 text-pink-700',
  pregacao: 'bg-indigo-100 text-indigo-700'
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
    categoria: 'sos' as ResourceCategory,
    video_url: '',
    url_pdf: '',
    tags: '',
    autor: '',
    link_externo: '',
    imagem_capa: ''
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
        tags: (resource.tags || []).join(', '),
        autor: resource.autor || '',
        link_externo: resource.link_externo || '',
        imagem_capa: resource.imagem_capa || ''
      });
    } else {
      setEditing(null);
      setForm({ titulo: '', descricao: '', categoria: 'sos', video_url: '', url_pdf: '', tags: '', autor: '', link_externo: '', imagem_capa: '' });
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
      tags: tagsArray,
      autor: form.autor || null,
      link_externo: form.link_externo || null,
      imagem_capa: form.imagem_capa || null
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
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-500">{resources.length} recurso(s) cadastrado(s)</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-amber-600 hover:bg-amber-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Novo Recurso
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-gray-200 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-gray-900">{editing ? 'Editar Recurso' : 'Novo Recurso'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Título *</Label>
                <Input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ex: Como lidar com o luto"
                  className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">Categoria</Label>
                  <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v as ResourceCategory })}>
                    <SelectTrigger className="border-gray-300 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="sos">S.O.S.</SelectItem>
                      <SelectItem value="apoio">Apoio</SelectItem>
                      <SelectItem value="devocional">Devocional</SelectItem>
                      <SelectItem value="estudo">Estudo</SelectItem>
                      <SelectItem value="livro">Livro</SelectItem>
                      <SelectItem value="musica">Música</SelectItem>
                      <SelectItem value="pregacao">Pregação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Autor</Label>
                  <Input
                    value={form.autor}
                    onChange={(e) => setForm({ ...form, autor: e.target.value })}
                    placeholder="Ex: C.S. Lewis"
                    className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Descrição</Label>
                <Textarea
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descrição do recurso..."
                  className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Imagem de Capa</Label>
                <FileUpload
                  value={form.imagem_capa}
                  onChange={(url) => setForm({ ...form, imagem_capa: url })}
                  accept=".jpg,.jpeg,.png,.webp"
                  folder="recursos/capas"
                  placeholder="Cole uma URL ou faça upload da imagem"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Link Externo (Spotify, YouTube, etc.)</Label>
                <Input
                  value={form.link_externo}
                  onChange={(e) => setForm({ ...form, link_externo: e.target.value })}
                  placeholder="https://open.spotify.com/..."
                  className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Vídeo (URL ou Upload)</Label>
                <FileUpload
                  value={form.video_url}
                  onChange={(url) => setForm({ ...form, video_url: url })}
                  accept=".mp4,.webm,.mov"
                  folder="recursos/videos"
                  placeholder="Cole uma URL do YouTube ou faça upload"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">PDF ou Documento</Label>
                <FileUpload
                  value={form.url_pdf}
                  onChange={(url) => setForm({ ...form, url_pdf: url })}
                  accept=".pdf,.doc,.docx"
                  folder="recursos/pdfs"
                  placeholder="Cole uma URL ou faça upload do PDF"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Tags (separadas por vírgula)</Label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="luto, ansiedade, medo"
                  className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editing ? 'Salvar Alterações' : 'Criar Recurso'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {resources.length === 0 ? (
          <div className="p-12 text-center">
            <LifeBuoy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum recurso cadastrado ainda.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Título</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 hidden sm:table-cell">Categoria</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 hidden md:table-cell">Tags</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {resources.map((resource) => (
                <tr key={resource.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{resource.titulo}</p>
                      {resource.descricao && (
                        <p className="text-sm text-gray-500 truncate max-w-xs">{resource.descricao}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${categoriaColors[resource.categoria]}`}>
                      {categoriaLabels[resource.categoria]}
                    </span>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(resource.tags || []).slice(0, 3).map((tag) => (
                        <span key={tag} className="inline-flex px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600">
                          {tag}
                        </span>
                      ))}
                      {(resource.tags || []).length > 3 && (
                        <span className="text-xs text-gray-400">+{(resource.tags || []).length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(resource)} className="h-8 w-8 text-gray-500 hover:text-gray-700">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(resource.id)} className="h-8 w-8 text-gray-500 hover:text-red-600">
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
