import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomerPortalService } from '../../../../shared/construction/customer-portal.service';
import { ConstructionProject } from '../../../../shared/construction/construction.types';

@Component({
  selector: 'app-customer-projects',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule],
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
}
