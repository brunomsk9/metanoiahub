import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout";
import { PageTransition } from "@/components/PageTransition";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Users, CheckCircle, XCircle, Loader2, CalendarCheck, CalendarX, Sparkles, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Schedule {
  id: string;
  status: string;
  confirmed_at: string | null;
  notes: string | null;
  service: {
    id: string;
    nome: string;
    data_hora: string;
    descricao: string | null;
  };
  ministry: {
    id: string;
    nome: string;
    cor: string | null;
    icone: string | null;
  };
  position: {
    id: string;
    nome: string;
  };
}

interface Service {
  id: string;
  nome: string;
  data_hora: string;
  descricao: string | null;
}

interface Availability {
  id: string;
  service_id: string;
  is_available: boolean;
  notes: string | null;
}

export default function MySchedules() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [userName, setUserName] = useState("");
  const [updatingSchedule, setUpdatingSchedule] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [churchId, setChurchId] = useState<string | null>(null);
  
  // Availability states
  const [upcomingServices, setUpcomingServices] = useState<Service[]>([]);
  const [availabilities, setAvailabilities] = useState<Map<string, Availability>>(new Map());
  const [updatingAvailability, setUpdatingAvailability] = useState<string | null>(null);
  const [availabilityNotes, setAvailabilityNotes] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    
    setUserId(session.user.id);
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('nome, church_id')
      .eq('id', session.user.id)
      .single();
    
    if (profile) {
      setUserName(profile.nome);
      setChurchId(profile.church_id);
    }
    
    await Promise.all([
      fetchSchedules(session.user.id),
      fetchUpcomingServices(profile?.church_id, session.user.id)
    ]);
  };

  const fetchSchedules = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          id,
          status,
          confirmed_at,
          notes,
          service:services!schedules_service_id_fkey (
            id,
            nome,
            data_hora,
            descricao
          ),
          ministry:ministries!schedules_ministry_id_fkey (
            id,
            nome,
            cor,
            icone
          ),
          position:ministry_positions!schedules_position_id_fkey (
            id,
            nome
          )
        `)
        .eq('volunteer_id', userId)
        .gte('service.data_hora', new Date().toISOString())
        .order('service(data_hora)', { ascending: true });

      if (error) throw error;
      
      const validSchedules = (data || []).filter(s => s.service !== null) as Schedule[];
      setSchedules(validSchedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Erro ao carregar escalas');
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingServices = async (churchId: string | null, userId: string) => {
    if (!churchId) return;
    
    try {
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, nome, data_hora, descricao')
        .eq('church_id', churchId)
        .gte('data_hora', new Date().toISOString())
        .order('data_hora', { ascending: true })
        .limit(10);

      if (servicesError) throw servicesError;
      setUpcomingServices(services || []);

      const { data: userAvailabilities, error: availError } = await supabase
        .from('volunteer_availability')
        .select('id, service_id, is_available, notes')
        .eq('volunteer_id', userId);

      if (availError) throw availError;

      const availMap = new Map<string, Availability>();
      const notesMap = new Map<string, string>();
      (userAvailabilities || []).forEach(a => {
        availMap.set(a.service_id, a);
        notesMap.set(a.service_id, a.notes || '');
      });
      setAvailabilities(availMap);
      setAvailabilityNotes(notesMap);
    } catch (error) {
      console.error('Error fetching services/availability:', error);
    }
  };

  const handleAvailabilityChange = async (serviceId: string, isAvailable: boolean) => {
    if (!userId || !churchId) return;
    
    setUpdatingAvailability(serviceId);
    try {
      const existingAvailability = availabilities.get(serviceId);
      const notes = availabilityNotes.get(serviceId) || null;

      if (existingAvailability) {
        const { error } = await supabase
          .from('volunteer_availability')
          .update({ is_available: isAvailable, notes })
          .eq('id', existingAvailability.id);

        if (error) throw error;

        setAvailabilities(prev => {
          const newMap = new Map(prev);
          newMap.set(serviceId, { ...existingAvailability, is_available: isAvailable, notes });
          return newMap;
        });
      } else {
        const { data, error } = await supabase
          .from('volunteer_availability')
          .insert({
            service_id: serviceId,
            volunteer_id: userId,
            church_id: churchId,
            is_available: isAvailable,
            notes
          })
          .select()
          .single();

        if (error) throw error;

        setAvailabilities(prev => {
          const newMap = new Map(prev);
          newMap.set(serviceId, data);
          return newMap;
        });
      }

      toast.success(isAvailable ? 'Disponibilidade confirmada!' : 'Indisponibilidade registrada');
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Erro ao atualizar disponibilidade');
    } finally {
      setUpdatingAvailability(null);
    }
  };

  const handleUpdateStatus = async (scheduleId: string, newStatus: 'confirmed' | 'declined') => {
    setUpdatingSchedule(scheduleId);
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ 
          status: newStatus,
          confirmed_at: newStatus === 'confirmed' ? new Date().toISOString() : null
        })
        .eq('id', scheduleId);

      if (error) throw error;

      setSchedules(prev => prev.map(s => 
        s.id === scheduleId 
          ? { ...s, status: newStatus, confirmed_at: newStatus === 'confirmed' ? new Date().toISOString() : null }
          : s
      ));

      toast.success(newStatus === 'confirmed' ? 'Presença confirmada!' : 'Escala recusada');
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Erro ao atualizar escala');
    } finally {
      setUpdatingSchedule(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30 font-medium">Confirmado</Badge>;
      case 'declined':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30 font-medium">Recusado</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 font-medium">Pendente</Badge>;
    }
  };

  const upcomingSchedules = schedules.filter(s => s.status !== 'declined');
  const declinedSchedules = schedules.filter(s => s.status === 'declined');

  return (
    <PageTransition>
      <AppShell onLogout={handleLogout} userName={userName}>
        <div className="pb-20 md:pb-0 space-y-6">
          {/* Breadcrumb */}
          <PageBreadcrumb items={[{ label: 'Minhas Escalas' }]} />

          {/* Header */}
          <header className="section-pattern rounded-2xl p-6 border border-border/50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <CalendarDays className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-display font-bold">
                  <span className="text-gradient">Minhas Escalas</span>
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Visualize e confirme suas escalas de serviço
                </p>
              </div>
            </div>
          </header>

          {/* Availability Section */}
          {upcomingServices.length > 0 && (
            <section className="glass-effect rounded-2xl p-4 md:p-5 border border-border/50">
              <h2 className="text-base md:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-primary shrink-0" />
                Informar Disponibilidade
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {upcomingServices.map((service) => {
                  const availability = availabilities.get(service.id);
                  const isUpdating = updatingAvailability === service.id;
                  
                  return (
                    <div 
                      key={service.id} 
                      className="rounded-xl bg-secondary/30 border border-border/30 p-4 hover:border-border/50 transition-colors"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-foreground text-sm md:text-base">{service.nome}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 shrink-0" />
                              {format(new Date(service.data_hora), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              {format(new Date(service.data_hora), "HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          {availability && (
                            <div className="mt-3">
                              <Textarea
                                placeholder="Observações (opcional)"
                                value={availabilityNotes.get(service.id) || ''}
                                onChange={(e) => setAvailabilityNotes(prev => {
                                  const newMap = new Map(prev);
                                  newMap.set(service.id, e.target.value);
                                  return newMap;
                                })}
                                className="text-sm h-16 resize-none rounded-xl bg-secondary/50 border-border/50"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant={availability?.is_available === true ? "default" : "outline"}
                            onClick={() => handleAvailabilityChange(service.id, true)}
                            disabled={isUpdating}
                            className={`flex-1 sm:flex-none rounded-lg ${availability?.is_available === true 
                              ? "bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20" 
                              : "border-green-500/30 text-green-500 hover:bg-green-500/10"}`}
                          >
                            {isUpdating ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CalendarCheck className="w-4 h-4 mr-1.5" />
                                <span className="hidden xs:inline">Disponível</span>
                                <span className="xs:hidden">Disp.</span>
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant={availability?.is_available === false ? "default" : "outline"}
                            onClick={() => handleAvailabilityChange(service.id, false)}
                            disabled={isUpdating}
                            className={`flex-1 sm:flex-none rounded-lg ${availability?.is_available === false 
                              ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20" 
                              : "border-red-500/30 text-red-500 hover:bg-red-500/10"}`}
                          >
                            {isUpdating ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CalendarX className="w-4 h-4 mr-1.5" />
                                <span className="hidden xs:inline">Indisponível</span>
                                <span className="xs:hidden">Indisp.</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center animate-pulse">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
            </div>
          ) : schedules.length === 0 ? (
            <div className="glass-effect rounded-2xl p-12 border border-border/50 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-primary/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhuma escala encontrada
              </h3>
              <p className="text-muted-foreground">
                Você ainda não foi escalado para nenhum serviço futuro.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {upcomingSchedules.length > 0 && (
                <section>
                  <h2 className="text-base md:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary shrink-0" />
                    Próximas Escalas
                    <Badge variant="secondary" className="ml-2 text-xs">{upcomingSchedules.length}</Badge>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {upcomingSchedules.map((schedule) => (
                      <div 
                        key={schedule.id} 
                        className="glass-effect rounded-2xl border border-border/50 overflow-hidden hover:border-primary/30 transition-all duration-300"
                      >
                        <div 
                          className="h-1.5" 
                          style={{ backgroundColor: schedule.ministry.cor || 'hsl(var(--primary))' }}
                        />
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-foreground">
                                {schedule.service.nome}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <Badge 
                                  variant="outline" 
                                  className="rounded-lg"
                                  style={{ 
                                    borderColor: schedule.ministry.cor || 'hsl(var(--primary))',
                                    color: schedule.ministry.cor || 'hsl(var(--primary))'
                                  }}
                                >
                                  {schedule.ministry.nome}
                                </Badge>
                                {getStatusBadge(schedule.status)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3 mb-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/30 rounded-lg px-3 py-2">
                              <Calendar className="w-4 h-4 text-primary shrink-0" />
                              <span className="truncate">
                                {format(new Date(schedule.service.data_hora), "dd 'de' MMM", { locale: ptBR })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/30 rounded-lg px-3 py-2">
                              <Clock className="w-4 h-4 text-primary shrink-0" />
                              <span>
                                {format(new Date(schedule.service.data_hora), "HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            <div className="col-span-2 sm:col-span-1 flex items-center gap-2 text-sm text-muted-foreground bg-secondary/30 rounded-lg px-3 py-2">
                              <Users className="w-4 h-4 text-primary shrink-0" />
                              <span className="truncate">{schedule.position.nome}</span>
                            </div>
                          </div>

                          {schedule.service.descricao && (
                            <p className="text-sm text-muted-foreground mb-4">
                              {schedule.service.descricao}
                            </p>
                          )}

                          {schedule.status === 'pending' && (
                            <div className="flex gap-3 pt-4 border-t border-border/50">
                              <Button
                                onClick={() => handleUpdateStatus(schedule.id, 'confirmed')}
                                disabled={updatingSchedule === schedule.id}
                                className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl h-11 shadow-lg shadow-green-600/20"
                              >
                                {updatingSchedule === schedule.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Confirmar Presença
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleUpdateStatus(schedule.id, 'declined')}
                                disabled={updatingSchedule === schedule.id}
                                className="flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-xl h-11"
                              >
                                {updatingSchedule === schedule.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Recusar
                                  </>
                                )}
                              </Button>
                            </div>
                          )}

                          {schedule.status === 'confirmed' && (
                            <div className="flex items-center gap-2 pt-4 border-t border-border/50 text-green-500">
                              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <CheckCircle className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-medium">
                                Presença confirmada
                                {schedule.confirmed_at && (
                                  <span className="text-muted-foreground font-normal ml-1">
                                    em {format(new Date(schedule.confirmed_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {declinedSchedules.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Escalas Recusadas
                    <Badge variant="secondary" className="ml-2">{declinedSchedules.length}</Badge>
                  </h2>
                  <div className="space-y-3 opacity-60">
                    {declinedSchedules.map((schedule) => (
                      <div key={schedule.id} className="rounded-xl bg-secondary/20 border border-border/30 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">{schedule.service.nome}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(schedule.service.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} • {schedule.position.nome}
                            </p>
                          </div>
                          {getStatusBadge(schedule.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </AppShell>
    </PageTransition>
  );
}
