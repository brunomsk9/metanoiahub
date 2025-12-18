import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserChurchId } from '@/hooks/useUserChurchId';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Users, User, MapPin, Trash2, Loader2, Clock, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Disciple {
  id: string;
  nome: string;
}

interface Meeting {
  id: string;
  tipo: 'individual' | 'celula';
  discipulo_id: string | null;
  data_encontro: string;
  notas: string | null;
  local: string | null;
  created_at: string;
  discipulo?: { nome: string } | null;
  attendance?: { discipulo_id: string; presente: boolean; discipulo: { nome: string } }[];
}

export function MeetingsManager() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [disciples, setDisciples] = useState<Disciple[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { churchId } = useUserChurchId();

  // Form state
  const [tipo, setTipo] = useState<'individual' | 'celula'>('individual');
  const [selectedDisciple, setSelectedDisciple] = useState<string>('');
  const [dataEncontro, setDataEncontro] = useState(new Date().toISOString().slice(0, 16));
  const [notas, setNotas] = useState('');
  const [local, setLocal] = useState('');
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  // Open dialog if URL param is set
  useEffect(() => {
    if (searchParams.get('novoEncontro') === 'true') {
      setIsDialogOpen(true);
      // Remove the param from URL
      searchParams.delete('novoEncontro');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: meetingsData } = await supabase
      .from('meetings')
      .select('*')
      .eq('discipulador_id', session.user.id)
      .order('data_encontro', { ascending: false });

    const { data: relsData } = await supabase
      .from('discipleship_relationships')
      .select('discipulo_id')
      .eq('discipulador_id', session.user.id)
      .eq('status', 'active');

    if (relsData && relsData.length > 0) {
      const discipleIds = relsData.map(r => r.discipulo_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, nome')
        .in('id', discipleIds);
      
      setDisciples(profilesData || []);
    } else {
      setDisciples([]);
    }

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

  const handleSave = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (tipo === 'individual' && !selectedDisciple) {
      toast({ title: "Erro", description: "Selecione um discípulo", variant: "destructive" });
      return;
    }

    if (tipo === 'celula' && selectedAttendees.length === 0) {
      toast({ title: "Erro", description: "Selecione pelo menos um participante", variant: "destructive" });
      return;
    }

    if (!churchId) {
      toast({ title: "Erro", description: "Usuário não está associado a uma igreja", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    try {
      const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .insert({
          discipulador_id: session.user.id,
          tipo,
          discipulo_id: tipo === 'individual' ? selectedDisciple : null,
          data_encontro: dataEncontro,
          notas: notas || null,
          local: local || null,
          church_id: churchId
        })
        .select()
        .single();

      if (meetingError) throw meetingError;

      if (tipo === 'celula' && meeting) {
        const attendanceRecords = selectedAttendees.map(discipleId => ({
          meeting_id: meeting.id,
          discipulo_id: discipleId,
          presente: true
        }));

        const { error: attendanceError } = await supabase
          .from('meeting_attendance')
          .insert(attendanceRecords);

        if (attendanceError) throw attendanceError;
      }

      toast({ title: "Encontro registrado!", description: "O encontro foi salvo com sucesso." });
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (meetingId: string) => {
    if (!confirm('Tem certeza que deseja excluir este encontro?')) return;

    const { error } = await supabase.from('meetings').delete().eq('id', meetingId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Excluído", description: "Encontro removido com sucesso." });
      fetchData();
    }
  };

  const resetForm = () => {
    setTipo('individual');
    setSelectedDisciple('');
    setDataEncontro(new Date().toISOString().slice(0, 16));
    setNotas('');
    setLocal('');
    setSelectedAttendees([]);
  };

  const toggleAttendee = (discipleId: string) => {
    setSelectedAttendees(prev =>
      prev.includes(discipleId)
        ? prev.filter(id => id !== discipleId)
        : [...prev, discipleId]
    );
  };

  const selectAllAttendees = () => {
    if (selectedAttendees.length === disciples.length) {
      setSelectedAttendees([]);
    } else {
      setSelectedAttendees(disciples.map(d => d.id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Encontros</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Encontro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Novo Encontro</DialogTitle>
                  <DialogDescription>
                    Registre um encontro individual ou de célula
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-5 pt-4">
              {/* Type Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Tipo de Encontro</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTipo('individual')}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                      tipo === 'individual'
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                      tipo === 'individual' ? "bg-primary/20" : "bg-muted"
                    )}>
                      <User className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">Individual</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo('celula')}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                      tipo === 'celula'
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                      tipo === 'celula' ? "bg-primary/20" : "bg-muted"
                    )}>
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">Célula</span>
                  </button>
                </div>
              </div>

              {/* Disciple Selection */}
              {tipo === 'individual' ? (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Discípulo</Label>
                  {disciples.length === 0 ? (
                    <div className="p-4 rounded-lg bg-muted/50 text-center text-sm text-muted-foreground">
                      Nenhum discípulo vinculado
                    </div>
                  ) : (
                    <div className="grid gap-2 max-h-32 overflow-y-auto p-1">
                      {disciples.map(d => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setSelectedDisciple(d.id)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                            selectedDisciple === d.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50 hover:bg-muted/30"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                            selectedDisciple === d.id ? "bg-primary text-primary-foreground" : "bg-muted"
                          )}>
                            {d.nome?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium">{d.nome}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Presentes
                      {selectedAttendees.length > 0 && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {selectedAttendees.length}
                        </Badge>
                      )}
                    </Label>
                    {disciples.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={selectAllAttendees}
                      >
                        {selectedAttendees.length === disciples.length ? 'Desmarcar todos' : 'Selecionar todos'}
                      </Button>
                    )}
                  </div>
                  {disciples.length === 0 ? (
                    <div className="p-4 rounded-lg bg-muted/50 text-center text-sm text-muted-foreground">
                      Nenhum discípulo vinculado
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-card/50 divide-y divide-border max-h-40 overflow-y-auto">
                      {disciples.map(d => (
                        <label
                          key={d.id}
                          className={cn(
                            "flex items-center gap-3 p-3 cursor-pointer transition-colors",
                            selectedAttendees.includes(d.id) ? "bg-primary/5" : "hover:bg-muted/30"
                          )}
                        >
                          <Checkbox
                            id={d.id}
                            checked={selectedAttendees.includes(d.id)}
                            onCheckedChange={() => toggleAttendee(d.id)}
                          />
                          <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium",
                            selectedAttendees.includes(d.id) ? "bg-primary text-primary-foreground" : "bg-muted"
                          )}>
                            {d.nome?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm">{d.nome}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Date & Time */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Data e Hora
                </Label>
                <Input
                  type="datetime-local"
                  value={dataEncontro}
                  onChange={(e) => setDataEncontro(e.target.value)}
                  className="h-11"
                />
              </div>

              {/* Location */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  Local
                  <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Input
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  placeholder="Ex: Igreja, casa, café..."
                  className="h-11"
                />
              </div>

              {/* Notes */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Notas
                  <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Observações sobre o encontro..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Submit Button */}
              <Button 
                onClick={handleSave} 
                disabled={isSaving || (tipo === 'individual' && !selectedDisciple) || (tipo === 'celula' && selectedAttendees.length === 0)} 
                className="w-full h-11 text-base"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Encontro
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {meetings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-1">Nenhum encontro registrado</p>
            <p className="text-xs text-muted-foreground">Clique em "Novo Encontro" para começar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {meetings.map(meeting => (
            <Card key={meeting.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3 flex-1 min-w-0">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center",
                      meeting.tipo === 'individual' ? "bg-secondary" : "bg-primary/10"
                    )}>
                      {meeting.tipo === 'individual' ? (
                        <User className="w-5 h-5 text-secondary-foreground" />
                      ) : (
                        <Users className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant={meeting.tipo === 'individual' ? 'secondary' : 'default'} className="text-xs">
                          {meeting.tipo === 'individual' ? 'Individual' : 'Célula'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(meeting.data_encontro), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      
                      {meeting.tipo === 'individual' && meeting.discipulo && (
                        <p className="text-sm font-medium text-foreground">{meeting.discipulo.nome}</p>
                      )}

                      {meeting.tipo === 'celula' && meeting.attendance && meeting.attendance.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {meeting.attendance.slice(0, 3).map(att => (
                              <Badge key={att.discipulo_id} variant="outline" className="text-xs">
                                {att.discipulo?.nome || 'Desconhecido'}
                              </Badge>
                            ))}
                            {meeting.attendance.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{meeting.attendance.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {meeting.local && (
                        <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {meeting.local}
                        </p>
                      )}

                      {meeting.notas && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{meeting.notas}</p>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(meeting.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
