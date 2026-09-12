import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Sparkles,
  Award,
  FileText,
  FlaskConical,
  BookOpen,
  Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { RoutineItem } from '../types';
import { RoutineDetailModal } from './RoutineDetailModal';
import { LiveClassTracker } from './LiveClassTracker';

const DAYS_OF_WEEK = [
  'Saturday',
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
];

interface RoutineViewProps {
  onShowToast: (text: string, type: 'success' | 'error' | 'info') => void;
  refreshTrigger: number;
}

export const RoutineView: React.FC<RoutineViewProps> = ({ onShowToast, refreshTrigger }) => {
  const { user, currentSemester } = useAuth();
  const [routine, setRoutine] = useState<RoutineItem[]>(() => {
    const cached = api.getCachedData<{ routine: RoutineItem[] }>('routine_all');
    return cached?.routine || [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    const cached = api.getCachedData<{ routine: RoutineItem[] }>('routine_all');
    return !cached?.routine?.length;
  });
  const [selectedDay, setSelectedDay] = useState<string>('Today');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<RoutineItem | null>(null);

  // Compute current actual day name
  const todayName = useMemo(() => {
    const d = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[d.getDay()];
  }, []);

  const loadRoutine = async (silent = false) => {
    if (!silent && routine.length === 0) setLoading(true);
    try {
      const params: any = {};
      if (filterType !== 'all') params.type = filterType;

      const res = await api.getRoutine(params);
      if (res.success && res.data?.routine) {
        setRoutine(res.data.routine);
      }
    } catch (err: any) {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        onShowToast(err?.message || 'Failed to fetch routine', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutine(routine.length > 0);
  }, [filterType, refreshTrigger]);

  const filteredItems = useMemo(() => {
    return routine.filter((item) => {
      if (selectedDay === 'All') return true;
      if (selectedDay === 'Today') {
        return item.day?.toLowerCase() === todayName.toLowerCase();
      }
      return item.day?.toLowerCase() === selectedDay.toLowerCase();
    });
  }, [routine, selectedDay, todayName]);

  // Find any imminent CT for the spotlight banner
  const upcomingCT = useMemo(() => {
    return (
      routine.find((r) => r.type === 'ct' || r.type === 'ct1' || r.type === 'ct2' || r.type === 'ct3') ||
      null
    );
  }, [routine]);

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    try {
      const parts = timeStr.split(':');
      if (parts.length >= 2) {
        let hours = parseInt(parts[0], 10);
        const mins = parts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${hours}:${mins} ${ampm}`;
      }
      return timeStr;
    } catch {
      return timeStr;
    }
  };

  // Color coding helper for classes, CT 1, CT 2, CT 3, Midterm, Final
  const getAssessmentBadge = (type: string, tag?: string) => {
    const t = type.toLowerCase();
    if (t === 'ct1' || tag === 'CT 1') {
      return {
        label: 'CT 1',
        icon: Award,
        bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        border: 'border-l-3 border-l-amber-500',
        dot: 'bg-amber-400',
      };
    }
    if (t === 'ct2' || tag === 'CT 2') {
      return {
        label: 'CT 2',
        icon: Award,
        bg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
        border: 'border-l-3 border-l-orange-500',
        dot: 'bg-orange-400',
      };
    }
    if (t === 'ct3' || tag === 'CT 3') {
      return {
        label: 'CT 3',
        icon: Award,
        bg: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
        border: 'border-l-3 border-l-yellow-400',
        dot: 'bg-yellow-400',
      };
    }
    if (t === 'ct') {
      return {
        label: 'CT',
        icon: Award,
        bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        border: 'border-l-3 border-l-amber-500',
        dot: 'bg-amber-400',
      };
    }
    if (t === 'mid' || tag === 'Midterm Exam') {
      return {
        label: 'MIDTERM',
        icon: FileText,
        bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        border: 'border-l-3 border-l-purple-500',
        dot: 'bg-purple-400',
      };
    }
    if (t === 'final' || tag === 'Final Exam') {
      return {
        label: 'FINAL EXAM',
        icon: FileText,
        bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        border: 'border-l-3 border-l-rose-500',
        dot: 'bg-rose-400',
      };
    }
    if (t === 'lab') {
      return {
        label: 'LAB',
        icon: FlaskConical,
        bg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
        border: 'border-l-3 border-l-cyan-500',
        dot: 'bg-cyan-400',
      };
    }
    return {
      label: 'CLASS',
      icon: BookOpen,
      bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      border: 'border-l-3 border-l-indigo-500',
      dot: 'bg-indigo-400',
    };
  };

  return (
    <div className="space-y-2.5 pb-20">
      {/* Live Class Tracker & Current Time Widget */}
      <LiveClassTracker
        routine={routine}
        department={user?.department}
        batchNo={user?.batch_no}
        onSelectClass={(item) => setSelectedItem(item)}
      />

      {/* Upcoming CT Spotlight alert if found */}
      {upcomingCT && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setSelectedItem(upcomingCT)}
          className="p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-center justify-between gap-2 cursor-pointer active:scale-98 transition-all"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <Award className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-amber-500 text-black">
                  UPCOMING CT
                </span>
                <span className="text-[11px] font-bold text-amber-950 dark:text-amber-300 truncate">
                  {upcomingCT.course_code}: {upcomingCT.course_name}
                </span>
              </div>
              <p className="text-[10px] text-slate-600 dark:text-white/60 truncate">
                {upcomingCT.day} {upcomingCT.date ? `(${upcomingCT.date})` : ''} • {formatTime(upcomingCT.start_time)} • Rm {upcomingCT.room}
              </p>
            </div>
          </div>
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        </motion.div>
      )}

      {/* Day Selector Pills Carousel */}
      <div className="overflow-hidden">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
          <button
            onClick={() => setSelectedDay('Today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedDay === 'Today'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-[#151518] border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-white/50'
            }`}
          >
            Today ({todayName.slice(0, 3)})
          </button>
          <button
            onClick={() => setSelectedDay('All')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              selectedDay === 'All'
                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                : 'bg-white dark:bg-[#151518] border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-white/50'
            }`}
          >
            All Week
          </button>
          {DAYS_OF_WEEK.map((day) => {
            const isToday = day.toLowerCase() === todayName.toLowerCase();
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-2.5 py-1.5 rounded-xl text-xs transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'bg-white dark:bg-[#151518] border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-white/50'
                }`}
              >
                {day.slice(0, 3)} {isToday && !isSelected ? '•' : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Routine Slots List */}
      <div className="space-y-2">
        {loading ? (
          <div className="py-10 text-center space-y-2">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[11px] text-slate-400 dark:text-white/40">Loading routine...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-8 text-center bg-white dark:bg-[#151518] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-xs transition-colors">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/30 flex items-center justify-center mx-auto mb-2">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              No classes for {selectedDay}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-white/40 mt-0.5">
              Enjoy your break or check course schedules
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const badge = getAssessmentBadge(item.type, item.assessment_tag);
            const BadgeIcon = badge.icon;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12 }}
                onClick={() => setSelectedItem(item)}
                className={`p-2.5 bg-white dark:bg-[#151518] border border-slate-200/80 dark:border-white/10 hover:border-indigo-500/30 rounded-2xl shadow-xs transition-all active:scale-[0.98] cursor-pointer ${badge.border}`}
              >
                {/* Header Row: Badge, Course Code & Day/Date */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border ${badge.bg}`}
                    >
                      <BadgeIcon className="w-2.5 h-2.5" />
                      {badge.label}
                    </span>

                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/80">
                      {item.course_code}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-white/90">
                      {item.day} {item.date ? `· ${item.date}` : ''}
                    </span>
                  </div>
                </div>

                {/* Course Name */}
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                  {item.course_name}
                </h4>

                {/* Meta details footer: Time, Room, Teacher */}
                <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-600 dark:text-white/60 font-medium">
                  <div className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                    <span>
                      {formatTime(item.start_time)} - {formatTime(item.end_time)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                      Rm {item.room}
                    </span>
                    {item.teacher && (
                      <span className="text-slate-400 dark:text-white/40 truncate max-w-[90px]">
                        • {item.teacher}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Routine Item Detail Modal */}
      <RoutineDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onShowToast={onShowToast}
      />
    </div>
  );
};

