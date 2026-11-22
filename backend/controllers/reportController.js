// backend/controllers/reportController.js
const db = require('../config/db');

// GET /api/reports/summary
const getSummary = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    let dateWhere = "WHERE o.status = 'Completed'";
    const params = [];
    if (dateFrom) { dateWhere += ' AND DATE(o.order_date) >= ?'; params.push(dateFrom); }
    if (dateTo)   { dateWhere += ' AND DATE(o.order_date) <= ?'; params.push(dateTo);   }

    const [[summary]] = await db.execute(`
      SELECT
        COUNT(o.order_id)      AS total_orders,
        COALESCE(SUM(o.total_amount), 0)  AS total_revenue,
        COALESCE(AVG(o.total_amount), 0)  AS avg_order_value,
        COALESCE(SUM(oi.quantity), 0)     AS total_units_sold
      FROM Orders o
      LEFT JOIN Order_Items oi ON o.order_id = oi.order_id
      ${dateWhere}`, params);
    res.json(summary);
  } catch (err) { next(err); }
};

// GET /api/reports/monthly-sales
const getMonthlySales = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    let where = "WHERE o.status = 'Completed'";
    const params = [];
    if (dateFrom) { where += ' AND DATE(o.order_date) >= ?'; params.push(dateFrom); }
    if (dateTo)   { where += ' AND DATE(o.order_date) <= ?'; params.push(dateTo);   }

    const [rows] = await db.execute(`
      SELECT
        DATE_FORMAT(o.order_date, '%Y-%m')    AS month,
        DATE_FORMAT(o.order_date, '%b %Y')    AS month_label,
        COUNT(DISTINCT o.order_id)             AS order_count,
        SUM(o.total_amount)                    AS revenue,
        AVG(o.total_amount)                    AS avg_order_value,
        COALESCE(SUM(oi.quantity), 0)          AS total_units_sold
      FROM Orders o
      LEFT JOIN Order_Items oi ON o.order_id = oi.order_id
      ${where}
      GROUP BY DATE_FORMAT(o.order_date, '%Y-%m'), DATE_FORMAT(o.order_date, '%b %Y')
      ORDER BY month ASC`, params);
    res.json(rows);
  } catch (err) { next(err); }
};

// GET /api/reports/top-books
const getTopBooks = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, limit = 10, minSold } = req.query;
    let where = "WHERE o.status = 'Completed'";
    const params = [];
    if (dateFrom) { where += ' AND DATE(o.order_date) >= ?'; params.push(dateFrom); }
    if (dateTo)   { where += ' AND DATE(o.order_date) <= ?'; params.push(dateTo);   }

    let having = '';
    if (minSold) { having = `HAVING SUM(oi.quantity) >= ${parseInt(minSold)}`; }

    const [rows] = await db.execute(`
      SELECT
        b.book_id, b.title, a.author_name, c.category_name,
        SUM(oi.quantity)  AS total_sold,
        SUM(oi.subtotal)  AS total_revenue
      FROM Books b
      INNER JOIN Authors a     ON b.author_id   = a.author_id
      INNER JOIN Categories c  ON b.category_id = c.category_id
      INNER JOIN Order_Items oi ON b.book_id    = oi.book_id
      INNER JOIN Orders o      ON oi.order_id   = o.order_id
      ${where}
      GROUP BY b.book_id, b.title, a.author_name, c.category_name
      ${having}
      ORDER BY total_sold DESC
      LIMIT ${parseInt(limit)}`, params);
    res.json(rows);
  } catch (err) { next(err); }
};

// GET /api/reports/category-sales
const getCategorySales = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, minRevenue } = req.query;
    let dateFilter = "o.status = 'Completed'";
    const params = [];
    if (dateFrom) { dateFilter += ' AND DATE(o.order_date) >= ?'; params.push(dateFrom); }
    if (dateTo)   { dateFilter += ' AND DATE(o.order_date) <= ?'; params.push(dateTo);   }

    let having = '';
    if (minRevenue) { having = `HAVING COALESCE(SUM(oi.subtotal),0) >= ${parseFloat(minRevenue)}`; }

    const [rows] = await db.execute(`
      SELECT
        c.category_id, c.category_name,
        COUNT(DISTINCT b.book_id)        AS book_count,
        COALESCE(SUM(oi.quantity), 0)    AS total_units_sold,
        COALESCE(SUM(oi.subtotal), 0)    AS total_revenue
      FROM Categories c
      LEFT JOIN Books b        ON c.category_id = b.category_id
      LEFT JOIN Order_Items oi ON b.book_id     = oi.book_id
      LEFT JOIN Orders o       ON oi.order_id   = o.order_id AND ${dateFilter}
      GROUP BY c.category_id, c.category_name
      ${having}
      ORDER BY total_revenue DESC`, params);
    res.json(rows);
  } catch (err) { next(err); }
};

// GET /api/reports/customer-spending
const getCustomerSpending = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, minOrders } = req.query;
    let where = "WHERE o.status = 'Completed'";
    const params = [];
    if (dateFrom) { where += ' AND DATE(o.order_date) >= ?'; params.push(dateFrom); }
    if (dateTo)   { where += ' AND DATE(o.order_date) <= ?'; params.push(dateTo);   }

    let having = '';
    if (minOrders) { having = `HAVING COUNT(o.order_id) >= ${parseInt(minOrders)}`; }

    const [rows] = await db.execute(`
      SELECT
        cu.customer_id, cu.customer_name, cu.email, cu.phone,
        COUNT(o.order_id)    AS total_orders,
        SUM(o.total_amount)  AS total_spent,
        AVG(o.total_amount)  AS avg_order_value,
        MAX(o.order_date)    AS last_order_date
      FROM Customers cu
      INNER JOIN Orders o ON cu.customer_id = o.customer_id
      ${where}
      GROUP BY cu.customer_id, cu.customer_name, cu.email, cu.phone
      ${having}
      ORDER BY total_spent DESC`, params);
    res.json(rows);
  } catch (err) { next(err); }
};

// GET /api/reports/inventory
const getInventory = async (req, res, next) => {
  try {
    const { category_id, minStock, maxStock } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    if (category_id) { where += ' AND b.category_id = ?'; params.push(category_id); }
    if (minStock !== undefined && minStock !== '') { where += ' AND b.stock_quantity >= ?'; params.push(minStock); }
    if (maxStock !== undefined && maxStock !== '') { where += ' AND b.stock_quantity <= ?'; params.push(maxStock); }

    const [rows] = await db.execute(`
      SELECT
        b.book_id, b.isbn, b.title, a.author_name, c.category_name,
        b.price, b.stock_quantity,
        ROUND(b.price * b.stock_quantity, 2) AS stock_value,
        b.publication_year
      FROM Books b
      INNER JOIN Authors a    ON b.author_id   = a.author_id
      INNER JOIN Categories c ON b.category_id = c.category_id
      ${where}
      ORDER BY b.title ASC`, params);
    res.json(rows);
  } catch (err) { next(err); }
};

// GET /api/reports/low-stock
const getLowStock = async (req, res, next) => {
  try {
    const threshold = parseInt(req.query.threshold) || 5;
    const [rows] = await db.execute(`
      SELECT
        b.book_id, b.isbn, b.title, a.author_name, c.category_name,
        b.stock_quantity, b.price,
        ROUND(b.price * b.stock_quantity, 2) AS stock_value
      FROM Books b
      INNER JOIN Authors a    ON b.author_id   = a.author_id
      INNER JOIN Categories c ON b.category_id = c.category_id
      WHERE b.stock_quantity <= ?
      ORDER BY b.stock_quantity ASC, b.title ASC`, [threshold]);
    res.json(rows);
  } catch (err) { next(err); }
};

// GET /api/reports/author-report
const getAuthorReport = async (req, res, next) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        a.author_id, a.author_name,
        COUNT(DISTINCT b.book_id)     AS book_count,
        COALESCE(SUM(oi.quantity), 0) AS total_sold,
        COALESCE(SUM(oi.subtotal), 0) AS total_revenue
      FROM Authors a
      LEFT JOIN Books b        ON a.author_id = b.author_id
      LEFT JOIN Order_Items oi ON b.book_id   = oi.book_id
      LEFT JOIN Orders o       ON oi.order_id = o.order_id AND o.status = 'Completed'
      GROUP BY a.author_id, a.author_name
      ORDER BY total_revenue DESC`);
    res.json(rows);
  } catch (err) { next(err); }
};

// GET /api/reports/above-average-price  (SUBQUERY demo)
const getAboveAveragePrice = async (req, res, next) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        b.book_id, b.title, a.author_name, c.category_name,
        b.price, b.stock_quantity,
        ROUND((SELECT AVG(price) FROM Books), 2) AS avg_price
      FROM Books b
      INNER JOIN Authors a    ON b.author_id   = a.author_id
      INNER JOIN Categories c ON b.category_id = c.category_id
      WHERE b.price > (SELECT AVG(price) FROM Books)
      ORDER BY b.price DESC`);
    res.json(rows);
  } catch (err) { next(err); }
};

// GET /api/reports/unsold-books  (NOT IN subquery demo)
const getUnsoldBooks = async (req, res, next) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        b.book_id, b.isbn, b.title, a.author_name, c.category_name,
        b.price, b.stock_quantity
      FROM Books b
      INNER JOIN Authors a    ON b.author_id   = a.author_id
      INNER JOIN Categories c ON b.category_id = c.category_id
      WHERE b.book_id NOT IN (SELECT DISTINCT book_id FROM Order_Items)
      ORDER BY b.title`);
    res.json(rows);
  } catch (err) { next(err); }
};

module.exports = {
  getSummary, getMonthlySales, getTopBooks, getCategorySales,
  getCustomerSpending, getInventory, getLowStock, getAuthorReport,
  getAboveAveragePrice, getUnsoldBooks
};

