import { Program } from './program.model';

export interface Student {
  id: number;
  student_number: string;
  name: string;
  program_id: number;
  program?: Program;
  created_at?: string;
  updated_at?: string;
}

export interface StudentPayload {
  student_number: string;
  name: string;
  program_id: number;
}