import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminTracks } from '@/components/admin/AdminTracks';
import { AdminCourses } from '@/components/admin/AdminCourses';
import { AdminLessons } from '@/components/admin/AdminLessons';

import { AdminUsers } from '@/components/admin/AdminUsers';
import { AdminDiscipleship } from '@/components/admin/AdminDiscipleship';
import { AdminReadingPlanDays } from '@/components/admin/AdminReadingPlanDays';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminWeeklyChecklist } from '@/components/admin/AdminWeeklyChecklist';
import { AdminChecklistCompliance } from '@/components/admin/AdminChecklistCompliance';
import { AdminAISettings } from '@/components/admin/AdminAISettings';
import { AdminHabits } from '@/components/admin/AdminHabits';
import { AdminReports } from '@/components/admin/AdminReports';
import { PresentationPdfGenerator } from '@/components/admin/PresentationPdfGenerator';
import { AdminMinistries } from '@/components/admin/AdminMinistries';
import { AdminSchedules } from '@/components/admin/AdminSchedules';
import { PageTransition } from '@/components/PageTransition';
import { PageBreadcrumb } from '@/components/PageBreadcrumb';
import { AppShell } from '@/components/layout/AppShell';
import { Loader2, ShieldAlert, ArrowLeft, BookOpen, GraduationCap, FileText, LifeBuoy, LogOut, Users, Heart, CalendarDays, LayoutDashboard, ChevronDown, ClipboardList, BarChart3, Bot, Presentation, Sparkles, PieChart, Calendar, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type AdminSection = 'dashboard' | 'tracks' | 'courses' | 'lessons' | 'users' | 'reading-plans' | 'discipleship' | 'weekly-checklist' | 'checklist-compliance' | 'ai-settings' | 'presentation' | 'habits' | 'reports' | 'ministries' | 'schedules';

const contentSections = [
  { id: 'tracks' as const, label: 'Trilhas', icon: BookOpen },
  { id: 'courses' as const, label: 'Cursos', icon: GraduationCap },
  { id: 'lessons' as const, label: 'Aulas', icon: FileText },
  { id: 'reading-plans' as const, label: 'Planos de Leitura', icon: CalendarDays },
  { id: 'habits' as const, label: 'Hábitos Diários', icon: Sparkles },
  { id: 'weekly-checklist' as const, label: 'Checklist Semanal', icon: ClipboardList },
  { id: 'checklist-compliance' as const, label: 'Relatório Compliance', icon: BarChart3 },
  { id: 'ai-settings' as const, label: 'Configurações IA', icon: Bot },
  { id: 'presentation' as const, label: 'Apresentação', icon: Presentation },
];

export default function Admin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDiscipulador, setIsDiscipulador] = useState(false);
  const [isLiderMinisterial, setIsLiderMinisterial] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');

  useEffect(() => {
    checkAdminAccess();
  }, []);

  // Handle section from URL params
  useEffect(() => {
    const sectionParam = searchParams.get('section');
    if (sectionParam === 'escalas') {
      setActiveSection('schedules');
    }
  }, [searchParams]);

  const checkAdminAccess = async () => {
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
    const userIsAdmin = userRoles.includes('admin');
    const userIsDiscipulador = userRoles.includes('discipulador');
    const userIsLiderMinisterial = userRoles.includes('lider_ministerial');
    
    setIsAdmin(userIsAdmin);
    setIsDiscipulador(userIsDiscipulador);
    setIsLiderMinisterial(userIsLiderMinisterial);
    
    // Check URL param first, then default based on role
    const sectionParam = searchParams.get('section');
    if (sectionParam === 'escalas') {
      setActiveSection('schedules');
    } else if (userIsAdmin) {
      setActiveSection('dashboard');
    } else if (userIsLiderMinisterial) {
      setActiveSection('schedules');
    } else {
      setActiveSection('discipleship');
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
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 animate-pulse" />
      </div>
    );
  }

  if (!isAdmin && !isDiscipulador && !isLiderMinisterial) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 section-pattern">
        <div className="text-center space-y-4 glass-effect p-8 rounded-2xl max-w-md">
          <ShieldAlert className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-gradient">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta área.
          </p>
          <Link to="/dashboard">
            <Button className="mt-4 bg-gradient-to-r from-primary to-primary/80">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao app
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isContentSection = contentSections.some(s => s.id === activeSection);
  const activeContentSection = contentSections.find(s => s.id === activeSection);

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <AdminDashboard />;
      case 'tracks': return <AdminTracks />;
      case 'courses': return <AdminCourses />;
      case 'lessons': return <AdminLessons />;
      case 'users': return <AdminUsers />;
      case 'reading-plans': return <AdminReadingPlanDays />;
      case 'discipleship': return <AdminDiscipleship />;
      case 'weekly-checklist': return <AdminWeeklyChecklist />;
      case 'checklist-compliance': return <AdminChecklistCompliance />;
      case 'ai-settings': return <AdminAISettings />;
      case 'habits': return <AdminHabits />;
      case 'presentation': return <PresentationPdfGenerator />;
      case 'reports': return <AdminReports />;
      case 'ministries': return <AdminMinistries />;
      case 'schedules': return <AdminSchedules />;
      default: return null;
    }
  };

  return (
    <AppShell>
      <PageTransition>
        <div className="space-y-6 section-pattern">
          {/* Header */}
          <div>
            <PageBreadcrumb items={[{ label: 'Painel Admin' }]} />
            <h1 className="text-2xl font-bold text-gradient mt-4">
              {isAdmin ? 'Gerenciar Conteúdo' : isLiderMinisterial ? 'Escalas Ministeriais' : 'Discipulado'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isAdmin 
                ? 'Adicione e edite trilhas, cursos, lições e recursos' 
                : isLiderMinisterial 
                  ? 'Gerencie as escalas do seu ministério'
                  : 'Acompanhe o progresso dos seus discípulos'}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex flex-wrap gap-2">
          {/* Líder Ministerial Navigation */}
          {isLiderMinisterial && !isAdmin && (
            <>
              <Button
                variant={activeSection === 'ministries' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSection('ministries')}
                className="gap-2"
              >
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Rede Ministerial</span>
              </Button>

              <Button
                variant={activeSection === 'schedules' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSection('schedules')}
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Escalas</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/recursos')}
                className="gap-2"
              >
                <LifeBuoy className="h-4 w-4" />
                <span className="hidden sm:inline">Recursos</span>
              </Button>
            </>
          )}

          {isAdmin && (
            <>
              <Button
                variant={activeSection === 'dashboard' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSection('dashboard')}
                className="gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>

              {/* Content Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={isContentSection ? 'default' : 'outline'}
                    size="sm"
                    className="gap-2"
                  >
                    {activeContentSection ? (
                      <>
                        <activeContentSection.icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{activeContentSection.label}</span>
                        <span className="sm:hidden">Conteúdo</span>
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-4 w-4" />
                        <span>Conteúdo</span>
                      </>
                    )}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-popover border border-border">
                  {contentSections.map((section) => (
                    <DropdownMenuItem
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        "gap-2 cursor-pointer",
                        activeSection === section.id && "bg-primary/10 text-primary"
                      )}
                    >
                      <section.icon className="h-4 w-4" />
                      {section.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant={activeSection === 'users' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSection('users')}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Usuários</span>
              </Button>

              <Button
                variant={activeSection === 'reports' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSection('reports')}
                className="gap-2"
              >
                <PieChart className="h-4 w-4" />
                <span className="hidden sm:inline">Relatórios</span>
              </Button>

              <Button
                variant={activeSection === 'ministries' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSection('ministries')}
                className="gap-2"
              >
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Rede Ministerial</span>
              </Button>

              <Button
                variant={activeSection === 'schedules' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSection('schedules')}
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Escalas</span>
              </Button>
            </>
          )}

          {isDiscipulador && (
            <>
              <Button
                variant={activeSection === 'discipleship' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSection('discipleship')}
                className="gap-2"
              >
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Discipulado</span>
              </Button>
              
              {/* Recursos button for discipuladores who aren't admins or lider ministerial */}
              {!isAdmin && !isLiderMinisterial && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/recursos')}
                  className="gap-2"
                >
                  <LifeBuoy className="h-4 w-4" />
                  <span className="hidden sm:inline">Recursos</span>
                </Button>
              )}
            </>
          )}
        </div>

        {/* Content */}
        <div className="mt-6">
          {renderContent()}
        </div>
      </div>
    </PageTransition>
    </AppShell>
  );
}