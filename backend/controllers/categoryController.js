// backend/controllers/categoryController.js
// M:N schema: author join in getCategory now goes via Book_Authors
const db = require('../config/db');
const { validateCategory } = require('../utils/validation');

// GET /api/categories
const getAllCategories = async (req, res, next) => {
  try {
    const { search } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    if (search) { where += ' AND c.category_name LIKE ?'; params.push(`%${search}%`); }

    const [rows] = await db.execute(`
      SELECT c.category_id, c.category_name, c.description,
             COUNT(b.book_id) AS book_count
      FROM Categories c
      LEFT JOIN Books b ON c.category_id = b.category_id
      ${where}
      GROUP BY c.category_id, c.category_name, c.description
      ORDER BY c.category_name`, params);
    res.json(rows);
  } catch (err) { next(err); }
};

// GET /api/categories/:id
const getCategory = async (req, res, next) => {
  try {
    const [[cat]] = await db.execute(`
      SELECT c.*, COUNT(b.book_id) AS book_count
      FROM Categories c
      LEFT JOIN Books b ON c.category_id = b.category_id
      WHERE c.category_id = ?
      GROUP BY c.category_id`, [req.params.id]);
    if (!cat) return res.status(404).json({ error: 'Category not found.' });

    // Books in category — author names via Book_Authors
    const [books] = await db.execute(`
      SELECT b.book_id, b.isbn, b.title,
             GROUP_CONCAT(DISTINCT a.author_name SEPARATOR ', ') AS authors,
             b.price, b.stock_quantity
      FROM Books b
      INNER JOIN Book_Authors ba ON b.book_id    = ba.book_id
      INNER JOIN Authors      a  ON ba.author_id = a.author_id
      WHERE b.category_id = ?
      GROUP BY b.book_id, b.isbn, b.title, b.price, b.stock_quantity
      ORDER BY b.title`, [req.params.id]);

    res.json({ ...cat, books });
  } catch (err) { next(err); }
};

// POST /api/categories
const createCategory = async (req, res, next) => {
  try {
    const errors = validateCategory(req.body);
    if (errors.length) return res.status(400).json({ errors });
    const { category_name, description } = req.body;
    const [result] = await db.execute(
      'INSERT INTO Categories (category_name, description) VALUES (?, ?)',
      [category_name.trim(), description || null]);
    const [[newCat]] = await db.execute(
      'SELECT * FROM Categories WHERE category_id=?', [result.insertId]);
    res.status(201).json(newCat);
  } catch (err) { next(err); }
};

// PUT /api/categories/:id
const updateCategory = async (req, res, next) => {
  try {
    const errors = validateCategory(req.body);
    if (errors.length) return res.status(400).json({ errors });
    const { category_name, description } = req.body;
    const [result] = await db.execute(
      'UPDATE Categories SET category_name=?, description=? WHERE category_id=?',
      [category_name.trim(), description || null, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Category not found.' });
    const [[updated]] = await db.execute('SELECT * FROM Categories WHERE category_id=?', [req.params.id]);
    res.json(updated);
  } catch (err) { next(err); }
};

// DELETE /api/categories/:id
const deleteCategory = async (req, res, next) => {
  try {
    const [[ref]] = await db.execute(
      'SELECT COUNT(*) AS cnt FROM Books WHERE category_id = ?', [req.params.id]);
    if (ref.cnt > 0)
      return res.status(409).json({ error: 'Cannot delete: category contains books.' });
    const [result] = await db.execute('DELETE FROM Categories WHERE category_id=?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Category not found.' });
    res.json({ message: 'Category deleted successfully.' });
  } catch (err) { next(err); }
};

module.exports = { getAllCategories, getCategory, createCategory, updateCategory, deleteCategory };
