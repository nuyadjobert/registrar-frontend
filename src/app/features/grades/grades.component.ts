import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GradeService } from '../../core/services/grade.service';
import { SectionService } from '../../core/services/section.service';
import { Grade, GradePayload } from '../../core/models/grade.model';
import { Section } from '../../core/models/section.model';
import { Student } from '../../core/models/student.model';

interface StudentWithGrade extends Student {
  grade?: string | null;
  remarks?: string | null;
}

@Component({
  selector: 'app-grades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grades.component.html',

})
export class GradesComponent implements OnInit, OnDestroy {
  sections: Section[] = [];
  studentsWithGrades: StudentWithGrade[] = [];
  selectedSectionId?: number;

  isLoading = false;
  savingStudentId: number | null = null;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private gradeService: GradeService,
    private sectionService: SectionService
  ) {}

  ngOnInit(): void {
    this.loadSections();
  }

  loadSections(): void {
    this.sectionService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.sections = data;
        },
        error: (err) => {
          this.errorMessage = 'Failed to load sections';
          console.error(err);
        }
      });
  }

  onSectionChange(): void {
    if (!this.selectedSectionId) {
      this.studentsWithGrades = [];
      return;
    }

    this.isLoading = true;
    this.successMessage = null;
    this.errorMessage = null;

    // Get students in this section
    this.gradeService.getStudentsBySection(this.selectedSectionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (students) => {
          // Get existing grades
          this.gradeService.getGradesBySection(this.selectedSectionId!)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (grades) => {
                // Merge students with grades
                this.studentsWithGrades = students.map((student) => {
                  const existingGrade = grades.find(g => g.student_id === student.id);
                  return {
                    ...student,
                    grade: existingGrade?.grade || null,
                    remarks: existingGrade?.remarks || null
                  };
                });
                this.isLoading = false;
              },
              error: (err) => {
                this.errorMessage = 'Failed to load grades';
                this.isLoading = false;
                console.error(err);
              }
            });
        },
        error: (err) => {
          this.errorMessage = 'Failed to load students';
          this.isLoading = false;
          console.error(err);
        }
      });
  }

  saveGrade(student: StudentWithGrade): void {
    if (!this.selectedSectionId) {
      this.errorMessage = 'Please select a section first';
      return;
    }

    if (!student.grade || student.grade.trim() === '') {
      this.errorMessage = 'Grade is required';
      return;
    }

    this.savingStudentId = student.id;
    this.successMessage = null;
    this.errorMessage = null;

    const payload: GradePayload = {
      student_id: student.id,
      section_id: this.selectedSectionId,
      grade: student.grade.trim(),
      remarks: student.remarks?.trim() || null
    };

    this.gradeService.save(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.savingStudentId = null;
          this.successMessage = `Grade saved for ${student.name}`;
          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        },
        error: (err) => {
          this.savingStudentId = null;
          const errorMsg = err.error?.message || 'Failed to save grade';
          this.errorMessage = errorMsg;
        }
      });
  }

  isSaveDisabled(student: StudentWithGrade): boolean {
    return !student.grade || student.grade.trim() === '' || this.savingStudentId === student.id;
  }

  getCurrentSectionName(): string {
    const section = this.sections.find(s => s.id === this.selectedSectionId);
    return section ? `${section.section_name} - ${section.subject?.subject_name}` : '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}