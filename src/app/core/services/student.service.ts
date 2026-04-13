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

  constructor(private http: HttpClient) {}

  // GET /students
    getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.studentsBase);
  }


  // GET /students/:id
  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.studentsBase}/${id}`);
  }

  // GET /students/:id/grades  → GradeController@byStudent
  getGrades(studentId: number): Observable<GradeRow[]> {
    return this.http.get<GradeRow[]>(`${this.studentsBase}/${studentId}/grades`);
  }

  // POST /grades  → GradeController@store
  addGrade(payload: GradePayload): Observable<any> {
    return this.http.post<any>(this.gradesBase, payload);
  }

  // PUT /grades/:id  → GradeController@update
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
}