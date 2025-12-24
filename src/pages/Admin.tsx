import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminTracks } from '@/components/admin/AdminTracks';
import { AdminCourses } from '@/components/admin/AdminCourses';
import { AdminLessons } from '@/components/admin/AdminLessons';
import { AdminResources } from '@/components/admin/AdminResources';
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
import { Loader2, ShieldAlert, ArrowLeft, BookOpen, GraduationCap, FileText, LifeBuoy, LogOut, Users, Heart, CalendarDays, LayoutDashboard, ChevronDown, ClipboardList, BarChart3, Bot, Presentation, Sparkles, PieChart, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import metanoiaLogo from "@/assets/metanoia-hub-logo.png";
import { Building2 } from 'lucide-react';

type AdminSection = 'dashboard' | 'tracks' | 'courses' | 'lessons' | 'resources' | 'users' | 'reading-plans' | 'discipleship' | 'weekly-checklist' | 'checklist-compliance' | 'ai-settings' | 'presentation' | 'habits' | 'reports' | 'ministries' | 'schedules';

const contentSections = [
  { id: 'tracks' as const, label: 'Trilhas', icon: BookOpen },
  { id: 'courses' as const, label: 'Cursos', icon: GraduationCap },
  { id: 'lessons' as const, label: 'Aulas', icon: FileText },
  { id: 'resources' as const, label: 'Recursos', icon: LifeBuoy },
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
    if (sectionParam === 'recursos') {
      setActiveSection('resources');
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
    if (sectionParam === 'recursos') {
      setActiveSection('resources');
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin && !isDiscipulador && !isLiderMinisterial) {
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

  const isContentSection = contentSections.some(s => s.id === activeSection);
  const activeContentSection = contentSections.find(s => s.id === activeSection);

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <AdminDashboard />;
      case 'tracks': return <AdminTracks />;
      case 'courses': return <AdminCourses />;
      case 'lessons': return <AdminLessons />;
      case 'resources': return <AdminResources isAdmin={isAdmin} />;
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
    <PageTransition>
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
          <h1 className="text-2xl font-bold text-foreground">
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
        <div className="flex flex-wrap gap-2 mb-6">
          {/* Líder Ministerial Navigation */}
          {isLiderMinisterial && !isAdmin && (
            <Button
              variant={activeSection === 'schedules' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveSection('schedules')}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Escalas</span>
            </Button>
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
              
              {/* Recursos button for discipuladores who aren't admins */}
              {!isAdmin && (
                <Button
                  variant={activeSection === 'resources' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveSection('resources')}
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
      </main>
    </div>
    </PageTransition>
  );
}