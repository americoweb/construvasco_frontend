import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ActivatedRoute, RouterLink } from '@angular/router';

import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';

import { MatButtonModule } from '@angular/material/button';

import { MatIconModule } from '@angular/material/icon';

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatSelectModule } from '@angular/material/select';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ConstructionProjectService } from '../../../shared/construction/construction-project.service';

import { UserService } from '../../../core/auth/services/user.service';

import {

  AssignableUser,

  ConstructionProject,

} from '../../../shared/construction/construction.types';

import { NotificationService } from '../../../shared/components/feedback/notification.service';



@Component({

  selector: 'app-project-detail',

  standalone: true,

  imports: [

    CommonModule,

    RouterLink,

    FormsModule,

    MatCardModule,

    MatButtonModule,

    MatIconModule,

    MatFormFieldModule,

    MatSelectModule,

    MatProgressSpinnerModule,

  ],

  templateUrl: './project-detail.component.html',

  styleUrls: ['./project-detail.component.scss'],

  changeDetection: ChangeDetectionStrategy.OnPush,

})

export class ProjectDetailComponent implements OnInit {

  loading = true;

  assigning = false;

  project: ConstructionProject | null = null;

  technicians: AssignableUser[] = [];

  selectedTechnicianId: number | null = null;

  isAdmin = false;

  isTechnicianView = false;

  userRole = '';



  constructor(

    private route: ActivatedRoute,

    private projects: ConstructionProjectService,

    private userService: UserService,

    private notify: NotificationService,

    private cdr: ChangeDetectorRef

  ) {}



  ngOnInit(): void {

    this.userRole = String(this.userService.user?.current_tenant_context?.role ?? '').toLowerCase();

    this.isAdmin = this.userRole === 'admin';

    this.isTechnicianView = ['technician', 'designer', 'tecnico', 'desenhista'].includes(this.userRole);



    const id = this.route.snapshot.paramMap.get('id');

    if (!id) return;



    if (!this.isTechnicianView) {

      this.projects.assignableUsers().subscribe({

        next: (res) => {

          this.technicians = res.data ?? [];

          this.cdr.markForCheck();

        },

      });

    }



    this.reloadProject(id);

  }



  private reloadProject(id: string): void {

    this.loading = true;

    this.projects.getForRole(id, this.userRole).subscribe({

      next: (res) => {

        this.project = res.data;

        const main = res.data.assignments?.find((a) => a.assignment_role === 'main');

        this.selectedTechnicianId = main?.assigned_user?.id ?? main?.assigned_to ?? null;

        this.loading = false;

        this.cdr.markForCheck();

      },

      error: () => {

        this.loading = false;

        this.notify.error('Projecto não encontrado.');

        this.cdr.markForCheck();

      },

    });

  }



  assign(): void {

    if (!this.project || !this.selectedTechnicianId) {

      this.notify.error('Seleccione um técnico.');

      return;

    }

    this.assigning = true;

    const assign$ = this.isAdmin

      ? this.projects.assignAdmin(this.project.id, this.selectedTechnicianId)

      : this.projects.assignManager(this.project.id, this.selectedTechnicianId);



    assign$.subscribe({

      next: () => {

        this.notify.success('Técnico atribuído.');

        this.assigning = false;

        this.reloadProject(String(this.project!.id));

      },

      error: () => {

        this.assigning = false;

        this.notify.error('Erro ao atribuir técnico.');

        this.cdr.markForCheck();

      },

    });

  }

}


