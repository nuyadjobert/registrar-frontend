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
  year_level?: number;          // ADD THIS
  semester?: Semester;          // ADD THIS
  school_year?: string;         // ADD THIS
}

export interface Program {
  id: number;
  name: string;
  code: string;
}