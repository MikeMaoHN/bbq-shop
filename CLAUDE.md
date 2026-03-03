# CLAUDE.md — BBQ Shop Codebase Guide

This file provides guidance for AI assistants working in this repository.

---

## Project Overview

BBQ Shop is a full-stack e-commerce system for selling BBQ ingredients. It consists of three components:

- **Backend** — Node.js + Express REST API with SQLite
- **Web Admin** — Vue 3 admin panel for shop management
- **Mini-Program** — WeChat mini-program for customers

---

## Repository Structure

```
bbq-shop/
├── backend/              # Express API server
│   ├── src/
│   │   ├── config/       # Database and app config
│   │   ├── controllers/  # Route handler logic
│   │   ├── middleware/    # Auth, upload, error middleware
│   │   ├── models/       # SQLite data access layer
│   │   ├── routes/       # Express route definitions
│   │   └── utils/        # Logger, helpers
│   ├── database/
│   │   ├── schema-sqlite.sql
│   │   └── bbq_shop.db   # SQLite database file (gitignored)
│   ├── uploads/          # Uploaded images (gitignored)
│   ├── logs/             # App logs (gitignored)
│   ├── .env.example      # Environment variable template
│   └── package.json
├── web-admin/            # Vue 3 admin panel
│   ├── src/
│   │   ├── api/          # Axios API call modules
│   │   ├── router/       # Vue Router config
│   │   ├── stores/       # Pinia state stores
│   │   ├── utils/        # Shared utilities
│   │   └── views/        # Vue page components
│   ├── vite.config.js
│   └── package.json
├── miniprogram/          # WeChat mini-program
│   ├── pages/            # Mini-program pages
│   ├── utils/            # Shared utilities
│   ├── config.js         # API base URL config
│   └── app.json
└── docs/
    ├── PRD.md            # Product requirements
    └── DEV_LOG.md        # Development log
```

---

## Development Setup

### Prerequisites

- Node.js 16+
- WeChat Developer Tools (for mini-program)

### Backend

```bash
cd backend
cp .env.example .env    # Configure environment variables
npm install
npm run dev             # Start with nodemon on port 3000
```

Database is auto-initialized on first startup. Default admin credentials: `admin` / `admin123`.

### Web Admin

```bash
cd web-admin
npm install
npm run dev             # Vite dev server on port 3001
```

The Vite dev server proxies `/admin/api` requests to `http://localhost:3000`.

### Mini-Program

Open `miniprogram/` in WeChat Developer Tools. Update `config.js` with the correct backend URL.

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `DB_PATH` | SQLite database path | `./database/bbq_shop.db` |
| `JWT_SECRET` | JWT signing secret | *(required, change in prod)* |
| `JWT_EXPIRES_IN` | JWT token lifetime | `7d` |
| `WX_APPID` | WeChat mini-program App ID | *(required)* |
| `WX_SECRET` | WeChat mini-program secret | *(required)* |
| `UPLOAD_PATH` | Image upload directory | `./uploads` |
| `MAX_FILE_SIZE` | Max upload size in bytes | `5242880` (5MB) |
| `CORS_ORIGIN` | CORS allowed origins | `*` |
| `WX_MCHID` | WeChat Pay merchant ID | *(optional)* |
| `WX_APIKEY` | WeChat Pay API key | *(optional)* |

---

## npm Scripts

### Backend

| Script | Command | Purpose |
|--------|---------|---------|
| `npm start` | `node src/index.js` | Production start |
| `npm run dev` | `nodemon src/index.js` | Development with auto-reload |
| `npm run db:init` | Initialize DB schema | Reset database tables |
| `npm run db:seed` | Load seed data | Populate test data |

### Web Admin

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run dev` | `vite` | Dev server on port 3001 |
| `npm run build` | `vite build` | Production build |
| `npm run preview` | `vite preview` | Preview production build |

---

## Architecture & Key Conventions

### Backend

**Pattern:** MVC — controllers call models, models access SQLite directly.

- **Models** (`src/models/`) — Static class methods for database queries. Example: `Product.findAll()`, `Order.findById()`.
- **Controllers** (`src/controllers/`) — Handle HTTP request/response logic, call model methods, return JSON.
- **Routes** (`src/routes/`) — Register Express routes and attach middleware. Two route trees:
  - `/api/*` — Customer-facing (WeChat user auth required)
  - `/admin/api/*` — Admin panel (admin JWT required)
- **Middleware** (`src/middleware/`) — `auth.js` (verifies JWT), `upload.js` (multer config), `errorHandler.js`.
- **Config** (`src/config/`) — `database.js` exports the better-sqlite3 connection; `app.js` sets up Express.

**Naming conventions:**
- Files: camelCase (`productController.js`, `authMiddleware.js`)
- Controller methods: camelCase (`getProducts`, `createOrder`)
- Model class names: PascalCase (`Product`, `CartItem`)
- API routes: kebab-case paths (`/api/cart-items`)

**Response format** (all endpoints):
```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "Error description" }
```

**Authentication:**
- Customers: WeChat `wx.login()` → `POST /api/auth/wx-login` → JWT
- Admins: username/password → `POST /admin/api/login` → JWT
- Both use `Authorization: Bearer <token>` header

**Database:**
- SQLite via `better-sqlite3` (synchronous API — no async/await needed in models)
- WAL mode enabled for performance
- Transactions used for multi-step operations (e.g., order creation)
- Schema in `database/schema-sqlite.sql`

**Logging:**
- Use the `Logger` utility from `src/utils/logger.js`
- Levels: `Logger.debug()`, `Logger.info()`, `Logger.warn()`, `Logger.error()`
- Logs written to `logs/app.log`

### Web Admin

**Framework:** Vue 3 with Composition API (`<script setup>` syntax).

**State management:** Pinia stores in `src/stores/`. User auth state lives in `src/stores/user.js`.

**API calls:** Axios instances in `src/api/`. Each module corresponds to a backend resource (e.g., `products.js`, `orders.js`). Auth token is injected via an Axios request interceptor.

**UI library:** Element Plus. Use Element Plus components (`el-table`, `el-form`, `el-dialog`, etc.) for all new UI.

**Path alias:** `@` maps to `src/` (configured in `vite.config.js`).

**Routing:** Vue Router in `src/router/`. Admin login redirect handled via navigation guards.

**Component naming:** PascalCase filenames (`ProductList.vue`, `OrderDetail.vue`).

### Mini-Program

**Framework:** WeChat native (WXML + WXSS + JavaScript).

**API base URL:** Configured in `config.js`. Update this when changing backend host.

**Auth:** On launch, `wx.login()` is called and the session key is exchanged for a JWT, which is stored in `wx.setStorageSync('token')`.

**Pages:**
- `pages/index` — Landing/home
- `pages/shop` — Product listing & categories
- `pages/product` — Product detail
- `pages/order` — Order management
- `pages/profile` — User profile & address management

---

## Database Schema

Key tables:

| Table | Purpose |
|-------|---------|
| `admins` | Admin panel users |
| `users` | WeChat customers |
| `categories` | Product categories |
| `products` | Product catalog with stock |
| `cart_items` | Per-user shopping cart |
| `addresses` | Customer delivery addresses |
| `orders` | Customer orders |
| `order_items` | Line items for each order |
| `stock_logs` | Inventory change history |
| `settings` | Key-value system config |
| `operation_logs` | Admin audit trail |

---

## API Reference Summary

### Customer API (`/api`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/wx-login` | WeChat login, returns JWT |
| GET | `/api/user/info` | Get current user profile |
| PUT | `/api/user/info` | Update user profile |
| GET | `/api/categories` | List all categories |
| GET | `/api/products` | List products (supports pagination, category filter) |
| GET | `/api/products/:id` | Get product detail |
| GET/POST/PUT/DELETE | `/api/cart/*` | Cart management |
| GET/POST/PUT/DELETE | `/api/addresses/*` | Address management |
| POST | `/api/orders` | Create order |
| GET | `/api/orders` | List user orders |

### Admin API (`/admin/api`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/admin/api/login` | Admin login, returns JWT |
| GET/POST/PUT/DELETE | `/admin/api/categories*` | Category CRUD |
| GET/POST/PUT/DELETE | `/admin/api/products*` | Product CRUD |
| PUT | `/admin/api/products/:id/stock` | Update product stock |
| GET | `/admin/api/stock/*` | Stock overview and low-stock alerts |
| GET/PUT | `/admin/api/orders*` | Order listing and status updates |
| POST | `/admin/api/upload/image` | Upload product image |
| GET | `/admin/api/stats*` | Dashboard statistics |

---

## Security Notes

- **JWT secret** must be changed from the default in production.
- **CORS** is set to `*` in development — restrict in production.
- **Passwords** are hashed with bcrypt (10 salt rounds).
- **File uploads** are restricted to image MIME types (JPEG, PNG, GIF, WebP), max 5MB.
- **SQL injection** is prevented by using parameterized queries throughout.

---

## Common Tasks

### Add a new API endpoint (backend)

1. Create or update the model method in `src/models/`.
2. Add the controller method in `src/controllers/`.
3. Register the route in `src/routes/` (admin or user tree).
4. Test with curl or Postman against `http://localhost:3000`.

### Add a new admin panel page (web-admin)

1. Create the Vue component in `src/views/`.
2. Add the route in `src/router/index.js`.
3. Create the API module in `src/api/` if new backend endpoints are needed.
4. Add navigation in the sidebar component.

### Reset the database

```bash
cd backend
rm database/bbq_shop.db
npm run dev   # DB is auto-created with seed data on startup
```

---

## What's Not Implemented

- No automated tests (no Jest, Vitest, or other test framework)
- No CI/CD pipeline (no GitHub Actions or Docker)
- No ESLint or Prettier configuration
- WeChat Pay integration is scaffolded but not fully implemented
- Push notifications not implemented
