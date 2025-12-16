import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Users, User, MapPin, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [disciples, setDisciples] = useState<Disciple[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

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

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const [meetingsRes, disciplesRes] = await Promise.all([
      supabase
        .from('meetings')
        .select('*')
        .eq('discipulador_id', session.user.id)
        .order('data_encontro', { ascending: false }),
      supabase
        .from('discipleship_relationships')
        .select('discipulo_id, profiles!discipleship_relationships_discipulo_id_fkey(id, nome)')
        .eq('discipulador_id', session.user.id)
        .eq('status', 'active')
    ]);

    if (meetingsRes.data) {
      // Fetch attendance for cell meetings
      const meetingsWithAttendance = await Promise.all(
        meetingsRes.data.map(async (meeting) => {
          if (meeting.tipo === 'celula') {
            const { data: attendance } = await supabase
              .from('meeting_attendance')
              .select('discipulo_id, presente')
              .eq('meeting_id', meeting.id);
            
            // Get disciple names for attendance
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
      setMeetings(meetingsWithAttendance as Meeting[]);
    }

    if (disciplesRes.data) {
      const disciplesList = disciplesRes.data
        .filter(r => r.profiles)
        .map(r => ({
          id: (r.profiles as any).id,
          nome: (r.profiles as any).nome
        }));
      setDisciples(disciplesList);
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
          local: local || null
        })
        .select()
        .single();

      if (meetingError) throw meetingError;

      // Insert attendance for cell meetings
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Encontro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as 'individual' | 'celula')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Individual
                      </div>
                    </SelectItem>
                    <SelectItem value="celula">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Célula
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {tipo === 'individual' ? (
                <div className="space-y-2">
                  <Label>Discípulo</Label>
                  <Select value={selectedDisciple} onValueChange={setSelectedDisciple}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {disciples.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Presentes ({selectedAttendees.length})</Label>
                  <div className="border border-border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                    {disciples.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum discípulo vinculado</p>
                    ) : (
                      disciples.map(d => (
                        <div key={d.id} className="flex items-center gap-2">
                          <Checkbox
                            id={d.id}
                            checked={selectedAttendees.includes(d.id)}
                            onCheckedChange={() => toggleAttendee(d.id)}
                          />
                          <label htmlFor={d.id} className="text-sm cursor-pointer">{d.nome}</label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Data e Hora</Label>
                <Input
                  type="datetime-local"
                  value={dataEncontro}
                  onChange={(e) => setDataEncontro(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Local (opcional)</Label>
                <Input
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  placeholder="Ex: Igreja, casa..."
                />
              </div>

              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Observações sobre o encontro..."
                  rows={3}
                />
              </div>

              <Button onClick={handleSave} disabled={isSaving} className="w-full">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Salvar Encontro
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {meetings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>Nenhum encontro registrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {meetings.map(meeting => (
            <Card key={meeting.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={meeting.tipo === 'individual' ? 'secondary' : 'default'} className="text-xs">
                        {meeting.tipo === 'individual' ? (
                          <><User className="w-3 h-3 mr-1" />Individual</>
                        ) : (
                          <><Users className="w-3 h-3 mr-1" />Célula</>
                        )}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(meeting.data_encontro), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    
                    {meeting.tipo === 'individual' && meeting.discipulo && (
                      <p className="text-sm font-medium text-foreground">{meeting.discipulo.nome}</p>
                    )}

                    {meeting.tipo === 'celula' && meeting.attendance && meeting.attendance.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">Presentes:</p>
                        <div className="flex flex-wrap gap-1">
                          {meeting.attendance.map(att => (
                            <Badge key={att.discipulo_id} variant="outline" className="text-xs">
                              {att.discipulo?.nome || 'Desconhecido'}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {meeting.local && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {meeting.local}
                      </p>
                    )}

                    {meeting.notas && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{meeting.notas}</p>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
