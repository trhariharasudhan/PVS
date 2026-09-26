# PVS Silk S — RESTful API Specification
**Document Version:** 2.0.0  
**Framework:** Python 3.12 / FastAPI / Pydantic v2 / SQLAlchemy 2.x  
**Base URL:** `/api/v1`  
**Phase:** Phase 3 — Public REST API & Dynamic Product Catalogue  
**Last Updated:** August 30, 2026  

---

## 1. Global API Standards

### Conventions
1. **JSON Envelope & Headers:** All requests and responses use `Content-Type: application/json`.
2. **Pagination:** Standard query parameters for list endpoints:
   - `page` (default: 1, min: 1)
   - `limit` (default: 12, min: 1, max: 100)
   - Response envelope:
     ```json
     {
       "items": [...],
       "total": 48,
       "page": 1,
       "limit": 12,
       "total_pages": 4
     }
     ```
3. **Standardized Error Response Format:**
   ```json
   {
     "error": {
       "code": "HTTP_ERROR",
       "message": "Saree with identifier 'PVS-999' was not found in our active catalogue."
     }
   }
   ```
4. **Validation Error Format (`422 Unprocessable Entity`):**
   ```json
   {
     "error": {
       "code": "VALIDATION_ERROR",
       "message": "The request payload failed input validation.",
       "details": [
         {
           "field": "phone",
           "message": "Field required"
         }
       ]
     }
   }
   ```

---

## 2. API Architecture & Domain Segregation

```
┌─────────────────────────────────────────────────────────────┐
│                      PVS SILK S API                         │
├──────────────────────────────┬──────────────────────────────┤
│          PUBLIC API          │          ADMIN API           │
│       (Phase 3 Implemented)  │      (Future Auth Phase)     │
├──────────────────────────────┼──────────────────────────────┤
│ • GET /health                │ • /api/v1/admin/auth/*       │
│ • GET /api/v1/health         │ • /api/v1/admin/products/*   │
│ • GET /api/v1/categories     │ • /api/v1/admin/inventory/*  │
│ • GET /api/v1/categories/    │ • /api/v1/admin/enquiries/*  │
│       {slug}/products        │ • /api/v1/admin/orders/*     │
│ • GET /api/v1/products       │ • /api/v1/admin/production/* │
│ • GET /api/v1/products/{id}  │                              │
│ • POST /api/v1/wholesale-enq │                              │
│ • POST /api/v1/contact       │                              │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 3. Section I: Public REST Endpoints

### 3.1 Health & Diagnostics
* **`GET /health`** (Root probe)
  - Returns `{"status": "ok", "environment": "development", "database": "connected"}`.
* **`GET /api/v1/health`** (Readiness probe)
  - Executes `SELECT 1` against PostgreSQL with timeout safeguards.

### 3.2 Saree Categories
* **`GET /api/v1/categories`**
  - **Description:** List active saree categories for navigation pills and filters.
  - **Response `200 OK`:**
    ```json
    [
      {
        "id": "c1f7b0a8-b649-43c2-bf72-e0c1f609e97c",
        "name": "Pure Silk Sarees",
        "slug": "pure-silk",
        "tagline": "Authentic Silk Mark Quality",
        "description": "Woven using high-twist pure mulberry silk warp and weft for unmatched luster.",
        "banner_image_url": "https://images.unsplash.com/...",
        "display_order": 1
      }
    ]
    ```

* **`GET /api/v1/categories/{slug}/products`**
  - **Description:** Retrieve paginated sarees filtered by category slug.
  - **Query Parameters:** `page` (default 1), `limit` (default 12), `availability`.
  - **Response `200 OK`:** `PaginatedResponse[ProductListPublic]`.

### 3.3 Product Catalogue
* **`GET /api/v1/products`**
  - **Description:** Search, filter, and paginate through public saree listings.
  - **Query Parameters:**
    - `page` (int, ge=1, default: 1)
    - `limit` (int, ge=1, le=100, default: 12)
    - `search` (string, searches across name, code, fabric, color, border, motif, description)
    - `category` or `category_slug` (string e.g. `bridal`, `pure-silk`)
    - `availability` (string e.g. `IN_STOCK`, `MADE_TO_ORDER`, `LIMITED_WEAVE`)
    - `featured` (bool)
    - `new_arrival` (bool)
    - `color` (string)
    - `motif` (string)
  - **Response `200 OK`:**
    ```json
    {
      "items": [
        {
          "id": "e4d2a1b9-3efc-4573-bf01-c8efd927a419",
          "code": "PVS-DEMO-001",
          "name": "Aadrika Crimson Bridal Kanchipuram Silk",
          "category_name": "Bridal & Wedding",
          "category_slug": "bridal",
          "fabric": "100% Pure Mulberry Silk (3-Ply)",
          "color": "Deep Crimson Red with Antique Gold Zari",
          "border": "Broad Korvai Temple Border with Mayil & Rudraksham",
          "motif": "Mayil (Peacock) & Temple Gopuram",
          "price_display": "Enquire for Price",
          "availability": "In Stock",
          "is_featured": true,
          "is_new_arrival": false,
          "primary_image": {
            "id": "f8a12345-...",
            "image_url": "https://images.unsplash.com/...",
            "alt_text": "Full Saree Drape",
            "tag": "Full Saree",
            "display_order": 1,
            "is_primary": true
          }
        }
      ],
      "total": 6,
      "page": 1,
      "limit": 12,
      "total_pages": 1
    }
    ```

* **`GET /api/v1/products/{id_or_code}`**
  - **Description:** Retrieve full specifications, multi-angle images, care instructions, and related recommendations by UUID or unique product code (e.g. `PVS-DEMO-001`).
  - **Response `200 OK`:** `ProductDetailPublic`.
  - **Response `404 Not Found`:** Returns standardized error envelope if product is missing or inactive.

### 3.4 Inbound Enquiries & Lead Generation
* **`POST /api/v1/wholesale-enquiries`**
  - **Description:** Record a B2B trade application from boutiques and retailers into PostgreSQL.
  - **Request Body:**
    ```json
    {
      "business_name": "Madurai Heritage Silks",
      "contact_person": "Ramanathan Chettiar",
      "phone": "+919443322110",
      "email": "ramanathan@maduraisilks.test",
      "city": "Madurai",
      "business_type": "Wholesale Showroom",
      "number_of_stores": "2-3 Outlets",
      "interested_collection": "Bridal & Pure Silk",
      "expected_quantity": "50-100 Sarees",
      "message": "Interested in regular loom allocations and volume pricing."
    }
    ```
  - **Response `201 Created`:**
    ```json
    {
      "enquiry_id": "9b1deb4d-...",
      "status": "received",
      "message": "Your wholesale enquiry has been received. Our trade desk will contact you within 24 hours."
    }
    ```

* **`POST /api/v1/contact`**
  - **Description:** Receive general customer inquiries or custom colorway requests.
  - **Request Body:** `ContactCreate`.
  - **Response `201 Created`:** `ContactResponse`.

### 3.5 Staff Authentication & Session (Phase 4A Implemented)
* **`POST /api/v1/auth/login`**
  - **Description:** Authenticate staff credentials using Argon2id and set HttpOnly session cookie.
  - **Request Body:**
    ```json
    {
      "email": "admin@pvssilks.com",
      "password": "SecureStaffPassword123!"
    }
    ```
  - **Response `200 OK`:**
    ```json
    {
      "user": {
        "id": "a1b2c3d4-...",
        "email": "admin@pvssilks.com",
        "full_name": "PVS Administrator",
        "role": "SUPER_ADMIN",
        "is_active": true,
        "last_login_at": "2026-08-30T18:20:00Z",
        "created_at": "2026-08-30T14:30:00Z"
      },
      "message": "Staff session authenticated successfully."
    }
    ```
  - **Set-Cookie Header:** `pvs_access_token=<jwt>; HttpOnly; Path=/; SameSite=Lax`
  - **Response `401 Unauthorized`:** If credentials do not match or account is inactive.

* **`POST /api/v1/auth/logout`**
  - **Description:** Clears the HttpOnly session cookie.
  - **Response `200 OK`:** `{"message": "Staff session logged out successfully."}`

* **`GET /api/v1/auth/me`**
  - **Description:** Returns the active authenticated staff profile.
  - **Authentication:** HttpOnly Cookie or `Authorization: Bearer <token>`.
  - **Response `200 OK`:** `UserPublic`
  - **Response `401 Unauthorized`:** If unauthenticated or token expired.

---

## 4. Section II: Admin Operations Workspace Endpoints (Phase 4B Implemented)

### 4.1 Dashboard Telemetry
* **`GET /api/v1/admin/dashboard`**
  - **Access:** Authenticated Staff (`SUPER_ADMIN`, `FACTORY_MANAGER`, `SALES_ADMIN`).
  - **Response `200 OK`:** `AdminDashboardMetrics` (live database aggregates).

### 4.2 Product Management CMS
* **`GET /api/v1/admin/products`**
  - **Access:** Authenticated Staff.
  - **Query Parameters:** `page`, `limit`, `search`, `category_id`, `availability`, `featured`, `is_active`.
  - **Response `200 OK`:** `PaginatedResponse[AdminProductList]`.

* **`POST /api/v1/admin/products`**
  - **Access:** `SALES_ADMIN`, `SUPER_ADMIN`.
  - **Request Body:** `AdminProductCreate`.
  - **Response `201 Created`:** `AdminProductDetail`.
  - **Errors:** `409 Conflict` (duplicate SKU code), `404 Not Found` (invalid category).

* **`GET /api/v1/admin/products/{id}`**
  - **Access:** Authenticated Staff.
  - **Response `200 OK`:** `AdminProductDetail`.

* **`PATCH /api/v1/admin/products/{id}`**
  - **Access:** `SALES_ADMIN`, `SUPER_ADMIN`.
  - **Request Body:** `AdminProductUpdate` (partial fields).
  - **Response `200 OK`:** `AdminProductDetail`.

* **`DELETE /api/v1/admin/products/{id}`**
  - **Access:** `SALES_ADMIN`, `SUPER_ADMIN`.
  - **Description:** Soft-deactivates product (`is_active = false`).
  - **Response `200 OK`:** `AdminProductDetail`.

### 4.3 Photography Angles
* **`POST /api/v1/admin/products/{id}/images`** (`201 Created` $\rightarrow$ `AdminProductImage`)
* **`PATCH /api/v1/admin/products/{id}/images/{image_id}`** (`200 OK` $\rightarrow$ `AdminProductImage`)
* **`DELETE /api/v1/admin/products/{id}/images/{image_id}`** (`204 No Content`)

### 4.4 Category Management
* **`GET /api/v1/admin/categories`** (`200 OK` $\rightarrow$ `List[AdminCategory]` with live product counts)
* **`POST /api/v1/admin/categories`** (`201 Created` $\rightarrow$ `AdminCategory`)
* **`PATCH /api/v1/admin/categories/{id}`** (`200 OK` $\rightarrow$ `AdminCategory`)
* **`DELETE /api/v1/admin/categories/{id}`** (`200 OK` $\rightarrow$ `AdminCategory` soft-deactivation)

### 4.5 Inventory & Stock Ledger Desk (Phase 4C-A Implemented)
* **`GET /api/v1/admin/inventory`**
  - **Access:** Authenticated Staff (`SUPER_ADMIN`, `FACTORY_MANAGER`, `SALES_ADMIN`).
  - **Query Parameters:** `page`, `limit`, `search`, `category_id`, `stock_status`, `low_stock_only`.
  - **Response `200 OK`:** `PaginatedResponse[AdminInventoryItem]`.
* **`GET /api/v1/admin/inventory/{product_id}`**
  - **Access:** Authenticated Staff.
  - **Response `200 OK`:** `AdminInventoryDetail` (inventory stats + recent 10 movements).
* **`POST /api/v1/admin/inventory/{product_id}/adjust`**
  - **Access:** `SUPER_ADMIN`, `FACTORY_MANAGER`, `SALES_ADMIN`.
  - **Request Body:** `AdminInventoryAdjustmentRequest` (`movement_type`, `quantity_delta`, `notes`, `reference_id`, `warehouse_location`).
  - **Response `200 OK`:** `AdminInventoryDetail`.
  - **Errors:** `409 Conflict` (negative stock invariant violation).
* **`GET /api/v1/admin/inventory/{product_id}/movements`**
  - **Access:** Authenticated Staff.
  - **Response `200 OK`:** `PaginatedResponse[AdminInventoryMovement]`.

### 4.6 Master Loom Production Desk (Phase 4C-A Implemented)
* **`GET /api/v1/admin/production`**
  - **Access:** Authenticated Staff (`SUPER_ADMIN`, `FACTORY_MANAGER`, `SALES_ADMIN`).
  - **Query Parameters:** `page`, `limit`, `status`, `product_id`, `search`.
  - **Response `200 OK`:** `PaginatedResponse[AdminProductionBatchList]`.
* **`POST /api/v1/admin/production`**
  - **Access:** `SUPER_ADMIN`, `FACTORY_MANAGER`.
  - **Request Body:** `AdminProductionBatchCreate`.
  - **Response `201 Created`:** `AdminProductionBatchDetail`.
  - **Errors:** `409 Conflict` (duplicate batch number), `404 Not Found` (invalid product).
* **`GET /api/v1/admin/production/{id}`**
  - **Access:** Authenticated Staff.
  - **Response `200 OK`:** `AdminProductionBatchDetail` (batch + quality checkpoint stages).
* **`PATCH /api/v1/admin/production/{id}`**
  - **Access:** `SUPER_ADMIN`, `FACTORY_MANAGER`.
  - **Request Body:** `AdminProductionBatchUpdate`.
  - **Response `200 OK`:** `AdminProductionBatchDetail`.
  - **Special Transition:** Marking `status = "COMPLETED"` automatically creates an atomic `PRODUCTION` movement ledger entry and credits finished inventory.
* **`GET /api/v1/admin/production/{id}/stages`**
  - **Access:** Authenticated Staff.
  - **Response `200 OK`:** `List[AdminProductionStage]`.
* **`PATCH /api/v1/admin/production/{id}/stages/{stage_id}`**
  - **Access:** `SUPER_ADMIN`, `FACTORY_MANAGER`.
  - **Request Body:** `AdminProductionStageUpdate` (`status`, `inspected_by`, `notes`, `completed_at`).
### 4.7 Customer Management (Phase 4C-B Implemented)
* **`GET /api/v1/admin/customers`**
  - **Access:** Authenticated Staff (`SUPER_ADMIN`, `SALES_ADMIN`, `FACTORY_MANAGER`).
  - **Query Parameters:** `page`, `limit`, `search`, `customer_type`.
  - **Response `200 OK`:** `PaginatedResponse[AdminCustomerList]`.
* **`GET /api/v1/admin/customers/{id}`**
  - **Access:** Authenticated Staff.
  - **Response `200 OK`:** `AdminCustomerDetail`.
* **`POST /api/v1/admin/customers`**
  - **Access:** `SUPER_ADMIN`, `SALES_ADMIN`.
  - **Request Body:** `AdminCustomerCreate`.
  - **Response `201 Created`:** `AdminCustomerDetail`.

### 4.8 Sales Orders & Stock Reservation Desk (Phase 4C-B Implemented)
* **`GET /api/v1/admin/orders`**
  - **Access:** Authenticated Staff (`SUPER_ADMIN`, `SALES_ADMIN`, `FACTORY_MANAGER`).
  - **Query Parameters:** `page`, `limit`, `status`, `order_type`, `payment_status`, `search`.
  - **Response `200 OK`:** `PaginatedResponse[AdminOrderList]`.
* **`POST /api/v1/admin/orders`**
  - **Access:** `SUPER_ADMIN`, `SALES_ADMIN`.
  - **Description:** Creates order, snapshots unit prices, and locks inventory (`quantity_reserved += qty`).
  - **Request Body:** `AdminOrderCreate`.
  - **Response `201 Created`:** `AdminOrderDetail`.
  - **Errors:** `409 Conflict` (insufficient available stock), `422 Unprocessable Entity`.
* **`GET /api/v1/admin/orders/{id}`**
  - **Access:** Authenticated Staff.
  - **Response `200 OK`:** `AdminOrderDetail`.
* **`PATCH /api/v1/admin/orders/{id}`**
  - **Access:** `SUPER_ADMIN`, `SALES_ADMIN`.
  - **Request Body:** `AdminOrderUpdate` (`payment_status`, `tracking_number`, `notes`).
  - **Response `200 OK`:** `AdminOrderDetail`.
* **`POST /api/v1/admin/orders/{id}/confirm`**
  - **Access:** `SUPER_ADMIN`, `SALES_ADMIN`.
  - **Response `200 OK`:** `AdminOrderDetail` (`PENDING` $\rightarrow$ `CONFIRMED`).
* **`POST /api/v1/admin/orders/{id}/cancel`**
  - **Access:** `SUPER_ADMIN`, `SALES_ADMIN`.
  - **Description:** Cancels order and releases reserved stock back to available count.
  - **Response `200 OK`:** `AdminOrderDetail`.
* **`POST /api/v1/admin/orders/{id}/fulfill`**
  - **Access:** `SUPER_ADMIN`, `SALES_ADMIN`.
  - **Description:** Deducts physical stock on-hand, clears reservation, and records immutable `SALE` movement.
  - **Response `200 OK`:** `AdminOrderDetail`.

### 4.9 Wholesale Trade CRM (Phase 4C-B Implemented)
* **`GET /api/v1/admin/wholesale`**
  - **Access:** Authenticated Staff (`SUPER_ADMIN`, `SALES_ADMIN`, `FACTORY_MANAGER`).
  - **Query Parameters:** `page`, `limit`, `status`, `search`.
  - **Response `200 OK`:** `PaginatedResponse[AdminWholesaleEnquiryList]`.
* **`GET /api/v1/admin/wholesale/{id}`**
  - **Access:** Authenticated Staff.
  - **Response `200 OK`:** `AdminWholesaleEnquiryDetail`.
* **`PATCH /api/v1/admin/wholesale/{id}`**
  - **Access:** `SUPER_ADMIN`, `SALES_ADMIN`.
  - **Request Body:** `AdminWholesaleEnquiryUpdate` (`status`, `assigned_to_user_id`, `message`).
  - **Response `200 OK`:** `AdminWholesaleEnquiryDetail`.
* **`POST /api/v1/admin/wholesale/{id}/convert`**
  - **Access:** `SUPER_ADMIN`, `SALES_ADMIN`.
  - **Description:** Atomically links/provisions Customer, creates Wholesale Order, and reserves inventory.
  - **Request Body:** `AdminWholesaleConvertToOrderPayload`.
  - **Response `201 Created`:** `AdminOrderDetail`.

### 4.10 Supplier Management Desk (Phase 4C-C Implemented)
* **`GET /api/v1/admin/suppliers`**
  - **Access:** `SUPER_ADMIN`, `FACTORY_MANAGER`, `SALES_ADMIN`.
  - **Query Parameters:** `page`, `limit`, `search`, `supplier_type`, `is_active`.
  - **Response `200 OK`:** `PaginatedResponse[AdminSupplierList]`.
* **`GET /api/v1/admin/suppliers/{id}`**
  - **Access:** `SUPER_ADMIN`, `FACTORY_MANAGER`, `SALES_ADMIN`.
  - **Response `200 OK`:** `AdminSupplierDetail`.
* **`POST /api/v1/admin/suppliers`**
  - **Access:** `SUPER_ADMIN`, `FACTORY_MANAGER`.
  - **Request Body:** `AdminSupplierCreate`.
  - **Response `201 Created`:** `AdminSupplierDetail`.
* **`PATCH /api/v1/admin/suppliers/{id}`**
  - **Access:** `SUPER_ADMIN`, `FACTORY_MANAGER`.
  - **Request Body:** `AdminSupplierUpdate`.
  - **Response `200 OK`:** `AdminSupplierDetail`.

### 4.11 Raw Materials & Movement Ledger Desk (Phase 4C-C Implemented)
* **`GET /api/v1/admin/raw-materials`**
  - **Access:** `SUPER_ADMIN`, `FACTORY_MANAGER`, `SALES_ADMIN`.
  - **Query Parameters:** `page`, `limit`, `search`, `material_type`, `low_stock_only`, `is_active`.
  - **Response `200 OK`:** `PaginatedResponse[AdminRawMaterialList]`.
* **`GET /api/v1/admin/raw-materials/{id}`**
  - **Access:** `SUPER_ADMIN`, `FACTORY_MANAGER`, `SALES_ADMIN`.
  - **Response `200 OK`:** `AdminRawMaterialDetail` (includes stock info and recent movements).
* **`POST /api/v1/admin/raw-materials`**
  - **Access:** `SUPER_ADMIN`, `FACTORY_MANAGER`.
  - **Request Body:** `AdminRawMaterialCreate` (includes optional initial stock baseline).
  - **Response `201 Created`:** `AdminRawMaterialDetail`.
* **`PATCH /api/v1/admin/raw-materials/{id}`**
  - **Access:** `SUPER_ADMIN`, `FACTORY_MANAGER`.
  - **Request Body:** `AdminRawMaterialUpdate`.
  - **Response `200 OK`:** `AdminRawMaterialDetail`.
* **`POST /api/v1/admin/raw-materials/{id}/adjust`**
  - **Access:** `SUPER_ADMIN`, `FACTORY_MANAGER`.
  - **Description:** Row-locked stock adjustment with non-negative stock invariant and immutable movement record.
  - **Request Body:** `AdminRawMaterialAdjustmentRequest`.
  - **Response `200 OK`:** `AdminRawMaterialDetail`.

### 4.12 Purchasing & Consignment Receiving Desk (Phase 4C-C Implemented)
* **`GET /api/v1/admin/purchases`**
  - **Access:** `SUPER_ADMIN`, `FACTORY_MANAGER`, `SALES_ADMIN`.
  - **Query Parameters:** `page`, `limit`, `status`, `supplier_id`, `search`.
  - **Response `200 OK`:** `PaginatedResponse[AdminPurchaseOrderList]`.
* **`GET /api/v1/admin/purchases/{id}`**
  - **Access:** `SUPER_ADMIN`, `FACTORY_MANAGER`, `SALES_ADMIN`.
  - **Response `200 OK`:** `AdminPurchaseOrderDetail`.
* **`POST /api/v1/admin/purchases`**
  - **Access:** `SUPER_ADMIN`, `FACTORY_MANAGER`.
  - **Request Body:** `AdminPurchaseOrderCreate`.
  - **Response `201 Created`:** `AdminPurchaseOrderDetail`.
* **`POST /api/v1/admin/purchases/{id}/receive`**
  - **Access:** `SUPER_ADMIN`, `FACTORY_MANAGER`.
  - **Description:** Atomically increases raw material stock, logs `PURCHASE_RECEIPT` movements, updates received counts, and sets PO status.
  - **Request Body:** `AdminPurchaseOrderReceivePayload`.
  - **Response `200 OK`:** `AdminPurchaseOrderDetail`.

### 4.13 Production Material Consumption (Phase 4C-C Implemented)
* **`POST /api/v1/admin/production/{batch_id}/consume-material`**
  - **Access:** `SUPER_ADMIN`, `FACTORY_MANAGER`.
  - **Description:** Atomically deducts raw material stock and logs `PRODUCTION_CONSUMPTION` movement.
  - **Request Body:** `AdminProductionConsumeMaterialPayload`.
  - **Response `201 Created`:** `AdminProductionBatchMaterialDetail`.
* **`GET /api/v1/admin/production/{batch_id}/materials`**
  - **Access:** `SUPER_ADMIN`, `FACTORY_MANAGER`, `SALES_ADMIN`.
  - **Response `200 OK`:** `List[AdminProductionBatchMaterialDetail]`.

### 4.14 Payment Management Foundation (Phase 4C-C Implemented)
* **`GET /api/v1/admin/payments`**
  - **Access:** `SUPER_ADMIN`, `SALES_ADMIN`, `FACTORY_MANAGER`.
  - **Query Parameters:** `page`, `limit`, `payment_type`, `payment_status`, `customer_id`, `supplier_id`, `order_id`, `purchase_order_id`, `search`.
  - **Response `200 OK`:** `PaginatedResponse[AdminPaymentList]`.
* **`GET /api/v1/admin/payments/{id}`**
  - **Access:** `SUPER_ADMIN`, `SALES_ADMIN`, `FACTORY_MANAGER`.
  - **Response `200 OK`:** `AdminPaymentDetail`.
* **`POST /api/v1/admin/payments`**
  - **Access:** `SUPER_ADMIN`, `SALES_ADMIN`.
  - **Request Body:** `AdminPaymentCreate`.
  - **Response `201 Created`:** `AdminPaymentDetail`.
* **`PATCH /api/v1/admin/payments/{id}`**
  - **Access:** `SUPER_ADMIN`, `SALES_ADMIN`.
  - **Request Body:** `AdminPaymentUpdate`.
  - **Response `200 OK`:** `AdminPaymentDetail`.

---

## 5. OpenAPI / Swagger Documentation

Interactive OpenAPI 3.1 documentation is accessible at:
- **Swagger UI:** `http://localhost:8000/api/v1/docs`
- **Redoc UI:** `http://localhost:8000/api/v1/redoc`
- **OpenAPI JSON Schema:** `http://localhost:8000/api/v1/openapi.json`



