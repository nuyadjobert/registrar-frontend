import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Term, TermPayload } from '../models/term.model';

@Injectable({
  providedIn: 'root'
})
export class TermService {
  private path = 'terms';

  constructor(private api: ApiService) {}

  /**
   * Fetch all academic terms
   * GET /api/terms
   */
  getAll() {
    return this.api.get<Term[]>(this.path);
  }

  /**
   * Fetch a single term by ID
   * GET /api/terms/:id
   */
  getById(id: number) {
    return this.api.get<Term>(`${this.path}/${id}`);
  }

  /**
   * Create a new academic term
   * POST /api/terms
   */
  create(payload: TermPayload) {
    return this.api.post<Term>(this.path, payload);
  }

  /**
   * Update an existing term
   * PUT /api/terms/:id
   */
  update(id: number, payload: TermPayload) {
    return this.api.put<Term>(`${this.path}/${id}`, payload);
  }

  /**
   * Delete a term
   * DELETE /api/terms/:id
   */
  delete(id: number) {
    return this.api.delete<{ message: string }>(`${this.path}/${id}`);
  }
}