import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from '../shared/category.service';
import { Category } from '../shared/category.types';
import { PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import { CardComponent } from '../../../../shared/components/ui/card/card.component';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { NotificationService } from '../../../../shared/components/feedback/notification.service';

@Component({
  selector: 'app-category-detail',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    CardComponent,
    ButtonComponent
  ],
  templateUrl: './category-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryDetailComponent implements OnInit {
  category: Category | null = null;
  loading = false;

  pageHeaderActions = [
    {
      label: 'Editar',
      icon: 'edit',
      variant: 'primary' as const,
      callback: () => this.editCategory()
    }
  ];

  constructor(
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadCategory(+params['id']);
      }
    });
  }

  loadCategory(id: number): void {
    this.loading = true;
    this.categoryService.getOne(id).subscribe({
      next: (response) => {
        this.category = response.data || null;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.loading = false;
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

  editCategory(): void {
    if (this.category) {
      this.router.navigate(['/admin/categories', this.category.id, 'edit']);
    }
  }
}

