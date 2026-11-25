// backend/controllers/authorController.js
// M:N schema: book_count and book listings now go via Book_Authors
const db = require('../config/db');
const { validateAuthor } = require('../utils/validation');

// GET /api/authors
const getAllAuthors = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let where = 'WHERE 1=1';
    if (search) { where += ' AND a.author_name LIKE ?'; params.push(`%${search}%`); }

    const [[countRow]] = await db.execute(
      `SELECT COUNT(*) AS total FROM Authors a ${where}`, params);
    const [rows] = await db.execute(`
      SELECT a.author_id, a.author_name, a.biography, a.created_at,
             COUNT(DISTINCT ba.book_id) AS book_count
      FROM Authors a
      LEFT JOIN Book_Authors ba ON a.author_id = ba.author_id
      ${where}
      GROUP BY a.author_id, a.author_name, a.biography, a.created_at
      ORDER BY a.author_name ASC
      LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]);

    res.json({ data: rows, total: countRow.total, page: parseInt(page),
               limit: parseInt(limit), totalPages: Math.ceil(countRow.total / parseInt(limit)) });
  } catch (err) { next(err); }
};

// GET /api/authors/:id
const getAuthor = async (req, res, next) => {
  try {
    const [[author]] = await db.execute(`
      SELECT a.*, COUNT(DISTINCT ba.book_id) AS book_count
      FROM Authors a
      LEFT JOIN Book_Authors ba ON a.author_id = ba.author_id
      WHERE a.author_id = ?
      GROUP BY a.author_id`, [req.params.id]);
    if (!author) return res.status(404).json({ error: 'Author not found.' });

    // Books written by this author (via junction table)
    const [books] = await db.execute(`
      SELECT b.book_id, b.isbn, b.title, c.category_name,
             b.price, b.stock_quantity, b.publication_year, ba.author_role
      FROM Book_Authors ba
      INNER JOIN Books      b ON ba.book_id    = b.book_id
      INNER JOIN Categories c ON b.category_id = c.category_id
      WHERE ba.author_id = ?
      ORDER BY b.title`, [req.params.id]);

    res.json({ ...author, books });
  } catch (err) { next(err); }
};

// GET /api/authors/all  (no pagination, for dropdowns)
const getAllAuthorsSimple = async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT author_id, author_name FROM Authors ORDER BY author_name');
    res.json(rows);
  } catch (err) { next(err); }
};

// POST /api/authors
const createAuthor = async (req, res, next) => {
  try {
    const errors = validateAuthor(req.body);
    if (errors.length) return res.status(400).json({ errors });
    const { author_name, biography } = req.body;
    const [result] = await db.execute(
      'INSERT INTO Authors (author_name, biography) VALUES (?, ?)',
      [author_name.trim(), biography || null]);
    const [[newAuthor]] = await db.execute(
      'SELECT * FROM Authors WHERE author_id = ?', [result.insertId]);
    res.status(201).json(newAuthor);
  } catch (err) { next(err); }
};

// PUT /api/authors/:id
const updateAuthor = async (req, res, next) => {
  try {
    const errors = validateAuthor(req.body);
    if (errors.length) return res.status(400).json({ errors });
    const { author_name, biography } = req.body;
    const [result] = await db.execute(
      'UPDATE Authors SET author_name=?, biography=? WHERE author_id=?',
      [author_name.trim(), biography || null, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Author not found.' });
    const [[updated]] = await db.execute('SELECT * FROM Authors WHERE author_id=?', [req.params.id]);
    res.json(updated);
  } catch (err) { next(err); }
};

// DELETE /api/authors/:id
const deleteAuthor = async (req, res, next) => {
  try {
    // Check via Book_Authors (not Books.author_id any more)
    const [[ref]] = await db.execute(
      'SELECT COUNT(*) AS cnt FROM Book_Authors WHERE author_id = ?', [req.params.id]);
    if (ref.cnt > 0)
      return res.status(409).json({ error: 'Cannot delete: author has books in inventory.' });
    const [result] = await db.execute('DELETE FROM Authors WHERE author_id=?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Author not found.' });
    res.json({ message: 'Author deleted successfully.' });
  } catch (err) { next(err); }
};

module.exports = { getAllAuthors, getAuthor, getAllAuthorsSimple, createAuthor, updateAuthor, deleteAuthor };
