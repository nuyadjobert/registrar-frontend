import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'sanctum_token';
  currentUser = signal<User | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    if (this.getToken()) {
      this.fetchCurrentUser().subscribe();
    }
  }

  // POST /api/auth/register
  register(payload: RegisterPayload) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, payload)
      .pipe(tap((res) => this.handleAuth(res)));
  }

  // POST /api/auth/login
  login(payload: LoginPayload) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, payload)
      .pipe(tap((res) => this.handleAuth(res)));
  }

  // POST /api/auth/logout
  logout() {
    return this.http
      .post<{ message: string }>(`${environment.apiUrl}/auth/logout`, {})
      .pipe(
        tap(() => {
          localStorage.removeItem(this.TOKEN_KEY);
          this.currentUser.set(null);
          this.router.navigate(['/login']);
        })
      );
  }

  // GET /api/auth/user
  fetchCurrentUser() {
    return this.http
      .get<{ user: User }>(`${environment.apiUrl}/auth/user`)
      .pipe(tap((res) => this.currentUser.set(res.user)));
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private handleAuth(res: AuthResponse) {
    localStorage.setItem(this.TOKEN_KEY, res.token);
    this.currentUser.set(res.user);
  }
}