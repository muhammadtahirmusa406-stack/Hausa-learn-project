// ============================================================
// ResultsPage.tsx — Shows the final score
//
// Flask equivalent (app.py):
//
//   @app.route("/results")
//   def results():
//       score = session.get("score", 0)
//       total = len(questions)
//       percentage = (score / total) * 100
//
//       # Save score to database
//       db.execute("INSERT INTO scores (score, total, date) VALUES (?, ?, ?)",
//                  (score, total, datetime.now()))
//       db.commit()
//
//       # Clear session for next quiz
//       session.clear()
//
//       return render_template("results.html", score=score, total=total, percentage=percentage)
// ============================================================

type ResultsPageProps = {
  score: number;
  total: number;
  onRestart: () => void;
};

export default function ResultsPage({ score, total, onRestart }: ResultsPageProps) {
  // Calculate percentage — Python: percentage = (score / total) * 100
  const percentage = Math.round((score / total) * 100);

  // Pick a message based on how well the user did
  // Python: if percentage >= 80: message = "Excellent!"
  function getMessage() {
    if (percentage === 100) return { text: "Perfect Score! 🏆", color: "#d4af37" };
    if (percentage >= 80) return { text: "Excellent Work! 🌟", color: "#1a7f4b" };
    if (percentage >= 60) return { text: "Good Job! 👍", color: "#2563eb" };
    if (percentage >= 40) return { text: "Keep Practicing! 💪", color: "#d97706" };
    return { text: "Don't Give Up! 🔁", color: "#dc2626" };
  }

  const message = getMessage();

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Big score display */}
        <div style={styles.scoreCircle}>
          <div style={styles.scoreNumber}>{percentage}%</div>
          <div style={styles.scoreLabel}>Score</div>
        </div>

        {/* Message */}
        <h2 style={{ ...styles.message, color: message.color }}>
          {message.text}
        </h2>

        {/* Score breakdown */}
        <p style={styles.breakdown}>
          You got <strong>{score}</strong> out of <strong>{total}</strong> questions correct.
        </p>

        {/* Stats row */}
        <div style={styles.statsRow}>
          <StatBox label="Correct" value={score} color="#1a7f4b" />
          <StatBox label="Wrong" value={total - score} color="#dc2626" />
          <StatBox label="Total" value={total} color="#555" />
        </div>

        {/* Play again button */}
        {/* Flask: <a href="/">Try Again</a> */}
        <button style={styles.button} onClick={onRestart}>
          🔄 Try Again
        </button>

        {/* Code explanation box */}
        <div style={styles.codeBox}>
          <p style={styles.codeTitle}>🐍 How this would look in Flask:</p>
          <pre style={styles.code}>{`# Save the score to a database
db.execute(
  "INSERT INTO scores VALUES (?, ?, ?)",
  (${score}, ${total}, "today")
)
db.commit()

# Redirect home when user clicks Try Again
return redirect("/")`}
          </pre>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={styles.statBox}>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 13, color: "#888" }}>{label}</div>
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
    padding: "36px 40px",
    maxWidth: 480,
    width: "100%",
    textAlign: "center",
    boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #1a7f4b, #0d5c35)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  scoreNumber: { fontSize: 32, fontWeight: 900, color: "white" },
  scoreLabel: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: 600 },
  message: { fontSize: 24, fontWeight: 800, margin: "0 0 8px" },
  breakdown: { color: "#555", margin: "0 0 20px" },
  statsRow: { display: "flex", gap: 12, marginBottom: 24 },
  statBox: {
    flex: 1,
    background: "#f8f9fa",
    borderRadius: 12,
    padding: "14px 0",
  },
  button: {
    width: "100%",
    background: "#1a7f4b",
    color: "white",
    border: "none",
    borderRadius: 12,
    padding: "14px 0",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    marginBottom: 20,
  },
  codeBox: {
    background: "#1a1a2e",
    borderRadius: 12,
    padding: "14px 16px",
    textAlign: "left",
  },
  codeTitle: { color: "#aaa", fontSize: 12, margin: "0 0 8px", fontWeight: 600 },
  code: {
    color: "#a8ff78",
    fontSize: 12,
    margin: 0,
    lineHeight: 1.6,
    fontFamily: "monospace",
    whiteSpace: "pre-wrap",
  },
};
