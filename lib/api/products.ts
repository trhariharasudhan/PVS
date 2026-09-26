import { apiClient } from "./client";
import { ApiPaginatedResponse, ApiProductDetail, ApiProductList } from "@/types";

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  category_slug?: string;
  availability?: string;
  featured?: boolean;
  new_arrival?: boolean;
  color?: string;
  motif?: string;
}

/**
 * Fetch paginated and filtered product catalogue from REST API.
 */
export async function getProducts(
  params: ProductQueryParams = {}
): Promise<ApiPaginatedResponse<ApiProductList>> {
  return apiClient<ApiPaginatedResponse<ApiProductList>>("products", {
    params: {
      page: params.page || 1,
      limit: params.limit || 12,
      search: params.search,
      category: params.category,
      category_slug: params.category_slug,
      availability: params.availability,
      featured: params.featured,
      new_arrival: params.new_arrival,
      color: params.color,
      motif: params.motif,
    },
  });
}

/**
 * Fetch single product details by UUID or unique product code.
 */
export async function getProductByIdOrCode(
  idOrCode: string
): Promise<ApiProductDetail> {
  return apiClient<ApiProductDetail>(`products/${idOrCode}`);
}
