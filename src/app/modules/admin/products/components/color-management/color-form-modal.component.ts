import { Component, Inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { DynamicFormComponent } from '../../../../../shared/components/forms/dynamic-form/dynamic-form.component';
import { FormConfig } from '../../../../../shared/components/forms/form.types';
import { ProductColor, CreateProductColorRequest, UpdateProductColorRequest } from '../../shared/product.types';

export interface ColorFormModalData {
  color?: ProductColor;
  productId: number;
}

@Component({
  selector: 'app-color-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    DynamicFormComponent
  ],
  template: `
    <div class="p-6">
      <h2 mat-dialog-title class="text-xl font-semibold mb-4">
        {{ data.color ? 'Editar Cor' : 'Nova Cor' }}
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
export class ColorFormModalComponent implements OnInit {
  form!: FormGroup;
  formConfig!: FormConfig;
  initialData: any = {};
  isSaving = false;

  constructor(
    public dialogRef: MatDialogRef<ColorFormModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ColorFormModalData
  ) {}

  ngOnInit(): void {
    const isEdit = !!this.data.color;
    this.formConfig = {
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Nome da Cor',
          required: true,
          grid: { xs: 12 },
          validation: { required: true, minLength: 2, maxLength: 100 }
        },
        {
          name: 'hex_code',
          type: 'color',
          label: 'Cor (Hex)',
          required: true,
          grid: { xs: 12 },
          validation: { 
            required: true,
            pattern: /^#[0-9A-Fa-f]{6}$/
          }
        },
        {
          name: 'stock_quantity',
          type: 'number',
          label: 'Quantidade em Estoque',
          grid: { xs: 12, md: 6 },
          validation: { min: 0 }
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

    if (this.data.color) {
      this.initialData = {
        name: this.data.color.name,
        hex_code: this.data.color.hex_code,
        stock_quantity: this.data.color.stock_quantity || 0,
        is_active: this.data.color.is_active,
        sort_order: this.data.color.sort_order
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
    this.dialogRef.close({ data, isEdit: !!this.data.color });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

