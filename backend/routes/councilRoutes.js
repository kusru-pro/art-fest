const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Participant = require('../models/Participant');
const Event = require('../models/Event');
const News = require('../models/News');

/**
 * @route   GET /api/council/pending
 * @desc    Fetch all pending results for Council verification
 */
router.get('/pending', async (req, res) => {
  try {
    const pendingResults = await Result.find({ status: 'pending' }).sort({ createdAt: -1 }).lean();

    // Enrich with participant and event details
    const enriched = await Promise.all(
      pendingResults.map(async (resItem) => {
        const participant = await Participant.findOne({ chestNo: resItem.chestNo }).lean();
        const event = await Event.findOne({ eventId: resItem.eventId }).lean();

        return {
          _id: resItem._id,
          chestNo: resItem.chestNo,
          participantName: participant ? participant.name : 'Unknown Participant',
          teamName: participant ? participant.teamName : 'Independent',
          eventId: resItem.eventId,
          eventName: event ? event.eventName : resItem.eventId,
          category: event ? event.category : 'General',
          marks: resItem.marks,
          grade: resItem.grade,
          status: resItem.status,
          createdAt: resItem.createdAt
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (error) {
    console.error('Error fetching pending results:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching pending council results.',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/council/approve/:id
 * @desc    Update a specific result's status to 'published'
 */
router.put('/approve/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Result.findByIdAndUpdate(
      id,
      { status: 'published' },
      { new: true, runValidators: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation result not found with the specified ID.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Result successfully verified and published to the live public portal!',
      data: result
    });
  } catch (error) {
    console.error('Error approving result:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while verifying result.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/council/news
 * @desc    Add a new official news announcement
 */
router.post('/news', async (req, res) => {
  try {
    const { title, date, content, imageUrl } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required fields.'
      });
    }

    const newArticle = await News.create({
      title: title.trim(),
      date: date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      content: content.trim(),
      imageUrl: imageUrl ? imageUrl.trim() : undefined
    });

    return res.status(201).json({
      success: true,
      message: 'News announcement successfully published!',
      data: newArticle
    });
  } catch (error) {
    console.error('Error creating news:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while publishing news.',
      error: error.message
    });
  }
});

module.exports = router;
