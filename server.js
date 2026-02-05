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

// ============ PRACTICE TASK 12: NEW ENDPOINTS ============
// 1. Version endpoint (Option A - recommended)
app.get('/version', (req, res) => {
  res.json({
    version: "1.1",
    updatedAt: "2026-01-18",
    author: "Your Name"
  });
});

// 2. Health check endpoint (Option C)
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await getProductsCollection().findOne({});
    
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: "connected"
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      error: err.message,
      database: "disconnected"
    });
  }
});

// 3. Updated root route (Option B)
app.get('/', (req, res) => {
  res.json({ message: 'Backend API is running (updated)' });
});

// ============ PRACTICE TASK 13: FULL REST API FOR ITEMS ============
// GET all items
app.get('/api/items', async (req, res) => {
  try {
    const items = await getProductsCollection().find().toArray();
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET by id
app.get('/api/items/:id', async (req, res) => {
  try {
    // Validate ID format
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const item = await getProductsCollection().findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.status(200).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new item
app.post('/api/items', async (req, res) => {
  try {
    const { name, description, price, quantity } = req.body;
    
    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Valid name is required' });
    }
    
    const newItem = {
      name: name.trim(),
      description: description ? description.trim() : '',
      price: price ? Number(price) : 0,
      quantity: quantity ? Number(quantity) : 0,
      createdAt: new Date()
    };
    
    const result = await getProductsCollection().insertOne(newItem);
    
    // Fetch the created item with its ID
    const createdItem = await getProductsCollection().findOne({ 
      _id: result.insertedId 
    });
    
    res.status(201).json(createdItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT (full update)
app.put('/api/items/:id', async (req, res) => {
  try {
    // Validate ID format
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const { name, description, price, quantity } = req.body;
    
    // Validate required fields for full update
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Valid name is required for full update' });
    }
    
    const updateData = {
      name: name.trim(),
      description: description ? description.trim() : '',
      price: price ? Number(price) : 0,
      quantity: quantity ? Number(quantity) : 0,
      updatedAt: new Date()
    };
    
    const result = await getProductsCollection().findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.status(200).json(result.value);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH (partial update)
app.patch('/api/items/:id', async (req, res) => {
  try {
    // Validate ID format
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const updateData = { ...req.body };
    
    // Clean up update data
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === null) {
        delete updateData[key];
      }
      
      // Trim string values
      if (typeof updateData[key] === 'string') {
        updateData[key] = updateData[key].trim();
      }
    });
    
    // Don't allow updating createdAt
    delete updateData.createdAt;
    
    // Add updated timestamp
    updateData.updatedAt = new Date();
    
    const result = await getProductsCollection().findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.status(200).json(result.value);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
app.delete('/api/items/:id', async (req, res) => {
  try {
    // Validate ID format
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const result = await getProductsCollection().findOneAndDelete({
      _id: new ObjectId(req.params.id)
    });

    if (!result.value) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ EXISTING PRACTICE TASK 6 ENDPOINTS (if needed) ============
// Add your existing Practice Task 6 endpoints here
// app.get("/fast", ...);
// app.get("/slow-async", ...);
// etc.

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`\nPractice Task 12 endpoints:`);
      console.log(`  GET /version`);
      console.log(`  GET /health`);
      console.log(`  GET /`);
      console.log(`\nPractice Task 13 REST API:`);
      console.log(`  GET    /api/items`);
      console.log(`  GET    /api/items/:id`);
      console.log(`  POST   /api/items`);
      console.log(`  PUT    /api/items/:id`);
      console.log(`  PATCH  /api/items/:id`);
      console.log(`  DELETE /api/items/:id`);
    });
  })
  .catch(err => {
    console.error('DB connection failed:', err);
    process.exit(1);
  });