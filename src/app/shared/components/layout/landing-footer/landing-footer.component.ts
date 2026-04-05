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
      help: 'Olá! Preciso de ajuda para escolher um produto',
      hero: 'Olá! Vi o site e gostaria de fazer um pedido.',
      product: 'Olá! Gostaria de saber mais sobre um produto',
      cart: 'Olá! Tenho itens no carrinho e gostaria de finalizar o pedido',
      custom: 'Olá! Gostaria de fazer um pedido personalizado',
      quote: 'Olá! Gostaria de receber um orçamento',
      urgent: 'Olá! Preciso de entrega urgente',
      notFound: 'Olá! Não encontrei o produto que preciso',
      human: 'Olá! Prefiro falar com alguém sobre meu pedido'
    };
    
    const message = encodeURIComponent(messages[context] || messages.help);
    return `https://wa.me/${this.whatsappNumber}?text=${message}`;
  }
}

