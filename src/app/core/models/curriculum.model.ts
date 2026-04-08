import { Program } from './program.model';
import { Subject } from './subject.model';

export type CurriculumSemester = '1' | '2' | 'summer';
export type CurriculumStatus = 'active' | 'inactive';

export interface Curriculum {
  id: number;
  program_id: number;
  subject_id: number;
  year_level: number;
  semester: CurriculumSemester;
  school_year: string;
  status: CurriculumStatus;
  program?: Program;
  subject?: Subject;
  created_at?: string;
  updated_at?: string;
}

export interface CurriculumPayload {
  program_id: number;
  subject_id: number;
  year_level: number;
  semester: CurriculumSemester;
  school_year: string;
  status?: CurriculumStatus;
}