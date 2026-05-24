import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CustomerPortalService } from '../../../../shared/construction/customer-portal.service';
import { ConstructionProjectService } from '../../../../shared/construction/construction-project.service';
import {
  ConstructionProject,
  ProjectDeliverable,
  Quote,
} from '../../../../shared/construction/construction.types';
import { NotificationService } from '../../../../shared/components/feedback/notification.service';
import {
  approvedMockupUrl,
  briefingRowsFromRequest,
  hasApprovedMockup,
} from '../../../../shared/construction/project-briefing.util';
import {
  formatFileSize,
  normalizeDeliverableStatus,
  parseFilenameFromDisposition,
  triggerBlobDownload,
} from '../../../../shared/construction/deliverable.util';
import {
  BANK_DETAILS_PLACEHOLDER,
  architecturePaymentForProject,
  canCustomerDownload,
  downloadBlockedTooltip,
  formatMoneyMt,
  paymentCardClass,
  paymentStatusLabel,
} from '../../../../shared/construction/payment.util';
import {
  canRequestConstructionQuote,
  contractPhaseLabel,
  requestConstructionQuoteTooltip,
} from '../../../../shared/construction/contract-phase.util';
import { SubmitPaymentProofDialogComponent } from './submit-payment-proof-dialog.component';
import { RequestConstructionQuoteDialogComponent } from './request-construction-quote-dialog.component';
import { RejectQuoteDialogComponent } from '../customer-request-detail/reject-quote-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/feedback/confirm-dialog/confirm-dialog.component';
import { ApprovedMockupCardComponent } from '../../components/customer-shared/approved-mockup-card.component';
import { BriefingPanelComponent } from '../../components/customer-shared/briefing-panel.component';
import { contractPhaseBadgeClass } from '../../../../shared/construction/contract-phase.util';

@Component({
  selector: 'app-customer-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    ApprovedMockupCardComponent,
    BriefingPanelComponent,
  ],
  templateUrl: './customer-project-detail.component.html',
  styleUrls: ['./customer-project-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerProjectDetailComponent implements OnInit {
  loading = true;
  deliverablesLoading = false;
  project: ConstructionProject | null = null;
  deliverables: ProjectDeliverable[] = [];
  private projectId = '';

  constructor(
    private route: ActivatedRoute,
    private portal: CustomerPortalService,
    private projects: ConstructionProjectService,
    private notify: NotificationService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  readonly bankDetails = BANK_DETAILS_PLACEHOLDER;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.projectId = id;
    this.reloadAll();
  }

  private reloadAll(): void {
    this.loading = true;
    this.portal.getProject(this.projectId).subscribe({
      next: (res) => {
        this.project = res.data;
        this.loading = false;
        this.cdr.markForCheck();
        this.reloadDeliverables();
      },
      error: () => {
        this.loading = false;
        this.notify.error('Projecto não encontrado.');
        this.cdr.markForCheck();
      },
    });
  }

  private reloadDeliverables(): void {
    this.deliverablesLoading = true;
    this.projects.listDeliverables('customer', this.projectId).subscribe({
      next: (res) => {
        this.deliverables = res.data ?? [];
        this.deliverablesLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.deliverables = [];
        this.deliverablesLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  get referenceLabel(): string {
    const req = this.project?.project_request;
    return req?.reference_code ?? this.project?.name ?? `Projecto #${this.project?.id}`;
  }

  get phaseStatusLabel(): string {
    if (this.project?.contract_phase_label) return this.project.contract_phase_label;
    return contractPhaseLabel(this.project?.contract_phase, this.project?.current_phase);
  }

  phaseBadgeClass(): string {
    const legacy = contractPhaseBadgeClass(this.project?.contract_phase);
    const map: Record<string, string> = {
      'phase-badge--architecture': 'cp-badge--primary',
      'phase-badge--execution-quote': 'cp-badge--warning',
      'phase-badge--construction': 'cp-badge--primary',
      'phase-badge--completed': 'cp-badge--success',
      'phase-badge--closed': 'cp-badge--neutral',
      'phase-badge--default': 'cp-badge--neutral',
    };
    return map[legacy] ?? 'cp-badge--neutral';
  }

  get statusMessage(): string {
    if (this.project?.architecture_completed_at) {
      return 'Arquitectura concluída. Pode agora solicitar o orçamento de obra.';
    }
    if (this.deliverables.length && this.canDownload) {
      return 'Tem entregáveis disponíveis para descarregar.';
    }
    if (this.deliverables.length && !this.canDownload) {
      return 'Há entregáveis aprovados, mas o download fica disponível após confirmação do pagamento.';
    }
    return 'A nossa equipa está a trabalhar no seu projecto. Será notificado quando os primeiros entregáveis estiverem disponíveis.';
  }

  get payment() {
    return architecturePaymentForProject(this.project);
  }

  get constructionPayment() {
    return this.project?.construction_payment;
  }

  get constructionQuote(): Quote | undefined {
    return this.project?.construction_quote;
  }

  get showConstructionSection(): boolean {
    const p = this.project?.contract_phase;
    return ['execution_quote', 'construction', 'completed', 'closed'].includes(p ?? '');
  }

  get canRequestConstructionQuoteBtn(): boolean {
    return this.project ? canRequestConstructionQuote(this.project) : false;
  }

  get requestConstructionTooltip(): string {
    return this.project ? requestConstructionQuoteTooltip(this.project) : '';
  }

  get canDownload(): boolean {
    return canCustomerDownload(this.project);
  }

  paymentLabel(status?: string): string {
    return paymentStatusLabel(status);
  }

  paymentClass(status?: string): string {
    return paymentCardClass(status);
  }

  formatMoney(v?: number | string): string {
    return formatMoneyMt(v);
  }

  downloadTooltip(): string {
    return downloadBlockedTooltip(this.project);
  }

  openProofDialog(payment = this.payment): void {
    if (!this.project || !payment?.id) return;
    const ref = this.dialog.open(SubmitPaymentProofDialogComponent, {
      width: '520px',
      data: {
        projectId: this.project.id,
        paymentId: payment.id,
        amount: payment.amount,
      },
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) this.reloadAll();
    });
  }

  openConstructionProofDialog(): void {
    this.openProofDialog(this.constructionPayment);
  }

  get briefingRows() {
    return briefingRowsFromRequest(this.project?.project_request);
  }

  get mockupUrl(): string | null {
    return approvedMockupUrl(this.project?.project_request);
  }

  get showMockup(): boolean {
    return hasApprovedMockup(this.project?.project_request);
  }

  formatDate(v?: string): string {
    if (!v) return '—';
    return new Date(v).toLocaleDateString('pt-MZ');
  }

  fileSize(d: ProjectDeliverable): string {
    return formatFileSize(d.size_bytes);
  }

  requestConstructionQuote(): void {
    if (!this.project) return;
    const ref = this.dialog.open(RequestConstructionQuoteDialogComponent, {
      width: '520px',
      data: { projectId: this.project.id },
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) this.reloadAll();
    });
  }

  acceptConstructionQuote(): void {
    const q = this.constructionQuote;
    if (!q?.id) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: {
        title: 'Aceitar orçamento de obra?',
        message: `Confirma a aceitação do orçamento de ${this.formatMoney(q.total_amount_mt)}?`,
        confirmText: 'Aceitar',
        cancelText: 'Cancelar',
        type: 'info',
      },
    });
    ref.afterClosed().subscribe((r) => {
      if (!r?.confirmed) return;
      this.portal.acceptQuote(q.id).subscribe({
        next: () => {
          this.notify.success('Orçamento de obra aceite.');
          this.reloadAll();
        },
        error: () => this.notify.error('Não foi possível aceitar.'),
      });
    });
  }

  rejectConstructionQuote(): void {
    const q = this.constructionQuote;
    if (!q?.id) return;
    const ref = this.dialog.open(RejectQuoteDialogComponent, { width: '440px' });
    ref.afterClosed().subscribe((reason) => {
      if (!reason) return;
      this.portal.rejectQuote(q.id, reason).subscribe({
        next: () => {
          this.notify.success('Orçamento recusado.');
          this.reloadAll();
        },
        error: () => this.notify.error('Não foi possível recusar.'),
      });
    });
  }

  download(d: ProjectDeliverable): void {
    if (!this.project) return;
    this.projects.downloadDeliverable('customer', this.project.id, d.id).subscribe({
      next: (res) => {
        const name = parseFilenameFromDisposition(
          res.headers.get('Content-Disposition'),
          d.file_name ?? `entregavel-${d.id}`
        );
        triggerBlobDownload(res.body!, name);
      },
      error: () => this.notify.error('Não foi possível descarregar o ficheiro.'),
    });
  }
}
