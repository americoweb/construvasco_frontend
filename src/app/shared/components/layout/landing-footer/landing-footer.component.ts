import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing-footer',
  templateUrl: './landing-footer.component.html',
  styleUrls: ['./landing-footer.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class LandingFooterComponent {
  currentYear = new Date().getFullYear();
  whatsappNumber = '258846579067';

  getWhatsAppLink(context: string = 'help'): string {
    const messages: { [key: string]: string } = {
      help: 'Olá! Quero ajuda a escolher o tipo de projeto antes de encomendar.',
      hero: 'Olá! Vi o site e quero alinhar um projeto de construção.',
      product: 'Olá! Gostaria de saber mais sobre um projeto do catálogo',
      cart: 'Olá! Tenho itens no carrinho e quero finalizar a encomenda',
      custom: 'Olá! Gostaria de um projeto personalizado',
      quote: 'Olá! Gostaria de receber um orçamento',
      urgent: 'Olá! Tenho urgência no arranque do projeto',
      notFound: 'Olá! Não encontrei no catálogo o tipo de obra que preciso',
      human: 'Olá! Prefiro falar com alguém sobre o meu projeto'
    };
    
    const message = encodeURIComponent(messages[context] || messages.help);
    return `https://wa.me/${this.whatsappNumber}?text=${message}`;
  }
}

