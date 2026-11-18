import { ApiError, getApiBase } from "./client";

export interface ContactPayload {
  name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  language?: "en" | "ta";
  /** honeypot — must stay empty */
  website?: string;
}

export interface WholesalePayload {
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

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${getApiBase()}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      const err = j?.error ?? j;
      const d = err?.details ?? err?.detail;
      if (Array.isArray(d) && d.length) message = d.map((x: { message?: string; msg?: string }) => x.message || x.msg).join(" · ");
      else if (typeof err?.message === "string") message = err.message;
      else if (typeof d === "string") message = d;
    } catch {
      /* not JSON */
    }
    throw new ApiError(message, res.status);
  }
  return res.json();
}

/** Public contact form → stored in contact_messages (visible to staff). */
export const submitContact = (p: ContactPayload) => post<{ status: string; message: string }>("contact", p);

/** Wholesale enquiry → stored in wholesale_enquiries (admin CRM). */
export const submitWholesale = (p: WholesalePayload) => post<{ enquiry_id: string; status: string; message: string }>("wholesale-enquiries", p);

/** True when the error is a network failure rather than a validation message worth showing. */
export const isNetworkError = (e: unknown) => !(e instanceof ApiError) || e.status >= 500;
