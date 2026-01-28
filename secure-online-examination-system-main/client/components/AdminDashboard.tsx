
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Exam, Question, ExamResult, User, UserRole } from '../types';

type DashboardView = 'results' | 'create' | 'users';

const AdminDashboard: React.FC = () => {
  const [view, setView] = useState<DashboardView>('results');
  const [results, setResults] = useState<ExamResult[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Exam Creation State
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(60);
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);

  // User Creation State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadData();
  }, [view]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (view === 'results') {
        const data = await api.getResults();
        setResults(data);
      } else if (view === 'users') {
        const data = await api.getStudents();
        setStudents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    const qId = Date.now().toString();
    const newQ: Question = {
      id: qId,
      text: '',
      options: [
        { id: `${qId}-o1`, text: '' },
        { id: `${qId}-o2`, text: '' },
        { id: `${qId}-o3`, text: '' },
        { id: `${qId}-o4`, text: '' }
      ],
      correctOptionId: `${qId}-o1` // Default to first option
    };
    setQuestions([...questions, newQ]);
  };

  const handleQuestionTextChange = (id: string, text: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, text } : q));
  };

  const handleOptionChange = (qId: string, oId: string, text: string) => {
    setQuestions(questions.map(q => q.id === qId 
      ? { ...q, options: q.options.map(o => o.id === oId ? { ...o, text } : o) } 
      : q
    ));
  };

  const handleSetCorrectAnswer = (qId: string, oId: string) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, correctOptionId: oId } : q));
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || questions.length === 0) {
      alert('Missing required fields');
      return;
    }
    // Validate all questions have text and options
    const invalid = questions.some(q => !q.text || q.options.some(o => !o.text));
    if (invalid) {
      alert('Please fill in all questions and options');
      return;
    }

    setLoading(true);
    try {
      await api.createExam({
        id: Date.now().toString(),
        title,
        description,
        durationMinutes: duration,
        questions
      });
      alert('Exam created successfully');
      setView('results');
      setTitle('');
      setQuestions([]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;
    setLoading(true);
    try {
      await api.createStudent(newUsername, newPassword);
      setNewUsername('');
      setNewPassword('');
      await loadData();
      alert('Student user created');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      await api.deleteStudent(id);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-slate-200 pb-6 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-navy">Admin Portal</h2>
          <p className="text-slate-500">Manage students, create exams, and track results</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar w-full md:w-auto">
          <button 
            onClick={() => setView('results')}
            className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-all ${view === 'results' ? 'bg-white shadow-md text-navy' : 'text-slate-500 hover:text-navy'}`}
          >
            Submissions
          </button>
          <button 
            onClick={() => setView('users')}
            className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-all ${view === 'users' ? 'bg-white shadow-md text-navy' : 'text-slate-500 hover:text-navy'}`}
          >
            User Management
          </button>
          <button 
            onClick={() => setView('create')}
            className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-all ${view === 'create' ? 'bg-white shadow-md text-navy' : 'text-slate-500 hover:text-navy'}`}
          >
            Create Exam
          </button>
        </div>
      </div>

      {view === 'results' && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-navy flex items-center text-sm uppercase tracking-wider">
              Recent Submissions
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Exam Title</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700 text-sm">{res.studentName}</td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{res.examTitle}</td>
                    <td className="px-6 py-4">
                       <span className={`font-bold text-sm ${res.score / res.totalQuestions >= 0.5 ? 'text-green-600' : 'text-red-500'}`}>
                         {res.score} / {res.totalQuestions}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${res.score / res.totalQuestions >= 0.5 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                         {res.score / res.totalQuestions >= 0.5 ? 'Passed' : 'Failed'}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(res.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {results.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">No results found yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
              <h3 className="font-bold text-navy mb-6 uppercase text-xs tracking-widest">Enroll New Student</h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-navy outline-none text-sm"
                    placeholder="student_id_123"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Assigned Password</label>
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-navy outline-none text-sm"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-navy text-white py-2 rounded-lg font-bold text-sm hover:bg-navy-dark transition-all disabled:opacity-50"
                >
                  Create Account
                </button>
              </form>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="p-6 bg-slate-50 border-b border-slate-100">
                <h3 className="font-bold text-navy uppercase text-xs tracking-widest">Enrolled Students</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      <th className="px-6 py-4">Username</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-700 text-sm">{s.username}</td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full uppercase font-bold">Student</span>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => handleDeleteUser(s.id)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">No students enrolled yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'create' && (
        <form onSubmit={handleCreateExam} className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Exam Title</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-navy outline-none"
                    placeholder="e.g. Midterm Physics 101"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-navy outline-none"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-navy outline-none h-full"
                  rows={4}
                  placeholder="Provide details about what this exam covers..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="space-y-6 pt-8 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">Questions & Key Answers</h3>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="bg-navy hover:bg-navy-dark text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md transition-all"
                >
                  + Add Question
                </button>
              </div>

              <div className="space-y-10">
                {questions.map((q, qIdx) => (
                  <div key={q.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative">
                    <button 
                      type="button" 
                      onClick={() => setQuestions(questions.filter(item => item.id !== q.id))}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                    
                    <div className="mb-6">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Question {qIdx + 1}</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-navy outline-none bg-white font-medium"
                        placeholder="Enter question text here..."
                        value={q.text}
                        onChange={(e) => handleQuestionTextChange(q.id, e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {q.options.map((opt, oIdx) => (
                        <div key={opt.id} className={`relative flex items-center bg-white rounded-xl border-2 transition-all p-1 ${q.correctOptionId === opt.id ? 'border-green-500 shadow-sm' : 'border-transparent'}`}>
                          <div className="flex items-center justify-center pl-3 pr-2">
                             <input 
                               type="radio" 
                               name={`correct-${q.id}`} 
                               checked={q.correctOptionId === opt.id}
                               onChange={() => handleSetCorrectAnswer(q.id, opt.id)}
                               className="w-4 h-4 text-green-600 focus:ring-green-500"
                               title="Mark as correct answer"
                             />
                          </div>
                          <input
                            type="text"
                            required
                            className="w-full pr-4 py-2 rounded-lg outline-none bg-transparent text-sm"
                            placeholder={`Option ${oIdx + 1}`}
                            value={opt.text}
                            onChange={(e) => handleOptionChange(q.id, opt.id, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-[10px] text-slate-400 uppercase font-bold flex items-center">
                       <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                       Select the radio button next to the correct answer
                    </div>
                  </div>
                ))}

                {questions.length === 0 && (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                    No questions added yet. Click "Add Question" to begin.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-10 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-navy hover:bg-navy-dark text-white px-12 py-4 rounded-xl font-bold shadow-xl transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Publish Examination'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminDashboard;
