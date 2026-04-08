import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ProgramService } from '../../../core/services/program.service';
import { StudentService } from '../../../core/services/student.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  programService = inject(ProgramService);
  studentService = inject(StudentService);
  enrollmentService = inject(EnrollmentService);

  totalPrograms = signal(0);
  totalStudents = signal(0);
  totalEnrollments = signal(0);
  pendingEnrollments = signal(0);

  ngOnInit() {
    this.programService.getAll().subscribe((d) => this.totalPrograms.set(d.length));
    this.studentService.getAll().subscribe((d) => this.totalStudents.set(d.length));
    this.enrollmentService.getAll().subscribe((d) => {
      this.totalEnrollments.set(d.length);
      this.pendingEnrollments.set(d.filter((e) => e.status === 'pending').length);
    });
  }

  quickActions = [
    {
      label: 'Programs',
      desc: 'Manage degree programs',
      path: '/programs',
      colorClass: 'icon-indigo',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>`
    },
    {
      label: 'Students',
      desc: 'View all students',
      path: '/students',
      colorClass: 'icon-violet',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path stroke-linecap="round" stroke-linejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>`
    },
    {
      label: 'Enrollments',
      desc: 'Manage enrollments',
      path: '/enrollments',
      colorClass: 'icon-blue',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>`
    }
  ];
}