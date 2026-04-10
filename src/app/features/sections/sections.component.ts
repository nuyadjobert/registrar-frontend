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

  // Delete progress state
  showDeleteProgress = false;
  deleteProgressTime = 5;
  pendingDeleteId: number | null = null;
  private deleteTimer: ReturnType<typeof setInterval> | null = null;

  // Schedule Picker
  days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  dayAbbr = ['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su'];
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

  formErrors: {
    section_name: string;
    subject_id: string;
    instructor_id: string;
    term_id: string;
    room: string;
    capacity: string;
    schedule: string;
  } = {
    section_name: '',
    subject_id: '',
    instructor_id: '',
    term_id: '',
    room: '',
    capacity: '',
    schedule: ''
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
    this.initTimes();
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

  // ─── Validation ───────────────────────────────────────────

  validateForm(): boolean {
    this.formErrors = {
      section_name: '',
      subject_id: '',
      instructor_id: '',
      term_id: '',
      room: '',
      capacity: '',
      schedule: ''
    };
    let valid = true;

    // Section name — required + duplicate check
    if (!this.form.section_name.trim()) {
      this.formErrors.section_name = 'Section name is required.';
      valid = false;
    } else {
      const duplicate = this.sections.some(s =>
        s.section_name.toLowerCase() === this.form.section_name.trim().toLowerCase() &&
        s.id !== this.currentId
      );
      if (duplicate) {
        this.formErrors.section_name = 'A section with this name already exists.';
        valid = false;
      }
    }

    // Subject — required
    if (!this.form.subject_id || this.form.subject_id === 0) {
      this.formErrors.subject_id = 'Please select a subject.';
      valid = false;
    }

    // Instructor — required
    if (!this.form.instructor_id || this.form.instructor_id === 0) {
      this.formErrors.instructor_id = 'Please select an instructor.';
      valid = false;
    }

    // Term — required
    if (!this.form.term_id || this.form.term_id === 0) {
      this.formErrors.term_id = 'Please select a term.';
      valid = false;
    }

    // Room — required
    if (!this.form.room?.trim()) {
      this.formErrors.room = 'Room is required.';
      valid = false;
    }

    // Capacity — required + range
    if (!this.form.capacity || this.form.capacity <= 0) {
      this.formErrors.capacity = 'Capacity must be greater than 0.';
      valid = false;
    } else if (this.form.capacity > 200) {
      this.formErrors.capacity = 'Capacity cannot exceed 200.';
      valid = false;
    }

    // Schedule — required
    if (!this.form.schedule) {
      this.formErrors.schedule = 'Please select at least one schedule slot.';
      valid = false;
    }

    // ─── Conflict detection (runs unconditionally) ───────────
    for (const sec of this.sections) {
      if (sec.id === this.currentId) continue;
      if (!sec.schedule) continue;

const overlap = this.form.schedule && sec.schedule
  ? this.hasScheduleOverlap(this.form.schedule, sec.schedule)
  : false;
  
      // Instructor conflict
      if (overlap && sec.instructor_id === this.form.instructor_id) {
        this.formErrors.instructor_id =
          `Instructor already has a class at this time (${sec.section_name}).`;
        valid = false;
      }

      // Room conflict
      if (
        overlap &&
        sec.room?.trim().toLowerCase() === this.form.room?.trim().toLowerCase()
      ) {
        this.formErrors.room =
          `Room already occupied at this time (${sec.section_name}).`;
        valid = false;
      }
    }

    return valid;
  }

  hasScheduleOverlap(scheduleA: string, scheduleB: string): boolean {
    const normalize = (s: string) => s
      .replace(/\u2013|\u2014|–|—/g, '-')
      .replace(/\s*-\s*/g, ' - ')
      .trim();

    const parseSlots = (schedule: string): string[] =>
      normalize(schedule).split(',').map(s => s.trim()).filter(Boolean);

    const slotsA = parseSlots(scheduleA);
    const slotsB = parseSlots(scheduleB);

    for (const slotA of slotsA) {
      for (const slotB of slotsB) {
        const dayA = slotA.split(' ')[0];
        const dayB = slotB.split(' ')[0];

        if (dayA === dayB) {
          const timeA = this.parseTimeRange(slotA);
          const timeB = this.parseTimeRange(slotB);

          if (timeA && timeB) {
            if (timeA.start < timeB.end && timeA.end > timeB.start) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  parseTimeRange(slot: string): { start: number; end: number } | null {
    try {
      const normalized = slot
        .replace(/\u2013|\u2014|–|—/g, '-')
        .replace(/\s*-\s*/g, ' - ');

      const match = normalized.match(
        /^([\w]+)\s+(\d+):(\d+)\s*(AM|PM)\s*-\s*(\d+):(\d+)\s*(AM|PM)/i
      );

      if (!match) return null;

      const toMinutes = (h: number, m: number, ampm: string): number => {
        let hours = h;
        if (ampm.toUpperCase() === 'PM' && h !== 12) hours += 12;
        if (ampm.toUpperCase() === 'AM' && h === 12) hours = 0;
        return hours * 60 + m;
      };

      return {
        start: toMinutes(+match[2], +match[3], match[4]),
        end:   toMinutes(+match[5], +match[6], match[7]),
      };
    } catch {
      return null;
    }
  }

  get isFormInvalid(): boolean {
    return (
      !this.form.section_name.trim() ||
      !this.form.subject_id ||
      this.form.subject_id === 0 ||
      !this.form.instructor_id ||
      this.form.instructor_id === 0 ||
      !this.form.term_id ||
      this.form.term_id === 0 ||
      !this.form.room?.trim() ||
      !this.form.capacity ||
      this.form.capacity <= 0 ||
      !this.form.schedule
    );
  }

  // ─── Form Actions ──────────────────────────────────────────

  submitForm(): void {
    if (!this.validateForm()) return;

    if (this.isEditing && this.currentId) {
      this.sectionService.update(this.currentId, this.form).subscribe({
        next: () => this.handleSuccess(),
        error: () => alert('Failed to update section.')
      });
    } else {
      this.sectionService.create(this.form).subscribe({
        next: () => this.handleSuccess(),
        error: () => alert('Failed to create section.')
      });
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

  /**
   * Initiate delete with confirmation dialog
   */
  deleteSection(id: number): void {
    const confirmDelete = window.confirm(
      'Delete this section? This may affect active enrollments.'
    );

    if (confirmDelete) {
      this.startDeleteProgress(id);
    }
  }

  /**
   * Start the delete progress timer
   */
  private startDeleteProgress(id: number): void {
    this.pendingDeleteId = id;
    this.showDeleteProgress = true;
    this.deleteProgressTime = 5;

    // Clear any existing timer
    if (this.deleteTimer) {
      clearInterval(this.deleteTimer);
    }

    // Start countdown
    this.deleteTimer = setInterval(() => {
      this.deleteProgressTime--;

      // When timer reaches 0, execute delete
      if (this.deleteProgressTime <= 0) {
        this.executeDelete();
      }
    }, 1000);
  }

  /**
   * Execute the actual delete operation
   */
  private executeDelete(): void {
    const id = this.pendingDeleteId;

    if (!id) return;

    // Clear timer
    if (this.deleteTimer) {
      clearInterval(this.deleteTimer);
      this.deleteTimer = null;
    }

    this.sectionService.delete(id).subscribe({
      next: () => {
        // Only remove from UI after successful deletion
        this.sections = this.sections.filter((s) => s.id !== id);
        this.resetDeleteProgress();
      },
      error: (err: unknown): void => {
        console.error('Failed to delete section', err);
        alert('Failed to delete section. Please try again.');
        this.resetDeleteProgress();
      },
    });
  }

  /**
   * Undo the delete operation - prevents the API call from happening
   */
  undoDelete(): void {
    // Clear timer
    if (this.deleteTimer) {
      clearInterval(this.deleteTimer);
      this.deleteTimer = null;
    }

    // Show undo success message (toast/snackbar)
    const undoMessage = document.createElement('div');
    undoMessage.className = 'undo-toast';
    undoMessage.innerHTML = `
      <span class="undo-icon">✓</span>
      <span class="undo-text">Deletion cancelled</span>
    `;
    document.body.appendChild(undoMessage);

    // Trigger animation
    setTimeout(() => {
      undoMessage.classList.add('show');
    }, 10);

    // Remove the message after 3 seconds
    setTimeout(() => {
      undoMessage.classList.remove('show');
      setTimeout(() => {
        undoMessage.remove();
      }, 300);
    }, 3000);

    this.resetDeleteProgress();
  }

  /**
   * Reset delete progress state
   */
  private resetDeleteProgress(): void {
    this.showDeleteProgress = false;
    this.deleteProgressTime = 5;
    this.pendingDeleteId = null;
  }

  handleSuccess(): void {
    this.resetForm();
    this.loadData();
  }

  resetForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.currentId = undefined;
    this.selectedSlots.clear();
    this.formErrors = {
      section_name: '',
      subject_id: '',
      instructor_id: '',
      term_id: '',
      room: '',
      capacity: '',
      schedule: ''
    };
    this.form = {
      section_name: '',
      subject_id: 0,
      instructor_id: 0,
      term_id: 0,
      capacity: 40,
      schedule: '',
      room: '',
      status: 'open'
    };
  }

  // ─── Schedule Picker ───────────────────────────────────────

  slotKey(di: number, ti: number): string { return `${di}-${ti}`; }

  isSlotSelected(di: number, ti: number): boolean {
    return this.selectedSlots.has(this.slotKey(di, ti));
  }

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