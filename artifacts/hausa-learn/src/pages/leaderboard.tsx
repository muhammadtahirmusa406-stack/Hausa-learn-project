import { useGetLeaderboard, useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Medal, Loader2, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function LeaderboardPage() {
  const { data: leaderboard, isLoading } = useGetLeaderboard();
  const { data: authData } = useGetCurrentAuthUser();
  const user = authData?.user;

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="bg-card border-2 border-border rounded-3xl p-12 text-center shadow-sm">
          <Medal className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h2 className="text-2xl font-display font-bold mb-2">Leaderboard Empty</h2>
          <p className="text-muted-foreground font-medium">Be the first Hausa champion! Complete a lesson to rank up.</p>
        </div>
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return "bg-yellow-400 text-yellow-950 border-yellow-500";
      case 2: return "bg-slate-300 text-slate-900 border-slate-400";
      case 3: return "bg-amber-600 text-amber-50 border-amber-700";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-12 space-y-12">
      <div className="text-center">
        <h1 className="text-3xl font-display font-bold mb-3">Leaderboard</h1>
        <p className="text-muted-foreground font-medium">Compete with other learners globally.</p>
      </div>

      {/* Podium for Top 3 */}
      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-2 sm:gap-4 h-64 pt-8">
          {/* Rank 2 */}
          {top3[1] && (
            <PodiumEntry entry={top3[1]} height="h-32" color={getRankColor(2)} isCurrentUser={top3[1].userId === user?.id} />
          )}
          {/* Rank 1 */}
          {top3[0] && (
            <PodiumEntry entry={top3[0]} height="h-44" color={getRankColor(1)} isCurrentUser={top3[0].userId === user?.id} />
          )}
          {/* Rank 3 */}
          {top3[2] && (
            <PodiumEntry entry={top3[2]} height="h-24" color={getRankColor(3)} isCurrentUser={top3[2].userId === user?.id} />
          )}
        </div>
      )}

      {/* Rest of the list */}
      {rest.length > 0 && (
        <div className="space-y-3">
          {rest.map((entry) => (
            <div 
              key={entry.userId}
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                entry.userId === user?.id 
                  ? 'bg-primary/5 border-primary shadow-sm' 
                  : 'bg-card border-border hover:border-primary/30'
              }`}
            >
              <div className="w-8 text-center font-bold text-muted-foreground">
                {entry.rank}
              </div>
              
              <Avatar className="w-12 h-12 border-2 border-border shadow-sm">
                <AvatarImage src={entry.profileImageUrl || ""} alt={entry.displayName} />
                <AvatarFallback className="bg-muted"><UserIcon className="w-5 h-5" /></AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg truncate text-foreground flex items-center gap-2">
                  {entry.displayName}
                  {entry.userId === user?.id && (
                    <span className="text-[10px] uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-md">You</span>
                  )}
                </h3>
                <p className="text-sm font-medium text-muted-foreground">Level {entry.level}</p>
              </div>
              
              <div className="text-right">
                <div className="font-display font-bold text-lg text-secondary">
                  {entry.totalXp} XP
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PodiumEntry({ entry, height, color, isCurrentUser }: { entry: any, height: string, color: string, isCurrentUser: boolean }) {
  return (
    <div className="flex flex-col items-center w-24 sm:w-28 relative">
      <div className="absolute -top-16 flex flex-col items-center">
        <Avatar className={`w-14 h-14 sm:w-16 sm:h-16 border-4 mb-2 shadow-lg ${isCurrentUser ? 'border-primary' : 'border-card'}`}>
          <AvatarImage src={entry.profileImageUrl || ""} alt={entry.displayName} />
          <AvatarFallback className="bg-muted"><UserIcon className="w-6 h-6" /></AvatarFallback>
        </Avatar>
        <div className="w-full text-center">
          <p className="font-bold text-sm truncate w-24">{entry.displayName}</p>
          <p className="text-xs font-bold text-secondary">{entry.totalXp} XP</p>
        </div>
      </div>
      <div className={`w-full rounded-t-2xl border-2 border-b-0 flex items-start justify-center pt-4 font-display font-bold text-2xl shadow-inner mt-16 ${height} ${color}`}>
        {entry.rank}
      </div>
    </div>
  )
}
