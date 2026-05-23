import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../../core/auth/services/user.service';
import { CustomerPortalService } from '../../../../shared/construction/customer-portal.service';
import { CustomerDashboard } from '../../../../shared/construction/construction.types';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerDashboardComponent implements OnInit {
  loading = true;
  userName = '';
  stats: CustomerDashboard | null = null;

  constructor(
    private portal: CustomerPortalService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userName = this.userService.user?.name ?? 'Cliente';
    this.portal.dashboard().subscribe({
      next: (res) => {
        this.stats = res.data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }
}
