import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { DataTableComponent, TableColumn, TableAction } from '../../../../../shared/components/data/table/data-table.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/feedback/confirm-dialog/confirm-dialog.component';
import { ButtonComponent } from '../../../../../shared/components/ui/button/button.component';
import { CardComponent } from '../../../../../shared/components/ui/card/card.component';
import { NotificationService } from '../../../../../shared/components/feedback/notification.service';
import { ProductService } from '../../shared/product.service';
import { ProductColor, CreateProductColorRequest, UpdateProductColorRequest } from '../../shared/product.types';
import { ColorFormModalComponent, ColorFormModalData } from './color-form-modal.component';

@Component({
  selector: 'app-color-management',
  standalone: true,
  imports: [
    CommonModule,
    DataTableComponent,
    ButtonComponent,
    CardComponent
  ],
  templateUrl: './color-management.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorManagementComponent implements OnInit {
  @Input() productId!: number;
  @Output() colorAdded = new EventEmitter<ProductColor>();
  @Output() colorUpdated = new EventEmitter<ProductColor>();
  @Output() colorDeleted = new EventEmitter<number>();

  colors: ProductColor[] = [];
  loading = false;

  columns: TableColumn[] = [
    { key: 'name', label: 'Nome', sortable: true },
    { 
      key: 'hex_code', 
      label: 'Cor', 
      type: 'color'
    },
    { 
      key: 'stock_quantity', 
      label: 'Estoque', 
      sortable: true
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
      handler: (color: ProductColor) => this.editColor(color)
    },
    {
      label: 'Excluir',
      icon: 'delete',
      color: 'warn',
      handler: (color: ProductColor) => this.deleteColor(color)
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
      this.loadColors();
    }
  }

  loadColors(): void {
    this.loading = true;
    this.productService.getProductColors(this.productId).subscribe({
      next: (response) => {
        this.colors = response.data || [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.loading = false;
        this.notificationService.show({
          type: 'error',
          message: 'Erro ao carregar cores',
          title: 'Erro'
        });
        this.cdr.markForCheck();
      }
    });
  }

  addColor(): void {
    this.openColorForm();
  }

  editColor(color: ProductColor): void {
    this.openColorForm(color);
  }

  openColorForm(color?: ProductColor): void {
    const dialogRef = this.dialog.open(ColorFormModalComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: {
        color,
        productId: this.productId
      } as ColorFormModalData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.data) {
        const formData = result.data;
        const isEdit = result.isEdit;

        if (isEdit && color) {
          // Update existing color
          const updateData: UpdateProductColorRequest = {
            name: formData.name,
            hex_code: formData.hex_code,
            stock_quantity: formData.stock_quantity || 0,
            is_active: formData.is_active ?? true,
            sort_order: formData.sort_order || 0
          };

          this.productService.updateColor(this.productId, color.id, updateData).subscribe({
            next: (response) => {
              this.notificationService.show({
                type: 'success',
                message: 'Cor atualizada com sucesso',
                title: 'Sucesso'
              });
              this.loadColors();
              if (response.data) {
                this.colorUpdated.emit(response.data);
              }
            },
            error: (error) => {
              this.notificationService.show({
                type: 'error',
                message: error.error?.message || 'Erro ao atualizar cor',
                title: 'Erro'
              });
            }
          });
        } else {
          // Create new color
          const createData: CreateProductColorRequest = {
            name: formData.name,
            hex_code: formData.hex_code,
            stock_quantity: formData.stock_quantity || 0,
            is_active: formData.is_active ?? true,
            sort_order: formData.sort_order || 0
          };

          this.productService.createColor(this.productId, createData).subscribe({
            next: (response) => {
              this.notificationService.show({
                type: 'success',
                message: 'Cor criada com sucesso',
                title: 'Sucesso'
              });
              this.loadColors();
              if (response.data) {
                this.colorAdded.emit(response.data);
              }
            },
            error: (error) => {
              this.notificationService.show({
                type: 'error',
                message: error.error?.message || 'Erro ao criar cor',
                title: 'Erro'
              });
            }
          });
        }
      }
    });
  }

  deleteColor(color: ProductColor): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar Exclusão',
        message: `Tem certeza que deseja excluir a cor "${color.name}"?`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.productService.deleteColor(this.productId, color.id).subscribe({
          next: () => {
            this.notificationService.show({
              type: 'success',
              message: 'Cor excluída com sucesso',
              title: 'Sucesso'
            });
            this.loadColors();
            this.colorDeleted.emit(color.id);
          },
          error: (error) => {
            this.notificationService.show({
              type: 'error',
              message: 'Erro ao excluir cor',
              title: 'Erro'
            });
          }
        });
      }
    });
  }

  getColorPreview(hexCode: string): string {
    return hexCode;
  }
}

