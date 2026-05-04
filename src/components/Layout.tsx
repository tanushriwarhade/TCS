import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../services/firebase';
import { 
  LayoutDashboard, 
  BookOpen, 
  History, 
  Settings, 
  LogOut, 
  ShieldCheck,
  User as UserIcon,
  Bell
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  if (loading) return null;
  if (!profile) {
    navigate('/login');
    return null;
  }

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['student', 'admin'] },
    { icon: BookOpen, label: 'My Exams', path: '/dashboard/exams', roles: ['student'] },
    { icon: History, label: 'Results', path: '/dashboard/results', roles: ['student'] },
    { icon: ShieldCheck, label: 'Admin Portal', path: '/admin', roles: ['admin'] },
    { icon: Settings, label: 'Settings', path: '/settings', roles: ['student', 'admin'] },
  ].filter(item => item.roles.includes(profile.role));

  return (
    <div className="flex h-screen bg-[#0A0A0B] text-slate-200 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-[#161618] border-r border-slate-800 hidden lg:flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 text-indigo-500 font-bold text-xl uppercase tracking-wider">
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg shadow-indigo-900/20 shadow-lg">
              <ShieldCheck size={20} />
            </div>
            ExamPro
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all",
                location.pathname === item.path 
                  ? "bg-indigo-600/10 text-indigo-400" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-[#0F0F11] rounded-2xl p-4 mb-4 border border-slate-800">
            <div className="flex items-center gap-3 mb-1">
               <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 border border-slate-700">
                 <UserIcon size={20} />
               </div>
               <div className="flex-1 overflow-hidden">
                 <p className="text-sm font-semibold truncate text-slate-200 uppercase">{profile.displayName}</p>
                 <p className="text-[10px] text-slate-500 truncate uppercase tracking-widest">{profile.role}</p>
               </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 rounded-xl hover:bg-red-500/10 transition-all"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-[#161618] border-b border-slate-800 px-6 flex items-center justify-between">
           <div className="lg:hidden flex items-center gap-2 font-bold text-indigo-500">
             <ShieldCheck size={24} />
             ExamPro
           </div>
           
           <div className="hidden lg:block text-slate-500 text-xs font-medium uppercase tracking-widest">
              Advanced Assessment Platform
           </div>

           <div className="flex items-center gap-4">
             <button className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-full transition-all relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#161618]"></span>
             </button>
             <div className="h-8 w-px bg-slate-800 mx-1"></div>
             <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                   <p className="text-xs font-bold text-slate-300 uppercase">{profile.displayName}</p>
                   <p className="text-[10px] text-indigo-400 font-bold tracking-widest">{profile.role.toUpperCase()}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-indigo-600/20">
                  {profile.displayName.substring(0, 1)}
                </div>
             </div>
           </div>
        </header>

        {/* Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0A0A0B]">
          {children}
        </div>
      </main>
    </div>
  );
}
