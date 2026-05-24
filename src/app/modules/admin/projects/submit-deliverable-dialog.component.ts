import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { ConstructionProjectService } from '../../../shared/construction/construction-project.service';
import { NotificationService } from '../../../shared/components/feedback/notification.service';
import { formatFileSize, validateDeliverableFile } from '../../../shared/construction/deliverable.util';

export interface SubmitDeliverableDialogData {
  projectId: number;
}

@Component({
  selector: 'app-submit-deliverable-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatIconModule,
  ],
  templateUrl: './submit-deliverable-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubmitDeliverableDialogComponent {
  form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', Validators.maxLength(2000)],
  });

  selectedFile: File | null = null;
  fileError: string | null = null;
  uploading = false;
  uploadProgress = 0;
  dragOver = false;

  constructor(
    private fb: FormBuilder,
    private projects: ConstructionProjectService,
    private notify: NotificationService,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<SubmitDeliverableDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: SubmitDeliverableDialogData
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.setFile(file);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.setFile(file);
    this.cdr.markForCheck();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
    this.cdr.markForCheck();
  }

  onDragLeave(): void {
    this.dragOver = false;
    this.cdr.markForCheck();
  }

  private setFile(file: File): void {
    const err = validateDeliverableFile(file);
    this.fileError = err;
    this.selectedFile = err ? null : file;
    this.cdr.markForCheck();
  }

  fileLabel(): string {
    if (!this.selectedFile) return '';
    return `${this.selectedFile.name} · ${formatFileSize(this.selectedFile.size)}`;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.selectedFile) {
      this.fileError = 'Seleccione um ficheiro.';
      this.cdr.markForCheck();
      return;
    }

    const form = new FormData();
    form.append('title', String(this.form.value.title).trim());
    const desc = this.form.value.description?.trim();
    if (desc) form.append('description', desc);
    form.append('file', this.selectedFile);

    this.uploading = true;
    this.uploadProgress = 0;
    this.cdr.markForCheck();

    this.projects.uploadTechnicianDeliverable(this.data.projectId, form).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round((100 * event.loaded) / event.total);
          this.cdr.markForCheck();
        }
        if (event.type === HttpEventType.Response) {
          this.uploading = false;
          this.notify.success('Entregável submetido para revisão pelo gestor.');
          this.dialogRef.close(true);
        }
      },
      error: (err) => {
        this.uploading = false;
        const msg =
          err?.error?.message ||
          err?.error?.errors?.file?.[0] ||
          'Não foi possível submeter o entregável.';
        this.notify.error(msg);
        this.cdr.markForCheck();
      },
    });
  }
}
