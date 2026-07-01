/**
 * Static fallback data for legal policies.
 *
 * Used when no database records exist yet (e.g., fresh deployment)
 * or when the API request fails. Each policy is stored as Markdown
 * so the same rendering pipeline works for both dynamic and fallback data.
 */

export interface PolicySection {
  heading: string;
  content: string;
}

export interface PolicyData {
  slug: string;
  title: string;
  subtitle: string;
  sections: PolicySection[];
}

export const policyFallbackData: PolicyData[] = [
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    subtitle:
      "Harrison – House of Inasal & BBQ (\"we\", \"us\", or \"our\") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and protect your information when you use our website and mobile application (collectively, the \"Platform\").",
    sections: [
      {
        heading: "1. Information We Collect",
        content: `
### a. Information You Provide

- **Account details** — first name, last name, email address (limited to Gmail accounts), phone number, and password when you register.
- **Shipping address** — street, city, province, barangay, zip code, landmark, and GPS coordinates for delivery orders.
- **Order information** — selected items, quantities, branch, fulfillment type (delivery or pickup), and any order notes you add.
- **Payment details** — we do *not* store full credit/debit card numbers. Only the last four digits, card scheme (e.g., Visa, Mastercard), and a payment description (e.g., "Visa ending 0008") are retained on our records. Full card data is handled exclusively by our payment provider, Maya (PayMaya).
- **Reviews and feedback** — ratings, comments, and item-level reviews you submit after completing an order.
- **Voucher and promo card data** — voucher codes you apply and promo card purchases you make.

### b. Information Collected Automatically

- **Session data** — your IP address and browser/device user agent string are recorded when you log in or interact with the Platform.
- **Activity logs** — we maintain an internal audit trail recording key actions (order creation, status changes, cancellations, payment events) linked to your account and IP address.
- **Device storage** — before you log in, your cart items are temporarily stored in your browser's local storage. Upon login, they are merged into your database-stored cart.
- **Cookies** — we use authentication cookies (HTTP-only, secure) to keep you logged in. No third-party analytics or tracking cookies are used.

### c. Information from Third-Party Services

- **Google Sign-In** — if you log in via Google, we receive your Google profile name and email as provided by Google's OAuth service.
- **Maya (PayMaya)** — our payment gateway. We send your name, email, phone, shipping address, and order details to Maya to process your payment. Maya may collect additional data per its own privacy policy.
        `.trim(),
      },
      {
        heading: "2. How We Use Your Information",
        content: `
- To create and manage your account and authenticate you.
- To process and fulfill your orders (delivery, pickup, and payment).
- To calculate applicable taxes (VAT), discounts, delivery fees, and order totals.
- To send order confirmation, status update, and notification emails.
- To coordinate delivery with assigned riders (name, phone shared with the rider for your order).
- To verify your email address and handle password reset requests.
- To manage vouchers, promo cards, and promotional discounts.
- To maintain an internal audit trail for security and debugging.
- To display and moderate your reviews on our Platform.
        `.trim(),
      },
      {
        heading: "3. Data Storage and Retention",
        content: `
Your data is stored in secure MongoDB databases hosted on protected servers. We retain your data as follows:

- **Account data** — retained while your account is active. You may request deletion at any time (see Section 6).
- **Order history** — retained indefinitely for record-keeping, dispute resolution, and legal compliance.
- **Cart data** — automatically deleted after 7 days of inactivity.
- **Session data** — expires when you log out or when the session token expires.
- **Activity logs** — retained for internal auditing and security purposes.
        `.trim(),
      },
      {
        heading: "4. Data Sharing",
        content: `
We do *not* sell, rent, or trade your personal data. We share information only in the following circumstances:

- **Maya (PayMaya)** — your name, email, phone, shipping address, and order details are shared to process online payments.
- **Resend** — your email address is shared with our email service provider to send transactional emails (verification, order updates, password reset).
- **Delivery riders** — your name, phone, and delivery address are shared with the assigned rider to fulfill your delivery order.
- **Legal requirements** — we may disclose data if required by Philippine law, regulation, or legal process.
        `.trim(),
      },
      {
        heading: "5. Data Security",
        content: `
We implement industry-standard measures to protect your data:

- Passwords are hashed using bcrypt and are never stored in plain text.
- Authentication cookies are HTTP-only and flagged as secure in production.
- Staff/admin tokens use JWT with 8-hour expiry and are stored in HTTP-only cookies.
- Payment webhook endpoints are restricted to Maya's whitelisted IPs.
- We validate all incoming request data and enforce authentication on protected endpoints.
- *No system is completely secure.* While we take reasonable precautions, we cannot guarantee absolute security against all threats.
        `.trim(),
      },
      {
        heading: "6. Your Rights",
        content: `
Under the Philippine Data Privacy Act of 2012 (RA 10173), you have the right to:

- Access the personal data we hold about you.
- Request correction of inaccurate or incomplete data.
- Request deletion of your personal data, subject to legal retention requirements (e.g., order records for tax/compliance).
- Withdraw consent for data processing where consent is the basis.
- Lodge a complaint with the National Privacy Commission.

To exercise any of these rights, contact us at the email provided below.
        `.trim(),
      },
      {
        heading: "7. Children's Privacy",
        content: `
Our Platform is not intended for children under 13. We do not knowingly collect personal data from children under 13. If we discover that we have inadvertently collected such data, we will promptly delete it.
        `.trim(),
      },
      {
        heading: "8. Changes to This Policy",
        content: `
We may update this Privacy Policy from time to time. The "Last updated" date at the top of this page reflects the most recent revision. We encourage you to review this page periodically for any changes. Continued use of the Platform after updates constitutes acceptance of the revised policy.
        `.trim(),
      },
      {
        heading: "9. Contact Us",
        content: `
If you have questions or concerns about this Privacy Policy or your personal data, please contact us using the information provided at the bottom of this page.
        `.trim(),
      },
    ],
  },
  {
    slug: "terms-of-use",
    title: "Terms of Use",
    subtitle:
      "These Terms of Use (\"Terms\") govern your access to and use of the Harrison – House of Inasal & BBQ website and mobile application (\"Platform\"). By using the Platform, you agree to be bound by these Terms. If you do not agree with any part of these Terms, please discontinue use of the Platform immediately.",
    sections: [
      {
        heading: "1. Account Registration",
        content: `
- You must register with a valid Gmail email address and provide accurate personal information (name, phone number).
- You must verify your email address before placing orders.
- Your password must be at least 8 characters and include an uppercase letter, a number, and a symbol.
- You are responsible for keeping your password confidential. Notify us immediately if you suspect unauthorized access to your account.
- You may also register using Google Sign-In, which links your Google account to our Platform.
- One account per person. Creating multiple accounts to exploit promotions or circumvent restrictions is prohibited.
        `.trim(),
      },
      {
        heading: "2. Ordering",
        content: `
- All orders are subject to the selected branch's availability, operating hours, and order capacity. If a branch is marked as busy or closed, orders may not be accepted.
- Orders have a **30-minute payment window**. If payment is not completed within this period, the order will expire automatically.
- Prices displayed include applicable VAT. Final totals are calculated server-side — do not rely solely on client-side calculations.
- We reserve the right to cancel orders if inventory is insufficient, the store is closed, or for any valid operational reason.
- **Double orders:** clicking "Place Order" more than once may result in duplicate orders. Please wait for confirmation before retrying.
        `.trim(),
      },
      {
        heading: "3. Payment",
        content: `
- We accept **Maya (PayMaya)** online payments (credit/debit cards and Maya Wallet) and **Cash on Delivery (COD)**.
- Online payments are processed entirely by Maya. We do not handle your full card details — only limited information (last four digits, card scheme) is stored on our end.
- Payment status is confirmed via Maya's webhook callback — *frontend confirmation alone does not constitute proof of payment.*
- **Do not** attempt to mark an order as paid from the client side. Payment confirmation is authoritative only when received from our backend.
- If you close the browser or app during payment, check your email or order history to verify the payment outcome before re-ordering.
- Payment buttons are designed to prevent duplicate submission. Do not bypass this mechanism.
        `.trim(),
      },
      {
        heading: "4. Order Status and Fulfillment",
        content: `
Orders follow this status flow:

- *Maya orders:* pending_payment → pending → preparing → dispatched/ready_for_pickup → completed
- *COD orders:* pending → preparing → dispatched/ready_for_pickup → completed
- Orders may also be cancelled, failed, or expired at various stages.

Additional rules:

- You may cancel an order only while it is in **pending** status. Once preparation has begun, cancellation is no longer available.
- Estimated delivery/pickup times are approximate and may vary based on branch capacity and order volume.
        `.trim(),
      },
      {
        heading: "5. Delivery and Pickup",
        content: `
- Delivery is available only within the service area of the selected branch. Delivery fees are calculated based on distance.
- You must provide a valid and complete delivery address. Incomplete or incorrect addresses may result in failed delivery.
- For delivery orders, your name and phone number will be shared with the assigned rider for coordination purposes.
- For pickup orders, please arrive at the branch during the estimated ready time and present your order reference number.
        `.trim(),
      },
      {
        heading: "6. Reviews and Feedback",
        content: `
- You may submit one review per completed order. Reviews are subject to moderation and may be hidden if they violate community standards.
- Reviews must be honest and not contain offensive, misleading, or defamatory content.
- We reserve the right to remove reviews that violate these standards without prior notice.
        `.trim(),
      },
      {
        heading: "7. Vouchers and Promotions",
        content: `
- Vouchers and promotions are subject to their specific terms (minimum purchase, validity period, one-time use, etc.).
- Vouchers cannot be combined unless explicitly allowed by the promotion rules.
- Promo cards are separate purchases with their own validity and usage rules as described at the time of purchase. Promo card purchases are non-refundable once payment is confirmed.
        `.trim(),
      },
      {
        heading: "8. Intellectual Property",
        content: `
All content on the Platform — including logos, branding, images, menu descriptions, and design — is the property of Harrison – House of Inasal & BBQ or its licensors. You may not reproduce, distribute, or modify any such content without our prior written permission.
        `.trim(),
      },
      {
        heading: "9. Prohibited Conduct",
        content: `
- Using the Platform for any unlawful purpose.
- Attempting to bypass payment, authentication, or security mechanisms.
- Submitting fraudulent orders or false payment claims.
- Creating multiple accounts to exploit promotions or circumvent restrictions.
- Uploading malicious code or exploiting vulnerabilities in the Platform.
- Impersonating another person or misrepresenting your identity.
        `.trim(),
      },
      {
        heading: "10. Limitation of Liability",
        content: `
To the fullest extent permitted by Philippine law, Harrison – House of Inasal & BBQ shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform, including but not limited to:

- Order delays or fulfillment failures beyond our control.
- Payment processing errors by third-party providers (Maya).
- Delivery issues caused by incorrect address information you provided.
- Temporary unavailability of the Platform due to maintenance or technical issues.
        `.trim(),
      },
      {
        heading: "11. Termination",
        content: `
We may suspend or terminate your access to the Platform at any time if you violate these Terms. You may also deactivate your account by contacting us. Upon termination, your right to use the Platform ceases, though certain data (such as completed order records) may be retained as required by law.
        `.trim(),
      },
      {
        heading: "12. Governing Law",
        content: `
These Terms are governed by the laws of the Republic of the Philippines. Any disputes arising from or related to these Terms shall be resolved in the appropriate courts of Makati, Metro Manila.
        `.trim(),
      },
      {
        heading: "13. Changes to These Terms",
        content: `
We may revise these Terms from time to time. The "Last updated" date at the top of this page indicates the latest revision. Continued use of the Platform after changes constitutes acceptance of the revised Terms. We encourage you to review this page periodically.
        `.trim(),
      },
      {
        heading: "14. Contact Us",
        content: `
For questions about these Terms, please contact us using the information provided at the bottom of this page.
        `.trim(),
      },
    ],
  },
  {
    slug: "refund-policy",
    title: "Refund Policy",
    subtitle:
      "This Refund Policy applies to all orders placed through the Harrison – House of Inasal & BBQ Platform. We are committed to ensuring fair and transparent handling of refund requests while maintaining operational integrity.",
    sections: [
      {
        heading: "1. When You Are Eligible for a Refund",
        content: `
- **Failed payment** — if Maya reports *PAYMENT_FAILED*, your payment was not captured and no refund is needed; any temporary hold on your card is automatically released by Maya.
- **Expired payment** — if the 30-minute payment window passes and the order expires (*PAYMENT_EXPIRED*), any pre-authorization hold on your card is released by Maya automatically.
- **Order cancelled by us** — if we cancel your order due to stock unavailability, branch closure, or operational issues, a full refund will be issued for Maya-paid orders.
- **Duplicate payment** — if you accidentally paid twice for the same order, the duplicate charge will be refunded upon verification.
- **Wrong amount charged** — if the charged amount differs from the order total shown at checkout, the difference will be refunded.
        `.trim(),
      },
      {
        heading: "2. When Refunds Are *Not* Available",
        content: `
- **Order completed** — once an order is marked as *completed*, refunds are no longer available except for quality complaints (see Section 4).
- **Customer-initiated cancellation after preparation begins** — if the order status has moved past *pending* to *preparing*, cancellation and refund are no longer available.
- **COD orders** — Cash on Delivery orders that were successfully delivered are not eligible for refund via the Platform. Any concerns should be raised with the branch directly.
- **Vouchers and promo cards** — once a voucher is applied to a completed order, its value is consumed and cannot be refunded. Promo card purchases are non-refundable once payment is confirmed.
        `.trim(),
      },
      {
        heading: "3. How to Request a Refund",
        content: `
- Email us at the address provided below with your order reference number and reason for the refund request.
- Include any supporting details (e.g., payment confirmation, photos of incorrect items).
- Our team will review the request within **3 business days** and respond via email.
- Approved refunds for Maya-paid orders are processed through Maya and typically appear on your card/wallet within **5–10 business days**, depending on your bank or payment provider.
        `.trim(),
      },
      {
        heading: "4. Quality Complaints",
        content: `
If you receive an order with quality issues (incorrect items, missing items, or significantly unsatisfactory food quality), contact us within **24 hours** of delivery/pickup with:

- Your order reference number.
- A description of the issue.
- Photos if applicable.

We will assess the complaint and may offer a replacement, voucher credit, or refund depending on the circumstances.
        `.trim(),
      },
      {
        heading: "5. Refund Methods",
        content: `
- **Maya payments** — refunded to the original payment method (card or Maya wallet).
- **Voucher credit** — in some cases, we may issue a voucher as an alternative to a direct refund.
- **COD orders** — since no payment was made online, refunds are handled at the branch level.
        `.trim(),
      },
      {
        heading: "6. Partial Refunds",
        content: `
In cases where only part of an order is affected (e.g., one missing item out of several), a partial refund proportional to the affected item's cost may be issued. Delivery fees are generally not refunded unless the entire order is cancelled by us.
        `.trim(),
      },
      {
        heading: "7. Changes to This Policy",
        content: `
We may update this Refund Policy from time to time. The "Last updated" date at the top reflects the most recent revision. Continued use of the Platform after changes constitutes acceptance of the revised policy.
        `.trim(),
      },
      {
        heading: "8. Contact Us",
        content: `
For refund requests, quality complaints, or any questions about this policy, contact us using the information provided at the bottom of this page.
        `.trim(),
      },
    ],
  },
  {
    slug: "delivery-policy",
    title: "Delivery Policy",
    subtitle:
      "This Delivery Policy applies to all delivery and pickup orders placed through the Harrison – House of Inasal & BBQ Platform. Please review this policy carefully before placing an order.",
    sections: [
      {
        heading: "1. Delivery Availability",
        content: `
- Delivery is available only within the service area of the selected branch. Not all branches offer delivery — check availability when selecting your branch.
- Delivery may be unavailable when the branch is closed, marked as *busy*, or has reached its maximum active order capacity.
- Store operating hours and branch status are checked before every order. If the branch cannot accept your order, you will be notified at checkout.
        `.trim(),
      },
      {
        heading: "2. Delivery Fees",
        content: `
- Delivery fees are calculated based on **distance** from the branch to your delivery address (in kilometers).
- The fee is displayed at checkout before you confirm the order. It is included in the total amount charged.
- **Free delivery** promotions may be available from time to time. When applied, the delivery fee will show as zero at checkout.
- Delivery fees are non-refundable unless the entire order is cancelled by us.
        `.trim(),
      },
      {
        heading: "3. Estimated Delivery Time",
        content: `
- An estimated delivery time is provided when you place your order. This is an *approximation* and may vary based on branch capacity, order volume, and traffic conditions.
- Typical delivery times range from **30–60 minutes**, depending on distance and branch load.
- We are not liable for delays caused by factors beyond our control (weather, traffic, rider availability, etc.).
        `.trim(),
      },
      {
        heading: "4. Delivery Address Requirements",
        content: `
- You must provide a complete and accurate delivery address including: street, barangay, city, province, zip code, and any helpful landmark or place name.
- GPS coordinates are saved with your address to assist the rider in locating your destination.
- **Incomplete or incorrect addresses** may result in failed delivery. You are responsible for ensuring the address is correct.
- You can save multiple shipping addresses in your account for faster ordering.
        `.trim(),
      },
      {
        heading: "5. Rider Assignment and Contact",
        content: `
- Once your order is dispatched, a rider is assigned. You will see the rider's name, phone number, and vehicle type in your order details.
- The rider will receive your name, phone number, and delivery address for coordination. This information is shared solely for delivery purposes.
- If you cannot be reached at the provided phone number, the delivery may be marked as failed.
        `.trim(),
      },
      {
        heading: "6. Pickup Orders",
        content: `
- Pickup orders can be collected at the selected branch during its operating hours.
- When your order status changes to *ready_for_pickup*, proceed to the branch and present your order reference number.
- No delivery fee is charged for pickup orders.
- Please pick up your order within a reasonable time. Orders left uncollected for extended periods may affect food quality.
        `.trim(),
      },
      {
        heading: "7. Failed Deliveries",
        content: `
- If delivery fails because you are unreachable, the address is incorrect, or you refuse the order upon arrival, the order will be marked accordingly.
- For Maya-paid orders with failed delivery caused by customer-side issues, a refund may be issued minus the delivery fee.
- For COD orders with failed delivery, no payment is collected and no refund applies.
        `.trim(),
      },
      {
        heading: "8. Order Tracking",
        content: `
You can track your order status in real time through the Platform. The status updates you may see include:

- *pending* — order received, awaiting preparation
- *preparing* — your food is being prepared
- *dispatched* — rider is on the way (delivery orders)
- *ready_for_pickup* — order is ready at the branch
- *completed* — order delivered or picked up
        `.trim(),
      },
      {
        heading: "9. Changes to This Policy",
        content: `
We may update this Delivery Policy from time to time. The "Last updated" date at the top reflects the most recent revision. Continued use of the Platform after changes constitutes acceptance of the revised policy.
        `.trim(),
      },
      {
        heading: "10. Contact Us",
        content: `
For delivery concerns, scheduling questions, or any issues related to this policy, contact us using the information provided at the bottom of this page.
        `.trim(),
      },
    ],
  },
];

/** Lookup map for quick access by slug */
export const policyFallbackMap = new Map(
  policyFallbackData.map((p) => [p.slug, p]),
);

/** All valid policy slugs */
export const POLICY_SLUGS = policyFallbackData.map((p) => p.slug);
