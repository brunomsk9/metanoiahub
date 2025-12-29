import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminDiscipleship } from '@/components/admin/AdminDiscipleship';
import { PageTransition } from '@/components/PageTransition';
import { PageBreadcrumb } from '@/components/PageBreadcrumb';
import { ShieldAlert, ArrowLeft, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/layout/AppShell';
import { DiscipleshipSkeleton } from '@/components/skeletons/PageSkeletons';

export default function Discipleship() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isDiscipulador, setIsDiscipulador] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

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
    const userIsDiscipulador = userRoles.includes('discipulador');
    const userIsAdmin = userRoles.includes('admin');
    
    setIsDiscipulador(userIsDiscipulador);
    setIsAdmin(userIsAdmin);
    setLoading(false);
  };

  if (loading) {
    return (
      <AppShell>
        <DiscipleshipSkeleton />
      </AppShell>
    );
  }

  if (!isDiscipulador && !isAdmin) {
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
          <PageBreadcrumb items={[{ label: 'Discipulado' }]} />

          <div>
            <div className="flex items-center gap-3 mb-2">
              <Heart className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Discipulado</h1>
            </div>
            <p className="text-muted-foreground">
              Acompanhe o progresso dos seus discípulos e gerencie relacionamentos
            </p>
          </div>

          <AdminDiscipleship />
        </div>
      </PageTransition>
    </AppShell>
  );
}
