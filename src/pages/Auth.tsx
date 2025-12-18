import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, Loader2, Eye, EyeOff, Church } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/PageTransition";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useChurch } from "@/contexts/ChurchContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import metanoiaLogo from "@/assets/metanoia-hub-logo.png";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [selectedChurchId, setSelectedChurchId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { churches, loadChurches, setChurchId } = useChurch();

  useEffect(() => {
    loadChurches();
  }, []);

  // Auto-select first church if only one exists
  useEffect(() => {
    if (churches.length === 1 && !selectedChurchId) {
      setSelectedChurchId(churches[0].id);
    }
  }, [churches, selectedChurchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // Validate church selection for login
        if (!selectedChurchId) {
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Selecione uma igreja para continuar.",
          });
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // Verify user belongs to selected church and check password change requirement
        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('needs_password_change, church_id')
            .eq('id', data.user.id)
            .single();
          
          if (profile?.church_id && profile.church_id !== selectedChurchId) {
            await supabase.auth.signOut();
            toast({
              variant: "destructive",
              title: "Erro",
              description: "Você não pertence a esta igreja. Por favor, selecione a igreja correta.",
            });
            setIsLoading(false);
            return;
          }

          // Set the church context
          setChurchId(selectedChurchId);
          
          if (profile?.needs_password_change) {
            toast({ title: "Bem-vindo!", description: "Por favor, altere sua senha." });
            navigate("/alterar-senha");
            return;
          }
        }
        
        toast({ title: "Bem-vindo de volta!", description: "Login realizado com sucesso." });
        navigate("/dashboard");
      } else {
        // Validate church selection for signup
        if (!selectedChurchId) {
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Selecione uma igreja para continuar.",
          });
          setIsLoading(false);
          return;
        }

        // Store selected church for the context
        setChurchId(selectedChurchId);

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { 
              nome,
              church_id: selectedChurchId,
            },
          },
        });
        if (error) throw error;
        toast({ 
          title: "Conta criada!", 
          description: "Você já pode fazer login." 
        });
        setIsLogin(true);
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
              {isLogin ? "Entre na sua conta" : "Crie sua conta"}
            </p>
          </div>

          {/* Form */}
          <div className="card-elevated p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Church Selection - shown for both login and signup */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Igreja</label>
                <Select value={selectedChurchId} onValueChange={setSelectedChurchId}>
                  <SelectTrigger className="w-full h-10 bg-secondary border-border">
                    <div className="flex items-center gap-2">
                      <Church className="w-4 h-4 text-muted-foreground" />
                      <SelectValue placeholder="Selecione sua igreja" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {churches.map((church) => (
                      <SelectItem key={church.id} value={church.id}>
                        {church.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!isLogin && (
                <>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Nome</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Seu nome"
                        className="w-full h-10 pl-10 pr-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                </>
              )}

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
                  isLogin ? "Entrar" : "Criar conta"
                )}
              </Button>
            </form>

            <div className="mt-5 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="ml-1.5 text-primary hover:underline font-medium"
                >
                  {isLogin ? "Criar conta" : "Fazer login"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
