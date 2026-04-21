import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { NotificationService } from '../../../../shared/components/feedback/notification.service';

import { StaffService } from '../shared/staff.service';
import { Staff, STAFF_ROLES } from '../shared/staff.types';

@Component({
  selector: 'app-staff-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent, ButtonComponent],
  templateUrl: './staff-form.component.html',
  styleUrls: ['./staff-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaffFormComponent implements OnInit {
  form!: FormGroup;
  submitting = false;
  isEditMode = false;
  staffId: number | null = null;
  readonly roles = STAFF_ROLES;

  pageHeaderActions = [
    {
      label: 'Voltar',
      icon: 'arrow_back',
      variant: 'secondary' as const,
      callback: () => this.router.navigate(['/admin/staff/list'])
    }
  ];

  constructor(
    private fb: FormBuilder,
    private service: StaffService,
    private router: Router,
    private route: ActivatedRoute,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.staffId = this.route.snapshot.params['id'] ? +this.route.snapshot.params['id'] : null;
    this.isEditMode = !!this.staffId;

    this.form = this.fb.group({
      name:       ['', [Validators.required, Validators.maxLength(255)]],
      identifier: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      role:       ['', Validators.required],
      password:   ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(8)]],
      is_active:  [true],
    });

    if (this.isEditMode) {
      this.form.get('identifier')!.disable();
      this.loadStaff();
    }
  }

  private loadStaff(): void {
    this.service.getStaff(this.staffId!).subscribe({
      next: res => {
        const s: Staff = res.data as any;
        this.form.patchValue({
          name:      s.name,
          identifier: s.identifier,
          role:      s.role?.name ?? '',
          is_active: s.is_active,
        });
        this.cdr.markForCheck();
      },
      error: () => this.notification.show({ type: 'error', message: 'Erro ao carregar membro', title: 'Erro' })
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.cdr.markForCheck();

    const v = this.form.getRawValue();

    const obs = this.isEditMode
      ? this.service.updateStaff(this.staffId!, {
          name:      v.name,
          role:      v.role,
          is_active: v.is_active,
          ...(v.password ? { password: v.password } : {})
        })
      : this.service.createStaff({
          name:       v.name,
          identifier: v.identifier,
          role:       v.role,
          password:   v.password
        });

    obs.subscribe({
      next: () => {
        this.notification.show({
          type: 'success',
          message: this.isEditMode ? 'Membro actualizado' : 'Membro criado com sucesso',
          title: 'Sucesso'
        });
        this.router.navigate(['/admin/staff/list']);
      },
      error: err => {
        this.submitting = false;
        const msg = err?.error?.message ?? 'Erro ao guardar';
        this.notification.show({ type: 'error', message: msg, title: 'Erro' });
        this.cdr.markForCheck();
      }
    });
  }

  hasError(field: string, error = 'required'): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.hasError(error) && ctrl?.touched);
  }

  goBack(): void {
    this.router.navigate(['/admin/staff/list']);
  }
}
