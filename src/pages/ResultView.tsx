import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ExamSubmission, Exam, Question } from '../types';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  CheckCircle, 
  XCircle, 
  Info, 
  ArrowLeft,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function ResultView() {
  const { submissionId } = useParams();
  const [submission, setSubmission] = useState<ExamSubmission | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchResult() {
      if (!submissionId) return;
      try {
        const subDoc = await getDoc(doc(db, 'submissions', submissionId));
        if (!subDoc.exists()) {
          navigate('/dashboard');
          return;
        }
        const subData = subDoc.data() as ExamSubmission;
        setSubmission(subData);

        const examDoc = await getDoc(doc(db, 'exams', subData.examId));
        if (examDoc.exists()) setExam(examDoc.data() as Exam);

        // We could fetch questions to show correct answers, but often for security it's hidden.
        // For this demo, let's allow viewing the breakdown.
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, [submissionId, navigate]);

  if (loading || !submission || !exam) {
    return (
       <div className="h-screen flex items-center justify-center font-bold text-slate-400">
          CALCULATING RESULTS...
       </div>
    );
  }

  const score = submission.score || 0;
  const percentage = (score / exam.totalMarks) * 100;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 font-sans">
        <button 
           onClick={() => navigate('/dashboard')}
           className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-400 transition-all uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Return to Operations
        </button>

        {/* Hero Result Section */}
        <section className="bg-[#161618] rounded-2xl p-10 md:p-16 border border-slate-800 shadow-2xl text-center relative overflow-hidden">
           {/* Decorative background accent */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-indigo-600/5 blur-3xl -z-10"></div>
           
           <motion.div
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="mx-auto w-20 h-20 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-10 shadow-lg border border-indigo-600/20"
           >
              <Trophy size={40} />
           </motion.div>

           <h1 className="text-3xl font-bold text-slate-100 mb-2 uppercase italic tracking-tight">Mission Outcome</h1>
           <p className="text-slate-500 font-medium mb-12 uppercase text-[10px] tracking-[0.2em]">Assignment: <span className="text-indigo-400">{exam.title}</span></p>

           <div className="flex flex-col md:flex-row items-center justify-center gap-16 mb-12">
              <div>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Total Mark Accumulation</p>
                 <p className="text-6xl font-black text-slate-100 tracking-tighter">{score.toFixed(1)} <span className="text-2xl text-slate-600">/ {exam.totalMarks}</span></p>
              </div>
              <div className="h-20 w-px bg-slate-800 hidden md:block"></div>
              <div>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Integrity Percentage</p>
                 <p className={cn(
                    "text-6xl font-black tracking-tighter",
                    percentage >= 80 ? "text-emerald-500" : percentage >= 40 ? "text-amber-500" : "text-red-500"
                 )}>{percentage.toFixed(0)}<span className="text-2xl opacity-40">%</span></p>
              </div>
           </div>

           <div className="flex flex-wrap justify-center gap-6">
              <div className="bg-[#0A0A0B] border border-slate-800 px-6 py-3 rounded-xl flex items-center gap-3">
                 <CheckCircle size={16} className="text-emerald-500" />
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Validated Entry</span>
              </div>
              <div className="bg-[#0A0A0B] border border-slate-800 px-6 py-3 rounded-xl flex items-center gap-3">
                 <Info size={16} className="text-indigo-400" />
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Telemetry Logged</span>
              </div>
           </div>
        </section>

        {/* Section Breakdown */}
        <section className="space-y-6">
           <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Advanced Analysis</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#161618] p-8 rounded-2xl border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-all">
                 <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Successful Nodes</p>
                    <p className="text-3xl font-black text-emerald-500">N/A</p>
                 </div>
                 <CheckCircle size={40} className="text-emerald-500/10" />
              </div>
              <div className="bg-[#161618] p-8 rounded-2xl border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-all">
                 <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Total Engagements</p>
                    <p className="text-3xl font-black text-indigo-500">{Object.keys(submission.answers).length}</p>
                 </div>
                 <ArrowRightIcon size={40} className="text-indigo-500/10" />
              </div>
           </div>
        </section>

        <div className="bg-indigo-600 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-indigo-900/20">
           <div>
              <h3 className="font-bold text-lg uppercase italic tracking-tight">Mission Debriefing</h3>
              <p className="text-xs font-medium opacity-80 uppercase tracking-widest">Return to tactical view to assess further opportunities.</p>
           </div>
           <button 
             onClick={() => navigate('/dashboard')}
             className="w-full md:w-auto bg-white text-indigo-600 px-10 py-4 rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-900/10 active:scale-95 transition-all"
           >
             Return Home
           </button>
        </div>
      </div>
    </Layout>
  );
}

function ArrowRightIcon({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
    </svg>
  );
}
