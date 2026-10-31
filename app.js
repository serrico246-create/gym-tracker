const WORKOUT_PLAN = {
  day1: {
    title: "Giorno 1 · Petto & Dorso",
    exercises: [
      { id: "d1_e1", name: "Spinte Manubri Panca Piana", sets: 4, reps: "8-10", rest: 120 },
      { id: "d1_e2", name: "Lat Machine Presa Prona", sets: 4, reps: "10", rest: 90 },
      { id: "d1_e3", name: "Panca Inclinata Manubri", sets: 3, reps: "10-12", rest: 90 },
      { id: "d1_e4", name: "Pulley Basso", sets: 3, reps: "10+12", rest: 90 }
    ]
  },
  day2: {
    title: "Giorno 2 · Spalle & Braccia",
    exercises: [
      { id: "d2_e1", name: "Lento Avanti Manubri", sets: 4, reps: "8-10", rest: 120 },
      { id: "d2_e2", name: "Alzate Laterali ai Cavi", sets: 4, reps: "12-15", rest: 60 },
      { id: "d2_e3", name: "Curl Manubri Panca 60°", sets: 4, reps: "10", rest: 75 },
      { id: "d2_e4", name: "Pushdown Tricipiti", sets: 3, reps: "12", rest: 75 }
    ]
  },
  day3: {
    title: "Giorno 3 · Gambe & Core",
    exercises: [
      { id: "d3_e1", name: "Leg Press 45°", sets: 4, reps: "10", rest: 120 },
      { id: "d3_e2", name: "Stacco Rumeno Manubri", sets: 4, reps: "10-12", rest: 90 },
      { id: "d3_e3", name: "Leg Extension", sets: 3, reps: "12", rest: 75 },
      { id: "d3_e4", name: "Calf Press", sets: 4, reps: "15", rest: 60 }
    ]
  },
  day4: {
    title: "Giorno 4 · Richiamo Upper & Core",
    exercises: [
      { id: "d4_e1", name: "Chest Press Convergente", sets: 3, reps: "10-12", rest: 90 },
      { id: "d4_e2", name: "Rematore con Manubrio", sets: 3, reps: "10", rest: 90 },
      { id: "d4_e3", name: "Face Pull", sets: 3, reps: "15", rest: 60 },
      { id: "d4_e4", name: "Plank", sets: 3, reps: "Max", rest: 60 }
    ]
  }
};

let currentDay = localStorage.getItem('active_day') || 'day1';
let workoutHistory = JSON.parse(localStorage.getItem('gym_workout_history')) || {}; 
let weekStatus = JSON.parse(localStorage.getItem('gym_week_status')) || {};
let timerInterval = null;
let remainingSeconds = 0;

// Gestione cronometro allenamento
let workoutStartTime = null;
let workoutTimerInterval = null;

let currentDate = new Date();

const dayTitleEl = document.getElementById('day-title');
const exercisesListEl = document.getElementById('exercises-list');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabIndicator = document.getElementById('tab-indicator');
const timerBar = document.getElementById('rest-timer');
const timerDisplay = document.getElementById('timer-display');
const progressFill = document.getElementById('progress-fill');
const weekDays = document.querySelectorAll('.week-day');

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getSavedDataForToday() {
  const todayKey = getTodayKey();
  if (!workoutHistory[todayKey]) {
    workoutHistory[todayKey] = { dayType: currentDay, sets: {}, durationSeconds: 0 };
  }
  return workoutHistory[todayKey].sets;
}

function saveState() {
  localStorage.setItem('gym_workout_history', JSON.stringify(workoutHistory));
  localStorage.setItem('gym_week_status', JSON.stringify(weekStatus));
}

function getTodayIndex() {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}

function updateWeekUI() {
  weekDays.forEach((el, index) => {
    el.classList.remove('active-orange', 'active-green');
    const status = weekStatus[index];
    if (status === 'orange') el.classList.add('active-orange');
    if (status === 'green') el.classList.add('active-green');
  });
}

function checkDayCompletion() {
  const dayData = WORKOUT_PLAN[currentDay];
  const currentSavedSets = getSavedDataForToday();
  let totalSets = 0;
  let completedSets = 0;

  dayData.exercises.forEach(ex => {
    for (let s = 1; s <= ex.sets; s++) {
      totalSets++;
      const key = `${ex.id}_s${s}`;
      if (currentSavedSets[key] && currentSavedSets[key].done) {
        completedSets++;
      }
    }
  });

  const percent = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
  progressFill.style.width = `${percent}%`;

  const todayIdx = getTodayIndex();
  if (totalSets > 0 && completedSets === totalSets) {
    weekStatus[todayIdx] = 'green';
    // Se completato, ferma il conteggio del tempo e salva la durata
    if (workoutStartTime) {
      const elapsedSec = Math.floor((Date.now() - workoutStartTime) / 1000);
      workoutHistory[getTodayKey()].durationSeconds = elapsedSec;
      saveState();
    }
  } else if (weekStatus[todayIdx] === 'green' && completedSets < totalSets) {
    weekStatus[todayIdx] = 'orange';
  }
  saveState();
  updateWeekUI();
}

function renderDay(dayKey) {
  currentDay = dayKey;
  localStorage.setItem('active_day', dayKey);
  const dayData = WORKOUT_PLAN[dayKey];
  dayTitleEl.textContent = dayData.title;
  exercisesListEl.innerHTML = '';

  const todayKey = getTodayKey();
  if (!workoutHistory[todayKey]) {
    workoutHistory[todayKey] = { dayType: dayKey, sets: {}, durationSeconds: 0 };
  } else {
    workoutHistory[todayKey].dayType = dayKey;
  }
  const currentSavedSets = workoutHistory[todayKey].sets;

  dayData.exercises.forEach((ex, idx) => {
    const card = document.createElement('div');
    card.className = `exercise-card`;
    card.style.animationDelay = `${idx * 0.05}s`;

    let setsHTML = '';
    for (let s = 1; s <= ex.sets; s++) {
      const key = `${ex.id}_s${s}`;
      const entry = currentSavedSets[key] || { weight: '', reps: '', done: false };

      setsHTML += `
        <div class="set-row ${entry.done ? 'done' : ''}" data-key="${key}" data-rest="${ex.rest}">
          <span class="set-num">#${s}</span>
          <div class="input-box">
            <input type="number" step="0.5" placeholder="0" value="${entry.weight}" data-field="weight">
            <span>kg</span>
          </div>
          <div class="input-box">
            <input type="number" placeholder="${ex.reps}" value="${entry.reps}" data-field="reps">
            <span>rep</span>
          </div>
          <button class="check-btn" aria-label="Completa serie">✓</button>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="card-header">
        <div class="exercise-title">${ex.name}</div>
        <div class="exercise-meta">
          <span class="badge target">${ex.sets} × ${ex.reps}</span>
          <span class="badge">Rec ${ex.rest}s</span>
        </div>
      </div>
      <div class="sets-list">${setsHTML}</div>
    `;

    exercisesListEl.appendChild(card);
  });

  attachRowListeners();
  checkDayCompletion();
}

function attachRowListeners() {
  document.querySelectorAll('.set-row').forEach(row => {
    const key = row.dataset.key;
    const restTime = parseInt(row.dataset.rest, 10);
    const currentSavedSets = getSavedDataForToday();

    row.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => {
        if (!currentSavedSets[key]) currentSavedSets[key] = { weight: '', reps: '', done: false };
        currentSavedSets[key][input.dataset.field] = input.value;
        saveState();
      });
    });

    const checkBtn = row.querySelector('.check-btn');
    checkBtn.addEventListener('click', () => {
      if (!currentSavedSets[key]) currentSavedSets[key] = { weight: '', reps: '', done: false };
      currentSavedSets[key].done = !currentSavedSets[key].done;
      row.classList.toggle('done', currentSavedSets[key].done);
      saveState();
      checkDayCompletion();

      if (currentSavedSets[key].done) {
        startRestTimer(restTime);
        if (navigator.vibrate) navigator.vibrate(50);
      }
    });
  });
}

// Navigazione viste
document.querySelectorAll('.nav-view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const view = btn.dataset.view;
    document.getElementById('view-workout').classList.toggle('hidden', view !== 'workout');
    document.getElementById('view-calendar').classList.toggle('hidden', view !== 'calendar');

    if (view === 'calendar') {
      renderCalendar();
    }
  });
});

// Griglia Calendario Mensile
function renderCalendar() {
  const grid = document.getElementById('calendar-grid');
  const monthTitle = document.getElementById('calendar-month-title');
  grid.innerHTML = '';

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const options = { month: 'long', year: 'numeric' };
  monthTitle.textContent = currentDate.toLocaleDateString('it-IT', options);

  const firstDayIndex = new Date(year, month, 1).getDay();
  const startDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const totalDays = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    grid.appendChild(empty);
  }

  for (let day = 1; day <= totalDays; day++) {
    const dayCell = document.createElement('div');
    dayCell.className = 'cal-day';
    dayCell.textContent = day;

    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateKey = `${year}-${formattedMonth}-${formattedDay}`;

    const dayRecord = workoutHistory[dateKey];
    let isCompleted = false;
    if (dayRecord && dayRecord.sets) {
      const setsArr = Object.values(dayRecord.sets);
      if (setsArr.length > 0 && setsArr.every(s => s.done)) {
        isCompleted = true;
      }
    }

    if (isCompleted) {
      dayCell.classList.add('completed');
    }

    const dNow = new Date();
    if (year === dNow.getFullYear() && month === dNow.getMonth() && day === dNow.getDate()) {
      dayCell.classList.add('today');
    }

    dayCell.addEventListener('click', () => {
      showDayDetail(dateKey);
    });

    grid.appendChild(dayCell);
  }
}

// Mostra il riepilogo interattivo dettagliato del giorno selezionato
function showDayDetail(dateKey) {
  const detailContainer = document.getElementById('calendar-detail');
  const record = workoutHistory[dateKey];

  if (!record || !record.sets || Object.keys(record.sets).length === 0) {
    detailContainer.innerHTML = `
      <h3>Data: ${dateKey}</h3>
      <p class="cal-placeholder">Nessun allenamento registrato in questa data.</p>
    `;
    return;
  }

  const planName = WORKOUT_PLAN[record.dayType] ? WORKOUT_PLAN[record.dayType].title : "Allenamento";
  
  // Calcola la durata formattata
  let durationText = "Durata non registrata";
  if (record.durationSeconds && record.durationSeconds > 0) {
    const mins = Math.floor(record.durationSeconds / 60);
    durationText = `⏱️ ${mins} minuti`;
  }

  let html = `
    <div class="cal-workout-header">
      <h3>${dateKey}</h3>
      <span class="cal-duration-badge">${durationText}</span>
    </div>
    <div style="font-size: 13px; font-weight:700; color:var(--text-main); margin-bottom: 12px;">${planName}</div>
    <div style="display:flex; flex-direction:column; gap:12px; max-height: 250px; overflow-y: auto;">
  `;

  // Raggruppa le serie per esercizio
  const exerciseData = {};
  for (const [key, val] of Object.entries(record.sets)) {
    if (!val.weight && !val.reps) continue;
    const exId = key.split('_s')[0];
    const setNum = key.split('_s')[1];

    if (!exerciseData[exId]) {
      let exName = exId;
      for (const dKey in WORKOUT_PLAN) {
        const found = WORKOUT_PLAN[dKey].exercises.find(e => e.id === exId);
        if (found) { exName = found.name; break; }
      }
      exerciseData[exId] = { name: exName, sets: [] };
    }
    exerciseData[exId].sets.push({ num: setNum, weight: val.weight || 0, reps: val.reps || 0 });
  }

  for (const exId in exerciseData) {
    const item = exerciseData[exId];
    html += `
      <div class="history-exercise-group">
        <div class="history-exercise-name">${item.name}</div>
        <div class="history-sets-grid">
    `;
    item.sets.forEach(s => {
      html += `<div class="history-set-chip">#${s.num}: <strong>${s.weight} kg</strong> × ${s.reps} rep</div>`;
    });
    html += `</div></div>`;
  }

  html += `</div>`;
  detailContainer.innerHTML = html;
}

document.getElementById('prev-month').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

document.getElementById('next-month').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

// Azione tasto Inizia: avvia il cronometro e colora di arancione
document.getElementById('start-workout').addEventListener('click', () => {
  const todayIdx = getTodayIndex();
  weekStatus[todayIdx] = 'orange';
  
  // Inizia a contare il tempo
  workoutStartTime = Date.now();
  
  saveState();
  updateWeekUI();

  const startBtn = document.getElementById('start-workout');
  startBtn.classList.add('fade-out');

  if (navigator.vibrate) navigator.vibrate([40, 40, 40]);
});

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
  const currentSavedSets = getSavedDataForToday();
  Object.keys(currentSavedSets).forEach(k => currentSavedSets[k].done = false);
  workoutStartTime = Date.now(); // Reset timer durata
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

// Inizializzazione
renderDay(currentDay);
updateWeekUI();
