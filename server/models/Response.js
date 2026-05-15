import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  // Single choice
  selectedOption: {
    type: String,
    default: null,
  },
  // Multiple choice
  selectedOptions: {
    type: [String],
    default: [],
  },
  // Text/open-ended
  textAnswer: {
    type: String,
    default: null,
    maxlength: [2000, 'Text answer cannot exceed 2000 characters'],
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

// TTL Index: Automatically delete responses 30 days after submission
// This prevents unbounded database growth for old/abandoned polls
responseSchema.index({ submittedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model('Response', responseSchema);
