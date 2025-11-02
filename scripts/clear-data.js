#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/sharkdetection?authSource=admin';

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

// Clear all collections
async function clearAllData() {
  try {
    console.log('🧹 Starting database cleanup...\n');

    // Get all collection names
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('📭 Database is already empty');
      return;
    }

    console.log(`📋 Found ${collections.length} collections:`);
    collections.forEach(col => console.log(`   - ${col.name}`));
    console.log('');

    // Clear each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      const count = await mongoose.connection.db.collection(collectionName).countDocuments();
      
      if (count > 0) {
        await mongoose.connection.db.collection(collectionName).deleteMany({});
        console.log(`🗑️  Cleared ${count} documents from ${collectionName}`);
      } else {
        console.log(`📭 ${collectionName} is already empty`);
      }
    }

    console.log('\n✅ Database cleanup completed successfully!');
    console.log('💡 You can now run "npm run seed" to populate with fresh data');

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  try {
    await connectToDatabase();
    await clearAllData();
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { clearAllData, connectToDatabase };
