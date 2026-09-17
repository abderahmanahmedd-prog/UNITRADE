import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Listing, User } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:5000/api/v1';

  listings() { return this.http.get<{ data: { listings: Listing[] } }>(`${this.baseUrl}/listings`); }
  myListings() { return this.http.get<{ data: { listings: Listing[] } }>(`${this.baseUrl}/listings?myListings=true`); }
  login(body: { email: string; password: string }) { return this.http.post<{ token: string; data: { user: User } }>(`${this.baseUrl}/auth/login`, body); }
  register(body: Record<string, string>) { return this.http.post<{ token: string; data: { user: User } }>(`${this.baseUrl}/auth/register`, body); }
  me() { return this.http.get<{ data: { user: User } }>(`${this.baseUrl}/auth/me`); }
  buy(id: string) { return this.http.post<{ data: { user: User } }>(`${this.baseUrl}/listings/${id}/buy`, {}); }
}
