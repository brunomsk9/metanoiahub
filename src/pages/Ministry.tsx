import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminMinistries } from '@/components/admin/AdminMinistries';
import { AdminSchedules } from '@/components/admin/AdminSchedules';
import { PageTransition } from '@/components/PageTransition';
import { PageBreadcrumb } from '@/components/PageBreadcrumb';
import { ShieldAlert, ArrowLeft, Building2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/layout/AppShell';
import { MinistrySkeleton } from '@/components/skeletons/PageSkeletons';

export default function Ministry() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [isLiderMinisterial, setIsLiderMinisterial] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const currentSection = searchParams.get('tab') || 'escalas';

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

  if (loading) {
    return (
      <AppShell>
        <MinistrySkeleton />
      </AppShell>
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
          {/* Breadcrumb */}
          <PageBreadcrumb items={[{ label: currentSection === 'escalas' ? 'Escalas' : 'Rede Ministerial' }]} />

          <div className="mb-2">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                {currentSection === 'escalas' ? 'Escalas' : 'Rede Ministerial'}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {currentSection === 'escalas' 
                ? 'Gerencie as escalas de voluntários para cultos e eventos'
                : 'Gerencie ministérios, líderes e voluntários'
              }
            </p>
          </div>

          {/* Content */}
          {currentSection === 'escalas' && <AdminSchedules />}
          {currentSection === 'rede' && <AdminMinistries />}
        </div>
      </PageTransition>
    </AppShell>
  );
}
