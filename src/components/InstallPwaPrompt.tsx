import React, { useEffect, useState } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const InstallPwaPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
      return;
    }

    // Android/Chrome install prompt capture
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect iOS Safari
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isIos && isSafari && !sessionStorage.getItem('ios_pwa_dismissed')) {
      // Show subtle banner on iOS
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setShowBanner(false);
          setDeferredPrompt(null);
          return;
        }
      } catch {
        // continue to share fallback
      }
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'ISU Student Routine Portal',
          text: 'Install ISU Student Routine Portal on your device',
          url: window.location.href,
        });
        return;
      } catch {
        // User cancelled or share unsupported, fallback to instructional modal
      }
    }

    // Fallback: Show instructional modal
    setShowIOSPrompt(true);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('ios_pwa_dismissed', 'true');
  };

  if (isStandalone || !showBanner) return null;

  return (
    <>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto"
      >
        <div className="p-3.5 bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-slate-900 dark:text-white transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-md shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Install Routine App</h4>
              <p className="text-[11px] text-slate-500 dark:text-white/40 truncate">Add to Home Screen for fast offline routine</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-slate-900 dark:text-white/40 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* iOS Safari instructions modal */}
      <AnimatePresence>
        {showIOSPrompt && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-[#09090b]/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="w-full max-w-sm bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-white"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSPrompt(false)}
                  className="p-1.5 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs text-slate-600 dark:text-white/70">
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-[#1c1c1f] rounded-2xl border border-slate-200 dark:border-white/5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Share className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-slate-900 dark:text-white block font-semibold">1. Tap Share Button</strong>
                    <span>Tap the share icon at the bottom of Safari toolbar.</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-[#1c1c1f] rounded-2xl border border-slate-200 dark:border-white/5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-slate-900 dark:text-white block font-semibold">2. Add to Home Screen</strong>
                    <span>Scroll down and tap &quot;Add to Home Screen&quot;.</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSPrompt(false)}
                className="w-full mt-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
