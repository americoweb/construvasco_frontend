import { Component, OnInit, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from './product.service';
import { TestimonialService } from './testimonial/testimonial.service';
import { CartService, AddToCartRequest } from '../../../core/services/cart.service';
import { ConfigService } from '../../../core/services/config.service';
import { ProductDetail, ProductColor, ProductPrintArea, ProductSize, ProductSizeRestriction, Testimonial, ProductCategory } from './product.types';
import { LandingHeaderComponent } from '../../../shared/components/layout/landing-header/landing-header.component';
import { TestimonialComponent } from './testimonial/testimonial.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/layout/breadcrumb/breadcrumb.component';
import { ProductSizeSelectorComponent, SelectedSize } from './size-selector/size-selector.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LandingHeaderComponent,
    TestimonialComponent,
    BreadcrumbComponent,
    ProductSizeSelectorComponent,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ]
})
export class ProductComponent implements OnInit {
  product: ProductDetail | null = null;
  isLoading = false;
  error: string | null = null;
  
  customizationForm: FormGroup;
  selectedColor: ProductColor | null = null;
  selectedPrintArea: ProductPrintArea | null = null;
  selectedSize: SelectedSize | null = null;
  productSizes: ProductSize[] = [];
  sizeRestrictions: ProductSizeRestriction | null = null;
  logoFile: File | null = null;
  logoPreview: string | null = null;
  referenceFile: File | null = null;
  referencePreview: string | null = null;
  useReferenceAsFinalArt: boolean = false;
  
  isGeneratingHouse = false;
  isGeneratingFloorPlan = false;
  isGeneratingMockup = false;
  asyncStatusMessage: string | null = null;
  mockupUrl: string | null = null;
  houseImageUrl: string | null = null;
  floorPlanImageUrl: string | null = null;
  generationId: string | null = null;
  designId: number | null = null;
  
  quantity: number = 1;
  totalPrice: number = 0;
  
  cartItemCount: number = 0;
  itemAddedToCart: boolean = false;
  isAddingToCart = false;
  submitAttempted = false;
  
  testimonials: Testimonial[] = [];
  
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Início', url: '/' },
    { label: 'Produtos', url: '/produtos' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private testimonialService: TestimonialService,
    private cartService: CartService,
    private configService: ConfigService,
    private fb: FormBuilder,
    private _changeDetectorRef: ChangeDetectorRef
  ) {
    this.customizationForm = this.fb.group({
      colorId: ['', Validators.required],
      printAreaId: ['', Validators.required],
      designPrompt: ['', []], // Validation will be set dynamically based on logo
      logo: [null],
      referenceImage: [null],
      projectType: ['', Validators.required],
      houseType: ['', Validators.required],
      area: ['', [Validators.required, Validators.min(20)]],
      width: ['', [Validators.required, Validators.min(2)]],
      length: ['', [Validators.required, Validators.min(2)]],
      floors: [1, [Validators.required, Validators.min(1)]],
      rooms: [2, [Validators.required, Validators.min(1)]],
      budget: ['', [Validators.required, Validators.min(50000)]],
      deadline: ['', Validators.required],
      architecturalStyle: ['', Validators.required],
      terrainLocation: ['', Validators.required],
      landInfo: ['', [Validators.required, Validators.minLength(10)]],
      whatsapp: ['', [Validators.required, Validators.pattern(/^(84|85|86|87)[0-9]{7}$/)]]
    });

    // Update designPrompt validation when logo or reference changes
    this.customizationForm.get('logo')?.valueChanges.subscribe(() => {
      this.updateDesignPromptValidation();
    });
    this.customizationForm.get('referenceImage')?.valueChanges.subscribe(() => {
      this.updateDesignPromptValidation();
    });

    // Subscribe to cart count
    this.cartService.getCartCount().subscribe(count => {
      this.cartItemCount = count;
    });
  }

  /**
   * Update designPrompt validation: required only if no logo or reference is provided
   */
  updateDesignPromptValidation(): void {
    const designPromptControl = this.customizationForm.get('designPrompt');
    if (!designPromptControl) return;

    // If using reference as final art, prompt is not needed
    if (this.useReferenceAsFinalArt) {
      designPromptControl.setValidators([]);
    } else if (this.logoFile || this.referenceFile) {
      // Logo or reference provided: prompt is optional
      designPromptControl.setValidators([]);
    } else {
      // No logo or reference: prompt is required with minimum length
      designPromptControl.setValidators([Validators.required, Validators.minLength(5)]);
    }
    designPromptControl.updateValueAndValidity({ emitEvent: false });
  }

  get ctaHintMessage(): string {
    if (!this.product) {
      return 'Carregando informações do produto...';
    }

    if (!this.selectedColor) {
      return 'Selecione uma cor para continuar.';
    }

    if (!this.selectedPrintArea) {
      return 'Selecione uma área de impressão para continuar.';
    }

    if (!this.customizationForm.get('projectType')?.value) {
      return 'Selecione o tipo de projeto.';
    }

    if (this.customizationForm.get('landInfo')?.invalid) {
      return 'Adicione os dados do terreno para continuar.';
    }

    if (this.customizationForm.get('whatsapp')?.invalid) {
      return 'Informe um WhatsApp válido para seguimento do projeto.';
    }

    if (this.product.has_sizes && !this.selectedSize) {
      return 'Selecione um tamanho para continuar.';
    }

    if (!this.logoFile && !this.referenceFile) {
      const prompt = (this.customizationForm.value.designPrompt || '').trim();
      if (prompt.length < 5) {
        return 'Adicione um prompt com no mínimo 5 caracteres, ou envie um arquivo.';
      }
    }

    if (!this.houseImageUrl) {
      return 'Pronto para gerar a imagem da casa.';
    }

    if (!this.floorPlanImageUrl) {
      return 'Agora gere a planta com base no conceito da casa.';
    }

    return 'Casa e planta prontas para a próxima etapa.';
  }

  get canUseReferenceAsFinalArt(): boolean {
    if (!this.referencePreview || this.isGeneratingMockup || !this.product) {
      return false;
    }

    if (!this.selectedColor || !this.selectedPrintArea) {
      return false;
    }

    if (this.product.has_sizes && !this.selectedSize) {
      return false;
    }

    return true;
  }

  private touchAllFormFields(): void {
    this.customizationForm.markAllAsTouched();
    Object.values(this.customizationForm.controls).forEach(control => {
      control.updateValueAndValidity({ onlySelf: true });
    });
  }

  private focusFirstInvalidField(): void {
    if (typeof document === 'undefined') {
      return;
    }

    const firstInvalid = document.querySelector('.ng-invalid[formcontrolname], .ng-invalid input, .ng-invalid select, .ng-invalid textarea') as HTMLElement | null;
    if (firstInvalid) {
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => firstInvalid.focus(), 120);
    }
  }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      // Check if we came from a suggestion (like MVP logic)
      // Try to get state from navigation first, then fallback to history state
      const navigation = this.router.getCurrentNavigation();
      let state = navigation?.extras?.state;
      
      // If navigation state is not available (e.g., page refresh), try history state
      if (!state && typeof window !== 'undefined' && window.history && window.history.state) {
        state = window.history.state;
      }
      
      if (state && state.fromSuggestion && state.mockupUrl && state.designPrompt) {
        // Pre-populate with suggestion data (MVP logic)
        this.loadProductWithSuggestion(slug, state);
      } else {
        this.loadProduct(slug);
      }
    } else {
      this.error = 'Produto não encontrado';
    }
  }

  loadProduct(slug: string): void {
    this.isLoading = true;
    this.error = null;
    
    this.productService.getProductBySlug(slug).subscribe({
      next: (response) => {
        this.product = response.data;
        this.quantity = this.product.min_quantity;
        this.updateTotalPrice();
        
        // Set default color and print area if available
        if (this.product.active_colors.length > 0) {
          this.selectedColor = this.product.active_colors[0];
          this.customizationForm.patchValue({ colorId: this.selectedColor.id });
        }
        
        if (this.product.active_print_areas.length > 0) {
          this.selectedPrintArea = this.product.active_print_areas[0];
          this.customizationForm.patchValue({ printAreaId: this.selectedPrintArea.id });
        }
        
        // Initialize validation based on current logo state
        this.updateDesignPromptValidation();
        
        // Load testimonials for this product
        this.loadTestimonials();
        
        // Load sizes if product has sizes
        if (this.product.has_sizes) {
          this.loadSizes();
        }
        
        // Update breadcrumbs
        this.updateBreadcrumbs();
        
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar produto. Por favor, tente novamente.';
        this.isLoading = false;
        console.error('Error loading product:', err);
      }
    });
  }

  /**
   * Load product with pre-generated mockup from AI suggestion (MVP logic)
   */
  loadProductWithSuggestion(slug: string, suggestionState: any): void {
    this.isLoading = true;
    this.error = null;
    
    this.productService.getProductBySlug(slug).subscribe({
      next: (response) => {
        this.product = response.data;
        this.quantity = this.product.min_quantity;
        this.updateTotalPrice();
        
        // Set default color and print area if available
        if (this.product.active_colors.length > 0) {
          this.selectedColor = this.product.active_colors[0];
          this.customizationForm.patchValue({ colorId: this.selectedColor.id });
        }
        
        if (this.product.active_print_areas.length > 0) {
          this.selectedPrintArea = this.product.active_print_areas[0];
          this.customizationForm.patchValue({ printAreaId: this.selectedPrintArea.id });
        }
        
        // Pre-populate with suggestion data (MVP logic)
        const mockupUrl = this.getFullImageUrl(suggestionState.mockupUrl);
        this.mockupUrl = mockupUrl;
        this.customizationForm.patchValue({ 
          designPrompt: suggestionState.designPrompt 
        });
        
        // Create design record with the pre-generated mockup
        this.createDesignRecordFromSuggestion(suggestionState.mockupUrl, suggestionState.designPrompt);
        
        // Initialize validation based on current logo state
        this.updateDesignPromptValidation();
        
        // Load testimonials for this product
        this.loadTestimonials();
        
        // Load sizes if product has sizes
        if (this.product.has_sizes) {
          this.loadSizes();
        }
        
        // Update breadcrumbs
        this.updateBreadcrumbs();
        
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar produto. Por favor, tente novamente.';
        this.isLoading = false;
        console.error('Error loading product:', err);
      }
    });
  }

  /**
   * Create design record from pre-generated suggestion mockup (MVP logic)
   */
  createDesignRecordFromSuggestion(mockupUrl: string, prompt: string): void {
    if (!this.product || !this.selectedColor || !this.selectedPrintArea) {
      return;
    }

    const designRequest = {
      product_id: this.product.id,
      product_color_id: this.selectedColor.id,
      product_print_area_id: this.selectedPrintArea.id,
      prompt: prompt,
      mockup_url: mockupUrl
    };

    this.productService.createDesign(designRequest).subscribe({
      next: (response) => {
        this.designId = response.data.id;
        console.log('Design record created from suggestion:', this.designId);
      },
      error: (err) => {
        console.error('Error creating design record from suggestion:', err);
        // Don't block the flow, design creation is for tracking
      }
    });
  }

  onColorSelect(colorId: number): void {
    this.selectedColor = this.product?.active_colors.find(c => c.id === colorId) || null;
    this.customizationForm.patchValue({ colorId: colorId });
  }

  onPrintAreaSelect(areaId: number): void {
    this.selectedPrintArea = this.product?.active_print_areas.find(a => a.id === areaId) || null;
    this.customizationForm.patchValue({ printAreaId: areaId });
  }

  handleLogoFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      console.log('Logo file selected:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      this.logoFile = file;
      const reader = new FileReader();
      reader.onloadend = () => {
        this.logoPreview = reader.result as string;
        console.log('Logo preview generated, file stored:', !!this.logoFile);
      };
      reader.readAsDataURL(file);
      // Update validation when logo is added
      this.updateDesignPromptValidation();
    } else {
      console.warn('No file selected in logo input');
    }
  }

  removeLogo(): void {
    this.logoFile = null;
    this.logoPreview = null;
    this.customizationForm.patchValue({ logo: null });
    // Update validation when logo is removed
    this.updateDesignPromptValidation();
  }

  handleReferenceFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.referenceFile = file;
      const reader = new FileReader();
      reader.onloadend = () => {
        this.referencePreview = reader.result as string;
        // Reset the use as final art flag when new reference is uploaded
        this.useReferenceAsFinalArt = false;
        this.updateDesignPromptValidation();
      };
      reader.readAsDataURL(file);
    }
  }

  removeReference(): void {
    this.referenceFile = null;
    this.referencePreview = null;
    this.useReferenceAsFinalArt = false;
    this.customizationForm.patchValue({ referenceImage: null });
    this.updateDesignPromptValidation();
  }

  toggleUseReferenceAsFinalArt(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.useReferenceAsFinalArt = checkbox.checked;
    this.updateDesignPromptValidation();
  }

  /**
   * Use reference image directly as final art (skip mockup generation)
   */
  useReferenceAsArt(): void {
    if (!this.product || !this.referenceFile || !this.referencePreview) {
      this.error = 'Por favor, carregue uma imagem de referência primeiro.';
      return;
    }

    if (!this.selectedColor || !this.selectedPrintArea) {
      this.error = 'Por favor, selecione cor e área de impressão.';
      return;
    }

    // Check if size is required
    if (this.product.has_sizes && !this.selectedSize) {
      this.error = 'Por favor, selecione um tamanho.';
      return;
    }

    // Use reference preview as temporary mockup URL for display
    this.asyncStatusMessage = 'A preparar arte de referência...';
    this.mockupUrl = this.referencePreview;
    this.isGeneratingMockup = true;

    // Reset quantity to MOQ when using reference as art
    if (this.product) {
      this.quantity = this.product.min_quantity;
      this.updateTotalPrice();
    }

    // Create design record with reference image
    this.createDesignRecordFromReference();
  }

  /**
   * Create design record when using reference as final art
   */
  createDesignRecordFromReference(): void {
    if (!this.product || !this.selectedColor || !this.selectedPrintArea || !this.referenceFile) {
      this.isGeneratingMockup = false;
      return;
    }

    // Use reference preview as temporary mockup URL
    const tempMockupUrl = this.referencePreview || '';

    const designRequest = {
      product_id: this.product.id,
      product_color_id: this.selectedColor.id,
      product_print_area_id: this.selectedPrintArea.id,
      prompt: this.customizationForm.value.designPrompt || 'Imagem de referência usada como arte final',
      mockup_url: tempMockupUrl
    };

    this.productService.createDesign(designRequest).subscribe({
      next: (response) => {
        this.designId = response.data.id;
        
        // Upload reference image file to get proper server URL
        if (this.referenceFile && this.designId) {
          this.productService.uploadReferenceImageToDesign(this.designId, this.referenceFile).subscribe({
            next: (uploadResponse) => {
              console.log('Reference image uploaded to design successfully');
              // Update mockup URL if backend returns updated design with proper URL
              if (uploadResponse.data?.mockup_url) {
                this.mockupUrl = this.getFullImageUrl(uploadResponse.data.mockup_url);
              }
              this.asyncStatusMessage = null;
              this.isGeneratingMockup = false;
            },
            error: (err) => {
              console.error('Error uploading reference image to design:', err);
              // Keep using the data URL if upload fails
              this.asyncStatusMessage = null;
              this.isGeneratingMockup = false;
            }
          });
        } else {
          this.asyncStatusMessage = null;
          this.isGeneratingMockup = false;
        }
      },
      error: (err) => {
        console.error('Error creating design record from reference:', err);
        this.error = 'Erro ao criar design. Por favor, tente novamente.';
        this.asyncStatusMessage = null;
        this.isGeneratingMockup = false;
      }
    });
  }

  async generateHouse(): Promise<void> {
    this.submitAttempted = true;

    if (!this.product) {
      this.error = 'Projeto não encontrado.';
      return;
    }

    // Validate: either logo, reference, OR prompt (with min length if no logo/reference)
    if (!this.logoFile && !this.referenceFile && (!this.customizationForm.value.designPrompt || this.customizationForm.value.designPrompt.trim().length < 5)) {
      this.error = 'Por favor, forneça um prompt (mínimo 5 caracteres) ou uma imagem de referência.';
      return;
    }

    if (!this.customizationForm.valid) {
      this.touchAllFormFields();
      this.focusFirstInvalidField();
      this.error = 'Por favor, preencha todos os campos obrigatórios.';
      return;
    }

    this.touchAllFormFields();
    this.isGeneratingMockup = true;
    this.isGeneratingHouse = true;
    this.asyncStatusMessage = 'Processando ficheiros...';
    this.error = null;
    this.mockupUrl = null;
    this.houseImageUrl = null;
    this.floorPlanImageUrl = null;
    this.generationId = null;
    this.itemAddedToCart = false;

    try {
      const projectBrief = this.buildProjectBrief();

      // Prepare request
      const request: any = {
        product_id: this.product.id,
        design_prompt: projectBrief,
        color_id: this.customizationForm.value.colorId,
        print_area_id: this.customizationForm.value.printAreaId
      };

      // Add logo if provided
      if (this.logoFile) {
        console.log('Converting logo to base64...', {
          fileName: this.logoFile.name,
          fileSize: this.logoFile.size,
          fileType: this.logoFile.type
        });
        const logoBase64 = await this.productService.fileToBase64(this.logoFile);
        request.logo_base64 = logoBase64;
        request.logo_mime_type = this.logoFile.type;
        console.log('Logo converted, base64 length:', logoBase64.length);
      } else {
        console.warn('No logo file found when generating mockup');
      }

      // Add reference image if provided
      if (this.referenceFile) {
        const refBase64 = await this.productService.fileToBase64(this.referenceFile);
        request.reference_image_base64 = refBase64;
        request.reference_image_mime_type = this.referenceFile.type;
      }

      // Log the request payload (without the full base64 to avoid console spam)
      console.log('Sending mockup generation request:', {
        product_id: request.product_id,
        has_logo: !!request.logo_base64,
        logo_mime_type: request.logo_mime_type,
        has_reference: !!request.reference_image_base64,
        design_prompt: request.design_prompt,
        color_id: request.color_id,
        print_area_id: request.print_area_id
      });

      // Generate house render (step 1)
      this.asyncStatusMessage = 'Gerando imagem da casa...';
      this.productService.generateHouse(request).subscribe({
        next: (response) => {
          const housePath = response.data.house_image_url;
          this.generationId = response.data.generation_id;
          this.houseImageUrl = this.getFullImageUrl(housePath);
          this.mockupUrl = this.houseImageUrl;
          
          // Reset quantity to MOQ after mockup generation
          if (this.product) {
            this.quantity = this.product.min_quantity;
            this.updateTotalPrice();
          }
          
          // Create design record with house image
          this.asyncStatusMessage = 'Salvando design...';
          this.createDesignRecord(housePath);
        },
        error: (err) => {
          this.error = err.error?.message || 'Erro ao gerar imagem da casa. Por favor, tente novamente.';
          this.asyncStatusMessage = null;
          this.isGeneratingHouse = false;
          this.isGeneratingMockup = false;
          console.error('Error generating house render:', err);
        }
      });
    } catch (err) {
      this.error = 'Erro ao processar imagens. Por favor, tente novamente.';
      this.asyncStatusMessage = null;
      this.isGeneratingHouse = false;
      this.isGeneratingMockup = false;
    }
  }

  async generateFloorPlan(): Promise<void> {
    this.submitAttempted = true;

    if (!this.product || !this.houseImageUrl) {
      this.error = 'Gere primeiro a imagem da casa.';
      return;
    }

    if (!this.customizationForm.valid) {
      this.touchAllFormFields();
      this.focusFirstInvalidField();
      this.error = 'Por favor, preencha todos os campos obrigatórios.';
      return;
    }

    this.isGeneratingMockup = true;
    this.isGeneratingFloorPlan = true;
    this.asyncStatusMessage = 'Gerando planta...';
    this.error = null;

    try {
      const request: any = {
        product_id: this.product.id,
        design_prompt: this.buildProjectBrief(),
        color_id: this.customizationForm.value.colorId,
        print_area_id: this.customizationForm.value.printAreaId,
        generation_id: this.generationId || undefined,
        house_image_url: this.houseImageUrl
      };

      if (this.referenceFile) {
        const refBase64 = await this.productService.fileToBase64(this.referenceFile);
        request.reference_image_base64 = refBase64;
        request.reference_image_mime_type = this.referenceFile.type;
      }

      this.productService.generateFloorPlan(request).subscribe({
        next: (response) => {
          const floorPlanPath = response.data.floorplan_image_url;
          this.generationId = response.data.generation_id;
          this.floorPlanImageUrl = this.getFullImageUrl(floorPlanPath);
          this.asyncStatusMessage = null;
          this.isGeneratingFloorPlan = false;
          this.isGeneratingMockup = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Erro ao gerar planta. Por favor, tente novamente.';
          this.asyncStatusMessage = null;
          this.isGeneratingFloorPlan = false;
          this.isGeneratingMockup = false;
        }
      });
    } catch (err) {
      this.error = 'Erro ao preparar os dados para gerar a planta.';
      this.asyncStatusMessage = null;
      this.isGeneratingFloorPlan = false;
      this.isGeneratingMockup = false;
    }
  }

  createDesignRecord(mockupUrl: string): void {
    if (!this.product) return;
    const projectBrief = this.buildProjectBrief();

    const designRequest = {
      product_id: this.product.id,
      product_color_id: this.customizationForm.value.colorId,
      product_print_area_id: this.customizationForm.value.printAreaId,
      prompt: projectBrief,
      mockup_url: mockupUrl
    };

    this.productService.createDesign(designRequest).subscribe({
      next: (response) => {
        this.designId = response.data.id;
        
        // Upload logo file if provided
        if (this.logoFile && this.designId) {
          this.productService.uploadLogoToDesign(this.designId, this.logoFile).subscribe({
            next: () => {
              console.log('Logo uploaded to design successfully');
            },
            error: (err) => {
              console.error('Error uploading logo to design:', err);
              // Don't block the flow, logo upload is optional
            }
          });
        }

        // Upload reference image file if provided
        if (this.referenceFile && this.designId) {
          this.productService.uploadReferenceImageToDesign(this.designId, this.referenceFile).subscribe({
            next: () => {
              console.log('Reference image uploaded to design successfully');
            },
            error: (err) => {
              console.error('Error uploading reference image to design:', err);
              // Don't block the flow, reference upload is optional
            }
          });
        }

        this.asyncStatusMessage = null;
        this.isGeneratingHouse = false;
        this.isGeneratingMockup = false;
      },
      error: (err) => {
        console.error('Error creating design record:', err);
        // Don't show error to user, mockup was generated successfully
        this.asyncStatusMessage = null;
        this.isGeneratingHouse = false;
        this.isGeneratingMockup = false;
      }
    });
  }

  onQuantityInput(value: number | string): void {
    // Allow empty/null values while typing - don't block user input
    if (value === '' || value === null || value === undefined) {
      // Set to 0 temporarily so user can clear and type new number
      this.quantity = 0;
      this.updateTotalPrice();
      return;
    }
    
    const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
    if (!isNaN(numValue) && numValue > 0) {
      // Update quantity while typing (don't enforce MOQ yet - that happens on blur)
      this.quantity = numValue;
      this.updateTotalPrice();
      this._changeDetectorRef.markForCheck();
    }
  }

  onQuantityChange(): void {
    if (this.product) {
      // Enforce MOQ only on blur/change
      if (this.quantity < this.product.min_quantity || isNaN(this.quantity) || this.quantity <= 0) {
        this.quantity = this.product.min_quantity;
      }
      this.updateTotalPrice();
      this._changeDetectorRef.markForCheck();
    }
  }

  updateTotalPrice(): void {
    if (!this.product) {
      this.totalPrice = 0;
      return;
    }

    // Use actual quantity value (even if below MOQ) for real-time calculation while typing
    // MOQ enforcement happens on blur via onQuantityChange()
    const qty = this.quantity > 0 ? this.quantity : 0;

    // If product has sizes and a size is selected, use size price
    if (this.product.has_sizes && this.selectedSize) {
      const unitPrice = this.selectedSize.price;
      this.totalPrice = unitPrice * qty;
    } else {
      // Use base product price
      this.totalPrice = this.product.price * qty;
    }
  }

  async addToCart(): Promise<void> {
    if (!this.product || !this.mockupUrl) {
      this.error = 'Por favor, gere um mockup antes de adicionar ao carrinho.';
      return;
    }

    if (this.isGeneratingMockup || !this.designId) {
      this.error = 'Aguarde a geração do design terminar antes de adicionar ao carrinho.';
      return;
    }

    if (!this.selectedColor || !this.selectedPrintArea) {
      this.error = 'Por favor, selecione cor e área de impressão.';
      return;
    }

    // Check if size is required
    if (this.product.has_sizes && !this.selectedSize) {
      this.error = 'Por favor, selecione um tamanho.';
      return;
    }

    // Use size price if available, otherwise use product price
    const unitPrice = (this.product.has_sizes && this.selectedSize) 
      ? this.selectedSize.price 
      : this.product.price;

    const itemData: AddToCartRequest = {
      product_id: this.product.id,
      design_id: this.designId || null,
      product_color_id: this.selectedColor.id,
      product_print_area_id: this.selectedPrintArea.id,
      quantity: this.quantity,
      unit_price: unitPrice,
      design_prompt: this.buildProjectBrief(),
      mockup_url: this.mockupUrl
    };

    try {
      this.isAddingToCart = true;
      await this.cartService.addItem(itemData).toPromise();
      // Update cart count
      this.cartService.getCartCount().subscribe(count => {
        this.cartItemCount = count;
        this._changeDetectorRef.markForCheck();
      });
      // Show success state instead of navigating
      this.itemAddedToCart = true;
      this.error = null;
      this.isAddingToCart = false;
      this._changeDetectorRef.markForCheck();
    } catch (err) {
      this.error = 'Erro ao adicionar ao carrinho. Por favor, tente novamente.';
      this.isAddingToCart = false;
      console.error('Error adding to cart:', err);
    }
  }

  goToCheckout(): void {
    this.router.navigate(['/checkout']);
  }

  continueShopping(): void {
    this.itemAddedToCart = false;
    // Optionally reset the form or keep it for another customization
    // For now, just hide the success message
  }

  startOver(): void {
    this.mockupUrl = null;
    this.houseImageUrl = null;
    this.floorPlanImageUrl = null;
    this.generationId = null;
    this.designId = null;
    this.useReferenceAsFinalArt = false;
    this.itemAddedToCart = false;
    this.customizationForm.reset();
    if (this.product) {
      if (this.product.active_colors.length > 0) {
        this.selectedColor = this.product.active_colors[0];
        this.customizationForm.patchValue({ colorId: this.selectedColor.id });
      }
      if (this.product.active_print_areas.length > 0) {
        this.selectedPrintArea = this.product.active_print_areas[0];
        this.customizationForm.patchValue({ printAreaId: this.selectedPrintArea.id });
      }
      // Reset quantity to MOQ
      this.quantity = this.product.min_quantity;
      this.updateTotalPrice();
    }
    this.logoFile = null;
    this.logoPreview = null;
    this.referenceFile = null;
    this.referencePreview = null;
    this.updateDesignPromptValidation();
  }

  /**
   * Convert relative image path to full URL
   */
  getFullImageUrl(path: string | null): string {
    if (!path) {
      return 'https://via.placeholder.com/600x600';
    }
    
    // If it's already a full URL, return as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // Convert relative path to full URL
    return this.configService.getFileUrl(path);
  }

  get displayImage(): string {
    // For display: use mockup if generated, otherwise use product image (image_url)
    // Note: base_image_url is only used for mockup generation (prompting), not for display
    if (this.mockupUrl) {
      return this.mockupUrl;
    }
    // Use image_url for display (product image), not base_image_url
    return this.getFullImageUrl(this.product?.image_url || null);
  }

  private buildProjectBrief(): string {
    const formValue = this.customizationForm.value;
    const notes = (formValue.designPrompt || '').trim();

    return [
      `Projeto: ${formValue.projectType}`,
      `Tipologia: ${formValue.houseType}`,
      `Area: ${formValue.area} m2`,
      `Dimensoes: ${formValue.width}m x ${formValue.length}m`,
      `Pisos: ${formValue.floors}`,
      `Quartos: ${formValue.rooms}`,
      `Orcamento: ${formValue.budget} MT`,
      `Prazo: ${formValue.deadline}`,
      `Estilo: ${formValue.architecturalStyle}`,
      `Localizacao: ${formValue.terrainLocation}`,
      `Terreno: ${formValue.landInfo}`,
      `WhatsApp: +258${formValue.whatsapp}`,
      notes ? `Observacoes: ${notes}` : ''
    ].filter(Boolean).join(' | ');
  }

  loadSizes(): void {
    if (!this.product) return;

    this.productService.getProductSizes(this.product.id).subscribe({
      next: (response) => {
        this.productSizes = response.data;
      },
      error: (err) => {
        console.error('Error loading product sizes:', err);
      }
    });

    this.productService.getProductSizeRestrictions(this.product.id).subscribe({
      next: (response) => {
        this.sizeRestrictions = response.data;
      },
      error: (err) => {
        console.error('Error loading size restrictions:', err);
      }
    });
  }

  onSizeSelected(size: SelectedSize): void {
    this.selectedSize = size;
    this.updateTotalPrice();
  }

  loadTestimonials(): void {
    if (!this.product) return;

    this.testimonialService.getTestimonialsForProduct(this.product.id).subscribe({
      next: (response) => {
        this.testimonials = response.data || [];
      },
      error: (error) => {
        console.error('Error loading testimonials:', error);
        // Don't show error to user, just log it
      }
    });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  /**
   * Update breadcrumbs based on product category hierarchy
   */
  updateBreadcrumbs(): void {
    if (!this.product) {
      // Still show basic breadcrumb even if product not loaded
      this.breadcrumbItems = [
        { label: 'Início', url: '/' },
        { label: 'Produtos', url: '/produtos' }
      ];
      return;
    }

    this.breadcrumbItems = [
      { label: 'Início', url: '/' },
      { label: 'Produtos', url: '/produtos' }
    ];

    // Add category hierarchy if available
    // Products can have multiple categories, use the first one (or primary if available)
    if (this.product.categories && this.product.categories.length > 0) {
      // Use the first category (you could also find a primary category if that field exists)
      const category = this.product.categories[0];
      
      // Build the full hierarchy: parent -> category
      const categoryHierarchy: ProductCategory[] = [];
      
      // If category has a parent, add it to hierarchy
      if (category.parent) {
        categoryHierarchy.push(category.parent);
      }
      
      // Add the category itself
      categoryHierarchy.push(category);
      
      // Add all items in hierarchy to breadcrumbs
      categoryHierarchy.forEach(cat => {
        this.breadcrumbItems.push({
          label: cat.name,
          url: `/produtos/${cat.slug}`
        });
      });
    }

    // Add product name as last item (not clickable)
    this.breadcrumbItems.push({
      label: this.product.name
    });
    
    // Ensure change detection runs
    this._changeDetectorRef.markForCheck();
  }
}

