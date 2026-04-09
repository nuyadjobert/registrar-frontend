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

  deleteSubject(id: number): void {
    // Simple, themed confirmation
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this subject? This might affect existing curricula records."
    );

    if (isConfirmed) {
      this.isLoading = true; // Show your spinner
      this.subjectService.delete(id).subscribe({
        next: () => {
          // Update local list without re-fetching everything
          this.subjects = this.subjects.filter(s => s.id !== id);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Delete failed', err);
          this.isLoading = false;
          alert("This subject cannot be deleted because it is currently linked to a Curriculum.");
        }
      });
    }
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