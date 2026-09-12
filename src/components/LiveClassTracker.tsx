import React, { useState, useEffect, useMemo } from 'react';
import { Clock, BookOpen, CheckCircle2, Coffee, Sparkles, MapPin, User, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { RoutineItem } from '../types';

interface LiveClassTrackerProps {
  routine: RoutineItem[];
  department?: string;
  batchNo?: string;
  onSelectClass?: (item: RoutineItem) => void;
}

export const LiveClassTracker: React.FC<LiveClassTrackerProps> = ({
  routine,
  department,
  batchNo,
  onSelectClass,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayName = daysOfWeek[currentTime.getDay()];

  const formattedTime = useMemo(() => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  }, [currentTime]);

  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [currentTime]);

  const parseTimeToMinutes = (timeStr?: string): number => {
    if (!timeStr) return -1;
    const parts = timeStr.split(':');
    if (parts.length < 2) return -1;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const s = parts.length > 2 ? parseInt(parts[2], 10) : 0;
    return h * 60 + m + (s / 60);
  };

  const formatTimeSlot = (timeStr?: string) => {
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

  const classStatus = useMemo(() => {
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes() + (currentTime.getSeconds() / 60);

    const todaysSlots = routine
      .filter((r) => r.day?.toLowerCase() === currentDayName.toLowerCase())
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

    if (todaysSlots.length === 0) {
      const nextSlots = routine.slice().sort((a, b) => {
        const dOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const diff = dOrder.indexOf(a.day) - dOrder.indexOf(b.day);
        if (diff !== 0) return diff;
        return (a.start_time || '').localeCompare(b.start_time || '');
      });

      return {
        type: 'free_day' as const,
        message: 'No classes today',
        nextSlot: nextSlots[0] || null,
      };
    }

    for (const slot of todaysSlots) {
      const startMin = parseTimeToMinutes(slot.start_time);
      const endMin = parseTimeToMinutes(slot.end_time);

      if (startMin >= 0 && endMin >= 0 && currentMinutes >= startMin && currentMinutes < endMin) {
        const remainingMinutes = Math.max(1, Math.ceil(endMin - currentMinutes));
        const totalDuration = endMin - startMin;
        const progressPercent = Math.min(100, Math.max(0, ((currentMinutes - startMin) / totalDuration) * 100));

        return {
          type: 'ongoing' as const,
          slot,
          remainingMinutes,
          progressPercent,
        };
      }
    }

    for (const slot of todaysSlots) {
      const startMin = parseTimeToMinutes(slot.start_time);
      if (startMin > currentMinutes) {
        const diffMinutes = Math.ceil(startMin - currentMinutes);
        const hours = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;
        const countdownText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

        return {
          type: 'upcoming' as const,
          slot,
          countdownText,
          diffMinutes,
        };
      }
    }

    return {
      type: 'completed_today' as const,
      message: 'All classes finished for today',
      totalToday: todaysSlots.length,
    };
  }, [routine, currentTime, currentDayName]);

  return (
    <div className="bg-white dark:bg-[#151518] border border-slate-200/80 dark:border-white/10 rounded-2xl p-3 shadow-xs transition-colors space-y-2.5">
      {/* Compact Header: Clock & Program info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-900 dark:text-white font-mono tracking-tight">
            {formattedTime}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-white/40 font-medium">
            • {formattedDate}
          </span>
        </div>

        {department && (
          <div className="flex items-center gap-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              {department}{batchNo ? `·B${batchNo}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Class Status Banner */}
      <div>
        {classStatus.type === 'ongoing' && classStatus.slot && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => onSelectClass && onSelectClass(classStatus.slot)}
            className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200 cursor-pointer active:scale-98 transition-all"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                  Live Now
                </span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono">
                {classStatus.remainingMinutes}m left
              </span>
            </div>

            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {classStatus.slot.course_code}: {classStatus.slot.course_name}
                </h4>
                <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-white/70 mt-0.5 font-medium flex-wrap">
                  <span>{formatTimeSlot(classStatus.slot.start_time)} - {formatTimeSlot(classStatus.slot.end_time)}</span>
                  <span>• Rm {classStatus.slot.room}</span>
                  {classStatus.slot.teacher && <span>• {classStatus.slot.teacher}</span>}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 self-center" />
            </div>

            {/* Micro Progress Bar */}
            <div className="w-full bg-emerald-500/20 h-1 rounded-full overflow-hidden mt-2">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                style={{ width: `${classStatus.progressPercent}%` }}
              />
            </div>
          </motion.div>
        )}

        {classStatus.type === 'upcoming' && classStatus.slot && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => onSelectClass && onSelectClass(classStatus.slot)}
            className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-950 dark:text-indigo-200 cursor-pointer active:scale-98 transition-all"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-mono">
                  Up Next
                </span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white font-mono shadow-xs">
                in {classStatus.countdownText}
              </span>
            </div>

            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {classStatus.slot.course_code}: {classStatus.slot.course_name}
                </h4>
                <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-white/70 mt-0.5 font-medium flex-wrap">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {formatTimeSlot(classStatus.slot.start_time)} - {formatTimeSlot(classStatus.slot.end_time)}
                  </span>
                  <span>• Rm {classStatus.slot.room}</span>
                  {classStatus.slot.teacher && <span>• {classStatus.slot.teacher}</span>}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 self-center" />
            </div>
          </motion.div>
        )}

        {classStatus.type === 'completed_today' && (
          <div className="py-2 px-3 rounded-xl bg-slate-100/70 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="font-semibold text-slate-800 dark:text-white/90 text-[11px]">
                Done for today ({classStatus.totalToday} classes finished)
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              Completed
            </span>
          </div>
        )}

        {classStatus.type === 'free_day' && (
          <div className="py-2 px-3 rounded-xl bg-slate-100/70 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Coffee className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="font-medium text-slate-700 dark:text-white/70 text-[11px] truncate">
                {classStatus.nextSlot
                  ? `Next class on ${classStatus.nextSlot.day} (${classStatus.nextSlot.course_code})`
                  : 'No scheduled classes today'}
              </span>
            </div>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded shrink-0">
              Free Day
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

