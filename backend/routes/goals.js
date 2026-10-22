
const express = require('express');
const router = express.Router();
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

// Single-account college demo
const DEMO_USER_ID = 'usr_demo_1001';

// Get all goals
router.get('/', (req, res) => {
  try {
    const goals = db.prepare(`
      SELECT id, name, target_amount, current_amount,
             target_date, status, created_at
      FROM goals
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(DEMO_USER_ID);

    res.json(goals);
  } catch (error) {
    console.error('Load goals error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a goal
router.post('/', (req, res) => {
  try {
    const {
      name, target_amount, current_amount,
      target_date, status
    } = req.body || {};

    const target = Number(target_amount);
    const current = current_amount === undefined
      ? 0
      : Number(current_amount);

    if (!name || !Number.isFinite(target) || target <= 0 ||
        !Number.isFinite(current) || current < 0) {
      return res.status(400).json({
        error: 'Enter a name and valid goal amounts'
      });
    }

    const goal = {
      id: uuidv4(),
      user_id: DEMO_USER_ID,
      name: String(name).trim(),
      target_amount: target,
      current_amount: current,
      target_date: target_date || null,
      status: status || 'Active',
      created_at: new Date().toISOString()
    };

    db.prepare(`
      INSERT INTO goals
      (id, user_id, name, target_amount, current_amount,
       target_date, status, created_at)
      VALUES
      (@id, @user_id, @name, @target_amount, @current_amount,
       @target_date, @status, @created_at)
    `).run(goal);

    res.status(201).json(goal);
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a goal or its progress
router.put('/:id', (req, res) => {
  try {
    const goal = db.prepare(
      'SELECT * FROM goals WHERE id = ? AND user_id = ?'
    ).get(req.params.id, DEMO_USER_ID);

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const data = req.body || {};
    const name = data.name === undefined ? goal.name : String(data.name).trim();
    const target = data.target_amount === undefined
      ? goal.target_amount : Number(data.target_amount);
    const current = data.current_amount === undefined
      ? goal.current_amount : Number(data.current_amount);
    const targetDate = data.target_date === undefined
      ? goal.target_date : (data.target_date || null);
    const status = data.status === undefined ? goal.status : data.status;

    if (!name || !Number.isFinite(target) || target <= 0 ||
        !Number.isFinite(current) || current < 0) {
      return res.status(400).json({ error: 'Invalid goal details or amounts' });
    }

    db.prepare(`
      UPDATE goals
      SET name = ?, target_amount = ?, current_amount = ?,
          target_date = ?, status = ?
      WHERE id = ? AND user_id = ?
    `).run(name, target, current, targetDate, status,
           req.params.id, DEMO_USER_ID);

    res.json({
      ...goal,
      name,
      target_amount: target,
      current_amount: current,
      target_date: targetDate,
      status
    });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a goal
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare(
      'DELETE FROM goals WHERE id = ? AND user_id = ?'
    ).run(req.params.id, DEMO_USER_ID);

    if (!result.changes) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
