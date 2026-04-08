import { Student } from './student.model';

export type DocumentType = 'COR' | 'TOR' | string;
// document-request.model.ts
export type DocumentRequestStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type DocumentPaymentStatus = 'unpaid' | 'paid';

export interface DocumentRequest {
  id: number;
  student_id: number;
  type: DocumentType;
  payment_status: DocumentPaymentStatus;
  status: DocumentRequestStatus;
  student?: Student;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentRequestPayload {
  student_id: number;
  type: DocumentType;
  payment_status?: DocumentPaymentStatus;
}