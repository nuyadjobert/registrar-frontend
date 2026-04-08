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
  programs: Program[] = [];
  isLoading = false;
  isSaving = false;

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

  // Existing properties...

  // Add these for pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;

  // Mock or real filter function used in your HTML
  filteredPrograms() {
    return this.programs;
  }

  // Calculates the number of pages needed
  totalPages(): number[] {
    const total = Math.ceil(this.filteredPrograms().length / this.itemsPerPage);
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  // Logic for the 'next' arrow button
  nextPage() {
    const total = this.totalPages().length;
    if (this.currentPage < total) {
      this.currentPage++;
    } else {
      this.currentPage = 1; // Optional: wraps back to page 1
    }
  }

  deleteProgram(id: number): void {
    if (!confirm('Are you sure you want to delete this program?')) return;
    // DELETE /api/programs/:id
    this.programService.delete(id).subscribe({
      next: () => {
        this.programs = this.programs.filter(p => p.id !== id);
      },
      error: (err: unknown) => console.error('Delete failed', err),
    });
  }

  handleSuccess(): void {
    this.isSaving = false;
    this.resetForm();
    this.loadPrograms(); // GET /api/programs
  }

  resetForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.selectedProgramId = undefined;
    this.form = { code: '', name: '', department: '', status: 'active' };
  }
}