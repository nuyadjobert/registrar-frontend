import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Grade, GradePayload } from '../models/grade.model';

@Injectable({ providedIn: 'root' })
export class GradeService {
  private path = 'grades';

  constructor(private api: ApiService) {}

  /**
   * GET /api/grades?section_id=:sectionId
   * Get all grades for a specific section
   */
  getGradesBySection(sectionId: number) {
    return this.api.get<Grade[]>(this.path, { section_id: sectionId.toString() });
  }

  /**
   * GET /api/grades?section_id=:sectionId (optional parameter)
   * Get all grades, optionally filtered by section
   */
  getAll(sectionId?: number) {
    const params = sectionId
      ? { section_id: sectionId.toString() }
      : undefined;
    return this.api.get<Grade[]>(this.path, params);
  }

  /**
   * GET /api/grades/:id
   * Get a specific grade by ID
   */
  getById(id: number) {
    return this.api.get<Grade>(`${this.path}/${id}`);
  }

  /**
   * POST /api/grades
   * Create or update a grade (uses updateOrCreate on backend)
   * This is the main method for saving grades
   * 
   * Payload:
   * {
   *   student_id: number,
   *   section_id: number,
   *   grade: string (integer),
   *   remarks: string (optional)
   * }
   */
  save(payload: GradePayload) {
    return this.api.post<Grade>(this.path, payload);
  }

  /**
   * PUT /api/grades/:id
   * Update an existing grade by ID
   */
  update(id: number, payload: Partial<GradePayload>) {
    return this.api.put<Grade>(`${this.path}/${id}`, payload);
  }

  /**
   * GET /api/grades/sections/:sectionId/students
   * Get all students enrolled in a specific section
   * 
   * Returns: Student[] with approved enrollments only
   */
  getStudentsBySection(sectionId: number) {
    return this.api.get<any[]>(`grades/sections/${sectionId}/students`);
  }
}