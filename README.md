# Operations ERP Portal

A distribution operations platform built for businesses that need one system to run customer relationships, inventory, and sales — instead of juggling a CRM, a spreadsheet for stock, and a separate billing tool. Built with a role-based workspace for Admin, Sales, Warehouse, and Accounts users, so each person sees only what their job actually needs.

---

## Client Offerings / Key Benefits

What this system actually solves for a distribution business:

- **Centralized operations** — customers, inventory, and sales live in one system instead of spreadsheets, a separate CRM, and manual stock counts that drift out of sync with each other.
- **Real-time inventory tracking** — every stock change is logged as an immutable IN/OUT movement, so stock levels are always traceable back to a specific challan, adjustment, or receipt — not just a number that silently changes.
- **Secure, role-based workspaces** — a Sales user physically cannot see Accounts' revenue data or deactivate a product; access is enforced server-side per role, not just hidden in the UI.
- **Streamlined sales-to-dispatch workflow** — a challan moves from Draft (Sales creates it) to Confirmed (Warehouse validates stock and dispatches) to reflected revenue (Accounts), with each step owned by the role responsible for it, and stock deduction happening automatically and atomically at confirmation — no manual reconciliation between "what sales sold" and "what warehouse shipped."
- **Built-in alerting** — low-stock and overdue-payment conditions surface directly in-app (toast notifications + dashboard flags) rather than requiring someone to notice a spreadsheet cell turned red.

---

## Tech Stack

**Frontend**
- React
- Vite
- Plain CSS (custom design system — no component library)
- Axios
- React Router

**Backend**
- Node.js
- Express 5
- MySQL (`mysql2/promise` — raw SQL, no ORM)
- JWT Authentication
- bcrypt

---

## Architecture

Every request follows the same fixed path, enforced across the whole backend:

```
Route → Controller → Service → Model → Database
```

- **Routes** map HTTP verb + path to a controller. No logic.
- **Controllers** read the request and call a service. No SQL, no business rules.
- **Services** hold all business logic — validation, stock rules, atomic transactions. Never touch `req`/`res`.
- **Models** are raw SQL query functions, one file per entity. No business logic.

This is what keeps something like challan confirmation — checking stock, deducting it, logging the movement, updating status — as a single atomic transaction in the service layer, instead of scattered across controller code.

---

## Features

**Authentication**
- JWT-based login
- Role-based protected routes (Admin / Sales / Warehouse / Accounts)

**Dashboard**

The dashboard is not one fixed screen — it renders different KPIs and quick actions depending on the logged-in user's role, using the same shell and layout so the system still feels like one product.

- **Admin Dashboard** — system-wide view: active customer count, draft challans awaiting review, low-stock alerts, and revenue MTD rolled up across all workspaces. Also the only role with access to System Users.
- **Sales Dashboard** — open deals, quotes awaiting approval, sales this month, and new customers this week. Quick actions: new quote, log customer visit.
- **Warehouse Dashboard** — pending dispatches (confirmed challans waiting to go out), low-stock items needing reorder, and stock in/out counts for the day. Quick actions: log stock movement, receive shipment.
- **Accounts Dashboard** — outstanding invoices, overdue payments, revenue MTD, and reconciliation entries pending. Quick actions: record payment, generate invoice.

Each role's workspace also carries its own accent color across the sidebar, cards, and buttons (Sales — cobalt, Warehouse — rust, Accounts — forest green, Admin — plum), so which workspace is active is visible at a glance, not just inferred from the page content.

**Customer Management (CRM)**
- View, search, add, edit customers
- Follow-up note history per customer
- No hard deletes — customers are deactivated (`is_active = false`), not removed

**Product Management**
- View, search, add, edit products
- Low-stock threshold flagging
- Same soft-deactivation pattern as customers

**Inventory Management**
- Log stock movements (IN / OUT) with a reason
- Full movement history per product
- Stock cannot be reduced below zero — enforced server-side, not just in the UI

**Sales Challan Management**
- Create a challan with multiple products in a single request
- Line items store a **snapshot** of product name and price at the time of sale, so later price changes don't rewrite sales history
- Draft → Confirmed → Cancelled lifecycle
- Confirming a challan is one atomic transaction: stock check, stock deduction, inventory movement log, and status update all succeed or all roll back together

---

## Project Structure

```
operations-erp-portal/
│
├── backend/
│   ├── src/
│   │   ├── models/       → raw SQL queries, one file per entity
│   │   ├── services/     → business logic, validation, transactions
│   │   ├── controllers/  → request in, service call, response out
│   │   ├── routes/       → route definitions only
│   │   ├── middleware/   → verifyToken, requireRole, error handler
│   │   ├── config/       → db.js, init_db.js
│   │   └── utils/        → challan number generator, response formatter
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env
│
└── README.md
```

---

## Installation

**Clone the repository**

```bash
git clone https://github.com/[your-username]/operations-erp-portal.git
cd operations-erp-portal
```

**Backend setup**

```bash
cd backend
npm install
cp .env.example .env      # add DB credentials + JWT secret
node src/config/init_db.js   # creates all tables
npm run dev
```

Backend runs on:
```
http://localhost:5000
```

**Frontend setup**

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:
```
http://localhost:5173
```

---

## Database

- **Database:** MySQL
- **Access layer:** raw SQL via `mysql2/promise` — no ORM, queries are explicit and reviewable in the models layer

**Main entities**

| Table | Purpose |
|---|---|
| `users` | Auth + role (Admin / Sales / Warehouse / Accounts) |
| `customers` | CRM records |
| `customer_follow_ups` | Follow-up note history, linked to customers |
| `products` | Catalog and live stock count |
| `stock_movements` | Immutable IN/OUT log per product |
| `sales_challans` | Sales orders — Draft / Confirmed / Cancelled |
| `challan_items` | Line items with product/price snapshots |

---

## Business Workflow

```
Customer
   │
   ▼
Create Draft Challan (multiple products, quantities)
   │
   ▼
Confirm Challan
   │
   ├──► Validate stock is sufficient for every item
   ├──► Deduct stock per item
   ├──► Log a stock movement (OUT) per item
   └──► Set challan status to Confirmed
   │
   ▼
Dashboard reflects updated stock, revenue, and challan counts
```

If stock is insufficient for any item, the entire confirmation is rolled back — no partial deductions.

---

## API Routes

All routes except `/auth/*` require a valid JWT in the `Authorization: Bearer <token>` header. "Role required" shows the minimum role enforced server-side by `requireRole` — a request from any other role returns `403`.

**Auth**

| Method | Route | Role required |
|---|---|---|
| POST | `/auth/register` | — |
| POST | `/auth/login` | — |

**Customers**

| Method | Route | Role required |
|---|---|---|
| GET | `/customers` | Any authenticated user |
| GET | `/customers/:id` | Any authenticated user |
| POST | `/customers` | Admin, Sales |
| PUT | `/customers/:id` | Admin, Sales |
| PUT | `/customers/:id/deactivate` | Admin |
| POST | `/customers/:id/follow-ups` | Admin, Sales |
| GET | `/customers/:id/follow-ups` | Any authenticated user |

**Products**

| Method | Route | Role required |
|---|---|---|
| GET | `/products` | Any authenticated user |
| GET | `/products/:id` | Any authenticated user |
| POST | `/products` | Admin |
| PUT | `/products/:id` | Admin |
| PUT | `/products/:id/deactivate` | Admin |

**Stock Movements**

| Method | Route | Role required |
|---|---|---|
| POST | `/products/:id/stock-movements` | Admin, Warehouse |
| GET | `/products/:id/stock-movements` | Admin, Warehouse, Accounts |

**Sales Challans**

| Method | Route | Role required |
|---|---|---|
| POST | `/challans` | Admin, Sales |
| GET | `/challans` | Any authenticated user |
| GET | `/challans/:id` | Any authenticated user |
| PUT | `/challans/:id` | Admin, Sales (only while status is Draft) |
| PUT | `/challans/:id/confirm` | Admin, Warehouse |
| PUT | `/challans/:id/cancel` | Admin |

**System Users**

| Method | Route | Role required |
|---|---|---|
| GET | `/users` | Admin |
| POST | `/users` | Admin |
| PUT | `/users/:id/deactivate` | Admin |

---

## Roles & Permissions

Access is enforced in the backend (via `requireRole` middleware on each route), not just hidden in the UI — a Sales user calling a Warehouse-only endpoint directly gets a `403`, not just a missing button.

**Module-level access matrix**

| Module | Admin | Sales | Warehouse | Accounts |
|---|---|---|---|---|
| Customers | Full CRUD + deactivate | Create, Read, Update | Read only | Read only |
| Products | Full CRUD + deactivate | Read only | Read, Update stock | Read only |
| Stock Movements | Full access | — | Create, Read | Read only |
| Sales Challans (Draft) | Full access | Create, Read, Update (own drafts) | Read only | Read only |
| Sales Challans (Confirm/Cancel) | Full access | — | Confirm, Cancel | — |
| Revenue & Reports | Full access | Own sales performance only | — | Full access |
| System Users | Full CRUD + deactivate | — | — | — |

**How this plays out in the actual workflow:**

A challan is created in **Draft** status by Sales — they can add products, adjust quantities, and edit it freely while it stays a draft. Sales cannot confirm it themselves. Only **Warehouse** can confirm a challan, and confirmation is the point where stock is actually validated and deducted — this split exists so the person creating a sale isn't also the person attesting that the stock physically left the building. Once confirmed, the challan becomes read-only history for Accounts to reconcile against; it cannot be edited, only cancelled by Admin if something was wrong.

This means no single non-admin role can both create a sale and deduct stock unilaterally — every challan that affects inventory has passed through two different people first.

---

## Future Improvements

- Revenue dashboard with daily/monthly charts
- PDF challan export
- Advanced search and filtering across modules
- Automated test coverage
- Responsive mobile layouts for Warehouse and POS-style screens
- **AI assistant for operational queries** — a chatbot (built with LangChain) that lets users ask natural-language questions about their own data — "which customers haven't ordered in 60 days," "what's low on stock right now" — using retrieval-augmented generation (RAG) over the customers, products, and challan tables, so answers are grounded in actual database records rather than the model's general knowledge

---

## Author

Mithun
