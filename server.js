require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { ObjectId } = require('mongodb');

const { connectDB, getProductsCollection } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'views')));

// Root
app.get('/', (req, res) => {
  res.json({ message: 'Backend API is running' });
});

// GET all items
app.get('/api/items', async (req, res) => {
  try {
    const items = await getProductsCollection().find().toArray();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET by id
app.get('/api/items/:id', async (req, res) => {
  try {
    const item = await getProductsCollection().findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch (err) {
    res.status(400).json({ error: 'Invalid ID' });
  }
});

// POST
app.post('/api/items', async (req, res) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await getProductsCollection().insertOne({
      name: req.body.name,
      description: req.body.description || '',
      price: req.body.price || 0,
      quantity: req.body.quantity || 0,
      createdAt: new Date()
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT (full update)
app.put('/api/items/:id', async (req, res) => {
  try {
    const result = await getProductsCollection().updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ updated: true });
  } catch (err) {
    res.status(400).json({ error: 'Invalid ID' });
  }
});

// PATCH (partial update)
app.patch('/api/items/:id', async (req, res) => {
  try {
    const result = await getProductsCollection().updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ updated: true });
  } catch (err) {
    res.status(400).json({ error: 'Invalid ID' });
  }
});

// DELETE
app.delete('/api/items/:id', async (req, res) => {
  try {
    const result = await getProductsCollection().deleteOne({
      _id: new ObjectId(req.params.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: 'Invalid ID' });
  }
});

// Start server
connectDB()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`)
    );
  })
  .catch(err => {
    console.error('DB connection failed:', err);
  });
