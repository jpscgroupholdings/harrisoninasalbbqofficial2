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