import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { collection, query, getDocs, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Exam, Question } from '../types';
import Layout from '../components/Layout';
import { 
  Plus, 
  Settings, 
  Trash2, 
  Edit, 
  ExternalLink,
  ChevronRight,
  Database,
  BarChart3
} from 'lucide-react';
import { cn } from '../lib/utils';

// Subcomponents
const ExamList = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchExams() {
      const q = query(collection(db, 'exams'));
      const snap = await getDocs(q);
      setExams(snap.docs.map(d => ({ ...d.data(), id: d.id } as Exam)));
    }
    fetchExams();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this exam?')) {
      await deleteDoc(doc(db, 'exams', id));
      setExams(prev => prev.filter(e => e.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h1 className="text-2xl font-bold text-slate-900">Manage Examinations</h1>
         <button 
           onClick={() => navigate('/admin/create')}
           className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
         >
           <Plus size={18} /> Create New Exam
         </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
           <thead>
             <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
               <th className="px-6 py-4">Examination</th>
               <th className="px-6 py-4">Status</th>
               <th className="px-6 py-4">Duration</th>
               <th className="px-6 py-4 text-right">Actions</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-50">
             {exams.map(exam => (
               <tr key={exam.id} className="hover:bg-slate-50/50 transition-all group">
                 <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{exam.title}</p>
                    <p className="text-xs text-slate-400 line-clamp-1">{exam.description || 'No description'}</p>
                 </td>
                 <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                      exam.active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                    )}>
                      {exam.active ? 'Active' : 'Draft'}
                    </span>
                 </td>
                 <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                    {exam.durationInMinutes} mins
                 </td>
                 <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                         onClick={() => navigate(`/admin/questions/${exam.id}`)}
                         className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                         title="Manage Questions"
                       >
                         <Database size={18} />
                       </button>
                       <button 
                         onClick={() => handleDelete(exam.id)}
                         className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                       >
                         <Trash2 size={18} />
                       </button>
                    </div>
                 </td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>
    </div>
  );
};

const CreateExam = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    durationInMinutes: 60,
    totalMarks: 100,
    active: true
  });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'exams'), {
      ...formData,
      createdAt: Date.now()
    });
    navigate('/admin');
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
       <h1 className="text-2xl font-bold text-slate-900 mb-6">Create New Examination</h1>
       <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
             <label className="text-sm font-bold text-slate-700">Exam Title</label>
             <input 
               required
               className="w-full rounded-2xl border border-slate-200 p-3 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none"
               value={formData.title}
               onChange={(e) => setFormData({...formData, title: e.target.value})}
               placeholder="e.g. Advanced Mathematics Final"
             />
          </div>
          <div className="space-y-2">
             <label className="text-sm font-bold text-slate-700">Description</label>
             <textarea 
               className="w-full rounded-2xl border border-slate-200 p-3 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none h-32"
               value={formData.description}
               onChange={(e) => setFormData({...formData, description: e.target.value})}
               placeholder="Detailed instructions for students..."
             />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
               <label className="text-sm font-bold text-slate-700">Duration (mins)</label>
               <input 
                 type="number"
                 className="w-full rounded-2xl border border-slate-200 p-3 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none"
                 value={formData.durationInMinutes}
                 onChange={(e) => setFormData({...formData, durationInMinutes: parseInt(e.target.value)})}
               />
            </div>
            <div className="space-y-2">
               <label className="text-sm font-bold text-slate-700">Total Marks</label>
               <input 
                 type="number"
                 className="w-full rounded-2xl border border-slate-200 p-3 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none"
                 value={formData.totalMarks}
                 onChange={(e) => setFormData({...formData, totalMarks: parseInt(e.target.value)})}
               />
            </div>
          </div>
          <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95">
             Create Examination
          </button>
       </form>
    </div>
  );
};

export default function AdminPanel() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ExamList />} />
        <Route path="/create" element={<CreateExam />} />
        {/* Further routes for question management would be added here */}
      </Routes>
    </Layout>
  );
}
