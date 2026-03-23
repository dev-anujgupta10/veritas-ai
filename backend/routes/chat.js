const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const auth = require('../middleware/auth');

// Get all chats for a user
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user.userId }).sort({ updatedAt: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new chat
router.post('/', auth, async (req, res) => {
  try {
    const newChat = new Chat({
      userId: req.user.userId,
      title: req.body.title || 'New Verification Chat',
      messages: []
    });
    const chat = await newChat.save();
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add message to chat
router.put('/:id/message', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (chat.userId.toString() !== req.user.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    chat.messages.push(req.body); // { role, content, verdict, confidence, sources }
    await chat.save();
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete specific chat
router.delete('/:id', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (chat.userId.toString() !== req.user.userId) {
        return res.status(401).json({ message: 'Not authorized' });
    }
    await chat.deleteOne();
    res.json({ message: 'Chat removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update chat title
router.put('/:id', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (chat.userId.toString() !== req.user.userId) {
        return res.status(401).json({ message: 'Not authorized' });
    }
    
    if (req.body.title) {
      chat.title = req.body.title;
      await chat.save();
    }
    
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete all chats for a user
router.delete('/all/clear', auth, async (req, res) => {
  try {
    await Chat.deleteMany({ userId: req.user.userId });
    res.json({ message: 'All chats removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
