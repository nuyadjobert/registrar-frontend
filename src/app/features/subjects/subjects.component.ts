import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubjectService } from '../../core/services/subject.service';
import { ProgramService } from '../../core/services/program.service';
import { Subject, SubjectPayload, Program } from '../../core/models/subject.model';

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subjects.component.html',
})
export class SubjectsComponent implements OnInit {
  subjects: Subject[] = [];
  programs: Program[] = [];

  isLoading = false;
  isSaving = false;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;

  // Delete progress
  showDeleteProgress = false;
  deleteProgressTime = 5;
  pendingDeleteId: number | null = null;
  private deleteTimer: ReturnType<typeof setInterval> | null = null;

  // Form State
  showForm = false;
  isEditing = false;
  currentId?: number;

  form: SubjectPayload = {
    subject_code: '',
    subject_name: '',
    units: 3,
    type: 'lecture',
    status: 'active',
    program_id: undefined,
    year_level: 1,
    semester: 'first',
    school_year: new Date().getFullYear().toString()
  };

  formErrors: {
    subject_code: string;
    subject_name: string;
    program_id: string;
  } = {
    subject_code: '',
    subject_name: '',
    program_id: ''
  };

  constructor(
    private subjectService: SubjectService,
    private programService: ProgramService
  ) {}

  ngOnInit(): void {
    this.loadPrograms();
    this.loadData();
  }

  loadPrograms(): void {
    this.programService.getAll().subscribe({
      next: (data) => this.programs = data,
      error: (err) => console.error('Failed to load programs', err)
    });
  }

  loadData(): void {
    this.isLoading = true;
    this.subjectService.getAll().subscribe({
      next: (data) => {
        this.subjects = data.map(subject => ({
          ...subject,
          program: subject.programs && subject.programs.length > 0 ? subject.programs[0] : undefined
        }));
        this.currentPage = 1;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  // ── Pagination ──
  get paginatedSubjects(): Subject[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.subjects.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.subjects.length / this.itemsPerPage);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  // ── Validation ──
  private hasDuplicate(): boolean {
    const code = this.form.subject_code.trim().toLowerCase();
    const name = this.form.subject_name.trim().toLowerCase();

    return this.subjects.some(s => {
      if (this.isEditing && s.id === this.currentId) return false;
      return (
        s.subject_code.toLowerCase() === code ||
        s.subject_name.toLowerCase() === name
      );
    });
  }

  validateForm(): boolean {
    this.formErrors = { subject_code: '', subject_name: '', program_id: '' };
    let valid = true;

    if (!this.form.subject_code.trim()) {
      this.formErrors.subject_code = 'Subject code is required.';
      valid = false;
    }

    if (!this.form.subject_name.trim()) {
      this.formErrors.subject_name = 'Subject name is required.';
      valid = false;
    }

    if (!this.form.program_id) {
      this.formErrors.program_id = 'Please select a program.';
      valid = false;
    }

    if (this.hasDuplicate()) {
      this.formErrors.subject_code = 'A subject with this code or name already exists.';
      valid = false;
    }

    return valid;
  }

  get isFormValid(): boolean {
    return (
      this.form.subject_code.trim() !== '' &&
      this.form.subject_name.trim() !== '' &&
      this.form.program_id !== undefined &&
      this.form.units > 0 &&
      !this.hasDuplicate()
    );
  }

  // ── Form Actions ──
  submitForm(): void {
    if (!this.validateForm()) return;

    this.isSaving = true;

    if (this.isEditing && this.currentId) {
      this.subjectService.update(this.currentId, this.form).subscribe({
        next: () => this.handleSuccess(),
        error: (err) => {
          console.error(err);
          alert(err.error?.message || 'Update failed');
          this.isSaving = false;
        }
      });
    } else {
      this.subjectService.create(this.form).subscribe({
        next: () => this.handleSuccess(),
        error: (err) => {
          console.error(err);
          alert(err.error?.message || 'Creation failed');
          this.isSaving = false;
        }
      });
    }
  }

  editSubject(sub: Subject): void {
    this.isEditing = true;
    this.currentId = sub.id;
    this.form = {
      subject_code: sub.subject_code,
      subject_name: sub.subject_name,
      units: sub.units,
      type: sub.type,
      status: sub.status,
      program_id: sub.program_id,
      year_level: sub.year_level,
      semester: sub.semester,
      school_year: sub.school_year
    };
    this.showForm = true;
    this.formErrors = { subject_code: '', subject_name: '', program_id: '' };
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) this.resetForm();
  }

  resetForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.currentId = undefined;
    this.form = {
      subject_code: '',
      subject_name: '',
      units: 3,
      type: 'lecture',
      status: 'active',
      program_id: undefined,
      year_level: 1,
      semester: 'first',
      school_year: new Date().getFullYear().toString()
    };
    this.formErrors = { subject_code: '', subject_name: '', program_id: '' };
  }

  handleSuccess(): void {
    this.isSaving = false;
    this.resetForm();
    this.loadData();
  }

  // Delete methods (kept similar to your original)
  deleteSubject(id: number): void {
    if (!window.confirm("Are you sure you want to delete this subject? This might affect existing curricula records.")) return;
    this.startDeleteProgress(id);
  }

  private startDeleteProgress(id: number): void {
    this.pendingDeleteId = id;
    this.showDeleteProgress = true;
    this.deleteProgressTime = 5;

    if (this.deleteTimer) clearInterval(this.deleteTimer);

    this.deleteTimer = setInterval(() => {
      this.deleteProgressTime--;
      if (this.deleteProgressTime <= 0) this.executeDelete();
    }, 1000);
  }

  private executeDelete(): void {
    const id = this.pendingDeleteId;
    if (!id) return;

    if (this.deleteTimer) {
      clearInterval(this.deleteTimer);
      this.deleteTimer = null;
    }

    this.subjectService.delete(id).subscribe({
      next: () => {
        this.subjects = this.subjects.filter(s => s.id !== id);
        this.resetDeleteProgress();
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
          this.currentPage = this.totalPages;
        }
      },
      error: (err) => {
        console.error(err);
        alert("This subject cannot be deleted because it is currently linked to a Curriculum.");
        this.resetDeleteProgress();
      }
    });
  }

  undoDelete(): void {
    if (this.deleteTimer) {
      clearInterval(this.deleteTimer);
      this.deleteTimer = null;
    }
    this.showUndoToast("Deletion cancelled");
    this.resetDeleteProgress();
  }

  private showUndoToast(message: string): void {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-20 right-8 bg-gray-800 text-white px-6 py-3 rounded-2xl shadow-2xl z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  private resetDeleteProgress(): void {
    this.showDeleteProgress = false;
    this.deleteProgressTime = 5;
    this.pendingDeleteId = null;
  }

  get paginationInfo(): string {
  const start = (this.currentPage - 1) * this.itemsPerPage + 1;
  const end = Math.min(this.currentPage * this.itemsPerPage, this.subjects.length);
  return `Showing ${start}–${end} of ${this.subjects.length} records`;
}
}