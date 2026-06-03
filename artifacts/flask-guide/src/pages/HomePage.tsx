// ============================================================
// HomePage.tsx — The first page the user sees
//
// Flask equivalent (app.py):
//
//   @app.route("/")
//   def home():
//       return render_template("index.html")
//
// Flask equivalent (templates/index.html):
//   <h1>Hausa Quiz</h1>
//   <a href="/quiz">Start Quiz</a>
// ============================================================

type HomePageProps = {
  onStart: () => void; // A function that switches to the quiz page
};

export default function HomePage({ onStart }: HomePageProps) {
  return (
    <div style={styles.page}>
      {/* Header Section */}
      <div style={styles.card}>
        {/* Emoji icon */}
        <div style={styles.emoji}>🇳🇬</div>

        {/* Title */}
        <h1 style={styles.title}>Hausa Language Quiz</h1>

        {/* Subtitle */}
        <p style={styles.subtitle}>
          A simple quiz app to test your Hausa vocabulary.
          <br />
          <strong>10 questions · Multiple choice · Instant feedback</strong>
        </p>

        {/* Start button — clicking it calls the onStart function */}
        {/* In Flask this would be: <a href="/quiz">Start Quiz</a> */}
        <button style={styles.button} onClick={onStart}>
          ▶ Start Quiz
        </button>

        {/* Info box explaining what this is */}
        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            📚 <strong>Learning guide</strong> — This app is intentionally simple
            so you can study the code and rebuild it yourself in Python + Flask.
          </p>
        </div>
      </div>

      {/* Concept cards at the bottom */}
      <div style={styles.conceptRow}>
        <ConceptCard icon="🐍" title="Python" desc="The language you write the logic in" />
        <ConceptCard icon="🌶️" title="Flask" desc="The framework that runs your web server" />
        <ConceptCard icon="🎨" title="HTML" desc="The templates that display the pages" />
        <ConceptCard icon="💾" title="SQLite" desc="The database that stores scores" />
      </div>
    </div>
  );
}

// A small helper component — reusable UI piece
// In Flask/Jinja2, you'd use {% include "concept_card.html" %}
function ConceptCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={styles.concept}>
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div style={{ fontWeight: 700, marginTop: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>{desc}</div>
    </div>
  );
}

// ============================================================
// STYLES — In Flask you'd put this in static/style.css
// ============================================================
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1a7f4b 0%, #0d5c35 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily: "system-ui, sans-serif",
  },
  card: {
    background: "white",
    borderRadius: 20,
    padding: "40px 48px",
    maxWidth: 520,
    width: "100%",
    textAlign: "center",
    boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
  },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: 800, color: "#1a1a1a", margin: "0 0 8px" },
  subtitle: { color: "#555", lineHeight: 1.6, margin: "0 0 28px" },
  button: {
    background: "#1a7f4b",
    color: "white",
    border: "none",
    borderRadius: 12,
    padding: "14px 40px",
    fontSize: 17,
    fontWeight: 700,
    cursor: "pointer",
    marginBottom: 20,
  },
  infoBox: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 10,
    padding: "12px 16px",
    marginTop: 8,
  },
  infoText: { margin: 0, fontSize: 13, color: "#166534", lineHeight: 1.5 },
  conceptRow: {
    display: "flex",
    gap: 12,
    marginTop: 20,
    flexWrap: "wrap",
    justifyContent: "center",
    maxWidth: 560,
  },
  concept: {
    background: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: "14px 18px",
    color: "white",
    textAlign: "center",
    minWidth: 110,
  },
};
