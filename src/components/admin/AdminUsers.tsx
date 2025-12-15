import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Users, UserCheck, Shield, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Database } from '@/integrations/supabase/types';

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p className="text-gray-500">{users.length} usuário(s) cadastrado(s)</p>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar usuário..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-gray-300"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {search ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado ainda.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Usuário</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Roles Atuais</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Discípulo</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Discipulador</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-sm font-medium">
                          {user.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.nome}</p>
                          <p className="text-xs text-gray-500 font-mono">{user.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length === 0 ? (
                          <span className="text-gray-400 text-sm">Nenhuma</span>
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

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-medium text-amber-800 mb-2">Sobre as Roles</h4>
        <ul className="text-sm text-amber-700 space-y-1">
          <li className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <strong>Discípulo:</strong> Acesso às trilhas e cursos para discípulos
          </li>
          <li className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            <strong>Discipulador:</strong> Acesso às trilhas e cursos para discipuladores
          </li>
          <li className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <strong>Admin:</strong> Acesso total ao painel administrativo
          </li>
        </ul>
      </div>
    </div>
  );
}