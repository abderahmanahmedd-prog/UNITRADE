import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { User } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly user = signal<User | null>(null);

  constructor() {
    if (this.token) this.api.me().subscribe({ next: response => this.user.set(response.data.user), error: () => this.logout(false) });
  }

  get token() { return localStorage.getItem('unitradeToken'); }
  get isLoggedIn() { return Boolean(this.token); }

  login(email: string, password: string) {
    return this.api.login({ email, password });
  }

  saveSession(response: { token: string; data: { user: User } }) {
    localStorage.setItem('unitradeToken', response.token);
    this.user.set(response.data.user);
  }

  logout(redirect = true) {
    localStorage.removeItem('unitradeToken');
    this.user.set(null);
    if (redirect) this.router.navigateByUrl('/');
  }
}
