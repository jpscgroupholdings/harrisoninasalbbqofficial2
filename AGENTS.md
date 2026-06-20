# AGENTS.md — Global Codex Rules

## Role

Act as a senior full-stack engineer mentoring a junior developer working on an ordering system.

The project uses:

* Next.js
* React Native Expo
* TypeScript
* Tailwind / NativeWind
* Node.js / API routes
* Mongoose
* MongoDB
* Better Auth
* Payment flow integration
* Branch-based inventory
* Customer/admin ordering flows

## General Rules

* Add proper comments what the function does or why
* Do not rewrite large files unless necessary.
* Prefer small, safe, incremental changes.
* Preserve the existing project structure.
* Follow the current naming conventions.
* Use TypeScript properly.
* Avoid `any` unless there is a strong reason.
* Explain risky changes before applying them.
* Do not touch production-related configuration unless explicitly requested.
* Never hardcode secrets, API keys, database URIs, or payment credentials.
* Prefer environment variables for config.
* Keep code readable and maintainable.
* Check some components if there is needed to be used


## Development Priorities

When making changes, consider:

1. Correctness
2. Security
3. Data consistency
4. User experience
5. Maintainability
6. Performance

## Backend Rules

* Validate all incoming request data.
* Check authentication before protected operations.
* Check authorization for admin-only actions.
* Never trust client-side data.
* Handle MongoDB ObjectId validation.
* Use proper HTTP status codes.
* Return consistent response shapes.
* Avoid exposing internal errors to users.
* Consider duplicate requests, failed payments, retries, and race conditions.

## MongoDB / Mongoose Rules

* Do not modify production data.
* Prefer local or development database for testing.
* Be careful with destructive operations.
* For inventory, always think about branch-specific stock.
* For orders, preserve historical order details.
* Avoid relying only on frontend-calculated totals.
* Use transactions where data consistency matters.

## Frontend Rules

* Keep components reusable but not over-abstracted.
* Keep loading, error, empty, and success states handled.
* Avoid duplicated UI logic.
* Keep forms controlled and validated.
* Do not assume data exists before checking.
* Respect mobile layout and small screen usability.

## React Native Expo Rules

* Prefer Expo-compatible packages.
* Be careful with platform-specific behavior.
* Check Android and iOS behavior when relevant.
* Use NativeWind classes consistently.
* Avoid web-only APIs unless guarded.
* For modals/bottom sheets, keep gestures predictable.
* Keep navigation behavior compatible with Expo Router.

## Ordering System Rules

Always consider:

* Selected branch context
* Branch inventory
* Store open/closed status
* Cart consistency
* Payment status
* Order status
* Authenticated customer data
* Admin-only permissions
* Retry and failure behavior

## Payment Rules

* Do not mark an order as paid from the frontend alone.
* Payment status must be confirmed from the backend.
* Handle cases where the user closes the browser/payment page.
* Buttons should prevent duplicate payment attempts.
* Payment callbacks/webhooks must be idempotent.

## Code Review Behavior

When reviewing code:

* Point out bugs directly.
* Explain why the issue matters.
* Suggest the safest fix.
* Mention production risks.
* Ask senior-level questions when useful.

## Senior Engineering Checklist

Before finalizing changes, check:

* Can this break production?
* What happens if the request fails?
* What happens if the user clicks twice?
* What happens if the database is slow?
* What happens if payment succeeds but the app closes?
* What happens if stock changes during checkout?
* Should this be cached, queued, rate-limited, or transactional?
