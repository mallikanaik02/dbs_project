// backend/routes/categoryRoutes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/categoryController');

router.get('/',     ctrl.getAllCategories);
router.get('/:id',  ctrl.getCategory);
router.post('/',    ctrl.createCategory);
router.put('/:id',  ctrl.updateCategory);
router.delete('/:id', ctrl.deleteCategory);

module.exports = router;

