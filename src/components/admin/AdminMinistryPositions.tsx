import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Plus, Search, Trash2, Edit, GripVertical, Users, ChevronDown, ChevronRight, User, UserCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserChurchId } from '@/hooks/useUserChurchId';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type GenderType = 'masculino' | 'feminino' | 'unissex';

const GENDER_OPTIONS: { value: GenderType; label: string; icon: React.ReactNode }[] = [
  { value: 'unissex', label: 'Unissex', icon: <Users className="h-4 w-4" /> },
  { value: 'masculino', label: 'Apenas Homens', icon: <User className="h-4 w-4" /> },
  { value: 'feminino', label: 'Apenas Mulheres', icon: <UserCircle2 className="h-4 w-4" /> },
];

interface Ministry {
  id: string;
  nome: string;
  cor: string;
}

interface Position {
  id: string;
  nome: string;
  descricao: string | null;
  quantidade_minima: number;
  ordem: number;
  is_active: boolean;
  ministry_id: string;
  church_id: string;
  genero_restrito: GenderType | null;
}

export function AdminMinistryPositions() {
  const { churchId, loading: loadingChurch } = useUserChurchId();
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedMinistries, setExpandedMinistries] = useState<Set<string>>(new Set());

  // Dialog states
  const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [selectedMinistryId, setSelectedMinistryId] = useState<string>('');

  // Form states
  const [positionForm, setPositionForm] = useState({
    nome: '',
    descricao: '',
    quantidade_minima: 1,
    genero_restrito: 'unissex' as GenderType,
  });

  useEffect(() => {
    if (churchId) {
      fetchData();
    }
  }, [churchId]);

  const fetchData = async () => {
    if (!churchId) return;
    setLoading(true);

    const [ministriesRes, positionsRes] = await Promise.all([
      supabase
        .from('ministries')
        .select('id, nome, cor')
        .eq('church_id', churchId)
        .eq('is_active', true)
        .order('nome'),
      supabase
        .from('ministry_positions')
        .select('*')
        .eq('church_id', churchId)
        .order('ordem'),
    ]);

    if (ministriesRes.error) {
      toast.error('Erro ao carregar ministérios');
    } else {
      setMinistries(ministriesRes.data || []);
      // Expand all ministries by default
      setExpandedMinistries(new Set((ministriesRes.data || []).map(m => m.id)));
    }

    if (positionsRes.error) {
      toast.error('Erro ao carregar posições');
    } else {
      setPositions(positionsRes.data || []);
    }

    setLoading(false);
  };

  const handleCreatePosition = async () => {
    if (!positionForm.nome.trim() || !selectedMinistryId || !churchId) {
      toast.error('Nome e ministério são obrigatórios');
      return;
    }

    setSaving(true);

    const maxOrdem = positions
      .filter(p => p.ministry_id === selectedMinistryId)
      .reduce((max, p) => Math.max(max, p.ordem), 0);

    const data = {
      nome: positionForm.nome,
      descricao: positionForm.descricao || null,
      quantidade_minima: positionForm.quantidade_minima,
      genero_restrito: positionForm.genero_restrito,
      ministry_id: selectedMinistryId,
      church_id: churchId,
      ordem: editingPosition ? editingPosition.ordem : maxOrdem + 1,
    };

    const { error } = editingPosition
      ? await supabase.from('ministry_positions').update(data).eq('id', editingPosition.id)
      : await supabase.from('ministry_positions').insert(data);

    if (error) {
      toast.error('Erro ao salvar posição');
      console.error(error);
    } else {
      toast.success(editingPosition ? 'Posição atualizada' : 'Posição criada');
      setIsPositionDialogOpen(false);
      resetPositionForm();
      fetchData();
    }

    setSaving(false);
  };

  const handleDeletePosition = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta posição?')) return;

    const { error } = await supabase.from('ministry_positions').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir posição');
    } else {
      toast.success('Posição excluída');
      fetchData();
    }
  };

  const handleToggleActive = async (position: Position) => {
    const { error } = await supabase
      .from('ministry_positions')
      .update({ is_active: !position.is_active })
      .eq('id', position.id);

    if (error) {
      toast.error('Erro ao atualizar posição');
    } else {
      fetchData();
    }
  };

  const resetPositionForm = () => {
    setPositionForm({
      nome: '',
      descricao: '',
      quantidade_minima: 1,
      genero_restrito: 'unissex',
    });
    setEditingPosition(null);
    setSelectedMinistryId('');
  };

  const openCreatePosition = (ministryId: string) => {
    resetPositionForm();
    setSelectedMinistryId(ministryId);
    setIsPositionDialogOpen(true);
  };

  const openEditPosition = (position: Position) => {
    setEditingPosition(position);
    setSelectedMinistryId(position.ministry_id);
    setPositionForm({
      nome: position.nome,
      descricao: position.descricao || '',
      quantidade_minima: position.quantidade_minima,
      genero_restrito: position.genero_restrito || 'unissex',
    });
    setIsPositionDialogOpen(true);
  };

  const toggleMinistry = (ministryId: string) => {
    const newExpanded = new Set(expandedMinistries);
    if (newExpanded.has(ministryId)) {
      newExpanded.delete(ministryId);
    } else {
      newExpanded.add(ministryId);
    }
    setExpandedMinistries(newExpanded);
  };

  const getPositionsForMinistry = (ministryId: string) => {
    return positions
      .filter(p => p.ministry_id === ministryId)
      .filter(p => p.nome.toLowerCase().includes(search.toLowerCase()));
  };

  const filteredMinistries = ministries.filter(m => {
    if (!search) return true;
    const hasMatchingPosition = positions.some(
      p => p.ministry_id === m.id && p.nome.toLowerCase().includes(search.toLowerCase())
    );
    return m.nome.toLowerCase().includes(search.toLowerCase()) || hasMatchingPosition;
  });

  if (loadingChurch || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (ministries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum ministério cadastrado</p>
          <p className="text-sm text-muted-foreground mt-2">
            Cadastre ministérios na Rede Ministerial primeiro
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar posição..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredMinistries.map((ministry) => {
          const ministryPositions = getPositionsForMinistry(ministry.id);
          const isExpanded = expandedMinistries.has(ministry.id);

          return (
            <Card key={ministry.id} className="overflow-hidden">
              <Collapsible open={isExpanded} onOpenChange={() => toggleMinistry(ministry.id)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: ministry.cor }}
                        />
                        <CardTitle className="text-base font-medium">{ministry.nome}</CardTitle>
                        <Badge variant="secondary" className="ml-2">
                          {ministryPositions.length} {ministryPositions.length === 1 ? 'posição' : 'posições'}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCreatePosition(ministry.id);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Posição
                      </Button>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {ministryPositions.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        Nenhuma posição cadastrada para este ministério
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {ministryPositions.map((position) => (
                          <div
                            key={position.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              position.is_active ? 'bg-background' : 'bg-muted/50 opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {position.nome}
                                  {!position.is_active && (
                                    <Badge variant="secondary" className="text-xs">Inativo</Badge>
                                  )}
                                </div>
                                {position.descricao && (
                                  <p className="text-sm text-muted-foreground">{position.descricao}</p>
                                )}
                                <div className="flex items-center gap-3 mt-1">
                                  <p className="text-xs text-muted-foreground">
                                    Mínimo: {position.quantidade_minima} {position.quantidade_minima === 1 ? 'pessoa' : 'pessoas'}
                                  </p>
                                  {position.genero_restrito && position.genero_restrito !== 'unissex' && (
                                    <Badge variant="outline" className="text-xs">
                                      {position.genero_restrito === 'masculino' ? '♂ Homens' : '♀ Mulheres'}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleActive(position)}
                                title={position.is_active ? 'Desativar' : 'Ativar'}
                              >
                                <Badge 
                                  variant={position.is_active ? 'default' : 'secondary'}
                                  className="cursor-pointer"
                                >
                                  {position.is_active ? 'Ativo' : 'Inativo'}
                                </Badge>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditPosition(position)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeletePosition(position.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Dialog: Position */}
      <Dialog open={isPositionDialogOpen} onOpenChange={(open) => { setIsPositionDialogOpen(open); if (!open) resetPositionForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPosition ? 'Editar' : 'Nova'} Posição</DialogTitle>
            <DialogDescription>
              {selectedMinistryId && (
                <>Ministério: <strong>{ministries.find(m => m.id === selectedMinistryId)?.nome}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Posição *</Label>
              <Input
                placeholder="Ex: Vocal, Guitarra, Recepcionista..."
                value={positionForm.nome}
                onChange={(e) => setPositionForm({ ...positionForm, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descrição opcional da função..."
                value={positionForm.descricao}
                onChange={(e) => setPositionForm({ ...positionForm, descricao: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Quantidade Mínima</Label>
              <Input
                type="number"
                min={1}
                value={positionForm.quantidade_minima}
                onChange={(e) => setPositionForm({ ...positionForm, quantidade_minima: parseInt(e.target.value) || 1 })}
              />
              <p className="text-xs text-muted-foreground">
                Quantas pessoas no mínimo são necessárias nesta posição por culto
              </p>
            </div>
            <div className="space-y-2">
              <Label>Restrição de Gênero</Label>
              <Select
                value={positionForm.genero_restrito}
                onValueChange={(value: GenderType) => setPositionForm({ ...positionForm, genero_restrito: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {option.icon}
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Define se a posição é exclusiva para homens, mulheres ou ambos
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPositionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreatePosition} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingPosition ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
