-- =============================================================
-- Shelf & Co. Bookstore Management System
-- File: queries.sql
-- Description: Comprehensive SQL queries demonstrating key
--              concepts: JOINs, Subqueries, Aggregates,
--              GROUP BY, HAVING, and complex multi-table JOINs.
-- =============================================================

USE shelf_and_co;

-- =============================================================
-- SECTION 1: INNER JOIN
-- Returns only rows that have matching values in BOTH tables.
-- Rows from either side with no match are excluded entirely.
-- =============================================================

-- -------------------------------------------------------
-- Query 1a: Books with their Author names and Category names
-- Concept : INNER JOIN across three tables
--           (Books JOIN Authors JOIN Categories).
-- -------------------------------------------------------
SELECT
    b.book_id,
    b.isbn,
    b.title,
    a.author_name,
    c.category_name,
    b.price,
    b.stock_quantity,
    b.publication_year,
    b.publisher
FROM Books b
INNER JOIN Authors    a ON b.author_id   = a.author_id
INNER JOIN Categories c ON b.category_id = c.category_id
ORDER BY c.category_name, a.author_name, b.title;


-- -------------------------------------------------------
-- Query 1b: Completed orders with the customer who placed them
-- Concept : INNER JOIN — only orders that have a matching
--           customer row appear (guest/NULL orders excluded).
-- -------------------------------------------------------
SELECT
    o.order_id,
    c.customer_name,
    c.email,
    o.order_date,
    o.total_amount,
    o.payment_method,
    o.status
FROM Orders o
INNER JOIN Customers c ON o.customer_id = c.customer_id
WHERE o.status = 'Completed'
ORDER BY o.order_date DESC;


-- =============================================================
-- SECTION 2: LEFT JOIN
-- Returns ALL rows from the LEFT table; NULL fills right-side
-- columns when no matching row exists in the right table.
-- =============================================================

-- -------------------------------------------------------
-- Query 2a: All customers with their order count
--           (including customers who have never ordered)
-- Concept : LEFT JOIN — every customer appears even if
--           they have zero orders; count falls back to 0.
-- -------------------------------------------------------
SELECT
    c.customer_id,
    c.customer_name,
    c.email,
    c.registration_date,
    COUNT(o.order_id)                AS total_orders,
    COALESCE(SUM(o.total_amount), 0) AS total_spent
FROM Customers c
LEFT JOIN Orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.customer_name, c.email, c.registration_date
ORDER BY total_spent DESC;


-- -------------------------------------------------------
-- Query 2b: All books with the number of times they were ordered
-- Concept : LEFT JOIN chain — books that were never sold
--           still appear with times_ordered = 0.
-- -------------------------------------------------------
SELECT
    b.book_id,
    b.title,
    a.author_name,
    b.price,
    b.stock_quantity,
    COUNT(oi.order_item_id)       AS times_ordered,
    COALESCE(SUM(oi.quantity), 0) AS total_units_sold
FROM Books b
INNER JOIN Authors     a  ON b.author_id = a.author_id
LEFT  JOIN Order_Items oi ON b.book_id   = oi.book_id
GROUP BY b.book_id, b.title, a.author_name, b.price, b.stock_quantity
ORDER BY total_units_sold DESC;


-- =============================================================
-- SECTION 3: NESTED SUBQUERIES
-- A subquery (inner SELECT) used inside the WHERE / HAVING
-- clause of an outer query to compute a threshold or set.
-- =============================================================

-- -------------------------------------------------------
-- Query 3a: Books priced above the average book price
-- Concept : Scalar subquery in WHERE clause.
--           The inner SELECT returns a single value (avg price);
--           the outer query filters rows against that value.
-- -------------------------------------------------------
SELECT
    b.book_id,
    b.title,
    a.author_name,
    c.category_name,
    b.price,
    b.stock_quantity
FROM Books b
INNER JOIN Authors    a ON b.author_id   = a.author_id
INNER JOIN Categories c ON b.category_id = c.category_id
WHERE b.price > (
    SELECT AVG(price)
    FROM   Books
)
ORDER BY b.price DESC;


-- -------------------------------------------------------
-- Query 3b: Customers who spent more than the average customer
-- Concept : Correlated scalar subquery inside HAVING.
--           The innermost query computes per-customer totals;
--           the middle query averages those totals;
--           the outer query finds customers above that average.
-- -------------------------------------------------------
SELECT
    c.customer_id,
    c.customer_name,
    c.email,
    SUM(o.total_amount) AS total_spent
FROM Customers c
INNER JOIN Orders o ON c.customer_id = o.customer_id
WHERE o.status = 'Completed'
GROUP BY c.customer_id, c.customer_name, c.email
HAVING total_spent > (
    SELECT AVG(customer_total)
    FROM (
        SELECT  customer_id,
                SUM(total_amount) AS customer_total
        FROM    Orders
        WHERE   status = 'Completed'
        GROUP BY customer_id
    ) AS spending_per_customer
)
ORDER BY total_spent DESC;


-- -------------------------------------------------------
-- Query 3c: Categories with more books than the average category size
-- Concept : Derived-table subquery to compute average category
--           size; outer GROUP BY + HAVING filters above it.
-- -------------------------------------------------------
SELECT
    c.category_id,
    c.category_name,
    COUNT(b.book_id) AS book_count
FROM Categories c
INNER JOIN Books b ON c.category_id = b.category_id
GROUP BY c.category_id, c.category_name
HAVING book_count > (
    SELECT AVG(books_per_category)
    FROM (
        SELECT  category_id,
                COUNT(book_id) AS books_per_category
        FROM    Books
        GROUP BY category_id
    ) AS category_counts
)
ORDER BY book_count DESC;


-- -------------------------------------------------------
-- Query 3d: Books that have never been sold
-- Concept : NOT IN subquery — the subquery returns every
--           book_id that appears in Order_Items;
--           the outer query finds books absent from that set.
-- -------------------------------------------------------
SELECT
    b.book_id,
    b.title,
    a.author_name,
    c.category_name,
    b.price,
    b.stock_quantity
FROM Books b
INNER JOIN Authors    a ON b.author_id   = a.author_id
INNER JOIN Categories c ON b.category_id = c.category_id
WHERE b.book_id NOT IN (
    SELECT DISTINCT book_id
    FROM   Order_Items
)
ORDER BY b.title;


-- =============================================================
-- SECTION 4: AGGREGATE FUNCTIONS — COUNT, SUM, AVG, MIN, MAX
-- =============================================================

-- -------------------------------------------------------
-- Query 4a: Overall bookstore KPI snapshot
-- Concept : Scalar sub-selects to compute independent
--           aggregates in a single result row.
-- -------------------------------------------------------
SELECT
    (SELECT COUNT(*)                    FROM Books)                                     AS total_books,
    (SELECT COUNT(*)                    FROM Authors)                                   AS total_authors,
    (SELECT COUNT(*)                    FROM Customers)                                 AS total_customers,
    (SELECT COUNT(*)                    FROM Orders WHERE status = 'Completed')         AS completed_orders,
    (SELECT COUNT(*)                    FROM Orders WHERE status = 'Cancelled')         AS cancelled_orders,
    (SELECT ROUND(MIN(price),  2)       FROM Books)                                     AS cheapest_book,
    (SELECT ROUND(MAX(price),  2)       FROM Books)                                     AS most_expensive_book,
    (SELECT ROUND(AVG(price),  2)       FROM Books)                                     AS avg_book_price,
    (SELECT SUM(stock_quantity)         FROM Books)                                     AS total_stock_units,
    (SELECT ROUND(SUM(total_amount), 2) FROM Orders WHERE status = 'Completed')        AS gross_revenue;


-- -------------------------------------------------------
-- Query 4b: Stock summary by category
-- Concept : COUNT, SUM, AVG, MIN, MAX within GROUP BY.
-- -------------------------------------------------------
SELECT
    c.category_name,
    COUNT(b.book_id)               AS number_of_books,
    SUM(b.stock_quantity)          AS total_stock,
    ROUND(AVG(b.stock_quantity), 1) AS avg_stock_per_book,
    MIN(b.stock_quantity)          AS min_stock,
    MAX(b.stock_quantity)          AS max_stock,
    ROUND(AVG(b.price), 2)         AS avg_price,
    MIN(b.price)                   AS min_price,
    MAX(b.price)                   AS max_price
FROM Categories c
INNER JOIN Books b ON c.category_id = b.category_id
GROUP BY c.category_id, c.category_name
ORDER BY number_of_books DESC;


-- =============================================================
-- SECTION 5: GROUP BY — CATEGORY SALES TOTALS
-- Aggregates revenues and units per genre after joining all
-- relevant tables through the foreign-key chain.
-- =============================================================

-- -------------------------------------------------------
-- Query 5a: Total sales revenue and units sold per category
-- Concept : GROUP BY category after joining all tables.
-- -------------------------------------------------------
SELECT
    c.category_name,
    COUNT(DISTINCT o.order_id)   AS number_of_orders,
    SUM(oi.quantity)             AS total_units_sold,
    ROUND(SUM(oi.subtotal), 2)   AS total_revenue,
    ROUND(AVG(oi.unit_price), 2) AS avg_selling_price
FROM Categories c
INNER JOIN Books       b  ON c.category_id = b.category_id
INNER JOIN Order_Items oi ON b.book_id     = oi.book_id
INNER JOIN Orders      o  ON oi.order_id   = o.order_id
WHERE o.status = 'Completed'
GROUP BY c.category_id, c.category_name
ORDER BY total_revenue DESC;


-- -------------------------------------------------------
-- Query 5b: Top 5 best-selling books by units sold
-- Concept : GROUP BY book, ORDER BY aggregate, LIMIT.
-- -------------------------------------------------------
SELECT
    b.title,
    a.author_name,
    c.category_name,
    SUM(oi.quantity)           AS total_units_sold,
    ROUND(SUM(oi.subtotal), 2) AS total_revenue
FROM Books b
INNER JOIN Authors     a  ON b.author_id   = a.author_id
INNER JOIN Categories  c  ON b.category_id = c.category_id
INNER JOIN Order_Items oi ON b.book_id     = oi.book_id
INNER JOIN Orders      o  ON oi.order_id   = o.order_id
WHERE o.status = 'Completed'
GROUP BY b.book_id, b.title, a.author_name, c.category_name
ORDER BY total_units_sold DESC
LIMIT 5;


-- =============================================================
-- SECTION 6: GROUP BY — MONTHLY REVENUE
-- =============================================================

-- -------------------------------------------------------
-- Query 6a: Monthly revenue trend over all recorded orders
-- Concept : GROUP BY derived month expression using DATE_FORMAT;
--           shows order volume and revenue per calendar month.
-- -------------------------------------------------------
SELECT
    DATE_FORMAT(o.order_date, '%Y-%m') AS order_month,
    COUNT(DISTINCT o.order_id)         AS orders_placed,
    COUNT(DISTINCT o.customer_id)      AS unique_customers,
    SUM(oi.quantity)                   AS total_books_sold,
    ROUND(SUM(o.total_amount), 2)      AS monthly_revenue,
    ROUND(AVG(o.total_amount), 2)      AS avg_order_value
FROM Orders o
INNER JOIN Order_Items oi ON o.order_id = oi.order_id
WHERE o.status = 'Completed'
GROUP BY DATE_FORMAT(o.order_date, '%Y-%m')
ORDER BY order_month ASC;


-- -------------------------------------------------------
-- Query 6b: Quarterly revenue breakdown
-- Concept : GROUP BY YEAR() and QUARTER() built-in functions.
-- -------------------------------------------------------
SELECT
    YEAR(o.order_date)             AS year,
    QUARTER(o.order_date)          AS quarter,
    COUNT(DISTINCT o.order_id)     AS total_orders,
    ROUND(SUM(o.total_amount), 2)  AS quarterly_revenue
FROM Orders o
WHERE o.status = 'Completed'
GROUP BY YEAR(o.order_date), QUARTER(o.order_date)
ORDER BY year ASC, quarter ASC;


-- =============================================================
-- SECTION 7: HAVING — FILTER ON AGGREGATED RESULTS
-- WHERE filters individual rows BEFORE grouping.
-- HAVING filters groups AFTER GROUP BY + aggregation.
-- =============================================================

-- -------------------------------------------------------
-- Query 7a: Categories whose completed-order revenue exceeds $50
-- Concept : HAVING with SUM aggregate on a fixed threshold.
-- -------------------------------------------------------
SELECT
    c.category_name,
    COUNT(DISTINCT o.order_id)  AS orders_in_category,
    SUM(oi.quantity)            AS units_sold,
    ROUND(SUM(oi.subtotal), 2)  AS category_revenue
FROM Categories c
INNER JOIN Books       b  ON c.category_id = b.category_id
INNER JOIN Order_Items oi ON b.book_id     = oi.book_id
INNER JOIN Orders      o  ON oi.order_id   = o.order_id
WHERE o.status = 'Completed'
GROUP BY c.category_id, c.category_name
HAVING category_revenue > 50
ORDER BY category_revenue DESC;


-- -------------------------------------------------------
-- Query 7b: Authors whose books generated more than $30 in sales
-- Concept : HAVING with SUM on joined sales data grouped by author.
-- -------------------------------------------------------
SELECT
    a.author_name,
    COUNT(DISTINCT b.book_id)  AS distinct_titles_sold,
    SUM(oi.quantity)           AS total_copies_sold,
    ROUND(SUM(oi.subtotal), 2) AS author_revenue
FROM Authors a
INNER JOIN Books       b  ON a.author_id = b.author_id
INNER JOIN Order_Items oi ON b.book_id   = oi.book_id
INNER JOIN Orders      o  ON oi.order_id = o.order_id
WHERE o.status = 'Completed'
GROUP BY a.author_id, a.author_name
HAVING author_revenue > 30
ORDER BY author_revenue DESC;


-- -------------------------------------------------------
-- Query 7c: Customers who have placed more than 1 completed order
-- Concept : HAVING COUNT(order_id) > threshold to identify
--           repeat buyers and their lifetime value.
-- -------------------------------------------------------
SELECT
    c.customer_id,
    c.customer_name,
    c.email,
    COUNT(o.order_id)             AS number_of_orders,
    ROUND(SUM(o.total_amount), 2) AS lifetime_value
FROM Customers c
INNER JOIN Orders o ON c.customer_id = o.customer_id
WHERE o.status = 'Completed'
GROUP BY c.customer_id, c.customer_name, c.email
HAVING number_of_orders > 1
ORDER BY number_of_orders DESC, lifetime_value DESC;


-- -------------------------------------------------------
-- Query 7d: Payment methods used in more than 3 completed orders
-- Concept : HAVING COUNT on a non-primary dimension.
-- -------------------------------------------------------
SELECT
    payment_method,
    COUNT(order_id)             AS times_used,
    ROUND(SUM(total_amount), 2) AS total_revenue,
    ROUND(AVG(total_amount), 2) AS avg_order_value
FROM Orders
WHERE status = 'Completed'
GROUP BY payment_method
HAVING times_used > 3
ORDER BY total_revenue DESC;


-- =============================================================
-- SECTION 8: COMPLEX MULTI-TABLE JOINS
-- Five-table joins producing rich, denormalised result sets
-- suitable for invoices, management reports, and dashboards.
-- =============================================================

-- -------------------------------------------------------
-- Query 8a: Full order receipt view — every line item in context
-- Concept : LEFT JOIN for customer (handles guest orders) + four
--           INNER JOINs to bring in item, book, author, category.
-- -------------------------------------------------------
SELECT
    o.order_id,
    DATE(o.order_date)            AS order_date,
    o.status                      AS order_status,
    o.payment_method,
    COALESCE(c.customer_name, 'Walk-in Guest') AS customer_name,
    c.email                       AS customer_email,
    c.phone                       AS customer_phone,
    b.isbn,
    b.title                       AS book_title,
    a.author_name,
    cat.category_name,
    oi.quantity,
    oi.unit_price,
    oi.subtotal,
    o.total_amount                AS order_total
FROM Orders o
LEFT  JOIN Customers   c   ON o.customer_id  = c.customer_id
INNER JOIN Order_Items oi  ON o.order_id     = oi.order_id
INNER JOIN Books       b   ON oi.book_id     = b.book_id
INNER JOIN Authors     a   ON b.author_id    = a.author_id
INNER JOIN Categories  cat ON b.category_id  = cat.category_id
ORDER BY o.order_date DESC, o.order_id, oi.order_item_id;


-- -------------------------------------------------------
-- Query 8b: Individual customer purchase history
-- Concept : Multi-table JOIN filtered to a single customer
--           (change the customer_id value as needed).
-- -------------------------------------------------------
SELECT
    c.customer_name,
    o.order_id,
    DATE(o.order_date)            AS purchase_date,
    o.payment_method,
    b.title                       AS book_title,
    a.author_name,
    cat.category_name,
    oi.quantity,
    oi.unit_price,
    oi.subtotal
FROM Customers c
INNER JOIN Orders      o   ON c.customer_id  = o.customer_id
INNER JOIN Order_Items oi  ON o.order_id     = oi.order_id
INNER JOIN Books       b   ON oi.book_id     = b.book_id
INNER JOIN Authors     a   ON b.author_id    = a.author_id
INNER JOIN Categories  cat ON b.category_id  = cat.category_id
WHERE o.status      = 'Completed'
  AND c.customer_id = 1   -- Change to desired customer_id
ORDER BY o.order_date DESC;


-- -------------------------------------------------------
-- Query 8c: Best-selling books report with current stock
-- Concept : JOIN + GROUP BY + ORDER BY aggregate + LEFT JOIN
--           so unsold books still appear with zero values.
-- -------------------------------------------------------
SELECT
    b.book_id,
    b.isbn,
    b.title,
    a.author_name,
    cat.category_name,
    b.price                       AS current_price,
    b.stock_quantity              AS current_stock,
    COUNT(DISTINCT oi.order_id)   AS orders_containing_book,
    COALESCE(SUM(oi.quantity), 0) AS total_units_sold,
    ROUND(COALESCE(SUM(oi.subtotal), 0), 2) AS total_revenue_generated,
    ROUND(AVG(oi.unit_price), 2)  AS avg_selling_price
FROM Books b
INNER JOIN Authors     a   ON b.author_id    = a.author_id
INNER JOIN Categories  cat ON b.category_id  = cat.category_id
LEFT  JOIN Order_Items oi  ON b.book_id      = oi.book_id
LEFT  JOIN Orders      o   ON oi.order_id    = o.order_id
                           AND o.status      = 'Completed'
GROUP BY b.book_id, b.isbn, b.title, a.author_name, cat.category_name, b.price, b.stock_quantity
ORDER BY total_units_sold DESC, total_revenue_generated DESC;


-- -------------------------------------------------------
-- Query 8d: Low-stock alert — books with < 5 units that have sold
-- Concept : JOIN with WHERE on stock threshold to surface
--           inventory risk for titles with proven demand.
-- -------------------------------------------------------
SELECT
    b.book_id,
    b.title,
    a.author_name,
    b.stock_quantity              AS remaining_stock,
    SUM(oi.quantity)              AS total_sold,
    ROUND(SUM(oi.subtotal), 2)    AS revenue_earned
FROM Books b
INNER JOIN Authors     a  ON b.author_id = a.author_id
INNER JOIN Order_Items oi ON b.book_id   = oi.book_id
INNER JOIN Orders      o  ON oi.order_id = o.order_id
WHERE b.stock_quantity < 5
  AND o.status = 'Completed'
GROUP BY b.book_id, b.title, a.author_name, b.stock_quantity
ORDER BY b.stock_quantity ASC, total_sold DESC;


-- -------------------------------------------------------
-- Query 8e: Revenue contribution by payment method per month
-- Concept : GROUP BY two dimensions (month + payment method)
--           to reveal channel trends over time.
-- -------------------------------------------------------
SELECT
    DATE_FORMAT(o.order_date, '%Y-%m') AS month,
    o.payment_method,
    COUNT(o.order_id)                  AS orders,
    ROUND(SUM(o.total_amount), 2)      AS revenue
FROM Orders o
WHERE o.status = 'Completed'
GROUP BY DATE_FORMAT(o.order_date, '%Y-%m'), o.payment_method
ORDER BY month ASC, revenue DESC;


-- -------------------------------------------------------
-- Query 8f: Author performance dashboard
-- Concept : Full five-table JOIN aggregated by author —
--           books, copies sold, revenue, avg price.
-- -------------------------------------------------------
SELECT
    a.author_id,
    a.author_name,
    COUNT(DISTINCT b.book_id)      AS books_in_catalog,
    COUNT(DISTINCT oi.order_id)    AS orders_with_their_books,
    COALESCE(SUM(oi.quantity), 0)  AS total_copies_sold,
    ROUND(COALESCE(SUM(oi.subtotal), 0), 2) AS total_revenue,
    ROUND(AVG(b.price), 2)         AS avg_list_price,
    MIN(b.price)                   AS cheapest_title,
    MAX(b.price)                   AS priciest_title
FROM Authors a
INNER JOIN Books       b  ON a.author_id = b.author_id
LEFT  JOIN Order_Items oi ON b.book_id   = oi.book_id
LEFT  JOIN Orders      o  ON oi.order_id = o.order_id
                          AND o.status   = 'Completed'
GROUP BY a.author_id, a.author_name
ORDER BY total_revenue DESC;
