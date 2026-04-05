import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ModalConfig } from '../feedback.types';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('backdropFade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('modalSlide', [
      transition(':enter', [
        style({ transform: 'scale(0.95)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'scale(0.95)', opacity: 0 }))
      ])
    ])
  ]
})
export class ModalComponent {
  @Input() config: ModalConfig = {};
  @Input() visible = false;
  @Input() showCloseButton = true;
  @Input() showHeader = true;

  @Output() close = new EventEmitter<void>();
  @Output() backdropClick = new EventEmitter<void>();

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.config.keyboard !== false && this.visible) {
      this.onClose();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: Event): void {
    if (this.config.backdrop !== false) {
      this.backdropClick.emit();
      this.onClose();
    }
  }

  onModalClick(event: Event): void {
    // Prevent backdrop click when clicking inside modal
    event.stopPropagation();
  }

  get modalClasses(): string {
    const baseClasses = 'modal-content bg-white rounded-lg shadow-xl transform transition-all';
    
    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl'
    };

    const size = this.config.size || 'md';
    const sizeClass = sizeClasses[size];

    let positionClasses = 'mx-auto';
    if (this.config.centered) {
      positionClasses += ' my-auto';
    } else {
      positionClasses += ' mt-20 mb-8';
    }

    let additionalClasses = '';
    if (this.config.fullscreen === true) {
      additionalClasses = 'w-full h-full max-w-none max-h-none rounded-none';
    } else if (this.config.fullscreen && typeof this.config.fullscreen === 'string') {
      // Handle responsive fullscreen
      const breakpoint = this.config.fullscreen;
      additionalClasses = `${breakpoint}:w-full ${breakpoint}:h-full ${breakpoint}:max-w-none ${breakpoint}:max-h-none ${breakpoint}:rounded-none`;
    }

    const customClasses = Array.isArray(this.config.panelClass) 
      ? this.config.panelClass.join(' ')
      : this.config.panelClass || '';

    return [baseClasses, sizeClass, positionClasses, additionalClasses, customClasses]
      .filter(Boolean)
      .join(' ');
  }

  get containerClasses(): string {
    let classes = 'flex min-h-screen items-start justify-center p-4';
    
    if (this.config.centered) {
      classes = 'flex min-h-screen items-center justify-center p-4';
    }

    if (this.config.scrollable) {
      classes += ' overflow-y-auto';
    }

    return classes;
  }
}
