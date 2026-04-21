import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-job-cards',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />'
})
export class JobCardsComponent {}
