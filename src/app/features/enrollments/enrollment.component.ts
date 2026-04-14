import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { Enrollment } from '../../core/models/enrollment.model';

@Component({
  selector: 'app-enrollment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './enrollment.component.html',
})
export class EnrollmentComponent implements OnInit {
  enrollments: Enrollment[] = [];
  isLoading = false;
  approvingId: number | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;

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
        this.currentPage = 1;
      },
      error: (err) => {
        console.error('Failed to load enrollments', err);
        this.isLoading = false;
      }
    });
  }

  // Pagination Computed
  get paginatedEnrollments(): Enrollment[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.enrollments.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number[] {
    const total = Math.ceil(this.enrollments.length / this.itemsPerPage);
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  get paginationInfo(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.enrollments.length);
    return `Showing ${start}–${end} of ${this.enrollments.length} records`;
  }

  previousPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages.length) this.currentPage++;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages.length) {
      this.currentPage = page;
    }
  }

  isApproveDisabled(enrollment: Enrollment): boolean {
    return enrollment.payment_status !== 'paid' || enrollment.status !== 'pending';
  }

  onApprove(id: number): void {
    if (!confirm('Approve this enrollment?')) return;

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

 private updateLocalStatus(id: number, newStatus: 'approved'): void {
  this.enrollments = this.enrollments.map(enrollment => 
    enrollment.id === id 
      ? { 
          ...enrollment, 
          status: newStatus as any   // Safe cast since we know it's valid
        } 
      : enrollment
  );
}

}