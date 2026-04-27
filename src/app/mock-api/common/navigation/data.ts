/* eslint-disable */
import { FuseNavigationItem } from '@fuse/components/navigation';

export const adminNavigation: FuseNavigationItem[] = [
    {
        id: 'dashboard',
        title: 'Dashboard',
        type: 'basic',
        icon: 'heroicons_outline:home',
        link: '/admin/dashboard'
    },
    {
        id: 'orders',
        title: 'Orders',
        type: 'basic',
        icon: 'heroicons_outline:document-text',
        link: '/admin/orders'
    },
    {
        id: 'job-cards',
        title: 'Job Cards',
        type: 'basic',
        icon: 'heroicons_outline:briefcase',
        link: '/admin/job-cards'
    },
    {
        id: 'designs',
        title: 'Designs',
        type: 'basic',
        icon: 'heroicons_outline:paint-brush',
        link: '/admin/designs'
    },
    {
        id: 'products',
        title: 'Products',
        type: 'basic',
        icon: 'heroicons_outline:shopping-cart',
        link: '/admin/products'
    },
    {
        id: 'categories',
        title: 'Categories',
        type: 'basic',
        icon: 'heroicons_outline:tag',
        link: '/admin/categories'
    },
    {
        id: 'staff',
        title: 'Staff',
        type: 'basic',
        icon: 'heroicons_outline:users',
        link: '/admin/staff'
    },
    {
        id: 'reports',
        title: 'Reports',
        type: 'basic',
        icon: 'heroicons_outline:chart-bar',
        link: '/admin/reports'
    },
    {
        id: 'settings',
        title: 'Settings',
        type: 'basic',
        icon: 'heroicons_outline:cog-6-tooth',
        link: '/admin/settings'
    }
];

export const receptionistNavigation: FuseNavigationItem[] = [
    {
        id: 'dashboard',
        title: 'Dashboard',
        type: 'basic',
        icon: 'heroicons_outline:home',
        link: '/admin/dashboard'
    },
    {
        id: 'orders',
        title: 'Orders',
        type: 'basic',
        icon: 'heroicons_outline:document-text',
        link: '/admin/orders'
    },
    {
        id: 'job-cards',
        title: 'Job Cards',
        type: 'basic',
        icon: 'heroicons_outline:briefcase',
        link: '/admin/job-cards'
    },
    {
        id: 'settings',
        title: 'Settings',
        type: 'basic',
        icon: 'heroicons_outline:cog-6-tooth',
        link: '/admin/settings'
    }
];

export const designerNavigation: FuseNavigationItem[] = [
    {
        id: 'dashboard',
        title: 'Dashboard',
        type: 'basic',
        icon: 'heroicons_outline:home',
        link: '/admin/dashboard'
    },
    {
        id: 'job-cards',
        title: 'Job Cards',
        type: 'basic',
        icon: 'heroicons_outline:briefcase',
        link: '/admin/job-cards'
    },
    {
        id: 'designs',
        title: 'Designs',
        type: 'basic',
        icon: 'heroicons_outline:paint-brush',
        link: '/admin/designs'
    },
    {
        id: 'settings',
        title: 'Settings',
        type: 'basic',
        icon: 'heroicons_outline:cog-6-tooth',
        link: '/admin/settings'
    }
];

export const defaultNavigation: FuseNavigationItem[] = adminNavigation;
export const compactNavigation: FuseNavigationItem[] = adminNavigation;
export const futuristicNavigation: FuseNavigationItem[] = adminNavigation;
export const horizontalNavigation: FuseNavigationItem[] = adminNavigation;
