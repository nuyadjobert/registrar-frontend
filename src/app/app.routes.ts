import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { NotFoundComponent } from './features/error/not-found/not-found.component';

export const routes: Routes = [
  // ── Redirect root
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  // ── Guest routes (login/register)
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  // {
  //   path: 'register',
  //   canActivate: [guestGuard],
  //   loadComponent: () =>
  //     import('./features/auth/register/register.component').then(
  //       (m) => m.RegisterComponent
  //     ),
  // },

  // ── Protected routes (inside main layout)
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/auth/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'programs',
        loadComponent: () =>
          import('./features/programs/programs.component').then(
            (m) => m.ProgramsComponent
          ),
      },
      {
        path: 'subjects',
        loadComponent: () =>
          import('./features/subjects/subjects.component').then(
            (m) => m.SubjectsComponent
          ),
      },
      {
        path: 'curricula',
        loadComponent: () =>
          import('./features/curricula/curricula.component').then(
            (m) => m.CurriculaComponent
          ),
      },
      {
        path: 'sections',
        loadComponent: () =>
          import('./features/sections/sections.component').then(
            (m) => m.SectionsComponent
          ),
      },
      {
        path: 'enrollments',
        loadComponent: () =>
          import('./features/enrollments/enrollment.component').then(
            (m) => m.EnrollmentComponent
          ),
      },
      {
        path: 'students',
        loadComponent: () =>
          import('./features/students/students.component').then(
            (m) => m.StudentsComponent
          ),
      },
    //   {
    //     path: 'students/:id',
    //     loadComponent: () =>
    //       import('./features/students/student-detail/student-detail.component').then(
    //         (m) => m.StudentDetailComponent
    //       ),
    //   },
      {
        path: 'grades',
        loadComponent: () =>
          import('./features/grades/grades.component').then(
            (m) => m.GradesComponent
          ),
      },
      {
        path: 'document-requests',
        loadComponent: () =>
          import('./features/document-requests/document-requests.component').then(
            (m) => m.DocumentRequestComponent
          ),
      },
      {
        path: 'instructors',
        loadComponent: () =>
          import('./features/instructors/instructors.component').then(
            (m) => m.InstructorsComponent
          ),
      },
    ],
  },

  // ── Fallback
  {
    path: '**',
    component: NotFoundComponent,

  },
];