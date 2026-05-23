import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomerPortalService } from '../../../../shared/construction/customer-portal.service';
import { ProjectRequest } from '../../../../shared/construction/construction.types';

@Component({
  selector: 'app-customer-requests',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './customer-requests.component.html',
  styleUrls: ['./customer-requests.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerRequestsComponent implements OnInit {
  loading = true;
  rows: ProjectRequest[] = [];

  constructor(
    private portal: CustomerPortalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.portal.listRequests().subscribe({
      next: (res) => {
        this.rows = res.data ?? [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  pendingQuoteId(req: ProjectRequest): number | null {
    const sent = (req.quotes ?? []).find((q) => q.status === 'sent');
    return sent?.id ?? null;
  }
}
