import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Trash2, UserPlus, Calendar, Clock, ChevronDown, ChevronRight, Check, X, AlertCircle, Users, GripVertical } from 'lucide-react';
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
import { useUserChurchId } from '@/hooks/useUserChurchId';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { SearchableUserSelect } from './SearchableUserSelect';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  nome: string;
  data_hora: string;
  is_special_event: boolean;
}

interface Ministry {
  id: string;
  nome: string;
  cor: string;
}

interface Position {
  id: string;
  nome: string;
  quantidade_minima: number;
  ministry_id: string;
  is_active: boolean;
  genero_restrito: 'masculino' | 'feminino' | 'unissex' | null;
}

interface Volunteer {
  id: string;
  user_id: string;
  ministry_id: string;
}

interface UserProfile {
  id: string;
  nome: string;
  genero: 'masculino' | 'feminino' | 'unissex' | null;
}

interface Schedule {
  id: string;
  service_id: string;
  ministry_id: string;
  position_id: string;
  volunteer_id: string;
  status: string;
  confirmed_at: string | null;
}

interface VolunteerAvailability {
  id: string;
  volunteer_id: string;
  service_id: string;
  is_available: boolean;
  notes: string | null;
}

interface ServiceScheduleBuilderProps {
  serviceId?: string;
}

// Draggable Schedule Component
function DraggableSchedule({ 
  schedule, 
  volunteerName, 
  statusBadge, 
  onRemove 
}: { 
  schedule: Schedule; 
  volunteerName: string; 
  statusBadge: React.ReactNode; 
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: schedule.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between p-2 bg-background rounded border transition-all",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
          {volunteerName.charAt(0).toUpperCase()}
        </div>
        <span className="font-medium text-sm">
          {volunteerName}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {statusBadge}
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

// Droppable Position Component
function DroppablePosition({ 
  position, 
  isFilled, 
  children 
}: { 
  position: Position; 
  isFilled: boolean; 
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: position.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "p-4 rounded-lg border transition-all",
        isFilled ? 'bg-green-50/50 border-green-200 dark:bg-green-900/10' : 'bg-background',
        isOver && 'ring-2 ring-primary ring-offset-2 bg-primary/5'
      )}
    >
      {children}
    </div>
  );
}

export function ServiceScheduleBuilder({ serviceId }: ServiceScheduleBuilderProps) {
  const { churchId, loading: loadingChurch } = useUserChurchId();
  const [services, setServices] = useState<Service[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [availability, setAvailability] = useState<VolunteerAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(serviceId || '');
  const [expandedMinistries, setExpandedMinistries] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [leaderMinistryIds, setLeaderMinistryIds] = useState<string[]>([]);

  // Dialog for adding volunteer to position
  const [isAddVolunteerOpen, setIsAddVolunteerOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('');

  useEffect(() => {
    if (churchId) {
      fetchData();
      getCurrentUser();
    }
  }, [churchId]);

  useEffect(() => {
    if (selectedServiceId) {
      fetchSchedules();
      fetchAvailability();
    }
  }, [selectedServiceId]);

  const getCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setCurrentUserId(session.user.id);
      
      // Check if user is admin
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);
      
      const userRoles = roles?.map(r => r.role) || [];
      setIsAdmin(userRoles.includes('admin') || userRoles.includes('super_admin'));
      
      // Get ministries where user is leader
      if (churchId) {
        const { data: leaderMinistries } = await supabase
          .from('ministries')
          .select('id')
          .eq('church_id', churchId)
          .or(`lider_principal_id.eq.${session.user.id},lider_secundario_id.eq.${session.user.id}`);
        
        setLeaderMinistryIds(leaderMinistries?.map(m => m.id) || []);
      }
    }
  };

  const fetchData = async () => {
    if (!churchId) return;
    setLoading(true);

    const [servicesRes, ministriesRes, positionsRes, volunteersRes, usersRes] = await Promise.all([
      supabase
        .from('services')
        .select('id, nome, data_hora, is_special_event')
        .eq('church_id', churchId)
        .gte('data_hora', new Date().toISOString())
        .order('data_hora', { ascending: true })
        .limit(20),
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
        .eq('is_active', true)
        .order('ordem'),
      supabase
        .from('ministry_volunteers')
        .select('id, user_id, ministry_id')
        .eq('church_id', churchId),
      supabase
        .from('profiles')
        .select('id, nome, genero')
        .eq('church_id', churchId)
        .order('nome'),
    ]);

    if (!servicesRes.error) setServices(servicesRes.data || []);
    if (!ministriesRes.error) {
      setMinistries(ministriesRes.data || []);
      setExpandedMinistries(new Set((ministriesRes.data || []).map(m => m.id)));
    }
    if (!positionsRes.error) setPositions(positionsRes.data || []);
    if (!volunteersRes.error) setVolunteers(volunteersRes.data || []);
    if (!usersRes.error) setUsers(usersRes.data || []);

    // Select first service by default
    if (servicesRes.data && servicesRes.data.length > 0 && !selectedServiceId) {
      setSelectedServiceId(servicesRes.data[0].id);
    }

    setLoading(false);
  };

  const fetchSchedules = async () => {
    if (!selectedServiceId) return;

    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('service_id', selectedServiceId);

    if (!error) {
      setSchedules(data || []);
    }
  };

  const fetchAvailability = async () => {
    if (!selectedServiceId) return;

    const { data, error } = await supabase
      .from('volunteer_availability')
      .select('*')
      .eq('service_id', selectedServiceId);

    if (!error) {
      setAvailability(data || []);
    }
  };

  const getVolunteerAvailability = (volunteerId: string): VolunteerAvailability | undefined => {
    return availability.find(a => a.volunteer_id === volunteerId);
  };

  const getMinistryPositions = (ministryId: string) => {
    return positions.filter(p => p.ministry_id === ministryId);
  };

  const getPositionSchedules = (positionId: string) => {
    return schedules.filter(s => s.position_id === positionId);
  };

  const getMinistryVolunteers = (ministryId: string, positionGenderRestriction?: 'masculino' | 'feminino' | 'unissex' | null) => {
    const volunteerIds = volunteers
      .filter(v => v.ministry_id === ministryId)
      .map(v => v.user_id);
    
    return users.filter(u => {
      // Must be a volunteer in the ministry
      if (!volunteerIds.includes(u.id)) return false;
      
      // If position has gender restriction, filter by gender
      if (positionGenderRestriction && positionGenderRestriction !== 'unissex') {
        // If user has no gender set, don't include them in restricted positions
        if (!u.genero) return false;
        if (u.genero !== positionGenderRestriction) return false;
      }
      
      return true;
    });
  };

  const getVolunteerName = (volunteerId: string) => {
    return users.find(u => u.id === volunteerId)?.nome || 'Desconhecido';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500/20 text-green-700 border-green-300">Confirmado</Badge>;
      case 'declined':
        return <Badge className="bg-red-500/20 text-red-700 border-red-300">Recusado</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-300">Pendente</Badge>;
    }
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

  const openAddVolunteer = (position: Position) => {
    setSelectedPosition(position);
    setSelectedVolunteerId('');
    setIsAddVolunteerOpen(true);
  };

  const sendScheduleNotification = async (volunteerId: string, positionName: string, ministryName: string) => {
    try {
      // Get volunteer email from auth.users via profiles
      const { data: userData } = await supabase.rpc('get_user_emails');
      const volunteerData = users.find(u => u.id === volunteerId);
      const volunteerEmail = userData?.find((u: { id: string; email: string }) => u.id === volunteerId)?.email;
      
      if (!volunteerEmail || !volunteerData || !selectedService) {
        console.log('Missing data for email notification');
        return;
      }

      const { error } = await supabase.functions.invoke('send-schedule-notification', {
        body: {
          volunteerEmail,
          volunteerName: volunteerData.nome,
          serviceName: selectedService.nome,
          serviceDate: selectedService.data_hora,
          positionName,
          ministryName,
        },
      });

      if (error) {
        console.error('Failed to send notification:', error);
      } else {
        console.log('Notification sent to:', volunteerEmail);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const handleAddVolunteer = async () => {
    if (!selectedPosition || !selectedVolunteerId || !selectedServiceId || !churchId) {
      toast.error('Selecione um voluntário');
      return;
    }

    // Check if already scheduled
    const existing = schedules.find(
      s => s.position_id === selectedPosition.id && s.volunteer_id === selectedVolunteerId
    );
    if (existing) {
      toast.error('Este voluntário já está escalado para esta posição');
      return;
    }

    // Check gender restriction
    if (selectedPosition.genero_restrito && selectedPosition.genero_restrito !== 'unissex') {
      const volunteer = users.find(u => u.id === selectedVolunteerId);
      if (!volunteer?.genero || volunteer.genero !== selectedPosition.genero_restrito) {
        const genderLabel = selectedPosition.genero_restrito === 'masculino' ? 'homens' : 'mulheres';
        toast.error(`Esta posição é restrita para ${genderLabel}`);
        return;
      }
    }

    setSaving(true);

    const { error } = await supabase.from('schedules').insert({
      service_id: selectedServiceId,
      ministry_id: selectedPosition.ministry_id,
      position_id: selectedPosition.id,
      volunteer_id: selectedVolunteerId,
      church_id: churchId,
      created_by: currentUserId,
      status: 'pending',
    });

    if (error) {
      toast.error('Erro ao escalar voluntário');
      console.error(error);
    } else {
      toast.success('Voluntário escalado com sucesso');
      setIsAddVolunteerOpen(false);
      fetchSchedules();
      
      // Send email notification
      const ministry = ministries.find(m => m.id === selectedPosition.ministry_id);
      sendScheduleNotification(
        selectedVolunteerId, 
        selectedPosition.nome, 
        ministry?.nome || 'Ministério'
      );
    }

    setSaving(false);
  };

  const handleRemoveSchedule = async (scheduleId: string) => {
    const { error } = await supabase.from('schedules').delete().eq('id', scheduleId);
    if (error) {
      toast.error('Erro ao remover da escala');
    } else {
      toast.success('Removido da escala');
      fetchSchedules();
    }
  };

  // Drag and Drop state
  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const scheduleId = event.active.id as string;
    const schedule = schedules.find(s => s.id === scheduleId);
    setActiveSchedule(schedule || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveSchedule(null);

    if (!over) return;

    const scheduleId = active.id as string;
    const targetPositionId = over.id as string;
    
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule || schedule.position_id === targetPositionId) return;

    // Get target position info
    const targetPosition = positions.find(p => p.id === targetPositionId);
    if (!targetPosition) return;

    // Check if volunteer is in the ministry for target position
    const volunteerInMinistry = volunteers.some(
      v => v.user_id === schedule.volunteer_id && v.ministry_id === targetPosition.ministry_id
    );

    if (!volunteerInMinistry) {
      toast.error('Voluntário não pertence a este ministério');
      return;
    }

    // Check gender restriction for target position
    if (targetPosition.genero_restrito && targetPosition.genero_restrito !== 'unissex') {
      const volunteer = users.find(u => u.id === schedule.volunteer_id);
      if (!volunteer?.genero || volunteer.genero !== targetPosition.genero_restrito) {
        const genderLabel = targetPosition.genero_restrito === 'masculino' ? 'homens' : 'mulheres';
        toast.error(`Esta posição é restrita para ${genderLabel}`);
        return;
      }
    }

    // Check if already scheduled in target position
    const alreadyScheduled = schedules.some(
      s => s.position_id === targetPositionId && s.volunteer_id === schedule.volunteer_id
    );

    if (alreadyScheduled) {
      toast.error('Voluntário já está escalado nesta posição');
      return;
    }

    // Update schedule
    setSaving(true);
    const { error } = await supabase
      .from('schedules')
      .update({ 
        position_id: targetPositionId,
        ministry_id: targetPosition.ministry_id 
      })
      .eq('id', scheduleId);

    if (error) {
      toast.error('Erro ao mover voluntário');
      console.error(error);
    } else {
      toast.success('Voluntário movido com sucesso');
      fetchSchedules();
    }
    setSaving(false);
  };

  // Calculate ministries that have positions (filter for ministry leaders)
  const ministriesWithPositions = useMemo(() => {
    let filteredMinistries = ministries.filter(m => positions.some(p => p.ministry_id === m.id));
    
    // If not admin, only show ministries where user is leader
    if (!isAdmin && leaderMinistryIds.length > 0) {
      filteredMinistries = filteredMinistries.filter(m => leaderMinistryIds.includes(m.id));
    }
    
    return filteredMinistries;
  }, [ministries, positions, isAdmin, leaderMinistryIds]);

  const selectedService = services.find(s => s.id === selectedServiceId);

  if (loadingChurch || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum culto agendado</p>
          <p className="text-sm text-muted-foreground mt-2">
            Cadastre cultos na aba "Agenda" primeiro
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Service Selector */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1">
          <Label className="text-sm text-muted-foreground mb-2 block">Selecione o Culto/Evento</Label>
          <div className="flex flex-wrap gap-2">
            {services.slice(0, 5).map((service) => (
              <Button
                key={service.id}
                variant={selectedServiceId === service.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedServiceId(service.id)}
                className="flex-shrink-0"
              >
                <Calendar className="h-3 w-3 mr-1" />
                {format(new Date(service.data_hora), 'dd/MM')} - {service.nome}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Service Info */}
      {selectedService && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="text-center min-w-[60px]">
                <div className="text-2xl font-bold text-primary">
                  {format(new Date(selectedService.data_hora), 'dd')}
                </div>
                <div className="text-xs text-muted-foreground uppercase">
                  {format(new Date(selectedService.data_hora), 'MMM', { locale: ptBR })}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{selectedService.nome}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {format(new Date(selectedService.data_hora), 'EEEE, HH:mm', { locale: ptBR })}
                </div>
              </div>
              <div className="ml-auto">
                <Badge variant="outline" className="text-sm">
                  {schedules.length} escalado{schedules.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ministries and Positions with Drag and Drop */}
      {ministriesWithPositions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma posição cadastrada</p>
            <p className="text-sm text-muted-foreground mt-2">
              Cadastre posições na aba "Posições" primeiro
            </p>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-3">
            {/* Drag instruction */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
              <GripVertical className="h-4 w-4" />
              <span>Arraste voluntários entre posições para reorganizar a escala</span>
            </div>

            {ministriesWithPositions.map((ministry) => {
              const ministryPositions = getMinistryPositions(ministry.id);
              const isExpanded = expandedMinistries.has(ministry.id);
              const ministryScheduleCount = schedules.filter(s => s.ministry_id === ministry.id).length;

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
                          </div>
                          <Badge variant="secondary">
                            {ministryScheduleCount}/{ministryPositions.reduce((sum, p) => sum + p.quantidade_minima, 0)}
                          </Badge>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-4">
                        {ministryPositions.map((position) => {
                          const positionSchedules = getPositionSchedules(position.id);
                          const isFilled = positionSchedules.length >= position.quantidade_minima;

                          return (
                            <DroppablePosition
                              key={position.id}
                              position={position}
                              isFilled={isFilled}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium">{position.nome}</span>
                                  <Badge variant={isFilled ? 'default' : 'secondary'} className="text-xs">
                                    {positionSchedules.length}/{position.quantidade_minima}
                                  </Badge>
                                  {position.genero_restrito && position.genero_restrito !== 'unissex' && (
                                    <Badge variant="outline" className="text-xs">
                                      {position.genero_restrito === 'masculino' ? '♂' : '♀'}
                                    </Badge>
                                  )}
                                  {!isFilled && (
                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openAddVolunteer(position)}
                                >
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Escalar
                                </Button>
                              </div>

                              {positionSchedules.length > 0 ? (
                                <div className="space-y-2">
                                  {positionSchedules.map((schedule) => (
                                    <DraggableSchedule
                                      key={schedule.id}
                                      schedule={schedule}
                                      volunteerName={getVolunteerName(schedule.volunteer_id)}
                                      statusBadge={getStatusBadge(schedule.status)}
                                      onRemove={() => handleRemoveSchedule(schedule.id)}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground text-center py-2">
                                  Nenhum voluntário escalado
                                </p>
                              )}
                            </DroppablePosition>
                          );
                        })}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>

          <DragOverlay>
            {activeSchedule && (
              <div className="flex items-center gap-3 p-2 bg-background rounded border shadow-lg">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                  {getVolunteerName(activeSchedule.volunteer_id).charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-sm">
                  {getVolunteerName(activeSchedule.volunteer_id)}
                </span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Dialog: Add Volunteer */}
      <Dialog open={isAddVolunteerOpen} onOpenChange={setIsAddVolunteerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escalar Voluntário</DialogTitle>
            <DialogDescription>
              {selectedPosition && (
                <div className="flex items-center gap-2">
                  <span>Posição: <strong>{selectedPosition.nome}</strong></span>
                  {selectedPosition.genero_restrito && selectedPosition.genero_restrito !== 'unissex' && (
                    <Badge variant="outline" className="text-xs">
                      {selectedPosition.genero_restrito === 'masculino' ? '♂ Homens' : '♀ Mulheres'}
                    </Badge>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Selecione o Voluntário</Label>
              {selectedPosition && (
                <>
                  <SearchableUserSelect
                    users={getMinistryVolunteers(selectedPosition.ministry_id, selectedPosition.genero_restrito)}
                    value={selectedVolunteerId}
                    onValueChange={setSelectedVolunteerId}
                    placeholder="Buscar voluntário..."
                    excludeIds={getPositionSchedules(selectedPosition.id).map(s => s.volunteer_id)}
                  />
                  
                  {/* Show availability info for selected volunteer */}
                  {selectedVolunteerId && (() => {
                    const volAvail = getVolunteerAvailability(selectedVolunteerId);
                    if (volAvail) {
                      return (
                        <div className={`p-3 rounded-lg border mt-2 ${
                          volAvail.is_available 
                            ? 'bg-green-500/10 border-green-500/30' 
                            : 'bg-destructive/10 border-destructive/30'
                        }`}>
                          <div className="flex items-center gap-2">
                            {volAvail.is_available ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <X className="w-4 h-4 text-destructive" />
                            )}
                            <span className={`text-sm font-medium ${
                              volAvail.is_available ? 'text-green-700' : 'text-destructive'
                            }`}>
                              {volAvail.is_available ? 'Disponível' : 'Indisponível'}
                            </span>
                          </div>
                          {volAvail.notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              "{volAvail.notes}"
                            </p>
                          )}
                        </div>
                      );
                    }
                    return (
                      <div className="p-3 rounded-lg border bg-amber-500/10 border-amber-500/30 mt-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-700">
                            Disponibilidade não informada
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
              <p className="text-xs text-muted-foreground">
                {selectedPosition?.genero_restrito && selectedPosition.genero_restrito !== 'unissex' 
                  ? `Mostrando apenas voluntários ${selectedPosition.genero_restrito === 'masculino' ? 'homens' : 'mulheres'} do ministério`
                  : 'Mostrando apenas voluntários do ministério'
                }
              </p>
            </div>
            
            {/* Availability legend */}
            {selectedPosition && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">Legenda de disponibilidade:</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-700">
                    <Check className="w-3 h-3 mr-1" />
                    Disponível
                  </Badge>
                  <Badge variant="outline" className="bg-destructive/10 border-destructive/30 text-destructive">
                    <X className="w-3 h-3 mr-1" />
                    Indisponível
                  </Badge>
                  <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-700">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Não informado
                  </Badge>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddVolunteerOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddVolunteer} disabled={saving || !selectedVolunteerId}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Escalar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
