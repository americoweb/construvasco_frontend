import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import { DynamicFormComponent } from '../../../../shared/components/forms/dynamic-form/dynamic-form.component';
import { CardComponent } from '../../../../shared/components/ui/card/card.component';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { NotificationService } from '../../../../shared/components/feedback/notification.service';
import { CategoryService } from '../shared/category.service';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../shared/category.types';
import { FormConfig } from '../../../../shared/components/forms/form.types';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    DynamicFormComponent,
    CardComponent,
    ButtonComponent
  ],
  templateUrl: './category-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryFormComponent implements OnInit {
  form!: FormGroup;
  formConfig!: FormConfig;
  initialData: any = {};
  isEditMode = false;
  categoryId?: number;
  isSaving = false;
  isLoading = false;
  categories: Category[] = [];

  breadcrumbs = [
    { label: 'Categorias', url: '/admin/categories' },
    { label: 'Nova Categoria' }
  ];

  constructor(
    private categoryService: CategoryService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {
    this.setupForm();
  }

  ngOnInit(): void {
    this.loadCategories();
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.categoryId = +params['id'];
        this.isEditMode = true;
        this.isLoading = true;
        this.breadcrumbs[1] = { label: 'Editar Categoria' };
        this.cdr.markForCheck();
        this.loadCategory();
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getActive().subscribe({
      next: (response) => {
        if (response.data) {
          this.categories = response.data;
          this.updateFormConfig();
        }
      }
    });
  }

  loadCategory(): void {
    if (!this.categoryId) return;

    this.categoryService.getOne(this.categoryId).subscribe({
      next: (response) => {
        if (response.data) {
          this.initialData = {
            name: response.data.name,
            description: response.data.description || '',
            image_url: response.data.image_url || '',
            parent_id: response.data.parent_id || null,
            sort_order: response.data.sort_order || 0,
            is_active: response.data.is_active
          };
          this.isLoading = false;
          
          // Patch form if it's already ready (don't patch image_url - it's a file field)
          if (this.form) {
            const dataToPatch = { ...this.initialData };
            delete dataToPatch.image_url;
            this.form.patchValue(dataToPatch);
          }
          
          this.cdr.markForCheck();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.show({
          type: 'error',
          message: 'Erro ao carregar categoria',
          title: 'Erro'
        });
        this.router.navigate(['/admin/categories']);
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
          label: 'Nome da Categoria',
          required: true,
          grid: { xs: 12 },
          validation: { required: true, minLength: 2, maxLength: 255 }
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Descrição',
          grid: { xs: 12 },
          validation: { maxLength: 1000 }
        },
        {
          name: 'image_url',
          type: 'file',
          label: 'Imagem da Categoria',
          grid: { xs: 12, md: 6 },
          accept: 'image/png,image/jpeg,image/jpg,image/webp',
          multiple: false,
          maxFiles: 1,
          maxFileSize: 10 * 1024 * 1024, // 10MB
          helpText: 'PNG, JPG, JPEG ou WebP (máx. 10MB)'
        },
        {
          name: 'parent_id',
          type: 'select',
          label: 'Categoria Pai',
          grid: { xs: 12, md: 6 },
          options: [],
          helpText: 'Deixe em branco para criar uma categoria raiz'
        },
        {
          name: 'sort_order',
          type: 'number',
          label: 'Ordem de Exibição',
          grid: { xs: 12, md: 6 },
          defaultValue: 0,
          validation: { min: 0 }
        },
        {
          name: 'is_active',
          type: 'checkbox',
          label: 'Ativo',
          grid: { xs: 12, md: 6 },
          defaultValue: true
        }
      ],
      layout: 'vertical',
      showSubmit: false,
      showCancel: false,
      validateOnChange: true
    };
    this.updateFormConfig();
  }

  updateFormConfig(): void {
    const parentField = this.formConfig.fields.find(f => f.name === 'parent_id');
    if (parentField) {
      parentField.options = [
        { value: null, label: 'Nenhuma (Categoria Raiz)' },
        ...this.categories
          .filter(c => !this.categoryId || c.id !== this.categoryId)
          .map(c => ({ value: c.id, label: c.name }))
      ];
    }
    this.cdr.markForCheck();
  }

  onFormReady(form: FormGroup): void {
    this.form = form;
    if (this.initialData && Object.keys(this.initialData).length > 0) {
      // Don't patch file fields from initialData (they're URLs, not files)
      const dataToPatch = { ...this.initialData };
      delete dataToPatch.image_url;
      this.form.patchValue(dataToPatch);
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
    const imageFile: File | null = formData.image_url instanceof File ? formData.image_url : null;

    // Remove file objects from formData (they'll be uploaded separately)
    delete formData.image_url;

    if (this.isEditMode && this.categoryId) {
      // Update mode: upload image first if provided, then update category
      this.uploadImageAndUpdate(this.categoryId, formData, imageFile);
    } else {
      // Create mode: create category first, then upload image
      this.createCategoryAndUploadImage(formData, imageFile);
    }
  }

  private uploadImageAndUpdate(
    categoryId: number,
    formData: any,
    imageFile: File | null
  ): void {
    const uploads: Promise<any>[] = [];

    if (imageFile) {
      uploads.push(
        firstValueFrom(this.categoryService.uploadImageFile(categoryId, imageFile))
      );
    }

    // Wait for upload to complete (if any), then update category
    if (uploads.length > 0) {
      Promise.all(uploads).then(() => {
        // Update category with other fields
        this.categoryService.update(categoryId, formData).subscribe({
          next: (response) => {
            this.notificationService.show({
              type: 'success',
              message: 'Categoria atualizada com sucesso',
              title: 'Sucesso'
            });
            this.router.navigate(['/admin/categories', categoryId]);
          },
          error: (error) => {
            this.isSaving = false;
            this.notificationService.show({
              type: 'error',
              message: error.error?.message || 'Erro ao atualizar categoria',
              title: 'Erro'
            });
            this.cdr.markForCheck();
          }
        });
      }).catch((error) => {
        this.isSaving = false;
        this.notificationService.show({
          type: 'error',
          message: 'Erro ao fazer upload da imagem',
          title: 'Erro'
        });
        this.cdr.markForCheck();
      });
    } else {
      // No image to upload, just update category
      this.categoryService.update(categoryId, formData).subscribe({
        next: (response) => {
          this.notificationService.show({
            type: 'success',
            message: 'Categoria atualizada com sucesso',
            title: 'Sucesso'
          });
          this.router.navigate(['/admin/categories', categoryId]);
        },
        error: (error) => {
          this.isSaving = false;
          this.notificationService.show({
            type: 'error',
            message: error.error?.message || 'Erro ao atualizar categoria',
            title: 'Erro'
          });
          this.cdr.markForCheck();
        }
      });
    }
  }

  private createCategoryAndUploadImage(
    formData: any,
    imageFile: File | null
  ): void {
    // Create category first
    this.categoryService.create(formData).subscribe({
      next: (response) => {
        if (!response.data) {
          this.isSaving = false;
          this.notificationService.show({
            type: 'error',
            message: 'Erro ao criar categoria',
            title: 'Erro'
          });
          this.cdr.markForCheck();
          return;
        }

        const categoryId = response.data.id;
        const uploads: Promise<any>[] = [];

        if (imageFile) {
          uploads.push(
            firstValueFrom(this.categoryService.uploadImageFile(categoryId, imageFile))
          );
        }

        // Wait for upload to complete (if any)
        if (uploads.length > 0) {
          Promise.all(uploads).then(() => {
            this.notificationService.show({
              type: 'success',
              message: 'Categoria criada com sucesso',
              title: 'Sucesso'
            });
            this.router.navigate(['/admin/categories', categoryId]);
          }).catch((error) => {
            this.notificationService.show({
              type: 'warning',
              message: 'Categoria criada, mas houve erro ao fazer upload da imagem',
              title: 'Aviso'
            });
            this.router.navigate(['/admin/categories', categoryId]);
          });
        } else {
          this.notificationService.show({
            type: 'success',
            message: 'Categoria criada com sucesso',
            title: 'Sucesso'
          });
          this.router.navigate(['/admin/categories', categoryId]);
        }
      },
      error: (error) => {
        this.isSaving = false;
        this.notificationService.show({
          type: 'error',
          message: error.error?.message || 'Erro ao criar categoria',
          title: 'Erro'
        });
        this.cdr.markForCheck();
      }
    });
  }

  onCancel(): void {
    if (this.isEditMode && this.categoryId) {
      this.router.navigate(['/admin/categories', this.categoryId]);
    } else {
      this.router.navigate(['/admin/categories']);
    }
  }
}

