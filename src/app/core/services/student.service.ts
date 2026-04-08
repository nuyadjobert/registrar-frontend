import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Student } from '../models/student.model';

export interface CorData {
  student: string;
  student_number: string;
  program: string;
  enrollments: {
    section: string;
    subject: string;
    units: number;
    status: string;
  }[];
}

export interface TorData {
  student: string;
  student_number: string;
  program: string;
  grades: {
    subject: string;
    section: string;
    grade: string;
    remarks: string;
  }[];
}

export interface DocumentResponse<T> {
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class StudentService {
  private path = 'students';

  constructor(private api: ApiService) {}

  // GET /api/students (returns with program & enrollments)
  getAll() {
    return this.api.get<Student[]>(this.path);
  }

  // GET /api/students/:id (returns with program, enrollments & documentRequests)
  getById(id: number) {
    return this.api.get<Student>(`${this.path}/${id}`);
  }

  // GET /api/students/:id/cor
  getCor(id: number) {
    return this.api.get<DocumentResponse<CorData>>(`${this.path}/${id}/cor`);
  }

  // GET /api/students/:id/tor
  getTor(id: number) {
    return this.api.get<DocumentResponse<TorData>>(`${this.path}/${id}/tor`);
  }
}