import { Student } from './student.model';
import { Section } from './section.model';
import { User } from './user.model';

export type EnrollmentStatus = 'pending' | 'approved' | 'rejected';
export type PaymentStatus = 'unpaid' | 'paid' | 'partial';

export interface Enrollment {
  id: number;
  student_id: number;
  section_id: number;
  status: EnrollmentStatus;
  payment_status: PaymentStatus;
  approved_by: number | null;
  approved_at: string | null;
  student?: Student;
  section?: Section;
  approvedBy?: User;
  created_at?: string;
  updated_at?: string;
}