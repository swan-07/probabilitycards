import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://nnywsuzykhwyjfdstqsg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KUY77BTJjoTBP1SGAuPBlw_3Jexd4in';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Problem card image mapping (from cardimages photos - IMG_6316 onwards are the problem cards)
const problemImageMap = {
    'clubs': {
        'A': 'IMG_6316', '2': 'IMG_6317', '3': 'IMG_6318', '4': 'IMG_6319',
        '5': 'IMG_6320', '6': 'IMG_6321', '7': 'IMG_6322', '8': 'IMG_6323',
        '9': 'IMG_6324', '10': 'IMG_6325', 'J': 'IMG_6326', 'Q': 'IMG_6327', 'K': 'IMG_6328'
    },
    'diamonds': {
        'A': 'IMG_6329', '2': 'IMG_6330', '3': 'IMG_6331', '4': 'IMG_6332',
        '5': 'IMG_6333', '6': 'IMG_6334', '7': 'IMG_6335', '8': 'IMG_6336',
        '9': 'IMG_6337', '10': 'IMG_6338', 'J': 'IMG_6339', 'Q': 'IMG_6340', 'K': 'IMG_6341'
    },
    'hearts': {
        'A': 'IMG_6342', '2': 'IMG_6343', '3': 'IMG_6344', '4': 'IMG_6345',
        '5': 'IMG_6346', '6': 'IMG_6347', '7': 'IMG_6348', '8': 'IMG_6349',
        '9': 'IMG_6350', '10': 'IMG_6351', 'J': 'IMG_6352', 'Q': 'IMG_6353', 'K': 'IMG_6354'
    },
    'spades': {
        'A': 'IMG_6355', '2': 'IMG_6356', '3': 'IMG_6357', '4': 'IMG_6358',
        '5': 'IMG_6359', '6': 'IMG_6360', '7': 'IMG_6361', '8': 'IMG_6362',
        '9': 'IMG_6363', '10': 'IMG_6364', 'J': 'IMG_6365', 'Q': 'IMG_6366', 'K': 'IMG_6367'
    }
};

const suitSymbols = {
    'clubs': '♣',
    'diamonds': '♦',
    'hearts': '♥',
    'spades': '♠'
};

// State
let solvedCards = new Set();
let currentCard = null;
let carouselExpanded = false;
let currentUser = null;

// DOM Elements
const introScreen = document.getElementById('intro-screen');
const mainScreen = document.getElementById('main-screen');
const lightFlash = document.getElementById('light-flash');
const startButton = document.querySelector('.start-button');
const deckButton = document.getElementById('deck-button');
const carouselTrack = document.getElementById('carousel-track');
const conventionsContent = document.getElementById('conventions-content');
const problemContent = document.getElementById('problem-content');
const cardNameEl = document.getElementById('card-name');
const problemTextEl = document.getElementById('problem-text');
const answerInput = document.getElementById('answer-input');
const submitBtn = document.getElementById('submit-btn');
const feedbackEl = document.getElementById('feedback');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authSignUp = document.getElementById('auth-sign-up');
const authSignIn = document.getElementById('auth-sign-in');
const authSignOut = document.getElementById('auth-sign-out');
const authStatus = document.getElementById('auth-status');
const authIndicator = document.getElementById('auth-indicator');
const authMenu = document.getElementById('auth-menu');
const authPanel = document.getElementById('auth-panel');
const leaderboardList = document.getElementById('leaderboard-list');
const leaderboardToggle = document.getElementById('leaderboard-toggle');
const leaderboardModal = document.getElementById('leaderboard-modal');
const leaderboardClose = document.getElementById('leaderboard-close');

const cardTextFallback = 'Problem text coming soon. Edit cardTextMap in app.js to update.';
const cardTextMap = {
    clubs: {
        A: 'Two crabs are facing each other on the beach. Each second they randomly walk one step to the right or one step to the left (independently). After 6 seconds, what is the chance they are still across from each other?',
        '2': 'A standard deck of cards is shuffled. On average, how many cards will you have to draw until you draw the A♣? Try answering this question assuming you draw with replacement and then assuming you draw without replacement.'
    },
    diamonds: {
        A: 'Two planes are getting ready for takeoff, traveling down a long runway at 60mph and 180mph respectively. They both stop suddenly and independently after 0–60s (uniformly at random). What is the chance that the sum of the distances traveled is at most a mile?'
    }
};

const answerMap = {
    clubs: {
        A: '0',
        '2': '0'
    },
    diamonds: {
        A: '0'
    },
    hearts: {},
    spades: {}
};

function getCardText(suit, rank) {
    return (cardTextMap[suit] && cardTextMap[suit][rank]) || cardTextFallback;
}

// Initialize
async function init() {
    await setupAuth();
    await loadProgress();
    createCarousel();
    updateStats();
    await loadLeaderboard();
    setupEventListeners();
}

// Load progress from localStorage
async function loadProgress() {
    if (currentUser) {
        await loadProgressFromSupabase();
        return;
    }

    const saved = localStorage.getItem('solvedCards');
    solvedCards = saved ? new Set(JSON.parse(saved)) : new Set();
}

// Save progress
function saveProgress() {
    if (!currentUser) {
        localStorage.setItem('solvedCards', JSON.stringify([...solvedCards]));
    }
}

// Create carousel cards
function createCarousel() {
    const suits = ['clubs', 'diamonds', 'hearts', 'spades'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    suits.forEach(suit => {
        ranks.forEach(rank => {
            const card = document.createElement('div');
            card.className = 'carousel-card';
            card.dataset.suit = suit;
            card.dataset.rank = rank;

            const cardId = `${suit}-${rank}`;
            if (solvedCards.has(cardId)) {
                card.classList.add('solved');
            }

            // Use extracted Balatro card sprites
            const img = document.createElement('img');
            img.src = `cards/${suit}_${rank}.png`;
            img.alt = `${rank}${suitSymbols[suit]}`;

            card.appendChild(img);

            card.addEventListener('click', () => selectCard(suit, rank, card));
            carouselTrack.appendChild(card);
        });
    });
}

// Select a card
function selectCard(suit, rank, cardEl) {
    currentCard = { suit, rank };

    // Remove previous selection
    document.querySelectorAll('.carousel-card').forEach(c => c.classList.remove('selected'));

    // Mark as selected
    cardEl.classList.add('selected');

    // Hide conventions, show problem content
    conventionsContent.style.display = 'none';
    problemContent.classList.add('show');

    // Show problem card image from cardimages folder
    cardNameEl.textContent = `${rank}${suitSymbols[suit]} - ${suit.charAt(0).toUpperCase() + suit.slice(1)}`;
    problemTextEl.textContent = getCardText(suit, rank);

    // Clear previous input
    answerInput.value = '';
    feedbackEl.className = 'feedback';
    feedbackEl.textContent = '';

    // Scroll to top of info section
    document.querySelector('.info-section').scrollTop = 0;

    // Check if already solved
    const cardId = `${suit}-${rank}`;
    if (solvedCards.has(cardId)) {
        problemContent.classList.add('solved');
        showFeedback('Already solved!', 'correct');
    } else {
        problemContent.classList.remove('solved');
    }
}

// Submit answer
function submitAnswer() {
    if (!currentCard) return;

    const answer = answerInput.value.trim();

    if (answer) {
        const cardId = `${currentCard.suit}-${currentCard.rank}`;
        const expected = (answerMap[currentCard.suit] || {})[currentCard.rank];

        if (expected !== undefined && answer === expected) {
            if (!solvedCards.has(cardId)) {
                solvedCards.add(cardId);
                saveProgress();
                saveSolvedCard(cardId);

                // Update UI
                const cardEl = document.querySelector(`[data-suit="${currentCard.suit}"][data-rank="${currentCard.rank}"]`);
                if (cardEl) {
                    cardEl.classList.add('solved');
                }

                updateStats();
            }

            problemContent.classList.add('solved');
            showFeedback('Correct!', 'correct');
        } else {
            showFeedback('Incorrect', 'incorrect');
        }
    } else {
        showFeedback('Please enter an answer', 'incorrect');
    }
}

// Show feedback
function showFeedback(message, type) {
    feedbackEl.textContent = message;
    feedbackEl.className = `feedback ${type} show`;
}

// Update stats
function updateStats() {
    const totalSolved = solvedCards.size;
    document.getElementById('solved-count').textContent = `${totalSolved}/52`;

    const suits = ['clubs', 'diamonds', 'hearts', 'spades'];
    suits.forEach(suit => {
        const suitSolved = [...solvedCards].filter(id => id.startsWith(suit)).length;
        document.getElementById(`${suit}-count`).textContent = `${suitSolved}`;
    });
}

async function setupAuth() {
    const { data } = await supabase.auth.getSession();
    currentUser = data.session ? data.session.user : null;
    updateAuthUI();
    await ensureProfile();

    supabase.auth.onAuthStateChange(async (_event, session) => {
        currentUser = session ? session.user : null;
        updateAuthUI();
        await ensureProfile();
        await loadProgress();
        refreshSolvedUI();
        await loadLeaderboard();
    });
}

function updateAuthUI() {
    if (currentUser) {
        authStatus.textContent = `Signed in: ${currentUser.email || 'user'}`;
        authIndicator.classList.add('signed-in');
        authIndicator.querySelector('.text').textContent = 'Signed in';
        authEmail.disabled = true;
        authPassword.disabled = true;
        authSignUp.disabled = true;
        authSignIn.disabled = true;
        authSignOut.disabled = false;
    } else {
        authStatus.textContent = 'Signed out';
        authIndicator.classList.remove('signed-in');
        authIndicator.querySelector('.text').textContent = 'Signed out';
        authEmail.disabled = false;
        authPassword.disabled = false;
        authSignUp.disabled = false;
        authSignIn.disabled = false;
        authSignOut.disabled = true;
    }
}

async function ensureProfile() {
    if (!currentUser) return;

    const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', currentUser.id)
        .maybeSingle();

    if (error) {
        authStatus.textContent = `Profile error: ${error.message}`;
        return;
    }

    if (data && data.username) {
        authIndicator.querySelector('.text').textContent = data.username;
        return;
    }

    const username = await generateUniqueUsername();
    const { error: insertError } = await supabase.from('profiles').insert({
        user_id: currentUser.id,
        username
    });

    if (insertError) {
        authStatus.textContent = `Username error: ${insertError.message}`;
        return;
    }

    authIndicator.querySelector('.text').textContent = username;
}

async function generateUniqueUsername() {
    const colors = ['amber', 'azure', 'blue', 'coral', 'cyan', 'gold', 'indigo', 'mint', 'pink', 'purple', 'rose', 'teal'];
    const animals = ['otter', 'fox', 'raven', 'lynx', 'wolf', 'tiger', 'panda', 'koala', 'orca', 'heron', 'eagle', 'gecko'];
    const base = `${colors[Math.floor(Math.random() * colors.length)]}-${animals[Math.floor(Math.random() * animals.length)]}`;
    const { data } = await supabase.from('profiles').select('username').eq('username', base).maybeSingle();
    if (!data) return base;
    return `${base}-${Math.floor(Math.random() * 1000)}`;
}

async function loadLeaderboard() {
    if (!leaderboardList) return;
    const { data, error } = await supabase
        .from('leaderboard')
        .select('username, solved_count')
        .limit(100);

    if (error) {
        authStatus.textContent = `Leaderboard error: ${error.message}`;
        return;
    }

    leaderboardList.innerHTML = '';
    (data || []).forEach((row, idx) => {
        const item = document.createElement('li');
        item.className = 'leaderboard-item';
        item.innerHTML = `
            <span class="rank">#${idx + 1}</span>
            <span class="name">${row.username}</span>
            <span class="score">${row.solved_count}</span>
        `;
        leaderboardList.appendChild(item);
    });
}

async function signUp() {
    const email = authEmail.value.trim();
    const password = authPassword.value.trim();
    if (!email || !password) {
        authStatus.textContent = 'Enter email and password';
        return;
    }

    authStatus.textContent = 'Creating account...';
    const { error } = await supabase.auth.signUp({
        email,
        password,
    });

    authStatus.textContent = error ? `Error: ${error.message}` : 'Account created. Check email if confirmation is required.';
}

async function signIn() {
    const email = authEmail.value.trim();
    const password = authPassword.value.trim();
    if (!email || !password) {
        authStatus.textContent = 'Enter email and password';
        return;
    }

    authStatus.textContent = 'Signing in...';
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    authStatus.textContent = error ? `Error: ${error.message}` : 'Signed in';
}

async function signOut() {
    await supabase.auth.signOut();
}

async function loadProgressFromSupabase() {
    const { data, error } = await supabase
        .from('solved_cards')
        .select('card_id')
        .eq('user_id', currentUser.id);

    if (error) {
        authStatus.textContent = `Load error: ${error.message}`;
        return;
    }

    solvedCards = new Set((data || []).map(row => row.card_id));
}

async function saveSolvedCard(cardId) {
    if (!currentUser) return;
    const { error } = await supabase.from('solved_cards').upsert({
        user_id: currentUser.id,
        card_id: cardId,
        solved_at: new Date().toISOString(),
    });

    if (error) {
        authStatus.textContent = `Save error: ${error.message}`;
    }
    await loadLeaderboard();
}

function refreshSolvedUI() {
    document.querySelectorAll('.carousel-card').forEach(cardEl => {
        const cardId = `${cardEl.dataset.suit}-${cardEl.dataset.rank}`;
        cardEl.classList.toggle('solved', solvedCards.has(cardId));
    });
    updateStats();
}

// Setup event listeners
function setupEventListeners() {
    // Start button with light flash transition
    startButton.addEventListener('click', () => {
        // Trigger light flash
        lightFlash.classList.add('active');

        // Fade out intro
        introScreen.classList.add('fade-out');

        // After flash, remove it and show main screen
        setTimeout(() => {
            lightFlash.classList.remove('active');
            introScreen.style.display = 'none';
            mainScreen.style.display = 'flex';
        }, 800);
    });

    // Deck button to expand carousel
    deckButton.addEventListener('click', () => {
        if (!carouselExpanded) {
            deckButton.classList.add('expanded');
            carouselTrack.classList.add('active');
            carouselExpanded = true;
        }
    });

    // Click outside carousel to collapse (optional)
    document.addEventListener('click', (e) => {
        if (carouselExpanded &&
            !carouselTrack.contains(e.target) &&
            !deckButton.contains(e.target) &&
            !problemDisplay.contains(e.target)) {
            // Don't collapse for now - keep it expanded for better UX
        }
    });

    // Submit button
    submitBtn.addEventListener('click', submitAnswer);

    // Enter key to submit
    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitAnswer();
        }
    });

    authSignOut.addEventListener('click', signOut);
    authSignUp.addEventListener('click', signUp);
    authSignIn.addEventListener('click', signIn);
    authIndicator.addEventListener('click', (e) => {
        e.stopPropagation();
        authMenu.classList.toggle('open');
    });
    authPanel.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('click', () => authMenu.classList.remove('open'));

    leaderboardToggle.addEventListener('click', () => {
        leaderboardModal.classList.add('open');
    });
    leaderboardClose.addEventListener('click', () => {
        leaderboardModal.classList.remove('open');
    });
    leaderboardModal.addEventListener('click', (e) => {
        if (e.target === leaderboardModal) {
            leaderboardModal.classList.remove('open');
        }
    });

    // Close problem display when clicking outside (kept disabled for now)
}

// Start the app
init();
