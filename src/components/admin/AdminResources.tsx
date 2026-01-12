import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, LifeBuoy, Book, Music, Video, ExternalLink, FileText, Play, Brain, RefreshCw } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { useUserChurchId } from '@/hooks/useUserChurchId';

type ResourceCategory = 'sos' | 'apoio' | 'devocional' | 'estudo' | 'livro' | 'musica' | 'pregacao' | 'playbook';

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
  ministry_id: string | null;
}

interface Ministry {
  id: string;
  nome: string;
}

const categoriaLabels: Record<ResourceCategory, string> = {
  sos: 'S.O.S.',
  apoio: 'Apoio',
  devocional: 'Devocional',
  estudo: 'Estudo',
  livro: 'Livro',
  musica: 'Música',
  pregacao: 'Pregação',
  playbook: 'Playbook'
};

const categoriaColors: Record<ResourceCategory, string> = {
  sos: 'bg-red-100 text-red-700',
  apoio: 'bg-blue-100 text-blue-700',
  devocional: 'bg-purple-100 text-purple-700',
  estudo: 'bg-green-100 text-green-700',
  livro: 'bg-amber-100 text-amber-700',
  musica: 'bg-pink-100 text-pink-700',
  pregacao: 'bg-indigo-100 text-indigo-700',
  playbook: 'bg-teal-100 text-teal-700'
};

interface AdminResourcesProps {
  isAdmin?: boolean;
}

export function AdminResources({ isAdmin = true }: AdminResourcesProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatingEmbeddings, setGeneratingEmbeddings] = useState(false);
  const { churchId } = useUserChurchId();
  
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    categoria: 'sos' as ResourceCategory,
    video_url: '',
    url_pdf: '',
    tags: '',
    autor: '',
    link_externo: '',
    imagem_capa: '',
    ministry_id: ''
  });

  const handleGenerateEmbeddings = async () => {
    setGeneratingEmbeddings(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-embeddings');
      
      if (error) {
        console.error('Error generating embeddings:', error);
        toast.error('Erro ao gerar embeddings');
        return;
      }
      
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      
      toast.success(`Embeddings gerados: ${data.processed}/${data.total} recursos processados`);
      
      if (data.errors && data.errors.length > 0) {
        console.warn('Some resources had errors:', data.errors);
      }
    } catch (err) {
      console.error('Failed to generate embeddings:', err);
      toast.error('Falha ao gerar embeddings');
    } finally {
      setGeneratingEmbeddings(false);
    }
  };

  useEffect(() => {
    fetchResources();
    fetchMinistries();
  }, [churchId]);

  const fetchResources = async () => {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) toast.error('Erro ao carregar recursos');
    else setResources(data || []);

    setLoading(false);
  };

  const fetchMinistries = async () => {
    if (!churchId) return;
    
    const { data, error } = await supabase
      .from('ministries')
      .select('id, nome')
      .eq('church_id', churchId)
      .eq('is_active', true)
      .order('nome');

    if (!error) setMinistries(data || []);
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
        imagem_capa: resource.imagem_capa || '',
        ministry_id: resource.ministry_id || ''
      });
    } else {
      setEditing(null);
      setForm({ titulo: '', descricao: '', categoria: 'sos', video_url: '', url_pdf: '', tags: '', autor: '', link_externo: '', imagem_capa: '', ministry_id: '' });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.titulo) {
      toast.error('Título é obrigatório');
      return;
    }

    if (!churchId) {
      toast.error('Erro: Usuário não está associado a uma igreja');
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
      imagem_capa: form.imagem_capa || null,
      church_id: churchId,
      ministry_id: form.categoria === 'playbook' && form.ministry_id ? form.ministry_id : null
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <p className="text-gray-500">{resources.length} recurso(s) cadastrado(s)</p>
          {isAdmin && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleGenerateEmbeddings}
              disabled={generatingEmbeddings}
              className="text-primary border-primary/30 hover:bg-primary/10"
              title="Gera embeddings para busca semântica no Mentor IA"
            >
              {generatingEmbeddings ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Brain className="h-4 w-4 mr-2" />
              )}
              {generatingEmbeddings ? 'Gerando...' : 'Atualizar IA'}
            </Button>
          )}
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} variant="default">
                <Plus className="h-4 w-4 mr-2" />
                Novo Recurso
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-primary/20">
              <DialogHeader className="pb-4 border-b border-primary/10">
                <DialogTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                  {editing ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                  {editing ? 'Editar Recurso' : 'Novo Recurso'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-5 py-4">
                {/* Título */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    Título <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    placeholder="Ex: Como lidar com o luto"
                    className="bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20"
                  />
                </div>
                
                {/* Categoria e Autor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Categoria</Label>
                    <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v as ResourceCategory })}>
                      <SelectTrigger className="bg-background/50 border-border/50 focus:border-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border z-50">
                        <SelectItem value="sos">S.O.S.</SelectItem>
                        <SelectItem value="apoio">Apoio</SelectItem>
                        <SelectItem value="devocional">Devocional</SelectItem>
                        <SelectItem value="estudo">Estudo</SelectItem>
                        <SelectItem value="livro">Livro</SelectItem>
                        <SelectItem value="musica">Música</SelectItem>
                        <SelectItem value="pregacao">Pregação</SelectItem>
                        <SelectItem value="playbook">Playbook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Autor</Label>
                    <Input
                      value={form.autor}
                      onChange={(e) => setForm({ ...form, autor: e.target.value })}
                      placeholder="Ex: C.S. Lewis"
                      className="bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                </div>
                
                {/* Ministério (apenas para playbook) */}
                {form.categoria === 'playbook' && (
                  <div className="space-y-2 p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <Label className="text-sm font-medium text-foreground">
                      Ministério <span className="text-destructive">*</span>
                    </Label>
                    <Select value={form.ministry_id} onValueChange={(v) => setForm({ ...form, ministry_id: v })}>
                      <SelectTrigger className="bg-background/50 border-border/50 focus:border-primary">
                        <SelectValue placeholder="Selecione o ministério" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border z-50">
                        {ministries.map((ministry) => (
                          <SelectItem key={ministry.id} value={ministry.id}>
                            {ministry.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Voluntários só verão playbooks do seu ministério
                    </p>
                  </div>
                )}
                
                {/* Descrição */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Descrição</Label>
                  <Textarea
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                    placeholder="Descrição do recurso..."
                    rows={3}
                    className="bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 resize-none"
                  />
                </div>
                
                {/* Seção de Arquivos */}
                <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border/30">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Arquivos e Links
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Imagem de Capa</Label>
                      <FileUpload
                        value={form.imagem_capa}
                        onChange={(url) => setForm({ ...form, imagem_capa: url })}
                        accept=".jpg,.jpeg,.png,.webp"
                        folder="recursos/capas"
                        placeholder="Cole uma URL ou faça upload"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <ExternalLink className="h-3 w-3" />
                        Link Externo (Spotify, YouTube, etc.)
                      </Label>
                      <Input
                        value={form.link_externo}
                        onChange={(e) => setForm({ ...form, link_externo: e.target.value })}
                        placeholder="https://open.spotify.com/..."
                        className="bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                          <Play className="h-3 w-3" />
                          Vídeo
                        </Label>
                        <FileUpload
                          value={form.video_url}
                          onChange={(url) => setForm({ ...form, video_url: url })}
                          accept=".mp4,.webm,.mov"
                          folder="recursos/videos"
                          placeholder="URL ou upload"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                          <FileText className="h-3 w-3" />
                          PDF/Documento
                        </Label>
                        <FileUpload
                          value={form.url_pdf}
                          onChange={(url) => setForm({ ...form, url_pdf: url })}
                          accept=".pdf,.doc,.docx"
                          folder="recursos/pdfs"
                          placeholder="URL ou upload"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Tags */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Tags (separadas por vírgula)</Label>
                  <Input
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="luto, ansiedade, medo"
                    className="bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20"
                  />
                </div>
                
                {/* Botão de salvar */}
                <div className="pt-4 border-t border-primary/10">
                  <Button onClick={handleSave} disabled={saving} className="w-full">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {editing ? 'Salvar Alterações' : 'Criar Recurso'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="bg-card/50 rounded-xl border border-border/50 overflow-hidden">
        {resources.length === 0 ? (
          <div className="p-12 text-center">
            <LifeBuoy className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum recurso cadastrado ainda.</p>
          </div>
        ) : (
          <>
            {/* Mobile & Tablet: Cards layout */}
            <div className="block md:hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4">
                {resources.map((resource) => (
                  <div key={resource.id} className="content-card space-y-3">
                  {/* Header: Title and Category */}
                  <div className="content-card-header">
                    <div className="flex-1 min-w-0">
                      <p className="content-card-title">{resource.titulo}</p>
                      {resource.descricao && (
                        <p className="content-card-description mt-1">{resource.descricao}</p>
                      )}
                    </div>
                    <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap shrink-0 ${categoriaColors[resource.categoria]}`}>
                      {categoriaLabels[resource.categoria]}
                    </span>
                  </div>
                  
                  {/* Tags */}
                  {(resource.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {(resource.tags || []).slice(0, 3).map((tag) => (
                        <span key={tag} className="inline-flex px-2 py-0.5 text-xs rounded-md bg-muted/60 text-muted-foreground font-medium">
                          {tag}
                        </span>
                      ))}
                      {(resource.tags || []).length > 3 && (
                        <span className="text-xs text-muted-foreground/60 font-medium">+{(resource.tags || []).length - 3}</span>
                      )}
                    </div>
                  )}
                  
                  {/* Action buttons - always visible */}
                  <div className="content-card-footer">
                    {resource.link_externo && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.open(resource.link_externo!, '_blank')} 
                        className="flex-1 h-9 text-blue-600 border-blue-500/40 hover:bg-blue-500/10 hover:border-blue-500/60"
                      >
                        <ExternalLink className="h-4 w-4 mr-1.5 shrink-0" />
                        <span className="truncate">Link</span>
                      </Button>
                    )}
                    {resource.video_url && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.open(resource.video_url!, '_blank')} 
                        className="flex-1 h-9 text-red-600 border-red-500/40 hover:bg-red-500/10 hover:border-red-500/60"
                      >
                        <Play className="h-4 w-4 mr-1.5 shrink-0" />
                        <span className="truncate">Vídeo</span>
                      </Button>
                    )}
                    {resource.url_pdf && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.open(resource.url_pdf!, '_blank')} 
                        className="flex-1 h-9 text-amber-600 border-amber-500/40 hover:bg-amber-500/10 hover:border-amber-500/60"
                      >
                        <FileText className="h-4 w-4 mr-1.5 shrink-0" />
                        <span className="truncate">PDF</span>
                      </Button>
                    )}
                    {isAdmin && (
                      <div className="flex items-center gap-1 ml-auto">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleOpenDialog(resource)} 
                          className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(resource.id)} 
                          className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              </div>
            </div>

            {/* Desktop: Table layout */}
            <table className="w-full hidden md:table">
              <thead className="bg-muted/30 border-b border-border/50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Título</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Categoria</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Tags</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {resources.map((resource) => (
                  <tr key={resource.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-foreground">{resource.titulo}</p>
                        {resource.descricao && (
                          <p className="text-sm text-muted-foreground truncate max-w-xs">{resource.descricao}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full w-fit ${categoriaColors[resource.categoria]}`}>
                          {categoriaLabels[resource.categoria]}
                        </span>
                        {resource.categoria === 'playbook' && resource.ministry_id && (
                          <span className="text-xs text-muted-foreground">
                            {ministries.find(m => m.id === resource.ministry_id)?.nome || 'Ministério'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(resource.tags || []).slice(0, 3).map((tag) => (
                          <span key={tag} className="inline-flex px-2 py-0.5 text-xs rounded bg-muted/50 text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                        {(resource.tags || []).length > 3 && (
                          <span className="text-xs text-muted-foreground/50">+{(resource.tags || []).length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-1">
                        {resource.link_externo && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => window.open(resource.link_externo!, '_blank')} 
                            className="h-8 w-8 text-blue-500 hover:text-blue-700"
                            title="Abrir link externo"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        {resource.video_url && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => window.open(resource.video_url!, '_blank')} 
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            title="Assistir vídeo"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {resource.url_pdf && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => window.open(resource.url_pdf!, '_blank')} 
                            className="h-8 w-8 text-amber-500 hover:text-amber-700"
                            title="Abrir PDF"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                        {isAdmin && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(resource)} className="h-8 w-8 text-gray-500 hover:text-gray-700">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(resource.id)} className="h-8 w-8 text-gray-500 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
