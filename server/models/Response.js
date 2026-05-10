const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  selectedOption: {
    type: String,
    required: true,
  },
}, { _id: false });

const responseSchema = new mongoose.Schema({
  poll: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll',
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  clientFingerprint: {
    type: String,
    default: null,
  },
  answers: {
    type: [answerSchema],
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

// Enforce one response per authenticated user per poll
responseSchema.index(
  { poll: 1, user: 1 },
  { unique: true, sparse: true, partialFilterExpression: { user: { $ne: null } } }
);

module.exports = mongoose.model('Response', responseSchema);
