import { ApiError, getApiBase } from "./client";

export type CustomerSegment = "INDIVIDUAL" | "RETAILER" | "WHOLESALE";

export interface CustomOrderSpec {
  segment: CustomerSegment;
  contact_name: string;
  phone: string;
  email?: string;
  city?: string;
  business_name?: string;
  preferred_contact: "whatsapp" | "call" | "visit" | "email";
  saree_type: string;
  occasion?: string;
  body_colour: string;
  border_colour: string;
  pallu_colour: string;
  silk_type: string;
  silk_percentage?: number | null;
  zari_type: string;
  border_style?: string;
  design_notes?: string;
  quantity: number;
  needed_by?: string | null;
  budget_range?: string;
  consent_to_contact: boolean;
  /** honeypot — must stay empty */
  website?: string;
}

export interface CustomOrderSubmitted {
  reference_code: string;
  status: string;
  message: string;
}

export interface CustomOrderStatus {
  reference_code: string;
  status: string;
  status_label: string;
  saree_type: string;
  quantity: number;
  updated_at: string;
}

async function parseError(res: Response): Promise<ApiError> {
  let message = `Request failed (${res.status})`;
  let details: unknown;
  try {
    const body = await res.json();
    details = body;
    const err = body?.error ?? body;
    const d = err?.details ?? err?.detail;
    if (Array.isArray(d) && d.length) message = d.map((x: { message?: string; msg?: string }) => x.message || x.msg).join(" · ");
    else if (typeof err?.message === "string") message = err.message;
    else if (typeof d === "string") message = d;
  } catch {
    /* not JSON */
  }
  return new ApiError(message, res.status, details);
}

/** Multipart submit: JSON spec + up to 5 design files. */
export async function submitCustomOrder(spec: CustomOrderSpec, files: File[]): Promise<CustomOrderSubmitted> {
  const form = new FormData();
  form.append("payload", JSON.stringify(spec));
  files.forEach((f) => form.append("files", f, f.name));
  const res = await fetch(`${getApiBase()}/custom-orders`, { method: "POST", body: form });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function getCustomOrderStatus(ref: string, phone: string): Promise<CustomOrderStatus> {
  const q = new URLSearchParams({ ref: ref.trim(), phone: phone.trim() });
  const res = await fetch(`${getApiBase()}/custom-orders/status?${q}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw await parseError(res);
  return res.json();
}
