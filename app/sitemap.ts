import { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;
  // PVS weaves to order: no product pages (retired /collections/* and /shop/* redirect to the builder).
  return ["", "/custom-order", "/what-we-weave", "/our-craft", "/wholesale", "/about", "/contact", "/faq"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : route === "/custom-order" ? 0.9 : 0.8,
  }));
}
