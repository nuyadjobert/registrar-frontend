import { Subject } from './subject.model';
import { Instructor } from './instructor.model';
import { Term } from './term.model';

export type SectionStatus = 'open' | 'closed' | 'full';

export interface Section {
  id: number;
  section_name: string;
  subject_id: number;
  instructor_id: number;
  term_id: number;
  capacity: number;
  schedule: string | null;
  room: string | null;
  status: SectionStatus;
  subject?: Subject;
  instructor?: Instructor;
  term?: Term;
  created_at?: string;
  updated_at?: string;
}

export interface SectionPayload {
  section_name: string;
  subject_id: number;
  instructor_id: number;
  term_id: number;
  capacity?: number;
  schedule?: string | null;
  room?: string | null;
  status?: SectionStatus;
}