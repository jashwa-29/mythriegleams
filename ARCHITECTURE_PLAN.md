# 🏗️ Backend Architecture & API Design Plan

This document outlines the complete backend requirements for **Mythris Gleams**. It ensures that every frontend interaction—from category filtering to custom order inquiries—is supported by a scalable and performant data layer.

---

## 1. Data Models (Database Schema)

### 📦 Product Model
The core of the store. Must support multiple variations and detailed specifications.
```typescript
interface Product {
  id: string; // UUID
  slug: string; // url-friendly-name
  name: string;
  category: string; // Category Slug (foreign key)
  subcategory: string; // Subcategory Slug
  price: number;
  basePrice?: number; // For discount calculation (oldPrice)
  description: string; // Markdown/RichText support
  shortDescription: string;
  emoji: string; // Temporary icon (to be replaced by images)
  images: string[]; // URLs (Cloudinary/S3)
  variants: {
    type: 'size' | 'color' | 'material';
    options: string[]; // ["Small (6 inch)", "Medium (8 inch)"]
  }[];
  specifications: Record<string, string>; // { "Material": "Air-dry clay", "Finish": "Matte" }
  tags: ('new' | 'hot' | 'sale' | 'custom')[];
  stockStatus: 'in-stock' | 'out-of-stock' | 'made-to-order';
  rating: number; // Avg rating
  reviewCount: number;
  createdAt: Date;
}
```

### 🗂️ Category Model
Defines the navigation and SEO metadata for collections.
```typescript
interface Category {
  id: string;
  slug: string; // 'miniature', 'kawaii', etc.
  title: string;
  eyebrow: string; // "Hand-Sculpted Clay"
  description: string; 
  emoji: string;
  seo: {
    title: string;
    description: string;
  };
  subcategories: {
    slug: string;
    label: string;
  }[];
}
```

### 💬 Inquiry Model
Captures leads from "Custom Order" and "Bulk Order" forms.
```typescript
interface Inquiry {
  id: string;
  type: 'custom' | 'bulk' | 'contact';
  customerName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  productReference?: string; // ID of product if requested from product page
  status: 'new' | 'replied' | 'converted';
  createdAt: Date;
}
```

### ⭐ Review Model
User-submitted feedback.
```typescript
interface Review {
  id: string;
  productId: string;
  customerName: string;
  location?: string;
  rating: number; // 1-5
  comment: string;
  date: Date;
  isVerified: boolean;
}
```

---

## 2. API Endpoints Structure

### 🛍️ Product APIs
| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/api/products` | `GET` | Fetch all products with query params: `?category=x&minPrice=0&maxPrice=500&sort=newest&tag=sale` |
| `/api/products/[slug]` | `GET` | Fetch detailed data for a specific product + 4 related products in same category. |
| `/api/search` | `GET` | Global search across name and description. |

### 📂 Category APIs
| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/api/categories` | `GET` | Fetch all categories for Navbar/Dropdowns. |
| `/api/categories/[slug]` | `GET` | Fetch single category data (SEO/Header) + list of its subcategories. |

### ✉️ Inquiry & Form APIs
| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/api/inquiries` | `POST` | Submit the Custom Design or Bulk Order form. Triggers an email notification to the owner. |
| `/api/contact` | `POST` | Standard contact form submission. |

### ⭐ Review APIs
| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/api/reviews/[productId]` | `GET` | Get all reviews for a product with rating distribution (5-star count, 4-star count, etc.). |
| `/api/reviews` | `POST` | (Future) Submit a review via a protected link after purchase. |

---

## 3. Planned Features & Edge Cases

1.  **WhatsApp Dynamic Link Generator**: 
    - The backend will provide a helper function to generate `%20` encoded WhatsApp messages containing the specific product name, variant selected, and quantity to ensure orders are seamless.
2.  **Price Range Logic**: 
    - The filter API must dynamically calculate the `MIN` and `MAX` prices available in a category to prevent "zero results" for the user.
3.  **Made-to-Order Timelines**: 
    - Since products are handmade, "Delivery Time" will be dynamic based on the category (Miniatures take longer than Keychains).
4.  **SEO Automation**: 
    - Every dynamic page (Product/Category) will automatically generate OpenGraph images and meta-tags based on the DB content.

---

## 4. Auth & Security (JWT)
We will implement a dual-role authentication system using **JSON Web Tokens (JWT)**.

| Role | Access Level | Purpose |
| :--- | :--- | :--- |
| **Guest** | Public | Browse, Add to Cart, Checkout (as guest), Submit Inquiries. |
| **User** | Member | View Profile, Track Order History, Save Addresses, Submit Reviews. |
| **Admin** | Superuser | Product CRUD, Category Management, Order Management (Update Status), Upload Media, View Inquiries. |

- **Security**: Passwords hashed with `bcrypt`. Tokens stored in `httpOnly` cookies for XSS protection.

---

## 5. Media & File Uploads (Multer)
For handling images (Product photos, Custom Design Uploads).
- **Admin**: Upload multiple high-res photos for products.
- **Customer**: Upload reference images for "Custom Design" requests.
- **Storage**: Initial local storage (managed by Multer) with path mapping to a CDN/S3 for production.

---

## 6. Order & Checkout Lifecycle
Moving from WhatsApp-only to a full server-side checkout.

1. **Cart Submission**: User submits cart via `/api/orders/checkout`.
2. **Order Creation**: Server generates a `PENDING` order with a unique Invoice ID.
3. **Notifications**: 
   - **User**: Receives "Order Confirmation" email.
   - **Admin**: Receives "New Order Alert" with CSV/PDF summary.
4. **Processing**: Admin updates status (*Processing > Dispatched > Delivered*). Each update sends an automated email to the user.

---

---
 
 ## 7. Refined Technical Stack (Final)
 - **Runtime**: Node.js (v20+)
 - **Language**: TypeScript
 - **Framework**: Express.js (Back-end) / Next.js (Front-end)
 - **Auth**: JWT (jsonwebtoken) & Bcrypt
 - **File Handling**: Multer
 - **Database**: PostgreSQL (Prisma ORM)
 - **Emails**: Nodemailer / SendGrid / Resend
 - **Deployment**: VPS (PM2 for Node.js process management)
 
 ---
 
 ## 8. Order Tracking & Lifecycle
 To build trust for handcrafted items, a dedicated tracking portal will be implemented.
 
 ### 🛠️ Tracking Portal
 - **Access**: Users enter `Order ID` + `Phone Number` (or Email) to view real-time status without logging in.
 - **UI**: A visual "Timeline" showing the journey of their unique piece.
 
 ### 🍱 Handcrafted Status Stages
 | Status | Meaning | Notification Trigger |
 | :--- | :--- | :--- |
 | **Order Received** | Payment confirmed / Order logged. | Email: "We've received your order! 🥳" |
 | **Handcrafting** | Uma is meticulously sculpting/painting the items. | Email: "Your items are being handcrafted! 🎨" |
 | **Quality Check** | Final inspection of clay/resin/paint durability. | Email: "Final Quality Check in progress ✨" |
 | **Dispatched** | Item handed over to courier (includes AWB #). | Email: "Your package is on the way! 🚚" |
 | **Delivered** | Final delivery confirmed by courier API/Admin. | Email: "Enjoy your Mythris Gleams! 💖" |
