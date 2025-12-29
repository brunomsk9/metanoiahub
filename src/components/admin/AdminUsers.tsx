import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Users, UserCheck, Shield, Search, Upload, UserPlus, Building2, Filter, Droplets, HeartHandshake, ArrowRightLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Database } from '@/integrations/supabase/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminUserImport } from './AdminUserImport';
import { CreateUserModal } from './CreateUserModal';
import { Badge } from '@/components/ui/badge';
import { TablePagination } from '@/components/ui/table-pagination';
import { SortableHeader } from '@/components/ui/sortable-header';
import { usePagination } from '@/hooks/usePagination';
import { useSorting } from '@/hooks/useSorting';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

type AppRole = Database['public']['Enums']['app_role'] | 'lider_ministerial';

interface UserWithRoles {
  id: string;
  nome: string;
  email: string;
  roles: AppRole[];
  is_batizado?: boolean;
  is_novo_convertido?: boolean;
  is_transferido?: boolean;
}

type SpiritualFilter = 'batizado' | 'novo_convertido' | 'transferido';

export function AdminUsers() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [spiritualFilters, setSpiritualFilters] = useState<SpiritualFilter[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    // Fetch all profiles with spiritual status
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, nome, is_batizado, is_novo_convertido, is_transferido')
      .order('nome');

    if (profilesError) {
      toast.error('Erro ao carregar usuários');
      setLoading(false);
      return;
    }

    // Fetch all user roles
    const { data: allRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) {
      toast.error('Erro ao carregar roles');
      setLoading(false);
      return;
    }

    // Combine profiles with their roles
    const usersWithRoles: UserWithRoles[] = (profiles || []).map(profile => ({
      id: profile.id,
      nome: profile.nome || 'Sem nome',
      email: '',
      roles: (allRoles || [])
        .filter(r => r.user_id === profile.id)
        .map(r => r.role),
      is_batizado: profile.is_batizado ?? false,
      is_novo_convertido: profile.is_novo_convertido ?? false,
      is_transferido: profile.is_transferido ?? false,
    }));

    setUsers(usersWithRoles);
    setLoading(false);
  };

  const toggleSpiritualFilter = (filter: SpiritualFilter) => {
    setSpiritualFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const clearFilters = () => {
    setSpiritualFilters([]);
  };

  const toggleRole = async (userId: string, role: AppRole, hasRole: boolean) => {
    setSaving(userId);

    if (hasRole) {
      // Remove role
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role as Database['public']['Enums']['app_role']);

      if (error) {
        toast.error('Erro ao remover role');
      } else {
        toast.success(`Role ${role} removida`);
        // Update local state
        setUsers(users.map(u => 
          u.id === userId 
            ? { ...u, roles: u.roles.filter(r => r !== role) }
            : u
        ));
      }
    } else {
      // Add role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: role as Database['public']['Enums']['app_role'] });

      if (error) {
        if (error.code === '23505') {
          toast.error('Usuário já possui esta role');
        } else {
          toast.error('Erro ao adicionar role');
        }
      } else {
        toast.success(`Role ${role} adicionada`);
        // Update local state
        setUsers(users.map(u => 
          u.id === userId 
            ? { ...u, roles: [...u.roles, role] }
            : u
        ));
      }
    }

    setSaving(null);
  };

  const filteredUsers = users.filter(user => {
    // Text search filter
    const matchesSearch = user.nome.toLowerCase().includes(search.toLowerCase());
    
    // Spiritual status filters
    const matchesSpiritualFilters = spiritualFilters.length === 0 || spiritualFilters.some(filter => {
      switch (filter) {
        case 'batizado': return user.is_batizado;
        case 'novo_convertido': return user.is_novo_convertido;
        case 'transferido': return user.is_transferido;
        default: return false;
      }
    });

    return matchesSearch && matchesSpiritualFilters;
  });

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'discipulador': return <UserCheck className="h-4 w-4" />;
      case 'lider_ministerial': return <Building2 className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: AppRole) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'discipulador': return 'Discipulador';
      case 'lider_ministerial': return 'Líder Ministerial';
      default: return 'Discípulo';
    }
  };

  const getRoleColor = (role: AppRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'discipulador': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'lider_ministerial': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="list" className="space-y-6">
      <TabsList className="bg-muted/50">
        <TabsTrigger value="list" className="gap-2">
          <Users className="w-4 h-4" />
          Lista de Usuários
        </TabsTrigger>
        <TabsTrigger value="import" className="gap-2">
          <Upload className="w-4 h-4" />
          Importar CSV
        </TabsTrigger>
      </TabsList>

      <TabsContent value="list" className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <p className="text-muted-foreground">{filteredUsers.length} de {users.length} usuário(s)</p>
              <Button onClick={() => setCreateModalOpen(true)} size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Novo Usuário
              </Button>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="relative">
                    <Filter className="h-4 w-4" />
                    {spiritualFilters.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 text-xs bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                        {spiritualFilters.length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Status Espiritual</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={spiritualFilters.includes('batizado')}
                    onCheckedChange={() => toggleSpiritualFilter('batizado')}
                  >
                    <Droplets className="h-4 w-4 mr-2 text-blue-500" />
                    Batizado
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={spiritualFilters.includes('novo_convertido')}
                    onCheckedChange={() => toggleSpiritualFilter('novo_convertido')}
                  >
                    <HeartHandshake className="h-4 w-4 mr-2 text-green-500" />
                    Novo Convertido
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={spiritualFilters.includes('transferido')}
                    onCheckedChange={() => toggleSpiritualFilter('transferido')}
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-2 text-orange-500" />
                    Transferido
                  </DropdownMenuCheckboxItem>
                  {spiritualFilters.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start text-muted-foreground"
                        onClick={clearFilters}
                      >
                        Limpar filtros
                      </Button>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {spiritualFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {spiritualFilters.map(filter => (
                <Badge 
                  key={filter} 
                  variant="secondary" 
                  className="gap-1 cursor-pointer hover:bg-destructive/20"
                  onClick={() => toggleSpiritualFilter(filter)}
                >
                  {filter === 'batizado' && <Droplets className="h-3 w-3" />}
                  {filter === 'novo_convertido' && <HeartHandshake className="h-3 w-3" />}
                  {filter === 'transferido' && <ArrowRightLeft className="h-3 w-3" />}
                  {filter === 'batizado' && 'Batizado'}
                  {filter === 'novo_convertido' && 'Novo Convertido'}
                  {filter === 'transferido' && 'Transferido'}
                  <span className="ml-1">×</span>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <CreateUserModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onUserCreated={fetchUsers}
        />

        <UsersTable 
          users={filteredUsers} 
          search={search}
          saving={saving}
          toggleRole={toggleRole}
          getRoleIcon={getRoleIcon}
          getRoleColor={getRoleColor}
          getRoleLabel={getRoleLabel}
        />

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">Sobre as Roles</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              <strong>Discípulo:</strong> Acesso às trilhas e cursos para discípulos
            </li>
            <li className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-blue-500" />
              <strong>Discipulador:</strong> Acesso às trilhas e cursos para discipuladores
            </li>
            <li className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-purple-500" />
              <strong>Líder Ministerial:</strong> Gerencia ministérios e voluntários
            </li>
            <li className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-500" />
              <strong>Admin:</strong> Acesso total ao painel administrativo
            </li>
          </ul>
        </div>
      </TabsContent>

      <TabsContent value="import">
        <AdminUserImport />
      </TabsContent>
    </Tabs>
  );
}

interface UsersTableProps {
  users: UserWithRoles[];
  search: string;
  saving: string | null;
  toggleRole: (userId: string, role: AppRole, hasRole: boolean) => void;
  getRoleIcon: (role: AppRole) => React.ReactNode;
  getRoleColor: (role: AppRole) => string;
  getRoleLabel: (role: AppRole) => string;
}

function UsersTable({ users, search, saving, toggleRole, getRoleIcon, getRoleColor, getRoleLabel }: UsersTableProps) {
  const sorting = useSorting({ data: users, defaultSortKey: "nome", defaultDirection: "asc" });
  const pagination = usePagination({ data: sorting.sortedData, pageSize: 15 });

  if (users.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {search ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado ainda.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                <SortableHeader sortState={sorting.getSortIcon("nome")} onClick={() => sorting.toggleSort("nome")}>
                  Usuário
                </SortableHeader>
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Roles Atuais</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Discípulo</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Discipulador</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Líder Min.</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Admin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pagination.paginatedData.map((user) => (
              <tr key={user.id} className="hover:bg-muted/30">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                      {user.nome.charAt(0).toUpperCase()}
                    </div>
                    <p className="font-medium text-foreground">{user.nome}</p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {user.roles.length === 0 ? (
                      <span className="text-muted-foreground text-sm">Nenhuma</span>
                    ) : (
                      user.roles.map(role => (
                        <span 
                          key={role} 
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${getRoleColor(role)}`}
                        >
                          {getRoleIcon(role)}
                          {getRoleLabel(role)}
                        </span>
                      ))
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <Checkbox
                    checked={user.roles.includes('discipulo')}
                    onCheckedChange={() => toggleRole(user.id, 'discipulo', user.roles.includes('discipulo'))}
                    disabled={saving === user.id}
                  />
                </td>
                <td className="py-3 px-4 text-center">
                  <Checkbox
                    checked={user.roles.includes('discipulador')}
                    onCheckedChange={() => toggleRole(user.id, 'discipulador', user.roles.includes('discipulador'))}
                    disabled={saving === user.id}
                  />
                </td>
                <td className="py-3 px-4 text-center">
                  <Checkbox
                    checked={user.roles.includes('lider_ministerial')}
                    onCheckedChange={() => toggleRole(user.id, 'lider_ministerial', user.roles.includes('lider_ministerial'))}
                    disabled={saving === user.id}
                  />
                </td>
                <td className="py-3 px-4 text-center">
                  <Checkbox
                    checked={user.roles.includes('admin')}
                    onCheckedChange={() => toggleRole(user.id, 'admin', user.roles.includes('admin'))}
                    disabled={saving === user.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 pb-4">
        <TablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          totalItems={pagination.totalItems}
          onPageChange={pagination.setPage}
          onNextPage={pagination.nextPage}
          onPrevPage={pagination.prevPage}
          hasNextPage={pagination.hasNextPage}
          hasPrevPage={pagination.hasPrevPage}
        />
      </div>
    </div>
  );
}