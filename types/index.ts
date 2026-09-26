export type ProductCategory =
  | "All Sarees"
  | "Pure Silk Sarees"
  | "Bridal & Wedding"
  | "Traditional Weaves"
  | "Soft Silk"
  | "New Arrivals"
  | string;

export interface Product {
  id: string;
  code: string; // e.g. "PVS-001"
  name: string;
  category: ProductCategory;
  categorySlug?: string;
  fabric: string; // e.g. "Pure Mulberry Silk", "Soft Silk", "Kanchipuram Silk"
  color: string; // e.g. "Deep Crimson / Antique Gold"
  border: string; // e.g. "Korvai Temple Border with Pure Gold Zari"
  pallu: string; // e.g. "Heavy Rich Brocade Floral Pallu"
  weaveType: string; // e.g. "Traditional Handloom / Jacquard Weave"
  motif?: string;
  description: string;
  detailedStory?: string;
  priceDisplay: string; // e.g. "Enquire for Price" or "₹14,500"
  priceNote?: string;
  availability: "In Stock" | "Made to Order" | "Bulk Available" | "Limited Weave" | string;
  images: {
    src: string;
    alt: string;
    tag?: string; // "Full Saree", "Border Detail", "Pallu", "Fabric Texture", "Drape"
  }[];
  featured: boolean;
  isNewArrival?: boolean;
  dimensions?: {
    sareeLength: string; // "5.5 Metres"
    blousePiece: string; // "0.8 Metres Unstitched Included"
    weightApprox: string; // "650 - 750 grams"
  };
  careInstructions: string[];
  relatedProducts?: Product[];
}

export interface ManufacturingStage {
  id: number;
  stageNumber: string;
  title: string;
  tamilName?: string;
  tagline: string;
  description: string;
  technicalDetails: string[];
  image: string;
  imageAlt: string;
  durationOrMetric?: string;
}

export interface LoomSpec {
  name: string;
  type: string;
  precision: string;
  capacity: string;
  speciality: string;
  description: string;
  image: string;
}

export interface WholesaleInquiryData {
  businessName: string;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  businessType: string;
  numberOfStores?: string;
  interestedCollection?: string;
  expectedQuantity?: string;
  message?: string;
}

/* ==========================================================================
   REST API Data Transfer Objects (DTOs)
   ========================================================================== */

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  tagline?: string | null;
  description?: string | null;
  banner_image_url?: string | null;
  display_order: number;
}

export interface ApiProductImage {
  id: string;
  image_url: string;
  alt_text?: string | null;
  tag?: string | null;
  display_order: number;
  is_primary: boolean;
}

export interface ApiProductList {
  id: string;
  code: string;
  name: string;
  category_name: string;
  category_slug: string;
  fabric: string;
  color: string;
  border: string;
  motif?: string | null;
  price_display: string;
  availability: string;
  is_featured: boolean;
  is_new_arrival: boolean;
  primary_image?: ApiProductImage | null;
  secondary_image?: ApiProductImage | null;
}

export interface ApiProductDetail {
  id: string;
  code: string;
  name: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  fabric: string;
  color: string;
  border: string;
  pallu?: string | null;
  motif?: string | null;
  weave_type: string;
  description: string;
  detailed_story?: string | null;
  price?: number | null;
  currency: string;
  price_display: string;
  price_note?: string | null;
  availability: string;
  saree_length_meters: number;
  blouse_piece_description?: string | null;
  weight_approx_grams?: number | null;
  care_instructions?: string[] | null;
  is_featured: boolean;
  is_new_arrival: boolean;
  images: ApiProductImage[];
  related_products: ApiProductList[];
}

export interface ApiPaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ApiWholesaleEnquiryCreate {
  business_name: string;
  contact_person: string;
  phone: string;
  email?: string;
  city: string;
  business_type: string;
  number_of_stores?: string;
  interested_collection?: string;
  expected_quantity?: string;
  message?: string;
}

export interface ApiWholesaleEnquiryResponse {
  enquiry_id: string;
  status: string;
  message: string;
}

export type UserRole = "SUPER_ADMIN" | "FACTORY_MANAGER" | "SALES_ADMIN" | "DEALER";

export interface UserPublic {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  last_login_at?: string | null;
  created_at: string;
}

export interface AuthResponse {
  user: UserPublic;
  message: string;
}

/* ==========================================================================
   Admin Operations DTOs (Phase 4B)
   ========================================================================== */

export interface AdminDashboardMetrics {
  total_active_products: number;
  total_inactive_products: number;
  total_featured_products: number;
  out_of_stock_products: number;
  made_to_order_products: number;
  total_categories: number;
  new_wholesale_enquiries: number;
  total_inventory_units: number;
  total_tracked_products: number;
  in_stock_products: number;
  low_stock_products: number;
  active_production_batches: number;
  in_progress_production_batches: number;
  completed_production_batches: number;
  pending_orders: number;
  confirmed_orders: number;
  active_crm_negotiations: number;
  converted_crm_enquiries: number;
  total_suppliers?: number;
  total_raw_materials?: number;
  low_stock_raw_materials?: number;
  pending_purchase_orders?: number;
  recorded_payments_count?: number;
  recent_products: {
    id: string;
    code: string;
    name: string;
    category_name: string;
    availability_status: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }[];
}

/* ==========================================================================
   Admin Inventory & Production DTOs (Phase 4C-A)
   ========================================================================== */

export type MovementType =
  | "PURCHASE"
  | "PRODUCTION"
  | "SALE"
  | "ADJUSTMENT"
  | "DAMAGE"
  | "RETURN";

export interface AdminInventoryItem {
  id: string;
  product_id: string;
  product_code: string;
  product_name: string;
  category_name: string;
  category_slug: string;
  primary_image_url?: string | null;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  reorder_threshold: number;
  warehouse_location?: string | null;
  stock_status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | string;
  is_active: boolean;
  last_movement_at?: string | null;
  updated_at: string;
}

export interface AdminInventoryMovement {
  id: string;
  inventory_id: string;
  product_id: string;
  product_code: string;
  product_name: string;
  movement_type: MovementType;
  quantity_delta: number;
  reference_id?: string | null;
  performed_by_user_id?: string | null;
  performed_by_name?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface AdminInventoryDetail {
  inventory: AdminInventoryItem;
  recent_movements: AdminInventoryMovement[];
}

export interface AdminInventoryAdjustmentPayload {
  movement_type: MovementType;
  quantity_delta: number;
  reference_id?: string;
  warehouse_location?: string;
  notes?: string;
}

export type BatchStatus =
  | "PLANNED"
  | "WARPING"
  | "WEAVING_IN_PROGRESS"
  | "FINISHING"
  | "QUALITY_CHECK"
  | "COMPLETED"
  | "ABORTED";

export type StageStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "PASSED_QC"
  | "FAILED_REWORK";

export interface AdminProductionStage {
  id: string;
  batch_id: string;
  stage_sequence: number;
  stage_name: string;
  status: StageStatus;
  inspected_by?: string | null;
  notes?: string | null;
  completed_at?: string | null;
}

export interface AdminProductionBatchList {
  id: string;
  batch_number: string;
  product_id: string;
  product_code: string;
  product_name: string;
  category_name: string;
  loom_identifier?: string | null;
  planned_quantity: number;
  completed_quantity: number;
  status: BatchStatus;
  progress_percent: number;
  current_stage_name?: string | null;
  start_date?: string | null;
  estimated_completion_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminProductionBatchDetail {
  id: string;
  batch_number: string;
  product_id: string;
  product_code: string;
  product_name: string;
  category_name: string;
  loom_identifier?: string | null;
  planned_quantity: number;
  completed_quantity: number;
  status: BatchStatus;
  progress_percent: number;
  start_date?: string | null;
  estimated_completion_date?: string | null;
  stages: AdminProductionStage[];
  created_at: string;
  updated_at: string;
}

export interface AdminProductionBatchCreatePayload {
  batch_number: string;
  product_id: string;
  loom_identifier?: string;
  planned_quantity: number;
  start_date?: string;
  estimated_completion_date?: string;
  stages?: {
    stage_sequence: number;
    stage_name: string;
    status?: StageStatus;
    notes?: string;
  }[];
}

export interface AdminProductionBatchUpdatePayload {
  loom_identifier?: string;
  planned_quantity?: number;
  completed_quantity?: number;
  status?: BatchStatus;
  start_date?: string;
  estimated_completion_date?: string;
}

export interface AdminProductionStageUpdatePayload {
  status?: StageStatus;
  inspected_by?: string;
  notes?: string;
  completed_at?: string;
}

/* ==========================================================================
   Admin Sales & CRM DTOs (Phase 4C-B)
   ========================================================================== */

export type CustomerType =
  | "RETAIL"
  | "BOUTIQUE"
  | "WHOLESALE_MERCHANT"
  | "EXPORTER";

export interface AdminCustomerList {
  id: string;
  full_name: string;
  company_name?: string | null;
  customer_type: CustomerType;
  phone: string;
  whatsapp_number?: string | null;
  email?: string | null;
  gstin?: string | null;
  city: string;
  state: string;
  shipping_address?: string | null;
  total_orders_count: number;
  created_at: string;
}

export interface AdminCustomerDetail {
  id: string;
  full_name: string;
  company_name?: string | null;
  customer_type: CustomerType;
  phone: string;
  whatsapp_number?: string | null;
  email?: string | null;
  gstin?: string | null;
  city: string;
  state: string;
  shipping_address?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminCustomerCreatePayload {
  full_name: string;
  company_name?: string;
  customer_type?: CustomerType;
  phone: string;
  whatsapp_number?: string;
  email?: string;
  gstin?: string;
  city: string;
  state?: string;
  shipping_address?: string;
}

export type OrderType =
  | "WHOLESALE_BULK"
  | "CUSTOM_LOOM_RUN"
  | "RETAIL_DIRECT";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

export type PaymentStatus =
  | "PENDING"
  | "ADVANCE_PAID"
  | "FULLY_PAID"
  | "REFUNDED";

export interface AdminOrderItemDetail {
  id: string;
  product_id: string;
  product_code: string;
  product_name: string;
  category_name: string;
  primary_image_url?: string | null;
  unit_price: number | string;
  quantity: number;
  custom_colorway_notes?: string | null;
  line_total: number | string;
}

export interface AdminOrderItemCreatePayload {
  product_id: string;
  quantity: number;
  unit_price?: number;
  custom_colorway_notes?: string;
}

export interface AdminOrderList {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_company?: string | null;
  customer_type: CustomerType;
  customer_phone: string;
  order_type: OrderType;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal_amount: number | string;
  tax_amount: number | string;
  shipping_amount: number | string;
  total_amount: number | string;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminOrderDetail {
  id: string;
  order_number: string;
  customer_id: string;
  customer: AdminCustomerDetail;
  order_type: OrderType;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal_amount: number | string;
  tax_amount: number | string;
  shipping_amount: number | string;
  total_amount: number | string;
  tracking_number?: string | null;
  notes?: string | null;
  items: AdminOrderItemDetail[];
  created_at: string;
  updated_at: string;
}

export interface AdminOrderCreatePayload {
  customer_id?: string;
  new_customer?: AdminCustomerCreatePayload;
  order_type?: OrderType;
  payment_status?: PaymentStatus;
  items: AdminOrderItemCreatePayload[];
  tax_amount?: number;
  shipping_amount?: number;
  notes?: string;
}

export interface AdminOrderUpdatePayload {
  order_status?: OrderStatus;
  payment_status?: PaymentStatus;
  tracking_number?: string;
  notes?: string;
}

export type CRMEnquiryStatus =
  | "NEW"
  | "CONTACTED"
  | "CATALOGUE_SENT"
  | "NEGOTIATING"
  | "CONVERTED_TO_ORDER"
  | "REJECTED";

export interface AdminWholesaleEnquiryList {
  id: string;
  business_name: string;
  contact_person: string;
  phone: string;
  email?: string | null;
  city: string;
  business_type: string;
  number_of_stores?: string | null;
  interested_collection?: string | null;
  expected_quantity?: string | null;
  status: CRMEnquiryStatus;
  assigned_to_user_id?: string | null;
  assigned_user_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminWholesaleEnquiryDetail {
  id: string;
  business_name: string;
  contact_person: string;
  phone: string;
  email?: string | null;
  city: string;
  business_type: string;
  number_of_stores?: string | null;
  interested_collection?: string | null;
  expected_quantity?: string | null;
  message?: string | null;
  status: CRMEnquiryStatus;
  assigned_to_user_id?: string | null;
  assigned_user_name?: string | null;
  converted_order_id?: string | null;
  converted_order_number?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminWholesaleEnquiryUpdatePayload {
  status?: CRMEnquiryStatus;
  assigned_to_user_id?: string;
  message?: string;
}

export interface AdminWholesaleConvertToOrderPayload {
  items: AdminOrderItemCreatePayload[];
  order_type?: OrderType;
  notes?: string;
}

export interface AdminProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string | null;
  tag?: string | null;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface AdminProductList {
  id: string;
  code: string;
  name: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  fabric: string;
  color: string;
  border: string;
  motif?: string | null;
  price?: number | null;
  currency: string;
  is_price_on_enquiry: boolean;
  price_note?: string | null;
  availability_status: string;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_active: boolean;
  image_count: number;
  primary_image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminProductDetail {
  id: string;
  code: string;
  name: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  fabric: string;
  color: string;
  border: string;
  pallu?: string | null;
  motif?: string | null;
  weave_type: string;
  description: string;
  detailed_story?: string | null;
  price?: number | null;
  currency: string;
  is_price_on_enquiry: boolean;
  price_note?: string | null;
  availability_status: string;
  saree_length_meters: number;
  blouse_piece_description?: string | null;
  weight_approx_grams?: number | null;
  care_instructions?: string[] | null;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_active: boolean;
  images: AdminProductImage[];
  created_at: string;
  updated_at: string;
}

export interface AdminProductCreatePayload {
  code: string;
  name: string;
  category_id: string;
  fabric: string;
  color: string;
  border: string;
  pallu?: string;
  motif?: string;
  weave_type?: string;
  description: string;
  detailed_story?: string;
  price?: number;
  currency?: string;
  is_price_on_enquiry?: boolean;
  price_note?: string;
  availability_status?: string;
  saree_length_meters?: number;
  blouse_piece_description?: string;
  weight_approx_grams?: number;
  care_instructions?: string[];
  is_featured?: boolean;
  is_new_arrival?: boolean;
  is_active?: boolean;
  images?: {
    image_url: string;
    alt_text?: string;
    tag?: string;
    display_order?: number;
    is_primary?: boolean;
  }[];
}

export interface AdminProductUpdatePayload extends Partial<AdminProductCreatePayload> {}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  tagline?: string | null;
  description?: string | null;
  banner_image_url?: string | null;
  display_order: number;
  is_active: boolean;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminCategoryCreatePayload {
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  banner_image_url?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface AdminCategoryUpdatePayload extends Partial<AdminCategoryCreatePayload> {}

/* ==========================================================================
   Admin Procurement, Raw Materials & Payments DTOs (Phase 4C-C)
   ========================================================================== */

export type SupplierType =
  | "SILK_REELER"
  | "ZARI_MANUFACTURER"
  | "DYE_CHEMICALS"
  | "PACKAGING"
  | "LOOM_SPARES"
  | "GENERAL";

export interface AdminSupplierList {
  id: string;
  supplier_code: string;
  supplier_name: string;
  supplier_type: SupplierType;
  contact_person: string;
  phone: string;
  email?: string | null;
  location: string;
  is_active: boolean;
  materials_count: number;
  purchase_orders_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminSupplierDetail {
  id: string;
  supplier_code: string;
  supplier_name: string;
  supplier_type: SupplierType;
  contact_person: string;
  phone: string;
  email?: string | null;
  location: string;
  address?: string | null;
  gstin?: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminSupplierCreatePayload {
  supplier_code: string;
  supplier_name: string;
  supplier_type?: SupplierType;
  contact_person: string;
  phone: string;
  email?: string;
  location: string;
  address?: string;
  gstin?: string;
  notes?: string;
  is_active?: boolean;
}

export interface AdminSupplierUpdatePayload extends Partial<AdminSupplierCreatePayload> {}

export type MaterialType =
  | "RAW_SILK"
  | "PURE_ZARI"
  | "METALLIC_ZARI"
  | "ECO_DYES"
  | "PACKAGING_SUPPLIES"
  | "LOOM_ACCESSORIES";

export type UnitOfMeasure =
  | "KILOGRAMS"
  | "GRAMS"
  | "METERS"
  | "HANK_REELS"
  | "UNITS";

export type RawMaterialMovementType =
  | "PURCHASE_RECEIPT"
  | "PRODUCTION_CONSUMPTION"
  | "ADJUSTMENT"
  | "WASTAGE_DAMAGE"
  | "RETURN_TO_SUPPLIER";

export interface AdminRawMaterialStockInfo {
  quantity_on_hand: number | string;
  quantity_reserved: number | string;
  quantity_available: number | string;
  reorder_level: number | string;
  warehouse_location?: string | null;
  stock_status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | string;
  last_restocked_at?: string | null;
}

export interface AdminRawMaterialMovementItem {
  id: string;
  raw_material_id: string;
  movement_type: RawMaterialMovementType;
  quantity_delta: number | string;
  reference_id?: string | null;
  performed_by_name?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface AdminRawMaterialList {
  id: string;
  material_code: string;
  name: string;
  material_type: MaterialType;
  unit_of_measure: UnitOfMeasure;
  reorder_level: number | string;
  unit_cost?: number | string | null;
  is_active: boolean;
  supplier_id?: string | null;
  supplier_name?: string | null;
  quantity_on_hand: number | string;
  quantity_reserved: number | string;
  quantity_available: number | string;
  stock_status: string;
  created_at: string;
  updated_at: string;
}

export interface AdminRawMaterialDetail {
  id: string;
  material_code: string;
  name: string;
  material_type: MaterialType;
  unit_of_measure: UnitOfMeasure;
  reorder_level: number | string;
  unit_cost?: number | string | null;
  description?: string | null;
  is_active: boolean;
  supplier_id?: string | null;
  supplier_name?: string | null;
  stock: AdminRawMaterialStockInfo;
  recent_movements: AdminRawMaterialMovementItem[];
  created_at: string;
  updated_at: string;
}

export interface AdminRawMaterialCreatePayload {
  material_code: string;
  name: string;
  material_type: MaterialType;
  unit_of_measure: UnitOfMeasure;
  reorder_level?: number;
  unit_cost?: number;
  description?: string;
  supplier_id?: string;
  is_active?: boolean;
  initial_stock?: number;
  warehouse_location?: string;
}

export interface AdminRawMaterialUpdatePayload extends Partial<AdminRawMaterialCreatePayload> {}

export interface AdminRawMaterialAdjustmentPayload {
  movement_type?: RawMaterialMovementType;
  quantity_delta: number;
  reference_id?: string;
  notes?: string;
  warehouse_location?: string;
}

export type PurchaseOrderStatus =
  | "DRAFT"
  | "ORDERED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELLED";

export interface AdminPurchaseOrderItemDetail {
  id: string;
  raw_material_id: string;
  material_code: string;
  material_name: string;
  unit_of_measure: string;
  quantity_ordered: number | string;
  quantity_received: number | string;
  unit_cost: number | string;
  line_total: number | string;
}

export interface AdminPurchaseOrderItemCreatePayload {
  raw_material_id: string;
  quantity_ordered: number;
  unit_cost: number;
}

export interface AdminPurchaseOrderList {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier_name: string;
  supplier_code: string;
  status: PurchaseOrderStatus;
  order_date: string;
  expected_delivery_date?: string | null;
  subtotal_amount: number | string;
  tax_amount: number | string;
  total_amount: number | string;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminPurchaseOrderDetail {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier: AdminSupplierDetail;
  status: PurchaseOrderStatus;
  order_date: string;
  expected_delivery_date?: string | null;
  subtotal_amount: number | string;
  tax_amount: number | string;
  total_amount: number | string;
  notes?: string | null;
  created_by_name?: string | null;
  items: AdminPurchaseOrderItemDetail[];
  created_at: string;
  updated_at: string;
}

export interface AdminPurchaseOrderCreatePayload {
  supplier_id: string;
  order_date?: string;
  expected_delivery_date?: string;
  items: AdminPurchaseOrderItemCreatePayload[];
  tax_amount?: number;
  notes?: string;
}

export interface AdminPurchaseOrderReceivePayload {
  items: {
    item_id: string;
    quantity_to_receive: number;
  }[];
  notes?: string;
  warehouse_location?: string;
}

export interface AdminProductionBatchMaterialDetail {
  id: string;
  batch_id: string;
  raw_material_id: string;
  material_code: string;
  material_name: string;
  unit_of_measure: string;
  quantity_consumed: number | string;
  notes?: string | null;
  performed_by_name?: string | null;
  created_at: string;
}

export interface AdminProductionConsumeMaterialPayload {
  raw_material_id: string;
  quantity_consumed: number;
  notes?: string;
}

export type PaymentType =
  | "INBOUND_CUSTOMER_PAYMENT"
  | "OUTBOUND_SUPPLIER_PAYMENT";

export type PaymentMethod =
  | "BANK_TRANSFER_NEFT_RTGS"
  | "UPI"
  | "CHEQUE"
  | "CASH"
  | "TRADE_CREDIT";

export type PaymentRecordStatus =
  | "RECORDED"
  | "CLEARED"
  | "BOUNCED_FAILED"
  | "VOID";

export interface AdminPaymentList {
  id: string;
  payment_number: string;
  payment_type: PaymentType;
  party_name: string;
  customer_id?: string | null;
  supplier_id?: string | null;
  order_id?: string | null;
  purchase_order_id?: string | null;
  amount: number | string;
  payment_method: PaymentMethod;
  payment_status: PaymentRecordStatus;
  reference_transaction_id?: string | null;
  payment_date: string;
  recorded_by_name?: string | null;
  created_at: string;
}

export interface AdminPaymentDetail {
  id: string;
  payment_number: string;
  payment_type: PaymentType;
  party_name: string;
  customer_id?: string | null;
  customer_name?: string | null;
  supplier_id?: string | null;
  supplier_name?: string | null;
  order_id?: string | null;
  order_number?: string | null;
  purchase_order_id?: string | null;
  po_number?: string | null;
  amount: number | string;
  payment_method: PaymentMethod;
  payment_status: PaymentRecordStatus;
  reference_transaction_id?: string | null;
  payment_date: string;
  notes?: string | null;
  recorded_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminPaymentCreatePayload {
  payment_type: PaymentType;
  customer_id?: string;
  supplier_id?: string;
  order_id?: string;
  purchase_order_id?: string;
  amount: number;
  payment_method?: PaymentMethod;
  payment_status?: PaymentRecordStatus;
  reference_transaction_id?: string;
  payment_date?: string;
  notes?: string;
}

export interface AdminPaymentUpdatePayload {
  payment_status?: PaymentRecordStatus;
  reference_transaction_id?: string;
  notes?: string;
}

// ----------------------------------------------------
// PHASE 4C-D: FINANCE, INVOICES, OUTSTANDING & REPORTS
// ----------------------------------------------------

export type InvoiceType = "TAX_INVOICE" | "PURCHASE_BILL" | "PROFORMA_INVOICE";

export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export interface AdminInvoiceItemDetail {
  id: string;
  product_id?: string | null;
  raw_material_id?: string | null;
  item_description: string;
  hsn_sac_code: string;
  quantity: number | string;
  unit_of_measure: string;
  unit_price: number | string;
  discount_amount: number | string;
  taxable_amount: number | string;
  gst_rate: number | string;
  tax_amount: number | string;
  total_amount: number | string;
}

export interface AdminInvoiceItemCreatePayload {
  product_id?: string;
  raw_material_id?: string;
  item_description: string;
  hsn_sac_code?: string;
  quantity: number;
  unit_of_measure?: string;
  unit_price: number;
  discount_amount?: number;
  gst_rate?: number;
}

export interface AdminInvoicePaymentSummary {
  id: string;
  payment_number: string;
  amount: number | string;
  payment_method: PaymentMethod;
  reference_transaction_id?: string | null;
  payment_date: string;
  created_at: string;
}

export interface AdminInvoiceList {
  id: string;
  invoice_number: string;
  invoice_type: InvoiceType;
  party_name: string;
  customer_id?: string | null;
  supplier_id?: string | null;
  order_id?: string | null;
  purchase_order_id?: string | null;
  invoice_date: string;
  due_date?: string | null;
  subtotal_amount: number | string;
  total_tax_amount: number | string;
  total_amount: number | string;
  paid_amount: number | string;
  balance_due: number | string;
  status: InvoiceStatus;
  created_at: string;
}

export interface AdminInvoiceDetail {
  id: string;
  invoice_number: string;
  invoice_type: InvoiceType;
  party_name: string;
  customer_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_gstin?: string | null;
  customer_address?: string | null;
  supplier_id?: string | null;
  supplier_name?: string | null;
  supplier_gstin?: string | null;
  order_id?: string | null;
  order_number?: string | null;
  purchase_order_id?: string | null;
  po_number?: string | null;
  invoice_date: string;
  due_date?: string | null;
  place_of_supply: string;
  is_inter_state: boolean;
  subtotal_amount: number | string;
  cgst_rate: number | string;
  cgst_amount: number | string;
  sgst_rate: number | string;
  sgst_amount: number | string;
  igst_rate: number | string;
  igst_amount: number | string;
  total_tax_amount: number | string;
  total_amount: number | string;
  paid_amount: number | string;
  balance_due: number | string;
  status: InvoiceStatus;
  terms_and_conditions?: string | null;
  notes?: string | null;
  items: AdminInvoiceItemDetail[];
  payments: AdminInvoicePaymentSummary[];
  created_at: string;
  updated_at: string;
}

export interface AdminInvoiceCreatePayload {
  invoice_type?: InvoiceType;
  order_id?: string;
  purchase_order_id?: string;
  customer_id?: string;
  supplier_id?: string;
  invoice_date?: string;
  due_date?: string;
  place_of_supply?: string;
  is_inter_state?: boolean;
  customer_gstin?: string;
  items: AdminInvoiceItemCreatePayload[];
  terms_and_conditions?: string;
  notes?: string;
}

export interface AdminInvoiceRecordPaymentPayload {
  amount: number;
  payment_method?: PaymentMethod;
  reference_transaction_id?: string;
  payment_date?: string;
  notes?: string;
}

export interface AdminInvoiceStatusUpdatePayload {
  status: InvoiceStatus;
  notes?: string;
}

export interface AgingBuckets {
  current_0_30: number | string;
  days_31_60: number | string;
  days_61_90: number | string;
  over_90_days: number | string;
}

export interface CustomerOutstandingDetail {
  customer_id: string;
  customer_name: string;
  company_name?: string | null;
  phone: string;
  city: string;
  state: string;
  total_invoiced: number | string;
  total_paid: number | string;
  balance_due: number | string;
  aging: AgingBuckets;
  open_invoices_count: number;
}

export interface SupplierOutstandingDetail {
  supplier_id: string;
  supplier_code: string;
  supplier_name: string;
  contact_person?: string | null;
  phone: string;
  location: string;
  total_billed: number | string;
  total_paid: number | string;
  balance_due: number | string;
  aging: AgingBuckets;
  open_bills_count: number;
}

export interface FinanceOverviewKPIs {
  total_receivables: number | string;
  total_payables: number | string;
  gross_revenue_mtd: number | string;
  gross_revenue_ytd: number | string;
  total_procurement_expenses_mtd: number | string;
  net_cash_flow: number | string;
  total_tax_collected: number | string;
  total_tax_paid: number | string;
  net_tax_liability: number | string;
  receivables_aging_summary: AgingBuckets;
  payables_aging_summary: AgingBuckets;
  open_invoices_count: number;
  open_bills_count: number;
}

export interface SalesReportRow {
  date: string;
  order_number: string;
  invoice_number?: string | null;
  customer_name: string;
  customer_type: string;
  items_count: number;
  taxable_amount: number | string;
  tax_amount: number | string;
  total_amount: number | string;
  payment_status: string;
  order_type: string;
}

export interface SalesReportSummary {
  start_date: string;
  end_date: string;
  total_orders: number;
  gross_sales: number | string;
  total_tax_collected: number | string;
  net_sales: number | string;
  retail_sales_volume: number | string;
  wholesale_sales_volume: number | string;
  rows: SalesReportRow[];
}

export interface RawMaterialValuationRow {
  material_code: string;
  material_name: string;
  material_type: string;
  unit_of_measure: string;
  quantity_on_hand: number | string;
  unit_cost: number | string;
  total_valuation: number | string;
}

export interface FinishedGoodValuationRow {
  product_code: string;
  product_name: string;
  category_name: string;
  quantity_on_hand: number;
  wholesale_price: number | string;
  retail_price: number | string;
  total_inventory_value: number | string;
}

export interface InventoryValuationReport {
  valuation_date: string;
  total_raw_material_valuation: number | string;
  total_finished_goods_valuation: number | string;
  total_combined_inventory_value: number | string;
  raw_materials: RawMaterialValuationRow[];
  finished_goods: FinishedGoodValuationRow[];
}

export interface GSTHSNSummaryRow {
  hsn_sac_code: string;
  description: string;
  uqc: string;
  total_quantity: number | string;
  taxable_value: number | string;
  cgst_rate: number | string;
  cgst_amount: number | string;
  sgst_rate: number | string;
  sgst_amount: number | string;
  igst_rate: number | string;
  igst_amount: number | string;
  total_tax_amount: number | string;
}

export interface GSTSummaryReport {
  start_date: string;
  end_date: string;
  company_gstin: string;
  total_taxable_turnover: number | string;
  total_cgst: number | string;
  total_sgst: number | string;
  total_igst: number | string;
  total_tax_liability: number | string;
  hsn_summary: GSTHSNSummaryRow[];
}


