import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomerPortalService } from '../../../../shared/construction/customer-portal.service';
import { ConstructionProject } from '../../../../shared/construction/construction.types';
import {
  contractPhaseBadgeClass,
  projectPhaseLabel,
} from '../../../../shared/construction/contract-phase.util';

@Component({
  selector: 'app-customer-projects',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './customer-projects.component.html',
  styleUrls: ['./customer-projects.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerProjectsComponent implements OnInit {
  loading = true;
  rows: ConstructionProject[] = [];

  constructor(
    private portal: CustomerPortalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.portal.listProjects().subscribe({
      next: (res) => {
        this.rows = (res.data ?? []).sort((a, b) => {
          const ua = a.updated_at ?? '';
          const ub = b.updated_at ?? '';
          return ub.localeCompare(ua);
        });
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  phaseLabel(p: ConstructionProject): string {
    return projectPhaseLabel(p);
  }

  phaseBadgeClass(p: ConstructionProject): string {
    return contractPhaseBadgeClass(p.contract_phase);
  }

  reference(p: ConstructionProject): string {
    return p.project_request?.reference_code || `CV-PRJ-${p.id}`;
  }
}
