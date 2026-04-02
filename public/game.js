'use strict';

// --- State ---
const state = {
  digits: 1,
  count: 5,
  speed: 1000,
  numbers: [],
  correctAnswer: 0,
  score: { correct: 0, total: 0, streak: 0, bestStreak: 0 },
};

// --- DOM refs ---
const screens = {
  config:    document.getElementById('screen-config'),
  countdown: document.getElementById('screen-countdown'),
  game:      document.getElementById('screen-game'),
  answer:    document.getElementById('screen-answer'),
  result:    document.getElementById('screen-result'),
};

const digitsGroup   = document.getElementById('digits-group');
const countGroup    = document.getElementById('count-group');
const speedGroup    = document.getElementById('speed-group');
const startBtn      = document.getElementById('start-btn');
const countdownNum  = document.getElementById('countdown-number');
const flashNum      = document.getElementById('flash-number');
const progressBar   = document.getElementById('progress-bar');
const answerInput   = document.getElementById('answer-input');
const submitBtn     = document.getElementById('submit-btn');
const retryBtn      = document.getElementById('retry-btn');
const configBtn     = document.getElementById('config-btn');
const resultIcon    = document.getElementById('result-icon');
const resultMessage = document.getElementById('result-message');
const resultDetail  = document.getElementById('result-detail');
const scoreDisplay  = document.getElementById('score-display');

// --- Helpers ---
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

function randInt(digits) {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function setupOptionGroup(groupEl, stateKey) {
  groupEl.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      groupEl.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state[stateKey] = Number(btn.dataset.value);
    });
    if (btn.classList.contains('active')) {
      state[stateKey] = Number(btn.dataset.value);
    }
  });
}

// --- Setup option groups ---
setupOptionGroup(digitsGroup, 'digits');
setupOptionGroup(countGroup, 'count');
setupOptionGroup(speedGroup, 'speed');

// --- Countdown then game ---
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runCountdown() {
  showScreen('countdown');
  for (const n of [3, 2, 1]) {
    countdownNum.textContent = n;
    countdownNum.style.animation = 'none';
    void countdownNum.offsetWidth; // reflow to restart animation
    countdownNum.style.animation = '';
    await sleep(800);
  }
  countdownNum.textContent = 'GO!';
  await sleep(600);
}

async function runGame() {
  showScreen('game');

  // Generate numbers
  state.numbers = Array.from({ length: state.count }, () => randInt(state.digits));
  state.correctAnswer = state.numbers.reduce((a, b) => a + b, 0);

  const total = state.count;
  for (let i = 0; i < total; i++) {
    // Show number
    flashNum.textContent = state.numbers[i];
    flashNum.style.animation = 'none';
    void flashNum.offsetWidth;
    flashNum.style.animation = 'flashIn 0.1s ease';

    // Progress bar
    const startPct = (i / total) * 100;
    const endPct   = ((i + 1) / total) * 100;
    progressBar.style.width = startPct + '%';

    // Animate progress bar smoothly across the display interval
    const startTime = performance.now();
    await new Promise(resolve => {
      function tick(now) {
        const elapsed = now - startTime;
        const pct = startPct + (endPct - startPct) * Math.min(elapsed / state.speed, 1);
        progressBar.style.width = pct + '%';
        if (elapsed < state.speed) requestAnimationFrame(tick);
        else resolve();
      }
      requestAnimationFrame(tick);
    });

    // Brief blank between numbers (except last)
    if (i < total - 1) {
      flashNum.textContent = '';
      await sleep(80);
    }
  }

  flashNum.textContent = '';
  progressBar.style.width = '100%';
}

function showAnswer() {
  showScreen('answer');
  answerInput.value = '';
  answerInput.focus();
}

function checkAnswer() {
  const userAnswer = parseInt(answerInput.value, 10);
  if (isNaN(userAnswer)) {
    answerInput.focus();
    return;
  }

  const correct = userAnswer === state.correctAnswer;

  state.score.total++;
  if (correct) {
    state.score.correct++;
    state.score.streak++;
    if (state.score.streak > state.score.bestStreak) {
      state.score.bestStreak = state.score.streak;
    }
  } else {
    state.score.streak = 0;
  }

  showResult(correct, userAnswer);
}

function showResult(correct, userAnswer) {
  showScreen('result');

  if (correct) {
    resultIcon.textContent = '⭕';
    resultMessage.textContent = '正解！';
    resultMessage.className = 'correct-color';
    resultDetail.textContent = `答え: ${state.correctAnswer}`;
  } else {
    resultIcon.textContent = '✗';
    resultMessage.textContent = '不正解';
    resultMessage.className = 'wrong-color';
    resultDetail.innerHTML =
      `あなたの答え: <strong>${userAnswer}</strong><br>正解: <strong>${state.correctAnswer}</strong>`;
    resultDetail.innerHTML +=
      `<br><small style="color:#6b7280;font-size:0.85rem;margin-top:6px;display:block">` +
      `数列: ${state.numbers.join(' + ')}</small>`;
  }

  const acc = state.score.total > 0
    ? Math.round((state.score.correct / state.score.total) * 100)
    : 0;

  scoreDisplay.innerHTML = `
    <div class="score-label">成績</div>
    <div class="score-numbers">
      正解 <strong>${state.score.correct}</strong> / ${state.score.total} 問
      &nbsp;|&nbsp; 正解率 <strong>${acc}%</strong>
    </div>
    ${state.score.streak >= 2
      ? `<div class="score-streak">🔥 ${state.score.streak} 連続正解！</div>`
      : ''}
  `;
}

// --- Event listeners ---
startBtn.addEventListener('click', async () => {
  await runCountdown();
  await runGame();
  showAnswer();
});

submitBtn.addEventListener('click', checkAnswer);

answerInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') checkAnswer();
});

retryBtn.addEventListener('click', async () => {
  await runCountdown();
  await runGame();
  showAnswer();
});

configBtn.addEventListener('click', () => {
  showScreen('config');
});
