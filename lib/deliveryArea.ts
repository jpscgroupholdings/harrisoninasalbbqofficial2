type DeliveryAreaCoordinates = {
  lat: number;
  lng: number;
};

export const METRO_MANILA_CENTER: [number, number] = [14.5995, 120.9842];
export const METRO_MANILA_DELIVERY_RADIUS_METERS = 25_000;
export const OUTSIDE_DELIVERY_AREA_MESSAGE =
  "Delivery is only available within the Metro Manila service area.";

const EARTH_RADIUS_METERS = 6_371_000;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export const getDistanceMeters = (
  from: DeliveryAreaCoordinates,
  to: DeliveryAreaCoordinates,
) => {
  const latDistance = toRadians(to.lat - from.lat);
  const lngDistance = toRadians(to.lng - from.lng);
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);

  const haversine =
    Math.sin(latDistance / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDistance / 2) ** 2;

  return (
    EARTH_RADIUS_METERS *
    2 *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
};

export const isWithinMetroManilaDeliveryArea = (
  coordinates: DeliveryAreaCoordinates,
) => {
  const distanceMeters = getDistanceMeters(
    {
      lat: METRO_MANILA_CENTER[0],
      lng: METRO_MANILA_CENTER[1],
    },
    coordinates,
  );

  return distanceMeters <= METRO_MANILA_DELIVERY_RADIUS_METERS;
};
