import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Testimonial } from '../product.types';
import { TestimonialService } from './testimonial.service';

@Component({
  selector: 'app-testimonial',
  templateUrl: './testimonial.component.html',
  styleUrls: ['./testimonial.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class TestimonialComponent implements OnInit {
  @Input() testimonials: Testimonial[] = [];
  @Input() productId?: number;

  isLoading = false;
  error: string | null = null;
  showAll = false;
  readonly initialVisibleCount = 2;

  constructor(private testimonialService: TestimonialService) {}

  ngOnInit(): void {
    if (this.productId && this.testimonials.length === 0) {
      this.loadTestimonials();
    }
  }

  loadTestimonials(): void {
    if (!this.productId) return;

    this.isLoading = true;
    this.error = null;

    this.testimonialService.getTestimonialsForProduct(this.productId).subscribe({
      next: (response) => {
        this.testimonials = response.data || [];
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Erro ao carregar depoimentos';
        this.isLoading = false;
        console.error('Error loading testimonials:', error);
      }
    });
  }

  getDefaultPhoto(): string {
    return 'https://i.pravatar.cc/150?img=0';
  }

  get visibleTestimonials(): Testimonial[] {
    if (this.showAll) {
      return this.testimonials;
    }
    return this.testimonials.slice(0, this.initialVisibleCount);
  }

  get hasMoreTestimonials(): boolean {
    return this.testimonials.length > this.initialVisibleCount;
  }
}

