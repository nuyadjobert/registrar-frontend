import { Student } from './student.model';
import { Section } from './section.model';

export interface Grade {
  id: number;
  student_id: number;
  section_id: number;
  grade: string | null;
  remarks: string | null;
  student?: Student;
  section?: Section;
  created_at?: string;
  updated_at?: string;
}

export interface GradePayload {
  student_id: number;
  section_id: number;
  grade?: string | null;
  remarks?: string | null;
}