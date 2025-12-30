import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowRight, 
  BookOpen, 
  LifeBuoy, 
  MessageCircle, 
  Flame,
  Users,
  Compass,
  Heart,
  Globe,
  Calendar,
  Trophy,
  ClipboardCheck,
  Bell,
  BarChart3,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/PageTransition";
import { supabase } from "@/integrations/supabase/client";
import metanoiaLogo from "@/assets/metanoia-hub-logo.png";

export default function Index() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard', { replace: true });
      } else {
        setIsChecking(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/dashboard', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 rounded-xl bg-primary animate-pulse" />
      </div>
    );
  }

  const mainFeatures = [
    {
      icon: Compass,
      title: "Trilhas de Formação",
      description: "Cursos estruturados com vídeos, materiais de apoio e quizzes interativos para cada etapa do discipulado.",
    },
    {
      icon: BookOpen,
      title: "Planos de Leitura Bíblica",
      description: "De 7 dias a 1 ano completo. Acompanhe seu progresso e receba lembretes diários.",
    },
    {
      icon: Flame,
      title: "Hábitos Espirituais",
      description: "Registre leitura bíblica, oração e devocionais. Mantenha sua sequência e conquiste badges.",
    },
    {
      icon: LifeBuoy,
      title: "S.O.S. Discipulador",
      description: "Biblioteca de recursos para situações desafiadoras com busca inteligente por tema.",
    },
    {
      icon: MessageCircle,
      title: "Mentor IA",
      description: "Assistente inteligente treinado com os recursos da plataforma para tirar dúvidas.",
    },
    {
      icon: Users,
      title: "Gestão de Discípulos",
      description: "Acompanhe progresso, registre encontros e veja o histórico de cada discípulo.",
    },
  ];

  const advancedFeatures = [
    {
      icon: Calendar,
      title: "Escalas de Voluntários",
      description: "Sistema completo para gestão de escalas ministeriais com confirmação automática.",
    },
    {
      icon: ClipboardCheck,
      title: "Checklist Semanal",
      description: "Discipuladores registram atividades semanais: oração, mensagens e encontros.",
    },
    {
      icon: Trophy,
      title: "Gamificação & Rankings",
      description: "Ganhe XP ao completar aulas, conquiste badges e apareça no ranking.",
    },
    {
      icon: Bell,
      title: "Notificações por Email",
      description: "Alertas automáticos para escalas, lembretes de leitura e boas-vindas.",
    },
    {
      icon: BarChart3,
      title: "Relatórios Gerenciais",
      description: "Dashboards com métricas de engajamento, compliance e performance.",
    },
    {
      icon: Shield,
      title: "Multi-Igreja",
      description: "Isolamento completo de dados entre igrejas com controle de acesso por papel.",
    },
  ];

  const journeySteps = [
    { step: "1", title: "Conexão Inicial", description: "Primeiros encontros" },
    { step: "2", title: "Alicerce", description: "Fundamentos da fé cristã" },
    { step: "3", title: "Academia", description: "4 níveis de formação" },
    { step: "4", title: "Multiplicação", description: "Forme novos discipuladores" },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={metanoiaLogo} alt="Metanoia Hub" className="w-8 h-8 object-contain" />
              <span className="font-semibold text-foreground">Metanoia Hub</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
              Entrar
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 pt-14">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-primary font-medium">Plataforma Completa de Discipulado</span>
            </div>

            <div className="space-y-4">
              <img 
                src={metanoiaLogo} 
                alt="Metanoia Hub" 
                className="w-28 h-28 mx-auto object-contain"
              />
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight">
                METANOIA <span className="text-primary">HUB</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Plataforma completa para discipuladores formarem vidas com o caráter de Cristo
              </p>
            </div>

            <blockquote className="border-l-4 border-primary pl-6 py-3 text-left max-w-2xl mx-auto bg-primary/5 rounded-r-lg">
              <p className="text-xl sm:text-2xl text-foreground/90 font-serif italic leading-relaxed">
                "O objetivo do discipulado é aprender a ser humano da maneira que Jesus ensinou."
              </p>
              <footer className="text-sm text-muted-foreground mt-3 font-medium">— N. T. Wright</footer>
            </blockquote>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button size="lg" className="text-base px-8 py-6" onClick={() => navigate('/auth')}>
                Começar Agora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button variant="outline" size="lg" className="text-base px-8 py-6" onClick={() => navigate('/auth')}>
                Já tenho conta
              </Button>
            </div>

            <p className="text-sm text-muted-foreground pt-4">
              Uma iniciativa da <span className="text-primary font-semibold">Comunidade das Nações de Goiânia</span>
            </p>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1">
              <div className="w-1.5 h-3 rounded-full bg-muted-foreground/50" />
            </div>
          </div>
        </section>

        {/* Jornada Section */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                A Jornada do Discípulo
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Um caminho estruturado para crescer e multiplicar discípulos
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {journeySteps.map((item, index) => (
                <div 
                  key={item.step}
                  className="relative bg-background border border-border rounded-xl p-6 text-center group hover:border-primary/50 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <span className="text-xl font-bold text-primary">{item.step}</span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  
                  {index < journeySteps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2">
                      <ArrowRight className="w-4 h-4 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Features Section */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                Recursos Principais
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Ferramentas essenciais para cuidar, formar e multiplicar discípulos
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mainFeatures.map((feature) => (
                <div 
                  key={feature.title} 
                  className="bg-background border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Advanced Features Section */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                Recursos Avançados
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Funcionalidades para gestão completa da sua igreja
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {advancedFeatures.map((feature) => (
                <div 
                  key={feature.title} 
                  className="bg-background border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-lg bg-accent/50 flex items-center justify-center mb-4 group-hover:bg-accent transition-colors">
                    <feature.icon className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sobre a Comunidade */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Globe className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                Comunidade das Nações de Goiânia
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Uma comunidade de fé comprometida com o discipulado relacional e a formação de vidas segundo o caráter de Cristo
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-background border border-border rounded-xl p-6 text-center">
                <Heart className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Nossa Missão</h3>
                <p className="text-sm text-muted-foreground">
                  Fazer discípulos que fazem discípulos, formando o caráter de Cristo através de relacionamentos intencionais
                </p>
              </div>
              
              <div className="bg-background border border-border rounded-xl p-6 text-center">
                <Users className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Nossos Valores</h3>
                <p className="text-sm text-muted-foreground">
                  Comunhão autêntica, discipulado relacional, vida em células e multiplicação de líderes servos
                </p>
              </div>
              
              <div className="bg-background border border-border rounded-xl p-6 text-center">
                <Compass className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Nossa Visão</h3>
                <p className="text-sm text-muted-foreground">
                  Alcançar todas as nações através de comunidades de fé saudáveis que transformam vidas e cidades
                </p>
              </div>
            </div>

            <blockquote className="mt-12 border-l-4 border-primary pl-6 py-4 text-left max-w-2xl mx-auto bg-primary/5 rounded-r-lg">
              <p className="text-lg sm:text-xl text-foreground/90 font-serif italic leading-relaxed">
                "Portanto, vão e façam discípulos de todas as nações, batizando-os em nome do Pai, do Filho e do Espírito Santo, ensinando-os a obedecer a tudo o que eu ordenei a vocês."
              </p>
              <footer className="text-sm text-muted-foreground mt-3 font-medium">— Mateus 28:19-20</footer>
            </blockquote>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 px-4 bg-primary/5">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Pronto para transformar o discipulado na sua igreja?
            </h2>
            <p className="text-muted-foreground">
              Junte-se a dezenas de discipuladores que já estão usando o Metanoia Hub
            </p>
            <Button size="lg" className="text-base px-8 py-6" onClick={() => navigate('/auth')}>
              Começar Agora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-border">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={metanoiaLogo} alt="Metanoia Hub" className="w-8 h-8 object-contain" />
              <div>
                <span className="font-semibold text-foreground">Metanoia Hub</span>
                <p className="text-xs text-muted-foreground">Plataforma de Discipulado</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Comunidade das Nações de Goiânia
            </p>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
