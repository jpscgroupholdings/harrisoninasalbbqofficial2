// functions/nearestBranch.ts — no more BRANCHES import
import { Branch } from "@/types/branch";
import { haversine } from "./haversine";

export function nearestBranch(
  latlng: [number, number],
  branches: Branch[]
): { branch: Branch; km: number } {
  // ✅ Map GeoJSON [lng, lat] → [lat, lng] that haversine expects
  const mapped = branches.map((b) => ({
    branch: b,
    position: [b.location.coordinates[1], b.location.coordinates[0]] as [number, number],
  }));

  let nearest = mapped[0];
  let minDist = haversine(latlng, mapped[0].position);

  for (const item of mapped.slice(1)) {
    const d = haversine(latlng, item.position);
    if (d < minDist) {
      minDist = d;
      nearest = item;
    }
  }

  return { branch: nearest.branch, km: minDist / 1000 };
}