# ============================================================
# app.py — Your complete Flask quiz app
#
# HOW TO RUN IN PYCHARM:
# 1. Open PyCharm and create a new project
# 2. Copy this entire "python-flask-guide" folder into your project
# 3. Open the terminal in PyCharm and run:
#      pip install flask
# 4. Then run:
#      python app.py
# 5. Open your browser and go to: http://localhost:5000
# ============================================================

from flask import Flask, render_template, request, redirect, session
import sqlite3
import os
from datetime import datetime

# Create the Flask app object — this is the "engine" of your web server
app = Flask(__name__)

# Secret key — needed to use "sessions" (remembering things between pages)
# Change this to any random string in your own projects!
app.secret_key = "your-secret-key-change-this"

# ============================================================
# QUIZ DATA
# In a bigger app, this would come from a database.
# For now, it's a simple Python list of dictionaries.
# ============================================================
questions = [
    {
        "id": 1,
        "question": "What does 'Sannu' mean in English?",
        "options": ["Goodbye", "Hello", "Thank you", "Water"],
        "correct": "Hello",
        "explanation": "'Sannu' is the most common greeting in Hausa."
    },
    {
        "id": 2,
        "question": "How do you say 'Thank you' in Hausa?",
        "options": ["Yauwa", "Lafiya", "Na gode", "Barka"],
        "correct": "Na gode",
        "explanation": "'Na gode' literally means 'I am grateful'."
    },
    {
        "id": 3,
        "question": "What does 'Ruwa' mean?",
        "options": ["Food", "Fire", "Water", "House"],
        "correct": "Water",
        "explanation": "Ruwa is one of the first words Hausa children learn."
    },
    {
        "id": 4,
        "question": "How do you say 'Yes' in Hausa?",
        "options": ["A'a", "Yauwa", "Babu", "Ina"],
        "correct": "Yauwa",
        "explanation": "'Yauwa' means yes. 'A'a' means no."
    },
    {
        "id": 5,
        "question": "What does 'Abinci' mean?",
        "options": ["Water", "Food", "Sleep", "Walk"],
        "correct": "Food",
        "explanation": "'Abinci' can refer to any type of meal or food."
    },
    {
        "id": 6,
        "question": "How do you say 'My name is...' in Hausa?",
        "options": ["Sunana ne...", "Ina so...", "Na zo...", "Ina gida..."],
        "correct": "Sunana ne...",
        "explanation": "'Suna' means name, '-na' means my."
    },
    {
        "id": 7,
        "question": "What does 'Gida' mean?",
        "options": ["School", "Market", "House/Home", "Road"],
        "correct": "House/Home",
        "explanation": "'Gidan makaranta' means school — gidan = house of."
    },
    {
        "id": 8,
        "question": "How do you say 'Good morning' in Hausa?",
        "options": ["Barka da dare", "Barka da yamma", "Barka da asuba", "Barka da rana"],
        "correct": "Barka da asuba",
        "explanation": "'Asuba' = morning, 'yamma' = afternoon, 'dare' = night."
    },
    {
        "id": 9,
        "question": "What does 'Ina son ka' mean?",
        "options": ["I miss you", "I love you", "I see you", "I need you"],
        "correct": "I love you",
        "explanation": "'Ina son ka' (to a male) or 'Ina son ki' (to a female)."
    },
    {
        "id": 10,
        "question": "What does 'Lafiya' mean?",
        "options": ["Hungry", "Tired", "Healthy/Fine", "Happy"],
        "correct": "Healthy/Fine",
        "explanation": "'Ina lafiya' means I am fine."
    },
]


# ============================================================
# DATABASE SETUP
# SQLite is a simple file-based database — perfect for learning.
# The database file (quiz.db) will be created automatically.
# ============================================================
def init_db():
    """Create the database and table if they don't exist yet."""
    conn = sqlite3.connect("quiz.db")
    cursor = conn.cursor()

    # CREATE TABLE — creates a table to store quiz results
    # IF NOT EXISTS means it won't crash if the table already exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            score INTEGER NOT NULL,
            total INTEGER NOT NULL,
            percentage REAL NOT NULL,
            date TEXT NOT NULL
        )
    """)

    conn.commit()  # Save the changes
    conn.close()   # Close the connection


# ============================================================
# ROUTES — Each function handles a URL
# ============================================================

# Route 1: Home page — the "/" URL (e.g. http://localhost:5000/)
@app.route("/")
def home():
    """Show the home page with a Start button."""

    # Get the top 5 scores from the database to display
    conn = sqlite3.connect("quiz.db")
    cursor = conn.cursor()
    cursor.execute("SELECT score, total, percentage, date FROM scores ORDER BY score DESC LIMIT 5")
    top_scores = cursor.fetchall()  # Returns a list of results
    conn.close()

    # render_template loads an HTML file from the "templates" folder
    return render_template("index.html", top_scores=top_scores)


# Route 2: Quiz page — handles both showing the question (GET)
# and receiving the answer (POST)
@app.route("/quiz", methods=["GET", "POST"])
def quiz():
    """Show the current question or process the submitted answer."""

    # session is like a dictionary that remembers values between page loads
    # It's stored in a cookie on the user's browser

    if request.method == "POST":
        # The user submitted an answer — process it

        # Get the answer they selected from the form
        user_answer = request.form.get("answer")

        # Get the current question index from the session
        question_index = session.get("question_index", 0)

        # Get the correct answer for the current question
        correct_answer = questions[question_index]["correct"]

        # Check if correct and update the score
        if user_answer == correct_answer:
            session["score"] = session.get("score", 0) + 1

        # Move to the next question
        session["question_index"] = question_index + 1

        # If we've answered all questions, go to results
        if session["question_index"] >= len(questions):
            return redirect("/results")

        # Otherwise, reload the quiz page with the next question
        return redirect("/quiz")

    else:
        # GET request — show the quiz page

        # If this is the first visit, start fresh
        if "question_index" not in session:
            session["question_index"] = 0
            session["score"] = 0

        question_index = session["question_index"]

        # Get the current question
        question = questions[question_index]

        return render_template(
            "quiz.html",
            question=question,
            question_number=question_index + 1,    # Show "Question 3" not "Question 2"
            total_questions=len(questions),
            score=session.get("score", 0),
            progress=int((question_index / len(questions)) * 100)
        )


# Route 3: Results page
@app.route("/results")
def results():
    """Show the final score and save it to the database."""

    # Get the final score from the session
    score = session.get("score", 0)
    total = len(questions)
    percentage = round((score / total) * 100)

    # Decide on a message based on the score
    if percentage == 100:
        message = "Perfect Score! 🏆"
    elif percentage >= 80:
        message = "Excellent Work! 🌟"
    elif percentage >= 60:
        message = "Good Job! 👍"
    elif percentage >= 40:
        message = "Keep Practicing! 💪"
    else:
        message = "Don't Give Up! 🔁"

    # Save the score to the database
    conn = sqlite3.connect("quiz.db")
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO scores (score, total, percentage, date) VALUES (?, ?, ?, ?)",
        (score, total, percentage, datetime.now().strftime("%Y-%m-%d %H:%M"))
    )
    conn.commit()
    conn.close()

    # Clear the session so the next quiz starts fresh
    session.clear()

    return render_template(
        "results.html",
        score=score,
        total=total,
        percentage=percentage,
        message=message
    )


# Route 4: Restart — just redirects home (clears the session)
@app.route("/restart")
def restart():
    """Clear the session and go back to the home page."""
    session.clear()
    return redirect("/")


# ============================================================
# START THE SERVER
# This block only runs when you run: python app.py
# It does NOT run when Flask is imported by another file.
# ============================================================
if __name__ == "__main__":
    init_db()  # Make sure the database exists before starting
    print("🚀 Server running at http://localhost:5000")
    app.run(debug=True)  # debug=True shows errors in the browser
