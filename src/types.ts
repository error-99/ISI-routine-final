export interface User {
  id: number;
  student_id: string; // digits only up to 10 digits
  name: string;
  department: string;
  batch_no: string; // e.g. "1", "2", "3", "4", "55", etc.
  semester_id: number;
  total_credits?: number;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Semester {
  id: number;
  name: string; // e.g. "1st Semester", "2nd Semester", "3rd Semester", etc.
  code?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

export interface Course {
  user_course_id?: number;
  course_id: number;
  course_code: string;
  course_name: string;
  department: string;
  semester_id?: number;
  credit: number;
  is_selected?: boolean;
  is_default?: boolean;
}

export interface RoutineItem {
  id: number;
  date?: string;
  day: string; // "Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"
  type: 'class' | 'ct' | 'ct1' | 'ct2' | 'ct3' | 'mid' | 'final' | 'lab' | string;
  assessment_tag?: 'CT 1' | 'CT 2' | 'CT 3' | 'Midterm Exam' | 'Final Exam' | 'Regular Class' | 'Lab Session';
  course_id?: number;
  course_code: string;
  course_name: string;
  credit?: number;
  department?: string;
  semester_id?: number;
  start_time: string; // "10:00:00"
  end_time: string;   // "11:30:00"
  room: string;
  teacher: string;
  title?: string;
  description?: string;
  syllabus?: string;
  note?: string;
  other?: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'ct' | 'mid' | 'final' | 'class' | 'general' | 'urgent' | string;
  department?: string;
  semester_id?: number;
  course_id?: number;
  course_code?: string;
  course_name?: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}
