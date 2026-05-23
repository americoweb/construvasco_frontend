import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomerPortalService } from '../../../../shared/construction/customer-portal.service';
import { Quote } from '../../../../shared/construction/construction.types';
import { NotificationService } from '../../../../shared/components/feedback/notification.service';

@Component({
  selector: 'app-customer-quote',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './customer-quote.component.html',
  styleUrls: ['./customer-quote.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerQuoteComponent implements OnInit {
  loading = true;
  busy = false;
  quote: Quote | null = null;
  rejectForm = this.fb.group({ reason: [''] });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private portal: CustomerPortalService,
    private notify: NotificationService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.portal.getQuote(id).subscribe({
      next: (res) => {
        this.quote = res.data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.notify.error('Orçamento não encontrado.');
        this.cdr.markForCheck();
      },
    });
  }

  accept(): void {
    if (!this.quote) return;
    this.busy = true;
    this.portal.acceptQuote(this.quote.id).subscribe({
      next: () => {
        this.notify.success('Orçamento aceite. O seu projecto foi criado.');
        this.router.navigate(['/conta/projectos']);
      },
      error: (err) => {
        this.busy = false;
        this.notify.error(err?.error?.message ?? 'Não foi possível aceitar o orçamento.');
        this.cdr.markForCheck();
      },
    });
  }

  reject(): void {
    if (!this.quote) return;
    this.busy = true;
    const reason = this.rejectForm.value.reason ?? undefined;
    this.portal.rejectQuote(this.quote.id, reason).subscribe({
      next: () => {
        this.notify.success('Orçamento recusado.');
        this.router.navigate(['/conta/pedidos']);
      },
      error: () => {
        this.busy = false;
        this.notify.error('Erro ao recusar orçamento.');
        this.cdr.markForCheck();
      },
    });
  }
}
