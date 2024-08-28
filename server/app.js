const express = require('express');
const path = require('path');
const app = express();

// Import the movies routes
const moviesRouter = require('./routes/imdb.js');

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse URL-encoded bodies (form data)
app.use(express.urlencoded({ extended: true }));

// Serve static files from the "public" folder, which is one level up from `app.js`
app.use(express.static(path.join(__dirname, '../public')));

// Use the movies routes under the "/api" path
app.use('/api', moviesRouter);

// Test route for the API
app.get('/api', (req, res) => {
    res.json({ message: 'This is a test' });
});

module.exports = app;
