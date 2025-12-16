import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, LifeBuoy, MessageCircle, Flame, Heart } from "lucide-react";
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

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-2xl mx-auto text-center">
            {/* Logo */}
            <div className="inline-flex items-center justify-center mb-6">
              <img src={metanoiaLogo} alt="Metanoia Hub" className="w-20 h-20 object-contain" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-semibold text-foreground mb-3">
              METANOIA <span className="text-primary">HUB</span>
            </h1>

            <p className="text-muted-foreground max-w-lg mx-auto mb-2">
              "Ide e fazei discípulos de todas as nações"
            </p>

            <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-8">
              Uma iniciativa da <span className="text-primary">Comunidade das Nações de Goiânia</span> para 
              equipar discipuladores na missão de formar o caráter de Cristo.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
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
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-center text-foreground mb-2">
              Recursos para sua jornada
            </h2>
            <p className="text-center text-sm text-muted-foreground mb-10 max-w-lg mx-auto">
              Ferramentas práticas para cuidar, formar e multiplicar através de relacionamentos consistentes.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
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
              ].map((feature) => (
                <div key={feature.title} className="card-elevated p-4 text-center">
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

        {/* Quote Section */}
        <section className="py-16 px-4">
          <div className="max-w-xl mx-auto text-center card-elevated p-8">
            <Heart className="w-8 h-8 text-primary mx-auto mb-4" />
            <blockquote className="text-lg text-foreground mb-3">
              "O objetivo do discipulado é aprender a ser humano da maneira que Jesus ensinou."
            </blockquote>
            <p className="text-sm text-muted-foreground mb-6">— N. T. Wright</p>
            
            <Button onClick={() => navigate('/auth')}>
              Acessar Plataforma
              <ArrowRight className="w-4 h-4" />
            </Button>
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
