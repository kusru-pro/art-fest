const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Participant = require('../models/Participant');
const Event = require('../models/Event');
const News = require('../models/News');

/**
 * @route   GET /api/public/results
 * @desc    Fetch ONLY published results, grouped by event and ranked
 */
router.get('/results', async (req, res) => {
  try {
    const publishedResults = await Result.find({ status: 'published' })
      .sort({ marks: -1 })
      .lean();

    // Group by event
    const eventsMap = {};

    for (const r of publishedResults) {
      if (!eventsMap[r.eventId]) {
        const ev = await Event.findOne({ eventId: r.eventId }).lean();
        eventsMap[r.eventId] = {
          eventId: r.eventId,
          eventName: ev ? ev.eventName : r.eventId,
          category: ev ? ev.category : 'General',
          results: []
        };
      }

      const participant = await Participant.findOne({ chestNo: r.chestNo }).lean();

      eventsMap[r.eventId].results.push({
        _id: r._id,
        chestNo: r.chestNo,
        participantName: participant ? participant.name : 'Participant ' + r.chestNo,
        teamName: participant ? participant.teamName : 'General Unit',
        marks: r.marks,
        grade: r.grade,
        status: r.status
      });
    }

    // Convert map to array and assign ranks (1, 2, 3...) per event
    const groupedEvents = Object.values(eventsMap).map((ev) => {
      ev.results.sort((a, b) => b.marks - a.marks);
      ev.results = ev.results.map((item, idx) => ({
        rank: idx + 1,
        ...item
      }));
      return ev;
    });

    return res.status(200).json({
      success: true,
      count: groupedEvents.length,
      data: groupedEvents
    });
  } catch (error) {
    console.error('Error fetching public results:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching published results.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/public/news
 * @desc    Fetch live news updates
 */
router.get('/news', async (req, res) => {
  try {
    const newsList = await News.find().sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      count: newsList.length,
      data: newsList
    });
  } catch (error) {
    console.error('Error fetching public news:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching news.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/public/leaderboard
 * @desc    Fetch aggregated team points based on published results
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const publishedResults = await Result.find({ status: 'published' }).lean();
    const teamPointsMap = {};

    for (const r of publishedResults) {
      const participant = await Participant.findOne({ chestNo: r.chestNo }).lean();
      const team = participant ? participant.teamName : 'Independent';

      if (!teamPointsMap[team]) {
        teamPointsMap[team] = 0;
      }
      teamPointsMap[team] += r.marks;
    }

    // Sort teams descending by total points
    const leaderboard = Object.keys(teamPointsMap)
      .map((team) => ({
        teamName: team,
        totalPoints: teamPointsMap[team]
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((t, idx) => ({
        rank: idx + 1,
        ...t
      }));

    return res.status(200).json({
      success: true,
      count: leaderboard.length,
      data: leaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while calculating leaderboard points.',
      error: error.message
    });
  }
});

module.exports = router;
