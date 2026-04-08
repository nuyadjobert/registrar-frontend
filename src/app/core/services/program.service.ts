import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Program, ProgramPayload } from '../models/program.model';

@Injectable({ providedIn: 'root' })
export class ProgramService {
  private path = 'programs';

  constructor(private api: ApiService) {}

  // GET /api/programs
  getAll() {
    return this.api.get<Program[]>(this.path);
  }
  getActive() {
  return this.api.get<Program[]>(`${this.path}?status=active`);
}

  // GET /api/programs/:id  (returns with students & curricula)
  getById(id: number) {
    return this.api.get<Program>(`${this.path}/${id}`);
  }

  // POST /api/programs
  create(payload: ProgramPayload) {
    return this.api.post<Program>(this.path, payload);
  }

  // PUT /api/programs/:id
  update(id: number, payload: ProgramPayload) {
    return this.api.put<Program>(`${this.path}/${id}`, payload);
  }

  // DELETE /api/programs/:id
  delete(id: number) {
    return this.api.delete<{ message: string }>(`${this.path}/${id}`);
  }
}