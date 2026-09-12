import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Award,
  AlertTriangle,
  FileText,
  Calendar,
  Inbox,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../services/api';
import { NotificationItem } from '../types';
import { useAuth } from '../context/AuthContext';

interface NotificationsViewProps {
  onShowToast: (text: string, type: 'success' | 'error' | 'info') => void;
  refreshTrigger: number;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  onShowToast,
  refreshTrigger,
}) => {
  const { refreshUnreadCount, unreadCount } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const cached = api.getCachedData<{ notifications: NotificationItem[] }>('notifications_all');
    return cached?.notifications || [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    const cached = api.getCachedData<{ notifications: NotificationItem[] }>('notifications_all');
    return !cached?.notifications?.length;
  });
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadNotifications = async (silent = false) => {
    if (!silent && notifications.length === 0) setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (activeFilter !== 'all') {
        params.type = activeFilter;
      }
      const res = await api.getNotifications(params);
      if (res.success && res.data?.notifications) {
        setNotifications(res.data.notifications);
      }
      refreshUnreadCount();
    } catch (err: any) {
      if (!silent && typeof navigator !== 'undefined' && navigator.onLine) {
        onShowToast(err?.message || 'Failed to load notifications', 'error');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications(notifications.length > 0);
  }, [activeFilter, refreshTrigger]);

  // AJAX Polling: auto-refresh notices every 20 seconds only when online
  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        loadNotifications(true);
      }
    }, 20000);
    return () => clearInterval(timer);
  }, [activeFilter]);

  const handleMarkRead = async (id: number) => {
    try {
      const res = await api.markNotificationRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        refreshUnreadCount();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      const res = await api.markAllNotificationsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        onShowToast('All notices marked as read', 'success');
        refreshUnreadCount();
      } else {
        onShowToast(res.message || 'Could not mark all as read', 'error');
      }
    } catch (err: any) {
      onShowToast(err?.message || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ct':
        return <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
      case 'mid':
      case 'final':
        return <FileText className="w-4 h-4 text-rose-500 dark:text-rose-400" />;
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-orange-500 dark:text-orange-400" />;
      case 'class':
        return <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'ct':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
      case 'mid':
      case 'final':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20';
      case 'urgent':
        return 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20';
      default:
        return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20';
    }
  };

  return (
    <div className="space-y-3 pb-28">
      {/* Sleek Action Bar */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5">
          <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={actionLoading}
            className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
        {[
          { id: 'all', label: 'All' },
          { id: 'ct', label: 'CT Tests' },
          { id: 'class', label: 'Class Shift' },
          { id: 'mid', label: 'Exams' },
          { id: 'urgent', label: 'Urgent' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeFilter === f.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/5 text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 dark:text-white/40">Loading notices...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-14 text-center bg-white dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/30 flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              No Notices Right Now
            </h4>
            <p className="text-xs text-slate-500 dark:text-white/40 mt-1">
              You are all caught up on class updates and examination announcements.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => !notif.is_read && handleMarkRead(notif.id)}
              className={`p-3.5 rounded-2xl border transition-all ${
                notif.is_read
                  ? 'bg-white dark:bg-[#1c1c1f] border-slate-200 dark:border-white/5 opacity-80'
                  : 'bg-white dark:bg-[#1c1c1f] border-indigo-500/30 shadow-md shadow-indigo-600/5'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 shrink-0 mt-0.5">
                  {getTypeIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${getTypeBadge(
                        notif.type
                      )}`}
                    >
                      {notif.type.toUpperCase()}
                    </span>

                    {notif.course_code && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70">
                        {notif.course_code}
                      </span>
                    )}

                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping ml-auto" />
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                    {notif.title}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-white/70 mt-1 leading-relaxed">
                    {notif.message}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 dark:text-white/30 font-mono">
                    <span>{new Date(notif.created_at).toLocaleString()}</span>
                    {notif.department && <span>Dept: {notif.department}</span>}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
