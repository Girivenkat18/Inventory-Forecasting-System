const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

router.get('/overview', dataController.getOverview);
router.get('/products', dataController.getProducts);

module.exports = router;
