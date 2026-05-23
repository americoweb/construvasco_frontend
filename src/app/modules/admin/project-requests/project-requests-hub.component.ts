import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { PageHeaderComponent } from '../../../shared/components/layout/page-header/page-header.component';

@Component({
  selector: 'app-project-requests-hub',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatTabsModule, PageHeaderComponent],
  templateUrl: './project-requests-hub.component.html',
  styleUrls: ['./project-requests-hub.component.scss'],
})
export class ProjectRequestsHubComponent {}
