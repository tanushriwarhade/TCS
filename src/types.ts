export type UserRole = 'student' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: number;
}

export type QuestionType = 'mcq-single' | 'mcq-multiple' | 'numeric';

export interface Question {
  id: string;
  examId: string;
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswers: string[];
  marks: number;
  negativeMarks?: number;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  durationInMinutes: number;
  totalMarks: number;
  active: boolean;
  createdAt: number;
}

export interface ExamSubmission {
  id: string;
  userId: string;
  examId: string;
  answers: Record<string, string[]>;
  score?: number;
  status: 'ongoing' | 'completed';
  startedAt: number;
  completedAt?: number;
}

export interface ResultSummary {
  examId: string;
  examTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  submittedAt: number;
}
