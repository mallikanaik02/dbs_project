// backend/controllers/dashboardController.js
// M:N schema: all author joins now go through Book_Authors junction table.
const db = require('../config/db');

// GET /api/dashboard/stats
const getStats = async (req, res, next) => {
  try {
    const [[books]] = await db.execute(`
      SELECT
        COUNT(book_id)     AS total_titles,
        SUM(stock_quantity) AS total_inventory
      FROM Books`);

    const [[orders]] = await db.execute(`
      SELECT
        COUNT(order_id)        AS total_orders,
        COALESCE(SUM(total_amount), 0)  AS total_revenue,
        COALESCE(AVG(total_amount), 0)  AS avg_order_value
      FROM Orders WHERE status = 'Completed'`);

    const [[customers]] = await db.execute(
      'SELECT COUNT(customer_id) AS total_customers FROM Customers');

    const [[lowStock]] = await db.execute(
      "SELECT COUNT(book_id) AS low_stock_count FROM Books WHERE stock_quantity > 0 AND stock_quantity <= 5");

    const [[outOfStock]] = await db.execute(
      "SELECT COUNT(book_id) AS out_of_stock_count FROM Books WHERE stock_quantity = 0");

    res.json({
      total_titles:      books.total_titles,
      total_inventory:   books.total_inventory,
      total_customers:   customers.total_customers,
      total_orders:      orders.total_orders,
      total_revenue:     orders.total_revenue,
      avg_order_value:   orders.avg_order_value,
      low_stock_count:   lowStock.low_stock_count,
      out_of_stock_count: outOfStock.out_of_stock_count,
    });
  } catch (err) { next(err); }
};

// GET /api/dashboard/monthly-revenue
const getMonthlyRevenue = async (req, res, next) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        DATE_FORMAT(order_date, '%Y-%m')  AS month,
        DATE_FORMAT(order_date, '%b %Y')  AS label,
        COUNT(order_id)                    AS orders,
        SUM(total_amount)                  AS revenue
      FROM Orders
      WHERE status = 'Completed'
        AND order_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(order_date, '%Y-%m'), DATE_FORMAT(order_date, '%b %Y')
      ORDER BY month ASC`);
    res.json(rows);
  } catch (err) { next(err); }
};

// GET /api/dashboard/category-sales
const getCategorySales = async (req, res, next) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        c.category_name,
        COALESCE(SUM(oi.quantity), 0)   AS units_sold,
        COALESCE(SUM(oi.subtotal), 0)   AS revenue
      FROM Categories c
      LEFT JOIN Books b        ON c.category_id = b.category_id
      LEFT JOIN Order_Items oi ON b.book_id     = oi.book_id
      LEFT JOIN Orders o       ON oi.order_id   = o.order_id AND o.status = 'Completed'
      GROUP BY c.category_id, c.category_name
      ORDER BY revenue DESC`);
    res.json(rows);
  } catch (err) { next(err); }
};

// GET /api/dashboard/top-books
const getTopBooks = async (req, res, next) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        b.title,
        GROUP_CONCAT(DISTINCT a.author_name SEPARATOR ', ') AS authors,
        SUM(oi.quantity)  AS total_sold,
        SUM(oi.subtotal)  AS revenue
      FROM Books b
      INNER JOIN Book_Authors ba ON b.book_id    = ba.book_id
      INNER JOIN Authors      a  ON ba.author_id = a.author_id
      INNER JOIN Order_Items  oi ON b.book_id    = oi.book_id
      INNER JOIN Orders       o  ON oi.order_id  = o.order_id AND o.status = 'Completed'
      GROUP BY b.book_id, b.title
      ORDER BY total_sold DESC
      LIMIT 5`);
    res.json(rows);
  } catch (err) { next(err); }
};

// GET /api/dashboard/recent-orders
const getRecentOrders = async (req, res, next) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        o.order_id,
        COALESCE(cu.customer_name, 'Walk-in Customer') AS customer_name,
        o.order_date, o.total_amount, o.status, o.payment_method
      FROM Orders o
      LEFT JOIN Customers cu ON o.customer_id = cu.customer_id
      ORDER BY o.order_date DESC
      LIMIT 8`);
    res.json(rows);
  } catch (err) { next(err); }
};

// GET /api/dashboard/low-stock
const getLowStock = async (req, res, next) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        b.book_id, b.title,
        GROUP_CONCAT(DISTINCT a.author_name SEPARATOR ', ') AS authors,
        b.stock_quantity, b.price
      FROM Books b
      INNER JOIN Book_Authors ba ON b.book_id    = ba.book_id
      INNER JOIN Authors      a  ON ba.author_id = a.author_id
      WHERE b.stock_quantity <= 5
      GROUP BY b.book_id, b.title, b.stock_quantity, b.price
      ORDER BY b.stock_quantity ASC, b.title ASC
      LIMIT 10`);
    res.json(rows);
  } catch (err) { next(err); }
};

module.exports = { getStats, getMonthlyRevenue, getCategorySales, getTopBooks, getRecentOrders, getLowStock };
