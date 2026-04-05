import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TagService } from '../shared/tag.service';
import { Tag } from '../shared/tag.types';
import { PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import { CardComponent } from '../../../../shared/components/ui/card/card.component';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { NotificationService } from '../../../../shared/components/feedback/notification.service';

@Component({
  selector: 'app-tag-detail',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    CardComponent,
    ButtonComponent
  ],
  templateUrl: './tag-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagDetailComponent implements OnInit {
  tag: Tag | null = null;
  loading = false;

  constructor(
    private tagService: TagService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadTag(+params['id']);
      }
    });
  }

  loadTag(id: number): void {
    this.loading = true;
    this.tagService.getOne(id).subscribe({
      next: (response) => {
        this.tag = response.data || null;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.loading = false;
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

  editTag(): void {
    if (this.tag) {
      this.router.navigate(['/admin/tags', this.tag.id, 'edit']);
    }
  }
}

