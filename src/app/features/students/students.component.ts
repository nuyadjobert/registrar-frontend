import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentService } from '../../core/services/student.service';
import { PaginationComponent } from '../../shared/components/paginations/pagination.component'; // ← Import here

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    PaginationComponent   // ← Add this
  ],
  templateUrl: './students.component.html',
})
export class StudentsComponent implements OnInit {

  students: any[] = [];
  filteredStudents: any[] = [];
  paginatedStudents: any[] = [];

  programs: string[] = [];
  activeProgram = 'All';

  isLoading = false;
  searchQuery = '';

  // Modal
  selectedStudent: any = null;
  showModal = false;
  activeTab: 'info' | 'grades' | 'documents' = 'info';

  // Grades & Documents
  grades: any[] = [];
  documents: any[] = [];

  // Pagination
  currentPage = 1;
  readonly itemsPerPage = 10;

  constructor(private studentService: StudentService) {}

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents() {
    this.isLoading = true;
    this.studentService.getAll().subscribe({
      next: (res) => {
        this.students = res || [];
        this.extractPrograms();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load students', err);
        this.isLoading = false;
      }
    });
  }

  extractPrograms() {
    const set = new Set<string>(
      this.students.map(s => s.program?.name).filter(Boolean)
    );
    this.programs = ['All', ...Array.from(set).sort()];
  }

  filterByProgram(event: Event) {
    this.activeProgram = (event.target as HTMLSelectElement).value;
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters() {
    let result = [...this.students];
    const q = this.searchQuery.toLowerCase().trim();

    if (this.activeProgram !== 'All') {
      result = result.filter(s => s.program?.name === this.activeProgram);
    }

    if (q) {
      result = result.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.student_number || '').toLowerCase().includes(q)
      );
    }

    this.filteredStudents = result;
    this.currentPage = 1;
    this.updatePaginatedStudents();
  }

  updatePaginatedStudents() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedStudents = this.filteredStudents.slice(start, start + this.itemsPerPage);
  }

  clearFilter() {
    this.activeProgram = 'All';
    this.searchQuery = '';
    this.applyFilters();
  }

  // Pagination Handlers (called from reusable component)
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedStudents();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages.length) {
      this.currentPage++;
      this.updatePaginatedStudents();
    }
  }

  onPageChange(newPage: number) {
    this.currentPage = newPage;
    this.updatePaginatedStudents();
  }

  get totalPages(): number[] {
    const total = Math.ceil(this.filteredStudents.length / this.itemsPerPage);
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  get paginationInfo(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredStudents.length);
    return `Showing ${start}–${end} of ${this.filteredStudents.length} records`;
  }

  // Modal
  viewDetails(student: any) {
    this.selectedStudent = student;
    this.showModal = true;
    this.activeTab = 'info';
    this.grades = [];
    this.documents = [];

    this.loadGrades(student.id);
    this.loadDocuments(student.student_number);
  }

  closeModal() {
    this.showModal = false;
    this.selectedStudent = null;
    this.grades = [];
    this.documents = [];
  }

  loadGrades(studentId: number) {
    this.studentService.getGrades(studentId).subscribe({
      next: (res) => this.grades = res || [],
      error: (err) => console.error(err)
    });
  }

  loadDocuments(studentNumber: string) {
    this.studentService.getDocuments(studentNumber).subscribe({
      next: (res) => this.documents = res?.data || res || [],
      error: (err) => {
        console.error('Failed to load documents', err);
        this.documents = [];
      }
    });
  }

  viewDocument(studentNumber: string, documentId: string | number) {
    this.studentService.getDocumentFile(studentNumber, documentId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 1500);
      },
      error: (err) => {
        console.error('Failed to open document', err);
        alert('Could not open the document. Please try again.');
      }
    });
  }
}