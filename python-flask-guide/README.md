# Hausa Quiz — Python Flask Guide

A simple quiz app for learning Python + Flask. Copy this folder to PyCharm and follow the steps below.

## What you need to install

1. **Python** — download from python.org (version 3.8 or higher)
2. **PyCharm** — download the free Community Edition from jetbrains.com
3. **Flask** — installed via pip (see below)

## How to run this in PyCharm

**Step 1:** Copy this entire `python-flask-guide/` folder to your computer.

**Step 2:** Open PyCharm → File → Open → select the folder.

**Step 3:** Open the Terminal inside PyCharm (bottom panel).

**Step 4:** Type this and press Enter:
```
pip install flask
```

**Step 5:** Run the app:
```
python app.py
```

**Step 6:** Open your browser and go to:
```
http://localhost:5000
```

That's it — your quiz app is running! 🎉

---

## File structure explained

```
python-flask-guide/
│
├── app.py                  ← The main Python file (your server)
│
├── templates/              ← HTML files (your pages)
│   ├── index.html          ← Home page
│   ├── quiz.html           ← Quiz question page
│   └── results.html        ← Results page
│
└── static/                 ← CSS, images, JavaScript
    └── style.css           ← All the visual styling

quiz.db                     ← Created automatically when you run the app
                               This is your SQLite database
```

## Key concepts this app teaches

| Concept | Where to find it |
|---|---|
| Routes (`@app.route`) | `app.py` — every function with `@app.route` |
| Templates (`render_template`) | `app.py` + `templates/*.html` |
| Forms & POST requests | `templates/quiz.html` + the POST section of `app.py` |
| Sessions (remembering data) | `app.py` — `session["score"]`, `session["question_index"]` |
| Database (SQLite) | `app.py` — `sqlite3.connect()`, `cursor.execute()` |
| Jinja2 loops | `templates/quiz.html` — `{% for option in question.options %}` |
| Jinja2 if statements | `templates/results.html` — `{% if percentage >= 80 %}` |
| CSS styling | `static/style.css` |

## Practice exercises (try these yourself!)

1. **Easy:** Add 5 more questions to the `questions` list in `app.py`
2. **Easy:** Change the color scheme in `static/style.css`
3. **Medium:** Add a "hint" button that reveals a clue before answering
4. **Medium:** Add a timer that counts down from 30 seconds per question
5. **Hard:** Add a username field on the home page and save it with each score
6. **Hard:** Create an admin page that shows all saved scores from the database
