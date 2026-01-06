import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Loader2, Eye, EyeOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/PageTransition";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useChurch } from "@/contexts/ChurchContext";
import { MetanoiaLogo } from "@/components/MetanoiaLogo";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const churchContext = useChurch();
  const setChurchId = churchContext?.setChurchId;

  // Check if already logged in - redirect immediately
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard', { replace: true });
      } else {
        setIsCheckingSession(false);
      }
    });
  }, [navigate]);

  // Show loading while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center animate-pulse">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      if (data.user) {
        // Fetch user profile to get their church_id and check onboarding status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('needs_password_change, church_id, onboarding_completed')
          .eq('id', data.user.id)
          .maybeSingle();
        
        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }
        
        // Check if user is super_admin
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id);
        
        const isSuperAdmin = roles?.some(r => r.role === 'super_admin');
        
        // Set church context from user's profile (not from selection)
        if (profile?.church_id && setChurchId) {
          setChurchId(profile.church_id);
        } else if (!isSuperAdmin) {
          // Regular user without church - shouldn't happen but handle it
          await supabase.auth.signOut();
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Sua conta não está vinculada a nenhuma igreja. Entre em contato com o administrador.",
          });
          setIsLoading(false);
          return;
        }

        toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." });
        
        // Check if user needs to change password first
        if (profile?.needs_password_change) {
          navigate("/alterar-senha");
          return;
        }
        
        // Check if user needs onboarding
        if (!profile?.onboarding_completed) {
          navigate("/onboarding");
          return;
        }
        
        // Otherwise go to dashboard
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message === "Invalid login credentials" 
          ? "Email ou senha incorretos" 
          : error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 section-pattern">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>
        
        <div className="w-full max-w-md relative z-10 px-4">
          {/* Logo Section */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-xl scale-150" />
                <MetanoiaLogo size="lg" className="relative w-24 h-24 drop-shadow-2xl" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">
              <span className="text-gradient">Metanoia</span>{" "}
              <span className="text-foreground">Hub</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Transformando vidas através do discipulado
            </p>
          </div>

          {/* Form Card */}
          <div className="glass-effect rounded-2xl p-8 border border-border/50">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-foreground">Bem-vindo de volta</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Entre na sua conta para continuar
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/5 rounded-xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="relative w-full h-12 pl-12 pr-4 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-secondary transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Senha</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/5 rounded-xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="relative w-full h-12 pl-12 pr-12 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-secondary transition-all"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Entrar
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border/50">
              <p className="text-xs text-center text-muted-foreground">
                Usuários são cadastrados pelos administradores da igreja.
                <br />
                <span className="text-primary/80">Entre em contato com seu líder para obter acesso.</span>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-8">
            © 2025 Metanoia Hub. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
