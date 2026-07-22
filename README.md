# Mini ERP + CRM Operations Portal

A role-based operations system for a distribution business — customer relationship management, inventory tracking, and sales challan processing, with dedicated workspaces for Admin, Sales, Warehouse, and Accounts users.

🔗 **Repository:** [https://github.com/mithunmourya/erpportal](https://github.com/mithunmourya/erpportal)  
🌐 **Live frontend:** [https://erpportal-p9hf.vercel.app](https://erpportal-p9hf.vercel.app)  
⚙️ **Live backend API:** [https://erpportal-tswc.onrender.com](https://erpportal-tswc.onrender.com)  

---

## Test credentials

All roles use the same password for testing.

| Role | Email | Password |
|---|---|---|
| Admin | admin@erp.com | admin123 |
| Sales | rahul@erp.com | password123 |
| Warehouse | ramesh@erp.com | password123 |
| Accounts | priya@erp.com | password123 |

*(Note: Ensure you run the initial database setup if testing locally to create the System Admin account).*

---

## Tech stack

- **Backend:** Node.js, Express 5, MySQL (mysql2/promise), JWT authentication
- **Frontend:** React, Vite, Tailwind CSS v4, Recharts
- **Deployment:** 
  - **Database:** Aiven (Cloud MySQL)
  - **Backend:** Render (via Blueprint `render.yaml`)
  - **Frontend:** Vercel (via GitHub integration)

---

## Architecture

The backend follows a strict layered architecture, with every request passing through the same fixed path:

```text
Route → Controller → Service → Model → Database
```

| Layer | Responsibility |
|---|---|
| **Routes** | Maps HTTP verb + path + middleware to a controller function. No logic. |
| **Controllers** | Reads the request, calls the matching service, shapes the HTTP response. No SQL, no business rules. |
| **Services** | All business logic lives here — validation, stock rules, atomic transactions. Never touches `req`/`res`. |
| **Models** | Raw SQL via `mysql2`, one file per entity. No business logic — just query functions. |

This separation means, for example, that confirming a sales challan — checking stock, deducting it, logging the movement, and updating challan status — is coordinated entirely in `salesChallanService.js` as one atomic transaction, while the controller only knows it called `confirmChallan()` and got a result back.

**API response shape** is consistent across all endpoints:
```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "message": "..." }
```

**Soft deletes:** `users`, `customers`, and `products` are never hard-deleted. Each has a `PUT /:id/deactivate` endpoint (Admin-only) that sets `is_active = false`; all list endpoints filter to active records by default.

---

## Database schema

7 tables:

- **`users`** — auth + role (`Admin` / `Sales` / `Warehouse` / `Accounts`)
- **`customers`** — CRM records, linked to `customer_follow_ups`
- **`customer_follow_ups`** — follow-up note history per customer
- **`products`** — catalog + live stock count
- **`stock_movements`** — immutable IN/OUT log per product
- **`sales_challans`** — sales orders (`Draft` / `Confirmed` / `Cancelled`)
- **`challan_items`** — line items, storing a **snapshot** of product name and price at time of sale (so later price changes don't rewrite history)

Full column definitions are in [`backend/src/config/init_db.js`](./backend/src/config/init_db.js).

---

## Roles & permissions

| Role | Can do |
|---|---|
| **Admin** | Full access — all modules, user management, deactivate customers/products/users |
| **Sales** | Manage customers, create and edit draft challans, view products |
| **Warehouse** | Log stock movements, view/confirm challans (stock deduction), view products |
| **Accounts** | View sales challans, revenue and reporting views (Monthly/Daily dashboards) |

---

## Setup

### Local development

```bash
# clone
git clone https://github.com/mithunmourya/erpportal.git
cd erpportal

# backend
cd backend
npm install
cp .env.example .env   # fill in DB credentials + JWT secret
node src/config/init_db.js   # creates all 7 tables
npm run dev

# frontend
cd ../frontend
npm install
npm run dev
```

**Required `.env` variables (backend):**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=erp_portal
JWT_SECRET=my_super_secret_dev_key
PORT=5000
```

### Deployment

- **Database:** Deployed on Aiven Free MySQL tier. Connection strictly requires SSL.
- **Backend:** Deployed to Render using the `render.yaml` Blueprint. Required environment variables (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL=true`, `JWT_SECRET`) are configured in the Render Dashboard.
- **Frontend:** Deployed to Vercel via GitHub integration. The API base URL is set via `VITE_API_URL` environment variable at build time (pointing to the Render deployment).

---

## Known limitations / incomplete parts

- Frontend UI has not been extensively tested on very small mobile viewports for the complex Sales Challan creation screens.
- No external email/SMS notifications for low-stock alerts or follow-up reminders — these are surfaced only in-app natively.
- No pagination limit configuration exposed to the frontend (backend supports it natively, UI currently relies on scrolling/filtering).
- No automated test suite (Jest/Cypress) fully implemented yet — testing has been manual via Postman and browser.

---

## License

MIT License
