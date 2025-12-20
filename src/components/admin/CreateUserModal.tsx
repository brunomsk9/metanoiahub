import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, UserPlus, AlertTriangle } from 'lucide-react';
import { useUserChurchId } from '@/hooks/useUserChurchId';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: () => void;
}

export function CreateUserModal({ open, onOpenChange, onUserCreated }: CreateUserModalProps) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [roles, setRoles] = useState<AppRole[]>(['discipulo']);
  const [isLoading, setIsLoading] = useState(false);
  const { churchId, loading: loadingChurch } = useUserChurchId();

  const handleRoleToggle = (role: AppRole, checked: boolean) => {
    if (checked) {
      setRoles([...roles, role]);
    } else {
      setRoles(roles.filter(r => r !== role));
    }
  };

  const resetForm = () => {
    setNome('');
    setEmail('');
    setRoles(['discipulo']);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim() || !email.trim()) {
      toast.error('Nome e email são obrigatórios');
      return;
    }

    if (!churchId) {
      toast.error('Igreja não identificada');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Email inválido');
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Sessão expirada');
        return;
      }

      // Use the import-users edge function to create a single user
      const response = await supabase.functions.invoke('import-users', {
        body: {
          users: [{
            email: email.trim().toLowerCase(),
            nome: nome.trim(),
            role: roles[0] || 'discipulo' // Primary role
          }],
          church_id: churchId
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      
      if (result.results?.[0]?.success) {
        // If user has multiple roles, add the additional ones
        if (roles.length > 1) {
          const userId = result.results[0].userId;
          for (let i = 1; i < roles.length; i++) {
            await supabase.from('user_roles').insert({
              user_id: userId,
              role: roles[i]
            });
          }
        }
        
        toast.success('Usuário criado com sucesso!', {
          description: `Senha padrão: mudar123`
        });
        resetForm();
        onOpenChange(false);
        onUserCreated();
      } else {
        const errorMsg = result.results?.[0]?.error || 'Erro ao criar usuário';
        if (errorMsg.includes('already been registered')) {
          toast.error('Este email já está cadastrado');
        } else {
          toast.error(errorMsg);
        }
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Erro ao criar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Novo Usuário
          </DialogTitle>
          <DialogDescription>
            Crie um novo usuário para a sua igreja. A senha padrão será <code className="bg-muted px-1 py-0.5 rounded text-xs">mudar123</code>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome completo *</Label>
            <Input
              id="nome"
              placeholder="Nome do usuário"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Roles (permissões)</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="role-discipulo"
                  checked={roles.includes('discipulo')}
                  onCheckedChange={(checked) => handleRoleToggle('discipulo', checked as boolean)}
                  disabled={isLoading}
                />
                <label htmlFor="role-discipulo" className="text-sm cursor-pointer">
                  Discípulo
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="role-discipulador"
                  checked={roles.includes('discipulador')}
                  onCheckedChange={(checked) => handleRoleToggle('discipulador', checked as boolean)}
                  disabled={isLoading}
                />
                <label htmlFor="role-discipulador" className="text-sm cursor-pointer">
                  Discipulador
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="role-admin"
                  checked={roles.includes('admin')}
                  onCheckedChange={(checked) => handleRoleToggle('admin', checked as boolean)}
                  disabled={isLoading}
                />
                <label htmlFor="role-admin" className="text-sm cursor-pointer">
                  Admin
                </label>
              </div>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p>O usuário receberá a senha padrão <strong>mudar123</strong> e será solicitado a alterá-la no primeiro acesso.</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || loadingChurch}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Criando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Usuário
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
