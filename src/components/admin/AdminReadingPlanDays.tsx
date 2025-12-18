import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserChurchId } from '@/hooks/useUserChurchId';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface ReadingPlan {
  id: string;
  titulo: string;
  duracao_dias: number;
}

interface ReadingPlanDay {
  id: string;
  plan_id: string;
  dia: number;
  titulo: string;
  versiculo_referencia: string | null;
  conteudo: string | null;
}

export function AdminReadingPlanDays() {
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [days, setDays] = useState<ReadingPlanDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<ReadingPlanDay | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const { churchId } = useUserChurchId();

  const [formData, setFormData] = useState({
    dia: 1,
    titulo: '',
    versiculo_referencia: '',
    conteudo: '',
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (selectedPlanId) {
      fetchDays();
      setCurrentPage(1);
    }
  }, [selectedPlanId]);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('reading_plans')
      .select('id, titulo, duracao_dias')
      .order('titulo');

    if (error) {
      toast.error('Erro ao carregar planos');
      return;
    }

    setPlans(data || []);
    setLoading(false);
  };

  const fetchDays = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reading_plan_days')
      .select('*')
      .eq('plan_id', selectedPlanId)
      .order('dia');

    if (error) {
      toast.error('Erro ao carregar dias');
      setLoading(false);
      return;
    }

    setDays(data || []);
    setLoading(false);
  };

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const filteredDays = days.filter(day => {
    const query = searchQuery.toLowerCase();
    return (
      day.titulo.toLowerCase().includes(query) ||
      day.versiculo_referencia?.toLowerCase().includes(query) ||
      day.dia.toString().includes(query)
    );
  });

  const totalPages = Math.ceil(filteredDays.length / itemsPerPage);
  const paginatedDays = filteredDays.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetForm = () => {
    setFormData({
      dia: days.length + 1,
      titulo: '',
      versiculo_referencia: '',
      conteudo: '',
    });
    setEditingDay(null);
  };

  const handleEdit = (day: ReadingPlanDay) => {
    setEditingDay(day);
    setFormData({
      dia: day.dia,
      titulo: day.titulo,
      versiculo_referencia: day.versiculo_referencia || '',
      conteudo: day.conteudo || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este dia?')) return;

    const { error } = await supabase
      .from('reading_plan_days')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir dia');
      return;
    }

    toast.success('Dia excluído com sucesso');
    fetchDays();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) return;

    if (!churchId && !editingDay) {
      toast.error('Erro: Usuário não está associado a uma igreja');
      return;
    }

    setSaving(true);

    const payload = {
      plan_id: selectedPlanId,
      dia: formData.dia,
      titulo: formData.titulo,
      versiculo_referencia: formData.versiculo_referencia || null,
      conteudo: formData.conteudo || null,
      ...(editingDay ? {} : { church_id: churchId })
    };

    let error;

    if (editingDay) {
      const result = await supabase
        .from('reading_plan_days')
        .update(payload)
        .eq('id', editingDay.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('reading_plan_days')
        .insert(payload);
      error = result.error;
    }

    setSaving(false);

    if (error) {
      toast.error(editingDay ? 'Erro ao atualizar dia' : 'Erro ao criar dia');
      return;
    }

    toast.success(editingDay ? 'Dia atualizado com sucesso' : 'Dia criado com sucesso');
    setDialogOpen(false);
    resetForm();
    fetchDays();
  };

  const getMissingDays = () => {
    if (!selectedPlan) return [];
    const existingDays = new Set(days.map(d => d.dia));
    const missing: number[] = [];
    for (let i = 1; i <= selectedPlan.duracao_dias; i++) {
      if (!existingDays.has(i)) {
        missing.push(i);
      }
    }
    return missing;
  };

  const missingDays = getMissingDays();

  if (loading && plans.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan Selector */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Selecionar Plano de Leitura</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
            <SelectTrigger className="w-full md:w-96">
              <SelectValue placeholder="Selecione um plano..." />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.titulo} ({plan.duracao_dias} dias)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedPlanId && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-foreground">{days.length}</div>
                <p className="text-sm text-muted-foreground">Dias cadastrados</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-foreground">{selectedPlan?.duracao_dias || 0}</div>
                <p className="text-sm text-muted-foreground">Duração total</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className={`text-2xl font-bold ${missingDays.length === 0 ? 'text-green-500' : 'text-amber-500'}`}>
                  {missingDays.length}
                </div>
                <p className="text-sm text-muted-foreground">Dias faltando</p>
              </CardContent>
            </Card>
          </div>

          {missingDays.length > 0 && missingDays.length <= 20 && (
            <Card className="bg-amber-500/10 border-amber-500/30">
              <CardContent className="pt-6">
                <p className="text-sm text-amber-400">
                  <strong>Dias faltando:</strong> {missingDays.join(', ')}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Search and Add */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por dia ou título..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>

            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Dia
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingDay ? 'Editar Dia' : 'Novo Dia'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dia">Dia</Label>
                      <Input
                        id="dia"
                        type="number"
                        min={1}
                        max={selectedPlan?.duracao_dias || 365}
                        value={formData.dia}
                        onChange={(e) => setFormData({ ...formData, dia: parseInt(e.target.value) || 1 })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="versiculo">Versículo Referência</Label>
                      <Input
                        id="versiculo"
                        placeholder="Ex: João 3:16"
                        value={formData.versiculo_referencia}
                        onChange={(e) => setFormData({ ...formData, versiculo_referencia: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="titulo">Título da Leitura</Label>
                    <Input
                      id="titulo"
                      placeholder="Ex: Gênesis 1-3"
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="conteudo">Conteúdo/Reflexão (opcional)</Label>
                    <Textarea
                      id="conteudo"
                      placeholder="Adicione uma reflexão ou comentário sobre a leitura do dia..."
                      value={formData.conteudo}
                      onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {editingDay ? 'Salvar' : 'Criar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Days Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Dia</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Versículo</TableHead>
                        <TableHead className="w-24">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedDays.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhum dia cadastrado'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedDays.map((day) => (
                          <TableRow key={day.id}>
                            <TableCell className="font-medium">{day.dia}</TableCell>
                            <TableCell>{day.titulo}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {day.versiculo_referencia || '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(day)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(day.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredDays.length)} de {filteredDays.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {currentPage} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
