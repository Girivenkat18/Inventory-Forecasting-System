const express = require('express');
const router = express.Router();
const forecastController = require('../controllers/forecastController');

router.post('/generate', forecastController.generateForecast);


module.exports = router;
