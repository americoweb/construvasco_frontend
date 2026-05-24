import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConstructionProjectService, ProjectApiRole } from '../../../shared/construction/construction-project.service';
import { UserService } from '../../../core/auth/services/user.service';
import {
  AssignableUser,
  ConstructionProject,
  ProjectDeliverable,
} from '../../../shared/construction/construction.types';
import { NotificationService } from '../../../shared/components/feedback/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/feedback/confirm-dialog/confirm-dialog.component';
import { SubmitDeliverableDialogComponent } from './submit-deliverable-dialog.component';
import { RejectDeliverableDialogComponent } from './reject-deliverable-dialog.component';
import { RejectPaymentProofDialogComponent } from './reject-payment-proof-dialog.component';
import { SendConstructionQuoteDialogComponent } from './send-construction-quote-dialog.component';
import { contractPhaseLabel } from '../../../shared/construction/contract-phase.util';
import { formatMoneyMt, paymentStatusLabel } from '../../../shared/construction/payment.util';
import {
  approvedMockupUrl,
  briefingRowsFromRequest,
  hasApprovedMockup,
} from '../../../shared/construction/project-briefing.util';
import {
  deliverableStatusClass,
  deliverableStatusLabel,
  formatFileSize,
  isDeliverablePendingReview,
  normalizeDeliverableStatus,
  parseFilenameFromDisposition,
  triggerBlobDownload,
} from '../../../shared/construction/deliverable.util';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailComponent implements OnInit {
  loading = true;
  deliverablesLoading = false;
  assigning = false;
  actionDeliverableId: number | null = null;
  markingArchitecture = false;
  actionPayment = false;
  actionConstructionPayment = false;
  markingConstruction = false;

  project: ConstructionProject | null = null;
  deliverables: ProjectDeliverable[] = [];
  technicians: AssignableUser[] = [];
  selectedTechnicianId: number | null = null;

  isAdmin = false;
  isTechnicianView = false;
  isManagerView = false;
  userRole = '';
  apiRole: ProjectApiRole = 'manager';
  private projectId = '';

  constructor(
    private route: ActivatedRoute,
    private projects: ConstructionProjectService,
    private userService: UserService,
    private notify: NotificationService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userRole = String(this.userService.user?.current_tenant_context?.role ?? '').toLowerCase();
    this.apiRole = this.projects.resolveApiRole(this.userRole);
    this.isAdmin = this.userRole === 'admin';
    this.isTechnicianView = this.apiRole === 'technician';
    this.isManagerView = !this.isTechnicianView;

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.projectId = id;

    if (this.isManagerView) {
      this.projects.assignableUsers().subscribe({
        next: (res) => {
          this.technicians = res.data ?? [];
          this.cdr.markForCheck();
        },
      });
    }

    this.reloadAll();
  }

  private reloadAll(): void {
    this.reloadProject();
    this.reloadDeliverables();
  }

  private reloadProject(): void {
    this.loading = true;
    this.projects.getForRole(this.projectId, this.userRole).subscribe({
      next: (res) => {
        this.project = res.data;
        const main = res.data.assignments?.find((a) => a.assignment_role === 'main');
        this.selectedTechnicianId = main?.assigned_user?.id ?? main?.assigned_to ?? null;
        this.loading = false;
        this.cdr.markForCheck();
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
    this.projects.listDeliverables(this.apiRole, this.projectId).subscribe({
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

  get phaseLabel(): string {
    return contractPhaseLabel(
      this.project?.contract_phase_label ?? this.project?.contract_phase,
      this.project?.current_phase
    );
  }

  get showConstructionPhase(): boolean {
    const p = this.project?.contract_phase;
    return ['execution_quote', 'construction', 'completed', 'closed'].includes(p ?? '');
  }

  get clientDisplayName(): string {
    return this.project?.client?.name ?? this.project?.project_request?.client?.name ?? '—';
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

  get hasApprovedDeliverable(): boolean {
    return this.deliverables.some((d) => normalizeDeliverableStatus(d.status) === 'approved');
  }

  get canMarkArchitectureDelivered(): boolean {
    if (!this.isManagerView || !this.project) return false;
    const phase = this.project.contract_phase ?? this.project.current_phase;
    if (phase !== 'architecture') return false;
    if (this.project.architecture_completed_at) return false;
    return this.hasApprovedDeliverable;
  }

  get architectureDeliveredLabel(): string | null {
    if (!this.project?.architecture_completed_at) return null;
    const date = new Date(this.project.architecture_completed_at).toLocaleDateString('pt-MZ');
    return `Arquitectura entregue em ${date}`;
  }

  statusLabel(d: ProjectDeliverable): string {
    return deliverableStatusLabel(d.status);
  }

  statusClass(d: ProjectDeliverable): string {
    return deliverableStatusClass(d.status);
  }

  fileSize(d: ProjectDeliverable): string {
    return formatFileSize(d.size_bytes);
  }

  formatDate(v?: string): string {
    if (!v) return '—';
    return new Date(v).toLocaleDateString('pt-MZ');
  }

  canApprove(d: ProjectDeliverable): boolean {
    return this.isManagerView && isDeliverablePendingReview(d);
  }

  canReject(d: ProjectDeliverable): boolean {
    return this.canApprove(d);
  }

  isRejected(d: ProjectDeliverable): boolean {
    return normalizeDeliverableStatus(d.status) === 'rejected';
  }

  assign(): void {
    if (!this.project || !this.selectedTechnicianId) {
      this.notify.error('Seleccione um técnico.');
      return;
    }
    this.assigning = true;
    const assign$ = this.isAdmin
      ? this.projects.assignAdmin(this.project.id, this.selectedTechnicianId)
      : this.projects.assignManager(this.project.id, this.selectedTechnicianId);

    assign$.subscribe({
      next: () => {
        this.notify.success('Técnico atribuído.');
        this.assigning = false;
        this.reloadProject();
      },
      error: () => {
        this.assigning = false;
        this.notify.error('Erro ao atribuir técnico.');
        this.cdr.markForCheck();
      },
    });
  }

  openSubmitDialog(): void {
    if (!this.project) return;
    const ref = this.dialog.open(SubmitDeliverableDialogComponent, {
      width: '520px',
      disableClose: true,
      data: { projectId: this.project.id },
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) this.reloadDeliverables();
    });
  }

  approve(d: ProjectDeliverable): void {
    if (!this.project) return;
    this.actionDeliverableId = d.id;
    this.projects.approveDeliverable(this.project.id, d.id).subscribe({
      next: () => {
        this.notify.success('Entregável aprovado. Cliente será notificado.');
        this.actionDeliverableId = null;
        this.reloadAll();
      },
      error: () => {
        this.actionDeliverableId = null;
        this.notify.error('Não foi possível aprovar.');
        this.cdr.markForCheck();
      },
    });
  }

  reject(d: ProjectDeliverable): void {
    if (!this.project) return;
    const ref = this.dialog.open(RejectDeliverableDialogComponent, { width: '480px' });
    ref.afterClosed().subscribe((reason) => {
      if (!reason) return;
      this.actionDeliverableId = d.id;
      this.projects.rejectDeliverable(this.project!.id, d.id, reason).subscribe({
        next: () => {
          this.notify.success('Entregável rejeitado. Técnico vai ser notificado para refazer.');
          this.actionDeliverableId = null;
          this.reloadDeliverables();
        },
        error: () => {
          this.actionDeliverableId = null;
          this.notify.error('Não foi possível rejeitar.');
          this.cdr.markForCheck();
        },
      });
    });
  }

  markArchitectureDelivered(): void {
    if (!this.project) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: {
        title: 'Marcar arquitectura entregue',
        message:
          'Confirmar que a arquitectura está concluída? O cliente vai ser notificado e poderá pedir orçamento de obra.',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        type: 'info',
      },
    });
    ref.afterClosed().subscribe((result) => {
      if (!result?.confirmed) return;
      this.markingArchitecture = true;
      this.projects.markArchitectureDelivered(this.project!.id).subscribe({
        next: (res) => {
          this.project = { ...this.project!, ...res.data };
          this.markingArchitecture = false;
          this.notify.success('Arquitectura marcada como entregue.');
          this.reloadProject();
        },
        error: () => {
          this.markingArchitecture = false;
          this.notify.error('Não foi possível marcar como entregue.');
          this.cdr.markForCheck();
        },
      });
    });
  }

  get payment() {
    return this.project?.architecture_payment ?? this.project?.payment;
  }

  get constructionPayment() {
    return this.project?.construction_payment;
  }

  get canSendConstructionQuote(): boolean {
    return (
      this.isManagerView &&
      this.project?.contract_phase === 'execution_quote' &&
      !!this.project?.construction_quote_requested_at &&
      !this.project?.construction_quote
    );
  }

  get canMarkConstructionCompleted(): boolean {
    return (
      this.isManagerView &&
      this.project?.contract_phase === 'construction' &&
      this.constructionPayment?.status === 'confirmed'
    );
  }

  sendConstructionQuote(): void {
    const reqId = this.project?.project_request?.id;
    if (!reqId) return;
    const ref = this.dialog.open(SendConstructionQuoteDialogComponent, {
      width: '520px',
      data: {
        requestId: reqId,
        suggestedVisitDate: this.project?.suggested_visit_date,
        constructionRequestNotes: this.project?.construction_request_notes,
      },
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) this.reloadAll();
    });
  }

  markConstructionCompleted(): void {
    if (!this.project) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: {
        title: 'Marcar obra concluída?',
        message: 'Confirmar que a obra está concluída? O cliente será notificado.',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        type: 'info',
      },
    });
    ref.afterClosed().subscribe((r) => {
      if (!r?.confirmed) return;
      this.markingConstruction = true;
      this.projects.markConstructionCompleted(this.project!.id).subscribe({
        next: () => {
          this.markingConstruction = false;
          this.notify.success('Obra marcada como concluída.');
          this.reloadAll();
        },
        error: () => {
          this.markingConstruction = false;
          this.notify.error('Não foi possível concluir.');
          this.cdr.markForCheck();
        },
      });
    });
  }

  confirmConstructionPayment(): void {
    this.confirmPaymentFor(this.constructionPayment, 'obra');
  }

  rejectConstructionPayment(): void {
    this.rejectPaymentFor(this.constructionPayment);
  }

  downloadConstructionProof(): void {
    this.downloadProofFor(this.constructionPayment);
  }

  formatMoney(v?: number | string): string {
    return formatMoneyMt(v);
  }

  paymentStatus(s?: string): string {
    return paymentStatusLabel(s);
  }

  confirmPayment(): void {
    this.confirmPaymentFor(this.payment, 'arquitectura');
  }

  rejectPayment(): void {
    this.rejectPaymentFor(this.payment);
  }

  downloadProof(): void {
    this.downloadProofFor(this.payment);
  }

  private confirmPaymentFor(
    pay: { id?: number } | null | undefined,
    label: string
  ): void {
    if (!this.project || !pay?.id) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: {
        title: 'Confirmar pagamento?',
        message:
          label === 'obra'
            ? 'O cliente será notificado da confirmação do pagamento de obra.'
            : 'O cliente receberá notificação e poderá descarregar os entregáveis.',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        type: 'info',
      },
    });
    ref.afterClosed().subscribe((r) => {
      if (!r?.confirmed) return;
      const isConst = pay === this.constructionPayment;
      if (isConst) this.actionConstructionPayment = true;
      else this.actionPayment = true;
      this.projects.confirmPayment(this.project!.id, pay.id!).subscribe({
        next: () => {
          this.actionPayment = false;
          this.actionConstructionPayment = false;
          this.notify.success('Pagamento confirmado.');
          this.reloadAll();
        },
        error: () => {
          this.actionPayment = false;
          this.actionConstructionPayment = false;
          this.notify.error('Não foi possível confirmar.');
          this.cdr.markForCheck();
        },
      });
    });
  }

  private rejectPaymentFor(pay: { id?: number } | null | undefined): void {
    if (!this.project || !pay?.id) return;
    const ref = this.dialog.open(RejectPaymentProofDialogComponent, { width: '480px' });
    ref.afterClosed().subscribe((reason) => {
      if (!reason) return;
      const isConst = pay === this.constructionPayment;
      if (isConst) this.actionConstructionPayment = true;
      else this.actionPayment = true;
      this.projects.rejectPayment(this.project!.id, pay.id!, reason).subscribe({
        next: () => {
          this.actionPayment = false;
          this.actionConstructionPayment = false;
          this.notify.success('Comprovativo rejeitado. Cliente notificado para resubmeter.');
          this.reloadAll();
        },
        error: () => {
          this.actionPayment = false;
          this.actionConstructionPayment = false;
          this.notify.error('Não foi possível rejeitar.');
          this.cdr.markForCheck();
        },
      });
    });
  }

  private downloadProofFor(pay: { id?: number; proof_file_name?: string } | null | undefined): void {
    if (!this.project || !pay?.id) return;
    this.projects.downloadPaymentProof(this.project.id, pay.id).subscribe({
      next: (res) => {
        const name = parseFilenameFromDisposition(
          res.headers.get('Content-Disposition'),
          pay.proof_file_name ?? 'comprovativo'
        );
        triggerBlobDownload(res.body!, name);
      },
      error: () => this.notify.error('Não foi possível descarregar o comprovativo.'),
    });
  }

  download(d: ProjectDeliverable): void {
    if (!this.project) return;
    this.projects.downloadDeliverable(this.apiRole, this.project.id, d.id).subscribe({
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
