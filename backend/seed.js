const mongoose = require('mongoose');
require('dotenv').config();

const Participant = require('./models/Participant');
const Event = require('./models/Event');
const Result = require('./models/Result');
const News = require('./models/News');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sahityotsav';

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB for seeding...');

    // Clear existing collections
    await Participant.deleteMany({});
    await Event.deleteMany({});
    await Result.deleteMany({});
    await News.deleteMany({});
    console.log('🧹 Cleaned existing database records.');

    // 1. Seed Participants
    const participants = await Participant.insertMany([
      { chestNo: '104', name: 'Rashid K.', teamName: 'Al-Huda Unit' },
      { chestNo: '122', name: 'Aman M.', teamName: 'Badr Squad' },
      { chestNo: '109', name: 'Sameer H.', teamName: 'Uhud Warriors' },
      { chestNo: '201', name: 'Zaid A.', teamName: 'Arafat Team' },
      { chestNo: '209', name: 'Ayesha M.', teamName: 'Arafat Team' },
      { chestNo: '231', name: 'Zainab P.', teamName: 'Badr Squad' },
      { chestNo: '215', name: 'Fahad K.', teamName: 'Al-Huda Unit' },
      { chestNo: '301', name: 'Zaid A.', teamName: 'Uhud Warriors' },
      { chestNo: '312', name: 'Rizwan T.', teamName: 'Al-Huda Unit' },
      { chestNo: '305', name: 'Hassan R.', teamName: 'Arafat Team' }
    ]);
    console.log(`👤 Seeded ${participants.length} participants.`);

    // 2. Seed Events
    const events = await Event.insertMany([
      { eventId: 'EV-101', eventName: 'Tech Hackathon', category: 'General' },
      { eventId: 'EV-166', eventName: 'Elocution (English)', category: 'Senior' },
      { eventId: 'EV-201', eventName: 'Pencil Drawing', category: 'Junior' },
      { eventId: 'EV-105', eventName: "Qira'at", category: 'General' },
      { eventId: 'EV-302', eventName: 'Essay Writing (Malayalam)', category: 'Senior' }
    ]);
    console.log(`🎪 Seeded ${events.length} events.`);

    // 3. Seed Results (Some published, some pending)
    const results = await Result.insertMany([
      // Published results (Public portal)
      { chestNo: '104', eventId: 'EV-166', marks: 95, grade: 'A', status: 'published' },
      { chestNo: '122', eventId: 'EV-166', marks: 91, grade: 'A', status: 'published' },
      { chestNo: '109', eventId: 'EV-166', marks: 88, grade: 'B', status: 'published' },

      { chestNo: '209', eventId: 'EV-201', marks: 98, grade: 'A', status: 'published' },
      { chestNo: '231', eventId: 'EV-201', marks: 94, grade: 'A', status: 'published' },
      { chestNo: '215', eventId: 'EV-201', marks: 85, grade: 'B', status: 'published' },

      // Pending results (For Council verification)
      { chestNo: '104', eventId: 'EV-101', marks: 92, grade: 'A', status: 'pending' },
      { chestNo: '122', eventId: 'EV-101', marks: 89, grade: 'B', status: 'pending' },
      { chestNo: '109', eventId: 'EV-101', marks: 78, grade: 'C', status: 'pending' },
      { chestNo: '201', eventId: 'EV-101', marks: 84, grade: 'B', status: 'pending' }
    ]);
    console.log(`📊 Seeded ${results.length} results.`);

    // 4. Seed News
    const news = await News.insertMany([
      {
        title: 'Chief Guest Arrives',
        date: 'Nov 12, 2026',
        content: 'Renowned artist Dr. Menon has arrived at the venue to inaugurate the grand festival. The opening ceremony is scheduled to take place at the main stage, featuring traditional performances and the official lighting of the lamp.',
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Schedule Update',
        date: 'Nov 12, 2026',
        content: 'Please be advised that the English Debate for the senior category has been postponed by 30 minutes due to unexpected logistical delays.',
        imageUrl: 'https://images.unsplash.com/photo-1551818255-e6e10975bc17?auto=format&fit=crop&w=500&q=80'
      },
      {
        title: 'Record Participation',
        date: 'Nov 11, 2026',
        content: "We are thrilled to announce that this year's Sahityotsav sees a record-breaking 2,500 participants across 150 events.",
        imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=500&q=80'
      },
      {
        title: 'Culinary Arts Added',
        date: 'Nov 10, 2026',
        content: 'For the first time in the history of Sahityotsav, we are introducing a Culinary Arts competition! Open strictly to the Senior category.',
        imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=500&q=80'
      }
    ]);
    console.log(`📰 Seeded ${news.length} news articles.`);

    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedDatabase();
