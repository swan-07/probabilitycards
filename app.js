const SUPABASE_URL = 'https://nnywsuzykhwyjfdstqsg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KUY77BTJjoTBP1SGAuPBlw_3Jexd4in';
let supabase = null;
let supabaseAvailable = false;

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
let currentUsername = null;

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

const cardTextFallback = 'Problem text coming soon!';
const cardTextMap = {
    clubs: {
        A: 'What is the expected value of a randomly drawn card from a standard deck? If you draw two cards randomly, what is the expected value of their sum? (A = 1, J = 11, Q = 12, K = 13) Answer in the form (X, Y)',
        '2': 'A standard deck of cards is shuffled. On average, how many cards will you have to draw until you draw the Ace of Clubs? Try answering this question assuming you draw with replacement and then assuming you draw without replacement. Answer in the form (X, Y)',
        '3': '20 people are each holding a playing card. These cards are all shuffled and redistributed randomly. What is the expected number of people who get their original card back?',
        '4': '10 people are sitting in a circle. Each has their own deck of cards. They each shuffle their deck and draw a random card. If the card is red, the holder turns to shake hands with the player to their left. If the card is black, they turn to shake hands with the person to their right. How many handshakes are expected to succeed?',
        '5': 'While inserting two jokers into a deck of cards, we unfortunately drop the 5 of clubs on the floor. We then shuffle the deck. What\'s the expected number of cards between the two jokers?',
        '6': 'You have a pile of a very, very large number of cards (equal numbers of each suit). How many cards on average do you have to draw before you have at least one card of each suit?',
        '7': 'While showing off a fancy shuffling trick, you accidentally drop almost half the deck down a storm drain. You want to figure out which cards you still have, so you try to match up cards with the same rank and color (A of spades with A of clubs for example). You count 34 cards remaining. How many matches do you find on average?',
        '8': 'Arrange the 13 clubs in random order. How many times do you expect the sequence to change direction (increasing to decreasing or vice versa)?',
        '9': 'A very large deck of 2N+1 cards is cut at one of its 2N gaps randomly. As a function of N, on average how many cards are in the smaller pile? What is the expected ratio of the size of the larger pile to the smaller pile? Answer in the form (X, Y)',
        '10': 'Draw cards from a shuffled deck until you draw the J, Q, and K of clubs. How many draws will it take on average?',
        'J': 'We have 2N cards: 1 through N of both clubs and spades. Remove the 1 of clubs and a random space. Remove a pair of cards: the 2 of clubs and an associated spade (the 2 of spades if you can find it, or else a random spade). Continue similarly (with the 3 of clubs, 4 of clubs, etc) until all cards are paired and removed. What\'s the chance the N of clubs and the N of spades form a pair? On average, how many pairs have matching rank? Answer in the form (X, Y)',
        Q: 'I deal out MN cards in an MxN grid, some face up and some face down. You want to maximize the number of cards face up, but you are only allowed to flip a full row or full column at a time (as many times as you would like). How many cards can you get face up at the same time no matter how I arrange the cards to start (for M=N and N=2^N)?', //what does this mean
        K: 'You and I are playing with a strange deck of cards that consists of the 1 through N clubs. I remove r cards from the deck. Without knowing which r I removed, how large of a sum-free subset can you promise me you can find in your cards? (A set S is sum-free if there does not exist s_1, s_2, s_3 in S with s_1 + s_2 = s_3).'
    },
    diamonds: {
        A: 'A standard deck of cards is shuffled. What is the chance that the third card from the top is either a diamond or an ace?',
        '2': 'If you draw 13 random cards from a standard deck, what is the chance that they are all the same suit?',
        '3': 'We shuffle a deck of cards and I deal you the 3, 4, and 5 of diamonds. I look at the next card and tell you that it is between 3 and 8 (inclusive). How likely is it that the card is a diamond?',
        '4': 'The 2, 3, and 4 of diamonds are face-down in random order. You want to select the 4 of diamonds. You point to the leftmost card. A gust of wind blows, flipping the rightmost card and revealing that it is the 2 of diamonds. Do you want to switch your choice from the leftmost to the middle? Answer YES or NO',
        '5': 'I have all 13 diamonds. We both want to end the game with the 5 of diamonds. You randomly select one of my cards but cannot look at it. I lok at my cards and then place 11 face up. The 5 of diamonds is not among them. Should you trade the card you initially chose for my remaining card? What is the chance you find the 5 of diamonds if so? Answer in the form (YES or NO, A)',
        '6': 'You are given a deck of cards that is equally likely to either be perfectly shuffled or brand new (i.e. ordered A-K of diamonds, A-K of spades, etc). You draw the top 3 cards and they are the A, 2, and 3 of diamonds in that order. How much more likely is the deck to be brand new vs. shuffled?',
        '7': 'You are holding a random card from a standard deck. If you have a diamond, you truthfully answer questions 90% of the time and lie 10% of the time. If you don\'t have a diamond, you truthfully answer questions 40% of the time and lie 60% of the time. I ask "Do you have a diamond?" and you answer "Yes." What is the chance that you have a diamond?',
        '8': 'We are playing with a standard deck. I remove one diamond and some non-diamonds but I don\t tell you how many! I secretly flip a fair coin; on heads I return the missing diamond, on tails I return one of the other missing cards. You shuffle the deck and draw one card; it\'s a diamond. What\'s the probability my coin came up heads?',
        '9': 'Which of these events is more likely assuming cards are drawn from a shuffled deck with replacement: (a) at least 1 diamond when 4 cards are drawn, (b) at least 2 diamonds when 8 cards are drawn, or (c) at least 3 diamonds when 12 cards are drawn? Answer a/b/c',
        '10': 'You have two strange decks of cards: deck A with 2 diamonds and 1 spade and deck B with 51 diamonds and 50 spades. You randomly choose a deck and draw. You can look at the color of the card, put it back in the deck (or not) and draw a second card. Your goal is to guess what deck you are drawing from. What strategy do you employ and how likely is it to succeed? (Answers may vary)',
        J: 'Consider the following game: place the A-6 of diamonds and the A-6 of spades in a bag. You randomly draw cards one at a time from the bag and keep them, but put matching cards aside as son as they appear in your hand. The game ends and you lose if you ever hold three cards, no two of which match. What is the chance you win?',
        Q: 'Shuffle the 13 diamonds in a deck into a random order. Suppose the longest increasing subsequence has length exactly 10 (assume A = 1). What is the probability that the K of diamonds is last in the ordering?',
        K: '* I have a very large deck of N cards: the A-N of diamonds. If I shuffle the deck, what is the chance that the longest increasing subsequence has more than sqrt(2N) + sqrt(8)*N^{1/6} cards?'
    },
    hearts: {
        A: 'A tiny model airplane has gotten stuck inside an inflatable, spherical beach ball of radius 1 and is flying around randomly. When you stop and look, what is the probability that the plane is closer to the center of the ball than to the outside?',
        '2': 'Two planes are getting ready for takeoff, traveling down a long runway at 60mph and 180mph respectively. They both stop suddenly (and independently) after 0-60s (uniformly at random). What is the chance that the sum of the distances traveled is at most a mile?',
        '3': 'Two cyclists are randomly biking around the unit circle. They each stop at uniformly random spots along the boundary. Form a triangle from the two cyclists and the circle\'s center. How likely is the triangle to be acute? What if they had been biking along the surface of a unit sphere? Answer in the form (X, Y)',
        '4': 'A round helicopter of diameter 3 is trying to land. Its landing zone is covered in painted lines which form a grid of 4x4 squares. The helicopter is supposed to land fully within a square, but the pilot did not pay attention and landed randomly. What is the chance that the helicopter falls within a square nonetheless?',
        '5': 'A circular zamboni (of radius 1) was driving around a rectangular ice rink of length l and width w. The zamboni broke down at a uniformly random point on the rink. What is the chance that it stopped over either of the two diagonals of the rink?',
        '6': 'Every morning, two friends independently bike to a cafe, arriving at a uniformly random time between 7am and 8am. Each person waits for t minutes in the parking lot, hoping their friend will join in time. If not, they leave coffeeless (they cannot carry it on their bike!). If they are 36% likely to get their morning caffeine, what is t?',
        '7': 'N cyclists are biking around a circular track at a rate of 1 rpm. They start in uniformly random locations and random orientations (clockwise or counter). Just before a pair would collide, they instantly reverse direction. What is the expected number of times all the cyclists reverse direction each minute?',
        '8': 'N cyclists are biking around a circular track at a rate of 1 rpm. They start in uniformly random locations and random orientations (clockwise or counter). Just before a pair would collide, they instantly reverse direction. What is the probability that after 1 minute, all cyclists are where they started?',
        '9': 'Cars of length 2 are parking on a street of length 100, with parking meters evenly spaced every length 1. Each minute, a car arrives and parks at a uniformly randomly open spot, aligning its front bumper with a parking meter. When no more cars can possible fit, roughly what fraction of parking meters are unoccupied by a car?',
        '10': 'Cars of length 2 are parking on a street of length 100. Each minute, a car arrives and parks at a uniformly random spot on the road without crashing into another car or running off the road. When no more cars can possibly fit, roughly how many cars have parked?',
        J: 'Cars of length 5 and limos of length 10 are trying to park on a VERY long road of length L. Each minute, either a car or limo arrives (with probability p, 1-p respectively) and attempts to park without crashing into another vehicle. When no more cars or limos can fit, what fraction of the road is occupied? What p minimizes this fraction? Answer in the form (X, Y)',
        Q: '** Cars of length 2 try to park on a length L road. Each minute, a new car parks at a uniformly random spot on the road without crashing into another car or running off the road. When no more cars fit, what is the expected size of the largest gap between adjacent cars (as a function of L)? How about the smallest gap between adjacent cars? Answer in the form (X, Y)',
        K: '** Helicopters (radius 1 circles) are landing in a very large LxL lot. Each minute,a helicopter arrives and randomly picks san available point in the lot to land (without crashing into another helicopter)! When there is no space for more helicopters, on average what fraction of the lot is occupied? What about for 3 and 4 dimensions? Answer in the form (X, Y, Z)'
    },
    spades: {
        A: 'Two crabs are facing each other on the beach. Each second they randomly walk one step to the right or one step to the left (independently). After 6 seconds, what is the chance they are still across from each other?',
        '2': 'A bee left some honeycomb on the ground and now a very long trail of red and black ants (in random order) has formed. Which is more likely to appear first in the trail, two black ants in a row (BB) or a red ant followed by a black ant (RB)? How many ants does it take on average to see BB or RB? What about BBR? Answer in the form (AA, X, Y)',
        '3': 'A turtle is staring out at the horizon, one step away from the ocean. The turtle takes random steps, with probability 2/3 back toward the top of the beach and with probability 1/3 toward the ocean. What\'s the chance the turtle ever makes it to the ocean?',
        '4': 'A bunny cannot decide where to take a nap. There is a rose bush 4 steps to the left and sunflowers 8 steps to the right. The bunny is 25% to step toward the roses and 75% to step towards the sunflowers. How many steps (on average) does it take until the bunny can get some rest?',
        '5': 'A beaver is looking for materials for her dam. There is a long mountain and a long river 20 steps apart (and parallel). The beaver randomly steps N, S, E, W on her search (if a step would take her up the mountain, she steps toward the river instead). If she is at the mountain, how many steps can she expect it to take to return to the river?',
        '6': 'A chipmunk is stuffing its mouth full of acorns. Right now, it has 6. Every second, with probability 2/3, it stuffs another in its mouth, otherwise it drops one. The chipmunk continues until either its mouth is full (it can hold 36 acorns!) or empty. How likely is the chipmunk to leave hungry?',
        '7': 'A crow and a raven are each picking up coins off the street at the same pace. They are clever and keep track of who has picked up more coins that were facing heads rather than tails after each coin. They each collect N in total. What is the chance they never had collected the same number of heads after they started?',
        '8': 'B blue jays and C cardinals are sitting together in a tree. The birds all politely take turns flying away (meaning that the bird that flew away was equally likely to be any of the remaining birds). What is the chance that at some point the same number of blue jays as cardinals have flown away?',
        '9': 'Two monkeys are playing a variant of war with a deck of 2N cards numbered 1 to 2N. Each monkey started with N random cards and every turn, both monkeys select a random card from their hand. The monkey with the higher card wins both cards. The game ends when only one monkey has cards. How many turns does the game take on average?',
        '10': 'A confused antelope is looking for food and each second takes a random step equally likely to be N, S, E, or W. What is the probability that the antelope ever makes it back to where it started?',
        J: '* A hawk is flying around in 3D space. Don\'t worry–it is not bound by silly rules like gravity and can burrow deep into the ground. Every moment, it takes a step in the horizontal, vertical, or forward/backward direction. What is the probability the hawk eventually returns to the tree where it started?',
        Q: '* A bee is wandering around an infinitely large beehive, walking along the edges of a hexagonal honeycomb 2D lattice. This bee is very efficient and does not want to walk along an edge it previously walked on. For very large n, approximately how many possible n step walks are there that the bee could take from a given starting position?',
        K: '** Your dog is taking itself for a walk around Manhatten, a perfect infinite 2D grid. Your dog likes to explore, so never wants to visit the same block twice. How many 4-block walks could your dog take? How about n-block walks for large n? Answer in the form (X, Y)'

    }
};

const answerMap = {
    clubs: {
    },
    diamonds: {
    },
    hearts: {},
    spades: {}
};

function getCardText(suit, rank) {
    return (cardTextMap[suit] && cardTextMap[suit][rank]) || cardTextFallback;
}

// Initialize
async function init() {
    await setupSupabase();
    if (supabaseAvailable) {
        await setupAuth();
    } else {
        updateAuthUI();
    }
    await loadProgress();
    createCarousel();
    updateStats();
    await loadLeaderboard();
    setupEventListeners();
}

async function setupSupabase() {
    try {
        const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        supabase = mod.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        supabaseAvailable = true;
    } catch (_err) {
        supabase = null;
        supabaseAvailable = false;
    }
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
    if (!supabaseAvailable) return;
    const { data } = await supabase.auth.getSession();
    currentUser = data.session ? data.session.user : null;
    updateAuthUI();
    await ensureProfile();

    supabase.auth.onAuthStateChange(async (_event, session) => {
        currentUser = session ? session.user : null;
        currentUsername = null;
        updateAuthUI();
        await ensureProfile();
        await loadProgress();
        refreshSolvedUI();
        await loadLeaderboard();
    });
}

function updateAuthUI() {
    if (!supabaseAvailable) {
        authStatus.textContent = 'Offline mode';
        authIndicator.classList.remove('signed-in');
        authIndicator.querySelector('.text').textContent = 'Offline';
        authEmail.disabled = true;
        authPassword.disabled = true;
        authSignUp.disabled = true;
        authSignIn.disabled = true;
        authSignOut.disabled = true;
        return;
    }

    if (currentUser) {
        authStatus.textContent = `Signed in: ${currentUser.email || 'user'}`;
        authIndicator.classList.add('signed-in');
        authIndicator.querySelector('.text').textContent = currentUsername || 'Signed in';
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
    if (!currentUser || !supabaseAvailable) return;

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
        currentUsername = data.username;
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

    currentUsername = username;
    authIndicator.querySelector('.text').textContent = username;
}

async function generateUniqueUsername() {
    if (!supabaseAvailable) return 'offline-user';
    const colors = ['amber', 'azure', 'blue', 'coral', 'cyan', 'gold', 'indigo', 'mint', 'pink', 'purple', 'rose', 'teal'];
    const animals = ['otter', 'swan', 'fox', 'raven', 'lynx', 'wolf', 'tiger', 'panda', 'koala', 'orca', 'heron', 'eagle', 'gecko'];
    const base = `${colors[Math.floor(Math.random() * colors.length)]}-${animals[Math.floor(Math.random() * animals.length)]}`;
    const suffix = Math.floor(Math.random() * 100000);
    const candidate = `${base}-${suffix}`;
    const { data } = await supabase.from('profiles').select('username').eq('username', candidate).maybeSingle();
    if (!data) return candidate;
    return `${base}-${Math.floor(Math.random() * 10000)}`;
}

async function loadLeaderboard() {
    if (!leaderboardList || !supabaseAvailable) return;
    const { data, error } = await supabase
        .from('leaderboard')
        .select('username, solved_count')
        .order('solved_count', { ascending: false })
        .order('username', { ascending: true })
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
    if (!supabaseAvailable) {
        authStatus.textContent = 'Offline mode';
        return;
    }
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
    if (!supabaseAvailable) {
        authStatus.textContent = 'Offline mode';
        return;
    }
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
    if (!supabaseAvailable) return;
    await supabase.auth.signOut();
}

async function loadProgressFromSupabase() {
    if (!supabaseAvailable) return;
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
    if (!currentUser || !supabaseAvailable) return;
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
