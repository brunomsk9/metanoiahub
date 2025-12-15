import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminTracks } from '@/components/admin/AdminTracks';
import { AdminCourses } from '@/components/admin/AdminCourses';
import { AdminLessons } from '@/components/admin/AdminLessons';
import { AdminResources } from '@/components/admin/AdminResources';
import { Loader2, ShieldAlert, ArrowLeft, BookOpen, GraduationCap, FileText, LifeBuoy, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import metanoiaLogo from "@/assets/metanoia-hub-logo.png";

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('nome, role')
      .eq('id', session.user.id)
      .single();

    if (profile) {
      setIsAdmin(profile.role === 'admin');
    }
    
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

  if (!isAdmin) {
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

  return (
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
          <h1 className="text-2xl font-bold text-foreground">Gerenciar Conteúdo</h1>
          <p className="text-muted-foreground mt-1">
            Adicione e edite trilhas, cursos, lições e recursos
          </p>
        </div>

        <Tabs defaultValue="tracks" className="space-y-6">
          <TabsList className="bg-card border border-border p-1 rounded-lg w-full sm:w-auto inline-flex">
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
          </TabsList>

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
        </Tabs>
      </main>
    </div>
  );
}