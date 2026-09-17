import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { AppComponent } from './app.component';

export const routes: Routes = [
  { path: '', component: AppComponent },
  { path: 'dashboard', component: AppComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
