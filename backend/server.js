require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
// const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../public')); // Serve frontend files

// Basic Route
app.get('/api', (req, res) => {
    res.json({ message: 'Welcome to the E-LaborBridge API!' });
});

// Serve the frontend application
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../public', 'index.html'));
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 