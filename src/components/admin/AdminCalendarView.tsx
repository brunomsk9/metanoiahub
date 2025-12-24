import { useState, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, Clock, Users, Check, X, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  nome: string;
  descricao: string | null;
  data_hora: string;
  is_special_event: boolean;
  status: string;
  service_type_id: string | null;
}

interface Schedule {
  id: string;
  service_id: string;
  volunteer_id: string;
  status: string;
  volunteer?: {
    nome: string;
  };
  position?: {
    nome: string;
  };
  ministry?: {
    nome: string;
    cor: string;
  };
}

interface ServiceType {
  id: string;
  nome: string;
}

interface AdminCalendarViewProps {
  services: Service[];
  schedules: Schedule[];
  serviceTypes: ServiceType[];
  onEditService: (service: Service) => void;
  onDeleteService: (id: string) => void;
  onSelectService?: (serviceId: string) => void;
}

export function AdminCalendarView({ 
  services, 
  schedules, 
  serviceTypes, 
  onEditService, 
  onDeleteService,
  onSelectService 
}: AdminCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Group services by date
  const servicesByDate = useMemo(() => {
    const map = new Map<string, Service[]>();
    services.forEach((service) => {
      const dateKey = format(new Date(service.data_hora), 'yyyy-MM-dd');
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, service]);
    });
    return map;
  }, [services]);

  // Get schedules for a service
  const getServiceSchedules = (serviceId: string) => {
    return schedules.filter(s => s.service_id === serviceId);
  };

  // Calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { locale: ptBR });
    const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Services for selected date
  const selectedDateServices = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return (servicesByDate.get(dateKey) || []).sort(
      (a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()
    );
  }, [selectedDate, servicesByDate]);

  // Schedule statistics for a service
  const getScheduleStats = (serviceId: string) => {
    const serviceSchedules = getServiceSchedules(serviceId);
    const confirmed = serviceSchedules.filter(s => s.status === 'confirmed').length;
    const pending = serviceSchedules.filter(s => s.status === 'pending').length;
    const declined = serviceSchedules.filter(s => s.status === 'declined').length;
    return { total: serviceSchedules.length, confirmed, pending, declined };
  };

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </Button>
        <h3 className="text-lg font-semibold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          Próximo
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-1">
              {/* Weekday Headers */}
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, i) => (
                <div key={i} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}

              {/* Days */}
              {calendarDays.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayServices = servicesByDate.get(dateKey) || [];
                const hasServices = dayServices.length > 0;
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                
                // Check statuses
                const allSchedules = dayServices.flatMap(s => getServiceSchedules(s.id));
                const hasPending = allSchedules.some(s => s.status === 'pending');
                const hasDeclined = allSchedules.some(s => s.status === 'declined');
                const allConfirmed = allSchedules.length > 0 && allSchedules.every(s => s.status === 'confirmed');

                return (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedDate(hasServices ? day : null)}
                    disabled={!hasServices}
                    className={cn(
                      'relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all p-1',
                      !isCurrentMonth && 'text-muted-foreground/40',
                      isCurrentMonth && !hasServices && 'text-muted-foreground',
                      hasServices && 'cursor-pointer hover:bg-muted font-medium',
                      isSelected && 'bg-primary text-primary-foreground hover:bg-primary',
                      isToday(day) && !isSelected && 'ring-2 ring-primary',
                      !hasServices && 'cursor-default'
                    )}
                  >
                    <span>{format(day, 'd')}</span>
                    {hasServices && (
                      <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                        {dayServices.slice(0, 3).map((_, i) => (
                          <div 
                            key={i}
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              hasPending && 'bg-amber-500',
                              hasDeclined && !hasPending && 'bg-destructive',
                              allConfirmed && 'bg-green-500',
                              !hasPending && !hasDeclined && !allConfirmed && 'bg-primary'
                            )}
                          />
                        ))}
                        {dayServices.length > 3 && (
                          <span className="text-[8px] text-muted-foreground">+{dayServices.length - 3}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-4 pt-4 border-t">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Pendente</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Confirmado</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-destructive" />
                <span>Recusado</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>Sem escala</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Details */}
        <Card>
          <CardContent className="p-4">
            {selectedDate && selectedDateServices.length > 0 ? (
              <div className="space-y-4">
                <h4 className="font-semibold text-sm">
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </h4>
                <ScrollArea className="h-[400px] pr-2">
                  <div className="space-y-3">
                    {selectedDateServices.map((service) => {
                      const serviceType = serviceTypes.find(st => st.id === service.service_type_id);
                      const stats = getScheduleStats(service.id);
                      const serviceSchedules = getServiceSchedules(service.id);

                      return (
                        <div 
                          key={service.id} 
                          className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h5 className="font-medium text-sm">{service.nome}</h5>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {format(new Date(service.data_hora), 'HH:mm')}
                                {serviceType && (
                                  <>
                                    <span>•</span>
                                    <span>{serviceType.nome}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => onEditService(service)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => onDeleteService(service.id)}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>

                          {service.is_special_event && (
                            <Badge variant="secondary" className="text-[10px] mb-2">
                              Evento Especial
                            </Badge>
                          )}

                          {/* Schedule Stats */}
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {stats.total} escalado{stats.total !== 1 ? 's' : ''}
                            </span>
                            {stats.confirmed > 0 && (
                              <Badge variant="outline" className="text-[10px] h-5 bg-green-500/10 text-green-700 border-green-500/30">
                                <Check className="w-2 h-2 mr-0.5" />
                                {stats.confirmed}
                              </Badge>
                            )}
                            {stats.pending > 0 && (
                              <Badge variant="outline" className="text-[10px] h-5 bg-amber-500/10 text-amber-700 border-amber-500/30">
                                <AlertCircle className="w-2 h-2 mr-0.5" />
                                {stats.pending}
                              </Badge>
                            )}
                            {stats.declined > 0 && (
                              <Badge variant="outline" className="text-[10px] h-5 bg-destructive/10 text-destructive border-destructive/30">
                                <X className="w-2 h-2 mr-0.5" />
                                {stats.declined}
                              </Badge>
                            )}
                          </div>

                          {/* Volunteers List */}
                          {serviceSchedules.length > 0 && (
                            <div className="space-y-1 pt-2 border-t">
                              {serviceSchedules.slice(0, 5).map((schedule) => (
                                <div key={schedule.id} className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: schedule.ministry?.cor || '#8B5CF6' }}
                                    />
                                    <span className="truncate max-w-[120px]">
                                      {schedule.volunteer?.nome || 'Voluntário'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-muted-foreground truncate max-w-[60px]">
                                      {schedule.position?.nome}
                                    </span>
                                    {schedule.status === 'confirmed' && (
                                      <Check className="w-3 h-3 text-green-600" />
                                    )}
                                    {schedule.status === 'pending' && (
                                      <AlertCircle className="w-3 h-3 text-amber-600" />
                                    )}
                                    {schedule.status === 'declined' && (
                                      <X className="w-3 h-3 text-destructive" />
                                    )}
                                  </div>
                                </div>
                              ))}
                              {serviceSchedules.length > 5 && (
                                <p className="text-[10px] text-muted-foreground text-center pt-1">
                                  +{serviceSchedules.length - 5} mais
                                </p>
                              )}
                            </div>
                          )}

                          {onSelectService && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full mt-2 text-xs h-7"
                              onClick={() => onSelectService(service.id)}
                            >
                              <Users className="w-3 h-3 mr-1" />
                              Gerenciar Escala
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
                <Calendar className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-sm text-center">
                  Selecione uma data com cultos no calendário para ver os detalhes
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
