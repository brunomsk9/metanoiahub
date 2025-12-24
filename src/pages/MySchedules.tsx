import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { PageTransition } from "@/components/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, CheckCircle, XCircle, Loader2 } from "lucide-react";
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

export default function MySchedules() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [userName, setUserName] = useState("");
  const [updatingSchedule, setUpdatingSchedule] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('nome')
      .eq('id', session.user.id)
      .single();
    
    if (profile) {
      setUserName(profile.nome);
    }
    
    await fetchSchedules(session.user.id);
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
      
      // Filter out schedules where service is null (past services or invalid references)
      const validSchedules = (data || []).filter(s => s.service !== null) as Schedule[];
      setSchedules(validSchedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Erro ao carregar escalas');
    } finally {
      setLoading(false);
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
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Confirmado</Badge>;
      case 'declined':
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Recusado</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Pendente</Badge>;
    }
  };

  const upcomingSchedules = schedules.filter(s => s.status !== 'declined');
  const declinedSchedules = schedules.filter(s => s.status === 'declined');

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Sidebar onLogout={handleLogout} userName={userName} />
        
        <main className="pt-16 lg:pt-20 px-4 pb-8 max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
              Minhas Escalas
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize e confirme suas escalas de serviço
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : schedules.length === 0 ? (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nenhuma escala encontrada
                </h3>
                <p className="text-muted-foreground">
                  Você ainda não foi escalado para nenhum serviço futuro.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {upcomingSchedules.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Próximas Escalas ({upcomingSchedules.length})
                  </h2>
                  <div className="space-y-4">
                    {upcomingSchedules.map((schedule) => (
                      <Card key={schedule.id} className="bg-card/50 border-border/50 overflow-hidden">
                        <div 
                          className="h-1" 
                          style={{ backgroundColor: schedule.ministry.cor || '#8B5CF6' }}
                        />
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <CardTitle className="text-lg font-semibold text-foreground">
                                {schedule.service.nome}
                              </CardTitle>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <Badge 
                                  variant="outline" 
                                  style={{ 
                                    borderColor: schedule.ministry.cor || '#8B5CF6',
                                    color: schedule.ministry.cor || '#8B5CF6'
                                  }}
                                >
                                  {schedule.ministry.nome}
                                </Badge>
                                {getStatusBadge(schedule.status)}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {format(new Date(schedule.service.data_hora), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>
                                {format(new Date(schedule.service.data_hora), "HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="w-4 h-4" />
                              <span>Função: {schedule.position.nome}</span>
                            </div>
                          </div>

                          {schedule.service.descricao && (
                            <p className="text-sm text-muted-foreground mb-4">
                              {schedule.service.descricao}
                            </p>
                          )}

                          {schedule.status === 'pending' && (
                            <div className="flex gap-2 pt-2 border-t border-border/50">
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(schedule.id, 'confirmed')}
                                disabled={updatingSchedule === schedule.id}
                                className="flex-1 bg-green-600 hover:bg-green-700"
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
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(schedule.id, 'declined')}
                                disabled={updatingSchedule === schedule.id}
                                className="flex-1 border-red-500/30 text-red-600 hover:bg-red-500/10"
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
                            <div className="flex items-center gap-2 pt-2 border-t border-border/50 text-green-600">
                              <CheckCircle className="w-4 h-4" />
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
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {declinedSchedules.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Escalas Recusadas ({declinedSchedules.length})
                  </h2>
                  <div className="space-y-3 opacity-60">
                    {declinedSchedules.map((schedule) => (
                      <Card key={schedule.id} className="bg-card/30 border-border/30">
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">{schedule.service.nome}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(schedule.service.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} • {schedule.position.nome}
                              </p>
                            </div>
                            {getStatusBadge(schedule.status)}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </PageTransition>
  );
}
