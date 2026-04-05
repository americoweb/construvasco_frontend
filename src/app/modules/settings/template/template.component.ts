import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { CardComponent } from '../../../shared/components/ui/card/card.component';
import { DynamicFormComponent } from '../../../shared/components/forms/dynamic-form/dynamic-form.component';
import { FormConfig } from '../../../shared/components/forms/form.types';

@Component({
  selector: 'settings-template',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    ButtonComponent,
    CardComponent,
    DynamicFormComponent
  ],
  templateUrl: './template.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsTemplateComponent implements OnInit {
  emailTemplateForm: FormGroup;
  documentTemplateForm: FormGroup;
  signatureForm: FormGroup;
  
  emailFormValid = false;
  documentFormValid = false;
  signatureFormValid = false;

  // Email templates data
  emailTemplatesData = {
    welcomeEmail: 'Bem-vindo à nossa plataforma! Estamos felizes em tê-lo conosco.',
    inviteEmail: 'Você foi convidado para se juntar à nossa equipe.',
    rejectionEmail: 'Agradecemos seu interesse. Infelizmente, não foi possível prosseguir com sua candidatura desta vez.'
  };

  // Document templates data
  documentTemplatesData = {
    letterhead: 'iHRM Solutions\nRua da Marginal, 123\nMaputo, Moçambique',
    footer: '© 2025 iHRM Solutions. Todos os direitos reservados.',
    contractTemplate: 'CONTRATO DE TRABALHO\n\nEntre [EMPRESA] e [CANDIDATO]...'
  };

  // Signature data
  signatureData = {
    name: 'João Silva',
    title: 'Gerente de RH',
    email: 'joao@ihrm.co.mz',
    phone: '+258 84 123 4567',
    website: 'www.ihrm.co.mz'
  };

  emailFormConfig: FormConfig = {
    fields: [
      {
        name: 'welcomeEmail',
        type: 'textarea',
        label: 'Email de Boas-Vindas',
        required: true,
        grid: { xs: 12 },
        validation: { required: true }
      },
      {
        name: 'inviteEmail',
        type: 'textarea',
        label: 'Email de Convite',
        required: true,
        grid: { xs: 12 },
        validation: { required: true }
      },
      {
        name: 'rejectionEmail',
        type: 'textarea',
        label: 'Email de Rejeição',
        required: true,
        grid: { xs: 12 },
        validation: { required: true }
      }
    ],
    layout: 'vertical',
    showSubmit: false,
    showCancel: false,
    validateOnChange: true
  };

  documentFormConfig: FormConfig = {
    fields: [
      {
        name: 'letterhead',
        type: 'textarea',
        label: 'Cabeçalho da Empresa',
        required: true,
        placeholder: 'Nome da empresa, endereço, contatos...',
        grid: { xs: 12 },
        validation: { required: true }
      },
      {
        name: 'footer',
        type: 'textarea',
        label: 'Rodapé dos Documentos',
        required: true,
        placeholder: 'Informações do rodapé...',
        grid: { xs: 12 },
        validation: { required: true }
      },
      {
        name: 'contractTemplate',
        type: 'textarea',
        label: 'Modelo de Contrato',
        required: true,
        placeholder: 'Modelo base do contrato de trabalho...',
        grid: { xs: 12 },
        validation: { required: true }
      }
    ],
    layout: 'vertical',
    showSubmit: false,
    showCancel: false,
    validateOnChange: true
  };

  signatureFormConfig: FormConfig = {
    fields: [
      {
        name: 'name',
        type: 'text',
        label: 'Nome Completo',
        required: true,
        grid: { xs: 12, md: 6 },
        validation: { required: true }
      },
      {
        name: 'title',
        type: 'text',
        label: 'Cargo',
        required: true,
        grid: { xs: 12, md: 6 },
        validation: { required: true }
      },
      {
        name: 'email',
        type: 'email',
        label: 'Email',
        required: true,
        grid: { xs: 12, md: 6 },
        validation: { required: true, email: true }
      },
      {
        name: 'phone',
        type: 'tel',
        label: 'Telefone',
        grid: { xs: 12, md: 6 }
      },
      {
        name: 'website',
        type: 'url',
        label: 'Website',
        placeholder: 'www.exemplo.com',
        grid: { xs: 12 }
      }
    ],
    layout: 'vertical',
    showSubmit: false,
    showCancel: false,
    validateOnChange: true
  };

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {}

  // Email Template Form Handlers
  onEmailFormReady(form: FormGroup): void {
    this.emailTemplateForm = form;
  }

  onEmailFormChange(form: FormGroup): void {
    this.emailTemplateForm = form;
    this.emailFormValid = form.valid;
    this.cdr.markForCheck();
  }

  onSaveEmailTemplates(): void {
    if (this.emailFormValid) {
      console.log('Saving email templates:', this.emailTemplateForm.value);
    }
  }

  // Document Template Form Handlers
  onDocumentFormReady(form: FormGroup): void {
    this.documentTemplateForm = form;
  }

  onDocumentFormChange(form: FormGroup): void {
    this.documentTemplateForm = form;
    this.documentFormValid = form.valid;
    this.cdr.markForCheck();
  }

  onSaveDocumentTemplates(): void {
    if (this.documentFormValid) {
      console.log('Saving document templates:', this.documentTemplateForm.value);
    }
  }

  // Signature Form Handlers
  onSignatureFormReady(form: FormGroup): void {
    this.signatureForm = form;
  }

  onSignatureFormChange(form: FormGroup): void {
    this.signatureForm = form;
    this.signatureFormValid = form.valid;
    this.cdr.markForCheck();
  }

  onSaveSignature(): void {
    if (this.signatureFormValid) {
      console.log('Saving signature:', this.signatureForm.value);
    }
  }

  onPreviewTemplate(templateType: string): void {
    console.log('Previewing template:', templateType);
    // Implement preview logic
  }

  get signaturePreview(): any {
    return this.signatureForm?.value || this.signatureData;
  }
}
