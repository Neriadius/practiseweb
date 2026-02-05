require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'views')));

// ============ IN-MEMORY DATABASE ============
let itemsDB = [
  {
    id: "1",
    name: "Laptop",
    description: "Gaming laptop with RTX 4080",
    price: 1499.99,
    quantity: 10,
    category: "electronics",
    createdAt: "2024-01-18T10:00:00.000Z",
    updatedAt: "2024-01-18T10:00:00.000Z"
  },
  {
    id: "2",
    name: "Smartphone",
    description: "Latest smartphone with 5G",
    price: 899.99,
    quantity: 25,
    category: "electronics",
    createdAt: "2024-01-18T11:30:00.000Z",
    updatedAt: "2024-01-18T11:30:00.000Z"
  },
  {
    id: "3",
    name: "Headphones",
    description: "Wireless noise-cancelling",
    price: 299.99,
    quantity: 50,
    category: "audio",
    createdAt: "2024-01-18T12:45:00.000Z",
    updatedAt: "2024-01-18T12:45:00.000Z"
  }
];

// Helper function to generate unique ID
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// ============ PRACTICE TASK 12: NEW ENDPOINTS ============
// 1. Version endpoint (Option A - recommended)
app.get('/version', (req, res) => {
  res.json({
    version: "1.1",
    updatedAt: "2026-01-18",
    author: "Your Name",
    note: "Practice Task 12 completed without MongoDB"
  });
});

// 2. Health check endpoint (Option C)
app.get('/health', (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: "in-memory",
    itemsCount: itemsDB.length,
    note: "Using in-memory storage for demonstration"
  });
});

// 3. Updated root route (Option B)
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend API is running (updated)',
    storage: 'in-memory (no MongoDB)',
    tasks: 'Practice Tasks 12 & 13 completed'
  });
});

// ============ PRACTICE TASK 13: FULL REST API FOR ITEMS ============
// GET all items
app.get('/api/items', (req, res) => {
  try {
    res.status(200).json({
      success: true,
      count: itemsDB.length,
      data: itemsDB
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET by id
app.get('/api/items/:id', (req, res) => {
  try {
    const item = itemsDB.find(item => item.id === req.params.id);

    if (!item) {
      return res.status(404).json({ 
        success: false,
        error: 'Item not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new item
app.post('/api/items', (req, res) => {
  try {
    const { name, description, price, quantity, category } = req.body;
    
    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'Valid name is required' 
      });
    }
    
    const newItem = {
      id: generateId(),
      name: name.trim(),
      description: description ? description.trim() : '',
      price: price ? Number(price) : 0,
      quantity: quantity ? Number(quantity) : 0,
      category: category || 'general',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    itemsDB.push(newItem);
    
    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: newItem
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT (full update)
app.put('/api/items/:id', (req, res) => {
  try {
    const { name, description, price, quantity, category } = req.body;
    
    // Validate required fields for full update
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'Valid name is required for full update' 
      });
    }
    
    const itemIndex = itemsDB.findIndex(item => item.id === req.params.id);
    
    if (itemIndex === -1) {
      return res.status(404).json({ 
        success: false,
        error: 'Item not found' 
      });
    }
    
    const updatedItem = {
      ...itemsDB[itemIndex],
      name: name.trim(),
      description: description ? description.trim() : '',
      price: price ? Number(price) : 0,
      quantity: quantity ? Number(quantity) : 0,
      category: category || itemsDB[itemIndex].category,
      updatedAt: new Date().toISOString()
    };
    
    itemsDB[itemIndex] = updatedItem;
    
    res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      data: updatedItem
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH (partial update)
app.patch('/api/items/:id', (req, res) => {
  try {
    const itemIndex = itemsDB.findIndex(item => item.id === req.params.id);
    
    if (itemIndex === -1) {
      return res.status(404).json({ 
        success: false,
        error: 'Item not found' 
      });
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
    
    // Don't allow updating id or createdAt
    delete updateData.id;
    delete updateData.createdAt;
    
    // Add updated timestamp
    updateData.updatedAt = new Date().toISOString();
    
    const updatedItem = {
      ...itemsDB[itemIndex],
      ...updateData
    };
    
    itemsDB[itemIndex] = updatedItem;
    
    res.status(200).json({
      success: true,
      message: 'Item partially updated',
      data: updatedItem
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
app.delete('/api/items/:id', (req, res) => {
  try {
    const initialLength = itemsDB.length;
    itemsDB = itemsDB.filter(item => item.id !== req.params.id);
    
    if (itemsDB.length === initialLength) {
      return res.status(404).json({ 
        success: false,
        error: 'Item not found' 
      });
    }
    
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ EXISTING PRACTICE TASK 6 ENDPOINTS ============
// Add your existing Practice Task 6 endpoints here if needed
// app.get("/fast", ...);
// app.get("/slow-async", ...);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server WITHOUT MongoDB
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(` Storage: In-memory (no MongoDB connection)`);
  console.log(`\n PRACTICE TASK 12 ENDPOINTS:`);
  console.log(`  GET /version`);
  console.log(`  GET /health`);
  console.log(`  GET /`);
  console.log(`\n PRACTICE TASK 13 REST API:`);
  console.log(`  GET    /api/items`);
  console.log(`  GET    /api/items/:id`);
  console.log(`  POST   /api/items`);
  console.log(`  PUT    /api/items/:id`);
  console.log(`  PATCH  /api/items/:id`);
  console.log(`  DELETE /api/items/:id`);
  console.log(`\n Note: Using in-memory storage for deployment demonstration`);
});