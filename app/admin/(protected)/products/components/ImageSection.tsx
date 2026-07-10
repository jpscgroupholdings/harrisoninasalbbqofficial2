"use client";

import React, { ChangeEvent, useEffect, useState } from "react";
import { ProductSectionCard } from "./ProductSectionCard";
import { toast } from "sonner";
import { InputField } from "@/components/ui/FormComponents";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { AppImage } from "@/components/AppImage";
import { apiClient } from "@/lib/apiClient";

// ----------- TYPES -------------------
export type ImageTab = "upload" | "url" | "gallery";

export interface CloudinaryImage {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  created_at: string;
}

export interface CloudinaryImagesResponse {
  resources: CloudinaryImage[];
}

export interface ImageSelectionState {
  activeTab: ImageTab;
  imageFile: File | null;
  imageUrl: string;
  galleryUrl: string | null;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ImageSectionProps {
  /** Image URL from the product being edited (used to set initial tab & selection) */
  initialImageUrl?: string;
  /** Callback fired whenever the image selection state changes so the parent can track it for form submission & preview */
  onImageStateChange: (state: ImageSelectionState) => void;
}

export const IMAGE_TABS: { value: ImageTab; label: string; icon: React.ReactNode }[] =
  [
    {
      value: "upload",
      label: "Upload",
      icon: <DynamicIcon name="Upload" size={14} />,
    },
    { value: "url", label: "URL", icon: <DynamicIcon name="Link" size={14} /> },
    {
      value: "gallery",
      label: "Gallery",
      icon: <DynamicIcon name="Images" size={14} />,
    },
  ];


// ─── Component ────────────────────────────────────────────────────────────────

const ImageSection = ({
  initialImageUrl,
  onImageStateChange,
}: ImageSectionProps) => {
  // ── Image tab state ─────────────────────────────────────────────────────────

  const [activeImageTab, setActiveImageTab] = useState<ImageTab>("upload");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState(""); // URL tab input value
  const [selectedGalleryUrl, setSelectedGalleryUrl] = useState<string | null>(
    null,
  );

  // ── Gallery state ───────────────────────────────────────────────────────────

  const [cloudinaryImages, setCloudinaryImages] = useState<CloudinaryImage[]>(
    [],
  );
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [gallerySearch, setGallerySearch] = useState("");

  // ── Derived ─────────────────────────────────────────────────────────────────

  /** Preview URL for the currently selected image (used by parent for the preview card) */
  const previewUrl = imageFile
    ? URL.createObjectURL(imageFile)
    : selectedGalleryUrl || imageUrl || null;

  /** Gallery images filtered by search */
  const filteredGalleryImages = cloudinaryImages.filter((img) =>
    img.public_id.toLowerCase().includes(gallerySearch.toLowerCase()),
  );

  // ── Report state back to parent whenever it changes ──────────────────────────

  useEffect(() => {
    onImageStateChange({
      activeTab: activeImageTab,
      imageFile,
      imageUrl,
      galleryUrl: selectedGalleryUrl,
    });
  }, [activeImageTab, imageFile, imageUrl, selectedGalleryUrl]);

  // ── Init edit mode ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (initialImageUrl) {
      if (initialImageUrl.includes("cloudinary.com")) {
        setSelectedGalleryUrl(initialImageUrl);
        setActiveImageTab("gallery");
      } else if (initialImageUrl) {
        setImageUrl(initialImageUrl);
        setActiveImageTab("url");
      }
    }
  }, [initialImageUrl]);

  // ── Fetch Cloudinary gallery ─────────────────────────────────────────────────

  const fetchCloudinaryImages = async () => {
    setLoadingGallery(true);
    setGalleryError(null);
    try {
      const data = await apiClient.get<
        CloudinaryImagesResponse | CloudinaryImage[]
      >("/cloudinary/images");
      setCloudinaryImages(Array.isArray(data) ? data : data.resources || []);
    } catch {
      setGalleryError("Could not load gallery. Check your API route.");
    } finally {
      setLoadingGallery(false);
    }
  };

  useEffect(() => {
    if (
      activeImageTab === "gallery" &&
      cloudinaryImages.length === 0 &&
      !galleryError
    ) {
      fetchCloudinaryImages();
    }
  }, [activeImageTab]);

  // ── Tab switch ───────────────────────────────────────────────────────────────

  /** Switching tabs clears selections from the other tabs */
  const handleTabSwitch = (tab: ImageTab) => {
    setActiveImageTab(tab);
    if (tab !== "upload") setImageFile(null);
    if (tab !== "url") setImageUrl("");
    if (tab !== "gallery") setSelectedGalleryUrl(null);
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.warning("Image must be under 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.warning("Only images are allowed!");
        return;
      }
      setImageFile(file);
    }
  };

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
  };

  const handleGallerySelect = (img: CloudinaryImage) => {
    setSelectedGalleryUrl(img.secure_url);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <ProductSectionCard title="Product Image" iconName="ImagePlus">
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-2">
        {IMAGE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleTabSwitch(tab.value)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer
            ${
              activeImageTab === tab.value
                ? "bg-white text-brand-color-500 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Upload */}
      {activeImageTab === "upload" && (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-5">
          <InputField
            subLabel="Upload (Max 5MB)"
            type="file"
            id="imageFile"
            accept="image/*"
            required={!previewUrl}
            onChange={handleImageChange}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-color-500/20 file:text-brand-color-500 hover:file:bg-brand-color-500/30 cursor-pointer"
          />
          {imageFile && (
            <p className="text-sm text-green-600 mt-2">
              ✓ {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)}{" "}
              MB)
            </p>
          )}
        </div>
      )}

      {/* URL */}
      {activeImageTab === "url" && (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-5">
          <InputField
            subLabel="Paste any image URL"
            type="url"
            id="image"
            name="image"
            value={imageUrl}
            onChange={handleUrlChange}
            required={!previewUrl}
            placeholder="https://example.com/image.jpg"
            leftIcon={<DynamicIcon name="Link" size={16} />}
          />
        </div>
      )}

      {/* Gallery */}
      {activeImageTab === "gallery" && (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500">
              {cloudinaryImages.length > 0
                ? `${cloudinaryImages.length} image${cloudinaryImages.length !== 1 ? "s" : ""} in your Cloudinary`
                : "Your uploaded Cloudinary images"}
            </p>
            <button
              type="button"
              onClick={fetchCloudinaryImages}
              disabled={loadingGallery}
              className="flex items-center gap-1 text-xs text-brand-color-500 hover:text-brand-color-600 font-medium disabled:opacity-50 transition"
            >
              <DynamicIcon
                name="RefreshCcw"
                size={12}
                className={loadingGallery ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {cloudinaryImages.length > 0 && (
            <div className="mb-4">
              <InputField
                type="text"
                placeholder="Search by filename..."
                value={gallerySearch}
                onChange={(e) => setGallerySearch(e.target.value)}
                leftIcon={
                  <DynamicIcon
                    name="Search"
                    size={14}
                    className="text-gray-400 shrink-0"
                  />
                }
                rightElement={
                  gallerySearch && (
                    <button
                      type="button"
                      onClick={() => setGallerySearch("")}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <DynamicIcon name="X" size={12} />
                    </button>
                  )
                }
              />
            </div>
          )}

          {loadingGallery ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
              <DynamicIcon
                name="LoaderCircle"
                size={24}
                className="animate-spin"
              />
              <p className="text-sm">Loading gallery...</p>
            </div>
          ) : galleryError ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <p className="text-sm text-red-500">{galleryError}</p>
              <button
                type="button"
                onClick={fetchCloudinaryImages}
                className="text-xs text-brand-color-500 underline"
              >
                Try again
              </button>
            </div>
          ) : filteredGalleryImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-1 text-gray-400">
              <DynamicIcon name="Images" size={28} />
              <p className="text-sm">
                {gallerySearch
                  ? "No images match your search"
                  : "No images found in Cloudinary"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2 max-h-[70vh] overflow-y-auto pr-1">
              {filteredGalleryImages.map((img) => {
                const isSelected = selectedGalleryUrl === img.secure_url;
                return (
                  <button
                    key={img.public_id}
                    type="button"
                    onClick={() => handleGallerySelect(img)}
                    className={`relative h-48 w-full rounded-xl overflow-hidden border-2 transition-all duration-150 cursor-pointer group
                    ${
                      isSelected
                        ? "border-brand-color-500 ring-2 ring-brand-color-500/30"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <div className="w-full h-full object-cover">
                      <AppImage
                        src={img.secure_url}
                        alt={img.public_id}
                        loading="lazy"
                      />
                    </div>
                    {isSelected && (
                      <div className="absolute inset-0 bg-brand-color-500/20 flex items-center justify-center">
                        <DynamicIcon
                          name="CheckCircle2"
                          size={22}
                          className="text-brand-color-500 drop-shadow"
                        />
                      </div>
                    )}
                    {!isSelected && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-end p-1">
                        <p className="text-white text-[9px] leading-tight truncate w-full">
                          {img.public_id.split("/").pop()}
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {selectedGalleryUrl && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-brand-color-500/10 border border-brand-color-500/30 rounded-xl">
              <DynamicIcon
                name="CheckCircle2"
                size={14}
                className="text-brand-color-500 shrink-0"
              />
              <p className="text-xs text-brand-color-500 font-medium truncate flex-1">
                Image selected from gallery
              </p>
              <button
                type="button"
                onClick={() => setSelectedGalleryUrl(null)}
                className="text-brand-color-500 hover:text-brand-color-600 shrink-0"
              >
                <DynamicIcon name="X" size={13} />
              </button>
            </div>
          )}
        </div>
      )}
    </ProductSectionCard>
  );
};

export default ImageSection;
