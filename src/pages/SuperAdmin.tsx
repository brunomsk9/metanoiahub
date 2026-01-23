import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageTransition } from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Loader2, ShieldAlert, ArrowLeft, Plus, Pencil, Church, Users, LogOut, Trash2, 
  Search, BookOpen, GraduationCap, FileText, LifeBuoy, CalendarDays, 
  ClipboardList, BarChart3, Bot, Presentation, Sparkles, ChevronDown, LayoutDashboard, Database,
  KeyRound, Eye, EyeOff, UserCog
} from 'lucide-react';
import { useImpersonation } from '@/hooks/useImpersonation';
import { cn } from '@/lib/utils';
import metanoiaLogo from "@/assets/metanoia-hub-logo.png";

// Admin components
import { AdminTracks } from '@/components/admin/AdminTracks';
import { AdminCourses } from '@/components/admin/AdminCourses';
import { AdminLessons } from '@/components/admin/AdminLessons';
import { AdminResources } from '@/components/admin/AdminResources';
import { AdminUsers } from '@/components/admin/AdminUsers';
import { AdminDiscipleship } from '@/components/admin/AdminDiscipleship';
import { AdminReadingPlanDays } from '@/components/admin/AdminReadingPlanDays';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminWeeklyChecklist } from '@/components/admin/AdminWeeklyChecklist';
import { AdminChecklistCompliance } from '@/components/admin/AdminChecklistCompliance';
import { AdminAISettings } from '@/components/admin/AdminAISettings';
import { AdminHabits } from '@/components/admin/AdminHabits';
import { PresentationPdfGenerator } from '@/components/admin/PresentationPdfGenerator';
import { DatabaseConnectionPanel } from '@/components/admin/DatabaseConnectionPanel';
import { DatabaseExplorer } from '@/components/admin/DatabaseExplorer';

type ContentSection = 'dashboard' | 'tracks' | 'courses' | 'lessons' | 'resources' | 'admin-users' | 'reading-plans' | 'discipleship' | 'weekly-checklist' | 'checklist-compliance' | 'ai-settings' | 'presentation' | 'habits' | 'database' | 'database-explorer';

const contentSections = [
  { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tracks' as const, label: 'Trilhas', icon: BookOpen },
  { id: 'courses' as const, label: 'Cursos', icon: GraduationCap },
  { id: 'lessons' as const, label: 'Aulas', icon: FileText },
  { id: 'resources' as const, label: 'Recursos', icon: LifeBuoy },
  { id: 'reading-plans' as const, label: 'Planos de Leitura', icon: CalendarDays },
  { id: 'habits' as const, label: 'Hábitos Diários', icon: Sparkles },
  { id: 'weekly-checklist' as const, label: 'Checklist Semanal', icon: ClipboardList },
  { id: 'checklist-compliance' as const, label: 'Relatório Compliance', icon: BarChart3 },
  { id: 'ai-settings' as const, label: 'Configurações IA', icon: Bot },
  { id: 'presentation' as const, label: 'Apresentação', icon: Presentation },
  { id: 'admin-users' as const, label: 'Usuários (Admin)', icon: Users },
  { id: 'database-explorer' as const, label: 'Explorador SQL', icon: Database },
  { id: 'database' as const, label: 'Conexão Banco', icon: Database },
];

interface ChurchData {
  id: string;
  nome: string;
  slug: string;
  logo_url: string | null;
  cor_primaria: string | null;
  cor_secundaria: string | null;
  is_active: boolean;
  created_at: string;
}

interface UserData {
  id: string;
  nome: string;
  telefone: string | null;
  email: string;
  church_id: string | null;
  church_name?: string;
  roles: string[];
  created_at: string;
  genero: string | null;
  is_transferido: boolean | null;
  is_novo_convertido: boolean | null;
  is_batizado: boolean | null;
  batizou_na_igreja: boolean | null;
  data_batismo: string | null;
}

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { impersonateUser, impersonating } = useImpersonation();
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [churches, setChurches] = useState<ChurchData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChurch, setFilterChurch] = useState<string>('all');
  const [isChurchDialogOpen, setIsChurchDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingChurch, setEditingChurch] = useState<ChurchData | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [activeContentSection, setActiveContentSection] = useState<ContentSection>('dashboard');
  const [formData, setFormData] = useState({
    nome: '',
    slug: '',
    logo_url: '',
    cor_primaria: '#8B5CF6',
    cor_secundaria: '#D946EF',
    is_active: true,
  });
  const [userFormData, setUserFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    church_id: '',
    genero: '',
    roles: [] as string[],
    is_transferido: false,
    is_novo_convertido: false,
    is_batizado: false,
    batizou_na_igreja: false,
    data_batismo: '',
  });
  const [savingRole, setSavingRole] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<UserData | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    checkSuperAdminAccess();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, filterChurch, users]);

  const checkSuperAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id);

    const userRoles = roles?.map(r => r.role) || [];
    const userIsSuperAdmin = userRoles.includes('super_admin');
    
    setIsSuperAdmin(userIsSuperAdmin);
    
    if (userIsSuperAdmin) {
      await Promise.all([loadChurches(), loadUsers()]);
    }
    
    setLoading(false);
  };

  const loadChurches = async () => {
    const { data, error } = await supabase
      .from('churches')
      .select('*')
      .order('nome');

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao carregar igrejas.',
      });
      return;
    }

    setChurches(data || []);
  };

  const loadUsers = async () => {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, nome, telefone, church_id, created_at, genero, is_transferido, is_novo_convertido, is_batizado, batizou_na_igreja, data_batismo')
      .order('nome');

    if (profilesError) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao carregar usuários.',
      });
      return;
    }

    const { data: allRoles } = await supabase
      .from('user_roles')
      .select('user_id, role');

    const { data: churchesData } = await supabase
      .from('churches')
      .select('id, nome');

    // Get user emails using the RPC function
    const { data: userEmails } = await supabase.rpc('get_user_emails');
    const emailMap = new Map(userEmails?.map((u: { id: string; email: string }) => [u.id, u.email]) || []);

    const churchMap = new Map(churchesData?.map(c => [c.id, c.nome]) || []);
    const rolesMap = new Map<string, string[]>();
    
    allRoles?.forEach(r => {
      if (!rolesMap.has(r.user_id)) {
        rolesMap.set(r.user_id, []);
      }
      rolesMap.get(r.user_id)!.push(r.role);
    });

    const usersWithData: UserData[] = (profiles || []).map(profile => ({
      id: profile.id,
      nome: profile.nome || 'Sem nome',
      telefone: profile.telefone,
      email: emailMap.get(profile.id) || '',
      church_id: profile.church_id,
      church_name: profile.church_id ? churchMap.get(profile.church_id) || 'Igreja desconhecida' : 'Sem igreja',
      roles: rolesMap.get(profile.id) || ['discipulo'],
      created_at: profile.created_at,
      genero: profile.genero,
      is_transferido: profile.is_transferido,
      is_novo_convertido: profile.is_novo_convertido,
      is_batizado: profile.is_batizado,
      batizou_na_igreja: profile.batizou_na_igreja,
      data_batismo: profile.data_batismo,
    }));

    setUsers(usersWithData);
    setFilteredUsers(usersWithData);
  };

  const filterUsers = () => {
    let filtered = [...users];
    
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterChurch !== 'all') {
      if (filterChurch === 'none') {
        filtered = filtered.filter(user => !user.church_id);
      } else {
        filtered = filtered.filter(user => user.church_id === filterChurch);
      }
    }
    
    setFilteredUsers(filtered);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleOpenChurchDialog = (church?: ChurchData) => {
    if (church) {
      setEditingChurch(church);
      setFormData({
        nome: church.nome,
        slug: church.slug,
        logo_url: church.logo_url || '',
        cor_primaria: church.cor_primaria || '#8B5CF6',
        cor_secundaria: church.cor_secundaria || '#D946EF',
        is_active: church.is_active,
      });
    } else {
      setEditingChurch(null);
      setFormData({
        nome: '',
        slug: '',
        logo_url: '',
        cor_primaria: '#8B5CF6',
        cor_secundaria: '#D946EF',
        is_active: true,
      });
    }
    setIsChurchDialogOpen(true);
  };

  const handleOpenUserDialog = (user: UserData) => {
    setSelectedUser(user);
    setUserFormData({
      nome: user.nome,
      email: user.email || '',
      telefone: user.telefone || '',
      church_id: user.church_id || '',
      genero: user.genero || '',
      roles: [...user.roles],
      is_transferido: user.is_transferido || false,
      is_novo_convertido: user.is_novo_convertido || false,
      is_batizado: user.is_batizado || false,
      batizou_na_igreja: user.batizou_na_igreja || false,
      data_batismo: user.data_batismo || '',
    });
    setIsUserDialogOpen(true);
  };

  const setUserRoleChecked = (role: string, checked: boolean) => {
    setUserFormData((prev) => {
      const hasRole = prev.roles.includes(role);
      if (checked && !hasRole) return { ...prev, roles: [...prev.roles, role] };
      if (!checked && hasRole) return { ...prev, roles: prev.roles.filter((r) => r !== role) };
      return prev;
    });
  };

  const handleSubmitChurch = async (e: React.FormEvent) => {
    e.preventDefault();

    const slug = formData.slug || formData.nome.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const churchData = {
      nome: formData.nome,
      slug,
      logo_url: formData.logo_url || null,
      cor_primaria: formData.cor_primaria,
      cor_secundaria: formData.cor_secundaria,
      is_active: formData.is_active,
    };

    if (editingChurch) {
      const { error } = await supabase
        .from('churches')
        .update(churchData)
        .eq('id', editingChurch.id);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Erro ao atualizar igreja.',
        });
        return;
      }

      toast({ title: 'Sucesso', description: 'Igreja atualizada com sucesso.' });
    } else {
      const { error } = await supabase
        .from('churches')
        .insert(churchData);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: error.message.includes('duplicate') 
            ? 'Já existe uma igreja com esse slug.' 
            : 'Erro ao criar igreja.',
        });
        return;
      }

      toast({ title: 'Sucesso', description: 'Igreja criada com sucesso.' });
    }

    setIsChurchDialogOpen(false);
    loadChurches();
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setSavingRole(true);

    const generoValue = userFormData.genero as 'masculino' | 'feminino' | 'unissex' | null;
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        nome: userFormData.nome,
        telefone: userFormData.telefone || null,
        church_id: userFormData.church_id || null,
        genero: generoValue || null,
        is_transferido: userFormData.is_transferido,
        is_novo_convertido: userFormData.is_novo_convertido,
        is_batizado: userFormData.is_batizado,
        batizou_na_igreja: userFormData.batizou_na_igreja,
        data_batismo: userFormData.batizou_na_igreja && userFormData.data_batismo ? userFormData.data_batismo : null
      })
      .eq('id', selectedUser.id);

    if (profileError) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao atualizar dados do usuário.',
      });
      setSavingRole(false);
      return;
    }

    // Get current roles from selectedUser
    const currentRoles = selectedUser.roles;
    const newRoles = userFormData.roles;

    // Find roles to remove and roles to add
    const rolesToRemove = currentRoles.filter(r => !newRoles.includes(r));
    const rolesToAdd = newRoles.filter(r => !currentRoles.includes(r));

    // Remove roles
    for (const role of rolesToRemove) {
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.id)
        .eq('role', role as 'discipulo' | 'discipulador' | 'admin' | 'church_admin' | 'super_admin');
    }

    // Add roles
    for (const role of rolesToAdd) {
      await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser.id,
          role: role as 'discipulo' | 'discipulador' | 'admin' | 'church_admin' | 'super_admin',
        });
    }

    toast({ title: 'Sucesso', description: 'Usuário atualizado com sucesso.' });
    setSavingRole(false);
    setIsUserDialogOpen(false);
    loadUsers();
  };

  const handleOpenPasswordDialog = (user: UserData) => {
    setPasswordUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setIsPasswordDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!passwordUser) return;
    
    if (newPassword.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'A senha deve ter pelo menos 8 caracteres.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'As senhas não coincidem.',
      });
      return;
    }

    setResettingPassword(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Sessão expirada. Faça login novamente.',
        });
        return;
      }

      const response = await supabase.functions.invoke('admin-reset-password', {
        body: {
          user_id: passwordUser.id,
          new_password: newPassword,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: 'Sucesso',
        description: `Senha do usuário ${passwordUser.nome} alterada com sucesso.`,
      });
      setIsPasswordDialogOpen(false);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Erro ao alterar senha.',
      });
    } finally {
      setResettingPassword(false);
    }
  };

  const handleDeleteChurch = async (churchId: string) => {
    const { error } = await supabase
      .from('churches')
      .delete()
      .eq('id', churchId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao excluir igreja. Verifique se não há dados vinculados.',
      });
      return;
    }

    toast({ title: 'Sucesso', description: 'Igreja excluída com sucesso.' });
    loadChurches();
  };

  const toggleChurchStatus = async (church: ChurchData) => {
    const { error } = await supabase
      .from('churches')
      .update({ is_active: !church.is_active })
      .eq('id', church.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao alterar status da igreja.',
      });
      return;
    }

    toast({ 
      title: 'Sucesso', 
      description: `Igreja ${!church.is_active ? 'ativada' : 'desativada'} com sucesso.` 
    });
    loadChurches();
  };

  const getRoleBadge = (roles: string[]) => {
    if (roles.includes('super_admin')) return <Badge variant="destructive">Super Admin</Badge>;
    if (roles.includes('church_admin')) return <Badge className="bg-purple-500">Admin Igreja</Badge>;
    if (roles.includes('admin')) return <Badge className="bg-blue-500">Admin</Badge>;
    if (roles.includes('discipulador')) return <Badge className="bg-green-500">Discipulador</Badge>;
    return <Badge variant="secondary">Discípulo</Badge>;
  };

  const renderContentSection = () => {
    switch (activeContentSection) {
      case 'dashboard': return <AdminDashboard />;
      case 'tracks': return <AdminTracks />;
      case 'courses': return <AdminCourses />;
      case 'lessons': return <AdminLessons />;
      case 'resources': return <AdminResources isAdmin={true} />;
      case 'admin-users': return <AdminUsers />;
      case 'reading-plans': return <AdminReadingPlanDays />;
      case 'discipleship': return <AdminDiscipleship />;
      case 'weekly-checklist': return <AdminWeeklyChecklist />;
      case 'checklist-compliance': return <AdminChecklistCompliance />;
      case 'ai-settings': return <AdminAISettings />;
      case 'habits': return <AdminHabits />;
      case 'presentation': return <PresentationPdfGenerator />;
      case 'database': return <DatabaseConnectionPanel />;
      case 'database-explorer': return <DatabaseExplorer />;
      default: return null;
    }
  };

  const activeSection = contentSections.find(s => s.id === activeContentSection);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <ShieldAlert className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Apenas Super Admins podem acessar esta área.
          </p>
          <Link to="/dashboard">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao app
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card border-b border-border sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-5 w-5" />
                  <span className="hidden sm:inline text-sm">Voltar</span>
                </Link>
                <div className="h-6 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <img src={metanoiaLogo} alt="Metanoia Hub" className="w-8 h-8 object-contain" />
                  <span className="font-semibold text-foreground">Super Admin</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="churches" className="space-y-6">
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="churches" className="flex items-center gap-2">
                <Church className="h-4 w-4" />
                <span className="hidden sm:inline">Igrejas</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Usuários</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Conteúdo</span>
              </TabsTrigger>
            </TabsList>

            {/* Churches Tab */}
            <TabsContent value="churches" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Gerenciar Igrejas</h1>
                  <p className="text-muted-foreground mt-1">
                    Crie e gerencie as igrejas da plataforma
                  </p>
                </div>
                <Dialog open={isChurchDialogOpen} onOpenChange={setIsChurchDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => handleOpenChurchDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Igreja
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingChurch ? 'Editar Igreja' : 'Nova Igreja'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitChurch} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome da Igreja</Label>
                        <Input
                          id="nome"
                          value={formData.nome}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          placeholder="Igreja Exemplo"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="slug">Slug (URL)</Label>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                          placeholder="igreja-exemplo"
                        />
                        <p className="text-xs text-muted-foreground">
                          Deixe em branco para gerar automaticamente
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="logo_url">URL do Logo</Label>
                        <Input
                          id="logo_url"
                          value={formData.logo_url}
                          onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                          placeholder="https://exemplo.com/logo.png"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cor_primaria">Cor Primária</Label>
                          <div className="flex gap-2">
                            <Input
                              id="cor_primaria"
                              type="color"
                              value={formData.cor_primaria}
                              onChange={(e) => setFormData({ ...formData, cor_primaria: e.target.value })}
                              className="w-12 h-10 p-1 cursor-pointer"
                            />
                            <Input
                              value={formData.cor_primaria}
                              onChange={(e) => setFormData({ ...formData, cor_primaria: e.target.value })}
                              className="flex-1"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cor_secundaria">Cor Secundária</Label>
                          <div className="flex gap-2">
                            <Input
                              id="cor_secundaria"
                              type="color"
                              value={formData.cor_secundaria}
                              onChange={(e) => setFormData({ ...formData, cor_secundaria: e.target.value })}
                              className="w-12 h-10 p-1 cursor-pointer"
                            />
                            <Input
                              value={formData.cor_secundaria}
                              onChange={(e) => setFormData({ ...formData, cor_secundaria: e.target.value })}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="is_active">Igreja Ativa</Label>
                        <Switch
                          id="is_active"
                          checked={formData.is_active}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                        />
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsChurchDialogOpen(false)} className="flex-1">
                          Cancelar
                        </Button>
                        <Button type="submit" className="flex-1">
                          {editingChurch ? 'Salvar' : 'Criar'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Churches Table */}
              <div className="rounded-lg border border-border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Igreja</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Cores</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {churches.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          <Church className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Nenhuma igreja cadastrada</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      churches.map((church) => (
                        <TableRow key={church.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {church.logo_url ? (
                                <img 
                                  src={church.logo_url} 
                                  alt={church.nome} 
                                  className="w-8 h-8 rounded object-cover"
                                />
                              ) : (
                                <div 
                                  className="w-8 h-8 rounded flex items-center justify-center"
                                  style={{ backgroundColor: church.cor_primaria || '#8B5CF6' }}
                                >
                                  <Church className="h-4 w-4 text-white" />
                                </div>
                              )}
                              <span className="font-medium">{church.nome}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {church.slug}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <div 
                                className="w-6 h-6 rounded border border-border" 
                                style={{ backgroundColor: church.cor_primaria || '#8B5CF6' }}
                                title="Primária"
                              />
                              <div 
                                className="w-6 h-6 rounded border border-border" 
                                style={{ backgroundColor: church.cor_secundaria || '#D946EF' }}
                                title="Secundária"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              church.is_active 
                                ? 'bg-green-500/10 text-green-500' 
                                : 'bg-red-500/10 text-red-500'
                            }`}>
                              {church.is_active ? 'Ativa' : 'Inativa'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleChurchStatus(church)}
                                title={church.is_active ? 'Desativar' : 'Ativar'}
                              >
                                <Switch 
                                  checked={church.is_active} 
                                  className="pointer-events-none"
                                />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenChurchDialog(church)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir Igreja</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir a igreja "{church.nome}"? 
                                      Esta ação não pode ser desfeita e todos os dados vinculados serão perdidos.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteChurch(church.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Gerenciar Usuários</h1>
                  <p className="text-muted-foreground mt-1">
                    {filteredUsers.length} usuário(s) encontrado(s)
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={filterChurch} onValueChange={setFilterChurch}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filtrar por igreja" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as igrejas</SelectItem>
                      <SelectItem value="none">Sem igreja</SelectItem>
                      {churches.map((church) => (
                        <SelectItem key={church.id} value={church.id}>
                          {church.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Users Table */}
              <div className="rounded-lg border border-border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Igreja</TableHead>
                      <TableHead>Papel</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Nenhum usuário encontrado</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                                {user.nome.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium">{user.nome}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.church_name}
                          </TableCell>
                          <TableCell>
                            {getRoleBadge(user.roles)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => impersonateUser({ 
                                  id: user.id, 
                                  nome: user.nome, 
                                  email: user.email 
                                })}
                                disabled={impersonating}
                                title="Logar como este usuário"
                                className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-100 dark:text-orange-500 dark:hover:bg-orange-900/20"
                              >
                                <UserCog className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenPasswordDialog(user)}
                                title="Alterar senha"
                              >
                                <KeyRound className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenUserDialog(user)}
                                title="Editar usuário"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Content Tab (Admin functionality) */}
            <TabsContent value="content" className="space-y-6">
              <div className="flex flex-col gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Gerenciar Conteúdo</h1>
                  <p className="text-muted-foreground mt-1">
                    Adicione e edite trilhas, cursos, lições e recursos
                  </p>
                </div>

                {/* Content Navigation */}
                <div className="flex flex-wrap gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-2"
                      >
                        {activeSection ? (
                          <>
                            <activeSection.icon className="h-4 w-4" />
                            <span className="hidden sm:inline">{activeSection.label}</span>
                          </>
                        ) : (
                          <>
                            <BookOpen className="h-4 w-4" />
                            <span>Selecionar</span>
                          </>
                        )}
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-popover border border-border max-h-80 overflow-y-auto">
                      {contentSections.map((section) => (
                        <DropdownMenuItem
                          key={section.id}
                          onClick={() => setActiveContentSection(section.id)}
                          className={cn(
                            "gap-2 cursor-pointer",
                            activeContentSection === section.id && "bg-primary/10 text-primary"
                          )}
                        >
                          <section.icon className="h-4 w-4" />
                          {section.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Content Section */}
              <div className="mt-4">
                {renderContentSection()}
              </div>
            </TabsContent>
          </Tabs>

          {/* User Edit Dialog */}
          <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Editar Usuário
                </DialogTitle>
                <DialogDescription>
                  Atualize os dados do usuário, defina a igreja e marque um ou mais papéis de acesso.
                </DialogDescription>
              </DialogHeader>
              {selectedUser && (
                <form onSubmit={handleSubmitUser} className="flex flex-col flex-1 overflow-hidden">
                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                    {/* User Info Header */}
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                      <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary">
                          {selectedUser.nome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{selectedUser.nome}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {selectedUser.church_name || 'Sem igreja'}
                        </p>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="user_email" className="text-sm font-medium">E-mail</Label>
                        <Input
                          id="user_email"
                          type="email"
                          value={userFormData.email}
                          className="h-10 bg-muted/50"
                          readOnly
                          disabled
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="user_nome" className="text-sm font-medium">Nome</Label>
                          <Input
                            id="user_nome"
                            value={userFormData.nome}
                            onChange={(e) => setUserFormData({ ...userFormData, nome: e.target.value })}
                            placeholder="Nome do usuário"
                            className="h-10"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="user_telefone" className="text-sm font-medium">Telefone</Label>
                          <Input
                            id="user_telefone"
                            value={userFormData.telefone}
                            onChange={(e) => setUserFormData({ ...userFormData, telefone: e.target.value })}
                            placeholder="(00) 00000-0000"
                            className="h-10"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Church className="h-4 w-4" />
                            Igreja
                          </Label>
                          <Select 
                            value={userFormData.church_id || "none"} 
                            onValueChange={(value) => setUserFormData({ ...userFormData, church_id: value === "none" ? "" : value })}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Selecione uma igreja" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sem igreja</SelectItem>
                              {churches.map((church) => (
                                <SelectItem key={church.id} value={church.id}>
                                  {church.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Sexo
                          </Label>
                          <Select 
                            value={userFormData.genero || "none"} 
                            onValueChange={(value) => setUserFormData({ ...userFormData, genero: value === "none" ? "" : value })}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Selecione o sexo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não informado</SelectItem>
                              <SelectItem value="masculino">Masculino</SelectItem>
                              <SelectItem value="feminino">Feminino</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Status Espiritual */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Status Espiritual</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="edit-transferido"
                              checked={userFormData.is_transferido}
                              onCheckedChange={(checked) => setUserFormData({ ...userFormData, is_transferido: checked as boolean })}
                            />
                            <label htmlFor="edit-transferido" className="text-sm cursor-pointer">
                              Transferido
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="edit-novoConvertido"
                              checked={userFormData.is_novo_convertido}
                              onCheckedChange={(checked) => setUserFormData({ ...userFormData, is_novo_convertido: checked as boolean })}
                            />
                            <label htmlFor="edit-novoConvertido" className="text-sm cursor-pointer">
                              Novo Convertido
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="edit-batizado"
                              checked={userFormData.is_batizado}
                              onCheckedChange={(checked) => setUserFormData({ ...userFormData, is_batizado: checked as boolean })}
                            />
                            <label htmlFor="edit-batizado" className="text-sm cursor-pointer">
                              Batizado
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="edit-batizouNaIgreja"
                              checked={userFormData.batizou_na_igreja}
                              onCheckedChange={(checked) => {
                                setUserFormData({ 
                                  ...userFormData, 
                                  batizou_na_igreja: checked as boolean,
                                  data_batismo: checked ? userFormData.data_batismo : ''
                                });
                              }}
                            />
                            <label htmlFor="edit-batizouNaIgreja" className="text-sm cursor-pointer">
                              Batizou na CN
                            </label>
                          </div>
                        </div>
                        {userFormData.batizou_na_igreja && (
                          <div className="mt-2">
                            <Label htmlFor="edit-dataBatismo" className="text-sm">Data do Batismo</Label>
                            <Input
                              id="edit-dataBatismo"
                              type="date"
                              value={userFormData.data_batismo}
                              onChange={(e) => setUserFormData({ ...userFormData, data_batismo: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Roles Section */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" />
                        Papéis do Usuário
                      </Label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: 'discipulo', label: 'Discípulo', description: 'Acesso às trilhas e cursos para discípulos', color: 'bg-blue-500' },
                          { id: 'discipulador', label: 'Discipulador', description: 'Acesso às trilhas e cursos para discipuladores', color: 'bg-green-500' },
                          { id: 'admin', label: 'Admin', description: 'Acesso total ao painel administrativo', color: 'bg-amber-500' },
                          { id: 'church_admin', label: 'Admin Igreja', description: 'Gerencia conteúdo da sua igreja', color: 'bg-purple-500' },
                          { id: 'super_admin', label: 'Super Admin', description: 'Gerencia todas as igrejas e usuários', color: 'bg-red-500' },
                        ].map((role) => {
                          const isChecked = userFormData.roles.includes(role.id);
                          return (
                            <div 
                              key={role.id} 
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                                isChecked 
                                  ? "bg-primary/5 border-primary/30 shadow-sm" 
                                  : "bg-background border-border hover:bg-muted/50 hover:border-muted-foreground/20"
                              )}
                            >
                              <div className={cn("h-2 w-2 rounded-full", role.color)} />
                              <Checkbox
                                id={`role-${role.id}`}
                                checked={isChecked}
                                onCheckedChange={(checked) => setUserRoleChecked(role.id, checked === true)}
                              />
                              <div className="flex-1 min-w-0">
                                <label htmlFor={`role-${role.id}`} className="text-sm font-medium cursor-pointer block">
                                  {role.label}
                                </label>
                                <p className="text-xs text-muted-foreground truncate">{role.description}</p>
                              </div>
                              {isChecked && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Ativo</Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - Fixed at bottom */}
                  <div className="flex gap-3 pt-4 mt-4 border-t flex-shrink-0">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsUserDialogOpen(false)} 
                      className="flex-1"
                      disabled={savingRole}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1" disabled={savingRole}>
                      {savingRole ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        'Salvar Alterações'
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>

          {/* Password Reset Dialog */}
          <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary" />
                  Alterar Senha
                </DialogTitle>
                <DialogDescription>
                  Defina uma nova senha para o usuário. Ele precisará alterar a senha no próximo login.
                </DialogDescription>
              </DialogHeader>
              {passwordUser && (
                <div className="space-y-4">
                  {/* User Info */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {passwordUser.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{passwordUser.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">{passwordUser.email}</p>
                    </div>
                  </div>

                  {/* Password Fields */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="new_password">Nova Senha</Label>
                      <div className="relative">
                        <Input
                          id="new_password"
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Use letras, números e caracteres especiais"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm_password">Confirmar Senha</Label>
                      <Input
                        id="confirm_password"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Digite a senha novamente"
                      />
                    </div>
                  </div>

                  {/* Validation Messages */}
                  <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                    💡 Use uma senha forte: mínimo 8 caracteres, com letras maiúsculas, minúsculas, números e símbolos.
                  </div>
                  {newPassword && newPassword.length < 8 && (
                    <p className="text-xs text-destructive">
                      A senha deve ter pelo menos 8 caracteres
                    </p>
                  )}
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive">
                      As senhas não coincidem
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsPasswordDialogOpen(false)}
                      className="flex-1"
                      disabled={resettingPassword}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleResetPassword}
                      className="flex-1"
                      disabled={resettingPassword || newPassword.length < 8 || newPassword !== confirmPassword}
                    >
                      {resettingPassword ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Alterando...
                        </>
                      ) : (
                        'Alterar Senha'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </PageTransition>
  );
}
