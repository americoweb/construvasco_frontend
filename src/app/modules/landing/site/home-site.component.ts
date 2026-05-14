import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LandingFooterComponent } from '../../../shared/components/layout/landing-footer/landing-footer.component';
import { LandingHeaderComponent } from '../../../shared/components/layout/landing-header/landing-header.component';
import { SITE_MEDIA } from './site-media';

@Component({
    selector: 'landing-home-site',
    standalone: true,
    imports: [CommonModule, RouterLink, LandingHeaderComponent, LandingFooterComponent],
    template: `
        <div class="min-h-screen bg-default text-default">
            <app-landing-header></app-landing-header>
            <main>
                <section class="relative min-h-[70vh] lg:min-h-[82vh] overflow-hidden">
                    <video
                        class="hidden lg:block absolute inset-0 w-full h-full object-cover"
                        autoplay
                        loop
                        muted
                        playsinline
                        [poster]="media.heroFallback">
                        <source [src]="media.heroVideo" type="video/mp4" />
                    </video>
                    <img
                        class="absolute inset-0 w-full h-full object-cover"
                        [src]="media.heroFallback"
                        alt="Projecto de construção contemporâneo" />
                    <div class="absolute inset-0 bg-black/55"></div>
                    <div class="relative z-10 max-w-6xl mx-auto px-6 py-24 lg:py-32 text-white">
                        <p class="uppercase tracking-[0.2em] text-sm text-white/80 mb-6">Plataforma Construvasco</p>
                        <h1 class="text-h1 max-w-3xl mb-6">Projectos de obra e arquitetura com execução clara do briefing à entrega.</h1>
                        <p class="text-body-l max-w-2xl text-white/90 mb-10">Planeie, acompanhe e aprove propostas técnicas com uma experiência corporativa, segura e orientada a resultados.</p>
                        <div class="flex flex-wrap gap-4">
                            <a routerLink="/contacto" class="px-6 py-3 rounded-lg bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-colors">Iniciar Pedido</a>
                            <a routerLink="/como-funciona" class="px-6 py-3 rounded-lg border border-white/60 text-white font-semibold hover:bg-white/10 transition-colors">Como Funciona</a>
                        </div>
                    </div>
                </section>

                <section class="max-w-7xl mx-auto px-6 py-20">
                    <h2 class="text-h2 text-center mb-12">Tipos de Obra</h2>
                    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <article class="rounded-xl bg-card border border-slate-200 p-6">
                            <h3 class="text-h4 mb-2">Residencial</h3>
                            <p class="text-body text-secondary">Plantas e anteprojetos focados em conforto, eficiência e viabilidade.</p>
                        </article>
                        <article class="rounded-xl bg-card border border-slate-200 p-6">
                            <h3 class="text-h4 mb-2">Comercial</h3>
                            <p class="text-body text-secondary">Soluções para espaços de atendimento, produção e operação empresarial.</p>
                        </article>
                        <article class="rounded-xl bg-card border border-slate-200 p-6">
                            <h3 class="text-h4 mb-2">Reforma</h3>
                            <p class="text-body text-secondary">Requalificação técnica com foco em custo, prazo e impacto mínimo na operação.</p>
                        </article>
                        <article class="rounded-xl bg-card border border-slate-200 p-6">
                            <h3 class="text-h4 mb-2">Construção Raiz</h3>
                            <p class="text-body text-secondary">Concepção completa desde o terreno até o caderno técnico final.</p>
                        </article>
                    </div>
                </section>
            </main>
            <app-landing-footer></app-landing-footer>
        </div>
    `,
})
export class HomeSiteComponent {
    media = SITE_MEDIA;
}
