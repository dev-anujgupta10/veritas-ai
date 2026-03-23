const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'ai'], required: true },
  content: { type: String },
  imageUrl: { type: String },
  verdict: { type: String },
  confidence: { type: Number },       // Stored as numeric 0-100
  summary: { type: String, default: null }, // Only for TRUE verdicts
  sources: [{ title: String, name: String, url: String }]
}, { _id: false });

const chatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'New Verification Chat', required: true },
  messages: [messageSchema],
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
