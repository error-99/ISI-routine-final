import React, { useState, useEffect } from 'react';
import {
  User,
  KeyRound,
  GraduationCap,
  Building2,
  Calendar,
  Hash,
  Clock,
  LogOut,
  AlertCircle,
  Edit3,
  ChevronRight,
  Sun,
  Moon,
  Laptop,
  Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { Semester } from '../types';
import { DepartmentItem, getDepartmentDisplayName } from '../utils/departments';

interface ProfileSettingsViewProps {
  onShowToast: (text: string, type: 'success' | 'error' | 'info') => void;
  refreshTrigger?: number;
}

const formatLastLogin = (dateString?: string): string => {
  if (!dateString) return 'Active Now';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const timeStr = date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (isToday) {
      return `Today at ${timeStr}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return `Yesterday at ${timeStr}`;
    }

    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ` at ${timeStr}`;
  } catch {
    return dateString;
  }
};

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({ onShowToast, refreshTrigger }) => {
  const { user, currentSemester, logout, refreshProfile, updateUserData } = useAuth();
  const { themeMode, effectiveTheme, setThemeMode } = useTheme();

  // Public metadata
  const [departments, setDepartments] = useState<string[]>([]);
  const [departmentsFull, setDepartmentsFull] = useState<DepartmentItem[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  // PWA Install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState<boolean>(false);

  // Sign out confirmation modal state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);

  // Edit modal states
  const [editModal, setEditModal] = useState<
    'name' | 'student_id' | 'department' | 'batch' | 'semester' | 'password' | null
  >(null);

  // Form values
  const [newName, setNewName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newBatch, setNewBatch] = useState('');
  const [newSemesterId, setNewSemesterId] = useState<number>(1);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Check PWA installation state & listen for prompt
    if (typeof window !== 'undefined') {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsPwaInstalled(true);
      }

      const beforeInstallHandler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };
      window.addEventListener('beforeinstallprompt', beforeInstallHandler);

      return () => {
        window.removeEventListener('beforeinstallprompt', beforeInstallHandler);
      };
    }
  }, []);

  const loadMeta = async () => {
    try {
      const [deptRes, semRes] = await Promise.all([
        api.getDepartments(),
        api.getSemesters(),
      ]);
      if (deptRes.success && deptRes.data) {
        setDepartments(deptRes.data.departments || []);
        setDepartmentsFull(deptRes.data.departments_full || []);
      }
      if (semRes.success && semRes.data) {
        setSemesters(semRes.data.semesters || []);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    loadMeta();
  }, [refreshTrigger]);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsPwaInstalled(true);
        onShowToast('PWA App Installed to Home Screen!', 'success');
      }
      setDeferredPrompt(null);
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: 'ISU Student Routine Portal',
          text: 'Install and access ISU Student Routine Portal offline',
          url: window.location.href,
        });
      } catch {
        onShowToast('Tap browser menu (⋮) or Share and select "Add to Home Screen".', 'info');
      }
    } else {
      onShowToast(
        'To install PWA: tap "Share" or browser menu (⋮) and select "Add to Home Screen".',
        'info'
      );
    }
  };

  const openEdit = (
    field: 'name' | 'student_id' | 'department' | 'batch' | 'semester' | 'password'
  ) => {
    if (!user) return;
    setEditModal(field);
    if (field === 'name') setNewName(user.name || '');
    if (field === 'student_id') setNewStudentId(user.student_id || '');
    if (field === 'department') {
      setNewDept(user.department || '');
      loadMeta();
    }
    if (field === 'batch') setNewBatch(user.batch_no || '');
    if (field === 'semester') {
      setNewSemesterId(user.semester_id || 1);
      loadMeta();
    }
    if (field === 'password') {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleStudentIdChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 25);
    setNewStudentId(cleaned);
  };

  const handleBatchChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 5);
    setNewBatch(cleaned);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editModal === 'name') {
        if (!newName.trim()) throw new Error('Name cannot be empty');
        const res = await api.changeName(newName.trim());
        if (res.success) {
          updateUserData({ name: newName.trim() });
          onShowToast(res.message || 'Name updated successfully', 'success');
          setEditModal(null);
        } else {
          throw new Error(res.message || 'Failed to update name');
        }
      } else if (editModal === 'student_id') {
        if (!newStudentId.trim()) throw new Error('Student ID cannot be empty');
        if (newStudentId.trim().length < 10) {
          throw new Error('Student ID must be at least 10 digits');
        }
        if (!/^\d{10,}$/.test(newStudentId.trim())) {
          throw new Error('Student ID must be numbers only');
        }
        const res = await api.changeStudentId(newStudentId.trim());
        if (res.success) {
          updateUserData({ student_id: newStudentId.trim() });
          onShowToast(res.message || 'Student ID updated successfully', 'success');
          setEditModal(null);
        } else {
          throw new Error(res.message || 'Failed to update student ID');
        }
      } else if (editModal === 'department') {
        if (!newDept) throw new Error('Please select a department');
        const res = await api.changeDepartment(newDept);
        if (res.success) {
          updateUserData({ department: newDept });
          onShowToast(res.message || `Switched to ${newDept} and loaded default curriculum`, 'success');
          await refreshProfile();
          setEditModal(null);
        } else {
          throw new Error(res.message || 'Failed to update department');
        }
      } else if (editModal === 'batch') {
        if (!newBatch.trim()) throw new Error('Batch number cannot be empty');
        const res = await api.changeBatch(newBatch.trim());
        if (res.success) {
          updateUserData({ batch_no: newBatch.trim() });
          onShowToast(res.message || `Batch updated to Batch ${newBatch}`, 'success');
          setEditModal(null);
        } else {
          throw new Error(res.message || 'Failed to update batch');
        }
      } else if (editModal === 'semester') {
        const res = await api.changeSemester(newSemesterId);
        if (res.success) {
          updateUserData({ semester_id: newSemesterId });
          onShowToast(res.message || 'Semester updated & default courses auto-enrolled!', 'success');
          await refreshProfile();
          setEditModal(null);
        } else {
          throw new Error(res.message || 'Failed to change semester');
        }
      } else if (editModal === 'password') {
        if (!oldPassword) throw new Error('Please enter current password');
        if (!newPassword || newPassword.length < 6) {
          throw new Error('New password must be at least 6 characters');
        }
        if (newPassword !== confirmPassword) {
          throw new Error('New passwords do not match');
        }
        const res = await api.changePassword(oldPassword, newPassword);
        if (res.success) {
          onShowToast(res.message || 'Password changed successfully', 'success');
          setEditModal(null);
        } else {
          throw new Error(res.message || 'Failed to change password. Verify old password.');
        }
      }
    } catch (err: any) {
      onShowToast(err.message || 'Operation failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmLogoutAction = async () => {
    setLoggingOut(true);
    try {
      await logout();
      onShowToast('Signed out of student account', 'info');
      setShowLogoutConfirm(false);
    } catch {
      onShowToast('Sign out complete', 'info');
      setShowLogoutConfirm(false);
    } finally {
      setLoggingOut(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-3 pb-28">
      {/* Student Profile Card */}
      <div className="p-4 bg-white dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 border border-indigo-500/30 flex items-center justify-center text-white text-base font-bold shadow-md shadow-indigo-600/25">
            {user.name ? user.name.slice(0, 2).toUpperCase() : 'ST'}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
              {user.name}
            </h3>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-semibold">
              ID: {user.student_id}
            </p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 uppercase">
                {user.department}
              </span>
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70">
                Batch {user.batch_no}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-white/5 text-xs">
          <div className="p-2 bg-slate-50 dark:bg-[#121214] rounded-xl border border-slate-200/60 dark:border-white/5">
            <span className="text-[9px] text-slate-400 dark:text-white/40 block font-medium uppercase tracking-wider">
              Active Semester
            </span>
            <span className="font-bold text-slate-900 dark:text-white font-mono text-xs">
              {currentSemester?.name || `Semester #${user.semester_id}`}
            </span>
          </div>

          <div className="p-2 bg-slate-50 dark:bg-[#121214] rounded-xl border border-slate-200/60 dark:border-white/5">
            <span className="text-[9px] text-slate-400 dark:text-white/40 block font-medium uppercase tracking-wider">
              Enrolled Credits
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono text-xs">
              {Number(user.total_credits || 0).toFixed(1)} Cr
            </span>
          </div>
        </div>
      </div>

      {/* Appearance & Theme (Dark, Light, Auto) */}
      <div className="space-y-1">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-white/40 px-1 pt-1">
          Theme & Display Mode
        </h4>

        <div className="bg-white dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/5 rounded-2xl p-3 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Theme Mode</span>
              <span className="text-[10px] text-slate-500 dark:text-white/40">
                Current: <strong className="text-indigo-600 dark:text-indigo-400 uppercase font-semibold">{effectiveTheme}</strong>
                {themeMode === 'auto' ? ' (System Auto)' : ''}
              </span>
            </div>
          </div>

          {/* 3-way Theme Switcher */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-[#121214] rounded-xl border border-slate-200 dark:border-white/5">
            <button
              onClick={() => setThemeMode('dark')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                themeMode === 'dark'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-white/40 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>

            <button
              onClick={() => setThemeMode('light')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                themeMode === 'light'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-white/40 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light</span>
            </button>

            <button
              onClick={() => setThemeMode('auto')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                themeMode === 'auto'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-white/40 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Auto</span>
            </button>
          </div>
        </div>
      </div>

      {/* PWA App Installation Section - Hidden if app is already installed */}
      {!isPwaInstalled && (
        <div className="space-y-1">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-white/40 px-1 pt-1">
            PWA App Installation
          </h4>

          <div className="bg-white dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/5 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-sm transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Install PWA Routine App</span>
                <span className="text-[10px] text-slate-500 dark:text-white/40 block">
                  Add to home screen for fast offline routine access
                </span>
              </div>
            </div>

            <button
              onClick={handleInstallPwa}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/25 shrink-0 transition-all cursor-pointer"
            >
              Install PWA
            </button>
          </div>
        </div>
      )}

      {/* Academic Information & Profile */}
      <div className="space-y-1">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-white/40 px-1 pt-1">
          Academic Information & Profile
        </h4>

        <div className="bg-white dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/5 rounded-2xl divide-y divide-slate-100 dark:divide-white/5 overflow-hidden shadow-sm transition-colors">
          {/* Full Name */}
          <button
            onClick={() => openEdit('name')}
            className="w-full p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <User className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 dark:text-white/40 block uppercase font-semibold">
                  Full Name
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-white">{user.name}</span>
              </div>
            </div>
            <Edit3 className="w-3.5 h-3.5 text-slate-400 dark:text-white/40" />
          </button>

          {/* Student ID (Numbers only, 10+ digits) */}
          <button
            onClick={() => openEdit('student_id')}
            className="w-full p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Hash className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 dark:text-white/40 block uppercase font-semibold">
                  Student ID (10+ Digits)
                </span>
                <span className="text-xs font-mono font-semibold text-slate-900 dark:text-white">{user.student_id}</span>
              </div>
            </div>
            <Edit3 className="w-3.5 h-3.5 text-slate-400 dark:text-white/40" />
          </button>

          {/* Department */}
          <button
            onClick={() => openEdit('department')}
            className="w-full p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 dark:text-white/40 block uppercase font-semibold">
                  Department
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  {getDepartmentDisplayName(user.department, departmentsFull)}
                </span>
              </div>
            </div>
            <Edit3 className="w-3.5 h-3.5 text-slate-400 dark:text-white/40" />
          </button>

          {/* Batch */}
          <button
            onClick={() => openEdit('batch')}
            className="w-full p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <GraduationCap className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 dark:text-white/40 block uppercase font-semibold">
                  Batch Number
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Batch {user.batch_no}</span>
              </div>
            </div>
            <Edit3 className="w-3.5 h-3.5 text-slate-400 dark:text-white/40" />
          </button>

          {/* Semester */}
          <button
            onClick={() => openEdit('semester')}
            className="w-full p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 dark:text-white/40 block uppercase font-semibold">
                  Active Semester
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  {currentSemester?.name || `Semester #${user.semester_id}`}
                </span>
              </div>
            </div>
            <Edit3 className="w-3.5 h-3.5 text-slate-400 dark:text-white/40" />
          </button>
        </div>
      </div>

      {/* Security & Password */}
      <div className="space-y-1">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-white/40 px-1 pt-1">
          Security & Session
        </h4>

        <div className="bg-white dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/5 rounded-2xl divide-y divide-slate-100 dark:divide-white/5 overflow-hidden shadow-sm transition-colors">
          {/* Password Change */}
          <button
            onClick={() => openEdit('password')}
            className="w-full p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <KeyRound className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 dark:text-white/40 block uppercase font-semibold">
                  Account Password
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Change Password</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-white/40" />
          </button>

          {/* Last Login Info */}
          <div className="p-3 flex items-center justify-between text-xs text-slate-500 dark:text-white/40">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="block text-[9px] text-slate-400 dark:text-white/40 uppercase font-semibold tracking-wider">
                  Last Login
                </span>
                <span className="font-semibold text-slate-800 dark:text-white/90 text-xs">
                  {formatLastLogin(user.last_login)}
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Sign Out Button */}
      <div className="pt-2">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out of Student Account</span>
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-[#09090b]/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-2xl"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
                <LogOut className="w-5 h-5" />
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white text-center mb-1">
                Sign Out Confirmation
              </h3>
              <p className="text-xs text-slate-500 dark:text-white/50 text-center mb-4">
                Are you sure you want to sign out? You can sign back in anytime with your Student ID.
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1c1c1f] dark:hover:bg-zinc-800 text-slate-700 dark:text-white text-xs font-bold rounded-xl border border-slate-200 dark:border-white/5 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmLogoutAction}
                  disabled={loggingOut}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/30 transition-all cursor-pointer"
                >
                  {loggingOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Field Modal */}
      <AnimatePresence>
        {editModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-[#09090b]/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ y: '100%', opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-[#121214] border-t sm:border border-slate-200 dark:border-white/10 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl"
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                {editModal === 'name' && 'Change Full Name'}
                {editModal === 'student_id' && 'Change Student ID (10+ Digits)'}
                {editModal === 'department' && 'Change Department'}
                {editModal === 'batch' && 'Change Batch Number'}
                {editModal === 'semester' && 'Change Semester'}
                {editModal === 'password' && 'Update Security Password'}
              </h3>

              <form onSubmit={handleSave} className="space-y-3">
                {editModal === 'name' && (
                  <div>
                    <label className="text-xs text-slate-700 dark:text-white/60 font-medium block mb-1">
                      Student Full Name
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                      placeholder="e.g. Tamanna Jannat"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                {editModal === 'student_id' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-slate-700 dark:text-white/60 font-medium block">
                        Student ID (Numeric Only, 10+ Digits)
                      </label>
                      <span className="text-[10px] text-slate-400 dark:text-white/40 font-mono">
                        {newStudentId.length >= 10 ? `${newStudentId.length} digits` : `${newStudentId.length}/10+ digits`}
                      </span>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={newStudentId}
                      onChange={(e) => handleStudentIdChange(e.target.value)}
                      required
                      placeholder="e.g. 2023100101"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/5 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                {editModal === 'department' && (
                  <div>
                    <label className="text-xs text-slate-700 dark:text-white/60 font-medium block mb-1">
                      Select Department
                    </label>
                    <select
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    >
                      {departments.map((d) => (
                        <option key={d} value={d} className="bg-white dark:bg-[#1c1c1f] text-slate-900 dark:text-white">
                          {getDepartmentDisplayName(d, departmentsFull)}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-300 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>Switching department will automatically reload default courses for {newDept}.</span>
                    </p>
                  </div>
                )}

                {editModal === 'batch' && (
                  <div>
                    <label className="text-xs text-slate-700 dark:text-white/60 font-medium block mb-1">
                      Batch Number
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={newBatch}
                      onChange={(e) => handleBatchChange(e.target.value)}
                      required
                      placeholder="e.g. 1, 2, 3, 4"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/5 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                {editModal === 'semester' && (
                  <div>
                    <label className="text-xs text-slate-700 dark:text-white/60 font-medium block mb-1">
                      Select Current Semester (1st to 8th)
                    </label>
                    <select
                      value={newSemesterId}
                      onChange={(e) => setNewSemesterId(Number(e.target.value))}
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    >
                      {semesters.map((s) => (
                        <option key={s.id} value={s.id} className="bg-white dark:bg-[#1c1c1f] text-slate-900 dark:text-white">
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-300 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>Changing semester auto-enrolls all default semester courses.</span>
                    </p>
                  </div>
                )}

                {editModal === 'password' && (
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-xs text-slate-700 dark:text-white/60 font-medium block mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                        placeholder="Enter current password"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-700 dark:text-white/60 font-medium block mb-1">
                        New Password (min 6 chars)
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="Enter new password"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-700 dark:text-white/60 font-medium block mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="Repeat new password"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditModal(null)}
                    className="px-3.5 py-2 bg-slate-100 dark:bg-[#1c1c1f] hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-white/70 font-semibold rounded-xl text-xs border border-slate-200 dark:border-white/5 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
