import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import {
  DocumentRequest,
  DocumentRequestPayload,
} from '../models/document-request.model';

export interface DocumentActionResponse {
  message: string;
  document: DocumentRequest;
}

export interface COREnrollment {
  section: string;
  subject: string;
  units: number;
  status: string;
}

export interface TORGrade {
  subject: string;
  section: string;
  grade: string;
  remarks: string;
}

export interface CORData {
  student: string;
  student_number: string;
  program: string;
  enrollments: COREnrollment[];
}

export interface TORData {
  student: string;
  student_number: string;
  program: string;
  grades: TORGrade[];
}

export interface DocumentDataResponse<T> {
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class DocumentRequestService {
  private path = 'document-requests';

  constructor(private api: ApiService) {}

  // GET /api/document-requests (returns with student)
  getAll() {
    return this.api.get<DocumentRequest[]>(this.path);
  }

  // GET /api/document-requests/:id
  getById(id: number) {
    return this.api.get<DocumentRequest>(`${this.path}/${id}`);
  }

  // POST /api/document-requests
  create(payload: DocumentRequestPayload) {
    return this.api.post<DocumentRequest>(this.path, payload);
  }

  // POST /api/document-requests/:id/approve
  approve(id: number) {
    return this.api.post<DocumentActionResponse>(
      `${this.path}/${id}/approve`, {}
    );
  }

  // POST /api/document-requests/:id/reject
  reject(id: number) {
    return this.api.post<DocumentActionResponse>(
      `${this.path}/${id}/reject`, {}
    );
  }

  // GET /api/students/:id/cor
  getCOR(studentId: number) {
    return this.api.get<DocumentDataResponse<CORData>>(`students/${studentId}/cor`);
  }

  // GET /api/students/:id/transcript
  getTOR(studentId: number) {
    return this.api.get<DocumentDataResponse<TORData>>(`students/${studentId}/transcript`);
  }
}