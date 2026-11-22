# Shelf & Co. — Bookstore Management System

A complete, production-quality bookstore management system built as a college Database Systems mini project.

---

## Introduction

**Shelf & Co.** is a full-stack web application for managing a bookstore's inventory, customers, sales, and reporting. It features a refined, editorial design inspired by premium independent bookstores, and is backed by a fully relational MySQL 8 database.

---

## Objectives

- Demonstrate all core SQL concepts: CREATE, INSERT, UPDATE, DELETE, JOIN, subqueries, aggregate functions, GROUP BY, HAVING
- Build a functional, real-world application connected to MySQL
- Implement CRUD operations for all entities
- Implement search, filtering, pagination, and sorting
- Generate meaningful database-driven reports
- Use MySQL transactions for atomic order processing

---

## Technology Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend  | Node.js, Express.js |
| Database | MySQL 8 |
| DB Driver| mysql2 (parameterized queries) |
| Charts   | Chart.js 4 |
| Icons    | Lucide Icons |
| Fonts    | DM Sans + Manrope (Google Fonts) |

---

## Features

### Book Inventory
- Full CRUD with modal forms
- Search by title, ISBN, author
- Filter by category, author, price range, stock status
- Sortable columns (title, price, stock, year)
- Low-stock and out-of-stock indicators
- Pagination

### Authors
- Full CRUD
- Book count per author
- View all books by an author

### Categories
- Full CRUD
- Book count per category
- FK-enforced deletion protection

### Customers
- Full CRUD
- Order history per customer
- Statistics: total orders, total spent, average order value

### Sales & Orders
- Create sales with book search and cart
- Support for walk-in customers
- Payment method selection
- MySQL transaction-based order processing with stock reduction
- Order cancellation with stock restoration
- Order detail view

### Reports (10 reports)
1. Sales Summary (totals)
2. Monthly Sales (GROUP BY month)
3. Top-Selling Books (with HAVING filter)
4. Category Sales (with HAVING and pie chart)
5. Customer Spending (with HAVING min-orders filter)
6. Inventory Report (stock value)
7. Low-Stock Report (configurable threshold)
8. Author Report
9. Books Above Average Price (scalar subquery)
10. Unsold Books (NOT IN subquery)

### Dashboard
- Live stats from MySQL
- Monthly revenue bar chart
- Orders over time line chart
- Sales by category doughnut chart
- Top-selling books horizontal bar chart
- Recent orders table
- Low-stock alert table

---

## Database Design

### ER Diagram (Textual)

```
Authors ──< Books >── Categories
              |
         Order_Items >── Orders >── Customers
```

### Relational Schema

```
Authors(author_id PK, author_name, biography, created_at)
Categories(category_id PK, category_name UNIQUE, description)
Books(book_id PK, isbn UNIQUE, title, author_id FK, category_id FK, price, stock_quantity, publication_year, publisher, created_at)
Customers(customer_id PK, customer_name, email UNIQUE, phone UNIQUE, address, registration_date)
Orders(order_id PK, customer_id FK NULL, order_date, total_amount, payment_method, status)
Order_Items(order_item_id PK, order_id FK, book_id FK, quantity, unit_price, subtotal)
```

### Relationships
- One **Author** → many **Books** (RESTRICT on delete)
- One **Category** → many **Books** (RESTRICT on delete)
- One **Customer** → many **Orders** (SET NULL on delete)
- One **Order** → many **Order_Items** (CASCADE on delete)
- One **Book** → many **Order_Items** (RESTRICT on delete)

---

## Setup Instructions

### Prerequisites

1. **Node.js** (v18 or later): https://nodejs.org/
2. **MySQL 8**: https://dev.mysql.com/downloads/mysql/

---

### Step 1: Clone / Open the Project

Open a terminal and navigate to the project folder:
```
cd C:\Users\Mallika Naik\.gemini\antigravity\scratch\shelf-and-co
```

---

### Step 2: Configure Environment

Copy the example env file:
```
copy .env.example .env
```

Open `.env` and fill in your MySQL credentials:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_password
DB_NAME=shelf_and_co
PORT=3000
```

---

### Step 3: Create the Database and Load Data

Open MySQL command line or MySQL Workbench and run:

```sql
-- Method 1: Command line (adjust path as needed)
mysql -u root -p < database\schema.sql
mysql -u root -p < database\seed.sql
```

Or open MySQL Workbench, open `database/schema.sql` and execute it, then open `database/seed.sql` and execute it.

---

### Step 4: Install Node.js Dependencies

```
npm install
```

---

### Step 5: Start the Application

**Development mode (auto-restart on changes):**
```
npm run dev
```

**Production mode:**
```
npm start
```

---

### Step 6: Open the Application

Navigate to: **http://localhost:3000**

---

## API Routes

### Books
| Method | Route | Description |
|--------|-------|-------------|
| GET    | /api/books | Get all books (with filters, pagination) |
| GET    | /api/books/:id | Get a single book |
| POST   | /api/books | Create a book |
| PUT    | /api/books/:id | Update a book |
| DELETE | /api/books/:id | Delete a book |

### Authors
| Method | Route | Description |
|--------|-------|-------------|
| GET    | /api/authors | Get all authors (paginated) |
| GET    | /api/authors/all | Get all authors (simple list for dropdowns) |
| GET    | /api/authors/:id | Get author with their books |
| POST   | /api/authors | Create author |
| PUT    | /api/authors/:id | Update author |
| DELETE | /api/authors/:id | Delete author |

### Categories
| Method | Route | Description |
|--------|-------|-------------|
| GET    | /api/categories | Get all categories |
| GET    | /api/categories/:id | Get category with books |
| POST   | /api/categories | Create category |
| PUT    | /api/categories/:id | Update category |
| DELETE | /api/categories/:id | Delete category |

### Customers
| Method | Route | Description |
|--------|-------|-------------|
| GET    | /api/customers | Get all customers |
| GET    | /api/customers/:id | Get customer with order history |
| POST   | /api/customers | Create customer |
| PUT    | /api/customers/:id | Update customer |
| DELETE | /api/customers/:id | Delete customer |

### Orders
| Method | Route | Description |
|--------|-------|-------------|
| GET    | /api/orders | Get all orders (filterable) |
| GET    | /api/orders/:id | Get order with items |
| POST   | /api/orders | Create new sale (transaction) |
| PATCH  | /api/orders/:id/cancel | Cancel order, restore stock |

### Dashboard
| Method | Route | Description |
|--------|-------|-------------|
| GET    | /api/dashboard/stats | Key statistics |
| GET    | /api/dashboard/monthly-revenue | Monthly chart data |
| GET    | /api/dashboard/category-sales | Category chart data |
| GET    | /api/dashboard/top-books | Top-selling books |
| GET    | /api/dashboard/recent-orders | Recent 8 orders |
| GET    | /api/dashboard/low-stock | Low-stock books |

### Reports
| Method | Route | Description |
|--------|-------|-------------|
| GET    | /api/reports/summary | Sales summary totals |
| GET    | /api/reports/monthly-sales | Monthly breakdown |
| GET    | /api/reports/top-books | Bestsellers (HAVING) |
| GET    | /api/reports/category-sales | By category (HAVING) |
| GET    | /api/reports/customer-spending | By customer (HAVING) |
| GET    | /api/reports/inventory | Full inventory |
| GET    | /api/reports/low-stock | Low-stock books |
| GET    | /api/reports/author-report | Authors & sales |
| GET    | /api/reports/above-average-price | Subquery demo |
| GET    | /api/reports/unsold-books | NOT IN subquery demo |

---

## SQL Concepts Implemented

| Concept | Where Used |
|---------|-----------|
| CREATE DATABASE / TABLE | database/schema.sql |
| INSERT | database/seed.sql, all POST routes |
| UPDATE | All PUT routes |
| DELETE | All DELETE routes |
| INNER JOIN | Books with Authors+Categories, Orders with Items |
| LEFT JOIN | Customers with Orders (shows zero-order customers) |
| Subquery (scalar) | Above-average price report |
| Subquery (NOT IN) | Unsold books report |
| Subquery (HAVING) | Customer spending > average |
| COUNT() | Dashboard stats, author/category counts |
| SUM() | Revenue totals, stock values |
| AVG() | Average order value, average price |
| MIN() / MAX() | Price statistics |
| GROUP BY | Monthly, category, author, book reports |
| HAVING | Category sales > threshold, customers with N+ orders |
| Transactions | Order creation + cancellation |
| Parameterized queries | All queries via mysql2 prepared statements |
| CHECK constraints | price > 0, stock >= 0, quantity > 0 |
| FOREIGN KEY | All cross-table references |
| ON DELETE RESTRICT | Books referencing authors/categories |
| ON DELETE SET NULL | Orders referencing deleted customers |
| ON DELETE CASCADE | Order_Items cascade with order deletion |
| UNIQUE | isbn, email, phone, category_name |

---

## Project Structure

```
shelf-and-co/
├── backend/
│   ├── server.js
│   ├── config/db.js
│   ├── routes/
│   │   ├── bookRoutes.js
│   │   ├── authorRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── customerRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── reportRoutes.js
│   │   └── dashboardRoutes.js
│   ├── controllers/
│   │   ├── bookController.js
│   │   ├── authorController.js
│   │   ├── categoryController.js
│   │   ├── customerController.js
│   │   ├── orderController.js
│   │   ├── reportController.js
│   │   └── dashboardController.js
│   ├── middleware/errorHandler.js
│   └── utils/validation.js
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── app.js        (router, API client, dashboard)
│       ├── books.js
│       ├── authors.js
│       ├── categories.js
│       ├── customers.js
│       ├── orders.js
│       └── reports.js
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── queries.sql
├── .env.example
├── package.json
└── README.md
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "MySQL connection failed" | Check `.env` credentials and ensure MySQL is running |
| "Cannot find module mysql2" | Run `npm install` |
| Port 3000 already in use | Change `PORT` in `.env` to 3001 etc. |
| seed.sql errors | Make sure schema.sql was run first |
| Charts not rendering | Ensure internet access for CDN fonts/scripts, or add offline fallbacks |

---

## Notes for Viva

- **Transactions**: Order creation wraps INSERT into Orders + INSERT into Order_Items + UPDATE Books stock into a single MySQL transaction. If any step fails, everything rolls back.
- **Parameterized queries**: All SQL uses `?` placeholders via mysql2, preventing SQL injection.
- **Referential integrity**: The database uses RESTRICT/SET NULL/CASCADE appropriately so historical data is never silently corrupted.
- **Subqueries**: Two reports explicitly demonstrate subqueries — "Above Average Price" (scalar subquery in WHERE) and "Unsold Books" (NOT IN subquery).
- **HAVING**: Reports for Category Sales and Customer Spending include configurable HAVING thresholds.

