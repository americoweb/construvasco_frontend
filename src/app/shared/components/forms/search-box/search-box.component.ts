import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-search-box',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './search-box.component.html',
  styleUrls: ['./search-box.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchBoxComponent {
  @Input() placeholder = 'Search...';
  @Input() value = '';
  @Input() disabled = false;
  @Input() debounceTime = 300;
  @Input() showClearButton = true;
  @Input() appearance: 'fill' | 'outline' | 'legacy' | 'standard' = 'outline';

  @Output() search = new EventEmitter<string>();
  @Output() clear = new EventEmitter<void>();
  @Output() focus = new EventEmitter<void>();
  @Output() blur = new EventEmitter<void>();

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.searchSubject
      .pipe(
        debounceTime(this.debounceTime),
        distinctUntilChanged()
      )
      .subscribe(value => {
        this.search.emit(value);
      });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.searchSubject.next(this.value);
  }

  onClear(): void {
    this.value = '';
    this.searchInput.nativeElement.value = '';
    this.searchSubject.next('');
    this.clear.emit();
    this.searchInput.nativeElement.focus();
  }

  onFocus(): void {
    this.focus.emit();
  }

  onBlur(): void {
    this.blur.emit();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.search.emit(this.value);
    } else if (event.key === 'Escape') {
      this.onClear();
    }
  }

  focusInput(): void {
    this.searchInput.nativeElement.focus();
  }

  get hasValue(): boolean {
    return this.value.length > 0;
  }
}
