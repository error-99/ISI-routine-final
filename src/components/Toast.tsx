import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[92%] max-w-md pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md text-xs font-medium ${
              toast.type === 'success'
                ? 'bg-white dark:bg-[#121214] border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : toast.type === 'error'
                ? 'bg-white dark:bg-[#121214] border-rose-500/30 text-rose-700 dark:text-rose-300'
                : 'bg-white dark:bg-[#121214] border-indigo-500/30 text-indigo-700 dark:text-indigo-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-500 shrink-0" />}
              <span className="text-slate-800 dark:text-white/90">{toast.text}</span>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors ml-2 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
