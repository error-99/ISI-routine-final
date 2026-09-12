import React, { useState, useEffect, useCallback } from 'react';
import { WifiOff, Wifi, RefreshCw, X, Database, CheckCircle2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConnectionStatusModalProps {
  onSyncLatest?: () => Promise<void> | void;
  onShowToast?: (text: string, type: 'success' | 'error' | 'info') => void;
}

export const ConnectionStatusModal: React.FC<ConnectionStatusModalProps> = ({
  onSyncLatest,
  onShowToast,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [showModal, setShowModal] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [reconnectedBanner, setReconnectedBanner] = useState<boolean>(false);

  // Active ping check to confirm actual internet reachability
  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      // If server unreachable, check if general internet is reachable
      return typeof navigator !== 'undefined' ? navigator.onLine : false;
    }
  }, []);

  const handleRetry = async () => {
    setIsChecking(true);
    const online = await checkConnectivity();
    setIsChecking(false);
    if (online) {
      setIsOnline(true);
      setShowModal(false);
      setReconnectedBanner(true);
      setTimeout(() => setReconnectedBanner(false), 4000);
      if (onShowToast) onShowToast('Connected to the internet. Synced with database.', 'success');
      if (onSyncLatest) onSyncLatest();
    } else {
      setIsOnline(false);
      if (onShowToast) onShowToast('Still offline. Showing saved data from cache.', 'info');
    }
  };

  useEffect(() => {
    const handleOnline = async () => {
      const online = await checkConnectivity();
      if (online) {
        setIsOnline(true);
        setShowModal(false);
        setReconnectedBanner(true);
        setTimeout(() => setReconnectedBanner(false), 4000);
        if (onShowToast) onShowToast('Internet connection restored. Synced latest data.', 'success');
        if (onSyncLatest) onSyncLatest();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowModal(true);
      if (onShowToast) onShowToast('No internet connection. Switched to offline cache.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on app startup
    if (!navigator.onLine) {
      setShowModal(true);
    } else {
      // Background quick check on mount to catch dead wifi/captive portal
      checkConnectivity().then((reachable) => {
        if (!reachable) {
          setIsOnline(false);
          setShowModal(true);
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnectivity, onShowToast, onSyncLatest]);

  return (
    <>
      {/* 1. Top Reconnected Success Notification Banner */}
      <AnimatePresence>
        {reconnectedBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-2 left-4 right-4 z-50 max-w-md mx-auto bg-emerald-600 text-white px-3.5 py-2.5 rounded-2xl shadow-lg flex items-center justify-between text-xs font-semibold"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
              <span>Back Online • Database Synced</span>
            </div>
            <button
              onClick={() => setReconnectedBanner(false)}
              className="p-1 hover:bg-emerald-700/60 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Persistent Offline Notice Strip (Shows when offline and modal is dismissed) */}
      {!isOnline && !showModal && (
        <div className="bg-amber-500/15 border-b border-amber-500/20 px-3.5 py-1.5 text-amber-700 dark:text-amber-300 text-[11px] font-medium flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="truncate">Offline Mode — Showing saved cache data</span>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-100 transition-colors shrink-0 ml-2 cursor-pointer"
          >
            Check Connection
          </button>
        </div>
      )}

      {/* 3. High-Priority "Connect to Internet" Modal Popup */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white dark:bg-[#151518] border border-slate-200 dark:border-white/10 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4"
            >
              {/* Header Icon and Close Button */}
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                  <WifiOff className="w-5 h-5 animate-pulse" />
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  title="Close popup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  Connect to the Internet
                </h3>
                <p className="text-xs text-slate-600 dark:text-white/60 leading-relaxed">
                  No active internet connection was found. You can continue viewing your{' '}
                  <span className="font-semibold text-slate-800 dark:text-white/80">
                    saved offline routine, enrolled courses, and notifications
                  </span>{' '}
                  from cache.
                </p>
              </div>

              {/* Offline Snapshot Info Box */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-[11px] text-slate-600 dark:text-white/60 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-white/80">
                  <Database className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Offline Storage Active</span>
                </div>
                <p className="text-[10px] leading-normal text-slate-500 dark:text-white/50">
                  Whenever you connect to the internet, new routines and course updates are automatically saved to your device cache for offline use.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={isChecking}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>{isChecking ? 'Checking connection...' : 'Retry Connection'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 active:scale-[0.98] text-slate-700 dark:text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  Continue with Saved Offline Data
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
