// ============================================================
// questions.ts — Your app's DATA
//
// In Flask, this would typically be a Python list of dicts:
//
//   questions = [
//     {
//       "id": 1,
//       "question": "What does 'Sannu' mean?",
//       "options": ["Hello", "Goodbye", "Water", "Food"],
//       "correct": "Hello"
//     },
//     ...
//   ]
//
// In a real app, this data would come from a database (SQLite,
// PostgreSQL, etc.) instead of being written here directly.
// ============================================================

export type Question = {
  id: number;
  question: string;       // The question text
  options: string[];      // The 4 possible answers
  correct: string;        // The correct answer
  explanation: string;    // A fun fact to show after answering
};

// This is your quiz data — 10 beginner Hausa questions.
export const questions: Question[] = [
  {
    id: 1,
    question: "What does 'Sannu' mean in English?",
    options: ["Goodbye", "Hello", "Thank you", "Water"],
    correct: "Hello",
    explanation: "'Sannu' is the most common greeting in Hausa.",
  },
  {
    id: 2,
    question: "How do you say 'Thank you' in Hausa?",
    options: ["Yauwa", "Lafiya", "Na gode", "Barka"],
    correct: "Na gode",
    explanation: "'Na gode' literally means 'I am grateful'.",
  },
  {
    id: 3,
    question: "What does 'Ruwa' mean?",
    options: ["Food", "Fire", "Water", "House"],
    correct: "Water",
    explanation: "Ruwa is one of the first words Hausa children learn.",
  },
  {
    id: 4,
    question: "How do you say 'Yes' in Hausa?",
    options: ["A'a", "Yauwa", "Babu", "Ina"],
    correct: "Yauwa",
    explanation: "'Yauwa' means yes or okay. 'A\\'a' means no.",
  },
  {
    id: 5,
    question: "What does 'Abinci' mean?",
    options: ["Water", "Food", "Sleep", "Walk"],
    correct: "Food",
    explanation: "'Abinci' can refer to any type of meal or food.",
  },
  {
    id: 6,
    question: "How do you say 'My name is...' in Hausa?",
    options: ["Sunana ne...", "Ina so...", "Na zo...", "Ina gida..."],
    correct: "Sunana ne...",
    explanation: "'Suna' means name, '-na' means my, 'ne' is a linking word.",
  },
  {
    id: 7,
    question: "What does 'Gida' mean?",
    options: ["School", "Market", "House/Home", "Road"],
    correct: "House/Home",
    explanation: "'Gidan makaranta' means school — gidan = house of.",
  },
  {
    id: 8,
    question: "How do you say 'Good morning' in Hausa?",
    options: ["Barka da dare", "Barka da yamma", "Barka da asuba", "Barka da rana"],
    correct: "Barka da asuba",
    explanation: "'Asuba' = morning, 'yamma' = afternoon, 'dare' = night.",
  },
  {
    id: 9,
    question: "What does 'Ina son ka' mean?",
    options: ["I miss you", "I love you", "I see you", "I need you"],
    correct: "I love you",
    explanation: "'Ina son ka' (to a male) or 'Ina son ki' (to a female).",
  },
  {
    id: 10,
    question: "What does 'Lafiya' mean?",
    options: ["Hungry", "Tired", "Healthy/Fine", "Happy"],
    correct: "Healthy/Fine",
    explanation: "'Ina lafiya' means I am fine — a common response to greetings.",
  },
];
