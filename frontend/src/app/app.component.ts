import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from './core/api.service';
import { AuthService } from './core/auth.service';
import { Listing } from './core/models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  readonly listings = signal<Listing[]>([]);
  readonly message = signal('');
  readonly loginMode = signal(true);
  readonly dashboardOpen = signal(false);
  email = '';
  password = '';
  name = '';
  studentId = '';
  faculty = '';

  constructor() { this.loadListings(); }

  loadListings() { this.api.listings().subscribe(response => this.listings.set(response.data.listings)); }

  submitAuth() {
    const request = this.loginMode()
      ? this.api.login({ email: this.email, password: this.password })
      : this.api.register({ name: this.name, email: this.email, studentId: this.studentId, faculty: this.faculty, password: this.password });
    request.subscribe({
      next: response => { this.auth.saveSession(response); this.message.set('Welcome to UniTrade.'); },
      error: error => this.message.set(error.error?.message || 'Account request failed.')
    });
  }

  buy(listing: Listing) {
    if (!this.auth.isLoggedIn) return this.message.set('Log in before buying an item.');
    this.api.buy(listing._id).subscribe({
      next: response => { this.auth.user.set(response.data.user); this.message.set('Purchase complete.'); this.loadListings(); },
      error: error => this.message.set(error.error?.message || 'Purchase failed.')
    });
  }
}
