import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, ArrowRight, BookOpen, LifeBuoy, MessageCircle, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

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
        <div className="w-16 h-16 rounded-2xl bg-gradient-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center p-4">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-primary shadow-glow mb-8 animate-scale-in">
            <GraduationCap className="w-10 h-10 text-primary-foreground" />
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-foreground mb-4 animate-fade-in">
            Universidade do{" "}
            <span className="text-gradient-primary">Discipulador</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
            Transforme sua jornada de discipulado com conteúdo premium, 
            mentoria inteligente e ferramentas práticas para crescimento espiritual.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <Button 
              variant="hero" 
              size="xl"
              onClick={() => navigate('/auth')}
            >
              Começar Agora
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/auth')}
            >
              Já tenho conta
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-center text-foreground mb-12">
            Tudo que você precisa para discipular
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: BookOpen,
                title: "Trilhas de Conteúdo",
                description: "Cursos estruturados em vídeo e texto com aplicações práticas.",
                color: "bg-primary/20",
              },
              {
                icon: Flame,
                title: "Sistema de Streak",
                description: "Mantenha a consistência com hábitos diários rastreados.",
                color: "bg-gradient-streak",
              },
              {
                icon: LifeBuoy,
                title: "S.O.S. Discipulador",
                description: "Recursos de apoio para situações específicas do discipulado.",
                color: "bg-accent/20",
              },
              {
                icon: MessageCircle,
                title: "Mentor IA",
                description: "Assistente inteligente disponível 24/7 para suas dúvidas.",
                color: "bg-success/20",
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="card-premium p-6 text-center animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${feature.color} mb-4`}>
                  <feature.icon className="w-7 h-7 text-foreground" />
                </div>
                <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center card-premium p-8 lg:p-12">
          <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground mb-4">
            Pronto para transformar seu discipulado?
          </h2>
          <p className="text-muted-foreground mb-8">
            Junte-se a milhares de discipuladores que estão usando nossa plataforma 
            para crescer e ajudar outros a crescer.
          </p>
          <Button 
            variant="premium" 
            size="xl"
            onClick={() => navigate('/auth')}
          >
            Criar Conta Gratuita
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="font-display font-semibold text-foreground">
              Universidade do Discipulador
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  );
}
