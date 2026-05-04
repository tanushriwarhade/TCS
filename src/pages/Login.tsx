import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
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
            <LogIn size={28} />
          </div>
          <h2 className="mt-8 text-2xl font-bold tracking-tight text-slate-100 uppercase italic">Control Access</h2>
          <p className="mt-2 text-xs font-bold text-slate-500 uppercase tracking-widest">Secure Exam Portal • Auth Phase</p>
        </div>

        <form className="mt-10 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="flex items-center gap-3 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-xs font-bold text-red-400 uppercase tracking-tight">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-5">
            <div className="relative">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block" htmlFor="email">Identity (Email)</label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 py-3.5 pl-11 pr-4 text-sm text-slate-200 transition-all focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10"
                  placeholder="user@system.io"
                />
                <Mail className="absolute left-4 top-3.5 text-slate-600" size={18} />
              </div>
            </div>

            <div className="relative">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block" htmlFor="password">Passcode</label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 py-3.5 pl-11 pr-4 text-sm text-slate-200 transition-all focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-4 top-3.5 text-slate-600" size={18} />
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
            {loading ? "Authenticating..." : "Initialize Session"}
          </button>
        </form>

        <p className="text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          New operative?{" "}
          <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 transition-colors">Register Identity</Link>
        </p>
      </motion.div>
    </div>
  );
}
