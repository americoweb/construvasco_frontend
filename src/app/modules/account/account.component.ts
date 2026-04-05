import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterLink, RouterLinkActive, ActivatedRoute } from '@angular/router';
import { AccountSidebarComponent } from './components/account-sidebar/account-sidebar.component';
import { LandingHeaderComponent } from '../../shared/components/layout/landing-header/landing-header.component';
import { LandingFooterComponent } from '../../shared/components/layout/landing-footer/landing-footer.component';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, AccountSidebarComponent, LandingHeaderComponent, LandingFooterComponent],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit, OnDestroy {
  private _destroyed$ = new Subject<void>();
  private previousUrl = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Track previous URL for navigation tracking
    this.previousUrl = this.router.url;

    // Track navigation events and trigger change detection
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this._destroyed$)
      )
      .subscribe((event: NavigationEnd) => {
        this.previousUrl = event.urlAfterRedirects;
        
        // Force change detection after navigation to ensure router outlet updates
        // Use multiple strategies to ensure the view updates
        this.cdr.markForCheck();
        setTimeout(() => {
          this.cdr.detectChanges();
          // Also mark for check again after a short delay
          setTimeout(() => {
            this.cdr.markForCheck();
          }, 100);
        }, 0);
      });
  }

  onRouteActivate(_component: any): void {
    // Force change detection when route activates
    this.cdr.markForCheck();
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }

  onRouteDeactivate(_component: any): void {}

  ngOnDestroy(): void {
    this._destroyed$.next();
    this._destroyed$.complete();
  }
}

