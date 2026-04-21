import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';

import { PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { ModalComponent } from '../../../../shared/components/feedback/modal/modal.component';
import { NotificationService } from '../../../../shared/components/feedback/notification.service';
import { ConfigService } from '../../../../core/services/config.service';
import { API_ENDPOINTS } from '../../../../shared/constants/api-endpoints';

import { JobCardService } from '../shared/job-card.service';
import { StaffService } from '../../staff/shared/staff.service';
import { DesignerOption } from '../../staff/shared/staff.types';
import { JobCardPriority, ClientTier, JOB_CARD_PRIORITY_LABELS } from '../shared/job-card.types';

import { Product, ProductColor, ProductSize } from '../../products/shared/product.types';

interface ItemMeta {
  selectedProduct: Product | null;
  colors: ProductColor[];
  sizes: ProductSize[];
  productQuery: string;
  productDropdownOpen: boolean;
}

@Component({
  selector: 'app-job-card-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    PageHeaderComponent,
    ButtonComponent,
    ModalComponent,
    MatDialogModule,
  ],
  templateUrl: './job-card-create.component.html',
  styleUrls: ['./job-card-create.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobCardCreateComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  submitting = false;

  // Client search
  clientQuery = '';
  clientResults: { id: number; name: string; identifier: string; type: string }[] = [];
  selectedClient: { id: number; name: string; identifier: string } | null = null;
  clientDropdownOpen = false;
  private clientSearch$ = new Subject<string>();

  // Create client modal
  showCreateClientModal = false;
  createClientForm!: FormGroup;
  creatingClient = false;

  // Staff
  designers: DesignerOption[] = [];

  // Product catalog
  allProducts: Product[] = [];
  loadingProducts = false;
  itemMetas: ItemMeta[] = [];

  readonly priorities = Object.values(JobCardPriority).map(v => ({
    value: v,
    label: JOB_CARD_PRIORITY_LABELS[v]
  }));

  readonly tiers = [
    { value: ClientTier.VIP,    label: 'VIP' },
    { value: ClientTier.NORMAL, label: 'Normal' },
    { value: ClientTier.NEW,    label: 'Novo' }
  ];

  pageHeaderActions = [
    {
      label: 'Cancelar',
      icon: 'arrow_back',
      variant: 'secondary' as const,
      callback: () => this.router.navigate(['/admin/job-cards/list'])
    }
  ];

  private readonly _unsubscribeAll = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private service: JobCardService,
    private staffService: StaffService,
    private http: HttpClient,
    private configService: ConfigService,
    private router: Router,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      client_id:            [null, [Validators.required, Validators.min(1)]],
      assigned_designer_id: [null],
      title:                ['', [Validators.required, Validators.maxLength(255)]],
      description:          [''],
      objective:            ['', Validators.maxLength(255)],
      deadline:             ['', Validators.required],
      priority:             [JobCardPriority.MEDIUM],
      priority_override:    [false],
      priority_reason:      [''],
      client_tier:          [ClientTier.NORMAL],
      revision_limit:       [2, [Validators.min(1), Validators.max(10)]],
      notes:                [''],
      items:                this.fb.array([])
    });

    this.form.get('priority_override')!.valueChanges.subscribe(override => {
      const reasonCtrl = this.form.get('priority_reason')!;
      if (override) {
        reasonCtrl.setValidators([Validators.required, Validators.maxLength(500)]);
      } else {
        reasonCtrl.clearValidators();
        reasonCtrl.setValue('');
      }
      reasonCtrl.updateValueAndValidity();
      this.cdr.markForCheck();
    });

    this.createClientForm = this.fb.group({
      name:       ['', [Validators.required, Validators.maxLength(255)]],
      identifier: ['', [Validators.required, Validators.maxLength(255)]],
      type:       ['phone', Validators.required],
    });

    // Client live search
    this.clientSearch$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(q => q.length >= 1
        ? this.http.get<any>(this.configService.getApiUrl(API_ENDPOINTS.CLIENTS.SEARCH), { params: { q } })
        : of({ data: [] })
      ),
      takeUntil(this._unsubscribeAll)
    ).subscribe({
      next: res => { this.clientResults = res.data ?? []; this.cdr.markForCheck(); },
      error: () => {}
    });

    // Load designers
    this.staffService.getDesigners().subscribe({
      next: res => { this.designers = res.data ?? []; this.cdr.markForCheck(); },
      error: () => {}
    });

    // Load product catalog
    this.loadingProducts = true;
    this.http.get<any>(this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.PUBLIC_ACTIVE))
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: res => {
          this.allProducts = res.data ?? [];
          this.loadingProducts = false;
          this.cdr.markForCheck();
        },
        error: () => { this.loadingProducts = false; this.cdr.markForCheck(); }
      });

    this.addItem();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  // ── FormArray ─────────────────────────────────────────────────────────────

  get items(): FormArray { return this.form.get('items') as FormArray; }

  addItem(): void {
    this.items.push(this.fb.group({
      product_id:        [null],
      product_color_id:  [null],
      product_size_id:   [null],
      product_type:      ['', Validators.required],
      quantity:          [1, [Validators.required, Validators.min(1)]],
      size:              [''],
      material:          [''],
      notes:             ['']
    }));
    this.itemMetas.push({ selectedProduct: null, colors: [], sizes: [], productQuery: '', productDropdownOpen: false });
    this.cdr.markForCheck();
  }

  removeItem(i: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(i);
      this.itemMetas.splice(i, 1);
      this.cdr.markForCheck();
    }
  }

  getItemGroup(i: number): FormGroup { return this.items.at(i) as FormGroup; }
  getItemMeta(i: number): ItemMeta { return this.itemMetas[i] ?? { selectedProduct: null, colors: [], sizes: [], productQuery: '', productDropdownOpen: false }; }
  getItemColorId(i: number): number | null { return this.getItemGroup(i).get('product_color_id')?.value ?? null; }
  getItemSizeId(i: number): number | null { return this.getItemGroup(i).get('product_size_id')?.value ?? null; }
  getSelectedColorName(i: number): string {
    const id = this.getItemColorId(i);
    return this.getItemMeta(i).colors.find(c => c.id === id)?.name ?? '';
  }

  // ── Product catalog selection ─────────────────────────────────────────────

  getFilteredProducts(i: number): Product[] {
    const q = (this.itemMetas[i]?.productQuery ?? '').toLowerCase().trim();
    if (!q) return this.allProducts.slice(0, 10);
    return this.allProducts.filter(p => p.name.toLowerCase().includes(q)).slice(0, 10);
  }

  onProductSearchInput(i: number, value: string): void {
    this.itemMetas[i].productQuery = value;
    this.itemMetas[i].productDropdownOpen = true;
    this.cdr.markForCheck();
  }

  selectProductFromSearch(i: number, product: Product): void {
    this.itemMetas[i].productQuery = product.name;
    this.itemMetas[i].productDropdownOpen = false;
    // reuse existing logic by constructing a synthetic event value
    this._applyProduct(i, product);
  }

  clearProductSelection(i: number): void {
    this.itemMetas[i] = { selectedProduct: null, colors: [], sizes: [], productQuery: '', productDropdownOpen: false };
    this.getItemGroup(i).patchValue({ product_id: null, product_color_id: null, product_size_id: null, product_type: '' });
    this.cdr.markForCheck();
  }

  private _applyProduct(i: number, product: Product): void {
    this.itemMetas[i].selectedProduct = product;
    this.itemMetas[i].colors = [];
    this.itemMetas[i].sizes = [];
    this.getItemGroup(i).patchValue({
      product_id:       product.id,
      product_type:     product.name,
      product_color_id: null,
      product_size_id:  null,
    });

    this.http.get<any>(this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.PUBLIC_COLORS(product.id)))
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(res => {
        this.itemMetas[i].colors = (res.data ?? []).filter((c: ProductColor) => c.is_active);
        if (this.itemMetas[i].colors.length > 0) {
          this.getItemGroup(i).patchValue({ product_color_id: this.itemMetas[i].colors[0].id });
        }
        this.cdr.markForCheck();
      });

    if (product.has_sizes) {
      this.http.get<any>(this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.PUBLIC_SIZES(product.id)))
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(res => {
          this.itemMetas[i].sizes = (res.data ?? []).filter((s: ProductSize) => s.is_active);
          this.cdr.markForCheck();
        });
    }

    this.cdr.markForCheck();
  }

  onProductCatalogSelected(i: number, event: Event): void {
    const productIdStr = (event.target as HTMLSelectElement).value;
    const productId = productIdStr ? +productIdStr : null;

    if (!productId) {
      this.itemMetas[i] = { selectedProduct: null, colors: [], sizes: [], productQuery: '', productDropdownOpen: false };
      this.getItemGroup(i).patchValue({ product_id: null, product_color_id: null, product_size_id: null });
      this.cdr.markForCheck();
      return;
    }

    const product = this.allProducts.find(p => p.id === productId) ?? null;
    if (!product) return;

    this.itemMetas[i] = {
      selectedProduct: product,
      colors: [],
      sizes: [],
      productQuery: product.name,
      productDropdownOpen: false
    };
    this.getItemGroup(i).patchValue({
      product_id:       product.id,
      product_type:     product.name,
      product_color_id: null,
      product_size_id:  null,
    });

    // Load colors
    this.http.get<any>(this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.PUBLIC_COLORS(product.id)))
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(res => {
        this.itemMetas[i].colors = (res.data ?? []).filter((c: ProductColor) => c.is_active);
        // Auto-select first color
        if (this.itemMetas[i].colors.length > 0) {
          this.getItemGroup(i).patchValue({ product_color_id: this.itemMetas[i].colors[0].id });
        }
        this.cdr.markForCheck();
      });

    // Load sizes if product has them
    if (product.has_sizes) {
      this.http.get<any>(this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.PUBLIC_SIZES(product.id)))
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(res => {
          this.itemMetas[i].sizes = (res.data ?? []).filter((s: ProductSize) => s.is_active);
          this.cdr.markForCheck();
        });
    }

    this.cdr.markForCheck();
  }

  selectColor(i: number, colorId: number): void {
    this.getItemGroup(i).patchValue({ product_color_id: colorId });
    this.cdr.markForCheck();
  }

  selectSize(i: number, size: ProductSize): void {
    this.getItemGroup(i).patchValue({
      product_size_id: size.id,
      size: size.dimensions ?? size.name
    });
    this.cdr.markForCheck();
  }

  // ── Priority / Tier / Revision helpers ───────────────────────────────────

  isOverrideActive(): boolean { return !!this.form.get('priority_override')?.value; }
  getPriority(): string { return this.form.get('priority')?.value ?? ''; }
  setPriority(v: string): void { this.form.get('priority')!.setValue(v); this.cdr.markForCheck(); }
  getTier(): string { return this.form.get('client_tier')?.value ?? ''; }
  setTier(v: string): void { this.form.get('client_tier')!.setValue(v); this.cdr.markForCheck(); }
  toggleOverride(): void { const c = this.form.get('priority_override')!; c.setValue(!c.value); }
  getRevisionLimit(): number { return this.form.get('revision_limit')?.value ?? 2; }
  incrementRevisions(): void { const c = this.form.get('revision_limit')!; if (c.value < 10) { c.setValue(c.value + 1); this.cdr.markForCheck(); } }
  decrementRevisions(): void { const c = this.form.get('revision_limit')!; if (c.value > 1) { c.setValue(c.value - 1); this.cdr.markForCheck(); } }

  // ── Client search ────────────────────────────────────────────────────────

  onClientInput(value: string): void {
    this.clientQuery = value;
    this.clientDropdownOpen = true;
    this.clientSearch$.next(value);
  }

  selectClient(c: { id: number; name: string; identifier: string; type: string }): void {
    this.selectedClient = { id: c.id, name: c.name, identifier: c.identifier };
    this.clientQuery = c.name;
    this.clientDropdownOpen = false;
    this.clientResults = [];
    this.form.get('client_id')!.setValue(c.id);
    this.cdr.markForCheck();
  }

  openCreateClientModal(): void {
    this.createClientForm.reset({ type: 'phone', name: this.clientQuery, identifier: '' });
    this.clientDropdownOpen = false;
    this.showCreateClientModal = true;
    this.cdr.markForCheck();
  }

  closeCreateClientModal(): void {
    this.showCreateClientModal = false;
    this.cdr.markForCheck();
  }

  saveNewClient(): void {
    if (this.createClientForm.invalid) { this.createClientForm.markAllAsTouched(); return; }
    this.creatingClient = true;
    this.cdr.markForCheck();

    this.http.post<any>(this.configService.getApiUrl(API_ENDPOINTS.CLIENTS.CREATE), this.createClientForm.getRawValue())
      .subscribe({
        next: res => {
          const c = res.data;
          this.selectClient(c);
          this.showCreateClientModal = false;
          this.creatingClient = false;
          this.notification.show({ type: 'success', message: `Cliente "${c.name}" criado com sucesso.`, title: 'Sucesso' });
          this.cdr.markForCheck();
        },
        error: err => {
          this.creatingClient = false;
          const msg = err?.error?.message ?? 'Erro ao criar cliente';
          this.notification.show({ type: 'error', message: msg, title: 'Erro' });
          this.cdr.markForCheck();
        }
      });
  }

  clearClient(): void {
    this.selectedClient = null;
    this.clientQuery = '';
    this.clientResults = [];
    this.clientDropdownOpen = false;
    this.form.get('client_id')!.setValue(null);
    this.cdr.markForCheck();
  }

  // ── Form submission ───────────────────────────────────────────────────────

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true;
    this.cdr.markForCheck();

    const payload = this.form.getRawValue();
    if (!payload.assigned_designer_id) delete payload.assigned_designer_id;
    if (!payload.priority_override) { delete payload.priority_reason; payload.priority_override = false; }

    this.service.createJobCard(payload).subscribe({
      next: res => {
        this.notification.show({ type: 'success', message: 'Job Card criado com sucesso!', title: 'Sucesso' });
        this.router.navigate(['/admin/job-cards', res.data?.id]);
      },
      error: err => {
        this.submitting = false;
        const msg = err?.error?.message ?? 'Erro ao criar Job Card';
        this.notification.show({ type: 'error', message: msg, title: 'Erro' });
        this.cdr.markForCheck();
      }
    });
  }

  // ── Validation helpers ────────────────────────────────────────────────────

  hasError(controlPath: string, error = 'required'): boolean {
    const ctrl = this.form.get(controlPath);
    return !!(ctrl?.hasError(error) && ctrl?.touched);
  }

  hasItemError(i: number, field: string, error = 'required'): boolean {
    const ctrl = this.getItemGroup(i).get(field);
    return !!(ctrl?.hasError(error) && ctrl?.touched);
  }

  goBack(): void { this.router.navigate(['/admin/job-cards/list']); }
}
