import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-projects-shell',
  standalone: true,
  imports: [RouterOutlet],
  template: `<div class="stf-prj-shell"><router-outlet /></div>`,
  styles: [
    `
      :host {
        display: block;
      }
      .stf-prj-shell {
        width: 100%;
      }
    `,
  ],
})
export class ProjectsShellComponent {}
