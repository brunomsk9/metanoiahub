import { memo, useMemo } from "react";
import { Trophy, Medal, Crown, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

interface LeaderboardUser {
  id: string;
  nome: string;
  xp_points: number;
  avatar_url: string | null;
}

async function fetchLeaderboardData() {
  const { data: { session } } = await supabase.auth.getSession();
  const currentUserId = session?.user?.id || null;

  const { data: topUsers } = await supabase
    .from('profiles')
    .select('id, nome, xp_points, avatar_url')
    .order('xp_points', { ascending: false })
    .limit(10);

  let currentUserRank: number | null = null;

  if (session && topUsers && !topUsers.find(u => u.id === session.user.id)) {
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('xp_points')
      .eq('id', session.user.id)
      .single();

    if (currentUser) {
      const { count: usersAbove } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gt('xp_points', currentUser.xp_points);

      currentUserRank = (usersAbove || 0) + 1;
    }
  }

  return {
    users: topUsers || [],
    currentUserId,
    currentUserRank
  };
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-amber-400" />;
    case 2:
      return <Medal className="w-5 h-5 text-gray-400" />;
    case 3:
      return <Medal className="w-5 h-5 text-amber-600" />;
    default:
      return <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-muted-foreground">{rank}</span>;
  }
};

const getRankStyle = (rank: number, isCurrentUser: boolean) => {
  let baseStyle = "flex items-center gap-3 p-3 rounded-lg transition-colors ";
  
  if (isCurrentUser) {
    baseStyle += "bg-primary/10 border border-primary/30 ";
  } else if (rank === 1) {
    baseStyle += "bg-amber-500/10 ";
  } else if (rank <= 3) {
    baseStyle += "bg-muted/50 ";
  } else {
    baseStyle += "hover:bg-muted/30 ";
  }
  
  return baseStyle;
};

const LeaderboardItem = memo(function LeaderboardItem({ 
  user, 
  rank, 
  isCurrentUser 
}: { 
  user: LeaderboardUser; 
  rank: number; 
  isCurrentUser: boolean;
}) {
  return (
    <div className={getRankStyle(rank, isCurrentUser)}>
      <div className="flex-shrink-0 w-8 flex justify-center">
        {getRankIcon(rank)}
      </div>
      
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.nome} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <User className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
          {user.nome || 'Usuário'}
          {isCurrentUser && <span className="text-xs text-muted-foreground ml-1">(você)</span>}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <span className={`text-sm font-bold ${rank === 1 ? 'text-amber-500' : 'text-primary'}`}>
          {user.xp_points.toLocaleString()}
        </span>
        <span className="text-xs text-muted-foreground">XP</span>
      </div>
    </div>
  );
});

export const Leaderboard = memo(function Leaderboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboardData,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  const { users, currentUserId, currentUserRank } = data || { users: [], currentUserId: null, currentUserRank: null };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-amber-500" />
        <h3 className="font-display font-semibold text-foreground">Ranking de XP</h3>
      </div>

      <div className="space-y-1">
        {users.map((user, index) => (
          <LeaderboardItem
            key={user.id}
            user={user}
            rank={index + 1}
            isCurrentUser={user.id === currentUserId}
          />
        ))}
      </div>

      {currentUserRank && currentUserRank > 10 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            Sua posição: <span className="font-bold text-foreground">{currentUserRank}º</span>
          </p>
        </div>
      )}
    </div>
  );
});
