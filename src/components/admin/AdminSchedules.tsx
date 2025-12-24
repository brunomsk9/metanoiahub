import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Plus, Search, Calendar, Clock, Users, ChevronRight, CalendarDays, Church, Trash2, Edit, Briefcase } from 'lucide-react';
import { AdminMinistryPositions } from './AdminMinistryPositions';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserChurchId } from '@/hooks/useUserChurchId';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DIAS_SEMANA = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

interface ServiceType {
  id: string;
  nome: string;
  descricao: string | null;
  dia_semana: number | null;
  horario: string | null;
  is_recurring: boolean;
  is_active: boolean;
  church_id: string;
}

interface Service {
  id: string;
  nome: string;
  descricao: string | null;
  data_hora: string;
  is_special_event: boolean;
  status: string;
  service_type_id: string | null;
  church_id: string;
}

export function AdminSchedules() {
  const { churchId, loading: loadingChurch } = useUserChurchId();
  const [activeTab, setActiveTab] = useState('cultos');
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  
  // Dialog states
  const [isServiceTypeDialogOpen, setIsServiceTypeDialogOpen] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [editingServiceType, setEditingServiceType] = useState<ServiceType | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  // Form states
  const [serviceTypeForm, setServiceTypeForm] = useState({
    nome: '',
    descricao: '',
    dia_semana: '',
    horario: '',
    is_recurring: true,
  });
  
  const [serviceForm, setServiceForm] = useState({
    nome: '',
    descricao: '',
    data_hora: '',
    is_special_event: false,
    service_type_id: '',
  });

  useEffect(() => {
    if (churchId) {
      fetchData();
    }
  }, [churchId]);

  const fetchData = async () => {
    if (!churchId) return;
    setLoading(true);

    const [serviceTypesRes, servicesRes] = await Promise.all([
      supabase
        .from('service_types')
        .select('*')
        .eq('church_id', churchId)
        .order('dia_semana', { ascending: true }),
      supabase
        .from('services')
        .select('*')
        .eq('church_id', churchId)
        .gte('data_hora', new Date().toISOString())
        .order('data_hora', { ascending: true })
        .limit(50),
    ]);

    if (serviceTypesRes.error) {
      toast.error('Erro ao carregar tipos de culto');
    } else {
      setServiceTypes(serviceTypesRes.data || []);
    }

    if (servicesRes.error) {
      toast.error('Erro ao carregar cultos');
    } else {
      setServices(servicesRes.data || []);
    }

    setLoading(false);
  };

  const handleCreateServiceType = async () => {
    if (!serviceTypeForm.nome.trim() || !churchId) {
      toast.error('Nome é obrigatório');
      return;
    }

    setSaving(true);

    const data = {
      nome: serviceTypeForm.nome,
      descricao: serviceTypeForm.descricao || null,
      dia_semana: serviceTypeForm.dia_semana ? parseInt(serviceTypeForm.dia_semana) : null,
      horario: serviceTypeForm.horario || null,
      is_recurring: serviceTypeForm.is_recurring,
      church_id: churchId,
    };

    const { error } = editingServiceType
      ? await supabase.from('service_types').update(data).eq('id', editingServiceType.id)
      : await supabase.from('service_types').insert(data);

    if (error) {
      toast.error('Erro ao salvar tipo de culto');
    } else {
      toast.success(editingServiceType ? 'Tipo de culto atualizado' : 'Tipo de culto criado');
      setIsServiceTypeDialogOpen(false);
      resetServiceTypeForm();
      fetchData();
    }

    setSaving(false);
  };

  const handleCreateService = async () => {
    if (!serviceForm.nome.trim() || !serviceForm.data_hora || !churchId) {
      toast.error('Nome e data/hora são obrigatórios');
      return;
    }

    setSaving(true);

    const data = {
      nome: serviceForm.nome,
      descricao: serviceForm.descricao || null,
      data_hora: serviceForm.data_hora,
      is_special_event: serviceForm.is_special_event,
      service_type_id: serviceForm.service_type_id || null,
      church_id: churchId,
    };

    const { error } = editingService
      ? await supabase.from('services').update(data).eq('id', editingService.id)
      : await supabase.from('services').insert(data);

    if (error) {
      toast.error('Erro ao salvar culto/evento');
    } else {
      toast.success(editingService ? 'Culto atualizado' : 'Culto criado');
      setIsServiceDialogOpen(false);
      resetServiceForm();
      fetchData();
    }

    setSaving(false);
  };

  const handleDeleteServiceType = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este tipo de culto?')) return;

    const { error } = await supabase.from('service_types').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir');
    } else {
      toast.success('Tipo de culto excluído');
      fetchData();
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este culto/evento?')) return;

    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir');
    } else {
      toast.success('Culto excluído');
      fetchData();
    }
  };

  const resetServiceTypeForm = () => {
    setServiceTypeForm({
      nome: '',
      descricao: '',
      dia_semana: '',
      horario: '',
      is_recurring: true,
    });
    setEditingServiceType(null);
  };

  const resetServiceForm = () => {
    setServiceForm({
      nome: '',
      descricao: '',
      data_hora: '',
      is_special_event: false,
      service_type_id: '',
    });
    setEditingService(null);
  };

  const openEditServiceType = (st: ServiceType) => {
    setEditingServiceType(st);
    setServiceTypeForm({
      nome: st.nome,
      descricao: st.descricao || '',
      dia_semana: st.dia_semana?.toString() || '',
      horario: st.horario || '',
      is_recurring: st.is_recurring,
    });
    setIsServiceTypeDialogOpen(true);
  };

  const openEditService = (s: Service) => {
    setEditingService(s);
    setServiceForm({
      nome: s.nome,
      descricao: s.descricao || '',
      data_hora: s.data_hora.slice(0, 16),
      is_special_event: s.is_special_event,
      service_type_id: s.service_type_id || '',
    });
    setIsServiceDialogOpen(true);
  };

  const filteredServiceTypes = serviceTypes.filter(st =>
    st.nome.toLowerCase().includes(search.toLowerCase())
  );

  const filteredServices = services.filter(s =>
    s.nome.toLowerCase().includes(search.toLowerCase())
  );

  if (loadingChurch || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="cultos" className="flex-1 sm:flex-initial">
            <Church className="h-4 w-4 mr-2" />
            Tipos de Culto
          </TabsTrigger>
          <TabsTrigger value="posicoes" className="flex-1 sm:flex-initial">
            <Briefcase className="h-4 w-4 mr-2" />
            Posições
          </TabsTrigger>
          <TabsTrigger value="agenda" className="flex-1 sm:flex-initial">
            <CalendarDays className="h-4 w-4 mr-2" />
            Agenda
          </TabsTrigger>
        </TabsList>

        {/* Tipos de Culto */}
        <TabsContent value="cultos" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Tipos de Culto/Evento</h3>
            <Button onClick={() => { resetServiceTypeForm(); setIsServiceTypeDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Tipo
            </Button>
          </div>

          {filteredServiceTypes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Church className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum tipo de culto cadastrado</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsServiceTypeDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Tipo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredServiceTypes.map((st) => (
                <Card key={st.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Church className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{st.nome}</CardTitle>
                          {st.is_recurring && st.dia_semana !== null && (
                            <CardDescription className="text-xs">
                              {DIAS_SEMANA.find(d => d.value === st.dia_semana)?.label}
                              {st.horario && ` às ${st.horario.slice(0, 5)}`}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditServiceType(st)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteServiceType(st.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {st.descricao && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{st.descricao}</p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Badge variant={st.is_recurring ? 'default' : 'secondary'}>
                        {st.is_recurring ? 'Recorrente' : 'Único'}
                      </Badge>
                      <Badge variant={st.is_active ? 'outline' : 'secondary'}>
                        {st.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Posições por Ministério */}
        <TabsContent value="posicoes" className="mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Posições por Ministério</h3>
            <p className="text-sm text-muted-foreground">
              Configure as posições disponíveis em cada ministério para escalar voluntários
            </p>
          </div>
          <AdminMinistryPositions />
        </TabsContent>

        {/* Agenda */}
        <TabsContent value="agenda" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Próximos Cultos/Eventos</h3>
            <Button onClick={() => { resetServiceForm(); setIsServiceDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Culto/Evento
            </Button>
          </div>

          {filteredServices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum culto agendado</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsServiceDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agendar Primeiro Culto
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredServices.map((s) => {
                const serviceType = serviceTypes.find(st => st.id === s.service_type_id);
                return (
                  <Card key={s.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[60px]">
                            <div className="text-2xl font-bold text-primary">
                              {format(new Date(s.data_hora), 'dd')}
                            </div>
                            <div className="text-xs text-muted-foreground uppercase">
                              {format(new Date(s.data_hora), 'MMM', { locale: ptBR })}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium">{s.nome}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(new Date(s.data_hora), 'HH:mm')}
                              {serviceType && (
                                <>
                                  <span className="mx-1">•</span>
                                  {serviceType.nome}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {s.is_special_event && (
                            <Badge variant="secondary">Evento Especial</Badge>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => openEditService(s)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteService(s.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog: Service Type */}
      <Dialog open={isServiceTypeDialogOpen} onOpenChange={(open) => { setIsServiceTypeDialogOpen(open); if (!open) resetServiceTypeForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingServiceType ? 'Editar' : 'Novo'} Tipo de Culto</DialogTitle>
            <DialogDescription>
              Configure os detalhes do tipo de culto ou evento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                placeholder="Ex: Culto de Domingo"
                value={serviceTypeForm.nome}
                onChange={(e) => setServiceTypeForm({ ...serviceTypeForm, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descrição opcional..."
                value={serviceTypeForm.descricao}
                onChange={(e) => setServiceTypeForm({ ...serviceTypeForm, descricao: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dia da Semana</Label>
                <Select
                  value={serviceTypeForm.dia_semana}
                  onValueChange={(value) => setServiceTypeForm({ ...serviceTypeForm, dia_semana: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAS_SEMANA.map((dia) => (
                      <SelectItem key={dia.value} value={dia.value.toString()}>
                        {dia.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <Input
                  type="time"
                  value={serviceTypeForm.horario}
                  onChange={(e) => setServiceTypeForm({ ...serviceTypeForm, horario: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsServiceTypeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateServiceType} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingServiceType ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Service */}
      <Dialog open={isServiceDialogOpen} onOpenChange={(open) => { setIsServiceDialogOpen(open); if (!open) resetServiceForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? 'Editar' : 'Novo'} Culto/Evento</DialogTitle>
            <DialogDescription>
              Agende um novo culto ou evento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Culto</Label>
              <Select
                value={serviceForm.service_type_id}
                onValueChange={(value) => {
                  const st = serviceTypes.find(s => s.id === value);
                  setServiceForm({ 
                    ...serviceForm, 
                    service_type_id: value,
                    nome: st?.nome || serviceForm.nome,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um tipo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Evento Especial (sem tipo)</SelectItem>
                  {serviceTypes.filter(st => st.is_active).map((st) => (
                    <SelectItem key={st.id} value={st.id}>
                      {st.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                placeholder="Ex: Culto de Domingo - 15/12"
                value={serviceForm.nome}
                onChange={(e) => setServiceForm({ ...serviceForm, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Data e Hora *</Label>
              <Input
                type="datetime-local"
                value={serviceForm.data_hora}
                onChange={(e) => setServiceForm({ ...serviceForm, data_hora: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descrição opcional..."
                value={serviceForm.descricao}
                onChange={(e) => setServiceForm({ ...serviceForm, descricao: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsServiceDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateService} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingService ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
