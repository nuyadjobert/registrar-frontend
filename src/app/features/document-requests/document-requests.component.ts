import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentRequestService } from '../../core/services/document-request.service';
import { PdfService } from '../../core/services/pdf.service';
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
  generatingId: number | null = null;

  constructor(
    private requestService: DocumentRequestService,
    private pdfService: PdfService
  ) {}

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
      error: () => {
        this.errorMessage = 'Could not load requests.';
        this.loading = false;
      }
    });
  }

  handleApprove(id: number): void {
    this.requestService.approve(id).subscribe({
      next: (response) => {
        this.updateLocalStatus(id, 'approved');
        alert(response.message);
      },
      error: () => alert('Error approving request')
    });
  }

  handleDownload(req: DocumentRequest): void {
    if (!req.student_id) return;

    this.generatingId = req.id;
    const type = req.type.toUpperCase();

    if (type === 'COR') {
      this.requestService.getCOR(req.student_id).subscribe({
        next: (res) => {
          this.pdfService.generateCOR(res.data).finally(() => {
            this.generatingId = null;
          });
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to generate COR.');
          this.generatingId = null;
        }
      });
    } else if (type === 'TOR') {
      this.requestService.getTOR(req.student_id).subscribe({
        next: (res) => {
          this.pdfService.generateTOR(res.data).finally(() => {
            this.generatingId = null;
          });
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to generate TOR.');
          this.generatingId = null;
        }
      });
    }
  }

  private updateLocalStatus(id: number, status: 'pending' | 'approved' | 'rejected'): void {
    const index = this.requests.findIndex(r => r.id === id);
    if (index !== -1) {
      this.requests[index].status = status;
    }
  }

  getStatusClass(status: string) {
    return {
      'badge-pending': status === 'pending',
      'badge-approved': status === 'approved',
      'badge-rejected': status === 'rejected'
    };
  }
}