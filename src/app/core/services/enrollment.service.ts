import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Enrollment } from '../models/enrollment.model';

export interface EnrollPayload {
  student_id: number;
  section_id: number;
}

export interface EnrollmentActionResponse {
  message: string;
  enrollment: Enrollment;
}

@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  private path = 'enrollments';

  constructor(private api: ApiService) {}

  /**
   * GET /api/enrollments
   * Returns with student.program, section.subject, section.instructor relations
   */
  getAll() {
    return this.api.get<Enrollment[]>(this.path);
  }

  /**
   * GET /api/enrollments/:id
   */
  getById(id: number) {
    return this.api.get<Enrollment>(`${this.path}/${id}`);
  }

  /**
   * POST /api/enrollments
   * Enroll a student into a section
   */
  enroll(payload: EnrollPayload) {
    return this.api.post<Enrollment>(this.path, payload);
  }

  /**
   * POST /api/enrollments/:id/approve
   * Approve an enrollment (only allowed if payment_status is 'paid')
   */
  approve(id: number) {
    return this.api.post<EnrollmentActionResponse>(
      `${this.path}/${id}/approve`, {}
    );
  }

  /**
   * POST /api/enrollments/:id/mark-paid
   * Mark an enrollment payment as paid
   */
  markAsPaid(id: number) {
    return this.api.post<EnrollmentActionResponse>(
      `${this.path}/${id}/mark-paid`, {}
    );
  }
}