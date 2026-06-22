# Changelog

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

