import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentRequestService } from '../../core/services/document-request.service';
import { DocumentRequest } from '../../core/models/document-request.model';

@Component({
  selector: 'app-document-request',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-requests.component.html',
  styleUrls: ['./document-requests.component.css']
})
export class DocumentRequestComponent implements OnInit {
  requests: DocumentRequest[] = [];
  loading = false;
  errorMessage = '';

  constructor(private requestService: DocumentRequestService) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading = true;
    this.requestService.getAll().subscribe({
      next: (data) => {
        this.requests = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Could not load requests.';
        this.loading = false;
      }
    });
  }

  handleApprove(id: number): void {
    this.requestService.approve(id).subscribe({
      next: (response) => {
        // Update the local list instead of refreshing the whole page
        this.updateLocalStatus(id, 'approved');
        alert(response.message);
      },
      error: () => alert('Error approving request')
    });
  }

  handleReject(id: number): void {
    if (confirm('Are you sure you want to reject this request?')) {
      this.requestService.reject(id).subscribe({
        next: (response) => {
          this.updateLocalStatus(id, 'rejected');
          alert(response.message);
        },
        error: () => alert('Error rejecting request')
      });
    }
  }

  private updateLocalStatus(id: number, status: 'pending' | 'approved' | 'rejected'): void {
    const index = this.requests.findIndex(r => r.id === id);
    if (index !== -1) {
        this.requests[index].status = status;
    }
}

  // Helper for CSS classes
  getStatusClass(status: string) {
    return {
      'badge-pending': status === 'pending',
      'badge-approved': status === 'approved',
      'badge-rejected': status === 'rejected'
    };
  }
}