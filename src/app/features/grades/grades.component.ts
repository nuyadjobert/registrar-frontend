import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GradeService } from '../../core/services/grade.service';
import { SectionService } from '../../core/services/section.service';
import { Grade, GradePayload } from '../../core/models/grade.model';
import { Section } from '../../core/models/section.model';

@Component({
  selector: 'app-grades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grades.component.html',
  styleUrls: ['./grades.component.css']
})
export class GradesComponent implements OnInit {
  sections: Section[] = [];
  grades: Grade[] = [];
  selectedSectionId?: number;
  isLoading = false;

  constructor(
    private gradeService: GradeService,
    private sectionService: SectionService
  ) {}

  ngOnInit(): void {
    this.loadSections();
  }

  loadSections(): void {
    this.sectionService.getAll().subscribe(data => this.sections = data);
  }

  onSectionChange(): void {
    if (this.selectedSectionId) {
      this.isLoading = true;
      this.gradeService.getAll(this.selectedSectionId).subscribe({
        next: (data) => {
          this.grades = data;
          this.isLoading = false;
        },
        error: () => this.isLoading = false
      });
    }
  }

  saveGrade(studentId: number, gradeValue: string | null, remarksValue: string | null): void {
    if (!this.selectedSectionId) return;

    const payload: GradePayload = {
      student_id: studentId,
      section_id: this.selectedSectionId,
      grade: gradeValue,
      remarks: remarksValue
    };

    this.gradeService.save(payload).subscribe({
      next: (res) => {
        alert('Grade saved successfully');
        this.onSectionChange(); // Refresh list
      },
      error: () => alert('Failed to save grade')
    });
  }
}