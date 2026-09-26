"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createAdminProduct, getAdminCategories } from "@/lib/api";
import { AdminCategory } from "@/types";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  Info,
} from "lucide-react";

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [fabric, setFabric] = useState("Pure Mulberry Silk (100%)");
  const [color, setColor] = useState("");
  const [border, setBorder] = useState("Korvai Temple Border with Pure Gold Zari");
  const [pallu, setPallu] = useState("Heavy Rich Brocade Floral Pallu");
  const [motif, setMotif] = useState("Mayil (Peacock) & Rudraksha");
  const [weaveType, setWeaveType] = useState("Traditional Jacquard Weave");
  const [description, setDescription] = useState("");
  const [detailedStory, setDetailedStory] = useState("");
  const [price, setPrice] = useState<string>("16500");
  const [currency, setCurrency] = useState("INR");
  const [isPriceOnEnquiry, setIsPriceOnEnquiry] = useState(true);
  const [priceNote, setPriceNote] = useState("Direct from Master Loom");
  const [availabilityStatus, setAvailabilityStatus] = useState("IN_STOCK");
  const [sareeLengthMeters, setSareeLengthMeters] = useState("5.50");
  const [blousePiece, setBlousePiece] = useState("0.8 Metres Included");
  const [weightGrams, setWeightGrams] = useState("750");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // Images state
  const [images, setImages] = useState<
    { image_url: string; alt_text: string; tag: string; is_primary: boolean }[]
  >([
    {
      image_url:
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80",
      alt_text: "Full Saree View",
      tag: "Full Saree",
      is_primary: true,
    },
  ]);

  useEffect(() => {
    async function loadCats() {
      try {
        const list = await getAdminCategories();
        setCategories(list);
        if (list.length > 0) {
          setCategoryId(list[0].id);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }
    loadCats();
  }, []);

  const handleAddImage = () => {
    setImages([
      ...images,
      {
        image_url: "",
        alt_text: name || "Saree Detail",
        tag: "Border Detail",
        is_primary: images.length === 0,
      },
    ]);
  };

  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    if (images[index].is_primary && updated.length > 0) {
      updated[0].is_primary = true;
    }
    setImages(updated);
  };

  const handleSetPrimaryImage = (index: number) => {
    setImages(
      images.map((img, i) => ({
        ...img,
        is_primary: i === index,
      }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name || !categoryId || !description) {
      setError("Please fill out all mandatory fields (SKU Code, Name, Category, Description).");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const validImages = images
        .filter((img) => img.image_url.trim().length > 5)
        .map((img, idx) => ({
          image_url: img.image_url.trim(),
          alt_text: img.alt_text.trim() || name,
          tag: img.tag.trim() || "Full Saree",
          display_order: idx + 1,
          is_primary: img.is_primary,
        }));

      await createAdminProduct({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        category_id: categoryId,
        fabric: fabric.trim(),
        color: color.trim(),
        border: border.trim(),
        pallu: pallu.trim() || undefined,
        motif: motif.trim() || undefined,
        weave_type: weaveType.trim(),
        description: description.trim(),
        detailed_story: detailedStory.trim() || undefined,
        price: price ? Number(price) : undefined,
        currency,
        is_price_on_enquiry: isPriceOnEnquiry,
        price_note: priceNote.trim() || undefined,
        availability_status: availabilityStatus,
        saree_length_meters: Number(sareeLengthMeters),
        blouse_piece_description: blousePiece.trim() || undefined,
        weight_approx_grams: weightGrams ? Number(weightGrams) : undefined,
        care_instructions: ["Dry clean only", "Store wrapped in muslin/cotton cloth", "Avoid direct moisture"],
        is_featured: isFeatured,
        is_new_arrival: isNewArrival,
        is_active: isActive,
        images: validImages,
      });

      router.push("/admin/products");
    } catch (err: any) {
      console.error("Create product failure:", err);
      setError(err?.message || "Failed to create product SKU. Please check inputs.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-charcoal-600 hover:text-burgundy-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products Catalogue</span>
        </Link>
      </div>

      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950">
          Create New Saree Model
        </h1>
        <p className="text-xs text-charcoal-500 mt-1">
          Add an authentic silk saree model with specifications, weaving attributes, and photography.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-sm text-xs text-red-900 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Identifiers */}
        <div className="p-6 bg-white border border-gold-300/80 rounded-sm shadow-sm space-y-4">
          <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-burgundy-950 border-b border-gold-200 pb-2">
            1. Core Identity & Category
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Product SKU Code <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="PVS-007"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 uppercase"
              />
              <span className="text-[10px] text-charcoal-400">Must be unique across entire catalogue</span>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Saree Model Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Kanchipuram Crimson Royal Brocade"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Weave Category <span className="text-red-600">*</span>
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Availability Status <span className="text-red-600">*</span>
              </label>
              <select
                value={availabilityStatus}
                onChange={(e) => setAvailabilityStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                <option value="IN_STOCK">In Stock (Ready to Dispatch)</option>
                <option value="MADE_TO_ORDER">Made to Order (Loom Production)</option>
                <option value="LIMITED_WEAVE">Limited Weave (Restricted Stock)</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Textile & Weave Attributes */}
        <div className="p-6 bg-white border border-gold-300/80 rounded-sm shadow-sm space-y-4">
          <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-burgundy-950 border-b border-gold-200 pb-2">
            2. Weaving & Fabric Specifications
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Fabric Material <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Color Palette <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Crimson Red / Antique Gold"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Weave Type
              </label>
              <input
                type="text"
                value={weaveType}
                onChange={(e) => setWeaveType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Border Design <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={border}
                onChange={(e) => setBorder(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Pallu Specification
              </label>
              <input
                type="text"
                value={pallu}
                onChange={(e) => setPallu(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Motifs & Patterns
              </label>
              <input
                type="text"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Saree Length (Metres)
              </label>
              <input
                type="number"
                step="0.1"
                value={sareeLengthMeters}
                onChange={(e) => setSareeLengthMeters(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Blouse Piece Description
              </label>
              <input
                type="text"
                value={blousePiece}
                onChange={(e) => setBlousePiece(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Weight Approx (Grams)
              </label>
              <input
                type="number"
                value={weightGrams}
                onChange={(e) => setWeightGrams(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>
          </div>
        </div>

        {/* Narrative & Descriptions */}
        <div className="p-6 bg-white border border-gold-300/80 rounded-sm shadow-sm space-y-4">
          <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-burgundy-950 border-b border-gold-200 pb-2">
            3. Story & Descriptions
          </h2>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Short Description <span className="text-red-600">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Exquisite pure silk saree woven on traditional Jacquard looms..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Detailed Weaving Narrative (Story Tab)
            </label>
            <textarea
              rows={4}
              placeholder="Woven over 14 days by master weavers using interlocked Korvai warp..."
              value={detailedStory}
              onChange={(e) => setDetailedStory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>
        </div>

        {/* Pricing & Commercial */}
        <div className="p-6 bg-white border border-gold-300/80 rounded-sm shadow-sm space-y-4">
          <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-burgundy-950 border-b border-gold-200 pb-2">
            4. Pricing & Visibility Flags
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Commercial Price (₹ INR)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Price Note / Subtitle
              </label>
              <input
                type="text"
                value={priceNote}
                onChange={(e) => setPriceNote(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 text-xs font-semibold text-charcoal-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPriceOnEnquiry}
                  onChange={(e) => setIsPriceOnEnquiry(e.target.checked)}
                  className="rounded text-burgundy-900 focus:ring-gold-500 w-4 h-4"
                />
                <span>Display as &quot;Price on Enquiry&quot;</span>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-gold-200">
            <label className="flex items-center gap-2 text-xs font-semibold text-charcoal-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded text-burgundy-900 focus:ring-gold-500 w-4 h-4"
              />
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                <span>Feature on Homepage Spotlight</span>
              </span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-charcoal-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isNewArrival}
                onChange={(e) => setIsNewArrival(e.target.checked)}
                className="rounded text-burgundy-900 focus:ring-gold-500 w-4 h-4"
              />
              <span>Mark as New Arrival Badge</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-charcoal-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-burgundy-900 focus:ring-gold-500 w-4 h-4"
              />
              <span>Publish to Active Storefront</span>
            </label>
          </div>
        </div>

        {/* Photography Angles */}
        <div className="p-6 bg-white border border-gold-300/80 rounded-sm shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gold-200 pb-2">
            <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-burgundy-950">
              5. Photography & Image Angles ({images.length})
            </h2>
            <button
              type="button"
              onClick={handleAddImage}
              className="inline-flex items-center gap-1 text-xs font-semibold text-burgundy-900 hover:text-gold-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Image URL</span>
            </button>
          </div>

          <div className="space-y-3">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="p-3 bg-ivory-50 border border-gold-200 rounded-sm flex flex-col sm:flex-row items-start sm:items-center gap-3"
              >
                <span className="text-xs font-mono font-bold text-charcoal-500">
                  #{idx + 1}
                </span>

                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={img.image_url}
                  onChange={(e) => {
                    const copy = [...images];
                    copy[idx].image_url = e.target.value;
                    setImages(copy);
                  }}
                  className="flex-1 w-full px-2.5 py-1.5 text-xs bg-white border border-gold-200 rounded-sm"
                />

                <select
                  value={img.tag}
                  onChange={(e) => {
                    const copy = [...images];
                    copy[idx].tag = e.target.value;
                    setImages(copy);
                  }}
                  className="px-2 py-1.5 text-xs bg-white border border-gold-200 rounded-sm"
                >
                  <option value="Full Saree">Full Saree</option>
                  <option value="Border Detail">Border Detail</option>
                  <option value="Pallu">Pallu</option>
                  <option value="Fabric Texture">Fabric Texture</option>
                  <option value="Drape">Drape</option>
                </select>

                <label className="flex items-center gap-1.5 text-xs text-charcoal-700 cursor-pointer whitespace-nowrap">
                  <input
                    type="radio"
                    name="primary_image"
                    checked={img.is_primary}
                    onChange={() => handleSetPrimaryImage(idx)}
                    className="text-burgundy-900 focus:ring-gold-500"
                  />
                  <span>Primary</span>
                </label>

                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    title="Remove angle"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href="/admin/products"
            className="px-5 py-2.5 bg-white border border-gold-300 text-charcoal-700 text-xs font-semibold uppercase tracking-wider rounded-sm hover:bg-gold-50 transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 text-xs font-semibold uppercase tracking-wider rounded-sm shadow transition-all disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving to Database...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Create & Publish SKU</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
