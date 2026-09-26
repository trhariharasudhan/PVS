"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  getAdminProduct,
  updateAdminProduct,
  getAdminCategories,
  addAdminProductImage,
  updateAdminProductImage,
  deleteAdminProductImage,
} from "@/lib/api";
import { AdminProductDetail, AdminCategory } from "@/types";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Sparkles,
  Image as ImageIcon,
  Star,
  ExternalLink,
} from "lucide-react";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [product, setProduct] = useState<AdminProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [fabric, setFabric] = useState("");
  const [color, setColor] = useState("");
  const [border, setBorder] = useState("");
  const [pallu, setPallu] = useState("");
  const [motif, setMotif] = useState("");
  const [weaveType, setWeaveType] = useState("");
  const [description, setDescription] = useState("");
  const [detailedStory, setDetailedStory] = useState("");
  const [price, setPrice] = useState<string>("");
  const [currency, setCurrency] = useState("INR");
  const [isPriceOnEnquiry, setIsPriceOnEnquiry] = useState(true);
  const [priceNote, setPriceNote] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState("IN_STOCK");
  const [sareeLengthMeters, setSareeLengthMeters] = useState("5.50");
  const [blousePiece, setBlousePiece] = useState("");
  const [weightGrams, setWeightGrams] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // New Image addition state
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageTag, setNewImageTag] = useState("Full Saree");
  const [isAddingImage, setIsAddingImage] = useState(false);

  const fetchProductData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prod, cats] = await Promise.all([
        getAdminProduct(productId),
        getAdminCategories(),
      ]);

      setCategories(cats);
      setProduct(prod);

      // Populate form
      setCode(prod.code);
      setName(prod.name);
      setCategoryId(prod.category_id);
      setFabric(prod.fabric);
      setColor(prod.color);
      setBorder(prod.border);
      setPallu(prod.pallu || "");
      setMotif(prod.motif || "");
      setWeaveType(prod.weave_type);
      setDescription(prod.description);
      setDetailedStory(prod.detailed_story || "");
      setPrice(prod.price ? String(prod.price) : "");
      setCurrency(prod.currency);
      setIsPriceOnEnquiry(prod.is_price_on_enquiry);
      setPriceNote(prod.price_note || "");
      setAvailabilityStatus(prod.availability_status);
      setSareeLengthMeters(String(prod.saree_length_meters));
      setBlousePiece(prod.blouse_piece_description || "");
      setWeightGrams(prod.weight_approx_grams ? String(prod.weight_approx_grams) : "");
      setIsFeatured(prod.is_featured);
      setIsNewArrival(prod.is_new_arrival);
      setIsActive(prod.is_active);
    } catch (err: any) {
      console.error("Failed to load product:", err);
      setError(err?.message || "Product not found.");
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await updateAdminProduct(productId, {
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
        is_featured: isFeatured,
        is_new_arrival: isNewArrival,
        is_active: isActive,
      });

      setSuccessMessage("Product specifications updated successfully!");
      fetchProductData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error("Update product failure:", err);
      setError(err?.message || "Failed to update product.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddImage = async () => {
    if (!newImageUrl.trim()) return;
    setIsAddingImage(true);
    try {
      await addAdminProductImage(productId, {
        image_url: newImageUrl.trim(),
        alt_text: name,
        tag: newImageTag,
        display_order: (product?.images?.length || 0) + 1,
        is_primary: (product?.images?.length || 0) === 0,
      });
      setNewImageUrl("");
      fetchProductData();
    } catch (err: any) {
      console.error("Failed to add image:", err);
      setError(err?.message || "Failed to add image.");
    } finally {
      setIsAddingImage(false);
    }
  };

  const handleSetPrimaryImage = async (imageId: string) => {
    try {
      await updateAdminProductImage(productId, imageId, { is_primary: true });
      fetchProductData();
    } catch (err: any) {
      console.error("Failed to set primary image:", err);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Remove this photography angle?")) return;
    try {
      await deleteAdminProductImage(productId, imageId);
      fetchProductData();
    } catch (err: any) {
      console.error("Failed to delete image:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-burgundy-900 animate-spin" />
        <span className="text-xs font-mono text-charcoal-500">Loading product record...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 text-center bg-white border border-gold-200 rounded-sm">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
        <p className="text-sm font-semibold text-charcoal-800">Product not found.</p>
        <Link
          href="/admin/products"
          className="mt-4 inline-block text-xs font-semibold text-burgundy-900 hover:underline"
        >
          Return to Products Catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-charcoal-600 hover:text-burgundy-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products Catalogue</span>
        </Link>

        <Link
          href={`/collections/${product.code}`}
          target="_blank"
          className="inline-flex items-center gap-1 text-xs text-gold-700 hover:text-burgundy-950 transition-colors font-medium"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Preview Public Page</span>
        </Link>
      </div>

      <div>
        <div className="flex items-baseline gap-3">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950">
            Edit SKU: {product.code}
          </h1>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
              product.is_active
                ? "bg-emerald-100 text-emerald-900"
                : "bg-charcoal-200 text-charcoal-700"
            }`}
          >
            {product.is_active ? "Live in Storefront" : "Archived"}
          </span>
        </div>
        <p className="text-xs text-charcoal-500 mt-1">
          Last updated: {new Date(product.updated_at).toLocaleString()}
        </p>
      </div>

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-sm text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-sm text-xs text-red-900 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Specs Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
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
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Saree Model Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
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

        {/* Textile Specs */}
        <div className="p-6 bg-white border border-gold-300/80 rounded-sm shadow-sm space-y-4">
          <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-burgundy-950 border-b border-gold-200 pb-2">
            2. Weaving & Fabric Specifications
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Fabric</label>
              <input
                type="text"
                required
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Color</label>
              <input
                type="text"
                required
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Weave Type</label>
              <input
                type="text"
                value={weaveType}
                onChange={(e) => setWeaveType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Border</label>
              <input
                type="text"
                required
                value={border}
                onChange={(e) => setBorder(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Pallu</label>
              <input
                type="text"
                value={pallu}
                onChange={(e) => setPallu(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Motif</label>
              <input
                type="text"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Length (Metres)
              </label>
              <input
                type="number"
                step="0.1"
                value={sareeLengthMeters}
                onChange={(e) => setSareeLengthMeters(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Blouse Piece
              </label>
              <input
                type="text"
                value={blousePiece}
                onChange={(e) => setBlousePiece(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm"
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
                className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm"
              />
            </div>
          </div>
        </div>

        {/* Narrative & Description */}
        <div className="p-6 bg-white border border-gold-300/80 rounded-sm shadow-sm space-y-4">
          <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-burgundy-950 border-b border-gold-200 pb-2">
            3. Story & Narrative
          </h2>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Short Description <span className="text-red-600">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Detailed Weaving Story
            </label>
            <textarea
              rows={4}
              value={detailedStory}
              onChange={(e) => setDetailedStory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm"
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
                className="w-full px-3 py-2 text-xs font-mono bg-ivory-50/60 border border-gold-200 rounded-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Price Note
              </label>
              <input
                type="text"
                value={priceNote}
                onChange={(e) => setPriceNote(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm"
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
                <span>Display &quot;Price on Enquiry&quot;</span>
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
              <span>Mark as New Arrival</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-charcoal-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-burgundy-900 focus:ring-gold-500 w-4 h-4"
              />
              <span>Active in Storefront Catalogue</span>
            </label>
          </div>
        </div>

        {/* Submit Save */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 text-xs font-semibold uppercase tracking-wider rounded-sm shadow transition-all disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Saree Specifications</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Photography & Image Management Section */}
      <div className="p-6 bg-white border border-gold-300/80 rounded-sm shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gold-200 pb-3">
          <div>
            <h2 className="font-serif text-base font-bold text-burgundy-950">
              Photography Gallery ({product.images?.length || 0} Angles)
            </h2>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Manage multi-angle high resolution saree imagery, set the primary thumbnail, and adjust tags.
            </p>
          </div>
        </div>

        {/* Existing Images Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {product.images?.map((img) => (
            <div
              key={img.id}
              className={`p-3 bg-ivory-50 border rounded-sm space-y-2 relative ${
                img.is_primary ? "border-gold-500 ring-1 ring-gold-400" : "border-gold-200"
              }`}
            >
              <div className="w-full h-44 bg-gold-100 relative rounded overflow-hidden">
                <Image
                  src={img.image_url}
                  alt={img.alt_text || product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 300px"
                />
                {img.is_primary && (
                  <span className="absolute top-2 left-2 bg-gold-500 text-burgundy-950 text-[10px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    <span>Primary Photo</span>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-semibold text-charcoal-800">{img.tag || "Full Saree"}</span>
                <span className="text-[10px] font-mono text-charcoal-400">Order: {img.display_order}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gold-200 text-xs">
                {!img.is_primary ? (
                  <button
                    type="button"
                    onClick={() => handleSetPrimaryImage(img.id)}
                    className="text-xs font-semibold text-burgundy-900 hover:text-gold-700"
                  >
                    Make Primary
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-700 font-medium">Default Display</span>
                )}

                <button
                  type="button"
                  onClick={() => handleDeleteImage(img.id)}
                  className="text-xs text-red-600 hover:text-red-800 inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Image Form */}
        <div className="p-4 bg-gold-50/60 border border-gold-300/80 rounded-sm space-y-3">
          <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-burgundy-950">
            Add New Photography Angle URL
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gold-300 rounded-sm focus:outline-none"
              />
            </div>
            <div>
              <select
                value={newImageTag}
                onChange={(e) => setNewImageTag(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gold-300 rounded-sm focus:outline-none"
              >
                <option value="Full Saree">Full Saree</option>
                <option value="Border Detail">Border Detail</option>
                <option value="Pallu">Pallu</option>
                <option value="Fabric Texture">Fabric Texture</option>
                <option value="Drape">Drape</option>
              </select>
            </div>
            <div>
              <button
                type="button"
                disabled={isAddingImage || !newImageUrl.trim()}
                onClick={handleAddImage}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors disabled:opacity-60"
              >
                {isAddingImage ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Add Image</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
