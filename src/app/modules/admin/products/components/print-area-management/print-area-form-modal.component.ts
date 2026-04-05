import { Component, Inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { DynamicFormComponent } from '../../../../../shared/components/forms/dynamic-form/dynamic-form.component';
import { FormConfig } from '../../../../../shared/components/forms/form.types';
import { ProductPrintArea, CreateProductPrintAreaRequest, UpdateProductPrintAreaRequest, PrintAreaPosition } from '../../shared/product.types';

export interface PrintAreaFormModalData {
  printArea?: ProductPrintArea;
  productId: number;
}

@Component({
  selector: 'app-print-area-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    DynamicFormComponent
  ],
  template: `
    <div class="p-6">
      <h2 mat-dialog-title class="text-xl font-semibold mb-4">
        {{ data.printArea ? 'Editar Área de Impressão' : 'Nova Área de Impressão' }}
      </h2>
      <mat-dialog-content>
        <app-dynamic-form
          [config]="formConfig"
          [initialData]="initialData"
          [loading]="isSaving"
          (formReady)="onFormReady($event)"
          (formSubmit)="onSubmit($event)"
          (formCancel)="onCancel()">
        </app-dynamic-form>
      </mat-dialog-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrintAreaFormModalComponent implements OnInit {
  form!: FormGroup;
  formConfig!: FormConfig;
  initialData: any = {};
  isSaving = false;

  positionOptions = [
    { value: PrintAreaPosition.FRONT_CHEST, label: 'Frente (Peito)' },
    { value: PrintAreaPosition.BACK_FULL, label: 'Costas (Completo)' },
    { value: PrintAreaPosition.FULL_WRAP, label: 'Envolvente Completo' },
    { value: PrintAreaPosition.FRONT, label: 'Frente' },
    { value: PrintAreaPosition.BACK, label: 'Costas' },
    { value: PrintAreaPosition.LEFT_CHEST, label: 'Peito Esquerdo' },
    { value: PrintAreaPosition.FRONT_COVER, label: 'Capa Frontal' },
    { value: PrintAreaPosition.BODY, label: 'Corpo' },
    { value: PrintAreaPosition.FULL_POSTER, label: 'Poster Completo' }
  ];

  constructor(
    public dialogRef: MatDialogRef<PrintAreaFormModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PrintAreaFormModalData
  ) {}

  ngOnInit(): void {
    const isEdit = !!this.data.printArea;
    this.formConfig = {
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Nome da Área',
          required: true,
          grid: { xs: 12 },
          validation: { required: true, minLength: 2, maxLength: 100 }
        },
        {
          name: 'position',
          type: 'select',
          label: 'Posição',
          required: true,
          grid: { xs: 12, md: 6 },
          options: this.positionOptions,
          validation: { required: true }
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Descrição',
          grid: { xs: 12 },
          validation: { maxLength: 500 }
        },
        {
          name: 'max_width_cm',
          type: 'number',
          label: 'Largura Máxima (cm)',
          required: true,
          grid: { xs: 12, md: 6 },
          validation: { required: true, min: 0.1 }
        },
        {
          name: 'max_height_cm',
          type: 'number',
          label: 'Altura Máxima (cm)',
          required: true,
          grid: { xs: 12, md: 6 },
          validation: { required: true, min: 0.1 }
        },
        {
          name: 'additional_price',
          type: 'number',
          label: 'Preço Adicional',
          grid: { xs: 12, md: 6 },
          validation: { min: 0 },
          defaultValue: 0
        },
        {
          name: 'is_active',
          type: 'checkbox',
          label: 'Ativo',
          grid: { xs: 12, md: 6 },
          defaultValue: true
        },
        {
          name: 'sort_order',
          type: 'number',
          label: 'Ordem',
          grid: { xs: 12, md: 6 },
          defaultValue: 0,
          validation: { min: 0 }
        }
      ],
      layout: 'vertical',
      showSubmit: true,
      showCancel: true,
      submitText: isEdit ? 'Atualizar' : 'Criar',
      cancelText: 'Cancelar'
    };

    if (this.data.printArea) {
      this.initialData = {
        name: this.data.printArea.name,
        position: this.data.printArea.position,
        description: this.data.printArea.description || '',
        max_width_cm: this.data.printArea.max_width_cm,
        max_height_cm: this.data.printArea.max_height_cm,
        additional_price: this.data.printArea.additional_price || 0,
        is_active: this.data.printArea.is_active,
        sort_order: this.data.printArea.sort_order
      };
    }
  }

  onFormReady(form: FormGroup): void {
    this.form = form;
  }

  onSubmit(data: any): void {
    if (!this.form || this.form.invalid) {
      return;
    }

    this.isSaving = true;
    this.dialogRef.close({ data, isEdit: !!this.data.printArea });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

