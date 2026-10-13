const express = require('express');
const router = express.Router();
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY type, name').all();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, type, icon, color } = req.body;
    const newCategory = {
      id: uuidv4(),
      name,
      type,
      icon: icon || '❓',
      color: color || '#9e9e9e'
    };

    const stmt = db.prepare(`
      INSERT INTO categories (id, name, type, icon, color)
      VALUES (@id, @name, @type, @icon, @color)
    `);
    
    stmt.run(newCategory);
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) return res.status(404).json({ error: 'Category not found' });
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
