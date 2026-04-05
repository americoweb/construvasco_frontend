import { Component, Inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { DynamicFormComponent } from '../../../../../shared/components/forms/dynamic-form/dynamic-form.component';
import { FormConfig } from '../../../../../shared/components/forms/form.types';
import { ProductSize } from '../../shared/product.types';

export interface SizeFormModalData {
  size?: ProductSize;
  productId: number;
}

@Component({
  selector: 'app-size-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    DynamicFormComponent
  ],
  template: `
    <div class="p-6">
      <h2 mat-dialog-title class="text-xl font-semibold mb-4">
        {{ data.size ? 'Editar Tamanho' : 'Novo Tamanho' }}
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
export class SizeFormModalComponent implements OnInit {
  form!: FormGroup;
  formConfig!: FormConfig;
  initialData: any = {};
  isSaving = false;

  constructor(
    public dialogRef: MatDialogRef<SizeFormModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SizeFormModalData
  ) {}

  ngOnInit(): void {
    const isEdit = !!this.data.size;
    this.formConfig = {
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Nome do Tamanho',
          required: true,
          grid: { xs: 12 },
          validation: { required: true, minLength: 1, maxLength: 100 },
          helpText: 'Ex: A2, A5, Custom, etc.'
        },
        {
          name: 'is_predefined',
          type: 'checkbox',
          label: 'Tamanho Predefinido',
          grid: { xs: 12, md: 6 },
          defaultValue: false,
          helpText: 'Marque se este é um tamanho padrão (ex: A2, A5)'
        },
        {
          name: 'is_custom',
          type: 'checkbox',
          label: 'Permitir Tamanho Customizado',
          grid: { xs: 12, md: 6 },
          defaultValue: false,
          helpText: 'Marque se permite que o cliente defina dimensões personalizadas'
        },
        {
          name: 'width_cm',
          type: 'number',
          label: 'Largura (cm)',
          grid: { xs: 12, md: 6 },
          validation: { min: 0 },
          helpText: 'Deixe vazio para tamanhos customizados',
          conditional: {
            field: 'is_predefined',
            operator: 'equals',
            value: true
          }
        },
        {
          name: 'height_cm',
          type: 'number',
          label: 'Altura (cm)',
          grid: { xs: 12, md: 6 },
          validation: { min: 0 },
          helpText: 'Deixe vazio para tamanhos customizados',
          conditional: {
            field: 'is_predefined',
            operator: 'equals',
            value: true
          }
        },
        {
          name: 'fixed_price',
          type: 'number',
          label: 'Preço Fixo (MT)',
          grid: { xs: 12, md: 6 },
          validation: { min: 0 },
          helpText: 'Preço fixo para este tamanho (deixe vazio se usar preço por m²)'
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

    if (this.data.size) {
      this.initialData = {
        name: this.data.size.name,
        width_cm: this.data.size.width_cm,
        height_cm: this.data.size.height_cm,
        is_predefined: this.data.size.is_predefined,
        is_custom: this.data.size.is_custom,
        fixed_price: this.data.size.fixed_price,
        is_active: this.data.size.is_active,
        sort_order: this.data.size.sort_order
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
    this.dialogRef.close({ data, isEdit: !!this.data.size });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

