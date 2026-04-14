import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgramService } from '../../core/services/program.service';
import { Program, ProgramPayload } from '../../core/models/program.model';
import { PaginationComponent } from '../../shared/components/paginations/pagination.component';

@Component({
  selector: 'app-programs',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './programs.component.html',
})
export class ProgramsComponent implements OnInit {
  Math = Math;

  programs: Program[] = [];
  isLoading = false;
  isSaving = false;

  // Delete progress
  showDeleteProgress = false;
  deleteProgressTime = 5;
  pendingDeleteId: number | null = null;
  private deleteTimer: ReturnType<typeof setInterval> | null = null;

  // Pagination
  currentPage: number = 1;
  readonly itemsPerPage: number = 10;

  // Form
  showForm = false;
  isEditing = false;
  selectedProgramId?: number;

  form: ProgramPayload = {
    code: '',
    name: '',
    department: '',
    status: 'active',
  };

  formErrors: { 
    code: string; 
    name: string; 
    department: string;
    general?: string;   // Added for composite errors
  } = {
    code: '',
    name: '',
    department: ''
  };

  constructor(private programService: ProgramService) {}

  ngOnInit(): void {
    this.loadPrograms();
  }

  // ── Basic Client-side Validation (duplicates now handled by backend) ──
  get isFormValid(): boolean {
    return !!(
      this.form.code?.trim() &&
      this.form.name?.trim() &&
      this.form.department?.trim() &&
      this.form.code.trim().length <= 10
    );
  }

  validateForm(): boolean {
    this.formErrors = { code: '', name: '', department: '', general: '' };
    let isValid = true;

    const trimmedCode = this.form.code.trim();
    const trimmedName = this.form.name.trim();
    const trimmedDept = (this.form.department ?? '').trim();

    if (!trimmedCode) {
      this.formErrors.code = 'Program code is required.';
      isValid = false;
    } else if (trimmedCode.length > 10) {
      this.formErrors.code = 'Code must be 10 characters or less.';
      isValid = false;
    }

    if (!trimmedName) {
      this.formErrors.name = 'Program name is required.';
      isValid = false;
    }

    if (!trimmedDept) {
      this.formErrors.department = 'Department is required.';
      isValid = false;
    }

    return isValid;
  }

  loadPrograms(): void {
    this.isLoading = true;
    this.programService.getAll().subscribe({
      next: (data: Program[]) => {
        this.programs = data;
        this.isLoading = false;
        this.currentPage = 1;
      },
      error: (err) => {
        console.error('Failed to load programs', err);
        this.isLoading = false;
      },
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) this.resetForm();
  }

  onSubmit(): void {
    if (!this.validateForm()) return;

    this.isSaving = true;
    this.formErrors = { code: '', name: '', department: '', general: '' }; // Clear all errors

    const payload: ProgramPayload = {
      code: this.form.code.trim(),
      name: this.form.name.trim(),
      department: (this.form.department ?? '').trim(),
      status: this.form.status ?? 'active',
    };

    const request$ = this.isEditing && this.selectedProgramId
      ? this.programService.update(this.selectedProgramId, payload)
      : this.programService.create(payload);

    request$.subscribe({
      next: () => this.handleSuccess(),
      error: (err) => {
        this.isSaving = false;
        console.error('Save failed', err);

        const errorResponse = err.error;

        if (errorResponse?.errors) {
          // Standard Laravel validation errors
          const errors = errorResponse.errors;

          if (errors.code) this.formErrors.code = Array.isArray(errors.code) ? errors.code[0] : errors.code;
          if (errors.name) this.formErrors.name = Array.isArray(errors.name) ? errors.name[0] : errors.name;
          if (errors.department) this.formErrors.department = Array.isArray(errors.department) ? errors.department[0] : errors.department;

        } else if (errorResponse?.message) {
          // Handle custom composite unique error from backend (name + department)
          if (errorResponse.message.includes('name and department')) {
            this.formErrors.department = errorResponse.message;
          } else {
            this.formErrors.general = errorResponse.message;
          }
        } else {
          alert(this.isEditing ? 'Failed to update program.' : 'Failed to create program.');
        }
      },
    });
  }

  editProgram(program: Program): void {
    this.isEditing = true;
    this.selectedProgramId = program.id;
    this.form = {
      code: program.code,
      name: program.name,
      department: program.department ?? '',
      status: program.status,
    };
    this.showForm = true;
    this.formErrors = { code: '', name: '', department: '', general: '' };
  }

  // ── Pagination Methods (unchanged) ──
  previousPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    const total = this.totalPages.length;
    if (this.currentPage < total) this.currentPage++;
  }

  onPageChange(newPage: number): void {
    this.currentPage = newPage;
  }

  get totalPages(): number[] {
    const total = Math.ceil(this.programs.length / this.itemsPerPage);
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  get paginationInfo(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.programs.length);
    return `Showing ${start}–${end} of ${this.programs.length} record${this.programs.length !== 1 ? 's' : ''}`;
  }

  // ── Delete Methods (unchanged) ──
  deleteProgram(id: number): void {
    if (!window.confirm('Are you sure you want to delete this program?')) return;
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

    this.programService.delete(id).subscribe({
      next: () => {
        this.programs = this.programs.filter(p => p.id !== id);
        this.resetDeleteProgress();

        const total = this.totalPages.length;
        if (this.currentPage > total && total > 0) {
          this.currentPage = total;
        }
      },
      error: (err) => {
        console.error('Delete failed', err);
        alert('Could not delete program.');
        this.resetDeleteProgress();
      },
    });
  }

  undoDelete(): void {
    if (this.deleteTimer) {
      clearInterval(this.deleteTimer);
      this.deleteTimer = null;
    }
    this.showUndoToast('Deletion cancelled');
    this.resetDeleteProgress();
  }

  private showUndoToast(message: string): void {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-20 right-8 bg-gray-800 text-white text-sm px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50';
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  private resetDeleteProgress(): void {
    this.showDeleteProgress = false;
    this.deleteProgressTime = 5;
    this.pendingDeleteId = null;
  }

  handleSuccess(): void {
    this.isSaving = false;
    this.resetForm();
    this.loadPrograms();
  }

  resetForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.selectedProgramId = undefined;
    this.form = { code: '', name: '', department: '', status: 'active' };
    this.formErrors = { code: '', name: '', department: '', general: '' };
  }
}