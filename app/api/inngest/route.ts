// app/api/inngest/route.ts
import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { myScheduledJob } from "@/inngest/functions/myScheduledJob";
import { expireOrder } from "@/inngest/functions/expireOrder";
import { staleOrderAlert } from "@/inngest/functions/staleOrderAlert";
import { upcomingReservationAlert } from "@/inngest/functions/upcomingReservationAlert";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [expireOrder, staleOrderAlert, upcomingReservationAlert],
});