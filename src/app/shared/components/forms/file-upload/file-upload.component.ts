import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface UploadedFile {
  file: File;
  url?: string;
  progress?: number;
  error?: string;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule
  ],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileUploadComponent {
  @Input() accept = '*/*';
  @Input() multiple = false;
  @Input() maxFiles = 10;
  @Input() maxFileSize = 10 * 1024 * 1024; // 10MB
  @Input() disabled = false;
  @Input() dragDrop = true;
  @Input() showPreview = true;

  @Output() filesChange = new EventEmitter<File[]>();
  @Output() fileRemove = new EventEmitter<File>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  files: UploadedFile[] = [];
  isDragOver = false;

  constructor(private snackBar: MatSnackBar) {}

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
    }
  }

  onDragOver(event: DragEvent): void {
    if (!this.dragDrop || this.disabled) return;
    
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    if (!this.dragDrop || this.disabled) return;
    
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    if (!this.dragDrop || this.disabled) return;
    
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    if (event.dataTransfer?.files) {
      this.handleFiles(Array.from(event.dataTransfer.files));
    }
  }

  private handleFiles(newFiles: File[]): void {
    const validFiles = newFiles.filter(file => this.validateFile(file));
    
    if (!this.multiple) {
      this.files = [];
    }

    // Check max files limit
    const remainingSlots = this.maxFiles - this.files.length;
    const filesToAdd = validFiles.slice(0, remainingSlots);

    if (filesToAdd.length < validFiles.length) {
      this.showError(`Maximum ${this.maxFiles} files allowed`);
    }

    // Add new files
    filesToAdd.forEach(file => {
      const uploadedFile: UploadedFile = {
        file,
        url: this.createFileUrl(file)
      };
      this.files.push(uploadedFile);
    });

    this.emitFiles();
  }

  private validateFile(file: File): boolean {
    // Check file size
    if (file.size > this.maxFileSize) {
      this.showError(`File "${file.name}" is too large. Maximum size is ${this.formatFileSize(this.maxFileSize)}`);
      return false;
    }

    // Check file type if accept is specified
    if (this.accept !== '*/*') {
      const acceptedTypes = this.accept.split(',').map(type => type.trim());
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        return file.type.match(type.replace('*', '.*'));
      });

      if (!isAccepted) {
        this.showError(`File type "${file.type}" is not accepted`);
        return false;
      }
    }

    return true;
  }

  private createFileUrl(file: File): string {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return '';
  }

  removeFile(index: number): void {
    const removedFile = this.files[index];
    
    // Clean up object URL
    if (removedFile.url) {
      URL.revokeObjectURL(removedFile.url);
    }

    this.files.splice(index, 1);
    this.fileRemove.emit(removedFile.file);
    this.emitFiles();
  }

  clearAll(): void {
    // Clean up object URLs
    this.files.forEach(file => {
      if (file.url) {
        URL.revokeObjectURL(file.url);
      }
    });

    this.files = [];
    this.emitFiles();
  }

  triggerFileSelect(): void {
    if (!this.disabled) {
      this.fileInput.nativeElement.click();
    }
  }

  private emitFiles(): void {
    const files = this.files.map(f => f.file);
    this.filesChange.emit(files);
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 5000 });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(file: File): string {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video_file';
    if (file.type.startsWith('audio/')) return 'audio_file';
    if (file.type.includes('pdf')) return 'picture_as_pdf';
    if (file.type.includes('word')) return 'description';
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) return 'table_chart';
    return 'insert_drive_file';
  }

  get hasFiles(): boolean {
    return this.files.length > 0;
  }

  get canAddMore(): boolean {
    return this.files.length < this.maxFiles;
  }
}
