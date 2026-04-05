import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { DataTableComponent, TableColumn, TableAction } from '../../../../../shared/components/data/table/data-table.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/feedback/confirm-dialog/confirm-dialog.component';
import { ButtonComponent } from '../../../../../shared/components/ui/button/button.component';
import { CardComponent } from '../../../../../shared/components/ui/card/card.component';
import { NotificationService } from '../../../../../shared/components/feedback/notification.service';
import { ProductService } from '../../shared/product.service';
import { ProductPrintArea, CreateProductPrintAreaRequest, UpdateProductPrintAreaRequest, PrintAreaPosition } from '../../shared/product.types';
import { PrintAreaFormModalComponent, PrintAreaFormModalData } from './print-area-form-modal.component';

@Component({
  selector: 'app-print-area-management',
  standalone: true,
  imports: [
    CommonModule,
    DataTableComponent,
    ButtonComponent,
    CardComponent
  ],
  templateUrl: './print-area-management.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrintAreaManagementComponent implements OnInit {
  @Input() productId!: number;
  @Output() printAreaAdded = new EventEmitter<ProductPrintArea>();
  @Output() printAreaUpdated = new EventEmitter<ProductPrintArea>();
  @Output() printAreaDeleted = new EventEmitter<number>();

  printAreas: ProductPrintArea[] = [];
  loading = false;

  columns: TableColumn[] = [
    { key: 'name', label: 'Nome', sortable: true },
    { key: 'position_label', label: 'Posição', sortable: true },
    { key: 'dimensions', label: 'Dimensões', sortable: true },
    { key: 'additional_price', label: 'Preço Adicional', sortable: true },
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
      handler: (area: ProductPrintArea) => this.editPrintArea(area)
    },
    {
      label: 'Excluir',
      icon: 'delete',
      color: 'warn',
      handler: (area: ProductPrintArea) => this.deletePrintArea(area)
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
      this.loadPrintAreas();
    }
  }

  loadPrintAreas(): void {
    this.loading = true;
    this.productService.getProductPrintAreas(this.productId).subscribe({
      next: (response) => {
        this.printAreas = response.data || [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.loading = false;
        this.notificationService.show({
          type: 'error',
          message: 'Erro ao carregar áreas de impressão',
          title: 'Erro'
        });
        this.cdr.markForCheck();
      }
    });
  }

  addPrintArea(): void {
    this.openPrintAreaForm();
  }

  editPrintArea(area: ProductPrintArea): void {
    this.openPrintAreaForm(area);
  }

  openPrintAreaForm(area?: ProductPrintArea): void {
    const dialogRef = this.dialog.open(PrintAreaFormModalComponent, {
      width: '700px',
      maxWidth: '95vw',
      data: {
        printArea: area,
        productId: this.productId
      } as PrintAreaFormModalData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.data) {
        const formData = result.data;
        const isEdit = result.isEdit;

        if (isEdit && area) {
          // Update existing print area
          const updateData: UpdateProductPrintAreaRequest = {
            name: formData.name,
            position: formData.position,
            description: formData.description || '',
            max_width_cm: formData.max_width_cm,
            max_height_cm: formData.max_height_cm,
            additional_price: formData.additional_price || 0,
            is_active: formData.is_active ?? true,
            sort_order: formData.sort_order || 0
          };

          this.productService.updatePrintArea(this.productId, area.id, updateData).subscribe({
            next: (response) => {
              this.notificationService.show({
                type: 'success',
                message: 'Área de impressão atualizada com sucesso',
                title: 'Sucesso'
              });
              this.loadPrintAreas();
              if (response.data) {
                this.printAreaUpdated.emit(response.data);
              }
            },
            error: (error) => {
              this.notificationService.show({
                type: 'error',
                message: error.error?.message || 'Erro ao atualizar área de impressão',
                title: 'Erro'
              });
            }
          });
        } else {
          // Create new print area
          const createData: CreateProductPrintAreaRequest = {
            name: formData.name,
            position: formData.position,
            description: formData.description || '',
            max_width_cm: formData.max_width_cm,
            max_height_cm: formData.max_height_cm,
            additional_price: formData.additional_price || 0,
            is_active: formData.is_active ?? true,
            sort_order: formData.sort_order || 0
          };

          this.productService.createPrintArea(this.productId, createData).subscribe({
            next: (response) => {
              this.notificationService.show({
                type: 'success',
                message: 'Área de impressão criada com sucesso',
                title: 'Sucesso'
              });
              this.loadPrintAreas();
              if (response.data) {
                this.printAreaAdded.emit(response.data);
              }
            },
            error: (error) => {
              this.notificationService.show({
                type: 'error',
                message: error.error?.message || 'Erro ao criar área de impressão',
                title: 'Erro'
              });
            }
          });
        }
      }
    });
  }

  deletePrintArea(area: ProductPrintArea): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar Exclusão',
        message: `Tem certeza que deseja excluir a área de impressão "${area.name}"?`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.productService.deletePrintArea(this.productId, area.id).subscribe({
          next: () => {
            this.notificationService.show({
              type: 'success',
              message: 'Área de impressão excluída com sucesso',
              title: 'Sucesso'
            });
            this.loadPrintAreas();
            this.printAreaDeleted.emit(area.id);
          },
          error: (error) => {
            this.notificationService.show({
              type: 'error',
              message: 'Erro ao excluir área de impressão',
              title: 'Erro'
            });
          }
        });
      }
    });
  }

  getPositionOptions() {
    return Object.values(PrintAreaPosition).map(position => ({
      value: position,
      label: this.getPositionLabel(position)
    }));
  }

  getPositionLabel(position: PrintAreaPosition): string {
    const labels: Record<PrintAreaPosition, string> = {
      [PrintAreaPosition.FRONT_CHEST]: 'Frente (Peito)',
      [PrintAreaPosition.BACK_FULL]: 'Costas (Completo)',
      [PrintAreaPosition.FULL_WRAP]: 'Envolvente Completo',
      [PrintAreaPosition.FRONT]: 'Frente',
      [PrintAreaPosition.BACK]: 'Costas',
      [PrintAreaPosition.LEFT_CHEST]: 'Peito Esquerdo',
      [PrintAreaPosition.FRONT_COVER]: 'Capa Frontal',
      [PrintAreaPosition.BODY]: 'Corpo',
      [PrintAreaPosition.FULL_POSTER]: 'Poster Completo'
    };
    return labels[position] || position;
  }
}

