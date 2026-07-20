import { StatCard, StatCardProps } from "@/components/ui/StatCard";
import StarRatingDisplay, {
  RatingDistributionBar,
} from "@/components/ui/StarRating";

/**
 * Stats data shape shared across order & product review pages.
 * Both pages compute an average rating, a total count, and a
 * star distribution — only the labels and conditional hints differ.
 */
export interface ReviewStatsData {
  averageRating: number;
  totalCount: number;
  ratingDistribution: Record<number, number>;
  /** When true, totalCount is the only metric available (no ratings yet) */
  hasRatings: boolean;
}

interface ReviewStatsCardProps {
  stats: ReviewStatsData;
  averageLabel?: string;
  totalLabel?: string;
}

/**
 * Reusable 3-column stats row for review pages.
 * Uses StatCard for each metric; custom content (stars, distribution)
 * is passed via children.
 */
const ReviewStatsCard = ({
  stats,
  averageLabel = "Average Rating",
  totalLabel = "Total Reviews",
}: ReviewStatsCardProps) => {
  const reviewStats: StatCardProps[] = [
    {
      label: averageLabel,
      value: stats.averageRating,
      children: stats.hasRatings ? (
        <div className="mt-2">
          <StarRatingDisplay rating={Math.round(stats.averageRating)} />
        </div>
      ) : (
        <p className="text-xs text-stone-400 italic mt-2">No Ratings Yet</p>
      ),
    },

    {
      label: totalLabel,
      value: stats.totalCount,
    },
    {
      label: "Rating Distribution",
      children: stats.hasRatings ? (
        <div className="mt-2">
          <RatingDistributionBar
            distribution={stats.ratingDistribution}
            total={stats.totalCount}
          />
        </div>
      ) : (
        <p className="text-xs text-stone-400 italic mt-2">
          No ratings to distribute
        </p>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {reviewStats?.map((review, i) => (
        <StatCard key={i} {...review} />
      ))}
    </div>
  );
};

export default ReviewStatsCard;
