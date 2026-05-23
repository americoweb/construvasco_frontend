import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PageHeaderComponent } from '../../../shared/components/layout/page-header/page-header.component';
import { ConfigService } from '../../../core/services/config.service';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints';
import { NotificationService } from '../../../shared/components/feedback/notification.service';

interface ClientRow {
  id: number;
  name: string;
  identifier: string;
  type: string;
}

@Component({
  selector: 'app-clients-hub',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    PageHeaderComponent,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './clients-hub.component.html',
  styleUrls: ['./clients-hub.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsHubComponent implements OnInit, OnDestroy {
  saving = false;
  listLoading = false;
  clients: ClientRow[] = [];
  searchQuery = '';
  readonly clientColumns = ['name', 'contact', 'type'];

  form = this.fb.group({
    name: ['', Validators.required],
    identifier: ['', Validators.required],
    type: ['phone', Validators.required],
  });

  private search$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private config: ConfigService,
    private notify: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((q) => this.fetchClients(q));

    this.fetchClients('');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(value: string): void {
    this.searchQuery = value;
    this.search$.next(value.trim());
  }

  private fetchClients(q: string): void {
    if (q.length === 1) return;
    this.listLoading = true;
    const params = q.length >= 2 ? { q } : {};
    this.http
      .get<{ data: ClientRow[] }>(this.config.getApiUrl(API_ENDPOINTS.CLIENTS.SEARCH), { params })
      .subscribe({
        next: (res) => {
          this.clients = res.data ?? [];
          this.listLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.clients = [];
          this.listLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  create(): void {
    if (this.form.invalid) return;
    this.saving = true;
    this.http.post(this.config.getApiUrl(API_ENDPOINTS.CLIENTS.CREATE), this.form.getRawValue()).subscribe({
      next: () => {
        this.notify.success('Cliente criado.');
        this.form.reset({ type: 'phone' });
        this.saving = false;
        this.fetchClients(this.searchQuery.trim());
        this.cdr.markForCheck();
      },
      error: () => {
        this.notify.error('Não foi possível criar o cliente.');
        this.saving = false;
        this.cdr.markForCheck();
      },
    });
  }

  labelType(type: string): string {
    if (type === 'email') return 'Email';
    if (type === 'phone' || type === 'whatsapp') return 'Telefone / WhatsApp';
    return type;
  }
}
