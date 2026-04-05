import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import { DynamicFormComponent } from '../../../../shared/components/forms/dynamic-form/dynamic-form.component';
import { CardComponent } from '../../../../shared/components/ui/card/card.component';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { NotificationService } from '../../../../shared/components/feedback/notification.service';
import { TagService } from '../shared/tag.service';
import { Tag, CreateTagRequest, UpdateTagRequest } from '../shared/tag.types';
import { FormConfig } from '../../../../shared/components/forms/form.types';

@Component({
  selector: 'app-tag-form',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    DynamicFormComponent,
    CardComponent,
    ButtonComponent
  ],
  templateUrl: './tag-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagFormComponent implements OnInit {
  form!: FormGroup;
  formConfig!: FormConfig;
  initialData: any = {};
  isEditMode = false;
  tagId?: number;
  isSaving = false;
  isLoading = false;

  breadcrumbs = [
    { label: 'Tags', url: '/admin/tags' },
    { label: 'Nova Tag' }
  ];

  constructor(
    private tagService: TagService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {
    this.setupForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.tagId = +params['id'];
        this.isEditMode = true;
        this.isLoading = true;
        this.breadcrumbs[1] = { label: 'Editar Tag' };
        this.cdr.markForCheck();
        this.loadTag();
      }
    });
  }

  loadTag(): void {
    if (!this.tagId) return;

    this.tagService.getOne(this.tagId).subscribe({
      next: (response) => {
        if (response.data) {
          this.initialData = {
            name: response.data.name,
            color: response.data.color || ''
          };
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.show({
          type: 'error',
          message: 'Erro ao carregar tag',
          title: 'Erro'
        });
        this.router.navigate(['/admin/tags']);
        this.cdr.markForCheck();
      }
    });
  }

  setupForm(): void {
    this.formConfig = {
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Nome da Tag',
          required: true,
          grid: { xs: 12 },
          validation: { required: true, minLength: 2, maxLength: 255 }
        },
        {
          name: 'color',
          type: 'text',
          label: 'Cor (Hex)',
          grid: { xs: 12 },
          helpText: 'Formato: #RRGGBB (ex: #FF5733)',
          validation: { pattern: '^#[0-9A-Fa-f]{6}$' }
        }
      ],
      layout: 'vertical',
      showSubmit: false,
      showCancel: false,
      validateOnChange: true
    };
    this.cdr.markForCheck();
  }

  onFormReady(form: FormGroup): void {
    this.form = form;
    if (this.initialData && Object.keys(this.initialData).length > 0) {
      this.form.patchValue(this.initialData);
    }
  }

  onFormChange(data: any): void {
    // Handle form changes if needed
  }

  onSave(): void {
    if (!this.form || this.form.invalid) {
      this.notificationService.show({
        type: 'error',
        message: 'Por favor, preencha todos os campos obrigatórios',
        title: 'Formulário Inválido'
      });
      return;
    }

    this.isSaving = true;
    const formData = { ...this.form.value };
    if (!formData.color) {
      delete formData.color;
    }

    if (this.isEditMode && this.tagId) {
      this.tagService.update(this.tagId, formData).subscribe({
        next: (response) => {
          this.notificationService.show({
            type: 'success',
            message: 'Tag atualizada com sucesso',
            title: 'Sucesso'
          });
          this.router.navigate(['/admin/tags', this.tagId]);
        },
        error: (error) => {
          this.isSaving = false;
          this.notificationService.show({
            type: 'error',
            message: error.error?.message || 'Erro ao atualizar tag',
            title: 'Erro'
          });
          this.cdr.markForCheck();
        }
      });
    } else {
      this.tagService.create(formData).subscribe({
        next: (response) => {
          this.notificationService.show({
            type: 'success',
            message: 'Tag criada com sucesso',
            title: 'Sucesso'
          });
          this.router.navigate(['/admin/tags', response.data?.id]);
        },
        error: (error) => {
          this.isSaving = false;
          this.notificationService.show({
            type: 'error',
            message: error.error?.message || 'Erro ao criar tag',
            title: 'Erro'
          });
          this.cdr.markForCheck();
        }
      });
    }
  }

  onCancel(): void {
    if (this.isEditMode && this.tagId) {
      this.router.navigate(['/admin/tags', this.tagId]);
    } else {
      this.router.navigate(['/admin/tags']);
    }
  }
}

