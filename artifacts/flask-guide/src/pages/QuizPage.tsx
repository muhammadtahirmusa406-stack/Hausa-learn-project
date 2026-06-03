// ============================================================
// QuizPage.tsx — The quiz itself
//
// Flask equivalent (app.py):
//
//   @app.route("/quiz", methods=["GET", "POST"])
//   def quiz():
//       question_index = session.get("question_index", 0)
//       score = session.get("score", 0)
//
//       if request.method == "POST":
//           answer = request.form["answer"]
//           correct = questions[question_index]["correct"]
//           if answer == correct:
//               score += 1
//               session["score"] = score
//           question_index += 1
//           session["question_index"] = question_index
//
//           if question_index >= len(questions):
//               return redirect("/results")
//
//       question = questions[question_index]
//       return render_template("quiz.html", question=question, index=question_index, total=len(questions))
// ============================================================

import { useState } from "react";
import { questions } from "../data/questions";

type QuizPageProps = {
  onFinish: (score: number, total: number) => void;
};

export default function QuizPage({ onFinish }: QuizPageProps) {
  // Track which question we're on (starts at 0, like a Python list index)
  const [questionIndex, setQuestionIndex] = useState(0);

  // Track the score — how many correct answers
  const [score, setScore] = useState(0);

  // Track what the user selected
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  // Track if we've revealed the answer yet
  const [showResult, setShowResult] = useState(false);

  // Get the current question from our list
  // Python equivalent: question = questions[question_index]
  const currentQuestion = questions[questionIndex];

  // Called when the user clicks an answer button
  function handleAnswer(option: string) {
    if (showResult) return; // Don't allow changing after submitting

    setSelectedAnswer(option);
    setShowResult(true);

    // Check if correct — same logic as Flask's: if answer == correct:
    if (option === currentQuestion.correct) {
      setScore(score + 1); // score += 1
    }
  }

  // Called when user clicks "Next Question"
  function handleNext() {
    const nextIndex = questionIndex + 1;

    // If we've answered all questions, go to results
    // Flask: if question_index >= len(questions): redirect("/results")
    if (nextIndex >= questions.length) {
      onFinish(score + (selectedAnswer === currentQuestion.correct ? 1 : 0), questions.length);
      return;
    }

    // Move to the next question
    setQuestionIndex(nextIndex);
    setSelectedAnswer(null);
    setShowResult(false);
  }

  // Work out the color for each answer button
  function getButtonColor(option: string): string {
    if (!showResult) return "#f8f9fa"; // Not answered yet — gray
    if (option === currentQuestion.correct) return "#d1fae5"; // Correct — green
    if (option === selectedAnswer) return "#fee2e2"; // Wrong pick — red
    return "#f8f9fa"; // Other options — stay gray
  }

  function getBorderColor(option: string): string {
    if (!showResult) return "#e0e0e0";
    if (option === currentQuestion.correct) return "#10b981";
    if (option === selectedAnswer) return "#ef4444";
    return "#e0e0e0";
  }

  // Progress: how far through the quiz are we?
  // Python: progress = (question_index / len(questions)) * 100
  const progress = ((questionIndex) / questions.length) * 100;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Progress bar — shows how far through the quiz */}
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>

        {/* Question counter */}
        <p style={styles.counter}>
          Question {questionIndex + 1} of {questions.length}
        </p>

        {/* Score so far */}
        <p style={styles.scoreLabel}>Score: {score} ✓</p>

        {/* The question text */}
        <h2 style={styles.question}>{currentQuestion.question}</h2>

        {/* Answer options — rendered from our array */}
        {/* Flask: {% for option in question.options %} */}
        <div style={styles.optionList}>
          {currentQuestion.options.map((option) => (
            <button
              key={option}
              style={{
                ...styles.option,
                background: getButtonColor(option),
                borderColor: getBorderColor(option),
              }}
              onClick={() => handleAnswer(option)}
            >
              {option}
            </button>
          ))}
        </div>

        {/* Show explanation after answering */}
        {showResult && (
          <div style={{
            ...styles.feedback,
            background: selectedAnswer === currentQuestion.correct ? "#d1fae5" : "#fee2e2",
            borderColor: selectedAnswer === currentQuestion.correct ? "#10b981" : "#ef4444",
          }}>
            <strong>
              {selectedAnswer === currentQuestion.correct ? "✅ Correct!" : `❌ Incorrect — the answer is "${currentQuestion.correct}"`}
            </strong>
            <p style={{ margin: "6px 0 0", fontSize: 13 }}>
              💡 {currentQuestion.explanation}
            </p>
          </div>
        )}

        {/* Next button — only appears after answering */}
        {showResult && (
          <button style={styles.nextButton} onClick={handleNext}>
            {questionIndex + 1 >= questions.length ? "See Results →" : "Next Question →"}
          </button>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1a7f4b 0%, #0d5c35 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily: "system-ui, sans-serif",
  },
  card: {
    background: "white",
    borderRadius: 20,
    padding: "32px 40px",
    maxWidth: 540,
    width: "100%",
    boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
  },
  progressBar: {
    height: 8,
    background: "#e5e7eb",
    borderRadius: 99,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressFill: {
    height: "100%",
    background: "#1a7f4b",
    borderRadius: 99,
    transition: "width 0.4s ease",
  },
  counter: { color: "#888", fontSize: 14, margin: "0 0 4px" },
  scoreLabel: { color: "#1a7f4b", fontWeight: 700, fontSize: 14, margin: "0 0 16px" },
  question: { fontSize: 20, fontWeight: 700, color: "#1a1a1a", margin: "0 0 24px", lineHeight: 1.4 },
  optionList: { display: "flex", flexDirection: "column", gap: 10 },
  option: {
    border: "2px solid #e0e0e0",
    borderRadius: 10,
    padding: "12px 16px",
    textAlign: "left",
    fontSize: 15,
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "system-ui, sans-serif",
  },
  feedback: {
    marginTop: 16,
    padding: "12px 16px",
    borderRadius: 10,
    border: "2px solid",
    fontSize: 14,
    lineHeight: 1.5,
  },
  nextButton: {
    marginTop: 16,
    width: "100%",
    background: "#1a7f4b",
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "13px 0",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
  },
};
