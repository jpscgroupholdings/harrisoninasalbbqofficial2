import { useState } from "react";
import { ratingFilterType, visibilityFilterType } from "../review.constant";

// state helper
export const useReviewFilters = () => {
  const [ratingFilter, setRatingFilter] = useState<ratingFilterType>("all");
  const [visibilityFilter, setVisibilityFilter] =
    useState<visibilityFilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [appliedSearch, setAppliedSearch] = useState("");

  const jumpToPage = (page: number) => setCurrentPage(page);

  const handleSearch = () => {
    setAppliedSearch(searchQuery);
    jumpToPage(1);
  };

  return {
    ratingFilter,
    setRatingFilter,
    visibilityFilter,
    setVisibilityFilter,
    searchQuery,
    setSearchQuery,
    currentPage,
    jumpToPage,
    appliedSearch,
    setAppliedSearch,
    handleSearch,
  };
};
