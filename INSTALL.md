# SwapSmart - Installation Guide

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ (optional - SQLite included for testing)

## Backend Setup

1. **Navigate to project directory**
   ```bash
   cd Swap_Smart1
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment**
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`

4. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run migrations**
   - For SQLite (testing): Already configured - just run migrations
   - For PostgreSQL: Update settings.py to use PostgreSQL, create database, then run migrations
   ```bash
   python manage.py migrate
   ```

7. **Create superuser (optional)**
   ```bash
   python manage.py createsuperuser
   ```

8. **Seed categories (optional)**
   ```bash
   python manage.py shell
   ```
   Then:
   ```python
   from products.models import Category
   categories = [
       {'name': 'Electronics', 'slug': 'electronics', 'icon': 'laptop'},
       {'name': 'Clothing', 'slug': 'clothing', 'icon': 'shirt'},
       {'name': 'Books', 'slug': 'books', 'icon': 'book'},
       {'name': 'Home & Garden', 'slug': 'home-garden', 'icon': 'home'},
       {'name': 'Sports', 'slug': 'sports', 'icon': 'dumbbell'},
       {'name': 'Toys', 'slug': 'toys', 'icon': 'puzzle'},
       {'name': 'Vehicles', 'slug': 'vehicles', 'icon': 'car'},
       {'name': 'Other', 'slug': 'other', 'icon': 'box'},
   ]
   for cat in categories:
       Category.objects.create(**cat)
   ```

9. **Start Django server**
   ```bash
   python manage.py runserver
   ```

## Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Admin Panel: http://localhost:8000/admin

## Environment Variables

Create a `.env` file in the root directory:

```
SECRET_KEY=your-secret-key
DEBUG=True
DB_NAME=swapsmart
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432
```

## API Endpoints

### Authentication
- POST `/api/auth/auth/register/` - User registration
- POST `/api/auth/auth/login/` - Login
- POST `/api/auth/auth/refresh/` - Refresh token
- GET `/api/auth/users/me/` - Current user

### Products
- GET `/api/products/` - List products
- POST `/api/products/` - Create product
- GET `/api/products/{id}/` - Product details
- GET `/api/products/categories/` - List categories
- GET `/api/products/matching/products/{id}/matches/` - Get matches

### Swaps
- GET `/api/swaps/` - List swap requests
- POST `/api/swaps/` - Create swap request
- POST `/api/swaps/{id}/accept/` - Accept swap
- POST `/api/swaps/{id}/reject/` - Reject swap

### Bids
- GET `/api/bids/` - List bids
- POST `/api/bids/` - Create bid
- POST `/api/bids/{id}/accept/` - Accept bid

### Reviews
- GET `/api/reviews/user/{user_id}/` - User reviews
- POST `/api/reviews/` - Create review

### Matching
- GET `/api/matching/products/suggested/` - Suggested matches
- GET `/api/matching/compatibility/?product1=&product2=` - Compatibility score
