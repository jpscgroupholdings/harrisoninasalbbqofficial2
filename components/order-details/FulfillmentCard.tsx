import { OrderType } from "@/types/OrderTypes";
import { DynamicIcon } from "../ui/DynamicIcon";

// ─── Style Maps ───────────────────────────────────────────────────────────────

const fulfillmentTheme = {
  pickup: {
    card: "border-blue-200 bg-blue-50/40",
    iconWrapper: "bg-blue-100",
    icon: "text-blue-600",
    iconName: "Store",
    label: "text-blue-500",
    badge: "bg-blue-500 text-white",
  },
  delivery: {
    card: "border-orange-200 bg-orange-50/40",
    iconWrapper: "bg-orange-100",
    icon: "text-orange-600",
    iconName: "Truck",
    label: "text-orange-500",
    badge: "bg-orange-500 text-white",
  },
} as const;

/** Fulfillment (pickup/delivery) card with themed styles */
export const FulfillmentCard = ({
  isPickup,
  isAdmin,
  order,
}: {
  isPickup: boolean;
  isAdmin: boolean;
  order: OrderType;
}) => {
  const theme = fulfillmentTheme[isPickup ? "pickup" : "delivery"];
  const label = isPickup ? "Pickup" : "Delivery";

  const { branchSnapshot, paymentInfo } = order;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-4 shadow-sm ${theme.card}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center ${theme.iconWrapper}`}
        >
          <DynamicIcon name={theme.iconName} size={14} className={theme.icon} />
        </div>
        <p
          className={`text-xs font-semibold uppercase tracking-wide ${theme.label}`}
        >
          {label}
        </p>
        <span
          className={`ml-auto inline-flex items-center rounded-lg px-3 py-1 text-xs font-bold shadow-sm ${theme.badge}`}
        >
          {branchSnapshot?.name}
        </span>
      </div>

      {/* Pickup: show branch address with directions link for all roles */}
      {isPickup && (branchSnapshot?.address || branchSnapshot?.location) && (
        <div className="flex flex-col gap-1 text-sm text-gray-600 mb-1">
          <span className="font-medium text-gray-700">
            {branchSnapshot?.address}
          </span>
          {branchSnapshot?.location?.coordinates && !isAdmin && (
            <a
              href={`https://www.google.com/maps?q=${branchSnapshot.location.coordinates[1]},${branchSnapshot.location.coordinates[0]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1 transition-colors w-fit"
            >
              <DynamicIcon name="MapPin" size={12} />
              Get directions
              <DynamicIcon name="ExternalLink" size={10} />
            </a>
          )}
        </div>
      )}

      {/* Delivery: full address + map link for admin; brief confirmation for customer */}
      {!isPickup && paymentInfo?.shippingAddress && (
        <div className="flex flex-col gap-1 text-sm text-gray-600 mb-1">
          {isAdmin ? (
            <>
              <span className="font-medium text-gray-700">
                {paymentInfo?.shippingAddress.line1}
                {paymentInfo?.shippingAddress.line2 && (
                  <span className="text-gray-400">
                    , {paymentInfo?.shippingAddress.line2}
                  </span>
                )}
              </span>
              <span>
                {paymentInfo?.shippingAddress.city},{" "}
                {paymentInfo?.shippingAddress.province}{" "}
                {paymentInfo?.shippingAddress.postalCode}
              </span>
              {paymentInfo?.shippingAddress.country && (
                <span className="text-xs text-gray-300">
                  {paymentInfo?.shippingAddress.country}
                </span>
              )}
              {paymentInfo?.shippingAddress.landmark && (
                <span className="text-xs text-gray-400 mt-0.5">
                  Landmark: {paymentInfo?.shippingAddress.landmark}
                </span>
              )}
              {paymentInfo?.shippingAddress.coordinates?.lat &&
                paymentInfo?.shippingAddress.coordinates?.lng && (
                  <a
                    href={`https://www.google.com/maps?q=${paymentInfo?.shippingAddress.coordinates.lat},${paymentInfo?.shippingAddress.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1 transition-colors w-fit"
                  >
                    <DynamicIcon name="MapPin" size={12} />
                    View on Google Maps
                    <DynamicIcon name="ExternalLink" size={10} />
                  </a>
                )}
            </>
          ) : (
            <span className="font-medium text-gray-700">
              {paymentInfo?.shippingAddress.line1}
              {paymentInfo?.shippingAddress.line2 && (
                <span className="text-gray-400">
                  , {paymentInfo?.shippingAddress.line2}
                </span>
              )}
              , {paymentInfo?.shippingAddress.city},{" "}
              {paymentInfo?.shippingAddress.province}{" "}
              {paymentInfo?.shippingAddress.postalCode}
            </span>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-2">Est. {order.estimatedTime}</p>
    </div>
  );
};
