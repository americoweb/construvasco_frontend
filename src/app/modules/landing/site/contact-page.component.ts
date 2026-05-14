import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LandingFooterComponent } from '../../../shared/components/layout/landing-footer/landing-footer.component';
import { LandingHeaderComponent } from '../../../shared/components/layout/landing-header/landing-header.component';

@Component({
    selector: 'landing-contact-page',
    standalone: true,
    imports: [CommonModule, LandingHeaderComponent, LandingFooterComponent],
    template: `
        <div class="min-h-screen bg-default text-default">
            <app-landing-header></app-landing-header>
            <main class="max-w-5xl mx-auto px-6 py-16">
                <h1 class="text-h2 mb-4">Contacto</h1>
                <p class="text-body-l text-secondary mb-10">Fale com a nossa equipa para iniciar o seu projecto.</p>
                <div class="grid md:grid-cols-2 gap-6">
                    <section class="rounded-xl border border-slate-200 bg-card p-6">
                        <h2 class="text-h4 mb-3">Canal Direto</h2>
                        <p class="text-body text-secondary mb-2">WhatsApp: +258 84 657 9067</p>
                        <p class="text-body text-secondary mb-2">Email: contacto&#64;construvasco.co.mz</p>
                        <p class="text-body text-secondary">Local: Maputo, Moçambique</p>
                    </section>
                    <section class="rounded-xl border border-slate-200 bg-card p-6">
                        <h2 class="text-h4 mb-3">Horário</h2>
                        <p class="text-body text-secondary mb-2">Segunda a Sexta: 08h00 - 17h30</p>
                        <p class="text-body text-secondary">Sábado: 09h00 - 13h00</p>
                    </section>
                </div>
            </main>
            <app-landing-footer></app-landing-footer>
        </div>
    `,
})
export class ContactPageComponent {}
