import React from 'react';
import { RefreshCw, Sun, Moon, Sparkles, Laptop } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  onOpenNotifications: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNotifications,
  onRefresh,
  isRefreshing,
}) => {
  const { user, unreadCount } = useAuth();
  const { themeMode, effectiveTheme, setThemeMode } = useTheme();

  // Get student initials
  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join('')
    : 'ST';

  // Get student first name
  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';

  const cycleTheme = () => {
    if (themeMode === 'dark') setThemeMode('light');
    else if (themeMode === 'light') setThemeMode('auto');
    else setThemeMode('dark');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#121214]/90 backdrop-blur-md border-b border-slate-200 dark:border-white/5 px-4 pt-3 pb-3 transition-colors">
      <div className="flex items-center justify-between gap-3">
        {/* Brand & Greeting */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-500">ISU Portal</h1>
            {user?.department && (
              <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                {user.department}
              </span>
            )}
            {user?.batch_no && (
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 border border-slate-200 dark:border-white/5 text-[10px] font-bold rounded-full font-mono">
                Batch {user.batch_no}
              </span>
            )}
          </div>
          <p className="text-slate-500 dark:text-white/40 text-xs font-medium uppercase tracking-[0.1em] mt-0.5">
            Welcome back, {firstName}
          </p>
        </div>

        {/* Right Action Icons: Theme Toggle, Refresh & Avatar with Badge */}
        <div className="flex items-center gap-1.5">
          {/* Quick Theme Mode Toggle */}
          <button
            onClick={cycleTheme}
            title={`Theme: ${themeMode.toUpperCase()} (Click to toggle)`}
            className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1c1c1f] dark:hover:bg-zinc-800 border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-700 dark:text-white/60 hover:text-indigo-600 dark:hover:text-white active:scale-95 transition-all cursor-pointer"
          >
            {themeMode === 'dark' ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : themeMode === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Laptop className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            )}
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh routine & data"
            className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1c1c1f] dark:hover:bg-zinc-800 border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-700 dark:text-white/60 hover:text-indigo-600 dark:hover:text-white active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-500 dark:text-indigo-400' : ''}`} />
          </button>

          {/* Notification / Profile Avatar */}
          <button
            onClick={onOpenNotifications}
            title="Notifications"
            className="relative focus:outline-none ml-0.5 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 border border-indigo-500/30 flex items-center justify-center shadow-md shadow-indigo-600/20 hover:opacity-90 active:scale-95 transition-all">
              <span className="text-xs font-bold text-white tracking-wider">{initials}</span>
            </div>
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-rose-500 border-2 border-white dark:border-[#121214] rounded-full flex items-center justify-center text-[8px] font-bold text-white animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
