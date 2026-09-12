import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  Sparkles,
  BookOpen,
  Award,
  Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { RoutineItem } from '../types';
import { RoutineDetailModal } from './RoutineDetailModal';

interface CTExamsViewProps {
  onShowToast: (text: string, type: 'success' | 'error' | 'info') => void;
  refreshTrigger: number;
}

export const CTExamsView: React.FC<CTExamsViewProps> = ({ onShowToast, refreshTrigger }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'ct' | 'exams'>('all');
  const [ctFilter, setCtFilter] = useState<'all' | 'ct1' | 'ct2' | 'ct3'>('all');
  const [items, setItems] = useState<RoutineItem[]>(() => {
    const cachedCts = api.getCachedData<{ routine: RoutineItem[] }>('cts');
    const cachedExams = api.getCachedData<{ routine: RoutineItem[] }>('exams');
    const combined = [
      ...(cachedCts?.routine || []),
      ...(cachedExams?.routine || []),
    ];
    return combined;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    const cachedCts = api.getCachedData<{ routine: RoutineItem[] }>('cts');
    const cachedExams = api.getCachedData<{ routine: RoutineItem[] }>('exams');
    return !cachedCts?.routine?.length && !cachedExams?.routine?.length;
  });
  const [selectedItem, setSelectedItem] = useState<RoutineItem | null>(null);

  const loadData = async (silent = false) => {
    if (!silent && items.length === 0) setLoading(true);
    try {
      if (activeTab === 'ct') {
        const res = await api.getCTs();
        setItems(res.success && res.data?.routine ? res.data.routine : []);
      } else if (activeTab === 'exams') {
        const res = await api.getExams();
        setItems(res.success && res.data?.routine ? res.data.routine : []);
      } else {
        const [ctRes, examRes] = await Promise.all([api.getCTs(), api.getExams()]);
        const combined = [
          ...(ctRes.success && ctRes.data?.routine ? ctRes.data.routine : []),
          ...(examRes.success && examRes.data?.routine ? examRes.data.routine : []),
        ];
        setItems(combined);
      }
    } catch (err: any) {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        onShowToast(err?.message || 'Failed to load assessments', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(items.length > 0);
  }, [activeTab, refreshTrigger]);

  const filteredItems = items.filter((item) => {
    if (activeTab === 'ct' && ctFilter !== 'all') {
      return item.type === ctFilter || item.assessment_tag === `CT ${ctFilter.replace('ct', '')}`;
    }
    return true;
  });

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

  const getAssessmentBadge = (type: string, tag?: string) => {
    const t = type.toLowerCase();
    if (t === 'ct1' || tag === 'CT 1') {
      return {
        label: 'CT 1',
        bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        cardBorder: 'border-l-3 border-l-amber-500',
        pill: 'bg-amber-500 text-black',
      };
    }
    if (t === 'ct2' || tag === 'CT 2') {
      return {
        label: 'CT 2',
        bg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
        cardBorder: 'border-l-3 border-l-orange-500',
        pill: 'bg-orange-500 text-black',
      };
    }
    if (t === 'ct3' || tag === 'CT 3') {
      return {
        label: 'CT 3',
        bg: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
        cardBorder: 'border-l-3 border-l-yellow-400',
        pill: 'bg-yellow-400 text-black',
      };
    }
    if (t === 'ct') {
      return {
        label: 'CT',
        bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        cardBorder: 'border-l-3 border-l-amber-500',
        pill: 'bg-amber-500 text-black',
      };
    }
    if (t === 'mid' || tag === 'Midterm Exam') {
      return {
        label: 'MIDTERM',
        bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        cardBorder: 'border-l-3 border-l-purple-500',
        pill: 'bg-purple-600 text-white',
      };
    }
    if (t === 'final' || tag === 'Final Exam') {
      return {
        label: 'FINAL EXAM',
        bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        cardBorder: 'border-l-3 border-l-rose-500',
        pill: 'bg-rose-600 text-white',
      };
    }
    return {
      label: 'EXAM',
      bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      cardBorder: 'border-l-3 border-l-indigo-500',
      pill: 'bg-indigo-600 text-white',
    };
  };

  return (
    <div className="space-y-2.5 pb-20">
      {/* Compact Main Tabs: All / CT Only / Exams Only */}
      <div className="grid grid-cols-3 p-1 bg-white dark:bg-[#151518] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs transition-colors">
        <button
          onClick={() => setActiveTab('all')}
          className={`py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-white/50'
          }`}
        >
          All ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('ct')}
          className={`py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'ct'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-white/50'
          }`}
        >
          Class Tests
        </button>
        <button
          onClick={() => setActiveTab('exams')}
          className={`py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'exams'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-white/50'
          }`}
        >
          Mid / Final
        </button>
      </div>

      {/* If CT Tab: CT 1, CT 2, CT 3 Sub-Filter */}
      {activeTab === 'ct' && (
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setCtFilter('all')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              ctFilter === 'all'
                ? 'bg-amber-500 text-black font-black'
                : 'bg-white dark:bg-[#151518] border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-white/60'
            }`}
          >
            All CTs
          </button>
          <button
            onClick={() => setCtFilter('ct1')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              ctFilter === 'ct1'
                ? 'bg-amber-500 text-black font-black'
                : 'bg-white dark:bg-[#151518] border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-white/60'
            }`}
          >
            CT 1
          </button>
          <button
            onClick={() => setCtFilter('ct2')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              ctFilter === 'ct2'
                ? 'bg-orange-500 text-black font-black'
                : 'bg-white dark:bg-[#151518] border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-white/60'
            }`}
          >
            CT 2
          </button>
          <button
            onClick={() => setCtFilter('ct3')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              ctFilter === 'ct3'
                ? 'bg-yellow-400 text-black font-black'
                : 'bg-white dark:bg-[#151518] border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-white/60'
            }`}
          >
            CT 3
          </button>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-2">
        {loading ? (
          <div className="py-10 text-center space-y-2">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[11px] text-slate-400 dark:text-white/40">Loading assessments...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-8 text-center bg-white dark:bg-[#151518] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-xs transition-colors">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/30 flex items-center justify-center mx-auto mb-2">
              <Award className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              No assessments found
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-white/40 mt-0.5">
              No pending CT or Exam schedules for this filter.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const badge = getAssessmentBadge(item.type, item.assessment_tag);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedItem(item)}
                className={`p-2.5 bg-white dark:bg-[#151518] border border-slate-200/80 dark:border-white/10 hover:border-indigo-500/30 rounded-2xl shadow-xs transition-all active:scale-[0.98] cursor-pointer ${badge.cardBorder}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${badge.bg}`}
                    >
                      {badge.label}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/80">
                      {item.course_code}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-white/90">
                      {item.date || item.day}
                    </span>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                  {item.course_name}
                </h4>
                {item.title && (
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium truncate mt-0.5">
                    {item.title}
                  </p>
                )}

                {/* Time & Room */}
                <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-600 dark:text-white/60 font-medium">
                  <div className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                    <span>
                      {formatTime(item.start_time)} - {formatTime(item.end_time)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                    <span>Rm {item.room}</span>
                  </div>
                </div>

                {/* Syllabus preview */}
                {item.syllabus && (
                  <div className="mt-1.5 p-1.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/5 text-[10px] text-slate-700 dark:text-white/70">
                    <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider block mb-0.5">
                      Syllabus:
                    </span>
                    <p className="line-clamp-1 leading-tight">{item.syllabus}</p>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      <RoutineDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onShowToast={onShowToast}
      />
    </div>
  );
};

