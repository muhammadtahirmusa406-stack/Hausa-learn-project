import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useGetLesson, useCompleteLesson, useSubmitAnswer } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, CheckCircle, XCircle, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LessonFlow() {
  const { id } = useParams<{ id: string }>();
  const lessonId = parseInt(id, 10);
  const [, setLocation] = useLocation();

  const { data: lesson, isLoading } = useGetLesson(lessonId, {
    query: { enabled: !!lessonId }
  });

  const completeMutation = useCompleteLesson();
  const submitAnswerMutation = useSubmitAnswer();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [completionData, setCompletionData] = useState<any>(null);

  if (isLoading || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const exercise = lesson.exercises[currentIndex];
  const progressPercent = (currentIndex / lesson.exercises.length) * 100;

  const handleCheck = () => {
    if (!selectedAnswer) return;

    // Fast local check for UX, but could wait for mutation
    submitAnswerMutation.mutate(
      { id: exercise.id, data: { answer: selectedAnswer } },
      {
        onSuccess: (result) => {
          setIsCorrect(result.isCorrect);
          setIsAnswered(true);
          if (result.isCorrect) {
            setScore(s => s + 1);
          }
        }
      }
    );
  };

  const handleNext = () => {
    if (currentIndex < lesson.exercises.length - 1) {
      setCurrentIndex(curr => curr + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      // Finish lesson
      completeMutation.mutate(
        { id: lessonId, data: { score } },
        {
          onSuccess: (res) => {
            setCompletionData(res);
            setIsFinished(true);
          }
        }
      );
    }
  };

  const handleQuit = () => {
    if (confirm("Are you sure you want to quit? You will lose your progress.")) {
      setLocation("/learn");
    }
  };

  if (isFinished && completionData) {
    return (
      <div className="min-h-[100dvh] flex flex-col p-6 max-w-2xl mx-auto bg-background animate-in fade-in duration-500">
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="w-32 h-32 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center border-b-[8px] border-secondary/80"
          >
            <Trophy className="w-16 h-16" />
          </motion.div>
          
          <div>
            <h1 className="text-4xl font-display font-bold text-foreground mb-4">Lesson Complete!</h1>
            <p className="text-xl text-muted-foreground font-medium">
              You scored {score} out of {lesson.exercises.length}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
            <div className="bg-card border-2 border-border p-4 rounded-2xl flex flex-col items-center">
              <span className="text-sm font-bold text-muted-foreground mb-1">XP EARNED</span>
              <span className="text-2xl font-display font-bold text-primary">+{completionData.xpEarned}</span>
            </div>
            <div className="bg-card border-2 border-border p-4 rounded-2xl flex flex-col items-center">
              <span className="text-sm font-bold text-muted-foreground mb-1">STREAK</span>
              <span className="text-2xl font-display font-bold text-secondary">{completionData.streak}</span>
            </div>
          </div>
        </div>

        <div className="pt-6">
          <Button 
            className="w-full h-14 text-lg font-bold rounded-2xl" 
            onClick={() => setLocation("/learn")}
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background max-w-3xl mx-auto">
      {/* Header */}
      <header className="px-4 py-6 flex items-center gap-4">
        <button onClick={handleQuit} className="text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2">
          <X className="w-6 h-6" />
        </button>
        <Progress value={progressPercent} className="flex-1 h-4 bg-muted" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-4 md:px-8 py-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-8">
              {exercise?.question}
            </h2>

            {exercise?.hausa && (
              <div className="text-lg md:text-xl font-medium text-foreground bg-muted p-4 rounded-2xl border border-border mb-8">
                {exercise.hausa}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto md:mt-0">
              {exercise?.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => !isAnswered && setSelectedAnswer(option)}
                  disabled={isAnswered}
                  className={cn(
                    "p-4 text-left border-2 rounded-2xl font-medium text-lg transition-all duration-200 border-b-4 active:border-b-2 active:translate-y-[2px]",
                    selectedAnswer === option && !isAnswered
                      ? "border-primary bg-primary/10 text-primary border-b-primary"
                      : isAnswered && selectedAnswer === option
                      ? isCorrect 
                        ? "border-primary bg-primary/10 text-primary border-b-primary"
                        : "border-destructive bg-destructive/10 text-destructive border-b-destructive"
                      : "border-border bg-card text-card-foreground hover:bg-muted"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Actions */}
      <div className={cn(
        "border-t-2 p-4 md:p-8 transition-colors duration-300",
        isAnswered 
          ? isCorrect ? "bg-primary/10 border-primary/20" : "bg-destructive/10 border-destructive/20"
          : "bg-background border-transparent"
      )}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          {isAnswered ? (
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                isCorrect ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"
              )}>
                {isCorrect ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
              </div>
              <div>
                <h3 className={cn("text-xl font-bold font-display", isCorrect ? "text-primary" : "text-destructive")}>
                  {isCorrect ? "Excellent!" : "Not quite"}
                </h3>
              </div>
            </div>
          ) : <div />}

          <Button
            size="lg"
            className={cn(
              "min-w-[150px] h-12 text-lg font-bold rounded-2xl",
              isAnswered && isCorrect ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "",
              isAnswered && !isCorrect ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : ""
            )}
            disabled={!selectedAnswer && !isAnswered || completeMutation.isPending}
            onClick={isAnswered ? handleNext : handleCheck}
          >
            {isAnswered ? "Continue" : "Check"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Utility class included inline since importing might be tricky if not exported
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
