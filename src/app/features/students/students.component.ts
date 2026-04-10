import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { StudentService, GradeRow } from '../../core/services/student.service';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.css']
})
export class StudentsComponent implements OnInit {

  students: any[]         = [];
  filteredStudents: any[] = [];
  grades: GradeRow[]      = [];
  gradeList: any[]        = [];

  programs: string[]      = [];
  activeProgram           = 'All';

  isLoading               = false;
  searchQuery             = '';

  selectedStudent: any    = null;
  showModal               = false;
  activeTab: 'info' | 'grades' | 'documents' = 'info';
  showGradeForm           = false;

  constructor(private studentService: StudentService) {}

  ngOnInit(): void {
    this.loadStudents();
  }

  // ── Load ────────────────────────────────────────────────────

  loadStudents() {
    this.isLoading = true;
    this.studentService.getAll().subscribe({
      next: (res) => {
        this.students = res || [];
        this.extractPrograms();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  extractPrograms() {
    const set = new Set<string>(
      this.students
        .map(s => s.program?.name)
        .filter(Boolean)
    );
    this.programs = ['All', ...Array.from(set).sort()];
  }

  // ── Filter ──────────────────────────────────────────────────

  filterByProgram(event: Event) {
    this.activeProgram = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  applyFilters() {
    const q = this.searchQuery.toLowerCase().trim();
    let result = [...this.students];

    if (this.activeProgram !== 'All') {
      result = result.filter(s => s.program?.name === this.activeProgram);
    }

    if (q) {
      result = result.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.student_number?.toLowerCase().includes(q)
      );
    }

    this.filteredStudents = result;
  }

  clearFilter() {
    this.activeProgram = 'All';
    this.applyFilters();
  }

  // ── Modal ───────────────────────────────────────────────────

  viewDetails(student: any) {
    this.studentService.getById(student.id).subscribe({
      next: (res) => {
        this.selectedStudent = res;
        this.showModal       = true;
        this.activeTab       = 'info';
        this.showGradeForm   = false;
        this.gradeList       = [];
        this.grades          = [];
        this.loadGrades(student.id);
      },
      error: (err) => console.error('Failed to load student details', err)
    });
  }

  closeModal() {
    this.showModal       = false;
    this.selectedStudent = null;
    this.activeTab       = 'info';
    this.showGradeForm   = false;
    this.gradeList       = [];
    this.grades          = [];
  }

  // ── Grades ──────────────────────────────────────────────────

  loadGrades(studentId: number) {
    this.studentService.getGrades(studentId).subscribe({
      next:  (res) => { this.grades = res || []; },
      error: (err) => console.error('Failed to load grades', err)
    });
  }

  toggleGradeForm() {
    this.showGradeForm = !this.showGradeForm;
    if (this.showGradeForm && this.gradeList.length === 0) {
      const ungraded = this.grades.filter(g => !g.grade);
      this.gradeList = ungraded.length
        ? ungraded.map(g => ({
            section_id:   g.section_id,
            section_name: g.section_name,
            subject:      g.subject,
            grade:        '',
            remarks:      ''
          }))
        : [{ section_id: '', section_name: '', subject: '', grade: '', remarks: '' }];
    }
  }

  addGradeRow() {
    this.gradeList.push({
      section_id: '', section_name: '', subject: '', grade: '', remarks: ''
    });
  }

  removeGradeRow(index: number) {
    this.gradeList.splice(index, 1);
  }

  submitAllGrades() {
    if (!this.gradeList.length) {
      alert('No grades to save.');
      return;
    }
    const hasEmpty = this.gradeList.some(g => !g.section_id || !g.grade);
    if (hasEmpty) {
      alert('Please fill in Section ID and Grade for all rows.');
      return;
    }

    const requests = this.gradeList.map(g =>
      this.studentService.addGrade({
        student_id: this.selectedStudent.id,
        section_id: g.section_id,
        grade:      g.grade,
        remarks:    g.remarks
      })
    );

    forkJoin(requests).subscribe({
      next: () => {
        alert('All grades saved successfully!');
        this.showGradeForm = false;
        this.gradeList     = [];
        this.loadGrades(this.selectedStudent.id);
      },
      error: (err) => {
        console.error(err);
        alert('Some grades failed to save. Please try again.');
      }
    });
  }

  // ── Documents ───────────────────────────────────────────────

  generateCOR(id: number) {
    this.studentService.getCor(id).subscribe({
      next:  (res) => alert(res?.message || 'COR generated successfully'),
      error: (err) => alert(err?.error?.message || 'Failed to generate COR.')
    });
  }

  generateTOR(id: number) {
    this.studentService.getTor(id).subscribe({
      next:  (res) => alert(res?.message || 'TOR generated successfully'),
      error: (err) => alert(err?.error?.message || 'Failed to generate TOR.')
    });
  }
}