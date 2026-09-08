import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetProgress, 
  useGetDailyGoal, 
  useGetDailyChallenge, 
  useCompleteDailyChallenge, 
  useGetActivityFeed 
} from "@workspace/api-client-react";
import { Flame, Trophy, Star, Target, CheckCircle2, BookOpen, Clock, ArrowRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export default function Home() {
  const { data: progress, isLoading: loadingProgress } = useGetProgress();
  const { data: goal, isLoading: loadingGoal } = useGetDailyGoal();
  const { data: challenge, isLoading: loadingChallenge } = useGetDailyChallenge();
  const { data: activity, isLoading: loadingActivity } = useGetActivityFeed();
  
  const completeChallenge = useCompleteDailyChallenge();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const handleChallengeSubmit = () => {
    if (!selectedAnswer || !challenge) return;
    
    completeChallenge.mutate({ data: { answer: selectedAnswer } }, {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
        void queryClient.invalidateQueries({ queryKey: ["/api/goals/daily"] });
        void queryClient.invalidateQueries({ queryKey: ["/api/daily-challenge"] });
        void queryClient.invalidateQueries({ queryKey: ["/api/progress/activity"] });
        toast({
          title: "Great job!",
          description: `You earned ${challenge.xpReward} XP from the daily challenge!`,
        });
      },
      onError: () => {
        toast({
          title: "Incorrect",
          description: "That wasn't the right answer. Try again tomorrow!",
          variant: "destructive",
        });
      }
    });
  };

  const xpProgress = progress ? (progress.totalXp % 1000) / 1000 * 100 : 0;
  const xpNeeded = progress ? 1000 - (progress.totalXp % 1000) : 1000;

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome & Streak Hero */}
      <section>
        {loadingProgress ? (
          <Skeleton className="h-40 w-full rounded-3xl" />
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary text-primary-foreground rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg relative overflow-hidden"
          >
            {/* Pattern background overlay could go here */}
            <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
              <svg width="200" height="200" viewBox="0 0 100 100">
                <pattern id="p" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="10" r="4" fill="currentColor" />
                </pattern>
                <rect width="100" height="100" fill="url(#p)" />
              </svg>
            </div>

            <div className="relative z-10 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Sannu da zuwa!</h1>
              <p className="text-primary-foreground/80 font-medium text-lg">Keep your learning momentum going.</p>
            </div>

            <div className="relative z-10 flex gap-4 bg-primary-foreground/10 p-4 rounded-2xl backdrop-blur-sm border border-primary-foreground/20">
              <div className="flex flex-col items-center justify-center px-4">
                <Flame className="w-10 h-10 text-secondary fill-secondary mb-1 drop-shadow-md" />
                <span className="text-2xl font-bold font-display"><AnimatedCounter value={progress?.streak || 0} /></span>
                <span className="text-xs uppercase tracking-wider font-bold opacity-80">Day Streak</span>
              </div>
              <div className="w-px bg-primary-foreground/20" />
              <div className="flex flex-col items-center justify-center px-4">
                <Trophy className="w-10 h-10 text-accent fill-accent/40 mb-1 drop-shadow-md" />
                <span className="text-2xl font-bold font-display"><AnimatedCounter value={progress?.totalXp || 0} /></span>
                <span className="text-xs uppercase tracking-wider font-bold opacity-80">Total XP</span>
              </div>
            </div>
          </motion.div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Level Progress */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                <Target className="w-6 h-6 text-primary" /> Level Progress
              </h2>
              <span className="font-bold text-muted-foreground text-sm">Level {progress?.level || 1}</span>
            </div>
            
            {loadingProgress ? (
              <Skeleton className="h-24 w-full rounded-2xl" />
            ) : (
              <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-end mb-4">
                  <span className="font-bold text-lg">{progress?.totalXp || 0} XP</span>
                  <span className="text-sm font-medium text-muted-foreground">{xpNeeded} XP to next level</span>
                </div>
                <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    className="absolute top-0 left-0 h-full bg-secondary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <div className="mt-6 flex justify-end">
                  <Link href="/learn">
                    <Button className="rounded-xl font-bold shadow-md hover:shadow-lg transition-all" size="lg">
                      Continue Learning <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </section>

          {/* Daily Challenge */}
          <section>
            <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
              <Star className="w-6 h-6 text-secondary fill-secondary" /> Daily Challenge
            </h2>
            
            {loadingChallenge ? (
              <Skeleton className="h-48 w-full rounded-2xl" />
            ) : !challenge ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
                Check back tomorrow for a new challenge!
              </div>
            ) : challenge.isCompleted || completeChallenge.isSuccess ? (
              <div className="bg-accent/10 border-2 border-accent/30 rounded-2xl p-6 flex items-center gap-4 text-accent-foreground">
                <div className="bg-accent text-accent-foreground p-3 rounded-full">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-1">Challenge Completed!</h3>
                  <p className="font-medium opacity-90">You earned {challenge.xpReward} XP today.</p>
                </div>
              </div>
            ) : (
              <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-sm overflow-hidden relative">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="inline-block px-3 py-1 bg-secondary/10 text-secondary font-bold text-xs rounded-full mb-3 uppercase tracking-wider">
                      Word of the day
                    </span>
                    <h3 className="text-xl font-bold text-foreground">
                      {challenge.question}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl">
                    +{challenge.xpReward} XP
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {challenge.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => setSelectedAnswer(option)}
                      className={`p-4 rounded-xl text-left font-bold transition-all border-2 ${
                        selectedAnswer === option 
                          ? 'border-primary bg-primary/5 text-primary scale-[1.02]' 
                          : 'border-border bg-card hover:border-primary/50 hover:bg-muted'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                <Button 
                  onClick={handleChallengeSubmit}
                  disabled={!selectedAnswer || completeChallenge.isPending}
                  className="w-full rounded-xl font-bold py-6 text-lg"
                  size="lg"
                >
                  {completeChallenge.isPending ? "Checking..." : "Submit Answer"}
                </Button>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-8">
          {/* Daily Goals */}
          <section>
            <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" /> Daily Goals
            </h2>
            
            {loadingGoal ? (
              <Skeleton className="h-64 w-full rounded-2xl" />
            ) : (
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-foreground">Earn XP</span>
                    <span className="text-muted-foreground">{goal?.xpEarned || 0} / {goal?.xpTarget || 50}</span>
                  </div>
                  <Progress value={Math.min(100, ((goal?.xpEarned || 0) / (goal?.xpTarget || 50)) * 100)} className="h-3" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-foreground">Learn Words</span>
                    <span className="text-muted-foreground">{goal?.wordsCompleted || 0} / {goal?.wordsTarget || 10}</span>
                  </div>
                  <Progress value={Math.min(100, ((goal?.wordsCompleted || 0) / (goal?.wordsTarget || 10)) * 100)} className="h-3" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-foreground">Complete Lessons</span>
                    <span className="text-muted-foreground">{goal?.lessonsCompleted || 0} / {goal?.lessonsTarget || 2}</span>
                  </div>
                  <Progress value={Math.min(100, ((goal?.lessonsCompleted || 0) / (goal?.lessonsTarget || 2)) * 100)} className="h-3" />
                </div>

                {goal?.isCompleted && (
                  <div className="mt-4 p-3 bg-secondary/10 rounded-xl text-secondary font-bold text-center flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> All goals met!
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Activity Feed */}
          <section>
            <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" /> Recent Activity
            </h2>
            
            {loadingActivity ? (
              <Skeleton className="h-64 w-full rounded-2xl" />
            ) : activity && activity.length > 0 ? (
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
                {activity.slice(0, 4).map((item) => (
                  <div key={item.id} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      {item.type === 'lesson_complete' ? <BookOpen className="w-5 h-5 text-primary" /> :
                       item.type === 'daily_challenge' ? <Star className="w-5 h-5 text-secondary" /> :
                       <Trophy className="w-5 h-5 text-accent" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-foreground">{item.description}</p>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="font-bold text-primary text-sm whitespace-nowrap">
                      +{item.xp} XP
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
                <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                <p className="text-muted-foreground font-medium">Start your first lesson to see your journey here.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
