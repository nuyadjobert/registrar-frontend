import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Curriculum, CurriculumPayload } from '../models/curriculum.model';

@Injectable({ providedIn: 'root' })
export class CurriculumService {
  private path = 'curricula';

  constructor(private api: ApiService) {}

  // GET /api/curricula (returns with program & subject)
  getAll() {
    return this.api.get<Curriculum[]>(this.path);
  }

  // GET /api/curricula/:id
  getById(id: number) {
    return this.api.get<Curriculum>(`${this.path}/${id}`);
  }

  // POST /api/curricula
  create(payload: CurriculumPayload) {
    return this.api.post<Curriculum>(this.path, payload);
  }

  // PUT /api/curricula/:id
  update(id: number, payload: CurriculumPayload) {
    return this.api.put<Curriculum>(`${this.path}/${id}`, payload);
  }

  // DELETE /api/curricula/:id
  delete(id: number) {
    return this.api.delete<{ message: string }>(`${this.path}/${id}`);
  }
}