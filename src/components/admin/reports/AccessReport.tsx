import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { Button } from "@/components/ui/button";
import { 
  LogIn, Users, Clock, Activity, Search, Building2, 
  UserCheck, UserX, Calendar, TrendingUp, AlertCircle, Download
} from "lucide-react";
import { toast } from "sonner";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { PeriodFilter, PeriodOption, getDateFromPeriod } from "./PeriodFilter";
import { format, formatDistanceToNow, subDays, eachDayOfInterval, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CHART_COLORS, CHART_COLORS_ARRAY, chartAnimationVariants } from "@/lib/chartColors";
import { useUserRoles } from "@/hooks/useUserRoles";
import { usePagination } from "@/hooks/usePagination";

interface UserAccessData {
  id: string;
  nome: string;
  email: string;
  last_sign_in_at: string | null;
  created_at: string;
  church_name?: string;
  church_id?: string;
  role: string;
}

interface ChurchOption {
  id: string;
  nome: string;
}

interface AccessStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersThisPeriod: number;
  avgDaysSinceLogin: number;
}

interface DailyLoginData {
  date: string;
  count: number;
}

export function AccessReport() {
  const { isSuperAdmin, isLoading: rolesLoading } = useUserRoles();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodOption>("30d");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChurch, setSelectedChurch] = useState<string>("all");
  const [users, setUsers] = useState<UserAccessData[]>([]);
  const [churches, setChurches] = useState<ChurchOption[]>([]);
  const [stats, setStats] = useState<AccessStats | null>(null);
  const [dailyLogins, setDailyLogins] = useState<DailyLoginData[]>([]);
  const [activityDistribution, setActivityDistribution] = useState<{ name: string; value: number; fill: string }[]>([]);

  useEffect(() => {
    if (!rolesLoading) {
      fetchData();
    }
  }, [period, selectedChurch, rolesLoading, isSuperAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const periodStart = getDateFromPeriod(period);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get user's church
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('church_id')
        .eq('id', session.user.id)
        .single();

      const userChurchId = userProfile?.church_id;

      // For super_admin, load all churches
      if (isSuperAdmin) {
        const { data: churchesData } = await supabase
          .from('churches')
          .select('id, nome')
          .eq('is_active', true)
          .order('nome');
        setChurches(churchesData || []);
      }

      // Get auth details with emails and last login
      // Super admins use get_user_auth_details_secure (all users)
      // Regular admins use get_church_user_auth_details (only their church)
      const { data: authDetails } = isSuperAdmin
        ? await supabase.rpc('get_user_auth_details_secure')
        : await supabase.rpc('get_church_user_auth_details');

      // Get profiles with church info
      let profilesQuery = supabase
        .from('profiles')
        .select('id, nome, church_id, role, created_at');

      // Filter by church based on role
      if (isSuperAdmin && selectedChurch !== "all") {
        profilesQuery = profilesQuery.eq('church_id', selectedChurch);
      } else if (!isSuperAdmin && userChurchId) {
        profilesQuery = profilesQuery.eq('church_id', userChurchId);
      }

      const { data: profiles } = await profilesQuery;

      // Get church names for super admin
      let churchMap = new Map<string, string>();
      if (isSuperAdmin) {
        const { data: allChurches } = await supabase
          .from('churches')
          .select('id, nome');
        allChurches?.forEach(c => churchMap.set(c.id, c.nome));
      }

      // Combine data
      const authMap = new Map(authDetails?.map(a => [a.id, a]) || []);
      
      const combinedUsers: UserAccessData[] = (profiles || []).map(profile => {
        const auth = authMap.get(profile.id);
        return {
          id: profile.id,
          nome: profile.nome,
          email: auth?.email || '',
          last_sign_in_at: auth?.last_sign_in_at || null,
          created_at: auth?.created_at || profile.created_at,
          church_name: churchMap.get(profile.church_id || '') || undefined,
          church_id: profile.church_id || undefined,
          role: profile.role
        };
      });

      setUsers(combinedUsers);

      // Calculate stats
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      const sevenDaysAgo = subDays(now, 7);

      const activeUsers = combinedUsers.filter(u => 
        u.last_sign_in_at && new Date(u.last_sign_in_at) >= thirtyDaysAgo
      ).length;

      const inactiveUsers = combinedUsers.filter(u => 
        !u.last_sign_in_at || new Date(u.last_sign_in_at) < thirtyDaysAgo
      ).length;

      const newUsersThisPeriod = combinedUsers.filter(u => {
        if (!periodStart) return true;
        return new Date(u.created_at) >= periodStart;
      }).length;

      // Average days since last login
      const usersWithLogin = combinedUsers.filter(u => u.last_sign_in_at);
      const avgDaysSinceLogin = usersWithLogin.length > 0
        ? Math.round(
            usersWithLogin.reduce((sum, u) => {
              const days = Math.floor((now.getTime() - new Date(u.last_sign_in_at!).getTime()) / (1000 * 60 * 60 * 24));
              return sum + days;
            }, 0) / usersWithLogin.length
          )
        : 0;

      setStats({
        totalUsers: combinedUsers.length,
        activeUsers,
        inactiveUsers,
        newUsersThisPeriod,
        avgDaysSinceLogin
      });

      // Daily login distribution (last 14 days)
      const last14Days = eachDayOfInterval({ start: subDays(now, 13), end: now });
      const dailyData = last14Days.map(day => {
        const dayStart = startOfDay(day);
        const count = combinedUsers.filter(u => {
          if (!u.last_sign_in_at) return false;
          const loginDay = startOfDay(new Date(u.last_sign_in_at));
          return loginDay.getTime() === dayStart.getTime();
        }).length;
        return {
          date: format(day, "dd/MM", { locale: ptBR }),
          count
        };
      });
      setDailyLogins(dailyData);

      // Activity distribution
      const recentlyActive = combinedUsers.filter(u => 
        u.last_sign_in_at && new Date(u.last_sign_in_at) >= sevenDaysAgo
      ).length;
      const moderatelyActive = combinedUsers.filter(u => 
        u.last_sign_in_at && 
        new Date(u.last_sign_in_at) >= thirtyDaysAgo &&
        new Date(u.last_sign_in_at) < sevenDaysAgo
      ).length;
      const inactive = combinedUsers.filter(u => 
        !u.last_sign_in_at || new Date(u.last_sign_in_at) < thirtyDaysAgo
      ).length;

      setActivityDistribution([
        { name: "Últimos 7 dias", value: recentlyActive, fill: CHART_COLORS.lime },
        { name: "7-30 dias", value: moderatelyActive, fill: CHART_COLORS.cyan },
        { name: "Inativos (+30 dias)", value: inactive, fill: CHART_COLORS.rose }
      ].filter(d => d.value > 0));

    } catch (error) {
      console.error('Error fetching access data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter users by search
  const filteredUsers = users.filter(u => {
    const matchesSearch = searchTerm === "" || 
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }).sort((a, b) => {
    // Sort by last login (most recent first), nulls last
    if (!a.last_sign_in_at && !b.last_sign_in_at) return 0;
    if (!a.last_sign_in_at) return 1;
    if (!b.last_sign_in_at) return -1;
    return new Date(b.last_sign_in_at).getTime() - new Date(a.last_sign_in_at).getTime();
  });

  const {
    paginatedData: paginatedUsers,
    currentPage,
    totalPages,
    setPage: goToPage,
    nextPage: goToNextPage,
    prevPage: goToPrevPage,
    hasNextPage,
    hasPrevPage,
    startIndex,
    endIndex
  } = usePagination({ data: filteredUsers, pageSize: 15 });

  const getActivityBadge = (lastLogin: string | null) => {
    if (!lastLogin) {
      return <Badge variant="outline" className="text-muted-foreground">Nunca acessou</Badge>;
    }
    const daysSince = Math.floor((Date.now() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince <= 7) {
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Ativo</Badge>;
    }
    if (daysSince <= 30) {
      return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Moderado</Badge>;
    }
    return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Inativo</Badge>;
  };

  const getActivityStatus = (lastLogin: string | null): string => {
    if (!lastLogin) return "Nunca acessou";
    const daysSince = Math.floor((Date.now() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince <= 7) return "Ativo";
    if (daysSince <= 30) return "Moderado";
    return "Inativo";
  };

  const exportToCSV = () => {
    if (filteredUsers.length === 0) {
      toast.error("Não há dados para exportar");
      return;
    }

    const headers = isSuperAdmin
      ? ["Nome", "Email", "Igreja", "Último Acesso", "Cadastro", "Status"]
      : ["Nome", "Email", "Último Acesso", "Cadastro", "Status"];

    const rows = filteredUsers.map(user => {
      const lastAccess = user.last_sign_in_at
        ? format(new Date(user.last_sign_in_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
        : "-";
      const createdAt = format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR });
      const status = getActivityStatus(user.last_sign_in_at);

      if (isSuperAdmin) {
        return [user.nome, user.email, user.church_name || "-", lastAccess, createdAt, status];
      }
      return [user.nome, user.email, lastAccess, createdAt, status];
    });

    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(";"))
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-acessos-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`${filteredUsers.length} registros exportados com sucesso`);
  };

  const chartConfig = {
    count: { label: "Logins", color: CHART_COLORS.lime }
  };

  if (loading || rolesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <LogIn className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Relatório de Acesso</h3>
          {isSuperAdmin && (
            <Badge variant="secondary" className="ml-2">Super Admin</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isSuperAdmin && churches.length > 0 && (
            <Select value={selectedChurch} onValueChange={setSelectedChurch}>
              <SelectTrigger className="w-[200px]">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Todas as igrejas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as igrejas</SelectItem>
                {churches.map(church => (
                  <SelectItem key={church.id} value={church.id}>
                    {church.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <PeriodFilter value={period} onChange={setPeriod} />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportToCSV}
            disabled={filteredUsers.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Total de Usuários",
            value: stats?.totalUsers || 0,
            Icon: Users,
            iconClass: "text-primary",
            subtitle: `+${stats?.newUsersThisPeriod || 0} no período`
          },
          {
            title: "Usuários Ativos",
            value: stats?.activeUsers || 0,
            Icon: UserCheck,
            iconClass: "text-green-500",
            subtitle: "Últimos 30 dias"
          },
          {
            title: "Usuários Inativos",
            value: stats?.inactiveUsers || 0,
            Icon: UserX,
            iconClass: "text-red-500",
            subtitle: "+30 dias sem acesso"
          },
          {
            title: "Média de Inatividade",
            value: `${stats?.avgDaysSinceLogin || 0}d`,
            Icon: Clock,
            iconClass: "text-amber-500",
            subtitle: "Dias desde último login"
          }
        ].map((card, i) => (
          <motion.div
            key={card.title}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={chartAnimationVariants.card}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.Icon className={`h-4 w-4 ${card.iconClass}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Logins Chart */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={chartAnimationVariants.chart}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Logins por Dia (Últimos 14 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyLogins}>
                    <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill={CHART_COLORS.lime} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Distribution */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={chartAnimationVariants.chart}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Distribuição de Atividade
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityDistribution.length > 0 ? (
                <ChartContainer config={{}} className="h-[220px] w-full overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activityDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={2}
                        dataKey="value"
                        label={false}
                      >
                        {activityDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Sem dados de atividade
                </div>
              )}
              {/* Legend */}
              {activityDistribution.length > 0 && (
                <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
                  {activityDistribution.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-muted-foreground">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Users Table */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={chartAnimationVariants.card}
      >
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">Histórico de Acesso</CardTitle>
                <CardDescription>Lista de usuários e últimos acessos</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    {isSuperAdmin && <TableHead>Igreja</TableHead>}
                    <TableHead>Último Acesso</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isSuperAdmin ? 5 : 4} className="text-center py-8 text-muted-foreground">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.nome}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell>
                            <span className="text-sm">{user.church_name || '-'}</span>
                          </TableCell>
                        )}
                        <TableCell>
                          {user.last_sign_in_at ? (
                            <div>
                              <p className="text-sm">
                                {format(new Date(user.last_sign_in_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(user.last_sign_in_at), { locale: ptBR, addSuffix: true })}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getActivityBadge(user.last_sign_in_at)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {filteredUsers.length > 0 && (
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                startIndex={startIndex}
                endIndex={endIndex}
                totalItems={filteredUsers.length}
                onPageChange={goToPage}
                onNextPage={goToNextPage}
                onPrevPage={goToPrevPage}
                hasNextPage={hasNextPage}
                hasPrevPage={hasPrevPage}
                className="mt-4"
              />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
