import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, AlertCircle, Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import { UserRole } from '../types';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: name,
        email: email,
        role: role,
        createdAt: Date.now()
      });

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0B] p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-8 rounded-2xl bg-[#161618] p-10 border border-slate-800 shadow-2xl"
      >
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/20">
            <UserPlus size={28} />
          </div>
          <h2 className="mt-8 text-2xl font-bold tracking-tight text-slate-100 uppercase italic">Initiate Identity</h2>
          <p className="mt-2 text-xs font-bold text-slate-500 uppercase tracking-widest">Register New operative • Registry Phase</p>
        </div>

        <form className="mt-10 space-y-5" onSubmit={handleSignup}>
          {error && (
            <div className="flex items-center gap-3 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-xs font-bold text-red-400 uppercase tracking-tight">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
             <div className="relative">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block" htmlFor="name">Full Designation (Name)</label>
              <div className="relative">
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 py-3 pl-11 pr-4 text-sm text-slate-200 transition-all focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10"
                  placeholder="AGENT_NAME"
                />
                <User className="absolute left-4 top-3 text-slate-600" size={18} />
              </div>
            </div>

            <div className="relative">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block" htmlFor="email">Comms ID (Email)</label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 py-3 pl-11 pr-4 text-sm text-slate-200 transition-all focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10"
                  placeholder="name@system.io"
                />
                <Mail className="absolute left-4 top-3 text-slate-600" size={18} />
              </div>
            </div>

            <div className="relative">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block" htmlFor="password">Security Passcode</label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 py-3 pl-11 pr-4 text-sm text-slate-200 transition-all focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-4 top-3 text-slate-600" size={18} />
              </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Operational Role</label>
               <div className="grid grid-cols-2 gap-4">
                 <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold transition-all uppercase tracking-widest",
                      role === 'student' ? "border-indigo-600 bg-indigo-900/10 text-indigo-400" : "border-slate-800 bg-slate-900/50 text-slate-500 hover:bg-slate-800"
                    )}
                 >
                   <User size={14} />
                   Student
                 </button>
                 <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold transition-all uppercase tracking-widest",
                      role === 'admin' ? "border-indigo-600 bg-indigo-900/10 text-indigo-400" : "border-slate-800 bg-slate-900/50 text-slate-500 hover:bg-slate-800"
                    )}
                 >
                   <Shield size={14} />
                   Admin
                 </button>
               </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "flex w-full items-center justify-center rounded-xl bg-indigo-600 py-4 text-xs font-bold text-white uppercase tracking-widest transition-all hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 active:scale-[0.98]",
              loading && "cursor-not-allowed opacity-70"
            )}
          >
            {loading ? "Registering Agent..." : "Create Registry"}
          </button>
        </form>

        <p className="text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          Already registered?{" "}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">Access Session</Link>
        </p>
      </motion.div>
    </div>
  );
}
