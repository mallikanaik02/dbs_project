// backend/middleware/errorHandler.js

const errorHandler = (err, req, res, next) => {
  console.error('[Error]', err.message);
  if (err.code) console.error('[MySQL Code]', err.code);

  // MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    const field = err.message.includes('isbn')    ? 'ISBN'
                : err.message.includes('email')   ? 'Email'
                : err.message.includes('phone')   ? 'Phone'
                : err.message.includes('category_name') ? 'Category name'
                : 'Value';
    return res.status(409).json({ error: `${field} already exists.` });
  }

  // FK constraint violation
  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
    return res.status(409).json({
      error: 'Cannot delete: this record is referenced by other data (e.g., orders or books).'
    });
  }

  // FK violation on insert
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ error: 'Invalid reference: related record does not exist.' });
  }

  // Check constraint
  if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
    return res.status(400).json({ error: 'Value violates a database constraint (e.g., negative price or stock).' });
  }

  const status  = err.status  || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: message });
};

module.exports = errorHandler;

