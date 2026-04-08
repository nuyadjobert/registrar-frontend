import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Subject, SubjectPayload } from '../models/subject.model';

@Injectable({ providedIn: 'root' })
export class SubjectService {
  private path = 'subjects';

  constructor(private api: ApiService) {}

 
getAll() {
  return this.api.get<Subject[]>(this.path);
}

// GET /api/subjects?status=active (for dropdowns)
getActive() {
  return this.api.get<Subject[]>(`${this.path}?status=active`);
}

  // GET /api/subjects/:id (returns with sections)
  getById(id: number) {
    return this.api.get<Subject>(`${this.path}/${id}`);
  }

  // POST /api/subjects
  create(payload: SubjectPayload) {
    return this.api.post<Subject>(this.path, payload);
  }

  // PUT /api/subjects/:id
  update(id: number, payload: SubjectPayload) {
    return this.api.put<Subject>(`${this.path}/${id}`, payload);
  }

  // DELETE /api/subjects/:id
  delete(id: number) {
    return this.api.delete<{ message: string }>(`${this.path}/${id}`);
  }
}