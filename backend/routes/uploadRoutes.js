const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/uploadController');

const upload = multer({ dest: 'uploads/' });

router.post('/products', upload.single('file'), uploadController.uploadProducts);
router.post('/sales', upload.single('file'), uploadController.uploadSales);

module.exports = router;
