import { useGetLeaderboard } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Flame, Medal, UserIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function LeaderboardPage() {
  const { data: leaderboard, isLoading } = useGetLeaderboard();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded-xl" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const topThree = leaderboard?.slice(0, 3) || [];
  const rest = leaderboard?.slice(3) || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Leaderboard</h1>
        <p className="text-muted-foreground mt-1">Compete with other learners globally.</p>
      </div>

      {(!leaderboard || leaderboard.length === 0) ? (
        <Card className="border-2 border-dashed border-border shadow-none bg-transparent">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Medal className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold font-display mb-2">No one is on the board yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Complete lessons to earn XP and be the first one on the leaderboard!
            </p>
            <Link href="/learn">
              <Button>Start Learning</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Top 3 Podium */}
          {topThree.length > 0 && (
            <div className="flex flex-col md:flex-row items-end justify-center gap-4 mb-12 pt-8">
              {/* Silver - 2nd */}
              {topThree[1] && (
                <PodiumCard rank={2} entry={topThree[1]} isCurrentUser={user?.id === topThree[1].userId} />
              )}
              {/* Gold - 1st */}
              {topThree[0] && (
                <PodiumCard rank={1} entry={topThree[0]} isCurrentUser={user?.id === topThree[0].userId} />
              )}
              {/* Bronze - 3rd */}
              {topThree[2] && (
                <PodiumCard rank={3} entry={topThree[2]} isCurrentUser={user?.id === topThree[2].userId} />
              )}
            </div>
          )}

          {/* Rest of the list */}
          <div className="space-y-3">
            {rest.map((entry, index) => {
              const isCurrentUser = user?.id === entry.userId;
              return (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`border-2 overflow-hidden transition-colors ${isCurrentUser ? 'border-primary bg-primary/5' : 'border-border/50 hover:bg-muted/50'}`}>
                    <div className="p-4 flex items-center gap-4">
                      <div className="w-8 text-center font-bold text-muted-foreground">
                        {entry.rank}
                      </div>
                      
                      <Avatar className="w-12 h-12 border-2 border-border">
                        <AvatarImage src={entry.profileImageUrl || ""} alt={entry.displayName} />
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          {entry.displayName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base truncate">
                            {entry.displayName}
                          </h4>
                          {isCurrentUser && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-3">
                          <span className="flex items-center gap-1"><Medal className="w-3 h-3" /> Lvl {entry.level}</span>
                          <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-secondary" /> {entry.streak}</span>
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <div className="font-display font-bold text-lg text-primary">{entry.totalXp}</div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">XP</div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function PodiumCard({ rank, entry, isCurrentUser }: { rank: number, entry: any, isCurrentUser: boolean }) {
  const colors = {
    1: "from-[#FFD700]/20 to-[#FFD700]/5 border-[#FFD700] text-[#D4AF37]",
    2: "from-[#C0C0C0]/20 to-[#C0C0C0]/5 border-[#C0C0C0] text-[#A0A0A0]",
    3: "from-[#CD7F32]/20 to-[#CD7F32]/5 border-[#CD7F32] text-[#B87333]"
  };
  
  const heights = {
    1: "h-56 md:h-64",
    2: "h-48 md:h-56",
    3: "h-44 md:h-48"
  };

  const colorClass = colors[rank as keyof typeof colors];
  const heightClass = heights[rank as keyof typeof heights];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, delay: rank * 0.1 }}
      className={`relative flex-1 max-w-[200px] flex flex-col items-center justify-end ${rank === 1 ? 'z-10' : 'z-0'}`}
    >
      <div className="relative mb-4">
        <Avatar className={`w-20 h-20 md:w-24 md:h-24 border-4 bg-background shadow-lg ${rank === 1 ? 'border-[#FFD700]' : rank === 2 ? 'border-[#C0C0C0]' : 'border-[#CD7F32]'}`}>
          <AvatarImage src={entry.profileImageUrl || ""} alt={entry.displayName} />
          <AvatarFallback className="bg-muted text-muted-foreground text-xl">
            {entry.displayName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-md border-2 border-background ${rank === 1 ? 'bg-[#FFD700]' : rank === 2 ? 'bg-[#C0C0C0]' : 'bg-[#CD7F32]'}`}>
          {rank}
        </div>
      </div>
      
      <Card className={`w-full overflow-hidden border-2 bg-gradient-to-b ${colorClass} ${heightClass} ${isCurrentUser ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
        <CardContent className="p-4 flex flex-col items-center text-center h-full">
          <h4 className="font-bold font-display text-foreground line-clamp-1 w-full mb-1">{entry.displayName}</h4>
          {isCurrentUser && <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full mb-2">You</span>}
          
          <div className="mt-auto w-full">
            <div className="font-display font-bold text-xl md:text-2xl">{entry.totalXp}</div>
            <div className="text-xs font-medium uppercase tracking-wider opacity-80">XP</div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}