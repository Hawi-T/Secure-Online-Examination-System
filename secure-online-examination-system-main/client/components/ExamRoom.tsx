
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Exam } from '../types';

const ExamRoom: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [violationCount, setViolationCount] = useState(0);

  // Load Exam
  useEffect(() => {
    const load = async () => {
      if (!examId) return;
      try {
        const found = await api.getExamById(examId);
        if (found) {
          setExam(found);
          setTimeLeft(found.durationMinutes * 60);
        } else {
          navigate('/');
        }
      } catch (err) {
        console.error("Failed to load exam", err);
        navigate('/');
      }
    };
    load();
  }, [examId, navigate]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !exam) return;
    setIsSubmitting(true);
    try {
      // The API now expects just the answers object for the POST /exams/submit/{id}
      await api.submitExam(exam.id, answers);
      alert('Exam submitted successfully!');
      navigate('/');
    } catch (err) {
      alert('Submission failed. Please try again.');
      setIsSubmitting(false);
    }
  }, [answers, exam, isSubmitting, navigate]);

  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0) {
      if (exam && !isSubmitting) handleSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, exam, handleSubmit, isSubmitting]);

  // Proctoring Simulation
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setViolationCount(prev => {
          const newCount = prev + 1;
          alert(`Security Warning (${newCount}): Please do not leave the exam page. Your session is being monitored.`);
          return newCount;
        });
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (!exam) return <div className="p-20 text-center flex flex-col items-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mb-4"></div>
    Loading Examination...
  </div>;

  const currentQuestion = exam.questions[currentQuestionIndex];
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isAnswered = (qId: string) => !!answers[qId];

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-50">
      {/* Sidebar Navigation */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col hidden lg:flex">
        <div className="p-6 border-b border-slate-100 bg-navy text-white">
          <h3 className="font-bold text-sm uppercase tracking-wider mb-2 text-slate-400">Time Remaining</h3>
          <div className={`text-3xl font-mono font-bold ${timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-grow no-scrollbar">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
            Questions
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {exam.questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`h-10 w-full rounded-md font-bold text-sm transition-all border
                  ${currentQuestionIndex === idx 
                    ? 'bg-navy text-white border-navy scale-105 shadow-md' 
                    : isAnswered(q.id)
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'
                  }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
          <div className="flex justify-between text-xs font-semibold text-slate-500">
            <span>Progress</span>
            <span>{Object.keys(answers).length} / {exam.questions.length}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-navy h-2 rounded-full transition-all duration-500" 
              style={{ width: `${(Object.keys(answers).length / Math.max(1, exam.questions.length)) * 100}%` }}
            ></div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Submitting...' : 'Finish & Submit'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col p-4 sm:p-8 overflow-y-auto no-scrollbar">
        <div className="max-w-4xl mx-auto w-full">
          {/* Mobile Timer Header */}
          <div className="lg:hidden flex justify-between items-center mb-6 bg-navy p-4 rounded-xl shadow-lg text-white">
             <div className="flex flex-col">
               <span className="text-[10px] uppercase font-bold text-slate-400">Time Left</span>
               <span className="font-mono font-bold text-xl">{formatTime(timeLeft)}</span>
             </div>
             <button
               onClick={handleSubmit}
               disabled={isSubmitting}
               className="bg-red-500 px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
             >
               {isSubmitting ? '...' : 'Submit'}
             </button>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 min-h-[400px] flex flex-col">
            <div className="flex items-center mb-8">
              <span className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-navy font-bold mr-4">
                {currentQuestionIndex + 1}
              </span>
              <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                {currentQuestion?.text}
              </h2>
            </div>

            <div className="space-y-4 flex-grow">
              {currentQuestion?.options.map((option) => (
                <label 
                  key={option.id}
                  className={`flex items-center p-5 rounded-xl border-2 transition-all cursor-pointer group
                    ${answers[currentQuestion.id] === option.id 
                      ? 'border-navy bg-navy/5 shadow-inner' 
                      : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                >
                  <input
                    type="radio"
                    name={`q-${currentQuestion.id}`}
                    className="w-5 h-5 text-navy focus:ring-navy cursor-pointer"
                    checked={answers[currentQuestion.id] === option.id}
                    onChange={() => setAnswers({ ...answers, [currentQuestion.id]: option.id })}
                  />
                  <span className={`ml-4 text-lg font-medium transition-colors ${answers[currentQuestion.id] === option.id ? 'text-navy' : 'text-slate-700'}`}>
                    {option.text}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-100">
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="flex items-center space-x-2 text-slate-500 hover:text-navy font-bold py-2 px-4 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                <span>Previous</span>
              </button>

              <div className="text-slate-400 font-medium hidden sm:block">
                Question {currentQuestionIndex + 1} of {exam.questions.length}
              </div>

              {currentQuestionIndex === exam.questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-8 rounded-lg shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Final Submit'}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(exam.questions.length - 1, prev + 1))}
                  className="bg-navy hover:bg-navy-dark text-white font-bold py-2 px-8 rounded-lg shadow-lg flex items-center space-x-2"
                >
                  <span>Next Question</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
              )}
            </div>
          </div>
          
          <div className="mt-8 text-center text-slate-400 text-xs italic">
            * All your selections are automatically saved as you navigate between questions.
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExamRoom;
