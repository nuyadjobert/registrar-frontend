import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.component.html',
})
export class TopbarComponent {
  auth = inject(AuthService);
  router = inject(Router);
  showDropdown = false;

  logout() {
    this.auth.logout().subscribe();
  }
}