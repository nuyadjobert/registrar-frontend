import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SectionService } from '../../core/services/section.service';
import { SubjectService } from '../../core/services/subject.service';
import { InstructorService } from '../../core/services/instructor.service';
import { TermService } from '../../core/services/term.service';
import { Section, SectionPayload } from '../../core/models/section.model';
import { Subject } from '../../core/models/subject.model';
import { Instructor } from '../../core/models/instructor.model';
import { Term } from '../../core/models/term.model';

@Component({
  selector: 'app-sections',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sections.component.html',
  styleUrls: ['./sections.component.css']
})
export class SectionsComponent implements OnInit {
  sections: Section[] = [];
  subjects: Subject[] = [];
  instructors: Instructor[] = [];
  terms: Term[] = [];
  isLoading = false;

  

  // Form State
  showForm = false;
  isEditing = false;
  currentId?: number;

  form: SectionPayload = {
    section_name: '',
    subject_id: 0,
    instructor_id: 0,
    term_id: 0,
    capacity: 40,
    schedule: '',
    room: '',
    status: 'open'
  };

  constructor(
    private sectionService: SectionService,
    private subjectService: SubjectService,
    private instructorService: InstructorService,
    private termService: TermService
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.loadDropdowns();
  }

  loadData(): void {
    this.isLoading = true;
    this.sectionService.getAll().subscribe({
      next: (data) => {
        this.sections = data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  loadDropdowns(): void {
    this.subjectService.getAll().subscribe(data => this.subjects = data);
    this.instructorService.getAll().subscribe(data => this.instructors = data);
    this.termService.getAll().subscribe(data => this.terms = data);
  }

  submitForm(): void {
    if (this.isEditing && this.currentId) {
      this.sectionService.update(this.currentId, this.form).subscribe(() => this.handleSuccess());
    } else {
      this.sectionService.create(this.form).subscribe(() => this.handleSuccess());
    }
  }

  editSection(sec: Section): void {
    this.isEditing = true;
    this.currentId = sec.id;
    this.form = {
      section_name: sec.section_name,
      subject_id: sec.subject_id,
      instructor_id: sec.instructor_id,
      term_id: sec.term_id,
      capacity: sec.capacity,
      schedule: sec.schedule,
      room: sec.room,
      status: sec.status
    };
    this.showForm = true;
  }

  deleteSection(id: number): void {
    if (confirm('Delete this section? This may affect active enrollments.')) {
      this.sectionService.delete(id).subscribe(() => this.loadData());
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
    this.form = { section_name: '', subject_id: 0, instructor_id: 0, term_id: 0, capacity: 40, schedule: '', room: '', status: 'open' };
  }
}