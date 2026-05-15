// Order Types matching backend OrderResource and OrderListResource structure

export enum OrderStatus {
  PENDING = 'pending',
  TRIAGED = 'triaged',
  ASSIGNED = 'assigned',
  IN_DESIGN = 'in_design',
  AWAITING_CLIENT = 'awaiting_client',
  APPROVED = 'approved',
  IN_EXECUTION = 'in_execution',
  CONFIRMED = 'confirmed',
  IN_PRODUCTION = 'in_production',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export interface OrderItem {
  id: number;
  product_id: number;
  design_id?: number;
  product_name: string;
  product_sku?: string;
  color_name?: string;
  color_hex_code?: string;
  print_area_name?: string;
  design_prompt?: string;
  mockup_url?: string;
  quantity: number;
  unit_price: number;
  formatted_unit_price?: string;
  total_price: number;
  formatted_total?: string;
  notes?: string;
  created_at?: string;
}

export interface OrderStatusHistory {
  id: number;
  previous_status?: OrderStatus;
  previous_status_label?: string;
  new_status: OrderStatus;
  new_status_label?: string;
  notes?: string;
  created_at?: string;
}

export interface ShippingInfo {
  name: string;
  address: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  whatsapp: string;
}

export interface BillingInfo {
  name?: string;
  email?: string;
}

export interface Order {
  id: number;
  uuid: string;
  order_number: string;
  user_id?: number;
  session_id?: string;
  status: OrderStatus;
  status_label?: string;
  status_color?: string;
  payment_status: PaymentStatus;
  payment_status_label?: string;
  payment_status_color?: string;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  formatted_total?: string;
  currency: string;
  total_items?: number;
  shipping_name?: string; // For list view (from OrderListResource)
  shipping?: ShippingInfo; // For detail view (from OrderResource)
  billing?: BillingInfo;
  notes?: string;
  can_be_cancelled?: boolean;
  is_pending?: boolean;
  is_delivered?: boolean;
  is_cancelled?: boolean;
  job_card_id?: number;
  job_card_number?: string;
  job_card_status?: string;
  confirmed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  items?: OrderItem[];
  status_history?: OrderStatusHistory[];
  created_at?: string;
  updated_at?: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  notes?: string;
}

export interface CancelOrderRequest {
  reason?: string;
}

/** Payload for POST /v1/orders or POST /v1/admin/orders (same validation rules). */
export interface CreateOrderLinePayload {
  product_id: number;
  design_id?: number | null;
  product_color_id: number;
  product_print_area_id: number;
  product_name: string;
  color_name: string;
  color_hex_code: string;
  print_area_name: string;
  design_prompt?: string;
  mockup_url?: string;
  quantity: number;
  unit_price: number;
  notes?: string;
}

export interface CreateOrderPayload {
  user_id?: number;
  session_id?: string;
  shipping_name: string;
  shipping_address: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_postal_code?: string;
  shipping_country?: string;
  shipping_phone?: string;
  shipping_whatsapp: string;
  billing_name?: string;
  billing_email?: string;
  notes?: string;
  shipping_cost?: number;
  discount_amount?: number;
  items: CreateOrderLinePayload[];
}

