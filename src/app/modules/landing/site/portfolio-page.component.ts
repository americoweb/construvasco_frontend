import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LandingFooterComponent } from '../../../shared/components/layout/landing-footer/landing-footer.component';
import { LandingHeaderComponent } from '../../../shared/components/layout/landing-header/landing-header.component';
import { SITE_MEDIA } from './site-media';

@Component({
    selector: 'landing-portfolio-page',
    standalone: true,
    imports: [CommonModule, LandingHeaderComponent, LandingFooterComponent],
    template: `
        <div class="min-h-screen bg-default text-default">
            <app-landing-header></app-landing-header>
            <main class="max-w-7xl mx-auto px-6 py-16">
                <h1 class="text-h2 mb-4">Portfólio</h1>
                <p class="text-body-l text-secondary mb-10">Projectos com leitura objetiva de escopo, tipologia e solução proposta.</p>
                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <article class="rounded-xl overflow-hidden border border-slate-200 bg-card">
                        <img class="w-full h-52 object-cover" [src]="media.sections.home[0]" alt="Projecto residencial contemporâneo">
                        <div class="p-5"><h3 class="text-h4 mb-2">Residencial T3</h3><p class="text-small text-secondary">Tipologia residencial | 280m² | Maputo</p></div>
                    </article>
                    <article class="rounded-xl overflow-hidden border border-slate-200 bg-card">
                        <img class="w-full h-52 object-cover" [src]="media.sections.home[1]" alt="Projecto comercial">
                        <div class="p-5"><h3 class="text-h4 mb-2">Centro Comercial</h3><p class="text-small text-secondary">Comercial | 1.200m² | Matola</p></div>
                    </article>
                    <article class="rounded-xl overflow-hidden border border-slate-200 bg-card">
                        <img class="w-full h-52 object-cover" [src]="media.sections.home[2]" alt="Projecto de reforma">
                        <div class="p-5"><h3 class="text-h4 mb-2">Reforma Executiva</h3><p class="text-small text-secondary">Reforma | 460m² | Maputo</p></div>
                    </article>
                </div>
            </main>
            <app-landing-footer></app-landing-footer>
        </div>
    `,
})
export class PortfolioPageComponent {
    media = SITE_MEDIA;
}
