const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    chestNo: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    teamName: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Participant', participantSchema);
