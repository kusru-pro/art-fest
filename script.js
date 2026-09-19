// === Sahityotsav Art Fest Frontend Logic & Real-time Firebase Backend ===

// Firebase Modular SDK v10 Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    limit,
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// =========================================================================
// 1. FIREBASE CONFIGURATION (Live Project Keys)
// =========================================================================
export const firebaseConfig = {
    apiKey: "AIzaSyDFYLTpVbWLzZBTBDKMGe2F9QedxmP6zVI",
    authDomain: "artfest-27.firebaseapp.com",
    projectId: "artfest-27",
    storageBucket: "artfest-27.firebasestorage.app",
    messagingSenderId: "532303413059",
    appId: "1:532303413059:web:6dca20cc6d8c3184a479f6",
    measurementId: "G-M4PB0RE16T"
};

const isConfigured = Boolean(
    firebaseConfig.apiKey && 
    firebaseConfig.apiKey !== "YOUR_API_KEY" && 
    !firebaseConfig.projectId.includes("YOUR_PROJECT")
);

let app = null;
let db = null;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) {
    console.warn("Firebase initialized with placeholder config.", e);
}

// Local in-memory caches for fast joins
let participantsCache = {};
let eventsCache = {};
let publishedResultsCache = [];

// =========================================================================
// 2. SPA NAVIGATION LOGIC
// =========================================================================
function showSection(sectionId) {
    if (sectionId === 'points' || sectionId === 'team-points') {
        navigateTo('team-points');
    } else {
        navigateTo(sectionId);
    }
}
window.showSection = showSection;

function navigateTo(sectionId) {
    const sections = document.querySelectorAll('main > section');
    sections.forEach(sec => sec.classList.remove('active'));

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));

    const target = document.getElementById(sectionId);
    if (target) { target.classList.add('active'); }

    const navMenu = document.getElementById('nav-links');
    if (navMenu && navMenu.classList.contains('active')) { navMenu.classList.remove('active'); }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (sectionId === 'team-points') { 
        animateCounters(); 
    }
}
window.navigateTo = navigateTo;

function toggleMobileMenu() {
    const nav = document.getElementById('nav-links');
    if (nav) nav.classList.toggle('active');
}
window.toggleMobileMenu = toggleMobileMenu;

// =========================================================================
// 3. EVENT RESULTS FILTERING & ACCORDION
// =========================================================================
function updateProgramFilter(initial = false) {
    const categoryFilter = document.getElementById('category-filter');
    const programSelect = document.getElementById('program-filter');
    if (!categoryFilter || !programSelect) return;

    const category = categoryFilter.value;
    const cards = document.querySelectorAll('.result-card');
    
    programSelect.innerHTML = '<option value="all">All Programs</option>';
    const uniquePrograms = new Set();
    
    cards.forEach(card => {
        if (category === 'all' || category === card.getAttribute('data-category')) {
            const prog = card.getAttribute('data-program');
            if (prog) uniquePrograms.add(prog);
        }
    });
    
    uniquePrograms.forEach(prog => {
        const option = document.createElement('option');
        option.value = prog;
        option.textContent = prog;
        programSelect.appendChild(option);
    });
    
    programSelect.value = 'all';
    filterResults();
}
window.updateProgramFilter = updateProgramFilter;

function filterResults() {
    const catEl = document.getElementById('category-filter');
    const progEl = document.getElementById('program-filter');
    if (!catEl || !progEl) return;

    const category = catEl.value;
    const program = progEl.value;
    const cards = document.querySelectorAll('.result-card');
    
    cards.forEach(card => {
        const catMatch = (category === 'all' || category === card.getAttribute('data-category'));
        const progMatch = (program === 'all' || program === card.getAttribute('data-program'));
        
        if (catMatch && progMatch) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
            card.classList.remove('active');
            const body = card.querySelector('.accordion-body');
            if (body) body.style.maxHeight = "0px";
        }
    });
}
window.filterResults = filterResults;

function toggleAccordion(headerElement) {
    const item = headerElement.parentElement;
    const body = item.querySelector('.accordion-body');
    if (!body) return;
    item.classList.toggle('active');
    body.style.maxHeight = item.classList.contains('active') ? body.scrollHeight + "px" : "0px";
}
window.toggleAccordion = toggleAccordion;

// =========================================================================
// 3.5. DYNAMIC CATEGORY DROPDOWNS
// =========================================================================
async function populateDynamicCategories() {
    if (!isConfigured) return;
    try {
        const snapshot = await getDocs(collection(db, 'participants'));
        const categories = new Set();
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data.category) {
                categories.add(data.category.trim());
            }
        });
        
        // Target dropdowns (like the one in judge.html or admin filters if needed)
        const categoryDropdowns = [
            document.getElementById('judge-category-select'),
            document.getElementById('category-filter')
        ];

        categoryDropdowns.forEach(selectEl => {
            if (selectEl) {
                const defaultOpt = selectEl.options[0];
                selectEl.innerHTML = '';
                if (defaultOpt) selectEl.appendChild(defaultOpt);

                Array.from(categories).sort().forEach(cat => {
                    const opt = document.createElement('option');
                    opt.value = cat;
                    opt.textContent = cat;
                    selectEl.appendChild(opt);
                });
            }
        });
    } catch (err) {
        console.error("Error populating dynamic categories:", err);
    }
}
window.populateDynamicCategories = populateDynamicCategories;

// =========================================================================
// 4. COUNTER ANIMATION FOR LEADERBOARD
// =========================================================================
function animateCounters() {
    const counters = document.querySelectorAll('.counter-value');
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target') || 0;
        const duration = 1200;
        const startTime = performance.now();

        function updateCount(currentTime) {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            counter.innerText = Math.floor(progress * target);

            if (progress < 1) {
                requestAnimationFrame(updateCount);
            } else {
                counter.innerText = target;
            }
        }
        requestAnimationFrame(updateCount);
    });
}
window.animateCounters = animateCounters;

// =========================================================================
// 5. GALLERY LIGHTBOX & TOGGLE LOGIC
// =========================================================================
function toggleGallery(btnElement) {
    const grid = document.querySelector('.gallery-grid');
    if (!grid) return;

    if (grid.classList.contains('show-all')) {
        grid.classList.remove('show-all');
        btnElement.textContent = 'View All Images';
        const galSection = document.getElementById('gallery');
        if (galSection) galSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        grid.classList.add('show-all');
        btnElement.textContent = 'Show Less';
    }
}
window.toggleGallery = toggleGallery;

function openGalleryModal(src) {
    const modal = document.getElementById('gallery-modal');
    const modalImg = document.getElementById('gallery-modal-img');
    if (modal && modalImg) {
        modalImg.src = src;
        modal.classList.add('active');
    }
}
window.openGalleryModal = openGalleryModal;

function closeGalleryModal() {
    const modal = document.getElementById('gallery-modal');
    if (modal) modal.classList.remove('active');
}
window.closeGalleryModal = closeGalleryModal;

// =========================================================================
// 6. NEWS DATA & MODAL LOGIC
// =========================================================================
let newsData = {};

function openNewsModal(newsId) {
    const news = newsData[newsId];
    if (news) {
        document.getElementById('news-modal-img').src = news.image || news.imageUrl || '';
        document.getElementById('news-modal-date').innerText = news.date || '';
        document.getElementById('news-modal-title').innerText = news.title || '';
        document.getElementById('news-modal-text').innerText = news.content || '';
        document.getElementById('news-modal').classList.add('active');
    }
}
window.openNewsModal = openNewsModal;

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}
window.closeModal = closeModal;

// Close modals when clicking backdrop
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});

// =========================================================================
// 7. PARTICIPANT LOGIN & FULL-SCREEN STUDENT PORTAL (Firestore Integration)
// =========================================================================
function openLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.add('active');
        const chestInput = document.getElementById('chestNo');
        if (chestInput) {
            chestInput.value = '';
            setTimeout(() => chestInput.focus(), 100);
        }
    }
}
window.openLoginModal = openLoginModal;

async function submitLogin() {
    const chestNoInput = document.getElementById('chestNo');
    const chestNo = chestNoInput ? chestNoInput.value.trim() : '';

    if (!chestNo) {
        alert('Please enter your Chest Number');
        if (chestNoInput) chestNoInput.focus();
        return;
    }

    const loginBtn = document.querySelector('#login-view .login-btn');
    const originalText = loginBtn ? loginBtn.innerText : 'ENTER PORTAL';
    if (loginBtn) {
        loginBtn.innerText = 'VERIFYING...';
        loginBtn.disabled = true;
    }

    if (!isConfigured) {
        alert("Database connection is not configured.");
        if (loginBtn) {
            loginBtn.innerText = originalText;
            loginBtn.disabled = false;
        }
        return;
    }

    try {
        // Query Firestore participants collection for document with ID matching chestNo
        let participantDoc = await getDoc(doc(db, 'participants', String(chestNo)));
        let participantData = null;

        if (participantDoc.exists()) {
            participantData = participantDoc.data();
        } else {
            // Secondary lookup by chestNo field in case doc ID differs
            const q = query(collection(db, 'participants'), where('chestNo', '==', String(chestNo)));
            const snap = await getDocs(q);
            if (!snap.empty) {
                participantDoc = snap.docs[0];
                participantData = participantDoc.data();
            }
        }

        if (!participantData) {
            alert(`No participant found with Chest Number: ${chestNo}`);
            if (loginBtn) {
                loginBtn.innerText = originalText;
                loginBtn.disabled = false;
            }
            if (chestNoInput) chestNoInput.focus();
            return;
        }

        // Fetch all results for this participant from Firestore
        const resultsQuery = query(collection(db, 'results'), where('chestNo', '==', String(chestNo)));
        const resultsSnap = await getDocs(resultsQuery);
        const resultsMap = {};

        resultsSnap.forEach(snap => {
            const data = snap.data();
            // Store by eventCode
            if (data.eventCode) {
                resultsMap[data.eventCode] = data;
            }
        });

        // Fetch attendance for this participant to check Relegated status
        const attendanceQuery = query(collection(db, 'attendance'), where('chestNo', '==', String(chestNo)));
        const attendanceSnap = await getDocs(attendanceQuery);
        const attendanceMap = {};
        attendanceSnap.forEach(snap => {
            const data = snap.data();
            if (data.eventCode) {
                attendanceMap[data.eventCode] = data.status || 'present';
            }
        });

        // Parse events array from participant document
        let rawEvents = participantData.events;
        let eventList = [];

        if (Array.isArray(rawEvents)) {
            rawEvents.forEach(evItem => {
                if (typeof evItem === 'string') {
                    // Could be comma or pipe separated, e.g. "Drawing,Elocution" or "101|102"
                    const parts = evItem.includes('|') ? evItem.split('|') : evItem.split(',');
                    parts.forEach(p => {
                        const trimmed = p.trim();
                        if (trimmed) eventList.push(trimmed);
                    });
                } else if (evItem) {
                    eventList.push(String(evItem).trim());
                }
            });
        } else if (typeof rawEvents === 'string') {
            const parts = rawEvents.includes('|') ? rawEvents.split('|') : rawEvents.split(',');
            parts.forEach(p => {
                const trimmed = p.trim();
                if (trimmed) eventList.push(trimmed);
            });
        }

        // Filter duplicates
        eventList = [...new Set(eventList)];

        // Build display events with exact status logic
        const processedEvents = [];

        eventList.forEach((evCodeOrName, idx) => {
            // Find event metadata from eventsCache or lookup
            let matchedCode = evCodeOrName;
            let evInfo = eventsCache[evCodeOrName];

            // If not found by key, search by eventName
            if (!evInfo) {
                const foundCode = Object.keys(eventsCache).find(k => 
                    eventsCache[k].eventName && eventsCache[k].eventName.toLowerCase() === evCodeOrName.toLowerCase()
                );
                if (foundCode) {
                    matchedCode = foundCode;
                    evInfo = eventsCache[foundCode];
                }
            }

            const eventName = (evInfo && evInfo.eventName) ? evInfo.eventName : evCodeOrName;
            const category = (evInfo && evInfo.category) ? evInfo.category : (participantData.category || 'General');

            // Find matching result in resultsMap (by matchedCode or original evCodeOrName)
            const res = resultsMap[matchedCode] || resultsMap[evCodeOrName];

            let status = 'scheduled';
            let rank = null;
            let marks = null;
            let grade = null;
            let points = 0;

            const attStatus = attendanceMap[matchedCode] || attendanceMap[evCodeOrName];
            if (attStatus === 'relegated') {
                status = 'relegated';
            }

            if (res) {
                if (res.status === 'published') {
                    status = 'published';
                    rank = res.position ? Number(res.position) : null;
                    marks = res.totalMark != null ? res.totalMark : '-';
                    grade = res.grade ? res.grade : '-';
                    // 1st=5, 2nd=3, 3rd=1
                    if (rank === 1) points = 5;
                    else if (rank === 2) points = 3;
                    else if (rank === 3) points = 1;
                } else if (res.status === 'pending') {
                    status = 'pending';
                }
            }

            processedEvents.push({
                index: idx,
                eventCode: matchedCode,
                eventName: eventName,
                category: category,
                status: status,
                rank: rank,
                marks: marks,
                grade: grade,
                points: points
            });
        });

        renderStudentPortal({
            name: participantData.name || 'Participant',
            chestNo: participantData.chestNo || chestNo,
            category: participantData.category || 'General',
            team: participantData.team || 'Independent',
            events: processedEvents
        });

        showStudentPortal();

    } catch (err) {
        console.error("Login verification error:", err);
        alert("Verification error: " + err.message);
    } finally {
        if (loginBtn) {
            loginBtn.innerText = originalText;
            loginBtn.disabled = false;
        }
    }
}
window.submitLogin = submitLogin;

function renderStudentPortal(profile) {
    const studentNameEl = document.getElementById('portal-student-name');
    const chestNoEl = document.getElementById('portal-chest-no');
    const categoryEl = document.getElementById('portal-category');
    const teamEl = document.getElementById('portal-team');
    const countEl = document.getElementById('portal-events-count');
    const listEl = document.getElementById('portal-events-list');
    const totalPointsEl = document.getElementById('portal-total-points');

    if (studentNameEl) studentNameEl.textContent = profile.name || '-';
    if (chestNoEl) chestNoEl.textContent = profile.chestNo || '-';
    if (categoryEl) categoryEl.textContent = profile.category || '-';
    if (teamEl) teamEl.textContent = profile.team || '-';

    // Generate Dynamic QR Code for Chest Number
    const qrImg = document.getElementById('portal-qr-img');
    if (qrImg && profile.chestNo) {
        const encodedData = encodeURIComponent(String(profile.chestNo).trim());
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodedData}&margin=4`;
    }

    const events = profile.events || [];
    if (countEl) countEl.textContent = `${events.length} Program${events.length === 1 ? '' : 's'}`;

    // Calculate total earned points ONLY from published results
    let totalPoints = 0;
    events.forEach(ev => {
        if (ev.status === 'published') {
            totalPoints += (ev.points || 0);
        }
    });

    if (totalPointsEl) totalPointsEl.textContent = totalPoints;

    if (!listEl) return;

    if (events.length === 0) {
        listEl.innerHTML = `
            <div style="text-align: center; padding: 2.5rem 1rem; color: #94a3b8;">
                <i class="fa-solid fa-calendar-xmark" style="font-size: 2.5rem; margin-bottom: 0.75rem; color: #cbd5e1;"></i>
                <p style="margin: 0; font-size: 1rem; font-weight: 500;">No programs registered for this chest number.</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = events.map(ev => {
        let statusBadge = '';
        let actionBtn = '';
        let drawerHtml = '';

        if (ev.status === 'published') {
            statusBadge = `
                <span class="portal-badge-status badge-published">
                    <i class="fa-solid fa-circle-check"></i> Published
                </span>
            `;
            actionBtn = `
                <button class="btn-view-result" onclick="togglePortalResultDrawer(${ev.index})">
                    <i class="fa-solid fa-eye"></i> View Result
                </button>
            `;

            let rankDisplay = '-';
            if (ev.rank === 1) rankDisplay = '🥇 1st Place';
            else if (ev.rank === 2) rankDisplay = '🥈 2nd Place';
            else if (ev.rank === 3) rankDisplay = '🥉 3rd Place';
            else if (ev.rank) rankDisplay = `#${ev.rank}`;

            drawerHtml = `
                <div class="portal-result-drawer" id="portal-drawer-${ev.index}">
                    <div class="portal-result-grid">
                        <div class="result-stat-item">
                            <span class="result-stat-label">Position / Rank</span>
                            <span class="result-stat-value stat-rank-medal">${rankDisplay}</span>
                        </div>
                        <div class="result-stat-item">
                            <span class="result-stat-label">Total Marks</span>
                            <span class="result-stat-value" style="color: #1e3a8a;">${ev.marks}</span>
                        </div>
                        <div class="result-stat-item">
                            <span class="result-stat-label">Grade</span>
                            <span class="result-stat-value"><span style="background: #f1f5f9; padding: 2px 10px; border-radius: 6px;">${ev.grade}</span></span>
                        </div>
                        <div class="result-stat-item">
                            <span class="result-stat-label">Points Earned</span>
                            <span class="result-stat-value stat-pts-badge">+${ev.points} PTS</span>
                        </div>
                    </div>
                </div>
            `;
        } else if (ev.status === 'pending') {
            statusBadge = `
                <span class="portal-badge-status badge-pending">
                    <i class="fa-solid fa-clock"></i> Pending
                </span>
            `;
        } else if (ev.status === 'relegated') {
            statusBadge = `
                <span class="portal-badge-status badge-relegated" style="background:#fee2e2; color:#991b1b; font-weight: 700;">
                    <i class="fa-solid fa-ban"></i> Disqualified
                </span>
            `;
        } else {
            statusBadge = `
                <span class="portal-badge-status badge-scheduled">
                    <i class="fa-solid fa-calendar-check"></i> Scheduled / Not Started
                </span>
            `;
        }

        return `
            <div class="portal-event-row">
                <div class="portal-event-top">
                    <div class="portal-event-main">
                        <div class="portal-event-icon">
                            <i class="fa-solid fa-masks-theater"></i>
                        </div>
                        <div>
                            <h4 class="portal-event-name">${ev.eventName}</h4>
                            <div class="portal-event-meta">${ev.category} Category</div>
                        </div>
                    </div>
                    <div class="portal-event-status-wrap">
                        ${statusBadge}
                        ${actionBtn}
                    </div>
                </div>
                ${drawerHtml}
            </div>
        `;
    }).join('');
}

window.togglePortalResultDrawer = function(index) {
    const drawer = document.getElementById('portal-drawer-' + index);
    if (!drawer) return;
    if (drawer.style.display === 'block') {
        drawer.style.display = 'none';
    } else {
        drawer.style.display = 'block';
    }
};

function showStudentPortal() {
    // Close login modal
    const loginModal = document.getElementById('login-modal');
    if (loginModal) loginModal.classList.remove('active');

    // Hide main header and main website content
    const header = document.querySelector('header');
    const main = document.querySelector('main');
    if (header) header.style.display = 'none';
    if (main) main.style.display = 'none';

    // Show full-screen student portal
    const portal = document.getElementById('student-portal-view');
    if (portal) {
        portal.style.display = 'flex';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function logoutStudentPortal() {
    // Hide full-screen student portal
    const portal = document.getElementById('student-portal-view');
    if (portal) portal.style.display = 'none';

    // Restore main website layout and header
    const header = document.querySelector('header');
    const main = document.querySelector('main');
    if (header) header.style.display = 'flex';
    if (main) main.style.display = 'block';

    // Clear chest input
    const chestInput = document.getElementById('chestNo');
    if (chestInput) chestInput.value = '';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.logoutStudentPortal = logoutStudentPortal;
window.logoutDashboard = logoutStudentPortal;

// =========================================================================
// 8. REAL-TIME FIRESTORE LISTENERS (Results, Leaderboard, Gallery, News)
// =========================================================================

// A. Real-time Listeners for Events & Participants Metadata
function initMetadataListeners() {
    if (!isConfigured) return;

    // Listen to Events
    onSnapshot(collection(db, 'events'), (snapshot) => {
        eventsCache = {};
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            eventsCache[data.eventCode] = data;
        });
        if (publishedResultsCache.length > 0) {
            renderLiveResults(publishedResultsCache);
        }
    });

    // Listen to Participants
    onSnapshot(collection(db, 'participants'), (snapshot) => {
        participantsCache = {};
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            participantsCache[data.chestNo] = data;
        });
        if (publishedResultsCache.length > 0) {
            renderLiveResults(publishedResultsCache);
        }
    });
}

// B. Real-time Results Listener
function initResultsRealtimeListener() {
    if (!isConfigured) return;

    const q = query(collection(db, 'results'), where('status', '==', 'published'));
    onSnapshot(q, (snapshot) => {
        const resultsList = [];
        snapshot.forEach(docSnap => {
            resultsList.push(docSnap.data());
        });

        publishedResultsCache = resultsList;
        renderLiveResults(resultsList);
    }, (err) => {
        console.error("Results real-time listener error:", err);
    });
}

function initPublicLeaderboardListener() {
    if (!isConfigured) return;
    
    onSnapshot(doc(db, 'settings', 'public_leaderboard'), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            renderPublicLeaderboard(data.standings || []);
        } else {
            renderPublicLeaderboard([]);
        }
    }, (err) => {
        console.error("Public leaderboard listener error:", err);
    });
}

function renderLiveResults(resultsList) {
    const container = document.getElementById('results-container');
    if (!container) return;

    if (!resultsList || resultsList.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 4rem 1.5rem; color: var(--text-dark); opacity: 0.85;">
                <i class="fa-solid fa-hourglass-half" style="font-size: 2.5rem; color: var(--highlight-gold); margin-bottom: 1rem; display: block;"></i>
                <h3 style="font-family: var(--font-heading); font-size: 1.4rem; margin-bottom: 0.5rem;">Results Awaiting Publication</h3>
                <p style="font-size: 0.95rem; max-width: 500px; margin: 0 auto;">Evaluations are currently being reviewed by the Council. Once approved and published, official rankings and marks will appear here live.</p>
            </div>
        `;
        updateProgramFilter();
        return;
    }

    // Group results by eventCode
    const grouped = {};
    resultsList.forEach(r => {
        if (!grouped[r.eventCode]) grouped[r.eventCode] = [];
        grouped[r.eventCode].push(r);
    });

    // Sort scores within each event: priority by explicit position ranking, else totalMark descending
    Object.keys(grouped).forEach(evCode => {
        grouped[evCode].sort((a, b) => {
            if (a.position && b.position) return a.position - b.position;
            return b.totalMark - a.totalMark;
        });
    });

    container.innerHTML = Object.keys(grouped).map(evCode => {
        const eventResults = grouped[evCode];
        const eventInfo = eventsCache[evCode] || { eventName: evCode, category: 'General' };

        return `
            <div class="accordion-item result-card" data-category="${eventInfo.category}" data-program="${eventInfo.eventName}">
                <div class="accordion-header" onclick="toggleAccordion(this)">
                    <div class="header-left">
                        <div class="item-title-group">
                            <span class="event-name">${eventInfo.eventName}</span>
                            <span class="event-category">${eventInfo.category} • Individual</span>
                        </div>
                    </div>
                    <i class="fa-solid fa-chevron-down accordion-arrow"></i>
                </div>
                <div class="accordion-body">
                    <div class="table-container">
                        <table class="results-table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Chest No</th>
                                    <th>Participant</th>
                                    <th>Team</th>
                                    <th>Mark</th>
                                    <th>Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${eventResults.map((r, idx) => {
                                    const p = participantsCache[r.chestNo] || { name: 'Contestant ' + r.chestNo, team: 'Festival Unit' };
                                    const rank = r.position || (idx + 1);
                                    return `
                                        <tr>
                                            <td>${rank === 1 ? '<i class="fa-solid fa-trophy trophy-gold"></i> 1' : rank}</td>
                                            <td>${r.chestNo}</td>
                                            <td class="${rank === 1 ? 'winner-highlight' : ''}">${p.name}</td>
                                            <td>${p.team}</td>
                                            <td>${r.totalMark}</td>
                                            <td><span class="grade-box">${r.grade || 'A'}</span></td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    updateProgramFilter();
}

function renderPublicLeaderboard(sortedTeams) {

    const miniPodium = document.getElementById('public-mini-podium');
    const mainPodium = document.getElementById('public-main-podium');
    const listContainer = document.getElementById('public-leaderboard-list') || document.querySelector('.leaderboard-list');

    if (sortedTeams.length === 0) {
        if (miniPodium) miniPodium.innerHTML = `<div style="text-align: center; width: 100%; color: #666; padding: 2rem;">No published standings available yet.</div>`;
        if (mainPodium) mainPodium.innerHTML = `<div style="text-align: center; width: 100%; color: #666; padding: 2rem;">No published standings available yet.</div>`;
        if (listContainer) listContainer.innerHTML = '';
        return;
    }

    const miniR1 = sortedTeams[0];
    const miniR2 = sortedTeams[1];
    const miniR3 = sortedTeams[2];

    // 1. Render Home Mini Podium (Rank 2, Rank 1 center, Rank 3)
    if (miniPodium) {
        miniPodium.innerHTML = `
            ${miniR2 ? `
            <div class="mini-podium-card rank-2">
                <div class="podium-crown"><i class="fa-solid fa-medal"></i> 2nd Place</div>
                <div class="mini-team-name">${miniR2.teamName}</div>
                <div class="mini-team-points"><strong>${miniR2.totalPoints}</strong> <span>pts</span></div>
            </div>` : ''}
            ${miniR1 ? `
            <div class="mini-podium-card rank-1">
                <div class="podium-crown gold-crown"><i class="fa-solid fa-crown"></i> 1st Place</div>
                <div class="mini-team-name">${miniR1.teamName}</div>
                <div class="mini-team-points"><strong>${miniR1.totalPoints}</strong> <span>pts</span></div>
            </div>` : ''}
            ${miniR3 ? `
            <div class="mini-podium-card rank-3">
                <div class="podium-crown"><i class="fa-solid fa-award"></i> 3rd Place</div>
                <div class="mini-team-name">${miniR3.teamName}</div>
                <div class="mini-team-points"><strong>${miniR3.totalPoints}</strong> <span>pts</span></div>
            </div>` : ''}
        `;
    }

    // 2. Render Main Podium
    if (mainPodium) {
        mainPodium.innerHTML = `
            ${miniR2 ? `
            <div class="podium-card rank-2">
                <div class="podium-number">2</div>
                <div class="podium-team">${miniR2.teamName}</div>
                <div class="podium-points"><span class="counter-value" data-target="${miniR2.totalPoints}">${miniR2.totalPoints}</span> <span style="font-size: 1rem; color: var(--text-dark);">pts</span></div>
            </div>` : ''}
            ${miniR1 ? `
            <div class="podium-card rank-1">
                <div class="podium-number">1</div>
                <div class="podium-team">${miniR1.teamName}</div>
                <div class="podium-points"><span class="counter-value" data-target="${miniR1.totalPoints}">${miniR1.totalPoints}</span> <span style="font-size: 1rem; color: var(--text-dark);">pts</span></div>
            </div>` : ''}
            ${miniR3 ? `
            <div class="podium-card rank-3">
                <div class="podium-number">3</div>
                <div class="podium-team">${miniR3.teamName}</div>
                <div class="podium-points"><span class="counter-value" data-target="${miniR3.totalPoints}">${miniR3.totalPoints}</span> <span style="font-size: 1rem; color: var(--text-dark);">pts</span></div>
            </div>` : ''}
        `;
    }

    // 3. Render Remaining Teams List (Rank 4+)
    if (listContainer) {
        if (sortedTeams.length > 3) {
            listContainer.innerHTML = sortedTeams.slice(3).map((item, index) => {
                const rank = index + 4;
                const rankClass = rank <= 6 ? 'box-rank' : 'list-rank';
                return `
                    <div class="leaderboard-row ${rankClass}">
                        <div class="lb-rank">${rank}</div>
                        <div class="lb-team">${item.teamName}</div>
                        <div class="lb-points"><span class="counter-value" data-target="${item.totalPoints}">${item.totalPoints}</span> pts</div>
                    </div>
                `;
            }).join('');
        } else {
            listContainer.innerHTML = '';
        }
    }

    animateCounters();
}

// C. Real-time Gallery Listener & Festival Moments Mini-Gallery
async function loadMiniGallery() {
    const miniGalleryGrid = document.querySelector('.mini-gallery-grid');
    if (!miniGalleryGrid) return;

    if (!isConfigured) return;

    try {
        // Firestore query to fetch the 5 most recent images from the 'gallery' collection
        const miniGalleryQuery = query(
            collection(db, 'gallery'),
            orderBy('timestamp', 'desc'),
            limit(5)
        );

        onSnapshot(miniGalleryQuery, (snapshot) => {
            renderMiniGallery(snapshot);
        }, async (error) => {
            console.warn("Real-time listener for mini gallery failed, falling back to getDocs:", error);
            try {
                const snap = await getDocs(miniGalleryQuery);
                renderMiniGallery(snap);
            } catch (err) {
                console.error("Error fetching mini-gallery images:", err);
            }
        });
    } catch (err) {
        console.error("Error setting up mini gallery query:", err);
    }
}
window.loadMiniGallery = loadMiniGallery;

function renderMiniGallery(snapshot) {
    const miniGalleryGrid = document.querySelector('.mini-gallery-grid');
    if (!miniGalleryGrid) return;

    const photos = [];
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const url = data.imageUrl || data.url || data.image;
        if (url) photos.push(url);
    });

    if (photos.length === 0) {
        miniGalleryGrid.innerHTML = '<div style="text-align: center; color: #64748b; padding: 2rem;">No festival moments available yet.</div>';
        return;
    }

    // Dynamically populate .mini-gallery-grid:
    // First 2 images get class 'item-large', remaining 3 get class 'item-small'
    miniGalleryGrid.innerHTML = photos.slice(0, 5).map((src, index) => {
        const sizeClass = index < 2 ? 'item-large' : 'item-small';
        return `
            <div class="mini-gallery-item ${sizeClass}" onclick="openGalleryModal('${src}')">
                <img src="${src}" alt="Festival Moment ${index + 1}">
                <div class="gallery-overlay"><i class="fa-solid fa-expand"></i></div>
            </div>
        `;
    }).join('');
}
window.renderMiniGallery = renderMiniGallery;

function initGalleryRealtimeListener() {
    if (!isConfigured) return;

    // 1. Dynamically load the 5 most recent images into Home Page Festival Moments
    loadMiniGallery();

    // 2. Real-time listener for full Gallery section
    const q = query(collection(db, 'gallery'), orderBy('timestamp', 'desc'));
    onSnapshot(q, (snapshot) => {
        const photos = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const url = data.imageUrl || data.url || data.image;
            if (url) photos.push(url);
        });

        const mainGalleryGrid = document.querySelector('#gallery .gallery-grid');
        if (mainGalleryGrid) {
            if (photos.length === 0) {
                mainGalleryGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #64748b; padding: 2rem;">No gallery images available yet.</div>';
            } else {
                mainGalleryGrid.innerHTML = photos.map((url, i) => `
                    <img src="${url}" alt="Gallery ${i + 1}" class="gallery-item" onclick="openGalleryModal('${url}')">
                `).join('');
            }
        }
    }, (err) => {
        console.error("Gallery real-time listener error:", err);
    });
}

// D. Real-time News Listener
function initNewsRealtimeListener() {
    if (!isConfigured) return;

    const q = query(collection(db, 'news'), orderBy('timestamp', 'desc'));
    onSnapshot(q, (snapshot) => {
        const articles = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            data.id = docSnap.id;
            articles.push(data);
            newsData[docSnap.id] = {
                title: data.title,
                date: data.date,
                image: data.imageUrl,
                content: data.content
            };
        });

        if (articles.length === 0) {
            const miniNewsGrid = document.querySelector('.mini-news-grid');
            if (miniNewsGrid) miniNewsGrid.innerHTML = '<div style="text-align: center; color: #64748b; padding: 2rem;">No news updates available.</div>';
            
            const newsContainer = document.getElementById('news-container');
            if (newsContainer) newsContainer.innerHTML = '<div style="text-align: center; color: #64748b; padding: 2rem;">No news updates available.</div>';
            return;
        }

        // 1. Update Home Mini News Preview (Top 3)
        const miniNewsGrid = document.querySelector('.mini-news-grid');
        if (miniNewsGrid) {
            miniNewsGrid.innerHTML = articles.slice(0, 3).map(art => `
                <div class="mini-news-card" onclick="openNewsModal('${art.id}')">
                    <div class="mini-news-img-wrap">
                        <img src="${art.imageUrl || ''}" alt="${art.title}" onerror="this.style.display='none'">
                    </div>
                    <div class="mini-news-body">
                        <span class="mini-news-date"><i class="fa-regular fa-calendar"></i> ${art.date}</span>
                        <h3 class="mini-news-title">${art.title}</h3>
                        <p class="mini-news-excerpt">${art.content.substring(0, 110)}...</p>
                        <span class="mini-news-more">Read Story &rarr;</span>
                    </div>
                </div>
            `).join('');
        }

        // 2. Update Main News Section (#news-container)
        const newsContainer = document.getElementById('news-container');
        if (newsContainer) {
            const heroArt = articles[0];
            let html = `
                <div class="news-hero-card">
                    <img src="${heroArt.imageUrl || ''}" alt="${heroArt.title}" class="news-hero-img" onerror="this.style.display='none'">
                    <div class="news-hero-content">
                        <span class="news-date">${heroArt.date}</span>
                        <h3>${heroArt.title}</h3>
                        <p>${heroArt.content.substring(0, 150)}...</p>
                        <a class="read-more" onclick="openNewsModal('${heroArt.id}')">READ FULL STORY &rarr;</a>
                    </div>
                </div>
            `;

            if (articles.length > 1) {
                html += '<div class="news-grid-standard">';
                html += articles.slice(1).map(art => `
                    <div class="news-card">
                        <img src="${art.imageUrl || ''}" alt="${art.title}" class="news-img" onerror="this.style.display='none'">
                        <div class="news-content">
                            <span class="news-date">${art.date}</span>
                            <h3>${art.title}</h3>
                            <p>${art.content.substring(0, 95)}...</p>
                            <a class="read-more" onclick="openNewsModal('${art.id}')">READ FULL STORY &rarr;</a>
                        </div>
                    </div>
                `).join('');
                html += '</div>';
            }
            newsContainer.innerHTML = html;
        }
    }, (err) => {
        console.error("News real-time listener error:", err);
    });
}

// =========================================================================
// 8.5. HOME PAGE & HERO SETTINGS (settings/homepage)
// =========================================================================
function initHomepageSettingsListener() {
    if (!isConfigured) return;

    onSnapshot(doc(db, 'settings', 'homepage'), (docSnap) => {
        if (!docSnap.exists()) return;
        applyHomepageSettings(docSnap.data());
    }, (err) => {
        console.warn("Homepage settings listener error:", err);
    });
}
window.initHomepageSettingsListener = initHomepageSettingsListener;

function applyHomepageSettings(data) {
    if (!data) return;

    // 1. Website Logo & Title in Header (.logo)
    const siteLogo = document.getElementById('site-logo') || document.querySelector('.logo');
    const websiteTitle = data.websiteTitle || data.eventTitle || 'Sahityotsav';
    const websiteLogoUrl = (data.websiteLogo && data.websiteLogo.trim()) ? data.websiteLogo.trim() : '';

    if (siteLogo) {
        if (websiteLogoUrl) {
            siteLogo.innerHTML = `<img src="${websiteLogoUrl}" alt="${websiteTitle}" class="site-header-logo">`;
        } else {
            siteLogo.textContent = websiteTitle;
        }
    }

    // Update document title
    if (websiteTitle) {
        document.title = `${websiteTitle} Art Fest`;
    }

    // 2. Hero Event Title & Theme Subtitle
    const eventTitle = data.eventTitle || data.websiteTitle || 'Sahityotsav';
    const heroEventTitle = document.getElementById('hero-event-title');
    if (heroEventTitle) heroEventTitle.textContent = eventTitle;

    const themeEvent = document.getElementById('theme-paragraph-event');
    if (themeEvent) themeEvent.textContent = eventTitle;

    // 3. Theme Title
    const themeTitle = data.themeTitle || data.themeName;
    if (themeTitle) {
        const heroTheme = document.getElementById('hero-theme-title');
        if (heroTheme) {
            if (themeTitle.includes('<br>') || themeTitle.includes('<br/>')) {
                heroTheme.innerHTML = themeTitle;
            } else {
                heroTheme.textContent = themeTitle;
            }
        }

        // Dynamically update .theme-title elements
        const themeTitleEls = document.querySelectorAll('.theme-title');
        themeTitleEls.forEach(el => {
            el.textContent = themeTitle.replace(/<[^>]*>/g, ' ');
        });

        const themeParagraphTheme = document.getElementById('theme-paragraph-theme');
        if (themeParagraphTheme) {
            const cleanTheme = themeTitle.replace(/<[^>]*>/g, ' ').replace(/^["']|["']$/g, '');
            themeParagraphTheme.textContent = `"${cleanTheme}"`;
        }
    }

    // 4. Theme Description Paragraph (.theme-paragraph)
    if (data.themeDescription && data.themeDescription.trim()) {
        const themeParagraphEls = document.querySelectorAll('.theme-paragraph');
        themeParagraphEls.forEach(el => {
            el.textContent = data.themeDescription;
        });
    }

    // 5. Event Dates
    if (data.eventDates) {
        const datesText = document.getElementById('hero-dates-text');
        if (datesText) datesText.textContent = data.eventDates;
    }

    // 6. Event Location
    if (data.eventLocation) {
        const locText = document.getElementById('hero-location-text');
        if (locText) locText.textContent = data.eventLocation;
    }
}
window.applyHomepageSettings = applyHomepageSettings;

// =========================================================================
// 9. PARALLAX MOUSE MOVE EFFECT
// =========================================================================
document.addEventListener('mousemove', function(e) {
    const hero = document.getElementById('hero');
    if (!hero || !hero.classList.contains('active')) return;
    const x = (window.innerWidth - e.pageX * 2) / 100;
    const y = (window.innerHeight - e.pageY * 2) / 100;
    document.querySelectorAll('.parallax').forEach(el => {
        const speed = el.getAttribute('data-speed') || 1;
        el.style.transform = `translateX(${x * speed}px) translateY(${y * speed}px)`;
    });
});

// =========================================================================
// 10. INITIALIZATION
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    updateProgramFilter();

    if (isConfigured) {
        initMetadataListeners();
        initResultsRealtimeListener();
        initPublicLeaderboardListener();
        initGalleryRealtimeListener();
        initNewsRealtimeListener();
        initHomepageSettingsListener();
        populateDynamicCategories();
    } else {
        console.info("Running in demo mode. Update firebaseConfig in script.js to connect to your live Firebase project.");
    }
});


