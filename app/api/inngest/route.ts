// app/api/inngest/route.ts
import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { myScheduledJob } from "@/inngest/functions/myScheduledJob";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [myScheduledJob],
});