const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const crypto = require('crypto');


const DB_DIR = path.join(__dirname, '../../database');
const USERS_FILE = path.join(DB_DIR, 'users.json');
const HISTORY_FILE = path.join(DB_DIR, 'history.json');
const TRENDING_FILE = path.join(DB_DIR, 'trending.json');

// Ensure database files exist
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, '[]');
if (!fs.existsSync(TRENDING_FILE)) {
  // Populate with initial trending stories
  const initialTrending = [
    {
      id: "t1",
      title: "Global warming reversed in 24 hours due to planetary alignment",
      category: "Propaganda",
      shares: "125K",
      verification: "Debunked by NASA - climate science is unaffected by alignments.",
      credibility: 12,
      date: "2026-06-17"
    },
    {
      id: "t2",
      title: "Health ministry advises eating raw onions to build 100% immunity against viruses",
      category: "Fake News",
      shares: "85K",
      verification: "Debunked by WHO - no scientific basis for raw onion immunization.",
      credibility: 8,
      date: "2026-06-15"
    },
    {
      id: "t3",
      title: "Scientists find ancient mechanical device under the sands of Egypt",
      category: "Misleading News",
      shares: "42K",
      verification: "Half-true - Archaeologists found a gear-like bronze calendar, not a high-tech machine.",
      credibility: 45,
      date: "2026-06-14"
    },
    {
      id: "t4",
      title: "Local mayor declares weekend is now 3 days long starting next month",
      category: "Satire",
      shares: "30K",
      verification: "Confirmed Satire - Published originally by a local comedy blog.",
      credibility: 80,
      date: "2026-06-18"
    }
  ];
  fs.writeFileSync(TRENDING_FILE, JSON.stringify(initialTrending, null, 2));
}

let mongoClient = null;
let mongoDb = null;
let isConnected = false;

async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('[DATABASE] No MONGODB_URI found. Operating in local JSON file mode.');
    return;
  }

  try {
    console.log('[DATABASE] Connecting to MongoDB Atlas...');
    mongoClient = new MongoClient(uri, {
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000
    });
    await mongoClient.connect();
    mongoDb = mongoClient.db();
    isConnected = true;
    console.log('[DATABASE] Connected to MongoDB successfully.');
    
    // Sync initial data
    await syncDataFromMongo();
  } catch (err) {
    console.error('[DATABASE ERROR] Failed to connect to MongoDB. Using local fallback database.', err.message);
    isConnected = false;
  }
}

async function syncDataFromMongo() {
  try {
    const collections = ['users', 'history', 'trending'];
    const fileMap = {
      users: USERS_FILE,
      history: HISTORY_FILE,
      trending: TRENDING_FILE
    };

    for (const name of collections) {
      const col = mongoDb.collection(name);
      const docs = await col.find({}).toArray();
      
      let localData = [];
      try {
        localData = JSON.parse(fs.readFileSync(fileMap[name], 'utf-8'));
      } catch (e) {
        localData = [];
      }
      
      if (docs.length === 0 && localData.length > 0) {
        // MongoDB is empty, populate MongoDB from local JSON
        console.log(`[DATABASE SYNC] Populating MongoDB collection '${name}' from local JSON file...`);
        await col.insertMany(localData.map(d => ({ ...d })));
      } else if (docs.length > 0) {
        // MongoDB has data, sync it back to local JSON file
        console.log(`[DATABASE SYNC] Syncing '${name}' from MongoDB to local JSON...`);
        const cleanDocs = docs.map(doc => {
          const { _id, ...rest } = doc;
          return rest;
        });
        fs.writeFileSync(fileMap[name], JSON.stringify(cleanDocs, null, 2));
      }
    }
  } catch (err) {
    console.error('[DATABASE SYNC ERROR] Failed to sync data with MongoDB:', err.message);
  }
}

// Database helper functions
const db = {
  getUsers: () => {
    try {
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
      let modified = false;

      const normalizedUsers = users.map(u => {
        const verifiedVal = u.emailVerified !== undefined ? u.emailVerified : u.isVerified;
        
        let idVal = u.id;
        if (!idVal) {
          // Generate a deterministic unique ID based on email so it's stable
          idVal = crypto.createHash('md5').update(u.email).digest('hex');
          modified = true;
        }

        return {
          ...u,
          id: idVal,
          emailVerified: !!verifiedVal,
          isVerified: !!verifiedVal
        };
      });

      if (modified) {
        fs.writeFileSync(USERS_FILE, JSON.stringify(normalizedUsers, null, 2));
      }

      return normalizedUsers;
    } catch (e) {
      return [];
    }
  },
  saveUsers: (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    
    if (isConnected && mongoDb) {
      (async () => {
        try {
          const col = mongoDb.collection('users');
          await col.deleteMany({});
          if (users.length > 0) {
            await col.insertMany(users.map(u => ({ ...u })));
          }
        } catch (err) {
          console.error('[DATABASE ERROR] Failed to save users to MongoDB:', err.message);
        }
      })();
    }
  },
  getHistory: () => {
    try {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    } catch (e) {
      return [];
    }
  },
  saveHistory: (history) => {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    
    if (isConnected && mongoDb) {
      (async () => {
        try {
          const col = mongoDb.collection('history');
          await col.deleteMany({});
          if (history.length > 0) {
            await col.insertMany(history.map(h => ({ ...h })));
          }
        } catch (err) {
          console.error('[DATABASE ERROR] Failed to save history to MongoDB:', err.message);
        }
      })();
    }
  },
  getTrending: () => {
    try {
      return JSON.parse(fs.readFileSync(TRENDING_FILE, 'utf-8'));
    } catch (e) {
      return [];
    }
  },
  saveTrending: (trending) => {
    fs.writeFileSync(TRENDING_FILE, JSON.stringify(trending, null, 2));
    
    if (isConnected && mongoDb) {
      (async () => {
        try {
          const col = mongoDb.collection('trending');
          await col.deleteMany({});
          if (trending.length > 0) {
            await col.insertMany(trending.map(t => ({ ...t })));
          }
        } catch (err) {
          console.error('[DATABASE ERROR] Failed to save trending stories to MongoDB:', err.message);
        }
      })();
    }
  }
};

// Start database background connection
connectMongo();

console.log('Database helper loaded. Local data storage path:', DB_DIR);

module.exports = db;
