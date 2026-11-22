// backend/utils/validation.js

const validateBook = (data) => {
  const errors = [];
  if (!data.isbn || String(data.isbn).trim() === '')
    errors.push('ISBN is required.');
  if (!data.title || String(data.title).trim() === '')
    errors.push('Title is required.');
  if (!data.author_id || isNaN(parseInt(data.author_id)))
    errors.push('A valid author must be selected.');
  if (!data.category_id || isNaN(parseInt(data.category_id)))
    errors.push('A valid category must be selected.');
  const price = parseFloat(data.price);
  if (isNaN(price) || price <= 0)
    errors.push('Price must be a positive number.');
  const stock = parseInt(data.stock_quantity);
  if (isNaN(stock) || stock < 0)
    errors.push('Stock quantity must be zero or greater.');
  if (data.publication_year) {
    const yr = parseInt(data.publication_year);
    if (isNaN(yr) || yr < 1000 || yr > new Date().getFullYear())
      errors.push('Publication year must be a valid year.');
  }
  return errors;
};

const validateAuthor = (data) => {
  const errors = [];
  if (!data.author_name || String(data.author_name).trim() === '')
    errors.push('Author name is required.');
  return errors;
};

const validateCategory = (data) => {
  const errors = [];
  if (!data.category_name || String(data.category_name).trim() === '')
    errors.push('Category name is required.');
  return errors;
};

const validateCustomer = (data) => {
  const errors = [];
  if (!data.customer_name || String(data.customer_name).trim() === '')
    errors.push('Customer name is required.');
  if (!data.email || String(data.email).trim() === '')
    errors.push('Email is required.');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    errors.push('Invalid email address.');
  if (!data.phone || String(data.phone).trim() === '')
    errors.push('Phone is required.');
  else if (!/^\+?[0-9]{7,15}$/.test(String(data.phone).trim()))
    errors.push('Phone must be 7–15 digits.');
  return errors;
};

const validateOrder = (data) => {
  const errors = [];
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0)
    errors.push('Order must contain at least one item.');
  if (data.items) {
    data.items.forEach((item, i) => {
      if (!item.book_id || isNaN(parseInt(item.book_id)))
        errors.push(`Item ${i + 1}: invalid book.`);
      const qty = parseInt(item.quantity);
      if (isNaN(qty) || qty < 1)
        errors.push(`Item ${i + 1}: quantity must be at least 1.`);
    });
  }
  return errors;
};

module.exports = { validateBook, validateAuthor, validateCategory, validateCustomer, validateOrder };

