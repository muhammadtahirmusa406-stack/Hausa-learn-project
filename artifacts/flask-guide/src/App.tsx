// ============================================================
// App.tsx — The main entry point of a React app
//
// In Flask (Python), this would be your app.py file.
// It sets up the "routes" — which page shows for which URL.
//
// React equivalent:
//   "/" → Home page
//   "/quiz" → Quiz page
//   "/results" → Results page
// ============================================================

import { useState } from "react";
import HomePage from "./pages/HomePage";
import QuizPage from "./pages/QuizPage";
import ResultsPage from "./pages/ResultsPage";

// This "type" tells TypeScript what pages are allowed.
// In Python, you'd just use a string.
type Page = "home" | "quiz" | "results";

export default function App() {
  // useState is how React remembers things.
  // In Flask, you'd use session["current_page"] = "home"
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [finalScore, setFinalScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // This function handles "navigation" between pages.
  // In Flask, this is handled by redirect("/quiz")
  function goToQuiz() {
    setCurrentPage("quiz");
  }

  function goToResults(score: number, total: number) {
    setFinalScore(score);
    setTotalQuestions(total);
    setCurrentPage("results");
  }

  function goHome() {
    setCurrentPage("home");
  }

  // Render the correct page based on currentPage.
  // In Flask, each @app.route() function returns a template.
  return (
    <div>
      {currentPage === "home" && (
        <HomePage onStart={goToQuiz} />
      )}
      {currentPage === "quiz" && (
        <QuizPage onFinish={goToResults} />
      )}
      {currentPage === "results" && (
        <ResultsPage
          score={finalScore}
          total={totalQuestions}
          onRestart={goHome}
        />
      )}
    </div>
  );
}
