import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubjectService } from '../../core/services/subject.service';
import { Subject, SubjectPayload } from '../../core/models/subject.model';

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subjects.component.html',
  styleUrls: ['./subjects.component.css']
})
export class SubjectsComponent implements OnInit {
  subjects: Subject[] = [];
  isLoading = false;

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
    status: 'active'
  };

  constructor(private subjectService: SubjectService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.subjectService.getAll().subscribe({
      next: (data) => {
        this.subjects = data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  /**
   * Check if subject code or name already exists in the list
   */
  isDuplicate(): boolean {
    const currentCode = this.form.subject_code.trim().toLowerCase();
    const currentName = this.form.subject_name.trim().toLowerCase();

    return this.subjects.some(subject => {
      // If editing, exclude the current subject from comparison
      if (this.isEditing && subject.id === this.currentId) {
        return false;
      }
      
      // Check for duplicate code or name
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
      !this.isDuplicate()
    );
  }

  submitForm(): void {
    // Validate before submission
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
      status: sub.status
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

    this.subjectService.delete(id).subscribe({
      next: () => {
        // Only remove from UI after successful deletion
        this.subjects = this.subjects.filter((s) => s.id !== id);
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
      status: 'active' 
    };
  }
}