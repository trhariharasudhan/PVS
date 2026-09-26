import { apiClient } from "./client";
import { ApiWholesaleEnquiryCreate, ApiWholesaleEnquiryResponse } from "@/types";

/**
 * Submit B2B wholesale trade application to PostgreSQL via REST API.
 */
export async function submitWholesaleEnquiry(
  payload: ApiWholesaleEnquiryCreate
): Promise<ApiWholesaleEnquiryResponse> {
  return apiClient<ApiWholesaleEnquiryResponse>("wholesale-enquiries", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
