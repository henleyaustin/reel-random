const express = require('express');
const path = require('path');
const app = express();

module.exports = app;

app.use(express.static(path.join(__dirname, 'views')));

app.get('/api', (req, res) => {
    res.json({ message: 'This is a test' });
});
