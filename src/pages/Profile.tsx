import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { MentorChatButton } from "@/components/MentorChat";
import { PageTransition } from "@/components/PageTransition";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { User, Edit2, Save, Loader2, Flame, Trophy } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onLogout={handleLogout} userName={profile.nome} />
      
      <PageTransition>
        <main className="pt-14 lg:pt-16 pb-8">
          <div className="px-4 lg:px-6 max-w-md mx-auto space-y-6">
            
            {/* Profile Header */}
            <header className="pt-6 flex items-center gap-4">
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
          </div>
        </main>
      </PageTransition>

      <MentorChatButton />
    </div>
  );
}
