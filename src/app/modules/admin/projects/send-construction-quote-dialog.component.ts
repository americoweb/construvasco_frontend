import { Component, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProjectRequestService } from '../../../shared/construction/project-request.service';
import { NotificationService } from '../../../shared/components/feedback/notification.service';

export interface SendConstructionQuoteDialogData {
  requestId: number;
  suggestedVisitDate?: string;
  constructionRequestNotes?: string;
}

@Component({
  selector: 'app-send-construction-quote-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './send-construction-quote-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SendConstructionQuoteDialogComponent {
  saving = false;
  serverErrors: Record<string, string[]> = {};

  form = this.fb.group({
    total_amount_mt: [null as number | null, [Validators.required, Validators.min(0.01)]],
    delivery_days: [120, [Validators.required, Validators.min(1)]],
    valid_until: [this.defaultValidUntil()],
    conditions: ['', Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private requests: ProjectRequestService,
    private notify: NotificationService,
    private dialogRef: MatDialogRef<SendConstructionQuoteDialogComponent, boolean>,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: SendConstructionQuoteDialogData,
  ) {}

  private defaultValidUntil(): Date {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d;
  }

  fieldError(name: string): string | null {
    const c = this.form.get(name);
    if (c?.hasError('required')) return 'Campo obrigatório.';
    if (c?.hasError('min')) return 'Valor inválido.';
    return this.serverErrors[name]?.[0] ?? null;
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  submit(): void {
    this.serverErrors = {};
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const validUntil =
      v.valid_until instanceof Date ? v.valid_until.toISOString().slice(0, 10) : undefined;

    this.saving = true;
    this.requests
      .storeQuote(this.data.requestId, {
        quote_type: 'construction',
        total_amount_mt: Number(v.total_amount_mt),
        delivery_days: Number(v.delivery_days),
        conditions: v.conditions?.trim() || undefined,
        valid_until: validUntil,
      })
      .subscribe({
        next: () => {
          this.notify.success('Orçamento de obra enviado ao cliente.');
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.saving = false;
          if (err?.status === 422 && err?.error?.errors) {
            this.serverErrors = err.error.errors;
          } else {
            this.notify.error(err?.error?.message || 'Não foi possível enviar.');
          }
          this.cdr.markForCheck();
        },
      });
  }
}
