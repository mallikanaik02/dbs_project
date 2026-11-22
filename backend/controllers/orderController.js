// backend/controllers/orderController.js
const db = require('../config/db');
const { validateOrder } = require('../utils/validation');

// GET /api/orders
const getAllOrders = async (req, res, next) => {
  try {
    const {
      search, status, payment_method,
      dateFrom, dateTo,
      sortBy = 'o.order_date', sortDir = 'DESC',
      page = 1, limit = 20
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let where = 'WHERE 1=1';

    if (search) {
      where += ' AND (CAST(o.order_id AS CHAR) LIKE ? OR cu.customer_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status)         { where += ' AND o.status = ?';         params.push(status); }
    if (payment_method) { where += ' AND o.payment_method = ?'; params.push(payment_method); }
    if (dateFrom)       { where += ' AND DATE(o.order_date) >= ?'; params.push(dateFrom); }
    if (dateTo)         { where += ' AND DATE(o.order_date) <= ?'; params.push(dateTo); }

    const allowedSort = {
      'date': 'o.order_date', 'amount': 'o.total_amount', 'id': 'o.order_id'
    };
    const safeSort = allowedSort[sortBy] || 'o.order_date';
    const safeDir  = sortDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const [[countRow]] = await db.execute(`
      SELECT COUNT(*) AS total
      FROM Orders o
      LEFT JOIN Customers cu ON o.customer_id = cu.customer_id
      ${where}`, params);

    const [rows] = await db.execute(`
      SELECT
        o.order_id,
        COALESCE(cu.customer_name, 'Walk-in Customer') AS customer_name,
        cu.customer_id,
        o.order_date, o.total_amount, o.payment_method, o.status,
        COUNT(oi.order_item_id) AS item_count
      FROM Orders o
      LEFT JOIN Customers cu   ON o.customer_id = cu.customer_id
      LEFT JOIN Order_Items oi ON o.order_id    = oi.order_id
      ${where}
      GROUP BY o.order_id, cu.customer_name, cu.customer_id, o.order_date, o.total_amount, o.payment_method, o.status
      ORDER BY ${safeSort} ${safeDir}
      LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]);

    res.json({ data: rows, total: countRow.total, page: parseInt(page),
               limit: parseInt(limit), totalPages: Math.ceil(countRow.total / parseInt(limit)) });
  } catch (err) { next(err); }
};

// GET /api/orders/:id
const getOrder = async (req, res, next) => {
  try {
    const [[order]] = await db.execute(`
      SELECT
        o.*,
        COALESCE(cu.customer_name, 'Walk-in Customer') AS customer_name,
        cu.email, cu.phone
      FROM Orders o
      LEFT JOIN Customers cu ON o.customer_id = cu.customer_id
      WHERE o.order_id = ?`, [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const [items] = await db.execute(`
      SELECT
        oi.order_item_id, oi.quantity, oi.unit_price, oi.subtotal,
        b.book_id, b.isbn, b.title, a.author_name
      FROM Order_Items oi
      INNER JOIN Books b   ON oi.book_id  = b.book_id
      INNER JOIN Authors a ON b.author_id = a.author_id
      WHERE oi.order_id = ?
      ORDER BY b.title`, [req.params.id]);

    res.json({ ...order, items });
  } catch (err) { next(err); }
};

// POST /api/orders  — create sale with transaction
const createOrder = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const errors = validateOrder(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const { customer_id, items, payment_method = 'Cash' } = req.body;

    await conn.beginTransaction();

    let totalAmount = 0;
    const enrichedItems = [];

    // Validate stock and prices
    for (const item of items) {
      const [[book]] = await conn.execute(
        'SELECT book_id, title, price, stock_quantity FROM Books WHERE book_id = ? FOR UPDATE',
        [item.book_id]);
      if (!book) throw Object.assign(new Error(`Book ID ${item.book_id} not found.`), { status: 404 });

      const qty = parseInt(item.quantity);
      if (book.stock_quantity < qty)
        throw Object.assign(
          new Error(`Insufficient stock for "${book.title}". Available: ${book.stock_quantity}`),
          { status: 409 });

      const subtotal = parseFloat((book.price * qty).toFixed(2));
      totalAmount   += subtotal;
      enrichedItems.push({ book_id: book.book_id, quantity: qty, unit_price: book.price, subtotal });
    }

    totalAmount = parseFloat(totalAmount.toFixed(2));

    // Insert Order
    const [orderResult] = await conn.execute(
      `INSERT INTO Orders (customer_id, total_amount, payment_method, status)
       VALUES (?, ?, ?, 'Completed')`,
      [customer_id || null, totalAmount, payment_method]);
    const orderId = orderResult.insertId;

    // Insert Order Items and reduce stock
    for (const item of enrichedItems) {
      await conn.execute(
        'INSERT INTO Order_Items (order_id, book_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.book_id, item.quantity, item.unit_price, item.subtotal]);
      await conn.execute(
        'UPDATE Books SET stock_quantity = stock_quantity - ? WHERE book_id = ?',
        [item.quantity, item.book_id]);
    }

    await conn.commit();
    conn.release();

    // Return full order
    const [[newOrder]] = await db.execute(`
      SELECT o.*,
             COALESCE(cu.customer_name, 'Walk-in Customer') AS customer_name
      FROM Orders o
      LEFT JOIN Customers cu ON o.customer_id = cu.customer_id
      WHERE o.order_id = ?`, [orderId]);
    const [orderItems] = await db.execute(`
      SELECT oi.*, b.title, b.isbn, a.author_name
      FROM Order_Items oi
      INNER JOIN Books b   ON oi.book_id  = b.book_id
      INNER JOIN Authors a ON b.author_id = a.author_id
      WHERE oi.order_id = ?`, [orderId]);

    res.status(201).json({ ...newOrder, items: orderItems });
  } catch (err) {
    await conn.rollback();
    conn.release();
    next(err);
  }
};

// PATCH /api/orders/:id/cancel
const cancelOrder = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const [[order]] = await conn.execute(
      'SELECT * FROM Orders WHERE order_id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.status === 'Cancelled')
      return res.status(400).json({ error: 'Order is already cancelled.' });

    await conn.beginTransaction();

    // Restore stock
    const [items] = await conn.execute(
      'SELECT book_id, quantity FROM Order_Items WHERE order_id = ?', [req.params.id]);
    for (const item of items) {
      await conn.execute(
        'UPDATE Books SET stock_quantity = stock_quantity + ? WHERE book_id = ?',
        [item.quantity, item.book_id]);
    }

    await conn.execute(
      "UPDATE Orders SET status = 'Cancelled' WHERE order_id = ?", [req.params.id]);

    await conn.commit();
    conn.release();
    res.json({ message: 'Order cancelled and stock restored.' });
  } catch (err) {
    await conn.rollback();
    conn.release();
    next(err);
  }
};

module.exports = { getAllOrders, getOrder, createOrder, cancelOrder };

