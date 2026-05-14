import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LandingFooterComponent } from '../../../shared/components/layout/landing-footer/landing-footer.component';
import { LandingHeaderComponent } from '../../../shared/components/layout/landing-header/landing-header.component';

@Component({
    selector: 'landing-services-page',
    standalone: true,
    imports: [CommonModule, LandingHeaderComponent, LandingFooterComponent],
    template: `
        <div class="min-h-screen bg-default text-default">
            <app-landing-header></app-landing-header>
            <main class="max-w-7xl mx-auto px-6 py-16">
                <h1 class="text-h2 mb-4">Serviços</h1>
                <p class="text-body-l text-secondary mb-10">Serviços técnicos orientados para projectos de obra com documentação profissional.</p>
                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <article class="rounded-xl bg-card border border-slate-200 p-6"><h3 class="text-h4 mb-2">Planta Baixa</h3><p class="text-body text-secondary">Organização espacial e leitura técnica para execução.</p></article>
                    <article class="rounded-xl bg-card border border-slate-200 p-6"><h3 class="text-h4 mb-2">Anteprojeto</h3><p class="text-body text-secondary">Conceito arquitetónico com opções e diretrizes.</p></article>
                    <article class="rounded-xl bg-card border border-slate-200 p-6"><h3 class="text-h4 mb-2">Fachadas</h3><p class="text-body text-secondary">Estudo estético e funcional da envolvente.</p></article>
                    <article class="rounded-xl bg-card border border-slate-200 p-6"><h3 class="text-h4 mb-2">Orçamento Técnico</h3><p class="text-body text-secondary">Estimativas por etapa, material e cronograma.</p></article>
                    <article class="rounded-xl bg-card border border-slate-200 p-6"><h3 class="text-h4 mb-2">Memorial Descritivo</h3><p class="text-body text-secondary">Especificações para alinhamento entre cliente e execução.</p></article>
                    <article class="rounded-xl bg-card border border-slate-200 p-6"><h3 class="text-h4 mb-2">Acompanhamento</h3><p class="text-body text-secondary">Suporte técnico durante evolução do projecto.</p></article>
                </div>
            </main>
            <app-landing-footer></app-landing-footer>
        </div>
    `,
})
export class ServicesPageComponent {}
