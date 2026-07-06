export type ratingFilterType = "all" | "1" | "2" | "3" | "4" | "5";
export type visibilityFilterType = "all" | "true" | "false";

export const RATING_FILTER_OPTIONS: { key: ratingFilterType; label: string }[] = [
  { key: "all", label: "All Ratings" },
  { key: "5", label: "5 Stars" },
  { key: "4", label: "4 Stars" },
  { key: "3", label: "3 Stars" },
  { key: "2", label: "2 Stars" },
  { key: "1", label: "1 Star" },
];

export const VISIBILITY_FILTER_OPTIONS: {
  key: visibilityFilterType;
  label: string;
}[] = [
  { key: "all", label: "All Visibility" },
  { key: "true", label: "Visible" },
  { key: "false", label: "Hidden" },
];

/** Color mapping for rating-based accent */
export const RATING_COLORS: Record<
  number,
  { bg: string; text: string; border: string }
> = {
  5: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  4: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  3: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  2: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  1: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};