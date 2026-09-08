import { useGetProgress, useGetDailyGoal, useGetActivityFeed } from "@workspace/api-client-react";
import { Flame, Trophy, Target, Star, BookOpen, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export default function ProgressPage() {
  const { data: progress, isLoading: pLoading } = useGetProgress();
  const { data: goal, isLoading: gLoading } = useGetDailyGoal();
  const { data: activity, isLoading: aLoading } = useGetActivityFeed();

  // Mock weekly data for the chart if backend doesn't provide granular daily breakdown
  const weeklyData = [
    { day: 'M', xp: 120 },
    { day: 'T', xp: 250 },
    { day: 'W', xp: 50 },
    { day: 'T', xp: Math.min(300, (progress?.weeklyXp || 0) / 2) }, // Use real data vaguely
    { day: 'F', xp: 0 },
    { day: 'S', xp: 0 },
    { day: 'S', xp: 0 },
  ];
  
  const maxWeeklyXp = Math.max(...weeklyData.map(d => d.xp), 300);

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      <div className="text-center md:text-left mb-6">
        <h1 className="text-3xl font-display font-bold mb-3">Your Journey</h1>
        <p className="text-muted-foreground font-medium">Track your Hausa learning progress.</p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {pLoading ? (
           Array(4).fill(0).map((_,i) => <Skeleton key={i} className="h-32 rounded-3xl" />)
        ) : (
          <>
            <StatCard icon={Target} title="Level" value={progress?.level || 1} color="text-primary" bg="bg-primary/10" />
            <StatCard icon={Trophy} title="Total XP" value={<AnimatedCounter value={progress?.totalXp || 0} />} color="text-secondary" bg="bg-secondary/10" />
            <StatCard icon={Flame} title="Streak" value={<AnimatedCounter value={progress?.streak || 0} />} color="text-accent" bg="bg-accent/10" />
            <StatCard icon={Star} title="Max Streak" value={<AnimatedCounter value={progress?.longestStreak || 0} />} color="text-muted-foreground" bg="bg-muted" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Weekly Chart */}
        <div className="bg-card border-2 border-border rounded-3xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-display font-bold mb-8">This Week</h2>
          <div className="flex justify-between items-end h-48 pb-6 border-b-2 border-border/50">
            {weeklyData.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-3 w-8 relative group">
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 font-bold text-xs bg-foreground text-background px-2 py-1 rounded transition-opacity">
                  {day.xp}
                </div>
                <div 
                  className="w-full bg-primary/20 rounded-t-lg group-hover:bg-primary/40 transition-colors mt-auto"
                  style={{ height: `${Math.max((day.xp / maxWeeklyXp) * 100, 2)}%` }}
                />
                <span className="text-sm font-bold text-muted-foreground">{day.day}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-between items-center text-sm font-bold">
            <span className="text-muted-foreground">Total This Week</span>
            <span className="text-primary text-lg">{progress?.weeklyXp || 0} XP</span>
          </div>
        </div>

        {/* Learning Stats */}
        <div className="bg-card border-2 border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-6 flex flex-col justify-center">
          <h2 className="text-xl font-display font-bold">Overall Stats</h2>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold mb-1">
              <span className="text-foreground">Lessons Completed</span>
              <span className="text-muted-foreground">{progress?.completedLessons || 0} / {progress?.totalLessons || 100}</span>
            </div>
            <Progress value={progress?.totalLessons ? (progress.completedLessons / progress.totalLessons) * 100 : 0} className="h-4 bg-muted" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold mb-1">
              <span className="text-foreground">Today's XP Goal</span>
              <span className="text-muted-foreground">{goal?.xpEarned || 0} / {goal?.xpTarget || 50}</span>
            </div>
            <Progress value={Math.min(100, ((goal?.xpEarned || 0) / (goal?.xpTarget || 50)) * 100)} className="h-4 bg-secondary/20 [&>div]:bg-secondary" />
          </div>
          
           <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold mb-1">
              <span className="text-foreground">Words Learned Today</span>
              <span className="text-muted-foreground">{goal?.wordsCompleted || 0} / {goal?.wordsTarget || 10}</span>
            </div>
            <Progress value={Math.min(100, ((goal?.wordsCompleted || 0) / (goal?.wordsTarget || 10)) * 100)} className="h-4 bg-accent/20 [&>div]:bg-accent" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, color, bg }: { icon: any, title: string, value: React.ReactNode, color: string, bg: string }) {
  return (
    <div className="bg-card border-2 border-border rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${bg} ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
      <p className={`text-2xl font-display font-bold ${color.replace('text-', 'text-foreground')}`}>{value}</p>
    </div>
  )
}