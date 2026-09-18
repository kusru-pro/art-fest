const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    chestNo: {
      type: String,
      required: true,
      trim: true,
      ref: 'Participant'
    },
    eventId: {
      type: String,
      required: true,
      trim: true,
      ref: 'Event'
    },
    marks: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    grade: {
      type: String,
      required: true,
      enum: ['A', 'B', 'C', 'None'],
      default: 'None'
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'published'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

// Compound index to prevent duplicate submissions for the same participant in the same event
resultSchema.index({ chestNo: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);
