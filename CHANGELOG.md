# Changelog


## 1.13.0 - Confirmed Status, Reservation Management & Payment Guards - 2026-07-21
**Release Focus:** New `confirmed` order status for paid reservations, dedicated reservations page with calendar view, defense-in-depth payment verification across all reservation touchpoints, and time-based guard preventing early preparation.

### Added
- `confirmed` order status — represents a paid and booked reservation, separate from `pending` (needs immediate action)
- `confirmedAt` timeline field — tracks when a reservation was confirmed (COD at order time, Maya at payment success)
- Status transitions: `confirmed` → `preparing` → `ready_for_pickup` → `completed` (dine-in follows pickup flow, no dispatch)
- Reservations page (`/reservations`) with calendar view (month grid with day highlighting) and list view toggle
- Calendar "other month" hints — clickable pills showing reservation counts in months outside the current view, click to navigate
- `ReservationConfirmedEmail` template — shows date/time, party size, branch, order total, and 15-minute arrival note
- Sidebar "Reservations" nav item (CalendarDays icon) with indigo badge showing confirmed reservation count
- Dashboard aside "Upcoming Reservations" section — next 5 confirmed reservations sorted by scheduled date
- Admin orders page "Confirmed" tab with tab count
- Customer orders page "Confirmed" tab with indigo styling
- Customer StatusBadge "Reservation Confirmed" with CalendarCheck icon and indigo theme
- Admin StatusBadge indigo color for `confirmed` status
- OrderDetailsModal timeline label "Reservation Confirmed" for `confirmedAt`

### Improved
- **Payment guard (3 layers):** UI hides "Start Preparing" button for unpaid Maya reservations, API blocks `confirmed → preparing` without `PAYMENT_SUCCESS` + `paymentId`, webhook only transitions to `confirmed` on verified payment
- **Time guard (2 layers):** UI disables "Start Preparing" within 1 hour of scheduled time (shows tooltip with available date), API rejects the transition with descriptive error message
- Maya dine-in orders now start as `pending_payment` (not `confirmed`) — only move to `confirmed` after webhook confirms payment
- COD dine-in orders go directly to `confirmed` (no payment verification needed)
- `OrderActionButton` refactored to accept `order` object instead of 7 individual props — eliminates prop-drilling bugs
- "Other month" reservation hints are clickable — clicking navigates the calendar to that month
- `OrderActionButton` time guard uses `fulfillmentType` (always present) as primary check instead of optional `reservationScheduledAt` — deterministic behavior
- `OrderActionButton` shows "Invalid reservation" (red) if confirmed dine-in is missing `scheduledAt` — catches data integrity issues

### Changed
- Display labels updated: "Dine In" → "Reserve a Table" (fulfillment selector), "Reservation" (badges/cards), "Confirm Reservation" (CTA button)
- `queryOrders` formatter now includes `reservation` field — was previously excluded, causing `reservationScheduledAt` to be undefined in UI
- Admin orders API `confirmed` tab filter now includes payment verification (`confirmedPaymentOr`) — defense-in-depth against DB tampering
- Dashboard activity API upcoming reservations query uses proper MongoDB `$or` operators for payment verification (COD passes, Maya needs `PAYMENT_SUCCESS` + `paymentId`)
- Maya webhook sends `ReservationConfirmedEmail` for dine-in `PAYMENT_SUCCESS` instead of `OrderSummaryEmail`
- Email subject for dine-in: "Reservation Confirmed — {branch name}" instead of "Order Confirmed"
- `OrderMessageEmail` accent color for `confirmed` status set to indigo (#4f46e5)

### Fixed
- Expiry job (`expire-pending-order`) now skips dine-in reservations with future `scheduledAt` — prevents COD reservations from being killed by the 4-hour COD expiry window
- `queryOrders` formatter was missing `reservation` field — caused `order.reservation` to always be `undefined` in admin/customer UI, breaking the time guard and reservation display
- `ReservationConfirmedEmail` Preview component — fixed `undefined` branch name by adding fallback to "Harrison's"


## 1.12.0 - Dine-In Reservations - 2026-07-21
**Release Focus:** New `dine_in` fulfillment type allowing customers to place advance orders with a reservation (date, time, party size), aligned to store operating hours with server-side enforcement.

### Added
- `dine_in` fulfillment type in `FULFILLMENT_TYPE` constants alongside `delivery` and `pickup`
- `reservation` subdocument on Order model (`scheduledAt: Date`, `partySize: Number`)
- `ReservationPicker` checkout component: date picker, time slot grid (30-min intervals), and party size stepper
- Time slots generated dynamically from store operating hours (`openTime` to `closeTime - 1hr`)
- Closed-day detection: warns when selected date falls on a non-operating day
- Store globally closed guard: shows "Reservations unavailable" when `isClosed` is true
- Server-side reservation validation: checks operating day, time within hours, 1hr buffer before closing, future date, party size (1–50)
- Admin order views show reservation date/time and party size in FulfillmentCard (emerald-themed)
- Purple/emerald "Dine In" badges in admin OrdersTable and customer order cards
- "Pay at Branch" COD label for dine-in orders
- Compound index on `fulfillmentType + reservation.scheduledAt` for future calendar queries

### Improved
- FulfillmentSelector expanded to 3-column grid for delivery/pickup/dine-in
- Checkout flow: dine-in skips shipping step entirely, submits directly from details page
- Auto-redirect to details page when switching to pickup/dine-in from shipping page (prevents dead-end)
- Shipping page now redirects (via `router.replace` in `useEffect`) instead of showing static banners for non-delivery types
- Timezone handling: all date comparisons use local time (`getLocalDate` helper) instead of UTC `toISOString()` — fixes PH timezone drift
- Reused existing `formatTime` and `formatDateWithDay` formatters instead of local duplicates
- Dine-in orders follow pickup status flow: `pending` → `preparing` → `ready_for_pickup` → `completed` (no dispatch step)
- Admin OrderActionButton hides "Dispatch" for dine-in orders; `ready_for_pickup` hidden for delivery
- Delivery fee section hidden for dine-in orders in OrderDetailsModal
- Map in OrderDetailsModal shows branch location for dine-in (customer view)

### Changed
- `validateFulfillmentPayload` and `resolveCheckoutFulfillment` are now async to support server-side settings lookup for reservation validation
- `assertValidPayload` is now async (passes session through to fulfillment validation)
- COD and Maya checkout routes updated to pass `session` and `await` fulfillment resolution
- `assertBranchCanAcceptOrders` treats dine-in like pickup (only `isBusy` check, no capacity counting)
- `OrderFormState` now includes `reservation` field with `ReservationSchema` (Zod)

### Fixed
- CheckoutContext `handleFulfillmentTypeChange` now redirects to details page when user switches to pickup/dine-in while on shipping step
- Shipping page guard uses `useEffect` + `router.replace` instead of calling `router.push` during render (prevents React side-effect warnings and hydration mismatches)
- Date/time derivation uses local date methods instead of UTC to prevent timezone drift in PH (UTC+8)


## 1.11.1 - Inventory Management, Mobile UX & Bug Fixes - 2026-07-18
**Release Focus:** Inventory list overhaul with sort, filter, search, and pagination; mobile category selection dropdown; admin safety guard; and order quantity/modifier fixes.

### Added
- Inventory list: sorting, filtering, searching, and pagination with card layout
- Orphaned inventory record cleanup

### Improved
- Global stats card refactored for reuse across all admin sections
- Categories selection converted to dropdown on mobile view
- Removed third-party food delivery platform references

### Fixed
- Prevent admin from deactivating their own account
- Admin can now fully erase quantity inputs; empty string submission guarded to minimum of 1
- Customers can freely choose different items on side/linked modifier items (e.g. 1 coke + 1 beer) instead of being forced to mirror the main group's item distribution


## 1.11.0 - Admin Profile, Cloudinary Centralization & Changelog Page - 2026-07-18
**Release Focus:** Staff model expansion with image support, admin self-service profile page with avatar upload and password change, centralized Cloudinary upload utility, role-based access control refactor, and a changelog page rendered from Markdown.

### Added
- Staff model fields: `image` (nested `{ url, public_id }`) aligned with Product/Category/Bundle pattern
- Admin profile page (`/profile`) with editable name, phone, avatar upload, and change password
- Centralized Cloudinary upload utility (`lib/cloudinaryUpload.ts`) with `uploadToCloudinary()` and `destroyCloudinaryImage()` helpers
- Changelog page (`/changelog`) that reads `CHANGELOG.md` and renders it via `react-markdown`
- Sidebar version display now links to the changelog page
- `updateProfileSchema` Zod validation for admin self-service profile updates
- API routes: `PUT /api/staff/profile` (self-update), `POST /api/staff/upload-avatar` (admin avatar upload)
- React Query hooks: `useUpdateProfile`, `useUploadAdminAvatar`, `useChangeAdminPassword`
- AdminHeader floating dropdown menu with View Profile, Legal Policies, and Logout options
- Logout moved from sidebar to the header dropdown

### Improved
- Refactored role-based access control to resource-centric definition with action shorthands (`R`, `RU`, `RCU`, `FULL`)
- All three Cloudinary upload routes (`/api/upload`, `/api/staff/upload-avatar`, `/api/customer/upload-avatar`) now use the centralized helper
- Preview-first avatar upload flow: local preview on file select, Cloudinary upload deferred to save
- Old avatar automatically destroyed on Cloudinary when replaced (via `public_id`)
- Replaced `marked` + `dangerouslySetInnerHTML` with `react-markdown` in policy rendering (eliminates XSS vector)
- Removed unused `IconButton` and `LogoutModal` imports from Sidebar

### Removed
- `marked` and `@types/marked` dependencies (replaced by `react-markdown`)
- Sidebar "Exit Portal" logout button (now in header dropdown)
- Stale `avatar`, `avatarPublicId`, `bio` fields from Staff model and types


## 1.10.0 - Modifier Group Management Overhaul - 2026-07-14
**Release Focus:** Complete rework of modifier group management with drag-and-drop repositioning, debounce protection, and improved UX for quantity and selection handling.

### Added
- Drag-and-drop repositioning for modifier groups and items under templates and products
- Debounce utility for API routes to prevent spam requests
- Reorder position handling for modifier categories, modifier templates, and subcategories

### Improved
- MaxSelect logic: when maxSelect is 1, selecting another modifier auto-clears the previous; when greater than 1, user must deselect n items before selecting a new one
- Modifier items no longer have independent quantity — quantity is computed from the modified order
- Removed product quantity field, centralized modifier types and Zod validation
- Price preview for modifier and reorder placed on right side for readability
- "See more" action button for modifier groups when items exceed 3
- Uniform card heights regardless of content length
- Removed modifier group names from display


## 1.9.4 - Customer Management, Reports & Dashboard Improvements - 2026-07-11
**Release Focus:** Dynamic customer list with filtering and account management, comprehensive reports with revenue/trends/retention analytics, responsive dashboard, and order details modal refinements.

### Added
- Dynamic customers list page with filtering, searching, and a modal to update customer accounts
- Customer detail view: account status, total orders, total spent, average spent per day
- Ban/unban API and boolean `banned` attribute on customer accounts
- Reports aggregation API: total revenue, orders, average orders, customer retention
- Reports page: revenue trend, orders trend, category breakdown, peak hours analysis
- Reusable "No Data Found" component shared across reports and dashboard
- Responsive dashboard card and layout

### Improved
- Order details modal: properly lists combo/set product details, renders full order summary with each product placed
- Date and formatter utilities consolidated into a single file
- Component separation across reports and dashboard sections

### Refactored
- Moved "No Data Found" component out of the protected folder to the shared components directory


## 1.9.3 - Modifier Selections on Orders - 2026-07-09
**Release Focus:** Modifier selections are now recorded on orders with proper unit price computation.

### Added
- Modifier selections included on order types to record included items
- Unit price computation for modifier items with proper zero-price rendering on Maya payment


## 1.9.2 - Modifier Groups UI Refinement - 2026-07-08
**Release Focus:** Polished modifier group management UI with better layouts, reusable action buttons, and drag-and-drop fixes.

### Added
- Reusable "See More" action button for multiple-item sections
- Option to set a modifier group as main and link other groups to it
- `maxQty` attribute for overall quantity limit on modifier items
- Clamp utility for constraining values between min and max
- Version display and contact info on login page

### Improved
- Modifier group layout: better button positioning with sync, detach, and delete actions
- Price preview for modifier and reorder placed on right side for readability
- Drag-and-drop fix: only the drag handle moves instead of the whole card when dropping on the same item key
- Removed allowed email hint from registration flow

### Fixed
- Correct payload passing of `isMain`, `linkedToGroupId`, and `maxQty` attributes for customer product modifier


## 1.9.1 - Store Hours Messaging, Markdown Editor & Dashboard Activity - 2026-07-06
**Release Focus:** Store closed/open messaging for customers, markdown editor for legal policies, dashboard aside activity feed, and review editing.

### Added
- Store operation hours floating hint: shows title, message, and suggestion when the store is closed
- Dashboard aside activity feed: pending orders, low stock products, new user accounts (last 7 days)
- Markdown editor (`@uiw/react-md-editor`) for legal policies — no more manual Markdown writing
- Tailwind Typography plugin (`@tailwindcss/typography`) for proper prose rendering of policy content
- Customer review editing on specific orders
- Dynamic loading text across the admin panel
- Disabled button styling support
- AI agent skill configuration (`.qwen`)

### Improved
- Admin policies: cannot edit static fallback data until seeded into database
- API error helper (`getAPIError`) now accepts options for extra messages and fallback text
- Order actions accept variant argument for dynamic rendering on order page vs modal
- Shows "View Review" / "Edit Review" button based on whether the order has been reviewed

### Fixed
- Menu page: observer callback fires immediately when data changes; customers can add to cart without selecting a branch first
- Prose heading typo corrections in policy rendering


## 1.9.0 - Review System Overhaul - 2026-07-04
**Release Focus:** Complete product and order review system with star ratings, helpful votes, anonymous reviews, admin replies, and review management for admins.

### Added
- Product reviews page: list all products with reviews, grouped by product, with star rating display and distribution
- Order reviews page: sections card, filtering, and admin actions (hide, reply, view details)
- Reusable metric card component for stats across admin sections
- Reusable sections stats card for review pages
- Star rating component with percentage-based fill
- React Tooltip provider for hover hints
- Anonymous review option for customers
- Helpful votes system: customers can cast votes on review comments
- Admin reply functionality on reviews
- Shared review data: star options, types, and filtering constants
- Total average reviews shown in product details modal
- Review editing by admin for specific or multiple products

### Improved
- Product details modal shows star icon and review count with "View Review" tooltip
- Order item image: properly handles loading and error icon states
- Delivery base fare increased to ₱65 (from ₱49)

### Fixed
- Delivery current location: validates coordinate accuracy — returns error if device accuracy exceeds 5km
- Meta Pixel script corrections
- Admin token cleared when admin record not found in database

### Chores
- Installed `react-tooltip` for tooltip support


## 1.8.1 - Order Status Filtering & Terms Acceptance - 2026-07-03
**Release Focus:** Order list filtering by status with tab counts, customer terms acceptance tracking, and UI polish.

### Added
- Order status filtering with tab counts based on filter parameters
- Customer terms acceptance: customers must accept terms before account creation
- Terms acceptance timestamp stored on customer account (including first Google Auth login)
- Backend validation ensuring terms were accepted at registration
- New order highlight on the orders list
- Improved pending order counter on sidebar

### Improved
- Simplified search bar with sub-label support on select fields
- Updated customer-facing banner
- Tailwind merge support for class composition
- Terms label clarity

### Fixed
- Order fetching now filters by status and excludes unpaid orders from certain status views


## 1.8.0 - Branch Capacity Management, Meta Pixel Analytics & Legal Policies - 2026-07-03
**Release Focus:** Smarter order fulfillment control (branch capacity/busy status with pickup fallback), full Meta Pixel/Conversions tracking across the customer journey, and a centralized legal policies system.

### Added
- Branch capacity management: admins can manually toggle a branch as "busy" and set a maximum active order count per branch, or globally for all branches
- Global capacity sharing setting (`isGlobalCapacityShared`) — when enabled, active orders are counted across all branches; when disabled, counted per selected branch only
- Checkout guard that blocks order placement if the selected branch is busy or at capacity
- Automatic fallback to pickup as an alternative fulfillment method when delivery/branch cannot accept orders
- Pickup orders bypass capacity checks entirely, but still respect an admin-set "busy" flag on the branch
- Fulfillment type now passed as a param through the order flow to determine which capacity rules apply
- Polling mechanism to recheck branch capacity while a customer has an active order in progress
- Admin dashboard card showing count of currently busy branches
- Active order counts now only include legitimately paid orders
- Product details modal now opens based on URL params
- Full Meta Pixel (Facebook Pixel) integration: `PageView`, `Search`, `Contact`, `Lead`, `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase`, and `CompleteRegistration` events
- Helper utility for tracking user behavior via Meta Pixel, including product ID tracking on relevant events
- Legal Policies system: Privacy Policy, Terms of Use, Refund Policy, and Delivery Policy pages, backed by a new `Policy` model
- Public API endpoint for customer-facing policy pages, and a shared policy page component (fetches by slug) reused across all policy routes
- Static fallback data for policies, with a check to confirm all policies are seeded on the backend
- Admin section to create/update legal policies, with access restricted to admin and superadmin roles
- Overlay component for modal/loading states

### Improved
- Centralized policy contact details and dynamic content shared across all policy pages
- Policy "last updated" field now stores date only (no time component)
- Positioning of policy page navigation adjusted to account for the global system header
- Customer-facing banners redesigned on the customer landing page
- Active tab styling now correctly determined by checking the current pathname
- Auth flow now reuses an existing `Account` model record if present instead of always creating a new one
- Password hint UI redesigned for clarity

### Fixed
- Email preview no longer incorrectly renderable as a standalone page

### Changed
- Reverted forced password-change prompt for non-OAuth accounts with passwords not meeting new password rules

### Chores
- Installed `marked` for rendering policy content as HTML from Markdown


## [1.7.1] - 2026-06-30

### Added
- Automatic password upgrade prompt for admins using legacy passwords after login
- Password update modal with validation and password strength guidance
- API endpoint for updating admin passwords with the new password policy
- Allowed email validation for customer and admin accounts
- Exact validation error messages for account creation and password updates
- Shared API error type for consistent error handling

### Changed
- Enforced stricter account validation:
  - Customers using password authentication must register with a Gmail address
  - Passwords must contain at least 8 characters, one uppercase letter, one number, and one special character
- Account creation now uses centralized validation schemas and shared constants
- Admin password prompt is shown only for non-OAuth accounts whose existing password no longer meets the new security requirements
- Password validation utilities are now shared across the application

### Fixed
- Fixed account creation validation for roles with access to all branches
- Fixed password prompt visibility to correctly detect insecure legacy passwords

### Refactored
- Centralized account validation using shared Zod schemas
- Consolidated password validation utilities into the validation library
- Standardized allowed email validation across customer and admin authentication flows
- Updated validation imports and project structure for improved maintainability

## [1.7.0] - 2026-06-30

### Added
- Dashboard filter controls supporting week, month, year, custom month, and custom year selection
- Dashboard search parameter builder for period and branch filtering
- Shared dashboard period parsing helper
- Static months data for dashboard filtering
- Free delivery hint label on dashboard metrics

### Changed
- Dashboard filtering now happens at the parent level and is shared across all dashboard charts
- Dashboard charts now update dynamically based on the selected period and branch filters
- Dashboard labels now adapt dynamically based on the selected reporting period
- Expanded dashboard filtering logic to support date ranges, specific months, and specific years across all dashboard analytics
- Customer orders now display both order status and payment status
- Customer-facing payment status is now derived from the internal payment status for clearer order tracking

## [1.6.0] - 2026-06-29

### Added
- Centavo-based arithmetic for currency calculations to prevent floating-point rounding errors
- Free delivery eligibility logic based on minimum purchase amount, max distance, and free delivery toggle
- `freeDeliveryApplied` and `freeDelivery` attributes tracked on orders
- Raw delivery fee tracked on orders for receipt accuracy when free delivery is applied
- Branch location coordinates stored on order branch snapshot for customer tracking
- Google Maps URL builder helpers for branch and shipping address links
- Fulfillment type visible on orders table so customers can see order type without opening details
- Branch name rendered on orders table
- Cart list renders free delivery with strikethrough on original fee when eligible
- Order details modal renders delivery fee as free when eligible

### Changed
- Delivery info section showing the free delivery amount (₱0) when `freeDeliveryApplied`
- Moved input field rendering to the shared `FormField` component
- Delivery fee calculation now resolves the effective fee based on minimum purchase, max distance, and free delivery enabled flag
- Delivery fee estimate computes subtotal to pass into `resolveEffectiveFeeFromCoordinates` for free delivery eligibility
- All computed amounts now use centavo arithmetic for consistency
- Free delivery UI hints guarded — only shown when free delivery is actually enabled to avoid customer confusion
- Order details modal now shows role-accessed information: shipping address, branch location, payment, and order ID, with iframe maps for branch and shipping address
- Increased delivery rate per distance


## [1.5.0] - 2026-06-25

### Added
- Allowed cities configuration for restricting delivery coverage to a defined list of cities
- Admin address search when creating or editing a branch
- Delivery area validation now enforces the allowed cities list on order placement
- When the allowed cities list is empty, delivery is open to all addresses within the branch's delivery polygon

## [1.4.0] - 2026-06-25

### Added
- `isOpenSoon` attribute on branches to mark locations that are not yet accepting orders
- Branch-level guards across services and validation logic to restrict operations to active branches only

## 1.3.3 - 2026-06-24
### Changed
- **Branch Selector** — Replaced map modal with a lightweight dropdown listing
  all available branches. Customers can now select a branch directly without
  triggering a map interaction.

## 1.3.2 - 2026-06-24
### Fixed
- **Order Expiration (Maya)** — Inngest background job now correctly expires
  pending orders for Maya payments where the customer did not complete payment.
  Previously, orders could remain in a `pending` state indefinitely if no
  `paymentId` was recorded or the payment status never reached `success`.

## 1.3.1 - Map Polygon - 2026-06-23

**Release Focus:** Introduces the polygon area where declared coordinates of nearby places from makati - now the customer's marker will check if inside of polygon instead of the whole radius of metro manila. Also, decreased the radius to ensure the area is within the nearby area.

## 1.3.0 - Activity Logs 2026-06-23

* Added Activity Logs for tracking customer, staff, system, and webhook actions.
* Added branch-aware filtering across inventory, activity logs, and operational data.
* Improved multi-branch support for Super Admin, Admin, and Cashier roles.
* Automatically creates default inventory records when adding new products.
* Enhanced order details with better shipping address and payment information display.
* Added payment confirmation validation to prevent processing unpaid orders.
* Improved checkout experience with clearer customer guidance and validation messages.
* Updated inventory and stock visibility for branch management.
* Added AI configuration support for future intelligent features.


## 1.2.0 - Fulfillment Checkout 2026-06-22

**Release Focus:** Introduces fulfillment-based ordering with support for both Delivery and Pickup workflows. This release adds fulfillment-aware checkout validation, order processing, status management, and customer order tracking.

### Added

* Pickup fulfillment option during checkout.
* Fulfillment type selection for customer orders.
* Fulfillment type attributes stored with orders.
* Dedicated fulfillment validation and resolution service.
* Branch coordinate validation service for fulfillment processing.
* Ready to Pickup order status and tracking flow.
* Order status configuration based on fulfillment type.
* Automated tests for fulfillment validation rules.

### Improved

* Checkout now dynamically adjusts behavior based on selected fulfillment type.
* Delivery fee calculation is only applied to delivery orders.
* Dynamic labels and order details based on fulfillment type.
* Improved customer order tracking for pickup orders.
* Enhanced order status transitions for delivery and pickup workflows.
* Improved checkout user experience when switching fulfillment methods.

### Validation & Business Rules

* Pickup orders no longer require shipping addresses.
* Delivery orders require valid delivery locations and coordinates.
* Checkout validation now enforces fulfillment-specific requirements.
* Order status updates are validated against fulfillment type rules.


## 1.1.1 - Checkout and Address Improvement 2026-06-20

**Release Focus:** Improves customer checkout experience through profile synchronization, enhanced address persistence, stronger coordinate validation, and overall usability refinements for delivery information management.

### Improved

* Customers can now save delivery coordinates and resolved place names with their shipping address.
* Refactored profile synchronization flow for checkout forms.
* Reused shared coordinate helper utilities across address-related features.
* Improved checkout draft handling and profile-based data population.
* Enhanced comment validation rules.
* Added image fallback text for cart items when product images fail to load.

## 1.1.0 - Delivery and Address Management 2026-06-20

**Release Focus:** Introduces PSGC-powered address management, map-based customer delivery location pinning, geographic delivery validation, and dynamic delivery fee calculation. This release improves delivery accuracy, and checkout reliability.

### Added
- PSGC-powered shipping address management with support for address codes, barangays, municipalities, and sub-municipalities.
- Interactive map-based address pinning for customer delivery locations.
- Automatic place name resolution from pinned map coordinates.
- Delivery area validation using geographic coordinates.
- Dynamic delivery fee calculation based on branch distance and delivery location.
- Delivery fee breakdown including distance, pricing distance, and fee details.
- Shared Leaflet map primitives and centralized map utilities.
- Centralized PSGC API service layer.
- Automated tests for delivery fee calculations.

### Improved
- Refactored shipping address forms to use PSGC-compliant address structures.
- Enhanced address validation with coordinate-based checks and Metro Manila coverage validation.
- Improved checkout validation for delivery addresses and location data.
- Improved map UX with clearer pin-location actions, location feedback, and visual delivery coverage indicators.
- Applied shared delivery area helpers and reusable coordinate utilities across the system.
- Improved form validation behavior using field-level blur validation and more accurate error messaging.
- Improved API architecture by separating business logic into dedicated services.
- Preserved customer checkout drafts using session storage and cleared drafts after successful order placement.
- Enhanced delivery fee integration across checkout, order processing, taxation, and payment payload generation.    

## 1.0.0 - Initial Release 2026-06-13
- Baseline tracked release.
- Existing admin ordering system, customer ordering flow, payments, branches, inventory, promotions, reviews, and staff permissions are treated as the starting production feature set.

