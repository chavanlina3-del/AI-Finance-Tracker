const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const db = new Database(path.join(__dirname, 'finance.db'), { verbose: console.log });

db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL
  );

  
CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    month TEXT NOT NULL,
    UNIQUE(category, month, user_id)
);

`);

// Seed default categories
const defaultCategories = [
  { id: uuidv4(), name: 'Food', type: 'expense', icon: '🍔', color: '#ff5722' },
  { id: uuidv4(), name: 'Transport', type: 'expense', icon: '🚗', color: '#2196f3' },
  { id: uuidv4(), name: 'Rent', type: 'expense', icon: '🏠', color: '#9c27b0' },
  { id: uuidv4(), name: 'Entertainment', type: 'expense', icon: '🎮', color: '#ffeb3b' },
  { id: uuidv4(), name: 'Shopping', type: 'expense', icon: '🛍️', color: '#e91e63' },
  { id: uuidv4(), name: 'Health', type: 'expense', icon: '💊', color: '#4caf50' },
  { id: uuidv4(), name: 'Bills', type: 'expense', icon: '📄', color: '#607d8b' },
  { id: uuidv4(), name: 'Salary', type: 'income', icon: '💰', color: '#8bc34a' },
  { id: uuidv4(), name: 'Freelance', type: 'income', icon: '💻', color: '#00bcd4' },
  { id: uuidv4(), name: 'Investment', type: 'income', icon: '📈', color: '#3f51b5' },
  { id: uuidv4(), name: 'Other Income', type: 'income', icon: '💵', color: '#cddc39' },
  { id: uuidv4(), name: 'Other Expense', type: 'expense', icon: '📦', color: '#795548' }
];

const checkCategories = db.prepare('SELECT COUNT(*) AS count FROM categories').get();
if (checkCategories.count === 0) {
  const insertCategory = db.prepare(`
    INSERT INTO categories (id, name, type, icon, color) 
    VALUES (@id, @name, @type, @icon, @color)
  `);
  
  const insertMany = db.transaction((cats) => {
    for (const cat of cats) insertCategory.run(cat);
  });
  
  insertMany(defaultCategories);
  console.log('Seeded default categories.');
}

module.exports = db;
