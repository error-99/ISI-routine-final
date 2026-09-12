import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { BottomNav, TabType } from './components/BottomNav';
import { RoutineView } from './components/RoutineView';
import { CoursesView } from './components/CoursesView';
import { NotificationsView } from './components/NotificationsView';
import { ProfileSettingsView } from './components/ProfileSettingsView';
import { AuthModal } from './components/AuthModal';
import { InstallPwaPrompt } from './components/InstallPwaPrompt';
import { Toast, ToastMessage } from './components/Toast';
import { ConnectionStatusModal } from './components/ConnectionStatusModal';
import { api } from './services/api';

const MainPortal: React.FC = () => {
  const { isAuthenticated, isLoading, refreshProfile, refreshUnreadCount } = useAuth();
  const { effectiveTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('routine');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const showToast = useCallback(
    (text: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Date.now().toString() + Math.random().toString();
      setToasts((prev) => [...prev, { id, text, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleGlobalRefresh = async () => {
    setIsRefreshing(true);
    try {
      // 1. Purge all cached local offline storage completely
      api.clearOfflineCache();

      // 2. Clear browser/service-worker caches if present
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          const keys = await window.caches.keys();
          await Promise.all(keys.map((key) => window.caches.delete(key)));
        } catch {}
      }

      // 3. Refresh user profile & unread notifications directly from database
      await Promise.all([refreshProfile(), refreshUnreadCount()]);

      // 4. Trigger all active tabs (Routine, Courses, Notifications, Profile) to reload live data
      setRefreshTrigger((prev) => prev + 1);
      showToast('Cache cleared & reloaded from database', 'info');
    } catch {
      showToast('Refresh failed', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-white/50 p-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center animate-bounce mb-3 shadow-lg shadow-indigo-500/10">
          <div className="w-5 h-5 rounded-lg bg-indigo-500 animate-pulse" />
        </div>
        <p className="text-xs font-semibold text-white/70 uppercase tracking-widest">
          Loading ISU Routine Portal...
        </p>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col antialiased selection:bg-indigo-600 selection:text-white transition-colors duration-150 ${
        effectiveTheme === 'dark' ? 'dark bg-[#09090b] text-white' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Toast Alert System */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Internet Connection Status Modal & Offline Alert */}
      <ConnectionStatusModal
        onSyncLatest={handleGlobalRefresh}
        onShowToast={showToast}
      />

      {!isAuthenticated ? (
        <AuthModal onShowToast={showToast} />
      ) : (
        <div className="flex-1 flex flex-col max-w-md mx-auto w-full bg-slate-50 dark:bg-[#121214] sm:border-x border-slate-200 dark:border-white/5 min-h-screen shadow-2xl">
          {/* Top Header */}
          <Navbar
            onOpenNotifications={() => setActiveTab('notifications')}
            onRefresh={handleGlobalRefresh}
            isRefreshing={isRefreshing}
          />

          {/* Main Tab Screen Area with Smooth Fade & Transition */}
          <main className="flex-1 px-4 pt-3 pb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                {activeTab === 'routine' && (
                  <RoutineView
                    onShowToast={showToast}
                    refreshTrigger={refreshTrigger}
                  />
                )}
                {activeTab === 'courses' && (
                  <CoursesView
                    onShowToast={showToast}
                    refreshTrigger={refreshTrigger}
                  />
                )}
                {activeTab === 'notifications' && (
                  <NotificationsView
                    onShowToast={showToast}
                    refreshTrigger={refreshTrigger}
                  />
                )}
                {activeTab === 'profile' && (
                  <ProfileSettingsView
                    onShowToast={showToast}
                    refreshTrigger={refreshTrigger}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Bottom Dock Navigation */}
          <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
        </div>
      )}

      {/* PWA Install Banner */}
      <InstallPwaPrompt />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainPortal />
      </AuthProvider>
    </ThemeProvider>
  );
}
