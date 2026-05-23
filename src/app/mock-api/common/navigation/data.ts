/* eslint-disable */
import { FuseNavigationItem } from '@fuse/components/navigation';

const dashboardItem: FuseNavigationItem = {
  id: 'dashboard',
  title: 'Painel',
  type: 'basic',
  icon: 'heroicons_outline:home',
  link: '/admin/dashboard',
};

/** Pedidos de obra (briefing / orçamento) — API v1/manager/project-requests */
const pedidosItem: FuseNavigationItem = {
  id: 'pedidos',
  title: 'Pedidos de projecto',
  type: 'basic',
  icon: 'heroicons_outline:document-text',
  link: '/admin/pedidos',
};

/** Projectos activos e atribuição a técnicos — API projects */
const projectosItem: FuseNavigationItem = {
  id: 'projectos',
  title: 'Projectos',
  type: 'basic',
  icon: 'heroicons_outline:rectangle-stack',
  link: '/admin/projectos',
};

const clientesItem: FuseNavigationItem = {
  id: 'clientes',
  title: 'Clientes',
  type: 'basic',
  icon: 'heroicons_outline:user-group',
  link: '/admin/clientes',
};

const financesItem: FuseNavigationItem = {
  id: 'finances',
  title: 'Finanças',
  type: 'basic',
  icon: 'heroicons_outline:banknotes',
  link: '/admin/financas',
};

const staffItem: FuseNavigationItem = {
  id: 'staff',
  title: 'Equipa',
  type: 'basic',
  icon: 'heroicons_outline:users',
  link: '/admin/staff',
};

const settingsItem: FuseNavigationItem = {
  id: 'settings',
  title: 'Configurações',
  type: 'basic',
  icon: 'heroicons_outline:cog-6-tooth',
  link: '/admin/settings',
};

/** Administrador */
export const adminNavigation: FuseNavigationItem[] = [
  dashboardItem,
  pedidosItem,
  projectosItem,
  clientesItem,
  financesItem,
  staffItem,
  settingsItem,
];

/** Gestor de projectos — ciclo operacional completo (sem gestão global de equipa). */
export const projectManagerNavigation: FuseNavigationItem[] = [
  dashboardItem,
  pedidosItem,
  projectosItem,
  clientesItem,
  financesItem,
  settingsItem,
];

const tecnicoProjectosItem: FuseNavigationItem = {
  ...projectosItem,
  id: 'meus-projectos',
  title: 'Meus projectos',
  subtitle: 'Obras atribuídas a si',
};

/** Técnico — execução (marcos, entregáveis, projectos atribuídos) */
export const technicianNavigation: FuseNavigationItem[] = [
  dashboardItem,
  {
    id: 'tecnico-grupo',
    title: 'Área técnica',
    type: 'group',
  },
  tecnicoProjectosItem,
  settingsItem,
];

export const receptionistNavigation: FuseNavigationItem[] = projectManagerNavigation;
export const designerNavigation: FuseNavigationItem[] = technicianNavigation;

export const defaultNavigation: FuseNavigationItem[] = adminNavigation;
export const compactNavigation: FuseNavigationItem[] = adminNavigation;
export const futuristicNavigation: FuseNavigationItem[] = adminNavigation;
export const horizontalNavigation: FuseNavigationItem[] = adminNavigation;
