import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConstructionProjectService } from '../../../../shared/construction/construction-project.service';
import { NotificationService } from '../../../../shared/components/feedback/notification.service';

export interface RequestConstructionQuoteDialogData {
  projectId: number;
}

@Component({
  selector: 'app-request-construction-quote-dialog',
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
  template: `
    <h2 mat-dialog-title>Pedir orçamento de obra</h2>
    <mat-dialog-content class="!pt-2 space-y-4">
      <p class="text-sm text-slate-600">
        A Construvasco vai visitar o terreno e preparar um orçamento detalhado de obra (materiais + mão-de-obra).
      </p>
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Data sugerida para visita (opcional)</mat-label>
        <input matInput [matDatepicker]="picker" [formControl]="visitDate" />
        <mat-datepicker-toggle matIconSuffix [for]="picker" />
        <mat-datepicker #picker />
      </mat-form-field>
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Notas (opcional)</mat-label>
        <textarea matInput rows="3" [formControl]="notes" placeholder="Ex: prefiro visita sábado de manhã"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [disabled]="saving" (click)="dialogRef.close(false)">Cancelar</button>
      <button mat-flat-button color="primary" type="button" [disabled]="saving" (click)="submit()">
        @if (saving) { <mat-spinner diameter="20" class="inline-block" /> } @else { Enviar pedido }
      </button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestConstructionQuoteDialogComponent {
  visitDate = this.fb.control<Date | null>(null);
  notes = this.fb.control('');
  saving = false;

  constructor(
    private fb: FormBuilder,
    private projects: ConstructionProjectService,
    private notify: NotificationService,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<RequestConstructionQuoteDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: RequestConstructionQuoteDialogData,
  ) {}

  submit(): void {
    this.saving = true;
    const payload: { suggested_visit_date?: string; notes?: string } = {};
    const d = this.visitDate.value;
    if (d instanceof Date) payload.suggested_visit_date = d.toISOString().slice(0, 10);
    const n = this.notes.value?.trim();
    if (n) payload.notes = n;

    this.projects.requestConstructionQuote(this.data.projectId, payload).subscribe({
      next: () => {
        this.notify.success('Pedido enviado. A Construvasco vai contactá-lo para agendar visita.');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.saving = false;
        this.notify.error(err?.error?.message || 'Não foi possível enviar o pedido.');
        this.cdr.markForCheck();
      },
    });
  }
}
