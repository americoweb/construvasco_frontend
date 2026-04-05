import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import { DynamicFormComponent } from '../../../../shared/components/forms/dynamic-form/dynamic-form.component';
import { CardComponent } from '../../../../shared/components/ui/card/card.component';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { SizeManagementComponent } from '../components/size-management/size-management.component';
import { NotificationService } from '../../../../shared/components/feedback/notification.service';
import { ProductService } from '../shared/product.service';
import { Product, ProductStatus, PricingType, CreateProductRequest, UpdateProductRequest, Category, Tag } from '../shared/product.types';
import { CategoryService } from '../../categories/shared/category.service';
import { TagService } from '../../tags/shared/tag.service';
import { FormConfig } from '../../../../shared/components/forms/form.types';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    DynamicFormComponent,
    CardComponent,
    ButtonComponent,
    SizeManagementComponent
  ],
  templateUrl: './product-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductFormComponent implements OnInit {
  form!: FormGroup;
  formConfig!: FormConfig;
  initialData: any = {};
  isEditMode = false;
  productId?: number;
  isSaving = false;
  isLoading = false;

  breadcrumbs = [
    { label: 'Produtos', url: '/admin/products' },
    { label: 'Novo Produto' }
  ];

  categories: Category[] = [];
  tags: Tag[] = [];

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private tagService: TagService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {
    // Initialize form config immediately
    this.setupForm();
    this.loadCategoriesAndTags();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.productId = +params['id'];
        this.isEditMode = true;
        this.isLoading = true;
        this.breadcrumbs[1] = { label: 'Editar Produto' };
        this.cdr.markForCheck();
        this.loadProduct();
      }
    });
  }

  loadProduct(): void {
    if (!this.productId) return;

    this.productService.getOne(this.productId).subscribe({
      next: (response) => {
        if (response.data) {
          this.initialData = {
            name: response.data.name,
            description: response.data.description || '',
            price: response.data.price,
            min_quantity: response.data.min_quantity,
            image_url: response.data.image_url || '',
            base_image_url: response.data.base_image_url || '',
            design_hint: response.data.design_hint || '',
            status: response.data.status,
            is_featured: response.data.is_featured,
            sort_order: response.data.sort_order || 0,
            has_sizes: response.data.has_sizes || false,
            pricing_type: response.data.pricing_type || PricingType.FIXED,
            price_per_sqm: response.data.price_per_sqm || null,
            category_ids: response.data.categories?.map(c => c.id) || [],
            tag_ids: response.data.tags?.map(t => t.id) || []
          };
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.show({
          type: 'error',
          message: 'Erro ao carregar produto',
          title: 'Erro'
        });
        this.router.navigate(['/admin/products']);
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
          label: 'Nome do Produto',
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
          name: 'price',
          type: 'number',
          label: 'Preço (MT)',
          required: true,
          grid: { xs: 12, md: 6 },
          validation: { required: true, min: 0 }
        },
        {
          name: 'min_quantity',
          type: 'number',
          label: 'Quantidade Mínima',
          required: true,
          grid: { xs: 12, md: 6 },
          validation: { required: true, min: 1 }
        },
        {
          name: 'image_url',
          type: 'file',
          label: 'Imagem do Produto',
          grid: { xs: 12, md: 6 },
          accept: 'image/png,image/jpeg,image/jpg,image/webp',
          multiple: false,
          maxFiles: 1,
          maxFileSize: 10 * 1024 * 1024, // 10MB
          helpText: 'PNG, JPG, JPEG ou WebP (máx. 10MB)'
        },
        {
          name: 'base_image_url',
          type: 'file',
          label: 'Imagem Base do Produto',
          grid: { xs: 12, md: 6 },
          accept: 'image/png,image/jpeg,image/jpg,image/webp',
          multiple: false,
          maxFiles: 1,
          maxFileSize: 10 * 1024 * 1024, // 10MB
          helpText: 'PNG, JPG, JPEG ou WebP (máx. 10MB)'
        },
        {
          name: 'design_hint',
          type: 'textarea',
          label: 'Dica de Design',
          grid: { xs: 12 },
          helpText: 'Dicas para o usuário sobre como criar designs para este produto',
          validation: { maxLength: 1000 }
        },
        {
          name: 'status',
          type: 'select',
          label: 'Status',
          grid: { xs: 12, md: 6 },
          options: [
            { value: ProductStatus.ACTIVE, label: 'Ativo' },
            { value: ProductStatus.INACTIVE, label: 'Inativo' },
            { value: ProductStatus.OUT_OF_STOCK, label: 'Fora de Estoque' },
            { value: ProductStatus.DISCONTINUED, label: 'Descontinuado' }
          ],
          defaultValue: ProductStatus.ACTIVE
        },
        {
          name: 'is_featured',
          type: 'checkbox',
          label: 'Produto em Destaque',
          grid: { xs: 12, md: 6 },
          defaultValue: false
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
          name: 'has_sizes',
          type: 'checkbox',
          label: 'Produto tem tamanhos',
          grid: { xs: 12, md: 6 },
          defaultValue: false,
          helpText: 'Marque se este produto precisa de seleção de tamanho (ex: adesivos, banners)'
        },
        {
          name: 'pricing_type',
          type: 'select',
          label: 'Tipo de Preço',
          grid: { xs: 12, md: 6 },
          options: [
            { value: PricingType.FIXED, label: 'Preço Fixo' },
            { value: PricingType.SQM_BASED, label: 'Por Metro Quadrado (SQM)' }
          ],
          defaultValue: PricingType.FIXED,
          helpText: 'Selecione como o preço será calculado para este produto',
          conditional: {
            field: 'has_sizes',
            operator: 'equals',
            value: true
          }
        },
        {
          name: 'price_per_sqm',
          type: 'number',
          label: 'Preço por m² (MT)',
          grid: { xs: 12, md: 6 },
          validation: { min: 0 },
          helpText: 'Preço por metro quadrado (usado apenas para produtos com preço SQM)',
          conditional: {
            field: 'pricing_type',
            operator: 'equals',
            value: PricingType.SQM_BASED
          }
        },
        {
          name: 'category_ids',
          type: 'multiselect',
          label: 'Categorias',
          grid: { xs: 12, md: 6 },
          options: [],
          helpText: 'Selecione uma ou mais categorias para este produto'
        },
        {
          name: 'tag_ids',
          type: 'multiselect',
          label: 'Tags',
          grid: { xs: 12, md: 6 },
          options: [],
          helpText: 'Selecione uma ou mais tags para este produto'
        }
      ],
      layout: 'vertical',
      showSubmit: false,
      showCancel: false,
      validateOnChange: true
    };
    this.updateFormOptions();
    this.cdr.markForCheck();
  }

  loadCategoriesAndTags(): void {
    this.categoryService.getActive().subscribe({
      next: (response) => {
        if (response.data) {
          this.categories = response.data;
          this.updateFormOptions();
        }
      }
    });

    this.tagService.getAll().subscribe({
      next: (response) => {
        if (response.data) {
          this.tags = response.data;
          this.updateFormOptions();
        }
      }
    });
  }

  updateFormOptions(): void {
    const categoryField = this.formConfig.fields.find(f => f.name === 'category_ids');
    if (categoryField) {
      categoryField.options = this.categories.map(c => ({ value: c.id, label: c.name }));
    }

    const tagField = this.formConfig.fields.find(f => f.name === 'tag_ids');
    if (tagField) {
      tagField.options = this.tags.map(t => ({ value: t.id, label: t.name }));
    }
    this.cdr.markForCheck();
  }

  onFormReady(form: FormGroup): void {
    this.form = form;
    if (this.initialData && Object.keys(this.initialData).length > 0) {
      // Don't patch file fields from initialData (they're URLs, not files)
      const dataToPatch = { ...this.initialData };
      delete dataToPatch.image_url;
      delete dataToPatch.base_image_url;
      this.form.patchValue(dataToPatch);
    }

    // Watch for has_sizes changes to show/hide size management
    this.form.get('has_sizes')?.valueChanges.subscribe(hasSizes => {
      this.cdr.markForCheck();
    });
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
    const baseImageFile: File | null = formData.base_image_url instanceof File ? formData.base_image_url : null;

    // Remove file objects from formData (they'll be uploaded separately)
    delete formData.image_url;
    delete formData.base_image_url;

    if (this.isEditMode && this.productId) {
      // Update mode: upload images first if provided, then update product
      this.uploadImagesAndUpdate(this.productId, formData, imageFile, baseImageFile);
    } else {
      // Create mode: create product first, then upload images
      this.createProductAndUploadImages(formData, imageFile, baseImageFile);
    }
  }

  private uploadImagesAndUpdate(
    productId: number,
    formData: any,
    imageFile: File | null,
    baseImageFile: File | null
  ): void {
    const uploads: Promise<any>[] = [];

    if (imageFile) {
      uploads.push(
        firstValueFrom(this.productService.uploadImageFile(productId, imageFile))
      );
    }

    if (baseImageFile) {
      uploads.push(
        firstValueFrom(this.productService.uploadBaseImageFile(productId, baseImageFile))
      );
    }

    // Wait for all uploads to complete, then update product
    Promise.all(uploads).then(() => {
      // Update product with other fields
      this.productService.update(productId, formData).subscribe({
        next: (response) => {
          this.notificationService.show({
            type: 'success',
            message: 'Produto atualizado com sucesso',
            title: 'Sucesso'
          });
          this.router.navigate(['/admin/products', productId]);
        },
        error: (error) => {
          this.isSaving = false;
          this.notificationService.show({
            type: 'error',
            message: error.error?.message || 'Erro ao atualizar produto',
            title: 'Erro'
          });
          this.cdr.markForCheck();
        }
      });
    }).catch((error) => {
      this.isSaving = false;
      this.notificationService.show({
        type: 'error',
        message: 'Erro ao fazer upload das imagens',
        title: 'Erro'
      });
      this.cdr.markForCheck();
    });
  }

  private createProductAndUploadImages(
    formData: any,
    imageFile: File | null,
    baseImageFile: File | null
  ): void {
    // Create product first
    this.productService.create(formData).subscribe({
      next: (response) => {
        if (!response.data) {
          this.isSaving = false;
          this.notificationService.show({
            type: 'error',
            message: 'Erro ao criar produto',
            title: 'Erro'
          });
          this.cdr.markForCheck();
          return;
        }

        const productId = response.data.id;
        const uploads: Promise<any>[] = [];

        if (imageFile) {
          uploads.push(
            firstValueFrom(this.productService.uploadImageFile(productId, imageFile))
          );
        }

        if (baseImageFile) {
          uploads.push(
            firstValueFrom(this.productService.uploadBaseImageFile(productId, baseImageFile))
          );
        }

        // Wait for uploads to complete
        if (uploads.length > 0) {
          Promise.all(uploads).then(() => {
            this.notificationService.show({
              type: 'success',
              message: 'Produto criado com sucesso',
              title: 'Sucesso'
            });
            this.router.navigate(['/admin/products', productId]);
          }).catch((error) => {
            this.isSaving = false;
            this.notificationService.show({
              type: 'error',
              message: 'Produto criado, mas houve erro ao fazer upload das imagens',
              title: 'Aviso'
            });
            this.router.navigate(['/admin/products', productId]);
            this.cdr.markForCheck();
          });
        } else {
          this.notificationService.show({
            type: 'success',
            message: 'Produto criado com sucesso',
            title: 'Sucesso'
          });
          this.router.navigate(['/admin/products', productId]);
        }
      },
      error: (error) => {
        this.isSaving = false;
        this.notificationService.show({
          type: 'error',
          message: error.error?.message || 'Erro ao criar produto',
          title: 'Erro'
        });
        this.cdr.markForCheck();
      }
    });
  }

  onCancel(): void {
    if (this.isEditMode && this.productId) {
      this.router.navigate(['/admin/products', this.productId]);
    } else {
      this.router.navigate(['/admin/products']);
    }
  }

  onSizeAdded(): void {
    // Size was added, form will refresh automatically
  }

  onSizeUpdated(): void {
    // Size was updated, form will refresh automatically
  }

  onSizeDeleted(): void {
    // Size was deleted, form will refresh automatically
  }
}

