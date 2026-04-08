export type ProgramStatus = 'active' | 'inactive';

export interface Program {
  id: number;
  code: string;
  name: string;
  department: string | null;
  status: ProgramStatus;
  created_at?: string;
  updated_at?: string;
}

export interface ProgramPayload {
  code: string;
  name: string;
  department?: string | null;
  status?: ProgramStatus;
}