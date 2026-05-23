import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomerPortalService } from '../../../../shared/construction/customer-portal.service';
import { ProjectRequest } from '../../../../shared/construction/construction.types';

@Component({
  selector: 'app-customer-request-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './customer-request-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerRequestDetailComponent implements OnInit {
  loading = true;
  request: ProjectRequest | null = null;
  justSubmitted = false;

  constructor(
    private route: ActivatedRoute,
    private portal: CustomerPortalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.justSubmitted = this.route.snapshot.queryParamMap.get('submitted') === '1';
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      return;
    }
    this.portal.getRequest(id).subscribe({
      next: (res) => {
        this.request = res.data;
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
