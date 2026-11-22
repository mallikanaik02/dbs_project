// backend/routes/authorRoutes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/authorController');

router.get('/all',  ctrl.getAllAuthorsSimple);
router.get('/',     ctrl.getAllAuthors);
router.get('/:id',  ctrl.getAuthor);
router.post('/',    ctrl.createAuthor);
router.put('/:id',  ctrl.updateAuthor);
router.delete('/:id', ctrl.deleteAuthor);

module.exports = router;

