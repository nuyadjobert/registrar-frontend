export type InstructorStatus = 'active' | 'inactive';

export interface Instructor {
  id: number;
  name: string;
  email: string | null;
  department: string | null;
  status: InstructorStatus;
  created_at?: string;
  updated_at?: string;
}

export interface InstructorPayload {
  name: string;
  email?: string | null;
  department?: string | null;
  status?: InstructorStatus;
}