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

  // Schedule Picker
days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
dayAbbr = ['M','T','W','Th','F','Sa','Su'];
times: string[] = [];
selectedSlots = new Set<string>();
isDragging = false;
dragMode: 'select' | 'deselect' = 'select';

  

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
    this.initTimes(); // add this

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
    this.subjectService.getActive().subscribe(data => this.subjects = data);
    this.instructorService.getAll().subscribe(data => this.instructors = data);
    this.termService.getAll().subscribe(data => this.terms = data);
  }

  initTimes(): void {
  for (let h = 7; h <= 20; h++) {
    const h12 = h <= 12 ? h : h - 12;
    const ampm = h < 12 ? 'AM' : 'PM';
    this.times.push(`${h12}:00 ${ampm}`);
    if (h < 20) this.times.push(`${h12}:30 ${ampm}`);
  }
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
      this.selectedSlots.clear(); // add this

    this.form = { section_name: '', subject_id: 0, instructor_id: 0, term_id: 0, capacity: 40, schedule: '', room: '', status: 'open' };
  }

  slotKey(di: number, ti: number): string { return `${di}-${ti}`; }
isSlotSelected(di: number, ti: number): boolean { return this.selectedSlots.has(this.slotKey(di, ti)); }

onSlotMouseDown(di: number, ti: number): void {
  this.isDragging = true;
  const k = this.slotKey(di, ti);
  this.dragMode = this.selectedSlots.has(k) ? 'deselect' : 'select';
  this.toggleSlot(k);
}

onSlotMouseOver(di: number, ti: number): void {
  if (this.isDragging) this.toggleSlot(this.slotKey(di, ti));
}

onSlotMouseUp(): void { this.isDragging = false; }

toggleSlot(k: string): void {
  if (this.dragMode === 'select') this.selectedSlots.add(k);
  else this.selectedSlots.delete(k);
  this.form.schedule = this.buildScheduleString();
}

clearSchedule(): void {
  this.selectedSlots.clear();
  this.form.schedule = '';
}

buildScheduleString(): string {
  const byDay: { [di: number]: number[] } = {};
  this.selectedSlots.forEach(k => {
    const [di, ti] = k.split('-').map(Number);
    if (!byDay[di]) byDay[di] = [];
    byDay[di].push(ti);
  });
  const parts: string[] = [];
  Object.keys(byDay).sort((a, b) => +a - +b).forEach(diStr => {
    const di = +diStr;
    const tis = byDay[di].sort((a, b) => a - b);
    let runStart = tis[0], prev = tis[0];
    for (let i = 1; i <= tis.length; i++) {
      if (i === tis.length || tis[i] !== prev + 1) {
        const s = this.times[runStart];
        const e = this.times[prev + 1] ?? '9:00 PM';
        parts.push(`${this.dayAbbr[di]} ${s} – ${e}`);
        if (i < tis.length) { runStart = tis[i]; prev = tis[i]; }
      } else { prev = tis[i]; }
    }
  });
  return parts.join(', ');
}
}