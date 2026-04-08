import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Instructor, InstructorPayload } from '../models/instructor.model';

@Injectable({ providedIn: 'root' })
export class InstructorService {
  private path = 'instructors';

  constructor(private api: ApiService) {}

  // GET /api/instructors
  getAll() {
    return this.api.get<Instructor[]>(this.path);
  }

  // GET /api/instructors/:id (returns with sections)
  getById(id: number) {
    return this.api.get<Instructor>(`${this.path}/${id}`);
  }

  // POST /api/instructors
  create(payload: InstructorPayload) {
    return this.api.post<Instructor>(this.path, payload);
  }

  // PUT /api/instructors/:id
  update(id: number, payload: InstructorPayload) {
    return this.api.put<Instructor>(`${this.path}/${id}`, payload);
  }

  // DELETE /api/instructors/:id
  delete(id: number) {
    return this.api.delete<{ message: string }>(`${this.path}/${id}`);
  }
}