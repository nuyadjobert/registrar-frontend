import { Component, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurriculumService } from '../../core/services/curriculum.service';
import { ProgramService } from '../../core/services/program.service';
import { SubjectService } from '../../core/services/subject.service';
import { Curriculum, CurriculumPayload } from '../../core/models/curriculum.model';
import { Program } from '../../core/models/program.model';
import { Subject } from '../../core/models/subject.model';

@Component({
  selector: 'app-curricula',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './curricula.component.html',
})
export class CurriculaComponent implements OnInit {
  loading = signal(false);
  saving = signal(false);
  searchQuery = '';
  currentPage = 1;
  pageSize = 10;
  showModal = false;
  isEditing = false;
  currentEditId?: number;

  // Delete progress
  showDeleteProgress = signal(false);
  deleteProgressTime = signal(5);
  pendingDeleteId = signal<number | null>(null);
  private deleteTimer: ReturnType<typeof setInterval> | null = null;

  programs: Program[] = [];
  subjects: Subject[] = [];

  schoolYears: string[] = ['2023-2024', '2024-2025', '2025-2026', '2026-2027'];
  yearLevels = [1, 2, 3, 4];

  form: CurriculumPayload = {
    program_id: 0,
    subject_id: 0,
    year_level: 1,
    semester: '1',
    school_year: '2024-2025',
    status: 'active',
  };

  formErrors = {
    program_id: '',
    subject_id: '',
    year_level: '',
    semester: '',
    school_year: ''
  };

   curricula = signal<Curriculum[]>([]);

  constructor(
    private curriculumService: CurriculumService,
    private programService: ProgramService,
    private subjectService: SubjectService
  ) {}

  ngOnInit(): void {
    this.fetchAll();
    this.fetchPrograms();
    this.fetchSubjects();
  }

  fetchAll(): void {
    this.loading.set(true);
    this.curriculumService.getAll().subscribe({
      next: (data) => {
        this.curricula.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  fetchPrograms(): void {
    this.programService.getActive().subscribe({
      next: (data) => this.programs = data,
      error: (err) => console.error(err)
    });
  }

  fetchSubjects(): void {
    this.subjectService.getActive().subscribe({
      next: (data) => this.subjects = data,
      error: (err) => console.error(err)
    });
  }

  // ── Validation ──
  private isValidSchoolYear(): boolean {
    return /^\d{4}-\d{4}$/.test(this.form.school_year.trim());
  }

  private isDuplicateCurriculum(): boolean {
    return this.curricula().some(curr =>
      curr.program_id === Number(this.form.program_id) &&
      curr.subject_id === Number(this.form.subject_id) &&
      curr.year_level === Number(this.form.year_level) &&
      curr.semester === this.form.semester &&
      curr.school_year === this.form.school_year &&
      curr.id !== this.currentEditId
    );
  }

  validateForm(): boolean {
    this.formErrors = { program_id: '', subject_id: '', year_level: '', semester: '', school_year: '' };
    let valid = true;

    if (Number(this.form.program_id) <= 0) {
      this.formErrors.program_id = 'Please select a program';
      valid = false;
    }
    if (Number(this.form.subject_id) <= 0) {
      this.formErrors.subject_id = 'Please select a subject';
      valid = false;
    }
    if (Number(this.form.year_level) <= 0) {
      this.formErrors.year_level = 'Please select year level';
      valid = false;
    }
    if (!this.form.semester?.trim()) {
      this.formErrors.semester = 'Please select semester';
      valid = false;
    }
    if (!this.isValidSchoolYear()) {
      this.formErrors.school_year = 'Invalid format. Use YYYY-YYYY (e.g. 2024-2025)';
      valid = false;
    }
    if (this.isDuplicateCurriculum()) {
      this.formErrors.program_id = 'This curriculum entry already exists';
      valid = false;
    }

    return valid;
  }

  get isFormValid(): boolean {
    return (
      Number(this.form.program_id) > 0 &&
      Number(this.form.subject_id) > 0 &&
      Number(this.form.year_level) > 0 &&
      this.form.semester?.trim() !== '' &&
      this.isValidSchoolYear() &&
      !this.isDuplicateCurriculum()
    );
  }

  // ── Form Actions ──
  openModal(): void {
    this.isEditing = false;
    this.currentEditId = undefined;
    this.form = {
      program_id: 0,
      subject_id: 0,
      year_level: 1,
      semester: '1',
      school_year: '2024-2025',
      status: 'active',
    };
    this.formErrors = { program_id: '', subject_id: '', year_level: '', semester: '', school_year: '' };
    this.showModal = true;
  }

  editCurriculum(curriculum: Curriculum): void {
    this.isEditing = true;
    this.currentEditId = curriculum.id;
    this.form = {
      program_id: curriculum.program_id,
      subject_id: curriculum.subject_id,
      year_level: curriculum.year_level,
      semester: curriculum.semester,
      school_year: curriculum.school_year,
      status: curriculum.status,
    };
    this.formErrors = { program_id: '', subject_id: '', year_level: '', semester: '', school_year: '' };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.currentEditId = undefined;
  }

  save(): void {
    if (!this.validateForm()) return;

    this.saving.set(true);
    const payload: CurriculumPayload = {
      program_id: Number(this.form.program_id),
      subject_id: Number(this.form.subject_id),
      year_level: Number(this.form.year_level),
      semester: this.form.semester,
      school_year: this.form.school_year.trim(),
      status: this.form.status ?? 'active',
    };

    if (this.isEditing && this.currentEditId) {
      this.curriculumService.update(this.currentEditId, payload).subscribe({
        next: () => {
          this.fetchAll();
          this.saving.set(false);
          this.closeModal();
        },
        error: (err) => {
          console.error(err);
          alert('Failed to update curriculum');
          this.saving.set(false);
        }
      });
    } else {
      this.curriculumService.create(payload).subscribe({
        next: () => {
          this.fetchAll();
          this.saving.set(false);
          this.closeModal();
        },
        error: (err) => {
          console.error(err);
          alert('Failed to create curriculum');
          this.saving.set(false);
        }
      });
    }
  }

  // ── Computed Values ──
  filteredCurricula = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    let filtered = this.curricula();

    if (q) {
      filtered = filtered.filter(item =>
        item.program?.name.toLowerCase().includes(q) ||
        item.subject?.subject_name.toLowerCase().includes(q) ||
        item.subject?.subject_code.toLowerCase().includes(q) ||
        item.school_year.toLowerCase().includes(q)
      );
    }

    const start = (this.currentPage - 1) * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  });

  totalPages = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    let total = this.curricula().length;

    if (q) {
      total = this.curricula().filter(item =>
        item.program?.name.toLowerCase().includes(q) ||
        item.subject?.subject_name.toLowerCase().includes(q) ||
        item.subject?.subject_code.toLowerCase().includes(q) ||
        item.school_year.toLowerCase().includes(q)
      ).length;
    }

    const count = Math.ceil(total / this.pageSize);
    return Array.from({ length: count }, (_, i) => i + 1);
  });

  onSearch(): void {
    this.currentPage = 1;
  }

  previousPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages().length) this.currentPage++;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages().length) {
      this.currentPage = page;
    }
  }

  // ── Pagination Info ──
  get paginationInfo(): string {
    const filtered = this.filteredCurricula(); // This triggers the computed
    if (this.curricula().length === 0) return 'No records';
    
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, 
      this.searchQuery ? this.filteredCurricula().length + (this.currentPage - 1) * this.pageSize : this.curricula().length);
    
    return `Showing ${start}–${end} of ${this.searchQuery ? this.filteredCurricula().length + (this.currentPage - 1) * this.pageSize : this.curricula().length} records`;
  }

  // Delete methods (kept similar)
  delete(id: number): void {
    if (!window.confirm('Are you sure you want to delete this curriculum entry?')) return;
    this.startDeleteProgress(id);
  }

  private startDeleteProgress(id: number): void {
    this.pendingDeleteId.set(id);
    this.showDeleteProgress.set(true);
    this.deleteProgressTime.set(5);

    if (this.deleteTimer) clearInterval(this.deleteTimer);

    this.deleteTimer = setInterval(() => {
      this.deleteProgressTime.update(t => t - 1);
      if (this.deleteProgressTime() <= 0) this.executeDelete();
    }, 1000);
  }

  private executeDelete(): void {
    const id = this.pendingDeleteId();
    if (!id) return;

    if (this.deleteTimer) {
      clearInterval(this.deleteTimer);
      this.deleteTimer = null;
    }

    this.curriculumService.delete(id).subscribe({
      next: () => {
        this.curricula.update(list => list.filter(item => item.id !== id));
        this.resetDeleteProgress();
      },
      error: () => {
        alert('Could not delete. The record might be linked to an active section.');
        this.resetDeleteProgress();
      }
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
    toast.className = 'fixed bottom-20 right-8 bg-gray-800 text-white px-6 py-3 rounded-2xl shadow-2xl z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  private resetDeleteProgress(): void {
    this.showDeleteProgress.set(false);
    this.deleteProgressTime.set(5);
    this.pendingDeleteId.set(null);
  }
}