import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  Lock,
  GraduationCap,
  Sparkles,
  RefreshCw,
  X,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Course, Semester } from '../types';

interface CoursesViewProps {
  onShowToast: (text: string, type: 'success' | 'error' | 'info') => void;
  refreshTrigger: number;
}

export const CoursesView: React.FC<CoursesViewProps> = ({ onShowToast, refreshTrigger }) => {
  const { user, refreshProfile, currentSemester } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>(() => {
    const cached = api.getCachedData<{ courses: Course[] }>('my_courses');
    return cached?.courses || [];
  });
  const [availableCourses, setAvailableCourses] = useState<Course[]>(() => {
    const cached = api.getCachedData<{ courses: Course[] }>('available_courses');
    return cached?.courses || [];
  });
  const [semesters, setSemesters] = useState<Semester[]>(() => {
    const cached = api.getCachedData<{ semesters: Semester[] }>('semesters');
    return cached?.semesters || [];
  });
  const [selectedSemesterTab, setSelectedSemesterTab] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState<boolean>(() => {
    const cached = api.getCachedData<{ courses: Course[] }>('my_courses');
    return !cached?.courses?.length;
  });
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const getCourseId = (c: Course): number => c.course_id || (c as any).id;

  const loadData = async (silent = false) => {
    if (!silent && enrolledCourses.length === 0) setLoading(true);
    try {
      const [myRes, allRes, semRes] = await Promise.all([
        api.getMyCourses(),
        api.getAllCourses(),
        api.getSemesters(),
      ]);

      if (myRes.success && myRes.data?.courses) {
        setEnrolledCourses(myRes.data.courses);
      }
      if (allRes.success && allRes.data?.courses) {
        setAvailableCourses(allRes.data.courses);
      }
      if (semRes.success && semRes.data?.semesters) {
        setSemesters(semRes.data.semesters);
      }
    } catch (err: any) {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        onShowToast(err?.message || 'Failed to load courses', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(enrolledCourses.length > 0);
  }, [refreshTrigger]);

  const totalCredits = enrolledCourses.reduce(
    (acc, curr) => acc + (parseFloat(String(curr.credit)) || 0),
    0
  );

  const handleEnroll = async (courseId: number) => {
    if (!courseId) return;
    setActionLoading(true);
    try {
      const res = await api.enrollCourse(courseId);
      if (res.success) {
        onShowToast(res.message || 'Enrolled in course!', 'success');
        await loadData();
        await refreshProfile();
      } else {
        onShowToast(res.message || 'Enrollment failed', 'error');
      }
    } catch (err: any) {
      onShowToast(err?.message || 'Could not enroll in course', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDrop = async (courseId: number, courseName: string) => {
    if (!courseId) return;
    setActionLoading(true);
    try {
      const res = await api.dropCourse(courseId);
      if (res.success) {
        onShowToast(`Dropped ${courseName}`, 'info');
        setEnrolledCourses((prev) => prev.filter((c) => getCourseId(c) !== courseId));
        await loadData();
        await refreshProfile();
      } else {
        onShowToast(res.message || 'Drop failed', 'error');
      }
    } catch (err: any) {
      onShowToast(err?.message || 'Could not drop course', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAutoEnrollDefaults = async () => {
    if (!user?.semester_id) return;
    setActionLoading(true);
    try {
      const res = await api.autoEnrollDefaults(user.semester_id);
      if (res.success) {
        onShowToast(res.message || 'Default courses enrolled!', 'success');
        await loadData();
        await refreshProfile();
      } else {
        onShowToast(res.message || 'Action failed', 'error');
      }
    } catch (err: any) {
      onShowToast(err?.message || 'Could not auto-enroll', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const enrolledIdSet = new Set(enrolledCourses.map((c) => getCourseId(c)));
  const userSemesterId = user?.semester_id || 1;

  // Filter available courses for catalog
  const filteredCatalog = availableCourses.filter((course) => {
    if (course.department && user?.department && course.department !== user.department) {
      return false;
    }
    if (selectedSemesterTab !== 'all' && course.semester_id !== selectedSemesterTab) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        course.course_code.toLowerCase().includes(q) ||
        course.course_name.toLowerCase().includes(q) ||
        (course.teacher && course.teacher.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-2.5 pb-20">
      {/* Compact Summary Header */}
      <div className="p-3 bg-white dark:bg-[#151518] border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xs transition-colors space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Enrolled Courses
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              {enrolledCourses.length} Courses • {totalCredits.toFixed(1)} Cr
            </span>
          </div>
        </div>

        {/* Action button bar */}
        <div className="flex items-center gap-1.5 pt-1">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manage / Add Courses</span>
          </button>

          <button
            onClick={handleAutoEnrollDefaults}
            disabled={actionLoading}
            title="Auto-enroll default semester courses"
            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-white/70 hover:text-indigo-600 dark:hover:text-white rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Enrolled Courses List (Latest Added is 1st) */}
      <div className="space-y-1.5">
        {loading ? (
          <div className="py-10 text-center space-y-2">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[11px] text-slate-400 dark:text-white/40">Loading courses...</p>
          </div>
        ) : enrolledCourses.length === 0 ? (
          <div className="py-8 text-center bg-white dark:bg-[#151518] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-xs transition-colors">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/30 flex items-center justify-center mx-auto mb-2">
              <BookOpen className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              No Courses Currently Enrolled
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-white/40 mt-0.5 max-w-xs mx-auto mb-2.5">
              Load official {user?.department} default semester courses or browse catalog.
            </p>
            <button
              onClick={handleAutoEnrollDefaults}
              className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-98"
            >
              Auto-Load Default Courses
            </button>
          </div>
        ) : (
          enrolledCourses.map((course, idx) => {
            const courseId = getCourseId(course);
            const isRetake = (course.semester_id || 1) < userSemesterId;

            return (
              <motion.div
                key={`${courseId}-${idx}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-2.5 bg-white dark:bg-[#151518] border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xs flex items-center justify-between gap-2 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      {course.course_code}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70">
                      {course.credit} Cr
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60">
                      Sem {course.semester_id || 1}
                    </span>
                    {isRetake && (
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        Retake
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                    {course.course_name}
                  </h4>

                  {course.teacher && (
                    <p className="text-[10px] text-slate-500 dark:text-white/40 truncate mt-0.5">
                      {course.teacher}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleDrop(courseId, course.course_name)}
                  title={`Drop ${course.course_code}`}
                  className="px-2 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Drop</span>
                </button>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add / Drop Catalog Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-[#09090b]/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ y: '100%', opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="w-full max-w-lg bg-white dark:bg-[#151518] border-t sm:border border-slate-200/80 dark:border-white/10 rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl max-h-[88vh] flex flex-col"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {user?.department} Course Catalog
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-white/40">
                    Enroll or drop courses for your schedule
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search bar */}
              <div className="mt-2.5 relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search code, course, teacher..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-[#1c1c1f] border border-slate-200/80 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Semester Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
                <button
                  onClick={() => setSelectedSemesterTab('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedSemesterTab === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 text-slate-600 dark:text-white/50'
                  }`}
                >
                  All
                </button>
                {semesters.map((s) => {
                  const isFuture = s.id > userSemesterId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSemesterTab(s.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                        selectedSemesterTab === s.id
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : 'bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 text-slate-600 dark:text-white/50'
                      }`}
                    >
                      {isFuture && <Lock className="w-2.5 h-2.5 opacity-60" />}
                      <span>{s.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Course list scroll container */}
              <div className="flex-1 overflow-y-auto space-y-1.5 mt-1 pr-0.5">
                {filteredCatalog.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 dark:text-white/40">
                    No courses matched your query.
                  </div>
                ) : (
                  filteredCatalog.map((course) => {
                    const courseId = getCourseId(course);
                    const isEnrolled = enrolledIdSet.has(courseId);
                    const courseSem = course.semester_id || 1;
                    const isFuture = courseSem > userSemesterId;
                    const isRetake = courseSem < userSemesterId;

                    return (
                      <div
                        key={courseId}
                        className={`p-2.5 border rounded-xl flex items-center justify-between gap-2.5 transition-colors ${
                          isFuture
                            ? 'bg-slate-50/50 dark:bg-[#161618]/50 border-slate-200/60 dark:border-white/5 opacity-60'
                            : 'bg-slate-50 dark:bg-[#1c1c1f] border-slate-200/80 dark:border-white/10'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {course.course_code}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-white/40 font-mono">
                              ({course.credit} Cr)
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200/80 dark:bg-white/5 text-slate-600 dark:text-white/60">
                              Sem {courseSem}
                            </span>
                            {isFuture ? (
                              <span className="text-[8px] px-1 py-0.2 rounded font-bold uppercase bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/40 flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" />
                                Locked
                              </span>
                            ) : isRetake ? (
                              <span className="text-[8px] px-1 py-0.2 rounded font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                Down
                              </span>
                            ) : null}
                          </div>

                          <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {course.course_name}
                          </h5>

                          {course.teacher && (
                            <p className="text-[10px] text-slate-500 dark:text-white/40 truncate mt-0.5">
                              {course.teacher}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0">
                          {isEnrolled ? (
                            <button
                              onClick={() => handleDrop(courseId, course.course_name)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
                            >
                              Drop
                            </button>
                          ) : isFuture ? (
                            <button
                              disabled
                              className="px-2.5 py-1 bg-slate-200/50 dark:bg-white/5 text-slate-400 dark:text-white/30 rounded-xl text-xs font-semibold cursor-not-allowed flex items-center gap-1"
                            >
                              <Lock className="w-3 h-3" />
                              <span>Locked</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEnroll(courseId)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                            >
                              + Enroll
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Close Button */}
              <div className="pt-2.5 border-t border-slate-100 dark:border-white/5 mt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-full py-2 bg-slate-100 dark:bg-[#1c1c1f] hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-white font-bold rounded-xl text-xs border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

