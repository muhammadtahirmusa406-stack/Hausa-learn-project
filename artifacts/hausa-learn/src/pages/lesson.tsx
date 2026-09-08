import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useGetLesson, useSubmitAnswer, useCompleteLesson } from "@workspace/api-client-react";
import { ArrowRight, Flame, Heart, Loader2, RotateCcw, Trophy, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { speakHausa } from "@/lib/hausa-audio";

function retryTypeFor(type: string) {
  if (type === "multiple_choice" || type === "translation" || type === "listening") return "typing";
  if (type === "typing" || type === "fill_blank") return "multiple_choice";
  return "typing";
}

export default function LessonFlow() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: lesson, isLoading, error } = useGetLesson(id);
  const submitAnswer = useSubmitAnswer();
  const completeLesson = useCompleteLesson();

  const [questionIds, setQuestionIds] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [orderedWords, setOrderedWords] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation?: string | null; correctAnswer: string } | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [lives, setLives] = useState(5);
  const [maxLives, setMaxLives] = useState(5);
  const [correctIds, setCorrectIds] = useState<Set<number>>(new Set());
  const [retryFormats, setRetryFormats] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!lesson) return;
    const retryIds = new Set(lesson.retryExerciseIds);
    const initialIds = lesson.exercises.filter((exercise) => !retryIds.has(exercise.id)).map((exercise) => exercise.id);
    setQuestionIds([...initialIds, ...lesson.retryExerciseIds]);
    setCurrentIndex(0);
    setLives(lesson.currentLives);
    setMaxLives(lesson.maxLives);
    setIsPaused(lesson.currentLives <= 0);
  }, [lesson]);

  const currentExercise = useMemo(() => {
    const currentId = questionIds[currentIndex];
    return lesson?.exercises.find((exercise) => exercise.id === currentId);
  }, [lesson, questionIds, currentIndex]);

  const isRetry = !!currentExercise && (lesson?.retryExerciseIds.includes(currentExercise.id) || !!retryFormats[currentExercise.id]);
  const displayedType = currentExercise
    ? (retryFormats[currentExercise.id] || (isRetry ? currentExercise.retryType : null) || currentExercise.type)
    : "";
  const progressPercent = questionIds.length ? (currentIndex / questionIds.length) * 100 : 0;
  const wordOptions = currentExercise?.options ?? [];

  const resetAnswer = () => {
    setFeedback(null);
    setSelectedOption(null);
    setTextInput("");
    setOrderedWords([]);
  };

  const announceWord = (text: string) => {
    if (!speakHausa(text)) {
      toast({
        title: "Hausa audio unavailable",
        description: "This browser does not provide a Hausa-capable voice. No English voice was used as a substitute.",
        variant: "destructive",
      });
    }
  };

  const handleCheck = () => {
    if (!currentExercise || lives <= 0) return;
    const answer = displayedType === "typing" || displayedType === "fill_blank" || displayedType === "listening"
      ? textInput
      : displayedType === "word_ordering"
        ? orderedWords.join(" ")
        : selectedOption;
    if (!answer) return;

    submitAnswer.mutate({ id: currentExercise.id, data: { answer } }, {
      onSuccess: (result) => {
        setFeedback({
          isCorrect: result.isCorrect,
          explanation: result.explanation,
          correctAnswer: result.correctAnswer,
        });
        setLives(result.livesRemaining);
        void queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
        void queryClient.invalidateQueries({ queryKey: [`/api/lessons/${id}`] });
        if (result.isCorrect) {
          setCorrectIds((previous) => new Set(previous).add(currentExercise.id));
        } else {
          setRetryFormats((previous) => ({
            ...previous,
            [currentExercise.id]: currentExercise.retryType || retryTypeFor(currentExercise.type),
          }));
          setQuestionIds((previous) => [...previous, currentExercise.id]);
          if (result.livesRemaining <= 0) setIsPaused(true);
        }
      },
      onError: () => {
        toast({ title: "Could not check answer", description: "Please try again when your connection is ready.", variant: "destructive" });
      },
    });
  };

  const handleNext = () => {
    if (isPaused) return;
    const nextIndex = currentIndex + 1;
    resetAnswer();
    if (nextIndex < questionIds.length) {
      setCurrentIndex(nextIndex);
      return;
    }
    handleFinish();
  };

  const handleFinish = () => {
    if (!lesson || correctIds.size < lesson.exercises.length) {
      toast({
        title: "One more practice round",
        description: "Missed questions stay in your retry queue until you answer them correctly.",
        variant: "destructive",
      });
      return;
    }
    completeLesson.mutate({ id: lesson.id, data: { score: correctIds.size, totalQuestions: lesson.exercises.length } }, {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
        void queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
        setIsFinished(true);
      },
      onError: () => toast({ title: "Could not save completion", description: "Your answers are saved. Please try completing the lesson again.", variant: "destructive" }),
    });
  };

  const renderAudioButton = (text?: string | null) => text ? (
    <Button
      onClick={() => announceWord(text)}
      variant="outline"
      className="w-16 h-16 rounded-2xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary shadow-sm"
      aria-label="Play Hausa pronunciation"
    >
      <Volume2 className="w-8 h-8" />
    </Button>
  ) : null;

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  if (error || !lesson) return <div className="p-8 text-center text-destructive font-bold">Failed to load lesson.</div>;

  if (isFinished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center z-10 space-y-8 max-w-md w-full">
          <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground">Lesson Complete!</h1>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border-2 border-border p-4 rounded-2xl text-center">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Score</p>
              <p className="text-3xl font-display font-bold text-foreground">{correctIds.size}/{lesson.exercises.length}</p>
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

  if (isPaused) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center gap-1">{Array.from({ length: maxLives }).map((_, index) => <Heart key={index} className="w-8 h-8 text-destructive/30" />)}</div>
          <h1 className="text-3xl font-display font-bold">Practice paused</h1>
          <p className="text-muted-foreground font-medium">
            You used all five lives. Your missed questions are safely in the retry queue. Come back after a life restores and continue practicing.
          </p>
          {feedback && <p className="rounded-2xl bg-destructive/10 border border-destructive/30 p-4 text-sm font-semibold text-left">Correct answer: {feedback.correctAnswer}</p>}
          <Button onClick={() => setLocation("/learn")} className="w-full h-14 rounded-2xl font-bold">Back to Learn</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-3xl mx-auto">
      <header className="px-4 py-5 flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full shrink-0" onClick={() => setLocation("/learn")}><X className="w-6 h-6 text-muted-foreground" /></Button>
        <div className="flex-1"><Progress value={progressPercent} className="h-4 bg-muted" /></div>
        <div className="flex items-center gap-1" aria-label={`${lives} lives remaining`}>
          {Array.from({ length: maxLives }).map((_, index) => <Heart key={index} className={`w-5 h-5 ${index < lives ? "text-destructive fill-destructive" : "text-muted-foreground/30"}`} />)}
        </div>
        <div className="font-bold text-sm text-muted-foreground whitespace-nowrap">{currentIndex + 1} / {questionIds.length}</div>
      </header>

      <main className="flex-1 flex flex-col p-4 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div key={`${currentExercise?.id}-${currentIndex}`} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} transition={{ duration: 0.3 }} className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-2 mb-3">
              {isRetry && <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 text-secondary px-3 py-1 text-xs font-bold"><RotateCcw className="w-3 h-3" /> Retry round</span>}
              {displayedType === "listening" && <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold"><Volume2 className="w-3 h-3" /> Listening</span>}
            </div>
            <h2 className="text-3xl font-display font-bold text-foreground mb-8 text-center md:text-left leading-tight">{currentExercise?.question}</h2>

            {(currentExercise?.audioWord || displayedType === "listening") && (
              <div className="flex justify-center md:justify-start mb-8">{renderAudioButton(currentExercise?.audioWord || currentExercise?.hausa)}</div>
            )}

            {displayedType === "word_ordering" ? (
              <div className="space-y-4">
                <div className="min-h-16 rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 text-lg font-bold">{orderedWords.join(" ") || "Tap words in the correct order"}</div>
                <div className="flex flex-wrap gap-3">
                  {wordOptions.map((word, index) => (
                    <button key={`${word}-${index}`} onClick={() => !feedback && setOrderedWords((previous) => previous.includes(`${word}-${index}`) ? previous : [...previous, word])} disabled={!!feedback} className="rounded-xl border-2 border-border bg-card px-4 py-3 font-bold hover:border-primary/50">
                      {word}
                    </button>
                  ))}
                </div>
              </div>
            ) : displayedType === "multiple_choice" || displayedType === "translation" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentExercise?.options.map((option) => (
                  <button key={option} onClick={() => !feedback && setSelectedOption(option)} disabled={!!feedback} className={`p-6 rounded-2xl text-lg font-bold transition-all border-2 text-center md:text-left ${selectedOption === option ? "border-primary bg-primary/10 text-primary scale-[1.02] shadow-sm" : "border-border bg-card hover:border-primary/40 hover:bg-muted"} ${feedback && option === feedback.correctAnswer ? "border-accent bg-accent/10 text-accent" : ""} ${feedback && selectedOption === option && !feedback.isCorrect ? "border-destructive bg-destructive/10 text-destructive" : ""}`}>
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <Input autoFocus value={textInput} onChange={(event) => setTextInput(event.target.value)} disabled={!!feedback} className="h-16 text-xl rounded-2xl border-2 font-bold px-6 bg-card" placeholder={displayedType === "listening" ? "Type what you hear..." : "Type your answer here..."} onKeyDown={(event) => event.key === "Enter" && textInput && !feedback && handleCheck()} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="p-4 md:p-8 mt-auto">
        <AnimatePresence>
          {feedback && (
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`mb-6 p-6 rounded-2xl border-2 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between ${feedback.isCorrect ? "bg-accent/10 border-accent/30 text-accent-foreground" : "bg-destructive/10 border-destructive/30 text-destructive-foreground"}`}>
              <div>
                <h3 className="text-2xl font-display font-bold mb-1">{feedback.isCorrect ? "Correct!" : "Not quite"}</h3>
                {!feedback.isCorrect && <p className="font-bold opacity-90 mt-2">Correct answer: <span className="underline decoration-2">{feedback.correctAnswer}</span></p>}
                {feedback.explanation && <p className="font-medium opacity-80 mt-1">{feedback.explanation}</p>}
              </div>
              {!feedback.isCorrect && <div className="flex items-center gap-1 text-destructive font-bold"><Flame className="w-5 h-5" /> -1 life</div>}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="max-w-2xl mx-auto">
          {!feedback ? (
            <Button className="w-full h-14 text-lg font-bold rounded-2xl shadow-md" disabled={(!selectedOption && !textInput && !orderedWords.length) || submitAnswer.isPending || lives <= 0} onClick={handleCheck}>{submitAnswer.isPending ? "Checking..." : "Check Answer"}</Button>
          ) : lives <= 0 ? (
            <Button className="w-full h-14 text-lg font-bold rounded-2xl shadow-md bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={() => setIsPaused(true)}>Pause and practice later</Button>
          ) : (
            <Button className={`w-full h-14 text-lg font-bold rounded-2xl shadow-md ${feedback.isCorrect ? "bg-accent hover:bg-accent/90 text-accent-foreground" : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"}`} onClick={handleNext}>Continue</Button>
          )}
        </div>
      </div>
    </div>
  );
}