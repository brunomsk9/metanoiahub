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
import { User, Edit2, Save, Loader2, Flame, Trophy, Lock, Eye, EyeOff, HelpCircle } from "lucide-react";
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

  if (isLoading) {
    return (
      <AppShell headerTitle="Perfil">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell headerTitle="Perfil" onLogout={handleLogout} userName={profile.nome}>
      <PageTransition>
        <div className="max-w-md mx-auto space-y-6">
          {/* Profile Header */}
          <header className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editedNome}
                      onChange={(e) => setEditedNome(e.target.value)}
                      className="text-base font-medium bg-muted border border-border rounded-md px-3 py-1.5 text-foreground focus:outline-none focus:border-primary"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" onClick={handleSave} disabled={isSaving} className="h-8 w-8">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-medium text-foreground">
                      {profile.nome || 'Discípulo'}
                    </h1>
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="h-6 w-6">
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <p className="text-xs text-muted-foreground">Membro desde {memberSince}</p>
              </div>
            </header>

            {/* Stats */}
            <section className="flex gap-3">
              <div className="flex-1 p-3 rounded-lg bg-muted/50 flex items-center gap-3">
                <Flame className="w-4 h-4 text-orange-500" />
                <div>
                  <p className="text-base font-medium text-foreground">{profile.current_streak}</p>
                  <p className="text-xs text-muted-foreground">Streak</p>
                </div>
              </div>
              <div className="flex-1 p-3 rounded-lg bg-muted/50 flex items-center gap-3">
                <Trophy className="w-4 h-4 text-amber-500" />
                <div>
                  <p className="text-base font-medium text-foreground">{profile.xp_points.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">XP</p>
                </div>
              </div>
            </section>

            {/* Achievements */}
            <section className="p-4 rounded-lg border border-border/50 bg-card">
              <h2 className="text-xs font-medium text-muted-foreground mb-3">Conquistas</h2>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { emoji: '🎯', label: 'Primeira Aula', unlocked: true },
                  { emoji: '🔥', label: '7 Dias', unlocked: profile.current_streak >= 7 },
                  { emoji: '📚', label: 'Trilha', unlocked: false },
                  { emoji: '⭐', label: '1000 XP', unlocked: profile.xp_points >= 1000 },
                ].map((achievement) => (
                  <div
                    key={achievement.label}
                    className={cn(
                      "aspect-square rounded-lg flex flex-col items-center justify-center transition-opacity",
                      achievement.unlocked
                        ? "bg-primary/8 border border-primary/20"
                        : "bg-muted/30 opacity-40"
                    )}
                  >
                    <span className="text-lg mb-0.5">{achievement.emoji}</span>
                    <span className="text-[9px] text-muted-foreground text-center px-1 leading-tight">{achievement.label}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Change Password Section */}
            <ChangePasswordSection />

          {/* Tutorial Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/onboarding')}
          >
            <HelpCircle className="w-4 h-4 mr-2" />
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
      
      // Handle common Supabase auth errors
      if (error.message?.includes('same_password') || error.status === 422) {
        errorMessage = "A nova senha deve ser diferente da senha atual.";
      } else if (error.message?.includes('weak_password')) {
        errorMessage = "A senha é muito fraca. Use letras, números e caracteres especiais.";
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
        className="w-full"
        onClick={() => setIsOpen(true)}
      >
        <Lock className="w-4 h-4 mr-2" />
        Alterar Senha
      </Button>
    );
  }

  return (
    <section className="p-4 rounded-lg border border-border/50 bg-card">
      <h2 className="text-xs font-medium text-muted-foreground mb-3">Alterar Senha</h2>
      <form onSubmit={handleChangePassword} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="newPassword" className="text-xs">Nova Senha</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="pr-10 h-9 text-sm"
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          {newPassword && (
            <div className="space-y-1.5 pt-1">
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
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-300", passwordStrength.color)}
                  style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                />
              </div>
              {passwordStrength.feedback.length > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  Adicione: {passwordStrength.feedback.slice(0, 3).join(", ")}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-xs">Confirmar Nova Senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Digite novamente"
            className="h-9 text-sm"
            required
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsOpen(false);
              setNewPassword('');
              setConfirmPassword('');
            }}
          >
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              "Salvar"
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}
