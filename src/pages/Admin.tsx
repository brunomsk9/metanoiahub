import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminTracks } from '@/components/admin/AdminTracks';
import { AdminCourses } from '@/components/admin/AdminCourses';
import { AdminLessons } from '@/components/admin/AdminLessons';
import { AdminResources } from '@/components/admin/AdminResources';
import { AdminUsers } from '@/components/admin/AdminUsers';
import { AdminDiscipleship } from '@/components/admin/AdminDiscipleship';
import { AdminReadingPlanDays } from '@/components/admin/AdminReadingPlanDays';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { PageTransition } from '@/components/PageTransition';
import { Loader2, ShieldAlert, ArrowLeft, BookOpen, GraduationCap, FileText, LifeBuoy, LogOut, Users, Heart, CalendarDays, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import metanoiaLogo from "@/assets/metanoia-hub-logo.png";

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDiscipulador, setIsDiscipulador] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    // Check if user has admin role in user_roles table
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id);

    const userRoles = roles?.map(r => r.role) || [];
    setIsAdmin(userRoles.includes('admin'));
    setIsDiscipulador(userRoles.includes('discipulador'));
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Allow access if user is admin OR discipulador
  if (!isAdmin && !isDiscipulador) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <ShieldAlert className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta área.
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

  // Determine default tab based on role
  const defaultTab = isAdmin ? "dashboard" : "discipleship";

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
                <span className="font-semibold text-foreground">Admin</span>
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            {isAdmin ? 'Gerenciar Conteúdo' : 'Discipulado'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin 
              ? 'Adicione e edite trilhas, cursos, lições e recursos' 
              : 'Acompanhe o progresso dos seus discípulos'}
          </p>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="bg-card border border-border p-1 rounded-lg w-full sm:w-auto inline-flex flex-wrap">
            {isAdmin && (
              <>
                <TabsTrigger 
                  value="dashboard" 
                  className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md px-4 py-2 text-muted-foreground"
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger 
                  value="tracks" 
                  className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md px-4 py-2 text-muted-foreground"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Trilhas
                </TabsTrigger>
                <TabsTrigger 
                  value="courses"
                  className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md px-4 py-2 text-muted-foreground"
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Cursos
                </TabsTrigger>
                <TabsTrigger 
                  value="lessons"
                  className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md px-4 py-2 text-muted-foreground"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Aulas
                </TabsTrigger>
                <TabsTrigger 
                  value="resources"
                  className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md px-4 py-2 text-muted-foreground"
                >
                  <LifeBuoy className="h-4 w-4 mr-2" />
                  Recursos
                </TabsTrigger>
                <TabsTrigger 
                  value="users"
                  className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md px-4 py-2 text-muted-foreground"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Usuários
                </TabsTrigger>
                <TabsTrigger 
                  value="reading-plans"
                  className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md px-4 py-2 text-muted-foreground"
                >
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Planos de Leitura
                </TabsTrigger>
              </>
            )}
            {isDiscipulador && (
              <TabsTrigger 
                value="discipleship"
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md px-4 py-2 text-muted-foreground"
              >
                <Heart className="h-4 w-4 mr-2" />
                Discipulado
              </TabsTrigger>
            )}
          </TabsList>

          {isAdmin && (
            <>
              <TabsContent value="dashboard">
                <AdminDashboard />
              </TabsContent>

              <TabsContent value="tracks">
                <AdminTracks />
              </TabsContent>

              <TabsContent value="courses">
                <AdminCourses />
              </TabsContent>

              <TabsContent value="lessons">
                <AdminLessons />
              </TabsContent>

              <TabsContent value="resources">
                <AdminResources />
              </TabsContent>

              <TabsContent value="users">
                <AdminUsers />
              </TabsContent>

              <TabsContent value="reading-plans">
                <AdminReadingPlanDays />
              </TabsContent>
            </>
          )}

          {isDiscipulador && (
            <TabsContent value="discipleship">
              <AdminDiscipleship />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
    </PageTransition>
  );
}