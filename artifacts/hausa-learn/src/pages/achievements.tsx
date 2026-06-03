import { useGetAchievements } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function AchievementsPage() {
  const { data: achievements, isLoading } = useGetAchievements();

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Achievements</h1>
        <p className="text-muted-foreground mt-1">Unlock badges as you master Hausa.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements?.map((achievement, index) => {
          const isUnlocked = !!achievement.unlockedAt;

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`relative overflow-hidden h-full border-2 transition-all ${isUnlocked ? 'border-primary/50 shadow-sm hover:shadow-md bg-gradient-to-br from-card to-primary/5' : 'border-border/50 bg-muted/20 opacity-80'}`}>
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 relative ${isUnlocked ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <span className="z-10">{achievement.iconEmoji || '🏆'}</span>
                    {!isUnlocked && (
                      <div className="absolute inset-0 bg-background/50 rounded-2xl backdrop-blur-[1px] flex items-center justify-center">
                        <Lock className="w-6 h-6 text-muted-foreground/80" />
                      </div>
                    )}
                    {isUnlocked && (
                      <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        transition={{ type: "spring", stiffness: 200, delay: index * 0.05 + 0.2 }}
                        className="absolute -top-1 -right-1"
                      >
                        <Sparkles className="w-5 h-5 text-secondary fill-secondary" />
                      </motion.div>
                    )}
                  </div>
                  
                  <h3 className={`font-bold font-display mb-1 ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {achievement.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 flex-1">
                    {achievement.description}
                  </p>
                  
                  <div className="flex items-center justify-between w-full mt-auto pt-4 border-t border-border/50">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                      +{achievement.xpReward} XP
                    </span>
                    {isUnlocked ? (
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                        {format(new Date(achievement.unlockedAt!), "MMM d, yyyy")}
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {(!achievements || achievements.length === 0) && (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-2xl">
            No achievements found. Start learning to unlock some!
          </div>
        )}
      </div>
    </div>
  );
}