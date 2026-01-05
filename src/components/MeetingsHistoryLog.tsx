import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, User, MapPin, Loader2, ChevronRight, FileText } from "lucide-react";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Meeting {
  id: string;
  tipo: 'individual' | 'celula';
  discipulo_id: string | null;
  data_encontro: string;
  notas: string | null;
  local: string | null;
  discipulo?: { nome: string } | null;
  attendance?: { discipulo_id: string; presente: boolean; discipulo: { nome: string } }[];
}

interface MeetingsHistoryLogProps {
  maxItems?: number;
  onViewAll?: () => void;
}

export function MeetingsHistoryLog({ maxItems = 5, onViewAll }: MeetingsHistoryLogProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: meetingsData } = await supabase
      .from('meetings')
      .select('*')
      .eq('discipulador_id', session.user.id)
      .order('data_encontro', { ascending: false })
      .limit(maxItems);

    if (meetingsData) {
      const meetingsWithDetails = await Promise.all(
        meetingsData.map(async (meeting) => {
          if (meeting.tipo === 'celula') {
            const { data: attendance } = await supabase
              .from('meeting_attendance')
              .select('discipulo_id, presente')
              .eq('meeting_id', meeting.id);
            
            const attendanceWithNames = await Promise.all(
              (attendance || []).map(async (att) => {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('nome')
                  .eq('id', att.discipulo_id)
                  .maybeSingle();
                return { ...att, discipulo: profile };
              })
            );
            
            return { ...meeting, attendance: attendanceWithNames };
          } else if (meeting.discipulo_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('nome')
              .eq('id', meeting.discipulo_id)
              .maybeSingle();
            return { ...meeting, discipulo: profile };
          }
          return meeting;
        })
      );
      setMeetings(meetingsWithDetails as Meeting[]);
    }

    setLoading(false);
  };

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Hoje";
    if (isYesterday(date)) return "Ontem";
    if (isThisWeek(date)) return format(date, "EEEE", { locale: ptBR });
    return format(date, "dd/MM", { locale: ptBR });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-muted-foreground">Nenhum encontro registrado ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {meetings.map((meeting, index) => (
        <div
          key={meeting.id}
          className={cn(
            "group flex items-start gap-3 py-3 px-3 -mx-3 rounded-lg transition-colors hover:bg-muted/50",
            index !== meetings.length - 1 && "border-b border-border/50"
          )}
        >
          {/* Timeline indicator */}
          <div className="flex flex-col items-center pt-0.5">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              meeting.tipo === 'individual' 
                ? "bg-secondary/80 text-secondary-foreground" 
                : "bg-primary/15 text-primary"
            )}>
              {meeting.tipo === 'individual' ? (
                <User className="w-4 h-4" />
              ) : (
                <Users className="w-4 h-4" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {meeting.tipo === 'individual' && meeting.discipulo ? (
                <span className="text-sm font-medium text-foreground">
                  {meeting.discipulo.nome}
                </span>
              ) : meeting.tipo === 'celula' ? (
                <span className="text-sm font-medium text-foreground">
                  Encontro de Célula
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">Encontro</span>
              )}
              
              <Badge 
                variant={meeting.tipo === 'individual' ? 'outline' : 'secondary'} 
                className="text-[10px] px-1.5 py-0 h-4"
              >
                {meeting.tipo === 'individual' ? '1:1' : `${meeting.attendance?.length || 0} pessoas`}
              </Badge>
            </div>

            {/* Attendees for cell meetings */}
            {meeting.tipo === 'celula' && meeting.attendance && meeting.attendance.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {meeting.attendance.slice(0, 4).map(att => (
                  <span key={att.discipulo_id} className="text-xs text-muted-foreground">
                    {att.discipulo?.nome}
                    {meeting.attendance!.indexOf(att) < Math.min(meeting.attendance!.length - 1, 3) && ","}
                  </span>
                ))}
                {meeting.attendance.length > 4 && (
                  <span className="text-xs text-muted-foreground">
                    +{meeting.attendance.length - 4}
                  </span>
                )}
              </div>
            )}

            {/* Location & Notes */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {meeting.local && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {meeting.local}
                </span>
              )}
              {meeting.notas && (
                <span className="flex items-center gap-1 truncate max-w-[200px]">
                  <FileText className="w-3 h-3 shrink-0" />
                  <span className="truncate">{meeting.notas}</span>
                </span>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="text-right shrink-0">
            <p className="text-xs font-medium text-muted-foreground">
              {formatRelativeDate(meeting.data_encontro)}
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              {format(new Date(meeting.data_encontro), "HH:mm")}
            </p>
          </div>
        </div>
      ))}

      {onViewAll && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={onViewAll}
        >
          Ver todos os encontros
          <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      )}
    </div>
  );
}
