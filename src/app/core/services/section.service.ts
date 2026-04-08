import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Section, SectionPayload } from '../models/section.model';

@Injectable({ providedIn: 'root' })
export class SectionService {
  private path = 'sections';

  constructor(private api: ApiService) {}

  // GET /api/sections (returns with subject & instructor)
  getAll() {
    return this.api.get<Section[]>(this.path);
  }

  // GET /api/sections/:id (returns with subject, instructor & enrollments)
  getById(id: number) {
    return this.api.get<Section>(`${this.path}/${id}`);
  }

  // POST /api/sections
  create(payload: SectionPayload) {
    return this.api.post<Section>(this.path, payload);
  }

  // PUT /api/sections/:id
  update(id: number, payload: SectionPayload) {
    return this.api.put<Section>(`${this.path}/${id}`, payload);
  }

  // DELETE /api/sections/:id
  delete(id: number) {
    return this.api.delete<{ message: string }>(`${this.path}/${id}`);
  }
}