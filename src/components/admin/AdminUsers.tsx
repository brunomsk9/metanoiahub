import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Users, UserCheck, Shield, Search, Upload, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Database } from '@/integrations/supabase/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminUserImport } from './AdminUserImport';
import { CreateUserModal } from './CreateUserModal';

type AppRole = Database['public']['Enums']['app_role'];

interface UserWithRoles {
  id: string;
  nome: string;
  email: string;
  roles: AppRole[];
}

export function AdminUsers() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, nome')
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
      email: '', // We don't have access to email from profiles
      roles: (allRoles || [])
        .filter(r => r.user_id === profile.id)
        .map(r => r.role)
    }));

    setUsers(usersWithRoles);
    setLoading(false);
  };

  const toggleRole = async (userId: string, role: AppRole, hasRole: boolean) => {
    setSaving(userId);

    if (hasRole) {
      // Remove role
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

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
        .insert({ user_id: userId, role });

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

  const filteredUsers = users.filter(user => 
    user.nome.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'discipulador': return <UserCheck className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: AppRole) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'discipulador': return 'Discipulador';
      default: return 'Discípulo';
    }
  };

  const getRoleColor = (role: AppRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'discipulador': return 'bg-blue-100 text-blue-700';
      default: return 'bg-green-100 text-green-700';
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <p className="text-muted-foreground">{users.length} usuário(s) cadastrado(s)</p>
            <Button onClick={() => setCreateModalOpen(true)} size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Novo Usuário
            </Button>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuário..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <CreateUserModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onUserCreated={fetchUsers}
        />

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {search ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado ainda.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Usuário</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Roles Atuais</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Discípulo</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Discipulador</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => (
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
          )}
        </div>

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