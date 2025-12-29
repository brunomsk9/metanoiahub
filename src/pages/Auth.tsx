import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/PageTransition";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useChurch } from "@/contexts/ChurchContext";
import metanoiaLogo from "@/assets/metanoia-hub-logo.png";

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
        <div className="w-12 h-12 rounded-xl bg-primary animate-pulse" />
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
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-3">
              <img src={metanoiaLogo} alt="Metanoia Hub" className="w-16 h-16 object-contain" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Metanoia Hub</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Entre na sua conta
            </p>
          </div>

          {/* Form */}
          <div className="card-elevated p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full h-10 pl-10 pr-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 pl-10 pr-10 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Aguarde...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <div className="mt-5 text-center">
              <p className="text-xs text-muted-foreground">
                Usuários são cadastrados pelos administradores da igreja.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
