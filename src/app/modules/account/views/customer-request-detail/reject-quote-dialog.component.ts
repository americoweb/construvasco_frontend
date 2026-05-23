import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-reject-quote-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Recusar este orçamento?</h2>
    <mat-dialog-content class="!pt-2">
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Motivo (ajuda a Construvasco a propor melhor)</mat-label>
        <textarea matInput rows="4" [formControl]="reason"></textarea>
        @if (reason.hasError('required') && reason.touched) {
          <mat-error>Indique o motivo.</mat-error>
        }
        @if (reason.hasError('minlength') && reason.touched) {
          <mat-error>Mínimo 5 caracteres.</mat-error>
        }
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close()">Cancelar</button>
      <button mat-flat-button color="warn" type="button" (click)="confirm()">Recusar orçamento</button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RejectQuoteDialogComponent {
  reason = this.fb.control('', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]);

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<RejectQuoteDialogComponent, string | undefined>
  ) {}

  confirm(): void {
    if (this.reason.invalid) {
      this.reason.markAsTouched();
      return;
    }
    this.dialogRef.close(this.reason.value?.trim());
  }
}
