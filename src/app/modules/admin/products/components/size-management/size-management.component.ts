import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DataTableComponent, TableColumn, TableAction } from '../../../../../shared/components/data/table/data-table.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/feedback/confirm-dialog/confirm-dialog.component';
import { ButtonComponent } from '../../../../../shared/components/ui/button/button.component';
import { CardComponent } from '../../../../../shared/components/ui/card/card.component';
import { NotificationService } from '../../../../../shared/components/feedback/notification.service';
import { ProductService } from '../../shared/product.service';
import { ProductSize, ProductSizeRestriction, CreateProductSizeRequest, UpdateProductSizeRequest, CreateProductSizeRestrictionRequest } from '../../shared/product.types';
import { SizeFormModalComponent, SizeFormModalData } from './size-form-modal.component';

@Component({
  selector: 'app-size-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTableComponent,
    ButtonComponent,
    CardComponent
  ],
  templateUrl: './size-management.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SizeManagementComponent implements OnInit {
  @Input() productId!: number;
  @Output() sizeAdded = new EventEmitter<ProductSize>();
  @Output() sizeUpdated = new EventEmitter<ProductSize>();
  @Output() sizeDeleted = new EventEmitter<number>();

  sizes: ProductSize[] = [];
  restrictions: ProductSizeRestriction | null = null;
  loading = false;
  loadingRestrictions = false;
  showRestrictionsForm = false;
  restrictionsFormData: CreateProductSizeRestrictionRequest = {
    min_width_cm: null,
    max_width_cm: null,
    min_height_cm: null,
    max_height_cm: null,
    step_increment_cm: null
  };

  columns: TableColumn[] = [
    { key: 'name', label: 'Nome', sortable: true },
    { 
      key: 'dimensions', 
      label: 'Dimensões', 
      sortable: false,
      format: (value: string) => value || 'Personalizado'
    },
    { 
      key: 'is_predefined', 
      label: 'Tipo', 
      type: 'badge',
      format: (value: boolean) => value ? 'Predefinido' : 'Custom'
    },
    { 
      key: 'fixed_price', 
      label: 'Preço Fixo', 
      sortable: true,
      format: (value: number | string | null) => {
        if (value === null || value === undefined) return '-';
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        return !isNaN(numValue) && numValue > 0 ? `${numValue.toFixed(2)} MT` : '-';
      }
    },
    { 
      key: 'is_active', 
      label: 'Status', 
      type: 'badge',
      format: (value: boolean) => value ? 'Ativo' : 'Inativo'
    },
    { key: 'sort_order', label: 'Ordem', sortable: true }
  ];

  actions: TableAction[] = [
    {
      label: 'Editar',
      icon: 'edit',
      handler: (size: ProductSize) => this.editSize(size)
    },
    {
      label: 'Excluir',
      icon: 'delete',
      color: 'warn',
      handler: (size: ProductSize) => this.deleteSize(size)
    }
  ];

  constructor(
    private productService: ProductService,
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.productId) {
      this.loadSizes();
      this.loadRestrictions();
    }
  }

  loadSizes(): void {
    this.loading = true;
    this.productService.getProductSizes(this.productId).subscribe({
          next: (response) => {
            this.sizes = (response.data || []).map((size: ProductSize) => ({
              ...size,
              dimensions: size.width_cm && size.height_cm 
                ? `${size.width_cm}cm x ${size.height_cm}cm` 
                : 'Personalizado'
            }));
            this.loading = false;
            this.cdr.markForCheck();
          },
      error: (error) => {
        this.loading = false;
        this.notificationService.show({
          type: 'error',
          message: 'Erro ao carregar tamanhos',
          title: 'Erro'
        });
        this.cdr.markForCheck();
      }
    });
  }

  addSize(): void {
    this.openSizeForm();
  }

  editSize(size: ProductSize): void {
    this.openSizeForm(size);
  }

  openSizeForm(size?: ProductSize): void {
    const dialogRef = this.dialog.open(SizeFormModalComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: {
        size,
        productId: this.productId
      } as SizeFormModalData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.data) {
        const formData = result.data;
        const isEdit = result.isEdit;

        if (isEdit && size) {
          // Update existing size
          const updateData: UpdateProductSizeRequest = {
            name: formData.name,
            width_cm: formData.width_cm || null,
            height_cm: formData.height_cm || null,
            is_predefined: formData.is_predefined ?? false,
            is_custom: formData.is_custom ?? false,
            fixed_price: formData.fixed_price || null,
            is_active: formData.is_active ?? true,
            sort_order: formData.sort_order || 0
          };

          this.productService.updateSize(this.productId, size.id, updateData).subscribe({
            next: (response) => {
              this.notificationService.show({
                type: 'success',
                message: 'Tamanho atualizado com sucesso',
                title: 'Sucesso'
              });
              this.loadSizes();
              if (response.data) {
                this.sizeUpdated.emit(response.data);
              }
            },
            error: (error) => {
              this.notificationService.show({
                type: 'error',
                message: error.error?.message || 'Erro ao atualizar tamanho',
                title: 'Erro'
              });
            }
          });
        } else {
          // Create new size
          const createData: CreateProductSizeRequest = {
            name: formData.name,
            width_cm: formData.width_cm || null,
            height_cm: formData.height_cm || null,
            is_predefined: formData.is_predefined ?? false,
            is_custom: formData.is_custom ?? false,
            fixed_price: formData.fixed_price || null,
            is_active: formData.is_active ?? true,
            sort_order: formData.sort_order || 0
          };

          this.productService.createSize(this.productId, createData).subscribe({
            next: (response) => {
              this.notificationService.show({
                type: 'success',
                message: 'Tamanho criado com sucesso',
                title: 'Sucesso'
              });
              this.loadSizes();
              if (response.data) {
                this.sizeAdded.emit(response.data);
              }
            },
            error: (error) => {
              this.notificationService.show({
                type: 'error',
                message: error.error?.message || 'Erro ao criar tamanho',
                title: 'Erro'
              });
            }
          });
        }
      }
    });
  }

  deleteSize(size: ProductSize): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar Exclusão',
        message: `Tem certeza que deseja excluir o tamanho "${size.name}"?`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.productService.deleteSize(this.productId, size.id).subscribe({
          next: () => {
            this.notificationService.show({
              type: 'success',
              message: 'Tamanho excluído com sucesso',
              title: 'Sucesso'
            });
            this.loadSizes();
            this.sizeDeleted.emit(size.id);
          },
          error: (error) => {
            this.notificationService.show({
              type: 'error',
              message: 'Erro ao excluir tamanho',
              title: 'Erro'
            });
          }
        });
      }
    });
  }

  loadRestrictions(): void {
    this.loadingRestrictions = true;
    this.productService.getProductSizeRestrictions(this.productId).subscribe({
      next: (response) => {
        this.restrictions = response.data;
        if (this.restrictions) {
          this.restrictionsFormData = {
            min_width_cm: this.restrictions.min_width_cm,
            max_width_cm: this.restrictions.max_width_cm,
            min_height_cm: this.restrictions.min_height_cm,
            max_height_cm: this.restrictions.max_height_cm,
            step_increment_cm: this.restrictions.step_increment_cm
          };
        }
        this.loadingRestrictions = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.loadingRestrictions = false;
        this.cdr.markForCheck();
      }
    });
  }

  toggleRestrictionsForm(): void {
    this.showRestrictionsForm = !this.showRestrictionsForm;
    if (this.showRestrictionsForm && !this.restrictions) {
      // Initialize empty form
      this.restrictionsFormData = {
        min_width_cm: null,
        max_width_cm: null,
        min_height_cm: null,
        max_height_cm: null,
        step_increment_cm: null
      };
    }
  }

  saveRestrictions(event: Event): void {
    event.preventDefault();
    
    const restrictionsData: CreateProductSizeRestrictionRequest = {
      min_width_cm: this.restrictionsFormData.min_width_cm || null,
      max_width_cm: this.restrictionsFormData.max_width_cm || null,
      min_height_cm: this.restrictionsFormData.min_height_cm || null,
      max_height_cm: this.restrictionsFormData.max_height_cm || null,
      step_increment_cm: this.restrictionsFormData.step_increment_cm || null
    };

    this.productService.createOrUpdateSizeRestrictions(this.productId, restrictionsData).subscribe({
      next: (response) => {
        this.notificationService.show({
          type: 'success',
          message: 'Restrições salvas com sucesso',
          title: 'Sucesso'
        });
        this.loadRestrictions();
        this.showRestrictionsForm = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.notificationService.show({
          type: 'error',
          message: error.error?.message || 'Erro ao salvar restrições',
          title: 'Erro'
        });
      }
    });
  }
}
