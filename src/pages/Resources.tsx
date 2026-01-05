import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminResources } from '@/components/admin/AdminResources';
import { PageTransition } from '@/components/PageTransition';
import { PageBreadcrumb } from '@/components/PageBreadcrumb';
import { Loader2, ShieldAlert, ArrowLeft, FolderOpen } from 'lucide-react';
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
        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center animate-pulse">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-destructive/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-destructive/10 rounded-full blur-3xl" />
        
        <div className="glass-effect rounded-2xl p-8 border border-border/50 text-center max-w-md relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground mb-6">
            Você não tem permissão para acessar esta área.
          </p>
          <Link to="/dashboard">
            <Button variant="outline" className="rounded-xl">
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
          
          {/* Header */}
          <header className="section-pattern rounded-2xl p-6 border border-border/50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-display font-bold">
                  <span className="text-gradient">Recursos</span>
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {canEdit 
                    ? 'Gerencie recursos de apoio, playbooks e materiais' 
                    : 'Acesse recursos de apoio e materiais para discipulado'}
                </p>
              </div>
            </div>
          </header>

          <AdminResources isAdmin={canEdit} />
        </div>
      </PageTransition>
    </AppShell>
  );
}
