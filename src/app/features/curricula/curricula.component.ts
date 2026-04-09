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
  styleUrls: ['./curricula.component.css'],
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

  programs: Program[] = [];
  subjects: Subject[] = [];
  
  // Added: Predefined School Years for the dropdown
  schoolYears: string[] = [
    '2023-2024',
    '2024-2025',
    '2025-2026',
    '2026-2027'
  ];

  // Added: Year levels 1-4 (Year 5 removed)
  yearLevels = [1, 2, 3, 4];

  form: CurriculumPayload = {
    program_id: 0,
    subject_id: 0,
    year_level: 1,
    semester: '1', // Updated to full string to match Laravel validation
    school_year: '2024-2025', // Set a default from the array
    status: 'active',
  };

  private _curricula = signal<Curriculum[]>([]);

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
      next: (data: Curriculum[]) => {
        this._curricula.set(data);
        this.loading.set(false);
      },
      error: (err: unknown): void => {
        console.error('Failed to load curricula', err);
        this.loading.set(false);
      },
    });
  }

  fetchPrograms(): void {
    this.programService.getActive().subscribe({
      next: (data: Program[]) => (this.programs = data),
      error: (err: unknown) => console.error('Failed to load programs', err),
    });
  }

  fetchSubjects(): void {
    this.subjectService.getActive().subscribe({
      next: (data: Subject[]) => (this.subjects = data),
      error: (err: unknown) => console.error('Failed to load subjects', err),
    });
  }

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
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.currentEditId = undefined;
  }

  /**
   * Validate school year format (YYYY-YYYY)
   */
  isValidSchoolYear(): boolean {
    const pattern = /^\d{4}-\d{4}$/;
    return pattern.test(this.form.school_year.trim());
  }

  /**
   * Check if the curriculum entry already exists (duplicate)
   */
  isDuplicateCurriculum(): boolean {
    return this._curricula().some(
      (curr) =>
        curr.program_id === Number(this.form.program_id) &&
        curr.subject_id === Number(this.form.subject_id) &&
        curr.year_level === Number(this.form.year_level) &&
        curr.semester === this.form.semester &&
        curr.school_year === this.form.school_year &&
        // When editing, exclude the current record from duplicate check
        curr.id !== this.currentEditId
    );
  }

  /**
   * Validate entire form
   */
  isFormValid(): boolean {
    return (
      Number(this.form.program_id) > 0 &&
      Number(this.form.subject_id) > 0 &&
      Number(this.form.year_level) > 0 &&
      this.form.semester.trim() !== '' &&
      this.isValidSchoolYear() &&
      !this.isDuplicateCurriculum()
    );
  }

  save(): void {
    // Validate before saving
    if (!this.isFormValid()) {
      if (this.isDuplicateCurriculum()) {
        alert('This curriculum entry already exists!');
      } else if (!this.isValidSchoolYear()) {
        alert('Invalid school year format. Use YYYY-YYYY (e.g., 2024-2025)');
      } else {
        alert('Please fill in all required fields correctly');
      }
      return;
    }

    const payload: CurriculumPayload = {
      program_id: Number(this.form.program_id),
      subject_id: Number(this.form.subject_id),
      year_level: Number(this.form.year_level),
      semester: this.form.semester,
      school_year: this.form.school_year,
      status: this.form.status ?? 'active',
    };

    this.saving.set(true);

    if (this.isEditing && this.currentEditId) {
      // Update existing curriculum
      this.curriculumService.update(this.currentEditId, payload).subscribe({
        next: (updated: Curriculum) => {
          this.fetchAll();
          this.saving.set(false);
          this.closeModal();
        },
        error: (err: unknown): void => {
          console.error('Failed to update curriculum', err);
          this.saving.set(false);
          alert('Failed to update curriculum. Please try again.');
        },
      });
    } else {
      // Create new curriculum
      this.curriculumService.create(payload).subscribe({
        next: (created: Curriculum) => {
          this.fetchAll();
          this.saving.set(false);
          this.closeModal();
        },
        error: (err: unknown): void => {
          console.error('Failed to create curriculum', err);
          this.saving.set(false);
          alert('Failed to create curriculum. Please try again.');
        },
      });
    }
  }

  curricula = computed(() => this._curricula());

  filteredCurricula = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    const all = this._curricula();

    const filtered = !q
      ? all
      : all.filter(
          (item) =>
            item.program?.name.toLowerCase().includes(q) ||
            item.subject?.subject_name.toLowerCase().includes(q) ||
            item.subject?.subject_code.toLowerCase().includes(q) ||
            item.school_year.toLowerCase().includes(q)
        );

    const start = (this.currentPage - 1) * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  });

  activeCount = computed(() =>
    this._curricula().filter((c) => c.status === 'active').length
  );

  inactiveCount = computed(() =>
    this._curricula().filter((c) => c.status === 'inactive').length
  );

  programCount = computed(
    () => new Set(this._curricula().map((c) => c.program?.name)).size
  );

  totalPages = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    const total = !q
      ? this._curricula().length
      : this._curricula().filter(
          (item) =>
            item.program?.name.toLowerCase().includes(q) ||
            item.subject?.subject_name.toLowerCase().includes(q) ||
            item.subject?.subject_code.toLowerCase().includes(q) ||
            item.school_year.toLowerCase().includes(q)
        ).length;

    const count = Math.ceil(total / this.pageSize);
    return Array.from({ length: count }, (_, i) => i + 1);
  });

  onSearch(): void {
    this.currentPage = 1;
  }

  nextPage(): void {
    const last = this.totalPages().at(-1) ?? 1;
    if (this.currentPage < last) this.currentPage++;
  }

  delete(id: number): void {
    // Add the confirmation dialog
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this curriculum entry? This action cannot be undone.'
    );

    if (confirmDelete) {
      this.curriculumService.delete(id).subscribe({
        next: () => {
          // Silently update the list without a full page refresh
          this._curricula.update((list) => list.filter((item) => item.id !== id));
        },
        error: (err: unknown): void => {
          console.error('Failed to delete curriculum', err);
          alert(
            'Could not delete. The record might be linked to an active section.'
          );
        },
      });
    }
  }
}