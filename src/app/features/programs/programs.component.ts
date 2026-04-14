import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgramService } from '../../core/services/program.service';
import { Program, ProgramPayload } from '../../core/models/program.model';

@Component({
  selector: 'app-programs',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  itemsPerPage: number = 10;

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

  formErrors: { code: string; name: string; department: string } = {
    code: '',
    name: '',
    department: ''
  };

  constructor(private programService: ProgramService) {}

  ngOnInit(): void {
    this.loadPrograms();
  }

  // ── Computed Properties ──
  get activeCount()     { return this.programs.filter(p => p.status === 'active').length; }
  get inactiveCount()   { return this.programs.filter(p => p.status === 'inactive').length; }
  get departmentCount() { return new Set(this.programs.map(p => p.department).filter(Boolean)).size; }

  /** Real-time form validation */
  get isFormValid(): boolean {
    return !!(
      this.form.code?.trim() &&
      this.form.name?.trim() &&
      this.form.department?.trim() &&
      this.form.code.trim().length <= 10 &&
      !this.hasDuplicateCode()
    );
  }

  private hasDuplicateCode(): boolean {
    const currentCode = this.form.code.trim().toUpperCase();
    return this.programs.some(program => {
      if (this.isEditing && program.id === this.selectedProgramId) return false;
      return program.code.toUpperCase() === currentCode;
    });
  }

  validateForm(): boolean {
    this.formErrors = { code: '', name: '', department: '' };
    let isValid = true;

    const trimmedCode = this.form.code.trim();
    const trimmedName = this.form.name.trim();
    const trimmedDept = this.form.department?.trim() ?? '';

    if (!trimmedCode) {
      this.formErrors.code = 'Program code is required.';
      isValid = false;
    } else if (trimmedCode.length > 10) {
      this.formErrors.code = 'Code must be 10 characters or less.';
      isValid = false;
    } else if (this.hasDuplicateCode()) {
      this.formErrors.code = 'A program with this code already exists.';
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

    const payload: ProgramPayload = {
      code: this.form.code.trim(),
      name: this.form.name.trim(),
      department: this.form.department?.trim() ?? '',
      status: this.form.status ?? 'active',
    };

    if (this.isEditing && this.selectedProgramId) {
      this.programService.update(this.selectedProgramId, payload).subscribe({
        next: () => this.handleSuccess(),
        error: (err) => {
          console.error('Update failed', err);
          this.isSaving = false;
          alert('Failed to update program.');
        },
      });
    } else {
      this.programService.create(payload).subscribe({
        next: () => this.handleSuccess(),
        error: (err) => {
          console.error('Create failed', err);
          this.isSaving = false;
          alert('Failed to create program.');
        },
      });
    }
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
    this.formErrors = { code: '', name: '', department: '' };
  }

  // ── Pagination Methods ──
  getPaginatedPrograms(): Program[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.programs.slice(start, start + this.itemsPerPage);
  }

  getPaginationStartIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getPaginationEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.programs.length);
  }

  /** Returns array of page numbers for display */
  getTotalPages(): number[] {
    const total = Math.ceil(this.programs.length / this.itemsPerPage);
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  previousPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    const total = this.getTotalPages().length;
    if (this.currentPage < total) this.currentPage++;
  }

  goToPage(page: number): void {
    const total = this.getTotalPages().length;
    if (page >= 1 && page <= total) this.currentPage = page;
  }

  // Delete methods
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

        const totalPages = this.getTotalPages().length;
        if (this.currentPage > totalPages && totalPages > 0) {
          this.currentPage = totalPages;
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

    setTimeout(() => {
      if (this.programs.length % this.itemsPerPage === 1 && this.programs.length > this.itemsPerPage) {
        this.nextPage();
      }
    }, 300);
  }

  resetForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.selectedProgramId = undefined;
    this.form = { code: '', name: '', department: '', status: 'active' };
    this.formErrors = { code: '', name: '', department: '' };
  }
}