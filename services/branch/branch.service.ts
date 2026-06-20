// ---------------------------------------------------------------------------
// Branch helpers
// ---------------------------------------------------------------------------

import { Branch } from "@/models/Branch";
import { ClientSession } from "mongoose";

export async function fetchBranch(branchId: string, session: ClientSession) {
  const branch = await Branch.findById(branchId).session(session);
  if (!branch) throw new Error("Branch not found!");
  return branch;
}

export const isBranchCoordinates = (
  coordinates: unknown,
): coordinates is [number, number] =>
  Array.isArray(coordinates) &&
  coordinates.length === 2 &&
  coordinates.every(
    (coord) => typeof coord === "number" && Number.isFinite(coord),
  );