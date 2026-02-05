// const { MongoClient } = require('mongodb');
// require("dotenv").config()

// let client;
// let productsCollection;

// function getClient() {
//   if (!process.env.MONGO_URI) {
//     throw new Error('MONGO_URI not set');
//   }

//   if (!client) {
//     client = new MongoClient(process.env.MONGO_URI, {
//       serverSelectionTimeoutMS: 10000
//     });
//   }

//   return client;
// }

// async function connectDB() {
//   const c = getClient();
//   await c.connect();
//   const db = c.db('shop');
//   productsCollection = db.collection('product');
//   console.log('DB connected');
// }

// function getProductsCollection() {
//   if (!productsCollection) {
//     throw new Error('DB not connected yet');
//   }
//   return productsCollection;
// }

// module.exports = { connectDB, getProductsCollection };
