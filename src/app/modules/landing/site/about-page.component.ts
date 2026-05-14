import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LandingFooterComponent } from '../../../shared/components/layout/landing-footer/landing-footer.component';
import { LandingHeaderComponent } from '../../../shared/components/layout/landing-header/landing-header.component';

@Component({
    selector: 'landing-about-page',
    standalone: true,
    imports: [CommonModule, LandingHeaderComponent, LandingFooterComponent],
    template: `
        <div class="min-h-screen bg-default text-default">
            <app-landing-header></app-landing-header>
            <main class="max-w-5xl mx-auto px-6 py-16">
                <h1 class="text-h2 mb-6">Sobre Nós</h1>
                <p class="text-body-l text-secondary mb-8">
                    A Construvasco integra visão arquitetónica, rigor técnico e gestão de prazos para transformar requisitos
                    em projectos executáveis e claros para todas as partes.
                </p>
                <div class="rounded-xl border border-slate-200 bg-card p-8">
                    <h2 class="text-h3 mb-3">Compromissos</h2>
                    <ul class="space-y-3 text-body text-secondary">
                        <li>- Clareza técnica e documentação objetiva.</li>
                        <li>- Comunicação contínua em todas as etapas.</li>
                        <li>- Foco em viabilidade, custo e prazo.</li>
                        <li>- Entregáveis consistentes para decisão e execução.</li>
                    </ul>
                </div>
            </main>
            <app-landing-footer></app-landing-footer>
        </div>
    `,
})
export class AboutPageComponent {}
