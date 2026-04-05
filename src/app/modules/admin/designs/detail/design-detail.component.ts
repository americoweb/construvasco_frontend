import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import { CardComponent } from '../../../../shared/components/ui/card/card.component';
import { BadgeComponent } from '../../../../shared/components/ui/badge/badge.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../../shared/components/data/table/data-table.component';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { LoadingComponent } from '../../../../shared/components/ui/loading/loading.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../../shared/components/feedback/confirm-dialog/confirm-dialog.component';
import { NotificationService } from '../../../../shared/components/feedback/notification.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DesignService } from '../shared/design.service';
import { Design, DesignRefinement, DesignStatus } from '../shared/design.types';
import { ConfigService } from '../../../../core/services/config.service';

@Component({
  selector: 'app-design-detail',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    CardComponent,
    BadgeComponent,
    DataTableComponent,
    ButtonComponent,
    LoadingComponent,
    EmptyStateComponent,
    MatDialogModule
  ],
  templateUrl: './design-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DesignDetailComponent implements OnInit, OnDestroy {
  design: Design | null = null;
  refinements: DesignRefinement[] = [];
  loading = false;
  loadingRefinements = false;
  loadingFiles = false;
  generatingMockup = false;
  activeTab: 'info' | 'mockup' | 'refinements' | 'metadata' | 'printing' = 'info';
  printingFiles: any = null;

  pageHeaderActions = [
    {
      label: 'Gerar Mockup',
      icon: 'image',
      variant: 'primary' as const,
      callback: () => this.generateMockup(),
      condition: () => this.design && (this.design.has_logo || this.design.has_reference_image)
    },
    {
      label: 'Excluir',
      icon: 'delete',
      variant: 'danger' as const,
      callback: () => this.deleteDesign()
    }
  ];

  refinementColumns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true, width: '80px' },
    { 
      key: 'refinement_prompt', 
      label: 'Prompt de Refinamento', 
      sortable: false,
      format: (value: string) => value ? (value.length > 60 ? value.substring(0, 60) + '...' : value) : '-'
    },
    { 
      key: 'status', 
      label: 'Status', 
      type: 'badge',
      format: (value: DesignStatus) => this.getStatusLabel(value)
    },
    { 
      key: 'created_at', 
      label: 'Criado em', 
      format: (value: string) => {
        if (!value) return '-';
        try {
          return new Date(value).toLocaleDateString('pt-BR');
        } catch {
          return value;
        }
      }
    }
  ];

  refinementActions: TableAction[] = [
    {
      label: 'Ver Mockup',
      icon: 'visibility',
      handler: (refinement: DesignRefinement) => this.viewRefinementMockup(refinement)
    }
  ];

  breadcrumbs = [
    { label: 'Designs', url: '/admin/designs' },
    { label: 'Detalhes' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private designService: DesignService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private dialog: MatDialog,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.loadDesign(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDesign(id: number): void {
    this.loading = true;
    this.designService.getDesignWithDetails(id).subscribe({
      next: (response) => {
        if (response.data) {
          this.design = response.data;
          this.breadcrumbs[1] = { label: `Design #${this.design.id}` };
          this.loadRefinements();
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.loading = false;
        this.notificationService.show({
          type: 'error',
          message: 'Erro ao carregar design',
          title: 'Erro'
        });
        this.router.navigate(['/admin/designs']);
        this.cdr.markForCheck();
      }
    });
  }

  loadRefinements(): void {
    if (!this.design) return;
    this.loadingRefinements = true;
    this.designService.getDesignRefinements(this.design.id).subscribe({
      next: (response) => {
        this.refinements = response.data || [];
        this.loadingRefinements = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.loadingRefinements = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadPrintingFiles(): void {
    if (!this.design) return;
    this.loadingFiles = true;
    this.designService.getDesignFilesForPrinting(this.design.id).subscribe({
      next: (response) => {
        this.printingFiles = response.data || null;
        this.loadingFiles = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.loadingFiles = false;
        this.notificationService.show({
          type: 'error',
          message: 'Erro ao carregar arquivos para impressão',
          title: 'Erro'
        });
        this.cdr.markForCheck();
      }
    });
  }

  generateMockup(): void {
    if (!this.design) return;

    this.generatingMockup = true;
    this.designService.generateMockup(this.design.id).subscribe({
      next: (response) => {
        this.design = response.data;
        this.generatingMockup = false;
        this.notificationService.show({
          type: 'success',
          message: 'Mockup gerado com sucesso',
          title: 'Sucesso'
        });
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.generatingMockup = false;
        this.notificationService.show({
          type: 'error',
          message: error.error?.message || 'Erro ao gerar mockup',
          title: 'Erro'
        });
        this.cdr.markForCheck();
      }
    });
  }

  downloadLogo(): void {
    if (!this.design) return;

    this.designService.downloadLogo(this.design.id).subscribe({
      next: (blob) => {
        this.designService.downloadFile(blob, `logo_design_${this.design!.id}.png`);
        this.notificationService.show({
          type: 'success',
          message: 'Logo baixado com sucesso',
          title: 'Sucesso'
        });
      },
      error: (error) => {
        this.notificationService.show({
          type: 'error',
          message: 'Erro ao baixar logo',
          title: 'Erro'
        });
      }
    });
  }

  downloadReferenceImage(): void {
    if (!this.design) return;

    this.designService.downloadReferenceImage(this.design.id).subscribe({
      next: (blob) => {
        this.designService.downloadFile(blob, `reference_design_${this.design!.id}.png`);
        this.notificationService.show({
          type: 'success',
          message: 'Imagem de referência baixada com sucesso',
          title: 'Sucesso'
        });
      },
      error: (error) => {
        this.notificationService.show({
          type: 'error',
          message: 'Erro ao baixar imagem de referência',
          title: 'Erro'
        });
      }
    });
  }

  setActiveTab(tab: 'info' | 'mockup' | 'refinements' | 'metadata' | 'printing'): void {
    this.activeTab = tab;
    if (tab === 'printing' && !this.printingFiles) {
      this.loadPrintingFiles();
    }
    this.cdr.markForCheck();
  }


  deleteDesign(): void {
    if (!this.design) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar Exclusão',
        message: `Tem certeza que deseja excluir o design #${this.design.id}?`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.designService.deleteDesign(this.design!.id).subscribe({
          next: () => {
            this.notificationService.show({
              type: 'success',
              message: 'Design excluído com sucesso',
              title: 'Sucesso'
            });
            this.router.navigate(['/admin/designs']);
          },
          error: (error) => {
            this.notificationService.show({
              type: 'error',
              message: 'Erro ao excluir design',
              title: 'Erro'
            });
          }
        });
      }
    });
  }

  viewRefinementMockup(refinement: DesignRefinement): void {
    if (refinement.new_mockup) {
      window.open(refinement.new_mockup, '_blank');
    }
  }

  getStatusLabel(status: DesignStatus): string {
    const labels: Record<DesignStatus, string> = {
      [DesignStatus.DRAFT]: 'Rascunho',
      [DesignStatus.GENERATING]: 'Gerando',
      [DesignStatus.COMPLETED]: 'Concluído',
      [DesignStatus.FAILED]: 'Falhou',
      [DesignStatus.REFINED]: 'Refinado'
    };
    return labels[status] || status;
  }

  getStatusColor(status: DesignStatus): string {
    const colors: Record<DesignStatus, string> = {
      [DesignStatus.DRAFT]: 'gray',
      [DesignStatus.GENERATING]: 'blue',
      [DesignStatus.COMPLETED]: 'green',
      [DesignStatus.FAILED]: 'red',
      [DesignStatus.REFINED]: 'purple'
    };
    return colors[status] || 'gray';
  }

  getFullImageUrl(path: string | null | undefined): string {
    if (!path) {
      return 'https://via.placeholder.com/150x150?text=No+Image';
    }
    
    // If it's already a full URL (http/https), return as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // If it's a base64 data URL, return as is
    if (path.startsWith('data:')) {
      return path;
    }
    
    // Otherwise, convert relative path to full URL
    return this.configService.getFileUrl(path);
  }

  getMockupUrl(): string | null {
    if (!this.design) {
      return null;
    }
    
    // Prefer mockup (base64) if available, otherwise use mockup_url
    const mockupSource = this.design.mockup || this.design.mockup_url;
    
    if (!mockupSource) {
      return null;
    }
    
    return this.getFullImageUrl(mockupSource);
  }
}

