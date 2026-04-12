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
  approvingId: number | null = null; // Track which enrollment is being approved

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

  /**
   * Check if approve button should be disabled
   * - Disable if payment is not paid
   * - Disable if already approved/rejected
   */
  isApproveDisabled(enrollment: Enrollment): boolean {
    return enrollment.payment_status !== 'paid' || enrollment.status !== 'pending';
  }

  /**
   * Get tooltip message for disabled approve button
   */
  getApproveTooltip(enrollment: Enrollment): string {
    if (enrollment.status !== 'pending') {
      return 'This enrollment has already been processed';
    }
    if (enrollment.payment_status !== 'paid') {
      return `Cannot approve. Payment status is ${enrollment.payment_status}. Payment must be marked as paid.`;
    }
    return '';
  }

  onApprove(id: number): void {
    if (confirm('Approve this enrollment?')) {
      this.approvingId = id;
      this.enrollmentService.approve(id).subscribe({
        next: (res) => {
          this.updateLocalStatus(id, 'approved');
          this.approvingId = null;
          alert(res.message || 'Enrollment approved successfully!');
        },
        error: (err) => {
          this.approvingId = null;
          const msg = err.error?.message || 'Approval failed.';
          alert(msg);
        }
      });
    }
  }

  private updateLocalStatus(id: number, status: 'approved'): void {
    const index = this.enrollments.findIndex(e => e.id === id);
    if (index !== -1) {
      this.enrollments[index].status = status;
    }
  }
}