import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import {
  DocumentRequest,
  DocumentRequestPayload,
} from '../models/document-request.model';

export interface DocumentActionResponse {
  message: string;
  document: DocumentRequest;
}

@Injectable({ providedIn: 'root' })
export class DocumentRequestService {
  private path = 'document-requests';

  constructor(private api: ApiService) {}

  // GET /api/document-requests (returns with student)
  getAll() {
    return this.api.get<DocumentRequest[]>(this.path);
  }

  // GET /api/document-requests/:id
  getById(id: number) {
    return this.api.get<DocumentRequest>(`${this.path}/${id}`);
  }

  // POST /api/document-requests
  create(payload: DocumentRequestPayload) {
    return this.api.post<DocumentRequest>(this.path, payload);
  }

  // POST /api/document-requests/:id/approve
  approve(id: number) {
    return this.api.post<DocumentActionResponse>(
      `${this.path}/${id}/approve`, {}
    );
  }

  // POST /api/document-requests/:id/reject
  reject(id: number) {
    return this.api.post<DocumentActionResponse>(
      `${this.path}/${id}/reject`, {}
    );
  }
}