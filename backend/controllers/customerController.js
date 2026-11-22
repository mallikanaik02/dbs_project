// backend/controllers/customerController.js
const db = require('../config/db');
const { validateCustomer } = require('../utils/validation');

// GET /api/customers
const getAllCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let where = 'WHERE 1=1';

    if (search) {
      where += ' AND (cu.customer_name LIKE ? OR cu.email LIKE ? OR cu.phone LIKE ?)';
      const q = `%${search}%`;
      params.push(q, q, q);
    }

    const [[countRow]] = await db.execute(
      `SELECT COUNT(*) AS total FROM Customers cu ${where}`, params);

    const [rows] = await db.execute(`
      SELECT
        cu.customer_id, cu.customer_name, cu.email, cu.phone, cu.address, cu.registration_date,
        COUNT(o.order_id)                AS total_orders,
        COALESCE(SUM(o.total_amount), 0) AS total_spent
      FROM Customers cu
      LEFT JOIN Orders o ON cu.customer_id = o.customer_id AND o.status = 'Completed'
      ${where}
      GROUP BY cu.customer_id, cu.customer_name, cu.email, cu.phone, cu.address, cu.registration_date
      ORDER BY cu.customer_name ASC
      LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]);

    res.json({ data: rows, total: countRow.total, page: parseInt(page),
               limit: parseInt(limit), totalPages: Math.ceil(countRow.total / parseInt(limit)) });
  } catch (err) { next(err); }
};

// GET /api/customers/:id
const getCustomer = async (req, res, next) => {
  try {
    const [[customer]] = await db.execute(`
      SELECT
        cu.*,
        COUNT(o.order_id)                AS total_orders,
        COALESCE(SUM(o.total_amount), 0) AS total_spent,
        COALESCE(AVG(o.total_amount), 0) AS avg_order_value
      FROM Customers cu
      LEFT JOIN Orders o ON cu.customer_id = o.customer_id AND o.status = 'Completed'
      WHERE cu.customer_id = ?
      GROUP BY cu.customer_id`, [req.params.id]);
    if (!customer) return res.status(404).json({ error: 'Customer not found.' });

    // Order history
    const [orders] = await db.execute(`
      SELECT o.order_id, o.order_date, o.total_amount, o.payment_method, o.status,
             COUNT(oi.order_item_id) AS item_count
      FROM Orders o
      LEFT JOIN Order_Items oi ON o.order_id = oi.order_id
      WHERE o.customer_id = ?
      GROUP BY o.order_id, o.order_date, o.total_amount, o.payment_method, o.status
      ORDER BY o.order_date DESC`, [req.params.id]);

    res.json({ ...customer, orders });
  } catch (err) { next(err); }
};

// POST /api/customers
const createCustomer = async (req, res, next) => {
  try {
    const errors = validateCustomer(req.body);
    if (errors.length) return res.status(400).json({ errors });
    const { customer_name, email, phone, address } = req.body;
    const [result] = await db.execute(
      'INSERT INTO Customers (customer_name, email, phone, address) VALUES (?, ?, ?, ?)',
      [customer_name.trim(), email.trim().toLowerCase(), phone.trim(), address || null]);
    const [[newCust]] = await db.execute(
      'SELECT * FROM Customers WHERE customer_id=?', [result.insertId]);
    res.status(201).json(newCust);
  } catch (err) { next(err); }
};

// PUT /api/customers/:id
const updateCustomer = async (req, res, next) => {
  try {
    const errors = validateCustomer(req.body);
    if (errors.length) return res.status(400).json({ errors });
    const { customer_name, email, phone, address } = req.body;
    const [result] = await db.execute(
      'UPDATE Customers SET customer_name=?, email=?, phone=?, address=? WHERE customer_id=?',
      [customer_name.trim(), email.trim().toLowerCase(), phone.trim(), address || null, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Customer not found.' });
    const [[updated]] = await db.execute('SELECT * FROM Customers WHERE customer_id=?', [req.params.id]);
    res.json(updated);
  } catch (err) { next(err); }
};

// DELETE /api/customers/:id
const deleteCustomer = async (req, res, next) => {
  try {
    // Check completed orders (allow deletion, orders become walk-in due to SET NULL)
    const [[ref]] = await db.execute(
      `SELECT COUNT(*) AS cnt FROM Orders WHERE customer_id = ? AND status = 'Completed'`,
      [req.params.id]);
    if (ref.cnt > 0)
      return res.status(409).json({
        error: 'Cannot delete: customer has completed orders. Historical records must be preserved.'
      });
    const [result] = await db.execute('DELETE FROM Customers WHERE customer_id=?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Customer not found.' });
    res.json({ message: 'Customer deleted successfully.' });
  } catch (err) { next(err); }
};

module.exports = { getAllCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer };

