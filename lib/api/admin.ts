import { apiClient } from "./client";
import {
  AdminDashboardMetrics,
  AdminProductList,
  AdminProductDetail,
  AdminProductImage,
  AdminProductCreatePayload,
  AdminProductUpdatePayload,
  AdminCategory,
  AdminCategoryCreatePayload,
  AdminCategoryUpdatePayload,
  AdminInventoryItem,
  AdminInventoryDetail,
  AdminInventoryMovement,
  AdminInventoryAdjustmentPayload,
  AdminProductionBatchList,
  AdminProductionBatchDetail,
  AdminProductionBatchCreatePayload,
  AdminProductionBatchUpdatePayload,
  AdminProductionStage,
  AdminProductionStageUpdatePayload,
  AdminCustomerList,
  AdminCustomerDetail,
  AdminCustomerCreatePayload,
  AdminOrderList,
  AdminOrderDetail,
  AdminOrderCreatePayload,
  AdminOrderUpdatePayload,
  AdminWholesaleEnquiryList,
  AdminWholesaleEnquiryDetail,
  AdminWholesaleEnquiryUpdatePayload,
  AdminWholesaleConvertToOrderPayload,
  AdminSupplierList,
  AdminSupplierDetail,
  AdminSupplierCreatePayload,
  AdminSupplierUpdatePayload,
  AdminRawMaterialList,
  AdminRawMaterialDetail,
  AdminRawMaterialCreatePayload,
  AdminRawMaterialUpdatePayload,
  AdminRawMaterialAdjustmentPayload,
  AdminPurchaseOrderList,
  AdminPurchaseOrderDetail,
  AdminPurchaseOrderCreatePayload,
  AdminPurchaseOrderReceivePayload,
  AdminProductionBatchMaterialDetail,
  AdminProductionConsumeMaterialPayload,
  AdminPaymentList,
  AdminPaymentDetail,
  AdminPaymentCreatePayload,
  AdminPaymentUpdatePayload,
  AdminInvoiceList,
  AdminInvoiceDetail,
  AdminInvoiceCreatePayload,
  AdminInvoiceStatusUpdatePayload,
  AdminInvoiceRecordPaymentPayload,
  FinanceOverviewKPIs,
  CustomerOutstandingDetail,
  SupplierOutstandingDetail,
  SalesReportSummary,
  InventoryValuationReport,
  GSTSummaryReport,
  ApiPaginatedResponse,
} from "@/types";

/* ==========================================================================
   Admin Dashboard
   ========================================================================== */

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  return apiClient<AdminDashboardMetrics>("admin/dashboard");
}

/* ==========================================================================
   Admin Product Management
   ========================================================================== */

export interface AdminProductFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string;
  availability?: string;
  featured?: boolean;
  is_active?: boolean;
}

export async function getAdminProducts(
  params: AdminProductFilterParams = {}
): Promise<ApiPaginatedResponse<AdminProductList>> {
  return apiClient<ApiPaginatedResponse<AdminProductList>>("admin/products", {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search,
      category_id: params.category_id,
      availability: params.availability,
      featured: params.featured,
      is_active: params.is_active,
    },
  });
}

export async function getAdminProduct(id: string): Promise<AdminProductDetail> {
  return apiClient<AdminProductDetail>(`admin/products/${id}`);
}

export async function createAdminProduct(
  payload: AdminProductCreatePayload
): Promise<AdminProductDetail> {
  return apiClient<AdminProductDetail>("admin/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminProduct(
  id: string,
  payload: AdminProductUpdatePayload
): Promise<AdminProductDetail> {
  return apiClient<AdminProductDetail>(`admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deactivateAdminProduct(id: string): Promise<AdminProductDetail> {
  return apiClient<AdminProductDetail>(`admin/products/${id}`, {
    method: "DELETE",
  });
}

/* ==========================================================================
   Admin Product Image Management
   ========================================================================== */

export async function addAdminProductImage(
  productId: string,
  payload: {
    image_url: string;
    alt_text?: string;
    tag?: string;
    display_order?: number;
    is_primary?: boolean;
  }
): Promise<AdminProductImage> {
  return apiClient<AdminProductImage>(`admin/products/${productId}/images`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminProductImage(
  productId: string,
  imageId: string,
  payload: {
    image_url?: string;
    alt_text?: string;
    tag?: string;
    display_order?: number;
    is_primary?: boolean;
  }
): Promise<AdminProductImage> {
  return apiClient<AdminProductImage>(`admin/products/${productId}/images/${imageId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminProductImage(
  productId: string,
  imageId: string
): Promise<void> {
  await apiClient<void>(`admin/products/${productId}/images/${imageId}`, {
    method: "DELETE",
  });
}

/* ==========================================================================
   Admin Category Management
   ========================================================================== */

export async function getAdminCategories(): Promise<AdminCategory[]> {
  return apiClient<AdminCategory[]>("admin/categories");
}

export async function createAdminCategory(
  payload: AdminCategoryCreatePayload
): Promise<AdminCategory> {
  return apiClient<AdminCategory>("admin/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminCategory(
  id: string,
  payload: AdminCategoryUpdatePayload
): Promise<AdminCategory> {
  return apiClient<AdminCategory>(`admin/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deactivateAdminCategory(id: string): Promise<AdminCategory> {
  return apiClient<AdminCategory>(`admin/categories/${id}`, {
    method: "DELETE",
  });
}

/* ==========================================================================
   Admin Inventory Management (Phase 4C-A)
   ========================================================================== */

export interface AdminInventoryFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string;
  stock_status?: string;
  low_stock_only?: boolean;
}

export async function getAdminInventory(
  params: AdminInventoryFilterParams = {}
): Promise<ApiPaginatedResponse<AdminInventoryItem>> {
  return apiClient<ApiPaginatedResponse<AdminInventoryItem>>("admin/inventory", {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search,
      category_id: params.category_id,
      stock_status: params.stock_status,
      low_stock_only: params.low_stock_only,
    },
  });
}

export async function getAdminProductInventory(productId: string): Promise<AdminInventoryDetail> {
  return apiClient<AdminInventoryDetail>(`admin/inventory/${productId}`);
}

export async function adjustAdminInventory(
  productId: string,
  payload: AdminInventoryAdjustmentPayload
): Promise<AdminInventoryDetail> {
  return apiClient<AdminInventoryDetail>(`admin/inventory/${productId}/adjust`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAdminInventoryMovements(
  productId: string,
  params: { page?: number; limit?: number } = {}
): Promise<ApiPaginatedResponse<AdminInventoryMovement>> {
  return apiClient<ApiPaginatedResponse<AdminInventoryMovement>>(
    `admin/inventory/${productId}/movements`,
    {
      params: {
        page: params.page,
        limit: params.limit,
      },
    }
  );
}

/* ==========================================================================
   Admin Production & Loom Operations (Phase 4C-A)
   ========================================================================== */

export interface AdminProductionFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  product_id?: string;
  search?: string;
}

export async function getAdminProductionBatches(
  params: AdminProductionFilterParams = {}
): Promise<ApiPaginatedResponse<AdminProductionBatchList>> {
  return apiClient<ApiPaginatedResponse<AdminProductionBatchList>>("admin/production", {
    params: {
      page: params.page,
      limit: params.limit,
      status: params.status,
      product_id: params.product_id,
      search: params.search,
    },
  });
}

export async function getAdminProductionBatch(id: string): Promise<AdminProductionBatchDetail> {
  return apiClient<AdminProductionBatchDetail>(`admin/production/${id}`);
}

export async function createAdminProductionBatch(
  payload: AdminProductionBatchCreatePayload
): Promise<AdminProductionBatchDetail> {
  return apiClient<AdminProductionBatchDetail>("admin/production", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminProductionBatch(
  id: string,
  payload: AdminProductionBatchUpdatePayload
): Promise<AdminProductionBatchDetail> {
  return apiClient<AdminProductionBatchDetail>(`admin/production/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getAdminProductionStages(batchId: string): Promise<AdminProductionStage[]> {
  return apiClient<AdminProductionStage[]>(`admin/production/${batchId}/stages`);
}

export async function updateAdminProductionStage(
  batchId: string,
  stageId: string,
  payload: AdminProductionStageUpdatePayload
): Promise<AdminProductionStage> {
  return apiClient<AdminProductionStage>(`admin/production/${batchId}/stages/${stageId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/* ==========================================================================
   Admin Customer Management (Phase 4C-B)
   ========================================================================== */

export interface AdminCustomerFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  customer_type?: string;
}

export async function getAdminCustomers(
  params: AdminCustomerFilterParams = {}
): Promise<ApiPaginatedResponse<AdminCustomerList>> {
  return apiClient<ApiPaginatedResponse<AdminCustomerList>>("admin/customers", {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search,
      customer_type: params.customer_type,
    },
  });
}

export async function getAdminCustomer(id: string): Promise<AdminCustomerDetail> {
  return apiClient<AdminCustomerDetail>(`admin/customers/${id}`);
}

export async function createAdminCustomer(
  payload: AdminCustomerCreatePayload
): Promise<AdminCustomerDetail> {
  return apiClient<AdminCustomerDetail>("admin/customers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ==========================================================================
   Admin Order Management (Phase 4C-B)
   ========================================================================== */

export interface AdminOrderFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  order_type?: string;
  payment_status?: string;
  search?: string;
}

export async function getAdminOrders(
  params: AdminOrderFilterParams = {}
): Promise<ApiPaginatedResponse<AdminOrderList>> {
  return apiClient<ApiPaginatedResponse<AdminOrderList>>("admin/orders", {
    params: {
      page: params.page,
      limit: params.limit,
      status: params.status,
      order_type: params.order_type,
      payment_status: params.payment_status,
      search: params.search,
    },
  });
}

export async function getAdminOrder(id: string): Promise<AdminOrderDetail> {
  return apiClient<AdminOrderDetail>(`admin/orders/${id}`);
}

export async function createAdminOrder(
  payload: AdminOrderCreatePayload
): Promise<AdminOrderDetail> {
  return apiClient<AdminOrderDetail>("admin/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminOrder(
  id: string,
  payload: AdminOrderUpdatePayload
): Promise<AdminOrderDetail> {
  return apiClient<AdminOrderDetail>(`admin/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function confirmAdminOrder(id: string): Promise<AdminOrderDetail> {
  return apiClient<AdminOrderDetail>(`admin/orders/${id}/confirm`, {
    method: "POST",
  });
}

export async function cancelAdminOrder(id: string): Promise<AdminOrderDetail> {
  return apiClient<AdminOrderDetail>(`admin/orders/${id}/cancel`, {
    method: "POST",
  });
}

export async function fulfillAdminOrder(id: string): Promise<AdminOrderDetail> {
  return apiClient<AdminOrderDetail>(`admin/orders/${id}/fulfill`, {
    method: "POST",
  });
}

/* ==========================================================================
   Admin Wholesale CRM (Phase 4C-B)
   ========================================================================== */

export interface AdminWholesaleFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export async function getAdminWholesaleEnquiries(
  params: AdminWholesaleFilterParams = {}
): Promise<ApiPaginatedResponse<AdminWholesaleEnquiryList>> {
  return apiClient<ApiPaginatedResponse<AdminWholesaleEnquiryList>>("admin/wholesale", {
    params: {
      page: params.page,
      limit: params.limit,
      status: params.status,
      search: params.search,
    },
  });
}

export async function getAdminWholesaleEnquiry(id: string): Promise<AdminWholesaleEnquiryDetail> {
  return apiClient<AdminWholesaleEnquiryDetail>(`admin/wholesale/${id}`);
}

export async function updateAdminWholesaleEnquiry(
  id: string,
  payload: AdminWholesaleEnquiryUpdatePayload
): Promise<AdminWholesaleEnquiryDetail> {
  return apiClient<AdminWholesaleEnquiryDetail>(`admin/wholesale/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function convertAdminWholesaleToOrder(
  id: string,
  payload: AdminWholesaleConvertToOrderPayload
): Promise<AdminOrderDetail> {
  return apiClient<AdminOrderDetail>(`admin/wholesale/${id}/convert`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ==========================================================================
   Admin Supplier Management (Phase 4C-C)
   ========================================================================== */

export interface AdminSupplierFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  supplier_type?: string;
  is_active?: boolean;
}

export async function getAdminSuppliers(
  params: AdminSupplierFilterParams = {}
): Promise<ApiPaginatedResponse<AdminSupplierList>> {
  return apiClient<ApiPaginatedResponse<AdminSupplierList>>("admin/suppliers", {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search,
      supplier_type: params.supplier_type,
      is_active: params.is_active,
    },
  });
}

export async function getAdminSupplier(id: string): Promise<AdminSupplierDetail> {
  return apiClient<AdminSupplierDetail>(`admin/suppliers/${id}`);
}

export async function createAdminSupplier(
  payload: AdminSupplierCreatePayload
): Promise<AdminSupplierDetail> {
  return apiClient<AdminSupplierDetail>("admin/suppliers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminSupplier(
  id: string,
  payload: AdminSupplierUpdatePayload
): Promise<AdminSupplierDetail> {
  return apiClient<AdminSupplierDetail>(`admin/suppliers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/* ==========================================================================
   Admin Raw Material Management (Phase 4C-C)
   ========================================================================== */

export interface AdminRawMaterialFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  material_type?: string;
  low_stock_only?: boolean;
  is_active?: boolean;
}

export async function getAdminRawMaterials(
  params: AdminRawMaterialFilterParams = {}
): Promise<ApiPaginatedResponse<AdminRawMaterialList>> {
  return apiClient<ApiPaginatedResponse<AdminRawMaterialList>>("admin/raw-materials", {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search,
      material_type: params.material_type,
      low_stock_only: params.low_stock_only,
      is_active: params.is_active,
    },
  });
}

export async function getAdminRawMaterial(id: string): Promise<AdminRawMaterialDetail> {
  return apiClient<AdminRawMaterialDetail>(`admin/raw-materials/${id}`);
}

export async function createAdminRawMaterial(
  payload: AdminRawMaterialCreatePayload
): Promise<AdminRawMaterialDetail> {
  return apiClient<AdminRawMaterialDetail>("admin/raw-materials", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminRawMaterial(
  id: string,
  payload: AdminRawMaterialUpdatePayload
): Promise<AdminRawMaterialDetail> {
  return apiClient<AdminRawMaterialDetail>(`admin/raw-materials/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function adjustAdminRawMaterialStock(
  id: string,
  payload: AdminRawMaterialAdjustmentPayload
): Promise<AdminRawMaterialDetail> {
  return apiClient<AdminRawMaterialDetail>(`admin/raw-materials/${id}/adjust`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ==========================================================================
   Admin Purchasing & Material Receiving (Phase 4C-C)
   ========================================================================== */

export interface AdminPurchaseFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  supplier_id?: string;
  search?: string;
}

export async function getAdminPurchases(
  params: AdminPurchaseFilterParams = {}
): Promise<ApiPaginatedResponse<AdminPurchaseOrderList>> {
  return apiClient<ApiPaginatedResponse<AdminPurchaseOrderList>>("admin/purchases", {
    params: {
      page: params.page,
      limit: params.limit,
      status: params.status,
      supplier_id: params.supplier_id,
      search: params.search,
    },
  });
}

export async function getAdminPurchase(id: string): Promise<AdminPurchaseOrderDetail> {
  return apiClient<AdminPurchaseOrderDetail>(`admin/purchases/${id}`);
}

export async function createAdminPurchase(
  payload: AdminPurchaseOrderCreatePayload
): Promise<AdminPurchaseOrderDetail> {
  return apiClient<AdminPurchaseOrderDetail>("admin/purchases", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function receiveAdminPurchaseItems(
  id: string,
  payload: AdminPurchaseOrderReceivePayload
): Promise<AdminPurchaseOrderDetail> {
  return apiClient<AdminPurchaseOrderDetail>(`admin/purchases/${id}/receive`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ==========================================================================
   Admin Production Raw Material Consumption (Phase 4C-C)
   ========================================================================== */

export async function consumeAdminProductionMaterial(
  batchId: string,
  payload: AdminProductionConsumeMaterialPayload
): Promise<AdminProductionBatchMaterialDetail> {
  return apiClient<AdminProductionBatchMaterialDetail>(`admin/production/${batchId}/consume-material`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAdminProductionMaterials(
  batchId: string
): Promise<AdminProductionBatchMaterialDetail[]> {
  return apiClient<AdminProductionBatchMaterialDetail[]>(`admin/production/${batchId}/materials`);
}

/* ==========================================================================
   Admin Payments Foundation (Phase 4C-C)
   ========================================================================== */

export interface AdminPaymentFilterParams {
  page?: number;
  limit?: number;
  payment_type?: string;
  payment_status?: string;
  customer_id?: string;
  supplier_id?: string;
  order_id?: string;
  purchase_order_id?: string;
  search?: string;
}

export async function getAdminPayments(
  params: AdminPaymentFilterParams = {}
): Promise<ApiPaginatedResponse<AdminPaymentList>> {
  return apiClient<ApiPaginatedResponse<AdminPaymentList>>("admin/payments", {
    params: {
      page: params.page,
      limit: params.limit,
      payment_type: params.payment_type,
      payment_status: params.payment_status,
      customer_id: params.customer_id,
      supplier_id: params.supplier_id,
      order_id: params.order_id,
      purchase_order_id: params.purchase_order_id,
      search: params.search,
    },
  });
}

export async function getAdminPayment(id: string): Promise<AdminPaymentDetail> {
  return apiClient<AdminPaymentDetail>(`admin/payments/${id}`);
}

export async function createAdminPayment(
  payload: AdminPaymentCreatePayload
): Promise<AdminPaymentDetail> {
  return apiClient<AdminPaymentDetail>("admin/payments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminPayment(
  id: string,
  payload: AdminPaymentUpdatePayload
): Promise<AdminPaymentDetail> {
  return apiClient<AdminPaymentDetail>(`admin/payments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/* ==========================================================================
   Admin Invoicing & Billing (Phase 4C-D)
   ========================================================================== */

export interface AdminInvoiceFilterParams {
  page?: number;
  limit?: number;
  invoice_type?: string;
  status?: string;
  customer_id?: string;
  supplier_id?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export async function getAdminInvoices(
  params: AdminInvoiceFilterParams = {}
): Promise<ApiPaginatedResponse<AdminInvoiceList>> {
  return apiClient<ApiPaginatedResponse<AdminInvoiceList>>("admin/invoices", {
    params: {
      page: params.page,
      limit: params.limit,
      invoice_type: params.invoice_type,
      status: params.status,
      customer_id: params.customer_id,
      supplier_id: params.supplier_id,
      search: params.search,
      start_date: params.start_date,
      end_date: params.end_date,
    },
  });
}

export async function getAdminInvoice(id: string): Promise<AdminInvoiceDetail> {
  return apiClient<AdminInvoiceDetail>(`admin/invoices/${id}`);
}

export async function createAdminInvoice(
  payload: AdminInvoiceCreatePayload
): Promise<AdminInvoiceDetail> {
  return apiClient<AdminInvoiceDetail>("admin/invoices", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createAdminInvoiceFromOrder(
  orderId: string
): Promise<AdminInvoiceDetail> {
  return apiClient<AdminInvoiceDetail>(`admin/invoices/from-order/${orderId}`, {
    method: "POST",
  });
}

export async function updateAdminInvoiceStatus(
  id: string,
  payload: AdminInvoiceStatusUpdatePayload
): Promise<AdminInvoiceDetail> {
  return apiClient<AdminInvoiceDetail>(`admin/invoices/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function recordAdminInvoicePayment(
  id: string,
  payload: AdminInvoiceRecordPaymentPayload
): Promise<AdminInvoiceDetail> {
  return apiClient<AdminInvoiceDetail>(`admin/invoices/${id}/record-payment`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAdminInvoicePdfDownloadUrl(id: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  return `${baseUrl.replace(/\/$/, "")}/admin/invoices/${id}/pdf`;
}

/* ==========================================================================
   Admin Financial Dashboard & Outstandings (Phase 4C-D)
   ========================================================================== */

export async function getAdminFinanceOverview(): Promise<FinanceOverviewKPIs> {
  return apiClient<FinanceOverviewKPIs>("admin/finance/overview");
}

export async function getAdminFinanceReceivables(): Promise<CustomerOutstandingDetail[]> {
  return apiClient<CustomerOutstandingDetail[]>("admin/finance/receivables");
}

export async function getAdminFinancePayables(): Promise<SupplierOutstandingDetail[]> {
  return apiClient<SupplierOutstandingDetail[]>("admin/finance/payables");
}

/* ==========================================================================
   Admin Business Analytics & Reports (Phase 4C-D)
   ========================================================================== */

export interface SalesReportParams {
  start_date?: string;
  end_date?: string;
  customer_type?: string;
  order_type?: string;
}

export async function getAdminSalesReport(
  params: SalesReportParams = {}
): Promise<SalesReportSummary> {
  return apiClient<SalesReportSummary>("admin/reports/sales", {
    params: {
      start_date: params.start_date,
      end_date: params.end_date,
      customer_type: params.customer_type,
      order_type: params.order_type,
    },
  });
}

export async function getAdminInventoryValuationReport(): Promise<InventoryValuationReport> {
  return apiClient<InventoryValuationReport>("admin/reports/inventory-valuation");
}

export interface GSTReportParams {
  start_date?: string;
  end_date?: string;
}

export async function getAdminGSTReport(
  params: GSTReportParams = {}
): Promise<GSTSummaryReport> {
  return apiClient<GSTSummaryReport>("admin/reports/gst", {
    params: {
      start_date: params.start_date,
      end_date: params.end_date,
    },
  });
}

export function getAdminReportCsvExportUrl(
  reportType: "sales" | "inventory-valuation" | "gst",
  params: Record<string, string | undefined> = {}
): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const url = new URL(`${baseUrl.replace(/\/$/, "")}/admin/reports/${reportType}`);
  url.searchParams.set("export", "csv");
  Object.entries(params).forEach(([k, v]) => {
    if (v) url.searchParams.set(k, v);
  });
  return url.toString();
}




