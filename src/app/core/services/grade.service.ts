import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Grade, GradePayload } from '../models/grade.model';

@Injectable({ providedIn: 'root' })
export class GradeService {
  private path = 'grades';

  constructor(private api: ApiService) {}

  // GET /api/grades (optional ?section_id=)
  getAll(sectionId?: number) {
    const params = sectionId
      ? { section_id: sectionId.toString() }
      : undefined;
    return this.api.get<Grade[]>(this.path, params);
  }

  // GET /api/grades/:id
  getById(id: number) {
    return this.api.get<Grade>(`${this.path}/${id}`);
  }

  // POST /api/grades (uses updateOrCreate on backend)
  save(payload: GradePayload) {
    return this.api.post<Grade>(this.path, payload);
  }

  // PUT /api/grades/:id
  update(id: number, payload: Partial<GradePayload>) {
    return this.api.put<Grade>(`${this.path}/${id}`, payload);
  }
}