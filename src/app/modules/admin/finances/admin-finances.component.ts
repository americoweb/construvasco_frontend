import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Stub MVP: módulo Finanças (totais, conciliação, exportações) virá aqui.
 * Ver MAPA_PRODUTO_CONSTRUVASCO — Admin / Finanças.
 */
@Component({
  selector: 'app-admin-finances',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="mx-auto max-w-2xl p-6">
      <h1 class="text-xl font-semibold text-slate-900">Finanças</h1>
      <p class="mt-2 text-sm text-slate-600">
        Esta área será preenchida com resumos de pagamentos, estados de cobrança e relatórios. Por agora,
        consulte os pedidos para acompanhar pagamentos por encomenda.
      </p>
      <a
        routerLink="/admin/orders"
        class="mt-4 inline-flex text-sm font-semibold text-teal-700 hover:text-teal-800">
        Ir para Pedidos
      </a>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminFinancesComponent {}
