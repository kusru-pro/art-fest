const express = require('express');
const router = express.Router();
const Participant = require('../models/Participant');
const Result = require('../models/Result');
const Event = require('../models/Event');

/**
 * @route   POST /api/participant/login
 * @desc    Validate chestNo and return participant profile, results, and event schedule
 * @payload { chestNo: String }
 */
router.post('/login', async (req, res) => {
  try {
    const { chestNo } = req.body;

    if (!chestNo || !String(chestNo).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Chest Number.'
      });
    }

    const cleanChestNo = String(chestNo).trim();
    const participant = await Participant.findOne({ chestNo: cleanChestNo }).lean();

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: `No participant found registered with Chest No: ${cleanChestNo}`
      });
    }

    // Fetch all evaluations (both pending and published) for this participant
    const results = await Result.find({ chestNo: cleanChestNo }).lean();

    // Map events
    const enrolledEvents = await Promise.all(
      results.map(async (r) => {
        const ev = await Event.findOne({ eventId: r.eventId }).lean();

        let statusText = 'Pending Result';
        let statusClass = 'status-pending';

        if (r.status === 'published') {
          statusText = `🏆 Verified - Grade ${r.grade}`;
          statusClass = 'status-win';
        }

        return {
          eventId: r.eventId,
          eventName: ev ? ev.eventName : r.eventId,
          category: ev ? ev.category : 'General',
          marks: r.status === 'published' ? r.marks : null,
          grade: r.status === 'published' ? r.grade : null,
          status: r.status,
          displayStatus: statusText,
          statusClass: statusClass
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: 'Participant login successful.',
      data: {
        chestNo: participant.chestNo,
        name: participant.name,
        teamName: participant.teamName,
        events: enrolledEvents
      }
    });
  } catch (error) {
    console.error('Error in participant login:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during participant authentication.',
      error: error.message
    });
  }
});

module.exports = router;
