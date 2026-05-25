import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ConfigService } from '../../../core/services/config.service';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints';

interface FinanceOverview {
  payments_total_mt: number;
  payments_count: number;
  quotes_sent_count: number;
  quotes_accepted_count: number;
  quotes_total_sent_mt: number;
  recent_quotes: {
    id: number;
    total_amount_mt: number;
    status: string;
    reference_code?: string;
    client_name?: string;
  }[];
  recent_payments: {
    id: number;
    amount: number;
    currency?: string;
    status: string;
    project_name?: string;
    client_name?: string;
  }[];
}

@Component({
  selector: 'app-admin-finances',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './admin-finances.component.html',
  styleUrls: ['./admin-finances.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminFinancesComponent implements OnInit {
  loading = true;
  pageReady = false;
  overview: FinanceOverview | null = null;

  constructor(
    private http: HttpClient,
    private config: ConfigService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.http
      .get<{ data: FinanceOverview }>(this.config.getApiUrl(API_ENDPOINTS.MANAGER.FINANCES_OVERVIEW))
      .subscribe({
        next: (res) => {
          this.overview = res.data ?? null;
          this.loading = false;
          this.pageReady = !!this.overview;
          this.cdr.markForCheck();
        },
        error: () => {
          this.overview = null;
          this.loading = false;
          this.pageReady = true;
          this.cdr.markForCheck();
        },
      });
  }

  formatMoney(v?: number | null): string {
    if (v === null || v === undefined) return '—';
    return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(v);
  }

  labelQuoteStatus(status: string): string {
    const map: Record<string, string> = {
      sent: 'Enviado',
      accepted: 'Aceite',
      rejected: 'Recusado',
      draft: 'Rascunho',
    };
    return map[status] ?? status;
  }

  labelPaymentStatus(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pendente',
      submitted: 'Submetido',
      confirmed: 'Confirmado',
      paid: 'Pago',
      rejected: 'Rejeitado',
    };
    return map[status] ?? status;
  }
}
