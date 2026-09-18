const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Participant = require('../models/Participant');
const Event = require('../models/Event');

/**
 * @route   POST /api/judge/submit
 * @desc    Accept marks from Judge Panel and save with status: 'pending'
 * @payload { eventId: String, scores: [{ chestNo: String, marks: Number, grade: String }] }
 *          OR { chestNo: String, eventId: String, marks: Number, grade: String }
 */
router.post('/submit', async (req, res) => {
  try {
    const { eventId, scores, chestNo, marks, grade } = req.body;

    // Support batch scoring from Judge Panel
    if (Array.isArray(scores) && scores.length > 0) {
      if (!eventId) {
        return res.status(400).json({ success: false, message: 'eventId is required for batch submission.' });
      }

      const savedResults = [];

      for (const item of scores) {
        if (!item.chestNo || item.marks === undefined || item.marks === '') {
          continue; // Skip empty entries
        }

        const markVal = Number(item.marks);
        if (isNaN(markVal) || markVal < 0 || markVal > 100) {
          return res.status(400).json({
            success: false,
            message: `Invalid marks (${item.marks}) for chest number ${item.chestNo}. Must be between 0 and 100.`
          });
        }

        // Upsert pending result
        const updated = await Result.findOneAndUpdate(
          { chestNo: String(item.chestNo).trim(), eventId: String(eventId).trim() },
          {
            chestNo: String(item.chestNo).trim(),
            eventId: String(eventId).trim(),
            marks: markVal,
            grade: item.grade || 'None',
            status: 'pending'
          },
          { upsert: true, new: true, runValidators: true }
        );

        savedResults.push(updated);
      }

      return res.status(201).json({
        success: true,
        message: `Successfully submitted ${savedResults.length} evaluation(s) to the Project Council.`,
        count: savedResults.length,
        data: savedResults
      });
    }

    // Support single participant score submission
    if (!chestNo || !eventId || marks === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: chestNo, eventId, and marks are required.'
      });
    }

    const singleMark = Number(marks);
    if (isNaN(singleMark) || singleMark < 0 || singleMark > 100) {
      return res.status(400).json({
        success: false,
        message: 'Marks must be a numeric value between 0 and 100.'
      });
    }

    const result = await Result.findOneAndUpdate(
      { chestNo: String(chestNo).trim(), eventId: String(eventId).trim() },
      {
        chestNo: String(chestNo).trim(),
        eventId: String(eventId).trim(),
        marks: singleMark,
        grade: grade || 'None',
        status: 'pending'
      },
      { upsert: true, new: true, runValidators: true }
    );

    return res.status(201).json({
      success: true,
      message: 'Evaluation saved and forwarded to Council for verification.',
      data: result
    });
  } catch (error) {
    console.error('Error submitting judge marks:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while submitting evaluation.',
      error: error.message
    });
  }
});

module.exports = router;
