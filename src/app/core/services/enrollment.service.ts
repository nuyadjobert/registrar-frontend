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

  // GET /api/enrollments (returns with student.program, section.subject, section.instructor)
  getAll() {
    return this.api.get<Enrollment[]>(this.path);
  }

  // GET /api/enrollments/:id
  getById(id: number) {
    return this.api.get<Enrollment>(`${this.path}/${id}`);
  }

  // POST /api/enrollments
  enroll(payload: EnrollPayload) {
    return this.api.post<Enrollment>(this.path, payload);
  }

  // POST /api/enrollments/:id/approve
  approve(id: number) {
    return this.api.post<EnrollmentActionResponse>(
      `${this.path}/${id}/approve`, {}
    );
  }

  // POST /api/enrollments/:id/reject
  reject(id: number) {
    return this.api.post<EnrollmentActionResponse>(
      `${this.path}/${id}/reject`, {}
    );
  }

  // POST /api/enrollments/:id/mark-paid
  markAsPaid(id: number) {
    return this.api.post<EnrollmentActionResponse>(
      `${this.path}/${id}/mark-paid`, {}
    );
  }
}