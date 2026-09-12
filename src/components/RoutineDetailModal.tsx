import React from 'react';
import { motion } from 'motion/react';
import {
  X,
  Clock,
  MapPin,
  User as UserIcon,
  Calendar,
  FileText,
  Bookmark,
  Share2,
  ExternalLink,
  Award,
} from 'lucide-react';
import { RoutineItem } from '../types';

interface RoutineDetailModalProps {
  item: RoutineItem | null;
  onClose: () => void;
  onShowToast: (text: string, type: 'success' | 'info') => void;
}

export const RoutineDetailModal: React.FC<RoutineDetailModalProps> = ({
  item,
  onClose,
  onShowToast,
}) => {
  if (!item) return null;

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

  const handleShare = () => {
    const text = `📌 ${item.course_code}: ${item.course_name}
Type: ${item.type.toUpperCase()}
Day: ${item.day} ${item.date ? `(${item.date})` : ''}
Time: ${formatTime(item.start_time)} - ${formatTime(item.end_time)}
Room: ${item.room} | Teacher: ${item.teacher}
${item.syllabus ? `Syllabus: ${item.syllabus}\n` : ''}${item.note ? `Note: ${item.note}\n` : ''}`;

    if (navigator.share) {
      navigator.share({ title: item.course_name, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      onShowToast('Routine details copied to clipboard!', 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-[#09090b]/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ y: '100%', opacity: 0.8 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-lg bg-white dark:bg-[#121214] border-t sm:border border-slate-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
      >
        {/* Header bar */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {item.course_code}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                  item.type === 'ct' || item.type.startsWith('ct')
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                    : item.type === 'mid' || item.type === 'final'
                    ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                }`}
              >
                {item.type.toUpperCase()}
              </span>
              {item.credit && (
                <span className="text-xs text-slate-400 dark:text-white/40 font-mono">
                  {item.credit} Credits
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {item.course_name}
            </h3>
            {item.title && (
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                {item.title}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Schedule grid */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="p-3.5 bg-slate-50 dark:bg-[#1c1c1f] rounded-2xl border border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-2 text-slate-400 dark:text-white/40 mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Day & Date</span>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{item.day}</p>
            {item.date && (
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">{item.date}</p>
            )}
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-[#1c1c1f] rounded-2xl border border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-2 text-slate-400 dark:text-white/40 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Timing</span>
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white font-mono">
              {formatTime(item.start_time)} - {formatTime(item.end_time)}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-[#1c1c1f] rounded-2xl border border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-2 text-slate-400 dark:text-white/40 mb-1">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Classroom</span>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{item.room || 'TBA'}</p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-[#1c1c1f] rounded-2xl border border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-2 text-slate-400 dark:text-white/40 mb-1">
              <UserIcon className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Instructor</span>
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.teacher || 'Faculty Assigned'}</p>
          </div>
        </div>

        {/* Syllabus section */}
        {item.syllabus && (
          <div className="p-4 bg-slate-50 dark:bg-[#1c1c1f] rounded-2xl border border-slate-200 dark:border-white/5 mb-3">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1.5 font-bold text-xs uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              <span>Syllabus & Topics Covered</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-white/80 leading-relaxed whitespace-pre-wrap">
              {item.syllabus}
            </p>
          </div>
        )}

        {/* Additional notes */}
        {item.note && (
          <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 mb-3">
            <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider block mb-1">
              Important Note
            </span>
            <p className="text-xs text-amber-900 dark:text-amber-200">{item.note}</p>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={handleShare}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-bold rounded-2xl text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Schedule</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 bg-slate-100 dark:bg-[#1c1c1f] hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-white font-bold rounded-2xl text-xs border border-slate-200 dark:border-white/5 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
