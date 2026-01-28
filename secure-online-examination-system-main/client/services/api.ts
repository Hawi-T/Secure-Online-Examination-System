
import { Exam, ExamResult, User, Question } from '../types';

const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
/**
 * Utility to handle fetch responses and common error logic
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'An unexpected error occurred';
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

// Mapper for Exam Result
const mapResult = (res: any): ExamResult => ({
  id: res.id,
  studentId: res.student_id,
  studentName: res.student_name,
  examId: res.exam_id,
  examTitle: res.exam_title,
  score: res.score,
  totalQuestions: res.total_questions,
  submittedAt: res.submitted_at
});

// Mapper for Question
const mapQuestion = (q: any): Question => ({
  id: q.id,
  text: q.text,
  options: q.options,
  correctOptionId: q.correct_option_id
});

export const api = {
  login: async (username: string, password: string): Promise<User> => {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      credentials: "include",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse<{ success: boolean; user: User; message?: string }>(response);
    if (!data.success) throw new Error(data.message || 'Login failed');
    return data.user;
  },

  checkSession: async (): Promise<User | null> => {
    try {
      const response = await fetch(`${BASE_URL}/login`);
      const data = await handleResponse<{ success: boolean; user?: User }>(response);
      return data.success ? data.user || null : null;
    } catch {
      return null;
    }
  },

  logout: async (): Promise<void> => {
    const response = await fetch(`${BASE_URL}/logout`, { method: 'POST' });
    await handleResponse<{ success: boolean }>(response);
  },

  getExams: async (): Promise<Exam[]> => {
    const response = await fetch(`${BASE_URL}/exams`,{credentials: "include"});
    const data = await handleResponse<any[]>(response);
    return data.map(exam => ({
      ...exam,
      questions: (exam.questions || []).map(mapQuestion)
    }));
  },

  getExamById: async (id: string): Promise<Exam> => {
    const response = await fetch(`${BASE_URL}/exams/${id}`,{credentials: "include"});
    const data = await handleResponse<any>(response);
    return {
      ...data,
      questions: (data.questions || []).map(mapQuestion)
    };
  },

  submitExam: async (examId: string, answers: Record<string, string>): Promise<ExamResult> => {
    const response = await fetch(`${BASE_URL}/exams/submit/${examId}`, {
      method: 'POST',
      credentials: "include",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers),
    });
    const data = await handleResponse<any>(response);
    return mapResult(data);
  },

  getResults: async (): Promise<ExamResult[]> => {
    const response = await fetch(`${BASE_URL}/exams/results`,{credentials: "include"});
    const data = await handleResponse<any[]>(response);
    return data.map(mapResult);
  },

  getResultsByStudent: async (studentId: string): Promise<ExamResult[]> => {
    const response = await fetch(`${BASE_URL}/exams/results?studentId=${studentId}`,{credentials: "include"});
    const data = await handleResponse<any[]>(response);
    return data.map(mapResult);
  },

  createExam: async (exam: Partial<Exam>): Promise<void> => {
    const response = await fetch(`${BASE_URL}/exams`, {
      method: 'POST',
      credentials: "include",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exam),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
  },

  getStudents: async (): Promise<User[]> => {
    const response = await fetch(`${BASE_URL}/users`,{credentials: "include"});
    return handleResponse<User[]>(response);
  },

  createStudent: async (username: string, password?: string): Promise<void> => {
    const response = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      credentials: "include",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse<{ success: boolean; message?: string }>(response);
    if (!data.success) throw new Error(data.message || 'Failed to create student');
  },

  deleteStudent: async (id: string): Promise<void> => {
    const response = await fetch(`${BASE_URL}/users/${id}`, {
      method: 'DELETE',
      credentials: "include",
    });
    const data = await handleResponse<{ success: boolean; message?: string }>(response);
    if (!data.success) throw new Error(data.message || 'Failed to delete student');
  }
};
