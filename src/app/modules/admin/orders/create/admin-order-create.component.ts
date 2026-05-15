import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NotificationService } from '../../../../shared/components/feedback/notification.service';
import { OrderService } from '../shared/order.service';
import { CreateOrderPayload, CreateOrderLinePayload } from '../shared/order.types';
import { ProductService } from '../../products/shared/product.service';
import {
  Product,
  ProductColor,
  ProductPrintArea
} from '../../products/shared/product.types';

@Component({
  selector: 'app-admin-order-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    PageHeaderComponent,
    ButtonComponent,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './admin-order-create.component.html',
  styleUrls: ['./admin-order-create.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminOrderCreateComponent implements OnInit {
  form: FormGroup;
  products: Product[] = [];
  /** Full product loaded per line (for labels and price). */
  lineProducts: (Product | undefined)[] = [];
  loadingProducts = true;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private orderService: OrderService,
    private router: Router,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      shipping_name: ['', Validators.required],
      shipping_address: ['', Validators.required],
      shipping_city: ['Maputo'],
      shipping_state: ['Maputo'],
      shipping_postal_code: [''],
      shipping_country: ['Moçambique'],
      shipping_phone: [''],
      shipping_whatsapp: ['', Validators.required],
      billing_name: [''],
      billing_email: [''],
      notes: [''],
      shipping_cost: [0, [Validators.min(0)]],
      discount_amount: [0, [Validators.min(0)]],
      items: this.fb.array([this.createItemGroup()])
    });
    this.lineProducts = [undefined];
  }

  ngOnInit(): void {
    this.productService.get({ per_page: 500 }).subscribe({
      next: (res) => {
        this.products = (res.data || res.items || []) as Product[];
        this.loadingProducts = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingProducts = false;
        this.notificationService.show({
          type: 'error',
          title: 'Erro',
          message: 'Não foi possível carregar os produtos'
        });
        this.cdr.markForCheck();
      }
    });
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  createItemGroup(): FormGroup {
    return this.fb.group({
      product_id: [null as number | null, Validators.required],
      product_color_id: [null as number | null, Validators.required],
      product_print_area_id: [null as number | null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unit_price: [0, [Validators.required, Validators.min(0)]]
    });
  }

  addLine(): void {
    this.items.push(this.createItemGroup());
    this.lineProducts.push(undefined);
    this.cdr.markForCheck();
  }

  removeLine(index: number): void {
    if (this.items.length <= 1) {
      return;
    }
    this.items.removeAt(index);
    this.lineProducts.splice(index, 1);
    this.cdr.markForCheck();
  }

  onProductSelected(index: number): void {
    const raw = this.items.at(index).get('product_id')?.value;
    const productId = raw != null && raw !== '' ? Number(raw) : null;
    if (!productId) {
      this.lineProducts[index] = undefined;
      const row = this.items.at(index);
      row.patchValue({
        product_color_id: null,
        product_print_area_id: null,
        unit_price: 0
      });
      this.cdr.markForCheck();
      return;
    }

    this.productService.getProductWithDetails(productId).subscribe({
      next: (res) => {
        const p = res.data;
        if (!p) {
          return;
        }
        this.lineProducts[index] = p;
        const colors = p.active_colors?.length ? p.active_colors : p.colors || [];
        const areas = p.active_print_areas?.length ? p.active_print_areas : p.print_areas || [];
        const color = colors[0];
        const area = areas[0];
        const row = this.items.at(index);
        const qty = Math.max(p.min_quantity || 1, 1);
        const unit = this.computeUnitPrice(p, area);
        row.patchValue({
          product_color_id: color?.id ?? null,
          product_print_area_id: area?.id ?? null,
          quantity: qty,
          unit_price: unit
        });
        this.cdr.markForCheck();
      },
      error: () => {
        this.notificationService.show({
          type: 'error',
          title: 'Erro',
          message: 'Não foi possível carregar o produto'
        });
      }
    });
  }

  onColorOrAreaChange(index: number): void {
    const p = this.lineProducts[index];
    if (!p) {
      return;
    }
    const row = this.items.at(index);
    const aid = row.get('product_print_area_id')?.value;
    const area = this.pickPrintArea(p, aid);
    row.patchValue({ unit_price: this.computeUnitPrice(p, area) }, { emitEvent: false });
    this.cdr.markForCheck();
  }

  computeUnitPrice(product: Product, printArea?: ProductPrintArea): number {
    const base = Number(product.price || 0);
    const add = Number(printArea?.additional_price || 0);
    return Math.round((base + add) * 100) / 100;
  }

  pickColor(product: Product, id: number | null): ProductColor | undefined {
    if (id == null) {
      return undefined;
    }
    const list = product.active_colors?.length ? product.active_colors : product.colors || [];
    return list.find((c) => c.id === id);
  }

  pickPrintArea(product: Product, id: number | null): ProductPrintArea | undefined {
    if (id == null) {
      return undefined;
    }
    const list = product.active_print_areas?.length
      ? product.active_print_areas
      : product.print_areas || [];
    return list.find((a) => a.id === id);
  }

  colorsForRow(index: number): ProductColor[] {
    const p = this.lineProducts[index];
    if (!p) {
      return [];
    }
    return p.active_colors?.length ? p.active_colors : p.colors || [];
  }

  areasForRow(index: number): ProductPrintArea[] {
    const p = this.lineProducts[index];
    if (!p) {
      return [];
    }
    return p.active_print_areas?.length ? p.active_print_areas : p.print_areas || [];
  }

  buildPayload(): CreateOrderPayload | null {
    const v = this.form.getRawValue();
    const lines: CreateOrderLinePayload[] = [];
    for (let i = 0; i < v.items.length; i++) {
      const row = v.items[i];
      const p = this.lineProducts[i];
      if (!p || row.product_id == null) {
        continue;
      }
      const color = this.pickColor(p, row.product_color_id);
      const area = this.pickPrintArea(p, row.product_print_area_id);
      if (!color || !area) {
        continue;
      }
      lines.push({
        product_id: row.product_id,
        product_color_id: row.product_color_id,
        product_print_area_id: row.product_print_area_id,
        product_name: p.name,
        color_name: color.name,
        color_hex_code: color.hex_code,
        print_area_name: area.name,
        quantity: Number(row.quantity),
        unit_price: Number(row.unit_price)
      });
    }
    if (lines.length === 0) {
      return null;
    }
    return {
      shipping_name: v.shipping_name,
      shipping_address: v.shipping_address,
      shipping_city: v.shipping_city || undefined,
      shipping_state: v.shipping_state || undefined,
      shipping_postal_code: v.shipping_postal_code || undefined,
      shipping_country: v.shipping_country || undefined,
      shipping_phone: v.shipping_phone || undefined,
      shipping_whatsapp: v.shipping_whatsapp,
      billing_name: v.billing_name || undefined,
      billing_email: v.billing_email || undefined,
      notes: v.notes || undefined,
      shipping_cost: v.shipping_cost != null ? Number(v.shipping_cost) : 0,
      discount_amount: v.discount_amount != null ? Number(v.discount_amount) : 0,
      items: lines
    };
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.show({
        type: 'warning',
        title: 'Formulário',
        message: 'Preencha os campos obrigatórios'
      });
      return;
    }
    const payload = this.buildPayload();
    if (!payload) {
      this.notificationService.show({
        type: 'warning',
        title: 'Itens',
        message: 'Adicione pelo menos uma linha com produto, cor e área de impressão válidos'
      });
      return;
    }
    this.submitting = true;
    this.cdr.markForCheck();
    this.orderService.createManualOrder(payload).subscribe({
      next: (res) => {
        this.submitting = false;
        const id = res.data?.id;
        this.notificationService.show({
          type: 'success',
          title: 'Pedido criado',
          message: res.message || 'O pedido foi registado com sucesso'
        });
        if (id != null) {
          this.router.navigate(['/admin/orders', id]);
        } else {
          this.router.navigate(['/admin/orders/list']);
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submitting = false;
        const msg =
          err?.error?.message ||
          (Array.isArray(err?.error?.errors)
            ? err.error.errors.map((e: { message?: string }) => e.message).join(' ')
            : null) ||
          'Não foi possível criar o pedido';
        this.notificationService.show({
          type: 'error',
          title: 'Erro',
          message: msg
        });
        this.cdr.markForCheck();
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/orders/list']);
  }
}
