import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ConstructionProjectService } from '../../../../shared/construction/construction-project.service';
import { NotificationService } from '../../../../shared/components/feedback/notification.service';
import { formatMoneyMt, validatePaymentProofFile } from '../../../../shared/construction/payment.util';

export interface SubmitPaymentProofDialogData {
  projectId: number;
  paymentId: number;
  amount?: number | string;
}

@Component({
  selector: 'app-submit-payment-proof-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  template: `
    <h2 mat-dialog-title>Submeter comprovativo</h2>
    <mat-dialog-content class="!pt-2 space-y-4">
      <p class="text-sm text-slate-600">
        Carregue o comprovativo do pagamento de {{ amountLabel }}. Aceita PDF, PNG ou JPG até 10 MB.
      </p>
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Notas (opcional)</mat-label>
        <textarea matInput rows="3" [formControl]="notes" placeholder="Ex: M-Pesa em 23/05/2026, ref 12345"></textarea>
      </mat-form-field>
      <input type="file" #fileInput hidden accept=".pdf,.png,.jpg,.jpeg" (change)="onFile($event)" />
      <button mat-stroked-button type="button" [disabled]="uploading" (click)="fileInput.click()">Escolher ficheiro</button>
      @if (fileLabel) {
        <p class="text-sm font-medium">{{ fileLabel }}</p>
      }
      @if (fileError) {
        <p class="text-sm text-red-600">{{ fileError }}</p>
      }
      @if (uploading) {
        <mat-progress-bar mode="determinate" [value]="progress" />
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [disabled]="uploading" (click)="dialogRef.close(false)">Cancelar</button>
      <button mat-flat-button color="primary" type="button" [disabled]="uploading" (click)="submit()">Submeter</button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubmitPaymentProofDialogComponent {
  notes = this.fb.control('');
  selectedFile: File | null = null;
  fileError: string | null = null;
  fileLabel = '';
  uploading = false;
  progress = 0;
  amountLabel = formatMoneyMt(this.data.amount);

  constructor(
    private fb: FormBuilder,
    private projects: ConstructionProjectService,
    private notify: NotificationService,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<SubmitPaymentProofDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: SubmitPaymentProofDialogData
  ) {}

  onFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const err = validatePaymentProofFile(file);
    this.fileError = err;
    this.selectedFile = err ? null : file;
    this.fileLabel = err ? '' : `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    this.cdr.markForCheck();
  }

  submit(): void {
    if (!this.selectedFile) {
      this.fileError = 'Seleccione um ficheiro.';
      this.cdr.markForCheck();
      return;
    }
    const form = new FormData();
    form.append('file', this.selectedFile);
    const n = this.notes.value?.trim();
    if (n) form.append('notes', n);

    this.uploading = true;
    this.projects.uploadPaymentProof(this.data.projectId, this.data.paymentId, form).subscribe({
      next: (ev) => {
        if (ev.type === HttpEventType.UploadProgress && ev.total) {
          this.progress = Math.round((100 * ev.loaded) / ev.total);
          this.cdr.markForCheck();
        }
        if (ev.type === HttpEventType.Response) {
          this.notify.success('Comprovativo submetido. A Construvasco vai analisar e confirmar.');
          this.dialogRef.close(true);
        }
      },
      error: (err) => {
        this.uploading = false;
        this.notify.error(err?.error?.message || 'Não foi possível submeter o comprovativo.');
        this.cdr.markForCheck();
      },
    });
  }
}
