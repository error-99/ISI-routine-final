import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  User,
  Hash,
  Eye,
  EyeOff,
  ArrowRight,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Semester } from '../types';
import { DepartmentItem, getDepartmentDisplayName } from '../utils/departments';

interface AuthModalProps {
  onShowToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onShowToast }) => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  // Form states
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register extra states
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('AMM');
  const [batchNo, setBatchNo] = useState('1');
  const [semesterId, setSemesterId] = useState<number>(1);

  // Metadata
  const [departments, setDepartments] = useState<string[]>(() => {
    const cached = api.getCachedData<{ departments: string[] }>('departments');
    return cached?.departments || ['AMM', 'BBA', 'CSE', 'EEE', 'English', 'Textile'];
  });
  const [departmentsFull, setDepartmentsFull] = useState<DepartmentItem[]>(() => {
    const cached = api.getCachedData<{ departments_full: DepartmentItem[] }>('departments');
    return cached?.departments_full || [];
  });
  const [semesters, setSemesters] = useState<Semester[]>(() => {
    const cached = api.getCachedData<{ semesters: Semester[] }>('semesters');
    return cached?.semesters || [];
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [deptRes, semRes] = await Promise.all([
          api.getDepartments(),
          api.getSemesters(),
        ]);
        if (deptRes.success && deptRes.data) {
          const list = deptRes.data.departments || [];
          setDepartments(list);
          if (deptRes.data.departments_full) {
            setDepartmentsFull(deptRes.data.departments_full);
          }
          if (list.length > 0 && (!department || !list.includes(department))) {
            setDepartment(list[0]);
          }
        }
        if (semRes.success && semRes.data?.semesters) {
          setSemesters(semRes.data.semesters);
          const active = semRes.data.semesters.find((s) => s.is_active);
          if (active) setSemesterId(active.id);
        }
      } catch {
        // use default fallbacks
      }
    };
    loadMeta();
  }, []);

  const handleStudentIdChange = (val: string) => {
    // Restrict to numbers only, minimum 10 digits (can be more than 10)
    const cleaned = val.replace(/\D/g, '').slice(0, 25);
    setStudentId(cleaned);
  };

  const handleBatchChange = (val: string) => {
    // Restrict to numeric batch
    const cleaned = val.replace(/\D/g, '').slice(0, 5);
    setBatchNo(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim()) {
      onShowToast('Please enter your Student ID', 'error');
      return;
    }
    if (studentId.trim().length < 10) {
      onShowToast('Student ID must be at least 10 digits (numeric only)', 'error');
      return;
    }
    if (!/^\d{10,}$/.test(studentId.trim())) {
      onShowToast('Student ID must contain numbers only', 'error');
      return;
    }
    if (!password) {
      onShowToast('Please enter your password', 'error');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        if (!name.trim()) {
          throw new Error('Please enter your full name');
        }
        const res = await register({
          student_id: studentId.trim(),
          name: name.trim(),
          password,
          department,
          batch_no: batchNo.trim() || '1',
          semester_id: Number(semesterId) || 1,
        });

        if (res.success) {
          onShowToast(res.message || 'Registration successful! Default department courses loaded.', 'success');
        } else {
          onShowToast(res.message, 'error');
        }
      } else {
        const res = await login(studentId.trim(), password);
        if (res.success) {
          onShowToast('Login successful! Welcome back.', 'success');
        } else {
          onShowToast(res.message, 'error');
        }
      }
    } catch (err: any) {
      onShowToast(err?.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center px-3 py-4 max-w-md mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/5 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-xl transition-colors"
      >
        {/* App Logo & Header */}
        <div className="text-center mb-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-2 shadow-md shadow-indigo-600/10">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            ISU Student Routine Portal
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-white/40 mt-0.5">
            Routine Schedule & Department Portal
          </p>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-[#1c1c1f] rounded-xl border border-slate-200 dark:border-white/5 mb-4">
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              !isRegister
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isRegister
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Student ID (Numbers only, 10+ digits) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-white/70 block">
                Student ID
              </label>
              <span className="text-[10px] font-mono text-slate-400 dark:text-white/40">
                {studentId.length >= 10 ? (
                  <span className="text-emerald-500 font-bold">{studentId.length} digits</span>
                ) : (
                  <span>{studentId.length}/10+ digits</span>
                )}
              </span>
            </div>
            <div className="relative">
              <Hash className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30" />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={studentId}
                onChange={(e) => handleStudentIdChange(e.target.value)}
                required
                placeholder="e.g. 2023100101"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/5 rounded-xl text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* If Register: Name, Department, Batch, Semester */}
          {isRegister && (
            <>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-white/70 block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Tamanna Jannat"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/5 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Department Selector */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-white/70 block mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  {departments.map((d) => (
                    <option key={d} value={d} className="bg-white dark:bg-[#1c1c1f] text-slate-900 dark:text-white">
                      {getDepartmentDisplayName(d, departmentsFull)}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>Showing courses and routines exclusively for {department} department.</span>
                </p>
              </div>

              {/* Batch Number Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-white/70 block">
                    Batch Number
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-white/40 font-mono">
                    Batch: {batchNo || '1'}
                  </span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={batchNo}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  required
                  placeholder="Enter batch number (e.g. 1, 2, 3, 4)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/5 rounded-xl text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Semester Selector (1st, 2nd, 3rd, ...) */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-white/70 block mb-1">
                  Current Semester
                </label>
                <select
                  value={semesterId}
                  onChange={(e) => setSemesterId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors font-medium"
                >
                  {semesters.length > 0 ? (
                    semesters.map((s) => (
                      <option key={s.id} value={s.id} className="bg-white dark:bg-[#1c1c1f] text-slate-900 dark:text-white">
                        {s.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value={1} className="bg-white dark:bg-[#1c1c1f] text-slate-900 dark:text-white">1st Semester</option>
                      <option value={2} className="bg-white dark:bg-[#1c1c1f] text-slate-900 dark:text-white">2nd Semester</option>
                      <option value={3} className="bg-white dark:bg-[#1c1c1f] text-slate-900 dark:text-white">3rd Semester</option>
                      <option value={4} className="bg-white dark:bg-[#1c1c1f] text-slate-900 dark:text-white">4th Semester</option>
                    </>
                  )}
                </select>
              </div>
            </>
          )}

          {/* Password */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-white/70 block mb-1">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
                className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/5 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/25 flex items-center justify-center gap-1.5 transition-all mt-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{isRegister ? `Complete Registration & Load ${department}` : 'Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
