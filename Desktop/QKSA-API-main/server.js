require('dotenv').config();
const express = require('express');
const mysql = require('mysql');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Ranemat19@',
    database: process.env.DB_NAME || 'restaurantdb',
    charset: 'utf8mb4' // Ensure the connection uses utf8mb4
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database.');
    // Load data into the database on successful connection
    loadDataToDatabase();
});

const loadDataToDatabase = () => {
    const data = fs.readFileSync('./restaurants.json', 'utf8');
    const restaurants = JSON.parse(data);

    restaurants.forEach(restaurant => {
        const checkQuery = 'SELECT * FROM restaurants WHERE restaurant_name = ? AND location = ?';
        db.query(checkQuery, [restaurant.restaurant_name, restaurant.location], (err, results) => {
            if (err) {
                console.error('Error checking data:', err);
                return;
            }
            if (results.length === 0) {
                const query = 'INSERT INTO restaurants (restaurant_name, description, location, rating) VALUES (?, ?, ?, ?)';
                db.query(query, [restaurant.restaurant_name, restaurant.description, restaurant.location, restaurant.rating], (err, result) => {
                    if (err) {
                        console.error('Error inserting data:', err);
                        console.error('SQL Query:', query);
                        console.error('Data:', [restaurant.restaurant_name, restaurant.description, restaurant.location, restaurant.rating]);
                    }
                });
            } else {
                console.log(`Restaurant with name ${restaurant.restaurant_name} and location ${restaurant.location} already exists.`);
            }
        });
    });
    console.log('Data loaded to the database.');
};

// Test DB connection endpoint
app.get('/test-db', (req, res) => {
    db.query('SELECT 1 + 1 AS solution', (err, results) => {
        if (err) {
            console.error('Error testing the database connection:', err);
            res.status(500).send('Database connection failed');
            return;
        }
        res.send(`Database connection successful: ${results[0].solution}`);
    });
});

// CRUD Endpoints
app.get('/', (req, res) => {
    res.send('Welcome to the QKSA API!');
});

app.get('/restaurants', (req, res) => {
    db.query('SELECT * FROM restaurants', (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).send('Server error');
            return;
        }
        res.json(results);
    });
});

app.post('/restaurants', (req, res) => {
    const newRestaurant = req.body;
    const checkQuery = 'SELECT * FROM restaurants WHERE restaurant_name = ? AND location = ?';
    db.query(checkQuery, [newRestaurant.restaurant_name, newRestaurant.location], (err, results) => {
        if (err) {
            console.error('Error checking data:', err);
            res.status(500).send('Server error during check');
            return;
        }
        if (results.length > 0) {
            res.status(400).send('Restaurant with the same name and location already exists');
        } else {
            const query = 'INSERT INTO restaurants (restaurant_name, description, location, rating) VALUES (?, ?, ?, ?)';
            db.query(query, [newRestaurant.restaurant_name, newRestaurant.description, newRestaurant.location, newRestaurant.rating], (err, result) => {
                if (err) {
                    console.error('Error inserting data:', err);
                    console.error('SQL Query:', query);
                    console.error('Data:', [newRestaurant.restaurant_name, newRestaurant.description, newRestaurant.location, newRestaurant.rating]);
                    res.status(500).send('Server error during insertion');
                    return;
                }
                res.status(201).json({ id: result.insertId, ...newRestaurant });
            });
        }
    });
});

app.put('/restaurants/:id', (req, res) => {
    const restaurantId = req.params.id;
    const updatedRestaurant = req.body;
    const checkQuery = 'SELECT * FROM restaurants WHERE restaurant_name = ? AND location = ? AND id != ?';
    db.query(checkQuery, [updatedRestaurant.restaurant_name, updatedRestaurant.location, restaurantId], (err, results) => {
        if (err) {
            console.error('Error checking data:', err);
            res.status(500).send('Server error');
            return;
        }
        if (results.length > 0) {
            res.status(400).send('Another restaurant with the same name and location already exists');
        } else {
            const query = 'UPDATE restaurants SET restaurant_name = ?, description = ?, location = ?, rating = ? WHERE id = ?';
            db.query(query, [updatedRestaurant.restaurant_name, updatedRestaurant.description, updatedRestaurant.location, updatedRestaurant.rating, restaurantId], (err, result) => {
                if (err) {
                    console.error('Error updating data:', err);
                    res.status(500).send('Server error');
                    return;
                }
                res.json({ id: restaurantId, ...updatedRestaurant });
            });
        }
    });
});

app.delete('/restaurants/:id', (req, res) => {
    const restaurantId = req.params.id;
    const query = 'DELETE FROM restaurants WHERE id = ?';
    db.query(query, [restaurantId], (err, result) => {
        if (err) {
            console.error('Error deleting data:', err);
            res.status(500).send('Server error');
            return;
        }
        res.json({ message: 'Restaurant deleted' });
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
