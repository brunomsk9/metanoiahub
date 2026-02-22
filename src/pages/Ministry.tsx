import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminMinistries } from '@/components/admin/AdminMinistries';
import { AdminSchedules } from '@/components/admin/AdminSchedules';
import { ServiceChecklist } from '@/components/ServiceChecklist';
import { PageTransition } from '@/components/PageTransition';
import { PageBreadcrumb } from '@/components/PageBreadcrumb';
import { ShieldAlert, ArrowLeft, Building2, Calendar, Users2, Sparkles, ClipboardCheck } from 'lucide-react';
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
  const sectionLabels: Record<string, string> = {
    escalas: 'Escalas',
    rede: 'Rede Ministerial',
    checklist: 'Checklist do Culto',
  };

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
        <div className="space-y-6">
          {/* Breadcrumb */}
          <PageBreadcrumb items={[{ label: sectionLabels[currentSection] || 'Ministério' }]} />

          {/* Header */}
          <header className="section-pattern rounded-2xl p-5 md:p-6 border border-border/50">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                {currentSection === 'escalas' && <Calendar className="w-6 h-6 md:w-7 md:h-7 text-primary" />}
                {currentSection === 'rede' && <Users2 className="w-6 h-6 md:w-7 md:h-7 text-primary" />}
                {currentSection === 'checklist' && <ClipboardCheck className="w-6 h-6 md:w-7 md:h-7 text-primary" />}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-display font-bold">
                  <span className="text-gradient">
                    {sectionLabels[currentSection] || 'Ministério'}
                  </span>
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1 line-clamp-2">
                  {currentSection === 'escalas' && 'Gerencie as escalas de voluntários para cultos e eventos'}
                  {currentSection === 'rede' && 'Gerencie ministérios, líderes e voluntários'}
                  {currentSection === 'checklist' && 'Verifique os itens antes do culto começar'}
                </p>
              </div>
            </div>
          </header>

          {/* Content */}
          {currentSection === 'escalas' && <AdminSchedules />}
          {currentSection === 'rede' && <AdminMinistries />}
          {currentSection === 'checklist' && <ServiceChecklist />}
        </div>
      </PageTransition>
    </AppShell>
  );
}
