let cards = [];
let currentIndex = 0;
let order = [];

const STORAGE_KEY = 'civil_flash_flashcards';

function loadProgress() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        return data;
    } catch { return {}; }
}

function saveProgress(index) {
    const data = loadProgress();
    data[index] = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function resetProgress() {
    if (confirm('Reiniciar progresso dos flashcards?')) {
        localStorage.removeItem(STORAGE_KEY);
        updateProgress();
    }
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function shuffleCards() {
    order = shuffleArray([...Array(cards.length).keys()]);
    currentIndex = 0;
    showCard();
}

function revealCard() {
    const card = document.getElementById('flashcard');
    if (card.classList.contains('revealed')) {
        card.classList.remove('revealed');
    } else {
        card.classList.add('revealed');
        saveProgress(order[currentIndex]);
        updateProgress();
    }
}

function nextCard() {
    if (currentIndex < order.length - 1) {
        currentIndex++;
        showCard();
    }
}

function prevCard() {
    if (currentIndex > 0) {
        currentIndex--;
        showCard();
    }
}

function showCard() {
    const idx = order[currentIndex];
    const card = cards[idx];
    if (!card) return;

    document.getElementById('flashcard').classList.remove('revealed');
    document.getElementById('questionText').textContent = card.pergunta;
    document.getElementById('answerText').textContent = card.resposta;
    document.getElementById('cardTema').textContent = card.tema || '';
    document.getElementById('cardTemaBack').textContent = card.tema || '';
    document.getElementById('cardCounter').textContent = `${currentIndex + 1} / ${order.length}`;
    updateProgress();
}

function updateProgress() {
    const data = loadProgress();
    const studied = order.filter(i => data[i]).length;
    const pct = order.length > 0 ? (studied / order.length) * 100 : 0;
    document.getElementById('progressFill').style.width = pct + '%';
}

fetch('/api/flashcards')
    .then(r => r.json())
    .then(data => {
        cards = data;
        order = [...Array(cards.length).keys()];
        if (cards.length > 0) showCard();
    });
