// components/providers/TooltipProvider.tsx
"use client";

import { Tooltip } from "react-tooltip";

export default function TooltipProvider() {
  return <Tooltip id="app-tooltip" place="top" style={{ zIndex: 9999, }}   className="max-w-xs!"/>;
}
