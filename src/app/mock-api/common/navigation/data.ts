/* eslint-disable */
import { FuseNavigationItem } from '@fuse/components/navigation';

/**
 * Navegação admin alinhada ao domínio Construvasco Digital (MAPA + protótipo).
 * Legado gráfica (Designs, Products, Categories, Reports) removido do menu.
 * Papel `designer` na API = operação técnica; menu sem módulo "Designs" até o SRS formalizar.
 */
export const adminNavigation: FuseNavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Painel',
    type: 'basic',
    icon: 'heroicons_outline:home',
    link: '/admin/dashboard',
  },
  {
    id: 'orders',
    title: 'Pedidos',
    type: 'basic',
    icon: 'heroicons_outline:document-text',
    link: '/admin/orders',
  },
  {
    id: 'job-cards',
    title: 'Fichas de projecto',
    type: 'basic',
    icon: 'heroicons_outline:rectangle-stack',
    link: '/admin/job-cards',
  },
  {
    id: 'finances',
    title: 'Finanças',
    type: 'basic',
    icon: 'heroicons_outline:banknotes',
    link: '/admin/financas',
  },
  {
    id: 'staff',
    title: 'Equipa',
    type: 'basic',
    icon: 'heroicons_outline:users',
    link: '/admin/staff',
  },
  {
    id: 'settings',
    title: 'Configurações',
    type: 'basic',
    icon: 'heroicons_outline:cog-6-tooth',
    link: '/admin/settings',
  },
];

export const receptionistNavigation: FuseNavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Painel',
    type: 'basic',
    icon: 'heroicons_outline:home',
    link: '/admin/dashboard',
  },
  {
    id: 'orders',
    title: 'Pedidos',
    type: 'basic',
    icon: 'heroicons_outline:document-text',
    link: '/admin/orders',
  },
  {
    id: 'job-cards',
    title: 'Fichas de projecto',
    type: 'basic',
    icon: 'heroicons_outline:rectangle-stack',
    link: '/admin/job-cards',
  },
  {
    id: 'settings',
    title: 'Configurações',
    type: 'basic',
    icon: 'heroicons_outline:cog-6-tooth',
    link: '/admin/settings',
  },
];

/** Operadores técnicos (role API `designer`): pedidos + fichas, sem finanças globais. */
export const designerNavigation: FuseNavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Painel',
    type: 'basic',
    icon: 'heroicons_outline:home',
    link: '/admin/dashboard',
  },
  {
    id: 'orders',
    title: 'Pedidos',
    type: 'basic',
    icon: 'heroicons_outline:document-text',
    link: '/admin/orders',
  },
  {
    id: 'job-cards',
    title: 'Fichas de projecto',
    type: 'basic',
    icon: 'heroicons_outline:rectangle-stack',
    link: '/admin/job-cards',
  },
  {
    id: 'settings',
    title: 'Configurações',
    type: 'basic',
    icon: 'heroicons_outline:cog-6-tooth',
    link: '/admin/settings',
  },
];

export const defaultNavigation: FuseNavigationItem[] = adminNavigation;
export const compactNavigation: FuseNavigationItem[] = adminNavigation;
export const futuristicNavigation: FuseNavigationItem[] = adminNavigation;
export const horizontalNavigation: FuseNavigationItem[] = adminNavigation;
