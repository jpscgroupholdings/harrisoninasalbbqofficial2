import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "harrison-house-of-inasal-bbq" });

export type Events = {
    "order/created": {
        data: {
            orderId: string;
            referenceNumber: string;
            paymentMethod: string;
        }
    }
}