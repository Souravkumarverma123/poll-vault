const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// Registration validation
const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidation,
];

// Login validation
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidation,
];

// Poll creation validation
const validatePoll = [
  body('title')
    .trim()
    .notEmpty().withMessage('Poll title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('responseMode')
    .optional()
    .isIn(['anonymous', 'authenticated']).withMessage('Response mode must be anonymous or authenticated'),
  body('expiresAt')
    .notEmpty().withMessage('Expiry date is required')
    .isISO8601().withMessage('Expiry date must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    }),
  body('questions')
    .isArray({ min: 1 }).withMessage('At least one question is required'),
  body('questions.*.questionText')
    .trim()
    .notEmpty().withMessage('Question text is required'),
  body('questions.*.questionType')
    .optional()
    .isIn(['single', 'multiple', 'text']).withMessage('Question type must be single, multiple, or text'),
  body('questions.*.options')
    .optional()
    .isArray().withMessage('Options must be an array'),
  body('questions.*.options.*')
    .optional()
    .trim()
    .notEmpty().withMessage('Option text cannot be empty'),
  body('questions.*.isRequired')
    .optional()
    .isBoolean().withMessage('isRequired must be a boolean'),
  handleValidation,
];

// Response submission validation
const validateResponse = [
  body('answers')
    .isArray({ min: 1 }).withMessage('At least one answer is required'),
  body('answers.*.questionId')
    .notEmpty().withMessage('Question ID is required')
    .isMongoId().withMessage('Invalid question ID'),
  body('answers.*.selectedOption')
    .trim()
    .notEmpty().withMessage('Selected option is required'),
  handleValidation,
];

module.exports = {
  validateRegister,
  validateLogin,
  validatePoll,
  validateResponse,
};
