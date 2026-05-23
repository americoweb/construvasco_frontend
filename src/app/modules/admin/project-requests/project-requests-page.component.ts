import {

  Component,

  OnInit,

  OnDestroy,

  ChangeDetectionStrategy,

  ChangeDetectorRef,

} from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router, RouterLink } from '@angular/router';

import {

  FormBuilder,

  FormGroup,

  ReactiveFormsModule,

  Validators,

} from '@angular/forms';

import { HttpClient } from '@angular/common/http';

import {

  Subject,

  takeUntil,

  debounceTime,

  distinctUntilChanged,

  switchMap,

  of,

  forkJoin,

} from 'rxjs';



import { MatFormFieldModule } from '@angular/material/form-field';

import { MatInputModule } from '@angular/material/input';

import { MatSelectModule } from '@angular/material/select';

import { MatIconModule } from '@angular/material/icon';

import { MatButtonModule } from '@angular/material/button';

import { MatExpansionModule } from '@angular/material/expansion';

import { MatDividerModule } from '@angular/material/divider';

import { MatDatepickerModule } from '@angular/material/datepicker';

import { MatNativeDateModule } from '@angular/material/core';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';



import { NotificationService } from '../../../shared/components/feedback/notification.service';

import { ConfigService } from '../../../core/services/config.service';

import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints';

import {

  PROJECT_TYPES,

  TIPOLOGIAS_BY_TYPE,

  DOCUMENT_TYPES,

} from './project-request-form.constants';

import { BriefingFieldsGridComponent } from './briefing/briefing-fields-grid.component';

import {

  pruneBriefingPayload,

  syncBriefingControls,

} from './briefing/briefing-form.builder';

import {

  BriefingSectionDef,

  ProjectTypeKey,

} from './briefing/briefing-form.types';

import { getVisibleSections } from './briefing/briefing-form.schema';



interface ClientOption {

  id: number;

  name: string;

  identifier: string;

  type: string;

}



interface PendingFile {

  file: File;

  document_type: string;

  previewUrl?: string;

}



@Component({

  selector: 'app-project-requests-page',

  standalone: true,

  imports: [

    CommonModule,

    RouterLink,

    ReactiveFormsModule,

    BriefingFieldsGridComponent,

    MatFormFieldModule,

    MatInputModule,

    MatSelectModule,

    MatIconModule,

    MatButtonModule,

    MatExpansionModule,

    MatDividerModule,

    MatDatepickerModule,

    MatNativeDateModule,

    MatProgressSpinnerModule,

  ],

  templateUrl: './project-requests-page.component.html',

  styleUrls: ['./project-requests-page.component.scss'],

  changeDetection: ChangeDetectionStrategy.OnPush,

})

export class ProjectRequestsPageComponent implements OnInit, OnDestroy {

  form!: FormGroup;

  createClientForm!: FormGroup;

  submitting = false;

  readonly projectTypes = PROJECT_TYPES;

  documentTypes = DOCUMENT_TYPES;

  filteredTipologias = TIPOLOGIAS_BY_TYPE.residencial;

  visibleSections: BriefingSectionDef[] = getVisibleSections('residencial');



  clientQuery = '';

  clientResults: ClientOption[] = [];

  selectedClient: ClientOption | null = null;

  clientDropdownOpen = false;

  showCreateClientModal = false;

  creatingClient = false;



  pendingFiles: PendingFile[] = [];

  defaultDocumentType = 'referencia';



  private clientSearch$ = new Subject<string>();

  private readonly destroy$ = new Subject<void>();



  constructor(

    private fb: FormBuilder,

    private http: HttpClient,

    private config: ConfigService,

    private notify: NotificationService,

    private cdr: ChangeDetectorRef,

    private router: Router

  ) {}

  private createdRequestId: number | null = null;



  ngOnInit(): void {

    this.form = this.fb.group({

      title: ['', [Validators.required, Validators.maxLength(255)]],

      project_type: ['residencial' as ProjectTypeKey, Validators.required],

      tipologia: ['t1-t2'],

      description: [''],

      localizacao: ['', Validators.maxLength(255)],

      area_m2: [null as number | null],

      largura_m: [null as number | null],

      comprimento_m: [null as number | null],

      num_pisos: [null as number | null],

      num_quartos: [null as number | null],

      orcamento_estimado_mt: [null as number | null],

      prazo_desejado: [null as Date | null],

      estilo_arquitectonico: [''],

      paleta_acabamento: [''],

      zona_prioritaria: [''],

      whatsapp: [''],

      observacoes: [''],

      briefing_data: this.fb.group({}),

    });



    this.applyProjectType('residencial', false);



    this.form

      .get('project_type')

      ?.valueChanges.pipe(takeUntil(this.destroy$))

      .subscribe((t) => this.applyProjectType(t as ProjectTypeKey, true));



    this.createClientForm = this.fb.group({

      name: ['', [Validators.required, Validators.maxLength(255)]],

      identifier: ['', [Validators.required, Validators.maxLength(255)]],

      type: ['phone', Validators.required],

    });



    this.clientSearch$

      .pipe(

        debounceTime(250),

        distinctUntilChanged(),

        switchMap((q) =>

          q.length >= 1

            ? this.http.get<{ data: ClientOption[] }>(

                this.config.getApiUrl(API_ENDPOINTS.CLIENTS.SEARCH),

                { params: { q } }

              )

            : of({ data: [] })

        ),

        takeUntil(this.destroy$)

      )

      .subscribe({

        next: (res) => {

          this.clientResults = res.data ?? [];

          this.cdr.markForCheck();

        },

      });



  }



  ngOnDestroy(): void {

    this.pendingFiles.forEach((p) => {

      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);

    });

    this.destroy$.next();

    this.destroy$.complete();

  }



  get projectType(): ProjectTypeKey {

    return (this.form?.get('project_type')?.value ?? 'residencial') as ProjectTypeKey;

  }



  get briefingGroup(): FormGroup {

    return this.form.get('briefing_data') as FormGroup;

  }



  get showNumQuartos(): boolean {

    return ['residencial', 'misto', 'remodelacao', 'outro'].includes(this.projectType);

  }



  get showZonaPrioritaria(): boolean {

    return ['residencial', 'comercial', 'misto', 'outro'].includes(this.projectType);

  }



  private applyProjectType(type: ProjectTypeKey, resetTipologia: boolean): void {

    this.filteredTipologias = TIPOLOGIAS_BY_TYPE[type] ?? TIPOLOGIAS_BY_TYPE.outro;

    this.visibleSections = getVisibleSections(type);

    syncBriefingControls(this.form, this.fb, type);



    if (resetTipologia) {

      const first = this.filteredTipologias[0]?.value ?? 'outro';

      const current = this.form.get('tipologia')?.value;

      const stillValid = this.filteredTipologias.some((t) => t.value === current);

      if (!stillValid) {

        this.form.patchValue({ tipologia: first });

      }

    }

    this.cdr.markForCheck();

  }



  onClientInput(value: string): void {

    this.clientQuery = value;

    this.clientDropdownOpen = value.length >= 1;

    this.clientSearch$.next(value);

  }



  selectClient(c: ClientOption): void {

    this.selectedClient = c;

    this.clientQuery = '';

    this.clientDropdownOpen = false;

    if (c.type === 'phone' || c.type === 'whatsapp') {

      this.form.patchValue({ whatsapp: c.identifier });

    }

    this.cdr.markForCheck();

  }



  clearClient(): void {

    this.selectedClient = null;

    this.cdr.markForCheck();

  }



  openCreateClientModal(): void {

    const q = this.clientQuery.trim();

    this.createClientForm.reset({

      name: q && !q.includes('@') && !/^\+?\d/.test(q) ? q : '',

      identifier: q && (q.includes('@') || /^\+?\d/.test(q)) ? q : '',

      type: q.includes('@') ? 'email' : 'phone',

    });

    this.showCreateClientModal = true;

    this.cdr.markForCheck();

  }



  closeCreateClientModal(): void {

    this.showCreateClientModal = false;

    this.cdr.markForCheck();

  }



  createClient(): void {

    if (this.createClientForm.invalid) return;

    this.creatingClient = true;

    this.http

      .post<{ data: ClientOption }>(

        this.config.getApiUrl(API_ENDPOINTS.CLIENTS.CREATE),

        this.createClientForm.getRawValue()

      )

      .subscribe({

        next: (res) => {

          const c = res.data;

          this.selectClient({

            id: c.id,

            name: c.name,

            identifier: c.identifier,

            type: c.type,

          });

          this.showCreateClientModal = false;

          this.creatingClient = false;

          this.notify.success('Cliente criado.');

          this.cdr.markForCheck();

        },

        error: () => {

          this.creatingClient = false;

          this.notify.error('Não foi possível criar o cliente.');

          this.cdr.markForCheck();

        },

      });

  }



  onFilesSelected(event: Event): void {

    const input = event.target as HTMLInputElement;

    const files = input.files;

    if (!files?.length) return;



    Array.from(files).forEach((file) => {

      const entry: PendingFile = {

        file,

        document_type: this.defaultDocumentType,

      };

      if (file.type.startsWith('image/')) {

        entry.previewUrl = URL.createObjectURL(file);

      }

      this.pendingFiles.push(entry);

    });

    input.value = '';

    this.cdr.markForCheck();

  }



  removePendingFile(index: number): void {

    const removed = this.pendingFiles.splice(index, 1)[0];

    if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);

    this.cdr.markForCheck();

  }



  private formatBriefingDate(v: unknown): string | null {

    if (!v) return null;

    if (v instanceof Date) return v.toISOString().slice(0, 10);

    return String(v);

  }



  submit(): void {

    if (!this.selectedClient) {

      this.notify.error('Seleccione o cliente (nome completo na pesquisa).');

      return;

    }

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      this.notify.error('Preencha os campos obrigatórios.');

      return;

    }



    this.submitting = true;

    const raw = this.form.getRawValue();

    const pt = raw.project_type as ProjectTypeKey;

    const briefingRaw = (raw.briefing_data ?? {}) as Record<string, unknown>;

    if (briefingRaw.data_inicio_desejada) {

      briefingRaw.data_inicio_desejada = this.formatBriefingDate(

        briefingRaw.data_inicio_desejada

      );

    }

    const prazo = raw.prazo_desejado;



    const body: Record<string, unknown> = {

      user_id: this.selectedClient.id,

      submit: true,

      title: raw.title,

      project_type: raw.project_type,

      tipologia: raw.tipologia,

      description: raw.description,

      localizacao: raw.localizacao,

      area_m2: raw.area_m2,

      largura_m: raw.largura_m,

      comprimento_m: raw.comprimento_m,

      num_pisos: raw.num_pisos,

      num_quartos: this.showNumQuartos ? raw.num_quartos : null,

      orcamento_estimado_mt: raw.orcamento_estimado_mt,

      prazo_desejado: prazo

        ? prazo instanceof Date

          ? prazo.toISOString().slice(0, 10)

          : prazo

        : null,

      estilo_arquitectonico: raw.estilo_arquitectonico,

      paleta_acabamento: raw.paleta_acabamento,

      zona_prioritaria: this.showZonaPrioritaria ? raw.zona_prioritaria : null,

      whatsapp: raw.whatsapp || this.selectedClient.identifier,

      observacoes: raw.observacoes,

      briefing_data: pruneBriefingPayload(briefingRaw, pt),

    };



    this.http

      .post<{ data: { id: number } }>(

        this.config.getApiUrl(API_ENDPOINTS.MANAGER.PROJECT_REQUESTS),

        body

      )

      .subscribe({

        next: (res) => {

          const id = res.data?.id;

          if (id && this.pendingFiles.length) {

            this.uploadFiles(id);

          } else {

            this.afterSuccess();

          }

        },

        error: (err) => {

          this.submitting = false;

          const msg =

            err?.error?.message ||

            err?.error?.errors?.title?.[0] ||

            'Erro ao registar o pedido.';

          this.notify.error(String(msg));

          this.cdr.markForCheck();

        },

      });

  }



  private uploadFiles(requestId: number): void {

    const uploads = this.pendingFiles.map((p) => {

      const fd = new FormData();

      fd.append('file', p.file);

      fd.append('document_type', p.document_type);

      return this.http.post(

        this.config.getApiUrl(

          API_ENDPOINTS.MANAGER.PROJECT_REQUEST_DOCUMENTS(requestId)

        ),

        fd

      );

    });



    forkJoin(uploads).subscribe({

      next: () => this.afterSuccess(),

      error: () => {

        this.submitting = false;

        this.notify.error(

          'Pedido criado, mas alguns anexos falharam. Adicione-os na ficha do pedido.'

        );

        this.cdr.markForCheck();

      },

    });

  }



  private afterSuccess(): void {

    this.notify.success('Pedido de projecto registado.');

    if (this.createdRequestId) {

      this.router.navigate(['/admin/pedidos', this.createdRequestId]);

      this.submitting = false;

      this.cdr.markForCheck();

      return;

    }

    this.form.reset({

      project_type: 'residencial',

      tipologia: 't1-t2',

    });

    this.applyProjectType('residencial', false);

    this.pendingFiles.forEach((p) => {

      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);

    });

    this.pendingFiles = [];

    this.clearClient();

    this.submitting = false;

    this.cdr.markForCheck();

  }

}


