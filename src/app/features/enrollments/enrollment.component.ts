import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { Enrollment } from '../../core/models/enrollment.model';

@Component({
  selector: 'app-enrollment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './enrollment.component.html',
  styleUrls: ['./enrollment.component.css']
})
export class EnrollmentComponent implements OnInit {
  enrollments: Enrollment[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private enrollmentService: EnrollmentService) {}

  ngOnInit(): void {
    this.fetchEnrollments();
  }

  fetchEnrollments(): void {
    this.isLoading = true;
    this.enrollmentService.getAll().subscribe({
      next: (data) => {
        this.enrollments = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load enrollments.';
        this.isLoading = false;
      }
    });
  }

  onApprove(id: number): void {
    this.enrollmentService.approve(id).subscribe({
      next: (res) => {
        this.updateLocalStatus(id, 'approved');
        alert(res.message);
      },
      error: (err) => {
        // This handles your Laravel 403 error for unpaid fines
        const msg = err.error?.message || 'Approval failed.';
        alert(msg);
      }
    });
  }

  onReject(id: number): void {
    if (confirm('Reject this enrollment?')) {
      this.enrollmentService.reject(id).subscribe({
        next: (res) => {
          this.updateLocalStatus(id, 'rejected');
          alert(res.message);
        },
        error: () => alert('Rejection failed.')
      });
    }
  }

  private updateLocalStatus(id: number, status: 'approved' | 'rejected'): void {
    const index = this.enrollments.findIndex(e => e.id === id);
    if (index !== -1) {
      this.enrollments[index].status = status;
    }
  }
}