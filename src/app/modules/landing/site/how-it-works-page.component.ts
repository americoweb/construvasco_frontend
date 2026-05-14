import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LandingFooterComponent } from '../../../shared/components/layout/landing-footer/landing-footer.component';
import { LandingHeaderComponent } from '../../../shared/components/layout/landing-header/landing-header.component';

@Component({
    selector: 'landing-how-it-works-page',
    standalone: true,
    imports: [CommonModule, LandingHeaderComponent, LandingFooterComponent],
    template: `
        <div class="min-h-screen bg-default text-default">
            <app-landing-header></app-landing-header>
            <main class="max-w-6xl mx-auto px-6 py-16">
                <h1 class="text-h2 mb-4">Como Funciona</h1>
                <p class="text-body-l text-secondary mb-12">Fluxo simples com transparência operacional em todas as etapas.</p>
                <div class="grid md:grid-cols-4 gap-6">
                    <article class="rounded-xl bg-card border border-slate-200 p-6"><p class="text-caption text-secondary mb-2">Etapa 1</p><h3 class="text-h4 mb-2">Briefing</h3><p class="text-body text-secondary">Recolha de requisitos, anexos e objetivos do cliente.</p></article>
                    <article class="rounded-xl bg-card border border-slate-200 p-6"><p class="text-caption text-secondary mb-2">Etapa 2</p><h3 class="text-h4 mb-2">Proposta</h3><p class="text-body text-secondary">Anteprojeto e estimativa técnica para validação.</p></article>
                    <article class="rounded-xl bg-card border border-slate-200 p-6"><p class="text-caption text-secondary mb-2">Etapa 3</p><h3 class="text-h4 mb-2">Aprovação</h3><p class="text-body text-secondary">Ajustes, aprovação e preparação dos entregáveis.</p></article>
                    <article class="rounded-xl bg-card border border-slate-200 p-6"><p class="text-caption text-secondary mb-2">Etapa 4</p><h3 class="text-h4 mb-2">Execução</h3><p class="text-body text-secondary">Acompanhamento por marcos e comunicação contínua.</p></article>
                </div>
            </main>
            <app-landing-footer></app-landing-footer>
        </div>
    `,
})
export class HowItWorksPageComponent {}
