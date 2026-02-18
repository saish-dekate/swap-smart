# SwapSmart - Intelligent Barter Marketplace

## Project Overview

**Project Name:** SwapSmart  
**Type:** Full-stack Web Application (Barter Marketplace)  
**Core Functionality:** A platform where users trade products instead of selling them, with intelligent matching, trust scoring, and swap management.  
**Target Users:** Individuals looking to exchange goods, collectors, hobbyists, and anyone wanting to trade items without monetary transactions.

---

## Tech Stack

### Backend
- **Framework:** Python 3.11+, Django 4.2+
- **API:** Django REST Framework (DRF)
- **Authentication:** JWT (djangorestframework-simplejwt)
- **Database:** PostgreSQL 15+
- **Image Handling:** Pillow (image processing)
- **CORS:** django-cors-headers

### Frontend
- **Framework:** React 18+ with Vite
- **Styling:** TailwindCSS 3+
- **State Management:** React Context + useReducer
- **HTTP Client:** Axios
- **Routing:** React Router DOM 6+
- **Icons:** Lucide React

---

## UI/UX Specification

### Color Palette
- **Primary:** #000000 (Black)
- **Secondary:** #FFFFFF (White)
- **Accent:** #6B7280 (Gray-500)
- **Background:** #F9FAFB (Gray-50)
- **Card Background:** #FFFFFF
- **Border:** #E5E7EB (Gray-200)
- **Success:** #10B981 (Emerald-500)
- **Error:** #EF4444 (Red-500)
- **Warning:** #F59E0B (Amber-500)

### Typography
- **Primary Font:** Inter (Google Fonts)
- **Headings:** 700 weight
- **Body:** 400 weight
- **H1:** 2.5rem (40px)
- **H2:** 2rem (32px)
- **H3:** 1.5rem (24px)
- **Body:** 1rem (16px)
- **Small:** 0.875rem (14px)

### Layout
- **Max Width:** 1440px
- **Container Padding:** 24px (mobile), 48px (desktop)
- **Grid:** 12-column grid system
- **Responsive Breakpoints:**
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

### Components
- **Buttons:** Rounded (8px), hover scale effect
- **Cards:** White background, subtle shadow, rounded corners (12px)
- **Inputs:** Bordered, focus ring on active
- **Badges:** Pill-shaped, various colors for status
- **Product Grid:** 1 col (mobile), 2 col (tablet), 3-4 col (desktop)
- **Animations:** 200ms ease transitions

---

## Database Models

### 1. User
```
- id: UUID (primary key)
- email: VARCHAR(255) UNIQUE
- username: VARCHAR(150) UNIQUE
- password: VARCHAR(255) hashed
- first_name: VARCHAR(100)
- last_name: VARCHAR(100)
- avatar: VARCHAR(500) nullable
- bio: TEXT nullable
- location: VARCHAR(255) nullable
- latitude: DECIMAL nullable
- longitude: DECIMAL nullable
- trust_score: DECIMAL(3,2) default 0.00
- total_swaps: INTEGER default 0
- is_verified: BOOLEAN default False
- is_active: BOOLEAN default True
- created_at: DATETIME
- updated_at: DATETIME
```

### 2. Product
```
- id: UUID (primary key)
- owner: FK(User)
- title: VARCHAR(255)
- description: TEXT
- category: FK(Category)
- condition: ENUM (new, like_new, good, fair, poor)
- estimated_value: DECIMAL(10,2)
- images: M2M(Image)
- is_available: BOOLEAN default True
- is_active: BOOLEAN default True
- location: VARCHAR(255)
- latitude: DECIMAL nullable
- longitude: DECIMAL nullable
- views: INTEGER default 0
- created_at: DATETIME
- updated_at: DATETIME
```

### 3. Category
```
- id: UUID
- name: VARCHAR(100)
- slug: VARCHAR(100)
- icon: VARCHAR(50) nullable
- description: TEXT nullable
```

### 4. Image
```
- id: UUID
- image: VARCHAR(500)
- is_primary: BOOLEAN default False
- created_at: DATETIME
```

### 5. SwapRequest
```
- id: UUID
- sender: FK(User)
- receiver: FK(User)
- sender_product: FK(Product)
- receiver_product: FK(Product)
- cash_adjustment: DECIMAL(10,2) default 0.00
- status: ENUM (pending, accepted, rejected, cancelled, completed)
- message: TEXT nullable
- created_at: DATETIME
- updated_at: DATETIME
```

### 6. CounterOffer
```
- id: UUID
- swap_request: FK(SwapRequest)
- sender: FK(User)
- sender_product: FK(Product)
- cash_adjustment: DECIMAL(10,2)
- message: TEXT nullable
- status: ENUM (pending, accepted, rejected)
- created_at: DATETIME
```

### 7. Review
```
- id: UUID
- reviewer: FK(User)
- reviewed_user: FK(User)
- swap_request: FK(SwapRequest)
- rating: INTEGER (1-5)
- comment: TEXT nullable
- created_at: DATETIME
```

### 8. Bidding
```
- id: UUID
- product: FK(Product)
- bidder: FK(User)
- offered_product: FK(Product) nullable
- cash_offer: DECIMAL(10,2) nullable
- message: TEXT nullable
- status: ENUM (pending, accepted, rejected, withdrawn)
- created_at: DATETIME
- updated_at: DATETIME
```

### 9. TrustBadge
```
- id: UUID
- user: FK(User)
- badge_type: ENUM (verified, trusted, top_trader, quick_swapper, reviewer)
- earned_at: DATETIME
```

### 10. Notification
```
- id: UUID
- user: FK(User)
- type: ENUM (swap_request, swap_accepted, swap_rejected, review, bid, badge)
- title: VARCHAR(255)
- message: TEXT
- is_read: BOOLEAN default False
- created_at: DATETIME
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - JWT login
- `POST /api/auth/refresh/` - Refresh JWT token
- `POST /api/auth/logout/` - Logout
- `GET /api/auth/me/` - Current user profile
- `PUT /api/auth/me/` - Update profile

### Products
- `GET /api/products/` - List products (with filters)
- `POST /api/products/` - Create product
- `GET /api/products/{id}/` - Get product details
- `PUT /api/products/{id}/` - Update product
- `DELETE /api/products/{id}/` - Delete product
- `GET /api/products/{id}/matches/` - Get swap matches

### Categories
- `GET /api/categories/` - List categories

### Swap Requests
- `GET /api/swaps/` - List user's swap requests
- `POST /api/swaps/` - Create swap request
- `GET /api/swaps/{id}/` - Get swap details
- `PUT /api/swaps/{id}/` - Update swap (accept/reject)
- `POST /api/swaps/{id}/counter/` - Create counter offer
- `GET /api/swaps/{id}/counter/` - Get counter offers

### Reviews
- `GET /api/reviews/` - List reviews
- `POST /api/reviews/` - Create review

### Bidding
- `GET /api/bids/` - List bids
- `POST /api/bids/` - Create bid
- `PUT /api/bids/{id}/` - Update bid status

### Matching Engine
- `GET /api/matches/suggested/` - Get suggested matches
- `GET /api/matches/compatibility/` - Calculate compatibility score

### Admin
- `GET /api/admin/users/` - List users
- `PUT /api/admin/users/{id}/` - Update user
- `GET /api/admin/products/` - List all products
- `DELETE /api/admin/products/{id}/` - Delete product
- `GET /api/admin/stats/` - Dashboard statistics

---

## Fairness Engine Algorithm

### Compatibility Score Calculation (0-100)

```
score = (value_similarity * 0.35) + (trust_factor * 0.25) + (condition_factor * 0.20) + (proximity_factor * 0.20)
```

### Components:

1. **Value Similarity (35%)**
   - Calculate ratio: min(value1, value2) / max(value1, value2)
   - Score: ratio * 100

2. **Trust Factor (25%)**
   - Combined trust score of both users
   - Score: ((trust1 + trust2) / 2) * 100

3. **Condition Factor (20%)**
   - Map conditions to values: new=100, like_new=90, good=75, fair=60, poor=40
   - Score: min(condition1, condition2)

4. **Proximity Factor (20%)**
   - Calculate distance using Haversine formula
   - Score: max(0, 100 - (distance_km * 2))

---

## Trust Score Algorithm

### Base Score Calculation
- Starting score: 5.0
- Each successful swap: +0.3
- Each review received: +0.1 * (rating - 3)
- Each failed/cancelled swap: -0.5

### Badge Thresholds
- **Verified:** Email verified
- **Trusted:** Trust score >= 7.0
- **Top Trader:** 10+ successful swaps
- **Quick Swapper:** 3+ swaps in last 30 days
- **Reviewer:** 10+ reviews written

---

## Page Structure

### Frontend Pages
1. **Landing Page** - Hero, featured products, how it works
2. **Login/Register** - Authentication forms
3. **Products Browse** - Grid with filters, search
4. **Product Detail** - Images, description, swap/bid buttons
5. **User Profile** - Profile info, products, reviews, badges
6. **Dashboard** - My swaps, my products, bids, notifications
7. **Create/Edit Product** - Form with image upload
8. **Admin Dashboard** - Moderation, statistics

---

## Acceptance Criteria

### Authentication
- [ ] Users can register with email verification
- [ ] JWT tokens work correctly
- [ ] Protected routes require authentication

### Products
- [ ] CRUD operations work for products
- [ ] Multiple images can be uploaded
- [ ] Filters (category, condition, location) work
- [ ] Search by title/description works

### Swap System
- [ ] Users can send swap requests
- [ ] Counter-offers are supported
- [ ] Cash adjustment can be added
- [ ] Status tracking works

### Matching Engine
- [ ] Compatibility scores are calculated
- [ ] Suggested matches are displayed
- [ ] Fairness algorithm works correctly

### Trust System
- [ ] Trust scores update after swaps
- [ ] Badges are awarded correctly
- [ ] Reviews affect trust score

### UI/UX
- [ ] Black and white theme is consistent
- [ ] Responsive on all devices
- [ ] Animations are smooth
- [ ] Cards and grids display properly
