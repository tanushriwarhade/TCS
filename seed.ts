import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Read config from file
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
if (!fs.existsSync(configPath)) {
  console.error("Please set up firebase first!");
  process.exit(1);
}

const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function seed() {
  console.log("🌱 Seeding sample data...");

  // 1. Create a sample exam
  const examRef = await addDoc(collection(db, 'exams'), {
    title: "General Knowledge & Logic 2026",
    description: "A comprehensive assessment of general awareness, logical reasoning, and basic quantitative aptitude. This exam consists of 5 multi-format questions.",
    durationInMinutes: 10,
    totalMarks: 50,
    active: true,
    createdAt: Date.now()
  });

  const examId = examRef.id;

  // 2. Add Questions
  const questions = [
    {
      text: "Which planet is known as the Red Planet?",
      type: "mcq-single",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correctAnswers: ["Mars"],
      marks: 10
    },
    {
      text: "Select the Prime Numbers from the list below:",
      type: "mcq-multiple",
      options: ["12", "13", "14", "17", "21"],
      correctAnswers: ["13", "17"],
      marks: 10
    },
    {
       text: "What is the square root of 625?",
       type: "numeric",
       correctAnswers: ["25"],
       marks: 10
    },
    {
      text: "Who wrote 'Romeo and Juliet'?",
      type: "mcq-single",
      options: ["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"],
      correctAnswers: ["William Shakespeare"],
      marks: 10
    },
    {
      text: "If a train travels 300 miles in 5 hours, what is its average speed in mph?",
      type: "numeric",
      correctAnswers: ["60"],
      marks: 10
    }
  ];

  for (const q of questions) {
    await addDoc(collection(db, `exams/${examId}/questions`), q);
  }

  console.log(`✅ Seeded Exam: ${examId} with ${questions.length} questions.`);
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
