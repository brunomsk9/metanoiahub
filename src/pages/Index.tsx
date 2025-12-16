import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, LifeBuoy, MessageCircle, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/PageTransition";
import { supabase } from "@/integrations/supabase/client";
import metanoiaLogo from "@/assets/metanoia-hub-logo.png";

export default function Index() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
      setIsLoading(false);
    };
    checkSession();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 rounded-xl bg-primary animate-pulse" />
      </div>
    );
  }

  const features = [
    {
      icon: BookOpen,
      title: "Jornada Metanoia",
      description: "4 encontros fundamentais para firmar a fé.",
    },
    {
      icon: Flame,
      title: "Hábitos Diários",
      description: "Acompanhe sua vida devocional.",
    },
    {
      icon: LifeBuoy,
      title: "S.O.S. Discipulador",
      description: "Recursos de apoio para situações difíceis.",
    },
    {
      icon: MessageCircle,
      title: "Mentor IA",
      description: "Assistente para tirar dúvidas.",
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-12">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            {/* Logo e Título */}
            <div className="space-y-4">
              <img 
                src={metanoiaLogo} 
                alt="Metanoia Hub" 
                className="w-24 h-24 mx-auto object-contain"
              />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground tracking-tight">
                METANOIA <span className="text-primary">HUB</span>
              </h1>
            </div>

            {/* Citação destaque */}
            <blockquote className="border-l-2 border-primary pl-4 py-2 text-left max-w-xl mx-auto">
              <p className="text-lg sm:text-xl text-foreground/90 font-serif italic">
                "O objetivo do discipulado é aprender a ser humano da maneira que Jesus ensinou."
              </p>
              <footer className="text-sm text-muted-foreground mt-2">— N. T. Wright</footer>
            </blockquote>

            {/* Descrição */}
            <div className="space-y-2">
              <p className="text-muted-foreground">
                "Ide e fazei discípulos de todas as nações"
              </p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Uma iniciativa da <span className="text-primary font-medium">Comunidade das Nações de Goiânia</span> para 
                equipar discipuladores na missão de formar o caráter de Cristo.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Button size="lg" onClick={() => navigate('/auth')}>
                Entrar na Plataforma
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate('/auth')}>
                Já tenho conta
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Recursos para sua jornada
              </h2>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                Ferramentas práticas para cuidar, formar e multiplicar através de relacionamentos consistentes.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature) => (
                <div 
                  key={feature.title} 
                  className="bg-background border border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors"
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-3">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-medium text-foreground mb-1">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-6 px-4 border-t border-border">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <img src={metanoiaLogo} alt="Metanoia Hub" className="w-6 h-6 object-contain" />
              <span className="text-sm font-medium text-foreground">Metanoia Hub</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Comunidade das Nações de Goiânia
            </p>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
