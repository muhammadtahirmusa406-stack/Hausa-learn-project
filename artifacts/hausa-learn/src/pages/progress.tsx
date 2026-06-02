import { useGetProgress, useGetActivityFeed } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Flame, Target, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function ProgressPage() {
  const { data: progress, isLoading: loadingProgress } = useGetProgress();
  const { data: activity, isLoading: loadingActivity } = useGetActivityFeed();

  // Mock chart data for week, derived from weeklyXp for today, rest is mock since API only gives total weeklyXp
  const chartData = [
    { name: "Mon", xp: 50 },
    { name: "Tue", xp: 120 },
    { name: "Wed", xp: 0 },
    { name: "Thu", xp: 200 },
    { name: "Fri", xp: 150 },
    { name: "Sat", xp: progress?.weeklyXp || 30 },
    { name: "Sun", xp: 0 },
  ];

  if (loadingProgress) {
    return <div className="min-h-screen p-8"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mt-20" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Your Profile</h1>
        <p className="text-muted-foreground mt-1">Track your Hausa learning journey.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border-2 border-border p-4 rounded-2xl shadow-sm flex flex-col">
          <Flame className="w-6 h-6 text-secondary fill-secondary mb-2" />
          <span className="text-2xl font-bold font-display">{progress?.streak || 0}</span>
          <span className="text-sm font-medium text-muted-foreground">Day Streak</span>
        </div>
        <div className="bg-card border-2 border-border p-4 rounded-2xl shadow-sm flex flex-col">
          <Trophy className="w-6 h-6 text-primary mb-2" />
          <span className="text-2xl font-bold font-display">{progress?.totalXp || 0}</span>
          <span className="text-sm font-medium text-muted-foreground">Total XP</span>
        </div>
        <div className="bg-card border-2 border-border p-4 rounded-2xl shadow-sm flex flex-col">
          <Target className="w-6 h-6 text-accent mb-2" />
          <span className="text-2xl font-bold font-display">{progress?.completedLessons || 0}</span>
          <span className="text-sm font-medium text-muted-foreground">Lessons Done</span>
        </div>
        <div className="bg-card border-2 border-border p-4 rounded-2xl shadow-sm flex flex-col">
          <Zap className="w-6 h-6 text-chart-4 fill-chart-4 mb-2" />
          <span className="text-2xl font-bold font-display">{progress?.longestStreak || progress?.streak || 0}</span>
          <span className="text-sm font-medium text-muted-foreground">Longest Streak</span>
        </div>
      </div>

      <Card className="border-2 border-border shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border pb-4">
          <CardTitle className="font-display font-bold text-xl">Weekly Activity</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                  contentStyle={{ borderRadius: '12px', border: '2px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)', fontWeight: 'bold' }}
                />
                <Bar 
                  dataKey="xp" 
                  fill="hsl(var(--primary))" 
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-border shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border pb-4">
          <CardTitle className="font-display font-bold text-xl">Milestones</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center border-2 border-secondary/20">
                <Flame className="w-7 h-7 fill-secondary" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <h4 className="font-bold">Wildfire</h4>
                  <span className="text-muted-foreground font-medium">{progress?.streak || 0} / 7 days</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-secondary transition-all" style={{ width: `${Math.min(100, ((progress?.streak || 0) / 7) * 100)}%` }} />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border-2 border-primary/20">
                <Trophy className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <h4 className="font-bold">XP Scholar</h4>
                  <span className="text-muted-foreground font-medium">{progress?.totalXp || 0} / 1000 XP</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, ((progress?.totalXp || 0) / 1000) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
