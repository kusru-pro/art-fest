# Sahityotsav Art Fest — Full Stack Portal

A complete, production-ready full-stack web system for the **Sahityotsav Art Fest**. Built with a Vanilla JS/CSS frontend and a Node.js + Express + MongoDB backend.

---

## 📁 System Architecture & File Structure

```
hida web/
├── index.html            # Public Festival Website (SPA: Results, Leaderboard, Gallery, News, Login)
├── style.css             # Main website stylesheet
├── script.js             # Frontend API integrations, dynamic filters, counters, modals
├── judge.html            # Mobile-first Judge Evaluation Panel
├── admin.html            # Project Council Verification & News Publishing Panel
├── README.md             # Complete system documentation
└── backend/
    ├── package.json      # Node.js backend dependencies & run scripts
    ├── server.js         # Main Express API server entrypoint
    ├── seed.js           # Database seeder with demo participants, events & results
    ├── .env.example      # Environment variables template
    ├── models/
    │   ├── Participant.js# Schema: chestNo, name, teamName
    │   ├── Event.js      # Schema: eventId, eventName, category
    │   ├── Result.js     # Schema: chestNo, eventId, marks, grade, status
    │   └── News.js       # Schema: title, date, content, imageUrl
    └── routes/
        ├── judgeRoutes.js       # POST /api/judge/submit
        ├── councilRoutes.js     # GET /api/council/pending, PUT /approve/:id, POST /news
        ├── publicRoutes.js      # GET /api/public/results, GET /news, GET /leaderboard
        └── participantRoutes.js # POST /api/participant/login
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (running locally or MongoDB Atlas connection string)

### 2. Install Backend Dependencies
Open a terminal in the `backend` directory:
```bash
cd backend
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/sahityotsav
```

### 4. Seed Database (Optional but Recommended)
Populate your database with sample participants, events, pending evaluations, and news:
```bash
npm run seed
```

### 5. Start Backend Server
```bash
# Production mode
npm start

# Development mode (auto-reload)
npm run dev
```
The server will start at `http://localhost:5000`.

---

## 📡 API Endpoints Reference

### 1. Judge Evaluation API
| Method | Endpoint | Description | Payload |
|---|---|---|---|
| `POST` | `/api/judge/submit` | Submits marks from Judge Panel (`status: 'pending'`) | `{ eventId: "EV-101", scores: [{ chestNo: "104", marks: 95, grade: "A" }] }` |

### 2. Project Council (Admin) API
| Method | Endpoint | Description | Payload |
|---|---|---|---|
| `GET` | `/api/council/pending` | Fetches all pending evaluations awaiting verification | _None_ |
| `PUT` | `/api/council/approve/:id` | Approves and publishes evaluation to the public site | _URL parameter `:id`_ |
| `POST` | `/api/council/news` | Publishes a new festival announcement live | `{ title, date, content, imageUrl }` |

### 3. Public Festival API
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/public/results` | Fetches ONLY published results, ranked per event with participant names |
| `GET` | `/api/public/news` | Fetches live news articles sorted by latest |
| `GET` | `/api/public/leaderboard` | Calculates and returns live team points totals |

### 4. Participant Portal API
| Method | Endpoint | Description | Payload |
|---|---|---|---|
| `POST` | `/api/participant/login` | Validates `chestNo` and returns profile, published grades & registered events | `{ chestNo: "104" }` |

---

## 🖥️ Portals Overview

1. **[Public Website (`index.html`)](index.html):**
   - Real-time result tables with relational category/program filtering.
   - Dynamic top 3 podium leaderboard with counter animations.
   - Live news reader with hero spotlight and pop-up modal.
   - Participant chest number authentication with smooth in-modal dashboard transition.

2. **[Judge Panel (`judge.html`)](judge.html):**
   - Mobile-first, high-contrast touch interface.
   - Real-time score submission with input validation and loading spinners.
   - Sends evaluated scores directly to the Council as `pending`.

3. **[Project Council Panel (`admin.html`)](admin.html):**
   - 6-tab management system: Dashboard, Manage Participants, Manage Events, Result Verification, Manage Gallery, Manage News.
   - Real-time Firestore document manipulation (Create, Read, Update, Delete).
   - Direct 50MB file uploads to **Firebase Storage** for Gallery and News.
   - Review pending submissions from judges with one-click verification and live publishing.

---

## 🔥 Firebase Real-time Integration

The project is fully equipped with **Firebase Modular SDK v10** (Cloud Firestore & Firebase Storage).

### 1. Connecting Your Firebase Project
Open `firebase-config.js`, `script.js`, `admin.html`, or `judge.html` and replace the placeholder keys in `firebaseConfig`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### 2. Firestore Collections & Schema
| Collection | Document ID | Fields | Purpose |
|---|---|---|---|
| `participants` | `chestNo` | `chestNo`, `name`, `category`, `team`, `events[]`, `updatedAt` | Participant directory |
| `events` | `eventCode` | `eventCode`, `eventName`, `category`, `type`, `updatedAt` | Cultural programs directory |
| `results` | `${eventCode}_${chestNo}` | `chestNo`, `eventCode`, `totalMark`, `grade`, `status: 'pending' \| 'published'`, `timestamp` | Evaluations & scores |
| `gallery` | auto-generated | `imageUrl`, `storagePath`, `timestamp` | Festival photos |
| `news` | auto-generated | `title`, `content`, `imageUrl`, `date`, `timestamp` | Announcements & dispatches |

### 3. Real-time Features
- **Instant Result Stream:** `index.html` listens to `results` (`status == 'published'`) via `onSnapshot()`, automatically sorting and publishing rank tables.
- **Dynamic Leaderboard:** Team points are automatically calculated and updated on both Home and Points views.
- **Live Media Feed:** Uploading photos or publishing news in `admin.html` immediately pushes live cards to all connected browsers without a page refresh.
- **Participant Chest Number Login:** Fetches the participant's registered programs and their live evaluation status.

