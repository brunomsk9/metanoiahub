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
  Shield,
  Play,
  Check,
  ChevronDown
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
        <div className="w-14 h-14 rounded-2xl bg-primary animate-pulse" />
      </div>
    );
  }

  const mainFeatures = [
    {
      icon: Compass,
      title: "Trilhas de Formação",
      description: "Cursos estruturados com vídeos, materiais de apoio e quizzes interativos.",
    },
    {
      icon: BookOpen,
      title: "Planos de Leitura",
      description: "De 7 dias a 1 ano. Acompanhe progresso e receba lembretes.",
    },
    {
      icon: Flame,
      title: "Hábitos Espirituais",
      description: "Registre leitura bíblica, oração e conquiste badges.",
    },
    {
      icon: LifeBuoy,
      title: "S.O.S. Discipulador",
      description: "Biblioteca de recursos com busca inteligente por tema.",
    },
    {
      icon: MessageCircle,
      title: "Mentor IA",
      description: "Assistente inteligente treinado para tirar dúvidas.",
    },
    {
      icon: Users,
      title: "Gestão de Discípulos",
      description: "Acompanhe progresso e registre encontros.",
    },
  ];

  const advancedFeatures = [
    { icon: Calendar, title: "Escalas de Voluntários" },
    { icon: ClipboardCheck, title: "Checklist Semanal" },
    { icon: Trophy, title: "Gamificação & Rankings" },
    { icon: Bell, title: "Notificações Email" },
    { icon: BarChart3, title: "Relatórios Gerenciais" },
    { icon: Shield, title: "Multi-Igreja" },
  ];

  const journeySteps = [
    { step: "01", title: "Conexão Inicial", description: "Primeiros encontros e acolhimento" },
    { step: "02", title: "Alicerce", description: "Fundamentos da fé cristã" },
    { step: "03", title: "Academia", description: "4 níveis de formação avançada" },
    { step: "04", title: "Multiplicação", description: "Forme novos discipuladores" },
  ];

  const stats = [
    { value: "500+", label: "Discípulos ativos" },
    { value: "50+", label: "Discipuladores" },
    { value: "12", label: "Trilhas disponíveis" },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background overflow-x-hidden">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 glass">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={metanoiaLogo} alt="Metanoia Hub" className="w-10 h-10 object-contain" />
              <span className="font-bold text-lg text-foreground hidden sm:block">Metanoia Hub</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="text-muted-foreground hover:text-foreground">
                Entrar
              </Button>
              <Button size="sm" onClick={() => navigate('/auth')} className="btn-glow">
                Começar
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section - Plagiados style */}
        <section className="min-h-screen relative flex items-center pt-16">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -right-1/4 top-0 w-[800px] h-[800px] opacity-10">
              <div className="w-full h-full text-[400px] font-black text-primary leading-none select-none">
                M
              </div>
            </div>
            <div className="absolute -left-20 bottom-20 w-[300px] h-[300px] rounded-full bg-primary/5 blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 w-full">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Left content */}
              <div className="space-y-8 animate-fade-in">
                <div className="hero-badge">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Plataforma de Discipulado
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[0.9] tracking-tight">
                  <span className="text-foreground">Transforme</span>
                  <br />
                  <span className="text-gradient">vidas com</span>
                  <br />
                  <span className="text-foreground">propósito.</span>
                </h1>

                <p className="text-lg sm:text-xl text-muted-foreground max-w-lg leading-relaxed">
                  A plataforma completa para discipuladores formarem vidas com o caráter de Cristo através de relacionamentos intencionais.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" onClick={() => navigate('/auth')} className="btn-glow text-base h-14 px-8">
                    Começar Agora
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => navigate('/auth')} className="text-base h-14 px-8 border-border hover:bg-secondary">
                    Já tenho conta
                  </Button>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-8 pt-6">
                  {stats.map((stat) => (
                    <div key={stat.label}>
                      <p className="text-3xl sm:text-4xl font-black text-gradient">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right visual */}
              <div className="relative hidden lg:block animate-slide-up">
                <div className="relative">
                  {/* Main card */}
                  <div className="bg-card border border-border rounded-3xl p-8 shadow-glow">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
                        <Play className="w-6 h-6 text-primary-foreground ml-1" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-lg">Seu momento chegou</p>
                        <p className="text-sm text-muted-foreground">Comece sua jornada de transformação</p>
                      </div>
                    </div>
                    
                    {/* Progress preview */}
                    <div className="space-y-4">
                      {journeySteps.slice(0, 3).map((step, index) => (
                        <div key={step.step} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                            {index === 0 ? <Check className="w-5 h-5" /> : <span className="text-sm font-bold">{step.step}</span>}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{step.title}</p>
                            <p className="text-xs text-muted-foreground">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Floating badge */}
                  <div className="absolute -right-4 top-20 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm shadow-glow animate-glow">
                    +50 XP
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-6 h-6 text-muted-foreground" />
          </div>
        </section>

        {/* Journey Section */}
        <section className="py-24 px-4 sm:px-6 section-pattern">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-primary font-semibold mb-3 uppercase tracking-wider text-sm">A Jornada</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4">
                Do novo convertido ao<br />
                <span className="text-gradient">multiplicador de vidas</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {journeySteps.map((item, index) => (
                <div 
                  key={item.step}
                  className="feature-card text-center"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/20 transition-all">
                    <span className="text-2xl font-black text-gradient">{item.step}</span>
                  </div>
                  <h3 className="font-bold text-xl text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Features */}
        <section className="py-24 px-4 sm:px-6 bg-card/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-primary font-semibold mb-3 uppercase tracking-wider text-sm">Recursos</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4">
                Tudo que você precisa<br />
                <span className="text-gradient">em um só lugar</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mainFeatures.map((feature, index) => (
                <div 
                  key={feature.title} 
                  className="feature-card"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="icon-wrapper">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Advanced Features - Compact */}
        <section className="py-24 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-primary font-semibold mb-3 uppercase tracking-wider text-sm">Avançado</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4">
                Gestão completa<br />
                <span className="text-gradient">para sua igreja</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {advancedFeatures.map((feature) => (
                <div 
                  key={feature.title}
                  className="bg-card border border-border rounded-2xl p-5 text-center hover:border-primary/40 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-accent/30 transition-colors">
                    <feature.icon className="w-6 h-6 text-accent" />
                  </div>
                  <p className="font-medium text-sm text-foreground">{feature.title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quote Section */}
        <section className="py-24 px-4 sm:px-6 section-pattern">
          <div className="max-w-4xl mx-auto text-center">
            <div className="verse-card inline-block text-left">
              <blockquote>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-serif italic text-foreground leading-relaxed mb-6">
                  "O objetivo do discipulado é aprender a ser humano da maneira que Jesus ensinou."
                </p>
                <footer className="text-primary font-semibold">— N. T. Wright</footer>
              </blockquote>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-24 px-4 sm:px-6 bg-card/50">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-primary font-semibold mb-3 uppercase tracking-wider text-sm">Sobre</p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-6">
                  Comunidade das<br />
                  <span className="text-gradient">Nações de Goiânia</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  Uma comunidade de fé comprometida com o discipulado relacional e a formação de vidas segundo o caráter de Cristo. 
                  Nosso chamado é fazer discípulos que fazem discípulos.
                </p>
                
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { icon: Heart, label: "Missão" },
                    { icon: Users, label: "Valores" },
                    { icon: Globe, label: "Visão" },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <item.icon className="w-7 h-7 text-primary" />
                      </div>
                      <p className="font-semibold text-foreground">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="verse-card">
                <blockquote>
                  <p className="text-xl sm:text-2xl font-serif italic text-foreground leading-relaxed mb-4">
                    "Portanto, vão e façam discípulos de todas as nações, batizando-os em nome do Pai, do Filho e do Espírito Santo, 
                    ensinando-os a obedecer a tudo o que eu ordenei a vocês."
                  </p>
                  <footer className="text-primary font-semibold">— Mateus 28:19-20</footer>
                </blockquote>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-24 px-4 sm:px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          
          <div className="max-w-3xl mx-auto text-center relative">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-6">
              Pronto para<br />
              <span className="text-gradient">transformar vidas?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Junte-se a dezenas de discipuladores que já estão usando o Metanoia Hub
            </p>
            <Button size="lg" onClick={() => navigate('/auth')} className="btn-glow text-lg h-16 px-12">
              Começar Agora
              <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 sm:px-6 border-t border-border">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={metanoiaLogo} alt="Metanoia Hub" className="w-10 h-10 object-contain" />
              <div>
                <span className="font-bold text-foreground">Metanoia Hub</span>
                <p className="text-xs text-muted-foreground">Plataforma de Discipulado</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Comunidade das Nações de Goiânia
            </p>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
