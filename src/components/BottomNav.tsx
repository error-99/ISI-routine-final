import React from 'react';
import { Calendar, Award, BookOpen, Bell, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export type TabType = 'routine' | 'courses' | 'notifications' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const { unreadCount } = useAuth();

  const tabs: { id: TabType; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'routine', label: 'Routine', icon: Calendar },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'notifications', label: 'Alerts', icon: Bell, badge: unreadCount },
    { id: 'profile', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#121214]/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/5 pb-[calc(var(--sab)+8px)] pt-2 px-4 max-w-md mx-auto transition-colors">
      <div className="grid grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 dark:text-white/30 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 text-indigo-600 dark:text-indigo-400' : ''
                  }`}
                />
                {!!tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2.5 min-w-[15px] h-3.5 px-1 rounded-full bg-rose-500 border border-white dark:border-[#121214] text-white text-[8px] font-bold flex items-center justify-center">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] mt-1 tracking-tight uppercase font-medium">{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute -top-2 w-6 h-1 bg-indigo-600 dark:bg-indigo-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="w-24 h-1 bg-slate-200 dark:bg-white/10 rounded-full mx-auto mt-2" />
    </nav>
  );
};
