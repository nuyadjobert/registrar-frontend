import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InstructorService } from '../../core/services/instructor.service';
import { Instructor, InstructorPayload } from '../../core/models/instructor.model';

@Component({
  selector: 'app-instructors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './instructors.component.html',
  styleUrls: ['./instructors.component.css']
})
export class InstructorsComponent implements OnInit {
  instructors: Instructor[] = [];
  isLoading = false;
  
  // Form handling
  showForm = false;
  isEditing = false;
  currentId?: number;
  
  form: InstructorPayload = {
    name: '',
    email: '',
    department: '',
    status: 'active'
  };

  constructor(private instructorService: InstructorService) {}

  ngOnInit(): void {
    this.loadInstructors();
  }

  loadInstructors(): void {
    this.isLoading = true;
    this.instructorService.getAll().subscribe({
      next: (data) => {
        this.instructors = data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  submitForm(): void {
    if (this.isEditing && this.currentId) {
      this.instructorService.create(this.form).subscribe({
  next: () => {
    this.resetForm();
    this.loadInstructors();
  },
  error: (err) => {
    console.error('Create failed:', err);
    alert('Failed to save instructor');
  }
});
    } else {
      this.instructorService.create(this.form).subscribe(() => {
        this.resetForm();
        this.loadInstructors();
      });
    }
  }

  editInstructor(instructor: Instructor): void {
    this.isEditing = true;
    this.currentId = instructor.id;
    this.showForm = true;
    this.form = {
      name: instructor.name,
      email: instructor.email,
      department: instructor.department,
      status: instructor.status
    };
  }

  deleteInstructor(id: number): void {
    if (confirm('Are you sure you want to delete this instructor?')) {
      this.instructorService.delete(id).subscribe(() => this.loadInstructors());
    }
  }

  resetForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.currentId = undefined;
    this.form = { name: '', email: '', department: '', status: 'active' };
  }
}