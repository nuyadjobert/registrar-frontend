export type SubjectType = 'lecture' | 'lab' | string;
export type SubjectStatus = 'active' | 'inactive';
export type Semester = 'first' | 'second' | 'summer';

export interface Subject {
  id: number;
  subject_code: string;
  subject_name: string;
  units: number;
  type: SubjectType | null;
  status: SubjectStatus;
  program_id?: number;
  program?: {
    id: number;
    name: string;
    code: string;
  };
  programs?: Array<{  // ← ADD THIS (what backend returns)
    id: number;
    name: string;
    code: string;
  }>;
  created_at?: string;
  updated_at?: string;
}

export interface SubjectPayload {
  subject_code: string;
  subject_name: string;
  units: number;
  type?: SubjectType | null;
  status?: SubjectStatus;
  program_id?: number;
  year_level?: number;
  semester?: Semester;
  school_year?: string;
}

export interface Program {
  id: number;
  name: string;
  code: string;
}

export interface PaginatedSubjects {
  data: Subject[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}