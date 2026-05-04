import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { Exam, Question, ExamSubmission } from '../types';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  CheckCircle, 
  Maximize, 
  TriangleAlert,
  Save,
  Menu,
  X,
  BookOpen
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function ExamInterface() {
  const { examId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPalette, setShowPalette] = useState(false);
  const [warnings, setWarnings] = useState(0);

  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize Exam
  useEffect(() => {
    async function initExam() {
      if (!examId || !profile) return;
      
      try {
        const examDoc = await getDoc(doc(db, 'exams', examId));
        if (!examDoc.exists()) {
          alert("Exam not found");
          navigate('/dashboard');
          return;
        }
        const examData = examDoc.data() as Exam;
        setExam({ ...examData, id: examDoc.id });
        setTimeLeft(examData.durationInMinutes * 60);

        const qSnap = await getDocs(collection(db, `exams/${examId}/questions`));
        setQuestions(qSnap.docs.map(d => ({ ...d.data(), id: d.id } as Question)));

        // Check for existing session
        const subId = `${profile.uid}_${examId}`;
        const subDoc = await getDoc(doc(db, 'submissions', subId));
        if (subDoc.exists()) {
          const subData = subDoc.data() as ExamSubmission;
          if (subData.status === 'completed') {
            navigate(`/results/${subId}`);
            return;
          }
          setAnswers(subData.answers || {});
          // Calculate remaining time
          const elapsed = Math.floor((Date.now() - subData.startedAt) / 1000);
          const remaining = (examData.durationInMinutes * 60) - elapsed;
          if (remaining <= 0) {
            handleAutoSubmit();
          } else {
            setTimeLeft(remaining);
          }
        } else {
          // Create new session
          await setDoc(doc(db, 'submissions', subId), {
            userId: profile.uid,
            examId,
            status: 'ongoing',
            startedAt: Date.now(),
            answers: {}
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    initExam();
  }, [examId, profile, navigate]);

  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0 || loading) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading]);

  // Tab switch warning
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        setWarnings(prev => prev + 1);
        alert("Warning: Switching tabs is not allowed during the exam!");
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Auto-save logic
  useEffect(() => {
    autoSaveTimer.current = setInterval(() => {
      saveProgress();
    }, 10000); // 10 seconds
    return () => {
      if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
    };
  }, [answers]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (loading || !currentQuestion) return;
      if (e.key === 's' || e.key === 'S') {
        saveProgress();
        if (currentIdx < questions.length - 1) setCurrentIdx(prev => prev + 1);
      }
      if (['1', '2', '3', '4'].includes(e.key)) {
        const optionIdx = parseInt(e.key) - 1;
        if (currentQuestion.options && currentQuestion.options[optionIdx]) {
           const opt = currentQuestion.options[optionIdx];
           if (currentQuestion.type === 'mcq-single') {
             handleAnswerChange(currentQuestion.id, [opt]);
           } else {
             const current = answers[currentQuestion.id] || [];
             if (current.includes(opt)) {
               handleAnswerChange(currentQuestion.id, current.filter(o => o !== opt));
             } else {
               handleAnswerChange(currentQuestion.id, [...current, opt]);
             }
           }
        }
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [currentIdx, currentQuestion, answers, loading]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const saveProgress = async () => {
    if (!profile || !examId) return;
    const subId = `${profile.uid}_${examId}`;
    try {
      await updateDoc(doc(db, 'submissions', subId), {
        answers,
        lastSaved: Date.now()
      });
    } catch (err) {
      console.warn("Auto-save failed", err);
    }
  };

  const handleAnswerChange = (qId: string, value: string[]) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const toggleMarkForReview = (qId: string) => {
    setMarkedForReview(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const handleAutoSubmit = async () => {
    await submitExam();
  };

  const submitExam = async () => {
    if (!profile || !examId || !exam) return;
    setLoading(true);
    const subId = `${profile.uid}_${examId}`;
    
    // Scoring Logic
    let score = 0;
    questions.forEach(q => {
      const userAns = answers[q.id] || [];
      const isCorrect = userAns.length === q.correctAnswers.length && 
                        userAns.every(v => q.correctAnswers.includes(v));
      if (isCorrect) score += q.marks;
      else if (userAns.length > 0) score -= (q.negativeMarks || 0);
    });

    try {
      await updateDoc(doc(db, 'submissions', subId), {
        status: 'completed',
        completedAt: Date.now(),
        answers,
        score
      });
      navigate(`/results/${subId}`);
    } catch (err) {
      console.error(err);
      alert("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading || !exam) return (
     <div className="h-screen w-screen flex items-center justify-center font-bold text-slate-400 animate-pulse">
        PREPARING EXAM ENVIRONMENT...
     </div>
  );

  const currentQuestion = questions[currentIdx];

  return (
    <div className="h-screen flex flex-col bg-[#0A0A0B] text-slate-200 select-none font-sans">
      {/* Header */}
      <header className="h-16 bg-[#161618] border-b border-slate-800 px-6 flex items-center justify-between shadow-sm z-30">
        <div className="flex items-center gap-4">
           <div className="bg-indigo-600 text-white p-2 rounded-lg shadow-lg shadow-indigo-600/20">
             <BookOpen size={20} />
           </div>
           <div>
             <h1 className="font-bold text-slate-100 leading-tight text-sm uppercase tracking-tight">{exam.title}</h1>
             <p className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">Assessment Phase I</p>
           </div>
        </div>

        <div className="flex items-center gap-6">
           <div className={cn(
             "px-4 py-2 rounded-xl flex items-center gap-3 font-mono font-bold transition-colors border border-slate-700",
             timeLeft < 300 ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-slate-900 text-slate-300"
           )}>
             <Clock size={18} className={timeLeft < 300 ? "animate-pulse" : ""} />
             {formatTime(timeLeft)}
           </div>

           <button 
             onClick={toggleFullScreen}
             className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 transition-all font-bold text-xs"
           >
             <Maximize size={16} /> Full Screen
           </button>
           
           <button 
             onClick={() => { if(confirm('Ready to submit?')) submitExam(); }}
             className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
           >
             Finish Attempt
           </button>

           <button 
             onClick={() => setShowPalette(!showPalette)}
             className="lg:hidden p-2 text-slate-400"
           >
             <Menu size={24} />
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Interface */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 flex flex-col items-center bg-[#0F0F11]">
           <div className="w-full max-w-4xl">
              {/* Question Header */}
              <div className="flex items-center justify-between mb-10 bg-[#141416] p-4 rounded-2xl border border-slate-800 shadow-sm">
                 <div className="flex items-center gap-3">
                    <span className="bg-slate-800 text-slate-100 px-4 py-1 rounded text-sm font-bold uppercase">
                       Question {currentIdx + 1}
                    </span>
                    <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Section: General Logic</span>
                 </div>
                 <div className="flex gap-4">
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                       Marks: <span className="text-emerald-500">+{currentQuestion?.marks}</span>
                    </span>
                    {currentQuestion?.negativeMarks ? (
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        Negative: <span className="text-red-400">-{currentQuestion.negativeMarks}</span>
                      </span>
                    ) : null}
                 </div>
              </div>

              {/* Question Text */}
              <div className="mb-12">
                 <h2 className="text-lg md:text-xl font-medium text-slate-100 leading-relaxed border-l-4 border-indigo-600 pl-6">
                   {currentQuestion?.text}
                 </h2>
              </div>

              {/* Options */}
              <div className="space-y-4 mb-12 max-w-3xl">
                 {currentQuestion?.type === 'numeric' ? (
                   <input 
                      type="number"
                      className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xl font-bold text-indigo-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 outline-none transition-all"
                      placeholder="Enter numeric value..."
                      value={answers[currentQuestion.id]?.[0] || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, [e.target.value])}
                   />
                 ) : (
                   currentQuestion?.options?.map((option, idx) => {
                     const isSelected = (answers[currentQuestion.id] || []).includes(option);
                     return (
                       <button
                         key={idx}
                         onClick={() => {
                           if (currentQuestion.type === 'mcq-single') {
                             handleAnswerChange(currentQuestion.id, [option]);
                           } else {
                             const current = answers[currentQuestion.id] || [];
                             if (current.includes(option)) {
                               handleAnswerChange(currentQuestion.id, current.filter(o => o !== option));
                             } else {
                               handleAnswerChange(currentQuestion.id, [...current, option]);
                             }
                           }
                         }}
                         className={cn(
                           "w-full flex items-center gap-4 text-left p-5 rounded-xl border border-slate-800 transition-all active:scale-[0.99] group",
                           isSelected 
                             ? "bg-indigo-600/10 border-indigo-600 text-indigo-100" 
                             : "bg-slate-900 border-slate-800 hover:border-slate-600 text-slate-400"
                         )}
                       >
                         <div className={cn(
                           "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                           isSelected ? "border-indigo-500" : "border-slate-700"
                         )}>
                            {isSelected && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />}
                         </div>
                         <span className={cn("text-sm font-medium", isSelected ? "text-indigo-100" : "text-slate-400")}>
                           {option}
                         </span>
                       </button>
                     );
                   })
                 )}
              </div>

              {/* Navigation Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 py-8 border-t border-slate-800">
                 <div className="flex gap-3">
                    <button 
                      disabled={currentIdx === 0}
                      onClick={() => setCurrentIdx(prev => prev - 1)}
                      className="px-6 py-2.5 rounded text-sm font-semibold border border-slate-700 text-slate-400 hover:bg-slate-800 disabled:opacity-30 transition-all"
                    >
                      Previous
                    </button>
                    <button 
                      disabled={currentIdx === questions.length - 1}
                      onClick={() => setCurrentIdx(prev => prev + 1)}
                      className="px-6 py-2.5 rounded text-sm font-semibold border border-slate-700 text-slate-400 hover:bg-slate-800 disabled:opacity-30 transition-all"
                    >
                      Next
                    </button>
                 </div>

                 <div className="flex gap-3">
                    <button 
                       onClick={() => toggleMarkForReview(currentQuestion.id)}
                       className={cn(
                         "px-6 py-3 rounded text-sm font-semibold border border-slate-700 transition-all",
                         markedForReview.has(currentQuestion.id)
                          ? "bg-amber-600/10 text-amber-500 border-amber-600/40"
                          : "text-amber-500 hover:bg-amber-600/5"
                       )}
                    >
                      Mark for Review
                    </button>
                    <button 
                      onClick={() => {
                        saveProgress();
                        if (currentIdx < questions.length - 1) setCurrentIdx(prev => prev + 1);
                      }}
                      className="px-10 py-2.5 bg-indigo-600 text-white rounded font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
                    >
                      Save & Next
                    </button>
                 </div>
              </div>
           </div>
        </div>

        {/* Sidebar Question Palette */}
        <aside className={cn(
          "w-80 bg-[#121214] border-l border-slate-800 p-6 flex flex-col z-40 transition-transform lg:translate-x-0 overflow-y-auto h-full absolute right-0 top-16 lg:relative lg:top-0",
          showPalette ? "translate-x-0" : "translate-x-full"
        )}>
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Question Palette</h3>
              <div className="text-[10px] font-bold text-indigo-400 bg-indigo-900/20 px-2 py-0.5 rounded uppercase">Synced</div>
           </div>

           <div className="grid grid-cols-5 gap-2 mb-8">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] && answers[q.id].length > 0;
                const isMarked = markedForReview.has(q.id);
                const isCurrent = currentIdx === idx;
                
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIdx(idx);
                      if (window.innerWidth < 1024) setShowPalette(false);
                    }}
                    className={cn(
                      "w-10 h-10 flex items-center justify-center rounded text-xs font-bold transition-all relative",
                      isCurrent && "border-2 border-indigo-500 bg-slate-800 text-white",
                      !isCurrent && (
                        isMarked 
                          ? "bg-amber-500 text-white" 
                          : isAnswered 
                            ? "bg-emerald-600 text-white" 
                            : "bg-slate-800 text-slate-500 border border-slate-700"
                      )
                    )}
                  >
                    {(idx + 1).toString().padStart(2, '0')}
                  </button>
                );
              })}
           </div>

           <div className="mt-auto pt-8 border-t border-slate-800 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 bg-emerald-600 rounded-sm"></div>
                   <span className="text-[10px] text-slate-500 uppercase font-bold">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 bg-amber-500 rounded-sm"></div>
                   <span className="text-[10px] text-slate-500 uppercase font-bold">Review</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 bg-slate-800 border border-slate-700 rounded-sm"></div>
                   <span className="text-[10px] text-slate-500 uppercase font-bold">Unvisited</span>
                </div>
              </div>
              
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                 <p className="text-[11px] font-bold text-indigo-400 uppercase mb-2">Instructions</p>
                 <p className="text-[11px] text-slate-500 italic leading-relaxed">
                   Note: Section auto-switches in 45 minutes. Ensure all marked responses are saved.
                 </p>
              </div>

              <button 
                onClick={() => { if(confirm('Are you ready to submit your final examination?')) submitExam(); }}
                className="w-full mt-6 py-4 bg-red-600/10 border border-red-600/40 text-red-500 rounded font-bold text-sm tracking-widest hover:bg-red-600 hover:text-white transition-all uppercase"
              >
                Final Submission
              </button>
           </div>
        </aside>
      </div>
    </div>
  );
}
