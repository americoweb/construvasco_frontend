import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { ProjectRequestService } from '../../../shared/construction/project-request.service';
import { ProjectRequest, Quote } from '../../../shared/construction/construction.types';
import { NotificationService } from '../../../shared/components/feedback/notification.service';

@Component({
  selector: 'app-project-request-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  templateUrl: './project-request-detail.component.html',
  styleUrls: ['./project-request-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectRequestDetailComponent implements OnInit {
  loading = true;
  savingQuote = false;
  item: ProjectRequest | null = null;
  quotes: Quote[] = [];

  quoteForm = this.fb.group({
    total_amount_mt: [null as number | null, [Validators.required, Validators.min(0)]],
    delivery_days: [null as number | null, [Validators.min(1)]],
    conditions: [''],
  });

  constructor(
    private route: ActivatedRoute,
    private requests: ProjectRequestService,
    private notify: NotificationService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.load(id);
  }

  load(id: string): void {
    this.loading = true;
    this.requests.getManager(id).subscribe({
      next: (res) => {
        this.item = res.data;
        this.quotes = res.data.quotes ?? [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.notify.error('Não foi possível carregar o pedido.');
        this.cdr.markForCheck();
      },
    });
  }

  approve(): void {
    if (!this.item) return;
    this.requests.approve(this.item.id).subscribe({
      next: (res) => {
        this.item = res.data;
        this.notify.success('Pedido marcado em análise.');
        this.cdr.markForCheck();
      },
      error: () => this.notify.error('Erro ao aprovar pedido.'),
    });
  }

  reject(): void {
    if (!this.item) return;
    const reason = window.prompt('Motivo da recusa (opcional):') ?? undefined;
    this.requests.reject(this.item.id, reason).subscribe({
      next: (res) => {
        this.item = res.data;
        this.notify.success('Pedido recusado.');
        this.cdr.markForCheck();
      },
      error: () => this.notify.error('Erro ao recusar pedido.'),
    });
  }

  sendQuote(): void {
    if (!this.item || this.quoteForm.invalid) {
      this.quoteForm.markAllAsTouched();
      return;
    }
    const v = this.quoteForm.getRawValue();
    this.savingQuote = true;
    this.requests
      .storeQuote(this.item.id, {
        total_amount_mt: Number(v.total_amount_mt),
        delivery_days: v.delivery_days ? Number(v.delivery_days) : undefined,
        conditions: v.conditions || undefined,
      })
      .subscribe({
        next: () => {
          this.notify.success('Orçamento enviado ao cliente.');
          this.quoteForm.reset();
          this.savingQuote = false;
          this.load(String(this.item!.id));
        },
        error: (err) => {
          this.savingQuote = false;
          this.notify.error(err?.error?.message ?? 'Erro ao enviar orçamento.');
          this.cdr.markForCheck();
        },
      });
  }

  briefingEntries(): [string, unknown][] {
    const b = this.item?.briefing_data ?? {};
    return Object.entries(b).filter(([, v]) => v !== null && v !== '' && v !== undefined);
  }
}
