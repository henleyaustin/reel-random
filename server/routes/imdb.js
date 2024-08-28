const express = require('express');
const router = express.Router();
const movieController = require('../controllers/imdbController.js');

// Route to fetch all movies
router.post('/movies/', movieController.getMoviesForUser);

module.exports = router;
