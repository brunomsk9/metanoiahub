import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { MentorChatButton } from "@/components/MentorChat";
import { StreakDisplay, HealthRadial } from "@/components/StreakDisplay";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { User, Mail, Trophy, Calendar, Edit2, Save, Loader2 } from "lucide-react";
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

      const { data, error } = await supabase
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
        title: "Perfil atualizado!",
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Sidebar onLogout={handleLogout} userName={profile.nome} />
      
      <main className="pt-14 lg:pt-16">
        <div className="p-4 lg:p-8 space-y-6 max-w-4xl mx-auto">
          {/* Profile Header */}
          <section className="card-premium p-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
                <User className="w-12 h-12 text-primary-foreground" />
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editedNome}
                      onChange={(e) => setEditedNome(e.target.value)}
                      className="text-2xl font-display font-bold bg-secondary border border-border rounded-lg px-3 py-1 text-foreground focus:outline-none focus:border-primary"
                      autoFocus
                    />
                    <Button size="icon" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <h1 className="text-2xl font-display font-bold text-foreground">
                      {profile.nome || 'Discípulo'}
                    </h1>
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-2 justify-center sm:justify-start text-muted-foreground mt-1">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{profile.email}</span>
                </div>
                <div className="flex items-center gap-2 justify-center sm:justify-start text-muted-foreground mt-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Membro desde {memberSince}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <StreakDisplay streak={profile.current_streak} />
            
            <div className="card-premium p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-accent flex items-center justify-center">
                <Trophy className="w-7 h-7 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-foreground">
                  {profile.xp_points.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Pontos XP</p>
              </div>
            </div>

            <div className="card-premium p-4 flex items-center justify-center">
              <HealthRadial percentage={75} label="Saúde Espiritual" />
            </div>
          </section>

          {/* Achievements */}
          <section className="card-premium p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <h2 className="text-lg font-display font-semibold text-foreground mb-4">
              Conquistas
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { emoji: '🎯', label: 'Primeira Aula', unlocked: true },
                { emoji: '🔥', label: '7 Dias de Streak', unlocked: profile.current_streak >= 7 },
                { emoji: '📚', label: 'Trilha Completa', unlocked: false },
                { emoji: '⭐', label: '1000 XP', unlocked: profile.xp_points >= 1000 },
              ].map((achievement) => (
                <div
                  key={achievement.label}
                  className={cn(
                    "p-4 rounded-xl text-center transition-all",
                    achievement.unlocked
                      ? "bg-gradient-primary shadow-glow"
                      : "bg-muted opacity-50"
                  )}
                >
                  <span className="text-3xl mb-2 block">{achievement.emoji}</span>
                  <span className={cn(
                    "text-xs font-medium",
                    achievement.unlocked ? "text-primary-foreground" : "text-muted-foreground"
                  )}>
                    {achievement.label}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <MentorChatButton />
    </div>
  );
}