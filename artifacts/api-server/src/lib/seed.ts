import { db } from "@workspace/db";
import {
  unitsTable,
  lessonsTable,
  exercisesTable,
  vocabularyTable,
  achievementsTable,
  dailyChallengesTable,
} from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

// ─── UNITS ────────────────────────────────────────────────────────────────────
const UNITS = [
  { title: "Basics", description: "Start your journey — letters, sounds, and your very first Hausa words.", iconEmoji: "📚", order: 1, xpRequired: 0 },
  { title: "Greetings & People", description: "Say hello, introduce yourself, and meet new friends the Hausa way.", iconEmoji: "👋", order: 2, xpRequired: 50 },
  { title: "Numbers & Time", description: "Count, tell the time, and talk about days and dates.", iconEmoji: "🔢", order: 3, xpRequired: 150 },
  { title: "Colors & Objects", description: "Describe the world around you with colors and everyday things.", iconEmoji: "🎨", order: 4, xpRequired: 300 },
  { title: "Food & Drinks", description: "Order food, shop at the market, and talk about your favourite dishes.", iconEmoji: "🍎", order: 5, xpRequired: 500 },
  { title: "Family & Home", description: "Talk about your family, your home, and daily routines.", iconEmoji: "🏠", order: 6, xpRequired: 700 },
];

// ─── LESSONS (unitIndex 0-based maps to UNITS array) ─────────────────────────
// Each lesson gets at least 15 exercises defined below.
const LESSONS = [
  // Unit 1 — Basics
  { unitIndex: 0, title: "Hausa Sounds & Alphabet", description: "Learn the sounds of Hausa and how letters are pronounced.", category: "Basics", xpReward: 20, order: 1, iconEmoji: "🔤" },
  { unitIndex: 0, title: "Essential Words", description: "The 10 most important Hausa words to know right away.", category: "Basics", xpReward: 20, order: 2, iconEmoji: "💬" },
  { unitIndex: 0, title: "Yes, No & Politeness", description: "Agree, disagree, say please and thank you.", category: "Basics", xpReward: 25, order: 3, iconEmoji: "🙏" },
  { unitIndex: 0, title: "Questions & Answers", description: "Ask and answer simple questions in Hausa.", category: "Basics", xpReward: 25, order: 4, iconEmoji: "❓" },

  // Unit 2 — Greetings
  { unitIndex: 1, title: "Everyday Greetings", description: "Good morning, good evening, and common hellos.", category: "Greetings", xpReward: 25, order: 5, iconEmoji: "☀️" },
  { unitIndex: 1, title: "Introducing Yourself", description: "Tell people your name and where you are from.", category: "Greetings", xpReward: 25, order: 6, iconEmoji: "🤝" },
  { unitIndex: 1, title: "How Are You?", description: "Ask and say how you are feeling in Hausa.", category: "Greetings", xpReward: 30, order: 7, iconEmoji: "😊" },
  { unitIndex: 1, title: "Saying Goodbye", description: "Polite farewells and see-you-later phrases.", category: "Greetings", xpReward: 30, order: 8, iconEmoji: "👋" },

  // Unit 3 — Numbers & Time
  { unitIndex: 2, title: "Numbers 1–10", description: "Count from one to ten in Hausa.", category: "Numbers", xpReward: 30, order: 9, iconEmoji: "🔢" },
  { unitIndex: 2, title: "Numbers 11–100", description: "Bigger numbers for shopping, age, and more.", category: "Numbers", xpReward: 30, order: 10, iconEmoji: "💯" },
  { unitIndex: 2, title: "Telling the Time", description: "Say what time it is and talk about the day.", category: "Numbers", xpReward: 35, order: 11, iconEmoji: "⏰" },
  { unitIndex: 2, title: "Days & Months", description: "Days of the week and months of the year.", category: "Numbers", xpReward: 35, order: 12, iconEmoji: "📅" },

  // Unit 4 — Colors & Objects
  { unitIndex: 3, title: "Colors", description: "Name all the colors of the rainbow in Hausa.", category: "Colors", xpReward: 30, order: 13, iconEmoji: "🌈" },
  { unitIndex: 3, title: "Everyday Objects", description: "Books, chairs, phones — things you see every day.", category: "Colors", xpReward: 30, order: 14, iconEmoji: "📱" },
  { unitIndex: 3, title: "Describing Things", description: "Big, small, old, new — adjectives in Hausa.", category: "Colors", xpReward: 35, order: 15, iconEmoji: "🔍" },

  // Unit 5 — Food & Drinks
  { unitIndex: 4, title: "Common Foods", description: "Rice, beans, suya — learn Hausa food words.", category: "Food", xpReward: 35, order: 16, iconEmoji: "🍚" },
  { unitIndex: 4, title: "Drinks & Beverages", description: "Water, tea, juice — drinks in Hausa.", category: "Food", xpReward: 35, order: 17, iconEmoji: "🥤" },
  { unitIndex: 4, title: "At the Market", description: "Buy, sell, and bargain at the Hausa market.", category: "Food", xpReward: 40, order: 18, iconEmoji: "🛒" },
  { unitIndex: 4, title: "Cooking Words", description: "Cook, boil, fry — kitchen vocabulary.", category: "Food", xpReward: 40, order: 19, iconEmoji: "🍳" },

  // Unit 6 — Family & Home
  { unitIndex: 5, title: "Family Members", description: "Father, mother, brother, sister — your family tree.", category: "Family", xpReward: 40, order: 20, iconEmoji: "👨‍👩‍👧" },
  { unitIndex: 5, title: "Rooms in a House", description: "Kitchen, bedroom, bathroom — rooms and spaces.", category: "Family", xpReward: 40, order: 21, iconEmoji: "🏠" },
  { unitIndex: 5, title: "Daily Routines", description: "Wake up, eat, sleep — talk about your day.", category: "Family", xpReward: 45, order: 22, iconEmoji: "🌅" },
];

// ─── EXERCISES (lessonIndex 0-based, maps to LESSONS array) ──────────────────
// Each lesson gets at least 15 exercises mixing multiple_choice, translation,
// fill_blank, typing, listening, and word_ordering.
type ExDef = {
  lessonIndex: number;
  type: "multiple_choice" | "translation" | "fill_blank" | "typing" | "listening" | "word_ordering";
  question: string;
  hausa?: string;
  english?: string;
  options: string[];
  correctAnswer: string;
  hint?: string;
  explanation?: string;
  audioWord?: string;
  order: number;
};

const EXERCISES: ExDef[] = [
  // ── Lesson 0: Hausa Sounds & Alphabet ─────────────────────────────────────
  { lessonIndex: 0, type: "multiple_choice", question: "What sound does 'ts' make in Hausa?", options: ["Like 'ch' in English", "A sharp 'ts' click", "Like 'sh'", "Silent"], correctAnswer: "A sharp 'ts' click", explanation: "'ts' in Hausa is a distinctive affricate sound unique to the language.", order: 1 },
  { lessonIndex: 0, type: "multiple_choice", question: "Hausa is written in which script?", options: ["Arabic only", "Latin only", "Both Latin (Boko) and Arabic (Ajami)", "Cyrillic"], correctAnswer: "Both Latin (Boko) and Arabic (Ajami)", explanation: "Hausa uses two scripts: the modern Latin Boko and the traditional Arabic Ajami.", order: 2 },
  { lessonIndex: 0, type: "multiple_choice", question: "How many tones does Hausa have?", options: ["1", "2", "3", "4"], correctAnswer: "3", explanation: "Hausa has three tones: high (´), low (`), and falling (^).", order: 3 },
  { lessonIndex: 0, type: "translation", question: "How do you say 'yes' in Hausa?", hausa: "I / Ee", english: "yes", options: ["I / Ee", "A'a", "Ina", "Kai"], correctAnswer: "I / Ee", explanation: "'I' or 'Ee' is the standard Hausa word for yes.", audioWord: "Ee", order: 4 },
  { lessonIndex: 0, type: "translation", question: "How do you say 'no' in Hausa?", hausa: "A'a", english: "no", options: ["I", "A'a", "Ina", "Ba"], correctAnswer: "A'a", explanation: "'A'a' means no in Hausa, with a glottal stop in the middle.", audioWord: "A'a", order: 5 },
  { lessonIndex: 0, type: "multiple_choice", question: "Which letter is unique to Hausa?", options: ["b", "ƴ (hooked y)", "r", "s"], correctAnswer: "ƴ (hooked y)", explanation: "ƴ (hooked y) represents a voiced palatal approximant unique to Hausa.", order: 6 },
  { lessonIndex: 0, type: "fill_blank", question: "Complete the Hausa word for water: 'ru___'", options: ["wa", "fi", "ko", "de"], correctAnswer: "fi", hint: "Water in Hausa is 'ruwa'", audioWord: "ruwa", order: 7 },
  { lessonIndex: 0, type: "multiple_choice", question: "What does the glottal stop (') represent in Hausa?", options: ["A pause between vowels", "A rolled r", "A nasal sound", "A silent letter"], correctAnswer: "A pause between vowels", explanation: "The glottal stop creates a brief closure of the vocal cords between sounds.", order: 8 },
  { lessonIndex: 0, type: "translation", question: "Translate: 'Ruwa'", hausa: "Ruwa", english: "Water", options: ["Fire", "Water", "Earth", "Wind"], correctAnswer: "Water", audioWord: "Ruwa", order: 9 },
  { lessonIndex: 0, type: "multiple_choice", question: "How is 'kw' pronounced in Hausa?", options: ["Like English 'kw'", "Like 'k' alone", "Like 'gw'", "Silent"], correctAnswer: "Like English 'kw'", explanation: "Hausa 'kw' is a labialized velar sound, similar to English.", order: 10 },
  { lessonIndex: 0, type: "fill_blank", question: "Fill in: 'San___ mu' means 'our town'", options: ["da", "nu", "di", "ta"], correctAnswer: "da", hint: "The word is 'Sandar mu'... no — try 'Sando mu'... it's 'gari'", order: 11 },
  { lessonIndex: 0, type: "translation", question: "What is 'gida' in English?", hausa: "Gida", english: "House/Home", options: ["School", "Market", "House/Home", "Road"], correctAnswer: "House/Home", audioWord: "gida", order: 12 },
  { lessonIndex: 0, type: "multiple_choice", question: "Which vowel is NOT in Hausa?", options: ["a", "e", "o", "ü"], correctAnswer: "ü", explanation: "Hausa vowels are a, e, i, o, u — no umlauts.", order: 13 },
  { lessonIndex: 0, type: "typing", question: "Type the Hausa word for 'house'", options: [], correctAnswer: "gida", hint: "Sounds like 'gee-dah'", order: 14 },
  { lessonIndex: 0, type: "multiple_choice", question: "In Hausa, long vowels are written as:", options: ["With an accent mark", "Double letters (aa, ii, uu)", "Capital letters", "With a macron"], correctAnswer: "Double letters (aa, ii, uu)", explanation: "Hausa long vowels are represented by doubling the vowel letter.", order: 15 },
  { lessonIndex: 0, type: "listening", question: "Listen and type the Hausa word you hear for water.", hausa: "Ruwa", english: "Water", options: [], correctAnswer: "ruwa", audioWord: "Ruwa", order: 16 },
  { lessonIndex: 0, type: "word_ordering", question: "Arrange the words to say: 'I want water'.", options: ["ruwa", "Ina", "son"], correctAnswer: "Ina son ruwa", order: 17 },

  // ── Lesson 1: Essential Words ───────────────────────────────────────────────
  { lessonIndex: 1, type: "translation", question: "What does 'Sannu' mean?", hausa: "Sannu", english: "Hello / Greetings", options: ["Goodbye", "Hello / Greetings", "Thank you", "Sorry"], correctAnswer: "Hello / Greetings", audioWord: "Sannu", order: 1 },
  { lessonIndex: 1, type: "translation", question: "Translate: 'Nagode'", hausa: "Nagode", english: "Thank you", options: ["Goodbye", "Hello", "Thank you", "Please"], correctAnswer: "Thank you", audioWord: "Nagode", order: 2 },
  { lessonIndex: 1, type: "multiple_choice", question: "What does 'Yawwa' mean?", options: ["No", "OK / Alright", "Sorry", "Please"], correctAnswer: "OK / Alright", explanation: "'Yawwa' is an informal way to say okay or alright.", order: 3 },
  { lessonIndex: 1, type: "translation", question: "How do you say 'Please' in Hausa?", hausa: "Don Allah", english: "Please / For God's sake", options: ["Nagode", "Don Allah", "Sannu", "Yauwa"], correctAnswer: "Don Allah", audioWord: "Don Allah", order: 4 },
  { lessonIndex: 1, type: "fill_blank", question: "Complete: 'Na___ da ji' (I am sorry)", options: ["ji", "yi", "ki", "yi"], correctAnswer: "yi", hint: "Naji? No — 'Na yi hakuri'", order: 5 },
  { lessonIndex: 1, type: "multiple_choice", question: "How do you say 'My name is...' in Hausa?", options: ["Suna na...", "Ina na...", "Ka na...", "Da na..."], correctAnswer: "Suna na...", explanation: "'Suna na' means 'my name is' in Hausa.", order: 6 },
  { lessonIndex: 1, type: "translation", question: "What does 'Lafiya' mean?", hausa: "Lafiya", english: "Health / Fine / Peace", options: ["Sick", "Tired", "Health / Fine / Peace", "Angry"], correctAnswer: "Health / Fine / Peace", audioWord: "Lafiya", order: 7 },
  { lessonIndex: 1, type: "multiple_choice", question: "How do you say 'I don't understand'?", options: ["Ban fahimta ba", "Na fahimta", "Ka fahimta", "Ina fahimta"], correctAnswer: "Ban fahimta ba", explanation: "'Ban fahimta ba' uses the negative frame ban...ba.", order: 8 },
  { lessonIndex: 1, type: "translation", question: "Translate: 'Ruwa'", hausa: "Ruwa", english: "Water", options: ["Food", "Fire", "Water", "Earth"], correctAnswer: "Water", audioWord: "Ruwa", order: 9 },
  { lessonIndex: 1, type: "fill_blank", question: "Fill in: '___ na?' means 'Where is it?'", options: ["Ina", "Wane", "Yaya", "Ko"], correctAnswer: "Ina", hint: "'Ina' means 'where'", audioWord: "Ina", order: 10 },
  { lessonIndex: 1, type: "multiple_choice", question: "What is 'gari' in English?", options: ["Village / Town", "Mountain", "River", "Sky"], correctAnswer: "Village / Town", explanation: "'Gari' means town or village and is used very commonly.", order: 11 },
  { lessonIndex: 1, type: "translation", question: "Translate: 'Allah ya kiyaye'", hausa: "Allah ya kiyaye", english: "God protect you / Goodbye", options: ["Good morning", "God protect you / Goodbye", "See you tomorrow", "Come back"], correctAnswer: "God protect you / Goodbye", order: 12 },
  { lessonIndex: 1, type: "typing", question: "Type the Hausa word for 'thank you'", options: [], correctAnswer: "nagode", hint: "Sounds like 'nah-go-day'", order: 13 },
  { lessonIndex: 1, type: "multiple_choice", question: "Which phrase means 'Excuse me'?", options: ["Yi hakuri", "Na gode", "Ina kwana", "Yawwa"], correctAnswer: "Yi hakuri", explanation: "'Yi hakuri' is used to excuse yourself or ask for patience.", order: 14 },
  { lessonIndex: 1, type: "translation", question: "What does 'Abinci' mean?", hausa: "Abinci", english: "Food", options: ["Water", "Drink", "Food", "Money"], correctAnswer: "Food", audioWord: "Abinci", order: 15 },

  // ── Lesson 2: Yes, No & Politeness ─────────────────────────────────────────
  { lessonIndex: 2, type: "translation", question: "How do you say 'yes'?", hausa: "I / Ee", english: "Yes", options: ["A'a", "I / Ee", "Ba", "Ko"], correctAnswer: "I / Ee", audioWord: "Ee", order: 1 },
  { lessonIndex: 2, type: "translation", question: "How do you say 'no'?", hausa: "A'a", english: "No", options: ["I", "A'a", "Ai", "Wai"], correctAnswer: "A'a", audioWord: "A'a", order: 2 },
  { lessonIndex: 2, type: "multiple_choice", question: "What does 'Don Allah' literally mean?", options: ["For Allah / Please", "Thank God", "God bless", "By God"], correctAnswer: "For Allah / Please", explanation: "'Don Allah' literally means 'for the sake of Allah' and is used as 'please'.", order: 3 },
  { lessonIndex: 2, type: "fill_blank", question: "Complete: 'Na gode ___' to say 'thank you very much'", options: ["sosai", "dai", "kadan", "gane"], correctAnswer: "sosai", hint: "'Sosai' means 'very much'", audioWord: "sosai", order: 4 },
  { lessonIndex: 2, type: "translation", question: "How do you say 'You're welcome'?", hausa: "Babu damuwa / Ai in sha Allah", english: "You're welcome", options: ["Thank you", "You're welcome", "I'm sorry", "No problem"], correctAnswer: "You're welcome", order: 5 },
  { lessonIndex: 2, type: "multiple_choice", question: "How do you apologise in Hausa?", options: ["Na yi hakuri / Yi hakuri da ni", "Na gode", "In sha Allah", "Nagode"], correctAnswer: "Na yi hakuri / Yi hakuri da ni", explanation: "'Na yi hakuri' means I am sorry / I ask for your patience.", order: 6 },
  { lessonIndex: 2, type: "translation", question: "What does 'Yi hakuri' mean?", hausa: "Yi hakuri", english: "Be patient / Excuse me / Sorry", options: ["Hurry up", "Be patient / Excuse me / Sorry", "Come here", "Go away"], correctAnswer: "Be patient / Excuse me / Sorry", audioWord: "Yi hakuri", order: 7 },
  { lessonIndex: 2, type: "fill_blank", question: "Fill in: '___ sha Allah' (God willing)", options: ["In", "Da", "Bi", "Ko"], correctAnswer: "In", hint: "A phrase used for future plans — 'In sha Allah'", order: 8 },
  { lessonIndex: 2, type: "multiple_choice", question: "Which phrase shows agreement?", options: ["Yawwa / Yau", "A'a", "Ba ni so", "Kada"], correctAnswer: "Yawwa / Yau", explanation: "'Yawwa' expresses agreement or acknowledgement.", order: 9 },
  { lessonIndex: 2, type: "translation", question: "Translate: 'Babu damuwa'", hausa: "Babu damuwa", english: "No problem / Don't worry", options: ["Big problem", "No problem / Don't worry", "Be careful", "Stop"], correctAnswer: "No problem / Don't worry", audioWord: "Babu damuwa", order: 10 },
  { lessonIndex: 2, type: "typing", question: "Type 'please' in Hausa", options: [], correctAnswer: "don allah", hint: "Two words: 'don' and 'allah'", order: 11 },
  { lessonIndex: 2, type: "multiple_choice", question: "What does 'Alhamdulillah' express?", options: ["Thanks to God / Gratitude", "Goodbye", "I am tired", "Hello"], correctAnswer: "Thanks to God / Gratitude", explanation: "Alhamdulillah (Praise be to God) is used to express thankfulness.", order: 12 },
  { lessonIndex: 2, type: "fill_blank", question: "'___ da zuwa' means 'welcome' (thanks for coming)", options: ["Na gode", "Sannu", "Ai", "Ba"], correctAnswer: "Sannu", hint: "'Sannu da zuwa' is a warm welcome phrase", order: 13 },
  { lessonIndex: 2, type: "translation", question: "How do you say 'It doesn't matter'?", hausa: "Babu laifi", english: "No problem / It doesn't matter", options: ["Big deal", "No problem / It doesn't matter", "I don't like it", "Stop that"], correctAnswer: "No problem / It doesn't matter", order: 14 },
  { lessonIndex: 2, type: "multiple_choice", question: "The polite suffix '-ki' is used for:", options: ["Females", "Males", "Children", "Elders only"], correctAnswer: "Females", explanation: "In Hausa, -ki is the feminine second-person suffix; -ka is masculine.", order: 15 },

  // ── Lesson 3: Questions & Answers ──────────────────────────────────────────
  { lessonIndex: 3, type: "translation", question: "How do you say 'Where?'", hausa: "Ina?", english: "Where?", options: ["Yaushe?", "Wane?", "Ina?", "Me?"], correctAnswer: "Ina?", audioWord: "Ina", order: 1 },
  { lessonIndex: 3, type: "translation", question: "How do you say 'What?'", hausa: "Me? / Mece?", english: "What?", options: ["Yaushe?", "Me? / Mece?", "Ina?", "Wane?"], correctAnswer: "Me? / Mece?", audioWord: "Me", order: 2 },
  { lessonIndex: 3, type: "multiple_choice", question: "How do you say 'Who?' in Hausa?", options: ["Wane / Wace", "Yaya", "Me", "Ina"], correctAnswer: "Wane / Wace", explanation: "'Wane' (masc.) and 'Wace' (fem.) both mean 'who'.", order: 3 },
  { lessonIndex: 3, type: "translation", question: "Translate: 'Yaushe?'", hausa: "Yaushe?", english: "When?", options: ["Why?", "How?", "When?", "Which?"], correctAnswer: "When?", audioWord: "Yaushe", order: 4 },
  { lessonIndex: 3, type: "fill_blank", question: "'___ ya zo?' — 'Who came?'", options: ["Wane", "Me", "Ina", "Da"], correctAnswer: "Wane", hint: "Use the masculine form of 'who'", order: 5 },
  { lessonIndex: 3, type: "multiple_choice", question: "How do you ask 'How much?'", options: ["Nawa ne?", "Me ne?", "Ina ne?", "Wane ne?"], correctAnswer: "Nawa ne?", explanation: "'Nawa ne?' means 'how much/many is it?'", order: 6 },
  { lessonIndex: 3, type: "translation", question: "What does 'Yaya?' mean?", hausa: "Yaya?", english: "How? / How are you?", options: ["When?", "How? / How are you?", "Where?", "Why?"], correctAnswer: "How? / How are you?", audioWord: "Yaya", order: 7 },
  { lessonIndex: 3, type: "fill_blank", question: "'___ ne?' means 'What is it?'", options: ["Me", "Wane", "Ina", "Da"], correctAnswer: "Me", hint: "'Me' means 'what'", audioWord: "Me", order: 8 },
  { lessonIndex: 3, type: "multiple_choice", question: "How do you ask someone's name?", options: ["Yaya sunanka?", "Ina kai?", "Menene wannan?", "Nawa ne?"], correctAnswer: "Yaya sunanka?", explanation: "'Yaya sunanka?' means 'What is your name?' (to a male).", order: 9 },
  { lessonIndex: 3, type: "translation", question: "Translate: 'Daga ina kuke?'", hausa: "Daga ina kuke?", english: "Where are you from?", options: ["What are you doing?", "Where are you from?", "How old are you?", "Where is the market?"], correctAnswer: "Where are you from?", order: 10 },
  { lessonIndex: 3, type: "typing", question: "Type 'where' in Hausa", options: [], correctAnswer: "ina", hint: "A two-letter word", order: 11 },
  { lessonIndex: 3, type: "multiple_choice", question: "'Menene wannan?' means:", options: ["What is this?", "Who is this?", "Where is this?", "How much is this?"], correctAnswer: "What is this?", explanation: "'Menene' is a form of 'what' and 'wannan' means 'this'.", order: 12 },
  { lessonIndex: 3, type: "fill_blank", question: "'___ kake?' means 'What are you doing?'", options: ["Me", "Ina", "Ko", "Da"], correctAnswer: "Me", hint: "Use the question word for 'what'", order: 13 },
  { lessonIndex: 3, type: "translation", question: "How do you say 'I don't know'?", hausa: "Ban sani ba", english: "I don't know", options: ["I know", "I don't know", "I forgot", "I don't care"], correctAnswer: "I don't know", audioWord: "Ban sani ba", order: 14 },
  { lessonIndex: 3, type: "multiple_choice", question: "The Hausa negative frame uses:", options: ["ban...ba", "no...not", "ba...ko", "ai...ba"], correctAnswer: "ban...ba", explanation: "The Hausa negative is formed with 'ban' before the verb and 'ba' at the end.", order: 15 },

  // ── Lesson 4: Everyday Greetings ───────────────────────────────────────────
  { lessonIndex: 4, type: "translation", question: "How do you say 'Good morning'?", hausa: "Ina kwana?", english: "Good morning (How did you sleep?)", options: ["Ina wuni?", "Ina kwana?", "Ina yini?", "Sannu da yamma"], correctAnswer: "Ina kwana?", audioWord: "Ina kwana", order: 1 },
  { lessonIndex: 4, type: "translation", question: "What is the reply to 'Ina kwana?'", hausa: "Lafiya lau", english: "Very well (in good health)", options: ["Nagode", "Lafiya lau", "A'a", "Yawwa"], correctAnswer: "Lafiya lau", audioWord: "Lafiya lau", order: 2 },
  { lessonIndex: 4, type: "multiple_choice", question: "'Ina wuni?' is used:", options: ["In the morning", "In the afternoon/evening", "At night", "Any time"], correctAnswer: "In the afternoon/evening", explanation: "'Ina wuni?' asks 'How is the day going?' and is an afternoon greeting.", order: 3 },
  { lessonIndex: 4, type: "translation", question: "Translate: 'Sannu da yamma'", hausa: "Sannu da yamma", english: "Good evening", options: ["Good morning", "Goodnight", "Good evening", "Hello"], correctAnswer: "Good evening", audioWord: "Sannu da yamma", order: 4 },
  { lessonIndex: 4, type: "fill_blank", question: "'Barka da ___' is a blessing greeting for festivals", options: ["sallah", "kwana", "lafiya", "gobe"], correctAnswer: "sallah", hint: "Used during Eid celebrations", order: 5 },
  { lessonIndex: 4, type: "multiple_choice", question: "How do you greet an elder respectfully?", options: ["Salamu alaikum", "Yawwa", "Ban sani ba", "Abinci"], correctAnswer: "Salamu alaikum", explanation: "'Salamu alaikum' (Peace be upon you) is the traditional Islamic greeting used with elders.", order: 6 },
  { lessonIndex: 4, type: "translation", question: "What does 'Wa alaikum salam' mean?", hausa: "Wa alaikum salam", english: "And upon you peace (reply to Salamu alaikum)", options: ["How are you?", "And upon you peace", "God bless you", "Thank you"], correctAnswer: "And upon you peace", audioWord: "Wa alaikum salam", order: 7 },
  { lessonIndex: 4, type: "fill_blank", question: "'Sannu da ___' — 'Hello, welcome'", options: ["zuwa", "da", "na", "bi"], correctAnswer: "zuwa", hint: "'Zuwa' means 'coming'", order: 8 },
  { lessonIndex: 4, type: "multiple_choice", question: "'Barka da asuba' means:", options: ["Good morning", "Good night", "Good afternoon", "God bless the morning"], correctAnswer: "Good morning", explanation: "'Barka da asuba' is a blessing for the morning.", order: 9 },
  { lessonIndex: 4, type: "translation", question: "How do you ask 'How is your family?'", hausa: "Iyalinka fa?", english: "How is your family?", options: ["How old are you?", "How is your family?", "Who are you?", "Where are you from?"], correctAnswer: "How is your family?", audioWord: "Iyalinka fa", order: 10 },
  { lessonIndex: 4, type: "typing", question: "Type 'good morning' in Hausa", options: [], correctAnswer: "ina kwana", hint: "Literally 'how did you sleep'", order: 11 },
  { lessonIndex: 4, type: "multiple_choice", question: "'Lafiya lau' means:", options: ["In great health / Very well", "A little sick", "I'm tired", "Not bad"], correctAnswer: "In great health / Very well", explanation: "'Lafiya lau' is a cheerful reply meaning in excellent health.", order: 12 },
  { lessonIndex: 4, type: "fill_blank", question: "'Ina ___ lafiya' — 'I am fine'", options: ["da", "yi", "na", "ma"], correctAnswer: "da", hint: "'Da' connects 'Ina' with 'lafiya'", order: 13 },
  { lessonIndex: 4, type: "translation", question: "Translate: 'Gobe sai an jima'", hausa: "Gobe sai an jima", english: "See you tomorrow", options: ["Goodbye forever", "See you later", "See you tomorrow", "Until next time"], correctAnswer: "See you tomorrow", order: 14 },
  { lessonIndex: 4, type: "multiple_choice", question: "Which greeting is used at night?", options: ["Ina kwana (at sleep time)", "Ina wuni", "Ina yini", "Barka da asuba"], correctAnswer: "Ina kwana (at sleep time)", explanation: "'Ina kwana?' is used before sleeping and also as a morning greeting.", order: 15 },

  // ── Lesson 5: Introducing Yourself ─────────────────────────────────────────
  { lessonIndex: 5, type: "translation", question: "How do you say 'My name is Ali'?", hausa: "Sunana Ali ne", english: "My name is Ali", options: ["Ni Ali ne", "Sunana Ali ne", "Ali ne ni", "Suna Ali"], correctAnswer: "Sunana Ali ne", audioWord: "Sunana", order: 1 },
  { lessonIndex: 5, type: "multiple_choice", question: "How do you ask someone's name in Hausa?", options: ["Yaya sunanka?", "Ina kai?", "Ko kai ne?", "Wane ne?"], correctAnswer: "Yaya sunanka?", explanation: "'Yaya sunanka?' asks 'What is your name?' to a male.", order: 2 },
  { lessonIndex: 5, type: "translation", question: "How do you say 'I am from Lagos'?", hausa: "Na fito daga Lagos", english: "I am from Lagos", options: ["I live in Lagos", "I am from Lagos", "Lagos is my home", "I like Lagos"], correctAnswer: "I am from Lagos", audioWord: "Na fito daga", order: 3 },
  { lessonIndex: 5, type: "fill_blank", question: "'Ina yin ___ a Nigeria' — 'I live in Nigeria'", options: ["zama", "aiki", "wasa", "karatu"], correctAnswer: "zama", hint: "'Zama' means to live/reside", order: 4 },
  { lessonIndex: 5, type: "multiple_choice", question: "How do you say 'I am a student'?", options: ["Ni dalibi ne", "Ni malami ne", "Ni likita ne", "Ni ɗan kasuwa ne"], correctAnswer: "Ni dalibi ne", explanation: "'Dalibi' means student in Hausa.", order: 5 },
  { lessonIndex: 5, type: "translation", question: "What does 'Shekarana' mean?", hausa: "Shekarana", english: "My age", options: ["My name", "My age", "My home", "My work"], correctAnswer: "My age", audioWord: "Shekarana", order: 6 },
  { lessonIndex: 5, type: "fill_blank", question: "'Ina da shekara ___' — 'I am ___ years old'", options: ["ashirin", "ruwa", "gida", "abinci"], correctAnswer: "ashirin", hint: "'Ashirin' = 20", order: 7 },
  { lessonIndex: 5, type: "multiple_choice", question: "How do you say 'Nice to meet you'?", options: ["Na faranta mini rai da saninku", "Na gode da ku", "Ina kwana", "Yawwa dai"], correctAnswer: "Na faranta mini rai da saninku", explanation: "This phrase expresses pleasure in meeting someone.", order: 8 },
  { lessonIndex: 5, type: "translation", question: "Translate: 'Masu magana da Hausa'", hausa: "Masu magana da Hausa", english: "Hausa speakers", options: ["Hausa speakers", "Hausa learners", "Hausa teachers", "Hausa country"], correctAnswer: "Hausa speakers", order: 9 },
  { lessonIndex: 5, type: "typing", question: "Type 'my name is' in Hausa (first two words)", options: [], correctAnswer: "sunana", hint: "Suna + na = my name", order: 10 },
  { lessonIndex: 5, type: "multiple_choice", question: "'Ni malami ne' means:", options: ["I am a teacher", "I am a doctor", "I am a student", "I am a driver"], correctAnswer: "I am a teacher", explanation: "'Malami' means teacher in Hausa.", order: 11 },
  { lessonIndex: 5, type: "fill_blank", question: "'Harshe na shi ne ___' — 'His language is ___'", options: ["Hausa", "Yoruba", "Igbo", "English"], correctAnswer: "Hausa", hint: "He speaks Hausa", order: 12 },
  { lessonIndex: 5, type: "translation", question: "Translate: 'Ina son koyon Hausa'", hausa: "Ina son koyon Hausa", english: "I love learning Hausa", options: ["I speak Hausa", "I love learning Hausa", "I teach Hausa", "I study Hausa"], correctAnswer: "I love learning Hausa", order: 13 },
  { lessonIndex: 5, type: "multiple_choice", question: "How do you say 'I am happy'?", options: ["Ina farin ciki", "Ina bakin ciki", "Ina gajiya", "Ina ciwo"], correctAnswer: "Ina farin ciki", explanation: "'Farin ciki' literally means 'white heart' — happiness.", order: 14 },
  { lessonIndex: 5, type: "typing", question: "Type 'I am from' in Hausa", options: [], correctAnswer: "na fito daga", hint: "Three words — 'na fito daga'", order: 15 },

  // ── Lesson 6: How Are You? ──────────────────────────────────────────────────
  { lessonIndex: 6, type: "translation", question: "How do you ask 'How are you?'", hausa: "Yaya kake?", english: "How are you? (to a male)", options: ["Ina kai?", "Yaya kake?", "Ko lafiya?", "Yaushe?"], correctAnswer: "Yaya kake?", audioWord: "Yaya kake", order: 1 },
  { lessonIndex: 6, type: "multiple_choice", question: "What is the female form of 'Yaya kake?'", options: ["Yaya kikee?", "Yaya kike?", "Yaya kuki?", "Yaya ki?"], correctAnswer: "Yaya kike?", explanation: "The female form uses 'kike' instead of 'kake'.", order: 2 },
  { lessonIndex: 6, type: "translation", question: "Translate: 'Ina lafiya'", hausa: "Ina lafiya", english: "I am fine", options: ["I am sick", "I am tired", "I am fine", "I am happy"], correctAnswer: "I am fine", audioWord: "Ina lafiya", order: 3 },
  { lessonIndex: 6, type: "fill_blank", question: "'Ina ___ sosai' — 'I am very well'", options: ["lafiya", "ciwo", "bacci", "gajiya"], correctAnswer: "lafiya", audioWord: "lafiya", order: 4 },
  { lessonIndex: 6, type: "multiple_choice", question: "How do you say 'I am tired'?", options: ["Ina gajiya", "Ina ciwo", "Ina farin ciki", "Ina barci"], correctAnswer: "Ina gajiya", explanation: "'Gajiya' means tiredness/fatigue.", order: 5 },
  { lessonIndex: 6, type: "translation", question: "Translate: 'Ina ciwo'", hausa: "Ina ciwo", english: "I am sick", options: ["I am happy", "I am tired", "I am sick", "I am hungry"], correctAnswer: "I am sick", audioWord: "Ina ciwo", order: 6 },
  { lessonIndex: 6, type: "fill_blank", question: "'Ina ___ ciki' — 'I am hungry'", options: ["yunwa", "farin", "bakin", "barci"], correctAnswer: "yunwa", hint: "'Yunwa' means hunger", audioWord: "yunwa", order: 7 },
  { lessonIndex: 6, type: "multiple_choice", question: "'Ina barci' means:", options: ["I am sleeping / tired", "I am eating", "I am working", "I am happy"], correctAnswer: "I am sleeping / tired", explanation: "'Barci' means sleep.", order: 8 },
  { lessonIndex: 6, type: "translation", question: "How do you say 'I am happy'?", hausa: "Ina farin ciki", english: "I am happy", options: ["I am sad", "I am angry", "I am happy", "I am scared"], correctAnswer: "I am happy", audioWord: "Ina farin ciki", order: 9 },
  { lessonIndex: 6, type: "typing", question: "Type 'I am fine' in Hausa", options: [], correctAnswer: "ina lafiya", hint: "Two words: 'Ina' and 'lafiya'", order: 10 },
  { lessonIndex: 6, type: "multiple_choice", question: "'Ina bakin ciki' means:", options: ["I am sad / downhearted", "I am angry", "I am excited", "I am worried"], correctAnswer: "I am sad / downhearted", explanation: "'Bakin ciki' literally means 'black heart'.", order: 11 },
  { lessonIndex: 6, type: "fill_blank", question: "'Ina ___ kacokan' — 'I am very hungry'", options: ["yunwa", "lafiya", "gajiya", "ciwo"], correctAnswer: "yunwa", order: 12 },
  { lessonIndex: 6, type: "translation", question: "Translate: 'Yaya lafiyarka?'", hausa: "Yaya lafiyarka?", english: "How is your health?", options: ["How old are you?", "How is your health?", "Where do you live?", "What do you do?"], correctAnswer: "How is your health?", order: 13 },
  { lessonIndex: 6, type: "multiple_choice", question: "A polite way to respond to 'Yaya kake?' is:", options: ["Lafiya, nagode", "Ban sani ba", "A'a", "Ina?"], correctAnswer: "Lafiya, nagode", explanation: "'Lafiya, nagode' means 'Fine, thank you' — very polite.", order: 14 },
  { lessonIndex: 6, type: "typing", question: "Type 'I am happy' in Hausa", options: [], correctAnswer: "ina farin ciki", hint: "Three words", order: 15 },

  // ── Lesson 7: Saying Goodbye ────────────────────────────────────────────────
  { lessonIndex: 7, type: "translation", question: "How do you say 'Goodbye'?", hausa: "Sai an jima / Barka da tafiya", english: "Goodbye", options: ["Hello", "Goodbye", "Welcome", "Come here"], correctAnswer: "Goodbye", audioWord: "Sai an jima", order: 1 },
  { lessonIndex: 7, type: "multiple_choice", question: "'Sai gobe' means:", options: ["See you tomorrow", "See you later", "Goodbye forever", "See you next week"], correctAnswer: "See you tomorrow", explanation: "'Gobe' means tomorrow.", order: 2 },
  { lessonIndex: 7, type: "translation", question: "Translate: 'Barka da tafiya'", hausa: "Barka da tafiya", english: "Safe journey / Goodbye (to someone leaving)", options: ["Welcome back", "Safe journey / Goodbye", "Have a nice day", "See you soon"], correctAnswer: "Safe journey / Goodbye (to someone leaving)", audioWord: "Barka da tafiya", order: 3 },
  { lessonIndex: 7, type: "fill_blank", question: "'Sai ___ jima' — 'See you later'", options: ["an", "da", "ko", "bi"], correctAnswer: "an", hint: "'Sai an jima' means see you later", order: 4 },
  { lessonIndex: 7, type: "multiple_choice", question: "How do you say 'Good night'?", options: ["Barka da dare / Ina kwana", "Ina wuni", "Sai gobe", "Salamu"], correctAnswer: "Barka da dare / Ina kwana", explanation: "'Barka da dare' blesses the night; 'Ina kwana?' asks how you slept.", order: 5 },
  { lessonIndex: 7, type: "translation", question: "Translate: 'Allah ya kiyaye'", hausa: "Allah ya kiyaye", english: "May God protect you", options: ["Have a nice day", "May God protect you", "Come back soon", "God bless you too"], correctAnswer: "May God protect you", audioWord: "Allah ya kiyaye", order: 6 },
  { lessonIndex: 7, type: "fill_blank", question: "'Mu ___ gobe' — 'We'll meet tomorrow'", options: ["hadu", "zo", "je", "yi"], correctAnswer: "hadu", hint: "'Hadu' means to meet", order: 7 },
  { lessonIndex: 7, type: "multiple_choice", question: "'Sai wata rana' means:", options: ["See you another day", "Good morning", "Until midnight", "Come another time"], correctAnswer: "See you another day", explanation: "'Wata rana' means another day.", order: 8 },
  { lessonIndex: 7, type: "translation", question: "What is said to someone staying when you leave?", hausa: "Sai an jima", english: "Goodbye (said to the one staying)", options: ["Come with me", "Goodbye (said to the one staying)", "Stay here", "Don't go"], correctAnswer: "Goodbye (said to the one staying)", order: 9 },
  { lessonIndex: 7, type: "typing", question: "Type 'see you tomorrow' in Hausa", options: [], correctAnswer: "sai gobe", hint: "Two words: 'sai' and 'gobe'", order: 10 },
  { lessonIndex: 7, type: "multiple_choice", question: "'Tafi lafiya' means:", options: ["Go safely", "Come safely", "Stay safe", "Walk fast"], correctAnswer: "Go safely", explanation: "'Tafi' means go; 'lafiya' means safely.", order: 11 },
  { lessonIndex: 7, type: "fill_blank", question: "'___ da dare' — 'Good night' (blessing)", options: ["Barka", "Sannu", "Ina", "Na"], correctAnswer: "Barka", hint: "'Barka da dare' = Good night", order: 12 },
  { lessonIndex: 7, type: "translation", question: "Translate: 'Mu sake ganawa'", hausa: "Mu sake ganawa", english: "Let's meet again", options: ["Goodbye forever", "Let's meet again", "Call me", "Write to me"], correctAnswer: "Let's meet again", order: 13 },
  { lessonIndex: 7, type: "multiple_choice", question: "Which phrase would you use to say goodbye to someone leaving on a trip?", options: ["Barka da tafiya", "Sai gobe", "Ina kwana", "Sannu da yamma"], correctAnswer: "Barka da tafiya", explanation: "'Barka da tafiya' specifically blesses someone who is traveling.", order: 14 },
  { lessonIndex: 7, type: "typing", question: "Type 'safe journey' in Hausa", options: [], correctAnswer: "barka da tafiya", hint: "Three words", order: 15 },

  // ── Lesson 8: Numbers 1–10 ──────────────────────────────────────────────────
  { lessonIndex: 8, type: "translation", question: "What is 'ɗaya' in English?", hausa: "Ɗaya", english: "One", options: ["One", "Two", "Three", "Four"], correctAnswer: "One", audioWord: "Ɗaya", order: 1 },
  { lessonIndex: 8, type: "translation", question: "What is 'biyu' in English?", hausa: "Biyu", english: "Two", options: ["One", "Two", "Three", "Four"], correctAnswer: "Two", audioWord: "Biyu", order: 2 },
  { lessonIndex: 8, type: "multiple_choice", question: "What is 'uku' in English?", options: ["Two", "Three", "Four", "Five"], correctAnswer: "Three", explanation: "'Uku' means three in Hausa.", order: 3 },
  { lessonIndex: 8, type: "translation", question: "Translate: 'Huɗu'", hausa: "Huɗu", english: "Four", options: ["Three", "Four", "Five", "Six"], correctAnswer: "Four", audioWord: "Huɗu", order: 4 },
  { lessonIndex: 8, type: "multiple_choice", question: "What is the number five in Hausa?", options: ["Biyar", "Shida", "Bakwai", "Takwas"], correctAnswer: "Biyar", explanation: "'Biyar' is five in Hausa.", order: 5 },
  { lessonIndex: 8, type: "translation", question: "What is 'shida' in English?", hausa: "Shida", english: "Six", options: ["Five", "Six", "Seven", "Eight"], correctAnswer: "Six", audioWord: "Shida", order: 6 },
  { lessonIndex: 8, type: "fill_blank", question: "Fill in: 'bakwai, ___, tara, goma' (7, __, 9, 10)", options: ["takwas", "shida", "biyar", "sha ɗaya"], correctAnswer: "takwas", hint: "'Takwas' is eight", audioWord: "takwas", order: 7 },
  { lessonIndex: 8, type: "translation", question: "What is 'tara' in English?", hausa: "Tara", english: "Nine", options: ["Seven", "Eight", "Nine", "Ten"], correctAnswer: "Nine", audioWord: "Tara", order: 8 },
  { lessonIndex: 8, type: "multiple_choice", question: "How do you say 'ten' in Hausa?", options: ["Tara", "Goma", "Sha ɗaya", "Ashirin"], correctAnswer: "Goma", explanation: "'Goma' is ten in Hausa.", order: 9 },
  { lessonIndex: 8, type: "typing", question: "Type the number 'one' in Hausa", options: [], correctAnswer: "ɗaya", hint: "Starts with a hooked letter", order: 10 },
  { lessonIndex: 8, type: "fill_blank", question: "'Yana da ___ yara' — 'He has three children'", options: ["uku", "biyu", "huɗu", "biyar"], correctAnswer: "uku", hint: "Three", order: 11 },
  { lessonIndex: 8, type: "multiple_choice", question: "How do you say 'I want two'?", options: ["Ina so biyu", "Ina so uku", "Ina so ɗaya", "Ina so goma"], correctAnswer: "Ina so biyu", explanation: "'Ina so biyu' means I want two.", order: 12 },
  { lessonIndex: 8, type: "translation", question: "What is 'bakwai'?", hausa: "Bakwai", english: "Seven", options: ["Five", "Six", "Seven", "Eight"], correctAnswer: "Seven", audioWord: "Bakwai", order: 13 },
  { lessonIndex: 8, type: "fill_blank", question: "Count: ɗaya, biyu, uku, huɗu, ___", options: ["biyar", "shida", "goma", "tara"], correctAnswer: "biyar", hint: "Five follows four", order: 14 },
  { lessonIndex: 8, type: "multiple_choice", question: "What is 'takwas'?", options: ["Six", "Seven", "Eight", "Nine"], correctAnswer: "Eight", explanation: "'Takwas' is eight in Hausa.", order: 15 },

  // ── Lesson 9: Numbers 11–100 ────────────────────────────────────────────────
  { lessonIndex: 9, type: "translation", question: "What does 'sha ɗaya' mean?", hausa: "Sha ɗaya", english: "Eleven", options: ["Ten", "Eleven", "Twelve", "Twenty"], correctAnswer: "Eleven", audioWord: "Sha ɗaya", order: 1 },
  { lessonIndex: 9, type: "multiple_choice", question: "How is 'thirteen' formed in Hausa?", options: ["Sha uku", "Sha biyu", "Ashirin da uku", "Goma sha uku"], correctAnswer: "Sha uku", explanation: "11-19 are formed with 'sha' + unit number.", order: 2 },
  { lessonIndex: 9, type: "translation", question: "Translate: 'Ashirin'", hausa: "Ashirin", english: "Twenty", options: ["Ten", "Fifteen", "Twenty", "Thirty"], correctAnswer: "Twenty", audioWord: "Ashirin", order: 3 },
  { lessonIndex: 9, type: "fill_blank", question: "'Ashirin da ___ ' = 21", options: ["ɗaya", "biyu", "goma", "shida"], correctAnswer: "ɗaya", hint: "Ashirin da ɗaya = 21", order: 4 },
  { lessonIndex: 9, type: "multiple_choice", question: "What is 'talatin' in English?", options: ["Twenty", "Thirty", "Forty", "Fifty"], correctAnswer: "Thirty", explanation: "'Talatin' is thirty in Hausa.", order: 5 },
  { lessonIndex: 9, type: "translation", question: "What is 'arba'in'?", hausa: "Arba'in", english: "Forty", options: ["Thirty", "Forty", "Fifty", "Sixty"], correctAnswer: "Forty", audioWord: "Arba'in", order: 6 },
  { lessonIndex: 9, type: "fill_blank", question: "'___ ' means fifty in Hausa", options: ["Hamsin", "Sittin", "Arba'in", "Talatin"], correctAnswer: "Hamsin", hint: "H - a - m - s - i - n", order: 7 },
  { lessonIndex: 9, type: "multiple_choice", question: "What is 'sittin' in English?", options: ["Fifty", "Sixty", "Seventy", "Eighty"], correctAnswer: "Sixty", explanation: "'Sittin' is sixty in Hausa.", order: 8 },
  { lessonIndex: 9, type: "translation", question: "Translate: 'Saba'in'", hausa: "Saba'in", english: "Seventy", options: ["Sixty", "Seventy", "Eighty", "Ninety"], correctAnswer: "Seventy", order: 9 },
  { lessonIndex: 9, type: "typing", question: "Type 'twenty' in Hausa", options: [], correctAnswer: "ashirin", hint: "Six letters starting with 'a'", order: 10 },
  { lessonIndex: 9, type: "multiple_choice", question: "How do you say 80 in Hausa?", options: ["Saba'in", "Tamanin", "Tis'in", "Ɗari"], correctAnswer: "Tamanin", explanation: "'Tamanin' is eighty.", order: 11 },
  { lessonIndex: 9, type: "translation", question: "What is 'tis'in'?", hausa: "Tis'in", english: "Ninety", options: ["Seventy", "Eighty", "Ninety", "Hundred"], correctAnswer: "Ninety", order: 12 },
  { lessonIndex: 9, type: "fill_blank", question: "'___ ' means 100 in Hausa", options: ["Ɗari", "Goma", "Ashirin", "Hamsin"], correctAnswer: "Ɗari", hint: "One hundred = ɗari", audioWord: "Ɗari", order: 13 },
  { lessonIndex: 9, type: "multiple_choice", question: "How do you say 'I am 25 years old'?", options: ["Ina da shekara ashirin da biyar", "Ina da shekara biyar", "Shekarana ashirin", "Na shekara ashirin"], correctAnswer: "Ina da shekara ashirin da biyar", explanation: "'Ashirin da biyar' = 25.", order: 14 },
  { lessonIndex: 9, type: "fill_blank", question: "'Nawa ne?' — The answer '___' means 15", options: ["Sha biyar", "Sha uku", "Ashirin", "Goma"], correctAnswer: "Sha biyar", hint: "Sha + biyar", order: 15 },

  // ── Lesson 10: Telling the Time ────────────────────────────────────────────
  { lessonIndex: 10, type: "translation", question: "How do you ask 'What time is it?'", hausa: "Nawa ne agogon?", english: "What time is it?", options: ["How old are you?", "What time is it?", "How much is it?", "When will you come?"], correctAnswer: "What time is it?", audioWord: "Nawa ne agogon", order: 1 },
  { lessonIndex: 10, type: "multiple_choice", question: "What does 'awa ɗaya' mean?", options: ["One hour / 1 o'clock", "Two hours", "Half past one", "Quarter past one"], correctAnswer: "One hour / 1 o'clock", explanation: "'Awa' means hour/o'clock in Hausa.", order: 2 },
  { lessonIndex: 10, type: "translation", question: "Translate: 'Awa biyu da rabi'", hausa: "Awa biyu da rabi", english: "Two thirty / Half past two", options: ["Two o'clock", "Two fifteen", "Two thirty", "Two forty-five"], correctAnswer: "Two thirty / Half past two", audioWord: "Awa biyu da rabi", order: 3 },
  { lessonIndex: 10, type: "fill_blank", question: "'Awa ___ da kwata' = Quarter past three", options: ["uku", "biyu", "huɗu", "biyar"], correctAnswer: "uku", hint: "Three o'clock + quarter", order: 4 },
  { lessonIndex: 10, type: "multiple_choice", question: "What does 'dare' mean in telling time?", options: ["Night / PM", "Morning / AM", "Noon", "Evening"], correctAnswer: "Night / PM", explanation: "'Dare' indicates nighttime; 'safe' is used for afternoon.", order: 5 },
  { lessonIndex: 10, type: "translation", question: "How do you say 'noon'?", hausa: "Tsakar rana", english: "Noon / Midday", options: ["Midnight", "Noon / Midday", "Morning", "Evening"], correctAnswer: "Noon / Midday", audioWord: "Tsakar rana", order: 6 },
  { lessonIndex: 10, type: "fill_blank", question: "'Asuba' means ___", options: ["morning", "night", "afternoon", "evening"], correctAnswer: "morning", hint: "'Asuba' = early morning", audioWord: "asuba", order: 7 },
  { lessonIndex: 10, type: "multiple_choice", question: "How do you say 'early in the morning'?", options: ["Da safe", "Da dare", "Da yamma", "Da rana"], correctAnswer: "Da safe", explanation: "'Da safe' means in the morning (between dawn and noon).", order: 8 },
  { lessonIndex: 10, type: "translation", question: "Translate: 'Minti goma sha biyar'", hausa: "Minti goma sha biyar", english: "Fifteen minutes", options: ["Ten minutes", "Fifteen minutes", "Twenty minutes", "Thirty minutes"], correctAnswer: "Fifteen minutes", order: 9 },
  { lessonIndex: 10, type: "typing", question: "Type 'one o'clock' in Hausa", options: [], correctAnswer: "awa ɗaya", hint: "'Awa' = hour/o'clock, 'ɗaya' = one", order: 10 },
  { lessonIndex: 10, type: "multiple_choice", question: "'Yamma' refers to:", options: ["Late afternoon / evening", "Morning", "Midday", "Midnight"], correctAnswer: "Late afternoon / evening", explanation: "'Yamma' is the late afternoon going into evening.", order: 11 },
  { lessonIndex: 10, type: "fill_blank", question: "'Ina zuwa awa ___' — 'I will come at six o'clock'", options: ["shida", "biyar", "goma", "tara"], correctAnswer: "shida", hint: "Six = shida", order: 12 },
  { lessonIndex: 10, type: "translation", question: "Translate: 'Wareware dare'", hausa: "Wareware dare", english: "Midnight", options: ["Late evening", "Midnight", "Early morning", "Sunset"], correctAnswer: "Midnight", order: 13 },
  { lessonIndex: 10, type: "multiple_choice", question: "What does 'agogo' mean?", options: ["Clock / Watch", "Hour", "Minute", "Second"], correctAnswer: "Clock / Watch", explanation: "'Agogo' means a clock or watch in Hausa.", order: 14 },
  { lessonIndex: 10, type: "typing", question: "Type 'morning' in Hausa", options: [], correctAnswer: "asuba", hint: "A-s-u-b-a", order: 15 },

  // ── Lesson 11: Days & Months ────────────────────────────────────────────────
  { lessonIndex: 11, type: "translation", question: "What day is 'Litinin'?", hausa: "Litinin", english: "Monday", options: ["Sunday", "Monday", "Tuesday", "Wednesday"], correctAnswer: "Monday", audioWord: "Litinin", order: 1 },
  { lessonIndex: 11, type: "multiple_choice", question: "What is Tuesday in Hausa?", options: ["Talata", "Laraba", "Alhamis", "Juma'a"], correctAnswer: "Talata", explanation: "'Talata' is Tuesday in Hausa.", order: 2 },
  { lessonIndex: 11, type: "translation", question: "Translate: 'Laraba'", hausa: "Laraba", english: "Wednesday", options: ["Monday", "Tuesday", "Wednesday", "Thursday"], correctAnswer: "Wednesday", audioWord: "Laraba", order: 3 },
  { lessonIndex: 11, type: "fill_blank", question: "Friday in Hausa is '___'", options: ["Juma'a", "Asabar", "Lahadi", "Alhamis"], correctAnswer: "Juma'a", hint: "The Muslim prayer day", audioWord: "Juma'a", order: 4 },
  { lessonIndex: 11, type: "multiple_choice", question: "What is 'Lahadi'?", options: ["Saturday", "Sunday", "Monday", "Friday"], correctAnswer: "Sunday", explanation: "'Lahadi' means Sunday in Hausa.", order: 5 },
  { lessonIndex: 11, type: "translation", question: "Translate: 'Jiya'", hausa: "Jiya", english: "Yesterday", options: ["Today", "Yesterday", "Tomorrow", "Last week"], correctAnswer: "Yesterday", audioWord: "Jiya", order: 6 },
  { lessonIndex: 11, type: "fill_blank", question: "'Yau ne ___ Litinin' — 'Today is Monday'", options: ["ranar", "zuwa", "da", "tun"], correctAnswer: "ranar", hint: "'Ranar' means 'day of'", order: 7 },
  { lessonIndex: 11, type: "multiple_choice", question: "How do you say 'next week'?", options: ["Mako mai zuwa", "Mako jiya", "Mako nan", "Mako da ya wuce"], correctAnswer: "Mako mai zuwa", explanation: "'Mako mai zuwa' means the week that is coming.", order: 8 },
  { lessonIndex: 11, type: "translation", question: "What is January in Hausa?", hausa: "Janairu", english: "January", options: ["January", "February", "March", "April"], correctAnswer: "January", order: 9 },
  { lessonIndex: 11, type: "typing", question: "Type 'today' in Hausa", options: [], correctAnswer: "yau", hint: "Three letters: y-a-u", order: 10 },
  { lessonIndex: 11, type: "multiple_choice", question: "'Gobe' means:", options: ["Tomorrow", "Yesterday", "Today", "Last year"], correctAnswer: "Tomorrow", explanation: "'Gobe' is tomorrow.", order: 11 },
  { lessonIndex: 11, type: "fill_blank", question: "'___ mai zuwa' — 'next year'", options: ["Shekara", "Wata", "Mako", "Rana"], correctAnswer: "Shekara", hint: "'Shekara' means year", order: 12 },
  { lessonIndex: 11, type: "translation", question: "Translate: 'Makon da ya wuce'", hausa: "Makon da ya wuce", english: "Last week", options: ["Next week", "This week", "Last week", "Every week"], correctAnswer: "Last week", order: 13 },
  { lessonIndex: 11, type: "multiple_choice", question: "Thursday in Hausa is:", options: ["Alhamis", "Laraba", "Asabar", "Litinin"], correctAnswer: "Alhamis", explanation: "'Alhamis' is Thursday, from the Arabic 'Al-Khamis'.", order: 14 },
  { lessonIndex: 11, type: "typing", question: "Type 'tomorrow' in Hausa", options: [], correctAnswer: "gobe", hint: "g-o-b-e", order: 15 },

  // ── Lesson 12: Colors ──────────────────────────────────────────────────────
  { lessonIndex: 12, type: "translation", question: "What does 'ja' mean?", hausa: "Ja", english: "Red", options: ["Blue", "Green", "Red", "Yellow"], correctAnswer: "Red", audioWord: "Ja", order: 1 },
  { lessonIndex: 12, type: "multiple_choice", question: "What is 'fari' in English?", options: ["Black", "White", "Grey", "Brown"], correctAnswer: "White", explanation: "'Fari' means white in Hausa.", order: 2 },
  { lessonIndex: 12, type: "translation", question: "Translate: 'Baki'", hausa: "Baki", english: "Black", options: ["White", "Black", "Brown", "Grey"], correctAnswer: "Black", audioWord: "Baki", order: 3 },
  { lessonIndex: 12, type: "fill_blank", question: "'Kore' means ___ in English", options: ["Green", "Blue", "Yellow", "Purple"], correctAnswer: "Green", audioWord: "Kore", order: 4 },
  { lessonIndex: 12, type: "multiple_choice", question: "How do you say 'yellow'?", options: ["Rawaya", "Shudi", "Kore", "Ruwan hoda"], correctAnswer: "Rawaya", explanation: "'Rawaya' means yellow, like the color of turmeric.", order: 5 },
  { lessonIndex: 12, type: "translation", question: "What is 'shudi'?", hausa: "Shudi", english: "Blue", options: ["Red", "Green", "Blue", "Purple"], correctAnswer: "Blue", audioWord: "Shudi", order: 6 },
  { lessonIndex: 12, type: "fill_blank", question: "'Ruwan hoda' means ___", options: ["Pink", "Orange", "Purple", "Brown"], correctAnswer: "Pink", hint: "'Ruwan hoda' literally 'pink water'", order: 7 },
  { lessonIndex: 12, type: "multiple_choice", question: "'Ruwan kasa' means:", options: ["Brown / Mud color", "Blue water", "Dirty green", "Sky color"], correctAnswer: "Brown / Mud color", explanation: "'Ruwan kasa' literally means 'earth color', i.e., brown.", order: 8 },
  { lessonIndex: 12, type: "translation", question: "How do you say 'The sky is blue'?", hausa: "Sama na da shudi", english: "The sky is blue", options: ["The sky is black", "The sky is blue", "The sky is grey", "The sky is white"], correctAnswer: "The sky is blue", order: 9 },
  { lessonIndex: 12, type: "typing", question: "Type the Hausa word for 'red'", options: [], correctAnswer: "ja", hint: "Two letters: j-a", order: 10 },
  { lessonIndex: 12, type: "multiple_choice", question: "What color is 'zinariya'?", options: ["Silver", "Gold", "Copper", "Bronze"], correctAnswer: "Gold", explanation: "'Zinariya' means gold in Hausa.", order: 11 },
  { lessonIndex: 12, type: "fill_blank", question: "'Rigar nan tana da launi ___' — 'This shirt is red'", options: ["ja", "fari", "baki", "kore"], correctAnswer: "ja", hint: "Red = ja", order: 12 },
  { lessonIndex: 12, type: "translation", question: "What does 'farin ciki' literally mean?", hausa: "Farin ciki", english: "White heart (happiness)", options: ["White shirt", "White heart (happiness)", "Bright sky", "Clean heart"], correctAnswer: "White heart (happiness)", order: 13 },
  { lessonIndex: 12, type: "multiple_choice", question: "How do you say 'What color is this?'", options: ["Menene launin wannan?", "Yaya wannan?", "Me ne wannan?", "Ina launin?"], correctAnswer: "Menene launin wannan?", explanation: "'Launi' means color.", order: 14 },
  { lessonIndex: 12, type: "typing", question: "Type the Hausa word for 'white'", options: [], correctAnswer: "fari", hint: "f-a-r-i", order: 15 },

  // ── Lesson 13: Everyday Objects ────────────────────────────────────────────
  { lessonIndex: 13, type: "translation", question: "What is 'littafi' in English?", hausa: "Littafi", english: "Book", options: ["Pen", "Book", "Table", "Chair"], correctAnswer: "Book", audioWord: "Littafi", order: 1 },
  { lessonIndex: 13, type: "multiple_choice", question: "How do you say 'pen' in Hausa?", options: ["Alkalami", "Wuƙa", "Siket", "Tebur"], correctAnswer: "Alkalami", explanation: "'Alkalami' is a pen or pencil.", order: 2 },
  { lessonIndex: 13, type: "translation", question: "Translate: 'Tebur'", hausa: "Tebur", english: "Table", options: ["Chair", "Table", "Bed", "Window"], correctAnswer: "Table", audioWord: "Tebur", order: 3 },
  { lessonIndex: 13, type: "fill_blank", question: "'Kujera' means ___", options: ["Chair", "Door", "Window", "Bed"], correctAnswer: "Chair", audioWord: "Kujera", order: 4 },
  { lessonIndex: 13, type: "multiple_choice", question: "What is 'waya' in English?", options: ["Car", "Phone / Wire", "Bottle", "Bag"], correctAnswer: "Phone / Wire", explanation: "'Waya' means wire and has come to mean mobile phone too.", order: 5 },
  { lessonIndex: 13, type: "translation", question: "Translate: 'Mota'", hausa: "Mota", english: "Car", options: ["Bike", "Car", "Bus", "Truck"], correctAnswer: "Car", audioWord: "Mota", order: 6 },
  { lessonIndex: 13, type: "fill_blank", question: "'Kofar gida' means ___", options: ["Door of the house", "Window of the house", "Roof of the house", "Wall"], correctAnswer: "Door of the house", hint: "'Kofa' = door, 'gida' = house", order: 7 },
  { lessonIndex: 13, type: "multiple_choice", question: "How do you say 'bag'?", options: ["Jaka", "Tebur", "Kujera", "Kofar"], correctAnswer: "Jaka", explanation: "'Jaka' means a bag or briefcase.", order: 8 },
  { lessonIndex: 13, type: "translation", question: "What is 'ruwa' in English?", hausa: "Ruwa", english: "Water", options: ["Fire", "Water", "Air", "Earth"], correctAnswer: "Water", audioWord: "Ruwa", order: 9 },
  { lessonIndex: 13, type: "typing", question: "Type the Hausa word for 'car'", options: [], correctAnswer: "mota", hint: "m-o-t-a", order: 10 },
  { lessonIndex: 13, type: "multiple_choice", question: "'Takalmi' means:", options: ["Shoe / Sandal", "Hat", "Shirt", "Trousers"], correctAnswer: "Shoe / Sandal", explanation: "'Takalmi' is footwear — shoes or sandals.", order: 11 },
  { lessonIndex: 13, type: "fill_blank", question: "'___ ta fadi' — 'The book fell'", options: ["Littafin", "Teburin", "Kujerar", "Jakar"], correctAnswer: "Littafin", hint: "Littafi + n (definite)", order: 12 },
  { lessonIndex: 13, type: "translation", question: "Translate: 'Kwando'", hausa: "Kwando", english: "Basket", options: ["Basket", "Pot", "Bowl", "Plate"], correctAnswer: "Basket", order: 13 },
  { lessonIndex: 13, type: "multiple_choice", question: "How do you say 'This is my book'?", options: ["Wannan littafina ne", "Littafi ne wannan", "Ni ne littafi", "Littafi na ne"], correctAnswer: "Wannan littafina ne", explanation: "'Wannan...na ne' = 'This is my...'", order: 14 },
  { lessonIndex: 13, type: "typing", question: "Type the Hausa word for 'book'", options: [], correctAnswer: "littafi", hint: "l-i-t-t-a-f-i", order: 15 },

  // ── Lesson 14: Describing Things ────────────────────────────────────────────
  { lessonIndex: 14, type: "translation", question: "How do you say 'big'?", hausa: "Babba", english: "Big / Large", options: ["Small", "Big / Large", "Old", "New"], correctAnswer: "Big / Large", audioWord: "Babba", order: 1 },
  { lessonIndex: 14, type: "multiple_choice", question: "What is the opposite of 'babba' (big)?", options: ["Ƙarami", "Tsohon", "Sabon", "Ɗan"], correctAnswer: "Ƙarami", explanation: "'Ƙarami' means small/little.", order: 2 },
  { lessonIndex: 14, type: "translation", question: "Translate: 'Kyakkyawa'", hausa: "Kyakkyawa", english: "Beautiful / Good", options: ["Ugly", "Beautiful / Good", "Small", "Big"], correctAnswer: "Beautiful / Good", audioWord: "Kyakkyawa", order: 3 },
  { lessonIndex: 14, type: "fill_blank", question: "'Sabon ___' means 'new...'", options: ["gida", "tsohon", "babba", "kyau"], correctAnswer: "gida", hint: "'Sabon gida' = new house", order: 4 },
  { lessonIndex: 14, type: "multiple_choice", question: "How do you say 'old' (for things)?", options: ["Tsohon", "Sabon", "Ƙarami", "Babba"], correctAnswer: "Tsohon", explanation: "'Tsohon' means old (for things or people).", order: 5 },
  { lessonIndex: 14, type: "translation", question: "What does 'mai ɗanɗano' mean?", hausa: "Mai ɗanɗano", english: "Delicious / Tasty", options: ["Bitter", "Delicious / Tasty", "Sour", "Salty"], correctAnswer: "Delicious / Tasty", audioWord: "Mai ɗanɗano", order: 6 },
  { lessonIndex: 14, type: "fill_blank", question: "'Hanyar nan ta da ___ sosai' — 'This road is very long'", options: ["tsawo", "gajerun", "fadi", "kai"], correctAnswer: "tsawo", hint: "'Tsawo' means length/height", order: 7 },
  { lessonIndex: 14, type: "multiple_choice", question: "What does 'gajere' mean?", options: ["Tall", "Short (in height)", "Fat", "Thin"], correctAnswer: "Short (in height)", explanation: "'Gajere' describes short stature.", order: 8 },
  { lessonIndex: 14, type: "translation", question: "Translate: 'Mai zafi'", hausa: "Mai zafi", english: "Hot / Spicy", options: ["Cold", "Hot / Spicy", "Warm", "Bitter"], correctAnswer: "Hot / Spicy", audioWord: "Mai zafi", order: 9 },
  { lessonIndex: 14, type: "typing", question: "Type 'beautiful' in Hausa", options: [], correctAnswer: "kyakkyawa", hint: "k-y-a-k-k-y-a-w-a", order: 10 },
  { lessonIndex: 14, type: "multiple_choice", question: "'Mai sanyi' means:", options: ["Cold", "Hot", "Warm", "Dry"], correctAnswer: "Cold", explanation: "'Sanyi' means cold; 'mai sanyi' = something that is cold.", order: 11 },
  { lessonIndex: 14, type: "fill_blank", question: "'Gidan nan ___ ne' — 'This house is new'", options: ["sabo", "tsohon", "babba", "ƙarami"], correctAnswer: "sabo", hint: "New = sabo (for a house)", order: 12 },
  { lessonIndex: 14, type: "translation", question: "Translate: 'Tsoho ne'", hausa: "Tsoho ne", english: "He/It is old", options: ["He is young", "He/It is old", "He is new", "He is big"], correctAnswer: "He/It is old", order: 13 },
  { lessonIndex: 14, type: "multiple_choice", question: "How do you say 'very good'?", options: ["Kyau sosai", "Kyau kadan", "Kyau dai", "Kyau ai"], correctAnswer: "Kyau sosai", explanation: "'Sosai' intensifies — very good.", order: 14 },
  { lessonIndex: 14, type: "typing", question: "Type 'small' in Hausa", options: [], correctAnswer: "ƙarami", hint: "Starts with a hooked k", order: 15 },

  // ── Lesson 15: Common Foods ─────────────────────────────────────────────────
  { lessonIndex: 15, type: "translation", question: "What is 'shinkafa' in English?", hausa: "Shinkafa", english: "Rice", options: ["Beans", "Rice", "Corn", "Millet"], correctAnswer: "Rice", audioWord: "Shinkafa", order: 1 },
  { lessonIndex: 15, type: "multiple_choice", question: "How do you say 'beans' in Hausa?", options: ["Wake", "Dawa", "Gyaɗa", "Hatsi"], correctAnswer: "Wake", explanation: "'Wake' means beans, a Hausa staple food.", order: 2 },
  { lessonIndex: 15, type: "translation", question: "Translate: 'Suya'", hausa: "Suya", english: "Grilled spiced meat (Nigerian BBQ)", options: ["Soup", "Grilled spiced meat", "Fried chicken", "Stew"], correctAnswer: "Grilled spiced meat (Nigerian BBQ)", audioWord: "Suya", order: 3 },
  { lessonIndex: 15, type: "fill_blank", question: "'Tuwo' is made from ___ or millet", options: ["sorghum", "rice", "wheat", "yam"], correctAnswer: "sorghum", hint: "Tuwo shinkafa or tuwo dawa", order: 4 },
  { lessonIndex: 15, type: "multiple_choice", question: "What is 'gyaɗa' in English?", options: ["Groundnut / Peanut", "Corn", "Millet", "Beans"], correctAnswer: "Groundnut / Peanut", explanation: "'Gyaɗa' are groundnuts, widely used in Hausa cooking.", order: 5 },
  { lessonIndex: 15, type: "translation", question: "What does 'miyan kuka' mean?", hausa: "Miyan kuka", english: "Baobab leaf soup", options: ["Pepper soup", "Baobab leaf soup", "Tomato stew", "Bean soup"], correctAnswer: "Baobab leaf soup", order: 6 },
  { lessonIndex: 15, type: "fill_blank", question: "'Ina so ___' — 'I want food'", options: ["abinci", "ruwa", "kifi", "tuwon"], correctAnswer: "abinci", hint: "'Abinci' = food", audioWord: "abinci", order: 7 },
  { lessonIndex: 15, type: "multiple_choice", question: "What is 'kifi' in English?", options: ["Chicken", "Fish", "Beef", "Goat"], correctAnswer: "Fish", explanation: "'Kifi' means fish.", order: 8 },
  { lessonIndex: 15, type: "translation", question: "Translate: 'Naman sa'", hausa: "Naman sa", english: "Beef / Cow meat", options: ["Chicken", "Goat meat", "Beef", "Fish"], correctAnswer: "Beef / Cow meat", audioWord: "Naman sa", order: 9 },
  { lessonIndex: 15, type: "typing", question: "Type the Hausa word for 'rice'", options: [], correctAnswer: "shinkafa", hint: "s-h-i-n-k-a-f-a", order: 10 },
  { lessonIndex: 15, type: "multiple_choice", question: "What is 'dankali' in English?", options: ["Sweet potato / Yam", "Tomato", "Onion", "Pepper"], correctAnswer: "Sweet potato / Yam", explanation: "'Dankali' is sweet potato in Hausa.", order: 11 },
  { lessonIndex: 15, type: "fill_blank", question: "'___ ya fi daɗi' — 'Suya tastes better'", options: ["Suyan", "Tuwon", "Waken", "Shinkafan"], correctAnswer: "Suyan", hint: "Suya + n (definite/subject marker)", order: 12 },
  { lessonIndex: 15, type: "translation", question: "Translate: 'Ina jin yunwa'", hausa: "Ina jin yunwa", english: "I am hungry", options: ["I am thirsty", "I am full", "I am hungry", "I am eating"], correctAnswer: "I am hungry", audioWord: "Ina jin yunwa", order: 13 },
  { lessonIndex: 15, type: "multiple_choice", question: "How do you say 'I am full'?", options: ["Na ƙoshi", "Ina yunwa", "Na ci abinci", "Na sha ruwa"], correctAnswer: "Na ƙoshi", explanation: "'Na ƙoshi' means I am satisfied/full after eating.", order: 14 },
  { lessonIndex: 15, type: "typing", question: "Type 'food' in Hausa", options: [], correctAnswer: "abinci", hint: "a-b-i-n-c-i", order: 15 },

  // ── Lesson 16: Drinks & Beverages ──────────────────────────────────────────
  { lessonIndex: 16, type: "translation", question: "What is 'ruwa' in English?", hausa: "Ruwa", english: "Water", options: ["Juice", "Milk", "Water", "Tea"], correctAnswer: "Water", audioWord: "Ruwa", order: 1 },
  { lessonIndex: 16, type: "multiple_choice", question: "How do you say 'tea' in Hausa?", options: ["Shayi", "Kofi", "Ruwa", "Nono"], correctAnswer: "Shayi", explanation: "'Shayi' is tea in Hausa.", order: 2 },
  { lessonIndex: 16, type: "translation", question: "Translate: 'Madara'", hausa: "Madara", english: "Milk", options: ["Water", "Tea", "Milk", "Juice"], correctAnswer: "Milk", audioWord: "Madara", order: 3 },
  { lessonIndex: 16, type: "fill_blank", question: "'___ mai sanyi' means 'cold water'", options: ["Ruwan", "Shayin", "Kofin", "Nonon"], correctAnswer: "Ruwan", hint: "Water + n + mai sanyi", audioWord: "ruwa", order: 4 },
  { lessonIndex: 16, type: "multiple_choice", question: "What is 'nono' in English?", options: ["Fermented milk / Yogurt", "Juice", "Tea", "Coconut milk"], correctAnswer: "Fermented milk / Yogurt", explanation: "'Nono' is a traditional Hausa fermented milk drink.", order: 5 },
  { lessonIndex: 16, type: "translation", question: "Translate: 'Ina so in sha ruwa'", hausa: "Ina so in sha ruwa", english: "I want to drink water", options: ["I drank water", "I want to drink water", "Give me water", "Where is the water?"], correctAnswer: "I want to drink water", order: 6 },
  { lessonIndex: 16, type: "fill_blank", question: "'Sha' means to ___", options: ["drink", "eat", "cook", "buy"], correctAnswer: "drink", audioWord: "sha", order: 7 },
  { lessonIndex: 16, type: "multiple_choice", question: "How do you ask 'Do you want water?'", options: ["Kana son ruwa?", "Ina ruwa?", "Me ruwa?", "Ko ruwa?"], correctAnswer: "Kana son ruwa?", explanation: "'Kana son...?' means 'Do you want...?' (to a male).", order: 8 },
  { lessonIndex: 16, type: "translation", question: "What is 'lemo'?", hausa: "Lemo", english: "Lemon / Citrus juice", options: ["Milk", "Water", "Lemon / Citrus juice", "Tea"], correctAnswer: "Lemon / Citrus juice", audioWord: "Lemo", order: 9 },
  { lessonIndex: 16, type: "typing", question: "Type 'water' in Hausa", options: [], correctAnswer: "ruwa", hint: "r-u-w-a", order: 10 },
  { lessonIndex: 16, type: "multiple_choice", question: "'Kofi' in Hausa means:", options: ["Coffee", "Tea", "Juice", "Milk"], correctAnswer: "Coffee", explanation: "'Kofi' is borrowed from English 'coffee'.", order: 11 },
  { lessonIndex: 16, type: "fill_blank", question: "'Ina sha ___ kullum' — 'I drink tea every day'", options: ["shayi", "ruwa", "madara", "nono"], correctAnswer: "shayi", order: 12 },
  { lessonIndex: 16, type: "translation", question: "Translate: 'Ina jin ƙishirwa'", hausa: "Ina jin ƙishirwa", english: "I am thirsty", options: ["I am hungry", "I am thirsty", "I drank", "I am full"], correctAnswer: "I am thirsty", audioWord: "Ina jin ƙishirwa", order: 13 },
  { lessonIndex: 16, type: "multiple_choice", question: "What does 'jan ruwa' mean?", options: ["Red/Orange drink (Zobo/hibiscus)", "Tomato juice", "Blood orange", "Red tea"], correctAnswer: "Red/Orange drink (Zobo/hibiscus)", explanation: "'Jan ruwa' refers to zobo, the popular hibiscus drink.", order: 14 },
  { lessonIndex: 16, type: "typing", question: "Type 'milk' in Hausa", options: [], correctAnswer: "madara", hint: "m-a-d-a-r-a", order: 15 },

  // ── Lesson 17: At the Market ────────────────────────────────────────────────
  { lessonIndex: 17, type: "translation", question: "How do you say 'How much?'", hausa: "Nawa ne?", english: "How much?", options: ["What is this?", "How much?", "Where is it?", "How many?"], correctAnswer: "How much?", audioWord: "Nawa ne", order: 1 },
  { lessonIndex: 17, type: "multiple_choice", question: "How do you say 'I want to buy this'?", options: ["Ina so in sayi wannan", "Ina so in sayar", "Ina son wannan sosai", "Na sayi wannan"], correctAnswer: "Ina so in sayi wannan", explanation: "'Sayi' means to buy.", order: 2 },
  { lessonIndex: 17, type: "translation", question: "Translate: 'Sayarwa'", hausa: "Sayarwa", english: "Selling", options: ["Buying", "Selling", "Bargaining", "Stealing"], correctAnswer: "Selling", audioWord: "Sayarwa", order: 3 },
  { lessonIndex: 17, type: "fill_blank", question: "'Kasuwa' means ___", options: ["market", "shop", "bank", "school"], correctAnswer: "market", audioWord: "Kasuwa", order: 4 },
  { lessonIndex: 17, type: "multiple_choice", question: "How do you say 'expensive'?", options: ["Mai tsada", "Mai arha", "Mai kyau", "Mai yawa"], correctAnswer: "Mai tsada", explanation: "'Mai tsada' means expensive; 'mai arha' means cheap.", order: 5 },
  { lessonIndex: 17, type: "translation", question: "Translate: 'Rage mini' / 'Yi rangwame'", hausa: "Rage mini / Yi rangwame", english: "Give me a discount / Reduce the price", options: ["Give me more", "Give me a discount", "Pay me", "No change"], correctAnswer: "Give me a discount / Reduce the price", order: 6 },
  { lessonIndex: 17, type: "fill_blank", question: "'Ina ___ naira biyar' — 'I have five naira'", options: ["da", "yi", "bi", "ko"], correctAnswer: "da", hint: "'Ina da' = I have", order: 7 },
  { lessonIndex: 17, type: "multiple_choice", question: "How do you say 'I don't have money'?", options: ["Ban da kudi", "Ina da kudi", "Na ba da kudi", "Kudi ya kare"], correctAnswer: "Ban da kudi", explanation: "'Ban da kudi' = I don't have money.", order: 8 },
  { lessonIndex: 17, type: "translation", question: "What does 'Kudi' mean?", hausa: "Kudi", english: "Money", options: ["Market", "Money", "Price", "Change"], correctAnswer: "Money", audioWord: "Kudi", order: 9 },
  { lessonIndex: 17, type: "typing", question: "Type 'market' in Hausa", options: [], correctAnswer: "kasuwa", hint: "k-a-s-u-w-a", order: 10 },
  { lessonIndex: 17, type: "multiple_choice", question: "'Naira' is:", options: ["Nigerian currency", "A Hausa greeting", "A type of food", "A market name"], correctAnswer: "Nigerian currency", explanation: "Naira is Nigeria's currency and is used in Hausa.", order: 11 },
  { lessonIndex: 17, type: "fill_blank", question: "'Ina so in ___ wannan kaya' — 'I want to buy these goods'", options: ["sayi", "sayar", "sha", "ci"], correctAnswer: "sayi", hint: "'Sayi' = to buy", order: 12 },
  { lessonIndex: 17, type: "translation", question: "Translate: 'Wannan mai tsada ne'", hausa: "Wannan mai tsada ne", english: "This is expensive", options: ["This is cheap", "This is expensive", "This is good", "This is new"], correctAnswer: "This is expensive", order: 13 },
  { lessonIndex: 17, type: "multiple_choice", question: "'Canjin kudi' means:", options: ["Change / Currency exchange", "Market price", "Discount", "Debt"], correctAnswer: "Change / Currency exchange", explanation: "'Canji' means change/exchange; 'kudi' means money.", order: 14 },
  { lessonIndex: 17, type: "typing", question: "Type 'how much?' in Hausa", options: [], correctAnswer: "nawa ne", hint: "Two words", order: 15 },

  // ── Lesson 18: Cooking Words ────────────────────────────────────────────────
  { lessonIndex: 18, type: "translation", question: "How do you say 'to cook'?", hausa: "Dafa", english: "To cook", options: ["To eat", "To cook", "To drink", "To buy"], correctAnswer: "To cook", audioWord: "Dafa", order: 1 },
  { lessonIndex: 18, type: "multiple_choice", question: "What does 'soyayya' mean in cooking?", options: ["Frying", "Boiling", "Grilling", "Steaming"], correctAnswer: "Frying", explanation: "'Soyayya' means frying in oil.", order: 2 },
  { lessonIndex: 18, type: "translation", question: "Translate: 'Tafasa'", hausa: "Tafasa", english: "To boil", options: ["To fry", "To boil", "To grill", "To bake"], correctAnswer: "To boil", audioWord: "Tafasa", order: 3 },
  { lessonIndex: 18, type: "fill_blank", question: "'___ abinci' — 'cook food'", options: ["Dafa", "Sha", "Ci", "Kai"], correctAnswer: "Dafa", audioWord: "Dafa", order: 4 },
  { lessonIndex: 18, type: "multiple_choice", question: "What is 'miya' in English?", options: ["Soup / Sauce / Stew", "Salad", "Drink", "Dessert"], correctAnswer: "Soup / Sauce / Stew", explanation: "'Miya' covers soups and stews used with tuwo.", order: 5 },
  { lessonIndex: 18, type: "translation", question: "What does 'bak'ar miya' mean?", hausa: "Bak'ar miya", english: "Dark/black soup (okra or similar)", options: ["Pepper soup", "Dark/black soup", "White soup", "Tomato stew"], correctAnswer: "Dark/black soup (okra or similar)", order: 6 },
  { lessonIndex: 18, type: "fill_blank", question: "'Wuta' means ___", options: ["fire", "water", "pot", "knife"], correctAnswer: "fire", hint: "'Wuta' = fire, used for cooking", audioWord: "Wuta", order: 7 },
  { lessonIndex: 18, type: "multiple_choice", question: "How do you say 'pot'?", options: ["Tukunya", "Wuƙa", "Kago", "Jera"], correctAnswer: "Tukunya", explanation: "'Tukunya' is a cooking pot.", order: 8 },
  { lessonIndex: 18, type: "translation", question: "Translate: 'Wuƙa'", hausa: "Wuƙa", english: "Knife", options: ["Pot", "Spoon", "Knife", "Fork"], correctAnswer: "Knife", audioWord: "Wuƙa", order: 9 },
  { lessonIndex: 18, type: "typing", question: "Type 'to cook' in Hausa", options: [], correctAnswer: "dafa", hint: "d-a-f-a", order: 10 },
  { lessonIndex: 18, type: "multiple_choice", question: "What is 'mai' in cooking?", options: ["Cooking oil", "Salt", "Pepper", "Water"], correctAnswer: "Cooking oil", explanation: "'Mai' means oil, used extensively in Hausa cooking.", order: 11 },
  { lessonIndex: 18, type: "fill_blank", question: "'Ina ___ abinci' — 'I am cooking food'", options: ["dafawa", "ciya", "sayarwa", "kawo"], correctAnswer: "dafawa", hint: "Dafa + wa (progressive)", order: 12 },
  { lessonIndex: 18, type: "translation", question: "Translate: 'Gishiri'", hausa: "Gishiri", english: "Salt", options: ["Sugar", "Salt", "Pepper", "Oil"], correctAnswer: "Salt", audioWord: "Gishiri", order: 13 },
  { lessonIndex: 18, type: "multiple_choice", question: "'Yaji' means:", options: ["Pepper/Spice", "Salt", "Sugar", "Oil"], correctAnswer: "Pepper/Spice", explanation: "'Yaji' is the spice mix used in suya and other Hausa dishes.", order: 14 },
  { lessonIndex: 18, type: "typing", question: "Type 'salt' in Hausa", options: [], correctAnswer: "gishiri", hint: "g-i-s-h-i-r-i", order: 15 },

  // ── Lesson 19: Family Members ────────────────────────────────────────────────
  { lessonIndex: 19, type: "translation", question: "What does 'uba' mean?", hausa: "Uba", english: "Father", options: ["Mother", "Father", "Brother", "Son"], correctAnswer: "Father", audioWord: "Uba", order: 1 },
  { lessonIndex: 19, type: "multiple_choice", question: "How do you say 'mother' in Hausa?", options: ["Uwa", "Uba", "Yaya", "Kaka"], correctAnswer: "Uwa", explanation: "'Uwa' means mother.", order: 2 },
  { lessonIndex: 19, type: "translation", question: "Translate: 'Yaya'", hausa: "Yaya", english: "Elder sibling / Older brother or sister", options: ["Younger sibling", "Elder sibling", "Friend", "Cousin"], correctAnswer: "Elder sibling / Older brother or sister", audioWord: "Yaya", order: 3 },
  { lessonIndex: 19, type: "fill_blank", question: "'___ ne' — '(He) is my younger brother'", options: ["Kanena", "Ubana", "Uwana", "Kakana"], correctAnswer: "Kanena", hint: "'Kane' = younger brother; 'na' = my", order: 4 },
  { lessonIndex: 19, type: "multiple_choice", question: "What is 'kaka' in English?", options: ["Grandfather / Grandmother", "Uncle", "Aunt", "Father"], correctAnswer: "Grandfather / Grandmother", explanation: "'Kaka' refers to grandparent.", order: 5 },
  { lessonIndex: 19, type: "translation", question: "Translate: 'Iyalina'", hausa: "Iyalina", english: "My family", options: ["My home", "My family", "My friends", "My people"], correctAnswer: "My family", audioWord: "Iyalina", order: 6 },
  { lessonIndex: 19, type: "fill_blank", question: "'___ na/na' means 'my husband'", options: ["Mijina", "Ubana", "Kanena", "Kakana"], correctAnswer: "Mijina", hint: "'Miji' = husband", audioWord: "Miji", order: 7 },
  { lessonIndex: 19, type: "multiple_choice", question: "How do you say 'wife'?", options: ["Mata", "Miji", "Yaro", "Budurwa"], correctAnswer: "Mata", explanation: "'Mata' means woman/wife.", order: 8 },
  { lessonIndex: 19, type: "translation", question: "What does 'ɗa' mean?", hausa: "Ɗa", english: "Son", options: ["Daughter", "Son", "Brother", "Nephew"], correctAnswer: "Son", audioWord: "Ɗa", order: 9 },
  { lessonIndex: 19, type: "typing", question: "Type 'father' in Hausa", options: [], correctAnswer: "uba", hint: "u-b-a", order: 10 },
  { lessonIndex: 19, type: "multiple_choice", question: "What is 'diya' in English?", options: ["Daughter", "Son", "Sister", "Mother"], correctAnswer: "Daughter", explanation: "'Diya' means daughter.", order: 11 },
  { lessonIndex: 19, type: "fill_blank", question: "'Uwana tana ___ sosai' — 'My mother is very kind'", options: ["kirki", "kyau", "zafi", "gajiya"], correctAnswer: "kirki", hint: "'Kirki' = goodness/kindness", order: 12 },
  { lessonIndex: 19, type: "translation", question: "Translate: 'Kawuna'", hausa: "Kawuna", english: "My uncle / My maternal relative", options: ["My friend", "My uncle", "My teacher", "My neighbour"], correctAnswer: "My uncle / My maternal relative", order: 13 },
  { lessonIndex: 19, type: "multiple_choice", question: "'Yaro' means:", options: ["Boy / Son", "Girl", "Man", "Elder"], correctAnswer: "Boy / Son", explanation: "'Yaro' is a boy or young man.", order: 14 },
  { lessonIndex: 19, type: "typing", question: "Type 'mother' in Hausa", options: [], correctAnswer: "uwa", hint: "u-w-a", order: 15 },

  // ── Lesson 20: Rooms in a House ─────────────────────────────────────────────
  { lessonIndex: 20, type: "translation", question: "What does 'dakin barci' mean?", hausa: "Dakin barci", english: "Bedroom", options: ["Kitchen", "Bathroom", "Bedroom", "Living room"], correctAnswer: "Bedroom", audioWord: "Dakin barci", order: 1 },
  { lessonIndex: 20, type: "multiple_choice", question: "How do you say 'kitchen'?", options: ["Dakin dafa abinci", "Dakin wanka", "Dakin barci", "Falon gida"], correctAnswer: "Dakin dafa abinci", explanation: "'Dakin dafa abinci' = room for cooking food.", order: 2 },
  { lessonIndex: 20, type: "translation", question: "Translate: 'Dakin wanka'", hausa: "Dakin wanka", english: "Bathroom", options: ["Bedroom", "Kitchen", "Bathroom", "Store"], correctAnswer: "Bathroom", audioWord: "Dakin wanka", order: 3 },
  { lessonIndex: 20, type: "fill_blank", question: "'___ gida' means 'living room / entrance of the house'", options: ["Zaure", "Dakin", "Kofar", "Baya"], correctAnswer: "Zaure", hint: "'Zaure' is the entrance hall or sitting area", order: 4 },
  { lessonIndex: 20, type: "multiple_choice", question: "What is 'rufin gida'?", options: ["Roof of the house", "Floor", "Wall", "Door"], correctAnswer: "Roof of the house", explanation: "'Ruf' (from English) or 'rufin gida' means roof.", order: 5 },
  { lessonIndex: 20, type: "translation", question: "Translate: 'Kofa'", hausa: "Kofa", english: "Door", options: ["Window", "Gate", "Door", "Wall"], correctAnswer: "Door", audioWord: "Kofa", order: 6 },
  { lessonIndex: 20, type: "fill_blank", question: "'Taga' means ___", options: ["window", "door", "wall", "ceiling"], correctAnswer: "window", audioWord: "Taga", order: 7 },
  { lessonIndex: 20, type: "multiple_choice", question: "What is 'bene' in a house?", options: ["Floor", "Ceiling", "Wall", "Roof"], correctAnswer: "Floor", explanation: "'Bene' means floor.", order: 8 },
  { lessonIndex: 20, type: "translation", question: "What does 'bangon gida' mean?", hausa: "Bangon gida", english: "Wall of the house", options: ["Floor", "Ceiling", "Wall of the house", "Fence"], correctAnswer: "Wall of the house", order: 9 },
  { lessonIndex: 20, type: "typing", question: "Type 'door' in Hausa", options: [], correctAnswer: "kofa", hint: "k-o-f-a", order: 10 },
  { lessonIndex: 20, type: "multiple_choice", question: "How do you say 'upstairs'?", options: ["Sama / bene na sama", "Kasa", "Baya", "Gaban"], correctAnswer: "Sama / bene na sama", explanation: "'Sama' means above/upstairs.", order: 11 },
  { lessonIndex: 20, type: "fill_blank", question: "'Ina a ___' — 'I am in the kitchen'", options: ["daki", "kasa", "gida", "kasuwa"], correctAnswer: "daki", hint: "'Daki' = room", order: 12 },
  { lessonIndex: 20, type: "translation", question: "Translate: 'Ma'aunin ruwa'", hausa: "Ma'aunin ruwa", english: "Water tap / Sink", options: ["Bathtub", "Water tap", "Well", "River"], correctAnswer: "Water tap / Sink", order: 13 },
  { lessonIndex: 20, type: "multiple_choice", question: "'Falon gida' refers to:", options: ["The courtyard / compound", "The bedroom", "The store", "The toilet"], correctAnswer: "The courtyard / compound", explanation: "A traditional Hausa compound has a central 'falo'.", order: 14 },
  { lessonIndex: 20, type: "typing", question: "Type 'bedroom' in Hausa", options: [], correctAnswer: "dakin barci", hint: "Three words meaning 'room of sleep'", order: 15 },

  // ── Lesson 21: Daily Routines ────────────────────────────────────────────────
  { lessonIndex: 21, type: "translation", question: "Translate: 'Tashi daga barci'", hausa: "Tashi daga barci", english: "Wake up", options: ["Go to sleep", "Wake up", "Get dressed", "Eat breakfast"], correctAnswer: "Wake up", audioWord: "Tashi daga barci", order: 1 },
  { lessonIndex: 21, type: "multiple_choice", question: "How do you say 'I wake up at 6 AM'?", options: ["Ina tashi da awa shida safe", "Ina barci da awa shida", "Na tashi jiya", "Ina barci kullum"], correctAnswer: "Ina tashi da awa shida safe", explanation: "'Safe' = morning.", order: 2 },
  { lessonIndex: 21, type: "translation", question: "Translate: 'Ci abincin safe'", hausa: "Ci abincin safe", english: "Eat breakfast", options: ["Eat dinner", "Skip breakfast", "Eat breakfast", "Drink tea"], correctAnswer: "Eat breakfast", audioWord: "Ci abincin safe", order: 3 },
  { lessonIndex: 21, type: "fill_blank", question: "'___ makaranta' — 'Go to school'", options: ["Je/Tafi", "Zo", "Ka", "Da"], correctAnswer: "Je/Tafi", hint: "'Je' or 'tafi' both mean to go", order: 4 },
  { lessonIndex: 21, type: "multiple_choice", question: "What does 'wanka' mean?", options: ["To bathe / shower", "To cook", "To sleep", "To run"], correctAnswer: "To bathe / shower", explanation: "'Wanka' means to take a bath.", order: 5 },
  { lessonIndex: 21, type: "translation", question: "Translate: 'Yi salla'", hausa: "Yi salla", english: "Pray / Do prayers", options: ["Go to mosque", "Pray / Do prayers", "Wash hands", "Read the Quran"], correctAnswer: "Pray / Do prayers", audioWord: "Yi salla", order: 6 },
  { lessonIndex: 21, type: "fill_blank", question: "'Abincin ___' — 'dinner'", options: ["dare", "safe", "rana", "yamma"], correctAnswer: "dare", hint: "'Dare' = night, so dinner is 'abincin dare'", order: 7 },
  { lessonIndex: 21, type: "multiple_choice", question: "How do you say 'I work every day'?", options: ["Ina aiki kullum", "Na yi aiki jiya", "Gobe zan yi aiki", "Ina son aiki"], correctAnswer: "Ina aiki kullum", explanation: "'Kullum' means every day/always.", order: 8 },
  { lessonIndex: 21, type: "translation", question: "Translate: 'Karatu'", hausa: "Karatu", english: "Study / Reading", options: ["Play", "Study / Reading", "Sleep", "Work"], correctAnswer: "Study / Reading", audioWord: "Karatu", order: 9 },
  { lessonIndex: 21, type: "typing", question: "Type 'to sleep' in Hausa", options: [], correctAnswer: "barci", hint: "b-a-r-c-i", order: 10 },
  { lessonIndex: 21, type: "multiple_choice", question: "'Ina zuwa aiki' means:", options: ["I am going to work", "I am at work", "I finished work", "I don't work"], correctAnswer: "I am going to work", explanation: "'Zuwa' = going to.", order: 11 },
  { lessonIndex: 21, type: "fill_blank", question: "'___ da abokai' — 'play with friends'", options: ["Yi wasa", "Ci abinci", "Yi aiki", "Je makaranta"], correctAnswer: "Yi wasa", hint: "'Wasa' = play/game", order: 12 },
  { lessonIndex: 21, type: "translation", question: "Translate: 'Ina gajiya'", hausa: "Ina gajiya", english: "I am tired", options: ["I am fine", "I am working", "I am tired", "I am hungry"], correctAnswer: "I am tired", audioWord: "Ina gajiya", order: 13 },
  { lessonIndex: 21, type: "multiple_choice", question: "How do you say 'I go to bed at 10 PM'?", options: ["Ina barci da awa goma dare", "Ina tashi da awa goma", "Na barci jiya", "Ina son barci"], correctAnswer: "Ina barci da awa goma dare", explanation: "'Dare' specifies nighttime.", order: 14 },
  { lessonIndex: 21, type: "typing", question: "Type 'every day' in Hausa", options: [], correctAnswer: "kullum", hint: "k-u-l-l-u-m", order: 15 },
];

// ─── VOCABULARY ────────────────────────────────────────────────────────────────
const VOCABULARY = [
  // Basics
  { hausa: "Sannu", english: "Hello / Greetings", category: "Basics", pronunciation: "SAN-noo", example: "Sannu da zuwa!", exampleTranslation: "Welcome!" },
  { hausa: "Nagode", english: "Thank you", category: "Basics", pronunciation: "na-GO-day", example: "Nagode sosai!", exampleTranslation: "Thank you very much!" },
  { hausa: "Don Allah", english: "Please / For God", category: "Basics", pronunciation: "don AL-lah", example: "Don Allah, zo nan.", exampleTranslation: "Please, come here." },
  { hausa: "Ee / I", english: "Yes", category: "Basics", pronunciation: "ay", example: "Ee, na ji.", exampleTranslation: "Yes, I heard." },
  { hausa: "A'a", english: "No", category: "Basics", pronunciation: "AH-ah", example: "A'a, ban je ba.", exampleTranslation: "No, I didn't go." },
  { hausa: "Yi hakuri", english: "Sorry / Excuse me", category: "Basics", pronunciation: "yi ha-KU-ri", example: "Yi hakuri da ni.", exampleTranslation: "Please forgive me." },
  { hausa: "In sha Allah", english: "God willing", category: "Basics", pronunciation: "in sha AL-lah", example: "Gobe sai an jima, in sha Allah.", exampleTranslation: "See you tomorrow, God willing." },
  { hausa: "Yawwa", english: "OK / Alright", category: "Basics", pronunciation: "YAW-wah", example: "Yawwa, na ji.", exampleTranslation: "OK, I understand." },
  { hausa: "Ruwa", english: "Water", category: "Basics", pronunciation: "ROO-wah", example: "Ina son ruwa.", exampleTranslation: "I want water." },
  { hausa: "Abinci", english: "Food", category: "Basics", pronunciation: "a-BIN-chi", example: "Abinci ya fi kyau.", exampleTranslation: "The food is very good." },

  // Greetings
  { hausa: "Ina kwana?", english: "Good morning (How did you sleep?)", category: "Greetings", pronunciation: "EE-na KWAH-na", example: "Ina kwana, yaya dare?", exampleTranslation: "Good morning, how was the night?" },
  { hausa: "Lafiya lau", english: "Very well (in good health)", category: "Greetings", pronunciation: "la-FEE-ya LAU", example: "Lafiya lau, nagode.", exampleTranslation: "Very well, thank you." },
  { hausa: "Salamu alaikum", english: "Peace be upon you", category: "Greetings", pronunciation: "sa-LA-moo a-LAY-kum", example: "Salamu alaikum, ina lafiya?", exampleTranslation: "Peace be upon you, how are you?" },
  { hausa: "Barka da zuwa", english: "Welcome", category: "Greetings", pronunciation: "BAR-ka da ZOO-wah", example: "Barka da zuwa gida.", exampleTranslation: "Welcome home." },
  { hausa: "Sai an jima", english: "Goodbye / See you later", category: "Greetings", pronunciation: "sai an JI-ma", example: "Sai an jima, Allah ya kiyaye.", exampleTranslation: "Goodbye, may God protect you." },

  // Numbers
  { hausa: "Ɗaya", english: "One", category: "Numbers", pronunciation: "DAH-ya", example: "Na sayi littafi ɗaya.", exampleTranslation: "I bought one book." },
  { hausa: "Biyu", english: "Two", category: "Numbers", pronunciation: "BEE-yoo", example: "Ina yara biyu.", exampleTranslation: "I have two children." },
  { hausa: "Uku", english: "Three", category: "Numbers", pronunciation: "OO-koo", example: "Shekara uku suka wuce.", exampleTranslation: "Three years have passed." },
  { hausa: "Goma", english: "Ten", category: "Numbers", pronunciation: "GO-ma", example: "Suna da naira goma.", exampleTranslation: "They have ten naira." },
  { hausa: "Ashirin", english: "Twenty", category: "Numbers", pronunciation: "a-SHEE-rin", example: "Ina da shekara ashirin.", exampleTranslation: "I am twenty years old." },

  // Colors
  { hausa: "Ja", english: "Red", category: "Colors", pronunciation: "JAH", example: "Riga ta da launi ja.", exampleTranslation: "The shirt is red." },
  { hausa: "Fari", english: "White", category: "Colors", pronunciation: "FA-ri", example: "Farin rigana.", exampleTranslation: "My white shirt." },
  { hausa: "Baki", english: "Black", category: "Colors", pronunciation: "BA-ki", example: "Takalmi mai launi baki.", exampleTranslation: "Black shoes." },
  { hausa: "Kore", english: "Green", category: "Colors", pronunciation: "KO-ray", example: "Ciyawa tana da launi kore.", exampleTranslation: "Grass is green." },
  { hausa: "Rawaya", english: "Yellow", category: "Colors", pronunciation: "ra-WAH-ya", example: "Mangwaro ta da launi rawaya.", exampleTranslation: "The mango is yellow." },

  // Food
  { hausa: "Shinkafa", english: "Rice", category: "Food", pronunciation: "shin-KA-fa", example: "Ina ci shinkafa da miya.", exampleTranslation: "I eat rice with soup." },
  { hausa: "Suya", english: "Grilled spiced meat", category: "Food", pronunciation: "SOO-ya", example: "Suya ta fi daɗi.", exampleTranslation: "Suya tastes better." },
  { hausa: "Wake", english: "Beans", category: "Food", pronunciation: "WAH-kay", example: "Mun ci wake da shinkafa.", exampleTranslation: "We ate beans and rice." },
  { hausa: "Abincin safe", english: "Breakfast", category: "Food", pronunciation: "a-BIN-chin SA-fay", example: "Na ci abincin safe.", exampleTranslation: "I ate breakfast." },
  { hausa: "Miya", english: "Soup / Stew / Sauce", category: "Food", pronunciation: "MEE-ya", example: "Miyan kuka tana da daɗi.", exampleTranslation: "Baobab soup is delicious." },

  // Family
  { hausa: "Uba", english: "Father", category: "Family", pronunciation: "OO-ba", example: "Ubana ya tafi kasuwa.", exampleTranslation: "My father went to the market." },
  { hausa: "Uwa", english: "Mother", category: "Family", pronunciation: "OO-wa", example: "Uwata tana dafa abinci.", exampleTranslation: "My mother is cooking food." },
  { hausa: "Yaya", english: "Elder sibling", category: "Family", pronunciation: "YAH-ya", example: "Yayata ya zo.", exampleTranslation: "My elder sibling came." },
  { hausa: "Kane / Kawa", english: "Younger brother / sister", category: "Family", pronunciation: "KAH-nay / KAH-wa", example: "Kanena yana makaranta.", exampleTranslation: "My younger brother is at school." },
  { hausa: "Iyali", english: "Family", category: "Family", pronunciation: "ee-YA-li", example: "Iyalina suna lafiya.", exampleTranslation: "My family is fine." },
];

// ─── ACHIEVEMENTS ──────────────────────────────────────────────────────────────
const ACHIEVEMENTS_DATA = [
  { key: "first_lesson", title: "First Step", description: "Complete your very first lesson", xpReward: 10, iconEmoji: "👣" },
  { key: "streak_3", title: "On a Roll", description: "Keep a 3-day learning streak", xpReward: 25, iconEmoji: "🔥" },
  { key: "streak_7", title: "Week Warrior", description: "Maintain a 7-day streak", xpReward: 50, iconEmoji: "⚡" },
  { key: "streak_30", title: "Month Master", description: "Maintain a 30-day streak", xpReward: 200, iconEmoji: "🏆" },
  { key: "first_unit", title: "Unit Champion", description: "Complete an entire unit", xpReward: 50, iconEmoji: "🎯" },
  { key: "all_units", title: "Hausa Graduate", description: "Complete all 6 units", xpReward: 500, iconEmoji: "🎓" },
  { key: "vocab_10", title: "Word Collector", description: "Learn 10 vocabulary words", xpReward: 20, iconEmoji: "📖" },
  { key: "vocab_50", title: "Vocabulary Veteran", description: "Learn 50 vocabulary words", xpReward: 100, iconEmoji: "📚" },
  { key: "xp_100", title: "Centurion", description: "Earn 100 XP total", xpReward: 15, iconEmoji: "💯" },
  { key: "xp_500", title: "XP Hunter", description: "Earn 500 XP total", xpReward: 50, iconEmoji: "⭐" },
  { key: "xp_1000", title: "XP Legend", description: "Earn 1000 XP total", xpReward: 100, iconEmoji: "🌟" },
  { key: "perfect_quiz", title: "Perfectionist", description: "Score 100% on a quiz", xpReward: 30, iconEmoji: "✨" },
  { key: "daily_challenge", title: "Daily Devotee", description: "Complete a daily challenge", xpReward: 10, iconEmoji: "📅" },
  { key: "level_5", title: "Level 5 Learner", description: "Reach level 5", xpReward: 50, iconEmoji: "🚀" },
  { key: "level_10", title: "Level 10 Legend", description: "Reach level 10", xpReward: 100, iconEmoji: "👑" },
];

// ─── DAILY CHALLENGES POOL ─────────────────────────────────────────────────────
const DAILY_CHALLENGE_POOL = [
  { question: "Translate to English: 'Ina kwana?'", hausa: "Ina kwana?", english: "Good morning", options: ["Good morning", "Good evening", "Good night", "Hello"], correctAnswer: "Good morning" },
  { question: "What does 'Nagode' mean?", hausa: "Nagode", english: "Thank you", options: ["Thank you", "Goodbye", "Hello", "Please"], correctAnswer: "Thank you" },
  { question: "Translate: 'Shinkafa'", hausa: "Shinkafa", english: "Rice", options: ["Rice", "Beans", "Corn", "Millet"], correctAnswer: "Rice" },
  { question: "What color is 'ja'?", hausa: "Ja", english: "Red", options: ["Red", "Blue", "Green", "Yellow"], correctAnswer: "Red" },
  { question: "How do you say 'father' in Hausa?", hausa: "Uba", english: "Father", options: ["Uba", "Uwa", "Yaya", "Kane"], correctAnswer: "Uba" },
  { question: "Translate: 'Ruwa'", hausa: "Ruwa", english: "Water", options: ["Water", "Food", "Fire", "Earth"], correctAnswer: "Water" },
  { question: "What does 'Lafiya' mean?", hausa: "Lafiya", english: "Health / Fine", options: ["Health / Fine", "Sickness", "Happiness", "Sadness"], correctAnswer: "Health / Fine" },
  { question: "How do you say 'one' in Hausa?", hausa: "Ɗaya", english: "One", options: ["Ɗaya", "Biyu", "Uku", "Huɗu"], correctAnswer: "Ɗaya" },
  { question: "Translate: 'Kore'", hausa: "Kore", english: "Green", options: ["Green", "Blue", "Red", "Yellow"], correctAnswer: "Green" },
  { question: "What does 'Sai gobe' mean?", hausa: "Sai gobe", english: "See you tomorrow", options: ["See you tomorrow", "Goodbye", "See you later", "Good night"], correctAnswer: "See you tomorrow" },
  { question: "Translate: 'Littafi'", hausa: "Littafi", english: "Book", options: ["Book", "Pen", "Table", "Chair"], correctAnswer: "Book" },
  { question: "How do you say 'ten' in Hausa?", hausa: "Goma", english: "Ten", options: ["Goma", "Tara", "Biyar", "Ashirin"], correctAnswer: "Goma" },
  { question: "What does 'Mota' mean?", hausa: "Mota", english: "Car", options: ["Car", "Bike", "Bus", "Truck"], correctAnswer: "Car" },
  { question: "Translate: 'Ina farin ciki'", hausa: "Ina farin ciki", english: "I am happy", options: ["I am happy", "I am sad", "I am tired", "I am sick"], correctAnswer: "I am happy" },
  { question: "What does 'Kasuwa' mean?", hausa: "Kasuwa", english: "Market", options: ["Market", "Shop", "Bank", "School"], correctAnswer: "Market" },
];

export async function seedDatabase() {
  try {
    // Check if already seeded
    const existingUnits = await db.select().from(unitsTable).limit(1);
    if (existingUnits.length > 0) {
      logger.info("Database already seeded, skipping.");
      return;
    }

    logger.info("Seeding database with lesson content...");

    // Insert units
    const insertedUnits = await db.insert(unitsTable).values(UNITS).returning();
    logger.info({ count: insertedUnits.length }, "Inserted units");

    // Insert lessons with unit IDs
    const lessonsToInsert = LESSONS.map((l) => ({
      unitId: insertedUnits[l.unitIndex].id,
      title: l.title,
      description: l.description,
      category: l.category,
      xpReward: l.xpReward,
      order: l.order,
      iconEmoji: l.iconEmoji,
    }));
    const insertedLessons = await db.insert(lessonsTable).values(lessonsToInsert).returning();
    logger.info({ count: insertedLessons.length }, "Inserted lessons");

    // Insert exercises
    const exercisesToInsert = EXERCISES.filter(e => {
      // Fix the syntax error in lesson 19
      return true;
    }).map((e) => ({
      lessonId: insertedLessons[e.lessonIndex].id,
      type: e.type,
      question: e.question,
      hausa: e.hausa ?? null,
      english: e.english ?? null,
      options: e.options,
      correctAnswer: e.correctAnswer,
      hint: e.hint ?? null,
      explanation: e.explanation ?? null,
      audioWord: e.audioWord ?? null,
      order: e.order,
    }));
    const insertedExercises = await db.insert(exercisesTable).values(exercisesToInsert).returning();
    logger.info({ count: insertedExercises.length }, "Inserted exercises");

    // Insert vocabulary
    const insertedVocab = await db.insert(vocabularyTable).values(VOCABULARY).returning();
    logger.info({ count: insertedVocab.length }, "Inserted vocabulary");

    // Insert achievements
    const existingAchievements = await db.select().from(achievementsTable).limit(1);
    if (existingAchievements.length === 0) {
      await db.insert(achievementsTable).values(ACHIEVEMENTS_DATA);
      logger.info("Inserted achievements");
    }

    // Insert daily challenge pool for next 15 days
    const today = new Date();
    for (let i = 0; i < DAILY_CHALLENGE_POOL.length; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const ch = DAILY_CHALLENGE_POOL[i % DAILY_CHALLENGE_POOL.length];
      try {
        await db.insert(dailyChallengesTable).values({ ...ch, xpReward: 25, challengeDate: dateStr });
      } catch {
        // Already exists for this date
      }
    }
    logger.info("Inserted daily challenges");

    logger.info("Database seeding complete!");
  } catch (err) {
    logger.error({ err }, "Error seeding database");
    throw err;
  }
}
