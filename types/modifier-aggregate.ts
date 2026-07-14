/**
 * Aggregate types for MongoDB aggregation pipeline results that populate
 * modifier group product references via $lookup + $map + $filter.
 *
 * These differ from the canonical ModifierItem / ModifierGroup interfaces
 * because the raw aggregate result has ObjectId-like _id fields and optional
 * nested objects — they need explicit toString() normalization.
 */

export type ModifierProductAggregate = {
  _id?: { toString: () => string };
  name?: string;
  price?: number | null;
  image?: {
    url?: string;
    public_id?: string;
  };
  productType?: string;
};

export type ModifierItemAggregate = {
  product?: ModifierProductAggregate | null;
  label?: string | null;
  price?: number | null;
  snapshotName?: string | null;
  snapshotPrice?: number | null;
};

export type ModifierGroupAggregate = {
  _id?: string;
  templateId?: string;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  items: ModifierItemAggregate[];
};
