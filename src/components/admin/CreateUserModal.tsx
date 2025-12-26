import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, UserPlus, AlertTriangle, Users } from 'lucide-react';
import { useUserChurchId } from '@/hooks/useUserChurchId';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface Discipulador {
  id: string;
  nome: string;
}

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: () => void;
}

export function CreateUserModal({ open, onOpenChange, onUserCreated }: CreateUserModalProps) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [genero, setGenero] = useState<string>('');
  const [isTransferido, setIsTransferido] = useState(false);
  const [isNovoConvertido, setIsNovoConvertido] = useState(false);
  const [isBatizado, setIsBatizado] = useState(false);
  const [batizouNaIgreja, setBatizouNaIgreja] = useState(false);
  const [dataBatismo, setDataBatismo] = useState<string>('');
  const [roles, setRoles] = useState<AppRole[]>(['discipulo']);
  const [selectedDiscipulador, setSelectedDiscipulador] = useState<string>('');
  const [discipuladores, setDiscipuladores] = useState<Discipulador[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingDiscipuladores, setLoadingDiscipuladores] = useState(false);
  const { churchId, loading: loadingChurch } = useUserChurchId();

  // Fetch discipuladores when modal opens
  useEffect(() => {
    if (open && churchId) {
      fetchDiscipuladores();
    }
  }, [open, churchId]);

  const fetchDiscipuladores = async () => {
    if (!churchId) return;
    
    setLoadingDiscipuladores(true);
    try {
      // Get all users with discipulador role in this church
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'discipulador');

      if (rolesError) throw rolesError;

      const discipuladorIds = rolesData?.map(r => r.user_id) || [];

      if (discipuladorIds.length === 0) {
        setDiscipuladores([]);
        return;
      }

      // Get profiles of discipuladores in the same church
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nome')
        .eq('church_id', churchId)
        .in('id', discipuladorIds)
        .order('nome');

      if (profilesError) throw profilesError;

      setDiscipuladores(profiles || []);
    } catch (error) {
      console.error('Error fetching discipuladores:', error);
      toast.error('Erro ao carregar discipuladores');
    } finally {
      setLoadingDiscipuladores(false);
    }
  };

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
    setGenero('');
    setIsTransferido(false);
    setIsNovoConvertido(false);
    setIsBatizado(false);
    setBatizouNaIgreja(false);
    setDataBatismo('');
    setRoles(['discipulo']);
    setSelectedDiscipulador('');
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
            role: roles[0] || 'discipulo',
            genero: genero || null,
            is_transferido: isTransferido,
            is_novo_convertido: isNovoConvertido,
            is_batizado: isBatizado,
            batizou_na_igreja: batizouNaIgreja,
            data_batismo: batizouNaIgreja && dataBatismo ? dataBatismo : null
          }],
          church_id: churchId
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      
      if (result.results?.[0]?.success) {
        // Get the new user's ID by searching for them
        const { data: newUserProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('church_id', churchId)
          .ilike('nome', nome.trim())
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // If user has multiple roles, add the additional ones
        if (newUserProfile && roles.length > 1) {
          for (let i = 1; i < roles.length; i++) {
            await supabase.from('user_roles').insert({
              user_id: newUserProfile.id,
              role: roles[i]
            });
          }
        }

        // Create discipleship relationship if a discipulador was selected
        if (selectedDiscipulador && newUserProfile) {
          const { error: relationshipError } = await supabase
            .from('discipleship_relationships')
            .insert({
              discipulador_id: selectedDiscipulador,
              discipulo_id: newUserProfile.id,
              church_id: churchId,
              status: 'active'
            });

          if (relationshipError) {
            console.error('Error creating discipleship relationship:', relationshipError);
            toast.warning('Usuário criado, mas houve erro ao vincular ao discipulador');
          } else {
            const discipuladorNome = discipuladores.find(d => d.id === selectedDiscipulador)?.nome;
            toast.success('Usuário criado e vinculado!', {
              description: `Senha padrão: mudar123. Discipulador: ${discipuladorNome}`
            });
          }
        } else {
          toast.success('Usuário criado com sucesso!', {
            description: `Senha padrão: mudar123`
          });
        }
        
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

          <div className="space-y-2">
            <Label htmlFor="genero">Sexo</Label>
            <Select
              value={genero}
              onValueChange={setGenero}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o sexo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Status Espiritual</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="transferido"
                  checked={isTransferido}
                  onCheckedChange={(checked) => setIsTransferido(checked as boolean)}
                  disabled={isLoading}
                />
                <label htmlFor="transferido" className="text-sm cursor-pointer">
                  Transferido
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="novoConvertido"
                  checked={isNovoConvertido}
                  onCheckedChange={(checked) => setIsNovoConvertido(checked as boolean)}
                  disabled={isLoading}
                />
                <label htmlFor="novoConvertido" className="text-sm cursor-pointer">
                  Novo Convertido
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="batizado"
                  checked={isBatizado}
                  onCheckedChange={(checked) => setIsBatizado(checked as boolean)}
                  disabled={isLoading}
                />
                <label htmlFor="batizado" className="text-sm cursor-pointer">
                  Batizado
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="batizouNaIgreja"
                  checked={batizouNaIgreja}
                  onCheckedChange={(checked) => {
                    setBatizouNaIgreja(checked as boolean);
                    if (!checked) setDataBatismo('');
                  }}
                  disabled={isLoading}
                />
                <label htmlFor="batizouNaIgreja" className="text-sm cursor-pointer">
                  Batizou na CN
                </label>
              </div>
            </div>
            {batizouNaIgreja && (
              <div className="mt-2">
                <Label htmlFor="dataBatismo" className="text-sm">Data do Batismo</Label>
                <Input
                  id="dataBatismo"
                  type="date"
                  value={dataBatismo}
                  onChange={(e) => setDataBatismo(e.target.value)}
                  disabled={isLoading}
                  className="mt-1"
                />
              </div>
            )}
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

          {/* Discipulador Selection */}
          <div className="space-y-2">
            <Label htmlFor="discipulador" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Vincular a Discipulador (opcional)
            </Label>
            <Select
              value={selectedDiscipulador}
              onValueChange={setSelectedDiscipulador}
              disabled={isLoading || loadingDiscipuladores}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  loadingDiscipuladores 
                    ? "Carregando..." 
                    : discipuladores.length === 0 
                      ? "Nenhum discipulador disponível"
                      : "Selecione um discipulador"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não vincular agora</SelectItem>
                {discipuladores.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {discipuladores.length === 0 && !loadingDiscipuladores && (
              <p className="text-xs text-muted-foreground">
                Nenhum discipulador cadastrado na igreja. Crie um usuário com a role "Discipulador" primeiro.
              </p>
            )}
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
