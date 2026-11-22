// backend/routes/dashboardRoutes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/dashboardController');

router.get('/stats',           ctrl.getStats);
router.get('/monthly-revenue', ctrl.getMonthlyRevenue);
router.get('/category-sales',  ctrl.getCategorySales);
router.get('/top-books',       ctrl.getTopBooks);
router.get('/recent-orders',   ctrl.getRecentOrders);
router.get('/low-stock',       ctrl.getLowStock);

module.exports = router;

