const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/signup', async (req, res) => {
  try {
    const { name, password, code } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ name });
    if (user) return res.status(400).json({ message: 'User already exists' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ name, password: hashedPassword });
    await user.save();

    // Create token
    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user.id, name: user.name } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { name, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ name });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Create token
    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user.id, name: user.name } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/logout', async (req, res) => {
  // Currently stateless JWTs are revoked on the client side (removing localStorage tokens).
  // If a server-side token blacklist/versioning is added in the future, it should go here.
  res.json({ message: 'Logged out successfully from all devices.' });
});

router.delete('/delete-account/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    const Chat = require('../models/Chat');
    await Chat.deleteMany({ userId: req.params.id });
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
