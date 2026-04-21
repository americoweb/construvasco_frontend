import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { ConfirmDialogComponent } from '../../../../shared/components/feedback/confirm-dialog/confirm-dialog.component';
import { NotificationService } from '../../../../shared/components/feedback/notification.service';

import { JobCardService } from '../shared/job-card.service';
import {
  JobCard,
  JobCardFile,
  JobCardStatus,
  JobCardPriority,
  JobCardFileType,
  FeedbackRole,
  JOB_CARD_STATUS_LABELS,
  JOB_CARD_STATUS_COLORS,
  JOB_CARD_STATUS_TRANSITIONS,
  JOB_CARD_PRIORITY_LABELS,
  JOB_CARD_PRIORITY_COLORS,
  AddFeedbackPayload
} from '../shared/job-card.types';

@Component({
  selector: 'app-job-card-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    PageHeaderComponent,
    ButtonComponent,
    MatDialogModule
  ],
  templateUrl: './job-card-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobCardDetailComponent implements OnInit, OnDestroy {
  jobCard: JobCard | null = null;
  loading = true;
  activeTab: 'info' | 'items' | 'files' | 'feedback' | 'design' = 'info';

  statusForm!: FormGroup;
  feedbackForm!: FormGroup;
  priorityForm!: FormGroup;

  updatingStatus   = false;
  addingFeedback   = false;
  updatingPriority = false;
  uploadingFile    = false;
  deletingFileId: number | null = null;

  showStatusPanel   = false;
  showFeedbackPanel = false;
  showPriorityPanel = false;
  showUploadPanel   = false;

  // ── Design workspace ──────────────────────────────────────────────────────
  designPrompt       = '';
  generatingDesign   = false;
  exportingPdf       = false;
  designStatus       = '';
  designError: string | null = null;

  /** Data URL from the latest AI generation (shown immediately before the file URL is ready) */
  generatedImageData: string | null = null;
  /** Persisted file URL (from JobCardFile once saved) */
  generatedImageUrl: string | null = null;
  /** The JobCardFile record for the current canvas image */
  currentDesignFile: JobCardFile | null = null;

  /** IDs of the two asset slots: logo and reference */
  selectedLogoFileId: number | null      = null;
  selectedReferenceFileId: number | null = null;

  // File upload state
  uploadFile: File | null = null;
  uploadType: JobCardFileType = JobCardFileType.BRIEFING;
  uploadNotes = '';
  readonly fileTypes: JobCardFileType[] = [
    JobCardFileType.BRIEFING,
    JobCardFileType.DESIGN,
    JobCardFileType.FINAL,
  ];
  readonly fileTypeLabels: Record<JobCardFileType, string> = {
    [JobCardFileType.BRIEFING]:  'Briefing',
    [JobCardFileType.REFERENCE]: 'Referência',
    [JobCardFileType.DESIGN]:    'Design',
    [JobCardFileType.PREVIEW]:   'Preview',
    [JobCardFileType.FINAL]:     'Arte Final',
  };

  readonly statusLabels     = JOB_CARD_STATUS_LABELS;
  readonly statusColors     = JOB_CARD_STATUS_COLORS;
  readonly priorityLabels   = JOB_CARD_PRIORITY_LABELS;
  readonly priorityColors   = JOB_CARD_PRIORITY_COLORS;
  readonly feedbackRoles    = Object.values(FeedbackRole);
  readonly allPriorities    = Object.values(JobCardPriority);

  get nextStatuses(): JobCardStatus[] {
    if (!this.jobCard) return [];
    return JOB_CARD_STATUS_TRANSITIONS[this.jobCard.status] ?? [];
  }

  get pageHeaderActions() {
    if (!this.jobCard) return [];
    const actions: any[] = [
      {
        label: 'Actualizar Status',
        icon: 'update',
        variant: 'primary' as const,
        callback: () => { this.showStatusPanel = !this.showStatusPanel; this.cdr.markForCheck(); }
      }
    ];
    if (this.jobCard.can_be_cancelled) {
      actions.push({
        label: 'Cancelar Job',
        icon: 'cancel',
        variant: 'danger' as const,
        callback: () => this.confirmCancel()
      });
    }
    return actions;
  }

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: JobCardService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private notification: NotificationService,
    public cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.buildForms();

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getJobCardDetail(id).subscribe({
      next: res => {
        this.jobCard = res.data ?? null;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.notification.show({ type: 'error', message: 'Erro ao carregar Job Card', title: 'Erro' });
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForms(): void {
    this.statusForm = this.fb.group({
      status: ['', Validators.required],
      notes:  ['']
    });

    this.feedbackForm = this.fb.group({
      comment:     ['', [Validators.required, Validators.maxLength(2000)]],
      role:        [FeedbackRole.COMERCIAL, Validators.required],
      is_approved: [false]
    });

    this.priorityForm = this.fb.group({
      priority:          [JobCardPriority.MEDIUM, Validators.required],
      priority_override: [false],
      priority_reason:   ['']
    });

    this.priorityForm.get('priority_override')!.valueChanges.subscribe(v => {
      const r = this.priorityForm.get('priority_reason')!;
      v ? r.setValidators([Validators.required]) : r.clearValidators();
      r.updateValueAndValidity();
      this.cdr.markForCheck();
    });
  }

  /** All image files attached to the job card */
  get imageFiles(): JobCardFile[] {
    return (this.jobCard?.files ?? []).filter(
      f => f.mime_type?.startsWith('image/')
    );
  }

  /** Design-type files (previous AI generations) */
  get designFiles(): JobCardFile[] {
    return (this.jobCard?.files ?? [])
      .filter(f => f.type === JobCardFileType.DESIGN && f.mime_type?.startsWith('image/'))
      .sort((a, b) => (b.version ?? 0) - (a.version ?? 0));
  }

  /** Display image on the canvas: prefer live data URL, then file URL */
  get canvasImage(): string | null {
    return this.generatedImageData ?? this.generatedImageUrl;
  }

  setTab(t: 'info' | 'items' | 'files' | 'feedback' | 'design'): void {
    this.activeTab = t;
    // Auto-fill prompt when entering design tab
    if (t === 'design' && !this.designPrompt) {
      this.autoFillPrompt();
    }
    // Load the latest design file into canvas if none active
    if (t === 'design' && !this.currentDesignFile && this.designFiles.length) {
      this.loadDesignVersion(this.designFiles[0]);
    }
    this.cdr.markForCheck();
  }

  // -------------------------------------------------------------------------
  // Status update
  // -------------------------------------------------------------------------

  submitStatus(): void {
    if (this.statusForm.invalid || !this.jobCard) return;
    this.updatingStatus = true;
    this.cdr.markForCheck();

    const { status, notes } = this.statusForm.value;
    this.service.updateStatus(this.jobCard.id, status as JobCardStatus, notes).subscribe({
      next: res => {
        this.jobCard = res.data ?? this.jobCard;
        this.showStatusPanel = false;
        this.statusForm.reset({ status: '', notes: '' });
        this.updatingStatus = false;
        this.notification.show({ type: 'success', message: 'Status actualizado', title: 'Sucesso' });
        this.cdr.markForCheck();
      },
      error: err => {
        this.updatingStatus = false;
        const msg = err?.error?.message ?? 'Erro ao actualizar status';
        this.notification.show({ type: 'error', message: msg, title: 'Erro' });
        this.cdr.markForCheck();
      }
    });
  }

  // -------------------------------------------------------------------------
  // Feedback
  // -------------------------------------------------------------------------

  submitFeedback(): void {
    if (this.feedbackForm.invalid || !this.jobCard) return;
    this.addingFeedback = true;
    this.cdr.markForCheck();

    const payload: AddFeedbackPayload = this.feedbackForm.value;
    this.service.addFeedback(this.jobCard.id, payload).subscribe({
      next: res => {
        if (res.data && this.jobCard) {
          this.jobCard.feedback = [...(this.jobCard.feedback ?? []), res.data];
        }
        this.feedbackForm.reset({ comment: '', role: FeedbackRole.COMERCIAL, is_approved: false });
        this.showFeedbackPanel = false;
        this.addingFeedback = false;
        this.notification.show({ type: 'success', message: 'Feedback adicionado', title: 'Sucesso' });
        this.cdr.markForCheck();
      },
      error: () => {
        this.addingFeedback = false;
        this.notification.show({ type: 'error', message: 'Erro ao adicionar feedback', title: 'Erro' });
        this.cdr.markForCheck();
      }
    });
  }

  // -------------------------------------------------------------------------
  // Priority
  // -------------------------------------------------------------------------

  submitPriority(): void {
    if (this.priorityForm.invalid || !this.jobCard) return;
    this.updatingPriority = true;
    this.cdr.markForCheck();

    this.service.updatePriority(this.jobCard.id, this.priorityForm.value).subscribe({
      next: res => {
        this.jobCard = res.data ?? this.jobCard;
        this.showPriorityPanel = false;
        this.updatingPriority = false;
        this.notification.show({ type: 'success', message: 'Prioridade actualizada', title: 'Sucesso' });
        this.cdr.markForCheck();
      },
      error: err => {
        this.updatingPriority = false;
        const msg = err?.error?.message ?? 'Erro ao actualizar prioridade';
        this.notification.show({ type: 'error', message: msg, title: 'Erro' });
        this.cdr.markForCheck();
      }
    });
  }

  removeOverride(): void {
    if (!this.jobCard) return;
    this.service.removeOverride(this.jobCard.id).subscribe({
      next: res => {
        this.jobCard = res.data ?? this.jobCard;
        this.notification.show({ type: 'success', message: 'Override removido', title: 'Sucesso' });
        this.cdr.markForCheck();
      }
    });
  }

  // -------------------------------------------------------------------------
  // Cancel
  // -------------------------------------------------------------------------

  confirmCancel(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancelar Job Card',
        message: `Tem a certeza que deseja cancelar o job "${this.jobCard?.job_number}"?`,
        confirmText: 'Cancelar Job',
        cancelText: 'Não',
        type: 'danger'
      }
    });
    ref.afterClosed().subscribe(result => {
      if (result?.confirmed && this.jobCard) {
        this.service.cancel(this.jobCard.id).subscribe({
          next: res => {
            this.jobCard = res.data ?? this.jobCard;
            this.notification.show({ type: 'success', message: 'Job Card cancelado', title: 'Sucesso' });
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  // -------------------------------------------------------------------------
  // Files
  // -------------------------------------------------------------------------

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.uploadFile = input.files?.[0] ?? null;
    this.cdr.markForCheck();
  }

  submitUpload(): void {
    if (!this.uploadFile || !this.jobCard) return;
    this.uploadingFile = true;
    this.cdr.markForCheck();

    this.service.uploadFile(this.jobCard.id, this.uploadFile, this.uploadType, this.uploadNotes)
      .subscribe({
        next: res => {
          if (res.data && this.jobCard) {
            this.jobCard = {
              ...this.jobCard,
              files: [res.data, ...(this.jobCard.files ?? [])]
            };
          }
          this.uploadFile  = null;
          this.uploadNotes = '';
          this.showUploadPanel = false;
          this.uploadingFile = false;
          this.notification.show({ type: 'success', message: 'Ficheiro carregado. A sincronizar com Drive...', title: 'Sucesso' });
          this.cdr.markForCheck();
        },
        error: err => {
          this.uploadingFile = false;
          const msg = err?.error?.message ?? 'Erro ao carregar ficheiro';
          this.notification.show({ type: 'error', message: msg, title: 'Erro' });
          this.cdr.markForCheck();
        }
      });
  }

  confirmDeleteFile(fileId: number): void {
    if (!this.jobCard) return;
    this.deletingFileId = fileId;
    this.cdr.markForCheck();

    this.service.deleteFile(this.jobCard.id, fileId).subscribe({
      next: () => {
        if (this.jobCard) {
          this.jobCard = {
            ...this.jobCard,
            files: (this.jobCard.files ?? []).filter(f => f.id !== fileId)
          };
        }
        this.deletingFileId = null;
        this.notification.show({ type: 'success', message: 'Ficheiro eliminado', title: 'Sucesso' });
        this.cdr.markForCheck();
      },
      error: () => {
        this.deletingFileId = null;
        this.notification.show({ type: 'error', message: 'Erro ao eliminar ficheiro', title: 'Erro' });
        this.cdr.markForCheck();
      }
    });
  }

  // -------------------------------------------------------------------------
  // Design workspace
  // -------------------------------------------------------------------------

  autoFillPrompt(): void {
    if (!this.jobCard) return;
    const jc = this.jobCard;
    const parts: string[] = [`Cria um design profissional para: ${jc.title}`];
    if (jc.objective)   parts.push(`Objectivo: ${jc.objective}`);
    if (jc.description) parts.push(`Descrição: ${jc.description}`);
    if (jc.items?.length) {
      const items = jc.items.map(i => `${i.quantity}× ${i.product_type}`).join(', ');
      parts.push(`Itens: ${items}`);
    }
    if (jc.client?.name) parts.push(`Cliente: ${jc.client.name}`);
    this.designPrompt = parts.join('. ') + '.';
    this.cdr.markForCheck();
  }

  /** Toggle an image file as logo (1st slot) or reference (2nd slot). */
  toggleAsset(file: JobCardFile): void {
    if (this.selectedLogoFileId === file.id) {
      this.selectedLogoFileId = null;
    } else if (this.selectedReferenceFileId === file.id) {
      this.selectedReferenceFileId = null;
    } else if (!this.selectedLogoFileId) {
      this.selectedLogoFileId = file.id;
    } else if (!this.selectedReferenceFileId) {
      this.selectedReferenceFileId = file.id;
    } else {
      // Both slots taken — replace the logo slot
      this.selectedLogoFileId = file.id;
    }
    this.cdr.markForCheck();
  }

  assetSlot(file: JobCardFile): 'logo' | 'ref' | null {
    if (this.selectedLogoFileId      === file.id) return 'logo';
    if (this.selectedReferenceFileId === file.id) return 'ref';
    return null;
  }

  generateDesign(): void {
    if (!this.jobCard) return;
    this.generatingDesign = true;
    this.designError      = null;
    this.designStatus     = 'A processar...';
    this.generatedImageData = null;
    this.cdr.markForCheck();

    this.service.generateDesign(this.jobCard.id, {
      prompt:             this.designPrompt || undefined,
      logo_file_id:       this.selectedLogoFileId,
      reference_file_id:  this.selectedReferenceFileId,
    }).subscribe({
      next: res => {
        const d = (res as any).data;
        this.generatedImageData = d.image_data;
        this.generatedImageUrl  = d.image_url;
        this.currentDesignFile  = d.file;
        this.designPrompt       = d.prompt;

        // Prepend new file to the job card file list
        if (this.jobCard && d.file) {
          this.jobCard = {
            ...this.jobCard,
            files: [d.file, ...(this.jobCard.files ?? [])]
          };
        }

        this.generatingDesign = false;
        this.designStatus     = '';
        this.notification.show({ type: 'success', message: 'Design gerado com sucesso!', title: 'Design' });
        this.cdr.markForCheck();
      },
      error: err => {
        this.generatingDesign = false;
        this.designStatus     = '';
        this.designError      = err?.error?.message ?? 'Erro ao gerar design';
        this.cdr.markForCheck();
      }
    });
  }

  loadDesignVersion(file: JobCardFile): void {
    this.currentDesignFile  = file;
    this.generatedImageUrl  = file.file_url;
    this.generatedImageData = null;
    this.cdr.markForCheck();
  }

  downloadDesign(): void {
    const src = this.generatedImageData ?? this.generatedImageUrl;
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = this.currentDesignFile?.file_name ?? 'design.png';
    a.click();
  }

  exportCmykPdf(): void {
    if (!this.jobCard || !this.currentDesignFile) return;
    this.exportingPdf = true;
    this.cdr.markForCheck();

    this.service.exportDesignPdf(this.jobCard.id, this.currentDesignFile.id).subscribe({
      next: (blob: Blob) => {
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `print_${this.jobCard!.job_number}_v${this.currentDesignFile!.version}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.exportingPdf = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.exportingPdf = false;
        this.notification.show({ type: 'error', message: 'Erro ao exportar PDF', title: 'Erro' });
        this.cdr.markForCheck();
      }
    });
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  goBack(): void { this.router.navigate(['/admin/job-cards/list']); }

  isOverrideFormActive(): boolean { return !!this.priorityForm.get('priority_override')?.value; }
}
