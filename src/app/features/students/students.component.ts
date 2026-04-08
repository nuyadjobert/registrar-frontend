import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentService, CorData, TorData } from '../../core/services/student.service';
import { ProgramService } from '../../core/services/program.service';
import { Student, StudentPayload } from '../../core/models/student.model';
import { Program } from '../../core/models/program.model';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.css']
})
export class StudentsComponent implements OnInit {
  students: Student[] = [];
  filteredStudents: Student[] = [];   // ← what the table renders
  programs: Program[] = [];
  isLoading = false;
  searchQuery = '';                   // ← bound to search input

  // UI State
  selectedStudent?: Student;
  showModal = false;
  activeTab: 'info' | 'documents' = 'info';

  constructor(
    private studentService: StudentService,
    private programService: ProgramService
  ) {}

  ngOnInit(): void {
    this.loadStudents();
    this.programService.getAll().subscribe(data => this.programs = data);
  }

  loadStudents(): void {
    this.isLoading = true;
    this.studentService.getAll().subscribe({
      next: (data) => {
        this.students = data;
        this.filteredStudents = data;  // ← initialize filtered list
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  onSearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredStudents = this.students.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.student_number?.toLowerCase().includes(q)
    );
  }

  viewDetails(student: Student): void {
    this.isLoading = true;
    this.studentService.getById(student.id).subscribe(fullData => {
      this.selectedStudent = fullData;
      this.showModal = true;
      this.isLoading = false;
    });
  }

  generateCOR(id: number): void {
    this.studentService.getCor(id).subscribe({
      next: (res) => {
        console.log('COR Data:', res.data);
        alert(res.message);
      },
      error: (err) => alert(err.error?.message || 'Error generating COR')
    });
  }

  generateTOR(id: number): void {
    this.studentService.getTor(id).subscribe({
      next: (res) => {
        console.log('TOR Data:', res.data);
        alert(res.message);
      },
      error: (err) => alert(err.error?.message || 'Error generating TOR')
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedStudent = undefined;
    this.activeTab = 'info';
  }
}