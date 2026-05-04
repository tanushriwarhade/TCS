import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Exam, ResultSummary } from '../types';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';
import { 
  Plus, 
  ArrowRight, 
  Clock, 
  Award, 
  Target, 
  TrendingUp,
  Calendar,
  Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const [activeExams, setActiveExams] = useState<Exam[]>([]);
  const [recentResults, setRecentResults] = useState<ResultSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { profile } = useAuth();

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch active exams
        const examsQuery = query(collection(db, 'exams'), where('active', '==', true), limit(3));
        const examSnap = await getDocs(examsQuery);
        const exams = examSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
        setActiveExams(exams);

        // Fetch recent results if student
        if (profile?.role === 'student') {
          const resultsQuery = query(
            collection(db, 'submissions'), 
            where('userId', '==', profile.uid),
            where('status', '==', 'completed'),
            orderBy('completedAt', 'desc'),
            limit(3)
          );
          const resultSnap = await getDocs(resultsQuery);
          // In a real app we'd map these to ResultSummary with exam details
          // For now, empty or mock if none exist
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (profile) fetchData();
  }, [profile]);

  const cards = [
    { title: 'Average Score', value: '82%', icon: TrendingUp, color: 'bg-emerald-500' },
    { title: 'Exams Taken', value: '12', icon: Target, color: 'bg-blue-500' },
    { title: 'Total Points', value: '1,420', icon: Award, color: 'bg-amber-500' },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Banner */}
        <header>
          <div className="flex items-center gap-3 mb-2">
             <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
             <h1 className="text-2xl font-bold text-slate-100 tracking-tight uppercase">Dashboard Control</h1>
          </div>
          <p className="text-slate-500 font-medium tracking-tight">System Status: <span className="text-emerald-500">OPTIMAL</span> • Welcome, {profile?.displayName.split(' ')[0]}</p>
        </header>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#161618] p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between group hover:border-slate-700 transition-all"
            >
              <div>
                <p className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">{card.title}</p>
                <p className="text-3xl font-bold text-slate-100">{card.value}</p>
              </div>
              <div className={cn("p-3 rounded-xl text-white shadow-lg", card.color, "shadow-" + card.color.split('-')[1] + "-900/20")}>
                <card.icon size={24} />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Exams Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
               <h2 className="text-sm font-bold flex items-center gap-3 uppercase tracking-widest text-slate-400">
                 <Layers size={18} className="text-indigo-400" />
                 Active Examinations
               </h2>
               <button className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-all">
                 View all missions
               </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {activeExams.length > 0 ? activeExams.map(exam => (
                <div key={exam.id} className="group bg-[#161618] p-8 rounded-2xl border border-slate-800 hover:border-indigo-600/50 hover:shadow-2xl hover:shadow-indigo-900/10 transition-all duration-300">
                  <div className="flex flex-col md:flex-row md:items-center gap-8">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold uppercase tracking-tighter">Level: Advanced</span>
                        <span className="text-[10px] bg-indigo-900/40 text-indigo-400 px-2 py-0.5 rounded font-bold uppercase tracking-tighter">Phase 1</span>
                      </div>
                      <h3 className="font-bold text-xl text-slate-100 mb-3 group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{exam.title}</h3>
                      <p className="text-slate-500 text-sm line-clamp-2 mb-6 font-medium leading-relaxed">{exam.description}</p>
                      <div className="flex flex-wrap gap-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <span className="flex items-center gap-2">
                          <Clock size={14} className="text-slate-600" /> {exam.durationInMinutes} MIN
                        </span>
                        <span className="flex items-center gap-2">
                          <Target size={14} className="text-slate-600" /> {exam.totalMarks} PTS
                        </span>
                        <span className="flex items-center gap-2 text-indigo-400">
                          <Award size={14} /> CERTIFIED
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate(`/exam/${exam.id}`)}
                      className="inline-flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/20 active:scale-95"
                    >
                      Attempt Mission
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="bg-[#121214] p-16 rounded-2xl border border-slate-800 border-dashed flex flex-col items-center justify-center text-center">
                   <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center text-slate-700 mb-6 font-bold text-4xl">?</div>
                   <h3 className="font-bold text-slate-300 text-lg uppercase tracking-tight mb-2">No Active Missions</h3>
                   <p className="text-slate-600 text-sm max-w-xs font-medium">Standard assessment cycles are currently idle. Monitor portal for updates.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions / Recent Activity */}
          <div className="space-y-6">
             <div className="bg-[#111113] rounded-2xl p-8 border border-slate-800 shadow-2xl">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Security Protocol</h2>
                <ul className="space-y-6">
                  <li className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex-shrink-0 flex items-center justify-center text-indigo-500 text-xs font-bold border border-indigo-500/20">01</div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-300 uppercase mb-1">Network Integrity</p>
                      <p className="text-[11px] text-slate-500 italic leading-relaxed">Ensure redundant internet connectivity before engaging mission.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                     <div className="w-8 h-8 rounded-lg bg-red-500/10 flex-shrink-0 flex items-center justify-center text-red-500 text-xs font-bold border border-red-500/20">02</div>
                     <div>
                       <p className="text-[11px] font-bold text-slate-300 uppercase mb-1">Environmental Guard</p>
                       <p className="text-[11px] text-slate-500 italic leading-relaxed">System-level detection enabled for concurrent tab activity.</p>
                     </div>
                  </li>
                </ul>
                <button className="w-full mt-10 bg-slate-800 hover:bg-slate-700 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-300 transition-all border border-slate-700">
                  Operations Guide
                </button>
             </div>

             <div className="bg-[#161618] rounded-2xl p-8 border border-slate-800 shadow-xl">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Upcoming Schedule</h2>
                <div className="space-y-6">
                  <div className="flex items-center gap-5 group cursor-pointer">
                     <div className="w-14 h-14 rounded-xl bg-slate-800 flex flex-col items-center justify-center text-slate-100 flex-shrink-0 group-hover:bg-indigo-600/20 transition-all border border-slate-700 group-hover:border-indigo-600/40">
                        <span className="text-[10px] font-bold uppercase text-slate-500 group-hover:text-indigo-400">May</span>
                        <span className="text-xl font-bold tracking-tighter">12</span>
                     </div>
                     <div>
                        <p className="text-sm font-bold text-slate-200 uppercase tracking-tight group-hover:text-indigo-400 transition-colors">Distributed Arch.</p>
                        <p className="text-[10px] text-slate-500 font-bold tracking-widest">10:00 AM • PHASE III</p>
                     </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
