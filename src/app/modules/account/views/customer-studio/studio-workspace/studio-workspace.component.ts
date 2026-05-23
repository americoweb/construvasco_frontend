import {
  Component,
  Input,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, takeUntil, timeout, catchError, throwError } from 'rxjs';
import { ModalService } from '../../../../../shared/components/feedback/modal.service';
import { studioConfirm } from '../studio-dialogs';
import { AiGenerationService } from '../../../../../shared/construction/ai-generation.service';
import { StudioStateService } from '../studio-state.service';
import { GenerationGalleryComponent } from '../generation-gallery/generation-gallery.component';
import { AiGenerationRecord } from '../../../../../shared/construction/construction.types';

@Component({
  selector: 'app-studio-workspace',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    GenerationGalleryComponent,
  ],
  templateUrl: './studio-workspace.component.html',
  styleUrls: ['./studio-workspace.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudioWorkspaceComponent implements OnDestroy {
  @Input({ required: true }) requestId!: number;
  @Input({ required: true }) disclaimer = '';

  refineFeedback = new FormControl('', [Validators.maxLength(1000)]);
  selectedForRefine: AiGenerationRecord | null = null;
  showSuperseded = false;
  errorMessage = '';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private ai: AiGenerationService,
    public studioState: StudioStateService,
    private cdr: ChangeDetectorRef,
    private modal: ModalService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get state() {
    return this.studioState.snapshot;
  }

  get generations(): AiGenerationRecord[] {
    const all = (this.state?.generations ?? []).filter((g) => g.status !== 'failed');
    if (this.showSuperseded) {
      return all;
    }
    return all.filter((g) => g.status !== 'superseded');
  }

  get approvedId(): number | null {
    const id = this.state?.draft?.approved_ai_generation_id;
    return id != null ? Number(id) : null;
  }

  get isGenerating(): boolean {
    return this.studioState.isGenerating;
  }

  generate(): void {
    const balance = this.state?.credits_balance ?? 0;
    const cost = this.state?.cost_per_generation ?? 1;
    if (balance < cost) {
      this.openNoCreditsDialog(balance, cost);
      return;
    }
    this.runGeneration({
      type: 'facade_render',
      project_request_id: this.requestId,
    });
  }

  onRefineClick(g: AiGenerationRecord): void {
    this.selectedForRefine = g;
    this.refineFeedback.reset('');
    this.cdr.markForCheck();
  }

  async confirmRefine(): Promise<void> {
    if (!this.selectedForRefine) {
      return;
    }
    const balance = this.state?.credits_balance ?? 0;
    const cost = this.state?.cost_per_generation ?? 1;
    if (balance < cost) {
      this.openNoCreditsDialog(balance, cost);
      return;
    }
    const ok = await studioConfirm(this.modal, {
      title: 'Refinar mockup',
      message: `Refinar consome ${cost} crédito${cost > 1 ? 's' : ''}. Tens ${balance} créditos. Continuar?`,
      confirmText: 'Continuar',
      cancelText: 'Cancelar',
      type: 'warning',
    });
    if (!ok) {
      return;
    }
    const parent = this.selectedForRefine;
    const prompt = (parent.prompt ?? 'Renderização arquitectónica').trim();
    const feedback = (this.refineFeedback.value ?? '').trim();
    this.selectedForRefine = null;
    this.runRefine(parent.id, prompt, feedback);
  }

  async approve(g: AiGenerationRecord): Promise<void> {
    const text =
      'Os mockups são referências visuais para a Construvasco compreender o que pretende. O projecto técnico (plantas, peças desenhadas, memória descritiva) é elaborado pela nossa equipa após aceitar o orçamento.\n\nAprovar este mockup como referência principal?';
    const ok = await studioConfirm(this.modal, {
      title: 'Aprovar mockup',
      message: text,
      confirmText: 'Aprovar',
      cancelText: 'Cancelar',
      type: 'info',
    });
    if (!ok) {
      return;
    }
    this.ai
      .approve(this.requestId, g.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.studioState.load().subscribe(() => this.cdr.markForCheck());
        },
        error: () => {
          this.errorMessage = 'Não foi possível aprovar o mockup.';
          this.cdr.markForCheck();
        },
      });
  }

  private runRefine(generationId: number, designPrompt: string, feedback: string): void {
    this.errorMessage = '';
    this.studioState.setGenerating(true);
    this.cdr.markForCheck();

    this.ai
      .refine(generationId, designPrompt, feedback)
      .pipe(timeout(90000), takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.studioState.setGenerating(false);
          this.studioState.load().subscribe(() => this.cdr.markForCheck());
        },
        error: (err: HttpErrorResponse | Error) => this.handleGenError(err),
      });
  }

  private runGeneration(payload: Record<string, unknown>): void {
    this.errorMessage = '';
    this.studioState.setGenerating(true);
    this.cdr.markForCheck();

    this.ai
      .generate(payload)
      .pipe(
        timeout(90000),
        takeUntil(this.destroy$),
        catchError((err: unknown) => {
          if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'TimeoutError') {
            return throwError(() => new Error('A geração demorou demasiado (90s). Tente novamente.'));
          }
          return throwError(() => err);
        })
      )
      .subscribe({
        next: () => {
          this.studioState.setGenerating(false);
          this.studioState.load().subscribe(() => this.cdr.markForCheck());
        },
        error: (err: HttpErrorResponse | Error) => this.handleGenError(err),
      });
  }

  private handleGenError(err: HttpErrorResponse | Error): void {
    this.studioState.setGenerating(false);
    if (err instanceof HttpErrorResponse && err.status === 402) {
      const balance = this.state?.credits_balance ?? 0;
      const cost = this.state?.cost_per_generation ?? 1;
      this.openNoCreditsDialog(balance, cost);
    } else {
      this.errorMessage =
        err instanceof Error ? err.message : (err as HttpErrorResponse).error?.message ?? 'Falha na geração.';
    }
    this.cdr.markForCheck();
  }

  private async openNoCreditsDialog(balance: number, cost: number): Promise<void> {
    await studioConfirm(this.modal, {
      title: 'Créditos insuficientes',
      message: `Créditos insuficientes. Precisa de ${cost} crédito(s) e tem ${balance}. Contacte a Construvasco para obter mais créditos.`,
      confirmText: 'OK',
      cancelText: 'Fechar',
      type: 'info',
    });
  }
}
