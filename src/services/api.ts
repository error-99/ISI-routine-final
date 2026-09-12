import { ApiResponse, Course, NotificationItem, RoutineItem, Semester, User } from '../types';

// Standalone Native Application API Base URL
const API_BASE_URL = '/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('isu_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('isu_token', token);
    } else {
      localStorage.removeItem('isu_token');
    }
  }

  public getToken(): string | null {
    return this.token || localStorage.getItem('isu_token');
  }

  public clearOfflineCache(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('isu_offline_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      } catch (err) {
        console.warn('Error clearing offline cache:', err);
      }
    }
  }

  public getCachedData<T = any>(cacheKey: string): T | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(`isu_offline_${cacheKey}`);
      if (raw) return JSON.parse(raw);
    } catch {
      return null;
    }
    return null;
  }

  public setCachedData(cacheKey: string, data: any): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(`isu_offline_${cacheKey}`, JSON.stringify(data));
    } catch (err) {
      console.warn('Failed to save to offline cache:', err);
    }
  }

  private async request<T = any>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: any;
      params?: Record<string, string | number | boolean | undefined>;
      auth?: boolean;
      cacheKey?: string;
    } = {}
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', body, params, auth = true, cacheKey } = options;

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    // Offline-only fallback: If user has no internet, retrieve from offline cache
    if (!isOnline && method === 'GET' && cacheKey) {
      try {
        const cachedRaw = localStorage.getItem(`isu_offline_${cacheKey}`);
        if (cachedRaw) {
          const cachedData = JSON.parse(cachedRaw);
          return {
            success: true,
            message: 'Offline Mode: showing cached data',
            data: cachedData,
          };
        }
      } catch {}
      return {
        success: false,
        message: 'No internet connection and no offline cached data available.',
        data: {} as T,
      };
    }

    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          query.append(key, String(val));
        }
      });
    }

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `${API_BASE_URL}/${cleanEndpoint}${queryString}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    };

    const currentToken = this.getToken();
    if (auth && currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const fetchConfig: RequestInit = {
      method,
      headers,
      cache: 'no-store', // Always bypass HTTP browser cache when online
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      fetchConfig.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, fetchConfig);
      const resData = await response.json();

      // If unauthorized token expired, handle gracefully
      if (response.status === 401) {
        this.setToken(null);
      }

      if (!response.ok && !resData.message) {
        return {
          success: false,
          message: `Request failed with status ${response.status}`,
          data: resData?.data || ({} as T),
          error: resData?.error || 'Server error',
        };
      }

      // Online fetch succeeded: Update offline cache with the fresh live database data
      if (resData.success && method === 'GET' && cacheKey) {
        try {
          localStorage.setItem(`isu_offline_${cacheKey}`, JSON.stringify(resData.data));
        } catch {}
      }

      return resData;
    } catch (err: any) {
      // If network fetch fails (offline or network error), fall back to offline cache if available
      if (method === 'GET' && cacheKey) {
        try {
          const cachedRaw = localStorage.getItem(`isu_offline_${cacheKey}`);
          if (cachedRaw) {
            const cachedData = JSON.parse(cachedRaw);
            return {
              success: true,
              message: 'Offline Mode: showing cached data',
              data: cachedData,
            };
          }
        } catch {}
      }

      return {
        success: false,
        message: err?.message || 'Network connection failed',
        data: {} as T,
        error: err?.message,
      };
    }
  }

  // Authentication
  async register(data: {
    student_id: string;
    name: string;
    password: string;
    department: string;
    batch_no: string;
    semester_id: number;
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    const res = await this.request<{ user: User; token: string }>('register', {
      method: 'POST',
      body: data,
      auth: false,
    });
    if (res.success && res.data?.token) {
      this.setToken(res.data.token);
    }
    return res;
  }

  async login(data: {
    student_id: string;
    password: string;
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    const res = await this.request<{ user: User; token: string }>('login', {
      method: 'POST',
      body: data,
      auth: false,
    });
    if (res.success && res.data?.token) {
      this.setToken(res.data.token);
      if (res.data?.user) {
        this.setCachedData('user_profile', { user: res.data.user });
      }
    }
    return res;
  }

  async logout(): Promise<ApiResponse<any>> {
    try {
      await this.request('user', {
        method: 'POST',
        params: { action: 'logout' },
        body: {},
      });
    } catch {
      // ignore
    } finally {
      this.setToken(null);
    }
    return { success: true, message: 'Logged out', data: {} };
  }

  // Public Metadata
  async getDepartments(): Promise<ApiResponse<{ departments: string[]; departments_full?: { code: string; name: string }[] }>> {
    return this.request<{ departments: string[]; departments_full?: { code: string; name: string }[] }>('departments', {
      method: 'GET',
      auth: false,
      cacheKey: 'departments',
    });
  }

  async getSemesters(): Promise<ApiResponse<{ semesters: Semester[] }>> {
    return this.request<{ semesters: Semester[] }>('semesters', {
      method: 'GET',
      auth: false,
      cacheKey: 'semesters',
    });
  }

  // User Profile & Courses
  async getMe(): Promise<ApiResponse<{ user: User; current_semester?: Semester }>> {
    return this.request<{ user: User; current_semester?: Semester }>('user', {
      method: 'GET',
      params: { action: 'me' },
      cacheKey: 'user_profile',
    });
  }

  async getCourses(): Promise<ApiResponse<{ courses: Course[]; total_credits: number }>> {
    return this.request<{ courses: Course[]; total_credits: number }>('user', {
      method: 'GET',
      params: { action: 'courses' },
      cacheKey: 'my_courses',
    });
  }

  async getMyCourses(): Promise<ApiResponse<{ courses: Course[]; total_credits: number }>> {
    return this.getCourses();
  }

  async getAvailableCourses(): Promise<ApiResponse<{ courses: Course[] }>> {
    return this.request<{ courses: Course[] }>('user', {
      method: 'GET',
      params: { action: 'available_courses' },
      cacheKey: 'available_courses',
    });
  }

  async getAllCourses(): Promise<ApiResponse<{ courses: Course[] }>> {
    return this.getAvailableCourses();
  }

  async addCourse(course_id: number): Promise<ApiResponse<any>> {
    return this.request('user', {
      method: 'POST',
      params: { action: 'add_course' },
      body: { course_id },
    });
  }

  async enrollCourse(course_id: number): Promise<ApiResponse<any>> {
    return this.addCourse(course_id);
  }

  async removeCourse(course_id: number): Promise<ApiResponse<any>> {
    return this.request('user', {
      method: 'POST',
      params: { action: 'remove_course' },
      body: { course_id },
    });
  }

  async dropCourse(course_id: number): Promise<ApiResponse<any>> {
    return this.removeCourse(course_id);
  }

  async autoEnrollDefaults(semester_id: number): Promise<ApiResponse<any>> {
    return this.changeSemester(semester_id);
  }

  // Routines, CTs, and Exams
  async getRoutine(params?: {
    type?: string;
    date?: string;
    upcoming?: number;
  }): Promise<ApiResponse<{ routine: RoutineItem[] }>> {
    return this.request<{ routine: RoutineItem[] }>('user', {
      method: 'GET',
      params: { action: 'routine', ...params },
      cacheKey: `routine_${params?.type || 'all'}`,
    });
  }

  async getCTs(): Promise<ApiResponse<{ routine: RoutineItem[] }>> {
    return this.request<{ routine: RoutineItem[] }>('user', {
      method: 'GET',
      params: { action: 'ct' },
      cacheKey: 'cts',
    });
  }

  async getExams(): Promise<ApiResponse<{ routine: RoutineItem[] }>> {
    return this.request<{ routine: RoutineItem[] }>('user', {
      method: 'GET',
      params: { action: 'exams' },
      cacheKey: 'exams',
    });
  }

  // Account Changes
  async changeSemester(semester_id: number): Promise<ApiResponse<any>> {
    return this.request('user', {
      method: 'POST',
      params: { action: 'change_semester' },
      body: { semester_id },
    });
  }

  async changeStudentId(student_id: string): Promise<ApiResponse<any>> {
    return this.request('user', {
      method: 'POST',
      params: { action: 'change_student_id' },
      body: { student_id },
    });
  }

  async changeName(name: string): Promise<ApiResponse<any>> {
    return this.request('user', {
      method: 'POST',
      params: { action: 'change_name' },
      body: { name },
    });
  }

  async changeDepartment(department: string): Promise<ApiResponse<any>> {
    return this.request('user', {
      method: 'POST',
      params: { action: 'change_department' },
      body: { department },
    });
  }

  async changeBatch(batch_no: string): Promise<ApiResponse<any>> {
    return this.request('user', {
      method: 'POST',
      params: { action: 'change_batch' },
      body: { batch_no },
    });
  }

  async changePassword(old_password: string, new_password: string): Promise<ApiResponse<any>> {
    return this.request('user', {
      method: 'POST',
      params: { action: 'change_password' },
      body: { old_password, new_password },
    });
  }

  // Notifications
  async getNotifications(params?: {
    type?: string;
    limit?: number;
  }): Promise<ApiResponse<{ count: number; notifications: NotificationItem[] }>> {
    return this.request<{ count: number; notifications: NotificationItem[] }>(
      'notifications',
      {
        method: 'GET',
        params: { action: 'list', ...params },
        cacheKey: `notifications_${params?.type || 'all'}`,
      }
    );
  }

  async getUnreadCount(): Promise<ApiResponse<{ unread_count: number }>> {
    return this.request<{ unread_count: number }>('notifications', {
      method: 'GET',
      params: { action: 'unread_count' },
      cacheKey: 'unread_count',
    });
  }

  async markNotificationRead(notification_id: number): Promise<ApiResponse<any>> {
    return this.request('notifications', {
      method: 'POST',
      params: { action: 'mark_read' },
      body: { notification_id },
    });
  }

  async markAllNotificationsRead(): Promise<ApiResponse<any>> {
    return this.request('notifications', {
      method: 'POST',
      params: { action: 'mark_all_read' },
      body: {},
    });
  }

  // Database Diagnostics & Schema
  async getDbStatus(): Promise<ApiResponse<{ status: any }>> {
    try {
      const res = await fetch('/api/db/status');
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to fetch DB status', data: { status: null } };
    }
  }

  async getDbErrors(): Promise<ApiResponse<{ logs: string }>> {
    try {
      const res = await fetch('/api/db/errors');
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to fetch DB error log', data: { logs: '' } };
    }
  }

  async updateDbConfig(config: {
    serviceUri?: string;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
  }): Promise<ApiResponse<{ status: any }>> {
    try {
      const res = await fetch('/api/db/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to update DB config', data: { status: null } };
    }
  }

  async retryDbConnection(): Promise<ApiResponse<{ status: any }>> {
    try {
      const res = await fetch('/api/db/retry', { method: 'POST' });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to retry DB connection', data: { status: null } };
    }
  }

  async getDbSchema(): Promise<ApiResponse<{ sql: string; tables: string[] }>> {
    try {
      const res = await fetch('/api/db/schema');
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to fetch DB schema', data: { sql: '', tables: [] } };
    }
  }
}

export const api = new ApiService();
