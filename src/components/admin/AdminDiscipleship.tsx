import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Users, UserPlus, Trash2, Eye, BookOpen, Flame, CheckCircle, Award, Lock, GraduationCap, Search, Link, Check, ChevronsUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  nome: string;
  current_streak: number;
  xp_points: number;
}

interface Relationship {
  id: string;
  discipulo_id: string;
  discipulador_id: string;
  status: string;
  started_at: string;
  alicerce_completed_presencial: boolean;
  alicerce_completed_at: string | null;
  academia_nivel_1: boolean;
  academia_nivel_2: boolean;
  academia_nivel_3: boolean;
  academia_nivel_4: boolean;
  conexao_inicial_1: boolean;
  conexao_inicial_2: boolean;
  discipulo?: Profile;
  discipulador?: Profile;
}

interface DiscipleProgress {
  lessonsCompleted: number;
  totalLessons: number;
  readingPlansProgress: number;
  habitsThisWeek: number;
  alicerceCompleted: number;
  alicerceTotal: number;
}

export function AdminDiscipleship() {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [availableDisciples, setAvailableDisciples] = useState<Profile[]>([]);
  const [availableDiscipuladores, setAvailableDiscipuladores] = useState<Profile[]>([]);
  const [allUnassignedDisciples, setAllUnassignedDisciples] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDisciple, setSelectedDisciple] = useState<string>("");
  const [selectedDiscipulador, setSelectedDiscipulador] = useState<string>("");
  const [selectedAdminDisciple, setSelectedAdminDisciple] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewingProgress, setViewingProgress] = useState<string | null>(null);
  const [discipleProgress, setDiscipleProgress] = useState<DiscipleProgress | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDiscipulador, setOpenDiscipulador] = useState(false);
  const [openAdminDisciple, setOpenAdminDisciple] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setCurrentUserId(user.id);

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    
    const userIsAdmin = !!adminCheck;
    setIsAdmin(userIsAdmin);

    // Fetch relationships - all if admin, only own if discipulador
    let relsQuery = supabase.from('discipleship_relationships').select('*');
    
    if (!userIsAdmin) {
      relsQuery = relsQuery.eq('discipulador_id', user.id);
    }

    const { data: rels, error: relsError } = await relsQuery;

    if (relsError) {
      console.error('Error fetching relationships:', relsError);
      toast.error('Erro ao carregar relacionamentos');
      return;
    }

    // Fetch profiles for disciples and discipuladores
    if (rels && rels.length > 0) {
      const discipleIds = rels.map(r => r.discipulo_id);
      const discipuladorIds = [...new Set(rels.map(r => r.discipulador_id))];
      const allIds = [...new Set([...discipleIds, ...discipuladorIds])];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome, current_streak, xp_points')
        .in('id', allIds);

      const relsWithProfiles = rels.map(rel => ({
        ...rel,
        discipulo: profiles?.find(p => p.id === rel.discipulo_id),
        discipulador: profiles?.find(p => p.id === rel.discipulador_id)
      }));
      
      setRelationships(relsWithProfiles);
    } else {
      setRelationships([]);
    }

    // Fetch users with discipulo role who are not yet assigned to this discipulador
    const { data: allDisciples } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'discipulo');

    if (allDisciples) {
      const assignedIds = rels?.filter(r => r.discipulador_id === user.id).map(r => r.discipulo_id) || [];
      const availableIds = allDisciples
        .map(d => d.user_id)
        .filter(id => !assignedIds.includes(id) && id !== user.id);

      if (availableIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nome, current_streak, xp_points')
          .in('id', availableIds);
        
        setAvailableDisciples(profiles || []);
      } else {
        setAvailableDisciples([]);
      }

      // For admin: get all unassigned disciples (not assigned to ANY discipulador)
      if (userIsAdmin) {
        const allAssignedIds = rels?.map(r => r.discipulo_id) || [];
        const unassignedIds = allDisciples
          .map(d => d.user_id)
          .filter(id => !allAssignedIds.includes(id));

        if (unassignedIds.length > 0) {
          const { data: unassignedProfiles } = await supabase
            .from('profiles')
            .select('id, nome, current_streak, xp_points')
            .in('id', unassignedIds);
          
          setAllUnassignedDisciples(unassignedProfiles || []);
        } else {
          setAllUnassignedDisciples([]);
        }
      }
    }

    // Fetch discipuladores for admin association
    if (userIsAdmin) {
      const { data: discipuladoresRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'discipulador');

      if (discipuladoresRoles && discipuladoresRoles.length > 0) {
        const discipuladorIds = discipuladoresRoles.map(d => d.user_id);
        const { data: discipuladorProfiles } = await supabase
          .from('profiles')
          .select('id, nome, current_streak, xp_points')
          .in('id', discipuladorIds);
        
        setAvailableDiscipuladores(discipuladorProfiles || []);
      }
    }

    setLoading(false);
  };

  const handleAddDisciple = async () => {
    if (!selectedDisciple) {
      toast.error('Selecione um discípulo');
      return;
    }

    const { error } = await supabase
      .from('discipleship_relationships')
      .insert({
        discipulador_id: currentUserId,
        discipulo_id: selectedDisciple,
        status: 'active'
      });

    if (error) {
      console.error('Error adding disciple:', error);
      toast.error('Erro ao adicionar discípulo');
      return;
    }

    toast.success('Discípulo adicionado com sucesso');
    setSelectedDisciple("");
    fetchData();
  };

  const handleAdminAssociate = async () => {
    if (!selectedDiscipulador || !selectedAdminDisciple) {
      toast.error('Selecione o discipulador e o discípulo');
      return;
    }

    const { error } = await supabase
      .from('discipleship_relationships')
      .insert({
        discipulador_id: selectedDiscipulador,
        discipulo_id: selectedAdminDisciple,
        status: 'active'
      });

    if (error) {
      console.error('Error associating:', error);
      if (error.code === '23505') {
        toast.error('Este discípulo já está associado a um discipulador');
      } else {
        toast.error('Erro ao associar discípulo');
      }
      return;
    }

    toast.success('Discípulo associado com sucesso');
    setSelectedDiscipulador("");
    setSelectedAdminDisciple("");
    fetchData();
  };

  const filteredRelationships = relationships.filter(rel => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const discipleName = rel.discipulo?.nome?.toLowerCase() || '';
    const discipuladorName = rel.discipulador?.nome?.toLowerCase() || '';
    return discipleName.includes(search) || discipuladorName.includes(search);
  });

  const handleRemoveRelationship = async (id: string) => {
    const { error } = await supabase
      .from('discipleship_relationships')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error removing relationship:', error);
      toast.error('Erro ao remover relacionamento');
      return;
    }

    toast.success('Relacionamento removido');
    fetchData();
  };

  const handleViewProgress = async (discipleId: string) => {
    setViewingProgress(discipleId);
    
    // Fetch base track info first
    const { data: baseTrack } = await supabase
      .from('tracks')
      .select('id')
      .eq('is_base', true)
      .maybeSingle();
    
    let alicerceCompleted = 0;
    let alicerceTotal = 0;
    
    if (baseTrack) {
      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .eq('track_id', baseTrack.id);
      
      if (courses && courses.length > 0) {
        const courseIds = courses.map(c => c.id);
        const { data: lessons } = await supabase
          .from('lessons')
          .select('id')
          .in('course_id', courseIds);
        
        alicerceTotal = lessons?.length || 0;
        
        if (lessons && lessons.length > 0) {
          const lessonIds = lessons.map(l => l.id);
          const { count } = await supabase
            .from('user_progress')
            .select('id', { count: 'exact' })
            .eq('user_id', discipleId)
            .eq('completed', true)
            .in('lesson_id', lessonIds);
          
          alicerceCompleted = count || 0;
        }
      }
    }
    
    // Fetch disciple's progress
    const [lessonsRes, habitsRes, readingRes, totalLessonsRes] = await Promise.all([
      supabase
        .from('user_progress')
        .select('id')
        .eq('user_id', discipleId)
        .eq('completed', true),
      supabase
        .from('daily_habits')
        .select('id')
        .eq('user_id', discipleId)
        .gte('completed_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
      supabase
        .from('user_reading_progress')
        .select('completed_days')
        .eq('user_id', discipleId),
      supabase
        .from('lessons')
        .select('id')
    ]);

    const completedDays = readingRes.data?.reduce((acc, curr) => {
      return acc + (curr.completed_days?.length || 0);
    }, 0) || 0;

    setDiscipleProgress({
      lessonsCompleted: lessonsRes.data?.length || 0,
      totalLessons: totalLessonsRes.data?.length || 1,
      readingPlansProgress: completedDays,
      habitsThisWeek: habitsRes.data?.length || 0,
      alicerceCompleted,
      alicerceTotal
    });
  };

  const handleMarkAlicerceComplete = async (relationshipId: string, discipleName: string) => {
    const { error } = await supabase
      .from('discipleship_relationships')
      .update({
        alicerce_completed_presencial: true,
        alicerce_completed_at: new Date().toISOString()
      })
      .eq('id', relationshipId);

    if (error) {
      console.error('Error marking alicerce complete:', error);
      toast.error('Erro ao marcar conclusão');
      return;
    }

    toast.success(`Alicerce de ${discipleName} marcado como concluído presencialmente!`);
    fetchData();
  };

  const handleToggleAcademiaNivel = async (relationshipId: string, nivel: 1 | 2 | 3 | 4, currentValue: boolean) => {
    const columnName = `academia_nivel_${nivel}` as const;
    
    const { error } = await supabase
      .from('discipleship_relationships')
      .update({ [columnName]: !currentValue })
      .eq('id', relationshipId);

    if (error) {
      console.error('Error updating academia nivel:', error);
      toast.error('Erro ao atualizar nível');
      return;
    }

    toast.success(`Nível ${nivel} ${!currentValue ? 'marcado' : 'desmarcado'}`);
    fetchData();
  };

  const handleToggleConexaoInicial = async (relationshipId: string, nivel: 1 | 2, currentValue: boolean) => {
    const columnName = `conexao_inicial_${nivel}` as const;
    
    const { error } = await supabase
      .from('discipleship_relationships')
      .update({ [columnName]: !currentValue })
      .eq('id', relationshipId);

    if (error) {
      console.error('Error updating conexao inicial nivel:', error);
      toast.error('Erro ao atualizar encontro');
      return;
    }

    toast.success(`Encontro ${nivel} ${!currentValue ? 'marcado' : 'desmarcado'}`);
    fetchData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Ativo</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pausado</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Concluído</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin association */}
      {isAdmin && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="w-5 h-5" />
              Associar Discípulo a Discipulador (Admin)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {/* Discipulador Combobox */}
              <Popover open={openDiscipulador} onOpenChange={setOpenDiscipulador}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openDiscipulador}
                    className="flex-1 min-w-[200px] justify-between"
                  >
                    {selectedDiscipulador
                      ? availableDiscipuladores.find(d => d.id === selectedDiscipulador)?.nome || 'Sem nome'
                      : "Selecione o discipulador..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar discipulador..." />
                    <CommandList>
                      <CommandEmpty>Nenhum discipulador encontrado.</CommandEmpty>
                      <CommandGroup>
                        {availableDiscipuladores.map(d => (
                          <CommandItem
                            key={d.id}
                            value={d.nome || 'Sem nome'}
                            onSelect={() => {
                              setSelectedDiscipulador(d.id);
                              setOpenDiscipulador(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedDiscipulador === d.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {d.nome || 'Sem nome'}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Discípulo Combobox */}
              <Popover open={openAdminDisciple} onOpenChange={setOpenAdminDisciple}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openAdminDisciple}
                    className="flex-1 min-w-[200px] justify-between"
                  >
                    {selectedAdminDisciple
                      ? allUnassignedDisciples.find(d => d.id === selectedAdminDisciple)?.nome || 'Sem nome'
                      : "Selecione o discípulo..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar discípulo..." />
                    <CommandList>
                      <CommandEmpty>Nenhum discípulo encontrado.</CommandEmpty>
                      <CommandGroup>
                        {allUnassignedDisciples.map(d => (
                          <CommandItem
                            key={d.id}
                            value={d.nome || 'Sem nome'}
                            onSelect={() => {
                              setSelectedAdminDisciple(d.id);
                              setOpenAdminDisciple(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedAdminDisciple === d.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {d.nome || 'Sem nome'}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Button onClick={handleAdminAssociate} disabled={!selectedDiscipulador || !selectedAdminDisciple}>
                <Link className="w-4 h-4 mr-2" />
                Associar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add new disciple (for discipuladores) */}
      {!isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Adicionar Discípulo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Select value={selectedDisciple} onValueChange={setSelectedDisciple}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione um discípulo..." />
                </SelectTrigger>
                <SelectContent>
                  {availableDisciples.length === 0 ? (
                    <SelectItem value="none" disabled>Nenhum discípulo disponível</SelectItem>
                  ) : (
                    availableDisciples.map(disciple => (
                      <SelectItem key={disciple.id} value={disciple.id}>
                        {disciple.nome || 'Sem nome'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button onClick={handleAddDisciple} disabled={!selectedDisciple}>
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Relationships list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {isAdmin ? `Todos os Relacionamentos (${relationships.length})` : `Meus Discípulos (${relationships.length})`}
            </CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRelationships.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {searchTerm ? 'Nenhum resultado encontrado.' : 'Nenhum relacionamento encontrado.'}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredRelationships.map(rel => (
                <div
                  key={rel.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {(rel.discipulo?.nome || 'D')[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{rel.discipulo?.nome || 'Sem nome'}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {isAdmin && rel.discipulador && (
                          <span className="text-xs font-medium flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {rel.discipulador.nome}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-500" />
                          {rel.discipulo?.current_streak || 0} dias
                        </span>
                        <span>{rel.discipulo?.xp_points || 0} XP</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {rel.alicerce_completed_presencial ? (
                      <Award className="w-4 h-4 text-success" />
                    ) : (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    )}
                    {getStatusBadge(rel.status)}
                  </div>

                  {/* Jornadas */}
                  <div className="flex items-center gap-4 px-3 py-2 rounded-lg bg-muted/50">
                    {/* Conexão Inicial */}
                    <div className="flex items-center gap-2">
                      <Link className="w-4 h-4 text-accent" />
                      {[1, 2].map((nivel) => {
                        const key = `conexao_inicial_${nivel}` as keyof Relationship;
                        const isChecked = rel[key] as boolean;
                        return (
                          <Checkbox
                            key={nivel}
                            id={`conexao-${rel.id}-${nivel}`}
                            checked={isChecked}
                            onCheckedChange={() => handleToggleConexaoInicial(rel.id, nivel as 1 | 2, isChecked)}
                            className="data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                          />
                        );
                      })}
                    </div>

                    <div className="w-px h-4 bg-border" />

                    {/* Academia das Nações */}
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-primary" />
                      {[1, 2, 3, 4].map((nivel) => {
                        const key = `academia_nivel_${nivel}` as keyof Relationship;
                        const isChecked = rel[key] as boolean;
                        return (
                          <Checkbox
                            key={nivel}
                            id={`academia-${rel.id}-${nivel}`}
                            checked={isChecked}
                            onCheckedChange={() => handleToggleAcademiaNivel(rel.id, nivel as 1 | 2 | 3 | 4, isChecked)}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewProgress(rel.discipulo_id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Progresso de {rel.discipulo?.nome}</DialogTitle>
                        </DialogHeader>
                        {discipleProgress && viewingProgress === rel.discipulo_id && (
                          <div className="space-y-6 pt-4">
                            {/* Alicerce Progress */}
                            <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-foreground flex items-center gap-2">
                                  <Award className="w-4 h-4 text-primary" />
                                  Progresso Alicerce
                                </span>
                                {rel.alicerce_completed_presencial ? (
                                  <Badge className="bg-success/10 text-success border-success/20">
                                    Concluído ✓
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">Em andamento</Badge>
                                )}
                              </div>
                              <Progress 
                                value={discipleProgress.alicerceTotal > 0 
                                  ? (discipleProgress.alicerceCompleted / discipleProgress.alicerceTotal) * 100 
                                  : 0} 
                              />
                              <p className="text-sm text-muted-foreground">
                                {discipleProgress.alicerceCompleted}/{discipleProgress.alicerceTotal} aulas concluídas
                              </p>
                              
                              {!rel.alicerce_completed_presencial && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" className="w-full mt-2">
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Marcar como Concluído (Presencial)
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirmar Conclusão Presencial</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Ao confirmar, você está atestando que {rel.discipulo?.nome} completou a jornada Alicerce presencialmente com você. 
                                        Isso irá desbloquear todas as trilhas para o discípulo.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleMarkAlicerceComplete(rel.id, rel.discipulo?.nome || '')}>
                                        Confirmar Conclusão
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>

                            {/* Conexão Inicial Progress */}
                            <div className="space-y-3 p-4 rounded-lg bg-accent/10 border border-accent/20">
                              <div className="flex items-center gap-2">
                                <Link className="w-4 h-4 text-accent" />
                                <span className="font-semibold text-foreground">Conexão Inicial</span>
                              </div>
                              <div className="flex items-center gap-4">
                                {[1, 2].map((nivel) => {
                                  const key = `conexao_inicial_${nivel}` as keyof Relationship;
                                  const isChecked = rel[key] as boolean;
                                  return (
                                    <div key={nivel} className="flex items-center gap-2">
                                      <Checkbox
                                        id={`progress-conexao-${rel.id}-${nivel}`}
                                        checked={isChecked}
                                        onCheckedChange={() => handleToggleConexaoInicial(rel.id, nivel as 1 | 2, isChecked)}
                                      />
                                      <label 
                                        htmlFor={`progress-conexao-${rel.id}-${nivel}`}
                                        className="text-sm cursor-pointer"
                                      >
                                        Encontro {nivel}
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {[rel.conexao_inicial_1, rel.conexao_inicial_2].filter(Boolean).length}/2 encontros concluídos
                              </p>
                            </div>

                            {/* Academia das Nações Progress */}
                            <div className="space-y-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
                              <div className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-primary" />
                                <span className="font-semibold text-foreground">Academia das Nações</span>
                              </div>
                              <div className="flex items-center gap-4">
                                {[1, 2, 3, 4].map((nivel) => {
                                  const key = `academia_nivel_${nivel}` as keyof Relationship;
                                  const isChecked = rel[key] as boolean;
                                  return (
                                    <div key={nivel} className="flex items-center gap-2">
                                      <Checkbox
                                        id={`progress-academia-${rel.id}-${nivel}`}
                                        checked={isChecked}
                                        onCheckedChange={() => handleToggleAcademiaNivel(rel.id, nivel as 1 | 2 | 3 | 4, isChecked)}
                                      />
                                      <label 
                                        htmlFor={`progress-academia-${rel.id}-${nivel}`}
                                        className="text-sm cursor-pointer"
                                      >
                                        Nível {nivel}
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {[rel.academia_nivel_1, rel.academia_nivel_2, rel.academia_nivel_3, rel.academia_nivel_4].filter(Boolean).length}/4 níveis concluídos
                              </p>
                            </div>

                            {/* Lessons Progress */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2">
                                  <BookOpen className="w-4 h-4 text-primary" />
                                  Aulas Concluídas (Total)
                                </span>
                                <span className="font-medium">
                                  {discipleProgress.lessonsCompleted}/{discipleProgress.totalLessons}
                                </span>
                              </div>
                              <Progress 
                                value={(discipleProgress.lessonsCompleted / discipleProgress.totalLessons) * 100} 
                              />
                            </div>

                            {/* Reading Plans */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  Dias de Leitura Concluídos
                                </span>
                                <span className="font-medium">
                                  {discipleProgress.readingPlansProgress} dias
                                </span>
                              </div>
                            </div>

                            {/* Weekly Habits */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2">
                                  <Flame className="w-4 h-4 text-orange-500" />
                                  Hábitos esta Semana
                                </span>
                                <span className="font-medium">
                                  {discipleProgress.habitsThisWeek} registros
                                </span>
                              </div>
                            </div>

                            {/* Streak */}
                            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Streak Atual</span>
                                <span className="text-2xl font-bold text-primary">
                                  {rel.discipulo?.current_streak || 0} 🔥
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRemoveRelationship(rel.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
