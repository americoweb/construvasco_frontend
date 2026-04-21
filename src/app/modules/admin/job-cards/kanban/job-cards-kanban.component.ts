import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Subject, takeUntil } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { NotificationService } from '../../../../shared/components/feedback/notification.service';

import { JobCardService } from '../shared/job-card.service';
import {
  JobCard,
  JobCardStatus,
  JobCardPriority,
  JobCardKanbanBoard,
  KANBAN_COLUMNS,
  JOB_CARD_STATUS_LABELS,
  JOB_CARD_STATUS_COLORS,
  JOB_CARD_PRIORITY_LABELS,
  JOB_CARD_PRIORITY_COLORS,
  canTransitionTo
} from '../shared/job-card.types';

interface KanbanColumn {
  status: JobCardStatus;
  label: string;
  color: string;
  cards: JobCard[];
}

@Component({
  selector: 'app-job-cards-kanban',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    PageHeaderComponent,
    ButtonComponent,
    MatDialogModule
  ],
  templateUrl: './job-cards-kanban.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobCardsKanbanComponent implements OnInit, OnDestroy {
  columns: KanbanColumn[] = [];
  doneCards: JobCard[] = [];
  cancelledCards: JobCard[] = [];
  loading = false;

  /** IDs of all drop lists for CDK cross-list drops */
  get dropListIds(): string[] {
    return this.columns.map(c => `col-${c.status}`);
  }

  pageHeaderActions = [
    {
      label: 'Vista Lista',
      icon: 'list',
      variant: 'secondary' as const,
      callback: () => this.router.navigate(['/admin/job-cards/list'])
    },
    {
      label: 'Novo Job Card',
      icon: 'add',
      variant: 'primary' as const,
      callback: () => this.router.navigate(['/admin/job-cards/create'])
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private service: JobCardService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.service.getKanbanBoard().subscribe({
      next: response => {
        const board: JobCardKanbanBoard = (response as any).data ?? {};

        this.columns = KANBAN_COLUMNS.map(status => ({
          status,
          label: JOB_CARD_STATUS_LABELS[status],
          color: JOB_CARD_STATUS_COLORS[status],
          cards: ((board as any)[status] ?? []) as JobCard[]
        }));

        this.doneCards      = ((board as any)[JobCardStatus.DONE]      ?? []) as JobCard[];
        this.cancelledCards = ((board as any)[JobCardStatus.CANCELLED]  ?? []) as JobCard[];

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.notification.show({ type: 'error', message: 'Erro ao carregar Kanban', title: 'Erro' });
        this.cdr.markForCheck();
      }
    });
  }

  onDrop(event: CdkDragDrop<JobCard[]>, targetColumn: KanbanColumn): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.cdr.markForCheck();
      return;
    }

    const card         = event.previousContainer.data[event.previousIndex];
    const targetStatus = targetColumn.status;

    if (!canTransitionTo(card.status, targetStatus)) {
      this.notification.show({
        type: 'warning',
        message: `Não é possível mover de "${JOB_CARD_STATUS_LABELS[card.status]}" para "${JOB_CARD_STATUS_LABELS[targetStatus]}"`,
        title: 'Transição inválida'
      });
      return;
    }

    // Optimistic UI update
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
    this.cdr.markForCheck();

    // Persist to API
    this.service.updateStatus(card.id, targetStatus).subscribe({
      error: () => {
        // Rollback on failure
        this.notification.show({ type: 'error', message: 'Erro ao actualizar status', title: 'Erro' });
        this.load();
      }
    });
  }

  viewCard(jc: JobCard): void { this.router.navigate(['/admin/job-cards', jc.id]); }

  isOverdue(jc: JobCard): boolean { return jc.is_overdue; }
  isUrgent(jc: JobCard): boolean  { return jc.priority_override; }

  getPriorityColor(p: JobCardPriority): string { return JOB_CARD_PRIORITY_COLORS[p] ?? 'gray'; }
  getPriorityLabel(p: JobCardPriority): string { return JOB_CARD_PRIORITY_LABELS[p] ?? p; }

  formatDeadline(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  trackById(_: number, item: JobCard): number { return item.id; }
  trackByStatus(_: number, col: KanbanColumn): string { return col.status; }
}
