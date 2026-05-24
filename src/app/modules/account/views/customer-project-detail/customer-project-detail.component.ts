import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomerPortalService } from '../../../../shared/construction/customer-portal.service';
import { ConstructionProjectService } from '../../../../shared/construction/construction-project.service';
import {
  ConstructionProject,
  ProjectDeliverable,
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
    private cdr: ChangeDetectorRef
  ) {}

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
    if (this.project?.architecture_completed_at) {
      const date = new Date(this.project.architecture_completed_at).toLocaleDateString('pt-MZ');
      return `Arquitectura concluída em ${date}`;
    }
    const phase = this.project?.contract_phase ?? this.project?.current_phase;
    if (phase === 'architecture') return 'Em arquitectura';
    return phase ?? '—';
  }

  get statusMessage(): string {
    if (this.project?.architecture_completed_at) {
      return 'Arquitectura concluída. Pode agora solicitar o orçamento de obra.';
    }
    if (this.deliverables.length) {
      return 'Tem entregáveis disponíveis para descarregar.';
    }
    return 'A nossa equipa está a trabalhar no seu projecto. Será notificado quando os primeiros entregáveis estiverem disponíveis.';
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
    this.notify.info('Funcionalidade em breve.');
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
