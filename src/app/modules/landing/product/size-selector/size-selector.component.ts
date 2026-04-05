import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../product.service';
import { ProductSize, ProductSizeRestriction, PriceCalculationResponse, PricingType } from '../product.types';

export interface SelectedSize {
  sizeId?: number;
  widthCm?: number;
  heightCm?: number;
  price: number;
  areaSqm?: number;
}

@Component({
  selector: 'app-product-size-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './size-selector.component.html',
  styleUrls: ['./size-selector.component.scss']
})
export class ProductSizeSelectorComponent implements OnInit, OnChanges {
  @Input() productId!: number;
  @Input() pricingType?: PricingType;
  @Input() pricePerSqm?: number;
  @Input() sizes: ProductSize[] = [];
  @Input() restrictions: ProductSizeRestriction | null = null;
  @Input() required: boolean = false;
  
  @Output() sizeSelected = new EventEmitter<SelectedSize>();
  @Output() validationErrors = new EventEmitter<string[]>();

  sizeForm: FormGroup;
  selectedSize: ProductSize | null = null;
  customWidth: number | null = null;
  customHeight: number | null = null;
  priceCalculation: PriceCalculationResponse | null = null;
  validationErrorsList: string[] = [];
  isCalculatingPrice = false;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService
  ) {
    this.sizeForm = this.fb.group({
      sizeOption: ['', this.required ? Validators.required : null],
      customWidth: [null],
      customHeight: [null]
    });
  }

  ngOnInit(): void {
    this.setupFormListeners();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sizes'] && this.sizes.length > 0) {
      // Auto-select first predefined size if available
      const predefinedSize = this.sizes.find(s => s.is_predefined);
      if (predefinedSize && !this.selectedSize) {
        this.selectSize(predefinedSize.id);
      }
    }
  }

  setupFormListeners(): void {
    this.sizeForm.get('sizeOption')?.valueChanges.subscribe(value => {
      if (value === 'custom') {
        this.selectedSize = null;
        this.customWidth = null;
        this.customHeight = null;
        this.sizeForm.get('customWidth')?.setValidators([Validators.required, Validators.min(0.1)]);
        this.sizeForm.get('customHeight')?.setValidators([Validators.required, Validators.min(0.1)]);
      } else if (value) {
        const size = this.sizes.find(s => s.id === parseInt(value));
        if (size) {
          this.selectSize(size.id);
        }
        this.sizeForm.get('customWidth')?.clearValidators();
        this.sizeForm.get('customHeight')?.clearValidators();
      }
      this.sizeForm.get('customWidth')?.updateValueAndValidity();
      this.sizeForm.get('customHeight')?.updateValueAndValidity();
    });

    this.sizeForm.get('customWidth')?.valueChanges.subscribe(() => {
      this.onCustomSizeChange();
    });

    this.sizeForm.get('customHeight')?.valueChanges.subscribe(() => {
      this.onCustomSizeChange();
    });
  }

  selectSize(sizeId: number): void {
    const size = this.sizes.find(s => s.id === sizeId);
    if (!size) return;

    this.selectedSize = size;
    this.customWidth = null;
    this.customHeight = null;
    this.validationErrorsList = [];

    if (this.pricingType === 'sqm_based') {
      this.calculatePrice(size.id);
    } else {
      const price = size.fixed_price || 0;
      this.emitSizeSelected({
        sizeId: size.id,
        price,
        areaSqm: size.area_sqm
      });
    }
  }

  onCustomSizeChange(): void {
    const width = this.sizeForm.get('customWidth')?.value;
    const height = this.sizeForm.get('customHeight')?.value;

    if (!width || !height) {
      this.priceCalculation = null;
      return;
    }

    this.customWidth = width;
    this.customHeight = height;

    // Validate custom size
    this.validateCustomSize(width, height);

    if (this.validationErrorsList.length === 0 && this.pricingType === 'sqm_based') {
      this.calculatePrice(undefined, width, height);
    } else if (this.validationErrorsList.length === 0) {
      // For fixed pricing, we still need to calculate if there's a base price
      this.emitSizeSelected({
        widthCm: width,
        heightCm: height,
        price: 0, // Will be calculated by backend
        areaSqm: (width * height) / 10000
      });
    }
  }

  validateCustomSize(width: number, height: number): void {
    this.validationErrorsList = [];

    if (!this.restrictions) {
      return;
    }

    if (this.restrictions.min_width_cm && width < this.restrictions.min_width_cm) {
      this.validationErrorsList.push(`Largura mínima é ${this.restrictions.min_width_cm}cm`);
    }

    if (this.restrictions.max_width_cm && width > this.restrictions.max_width_cm) {
      this.validationErrorsList.push(`Largura máxima é ${this.restrictions.max_width_cm}cm`);
    }

    if (this.restrictions.min_height_cm && height < this.restrictions.min_height_cm) {
      this.validationErrorsList.push(`Altura mínima é ${this.restrictions.min_height_cm}cm`);
    }

    if (this.restrictions.max_height_cm && height > this.restrictions.max_height_cm) {
      this.validationErrorsList.push(`Altura máxima é ${this.restrictions.max_height_cm}cm`);
    }

    if (this.restrictions.min_aspect_ratio || this.restrictions.max_aspect_ratio) {
      const aspectRatio = width / height;
      
      if (this.restrictions.min_aspect_ratio && aspectRatio < this.restrictions.min_aspect_ratio) {
        this.validationErrorsList.push(`Proporção mínima é ${this.restrictions.min_aspect_ratio}`);
      }

      if (this.restrictions.max_aspect_ratio && aspectRatio > this.restrictions.max_aspect_ratio) {
        this.validationErrorsList.push(`Proporção máxima é ${this.restrictions.max_aspect_ratio}`);
      }
    }

    if (this.restrictions.step_increment_cm) {
      const widthRemainder = width % this.restrictions.step_increment_cm;
      const heightRemainder = height % this.restrictions.step_increment_cm;
      
      if (widthRemainder > 0.01 || heightRemainder > 0.01) {
        this.validationErrorsList.push(`Dimensões devem ser múltiplos de ${this.restrictions.step_increment_cm}cm`);
      }
    }

    this.validationErrors.emit(this.validationErrorsList);
  }

  calculatePrice(sizeId?: number, widthCm?: number, heightCm?: number): void {
    this.isCalculatingPrice = true;
    
    this.productService.calculatePrice(this.productId, {
      size_id: sizeId,
      width_cm: widthCm,
      height_cm: heightCm
    }).subscribe({
      next: (response) => {
        this.priceCalculation = response.data;
        this.isCalculatingPrice = false;

        this.emitSizeSelected({
          sizeId,
          widthCm,
          heightCm,
          price: response.data.price,
          areaSqm: response.data.area_sqm
        });
      },
      error: (error) => {
        console.error('Error calculating price:', error);
        this.isCalculatingPrice = false;
      }
    });
  }

  emitSizeSelected(size: SelectedSize): void {
    this.sizeSelected.emit(size);
  }

  get predefinedSizes(): ProductSize[] {
    return this.sizes.filter(s => s.is_predefined);
  }

  get hasCustomOption(): boolean {
    return this.sizes.some(s => s.is_custom);
  }

  get displayPrice(): string {
    if (this.priceCalculation) {
      return new Intl.NumberFormat('pt-MZ', {
        style: 'currency',
        currency: 'MZN',
        minimumFractionDigits: 2
      }).format(this.priceCalculation.price);
    }
    return '';
  }

  get displayArea(): string {
    if (this.priceCalculation && this.priceCalculation.area_sqm > 0) {
      return `${this.priceCalculation.area_sqm.toFixed(4)} m²`;
    }
    if (this.selectedSize?.area_sqm) {
      return `${this.selectedSize.area_sqm.toFixed(4)} m²`;
    }
    return '';
  }
}
