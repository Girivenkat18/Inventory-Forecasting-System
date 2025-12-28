const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

router.get('/overview', dataController.getOverview);
router.get('/products', dataController.getProducts);
router.get('/download-sales', dataController.downloadSalesData);

module.exports = router;
