// backend/routes/orderRoutes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/orderController');

router.get('/',           ctrl.getAllOrders);
router.get('/:id',        ctrl.getOrder);
router.post('/',          ctrl.createOrder);
router.patch('/:id/cancel', ctrl.cancelOrder);

module.exports = router;

