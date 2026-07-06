import MetricCard, { MetricCardProps } from "@/components/ui/MetricCard";
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
 * Composes StatCard for the shared card shell + label;
 * each card's unique content (stars, count, distribution) is
 * passed as children so different patterns stay separate.
 */
const ReviewStatsCard = ({
  stats,
  averageLabel = "Average Rating",
  totalLabel = "Total Reviews",
}: ReviewStatsCardProps) => {
  
  const statsData: MetricCardProps[] = [
    {
      title: averageLabel,
      value: stats.averageRating.toFixed(1),
      icon: "Star",
      iconColor: "bg-amber-500",
      subtitle: stats.hasRatings ? (
        <StarRatingDisplay rating={Math.round(stats.averageRating)} />
      ) : (
        <p className="text-xs text-stone-400 italic">No Ratings Yet</p>
      ),
    },
    {
      title: totalLabel,
      value: stats.totalCount.toFixed(1),
      icon: "UserStar",
      iconColor: "bg-emerald-500",
    },
    {
      title: "Rating Distribution",
      subtitle: stats.hasRatings ? (
        <RatingDistributionBar
          distribution={stats.ratingDistribution}
          total={stats.totalCount}
        />
      ) : (
        <p className="text-xs text-stone-400 italic">
          No ratings to distribute
        </p>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statsData.map((stats, index) => (
        <MetricCard
          key={index}
          title={stats.title}
          value={stats.value}
          icon={stats.icon}
          iconColor={stats.iconColor}
          subtitle={stats.subtitle}
          badge={stats.badge}
          badgeTone={stats.badgeTone}
        />
      ))}
    </div>
  );
};

export default ReviewStatsCard;
