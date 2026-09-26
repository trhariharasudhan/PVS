import { ApiProductDetail, ApiProductList, Product } from "@/types";

export function adaptApiProductListToProduct(apiItem: ApiProductList): Product {
  const images = [];
  if (apiItem.primary_image?.image_url) {
    images.push({
      src: apiItem.primary_image.image_url,
      alt: apiItem.primary_image.alt_text || apiItem.name,
      tag: apiItem.primary_image.tag || "Full Saree",
    });
  }
  if (apiItem.secondary_image?.image_url) {
    images.push({
      src: apiItem.secondary_image.image_url,
      alt: apiItem.secondary_image.alt_text || apiItem.name,
      tag: apiItem.secondary_image.tag || "Border Detail",
    });
  }
  if (images.length === 0) {
    images.push({
      src: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=900&auto=format&fit=crop",
      alt: apiItem.name,
      tag: "Full Saree",
    });
  }

  return {
    id: apiItem.id,
    code: apiItem.code,
    name: apiItem.name,
    category: apiItem.category_name,
    categorySlug: apiItem.category_slug,
    fabric: apiItem.fabric,
    color: apiItem.color,
    border: apiItem.border,
    pallu: "",
    weaveType: "",
    motif: apiItem.motif || undefined,
    description: "",
    priceDisplay: apiItem.price_display,
    availability: apiItem.availability,
    images: images,
    featured: apiItem.is_featured,
    isNewArrival: apiItem.is_new_arrival,
    careInstructions: ["Dry clean only"],
  };
}

export function adaptApiProductDetailToProduct(apiDetail: ApiProductDetail): Product {
  const images = (apiDetail.images || []).map((img) => ({
    src: img.image_url,
    alt: img.alt_text || apiDetail.name,
    tag: img.tag || "Full Saree",
  }));

  if (images.length === 0) {
    images.push({
      src: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=900&auto=format&fit=crop",
      alt: apiDetail.name,
      tag: "Full Saree",
    });
  }

  const related = (apiDetail.related_products || []).map(adaptApiProductListToProduct);

  return {
    id: apiDetail.id,
    code: apiDetail.code,
    name: apiDetail.name,
    category: apiDetail.category_name,
    categorySlug: apiDetail.category_slug,
    fabric: apiDetail.fabric,
    color: apiDetail.color,
    border: apiDetail.border,
    pallu: apiDetail.pallu || "Rich Handwoven Brocade Pallu",
    motif: apiDetail.motif || undefined,
    weaveType: apiDetail.weave_type,
    description: apiDetail.description,
    detailedStory: apiDetail.detailed_story || undefined,
    priceDisplay: apiDetail.price_display,
    priceNote: apiDetail.price_note || undefined,
    availability: apiDetail.availability,
    images: images,
    featured: apiDetail.is_featured,
    isNewArrival: apiDetail.is_new_arrival,
    dimensions: {
      sareeLength: `${apiDetail.saree_length_meters || 5.5} Metres`,
      blousePiece: apiDetail.blouse_piece_description || "0.8 Metres Included",
      weightApprox: apiDetail.weight_approx_grams ? `${apiDetail.weight_approx_grams} grams` : "750 grams approx",
    },
    careInstructions: apiDetail.care_instructions?.length
      ? apiDetail.care_instructions
      : ["Dry clean only", "Store wrapped in cotton or muslin cloth", "Avoid direct perfume spray on zari"],
    relatedProducts: related,
  };
}
