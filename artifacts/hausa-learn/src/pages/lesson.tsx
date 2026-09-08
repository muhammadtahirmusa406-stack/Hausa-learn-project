import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGetLesson, useSubmitAnswer, useCompleteLesson } from "@workspace/api-client-react";
import { X, Volume2, ArrowRight, Flame, Trophy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export default function LessonFlow() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: lesson, isLoading, error } = useGetLesson(id);
  const submitAnswer = useSubmitAnswer();
  const completeLesson = useCompleteLesson();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation?: string | null; correctAnswer: string } | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  const currentExercise = lesson?.exercises?.[currentIndex];
  const progressPercent = lesson?.exercises ? (currentIndex / lesson.exercises.length) * 100 : 0;

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-NG'; // Nigerian English accent is closer for West African languages
    utterance.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handleCheck = () => {
    if (!currentExercise) return;
    const answer = currentExercise.type === 'typing' || currentExercise.type === 'fill_blank' 
      ? textInput 
      : selectedOption;

    if (!answer) return;

    submitAnswer.mutate({ id: currentExercise.id, data: { answer } }, {
      onSuccess: (res) => {
        setFeedback({
          isCorrect: res.isCorrect,
          explanation: res.explanation,
          correctAnswer: res.correctAnswer
        });
        if (res.isCorrect) setScore(s => s + 1);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to check answer.", variant: "destructive" });
      }
    });
  };

  const handleNext = () => {
    setFeedback(null);
    setSelectedOption(null);
    setTextInput("");
    
    if (lesson && currentIndex < lesson.exercises.length - 1) {
      setCurrentIndex(c => c + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    if (!lesson) return;
    completeLesson.mutate({ id: lesson.id, data: { score, totalQuestions: lesson.exercises.length } }, {
      onSuccess: () => {
        setIsFinished(true);
      }
    });
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  if (error || !lesson) return <div className="p-8 text-center text-destructive font-bold">Failed to load lesson.</div>;

  if (isFinished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center z-10 space-y-8 max-w-md w-full"
        >
          <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-16 h-16 text-primary" />
          </div>
          
          <h1 className="text-4xl font-display font-bold text-foreground">Lesson Complete!</h1>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border-2 border-border p-4 rounded-2xl text-center">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Score</p>
              <p className="text-3xl font-display font-bold text-foreground">{score}/{lesson.exercises.length}</p>
            </div>
            <div className="bg-secondary/10 border-2 border-secondary/20 p-4 rounded-2xl text-center">
              <p className="text-sm font-bold text-secondary uppercase tracking-wider mb-1">XP Earned</p>
              <p className="text-3xl font-display font-bold text-secondary">+<AnimatedCounter value={lesson.xpReward} /></p>
            </div>
          </div>

          <Button onClick={() => setLocation("/learn")} className="w-full rounded-2xl h-14 text-lg font-bold shadow-lg" size="lg">
            Continue <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-3xl mx-auto">
      {/* Header */}
      <header className="px-4 py-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full shrink-0" onClick={() => setLocation("/learn")}>
          <X className="w-6 h-6 text-muted-foreground" />
        </Button>
        <div className="flex-1">
          <Progress value={progressPercent} className="h-4 bg-muted" />
        </div>
        <div className="font-bold text-sm text-muted-foreground whitespace-nowrap">
          {currentIndex + 1} / {lesson.exercises.length}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIndex}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full"
          >
            <h2 className="text-3xl font-display font-bold text-foreground mb-8 text-center md:text-left leading-tight">
              {currentExercise?.question}
            </h2>

            {currentExercise?.audioWord && (
              <div className="flex justify-center md:justify-start mb-8">
                <Button 
                  onClick={() => speak(currentExercise.audioWord!)}
                  variant="outline" 
                  className="w-16 h-16 rounded-2xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary shadow-sm"
                >
                  <Volume2 className="w-8 h-8" />
                </Button>
              </div>
            )}

            {/* Exercise Types */}
            {currentExercise?.type === 'multiple_choice' || currentExercise?.type === 'translation' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentExercise.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => !feedback && setSelectedOption(opt)}
                    disabled={!!feedback}
                    className={`p-6 rounded-2xl text-lg font-bold transition-all border-2 text-center md:text-left ${
                      selectedOption === opt 
                        ? 'border-primary bg-primary/10 text-primary scale-[1.02] shadow-sm' 
                        : 'border-border bg-card hover:border-primary/40 hover:bg-muted'
                    } ${feedback && opt === feedback.correctAnswer ? 'border-accent bg-accent/10 text-accent' : ''} 
                      ${feedback && selectedOption === opt && !feedback.isCorrect ? 'border-destructive bg-destructive/10 text-destructive' : ''}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div className="w-full">
                <Input
                  autoFocus
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={!!feedback}
                  className="h-16 text-xl rounded-2xl border-2 font-bold px-6 bg-card"
                  placeholder="Type your answer here..."
                  onKeyDown={(e) => e.key === 'Enter' && textInput && !feedback && handleCheck()}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer / Feedback Action */}
      <div className="p-4 md:p-8 mt-auto">
        <AnimatePresence>
          {feedback && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={`mb-6 p-6 rounded-2xl border-2 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between ${
                feedback.isCorrect 
                  ? 'bg-accent/10 border-accent/30 text-accent-foreground' 
                  : 'bg-destructive/10 border-destructive/30 text-destructive-foreground'
              }`}
            >
              <div>
                <h3 className="text-2xl font-display font-bold mb-1 flex items-center gap-2">
                  {feedback.isCorrect ? "Correct!" : "Not quite"}
                </h3>
                {!feedback.isCorrect && (
                  <p className="font-bold opacity-90 mt-2">Correct answer: <span className="underline decoration-2">{feedback.correctAnswer}</span></p>
                )}
                {feedback.explanation && (
                  <p className="font-medium opacity-80 mt-1">{feedback.explanation}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-2xl mx-auto">
          {!feedback ? (
            <Button 
              className="w-full h-14 text-lg font-bold rounded-2xl shadow-md"
              disabled={(!selectedOption && !textInput) || submitAnswer.isPending}
              onClick={handleCheck}
            >
              {submitAnswer.isPending ? "Checking..." : "Check Answer"}
            </Button>
          ) : (
            <Button 
              className={`w-full h-14 text-lg font-bold rounded-2xl shadow-md ${
                feedback.isCorrect 
                  ? 'bg-accent hover:bg-accent/90 text-accent-foreground' 
                  : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
              }`}
              onClick={handleNext}
            >
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
