import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, 
  Users, 
  Flame, 
  Search, 
  MessageCircle, 
  GraduationCap,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import metanoiaLogo from "@/assets/metanoia-hub-logo.png";

const onboardingSteps = [
  {
    id: "welcome",
    icon: Sparkles,
    title: "Bem-vindo ao METANOIA HUB",
    subtitle: "Sua jornada de discipulado começa aqui",
    description: "Uma plataforma completa para seu crescimento espiritual, com trilhas de aprendizado, leitura bíblica e acompanhamento personalizado.",
    color: "text-primary"
  },
  {
    id: "trilhas",
    icon: GraduationCap,
    title: "Trilhas de Aprendizado",
    subtitle: "Formação estruturada e progressiva",
    description: "Comece pelo Alicerce, nossa trilha fundamental obrigatória. Após concluí-la, desbloqueie trilhas avançadas com cursos em vídeo, textos e checklists práticos.",
    features: [
      "Trilha Alicerce obrigatória para todos",
      "Aulas em vídeo com materiais complementares",
      "Checklists de aplicação prática",
      "Progresso salvo automaticamente"
    ],
    color: "text-primary"
  },
  {
    id: "leitura",
    icon: BookOpen,
    title: "Leitura Bíblica",
    subtitle: "Planos de leitura para cada momento",
    description: "Escolha entre planos de 7 dias até planos anuais completos. Acompanhe seu progresso diário e receba lembretes personalizados.",
    features: [
      "Planos de 7 dias a 365 dias",
      "Versículo do dia com compartilhamento",
      "Progresso visual de cada plano",
      "Lembretes diários configuráveis"
    ],
    color: "text-accent"
  },
  {
    id: "habitos",
    icon: Flame,
    title: "Hábitos e Streaks",
    subtitle: "Consistência gera transformação",
    description: "Registre seus hábitos diários de leitura bíblica e oração. Mantenha sua sequência (streak) e acumule pontos de experiência (XP).",
    features: [
      "Registro de leitura bíblica diária",
      "Registro de oração diária",
      "Contador de streak (sequência)",
      "Sistema de pontos XP"
    ],
    color: "text-orange-500"
  },
  {
    id: "discipulado",
    icon: Users,
    title: "Discipulado",
    subtitle: "Caminhando juntos na fé",
    description: "Você será conectado a um discipulador que acompanhará seu progresso. Juntos, vocês percorrerão a Conexão Inicial e a Academia das Nações.",
    features: [
      "Conexão Inicial: 2 encontros fundamentais",
      "Academia das Nações: 4 níveis de formação",
      "Acompanhamento de progresso pelo mentor",
      "Marcação de Alicerce presencial"
    ],
    color: "text-blue-500"
  },
  {
    id: "sos",
    icon: Search,
    title: "S.O.S. - Suporte Rápido",
    subtitle: "Ajuda quando você precisar",
    description: "Busque rapidamente por recursos de apoio em momentos difíceis. Encontre vídeos, PDFs e orientações sobre diversos temas.",
    features: [
      "Busca inteligente por tema",
      "Recursos para luto, ansiedade, pecado",
      "PDFs e vídeos de apoio",
      "Mentor IA para dúvidas"
    ],
    color: "text-destructive"
  },
  {
    id: "mentor",
    icon: MessageCircle,
    title: "Mentor IA",
    subtitle: "Orientação disponível 24h",
    description: "Converse com nosso mentor virtual baseado em IA, treinado com os princípios do discipulado cristão para orientá-lo em sua jornada.",
    features: [
      "Disponível a qualquer momento",
      "Baseado nos Playbooks do discipulador",
      "Orientação bíblica e prática",
      "Complementa seu discipulador humano"
    ],
    color: "text-green-500"
  },
  {
    id: "start",
    icon: CheckCircle2,
    title: "Pronto para Começar!",
    subtitle: "Sua transformação começa agora",
    description: "Você está pronto para iniciar sua jornada no METANOIA HUB. Comece pela trilha Alicerce e deixe-se transformar pela Palavra.",
    color: "text-primary"
  }
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const step = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;
  const isFirstStep = currentStep === 0;

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      
      // Check if onboarding is already completed
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (profile?.onboarding_completed) {
        navigate('/dashboard');
      }
    };
    checkAuth();
  }, [navigate]);

  const completeOnboarding = async () => {
    setIsCompleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { error } = await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', session.user.id);
        
        if (error) {
          console.error('Error completing onboarding:', error);
        }
      }
      navigate("/dashboard");
    } catch (error) {
      console.error('Error completing onboarding:', error);
      navigate("/dashboard");
    }
  };

  const nextStep = () => {
    if (isLastStep) {
      completeOnboarding();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {onboardingSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep 
                  ? "bg-primary w-6" 
                  : index < currentStep 
                    ? "bg-primary/50" 
                    : "bg-muted"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="p-8 text-center">
                {/* Logo on first step */}
                {isFirstStep && (
                  <img 
                    src={metanoiaLogo} 
                    alt="METANOIA HUB" 
                    className="w-24 h-24 mx-auto mb-6 rounded-xl"
                  />
                )}

                {/* Icon */}
                {!isFirstStep && (
                  <div className={`inline-flex p-4 rounded-2xl bg-muted/50 mb-6 ${step.color}`}>
                    <step.icon className="w-12 h-12" />
                  </div>
                )}

                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">
                  {step.title}
                </h1>
                <p className={`text-lg font-medium mb-4 ${step.color}`}>
                  {step.subtitle}
                </p>

                {/* Description */}
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {step.description}
                </p>

                {/* Features list */}
                {step.features && (
                  <div className="grid gap-3 text-left max-w-sm mx-auto mb-6">
                    {step.features.map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 ${step.color}`} />
                        <span className="text-sm text-foreground/80">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="flex items-center justify-between gap-4 mt-8">
                  <Button
                    variant="ghost"
                    onClick={prevStep}
                    disabled={isFirstStep}
                    className={isFirstStep ? "invisible" : ""}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Anterior
                  </Button>

                  <Button onClick={nextStep} className="min-w-32" disabled={isCompleting}>
                    {isLastStep ? (
                      <>
                        {isCompleting ? "Salvando..." : "Começar"}
                        <Sparkles className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Próximo
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                {/* Skip button */}
                {!isLastStep && (
                  <Button
                    variant="link"
                    onClick={skipOnboarding}
                    disabled={isCompleting}
                    className="mt-4 text-muted-foreground"
                  >
                    {isCompleting ? "Salvando..." : "Pular tutorial"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Step counter */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          {currentStep + 1} de {onboardingSteps.length}
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
