import { useGetProgress, useGetActivityFeed, useGetDailyChallenge, useCompleteDailyChallenge } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Flame, Play, Star, Clock, CheckCircle2, XCircle, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const { data: progress, isLoading: loadingProgress } = useGetProgress();
  const { data: activity, isLoading: loadingActivity } = useGetActivityFeed();
  const { data: dailyChallenge, isLoading: loadingChallenge } = useGetDailyChallenge();
  
  const completeChallenge = useCompleteDailyChallenge();
  
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState<{ isCorrect: boolean } | null>(null);

  const handleAnswerSubmit = (answer: string) => {
    if (showResult || dailyChallenge?.completed) return;
    
    setSelectedAnswer(answer);
    
    completeChallenge.mutate(
      { data: { answer } },
      {
        onSuccess: (result) => {
          setShowResult({ isCorrect: result.isCorrect });
        }
      }
    );
  };

  if (loadingProgress || loadingActivity) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-muted rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-muted rounded-2xl" />
          <div className="h-24 bg-muted rounded-2xl" />
        </div>
        <div className="h-64 bg-muted rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome & Quick Start */}
      <div className="bg-primary text-primary-foreground rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-2">
            Sannu da zuwa! 👋
          </h2>
          <p className="text-primary-foreground/80 mb-6 text-lg max-w-md">
            Ready to continue your Hausa journey? You're on a {progress?.streak || 0} day streak!
          </p>
          <Link href="/learn">
            <Button size="lg" variant="secondary" className="font-bold text-lg px-8 rounded-2xl shadow-sm hover:translate-y-[-2px] transition-transform">
              <Play className="w-5 h-5 mr-2 fill-current" />
              Continue Learning
            </Button>
          </Link>
        </div>
      </div>

      {/* Daily Challenge */}
      {!loadingChallenge && dailyChallenge && (
        <Card className={`border-2 overflow-hidden shadow-sm relative ${dailyChallenge.completed || showResult?.isCorrect ? 'border-primary/50 bg-primary/5' : 'border-secondary/30 bg-secondary/5'}`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-accent" />
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-secondary fill-secondary" />
              <h3 className="font-display font-bold text-lg">Daily Challenge</h3>
              {(dailyChallenge.completed || showResult?.isCorrect) && (
                <span className="ml-auto text-xs font-bold bg-primary/20 text-primary px-2 py-1 rounded-md flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Completed
                </span>
              )}
            </div>

            <p className="text-foreground font-medium mb-4 text-lg">
              {dailyChallenge.question}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dailyChallenge.options.map((option) => {
                const isSelected = selectedAnswer === option;
                const isCompleted = dailyChallenge.completed || showResult;
                
                let buttonStyle = "bg-background border-border hover:bg-muted";
                
                if (isCompleted && isSelected) {
                  buttonStyle = showResult?.isCorrect || dailyChallenge.completed 
                    ? "bg-primary/20 border-primary text-primary" 
                    : "bg-destructive/20 border-destructive text-destructive";
                } else if (isSelected) {
                  buttonStyle = "bg-secondary/20 border-secondary text-secondary";
                }

                return (
                  <Button
                    key={option}
                    variant="outline"
                    className={`h-auto py-3 px-4 justify-start text-left border-2 transition-all ${buttonStyle} ${(dailyChallenge.completed || completeChallenge.isPending) ? 'opacity-80 pointer-events-none' : ''}`}
                    onClick={() => handleAnswerSubmit(option)}
                    disabled={!!dailyChallenge.completed || completeChallenge.isPending || !!showResult}
                  >
                    <span className="flex-1">{option}</span>
                    <AnimatePresence>
                      {isSelected && showResult && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="shrink-0 ml-2"
                        >
                          {showResult.isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          ) : (
                            <XCircle className="w-5 h-5 text-destructive" />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                );
              })}
            </div>
            
            <AnimatePresence>
              {showResult && !showResult.isCorrect && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-lg border border-destructive/20"
                >
                  Oops! That's incorrect. Try again tomorrow!
                </motion.div>
              )}
              {showResult && showResult.isCorrect && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 text-sm text-primary font-medium bg-primary/10 p-3 rounded-lg border border-primary/20 flex items-center justify-between"
                >
                  <span>Excellent! You earned +{dailyChallenge.xpReward} XP.</span>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2 border-border shadow-sm rounded-2xl">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Flame className="w-8 h-8 text-secondary mb-2 fill-secondary" />
            <div className="text-2xl font-bold font-display">{progress?.streak || 0}</div>
            <div className="text-sm font-medium text-muted-foreground">Day Streak</div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-border shadow-sm rounded-2xl">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Trophy className="w-8 h-8 text-primary mb-2" />
            <div className="text-2xl font-bold font-display">{progress?.totalXp || 0}</div>
            <div className="text-sm font-medium text-muted-foreground">Total XP</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border shadow-sm rounded-2xl">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Star className="w-8 h-8 text-chart-4 mb-2 fill-chart-4" />
            <div className="text-2xl font-bold font-display">Lvl {progress?.level || 1}</div>
            <div className="text-sm font-medium text-muted-foreground">Current Level</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border shadow-sm rounded-2xl">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <BookOpenIcon className="w-8 h-8 text-accent mb-2" />
            <div className="text-2xl font-bold font-display">{progress?.completedLessons || 0}</div>
            <div className="text-sm font-medium text-muted-foreground">Lessons</div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <div>
        <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          Recent Activity
        </h3>
        <Card className="rounded-2xl border-2 shadow-sm overflow-hidden">
          <div className="divide-y divide-border">
            {activity && activity.length > 0 ? (
              activity.slice(0, 5).map((item) => (
                <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {item.type === 'achievement' ? <Trophy className="w-5 h-5" /> : <Star className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{item.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="font-bold text-primary shrink-0">
                    +{item.xp} XP
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No activity yet. Complete a lesson to see your progress here!
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function BookOpenIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}