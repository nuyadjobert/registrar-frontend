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
  styleUrls: ['./programs.component.css'],
})
export class ProgramsComponent implements OnInit {
  Math = Math; // Expose Math object to template
  
  programs: Program[] = [];
  isLoading = false;
  isSaving = false;

  // Delete progress state
  showDeleteProgress = false;
  deleteProgressTime = 5;
  pendingDeleteId: number | null = null;
  private deleteTimer: ReturnType<typeof setInterval> | null = null;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;

  formErrors: { code: string; name: string; department: string } = {
    code: '',
    name: '',
    department: ''
  };

  validateForm(): boolean {
    this.formErrors = { code: '', name: '', department: '' };
    let valid = true;

    if (!this.form.code.trim()) {
      this.formErrors.code = 'Program code is required.';
      valid = false;
    } else if (this.form.code.trim().length > 10) {
      this.formErrors.code = 'Code must be 10 characters or less.';
      valid = false;
    }

    if (!this.form.name.trim()) {
      this.formErrors.name = 'Program name is required.';
      valid = false;
    }

    if (!this.form.department?.trim()) {
      this.formErrors.department = 'Department is required.';
      valid = false;
    }

    return valid;
  }

  get isFormInvalid(): boolean {
    return (
      !this.form.code.trim() ||
      !this.form.name.trim() ||
      !this.form.department?.trim()
    );
  }

  showForm = false;
  isEditing = false;
  selectedProgramId?: number;

  form: ProgramPayload = {
    code: '',
    name: '',
    department: '',
    status: 'active',
  };

  constructor(private programService: ProgramService) {}

  ngOnInit(): void {
    this.loadPrograms();
  }

  // ── Computed stats ──
  get activeCount()     { return this.programs.filter(p => p.status === 'active').length; }
  get inactiveCount()   { return this.programs.filter(p => p.status === 'inactive').length; }
  get departmentCount() { return new Set(this.programs.map(p => p.department).filter(Boolean)).size; }

  loadPrograms(): void {
    this.isLoading = true;
    this.programService.getAll().subscribe({
      next: (data: Program[]) => {
        this.programs = data;
        this.isLoading = false;
        // Reset to first page when data reloads
        this.currentPage = 1;
      },
      error: (err: unknown) => {
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
    const payload: ProgramPayload = {
      code: this.form.code.trim(),
      name: this.form.name.trim(),
      department: this.form.department?.trim() ?? '',
      status: this.form.status ?? 'active',
    };

    this.isSaving = true;

    if (this.isEditing && this.selectedProgramId) {
      // PUT /api/programs/:id
      this.programService.update(this.selectedProgramId, payload).subscribe({
        next: () => this.handleSuccess(),
        error: (err: unknown) => {
          console.error('Update failed', err);
          this.isSaving = false;
        },
      });
    } else {
      // POST /api/programs
      this.programService.create(payload).subscribe({
        next: () => this.handleSuccess(),
        error: (err: unknown) => {
          console.error('Create failed', err);
          this.isSaving = false;
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
  }

  /**
   * Get paginated programs for the current page
   */
  getPaginatedPrograms(): Program[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.programs.slice(startIndex, endIndex);
  }

  /**
   * Get the end index for displaying pagination info
   */
  getPaginationEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.programs.length);
  }

  /**
   * Get the start index for displaying pagination info
   */
  getPaginationStartIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  /**
   * Get all available page numbers
   */
  getTotalPages(): number[] {
    const total = Math.ceil(this.programs.length / this.itemsPerPage);
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  /**
   * Navigate to next page
   */
  nextPage(): void {
    const total = this.getTotalPages().length;
    if (this.currentPage < total) {
      this.currentPage++;
    }
  }

  /**
   * Navigate to previous page
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  /**
   * Go to a specific page
   */
  goToPage(page: number): void {
    const total = this.getTotalPages().length;
    if (page >= 1 && page <= total) {
      this.currentPage = page;
    }
  }

  /**
   * Initiate delete with confirmation dialog
   */
  deleteProgram(id: number): void {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this program?'
    );

    if (confirmDelete) {
      this.startDeleteProgress(id);
    }
  }

  /**
   * Start the delete progress timer
   */
  private startDeleteProgress(id: number): void {
    this.pendingDeleteId = id;
    this.showDeleteProgress = true;
    this.deleteProgressTime = 5;

    // Clear any existing timer
    if (this.deleteTimer) {
      clearInterval(this.deleteTimer);
    }

    // Start countdown
    this.deleteTimer = setInterval(() => {
      this.deleteProgressTime--;

      // When timer reaches 0, execute delete
      if (this.deleteProgressTime <= 0) {
        this.executeDelete();
      }
    }, 1000);
  }

  /**
   * Execute the actual delete operation
   */
  private executeDelete(): void {
    const id = this.pendingDeleteId;

    if (!id) return;

    // Clear timer
    if (this.deleteTimer) {
      clearInterval(this.deleteTimer);
      this.deleteTimer = null;
    }

    this.programService.delete(id).subscribe({
      next: () => {
        // Only remove from UI after successful deletion
        this.programs = this.programs.filter((p) => p.id !== id);
        this.resetDeleteProgress();
        
        // Adjust current page if needed (if we deleted the last item on the page)
        const total = this.getTotalPages().length;
        if (this.currentPage > total && total > 0) {
          this.currentPage = total;
        }
      },
      error: (err: unknown): void => {
        console.error('Failed to delete program', err);
        alert('Could not delete program.');
        this.resetDeleteProgress();
      },
    });
  }

  /**
   * Undo the delete operation - prevents the API call from happening
   */
  undoDelete(): void {
    // Clear timer
    if (this.deleteTimer) {
      clearInterval(this.deleteTimer);
      this.deleteTimer = null;
    }

    // Show undo success message (toast/snackbar)
    const undoMessage = document.createElement('div');
    undoMessage.className = 'undo-toast';
    undoMessage.innerHTML = `
      <span class="undo-icon">✓</span>
      <span class="undo-text">Deletion cancelled</span>
    `;
    document.body.appendChild(undoMessage);

    // Trigger animation
    setTimeout(() => {
      undoMessage.classList.add('show');
    }, 10);

    // Remove the message after 3 seconds
    setTimeout(() => {
      undoMessage.classList.remove('show');
      setTimeout(() => {
        undoMessage.remove();
      }, 300);
    }, 3000);

    this.resetDeleteProgress();
  }

  /**
   * Reset delete progress state
   */
  private resetDeleteProgress(): void {
    this.showDeleteProgress = false;
    this.deleteProgressTime = 5;
    this.pendingDeleteId = null;
  }

  handleSuccess(): void {
    this.isSaving = false;
    this.resetForm();
    this.loadPrograms(); // GET /api/programs
    
    // Auto-navigate to next page when item count reaches itemsPerPage
    setTimeout(() => {
      if (this.programs.length >= this.itemsPerPage && this.programs.length % this.itemsPerPage === 1) {
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