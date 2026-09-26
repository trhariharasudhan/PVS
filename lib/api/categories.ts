import { apiClient } from "./client";
import { ApiCategory, ApiPaginatedResponse, ApiProductList } from "@/types";

/**
 * Fetch all active public categories.
 */
export async function getCategories(): Promise<ApiCategory[]> {
  try {
    return await apiClient<ApiCategory[]>("categories");
  } catch (error) {
    console.warn("Failed to fetch categories from API, falling back to static fallback", error);
    return [
      { id: "1", name: "Pure Silk Sarees", slug: "pure-silk", display_order: 1 },
      { id: "2", name: "Bridal & Wedding", slug: "bridal", display_order: 2 },
      { id: "3", name: "Traditional Weaves", slug: "traditional", display_order: 3 },
      { id: "4", name: "Soft Silk", slug: "soft-silk", display_order: 4 },
      { id: "5", name: "New Arrivals", slug: "new-arrivals", display_order: 5 },
    ];
  }
}

/**
 * Fetch products within a specific category.
 */
export async function getCategoryProducts(
  slug: string,
  page: number = 1,
  limit: number = 12
): Promise<ApiPaginatedResponse<ApiProductList>> {
  return apiClient<ApiPaginatedResponse<ApiProductList>>(`categories/${slug}/products`, {
    params: { page, limit },
  });
}
