import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

interface Track {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: string;
  cover_image: string | null;
  ordem: number;
}

export function AdminTracks() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Track | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    categoria: '',
    cover_image: '',
    ordem: 0
  });

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
        ordem: track.ordem
      });
    } else {
      setEditing(null);
      setForm({ titulo: '', descricao: '', categoria: '', cover_image: '', ordem: tracks.length });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.titulo || !form.categoria) {
      toast.error('Título e categoria são obrigatórios');
      return;
    }

    setSaving(true);

    if (editing) {
      const { error } = await supabase
        .from('tracks')
        .update({
          titulo: form.titulo,
          descricao: form.descricao || null,
          categoria: form.categoria,
          cover_image: form.cover_image || null,
          ordem: form.ordem
        })
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
        .insert({
          titulo: form.titulo,
          descricao: form.descricao || null,
          categoria: form.categoria,
          cover_image: form.cover_image || null,
          ordem: form.ordem
        });

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
        <h2 className="text-xl font-semibold text-foreground">Trilhas ({tracks.length})</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Trilha
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Trilha' : 'Nova Trilha'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ex: Jornada Metanoia"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Input
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  placeholder="Ex: Fundamentos"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descrição da trilha..."
                />
              </div>
              <div className="space-y-2">
                <Label>URL da Capa</Label>
                <Input
                  value={form.cover_image}
                  onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
                  placeholder="https://..."
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
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editing ? 'Salvar Alterações' : 'Criar Trilha'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {tracks.map((track) => (
          <Card key={track.id} className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{track.titulo}</CardTitle>
                  <p className="text-sm text-muted-foreground">{track.categoria}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(track)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(track.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {track.descricao && (
              <CardContent>
                <p className="text-sm text-muted-foreground">{track.descricao}</p>
              </CardContent>
            )}
          </Card>
        ))}

        {tracks.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma trilha cadastrada ainda.
          </p>
        )}
      </div>
    </div>
  );
}
