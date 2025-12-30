import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminResources } from '@/components/admin/AdminResources';
import { PageTransition } from '@/components/PageTransition';
import { PageBreadcrumb } from '@/components/PageBreadcrumb';
import { Loader2, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/layout/AppShell';

export default function Resources() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

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
    
    // Check who can access resources
    const isAdmin = userRoles.includes('admin');
    const isDiscipulador = userRoles.includes('discipulador');
    const isLiderMinisterial = userRoles.includes('lider_ministerial');
    
    // All these roles can access resources page
    const access = isAdmin || isDiscipulador || isLiderMinisterial;
    
    // Only admin and lider_ministerial can edit resources
    const edit = isAdmin || isLiderMinisterial;
    
    setHasAccess(access);
    setCanEdit(edit);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
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
        <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
          <PageBreadcrumb items={[{ label: 'Recursos' }]} />
          
          <div>
            <h1 className="text-2xl font-bold text-foreground">Recursos</h1>
            <p className="text-muted-foreground mt-1">
              {canEdit 
                ? 'Gerencie recursos de apoio, playbooks e materiais' 
                : 'Acesse recursos de apoio e materiais para discipulado'}
            </p>
          </div>

          <AdminResources isAdmin={canEdit} />
        </div>
      </PageTransition>
    </AppShell>
  );
}
