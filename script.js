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
let newsData = {
    1: { 
        title: "Chief Guest Arrives", 
        date: "Nov 12, 2026", 
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", 
        content: "Renowned artist Dr. Menon has arrived at the venue to inaugurate the grand festival. The opening ceremony is scheduled to take place at the main stage, featuring traditional performances and the official lighting of the lamp." 
    },
    2: { 
        title: "Schedule Update", 
        date: "Nov 12, 2026", 
        image: "https://images.unsplash.com/photo-1551818255-e6e10975bc17?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", 
        content: "Please be advised that the English Debate for the senior category has been postponed by 30 minutes due to unexpected logistical delays. Participants are requested to report to Hall B at 11:00 AM instead of 10:30 AM." 
    },
    3: { 
        title: "Record Participation", 
        date: "Nov 11, 2026", 
        image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", 
        content: "We are thrilled to announce that this year's Sahityotsav sees a record-breaking 2,500 participants across 150 events. This marks a massive 20% increase from last year's festival, reflecting the growing passion for art and culture." 
    },
    4: { 
        title: "Culinary Arts Added", 
        date: "Nov 10, 2026", 
        image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", 
        content: "For the first time in the history of Sahityotsav, we are introducing a Culinary Arts competition! Open strictly to the Senior category, this unique event will test participants on their knowledge and execution of traditional Kerala recipes." 
    }
};

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
// 7. PARTICIPANT LOGIN & DASHBOARD (Firestore Integration)
// =========================================================================
function openLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.classList.add('active');
}
window.openLoginModal = openLoginModal;

async function submitLogin() {
    const chestNoInput = document.getElementById('chestNo');
    const chestNo = chestNoInput ? chestNoInput.value.trim() : '';

    if (!chestNo) {
        alert('Please enter your Chest Number');
        return;
    }

    const loginBtn = document.querySelector('#login-view .login-btn');
    const originalText = loginBtn ? loginBtn.innerText : 'LOGIN';
    if (loginBtn) {
        loginBtn.innerText = 'VERIFYING...';
        loginBtn.disabled = true;
    }

    if (!isConfigured) {
        // Local simulation fallback
        setTimeout(() => {
            if (chestNo === '104' || chestNo === '101' || chestNo === '102') {
                renderParticipantDashboard({
                    name: chestNo === '104' ? 'Rashid K' : 'Participant #' + chestNo,
                    chestNo: chestNo,
                    teamName: 'Al-Huda Unit',
                    events: [
                        { eventName: 'English Elocution', category: 'Senior', displayStatus: '🏆 1st Place - A Grade', statusClass: 'status-win' },
                        { eventName: 'Qira\'at', category: 'General', displayStatus: '⏳ Pending Result', statusClass: 'status-pending' },
                        { eventName: 'Essay Malayalam', category: 'Senior', displayStatus: '📅 Today, 02:00 PM', statusClass: 'status-registered' }
                    ]
                });
                transitionToDashboard();
            } else {
                alert(`No participant registered with Chest No: ${chestNo} (Demo: Try 104)`);
            }
            if (loginBtn) {
                loginBtn.innerText = originalText;
                loginBtn.disabled = false;
            }
        }, 500);
        return;
    }

    try {
        // Query Firestore for participant document
        const participantDoc = await getDoc(doc(db, 'participants', chestNo));
        
        if (!participantDoc.exists()) {
            alert(`No participant found with Chest Number: ${chestNo}`);
            if (loginBtn) {
                loginBtn.innerText = originalText;
                loginBtn.disabled = false;
            }
            return;
        }

        const participantData = participantDoc.data();

        // Fetch participant's results from Firestore
        const resultsQuery = query(collection(db, 'results'), where('chestNo', '==', chestNo));
        const resultsSnap = await getDocs(resultsQuery);
        const resultsMap = {};

        resultsSnap.forEach(snap => {
            const data = snap.data();
            resultsMap[data.eventCode] = data;
        });

        // Assemble events list
        const registeredEvents = Array.isArray(participantData.events) ? participantData.events : [];
        const eventsDisplayList = [];

        for (const evCode of registeredEvents) {
            const evInfo = eventsCache[evCode] || { eventName: evCode, category: participantData.category || 'General' };
            const res = resultsMap[evCode];

            let displayStatus = '📅 Registered';
            let statusClass = 'status-registered';

            if (res) {
                if (res.status === 'published') {
                    displayStatus = `🏆 ${res.totalMark} Marks (${res.grade} Grade)`;
                    statusClass = 'status-win';
                } else if (res.status === 'pending') {
                    displayStatus = '⏳ Pending Result';
                    statusClass = 'status-pending';
                }
            }

            eventsDisplayList.push({
                eventName: evInfo.eventName,
                category: evInfo.category,
                displayStatus,
                statusClass
            });
        }

        renderParticipantDashboard({
            name: participantData.name,
            chestNo: participantData.chestNo,
            teamName: participantData.team,
            events: eventsDisplayList
        });

        transitionToDashboard();

    } catch (err) {
        console.error("Login verification error:", err);
        alert("Verification failed: " + err.message);
    } finally {
        if (loginBtn) {
            loginBtn.innerText = originalText;
            loginBtn.disabled = false;
        }
    }
}
window.submitLogin = submitLogin;

function renderParticipantDashboard(profile) {
    const nameEl = document.querySelector('.profile-name');
    const detailsEl = document.querySelector('.profile-details');
    const eventsContainer = document.querySelector('.events-list');

    if (nameEl && profile.name) nameEl.textContent = profile.name;
    if (detailsEl && profile.teamName) {
        detailsEl.innerHTML = `Chest No: ${profile.chestNo} &nbsp;|&nbsp; ${profile.teamName}`;
    }

    if (eventsContainer) {
        if (!profile.events || profile.events.length === 0) {
            eventsContainer.innerHTML = `<p style="text-align:center; color: #94a3b8; padding: 1.5rem;">No programs registered for this chest number.</p>`;
            return;
        }

        eventsContainer.innerHTML = profile.events.map(ev => `
            <div class="event-item">
                <div class="event-info">
                    <div class="event-title">${ev.eventName}</div>
                    <div class="event-category">${ev.category}</div>
                </div>
                <div class="event-status ${ev.statusClass}">${ev.displayStatus}</div>
            </div>
        `).join('');
    }
}

function transitionToDashboard() {
    const loginView = document.getElementById('login-view');
    const dashView = document.getElementById('dashboard-view');
    
    if (!loginView || !dashView) return;

    loginView.classList.remove('active-view');
    loginView.classList.add('hidden-view');
    
    setTimeout(() => {
        loginView.style.display = 'none';
        dashView.style.display = 'block';
        void dashView.offsetWidth;
        dashView.classList.remove('hidden-view');
        dashView.classList.add('active-view');
    }, 300);
}

function logoutDashboard() {
    const loginView = document.getElementById('login-view');
    const dashView = document.getElementById('dashboard-view');
    
    const chestInput = document.getElementById('chestNo');
    if (chestInput) chestInput.value = '';
    
    if (!loginView || !dashView) return;

    dashView.classList.remove('active-view');
    dashView.classList.add('hidden-view');
    
    setTimeout(() => {
        dashView.style.display = 'none';
        loginView.style.display = 'block';
        void loginView.offsetWidth;
        loginView.classList.remove('hidden-view');
        loginView.classList.add('active-view');
    }, 300);
}
window.logoutDashboard = logoutDashboard;

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

// C. Leaderboard Visibility Listener
function initLeaderboardVisibilityListener() {
    if (!isConfigured) return;
    
    const docRef = doc(db, 'settings', 'leaderboard');
    onSnapshot(docRef, (docSnap) => {
        const miniLb = document.getElementById('home-mini-leaderboard') || document.querySelector('.mini-leaderboard-section');
        const mainLb = document.getElementById('team-points');
        const navLb = document.getElementById('nav-team-points');
        
        // Find existing banner or create it
        let mainLbBanner = document.getElementById('lb-hidden-banner');
        const isVisible = docSnap.exists() && docSnap.data().isVisible === true;
        
        if (isVisible) {
            if (miniLb) {
                miniLb.classList.remove('hidden-section');
                miniLb.style.display = '';
            }
            if (navLb) {
                navLb.classList.remove('hidden-section');
                navLb.style.display = '';
            }
            if (mainLb) {
                mainLb.classList.remove('hidden-section');
                mainLb.style.display = '';
                if (mainLbBanner) mainLbBanner.style.display = 'none';
            }
        } else {
            if (miniLb) {
                miniLb.classList.add('hidden-section');
                miniLb.style.display = 'none';
            }
            if (navLb) {
                navLb.classList.add('hidden-section');
                navLb.style.display = 'none';
            }
            if (mainLb) {
                mainLb.classList.add('hidden-section');
                mainLb.style.display = 'none';
                
                // Show placeholder banner if the user was currently on the team-points tab
                if (!mainLbBanner) {
                    mainLbBanner = document.createElement('section');
                    mainLbBanner.id = 'lb-hidden-banner';
                    mainLbBanner.className = 'tab-section';
                    mainLbBanner.innerHTML = `<div class="card" style="text-align: center; padding: 4rem 2rem;"><i class="fa-solid fa-lock" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 1rem;"></i><h2 style="color: #475569; font-family: var(--font-heading);">Leaderboard is Currently Hidden</h2><p style="color: #94a3b8; margin-top: 0.5rem;">The festival committee is processing evaluations. The official leaderboard will be published shortly.</p></div>`;
                    mainLb.parentNode.insertBefore(mainLbBanner, mainLb);
                }
                if (mainLb.classList.contains('active')) {
                    mainLbBanner.style.display = 'block';
                } else {
                    mainLbBanner.style.display = 'none';
                }
            }
        }
    }, (err) => {
        console.error("Settings listener error:", err);
    });
}

// B. Real-time Results & Leaderboard Listener
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
        calculateAndRenderLeaderboard(resultsList);
    }, (err) => {
        console.error("Results real-time listener error:", err);
    });
}

function renderLiveResults(resultsList) {
    const container = document.getElementById('results-container');
    if (!container || resultsList.length === 0) return;

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
                        <div class="item-code">${evCode.replace(/[^0-9]/g, '') || '101'}</div>
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

function calculateAndRenderLeaderboard(resultsList) {
    const teamScores = {};

    resultsList.forEach(r => {
        const p = participantsCache[r.chestNo];
        const team = (p && p.team) ? p.team : (r.team || 'Independent');

        if (!teamScores[team]) teamScores[team] = 0;

        // Points calculation based on position ranking: 1st = 5, 2nd = 3, 3rd = 1
        const pos = Number(r.position);
        if (pos === 1) teamScores[team] += 5;
        else if (pos === 2) teamScores[team] += 3;
        else if (pos === 3) teamScores[team] += 1;
    });

    const sortedTeams = Object.entries(teamScores)
        .map(([team, pts]) => ({ teamName: team, totalPoints: pts }))
        .sort((a, b) => b.totalPoints - a.totalPoints);

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

// C. Real-time Gallery Listener
function initGalleryRealtimeListener() {
    if (!isConfigured) return;

    const q = query(collection(db, 'gallery'), orderBy('timestamp', 'desc'));
    onSnapshot(q, (snapshot) => {
        const photos = [];
        snapshot.forEach(docSnap => photos.push(docSnap.data().imageUrl));

        if (photos.length === 0) return;

        // 1. Update Home Mini Gallery Preview (5 Photos)
        const miniGalleryGrid = document.querySelector('.mini-gallery-grid');
        if (miniGalleryGrid && photos.length >= 5) {
            miniGalleryGrid.innerHTML = `
                <div class="mini-gallery-item item-large" onclick="openGalleryModal('${photos[0]}')">
                    <img src="${photos[0]}" alt="Festival Photo">
                    <div class="gallery-overlay"><i class="fa-solid fa-expand"></i></div>
                </div>
                <div class="mini-gallery-item item-large" onclick="openGalleryModal('${photos[1]}')">
                    <img src="${photos[1]}" alt="Festival Photo">
                    <div class="gallery-overlay"><i class="fa-solid fa-expand"></i></div>
                </div>
                <div class="mini-gallery-item item-small" onclick="openGalleryModal('${photos[2]}')">
                    <img src="${photos[2]}" alt="Festival Photo">
                    <div class="gallery-overlay"><i class="fa-solid fa-expand"></i></div>
                </div>
                <div class="mini-gallery-item item-small" onclick="openGalleryModal('${photos[3]}')">
                    <img src="${photos[3]}" alt="Festival Photo">
                    <div class="gallery-overlay"><i class="fa-solid fa-expand"></i></div>
                </div>
                <div class="mini-gallery-item item-small" onclick="openGalleryModal('${photos[4]}')">
                    <img src="${photos[4]}" alt="Festival Photo">
                    <div class="gallery-overlay"><i class="fa-solid fa-expand"></i></div>
                </div>
            `;
        }

        // 2. Update Main Gallery Grid
        const mainGalleryGrid = document.querySelector('#gallery .gallery-grid');
        if (mainGalleryGrid) {
            mainGalleryGrid.innerHTML = photos.map((url, i) => `
                <img src="${url}" alt="Gallery ${i + 1}" class="gallery-item" onclick="openGalleryModal('${url}')">
            `).join('');
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

        if (articles.length === 0) return;

        // 1. Update Home Mini News Preview (Top 3)
        const miniNewsGrid = document.querySelector('.mini-news-grid');
        if (miniNewsGrid) {
            miniNewsGrid.innerHTML = articles.slice(0, 3).map(art => `
                <div class="mini-news-card" onclick="openNewsModal('${art.id}')">
                    <div class="mini-news-img-wrap">
                        <img src="${art.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600'}" alt="${art.title}">
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

        // 2. Update Main News Section (Hero Card + Grid)
        const heroArt = articles[0];
        const heroCard = document.querySelector('.news-hero-card');
        if (heroCard && heroArt) {
            heroCard.innerHTML = `
                <img src="${heroArt.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'}" alt="${heroArt.title}" class="news-hero-img">
                <div class="news-hero-content">
                    <span class="news-date">${heroArt.date}</span>
                    <h3>${heroArt.title}</h3>
                    <p>${heroArt.content.substring(0, 150)}...</p>
                    <a class="read-more" onclick="openNewsModal('${heroArt.id}')">READ FULL STORY &rarr;</a>
                </div>
            `;
        }

        const standardGrid = document.querySelector('.news-grid-standard');
        if (standardGrid && articles.length > 1) {
            standardGrid.innerHTML = articles.slice(1).map(art => `
                <div class="news-card">
                    <img src="${art.imageUrl || 'https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=500'}" alt="${art.title}" class="news-img">
                    <div class="news-content">
                        <span class="news-date">${art.date}</span>
                        <h3>${art.title}</h3>
                        <p>${art.content.substring(0, 95)}...</p>
                        <a class="read-more" onclick="openNewsModal('${art.id}')">READ FULL STORY &rarr;</a>
                    </div>
                </div>
            `).join('');
        }
    }, (err) => {
        console.error("News real-time listener error:", err);
    });
}

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
        initLeaderboardVisibilityListener();
        initGalleryRealtimeListener();
        initNewsRealtimeListener();
    } else {
        console.info("Running in demo mode. Update firebaseConfig in script.js to connect to your live Firebase project.");
    }
});


