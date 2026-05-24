import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
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
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatProgressSpinnerModule],
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

  phaseLabel(p: ConstructionProject): string {
    return projectPhaseLabel(p);
  }

  phaseBadgeClass(p: ConstructionProject): string {
    return contractPhaseBadgeClass(p.contract_phase);
  }
}
