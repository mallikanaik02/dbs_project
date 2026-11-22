// backend/routes/reportRoutes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/reportController');

router.get('/summary',              ctrl.getSummary);
router.get('/monthly-sales',        ctrl.getMonthlySales);
router.get('/top-books',            ctrl.getTopBooks);
router.get('/category-sales',       ctrl.getCategorySales);
router.get('/customer-spending',    ctrl.getCustomerSpending);
router.get('/inventory',            ctrl.getInventory);
router.get('/low-stock',            ctrl.getLowStock);
router.get('/author-report',        ctrl.getAuthorReport);
router.get('/above-average-price',  ctrl.getAboveAveragePrice);
router.get('/unsold-books',         ctrl.getUnsoldBooks);

module.exports = router;

