export type SubjectType = 'lecture' | 'lab' | string;
export type SubjectStatus = 'active' | 'inactive';

export interface Subject {
  id: number;
  subject_code: string;
  subject_name: string;
  units: number;
  type: SubjectType | null;
  status: SubjectStatus;
  program_id?: number;  // ADD THIS
  program?: {           // ADD THIS
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
  program_id?: number;  // ADD THIS
}

export interface Program {  // ADD THIS INTERFACE
  id: number;
  name: string;
  code: string;
}