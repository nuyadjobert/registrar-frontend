import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GradePayload {
  student_id: number;
  section_id: number | string;
  grade: string;
  remarks?: string;
}

export interface GradeRow {
  section_id: number;
  section_name: string;
  subject: string;
  grade: string;
  remarks: string;
}

@Injectable({ providedIn: 'root' })
export class StudentService {

  private studentsBase = `${environment.apiUrl}/students`;
  private gradesBase   = `${environment.apiUrl}/grades`;
  private url = `${environment.apiUrl}/external/students/sync`; 

  constructor(private http: HttpClient) {}

  // GET /students
  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.studentsBase);
  }

  // GET /students/:id
  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.studentsBase}/${id}`);
  }

  // GET /students/:id/grades
  getGrades(studentId: number): Observable<GradeRow[]> {
    return this.http.get<GradeRow[]>(`${this.studentsBase}/${studentId}/grades`);
  }

  // POST /grades
  addGrade(payload: GradePayload): Observable<any> {
    return this.http.post<any>(this.gradesBase, payload);
  }

  // PUT /grades/:id
  updateGrade(gradeId: number, payload: { grade: string; remarks?: string }): Observable<any> {
    return this.http.put<any>(`${this.gradesBase}/${gradeId}`, payload);
  }

  // GET /students/:id/cor
  getCor(id: number): Observable<any> {
    return this.http.get<any>(`${this.studentsBase}/${id}/cor`);
  }

  // GET /students/:id/transcript
  getTor(id: number): Observable<any> {
    return this.http.get<any>(`${this.studentsBase}/${id}/transcript`);
  }

  // ==================== NEW: DOCUMENTS FROM ADMISSION API ====================

  /**
   * Get all documents for a student from Admission API
   * URL: /api/external/{studentNumber}/documents
   */
  getDocuments(studentNumber: string): Observable<any> {
    return this.http.get<any>(
      `https://admission-api-production.up.railway.app/api/external/${studentNumber}/documents`,
      {
        headers: {
          'api_key': 'uGz1oXUDVNVIq1xWmmLglKqgYd6eEP1gy55uIjvwe4a6Lw84FBPETQLmbQzkXtSF'
        }
      }
    );
  }

  /**
   * Get specific document type (if needed in future)
   */
  getDocumentByType(studentNumber: string, type: string): Observable<any> {
    return this.http.get<any>(
      `https://admission-api-production.up.railway.app/api/external/${studentNumber}/documents/${type}`,
      {
        headers: {
          'api_key': 'uGz1oXUDVNVIq1xWmmLglKqgYd6eEP1gy55uIjvwe4a6Lw84FBPETQLmbQzkXtSF'
        }
      }
    );
  }
}