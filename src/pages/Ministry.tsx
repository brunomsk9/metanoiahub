import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminMinistries } from '@/components/admin/AdminMinistries';
import { AdminSchedules } from '@/components/admin/AdminSchedules';
import { PageTransition } from '@/components/PageTransition';
import { Loader2, ShieldAlert, ArrowLeft, Building2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/layout/AppShell';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Ministry() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [isLiderMinisterial, setIsLiderMinisterial] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const defaultTab = searchParams.get('tab') || 'escalas';

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
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
    const userIsLiderMinisterial = userRoles.includes('lider_ministerial');
    const userIsAdmin = userRoles.includes('admin');
    
    setIsLiderMinisterial(userIsLiderMinisterial);
    setIsAdmin(userIsAdmin);
    setLoading(false);
  };

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isLiderMinisterial && !isAdmin) {
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
    <AppShell>
      <PageTransition>
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Ministério</h1>
            </div>
            <p className="text-muted-foreground">
              Gerencie escalas e a rede ministerial
            </p>
          </div>

          <Tabs value={defaultTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="escalas" className="gap-2">
                <Calendar className="h-4 w-4" />
                Escalas
              </TabsTrigger>
              <TabsTrigger value="rede" className="gap-2">
                <Building2 className="h-4 w-4" />
                Rede Ministerial
              </TabsTrigger>
            </TabsList>

            <TabsContent value="escalas" className="mt-6">
              <AdminSchedules />
            </TabsContent>

            <TabsContent value="rede" className="mt-6">
              <AdminMinistries />
            </TabsContent>
          </Tabs>
        </div>
      </PageTransition>
    </AppShell>
  );
}
