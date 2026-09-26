import { apiClient } from "./client";

export interface DealerProfile {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  customer_id: string;
  company_name?: string | null;
  contact_person: string;
  gstin?: string | null;
  phone: string;
  city: string;
  state: string;
  shipping_address?: string | null;
}

export interface PricingTier {
  id: string;
  tier_name: string;
  min_quantity: number;
  tier_price: number;
  is_active: boolean;
}

export interface DealerProductItem {
  id: string;
  code: string;
  name: string;
  category_id?: string | null;
  category_name?: string | null;
  fabric: string;
  color: string;
  border: string;
  weave_type: string;
  base_retail_price?: number | null;
  primary_image_url?: string | null;
  available_stock: number;
  pricing_tiers: PricingTier[];
}

export interface DealerProductDetail extends DealerProductItem {
  description: string;
  detailed_story?: string | null;
  saree_length_meters: number;
  blouse_piece_description?: string | null;
  weight_approx_grams?: number | null;
  images: Array<{
    id: string;
    image_url: string;
    alt_text?: string | null;
    is_primary: boolean;
    display_order: number;
  }>;
}

export interface QuoteRequest {
  product_id: string;
  quantity: number;
}

export interface QuoteResponse {
  product_id: string;
  product_code: string;
  product_name: string;
  quantity: number;
  base_retail_price: number;
  effective_unit_price: number;
  total_amount: number;
  discount_per_unit: number;
  total_savings: number;
  applied_tier_name?: string | null;
  applied_min_quantity?: number | null;
}

export interface DealerOrderItemInput {
  product_id: string;
  quantity: number;
  custom_notes?: string;
}

export interface DealerOrderCreateInput {
  items: DealerOrderItemInput[];
  notes?: string;
  shipping_address_override?: string;
}

export interface DealerOrderSummary {
  id: string;
  order_number: string;
  order_type: string;
  order_status: string;
  payment_status: string;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  item_count: number;
  invoice_number?: string | null;
  created_at?: string | null;
}

export interface DealerOrderDetail {
  id: string;
  order_number: string;
  order_type: string;
  order_status: string;
  payment_status: string;
  subtotal_amount: number;
  tax_amount: number;
  shipping_amount: number;
  total_amount: number;
  notes?: string | null;
  items: Array<{
    id: string;
    product_id: string;
    product_code: string;
    product_name: string;
    category_name?: string | null;
    primary_image_url?: string | null;
    unit_price: number;
    quantity: number;
    line_total: number;
    custom_notes?: string | null;
  }>;
  invoices: Array<{
    id: string;
    invoice_number: string;
    total_amount: number;
    balance_due: number;
    status: string;
    issue_date?: string | null;
    due_date?: string | null;
  }>;
  created_at?: string | null;
}

export interface DealerCreditSummary {
  customer_id: string;
  credit_limit: number;
  outstanding_balance: number;
  available_credit: number;
  unpaid_invoices_count: number;
  credit_period_days: number;
}

export interface DealerLedgerStatement {
  customer_id: string;
  credit_summary: DealerCreditSummary;
  invoices: Array<{
    id: string;
    invoice_number: string;
    invoice_type: string;
    total_amount: number;
    amount_paid: number;
    balance_due: number;
    status: string;
    issue_date?: string | null;
    due_date?: string | null;
  }>;
  payments: Array<{
    id: string;
    payment_number: string;
    amount: number;
    payment_method: string;
    payment_status: string;
    reference_number?: string | null;
    payment_date?: string | null;
  }>;
}

export async function getDealerProfile(): Promise<DealerProfile> {
  return apiClient<DealerProfile>("/dealer/profile");
}

export async function getDealerProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string;
}): Promise<{ items: DealerProductItem[]; total: number; page: number; limit: number; pages: number }> {
  return apiClient<{ items: DealerProductItem[]; total: number; page: number; limit: number; pages: number }>(
    "/dealer/products",
    { params }
  );
}

export async function getDealerProductDetail(productId: string): Promise<DealerProductDetail> {
  return apiClient<DealerProductDetail>(`/dealer/products/${productId}`);
}

export async function calculateDealerQuote(payload: QuoteRequest): Promise<QuoteResponse> {
  return apiClient<QuoteResponse>("/dealer/calculate-quote", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createDealerOrder(payload: DealerOrderCreateInput): Promise<{ id: string; order_number: string; total_amount: number }> {
  return apiClient<{ id: string; order_number: string; total_amount: number }>("/dealer/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getDealerOrders(page = 1, limit = 20): Promise<{ items: DealerOrderSummary[]; total: number; page: number; limit: number; pages: number }> {
  return apiClient<{ items: DealerOrderSummary[]; total: number; page: number; limit: number; pages: number }>(
    "/dealer/orders",
    { params: { page, limit } }
  );
}

export async function getDealerOrderDetail(orderId: string): Promise<DealerOrderDetail> {
  return apiClient<DealerOrderDetail>(`/dealer/orders/${orderId}`);
}

export async function getDealerCredit(): Promise<DealerCreditSummary> {
  return apiClient<DealerCreditSummary>("/dealer/credit");
}

export async function getDealerLedger(): Promise<DealerLedgerStatement> {
  return apiClient<DealerLedgerStatement>("/dealer/ledger");
}
