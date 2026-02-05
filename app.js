const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const fs = require("fs");
const path = require("path");
require('dotenv').config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;

// ============ MONGODB CONNECTION (native driver) ============
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
let db, itemsCollection;

async function connectToMongoDB() {
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    
    db = client.db('restapi'); // Database name
    itemsCollection = db.collection('items'); // Collection for items
    
    // Create index for better performance
    await itemsCollection.createIndex({ name: 1 });
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}

connectToMongoDB();

// ============ MIDDLEWARE ============
// Logger middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ============ PRACTICE TASK 12: NEW ENDPOINTS ============
// 1. Version endpoint (Option A - recommended)
app.get('/version', (req, res) => {
  res.json({
    version: "1.1",
    updatedAt: "2026-01-18"
  });
});

// 2. Health check endpoint (Option C)
app.get('/health', async (req, res) => {
  try {
    const dbStatus = db ? "connected" : "disconnected";
    
    // Optional: Test database connection
    if (db) {
      await db.command({ ping: 1 });
    }
    
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      uptime: process.uptime()
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      error: err.message
    });
  }
});

// 3. Updated root route (Option B)
app.get('/', (req, res) => {
  res.send('Backend API is running (updated)');
});

// ============ PRACTICE TASK 13: FULL REST API FOR ITEMS ============
// GET /api/items -- retrieve all items
app.get('/api/items', async (req, res) => {
  try {
    if (!itemsCollection) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    
    const items = await itemsCollection.find({}).toArray();
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/items/:id -- retrieve item by ID
app.get('/api/items/:id', async (req, res) => {
  try {
    if (!itemsCollection) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    
    // Validate ID format
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid item ID format' });
    }
    
    const item = await itemsCollection.findOne({ 
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

// POST /api/items -- create a new item
app.post('/api/items', async (req, res) => {
  try {
    if (!itemsCollection) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { name, description, price } = req.body;
    
    // Basic validation
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Valid name is required' });
    }
    
    const newItem = {
      name: name.trim(),
      description: description ? description.trim() : '',
      price: price ? Number(price) : 0,
      createdAt: new Date()
    };
    
    const result = await itemsCollection.insertOne(newItem);
    const createdItem = await itemsCollection.findOne({ _id: result.insertedId });
    
    res.status(201).json(createdItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/items/:id -- update an item (full update)
app.put('/api/items/:id', async (req, res) => {
  try {
    if (!itemsCollection) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    
    // Validate ID format
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid item ID format' });
    }
    
    const { name, description, price } = req.body;
    
    // Validation for full update
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Valid name is required for full update' });
    }
    
    const updateData = {
      name: name.trim(),
      description: description ? description.trim() : '',
      price: price ? Number(price) : 0,
      updatedAt: new Date()
    };
    
    const result = await itemsCollection.findOneAndUpdate(
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

// PATCH /api/items/:id -- update an item (partial update)
app.patch('/api/items/:id', async (req, res) => {
  try {
    if (!itemsCollection) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    
    // Validate ID format
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid item ID format' });
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
    
    // Add updated timestamp
    updateData.updatedAt = new Date();
    
    const result = await itemsCollection.findOneAndUpdate(
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

// DELETE /api/items/:id -- delete an item
app.delete('/api/items/:id', async (req, res) => {
  try {
    if (!itemsCollection) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    
    // Validate ID format
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid item ID format' });
    }
    
    const result = await itemsCollection.findOneAndDelete({
      _id: new ObjectId(req.params.id)
    });
    
    if (!result.value) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.status(204).send(); // No content
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ EXISTING CODE (remains unchanged) ============
app.get('/sum', (req, res) => {
  const a = Number(req.query.a);
  const b = Number(req.query.b);
  res.send(`Sum: ${a + b}`);
});

app.post('/submit', (req, res) => { 
  const { name, email, message } = req.body; 
  res.send(`Name: ${name}, Email: ${email}, Message: ${message}`); 
}); 

app.post('/hello', (req, res) => {
  res.send('Hello');
});

app.post('/user/:id', (req, res) => {
  res.send('User id is -098765432234567890');
});

app.post('/status', (req, res) => {
  res.send('Status is work');
});

app.post('/sum', (req, res) => {
  const validation = 10, status = 400;
  res.send((validation + status).toString());
});

// Practice 6 endpoints
app.get("/fast", (req, res) => {
  res.json({
    route: "/fast",
    message: "Fast response"
  });
});

app.get("/slow-async", async (req, res) => {
  setTimeout(() => {
    res.json({
      route: "/slow-async",
      delayMs: 3000,
      type: "async"
    });
  }, 3000);
});

app.get("/slow-blocking", (req, res) => {
  const start = Date.now();
  while (Date.now() - start < 3000) {
    // Blocking loop
  }
  
  res.json({
    route: "/slow-blocking",
    delayMs: 3000,
    type: "blocking"
  });
});

app.get("/file-async", (req, res) => {
  const filePath = path.join(__dirname, "data.txt");
  
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({
        error: "Failed to read file"
      });
    }
    
    res.json({
      route: "/file-async",
      bytes: Buffer.byteLength(data, "utf8"),
      preview: data.slice(0, 50)
    });
  });
});

app.get("/status-old", (req, res) => {
  res.json({
    server: "running",
    time: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('404 Not Found');
});

