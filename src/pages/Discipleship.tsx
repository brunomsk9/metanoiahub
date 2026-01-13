import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminDiscipleship } from '@/components/admin/AdminDiscipleship';
import { PageTransition } from '@/components/PageTransition';
import { PageBreadcrumb } from '@/components/PageBreadcrumb';
import { ShieldAlert, ArrowLeft, Heart, Plus, Sparkles, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/layout/AppShell';
import { MeetingsManager } from '@/components/MeetingsManager';
import { MeetingsHistoryLog } from '@/components/MeetingsHistoryLog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Discipleship() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isDiscipulador, setIsDiscipulador] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);

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
        <div className="flex items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center animate-pulse">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!isDiscipulador && !isAdmin) {
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
          <PageBreadcrumb items={[{ label: 'Discipulado' }]} />

          {/* Modern Header */}
          <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-card-elevated border border-border/80">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 25% 25%, hsl(var(--primary)) 1px, transparent 1px)',
                backgroundSize: '48px 48px'
              }} />
            </div>
            
            <div className="relative p-5 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 border border-primary/20 shadow-lg shadow-primary/10">
                    <Heart className="w-7 h-7 md:w-8 md:h-8 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold tracking-tight">
                      <span className="text-gradient">Discipulado</span>
                    </h1>
                    <p className="text-sm md:text-base text-muted-foreground mt-1 max-w-md">
                      {isDiscipulador && !isAdmin 
                        ? "Acompanhe o crescimento espiritual dos seus discípulos"
                        : "Gerencie relacionamentos e acompanhe o progresso da igreja"
                      }
                    </p>
                  </div>
                </div>
                
                {isDiscipulador && (
                  <Button 
                    onClick={() => setShowMeetingDialog(true)}
                    className="shrink-0 w-full sm:w-auto h-11 px-6 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                    size="lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Novo Encontro
                  </Button>
                )}
              </div>
            </div>
          </header>

          <AdminDiscipleship />

          {/* Log de Encontros Recentes - apenas para discipuladores */}
          {isDiscipulador && (
            <section className="mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Histórico de Encontros
                  </h3>
                  <p className="text-sm text-muted-foreground">Seus encontros recentes</p>
                </div>
              </div>
              <MeetingsHistoryLog maxItems={5} />
            </section>
          )}

          {/* Dialog para novo encontro */}
          <MeetingsManager 
            externalDialogOpen={showMeetingDialog}
            onExternalDialogChange={setShowMeetingDialog}
            showHeader={false}
            maxItems={0}
          />
        </div>
      </PageTransition>
    </AppShell>
  );
}
