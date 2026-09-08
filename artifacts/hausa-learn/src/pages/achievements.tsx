import { useState } from "react";
import { useGetAchievements } from "@workspace/api-client-react";
import { Trophy, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const TABS = ["All", "Unlocked", "Locked"];

export default function AchievementsPage() {
  const [activeTab, setActiveTab] = useState("All");
  const { data: achievements, isLoading } = useGetAchievements();

  const filtered = achievements?.filter(a => {
    if (activeTab === "Unlocked") return a.isUnlocked;
    if (activeTab === "Locked") return !a.isUnlocked;
    return true;
  }) || [];

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      <div className="text-center md:text-left mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold mb-3">Trophies</h1>
          <p className="text-muted-foreground font-medium">Earn badges for your milestones.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 font-bold text-primary bg-primary/10 px-4 py-2 rounded-2xl">
          <Trophy className="w-5 h-5 fill-primary/20" />
          {achievements?.filter(a => a.isUnlocked).length || 0} / {achievements?.length || 0} Unlocked
        </div>
      </div>

      <div className="flex gap-2 border-b-2 border-border/50 pb-4">
        {TABS.map(tab => (
          <Button
            key={tab}
            onClick={() => setActiveTab(tab)}
            variant={activeTab === tab ? "default" : "ghost"}
            className={`rounded-xl font-bold ${activeTab === tab ? 'shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
          >
            {tab}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border-2 border-border rounded-3xl p-12 text-center text-muted-foreground font-medium">
          No achievements found for this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((achievement) => (
            <div 
              key={achievement.id} 
              className={`bg-card border-2 rounded-3xl p-6 transition-all shadow-sm flex items-start gap-4 ${
                achievement.isUnlocked 
                  ? 'border-primary/30 hover:border-primary/60' 
                  : 'border-border/50 opacity-60 grayscale-[0.5]'
              }`}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${
                achievement.isUnlocked ? 'bg-primary/10' : 'bg-muted'
              }`}>
                {achievement.isUnlocked ? achievement.iconEmoji : <Lock className="w-6 h-6 text-muted-foreground" />}
              </div>
              
              <div className="flex-1">
                <h3 className="font-display font-bold text-lg mb-1 text-foreground leading-tight">
                  {achievement.title}
                </h3>
                <p className="text-sm font-medium text-muted-foreground mb-3 leading-snug">
                  {achievement.description}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                    achievement.isUnlocked ? 'bg-secondary/10 text-secondary' : 'bg-muted text-muted-foreground'
                  }`}>
                    +{achievement.xpReward} XP
                  </span>
                  {achievement.isUnlocked && achievement.unlockedAt && (
                    <span className="text-xs font-medium text-muted-foreground">
                      {new Date(achievement.unlockedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
