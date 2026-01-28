
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Exam, ExamResult, User } from '../types';

type Tab = 'exams' | 'results';

const StudentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('exams');
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user: User | null = JSON.parse(localStorage.getItem('exam_user') || 'null');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'exams') {
          const data = await api.getExams();
          setExams(data);
        } else if (activeTab === 'results' && user) {
          const data = await api.getResultsByStudent(user.id);
          setResults(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-full pt-40">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mb-4"></div>
        <p className="text-slate-400 font-medium">Fetching your records...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div className="text-center md:text-left">
          <h2 className="text-3xl font-extrabold text-navy mb-2">Student Portal</h2>
          <p className="text-slate-500">Welcome back, {user?.username}. Monitor your academic progress.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
          <button 
            onClick={() => setActiveTab('exams')}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'exams' ? 'bg-white shadow-sm text-navy' : 'text-slate-500 hover:text-navy'}`}
          >
            Available Exams
          </button>
          <button 
            onClick={() => setActiveTab('results')}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'results' ? 'bg-white shadow-sm text-navy' : 'text-slate-500 hover:text-navy'}`}
          >
            My Results
          </button>
        </div>
      </div>

      {activeTab === 'exams' ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exams.map((exam) => (
              <div key={exam.id} className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
                <div className="p-6 flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-slate-900">{exam.title}</h3>
                    <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200">
                      {exam.durationMinutes} Mins
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                    {exam.description || 'No description provided for this exam.'}
                  </p>
                  <div className="flex items-center text-xs text-slate-500 space-x-4">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-navy-light" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      {exam.questions.length} Questions
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-navy-light" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                      Proctored
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
                  <button 
                    onClick={() => navigate(`/exam/${exam.id}`)}
                    className="bg-navy hover:bg-navy-dark text-white text-sm font-bold py-2.5 px-8 rounded-lg transition-all shadow-sm"
                  >
                    Take Exam
                  </button>
                </div>
              </div>
            ))}

            {exams.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-medium">No active examinations available.</p>
              </div>
            )}
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="text-blue-900 font-bold mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Safety Information
            </h4>
            <ul className="text-blue-800 text-sm list-disc pl-5 space-y-1">
              <li>Tab switching is strictly monitored and will lead to an auto-submission.</li>
              <li>Ensure your webcam/mic (if requested) is clear and functional.</li>
              <li>You cannot return to a previous question if "Backwards Navigation" is disabled by the admin.</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-slate-100">
            <h3 className="font-bold text-navy uppercase text-xs tracking-widest">My Performance History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="px-6 py-4">Exam Title</th>
                  <th className="px-6 py-4 text-center">Score</th>
                  <th className="px-6 py-4">Result</th>
                  <th className="px-6 py-4">Submission Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700 text-sm">{res.examTitle}</td>
                    <td className="px-6 py-4 text-center">
                       <span className={`font-bold text-sm ${res.score / res.totalQuestions >= 0.5 ? 'text-green-600' : 'text-red-500'}`}>
                         {res.score} / {res.totalQuestions}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center space-x-3">
                         <div className="flex-grow w-32 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                           <div 
                             className={`h-full ${res.score / res.totalQuestions >= 0.5 ? 'bg-green-500' : 'bg-red-500'}`} 
                             style={{ width: `${(res.score/res.totalQuestions)*100}%` }}
                           ></div>
                         </div>
                         <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${res.score / res.totalQuestions >= 0.5 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                           {res.score / res.totalQuestions >= 0.5 ? 'Pass' : 'Fail'}
                         </span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                      {new Date(res.submittedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic font-medium">
                      You haven't completed any exams yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
