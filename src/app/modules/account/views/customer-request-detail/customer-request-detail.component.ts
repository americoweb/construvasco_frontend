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

  get approvedMockupUrl(): string | null {
    const req = this.request;
    if (!req) {
      return null;
    }
    if (req.approved_ai_generation?.image_url) {
      return req.approved_ai_generation.image_url;
    }
    const approvedId = req.approved_ai_generation_id;
    if (approvedId && req.ai_generations?.length) {
      const match = req.ai_generations.find((g) => g.id === approvedId);
      return match?.image_url ?? null;
    }
    return null;
  }
}
