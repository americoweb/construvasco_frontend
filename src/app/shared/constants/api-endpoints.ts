export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: 'auth/login',
    REGISTER: 'auth/register',
    REFRESH: 'auth/refresh',
    LOGOUT: 'auth/logout',
    PROFILE: 'auth/profile'
  },
  USERS: {
    BASE: 'users',
    PROFILE: (id: string) => `users/${id}/profile`,
    PERMISSIONS: (id: string) => `users/${id}/permissions`
  },
  CANDIDATES: {
    BASE: 'candidates',
    PROFILE: (id: string) => `candidates/${id}/profile`,
    RESUME: (id: string) => `candidates/${id}/resume`,
    KANBAN: 'candidates/kanban'
  },
  JOBS: {
    BASE: 'jobs',
    MATCHES: (id: string) => `jobs/${id}/matches`,
    PUBLISH: (id: string) => `jobs/${id}/publish`
  },
  COMMON: {
    UPLOAD: 'upload',
    SEARCH: 'search',
    EXPORT: 'export'
  },
  PRODUCTS: {
    BASE: 'v1/admin/products',
    LIST: 'v1/admin/products',
    CREATE: 'v1/admin/products',
    UPDATE: (id: string | number) => `v1/admin/products/${id}`,
    DELETE: (id: string | number) => `v1/admin/products/${id}`,
    TOGGLE_FEATURED: (id: string | number) => `v1/admin/products/${id}/toggle-featured`,
    UPLOAD_IMAGE: (id: string | number) => `v1/admin/products/${id}/upload-image`,
    UPLOAD_BASE_IMAGE: (id: string | number) => `v1/admin/products/${id}/upload-base-image`,
    COLORS: (productId: string | number) => `v1/admin/products/${productId}/colors`,
    COLOR_UPDATE: (productId: string | number, colorId: string | number) => `v1/admin/products/${productId}/colors/${colorId}`,
    COLOR_DELETE: (productId: string | number, colorId: string | number) => `v1/admin/products/${productId}/colors/${colorId}`,
    COLOR_STOCK: (productId: string | number, colorId: string | number) => `v1/admin/products/${productId}/colors/${colorId}/stock`,
    PRINT_AREAS: (productId: string | number) => `v1/admin/products/${productId}/print-areas`,
    PRINT_AREA_UPDATE: (productId: string | number, areaId: string | number) => `v1/admin/products/${productId}/print-areas/${areaId}`,
    PRINT_AREA_DELETE: (productId: string | number, areaId: string | number) => `v1/admin/products/${productId}/print-areas/${areaId}`,
    SIZES: (productId: string | number) => `v1/admin/products/${productId}/sizes`,
    SIZE_UPDATE: (productId: string | number, sizeId: string | number) => `v1/admin/products/${productId}/sizes/${sizeId}`,
    SIZE_DELETE: (productId: string | number, sizeId: string | number) => `v1/admin/products/${productId}/sizes/${sizeId}`,
    SIZE_RESTRICTIONS: (productId: string | number) => `v1/admin/products/${productId}/size-restrictions`,
    // Public endpoints (no auth required)
    PUBLIC_ACTIVE: 'v1/products/active',
    PUBLIC_FEATURED: 'v1/products/featured',
    PUBLIC_GET: (id: string | number) => `v1/products/${id}`,
    PUBLIC_GET_BY_SLUG: (slug: string) => `v1/products/slug/${slug}`,
    PUBLIC_COLORS: (productId: number) => `v1/products/${productId}/colors`,
    PUBLIC_PRINT_AREAS: (productId: number) => `v1/products/${productId}/print-areas`,
    PUBLIC_SIZES: (productId: number) => `v1/products/${productId}/sizes`,
    PUBLIC_SIZE_RESTRICTIONS: (productId: number) => `v1/products/${productId}/size-restrictions`,
    PUBLIC_CALCULATE_PRICE: (productId: number) => `v1/products/${productId}/calculate-price`,
    PUBLIC_TESTIMONIALS: (productId: number) => `v1/products/${productId}/testimonials`
  },
  CATEGORIES: {
    BASE: 'v1/admin/categories',
    LIST: 'v1/admin/categories',
    CREATE: 'v1/admin/categories',
    UPDATE: (id: string | number) => `v1/admin/categories/${id}`,
    DELETE: (id: string | number) => `v1/admin/categories/${id}`,
    GET: (id: string | number) => `v1/admin/categories/${id}`,
    UPLOAD_IMAGE: (id: string | number) => `v1/admin/categories/${id}/upload-image`,
    // Public endpoints
    PUBLIC_LIST: 'v1/categories',
    PUBLIC_ACTIVE: 'v1/categories/active',
    PUBLIC_ROOT: 'v1/categories/root',
    PUBLIC_GET: (id: string | number) => `v1/categories/${id}`
  },
  TAGS: {
    BASE: 'v1/admin/tags',
    LIST: 'v1/admin/tags',
    CREATE: 'v1/admin/tags',
    UPDATE: (id: string | number) => `v1/admin/tags/${id}`,
    DELETE: (id: string | number) => `v1/admin/tags/${id}`,
    GET: (id: string | number) => `v1/admin/tags/${id}`,
    // Public endpoints
    PUBLIC_LIST: 'v1/tags',
    PUBLIC_ALL: 'v1/tags/all',
    PUBLIC_GET: (id: string | number) => `v1/tags/${id}`
  },
  TESTIMONIALS: {
    BASE: 'v1/admin/testimonials',
    LIST: 'v1/testimonials',
    GET: (id: string | number) => `v1/testimonials/${id}`,
    CREATE: 'v1/admin/testimonials',
    UPDATE: (id: string | number) => `v1/admin/testimonials/${id}`,
    DELETE: (id: string | number) => `v1/admin/testimonials/${id}`,
    TOGGLE_ACTIVE: (id: string | number) => `v1/admin/testimonials/${id}/toggle-active`,
    // Public endpoints
    PUBLIC_LIST: 'v1/testimonials',
    PUBLIC_GET: (id: string | number) => `v1/testimonials/${id}`,
    PUBLIC_FOR_PRODUCT: (productId: number) => `v1/products/${productId}/testimonials`
  },
  AI: {
    SUGGESTIONS: 'v1/ai/suggestions',
    MOCKUP: 'v1/ai/mockup',
    REFINE: 'v1/ai/refine',
    HEALTH: 'v1/ai/health'
  },
  DESIGNS: {
    BASE: 'v1/admin/designs',
    LIST: 'v1/admin/designs',
    GET: (id: string | number) => `v1/admin/designs/${id}`,
    UPDATE: (id: string | number) => `v1/admin/designs/${id}`,
    DELETE: (id: string | number) => `v1/admin/designs/${id}`,
    REFINEMENTS: (id: string | number) => `v1/admin/designs/${id}/refinements`,
    GENERATE_MOCKUP: (id: string | number) => `v1/admin/designs/${id}/mockup/generate`,
    DOWNLOAD_LOGO: (id: string | number) => `v1/admin/designs/${id}/logo/download`,
    DOWNLOAD_REFERENCE: (id: string | number) => `v1/admin/designs/${id}/reference-image/download`,
    FILES_FOR_PRINTING: (id: string | number) => `v1/admin/designs/${id}/files`,
    // Public design endpoints
    PUBLIC_CREATE: 'v1/designs',
    PUBLIC_GET: (id: string | number) => `v1/designs/${id}`,
    PUBLIC_UPLOAD_LOGO: (id: string | number) => `v1/designs/${id}/logo`,
    PUBLIC_UPLOAD_REFERENCE: (id: string | number) => `v1/designs/${id}/reference-image`
  },
  CART: {
    BASE: 'v1/cart',
    GET: 'v1/cart',
    GET_BY_SESSION: (sessionId: string) => `v1/cart/session/${sessionId}`,
    ADD_ITEM: 'v1/cart/items',
    UPDATE_ITEM: (itemId: number) => `v1/cart/items/${itemId}`,
    REMOVE_ITEM: (itemId: number) => `v1/cart/items/${itemId}`,
    CLEAR: (cartId: number) => `v1/cart/${cartId}/clear`,
    SUMMARY: (cartId: number) => `v1/cart/${cartId}/summary`
  },
  CHECKOUT: {
    BASE: 'v1/checkout',
    SUMMARY: (cartUuid: string) => `v1/checkout/summary/${cartUuid}`,
    SHIPPING: (cartUuid: string) => `v1/checkout/shipping/${cartUuid}`,
    VALIDATE: 'v1/checkout/validate',
    PROCESS: 'v1/checkout/process'
  },
  ORDERS: {
    BASE: 'v1/admin/orders',
    LIST: 'v1/admin/orders',
    GET: (id: string | number) => `v1/admin/orders/${id}`,
    UPDATE_STATUS: (id: string | number) => `v1/admin/orders/${id}/status`,
    CONFIRM: (id: string | number) => `v1/admin/orders/${id}/confirm`,
    IN_PRODUCTION: (id: string | number) => `v1/admin/orders/${id}/in-production`,
    SHIP: (id: string | number) => `v1/admin/orders/${id}/ship`,
    DELIVER: (id: string | number) => `v1/admin/orders/${id}/deliver`,
    CANCEL: (id: string | number) => `v1/admin/orders/${id}/cancel`,
    MARK_PAID: (id: string | number) => `v1/admin/orders/${id}/paid`,
    PENDING: 'v1/admin/orders/pending',
    ACTIVE: 'v1/admin/orders/active',
    USER_ORDERS: 'v1/user/orders'
  },
  PAYMENTS: {
    MPESA: 'payments/mpesa',
    EMOLA: 'payments/emola',
    PROOF_UPLOAD: 'payments/proof-upload'
  }
} as const;
