import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGetUnits, useUnlockUnit, useGetLessons } from "@workspace/api-client-react";
import { Lock, CheckCircle2, Play, Star, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function Learn() {
  const { data: units, isLoading: loadingUnits, refetch: refetchUnits } = useGetUnits();
  const { data: allLessons, isLoading: loadingLessons } = useGetLessons();
  const unlockUnitMutation = useUnlockUnit();
  const { toast } = useToast();

  const [expandedUnitId, setExpandedUnitId] = useState<number | null>(null);

  // Auto-expand first unit on load
  if (units && units.length > 0 && expandedUnitId === null) {
    setExpandedUnitId(units[0].id);
  }

  const handleUnlock = (unitId: number) => {
    unlockUnitMutation.mutate({ id: unitId }, {
      onSuccess: () => {
        toast({ title: "Unit Unlocked!", description: "You can now access these lessons." });
        refetchUnits();
      },
      onError: () => {
        toast({ title: "Unlock Failed", description: "Could not unlock this unit.", variant: "destructive" });
      }
    });
  };

  const toggleExpand = (id: number) => {
    setExpandedUnitId(prev => prev === id ? null : id);
  };

  if (loadingUnits || loadingLessons) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-3xl" />)}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-16 space-y-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-display font-bold mb-3">Path to Fluency</h1>
        <p className="text-muted-foreground font-medium text-lg">Master Hausa step by step.</p>
      </div>

      <div className="space-y-6">
        {units?.map((unit, index) => {
          const isExpanded = expandedUnitId === unit.id;
          const unitLessons = allLessons?.filter(l => l.unitId === unit.id) || [];
          // If no unitId provided in mock data, fallback to arbitrary slicing for visual effect
          const displayLessons = unitLessons.length > 0 ? unitLessons : (allLessons || []).slice(index * 3, index * 3 + 3);

          return (
            <motion.div 
              key={unit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`border-2 rounded-3xl overflow-hidden transition-all duration-300 shadow-sm ${
                unit.isLocked 
                  ? 'border-border/50 bg-muted/30 opacity-75' 
                  : unit.isCompleted 
                    ? 'border-primary/30 bg-card' 
                    : 'border-primary shadow-md bg-card'
              }`}
            >
              {/* Unit Header Card */}
              <div 
                className={`p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 cursor-pointer ${
                  unit.isLocked ? '' : 'hover:bg-muted/30'
                }`}
                onClick={() => !unit.isLocked && toggleExpand(unit.id)}
              >
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shrink-0 shadow-inner ${
                  unit.isLocked ? 'bg-muted text-muted-foreground' : 'bg-primary/10'
                }`}>
                  {unit.isLocked ? <Lock className="w-8 h-8 opacity-50" /> : unit.iconEmoji}
                </div>
                
                <div className="flex-1 text-center md:text-left w-full">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <h2 className="text-2xl font-display font-bold">{unit.title}</h2>
                    {unit.isCompleted && <CheckCircle2 className="w-6 h-6 text-primary fill-primary/20" />}
                  </div>
                  <p className="text-muted-foreground font-medium mb-4">{unit.description}</p>
                  
                  {!unit.isLocked && (
                    <div className="flex items-center gap-4 max-w-md mx-auto md:mx-0">
                      <Progress 
                        value={unit.totalLessons > 0 ? (unit.completedLessons / unit.totalLessons) * 100 : 0} 
                        className="h-3 flex-1" 
                      />
                      <span className="text-sm font-bold whitespace-nowrap">
                        {unit.completedLessons} / {unit.totalLessons}
                      </span>
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex flex-col items-center gap-3">
                  {unit.isLocked ? (
                    <Button 
                      variant="outline" 
                      className="rounded-xl font-bold border-2"
                      onClick={(e) => { e.stopPropagation(); handleUnlock(unit.id); }}
                      disabled={unlockUnitMutation.isPending}
                    >
                      <Star className="w-4 h-4 mr-2" /> Skip to Here
                    </Button>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded Lessons Accordion */}
              <AnimatePresence>
                {isExpanded && !unit.isLocked && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-muted/20 border-t-2 border-border/50"
                  >
                    <div className="p-6 md:p-8 space-y-4">
                      {displayLessons.map((lesson, idx) => (
                        <div 
                          key={lesson.id}
                          className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                            lesson.isCompleted 
                              ? 'bg-card border-border hover:border-primary/40' 
                              : lesson.isUnlocked
                                ? 'bg-card border-primary/50 shadow-sm hover:border-primary hover:shadow-md translate-x-2'
                                : 'bg-muted/50 border-transparent opacity-60'
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                            lesson.isCompleted 
                              ? 'bg-primary/20 text-primary' 
                              : lesson.isUnlocked
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'bg-border text-muted-foreground'
                          }`}>
                            {lesson.isCompleted ? <CheckCircle2 className="w-6 h-6" /> : (idx + 1)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg truncate text-foreground">{lesson.title}</h3>
                            <p className="text-sm text-muted-foreground font-medium truncate">{lesson.description}</p>
                          </div>
                          
                          <div className="shrink-0 flex items-center gap-4">
                            <div className="hidden sm:flex font-bold text-secondary bg-secondary/10 px-3 py-1 rounded-lg text-sm">
                              +{lesson.xpReward} XP
                            </div>
                            
                            {lesson.isUnlocked ? (
                              <Link href={`/lesson/${lesson.id}`}>
                                <Button size="icon" className="rounded-full w-12 h-12 shadow-sm">
                                  <Play className="w-5 h-5 fill-current ml-1" />
                                </Button>
                              </Link>
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-border flex items-center justify-center">
                                <Lock className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
