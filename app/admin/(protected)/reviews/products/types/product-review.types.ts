
/** Single review entry scoped to one product within an order review */
export interface ProductGroupEntry {
  orderReviewId: string;
  orderId: string;
  customerName: string | null;
  isAnonymous: boolean;
  customerEmail: string | null;
  branchName: string | null;
  itemRating: number | null;
  itemComment: string | null;
  orderRating: number;
  orderComment: string | null;
  isVisible: boolean;
  createdAt: string;
}

/** Aggregated product group with all review entries for one product */
export interface ProductGroup {
  groupKey: string;
  productId: string | null;
  name: string;
  image: string | null;
  entries: ProductGroupEntry[];
  averageItemRating: number;
  totalRatings: number;
}