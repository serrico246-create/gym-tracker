const WORKOUT_PLAN = {
  day1: {
    title: "Giorno 1 · Petto & Dorso",
    exercises: [
      { id: "d1_e1", name: "Spinte Manubri Panca Piana", sets: 4, reps: "8-10", rest: 120, superset: false },
      { id: "d1_e2", name: "Lat Machine Presa Prona", sets: 4, reps: "10", rest: 90, superset: false },
      { id: "d1_e3", name: "Panca Inclinata Manubri", sets: 3, reps: "10-12", rest: 90, superset: false },
      { id: "d1_e4", name: "Pulley Basso + Croci ai Cavi", sets: 3, reps: "10+12", rest: 90, superset: true }
    ]
  },
  day2: {
    title: "Giorno 2 · Spalle & Braccia",
    exercises: [
      { id: "d2_e1", name: "Lento Avanti Manubri", sets: 4, reps: "8-10", rest: 120, superset: false },
      { id: "d2_e2", name: "Alzate Laterali ai Cavi", sets: 4, reps: "12-15", rest: 60, superset: false },
      { id: "d2_e3", name: "Curl Manubri Panca 60° + Pushdown", sets: 4, reps: "10+12", rest: 75, superset: true },
      { id: "d2_e4", name: "Hammer Curl + French Press Cavo", sets: 3, reps: "12+12", rest: 75, superset: true }
    ]
  },
  day3: {
    title: "Giorno 3 · Gambe & Core",
    exercises: [
      { id: "d3_e1", name: "Leg Press 45°", sets: 4, reps: "10", rest: 120, superset: false },
      { id: "d3_e2", name: "Stacco Rumeno Manubri", sets: 4, reps: "10-12", rest: 90, superset: false },
      { id: "d3_e3", name: "Leg Extension + Leg Curl", sets: 3, reps: "12+12", rest: 75, superset: true },
      { id: "d3_e4", name: "Calf Press + Crunch al Cavo", sets: 4, reps: "15+15", rest: 60, superset: true }
    ]
  },
  day4: {
    title: "Giorno 4 · Richiamo Upper & Core",
    exercises: [
      { id: "d4_e1", name: "Chest Press Convergente", sets: 3, reps: "10-12", rest: 90, superset: false },
      { id: "d4_e2", name: "Rematore con Manubrio", sets: 3, reps: "10", rest: 90, superset: false },
      { id: "d4_e3", name: "Face Pull + Alzate Laterali", sets: 3, reps: "15+12", rest: 60, superset: true },
      { id: "d4_e4", name: "Plank + Leg Raise", sets: 3, reps: "Max", rest: 60, superset: true }
    ]
  }
};

let currentDay = localStorage.getItem('active_day') || 'day1';
let savedData = JSON.parse(localStorage.getItem('gym_pro_data')) || {};
let timerInterval = null;
let remainingSeconds = 0;

const dayTitleEl = document.getElementById('day-title');
const exercisesListEl = document.getElementById('exercises-list');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabIndicator = document.getElementById('tab-indicator');
const timerBar = document.getElementById('rest-timer');
const timerDisplay = document.getElementById('timer-display');

function saveState() {
  localStorage.setItem('gym_pro_data', JSON.stringify(savedData));
}

function renderDay(dayKey) {
  currentDay = dayKey;
  localStorage.setItem('active_day', dayKey);
  const dayData = WORKOUT_PLAN[dayKey];
  dayTitleEl.textContent = dayData.title;
  exercisesListEl.innerHTML = '';

  dayData.exercises.forEach((ex, idx) => {
    const card = document.createElement('div');
    card.className = `exercise-card ${ex.superset ? 'superset-card' : ''}`;
    card.style.animationDelay = `${idx * 0.06}s`;

    let setsHTML = '';
    for (let s = 1; s <= ex.sets; s++) {
      const key = `${ex.id}_s${s}`;
      const entry = savedData[key] || { weight: '', reps: '', done: false };

      setsHTML += `
        <div class="set-row ${entry.done ? 'done' : ''}" data-key="${key}" data-rest="${ex.rest}">
          <span class="set-num">#${s}</span>
          <div class="input-box">
            <input type="number" step="0.5" placeholder="0" value="${entry.weight}" data-field="weight">
            <span>kg</span>
          </div>
          <div class="input-box">
            <input type="number" placeholder="${ex.reps.split('+')[0]}" value="${entry.reps}" data-field="reps">
            <span>rep</span>
          </div>
          <button class="check-btn" aria-label="Completa serie">✓</button>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="card-header">
        <div>
          <div class="exercise-title">${ex.name}</div>
          <div class="exercise-meta">
            <span class="badge target">${ex.sets} × ${ex.reps}</span>
            <span class="badge">Rec ${ex.rest}s</span>
            ${ex.superset ? '<span class="badge superset">⚡ Superserie</span>' : ''}
          </div>
        </div>
      </div>
      <div class="sets-list">${setsHTML}</div>
    `;

    exercisesListEl.appendChild(card);
  });

  attachRowListeners();
}

function attachRowListeners() {
  document.querySelectorAll('.set-row').forEach(row => {
    const key = row.dataset.key;
    const restTime = parseInt(row.dataset.rest, 10);

    row.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => {
        if (!savedData[key]) savedData[key] = { weight: '', reps: '', done: false };
        savedData[key][input.dataset.field] = input.value;
        saveState();
      });
    });

    const checkBtn = row.querySelector('.check-btn');
    checkBtn.addEventListener('click', () => {
      if (!savedData[key]) savedData[key] = { weight: '', reps: '', done: false };
      savedData[key].done = !savedData[key].done;
      row.classList.toggle('done', savedData[key].done);
      saveState();

      if (savedData[key].done) {
        startRestTimer(restTime);
      }
    });
  });
}

function startRestTimer(seconds) {
  clearInterval(timerInterval);
  remainingSeconds = seconds;
  updateTimerUI();
  timerBar.classList.remove('hidden');

  timerInterval = setInterval(() => {
    remainingSeconds--;
    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      timerBar.classList.add('hidden');
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    } else {
      updateTimerUI();
    }
  }, 1000);
}

function updateTimerUI() {
  const m = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const s = String(remainingSeconds % 60).padStart(2, '0');
  timerDisplay.textContent = `${m}:${s}`;
}

document.getElementById('timer-add').addEventListener('click', () => {
  remainingSeconds += 15;
  updateTimerUI();
});

document.getElementById('timer-skip').addEventListener('click', () => {
  clearInterval(timerInterval);
  timerBar.classList.add('hidden');
});

document.getElementById('reset-day').addEventListener('click', () => {
  const dayData = WORKOUT_PLAN[currentDay];
  dayData.exercises.forEach(ex => {
    for (let s = 1; s <= ex.sets; s++) {
      const key = `${ex.id}_s${s}`;
      if (savedData[key]) savedData[key].done = false;
    }
  });
  saveState();
  renderDay(currentDay);
});

tabBtns.forEach((btn, index) => {
  if (btn.dataset.day === currentDay) {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    tabIndicator.style.transform = `translateX(${index * 100}%)`;
  }

  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    tabIndicator.style.transform = `translateX(${index * 100}%)`;
    renderDay(btn.dataset.day);
  });
});

renderDay(currentDay);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}