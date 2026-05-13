const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
  },
  questionType: {
    type: String,
    enum: ['single', 'multiple', 'text'],
    default: 'single',
  },
  options: {
    type: [String],
    validate: {
      validator: function (v) {
        // options only required for single/multiple types
        if (this.questionType === 'text') return true;
        return v && v.length >= 2;
      },
      message: 'Each choice question must have at least 2 options',
    },
    default: [],
  },
  isRequired: {
    type: Boolean,
    default: true,
  },
});

const pollSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  shareId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Poll title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: '',
  },
  responseMode: {
    type: String,
    enum: ['named', 'anonymous'],
    default: 'anonymous',
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  isClosed: {
    type: Boolean,
    default: false,
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiry date is required'],
    validate: {
      validator: function (v) {
        if (this.isNew) return v > new Date();
        return true;
      },
      message: 'Expiry date must be in the future',
    },
  },
  questions: {
    type: [questionSchema],
    validate: {
      validator: function (v) {
        return v && v.length >= 1;
      },
      message: 'Poll must have at least one question',
    },
  },
}, {
  timestamps: true,
});



module.exports = mongoose.model('Poll', pollSchema);
