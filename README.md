# Operations ERP Portal

A distribution operations platform built for businesses that need one system to run customer relationships, inventory, and sales — instead of juggling a CRM, a spreadsheet for stock, and a separate billing tool. Built with a role-based workspace for Admin, Sales, Warehouse, and Accounts users, so each person sees only what their job actually needs.

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
- Active customer count
- Draft challan count
- Low stock alerts
- Role-specific views — Sales sees deals and quotes, Warehouse sees stock and dispatch, Accounts sees revenue and reconciliation

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

## API Modules

- Auth — register, login
- Customers — CRUD, follow-ups
- Products — CRUD, stock alerts
- Inventory — stock movement logging and history
- Challans — create, edit (while Draft), confirm, cancel

---

## Roles & Permissions

| Role | Access |
|---|---|
| Admin | Full access — all modules, user management, deactivation rights |
| Sales | Customers, draft/edit challans, read-only product catalog |
| Warehouse | Stock movements, challan confirmation, read-only product catalog |
| Accounts | Sales challans (read), revenue and reporting views |

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
