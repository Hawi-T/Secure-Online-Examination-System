
export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
}

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
  correctOptionId?: string; // Only visible to Admin
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  questions: Question[];
}

export interface ExamResult {
  id: string;
  studentId: string;
  studentName: string;
  examId: string;
  examTitle: string;
  score: number;
  totalQuestions: number;
  submittedAt: string;
}
