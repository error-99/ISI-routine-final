export interface DepartmentItem {
  code: string;
  name: string;
}

export const DEPARTMENT_FULL_NAMES: Record<string, string> = {
  AMM: 'Apparel Manufacturing & Merchandising',
  BBA: 'Bachelor of Business Administration',
  CSE: 'Computer Science & Engineering',
  EEE: 'Electrical & Electronic Engineering',
  English: 'Department of English',
  Textile: 'Textile Engineering',
};

/**
 * Returns formatted display name like "CSE (Computer Science & Engineering)"
 * Always prioritizes live database data (departmentsFull).
 */
export const getDepartmentDisplayName = (
  code: string,
  departmentsFull?: DepartmentItem[]
): string => {
  if (!code) return '';

  // 1. Check matching item from database departments_full
  if (departmentsFull && departmentsFull.length > 0) {
    const match = departmentsFull.find(
      (d) => d.code?.trim().toLowerCase() === code.trim().toLowerCase()
    );
    if (match && match.name && match.name.trim().toLowerCase() !== match.code.trim().toLowerCase()) {
      return `${match.code} (${match.name.trim()})`;
    }
  }

  // 2. Check predefined dictionary for standard recognized departments
  const normalizedKey =
    Object.keys(DEPARTMENT_FULL_NAMES).find(
      (k) => k.toLowerCase() === code.trim().toLowerCase()
    );

  if (normalizedKey) {
    const fullName = DEPARTMENT_FULL_NAMES[normalizedKey];
    if (fullName && fullName.toLowerCase() !== code.trim().toLowerCase()) {
      return `${code} (${fullName})`;
    }
  }

  return code;
};
