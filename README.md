# Ordering System

A full-stack ordering system designed to handle product browsing, branch-based availability, and checkout workflows with real-time inventory updates.

This project focuses on real-world system design, clean architecture, and production-ready backend logic.

---

## Features

### Customer Side

* Browse products with category and subcategory
* View product availability per branch
* Dynamic product selection using modal system
* Checkout with customer details:

  * Name
  * Email
  * Phone

### Branch System

* Multi-branch support
* Branch-specific inventory tracking
* Stock deduction happens during checkout

### System Features

* URL-based modal state management
* Structured API routes with validation
* Error handling for failed requests
* Scalable database structure

---

## Tech Stack

### Frontend

* Next.js (App Router)
* TypeScript
* Tailwind CSS

### Backend

* Next.js API Routes
* MongoDB with Mongoose

### Other

* JWT Authentication (cookies)
* REST API design

---

## Project Structure

```
/app
  /api
    /checkout
    /auth
  /components
  /hooks
  /lib
  /models
```

---

## Key Concepts

### URL-Based Modal System

Modals are controlled via query parameters instead of local state.

```
?modal=login
?modal=signup
?modal=map
```

Benefits:

* Shareable UI state
* Cleaner component logic
* Better user experience

---

### Inventory Deduction Strategy

Stock is deducted at checkout level.

```
inventory.stock -= orderedQuantity
```

Reason:

* Prevents inconsistencies across branches
* Matches real-world ordering systems

---

### Database Relationships

* Product → Category
* Product → Subcategory
* Inventory → Branch
* Order → Customer

---

## Common Issue (Production)

### Mongoose Model Not Registered

Error:

```
Schema hasn't been registered for model "Category"
```

Cause:
Using `.populate("category")` without importing the model.

Fix:

```
import "@/models/Category"
import "@/models/Subcategory"
```

Always ensure models are imported before usage in API routes.

---

## Environment Variables

Create a `.env.local` file:

```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
```

---

## Running Locally

```
npm install
npm run dev
```

---

## Deployment Notes

* Ensure all models are registered before API usage
* Validate environment variables in production
* Do not rely on local caching behavior

---

## Future Improvements

* Payment integration
* Order tracking system
* Admin dashboard
* Rate limiting
* Caching (Redis)
* Queue system for high traffic

---

## License

MIT License
