const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET, requireAuth, requireRole } = require('../middleware/auth');

function createToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'claimant', organization, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      organization: organization || '',
      phone: phone || ''
    });

    await user.save();

    const token = createToken(user);
    res.status(201).json({
      message: 'Account registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = createToken(user);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Quick guest demo login/signup helper
router.post('/demo-login', async (req, res) => {
  try {
    const { role = 'claimant', name = 'Demo User', email } = req.body;
    const targetEmail = email || `demo.${role}.${Date.now()}@jurisai.test`;

    let user = await User.findOne({ email: targetEmail });
    if (!user) {
      user = new User({
        name,
        email: targetEmail,
        password: 'demo_password_123',
        role
      });
      await user.save();
    }

    const token = createToken(user);
    res.json({
      message: 'Demo session authenticated',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create demo session.' });
  }
});

// GET /api/auth/users — Admin: list all users
router.get('/users', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
});

// DELETE /api/auth/users/:id — Admin: remove a user
router.delete('/users/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found.' });
    if (target._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own admin account.' });
    }
    await target.deleteOne();
    res.json({ message: `User "${target.name}" removed successfully.` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user.' });
  }
});

module.exports = router;
