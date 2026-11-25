// backend/controllers/bookController.js
// M:N schema: Books no longer has author_id.
// Authors linked via Book_Authors junction table.
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
    // Filter by author_id via Book_Authors subquery
    if (author_id) {
      where += ' AND b.book_id IN (SELECT book_id FROM Book_Authors WHERE author_id = ?)';
      params.push(author_id);
    }
    if (minPrice) { where += ' AND b.price >= ?'; params.push(minPrice); }
    if (maxPrice) { where += ' AND b.price <= ?'; params.push(maxPrice); }
    if (stock === 'low') { where += ' AND b.stock_quantity > 0 AND b.stock_quantity <= 5'; }
    if (stock === 'out') { where += ' AND b.stock_quantity = 0'; }
    if (stock === 'in')  { where += ' AND b.stock_quantity > 0'; }

    const allowedSort = {
      'title': 'b.title', 'price': 'b.price',
      'stock': 'b.stock_quantity', 'year': 'b.publication_year',
      'author': 'a.author_name', 'created': 'b.created_at'
    };
    const safeSort = allowedSort[sortBy] || 'b.title';
    const safeDir  = sortDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Count distinct books (before GROUP BY inflates rows)
    const countSql = `
      SELECT COUNT(DISTINCT b.book_id) AS total
      FROM Books b
      INNER JOIN Book_Authors ba ON b.book_id    = ba.book_id
      INNER JOIN Authors      a  ON ba.author_id = a.author_id
      INNER JOIN Categories   c  ON b.category_id = c.category_id
      ${where}`;

    const dataSql = `
      SELECT
        b.book_id, b.isbn, b.title,
        b.category_id, c.category_name,
        b.price, b.stock_quantity,
        b.publication_year, b.publisher, b.created_at,
        GROUP_CONCAT(DISTINCT a.author_name SEPARATOR ', ') AS authors,
        MIN(ba.author_id) AS author_id
      FROM Books b
      INNER JOIN Book_Authors ba ON b.book_id    = ba.book_id
      INNER JOIN Authors      a  ON ba.author_id = a.author_id
      INNER JOIN Categories   c  ON b.category_id = c.category_id
      ${where}
      GROUP BY b.book_id, b.isbn, b.title, b.category_id, c.category_name,
               b.price, b.stock_quantity, b.publication_year, b.publisher, b.created_at
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
      SELECT
        b.*,
        c.category_name,
        GROUP_CONCAT(DISTINCT a.author_name SEPARATOR ', ') AS authors,
        MIN(ba.author_id) AS author_id
      FROM Books b
      INNER JOIN Book_Authors ba ON b.book_id    = ba.book_id
      INNER JOIN Authors      a  ON ba.author_id = a.author_id
      INNER JOIN Categories   c  ON b.category_id = c.category_id
      WHERE b.book_id = ?
      GROUP BY b.book_id, c.category_name`, [req.params.id]);
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

    // Insert book (no author_id column)
    const [result] = await db.execute(
      `INSERT INTO Books (isbn, title, category_id, price, stock_quantity, publication_year, publisher)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [isbn.trim(), title.trim(), category_id, parseFloat(price),
       parseInt(stock_quantity), publication_year || null, publisher || null]
    );

    // Link author via Book_Authors junction table
    await db.execute(
      `INSERT INTO Book_Authors (book_id, author_id, author_role) VALUES (?, ?, 'Author')`,
      [result.insertId, author_id]
    );

    const [newBook] = await db.execute(`
      SELECT
        b.*,
        c.category_name,
        GROUP_CONCAT(DISTINCT a.author_name SEPARATOR ', ') AS authors,
        MIN(ba.author_id) AS author_id
      FROM Books b
      INNER JOIN Book_Authors ba ON b.book_id    = ba.book_id
      INNER JOIN Authors      a  ON ba.author_id = a.author_id
      INNER JOIN Categories   c  ON b.category_id = c.category_id
      WHERE b.book_id = ?
      GROUP BY b.book_id, c.category_name`, [result.insertId]);
    res.status(201).json(newBook[0]);
  } catch (err) { next(err); }
};

// PUT /api/books/:id
const updateBook = async (req, res, next) => {
  try {
    const errors = validateBook(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const { isbn, title, author_id, category_id, price, stock_quantity, publication_year, publisher } = req.body;

    // Update Books table (no author_id column)
    const [result] = await db.execute(
      `UPDATE Books SET isbn=?, title=?, category_id=?, price=?,
       stock_quantity=?, publication_year=?, publisher=? WHERE book_id=?`,
      [isbn.trim(), title.trim(), category_id, parseFloat(price),
       parseInt(stock_quantity), publication_year || null, publisher || null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Book not found.' });

    // Update Book_Authors: replace the primary author entry
    // (DELETE + INSERT pattern to handle author change cleanly)
    await db.execute('DELETE FROM Book_Authors WHERE book_id = ?', [req.params.id]);
    await db.execute(
      `INSERT INTO Book_Authors (book_id, author_id, author_role) VALUES (?, ?, 'Author')`,
      [req.params.id, author_id]
    );

    const [updated] = await db.execute(`
      SELECT
        b.*,
        c.category_name,
        GROUP_CONCAT(DISTINCT a.author_name SEPARATOR ', ') AS authors,
        MIN(ba.author_id) AS author_id
      FROM Books b
      INNER JOIN Book_Authors ba ON b.book_id    = ba.book_id
      INNER JOIN Authors      a  ON ba.author_id = a.author_id
      INNER JOIN Categories   c  ON b.category_id = c.category_id
      WHERE b.book_id = ?
      GROUP BY b.book_id, c.category_name`, [req.params.id]);
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
    // Book_Authors rows cascade-delete automatically via FK ON DELETE CASCADE
    const [result] = await db.execute('DELETE FROM Books WHERE book_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Book not found.' });
    res.json({ message: 'Book deleted successfully.' });
  } catch (err) { next(err); }
};

module.exports = { getAllBooks, getBook, createBook, updateBook, deleteBook };
