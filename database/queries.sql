-- =============================================================
-- Shelf & Co. Bookstore Management System
-- File: queries.sql
-- Description: Comprehensive SQL queries demonstrating key
--              concepts: JOINs, Subqueries, Aggregates,
--              GROUP BY, HAVING, and complex multi-table JOINs.
--              Updated for M:N schema (Book_Authors junction table).
-- =============================================================

USE shelf_and_co;

-- =============================================================
-- SECTION 1: INNER JOIN
-- Returns only rows that have matching values in BOTH tables.
-- Rows from either side with no match are excluded entirely.
-- =============================================================

-- -------------------------------------------------------
-- Query 1a: Books with their Author names and Category names
-- Concept : INNER JOIN across four tables
--           Books -> Book_Authors -> Authors, Books -> Categories
--           GROUP_CONCAT aggregates multiple co-authors into one
--           comma-separated string per book.
-- -------------------------------------------------------
SELECT
    b.book_id,
    b.isbn,
    b.title,
    GROUP_CONCAT(DISTINCT a.author_name SEPARATOR ', ') AS authors,
    c.category_name,
    b.price,
    b.stock_quantity,
    b.publication_year,
    b.publisher
FROM Books b
INNER JOIN Book_Authors ba ON b.book_id    = ba.book_id
INNER JOIN Authors      a  ON ba.author_id = a.author_id
INNER JOIN Categories   c  ON b.category_id = c.category_id
GROUP BY b.book_id, b.isbn, b.title, c.category_name,
         b.price, b.stock_quantity, b.publication_year, b.publisher
ORDER BY c.category_name, b.title;


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
--           Uses Book_Authors for the author join.
-- -------------------------------------------------------
SELECT
    b.book_id,
    b.title,
    GROUP_CONCAT(DISTINCT a.author_name SEPARATOR ', ') AS authors,
    b.price,
    b.stock_quantity,
    COUNT(DISTINCT oi.order_item_id)  AS times_ordered,
    COALESCE(SUM(oi.quantity), 0)     AS total_units_sold
FROM Books b
INNER JOIN Book_Authors ba ON b.book_id    = ba.book_id
INNER JOIN Authors      a  ON ba.author_id = a.author_id
LEFT  JOIN Order_Items oi  ON b.book_id    = oi.book_id
GROUP BY b.book_id, b.title, b.price, b.stock_quantity
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
    GROUP_CONCAT(DISTINCT a.author_name SEPARATOR ', ') AS authors,
    c.category_name,
    b.price,
    b.stock_quantity
FROM Books b
INNER JOIN Book_Authors ba ON b.book_id     = ba.book_id
INNER JOIN Authors      a  ON ba.author_id  = a.author_id
INNER JOIN Categories   c  ON b.category_id = c.category_id
WHERE b.price > (
    SELECT AVG(price)
    FROM   Books
)
GROUP BY b.book_id, b.title, c.category_name, b.price, b.stock_quantity
ORDER BY b.price DESC;


-- -------------------------------------------------------
-- Query 3b: Customers who spent more than the average customer
-- Concept : Correlated scalar subquery inside HAVING.
--           Outer query groups by customer; HAVING filters
--           groups whose SUM exceeds the per-customer average.
-- -------------------------------------------------------
SELECT
    cu.customer_id,
    cu.customer_name,
    cu.email,
    COUNT(o.order_id)   AS total_orders,
    SUM(o.total_amount) AS total_spent
FROM Customers cu
INNER JOIN Orders o ON cu.customer_id = o.customer_id
WHERE o.status = 'Completed'
GROUP BY cu.customer_id, cu.customer_name, cu.email
HAVING SUM(o.total_amount) > (
    SELECT AVG(sub.customer_total)
    FROM (
        SELECT SUM(total_amount) AS customer_total
        FROM Orders
        WHERE status = 'Completed'
        GROUP BY customer_id
    ) AS sub
)
ORDER BY total_spent DESC;


-- -------------------------------------------------------
-- Query 3c: Books that have never been ordered (NOT IN subquery)
-- Concept : NOT IN with a subquery — identifies books with no
--           sales records at all.
-- -------------------------------------------------------
SELECT
    b.book_id,
    b.isbn,
    b.title,
    GROUP_CONCAT(DISTINCT a.author_name SEPARATOR ', ') AS authors,
    c.category_name,
    b.price,
    b.stock_quantity
FROM Books b
INNER JOIN Book_Authors ba ON b.book_id     = ba.book_id
INNER JOIN Authors      a  ON ba.author_id  = a.author_id
INNER JOIN Categories   c  ON b.category_id = c.category_id
WHERE b.book_id NOT IN (SELECT DISTINCT book_id FROM Order_Items)
GROUP BY b.book_id, b.isbn, b.title, c.category_name, b.price, b.stock_quantity
ORDER BY b.title;


-- =============================================================
-- SECTION 4: AGGREGATE FUNCTIONS
-- SUM, COUNT, AVG, MIN, MAX applied to grouped data.
-- =============================================================

-- -------------------------------------------------------
-- Query 4a: Total revenue, orders, and average order value
-- Concept : Aggregate functions on the whole Orders table;
--           COALESCE prevents NULL when no orders exist.
-- -------------------------------------------------------
SELECT
    COUNT(order_id)                       AS total_orders,
    COALESCE(SUM(total_amount),  0)       AS total_revenue,
    ROUND(COALESCE(AVG(total_amount), 0), 2) AS avg_order_value,
    MIN(total_amount)                     AS min_order,
    MAX(total_amount)                     AS max_order
FROM Orders
WHERE status = 'Completed';


-- -------------------------------------------------------
-- Query 4b: Price statistics per category
-- Concept : GROUP BY + aggregate to summarise per category.
-- -------------------------------------------------------
SELECT
    c.category_name,
    COUNT(b.book_id)         AS total_books,
    ROUND(AVG(b.price), 2)   AS avg_price,
    MIN(b.price)             AS min_price,
    MAX(b.price)             AS max_price,
    SUM(b.stock_quantity)    AS total_stock
FROM Categories c
LEFT JOIN Books b ON c.category_id = b.category_id
GROUP BY c.category_id, c.category_name
ORDER BY avg_price DESC;


-- =============================================================
-- SECTION 5: GROUP BY and HAVING
-- GROUP BY aggregates rows into groups; HAVING filters groups
-- (unlike WHERE, which filters individual rows before grouping).
-- =============================================================

-- -------------------------------------------------------
-- Query 5a: Categories with more than 2 books in inventory
-- Concept : GROUP BY category + HAVING on COUNT.
-- -------------------------------------------------------
SELECT
    c.category_id,
    c.category_name,
    COUNT(b.book_id)      AS book_count,
    SUM(b.stock_quantity) AS total_stock
FROM Categories c
INNER JOIN Books b ON c.category_id = b.category_id
GROUP BY c.category_id, c.category_name
HAVING COUNT(b.book_id) > 2
ORDER BY book_count DESC;


-- -------------------------------------------------------
-- Query 5b: Authors with total revenue above ₹100
-- Concept : HAVING filters the aggregated revenue, not rows.
--           Uses Book_Authors for the M:N join chain.
-- -------------------------------------------------------
SELECT
    a.author_id,
    a.author_name,
    COUNT(DISTINCT b.book_id)      AS books_in_catalog,
    COALESCE(SUM(oi.quantity), 0)  AS total_copies_sold,
    ROUND(COALESCE(SUM(oi.subtotal), 0), 2) AS total_revenue
FROM Authors a
INNER JOIN Book_Authors ba ON a.author_id  = ba.author_id
INNER JOIN Books        b  ON ba.book_id   = b.book_id
LEFT  JOIN Order_Items  oi ON b.book_id    = oi.book_id
LEFT  JOIN Orders       o  ON oi.order_id  = o.order_id
                           AND o.status = 'Completed'
GROUP BY a.author_id, a.author_name
HAVING COALESCE(SUM(oi.subtotal), 0) > 100
ORDER BY total_revenue DESC;


-- -------------------------------------------------------
-- Query 5c: Monthly revenue with HAVING to show months > ₹30
-- Concept : GROUP BY time dimension + HAVING on revenue total.
-- -------------------------------------------------------
SELECT
    DATE_FORMAT(o.order_date, '%Y-%m')  AS month,
    DATE_FORMAT(o.order_date, '%b %Y')  AS month_label,
    COUNT(o.order_id)                   AS order_count,
    ROUND(SUM(o.total_amount), 2)       AS revenue
FROM Orders o
WHERE o.status = 'Completed'
GROUP BY DATE_FORMAT(o.order_date, '%Y-%m'), DATE_FORMAT(o.order_date, '%b %Y')
HAVING SUM(o.total_amount) > 30
ORDER BY month ASC;


-- =============================================================
-- SECTION 6: M:N MANY-TO-MANY QUERIES (Book_Authors junction)
-- Demonstrates the M:N co-authorship design for the viva.
-- =============================================================

-- -------------------------------------------------------
-- Query 6a: All books with their complete author list
-- Concept : GROUP_CONCAT aggregates multiple author rows
--           for the same book into a single comma-separated
--           string — the standard pattern for M:N display.
-- -------------------------------------------------------
SELECT
    b.book_id,
    b.title,
    GROUP_CONCAT(
        a.author_name
        ORDER BY ba.author_role ASC, a.author_name ASC
        SEPARATOR ', '
    ) AS authors,
    GROUP_CONCAT(ba.author_role ORDER BY ba.author_role SEPARATOR ', ') AS roles
FROM Books b
JOIN Book_Authors ba ON b.book_id    = ba.book_id
JOIN Authors      a  ON ba.author_id = a.author_id
GROUP BY b.book_id, b.title
ORDER BY b.title;


-- -------------------------------------------------------
-- Query 6b: Show only books with multiple authors (co-authored)
-- Concept : HAVING COUNT > 1 filters books that appear more
--           than once in Book_Authors (i.e., have co-authors).
-- -------------------------------------------------------
SELECT
    b.book_id,
    b.title,
    COUNT(ba.author_id)  AS author_count,
    GROUP_CONCAT(a.author_name ORDER BY ba.author_role SEPARATOR ', ') AS authors
FROM Books b
JOIN Book_Authors ba ON b.book_id    = ba.book_id
JOIN Authors      a  ON ba.author_id = a.author_id
GROUP BY b.book_id, b.title
HAVING COUNT(ba.author_id) > 1;


-- -------------------------------------------------------
-- Query 6c: Find all books written by a specific author
--           (by name — demonstrates the M:N lookup direction)
-- -------------------------------------------------------
SELECT
    b.book_id, b.title, b.isbn, c.category_name, b.price, b.stock_quantity
FROM Books b
JOIN Book_Authors ba ON b.book_id     = ba.book_id
JOIN Authors      a  ON ba.author_id  = a.author_id
JOIN Categories   c  ON b.category_id = c.category_id
WHERE a.author_name = 'George Orwell'   -- Change author name as needed
ORDER BY b.title;


-- =============================================================
-- SECTION 7: MULTI-TABLE JOINS (complex reporting queries)
-- Combining 5+ tables to produce business intelligence reports.
-- =============================================================

-- -------------------------------------------------------
-- Query 7a: Full order line-item details
-- Concept : 6-table JOIN — customer + order + items + book +
--           Book_Authors + category — the most complex join
--           in the system.
-- -------------------------------------------------------
SELECT
    o.order_id,
    COALESCE(cu.customer_name, 'Walk-in')  AS customer,
    DATE(o.order_date)                      AS order_date,
    o.payment_method,
    o.status,
    b.title                                 AS book_title,
    GROUP_CONCAT(DISTINCT a.author_name SEPARATOR ', ') AS authors,
    cat.category_name,
    oi.quantity,
    oi.unit_price,
    oi.subtotal
FROM Orders o
LEFT  JOIN Customers    cu  ON o.customer_id  = cu.customer_id
INNER JOIN Order_Items  oi  ON o.order_id     = oi.order_id
INNER JOIN Books        b   ON oi.book_id     = b.book_id
INNER JOIN Book_Authors ba  ON b.book_id      = ba.book_id
INNER JOIN Authors      a   ON ba.author_id   = a.author_id
INNER JOIN Categories   cat ON b.category_id  = cat.category_id
GROUP BY o.order_id, cu.customer_name, o.order_date, o.payment_method,
         o.status, b.title, cat.category_name, oi.quantity, oi.unit_price, oi.subtotal
ORDER BY o.order_date DESC, o.order_id, oi.order_item_id;


-- -------------------------------------------------------
-- Query 7b: Individual customer purchase history
-- Concept : Multi-table JOIN filtered to a single customer.
-- -------------------------------------------------------
SELECT
    c.customer_name,
    o.order_id,
    DATE(o.order_date)   AS purchase_date,
    o.payment_method,
    b.title              AS book_title,
    GROUP_CONCAT(DISTINCT a.author_name SEPARATOR ', ') AS authors,
    cat.category_name,
    oi.quantity,
    oi.unit_price,
    oi.subtotal
FROM Customers     c
INNER JOIN Orders       o   ON c.customer_id  = o.customer_id
INNER JOIN Order_Items  oi  ON o.order_id     = oi.order_id
INNER JOIN Books        b   ON oi.book_id     = b.book_id
INNER JOIN Book_Authors ba  ON b.book_id      = ba.book_id
INNER JOIN Authors      a   ON ba.author_id   = a.author_id
INNER JOIN Categories   cat ON b.category_id  = cat.category_id
WHERE o.status      = 'Completed'
  AND c.customer_id = 1   -- Change to desired customer_id
GROUP BY c.customer_name, o.order_id, o.order_date, o.payment_method,
         b.title, cat.category_name, oi.quantity, oi.unit_price, oi.subtotal
ORDER BY o.order_date DESC;


-- -------------------------------------------------------
-- Query 7c: Best-selling books report with current stock
-- Concept : JOIN + GROUP BY + ORDER BY aggregate + LEFT JOIN
--           so unsold books still appear with zero values.
-- -------------------------------------------------------
SELECT
    b.book_id,
    b.isbn,
    b.title,
    GROUP_CONCAT(DISTINCT a.author_name SEPARATOR ', ') AS authors,
    cat.category_name,
    b.price                        AS current_price,
    b.stock_quantity               AS current_stock,
    COUNT(DISTINCT oi.order_id)    AS orders_containing_book,
    COALESCE(SUM(oi.quantity), 0)  AS total_units_sold,
    ROUND(COALESCE(SUM(oi.subtotal), 0), 2) AS total_revenue_generated,
    ROUND(AVG(oi.unit_price), 2)   AS avg_selling_price
FROM Books b
INNER JOIN Book_Authors ba  ON b.book_id      = ba.book_id
INNER JOIN Authors      a   ON ba.author_id   = a.author_id
INNER JOIN Categories   cat ON b.category_id  = cat.category_id
LEFT  JOIN Order_Items  oi  ON b.book_id      = oi.book_id
LEFT  JOIN Orders       o   ON oi.order_id    = o.order_id
                            AND o.status      = 'Completed'
GROUP BY b.book_id, b.isbn, b.title, cat.category_name, b.price, b.stock_quantity
ORDER BY total_units_sold DESC, total_revenue_generated DESC;


-- -------------------------------------------------------
-- Query 7d: Low-stock alert — books with < 5 units that have sold
-- Concept : JOIN with WHERE on stock threshold.
-- -------------------------------------------------------
SELECT
    b.book_id,
    b.title,
    GROUP_CONCAT(DISTINCT a.author_name SEPARATOR ', ') AS authors,
    b.stock_quantity              AS remaining_stock,
    SUM(oi.quantity)              AS total_sold,
    ROUND(SUM(oi.subtotal), 2)    AS revenue_earned
FROM Books b
INNER JOIN Book_Authors ba ON b.book_id    = ba.book_id
INNER JOIN Authors      a  ON ba.author_id = a.author_id
INNER JOIN Order_Items  oi ON b.book_id    = oi.book_id
INNER JOIN Orders       o  ON oi.order_id  = o.order_id
WHERE b.stock_quantity < 5
  AND o.status = 'Completed'
GROUP BY b.book_id, b.title, b.stock_quantity
ORDER BY b.stock_quantity ASC, total_sold DESC;


-- -------------------------------------------------------
-- Query 7e: Revenue contribution by payment method per month
-- Concept : GROUP BY two dimensions (month + payment method).
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
-- Query 7f: Author performance dashboard
-- Concept : Full join chain via Book_Authors + aggregation.
-- -------------------------------------------------------
SELECT
    a.author_id,
    a.author_name,
    COUNT(DISTINCT b.book_id)       AS books_in_catalog,
    COUNT(DISTINCT oi.order_id)     AS orders_with_their_books,
    COALESCE(SUM(oi.quantity), 0)   AS total_copies_sold,
    ROUND(COALESCE(SUM(oi.subtotal), 0), 2) AS total_revenue,
    ROUND(AVG(b.price), 2)          AS avg_list_price,
    MIN(b.price)                    AS cheapest_title,
    MAX(b.price)                    AS priciest_title
FROM Authors a
INNER JOIN Book_Authors ba ON a.author_id  = ba.author_id
INNER JOIN Books        b  ON ba.book_id   = b.book_id
LEFT  JOIN Order_Items  oi ON b.book_id    = oi.book_id
LEFT  JOIN Orders       o  ON oi.order_id  = o.order_id
                           AND o.status   = 'Completed'
GROUP BY a.author_id, a.author_name
ORDER BY total_revenue DESC;
