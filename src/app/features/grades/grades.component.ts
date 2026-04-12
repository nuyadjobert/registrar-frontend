import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  styleUrls: ['./grades.component.css']
})
export class GradesComponent implements OnInit {
  sections: Section[] = [];
  studentsWithGrades: StudentWithGrade[] = [];
  selectedSectionId?: number;
  isLoading = false;
  savingStudentId: number | null = null; // Track which student is being saved
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private gradeService: GradeService,
    private sectionService: SectionService
  ) {}

  ngOnInit(): void {
    this.loadSections();
  }

  /**
   * Load all available sections
   */
  loadSections(): void {
    this.sectionService.getAll().subscribe({
      next: (data) => {
        this.sections = data;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load sections';
      }
    });
  }

  /**
   * When section is selected:
   * 1. Fetch all students enrolled in that section
   * 2. Fetch existing grades for those students
   * 3. Merge them together
   */
  onSectionChange(): void {
    if (!this.selectedSectionId) {
      this.studentsWithGrades = [];
      return;
    }

    this.isLoading = true;
    this.successMessage = null;
    this.errorMessage = null;

    // Step 1: Get all students in this section
    this.gradeService.getStudentsBySection(this.selectedSectionId).subscribe({
      next: (students) => {
        // Step 2: Get existing grades for this section
        this.gradeService.getGradesBySection(this.selectedSectionId!).subscribe({
          next: (grades) => {
            // Step 3: Merge students with their grades
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
          }
        });
      },
      error: (err) => {
        this.errorMessage = 'Failed to load students';
        this.isLoading = false;
      }
    });
  }

  /**
   * Save grade for a student
   * Uses updateOrCreate on backend (creates if doesn't exist, updates if exists)
   */
  saveGrade(student: StudentWithGrade): void {
    if (!this.selectedSectionId) {
      this.errorMessage = 'Please select a section first';
      return;
    }

    // Validation: grade is required
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

    this.gradeService.save(payload).subscribe({
      next: (res) => {
        this.savingStudentId = null;
        this.successMessage = `Grade saved for ${student.name}`;
        
        // Clear success message after 3 seconds
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

  /**
   * Check if save button should be disabled
   */
  isSaveDisabled(student: StudentWithGrade): boolean {
    return !student.grade || student.grade.trim() === '' || this.savingStudentId === student.id;
  }

  /**
   * Get current section name for display
   */
  getCurrentSectionName(): string {
    const section = this.sections.find(s => s.id === this.selectedSectionId);
    return section ? `${section.section_name} - ${section.subject?.subject_name}` : '';
  }
}