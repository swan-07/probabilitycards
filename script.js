// Card data structure - PLACEHOLDER problems
const cardData = {
    'hearts': {
        'A': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '2': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '3': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '4': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '5': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '6': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '7': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '8': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '9': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '10': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        'J': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        'Q': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        'K': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' }
    },
    'diamonds': {
        'A': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '2': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '3': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '4': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '5': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '6': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '7': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '8': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '9': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '10': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        'J': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        'Q': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        'K': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' }
    },
    'clubs': {
        'A': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '2': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '3': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '4': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '5': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '6': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '7': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '8': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '9': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '10': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        'J': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        'Q': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        'K': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' }
    },
    'spades': {
        'A': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '2': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '3': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '4': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '5': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '6': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '7': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '8': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '9': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        '10': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        'J': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        'Q': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' },
        'K': { problem: 'PLACEHOLDER PROBLEM', answer: 'PLACEHOLDER' }
    }
};

// Suit symbols
const suitSymbols = {
    'hearts': '♥',
    'diamonds': '♦',
    'clubs': '♣',
    'spades': '♠'
};

// State
let isSpread = false;
let solvedCards = new Set();
let currentCard = null;

// DOM elements
const deck = document.getElementById('deck');
const deckHint = document.getElementById('deck-hint');
const conventions = document.getElementById('conventions');
const problemDisplay = document.getElementById('problem-display');
const cardBadge = document.getElementById('card-badge');
const problemText = document.getElementById('problem-text');
const solutionInput = document.getElementById('solution-input');
const submitBtn = document.getElementById('submit-btn');
const feedback = document.getElementById('feedback');
const backBtn = document.getElementById('back-btn');

// Initialize
function init() {
    loadSolvedCards();
    createCards();
    updateProgress();
    setupEventListeners();
}

// Load solved cards from localStorage
function loadSolvedCards() {
    const saved = localStorage.getItem('solvedCards');
    if (saved) {
        solvedCards = new Set(JSON.parse(saved));
    }
}

// Save solved cards to localStorage
function saveSolvedCards() {
    localStorage.setItem('solvedCards', JSON.stringify([...solvedCards]));
}

// Create all cards
function createCards() {
    const suits = ['clubs', 'diamonds', 'hearts', 'spades'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    let cardIndex = 0;
    suits.forEach(suit => {
        ranks.forEach(rank => {
            const card = createCard(suit, rank, cardIndex);
            deck.appendChild(card);
            cardIndex++;
        });
    });

    // Start with stacked deck
    deck.classList.add('stacked');
}

// Create a single card element
function createCard(suit, rank, index) {
    const card = document.createElement('div');
    card.className = `card ${suit}`;
    card.dataset.suit = suit;
    card.dataset.rank = rank;
    card.style.zIndex = index;

    const cardId = `${suit}-${rank}`;
    if (solvedCards.has(cardId)) {
        card.classList.add('solved');
    }

    card.innerHTML = `
        <div class="card-rank">${rank}</div>
        <div class="card-suit">${suitSymbols[suit]}</div>
    `;

    card.addEventListener('click', (e) => {
        e.stopPropagation();
        handleCardClick(suit, rank);
    });

    return card;
}

// Handle card click
function handleCardClick(suit, rank) {
    if (!isSpread) {
        toggleDeck();
    } else {
        openProblem(suit, rank);
    }
}

// Toggle between stacked deck and spread cards
function toggleDeck() {
    isSpread = !isSpread;

    if (isSpread) {
        deck.classList.remove('stacked');
        deck.classList.add('spread');
        deckHint.classList.add('hidden');

        // Stagger the card animations
        const cards = deck.querySelectorAll('.card');
        cards.forEach((card, index) => {
            card.style.transitionDelay = `${index * 0.01}s`;
        });

        // Reset transition delays after animation
        setTimeout(() => {
            cards.forEach(card => {
                card.style.transitionDelay = '0s';
            });
        }, 1000);
    } else {
        deck.classList.add('stacked');
        deck.classList.remove('spread');
        deckHint.classList.remove('hidden');

        // Reverse stagger for collapsing
        const cards = deck.querySelectorAll('.card');
        cards.forEach((card, index) => {
            card.style.transitionDelay = `${(cards.length - index) * 0.005}s`;
        });

        setTimeout(() => {
            cards.forEach(card => {
                card.style.transitionDelay = '0s';
            });
        }, 800);
    }
}

// Open problem in main content area
function openProblem(suit, rank) {
    currentCard = { suit, rank };
    const data = cardData[suit][rank];

    // Update card badge
    cardBadge.innerHTML = `${rank}${suitSymbols[suit]}`;
    if (suit === 'hearts' || suit === 'diamonds') {
        cardBadge.style.color = '#E03C31';
    } else {
        cardBadge.style.color = '#ddd';
    }

    // Update problem text
    problemText.textContent = data.problem;

    // Reset input and feedback
    solutionInput.value = '';
    feedback.textContent = '';
    feedback.className = 'feedback';

    // Check if already solved
    const cardId = `${suit}-${rank}`;
    if (solvedCards.has(cardId)) {
        feedback.textContent = '✓ ALREADY SOLVED!';
        feedback.className = 'feedback correct';
    }

    // Show problem display, hide conventions
    conventions.style.display = 'none';
    problemDisplay.style.display = 'block';

    // Focus input
    setTimeout(() => solutionInput.focus(), 100);
}

// Go back to conventions
function backToConventions() {
    currentCard = null;
    conventions.style.display = 'block';
    problemDisplay.style.display = 'none';
}

// Check solution
function checkSolution() {
    if (!currentCard) return;

    const { suit, rank } = currentCard;
    const userAnswer = solutionInput.value.trim().toLowerCase();
    const correctAnswer = cardData[suit][rank].answer.toLowerCase();

    // For placeholder, accept "placeholder" as correct
    if (userAnswer === correctAnswer || correctAnswer === 'placeholder') {
        feedback.textContent = '✓ CORRECT!';
        feedback.className = 'feedback correct';

        const cardId = `${suit}-${rank}`;
        if (!solvedCards.has(cardId)) {
            solvedCards.add(cardId);
            saveSolvedCards();

            // Update the card visual
            const cardElement = document.querySelector(`[data-suit="${suit}"][data-rank="${rank}"]`);
            if (cardElement) {
                setTimeout(() => {
                    cardElement.classList.add('solved');
                }, 300);
            }

            updateProgress();
        }
    } else {
        feedback.textContent = '✗ TRY AGAIN!';
        feedback.className = 'feedback incorrect';

        // Shake the input
        solutionInput.style.animation = 'none';
        setTimeout(() => {
            solutionInput.style.animation = 'shake 0.5s ease';
        }, 10);
    }
}

// Update progress display
function updateProgress() {
    const totalSolved = solvedCards.size;
    document.getElementById('solved-count').textContent = totalSolved;

    const suits = ['clubs', 'diamonds', 'hearts', 'spades'];
    suits.forEach(suit => {
        const suitSolved = [...solvedCards].filter(id => id.startsWith(suit)).length;
        document.getElementById(`${suit}-count`).textContent = `${suitSolved}/13`;
    });
}

// Setup event listeners
function setupEventListeners() {
    // Back button
    backBtn.addEventListener('click', backToConventions);

    // Submit button
    submitBtn.addEventListener('click', checkSolution);

    // Enter key to submit
    solutionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkSolution();
        }
    });

    // ESC to go back to conventions
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && problemDisplay.style.display === 'block') {
            backToConventions();
        }
    });

    // Click outside deck to collapse (when spread)
    document.addEventListener('click', (e) => {
        if (isSpread &&
            !deck.contains(e.target) &&
            problemDisplay.style.display === 'none') {
            toggleDeck();
        }
    });

    // Prevent deck clicks from propagating
    deck.addEventListener('click', (e) => {
        if (e.target === deck && !isSpread) {
            toggleDeck();
        }
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
