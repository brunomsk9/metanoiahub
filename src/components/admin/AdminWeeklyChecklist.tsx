import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  titulo: string;
  descricao: string | null;
  ordem: number;
  ativo: boolean;
  created_at: string;
}

export function AdminWeeklyChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ChecklistItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    ativo: true
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('weekly_checklist_items')
        .select('*')
        .order('ordem');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Erro ao carregar itens');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item?: ChecklistItem) => {
    if (item) {
      setEditing(item);
      setForm({
        titulo: item.titulo,
        descricao: item.descricao || '',
        ativo: item.ativo
      });
    } else {
      setEditing(null);
      setForm({ titulo: '', descricao: '', ativo: true });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from('weekly_checklist_items')
          .update({
            titulo: form.titulo,
            descricao: form.descricao || null,
            ativo: form.ativo
          })
          .eq('id', editing.id);

        if (error) throw error;
        toast.success('Item atualizado com sucesso');
      } else {
        const maxOrdem = items.length > 0 ? Math.max(...items.map(i => i.ordem)) : 0;
        const { error } = await supabase
          .from('weekly_checklist_items')
          .insert({
            titulo: form.titulo,
            descricao: form.descricao || null,
            ativo: form.ativo,
            ordem: maxOrdem + 1
          });

        if (error) throw error;
        toast.success('Item criado com sucesso');
      }

      setDialogOpen(false);
      fetchItems();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Erro ao salvar item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    try {
      const { error } = await supabase
        .from('weekly_checklist_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Item excluído com sucesso');
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Erro ao excluir item');
    }
  };

  const handleToggleAtivo = async (item: ChecklistItem) => {
    try {
      const { error } = await supabase
        .from('weekly_checklist_items')
        .update({ ativo: !item.ativo })
        .eq('id', item.id);

      if (error) throw error;
      toast.success(item.ativo ? 'Item desativado' : 'Item ativado');
      fetchItems();
    } catch (error) {
      console.error('Error toggling item:', error);
      toast.error('Erro ao atualizar item');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Checklist Semanal</h2>
          <p className="text-sm text-muted-foreground">
            Configure os itens que os discipuladores devem preencher semanalmente
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Item
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhum item cadastrado</p>
          <Button variant="link" onClick={() => handleOpenDialog()}>
            Criar primeiro item
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="hidden md:table-cell">Descrição</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.id} className={!item.ativo ? 'opacity-50' : ''}>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <GripVertical className="h-4 w-4" />
                      {index + 1}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{item.titulo}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {item.descricao || '-'}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={item.ativo}
                      onCheckedChange={() => handleToggleAtivo(item)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar Item' : 'Novo Item do Checklist'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex: Orou pelos discípulos"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Descrição opcional do item"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="ativo"
                checked={form.ativo}
                onCheckedChange={(checked) => setForm({ ...form, ativo: checked })}
              />
              <Label htmlFor="ativo">Item ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
