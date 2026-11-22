// backend/controllers/bookController.js
const db = require('../config/db');
const { validateBook } = require('../utils/validation');

// GET /api/books
const getAllBooks = async (req, res, next) => {
  try {
    const {
      search, category_id, author_id,
      minPrice, maxPrice, stock,
      sortBy = 'b.title', sortDir = 'ASC',
      page = 1, limit = 20
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let where    = 'WHERE 1=1';

    if (search) {
      where += ' AND (b.title LIKE ? OR b.isbn LIKE ? OR a.author_name LIKE ?)';
      const q = `%${search}%`;
      params.push(q, q, q);
    }
    if (category_id) { where += ' AND b.category_id = ?'; params.push(category_id); }
    if (author_id)   { where += ' AND b.author_id = ?';   params.push(author_id);   }
    if (minPrice)    { where += ' AND b.price >= ?';       params.push(minPrice);    }
    if (maxPrice)    { where += ' AND b.price <= ?';       params.push(maxPrice);    }
    if (stock === 'low')  { where += ' AND b.stock_quantity > 0 AND b.stock_quantity <= 5'; }
    if (stock === 'out')  { where += ' AND b.stock_quantity = 0'; }
    if (stock === 'in')   { where += ' AND b.stock_quantity > 0'; }

    const allowedSort = {
      'title': 'b.title', 'price': 'b.price',
      'stock': 'b.stock_quantity', 'year': 'b.publication_year',
      'author': 'a.author_name', 'created': 'b.created_at'
    };
    const safeSort = allowedSort[sortBy] || 'b.title';
    const safeDir  = sortDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const countSql = `
      SELECT COUNT(*) AS total
      FROM Books b
      INNER JOIN Authors a    ON b.author_id   = a.author_id
      INNER JOIN Categories c ON b.category_id = c.category_id
      ${where}`;

    const dataSql = `
      SELECT
        b.book_id, b.isbn, b.title,
        b.author_id, a.author_name,
        b.category_id, c.category_name,
        b.price, b.stock_quantity,
        b.publication_year, b.publisher, b.created_at
      FROM Books b
      INNER JOIN Authors a    ON b.author_id   = a.author_id
      INNER JOIN Categories c ON b.category_id = c.category_id
      ${where}
      ORDER BY ${safeSort} ${safeDir}
      LIMIT ? OFFSET ?`;

    const [[countRow]] = await db.execute(countSql, params);
    const [rows]       = await db.execute(dataSql,  [...params, parseInt(limit), offset]);

    res.json({
      data:       rows,
      total:      countRow.total,
      page:       parseInt(page),
      limit:      parseInt(limit),
      totalPages: Math.ceil(countRow.total / parseInt(limit)),
    });
  } catch (err) { next(err); }
};

// GET /api/books/:id
const getBook = async (req, res, next) => {
  try {
    const [rows] = await db.execute(`
      SELECT b.*, a.author_name, c.category_name
      FROM Books b
      INNER JOIN Authors a    ON b.author_id   = a.author_id
      INNER JOIN Categories c ON b.category_id = c.category_id
      WHERE b.book_id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Book not found.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

// POST /api/books
const createBook = async (req, res, next) => {
  try {
    const errors = validateBook(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const { isbn, title, author_id, category_id, price, stock_quantity, publication_year, publisher } = req.body;
    const [result] = await db.execute(
      `INSERT INTO Books (isbn, title, author_id, category_id, price, stock_quantity, publication_year, publisher)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [isbn.trim(), title.trim(), author_id, category_id, parseFloat(price),
       parseInt(stock_quantity), publication_year || null, publisher || null]
    );
    const [newBook] = await db.execute(`
      SELECT b.*, a.author_name, c.category_name
      FROM Books b
      INNER JOIN Authors a    ON b.author_id   = a.author_id
      INNER JOIN Categories c ON b.category_id = c.category_id
      WHERE b.book_id = ?`, [result.insertId]);
    res.status(201).json(newBook[0]);
  } catch (err) { next(err); }
};

// PUT /api/books/:id
const updateBook = async (req, res, next) => {
  try {
    const errors = validateBook(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const { isbn, title, author_id, category_id, price, stock_quantity, publication_year, publisher } = req.body;
    const [result] = await db.execute(
      `UPDATE Books SET isbn=?, title=?, author_id=?, category_id=?, price=?,
       stock_quantity=?, publication_year=?, publisher=? WHERE book_id=?`,
      [isbn.trim(), title.trim(), author_id, category_id, parseFloat(price),
       parseInt(stock_quantity), publication_year || null, publisher || null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Book not found.' });
    const [updated] = await db.execute(`
      SELECT b.*, a.author_name, c.category_name
      FROM Books b
      INNER JOIN Authors a    ON b.author_id   = a.author_id
      INNER JOIN Categories c ON b.category_id = c.category_id
      WHERE b.book_id = ?`, [req.params.id]);
    res.json(updated[0]);
  } catch (err) { next(err); }
};

// DELETE /api/books/:id
const deleteBook = async (req, res, next) => {
  try {
    // Check if book is referenced in any order
    const [[ref]] = await db.execute(
      'SELECT COUNT(*) AS cnt FROM Order_Items WHERE book_id = ?', [req.params.id]);
    if (ref.cnt > 0)
      return res.status(409).json({
        error: 'Cannot delete: this book has sales history. Remove the order items first.'
      });
    const [result] = await db.execute('DELETE FROM Books WHERE book_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Book not found.' });
    res.json({ message: 'Book deleted successfully.' });
  } catch (err) { next(err); }
};

module.exports = { getAllBooks, getBook, createBook, updateBook, deleteBook };

