import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Sidebar } from '@/components/Sidebar';
import { MentorChatButton } from '@/components/MentorChat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminTracks } from '@/components/admin/AdminTracks';
import { AdminCourses } from '@/components/admin/AdminCourses';
import { AdminLessons } from '@/components/admin/AdminLessons';
import { AdminResources } from '@/components/admin/AdminResources';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState('');

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
      setUserName(profile.nome || session.user.email || '');
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
      <div className="min-h-screen bg-background flex">
        <Sidebar onLogout={handleLogout} userName={userName} />
        <main className="flex-1 p-6 md:p-8 md:ml-20 flex items-center justify-center">
          <div className="text-center space-y-4">
            <ShieldAlert className="h-16 w-16 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Acesso Negado</h1>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta área.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar onLogout={handleLogout} userName={userName} />
      
      <main className="flex-1 p-6 md:p-8 md:ml-20">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Painel Admin</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie trilhas, cursos, lições e recursos
            </p>
          </header>

          <Tabs defaultValue="tracks" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-card">
              <TabsTrigger value="tracks">Trilhas</TabsTrigger>
              <TabsTrigger value="courses">Cursos</TabsTrigger>
              <TabsTrigger value="lessons">Lições</TabsTrigger>
              <TabsTrigger value="resources">Recursos</TabsTrigger>
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
        </div>
      </main>

      <MentorChatButton />
    </div>
  );
}
