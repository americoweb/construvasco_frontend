import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { StudioStateService } from './studio-state.service';
import { StudioService } from '../../../../shared/construction/studio.service';
import { CustomerPortalService } from '../../../../shared/construction/customer-portal.service';
import { CreditsBalanceCardComponent } from './credits-balance-card/credits-balance-card.component';
import { WizardStepProjectComponent } from './wizard-step-project/wizard-step-project.component';
import { WizardStepBriefingComponent } from './wizard-step-briefing/wizard-step-briefing.component';
import { WizardStepReferencesComponent } from './wizard-step-references/wizard-step-references.component';
import { StudioWorkspaceComponent } from './studio-workspace/studio-workspace.component';
import {
  createBriefingStepForm,
  createProjectStepForm,
  briefingFormToPayload,
} from './studio-briefing.schema';
import { StudioCanDeactivate } from './studio-can-deactivate.guard';
import { ModalService } from '../../../../shared/components/feedback/modal.service';
import { studioConfirm } from './studio-dialogs';
import { ProjectDocument } from '../../../../shared/construction/construction.types';

const STEP_LABELS = ['Projecto', 'Briefing', 'Referências', 'Estúdio', 'Revisão'];

@Component({
  selector: 'app-customer-studio',
  standalone: true,
  providers: [StudioStateService],
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    CreditsBalanceCardComponent,
    WizardStepProjectComponent,
    WizardStepBriefingComponent,
    WizardStepReferencesComponent,
    StudioWorkspaceComponent,
  ],
  templateUrl: './customer-studio.component.html',
  styleUrls: ['./customer-studio.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerStudioComponent implements OnInit, OnDestroy, StudioCanDeactivate {
  readonly stepLabels = STEP_LABELS;
  currentStep = 0;
  loading = true;
  saving = false;
  submitting = false;
  documents: ProjectDocument[] = [];
  uploading = false;

  projectForm = createProjectStepForm();
  briefingForm = createBriefingStepForm();

  private readonly destroy$ = new Subject<void>();

  constructor(
    public studioState: StudioStateService,
    private studioApi: StudioService,
    private portal: CustomerPortalService,
    private route: ActivatedRoute,
    private router: Router,
    private snack: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private modal: ModalService
  ) {}

  ngOnInit(): void {
    this.studioState
      .load()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.hydrateForms();
          this.documents = this.studioState.snapshot?.draft.documents ?? [];
          this.loading = false;
          this.maybeShowContinueDialog();
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  canLeaveStudio(): boolean {
    return !this.studioState.isGenerating;
  }

  get draftId(): number | null {
    return this.studioState.snapshot?.draft.id ?? null;
  }

  get disclaimer(): string {
    return this.studioState.snapshot?.disclaimer ?? '';
  }

  get creditsBalance(): number {
    return this.studioState.snapshot?.credits_balance ?? 0;
  }

  get costPerGeneration(): number {
    return this.studioState.snapshot?.cost_per_generation ?? 1;
  }

  get hasApprovedMockup(): boolean {
    return !!this.studioState.snapshot?.draft.approved_ai_generation_id;
  }

  private async maybeShowContinueDialog(): Promise<void> {
    const wantsNew = this.route.snapshot.queryParamMap.get('new') === '1';
    if (!wantsNew || !this.studioState.snapshot?.has_meaningful_content) {
      return;
    }
    const cont = await studioConfirm(this.modal, {
      title: 'Rascunho existente',
      message:
        'Tem um projecto em rascunho. Deseja continuar onde ficou?\n\nContinuar = retomar o rascunho\nRecomeçar = novo projecto do zero',
      confirmText: 'Continuar',
      cancelText: 'Recomeçar',
      type: 'info',
    });
    if (!cont) {
      this.studioState.reset().pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.currentStep = 0;
          this.hydrateForms();
          this.documents = [];
          this.cdr.markForCheck();
        },
      });
    }
  }

  private hydrateForms(): void {
    const d = this.studioState.snapshot?.draft;
    if (!d) {
      return;
    }
    this.projectForm.patchValue({
      title: d.title ?? '',
      project_type: d.project_type ?? '',
      tipologia: d.tipologia ?? '',
    });
    this.briefingForm.patchValue({
      localizacao: d.localizacao ?? '',
      area_m2: d.area_m2 ?? null,
      num_pisos: d.num_pisos ?? null,
      estilo_arquitectonico: d.estilo_arquitectonico ?? '',
      paleta_acabamento: d.paleta_acabamento ?? '',
    });
  }

  prev(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.cdr.markForCheck();
    }
  }

  next(): void {
    if (this.currentStep === 0 && this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }
    if (this.currentStep === 1 && this.briefingForm.invalid) {
      this.briefingForm.markAllAsTouched();
      return;
    }
    if (this.currentStep <= 1) {
      this.persistStep(() => {
        this.currentStep++;
        this.cdr.markForCheck();
      });
      return;
    }
    if (this.currentStep < 4) {
      this.currentStep++;
      this.cdr.markForCheck();
    }
  }

  private persistStep(done: () => void): void {
    const id = this.draftId;
    if (!id) {
      return;
    }
    this.saving = true;
    let payload: Record<string, unknown> = {};
    if (this.currentStep === 0) {
      payload = this.projectForm.getRawValue();
    } else if (this.currentStep === 1) {
      const b = briefingFormToPayload(this.briefingForm);
      payload = {
        ...b,
        briefing_data: b,
      };
    }
    this.studioApi.saveDraft(id, payload).subscribe({
      next: (res) => {
        this.studioState.patchLocal({ draft: res.data });
        this.saving = false;
        done();
        this.cdr.markForCheck();
      },
      error: () => {
        this.saving = false;
        this.snack.open('Erro ao guardar. Tente novamente.', 'Fechar', { duration: 4000 });
        this.cdr.markForCheck();
      },
    });
  }

  onFilesSelected(files: FileList): void {
    const id = this.draftId;
    if (!id) {
      return;
    }
    this.uploading = true;
    const uploads = Array.from(files).map((file) =>
      this.portal.uploadDocument(id, file, 'reference')
    );
    let completed = 0;
    uploads.forEach((obs) =>
      obs.subscribe({
        next: () => {
          completed++;
          if (completed === uploads.length) {
            this.reloadDocuments();
          }
        },
        error: () => {
          this.uploading = false;
          this.snack.open('Falha no upload.', 'Fechar', { duration: 4000 });
          this.cdr.markForCheck();
        },
      })
    );
  }

  private reloadDocuments(): void {
    const id = this.draftId;
    if (!id) {
      return;
    }
    this.portal.getRequest(id).subscribe({
      next: (res) => {
        this.documents = res.data.documents ?? [];
        this.uploading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.uploading = false;
        this.cdr.markForCheck();
      },
    });
  }

  async submitRequest(): Promise<void> {
    const id = this.draftId;
    if (!id) {
      return;
    }
    if (!this.hasApprovedMockup) {
      const ok = await studioConfirm(this.modal, {
        title: 'Submeter sem mockup',
        message:
          'Não aprovou nenhum mockup. A Construvasco vai usar o seu briefing escrito como referência. Continuar?',
        confirmText: 'Continuar',
        cancelText: 'Cancelar',
        type: 'warning',
      });
      if (!ok) {
        return;
      }
    }
    this.submitting = true;
    this.portal.submitRequest(id).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/conta/pedidos', id], {
          queryParams: { submitted: '1' },
        });
      },
      error: () => {
        this.submitting = false;
        this.snack.open('Não foi possível submeter o pedido.', 'Fechar', { duration: 5000 });
        this.cdr.markForCheck();
      },
    });
  }
}
