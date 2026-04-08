import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  auth = inject(AuthService);
  router = inject(Router);

  name = '';
  email = '';
  password = '';
  password_confirmation = '';
  error = '';
  loading = false;

  submit() {
    this.loading = true;
    this.error = '';
    this.auth.register({
      name: this.name,
      email: this.email,
      password: this.password,
      password_confirmation: this.password_confirmation,
    }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.error = 'Registration failed. Please check your details.';
        this.loading = false;
      },
    });
  }
}