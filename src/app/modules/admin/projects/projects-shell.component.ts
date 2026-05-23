import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/components/layout/page-header/page-header.component';

@Component({
  selector: 'app-projects-shell',
  standalone: true,
  imports: [RouterOutlet, PageHeaderComponent],
  template: `
    <div class="w-full">
      <app-page-header title="Projectos" subtitle="Obras activas após aceitação do orçamento" [showSearch]="false" />
      <div class="container mx-auto max-w-6xl px-4 pb-10">
        <router-outlet />
      </div>
    </div>
  `,
})
export class ProjectsShellComponent {}
