const express = require('express');
const router = express.Router();
const exampleController = require('../controllers/exampleController');

router.get('/', exampleController.getExample);
router.post('/', exampleController.postExample);

module.exports = router;

