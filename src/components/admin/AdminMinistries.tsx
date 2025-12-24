import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Plus, Search, Users, Trash2, Edit, UserPlus, Crown, User, Building2, Palette } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SearchableUserSelect } from './SearchableUserSelect';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useUserChurchId } from '@/hooks/useUserChurchId';

interface Ministry {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string;
  icone: string;
  lider_principal_id: string | null;
  lider_secundario_id: string | null;
  is_active: boolean;
  church_id: string;
  created_at: string;
}

interface MinistryVolunteer {
  id: string;
  ministry_id: string;
  user_id: string;
  church_id: string;
  funcao: string;
  created_at: string;
  user_name?: string;
}

interface UserProfile {
  id: string;
  nome: string;
}

const COLORS = [
  { value: '#8B5CF6', label: 'Roxo' },
  { value: '#3B82F6', label: 'Azul' },
  { value: '#10B981', label: 'Verde' },
  { value: '#F59E0B', label: 'Amarelo' },
  { value: '#EF4444', label: 'Vermelho' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#6366F1', label: 'Índigo' },
  { value: '#14B8A6', label: 'Teal' },
];

export function AdminMinistries() {
  const { churchId, loading: loadingChurch } = useUserChurchId();
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [volunteers, setVolunteers] = useState<MinistryVolunteer[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isVolunteerDialogOpen, setIsVolunteerDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [volunteerSearch, setVolunteerSearch] = useState('');
  const [currentVolunteerSearch, setCurrentVolunteerSearch] = useState('');
  
  // Form states
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    cor: '#8B5CF6',
    lider_principal_id: '',
    lider_secundario_id: '',
  });

  useEffect(() => {
    if (churchId) {
      fetchData();
    }
  }, [churchId]);

  const fetchData = async () => {
    if (!churchId) return;
    
    setLoading(true);
    
    // Fetch ministries
    const { data: ministriesData, error: ministriesError } = await supabase
      .from('ministries')
      .select('*')
      .eq('church_id', churchId)
      .order('nome');

    if (ministriesError) {
      toast.error('Erro ao carregar ministérios');
      console.error(ministriesError);
    } else {
      setMinistries(ministriesData || []);
    }

    // Fetch all users for selection
    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select('id, nome')
      .eq('church_id', churchId)
      .order('nome');

    if (usersError) {
      toast.error('Erro ao carregar usuários');
    } else {
      setUsers(usersData || []);
    }

    // Fetch volunteers
    const { data: volunteersData, error: volunteersError } = await supabase
      .from('ministry_volunteers')
      .select('*')
      .eq('church_id', churchId);

    if (volunteersError) {
      toast.error('Erro ao carregar voluntários');
    } else {
      setVolunteers(volunteersData || []);
    }

    setLoading(false);
  };

  const handleCreateMinistry = async () => {
    if (!formData.nome.trim() || !churchId) {
      toast.error('Nome do ministério é obrigatório');
      return;
    }

    setSaving(true);

    const { error } = await supabase.from('ministries').insert({
      nome: formData.nome,
      descricao: formData.descricao || null,
      cor: formData.cor,
      lider_principal_id: formData.lider_principal_id || null,
      lider_secundario_id: formData.lider_secundario_id || null,
      church_id: churchId,
    });

    if (error) {
      toast.error('Erro ao criar ministério');
      console.error(error);
    } else {
      toast.success('Ministério criado com sucesso');
      setIsCreateDialogOpen(false);
      resetForm();
      fetchData();
    }

    setSaving(false);
  };

  const handleUpdateMinistry = async () => {
    if (!selectedMinistry || !formData.nome.trim()) {
      toast.error('Nome do ministério é obrigatório');
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from('ministries')
      .update({
        nome: formData.nome,
        descricao: formData.descricao || null,
        cor: formData.cor,
        lider_principal_id: formData.lider_principal_id || null,
        lider_secundario_id: formData.lider_secundario_id || null,
      })
      .eq('id', selectedMinistry.id);

    if (error) {
      toast.error('Erro ao atualizar ministério');
      console.error(error);
    } else {
      toast.success('Ministério atualizado com sucesso');
      setIsEditDialogOpen(false);
      setSelectedMinistry(null);
      resetForm();
      fetchData();
    }

    setSaving(false);
  };

  const handleDeleteMinistry = async (ministry: Ministry) => {
    if (!confirm(`Deseja realmente excluir o ministério "${ministry.nome}"?`)) return;

    const { error } = await supabase
      .from('ministries')
      .delete()
      .eq('id', ministry.id);

    if (error) {
      toast.error('Erro ao excluir ministério');
    } else {
      toast.success('Ministério excluído');
      fetchData();
    }
  };

  const handleAddVolunteer = async (userId: string) => {
    if (!selectedMinistry || !churchId) return;

    const { error } = await supabase.from('ministry_volunteers').insert({
      ministry_id: selectedMinistry.id,
      user_id: userId,
      church_id: churchId,
    });

    if (error) {
      if (error.message.includes('Voluntário já está vinculado')) {
        toast.error('Este voluntário já está em uma igreja diferente');
      } else if (error.code === '23505') {
        toast.error('Voluntário já está neste ministério');
      } else {
        toast.error('Erro ao adicionar voluntário');
        console.error(error);
      }
    } else {
      toast.success('Voluntário adicionado');
      fetchData();
    }
  };

  const handleRemoveVolunteer = async (volunteerId: string) => {
    const { error } = await supabase
      .from('ministry_volunteers')
      .delete()
      .eq('id', volunteerId);

    if (error) {
      toast.error('Erro ao remover voluntário');
    } else {
      toast.success('Voluntário removido');
      fetchData();
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      cor: '#8B5CF6',
      lider_principal_id: '',
      lider_secundario_id: '',
    });
  };

  const openEditDialog = (ministry: Ministry) => {
    setSelectedMinistry(ministry);
    setFormData({
      nome: ministry.nome,
      descricao: ministry.descricao || '',
      cor: ministry.cor,
      lider_principal_id: ministry.lider_principal_id || '',
      lider_secundario_id: ministry.lider_secundario_id || '',
    });
    setIsEditDialogOpen(true);
  };

  const openVolunteerDialog = (ministry: Ministry) => {
    setSelectedMinistry(ministry);
    setIsVolunteerDialogOpen(true);
  };

  const getLeaderName = (userId: string | null) => {
    if (!userId) return null;
    const user = users.find(u => u.id === userId);
    return user?.nome || 'Desconhecido';
  };

  const getMinistryVolunteers = (ministryId: string) => {
    return volunteers.filter(v => v.ministry_id === ministryId);
  };

  const filteredMinistries = ministries.filter(m =>
    m.nome.toLowerCase().includes(search.toLowerCase())
  );

  if (loading || loadingChurch) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Rede Ministerial
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie ministérios, líderes e voluntários
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ministério..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Novo Ministério</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Ministério</DialogTitle>
                <DialogDescription>
                  Preencha os dados do novo ministério
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    placeholder="Ex: Louvor, Mídia, Recepção..."
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Descreva o ministério..."
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Cor
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, cor: color.value })}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          formData.cor === color.value ? 'border-foreground scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-500" />
                      Líder Principal
                    </Label>
                    <SearchableUserSelect
                      users={users}
                      value={formData.lider_principal_id}
                      onValueChange={(value) => setFormData({ ...formData, lider_principal_id: value })}
                      placeholder="Buscar líder..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-500" />
                      Líder Secundário
                    </Label>
                    <SearchableUserSelect
                      users={users}
                      value={formData.lider_secundario_id}
                      onValueChange={(value) => setFormData({ ...formData, lider_secundario_id: value })}
                      placeholder="Buscar líder..."
                      excludeIds={formData.lider_principal_id ? [formData.lider_principal_id] : []}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateMinistry} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Criar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Ministries Grid */}
      {filteredMinistries.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {search ? 'Nenhum ministério encontrado.' : 'Nenhum ministério cadastrado ainda.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMinistries.map((ministry) => {
            const ministryVolunteers = getMinistryVolunteers(ministry.id);
            const liderPrincipal = getLeaderName(ministry.lider_principal_id);
            const liderSecundario = getLeaderName(ministry.lider_secundario_id);

            return (
              <Card key={ministry.id} className="overflow-hidden">
                <div className="h-2" style={{ backgroundColor: ministry.cor }} />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{ministry.nome}</CardTitle>
                      {ministry.descricao && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {ministry.descricao}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(ministry)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteMinistry(ministry)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Leaders */}
                  <div className="space-y-2">
                    {liderPrincipal && (
                      <div className="flex items-center gap-2 text-sm">
                        <Crown className="h-4 w-4 text-amber-500" />
                        <span className="text-muted-foreground">Líder:</span>
                        <span className="font-medium">{liderPrincipal}</span>
                      </div>
                    )}
                    {liderSecundario && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-blue-500" />
                        <span className="text-muted-foreground">Vice-líder:</span>
                        <span className="font-medium">{liderSecundario}</span>
                      </div>
                    )}
                    {!liderPrincipal && !liderSecundario && (
                      <p className="text-sm text-muted-foreground italic">Sem líderes definidos</p>
                    )}
                  </div>

                  {/* Volunteers */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {ministryVolunteers.length} voluntário(s)
                      </span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openVolunteerDialog(ministry)}>
                      <UserPlus className="h-4 w-4 mr-1" />
                      Gerenciar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Ministry Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Ministério</DialogTitle>
            <DialogDescription>
              Atualize os dados do ministério
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                placeholder="Ex: Louvor, Mídia, Recepção..."
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descreva o ministério..."
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Cor
              </Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, cor: color.value })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.cor === color.value ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-500" />
                  Líder Principal
                </Label>
                <SearchableUserSelect
                  users={users}
                  value={formData.lider_principal_id}
                  onValueChange={(value) => setFormData({ ...formData, lider_principal_id: value })}
                  placeholder="Buscar líder..."
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" />
                  Líder Secundário
                </Label>
                <SearchableUserSelect
                  users={users}
                  value={formData.lider_secundario_id}
                  onValueChange={(value) => setFormData({ ...formData, lider_secundario_id: value })}
                  placeholder="Buscar líder..."
                  excludeIds={formData.lider_principal_id ? [formData.lider_principal_id] : []}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateMinistry} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Volunteers Dialog */}
      <Dialog open={isVolunteerDialogOpen} onOpenChange={setIsVolunteerDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Voluntários - {selectedMinistry?.nome}
            </DialogTitle>
            <DialogDescription>
              Gerencie os voluntários deste ministério
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="current" className="mt-4">
            <TabsList className="w-full">
              <TabsTrigger value="current" className="flex-1">Atuais</TabsTrigger>
              <TabsTrigger value="add" className="flex-1">Adicionar</TabsTrigger>
            </TabsList>
            <TabsContent value="current" className="mt-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar voluntário por nome..."
                  className="pl-9"
                  value={currentVolunteerSearch}
                  onChange={(e) => setCurrentVolunteerSearch(e.target.value)}
                />
              </div>
              <ScrollArea className="h-[260px]">
                {selectedMinistry && getMinistryVolunteers(selectedMinistry.id).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum voluntário neste ministério
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedMinistry && getMinistryVolunteers(selectedMinistry.id)
                      .filter((volunteer) => {
                        const user = users.find(u => u.id === volunteer.user_id);
                        return user?.nome.toLowerCase().includes(currentVolunteerSearch.toLowerCase());
                      })
                      .map((volunteer) => {
                        const user = users.find(u => u.id === volunteer.user_id);
                        return (
                          <div
                            key={volunteer.id}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                                {user?.nome?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <span className="font-medium">{user?.nome || 'Desconhecido'}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveVolunteer(volunteer.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="add" className="mt-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário por nome..."
                  className="pl-9"
                  value={volunteerSearch}
                  onChange={(e) => setVolunteerSearch(e.target.value)}
                />
              </div>
              <ScrollArea className="h-[260px]">
                <div className="space-y-2">
                  {users
                    .filter(user => {
                      if (!selectedMinistry) return false;
                      const ministryVols = getMinistryVolunteers(selectedMinistry.id);
                      const isNotVolunteer = !ministryVols.some(v => v.user_id === user.id);
                      const matchesSearch = user.nome.toLowerCase().includes(volunteerSearch.toLowerCase());
                      return isNotVolunteer && matchesSearch;
                    })
                    .map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                            {user.nome.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{user.nome}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddVolunteer(user.id)}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Info Card */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <h4 className="font-medium text-foreground mb-2">Sobre a Rede Ministerial</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" />
            <strong>Líder Principal:</strong> Responsável pelo ministério
          </li>
          <li className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-500" />
            <strong>Líder Secundário:</strong> Auxilia na liderança
          </li>
          <li className="flex items-center gap-2">
            <Users className="h-4 w-4 text-green-500" />
            <strong>Voluntários:</strong> Membros que servem no ministério
          </li>
        </ul>
        <p className="text-xs text-muted-foreground mt-3">
          Um líder pode liderar múltiplos ministérios. Um voluntário pode participar de vários ministérios, mas apenas na mesma igreja.
        </p>
      </div>
    </div>
  );
}
