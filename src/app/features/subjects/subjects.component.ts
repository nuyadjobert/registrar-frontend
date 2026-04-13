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
  styleUrls: ['./subjects.component.css']
})
export class SubjectsComponent implements OnInit {
  subjects: Subject[] = [];
  programs: Program[] = [];

  isLoading = false;

  // Pagination state
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Delete progress state
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

  constructor(
    private subjectService: SubjectService,
    private programService: ProgramService
  ) {}

  ngOnInit(): void {
    this.loadPrograms();
    this.loadData();
  }

  /**
   * Load programs for dropdown
   */
  loadPrograms(): void {
    this.programService.getAll().subscribe({
      next: (data) => {
        this.programs = data;
      },
      error: (err) => console.error('Failed to load programs', err)
    });
  }

  /**
   * Load all subjects and apply pagination
   */
  loadData(): void {
    this.isLoading = true;
    this.subjectService.getAll().subscribe({
      next: (data) => {
        // Map 'programs' array from backend to 'program' object
        this.subjects = data.map(subject => ({
          ...subject,
          program: subject.programs && subject.programs.length > 0
            ? subject.programs[0]
            : undefined
        }));
        
        // Set total count and reset to first page
        this.totalItems = this.subjects.length;
        this.currentPage = 1;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  /**
   * Get paginated subjects for current page
   */
  get paginatedSubjects(): Subject[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.subjects.slice(startIndex, endIndex);
  }

  /**
   * Get total number of pages
   */
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  /**
   * Get page numbers to display in pagination
   */
  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
    
    // Adjust startPage if we're near the end
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  /**
   * Change to specific page
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  /**
   * Go to previous page
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  /**
   * Check if subject code or name already exists in the list
   */
  isDuplicate(): boolean {
    const currentCode = this.form.subject_code.trim().toLowerCase();
    const currentName = this.form.subject_name.trim().toLowerCase();

    return this.subjects.some(subject => {
      if (this.isEditing && subject.id === this.currentId) {
        return false;
      }
      
      return (
        subject.subject_code.toLowerCase() === currentCode ||
        subject.subject_name.toLowerCase() === currentName
      );
    });
  }

  /**
   * Validate form - check for empty fields and duplicates
   */
  isFormValid(): boolean {
    return (
      this.form.subject_code.trim() !== '' &&
      this.form.subject_name.trim() !== '' &&
      this.form.units > 0 &&
      this.form.program_id !== undefined &&
      this.form.year_level !== undefined &&
      this.form.semester?.trim() !== '' &&
      !this.isDuplicate()
    );
  }

  submitForm(): void {
    if (!this.isFormValid()) {
      if (this.isDuplicate()) {
        alert('A subject with this code or name already exists!');
      } else {
        alert('Please fill in all required fields correctly');
      }
      return;
    }

    if (this.isEditing && this.currentId) {
      this.subjectService.update(this.currentId, this.form).subscribe({
        next: () => this.handleSuccess(),
        error: (err) => alert(err.error?.message || 'Update failed')
      });
    } else {
      this.subjectService.create(this.form).subscribe({
        next: () => this.handleSuccess(),
        error: (err) => alert(err.error?.message || 'Creation failed')
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
  }

  /**
   * Initiate delete with confirmation dialog
   */
  deleteSubject(id: number): void {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this subject? This might affect existing curricula records."
    );

    if (isConfirmed) {
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

    if (this.deleteTimer) {
      clearInterval(this.deleteTimer);
    }

    this.deleteTimer = setInterval(() => {
      this.deleteProgressTime--;

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

    if (this.deleteTimer) {
      clearInterval(this.deleteTimer);
      this.deleteTimer = null;
    }

    this.subjectService.delete(id).subscribe({
      next: () => {
        this.subjects = this.subjects.filter((s) => s.id !== id);
        this.totalItems--;
        
        // Adjust current page if needed
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
          this.currentPage = this.totalPages;
        }
        
        this.resetDeleteProgress();
      },
      error: (err: unknown): void => {
        console.error('Failed to delete subject', err);
        alert("This subject cannot be deleted because it is currently linked to a Curriculum.");
        this.resetDeleteProgress();
      },
    });
  }

  /**
   * Undo the delete operation - prevents the API call from happening
   */
  undoDelete(): void {
    if (this.deleteTimer) {
      clearInterval(this.deleteTimer);
      this.deleteTimer = null;
    }

    const undoMessage = document.createElement('div');
    undoMessage.className = 'undo-toast';
    undoMessage.innerHTML = `
      <span class="undo-icon">✓</span>
      <span class="undo-text">Deletion cancelled</span>
    `;
    document.body.appendChild(undoMessage);

    setTimeout(() => {
      undoMessage.classList.add('show');
    }, 10);

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
    this.resetForm();
    this.loadData();
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
  }

  /**
   * Get pagination info text (e.g., "Showing 1-10 of 14 records")
   */
  get paginationInfo(): string {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
    const endIndex = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
    return `Showing ${startIndex}-${endIndex} of ${this.totalItems} records`;
  }
}