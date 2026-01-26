import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout";
import { MentorChatButton } from "@/components/MentorChat";
import { PageTransition } from "@/components/PageTransition";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { User, Edit2, Save, Loader2, Flame, Trophy, Lock, Eye, EyeOff, HelpCircle, Sparkles, Calendar, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    nome: '',
    email: '',
    xp_points: 0,
    current_streak: 0,
    created_at: '',
  });
  const [editedNome, setEditedNome] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (data) {
        setProfile({
          nome: data.nome || '',
          email: session.user.email || '',
          xp_points: data.xp_points || 0,
          current_streak: data.current_streak || 0,
          created_at: data.created_at,
        });
        setEditedNome(data.nome || '');
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from('profiles')
      .update({ nome: editedNome })
      .eq('id', session.user.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar as alterações.",
      });
    } else {
      setProfile(prev => ({ ...prev, nome: editedNome }));
      setIsEditing(false);
      toast({
        title: "Perfil atualizado",
        description: "Suas alterações foram salvas.",
      });
    }
    setIsSaving(false);
  };

  const memberSince = profile.created_at 
    ? new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : '';

  // Calculate level from XP (every 500 XP = 1 level)
  const level = Math.floor(profile.xp_points / 500) + 1;
  const xpInCurrentLevel = profile.xp_points % 500;
  const xpProgress = (xpInCurrentLevel / 500) * 100;

  if (isLoading) {
    return (
      <AppShell headerTitle="Perfil">
        <div className="flex items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center animate-pulse">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell headerTitle="Perfil" onLogout={handleLogout} userName={profile.nome}>
      <PageTransition>
        <div className="max-w-lg mx-auto space-y-6">
          {/* Profile Header Card */}
          <div className="glass-effect rounded-2xl p-6 border border-border/50 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            
            <div className="relative flex items-start gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                  {level}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editedNome}
                      onChange={(e) => setEditedNome(e.target.value)}
                      className="text-lg font-semibold bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary w-full"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" onClick={handleSave} disabled={isSaving} className="h-10 w-10 rounded-xl">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-foreground truncate">
                      {profile.nome || 'Discípulo'}
                    </h1>
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="h-8 w-8 rounded-lg hover:bg-primary/10">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>Membro desde {memberSince}</span>
                </div>
              </div>
            </div>

            {/* Level Progress */}
            <div className="mt-5 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Nível {level}</span>
                <span className="text-xs text-muted-foreground">{xpInCurrentLevel}/500 XP</span>
              </div>
              <Progress value={xpProgress} className="h-2" />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-effect rounded-2xl p-5 border border-border/50 hover:border-orange-500/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{profile.current_streak}</p>
                  <p className="text-xs text-muted-foreground">Dias de Streak</p>
                </div>
              </div>
            </div>
            
            <div className="glass-effect rounded-2xl p-5 border border-border/50 hover:border-amber-500/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{profile.xp_points.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Pontos XP</p>
                </div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="glass-effect rounded-2xl p-5 border border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Conquistas</h2>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { emoji: '🎯', label: 'Primeira Aula', unlocked: true },
                { emoji: '🔥', label: '7 Dias', unlocked: profile.current_streak >= 7 },
                { emoji: '📚', label: 'Trilha', unlocked: false },
                { emoji: '⭐', label: '1000 XP', unlocked: profile.xp_points >= 1000 },
              ].map((achievement) => (
                <div
                  key={achievement.label}
                  className={cn(
                    "aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-300",
                    achievement.unlocked
                      ? "bg-primary/10 border border-primary/30 hover:scale-105"
                      : "bg-secondary/30 opacity-40"
                  )}
                >
                  <span className="text-2xl mb-1">{achievement.emoji}</span>
                  <span className="text-[10px] text-muted-foreground text-center px-1 leading-tight">{achievement.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Change Password Section */}
          <ChangePasswordSection />

          {/* Tutorial Button */}
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl border-border/50 hover:border-primary/50 hover:bg-primary/5"
            onClick={() => navigate('/onboarding')}
          >
            <HelpCircle className="w-5 h-5 mr-2" />
            Ver Tutorial
          </Button>
        </div>
      </PageTransition>

      <MentorChatButton />
    </AppShell>
  );
}

function getPasswordStrength(password: string): { score: number; label: string; color: string; feedback: string[] } {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 6) score += 1;
  else feedback.push("Mínimo 6 caracteres");

  if (password.length >= 8) score += 1;

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push("Letra minúscula");

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push("Letra maiúscula");

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push("Número");

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push("Caractere especial");

  let label = "Muito fraca";
  let color = "bg-destructive";

  if (score >= 6) {
    label = "Muito forte";
    color = "bg-green-500";
  } else if (score >= 5) {
    label = "Forte";
    color = "bg-green-400";
  } else if (score >= 4) {
    label = "Boa";
    color = "bg-yellow-500";
  } else if (score >= 3) {
    label = "Razoável";
    color = "bg-orange-500";
  } else if (score >= 2) {
    label = "Fraca";
    color = "bg-orange-400";
  }

  return { score, label, color, feedback };
}

function ChangePasswordSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const passwordStrength = getPasswordStrength(newPassword);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A nova senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "Por favor, verifique se as senhas são iguais.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso!"
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsOpen(false);
    } catch (error: any) {
      let errorMessage = error.message;
      
      // Handle specific error codes from Supabase
      if (error.code === 'same_password') {
        errorMessage = "A nova senha deve ser diferente da senha atual.";
      } else if (error.code === 'weak_password' || error.message?.includes('weak')) {
        // Check if password is in pwned database
        if (error.message?.includes('pwned') || error.message?.includes('known to be weak')) {
          errorMessage = "Esta senha foi encontrada em vazamentos de dados. Por segurança, escolha uma senha diferente e mais complexa.";
        } else {
          errorMessage = "A senha é muito fraca. Use letras maiúsculas, minúsculas, números e caracteres especiais.";
        }
      }
      
      toast({
        title: "Erro ao alterar senha",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        className="w-full h-12 rounded-xl border-border/50 hover:border-primary/50 hover:bg-primary/5"
        onClick={() => setIsOpen(true)}
      >
        <Lock className="w-5 h-5 mr-2" />
        Alterar Senha
      </Button>
    );
  }

  return (
    <div className="glass-effect rounded-2xl p-5 border border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-foreground">Alterar Senha</h2>
      </div>
      
      <form onSubmit={handleChangePassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="newPassword" className="text-sm">Nova Senha</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="pr-10 h-11 rounded-xl bg-secondary/50 border-border/50 focus:border-primary"
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          {newPassword && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Força da senha:</span>
                <span className={cn(
                  "text-xs font-medium",
                  passwordStrength.score >= 5 ? "text-green-500" : 
                  passwordStrength.score >= 4 ? "text-yellow-500" : 
                  passwordStrength.score >= 3 ? "text-orange-500" : "text-destructive"
                )}>
                  {passwordStrength.label}
                </span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-300", passwordStrength.color)}
                  style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                />
              </div>
              {passwordStrength.feedback.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Adicione: {passwordStrength.feedback.slice(0, 3).join(", ")}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm">Confirmar Nova Senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Digite novamente"
            className="h-11 rounded-xl bg-secondary/50 border-border/50 focus:border-primary"
            required
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            className="flex-1 h-11 rounded-xl"
            onClick={() => {
              setIsOpen(false);
              setNewPassword('');
              setConfirmPassword('');
            }}
          >
            Cancelar
          </Button>
          <Button type="submit" className="flex-1 h-11 rounded-xl" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Salvar"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
